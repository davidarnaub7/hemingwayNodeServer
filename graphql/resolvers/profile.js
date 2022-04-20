/**
 * @file user.js
 * 
 * It handles all the resolvers releated to user actions not including authorization ones.
 */


const User = require('../../models/users'); //MONGODB SCHEMA

const bcrypt = require('bcryptjs'); //BCRYPT

//AUTH FILTERS
const {updateProfileNameFilter, updateUserPrivateProfileFilter, updatePasswdFilter, changePasswdFilter} = require('../../functions/filters');

//AWS
const AWS = require('aws-sdk');
const ep = new AWS.Endpoint('s3.wasabisys.com');
const s3 = new AWS.S3({
        endpoint: ep, 
        accessKeyId:process.env.S3_WASABI_ACCESS_KEY,
        secretAccessKey: process.env.S3_WASABI_PRIVATE_KEY,
        region: "eu-central-1"
});


//REDIS
const util = require('util');
const redis = require('redis');

const client = redis.createClient('redis://127.0.0.1:6379');
client.hmget = util.promisify(client.hmget);

module.exports = {
    /**
     * @func updateProfile
     * 
     * It updates the prfile in case of accomplish the auth requirements. (only public data not files or private data)
     * @param {Arguments} args 
     * @param {Request} req 
     */
    updateProfileName: async (args, req) => {
        const {username, name} = args;

        //CHECKING AUTH REQUIREMENTS
        if(!req.isAuth && req.username !== username){
            throw new Error('Next time machine')
        }
        
        if(updateProfileNameFilter(username, name)){         //FILTER
            throw new Error('Invalid Profile data')
        }
        
        return User.findOne({ username }).then((userFound)=>{


            if (!userFound) { //IF THERE IS NO USER MEANS THAT USERNAME IS NOT CORRECT
                throw new Error('INVALID USER');
            }
            
            return new Promise((resolve, reject) => {
                User.findByIdAndUpdate(userFound.id, {$set:{name},  updateAt: new Date().toISOString()}, {useFindAndModify: false}, (error, result)=>{
                //SOMETHING WRONG HAPPENS.
                    if(error){
                        throw new Error('Somenthing wents wrong');
                    }
                })
                
                resolve('Success');
            })
            
        }).then((res)=>{
            return res;
        }).catch((err) => {
            throw err;
        });
    },
    //@TODO: this method handles the private profile updating. Sensible info like email, telephone or passwd. (maybe for chaging passwd we have to implemente another addional method):
    updateUserPrivateProfile: async(args, req)=>{
        const {username, email, telephone} = args;
        //CHECKING AUTH REQUIREMENTS
        if(!req.isAuth && req.username !== username){
            throw new Error('Next time machine')
        }
        
        if(updateUserPrivateProfileFilter(username, email, telephone)){        //FILTER
            throw new Error('Invalid Profile Data');
        }
        
        return User.findOne({ username }).then((userFound)=>{


            if (!userFound) { //IF THERE IS NO USER MEANS THAT USERNAME IS NOT CORRECT
                throw new Error('INVALID USER');
            }
            
            return new Promise((resolve, reject) => {
                User.findByIdAndUpdate(userFound.id, {$set:{privateInfo:{email, telephone, passwd: userFound.privateInfo.passwd}},  updateAt: new Date().toISOString()}, {useFindAndModify: false}, (error, result)=>{
                    //SOMETHING WRONG HAPPENS.
                    if(error){
                        throw new Error('Somenthing wents wrong');
                    }
                })

                resolve('Success');
            })
            
        }).then((res)=>{
            return res;
        }).catch((err) => {
            throw err;
        });
    },
    updateProfileImage: async (args, req) =>{ // UPDATING IMAGE
        const {img, username} = args
        
        // console.log('ENTRO EN IMG')

        //CHECKING AUTH REQUIREMENTS
        if(!req.isAuth && req.username !== username) {
            throw new Error('Next time machine')
        }
        
        
        // if(updateProfileMediaFilter(img, back, username)){         //FILTER
        //     throw new Error('Invalid Data');

        // }

        const uploadImages = async  () =>{
            const mongoDBCond = {};

            if(img.base64 !== ''){
                if(img.base64 === 'remove'){
                    // console.log('ENTRO EN BORRAR');
                    await s3.deleteObject({
                        Bucket: process.env.S3_BUCKET,
                        Key: 'Users/'+username+'/'+username+'img.jpg',
                    }).promise().then((t)=>{
                        // console.log('entré')
                        // console.log(t);
                    }).catch((err)=>{
                        console.log(err)
                        throw new Error ('Algo ha ido mal')
                    })
                    mongoDBCond["image"] = false;
                }else{
                    await s3.putObject({
                    Bucket: process.env.S3_BUCKET,
                    Key: 'Users/'+username+'/'+username+'img.jpg',
                    Body: Buffer.from(img.base64,'base64'),
                    ContentEncoding: 'base64',
                    ContentType: img.type,
                    }).promise().then((t)=>{
                        // console.log('entré')
                        // console.log(t);
                    }).catch((err)=>{
                        console.log(err);
                        throw new Error ('Algo ha ido mal')
                    })
                    mongoDBCond["image"] = true;
                }
            }

            return mongoDBCond;
           
        }
        return User.findOne({ username }).then((userFound)=>{

            if (!userFound) { //IF THERE IS NO USER MEANS THAT USERNAME IS NOT CORRECT
                throw new Error('INVALID USER');
            }
            client.hdel(username, ["img"]); //REMOVING USER FROM CACHE (IN THE CASE HE IS IN)
      
            return uploadImages().then((mongoDBCond)=>{
                return new Promise((resolve, reject) => {
                    User.findOneAndUpdate({username}, {$set:mongoDBCond,  updateAt: new Date().toISOString()}, {useFindAndModify: false}, (error, result)=>{
                        //@TODO: maybe the result contain the necesary object to pass the update function
                        
                        //SOMETHING WRONG HAPPENS.
                        if(error){
                            throw new Error('Somenthing wents wrong');
                        }
                    }); //END MONGODB

                    resolve('Success');
                })
            }).catch((err)=>{ throw err});

        });
        
    },
    updatePasswd: async (args, req)=> {
        const {username, oldPasswd, newPasswd} = args;
        //CHECKING AUTH REQUIREMENTS
        if(!req.isAuth && req.username !== username){
            throw new Error('Next time machine')
        }

        if(updatePasswdFilter(username, oldPasswd, newPasswd)){ //FILTER
            throw new Error('Invalid Profile Data');
        }


        const userFound = await User.findOne({ username });


        if (!userFound) { //IF THERE IS NO USER MEANS THAT USERNAME IS NOT CORRECT
            throw new Error('INVALID USER');
        }

    
        const isEqual = await bcrypt.compare(oldPasswd, userFound.privateInfo.passwd);  // COMPARING PASSWD


        if (!isEqual) {
            // console.log('devuelvo failed');
            throw new Error('Contraseña incorrecta');
        }

        //HASHING PASSWD
        return bcrypt.hash(newPasswd, 12).then((hashedPasswd) =>{
            const newPrivateInfo = {    
                email: userFound.privateInfo.email,
                telephone: userFound.privateInfo.telephone,
                passwd: hashedPasswd,
            };

            //PROMISE TO CATCH MONGODB ERROR.
     
            // console.log(userFound.username);
            // console.log(userFound.id);
           try {
                User.findByIdAndUpdate(userFound.id, {$set:{privateInfo:newPrivateInfo},  updateAt: new Date().toISOString()}, {useFindAndModify: false}, (error, result)=>{
                        //SOMETHING WRONG HAPPENS.
                        if(error){
                            console.log(error);
                            throw new Error('Somenthing wents wrong')
                            // throw new Error('Somenthing wents wrong');
                        }        
                })
           } catch (error) {
               throw error
           }


            return 'Success';
            
        });
    },
    changePasswd: async (args, req)=> {
        const {email, newPasswd, enteredCode} = args;
        
        if(changePasswdFilter(email, newPasswd)){//FILTER
            throw new Error('Invalid Profile Data');
        }

        const userFound = await User.findOne({"privateInfo.email": email.toLowerCase()});

        if (!userFound) { //IF THERE IS NO USER MEANS THAT USERNAME IS NOT CORRECT
            throw new Error('INVALID USER');
        }

        
        if(userFound.privateInfo.email === email){
            const code = (await client.hmget(email, "verificationCode"))[0];

            if (code !== enteredCode) {
                // console.log('rechzo por codigo')
                throw new Error ('REQUEST NOT PERMITTED')
            }
            client.del(userFound.privateInfo.email); //REMOVING THE REGISTER.
        }else{
            // console.log('rechazo por email');
            throw new Error ('REQUEST NOT PERMITTED');
        }



        //HASHING PASSWD
        return bcrypt.hash(newPasswd, 12).then((hashedPasswd) =>{
            const newPrivateInfo = {    
                email: userFound.privateInfo.email,
                telephone: userFound.privateInfo.telephone,
                passwd: hashedPasswd,
            };

            //PROMISE TO CATCH MONGODB ERROR.
     
           try {
                User.findByIdAndUpdate(userFound.id, {$set:{privateInfo:newPrivateInfo},  updateAt: new Date().toISOString()}, {useFindAndModify: false}, (error, result)=>{
                        //SOMETHING WRONG HAPPENS.
                        if(error){
                            console.log(error);
                            throw new Error('Somenthing wents wrong')
                            // throw new Error('Somenthing wents wrong');
                        }        
                })
           } catch (error) {
               throw error
           }

            return 'Success';
            
        });
    },
};