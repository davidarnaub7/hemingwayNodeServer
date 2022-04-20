const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('authorization');

  // console.log(authHeader);

  if (!authHeader) {
    req.isAuth = false;
    return next();
  }
  
  const token = authHeader.split(' ')[1];
  
  if (!token || token === '') {
    req.isAuth = false;
    return next();
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.PRIVATE_KEY); //APP-SECRET KEY 
  } catch (err) {
    // console.log('NOT EXISTS');
    //if token not exists
    req.isAuth = false;
    return next();
  }
  
  //If token is not valid //@TODO: habría que comprobar username también
  if (!decodedToken) {
    // console.log('BADLY DECODE');
    req.isAuth = false;
    return next();
  }
  
  // if all previous conditions don't run token is valid
  req.isAuth = true;
  req.userId = decodedToken.userId; // data passed from auth.js in the jwt creation
  req.token = token;
  req.username = decodedToken.username; // data passed from auth.js in the jwt creation
  next();
};