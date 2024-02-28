
const validator = require('validator');

const userDataValidation = ({name,email,username,password}) => {
    return new Promise((resolve,reject)=>{
        if(!name){
            return reject('name is required');
        }
        if(!email){
            return reject('email is required');
        }
        if(!username){
            return reject('username is required');
        }
        if(!password){
            return reject('password is required');
        }

        if(typeof(name) !== 'string') reject('name should be text format');
        if(typeof(email) !== 'string') reject('email should be text format');
        if(typeof(username) !== 'string') reject('username should be text format');
        if(typeof(password) !== 'string') reject('password should be text format');

        if(username.length <= 2 || username.length > 20) reject('username must have length between 3 and 20 characters');

        if (password.length <= 2 || password.length > 20) reject("password length should be 3-20");

        // if(!validator.isAlphanumeric(password)) reject('password must contain a-z, A-Z, 0-9');
        if(!validator.isEmail(email)) reject('Not a email format');

        resolve();
    });
}

module.exports = {userDataValidation};