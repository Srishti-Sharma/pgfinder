const mongoose = require('mongoose');

// Load User Model
require('../models/User');
const User = mongoose.model('users');


module.exports = {
    compare: function (s1, op, s2) {
        if (op == "==") {
            if (s1 == s2) {
                return true;
            }
            else {
                return false;
            }
        }
    },
    findName: function (key, s2) {
        for (i = 0; i < s2.length; i++) {
            if (key == s2[i]._id) {
                return s2[i].name;
            }
        }
    },
    searchName: function (key, name, s2) {
        for (j = 0; j < s2.length; j++) {
            if (key == s2[j]) {
                return name;
            }
        }
    },
    checkPending: function (pgid, uid) {
      let flag = 0;
        for (let i = 0; i < uid.requestedpg.length; i++) {
            if (pgid == uid.requestedpg[i]) {
                flag = 1;
            }
        }
        return 0;
    },
    checkApproval: function (pid, uid) {
        for (j = 0; j < uid.bookedpg.length; j++) {
            if (pid == uid.bookedpg[j]) {
                return 1;
            }
        }
        return 0;
    },
    searchPG: function(pid ,pg){
        // console.log(pid+" "+ pg)
        for(let i = 0 ; i < pg.length ; i++){
           if(pid == pg[i]){
               return 1;
           }
        }
    },
    searchUser: function(arr , pgs ,pglocation,pgprice){
        for(let i = 0 ; i < arr.length; i++){
            for(let j = 0 ; j < pgs.length ; j++){
                if(arr[i] == pgs[j].id ){
                    pglocation=pgs[j].location;
                    pgprice=pgs
                    return 1;
                }
            }
        }
    }
};