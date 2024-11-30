// const userModel = require('../models/userModel');

let checkBan = async (req, res, next) => {

    // if (req.session.user) { 
    //     const {email} = req.session.userData;
    //     console.log(email); 

    //     const user = await userModel.findOne({email });

    //     if (user && user.isDeleted) {
    //         return res.render('userban');
    //     }

        return next(); 
    // }
    // return next();
}

module.exports = checkBan;