const mongoose = require('mongoose');

const Schema = mongoose.Schema; // to generate new Schema

const likeSchema = new Schema({
    postID: {
        type: String,
        required: true,
    },
    likerUsername:{
        type: String,
        required: true,
    },
    likedOn: {
        type: Date,
    },
});

module.exports = mongoose.model('Likes',likeSchema) // Adding Collection 





