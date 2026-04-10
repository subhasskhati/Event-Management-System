import express from 'express';
import Contact from '../models/Contact';

const router = express.Router();

// contact form route
router.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;

    try {
        const newContact = new Contact({
            name,
            email,
            message
        });

        await newContact.save();
        res.json({ msg: 'Message sent successfully' });
    } catch (err: any) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

export default router;
