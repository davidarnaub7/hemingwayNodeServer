const mongoose = require('mongoose');

const Schema = mongoose.Schema; // to generate new Schema

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: {
        type: Boolean,
    },
    followers:{
        type: [String],
        required: true,
    },
    following:{
        type: [String],
        required: true
    },
    posts:{
        type: [String],
        required: true
    },
    likes:{
        type: [String],
        required: true
    },
    privateInfo: {
        email: String,
        telephone: String,
        passwd: {
            type: String,
            required: true,
        }
    },
    updateAt: {
        type: Date,
        required: true,
    }
});

module.exports = mongoose.model('User', userSchema) // Adding Collection 





