const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');

const navLinks = document.getElementById('nav-links');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatActions = document.getElementById('chat-actions');
const auditBtn = document.getElementById('audit-btn');
const auditResults = document.getElementById('audit-results');

const chatHistory = [];
const typingIndicatorId = 'typing-indicator';

function updateNavbar() {
  const navigation = [];

  navigation.push('<li><a href="index.html">Home</a></li>');
  navigation.push('<li><a href="events.html">Events</a></li>');
  navigation.push('<li><a href="chatbot.html" class="active">AI Assistant</a></li>');

  if (token && user) {
    navigation.push(`<li><a href="#" onclick="logout()">Logout (${user.name})</a></li>`);
  } else {
    navigation.push('<li><a href="register.html">Register</a></li>');
    navigation.push('<li><a href="login.html">Login</a></li>');
  }

  navLinks.innerHTML = navigation.join('');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('chatHistory');
  window.location.href = 'index.html';
}

function addMessage(text, type = 'bot', options = { persist: true }) {
  if (!text && type !== 'system') return;
  const messageEl = document.createElement('div');
  messageEl.className = `message ${type}`;
  messageEl.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  if (options.persist && (type === 'user' || type === 'bot')) {
    chatHistory.push({ sender: type === 'user' ? 'user' : 'assistant', text });
    saveHistory(chatHistory);
  }
}

function addSystemMessage(text) {
  const messageEl = document.createElement('div');
  messageEl.className = 'message system';
  messageEl.innerHTML = `<p>${text}</p>`;
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator() {
  if (document.getElementById(typingIndicatorId)) return;
  const typingEl = document.createElement('div');
  typingEl.id = typingIndicatorId;
  typingEl.className = 'message bot typing-indicator';
  typingEl.innerHTML = `
    <div class="typing-dots" aria-hidden="true">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
    <p>AI Assistant is typing...</p>
  `;
  chatMessages.appendChild(typingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
  const indicator = document.getElementById(typingIndicatorId);
  if (indicator) indicator.remove();
}

function setInputState(enabled) {
  chatInput.disabled = !enabled;
  sendBtn.disabled = !enabled;
}

function loadHistory() {
  const saved = localStorage.getItem('chatHistory');
  if (!saved) return;

  try {
    const history = JSON.parse(saved);
    history.slice(-20).forEach(item => {
      const text = item.text ?? item.content ?? '';
      const sender = item.sender ?? item.role ?? 'assistant';
      if (!text) return;
      const type = sender === 'user' ? 'user' : 'bot';
      addMessage(text, type, { persist: false });
      chatHistory.push({ sender: type === 'user' ? 'user' : 'assistant', text });
    });
  } catch (error) {
    console.error('Error loading chat history', error);
    localStorage.removeItem('chatHistory');
  }
}

function saveHistory(history) {
  if (!history.length) return;
  localStorage.setItem('chatHistory', JSON.stringify(history.slice(-20)));
}

async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !token) return;

  addMessage(text, 'user');
  chatInput.value = '';
  setInputState(false);

  showTypingIndicator();
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify({
        message: text,
        conversationHistory: chatHistory.slice(-6).map(item => ({ role: item.sender, content: item.text }))
      })
    });

    const data = await response.json();
    removeTypingIndicator();

    if (!response.ok) {
      addMessage(data.error || 'Unable to process request.', 'bot');
      return;
    }

    addMessage(data.response, 'bot');
  } catch (err) {
    console.error(err);
    removeTypingIndicator();
    addMessage('Failed to send message. Please try again.', 'bot');
  } finally {
    setInputState(true);
  }
}

async function loadAuditReport() {
  if (!token) return;

  auditBtn.textContent = 'Loading...';
  auditBtn.disabled = true;
  auditResults.innerHTML = '';

  try {
    const response = await fetch('/api/audit', {
      headers: { 'x-auth-token': token }
    });

    const data = await response.json();
    if (!response.ok) {
      auditResults.innerHTML = `<p class="form-note">${data.error || 'Unable to load audit report.'}</p>`;
      auditResults.classList.remove('hidden');
      return;
    }

    const topEvents = data.insights.topEvents || [];
    const summaryPoints = [
      `Total users: ${data.summary.totalUsers}`,
      `Total events: ${data.summary.totalEvents}`,
      `Total bookings: ${data.summary.totalBookings}`,
      `Booking rate: ${data.summary.bookingRate}%`
    ];

    auditResults.innerHTML = `
      <div class="audit-card">
        <h3>System Summary</h3>
        <div class="audit-grid">
          <div class="audit-item"><h4>Total Users</h4><p>${data.summary.totalUsers}</p></div>
          <div class="audit-item"><h4>Total Events</h4><p>${data.summary.totalEvents}</p></div>
          <div class="audit-item"><h4>Total Bookings</h4><p>${data.summary.totalBookings}</p></div>
          <div class="audit-item"><h4>Booking Rate</h4><p>${data.summary.bookingRate}%</p></div>
        </div>
      </div>
      <div class="audit-card">
        <h3>Top Insights</h3>
        <ul class="audit-list">
          ${data.insights.recommendations.map(item => `<li>${item}</li>`).join('')}
        </ul>
      </div>
      <div class="audit-card">
        <h3>Event Highlights</h3>
        <p class="audit-copy">Here are your top performing and upcoming events.</p>
        <ul class="audit-list">
          ${topEvents.length ? topEvents.map(ev => `<li><strong>${ev.title}</strong> — ${ev.bookings} bookings</li>`).join('') : '<li>No top event data available yet.</li>'}
        </ul>
      </div>
      <div class="audit-card audit-summary-cards">
        ${summaryPoints.map(point => `<div class="audit-mini-card"><span>${point}</span></div>`).join('')}
      </div>
    `;
    auditResults.classList.remove('hidden');
  } catch (err) {
    console.error(err);
    auditResults.innerHTML = '<p class="form-note">Unable to load audit report.</p>';
    auditResults.classList.remove('hidden');
  } finally {
    auditBtn.disabled = false;
    auditBtn.textContent = 'Generate Report';
  }
}

function addQuickActions() {
  if (!chatActions) return;

  chatActions.innerHTML = `
    <button class="btn quick-action-button" type="button" data-message="Perform a deep audit">Deep Audit</button>
    <button class="btn quick-action-button" type="button" data-message="What are the most popular events?">Popular Events</button>
    <button class="btn quick-action-button" type="button" data-message="Show user engagement statistics">User Stats</button>
    <button class="btn quick-action-button" type="button" data-message="What recommendations do you have for improving the system?">Recommendations</button>
  `;

  chatActions.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
      chatInput.value = button.dataset.message;
      chatInput.focus();
    });
  });
}

function init() {
  updateNavbar();
  loadHistory();

  if (!token) {
    addSystemMessage('Please login to use the AI assistant and audit dashboard.');
    setInputState(false);
    auditBtn.disabled = true;
    return;
  }

  addQuickActions();
  chatInput.focus();

  sendBtn.addEventListener('click', sendChatMessage);
  chatInput.addEventListener('keypress', event => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendChatMessage();
    }
  });

  auditBtn.addEventListener('click', loadAuditReport);
}

window.logout = logout;
window.addEventListener('DOMContentLoaded', init);
