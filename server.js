const express=require("express")
const app= express()
const userRoutes=require("./routes/user/userRoutes")
const adminRoutes=require("./routes/admin/adminRoutes")
const path=require("path")
const connectDB = require("./config/connectDB")
const session=require("express-session")
const passport = require("./config/passport")
const nocache=require("nocache")
const auth=require("./middleware/auth")
const checkBan=require("./middleware/bancheck")
const {cartCount,wishCount}=require("./middleware/cartandwishcount")

app.use(session({
    secret:"secretkey",
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:1000*60*60*24
    }
}))

app.use((req, res, next) => {
    res.locals.currentRoute = req.path;
    next();
});
app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"))
app.use(nocache())
app.use(passport.initialize())
app.use(passport.session())


app.use(express.static(path.join(__dirname,"public")))
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(cartCount)
app.use(wishCount)
app.use(auth)
app.use(checkBan)

connectDB()
app.use("/",userRoutes)
app.use("/admin",adminRoutes)
app.listen(3000,()=>{
    console.log("server started");
})