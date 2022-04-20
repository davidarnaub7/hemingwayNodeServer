const mongoose = require('mongoose');

const Schema = mongoose.Schema; // to generate new Schema

const postSchema = new Schema({
    title: {
        type: String,
    },
    content:{
        type: [String],
        required: true,
    },
    authorId:{ 
        type: String,
    },
    imageInfo:{
        url:{  
            type:String,
        },
        bck: {
            type:String,
        },
        author: {
            type: String,
        },
    },
    updateAt: {
        type: Date,
        required: true,
    },
    createdOn: {
        type: Date,
        required: true,
    },
    likes: {
        type: Number,
        required: true,
        min: 0,
    },
});

module.exports = mongoose.model('Posts',postSchema) // Adding Collection 





