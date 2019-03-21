const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
  firstname: {
    type: String,
    default: ''
  },
  lastname: {
    type: String,
    default: ''
  },
  facebookId: String,
  admin: {
    type: Boolean,
    default: false
  }
});

// username + password automatically added by passport plugin
User.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', User);