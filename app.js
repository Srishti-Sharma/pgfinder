const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const methodOverride = require('method-override');
const session = require('express-session');
const passport = require('passport');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
// var multer = require('multer'); 

const app = express();
app.use(express.static(path.join(__dirname + '/public')));


//Load routes
const pgs = require("./routes/pgs");
const users = require("./routes/users");
const admin = require("./routes/admin");

// Passport Config
require('./config/passport')(passport);


//Handlebars helpers
const {
    compare,
    findName,
    searchName,
    checkPending,
    checkApproval,
    searchPG,
    searchUser
} = require("./helpers/hbs")

//Map global promise to get rid of warning
mongoose.Promise = global.Promise;
//Connect to mongoose
mongoose.connect("mongodb://localhost/pgfinder",{
     useNewUrlParser:true
})
.then(function(){
    console.log("MongoDb Connected")
})
.catch(function(err){
    console.log(err);
});

//Load PG Model
require("./models/User");
const User = mongoose.model("users");

//Handlebars Middleware
app.engine('handlebars', exphbs({ 
    helpers:{compare , findName,searchName,checkPending,checkApproval,searchPG,searchUser},
    defaultLayout : 'main' }));
app.set('view engine','handlebars');



const port = 8000;

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Static folder
//Including static css and js files

// app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
app.use(methodOverride('_method'));

// Express session midleware
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

// Global variables
app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');  
  res.locals.user = req.user || null;
  next();
});

//Index Route
app.get("/",function(req,res){
    res.render("index");
});
//About Route
app.get("/about",function(req,res){
    res.render("about");
});
//Profile Route
app.get("/userprofile",function(req,res){
    res.render("userprofile",{ file:`/uploads/${req.user.profileimage}`});
});

//Use routes
app.use("/pgs",pgs);
app.use("/users",users);
app.use("/admin",admin);

app.listen(port,function(){
    console.log(`Server started on port ${port}`);
});