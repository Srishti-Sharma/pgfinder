const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const PgSchema = new Schema({
    location: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    ownername: {
        type: String,
        required: true
    },
    ownernumber: {
        type: Number,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required : false
    },
    state: {
        type: String,
        required : false
    },
    country: {
        type: String,
        required: false
    },
    price:{
        type: Number,
        required: false
    },
    gender: {
        type: String,
        required : false,
        Default: "any"
    },
    ratings:{
        type: Number,
        required: false,
        Default : 3
    },
    dealertype: {
        type:String,
        required:false,
        Default: "owner"
    },
    date: {
        type: Date,
        Default: Date.now()
    },
    userrequests:[String],
    pgimage:{
        type: String,
        required : true,
        default : "/uploads/house.jpg"
    }

});
mongoose.model('pgs', PgSchema);
