const express = require('express');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://127.0.0.1:11434';

function normalizeOllamaModelName(modelName) {
  const name = String(modelName || '').trim();
  if (!name) return '';
  if (name.toLowerCase() === 'llama2') return 'llama2:latest';
  if (/^llama2(:latest|:7b)?$/i.test(name)) return name.toLowerCase();
  return name;
}

const OLLAMA_MODELS = (process.env.OLLAMA_MODELS || 'llama2:latest')
  .split(',')
  .map(normalizeOllamaModelName)
  .filter(Boolean);

console.log('Using Ollama models:', OLLAMA_MODELS.join(', '));

function isRetryableOllamaError(error) {
  const message = String(error.message || error);
  return /503|Service Unavailable|429|Too Many Requests|rate limit|connection refused/i.test(message);
}

async function callOllamaModel(modelName, prompt) {
  const url = `${OLLAMA_HOST}/v1/chat/completions`;
  const body = {
    model: modelName,
    messages: [
      { role: 'system', content: 'You are an efficient AI assistant for EventApp. Answer clearly and keep replies concise.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 180,
    temperature: 0.45,
    top_p: 0.9
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama ${modelName} returned ${res.status}: ${errorText}`);
  }

  return res.json();
}

function parseOllamaResponse(payload) {
  if (!payload) return '';
  if (typeof payload === 'string') return payload;
  if (payload.choices && Array.isArray(payload.choices) && payload.choices[0]?.message?.content) {
    return String(payload.choices[0].message.content);
  }
  if (payload.choices && Array.isArray(payload.choices) && payload.choices[0]?.text) {
    return String(payload.choices[0].text);
  }
  if (payload.output) return Array.isArray(payload.output) ? payload.output.join('') : String(payload.output);
  if (payload.response) return Array.isArray(payload.response) ? payload.response.join('') : String(payload.response);
  if (payload.text) return String(payload.text);
  if (payload.result) {
    if (typeof payload.result === 'string') return payload.result;
    if (Array.isArray(payload.result)) return payload.result.map(part => String(part)).join('');
    if (payload.result.output) return parseOllamaResponse(payload.result.output);
  }
  if (payload.records) return payload.records.map(r => r.text || '').join(' ');
  return JSON.stringify(payload);
}

async function generateChatResponse(prompt) {
  let lastError = null;

  for (const model of OLLAMA_MODELS) {
    try {
      const response = await callOllamaModel(model, prompt);
      const text = parseOllamaResponse(response);
      if (text && text.trim()) return text;
      throw new Error(`Model returned empty response`);
    } catch (error) {
      lastError = error;
      if (!isRetryableOllamaError(error)) throw error;
    }
  }

  throw lastError || new Error('No Ollama model could generate a response.');
}

const getDatabaseStats = async () => {
  const userCount = await User.countDocuments();
  const eventCount = await Event.countDocuments();
  const bookingCount = await Booking.countDocuments();
  const contactCount = await Contact.countDocuments();
  const events = await Event.find().sort({ date: 1 });
  const bookings = await Booking.find().populate('eventId').populate('userId');
  const users = await User.find().select('-password');
  const contacts = await Contact.find();

  return { userCount, eventCount, bookingCount, contactCount, events, bookings, users, contacts };
};

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message is required' });

    const stats = await getDatabaseStats();
    const historyText = conversationHistory.map(item => `${item.role}: ${item.content}`).join('\n');

    const systemPrompt = `You are an AI assistant for EventApp. Use available system data to answer questions clearly.`;
    const prompt = `SYSTEM:\n${systemPrompt}\n\nDATA:\n- users=${stats.userCount}\n- events=${stats.eventCount}\n- bookings=${stats.bookingCount}\n- contacts=${stats.contactCount}\n\nRECENT EVENTS:\n${stats.events.slice(0, 3).map(e => `- ${e.title} (${e.date}) at ${e.location}`).join('\n')}\n\nCONVERSATION:\n${historyText}\nuser: ${message}\nassistant:`;

    const responseText = await generateChatResponse(prompt);
    return res.json({ response: responseText, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('chatbot error:', error);
    return res.status(500).json({ error: error.message || 'Chat request failed' });
  }
});

router.get('/audit', authMiddleware, async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentBookings = stats.bookings.filter(b => new Date(b.bookingDate) > thirtyDaysAgo);
    const activeUsers = [...new Set(stats.bookings.map(b => b.userId?.toString()).filter(Boolean))];
    const eventPopularity = stats.events.map(event => ({ title: event.title, bookings: stats.bookings.filter(b => b.eventId && b.eventId._id.toString() === event._id.toString()).length })).sort((a, b) => b.bookings - a.bookings);
    const topEvents = eventPopularity.slice(0, 3);
    const upcomingEvents = stats.events.filter(e => new Date(e.date) > now).length;

    return res.json({
      summary: {
        totalUsers: stats.userCount,
        totalEvents: stats.eventCount,
        totalBookings: stats.bookingCount,
        totalContacts: stats.contactCount,
        bookingRate: stats.eventCount ? ((stats.bookingCount / stats.eventCount) * 100).toFixed(1) : '0.0'
      },
      insights: {
        recommendations: [
          activeUsers.length < stats.userCount * 0.4 ? 'Encourage more repeat user bookings to improve engagement.' : 'User engagement is healthy.',
          topEvents[0] ? `Top event: ${topEvents[0].title} with ${topEvents[0].bookings} bookings.` : 'No event bookings yet.',
          upcomingEvents ? `You have ${upcomingEvents} upcoming event${upcomingEvents === 1 ? '' : 's'} scheduled.` : 'Add more upcoming events to keep momentum.'
        ],
        topEvents,
        auditHighlights: [
          `${activeUsers.length} active users in the past 30 days`,
          `${upcomingEvents} upcoming event${upcomingEvents === 1 ? '' : 's'}`,
          `${stats.contactCount} total contact submissions`
        ]
      }
    });
  } catch (error) {
    console.error('audit error:', error);
    res.status(500).json({ error: 'Failed to generate audit' });
  }
});

module.exports = router;
