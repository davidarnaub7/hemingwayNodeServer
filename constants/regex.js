exports.usernameRegex = /^[a-z][a-z._0-9]+$/;
exports.passwdRegex =/^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/;
exports.latitudeRegex = /^(-?[1-8]?\d(?:\.\d{1,18})?|90(?:\.0{1,18})?)$/;
exports.longitudeRegex = /^(-?(?:1[0-7]|[1-9])?\d(?:\.\d{1,18})?|180(?:\.0{1,18})?)$/;
exports.emailAdRegex = /^[a-z0-9.!_]+@[a-z0-9-]+(?:\.(com|es))$/;
exports.emailRegex =  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)*$/;
exports.fullNameRegex = /^[a-zA-Z ]+$/;
exports.base64Regex = /^(?:[a-zA-Z0-9+\/]{4})*(?:|(?:[a-zA-Z0-9+\/]{3}=)|(?:[a-zA-Z0-9+\/]{2}==)|(?:[a-zA-Z0-9+\/]{1}===))$|^$/;
exports.socialRegex = /^[a-z][a-z._0-9]+$|^$/;
exports.textRegex = /^[a-zA-Z0-9_]*$/
exports.telephoneRegex = /^[679]{1}[0-9]{8}$/;
exports.mongoIDRegex = /^[a-z-]{4,20}$/