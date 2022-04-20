

const User = require('../../models/users'); //MONGO DB SCHEMA

const {getMailTemplate} = require('../../functions/mailTemplate');

const AWS = require('aws-sdk');

const SES_CONFIG = {
    accessKeyId: process.env.SES_AMAZON_ACCESS_KEY,
    secretAccessKey: process.env.SES_AMAZON_PRIVATE_KEY,
    region: 'eu-west-1',
};

const AWS_SES = new AWS.SES(SES_CONFIG);

const {verifyCodeFilter} = require('../../functions/filters');

const {totp} = require('otplib'); //IMPORTIN AUTHENTICATOR
totp.options = { digits: 6, step: 120, window:1};

//REDIS
const util = require('util');
const redis = require('redis');

const client = redis.createClient('redis://127.0.0.1:6379');
client.hmget = util.promisify(client.hmget);


//AUXILARY FUNCS
const getNewCode = async (email) =>{
    const code  = totp.generate(process.env.PRIVATE_KEY_ENTER_CODE);
    // await client.hmset(email, code);
    // await client.expire(key, 600); //10 minutes to expire
    return code;
}    



 const generateCode = async (email) =>{

        //HAS PASSED THE COND SO GENERATE AND SEND THE CODE
        const code = await getNewCode(email);

        await client.hmset(email, {"verificationCode":code})
        await client.expire(email, 800); //EXPIRES in ten minutes. 
      
        return code +"";
 }

module.exports = {
    //This is going to be call when the user puts his number
    createVerficationCode: async (args, req) => {
        const {email} = args;
        
        if(!verifyCodeFilter(email)){         //FILTER
            throw new Error('Invalid Email Data');
        }

        // //CHECKING IF EMAIL EXISTS
        const emailFound = await User.findOne({"privateInfo.email": email.toLowerCase()});
        
        if(emailFound){
            throw new Error('EMAIL FOUND');
        } 
        
        //@TODO: UNCOMMENT THIS TO PROD.
        //CONFIGURING THE PARAMS TO SEND THE EMAIL
        const code = await generateCode(email).then((res)=>{return res}).catch(err=>{throw err})
        console.log(code);
        // let params = {
        //     Source: 'no-reply@beyu.io',
        //     ReplyToAddresses: ['contact@beyu.io'],
        //     Destination: {
        //     ToAddresses: [
        //         email // HERE WILL BE THE EMAIL PARAM OF EACH USER
        //     ],
        //     },
        //     Message: {
        //     Body: {
        //         Html: {
        //         Charset: 'UTF-8',
        //         Data: getMailTemplate(code),
        //         },
        //     },
        //     Subject: {
        //         Charset: 'UTF-8',
        //         Data: `Tu código beyu`,
        //     }
        //     },
        // };

        // return AWS_SES.sendEmail(params).promise().then(e=>{
        //     return 'Success';
        // });

        return 'Success';

    },
    createVerficationCodeChangePasswd: async (args, req) => {
        const {email} = args;


        if(!verifyCodeFilter(email)){        //FILTER
            throw new Error('Invalid Email Data');
        }
      
        // console.log(process.env.SES_AMAZON_ACCESS_KEY);
        // console.log(process.env.SES_AMAZON_PRIVATE_KEY);
      
        //CHECKING IF EMAIL EXISTS
        const emailFound = await User.findOne({"privateInfo.email": email.toLowerCase()});
    
        if(!emailFound){
            throw new Error('EMAIL NOT FOUND');
        } 
    
        const code = await generateCode(email).then((res)=>{return res}).catch(err=>{throw err})

        console.log(code);
        let params = {
            Source: 'no-reply@beyu.io',
            ReplyToAddresses: ['contact@beyu.io'],
            Destination: {
            ToAddresses: [
                email // HERE WILL BE THE EMAIL PARAM OF EACH USER
            ],
            },
            Message: {
            Body: {
                Html: {
                Charset: 'UTF-8',
                Data: getMailTemplate(code),
                },
            },
            Subject: {
                Charset: 'UTF-8',
                Data: `Tu código beyu`,
            }
            },
        };

        // return AWS_SES.sendEmail(params).promise().then(e=>{
        //     return 'Success';
        // });
        return 'Success';
    },
    //This is going to be call when the user puts its verification code
    verifyCode: async (args, req) => {
        const {email, token} = args;


        if(!verifyCodeFilter(email)){        //FILTER
            throw new Error('Invalid Email Data');
        }
        
        const code = (await client.hmget(email, "verificationCode"))[0];

        if(code !== token){
            throw new Error ('NOT VALID CODE')
        }

        if (!totp.verify({token, secret:process.env.PRIVATE_KEY_ENTER_CODE})){
            throw new Error ('NOT VALID CODE');
        }

        return 'Success';
    }
};