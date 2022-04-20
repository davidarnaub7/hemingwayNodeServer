
const fs = require('fs');
const {authUsernameFilter} = require('../../functions/filters');

module.exports =  {
    suggestion : async(args, req) =>{
        const {username, suggestion} =  args;
        
        /**
         * SECURITY FILTERS
        */
        if(!req.isAuth || req.username !== args.username){  //If user is not authenticated
            throw new Error('Next time machine')
        }  

        if(authUsernameFilter(username)){        //FILTER
            throw new Error('Invalid Profile Data');
        }

        //PROCESIING REQUEST SECURIZATION
        return new Promise((resolve, reject) => {
        
             fs.appendFile('suggestions.csv', username+";"+suggestion+new Date().toISOString() + "\n", 'utf8', function (err) {
                    if (err) {
                        console.log('Some error occured - file either not saved or corrupted file saved.');
                    } else{
                        console.log('It\'s saved!');
                        resolve('Success');
                    }
                });
        })
        

    }
}