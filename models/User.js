const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const UserSchema = new Schema({
    name: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: false
    },

    phonenumber: {
        type: Number,
        required: false
    },
    date: {
        type: Date,
        Default: Date.now()
    },
    role: {
        type: String,
        required : true
    },
    bookedpg : [String],
    requestedpg: [String],
    profileimage: {
        type: String,
        required : true,
        default : "/uploads/images.jpg"
    }
});
mongoose.model('users', UserSchema);
