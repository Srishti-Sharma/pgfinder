const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const router = express.Router();
const { ensureAuthenticated } = require('../helpers/auth');

// Load User Model
require('../models/User');
const User = mongoose.model('users');

// Load User Model
require('../models/Pg');
const Pg = mongoose.model('pgs');


// Adminpanel Route
router.get('/adminpanel', ensureAuthenticated, (req, res) => {
  res.render('admin/adminpanel');
});

//Customerlist Route
router.get('/customerlist', ensureAuthenticated, (req, res) => {
  User.find({ role: "user" })
    .then(users => {
      res.render('admin/customerlist', {
        users: users
      });
    });
});

//Retialerlist Route
router.get('/retailerlist', ensureAuthenticated, (req, res) => {
  User.find({ role: "owner" })
    .then(users => {
      res.render('admin/retailerlist', {
        users: users
      });
    });
});

//PGlist Route
router.get('/pglist', ensureAuthenticated, (req, res) => {
  Pg.find({})
    .then(pgs => {
      User.find({role:"owner"}).then(users=>{  
        res.render('admin/pglist', {
          pgs:pgs ,
          users:users         
        });
      })      
    });
});

//Remove Customer or Retailer 
router.delete('/:id', ensureAuthenticated, (req, res) => {
  Pg.remove({user: req.params.id}).then(() => {
     User.deleteOne({ _id: req.params.id })
    .then(() => {
      req.flash('success_msg', 'One Entry Removed');
      res.redirect('/admin/adminpanel');
    });
  });
});

module.exports = router;