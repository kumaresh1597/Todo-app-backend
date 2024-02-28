const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const user_schema = new Schema({

    name : {
        type : String,
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true
    },
    username :{
        type : String,
        required : true,
        unique : true
    },
    password : {
        type : String,
        required : true,
    }
});

// const userModel = mongoose.model('user', user_schema);
// module.exports = userModel;

module.exports = mongoose.model('User', user_schema); // file name is used