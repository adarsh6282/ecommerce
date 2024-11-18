const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kpadarsh083@gmail.com',
    pass: 'gkgv ahxl hxau fpfg',
  },
});


const sentOtpEmail=async(email,otp)=>{
  const mailOptions={
    from:"kpadarsh083@gmail.com",
    to:email,
    subject:"Your OTP Code",
    text:`Your OTP Code is ${otp}.It is Valid for 5 Minutes` 
  };
  try {
    await transporter.sendMail(mailOptions)
    
    console.log(("OTP sent Successfully"));
  } catch (error) {
      console.error("Error sending OTP",error)
  }
};

module.exports = {sentOtpEmail};