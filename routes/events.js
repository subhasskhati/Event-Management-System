const express = require('express');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Contact = require('../models/Contact');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// get all events
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// add event
router.post('/addEvent', authMiddleware, async (req, res) => {
    const { title, description, date, location, organizer, image } = req.body;

    try {
        const newEvent = new Event({
            title,
            description,
            date,
            location,
            organizer,
            image
        });

        const event = await newEvent.save();
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// edit event
router.put('/editEvent/:id', authMiddleware, async (req, res) => {
    const { title, description, date, location, organizer, image } = req.body;

    const eventFields = {};
    if (title) eventFields.title = title;
    if (description) eventFields.description = description;
    if (date) eventFields.date = date;
    if (location) eventFields.location = location;
    if (organizer) eventFields.organizer = organizer;
    if (image) eventFields.image = image;

    try {
        let event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Event not found' });

        event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: eventFields },
            { new: true }
        );

        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// delete event
router.delete('/deleteEvent/:id', authMiddleware, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Event not found' });

        await Event.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Event removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// book event
router.post('/bookEvent', authMiddleware, async (req, res) => {
    const { eventId } = req.body;

    try {
        // check if already booked
        let booking = await Booking.findOne({ eventId, userId: req.user.id });
        if (booking) {
            return res.status(400).json({ msg: 'Already booked for this event' });
        }

        const newBooking = new Booking({
            eventId,
            userId: req.user.id
        });

        await newBooking.save();
        res.json({ msg: 'Successfully booked' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// get my bookings
router.get('/myBookings', authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id }).populate('eventId');
        res.json(bookings);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// admin dashboard data: users and contact messages
router.get('/adminDashboard', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const users = await User.find().select('-password').sort({ createdAt: -1 });
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.json({ users, contacts });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
