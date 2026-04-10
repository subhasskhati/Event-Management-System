const mongoose = require('mongoose');
const User = require('./models/User');
const Event = require('./models/Event');
const Booking = require('./models/Booking');
const Contact = require('./models/Contact');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventdb');
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany();
        await Event.deleteMany();
        await Booking.deleteMany();
        await Contact.deleteMany();

        // Create users
        const users = await User.insertMany([
            {
                name: 'John Doe',
                email: 'john@example.com',
                password: 'password123', // In real app, hash this
                role: 'user'
            },
            {
                name: 'Jane Smith',
                email: 'jane@example.com',
                password: 'password123',
                role: 'admin'
            },
            {
                name: 'Bob Johnson',
                email: 'bob@example.com',
                password: 'password123',
                role: 'user'
            }
        ]);

        console.log('Users created:', users.length);

        // Create events
        const events = await Event.insertMany([
            {
                title: 'Tech Conference 2026',
                description: 'A conference about the latest in technology',
                date: '2026-06-15',
                location: 'Mumbai, India',
                organizer: 'Tech Corp',
                image: 'https://picsum.photos/seed/tech/800/400'
            },
            {
                title: 'Music Festival',
                description: 'Summer music festival with multiple artists',
                date: '2026-07-20',
                location: 'Delhi, India',
                organizer: 'Music Events Inc',
                image: 'https://picsum.photos/seed/music/800/400'
            },
            {
                title: 'Art Exhibition',
                description: 'Contemporary art exhibition',
                date: '2026-08-10',
                location: 'Bangalore, India',
                organizer: 'Art Gallery',
                image: 'https://picsum.photos/seed/art/800/400'
            }
        ]);

        console.log('Events created:', events.length);

        // Create bookings
        const bookings = await Booking.insertMany([
            {
                eventId: events[0]._id,
                userId: users[0]._id
            },
            {
                eventId: events[1]._id,
                userId: users[1]._id
            },
            {
                eventId: events[2]._id,
                userId: users[2]._id
            }
        ]);

        console.log('Bookings created:', bookings.length);

        // Create contacts
        const contacts = await Contact.insertMany([
            {
                name: 'Alice Wilson',
                email: 'alice@example.com',
                message: 'I would like to inquire about event sponsorship.'
            },
            {
                name: 'Charlie Brown',
                email: 'charlie@example.com',
                message: 'Great events! Keep up the good work.'
            }
        ]);

        console.log('Contacts created:', contacts.length);

        console.log('Data seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error.message);
        process.exit(1);
    }
};

connectDB().then(() => {
    seedData();
});