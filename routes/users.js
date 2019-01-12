const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const router = express.Router();
const path = require("path");
const multer = require("multer");
const xoauth2 = require("xoauth2");
const nodemailer = require("nodemailer");

const { ensureAuthenticated } = require('../helpers/auth');
// router.use(flash());

router.use(session({
  secret: "secret",
  resave: true,
  saveUninitialized: true
}));

//Set Storage Engine
const storage = multer.diskStorage({
  destination : "./public/uploads/",
  filename : function(req,file,cb){
      cb(null,file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
});

//Init Upload
const upload = multer({
  storage : storage,
  limits: {fileSize: 10000000},
  fileFilter : function(req,file,cb){
      checkFileType(file,cb);
  }
}).single("myImage");

//Check filetype
function checkFileType(file,cb){
  const filetypes = /jpeg|jpg|png|gif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype= filetypes.test(file.mimetype);

  if(mimetype && extname){
      return cb(null,true);
  }
  else{
      cb("Error: Image Only");
  }
};

// Load User Model
require('../models/User');
const User = mongoose.model('users');

//Change Password
router.get("/changepassword", (req, res) => {
  res.render("users/changepassword");
})

// User Login Route
router.get('/login', (req, res) => {
  if(req.user!=undefined){
    res.redirect('/');
  }
  else{
  res.render('users/login');
  }
});

// User Register Route
router.get('/register', (req, res) => {
  res.render('users/register');
});

//User profile Route
router.get("/profile", ensureAuthenticated, function (req, res) {
  res.render("users/profile");
});

// Edit Pg Form
router.get('/editprofile', ensureAuthenticated, (req, res) => {
  User.findOne({
    _id: req.user.id
  })
    .then(user => {
      if (user.id != req.user.id) {
        req.flash('error_msg', "Not Authorized");
        // res.redirect("/users/userprofile"); i think it is wrong so i corrected it below today , 7jan2019 
        res.redirect("/users/profile");

      }
      else {
        res.render('users/editprofile', {
          file:`/uploads/${req.user.profileimage}`,
          user: user
        });
      }
    }).catch(function (err) {
      console.log(err);
    });
});



//Post form of Image upload
router.post("/upload",   ensureAuthenticated, function(req,res){  
  console.log(req.user.id);   
  upload(req,res,function(err){
      if(err){
          res.render("users/profile",{msg:err});
      }
      else {
          console.log(req.file.filename);
          if(req.file==undefined){
          res.render("users/profile",{
              msg:"Error : No File Selected"
          });
          }
          else{
              User.findOne({_id:req.user.id}).then(function(user){
                  user.profileimage = `/uploads/${req.file.filename}`;
                  user.save().then(function(user){
                    res.render("users/profile",{
                      msg:"File Uploaded",
                      user:user
                  });
                  });
              })            
          }
      }
  });
});


router.post("/editupload",   ensureAuthenticated, function(req,res){    // console.log(req.user.id);   

  upload(req,res,function(err){
      if(err){
          res.render("users/editprofile",{msg:err});
      }
      else {
          console.log(req.file.filename);
          if(req.file==undefined){
          res.render("users/editprofile",{
              msg:"Error : No File Selected"
          });
          }
          else{
              User.findOne({_id:req.user.id}).then(function(user){
                  user.profileimage = `/uploads/${req.file.filename}`;
                  user.save().then(function(user){
                    res.render("users/editprofile",{
                      msg:"File Uploaded",
                      user:user
                  });
                  }).catch((err)=>{console.log(err)});
              })
             
          }
      }
  });
});



//Profile form Post
router.put('/profile', ensureAuthenticated, function (req, res) {  
  User.findOneAndUpdate({ _id: req.user.id }, {
    gender: req.body.gender,
    phonenumber: req.body.phonenumber,
    address: req.body.address
  }).then(function (user) {
    res.redirect("/userprofile",{ user:user});
  });
});

//login form post
router.post('/login', function (req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      req.flash("error_msg", "Email or Password is wrong");
    }
    if (!user) {
      req.flash("error_msg", info.message);
      return res.redirect("/pgs");
    }
    req.logIn(user, function (err) {
      if (err) { return next(err); }
      if (user.role == "user") {
        if ((user.gender != undefined) && (user.address != undefined) && (user.phonenumber != undefined)) {
          return res.redirect("../");
        }
        else {
          return res.redirect("/users/profile");
        }
      }
      else if (user.role == "owner") {
        if ((user.gender != undefined) && (user.address != undefined) && (user.phonenumber != undefined)) {
          return res.redirect("/pgs/add");
        }
        else {
          return res.redirect("/users/profile");
        }
      }
      else if (user.role == "admin") {
        return res.redirect("/admin/adminpanel");
      }
    });
  })(req, res, next);
});

// Login Form POST
// router.post('/login', (req, res, next) => {
//   User.find({ email: req.body.email }).then(function (user) {
//     if (user) {
//       if (user.role== "user") {
//         passport.authenticate('local', {
//           successRedirect: '/index',
//           failureRedirect: '/users/login',
//           failureFlash: true
//         })(req, res, next);
//       }
//       else if (user.role== "owner") {
//         passport.authenticate('local', {
//           successRedirect: '/users/profile',
//           failureRedirect: '/users/login',
//           failureFlash: true
//         })(req, res, next);
//       }
//       else if (user.role== "admin") {
//         passport.authenticate('local', {
//           successRedirect: '/users/adminpanel',
//           failureRedirect: '/users/login',
//           failureFlash: true
//         })(req, res, next);
//       }      
//     }
//     else {
//       passport.authenticate('local', {
//         successRedirect: '/users/profile',
//         failureRedirect: '/users/login',
//         failureFlash: true
//       })(req, res, next);
//     }
//   })

// });

// Register Form POST
router.post('/register', (req, res) => {
  let errors = [];

  if (req.body.password != req.body.confirmpassword) {
    errors.push({ text: 'Passwords do not match' });
  }

  if (req.body.password.length < 4) {
    errors.push({ text: 'Password must be at least 4 characters' });
  }

  if (errors.length > 0) {
    res.render('users/register', {
      errors: errors,
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      confirmpassword: req.body.confirmpassword,
      role: req.body.role
    });
  } else {
    User.findOne({ email: req.body.email })
      .then(user => {
        if (user) {
          req.flash('error_msg', 'Email already regsitered');
          res.redirect('/users/register');
        } else {



          const output = `
          <p> You have a new Contact Request</p>
          <h3>Contact Details</h3>
          <ul>
              <li>Name: ${req.body.name}</li>
              <li>Company: ${req.body.company}</li>
              <li>Email: ${req.body.email}</li>
              <li>Phone: ${req.body.phone}</li>
          </ul>
          <h3>Message : </h3>
          <p>${req.body.message}</p>
          `;
        
          var transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                  type:"OAuth2",
                  user: 'noreply.pgfinder@gmail.com',
                  clientId: "932685266477-ui4qc82h0ge1a8prkmspv1rt36l2ln96.apps.googleusercontent.com",
                  clientSecret: "ufUUL4ZVFDNqtpZQ32IJciyk",
                  refreshToken: "1/cMEPN_6OK99ftp3o3aASNJtxQmh0gyXJGTr8Jw_Bq20"     
              }
          });    
          
          // // setup email data with unicode symbols
          let mailOptions = {
              from: 'PGfinder <noreply.pgfinder@gmail.com>', // sender address
              to: req.body.email, // list of receivers
              subject: 'Hello ', // Subject line
              text: 'Hello world?', // plain text body
              html: output + "<br><B>Mail From Your wellwisher</B>"// html body
          };
          
          // // send mail with defined transport object
          transporter.sendMail(mailOptions, (error, res) => {
              if (error) {
                  return console.log(error);
              }
              else{
                  console.log("Email sent");
              // console.log('Message sent: %s', info.messageId);
               
              }
          });
          const newUser = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            confirmpassword: req.body.confirmpassword,
            role: req.body.role
          });

          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              newUser.save()
                .then(user => {
                  req.flash('success_msg', 'You are now registered and can log in');
                  res.redirect('/users/login');
                })
                .catch(err => {
                  console.log(err);
                  return;
                });
            });
          });
        }
      });
  }
});

// Edit Form process
router.put('/editprofile', ensureAuthenticated, (req, res) => {
  User.findOne({
    _id: req.user.id
  })
    .then(user => {
      // console.log(`user found by id :` + user.email);
      // new values user.email: req.body.email,
      user.name = req.body.name,
        user.email = req.body.email,
        user.gender = req.body.gender,
        user.phonenumber = req.body.phonenumber,
        user.address = req.body.address
      user.save()
        .then(user => {
          req.flash('success_msg', 'Profile updated');
          res.redirect('/userprofile');
        })
    }).catch(err => {
      console.log(err);
    })
});



router.put("/changepassword",ensureAuthenticated,function(req,res){
  User.findOne({_id:req.user.id}).then(function(result){  
  bcrypt.compare(req.body.cpassword,result.password,function(err,isMatch){
  if(err){
  throw err;
  }
  if(isMatch){
  bcrypt.genSalt(10,function(err,salt){
  bcrypt.hash(req.body.password,salt,function(err,hash){
  if(err){
  throw err;
  }
  User.findOneAndUpdate({_id:req.user.id},{
  password:hash
  }).then(function(){
  req.flash("success_msg","Successfully Updated");
  res.redirect("/users/profile");
  }).catch(function(err){
  console.log(err);
  return;
  });
  });
  });
  }
  else{
  req.flash("error_msg","Old Password Incorrect");
  res.redirect("/changepassword");
  }
  });
  });
  });




//Change passwrd post request
// router.put('/changepassword', ensureAuthenticated, function (req, res) {
//   let flag=0;
//      User.findOne({
//         _id: req.user.id
//       }).then(user => {
//         if (user) {
//         // Match password
//         bcrypt.compare(req.body.cpassword, user.password, (err, isMatch)  => {
//           if (err) throw err;
//           if (isMatch) {
//                 console.log("Password matched");
//                 bcrypt.genSalt(10, (err, salt) => {
//                   bcrypt.hash(req.body.password, salt, (err, hash) => {
//                     console.log(req.body.password);
//                     if (err) throw err;
//                     else{
//                     User.findOneAndUpdate({_id:req.user.id},{password: hash});
//                     // user.password = hash;
//                     req.flash('success_msg', 'Password changed successfully');
//                        res.redirect('/users/profile');
//                     }
//                   });
//                 });
//           } else {
//             console.log("Passwd cannot be changed ===ERROR====")
//           }
//         });
//       }
//       })
//       .catch(err=>{
//         console.log(err);
//       });  
// });

// Logout User
router.get('/logout', ensureAuthenticated, (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;