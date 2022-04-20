//MONGO SCHEMES
const Post = require('../../models/post');
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
const {authUsernameFilter} = require('../../functions/filters');

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
     follow: async (args, req) => {
            const {username, followedUsername} = args;
            
            //If user is not authenticated
            // if(!req.isAuth || req.username !== args.username){
            //     throw new Error('Next time machine')
            // }
            
            
            if(authUsernameFilter(username) || authUsernameFilter(followedUsername)){
                throw new Error('Invalid Data')
            }
          
            /**
             * @important if there is no redis register about the room or the user means, that this user does not exist on these room reason of  
             * why it always has to be accessed to these USER TABLE from mongo 
             */
            
            //COMPROVING IF ROOM ID EXISTS. -> MUST IMPLEMENT LOCATION METHOD
            return User.findOne({username}).then(async user=>{
                const followed = await User.findOne({username: followedUsername});

                //If room != undefined indicates that room exist
                if(!user && !followed){
                    throw new Error ('User does not exists');
                }
               
                console.log(followed);
                try{
                    // CHECKING IF WE HAVE TO FOLLOW OR UNFOLLOW
                    if(user.following.includes(followed.username)){
                        await followed.updateOne({$pull: { followers: user.username }});
                        await user.updateOne({$pull: { following: followed.username }});
                    }else{
                        await followed.updateOne({$push: { followers: user.username }});
                        await user.updateOne({$push: { following: followed.username }});
                    }
                } catch(error){
                    throw new Error('ALGO HA IDO MAL');
                }

                return 'Success';
            })
            .catch(err=>{
                throw err 
            });
        }
};