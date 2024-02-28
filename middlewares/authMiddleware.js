const isAuth = (req,res,next)=>{
        if(req.session.isAuth){
            next();
        } else{
            res.send({
                status : 401,
                message: "Session Expired, please login again"
            })
        }
    }

module.exports = {isAuth};