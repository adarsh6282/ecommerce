const passport=require("passport")
const GoogleStrategy=require("passport-google-oauth20").Strategy
const userSchema=require("../models/userModel")
const env=require("dotenv").config()

passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"https://takrum.onrender.com/auth/google/callback"
},

async(accessToken,refreshToken,profile,done)=>{
    try {
        
        let user=await userSchema.findOne({googleId:profile.id})
        if(user)
        {
            return done(null,user)
        }
        else{
            user=new userSchema({
                name:profile.displayName,
                email:profile.emails[0].value,
                googleId:profile.id
            })
            await user.save()
            return done(null,user)
        }
    } catch (err) {
        return done(err,null)
    }
}
))


passport.serializeUser((user,done)=>{
    done(null,user.id)
})

passport.deserializeUser((id,done)=>{
    userSchema.findById(id)
    .then(user=>{
        done(null,user)
    })
    .catch(err=>{
        done(err,null)
    })
})


module.exports=passport
