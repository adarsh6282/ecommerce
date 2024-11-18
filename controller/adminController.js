const mongoose=require("mongoose")
const adminSchema=require("../models/adminModel")
const userSchema=require("../models/userModel")

const loadAdminLogin=(req,res)=>{
    res.render("admin-login")
}

const loadDashboard=async(req,res)=>{
    res.render("admin-dashboard")
}

const loadUsermanage=async(req,res)=>{
    try {
        const users=await userSchema.find({role:"user"})
        if(!users)
        {
          return  res.render("admin-usermanagement",{messsage:"no users found"})
        }
        return res.render("admin-usermanagement",{user:users})
        
    } catch (error) {
        console.error("error while loading users",error)
    }
}

const loginAdmin=async(req,res)=>{
    const {email,password}=req.body
    
    try {
        const admin=await userSchema.findOne({email:email,password:password,role:"admin"})
        if(admin){
            req.session.admin=true
            res.redirect("/admin/dashboard")
        }else{
            return res.render("admin-login",{message:"admin not found"})
        }
        
    } catch (error) {
        console.log(error)
    }
}

const userBan = async (req, res) => {
    try {
        const email = req.query.email;

        const user = await userSchema.findOne({ email: email });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isDeleted = !user.isDeleted;
        await user.save();

        const status = user.isDeleted ? 'banned' : 'unbanned';
        return res.status(200).json({ message: `User ${status} successfully`,isDeleted:user.isDeleted});
    } catch (error) {
        console.error('Error banning/unbanning user:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const loadUserView = async (req, res) => {
    try {
        const {email}=req.query;
        
        const user = await userSchema.findOne({ email:email });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        res.json({
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('Error fetching user information:', error.message);
        res.status(500).json({ message: 'Error fetching user information' });
      }
    };

module.exports={
    loadAdminLogin,
    loadUsermanage,
    loginAdmin,
    loadDashboard,
    userBan,
    loadUserView
}