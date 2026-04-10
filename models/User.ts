import mongoose from 'mongoose';

// user schema for database
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user' // can be 'admin' or 'user'
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
