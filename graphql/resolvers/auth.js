//CRYPT LIBRARY
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const randToken = require('rand-token');

const User = require('../../models/users');

//AUTH FILTERS
const {authUsernameFilter, createUserFilter, loginFilter, refreshTokenFilter, roomFilter} = require('../../functions/filters');

//CATCHING AWS-CLIENT
const AWS = require('aws-sdk');
const ep = new AWS.Endpoint('s3.wasabisys.com');
const s3 = new AWS.S3({
        endpoint: ep, 
        accessKeyId: process.env.S3_WASABI_ACCESS_KEY,
        secretAccessKey: process.env.S3_WASABI_PRIVATE_KEY,
        region: "eu-central-1"
});

//REDIS
const util = require('util');
const redis = require('redis');

const client = redis.createClient('redis://127.0.0.1:6379');
client.hmget = util.promisify(client.hmget);

async function generateToken (id, username) {
    //GENERATING JSON WEB TOKEN.
        const token = jwt.sign(
            { userId: id, username },
            process.env.PRIVATE_KEY, //APP-SECRET KEY 
            {
             expiresIn: '1h' // GOOD PRACTISE ONLY 1h
            }
        );

        var refresh_token = randToken.uid(256);
        
        // refresh_tokens[id] = refresh_token; //WITHOUT REDIS
        client.hmset(id, {token: refresh_token}); //KEEPING REFRESH TOKEN ON REDIS.

        // console.log(refresh_token);
        // console.log('CURRENT TOKEN')
        // console.log(token);
        return { userId: id, token: token, tokenExpiration: 1, refresh_token, refresh_tokenExpiration: 30  }
}

const closeSesion = async (username, userID) =>{
   return new Promise((resolve, reject) => {
        
        //REMOVING REFRESH TOKEN FROM REDIS.
        try {
            client.del(userID);
            // console.log('borro token');
        } catch (error) {
            reject('Algo ha ido mal')
        }

        resolve('Success');
   })
   
}

module.exports = {
    //@TODO: for this method we have to ask from token to checj that user can catch this data.
    user: async (args, req) => {
        const {username} =  args

        // //CHECKING IF IS LOGGED OR THE DATA INTRODUCED IS CORRECT.
        if(!req.isAuth || req.username !== args.username || authUsernameFilter(username)){        //FILTER
            throw new Error('Next time machine')
        }
    
        
        //Form here we must call to database
        return User.find({username}).then(users => {
            const user = users[0];

            //IF USER DOES NOT EXISTS
            if(!user){
                throw new Error('User not found');
            }
            
            //FECTHING USER S3 URLS REFERENCES
            let imgUrl = '';
            
            if(user.image){
                imgUrl = s3.getSignedUrl('getObject', { Bucket: process.env.S3_BUCKET, Key:'Users/'+username+'/'+username+'img.jpg', Expires:120});
            }

            return  { // we have to descompose the object in order to be secure that we are not returning passwd.
                user:{
                    _id: user._doc._id.toString(),
                    username: user.username,
                    name: user.name,
                    privateInfo: {
                        email: user.privateInfo.email.toLowerCase(),
                        telephone: user.privateInfo.telephone,
                    },
                    likes: user.likes,
                    followers:user.followers,
                    following: user.following,
                    posts: user.posts,
                    image: user.image,
                },
                urls: {
                    imgUrl,
                }
            }
        })
        .catch(err=> {throw err})
    },
    createUser: async (args) => {
        const userData = args.user; //CACTHING USER DATA
        const enteredCode = args.enteredCode; //CATCHING THE ENTERED CODE
       
        if(createUserFilter(userData.username, userData.privateInfo.email, userData.name, userData.privateInfo.passwd)) {        //FILTER
            throw new Error('Invalid Login data');
        }

        //@TODO: UNCOMMENT THIS FOR PROD
        // const code = (await client.hmget(userData.privateInfo.email, "verificationCode"))[0];

        // if (code !== enteredCode) {
        //     throw new Error ('Código no válido')
        // }

        //REGISTERING USER.
        return await User.findOne({username:userData.username}).then(user=>{ //COMPROVING IF USERNAME IS FREE.
            
            if (user) { //If user!= undefined indicates that user exist
                throw new Error ('Username exists already');
            }

            client.del(userData.privateInfo.email); //REMOVING THE REGISTER.

            return bcrypt.hash(userData.privateInfo.passwd, 12)  //HASING PASSW
        }).then(hashedPasswd=>{
                
            const user = new User({                 //CREATING USER MONGO OBJECT
                username: userData.username,
                name: userData.name,
                image: false,
                followers:[],
                following:[],
                posts:[],
                likes:[],
                privateInfo: {
                    email: userData.privateInfo.email,
                    telephone: userData.privateInfo.telephone,
                    passwd : hashedPasswd,
                },
                updateAt: new Date().toISOString(),
            });
            return user.save();
        })
        .then(async result=>{
            console.log("New user "+userData.username)
            console.log(result);
            // sendMail(userData.username); //@TODO: uncomment for prod.
            return {...result._doc, passwd:null , _id: result.id};
        })
        .catch(err=>{
            throw err 
        });
    },
    login: async ({ username, passwd }) => {
  
        if(loginFilter(username, passwd)){        //FILTER
            throw new Error('Password is incorrect!');
        }

        const user = await User.findOne({ username });

        
        if (!user) { //IF THERE IS NO USER MEANS THAT USERNAME IS NOT CORRECT
            throw new Error('User does not exist!');
        }

        const isEqual = await bcrypt.compare(passwd, user.privateInfo.passwd);  // COMPARING PASSWD
    
        if (!isEqual) {
            throw new Error('Password is incorrect!');
        }

        return generateToken(user.id, user.username); // AUTH_DATA GraphQL OBJECT
    },
    refreshToken : async (args, req) =>{
        const {username, token, refresh, userID} =  args;

        
        if(refreshTokenFilter(username)){        //FILTER
            throw new Error('Invalid Login data');
        }

        // console.log("NETRO EN REFRESH TOJEN");
        //DECODING TOKEN IN CASE OF CORRECT BUT EXPIRED WE CHECK THE REFRESH TOKEN.
        try {
            decodedToken = jwt.verify(token,  process.env.PRIVATE_KEY); //APP-SECRET KEY 
        } catch (err) {
            if(err.toString().split(':')[1].trim() === "jwt expired"){
                // console.log(refresh)
                const token =( await client.hmget(userID, "token"))[0];
                // console.log(await client.hmget(userID, "token"));
                // if(refresh_tokens[userID] === refresh){ //WITHOUT REDIS
                if(token === refresh){
                    // console.log('entro aquí');
                    return await generateToken(userID, username)
                }else{
                    throw new Error('Invalid Creds');
                }
            }
        }        
    },
    logOut :  async (args, req) =>{
        const {username, userID} =  args;
        if(!req.isAuth || req.username !== username){  //If user is not authenticated
                throw new Error('Next time machine')
        }  

        if(authUsernameFilter(username)){        //FILTER
            throw new Error('Invalid Auth Data');
        }

        return await closeSesion(username, userID);
    },
    removeAccount :  async (args, req) =>{
        const {username, roomID, userID} =  args;
        // console.log(username);
        if(!req.isAuth || req.username !== username){  //If user is not authenticated
                throw new Error('Next time machine')
        }  

        if(roomFilter(roomID, username)){        //FILTER
            throw new Error('Invalid Auth Data');
        }

        const sessionClosed = await closeSesion(roomID, username, userID);
        // console.log('sesion closed');
        if(sessionClosed === 'Success'){
            console.log('Removing username '+username+' from '+roomID);
            await User.findOneAndRemove({username: username});
        }else{
            throw new Error('Something went wrong');
        }

        return 'Success';
    }
};