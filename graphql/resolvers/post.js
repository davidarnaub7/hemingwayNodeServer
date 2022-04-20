//MONGO SCHEMES
const Post = require('../../models/post');
const Like = require('../../models/like');
const User = require('../../models/users');

//REDIS
const util = require('util');
const redis = require('redis');

const client = redis.createClient('redis://127.0.0.1:6379');
client.hget = util.promisify(client.hget);

// AWS-CLIENT
const AWS = require('aws-sdk');
const ep = new AWS.Endpoint('s3.wasabisys.com');
const s3 = new AWS.S3({
        endpoint: ep, 
        accessKeyId: process.env.S3_WASABI_ACCESS_KEY,
        secretAccessKey: process.env.S3_WASABI_PRIVATE_KEY,
        region: "eu-central-1"
});

//REGEX VERIFIERS
const {postFilter, removePostFilter} = require('../../functions/filters');
const { contentSecurityPolicy } = require('helmet');

/**
 * 
 * CONSTANTS
 */
// const DISTANCE = 750000000; // 500 meters.
const TIME = 50000;//50 sgegundos
const MORE = 21; // READ USER BATCHES OF 10 USERS

/**
 * 
 * LOCAL VARIABLES
 */
const lastIndexReaded = {} // CONTAINS THE LASTINDEX OF THE USER FOR EACH USER THAT IS IN A ROOM {key:id, value: index}


/**
 * @func getRedisValue
 * Gets the url form of a certain Image
 * @param {String} Key -> redis register indetifier 
 * @param {[String]} values  -> keys we want to get
 */
 async function getRedisValue (key, values) {
    return new Promise((resolve, reject) => {
        client.hmget(key, values, (error, reply)=>{
            resolve(reply);
        });
    })  
 }

 async function setRedisValue (key, values) {
    await client.hmset(key, values);
    await client.expire(key, 3600); //One hour to expire
 }


module.exports = {
    /**
     * @func setPost
     * 
     * Add a post to user and to the table
     * @param {Arguments} args 
     * @param {Request} req 
     */
     createPost: async (args, req) => {
            const {username, post} = args;
            
            //If user is not authenticated
            // if(!req.isAuth || req.username !== args.username){
            //     throw new Error('Next time machine')
            // }
            
            // HAY QUE MEJORAR EL FILTRO.
            if(!postFilter(username, post)){
                throw new Error('Invalid Data')
            }
          
            /**
             * @important if there is no redis register about the room or the user means, that this user does not exist on these room reason of  
             * why it always has to be accessed to these USER TABLE from mongo 
             */
            
            //COMPROVING IF ROOM ID EXISTS. -> MUST IMPLEMENT LOCATION METHOD
            return User.findOne({username}).then(async user=>{
                
                //If room != undefined indicates that room exist
                if(!user){
                    throw new Error ('User does not exists');
                }
               
                const newPost = new Post({
                    title: post.title,
                    authorId: username,
                    content: post.content,
                    imageInfo: {
                        author: post.imageInfo.author,
                        bck: post.imageInfo.bck,
                        url: post.imageInfo.url,
                    },
                    updateAt: new Date().toISOString(),
                    createdOn:new Date().toISOString(),
                    likes: 0,
                });

                try {
                    //saving post
                    await newPost.save().then(e=>{
                        console.log('succeed1')
                    }).catch(e=>{
                        console.log(e);
                    });
                    await user.updateOne({$addToSet: { posts: newPost._id }},(err,reply)=>{
                    });
                    
                } catch (error) {
                    console.log(error);
                    throw new Error('ALGO HA IDO MAL');
                }
                return 'Success';
        
            })
            .catch(err=>{
                throw err 
            });
        },
    
    removePost: async (args, req) => {
        const {username, postID} = args;
        
        // //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }
        
        // HAY QUE MEJORAR EL FILTRO.
        if(!removePostFilter(username, postID)){
            throw new Error('Invalid Data')
        }
      
        /**
         * @important if there is no redis register about the room or the user means, that this user does not exist on these room reason of  
         * why it always has to be accessed to these USER TABLE from mongo 
         */
        
        //COMPROVING IF ROOM ID EXISTS. -> MUST IMPLEMENT LOCATION METHOD
        return User.findOne({username}).then(async user=>{
            
            //If room != undefined indicates that room exist
            if(!user){
                throw new Error ('User does not exists');
            }

            const postFound = await Post.findOne({_id:postID});
            
            if(!user.posts.includes(postID) || !postFound || postFound.authorId!==username){
                throw new Error ('Post does not exists');
            }
           
        
           try {
                await Post.deleteOne({_id:postID});
                await user.updateOne({$pull: { posts: postID }},(err,reply)=>{
                });
           } catch (error) {
               console.log(error);
               throw new Error('ALGO HA IDO MAL');
           }
           
           return 'Success';
    
        })
        .catch(err=>{
            throw err 
        });
    },
    giveLike: async (args, req) => {
        const {likerUsername, postID, give} = args;
        
        //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }
        
        const postFound = await Post.findOne({_id:postID});

        if(!postFound){
            throw new Error ('Post does not exists');
        }
        
        return User.findOne({username:likerUsername}).then(async user=>{
            
            if(!user){
                throw new Error ('User does not exists');
            }

            try {
                if(give){
                    await new Like({
                        postID,
                        likerUsername: likerUsername,
                        likedOn: new Date().toISOString(),
                    }).save();
                    await postFound.updateOne({$inc : {likes : 1}});
                    await user.updateOne({$push: { likes: postID }});
                }else{
                    await Like.deleteOne({postID, username: likerUsername});
                    await postFound.updateOne({$inc : {likes : -1}});
                    await user.updateOne({$pull: { likes: postID }});
                }
            } catch (error) {
                console.log(error);
            }
           
            return 'Success';
        })
        .catch(err=>{
            throw err 
        });
    },
};