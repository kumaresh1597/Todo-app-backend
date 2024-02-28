const accessModel = require("../models/accessModel");

const rateLimiting = async (req,res,next) => {

    // Getting the current session Id
    const sessionId = req.session.id;

    try{
        // Checking if the session exists
        const accessDb = await accessModel.findOne({sessionId: sessionId});

        // If not found, creating a new access model with current time
        if(!accessDb){
            const accessObj = new accessModel({
                sessionId: sessionId,
                time: Date.now()
            })

            await accessObj.save();
            next();
            return;
        }
        
        // If found, checking if the current time is less than 1 second, then reject the request
        if((Date.now() - accessDb.time) < 1000){
            return res.send({
                status : 429,
                message: "Too Many Requests"
            })
        }

        // If the current time is more than 1 second, then update the access time
        await accessModel.findOneAndUpdate({sessionId: sessionId},{time : Date.now()});
        next();      

    } catch(err){

        return res.send({
            status : 500,
            message: "Server error from rateLimiting",
            error : err
        })
    }   
}

module.exports = {rateLimiting};