const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { ensureAuthenticated } = require('../helpers/auth');

// Load Pg Model
require('../models/Pg');
const Pg = mongoose.model('pgs');
// Load User Model
require('../models/User');
const User = mongoose.model('users');



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


// Pg Index Page
router.get('/', ensureAuthenticated, (req, res) => {
  Pg.find({ user: req.user.id })
    .sort({ date: 'desc' })
    .then(pgs => {
      res.render('pgs/index', {
        pgs: pgs
      });
    });
});

// Add Pg Form
router.get('/add', ensureAuthenticated, (req, res) => {
  if (req.user.role == "owner") {
    req.flash("success_msg", "Welcome");
    res.render('pgs/add');
  }
  else {
    req.flash("error_msg", "Register as Service Provider to Add PGs");
    res.render("./index");
  }
});

//Route for User's Cart
router.get("/cart", ensureAuthenticated,(req,res)=>{
  if(req.user.role == "user"){
  User.findOne({_id:req.user.id}).then(function(users){
    Pg.find({}).then((pgs)=>{
      res.render("pgs/cart",{
        pgs:pgs,users:users
      });
    });   
  });
}
else if(req.user.role == "owner"){
  Pg.find({user : req.user.id}).then(function(pgs){
      User.find({role:"user"}).then(function(users){
        res.render("pgs/retailercart",{
          pgs:pgs,
          users:users
        })
      })
  })
}
});

router.put("/bookrequest/:id", (req, res) => {
  User.findOne({ _id: req.user.id }).then(function (results) {
    results.requestedpg.push(req.params.id);
    results.save().then(() => {      
    });
  }).catch((err) => { console.log(err) });
  Pg.findOne({ _id: req.params.id }).then(function (result) {
    // console.log(req.user.id);
    flag = 0;
    for(i = 0 ; i < result.userrequests.length ; i++){
      if(result.userrequests[i] == req.user.id){
        flag = 1;
      }
    }
    if(flag == 0){
    result.userrequests.push(req.user.id);
    }
    result.save().then(() => {
      // res.redirect("/pgs/searchresult");
      req.flash("success_msg","Request Sent");          
      res.redirect("/pgs/cart");
     });
  });
});

//ViewRequest for PG (for retailer)
router.get("/viewrequest/:id", ensureAuthenticated, (req, res) => {
  Pg.findOne({ _id: req.params.id }).then(function (pgs) {
     User.find({ role: "user" }).then((users) => {
      res.render("pgs/viewrequest", { users: users, pgs: pgs });
    }).catch((err) => { console.log(err) });
  }).catch((err) => { console.log(err) });
});


//Remove from cart 
router.put("/removefromcart/:id", function (req, res) {
  User.findOne({ _id: req.user.id }).then(function (user) {
    for (let i = 0; i < user.requestedpg.length; i++) {
      if (user.requestedpg[i] == req.params.id) {
        user.requestedpg.splice(i, 1);
        user.save().then(function () {
          Pg.findOne({ _id: req.params.id }).then(function (pg) {
            for (j = 0; j < pg.userrequests.length; j++) {
              if (pg.userrequests[j] == req.user.id) {
                pg.userrequests.splice(j, 1);
                pg.save().then(function () {
                  req.flash("success_msg", "Request Deleted");
                  res.redirect("/pgs/cart");
                })
              }
            }
          })
        })
      }
    }
  })
});

//PUT Accept userrequest for PG form
router.put("/viewrequestaccept/:id1/:id2", function (req, res) {
  // console.log("Current user id : " + req.user.id + " User Id => " + req.params.id1 + " pgs id : = " + req.params.id2);
  User.findOne({_id: req.params.id1}).then(function (user) {
    var flag = 0;
    console.log("Hello Inside 1");

    for (let i = 0; i < user.bookedpg.length; i++) {
      if (user.bookedpg[i] == req.params.id2) {
        flag = 1;
      }
    }
    if (flag == 0) {
      user.bookedpg.push(req.params.id2);
    }
    for ( i = 0; i < user.requestedpg.length; i++) {
      if (user.requestedpg[i] == req.params.id2) {
        user.requestedpg.splice(i, 1);
        user.save().then(function () {
    console.log("Hello Inside 2");

          Pg.findOne({ _id: req.params.id2 }).then(function (pg) {
    console.log("Hello Inside 3");

            for (let j = 0; j < pg.userrequests.length; j++) {
              if (pg.userrequests[j] == req.params.id1) {
                pg.userrequests.splice(j, 1);
                pg.save().then(function () {
    console.log("Hello Inside 4");

                  req.flash("success_msg", "Request For PG Accepted");
                  res.render("pgs/viewrequest");
                }).catch((err) => { console.log("\nI am error 1\n" + err) });
              }
            }
          }).catch((err) => { console.log("\nI am error 2\n" + err) });
        }).catch((err) => { console.log("\nI am error 3\n" + err) });
      }
    }
  }).catch((err) => { console.log( "\nI am error 4\n" + err) });
});

//PUT Reject userrequest for PG form
router.put("/viewrequestreject/:id1/:id2", function (req, res) {
  User.findOne({ _id: req.params.id1 }).then(function (user) {
    console.log("Hello Inside 1");

    for (let i = 0; i < user.requestedpg.length; i++) {
      if (user.requestedpg[i] == req.params.id2) {
        user.requestedpg.splice(i, 1);
        user.save().then(function () {
          console.log("Hello Inside 2");

          Pg.findOne({ _id: req.params.id2 }).then(function (pg) {
            console.log("Hello Inside 3");
            for (j = 0; j < pg.userrequests.length; j++) {
              if (pg.userrequests[j] == req.params.id1) {
                pg.userrequests.splice(j, 1);
                pg.save().then(function () {
                  console.log("Hello Inside 4");
                  req.flash("success_msg", "Request For PG Rejected");
                  res.render("pgs/viewrequest");
                  // res.redirect("/pgs/viewrequest");
                }).catch((err) => { console.log("\nI am error 1\n" + err) });
              }
            }
          }).catch((err) => { console.log("\nI am error 2\n" +err) });
        }).catch((err) => { console.log("\nI am error 3\n" +err) });
      }      
    }
  }).catch((err) => { console.log("\nI am error 4\n" +err) });
});

//POST Search form request
router.post('/searchresult', (req, res) => {

  Pg.find({
    $or: [{ location: { $regex: req.body.search, $options: 'i' } },
    { city: { $regex: req.body.search, $options: 'i' } },
    { state: { $regex: req.body.search, $options: 'i' } }, { country: { $regex: req.body.search, $options: 'i' } }
    ]
  })
    .then(pgs => {
      res.render('pgs/searchresult', {
        pgs: pgs
      });
    });
});

router.post('/searchfilter', (req, res) => {
  if (req.body.location == undefined) {
    req.body.location = req.body.search;
    console.log(req.body.location);
  }
  if (req.body.gender) {
    req.body.gender = "any";
  }
  if (req.body.dealertype === undefined) {
    req.body.dealertype = "dealer";
  }
  if (req.body.max === undefined) {
    req.body.max = 50000;
  }
  Pg.find({
    $and: [{
      $or: [{ location: { $regex: req.body.location, $options: 'i' } },
      { city: { $regex: req.body.location, $options: 'i' } },
      { state: { $regex: req.body.location, $options: 'i' } }, { country: { $regex: req.body.location, $options: 'i' } }
      ]
    },
    { price: { $lte: req.body.max } }, { price: { $gte: req.body.min } },
    { dealertype: req.body.dealertype }, { gender: req.body.gender }
    ]
  })
    .then(pgs => {
      if (pgs.length == 0) {
        Pg.find({
          $or: [{
            $or: [{ location: { $regex: req.body.location, $options: 'i' } },
            { city: { $regex: req.body.location, $options: 'i' } },
            { state: { $regex: req.body.location, $options: 'i' } }, { country: { $regex: req.body.location, $options: 'i' } }
            ]
          },
          { $or: [{ $and: [{ price: { $lte: req.body.max } }, { price: { $gte: req.body.min } }] }, { dealertype: req.body.dealertype }, { gender: req.body.gender }] }
          ]
        }).sort({ price: 1 }).sort({ gender: 1 }).sort({ dealertype: 1 }).sort({ city: 1 }).then(pgs => {
          res.render('pgs/searchresult', {
            pgs: pgs
          });
        })
      }
      else {
        res.render('pgs/searchresult', {
          pgs: pgs
        });
      }
    }).catch(err => {
      console.log(err);
    });

});

// Edit Pg Form
router.get('/:id', ensureAuthenticated, (req, res) => {
  Pg.findOne({
    _id: req.params.id
  })
    .then(pg => {
      if (pg.user != req.user.id) {
        req.flash("error_msg", "Not Authorized");
        res.redirect("/pgs");
      }
      else {
        res.render('pgs/edit', {
          pg: pg
        });
      }
    });
});

// Process Form
router.post('/', ensureAuthenticated, (req, res) => {
  let errors = [];

  if (!req.body.location) {
    errors.push({ text: 'Please give location' });
  }
  if (!req.body.details) {
    errors.push({ text: 'Please add some details' });
  }
  if (!req.body.ownernumber) {
    errors.push({ text: 'Please add phone number' });
  }
  if (!req.body.ownername) {
    errors.push({ text: 'Please fill name' });
  }

  if (errors.length > 0) {
    res.render('/add', {
      errors: errors,
      location: req.body.location,
      details: req.body.details,
      ownernumber: req.body.ownernumber,
      ownername: req.body.ownername,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      price: req.body.price,
      gender: req.body.gender,
      dealertype: req.body.dealertype
    });
  } else {
    const newUser = {
      location: req.body.location,
      details: req.body.details,
      ownernumber: req.body.ownernumber,
      ownername: req.body.ownername,
      user: req.user.id,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      price: req.body.price,
      gender: req.body.gender,
      dealertype: req.body.dealertype
    }
    new Pg(newUser)
      .save()
      .then(pg => {
        req.flash('success_msg', 'Video pg added');
        res.redirect('/pgs');
      })
  }
});

//Post request for Image upload
router.post("/editupload/:id",   ensureAuthenticated, function(req,res){    // console.log(req.user.id);   
  console.log(req.params.id);
    upload(req,res,function(err){
        if(err){
            res.render("pgs/edit",{msg:err});
        }
        else {
            console.log(req.file.filename);
            if(req.file==undefined){
            res.render("pgs/edit",{
                msg:"Error : No File Selected"
            });
            }
            else{
                Pg.findOne({_id:req.params.id}).then(function(pg){
                    pg.pgimage = `/uploads/${req.file.filename}`;
                    pg.save().then(function(){}).catch((err)=>{console.log(err)});
                    res.render("pgs/edit",{
                      msg:"File Uploaded",
                      pg:pg
                      // photo:`/uploads/${pg.pgimage}`
                  });
                })
               
            }
        }
    });
  });



// Edit Form process
router.put('/:id', ensureAuthenticated, (req, res) => {
  // console.log(req.params.id);
  Pg.findOneAndUpdate({
    _id: req.params.id
  }, {
      // new values
      location: req.body.location,
      details: req.body.details,
      ownernumber: req.body.ownernumber,
      ownername: req.body.ownername,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      price: req.body.price,
      gender: req.body.gender,
      dealertype: req.body.dealertype
    })
    .then(function () {
      req.flash('success_msg', 'Pg updated');
      res.redirect('/pgs');
    })
});


// Delete Pg
router.delete('/:id', ensureAuthenticated, (req, res) => {
  Pg.remove({ _id: req.params.id })
    .then(() => {
      req.flash('success_msg', 'Pg removed');
      res.redirect('/pgs');
    });
});

//Post Book PG Request form
// router.put("/bookrequest/:id", (req, res) => {
//   console.log(req.user.id);
//   console.log(req.params.id);

//   User.findOne({ _id: req.user.id }).then(function (results) {
//     results.requestedpg.push(req.params.id);
//     results.save().then(() => { }).catch((err) => { console.log(err) });
//   }).catch((err) => { console.log(err) });

//   Pg.findOne({ _id: req.params.id }).then(function (result) {
//     console.log(result);
//     result.userrequests.push(req.user.id);
//     result.save().then(() => { }).catch((err) => { console.log(err) });
//   }).catch((err) => { console.log(err) });
//   res.send("Request Sent To Owner!");
// });

router.get("/bookrequest/:id", (req, res) => {
  User.findOne({ _id: req.user.id }).then(function (results) {
    results.requestedpg.push(req.params.id);
    results.save().then(() => { 
      Pg.findOne({ _id: req.params.id }).then(function (result) {
        // console.log(req.user.id);
        result.userrequests.push(req.user.id);
        result.save().then(() => {
          // res.redirect("/pgs/searchresult");
          req.flash("success_msg","Request Sent");          
          res.render("pgs/cart");
         })
         .catch((err) => { console.log(err) });
      }).catch((err) => { console.log(err) });
    }).catch((err) => { console.log(err) });
  }).catch((err) => { console.log(err) });
});



module.exports = router;