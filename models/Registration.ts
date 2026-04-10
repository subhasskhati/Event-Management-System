import mongoose from 'mongoose';

// registration schema for database
const registrationSchema = new mongoose.Schema({
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    registrationDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const Registration = mongoose.model('Registration', registrationSchema);
export default Registration;
