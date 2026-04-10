import mongoose from 'mongoose';

// event schema for database
const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    organizer: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: 'https://picsum.photos/seed/event/800/400'
    }
}, { timestamps: true });

const Event = mongoose.model('Event', eventSchema);
export default Event;
