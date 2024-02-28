const express = require('express');
require('dotenv').config();

// Conatants
const app = express();
const PORT = process.env.PORT;
const mongoose = require('mongoose');
const clc = require('cli-color');
const bcrypt = require('bcrypt');
const validator = require('validator');
const session = require('express-session');
const mongodbSession = require('connect-mongodb-session')(session);

const userModel = require('./models/userModel');
const todoModel = require('./models/todoModel');
const { userDataValidation } = require('./utils/authUtils');
const {isAuth} = require('./middlewares/authMiddleware');
const {todoDataValidation} = require('./utils/todoUtils');
const {rateLimiting} = require('./middlewares/rateLimiting');


// Middlewares
app.set('express view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: new mongodbSession({
        uri: process.env.MONGO_URI,
        collection:'sessions'
    })
}))

app.use(express.static('public'));

// DB connection    
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log(clc.cyan.bold('Mongo Db connected')))
.catch((err)=>console.log(clc.redBright(err)));


// APIs
app.get('/', (req, res) => {
  res.send(`server running on the port ${PORT}`);
});

app.get('/register',(req,res)=>{
    res.render('registerPage.ejs');
})

app.post('/register', async (req,res)=>{
    console.log(req.body);
    const {name,email,username,password} = req.body;

    try{
        await userDataValidation({name,email,username,password});
    } 
    catch(err){
        return res.send({
            status : 400,
            message : 'User data error',
            error : err
        })
    }

    const userEmailAlreadyExists = await userModel.findOne({email});
    if(userEmailAlreadyExists){
        return res.send({
            status : 400,
            message : "Email already Exists"
        })
    }

    const userUsernameAlreadyExists = await userModel.findOne({username});
    if(userUsernameAlreadyExists){
        return res.send({
            status : 400,
            message : "Username already Exists"
        })
    }

    const hashedPassword = await bcrypt.hash(password,parseInt(process.env.SALT));

    const newUser = new userModel({
        name : name,
        email: email,
        username : username,
        password : hashedPassword
    });

    try{

        const userDb = await newUser.save();

        // return res.send({
        //     status : 201,
        //     message : 'Registered successfully',
        //     data : userDb
        // })

        return res.redirect('/login');

    } catch(err){
        return res.send({
            status : 500,
            message : 'Database error',
            error : err
        })
    }
})

app.get('/dashboard',isAuth,(req,res)=>{
    res.render('dashboardPage.ejs');
})

app.get('/login',(req,res)=>{
    res.render('loginPage.ejs');
})

app.post('/login', async (req,res)=>{
    console.log(req.body);

    const {loginId,password} = req.body;

    if(!loginId || !password){
        return res.send({
            status : 400,
            message: "Feilds should not be empty"
        })
    }

    try{
        let userData;
        if(validator.isEmail(loginId)){
            userData = await userModel.findOne({email:loginId});
        } else{
            userData = await userModel.findOne({username:loginId});
        }

        if(!userData){
            return res.send({
                status : 400,
                message: "User Not Found Invalid Credentials"
            })
        }

        const match = await bcrypt.compare(password,userData.password);

        if(!match){
            return res.send({
                status: 400,
                message: "Wrong Password"
            })
        }

        console.log(req.session);
        req.session.isAuth = true;
        req.session.userData = {
            id: userData._id,
            email: userData.email,
            username: userData.username
        }

        // return res.send({
        //     status: 200,
        //     message: "Log in Successfull"
        // })

        return res.redirect('/dashboard')

    } catch(err){
        return res.send({
            status: 500,
            message: "Database server Error",
            error: err
        })
    }
})


app.post('/logout',isAuth, (req,res)=>{
    req.session.destroy((err)=>{
        if(err){
            return res.send({
                status: 500,
                message: "Server Error",
                error: err
            })
        }
        return res.redirect('/login');
    })
})

app.post('/logout_from_all_devices',isAuth, async (req,res)=>{
    const username = req.session.userData.username;

    const sessionSchema = new mongoose.Schema({_id: String},{ strict: false});
    const sessionModel = mongoose.model('session',sessionSchema);

    try{
        const deleteDb = await sessionModel.deleteMany({
            "session.userData.username": username,
        });
        console.log(deleteDb);
        return res.status(200).redirect('/login');

    }catch(err){
        return res.send({
            status : 500,
            message: "Server error",
            error: err
        })
    }
})


app.post('/create-item',isAuth, rateLimiting, async (req,res)=>{
    const todoText = req.body.todo;
    const username = req.session.userData.username;

    try{
        await todoDataValidation({todoText});
    } 
    catch(err){
        return res.send({
            status : 400,
            message : 'todo data error',
            error : err
        })
    }

    const todoObj = new todoModel({
        todo : todoText,
        username : username
    });

    try{

        const todoDb = await todoObj.save();

        return res.send({
            status : 201,
            message: 'Todo created successfully',
            data : todoDb
        })

    } catch(err){
        return res.send({
            status : 500,
            message : 'Internal server error',
            error : err
        })
    }
})


app.get('/read-item',isAuth, async (req,res)=>{
    const username = req.session.userData.username;
    const SKIP = Number(req.query.skip) || 0; // Variable for skip which is passes as a query parameter
    const LIMIT = 5; // amount to skip

    try{
        // Use aggregation function to match the data with username and skip the data based on limit
        const todos = await todoModel.aggregate([
            {$match : {username: username}},
            {
                $facet : {
                    data : [{$skip: SKIP},{$limit : LIMIT}],
                },
            },
        ])

        if(todos[0].data.length === 0){
            return res.send({
                status : 400,
                message : SKIP === 0 ? 'No todo found' : 'No more todo found'
            })
        }

        return res.send({
            status : 200,
            message : 'Todo read successfully',
            data : todos[0].data
        })

    } catch(err){
        return res.send({
            status : 500,
            message : 'Internal server error',
            error : err
        })
    }
})

app.post('/edit-item',isAuth, async (req,res)=>{
    const {id,newText} = req.body;
    const username = req.session.userData.username;
 
    try{

        const todoDb = await todoModel.findOne({_id : id});

        if(!todoDb){
            return res.send({
                status : 400,
                message : 'Todo not found'
            });
        }

        if(username !== todoDb.username){
            return res.send({
                status : 403,
                message : 'User not authoirized to edit this todo'
            });
        }

        const prevTodo = await todoModel.findOneAndUpdate({_id:id},{todo:newText});

        return res.send({
            status : 200,
            message: 'Todo updated successfully',
            data : prevTodo
        })

    } catch(err){
        return res.send({
            status : 500,
            message : 'Internal server error',
            error : err
        })
    }
})

app.delete("/delete-item",isAuth, async (req,res)=>{
    console.log(req.body);
    const {id} = req.body;
    const username = req.session.userData.username;
    console.log(id,username);
 
    try{
        const todoDb = await todoModel.findOne({_id : id});
        console.log(todoDb);
        if(!todoDb){
            return res.send({
                status : 400,
                message : 'Todo not found'
            });
        }

        if(username !== todoDb.username){
            return res.send({
                status : 403,
                message : 'User not authoirized to edit this todo'
            });
        }

        const deletedTodo = await todoModel.deleteOne({_id : id});

        return res.send({
            status : 200,
            message: 'Todo deleted successfully',
            data : deletedTodo
        })

    } catch(err){
        return res.send({
            status : 500,
            message : 'Internal server error',
            error : err
        })
    }
})


app.listen(PORT, () => {
    console.log(clc.yellowBright(`Server is running`));
  console.log(clc.yellowBright.underline.bold(`http://localhost:${PORT}/`));
});