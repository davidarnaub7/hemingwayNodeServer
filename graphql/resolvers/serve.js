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
const { checkUser } = require('../../functions/regex');
const users = require('../../models/users');


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

const getImage = async (userToCheck) =>{
    let imgUrl ='';

    if(userToCheck.image){
        console.log('entro');
        const isCached =  await getRedisValue(userToCheck.username, ['img']);
        console.log(isCached);
        if(isCached[0]!==null){
            console.log('entramos en cache');
            imgUrl = isCached[0];
        }else{
            imgUrl = s3.getSignedUrl('getObject', { Bucket: process.env.S3_BUCKET, Key:'Users/'+userToCheck.username+'/'+userToCheck.username+'img.jpg', Expires:3600});
            console.log(imgUrl);
            setRedisValue(userToCheck.username, {img: imgUrl});
        }
    }

    return imgUrl;
}
module.exports={
    getPostFollowers: async (args, req) => {
        const {username, lastReaded, isForMe} = args;
            
        //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }
        
        // HAY QUE MEJORAR EL FILTRO.
        if(!checkUser(username)){
            throw new Error('Invalid Data')
        }
      
        /**
         * @important if there is no redis register about the room or the user means, that this user does not exist on these room reason of  
         * why it always has to be accessed to these USER TABLE from mongo 
         */
        
        //COMPROVING IF ROOM ID EXISTS. -> MUST IMPLEMENT LOCATION METHOD
        return User.findOne({username}).then(async user=>{
            if(!user){
                throw new Error('User does not exist');
            }

            const matchCondition = isForMe ? {"$match": { 
                "createdOn":  {"$lt":new Date(lastReaded)},
            },} :
            {"$match": { 
                "createdOn":  {"$lt":new Date(lastReaded)},
                "authorId": {"$in": user.following},
            },}

            const posts =  await Post.aggregate([  
                matchCondition,
                {"$limit": 30},
                {"$sort": { createdOn: -1 } },
           ]);      
           
           return posts.map(async ps =>{
                
                const userToCheck  = await User.findOne({username: ps.authorId});
                console.log(userToCheck);
                
                ps["img"] = getImage(userToCheck);

                return ps;
           }) 
        });
    },
    searchUsers: async(args, req)=>{
        const {username, searchTerm} = args;
       
        //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }

        const usersFetched = await User.aggregate([
            {
                "$match":{
                    "username": 
                    {$regex : "^" + searchTerm}
                }
            },
            { "$project": {_id:0, privateInfo:0, likes:0}},
        ]); 

        //CATCHING IMAGES
        return await usersFetched.map(async userToCheck=>{
            let imgUrl = await getImage(userToCheck);
            return {...userToCheck, imgUrl};
        })

        
    },
    getPostsOfUser: async(args, req)=>{
        const {username, userOf, lastReaded} = args;
       
        //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }

        return await Post.aggregate([  
                {
                    "$match": {
                        "createdOn":  {"$lt":new Date(lastReaded)},
                        "authorId": {"$eq": userOf},
                    }
                },
                {"$limit": 30},
                {"$sort": { createdOn: -1 } },
        ]);      
        
        
    },
    getUserInfo: async (args, req)=>{
        const {username, userOf} =  args;
        //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }

        return await User.findOne({username: userOf},{username:1, name:1, followers:1, following:1});
    },
    getPostProfile: async(args, req)=>{
        const {username, target, lastReaded} = args;
        //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }

        //COMPROVING IF ROOM ID EXISTS. -> MUST IMPLEMENT LOCATION METHOD
        return User.findOne({username}).then(async user=>{
            if(!user){
                throw new Error('User does not exist');
            }

            return await Post.aggregate([  
                { 
                    "$match": { 
                        "createdOn":  {"$lt":new Date(lastReaded)},
                        "authorId": {"$eq": target},
                    },
                
                },
                {"$limit": 30},
            ]);          
        });
        
    },
    getAllPostMyProfile: async(args, req)=>{
        const {username} = args;
        //If user is not authenticated
        // if(!req.isAuth || req.username !== args.username){
        //     throw new Error('Next time machine')
        // }

        //COMPROVING IF ROOM ID EXISTS. -> MUST IMPLEMENT LOCATION METHOD
        return User.findOne({username}).then(async user=>{
            if(!user){
                throw new Error('User does not exist');
            }

            return await Post.find({authorId: username});        
        });
        
    }
}