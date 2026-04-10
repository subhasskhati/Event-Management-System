const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const authRoutes = require('../routes/auth');
const eventRoutes = require('../routes/events');
const contactRoutes = require('../routes/contact');
const chatbotRoutes = require('../routes/chatbot');

dotenv.config();

const app = express();
const PORT = 3000;

// connect to mongodb
connectDB();

// middleware
app.use(cors());
app.use(express.json());

// static folder
app.use(express.static(path.join(__dirname, '../public')));

// api routes
app.use('/api', authRoutes);
app.use('/api', eventRoutes);
app.use('/api', contactRoutes);
app.use('/api', chatbotRoutes);

// serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
