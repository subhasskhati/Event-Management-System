import express from 'express';
import Event from '../models/Event';
import Registration from '../models/Registration';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// get all events
router.get('/events', async (req, res) => {
    try {
        const events = await Event.find().sort({ date: 1 });
        res.json(events);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// add event
router.post('/addEvent', authMiddleware, async (req: any, res: any) => {
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
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// edit event
router.put('/editEvent/:id', authMiddleware, async (req: any, res: any) => {
    const { title, description, date, location, organizer, image } = req.body;

    const eventFields: any = {};
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
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// delete event
router.delete('/deleteEvent/:id', authMiddleware, async (req: any, res: any) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) return res.status(404).json({ msg: 'Event not found' });

        await Event.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Event removed' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// register for event
router.post('/registerEvent', authMiddleware, async (req: any, res: any) => {
    const { eventId } = req.body;

    try {
        // check if already registered
        let registration = await Registration.findOne({ eventId, userId: req.user.id });
        if (registration) {
            return res.status(400).json({ msg: 'Already registered for this event' });
        }

        const newRegistration = new Registration({
            eventId,
            userId: req.user.id
        });

        await newRegistration.save();
        res.json({ msg: 'Successfully registered' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// get my events
router.get('/myEvents', authMiddleware, async (req: any, res: any) => {
    try {
        const registrations = await Registration.find({ userId: req.user.id }).populate('eventId');
        res.json(registrations);
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
