const {usernameRegex} = require('../constants/regex');
const {passwdRegex} = require('../constants/regex');
const {latitudeRegex, longitudeRegex}  = require('../constants/regex');
const {emailRegex}  = require('../constants/regex');
const {fullNameRegex}  = require('../constants/regex');
const {base64Regex}  = require('../constants/regex');
const {socialRegex}  = require('../constants/regex');
const {textRegex} = require('../constants/regex');
const {telephoneRegex} = require('../constants/regex');
const {emailAdRegex} = require('../constants/regex');
const {mongoIDRegex} = require('../constants/regex');

module.exports = {
    /**CHECK HELPERS */
    checkUser :  (username) =>{
        return usernameRegex.test(username);
    },
    checkPasswd:  (passwd) => {
        return passwdRegex.test(passwd);
    },
    checkCoords:  (lat, lon)=>{
        return latitudeRegex.test(lat) && longitudeRegex.test(lon);
    },
    checkEmail:  (email) =>{
        return emailRegex.test(email);
    },
    checkEmailAd:  (email) =>{
        return emailAdRegex.test(email);
    },
    checkName: (name) =>{
        return fullNameRegex.test(name);
    },
    checkBase64:(base64)=>{
        return base64Regex.test(base64);
    },
    checkText:(text)=>{
        return textRegex.test(text);
    },
    checkMongoID:(id)=>{
        return mongoIDRegex.test(id);
    },
    checkSocial:(social) =>{
        return socialRegex.test(social.Instagram) && socialRegex.test(social.Facebook) && socialRegex.test(social.Tiktok) &&
        socialRegex.test(social.Twitter) && socialRegex.test(social.Youtube) && socialRegex.test(social.Spotify);
    },
    checkTelephone:(telephone)=>{
        return telephoneRegex.test(telephone) || telephone === undefined;
    }
}