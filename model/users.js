const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    searchHistory: [{
        type: String,
    }],
    resourceHistory: {
        type: [String],
        default: []
    },
    bio: {
        type: String,
        default: ''
    },
    interests: {
        type: [String],
        default: []
    }
})

const User = mongoose.model('User', userSchema)
module.exports = User;