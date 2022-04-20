const {checkEmail, checkUser, checkText,checkMongoID, checkPasswd, checkName,checkTelephone, checkBase64} = require('./regex');

module.exports = {
    //VERIFY METHODS
    verifyCodeFilter: (email) =>{
        return checkEmail(email);
    },
    //AUTH METHODS
    postFilter: (username, posts) =>{
        return !checkUser(username) || !checkText(posts.title) || !checkText(posts.content);
    },
    removePostFilter: (username, postID) =>{
        return !checkUser(username) || !checkMongoID(postID);
    },
    authUsernameFilter:(username) =>{
        return !checkUser(username);
    },
    createUserFilter:(username, email, name, passwd, social)=>{
        return !checkUser(username) || !checkPasswd(passwd) || !checkEmail(email) || !checkName(name);
    },
    loginFilter: (username, passwd) => {
         return !checkUser(username) || !checkPasswd(passwd) 
    },
    refreshTokenFilter:(username, id) =>{
        return !checkUser(username);
    },
    //PROFILE METHODS
    updateProfileNameFilter:(username, name) =>{
        return !checkUser(username) || !checkName(name);
    },
    updateUserPrivateProfileFilter:(username, email, telephone) =>{
        return  !checkUser(username) || !checkEmail(email) || !checkTelephone(telephone);
    },
    updateProfileMediaFilter:(img, bck, username) =>{
        return !checkUser(username) || !checkBase64(img) || !checkBase64(bck);
    },
    updatePasswdFilter:(username, newPasswd, oldPasswd)=>{
        return  !checkUser(username) || !checkPasswd(newPasswd) || !checkPasswd(oldPasswd);
    },
    changePasswdFilter:(email, passwd) =>{
        return !checkEmail(email) || !checkPasswd(passwd);
    },  
}