const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('./models/user');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const jwt = require('jsonwebtoken');
const FacebookTokenStrategy = require('passport-facebook-token');

const config = require('./config');

exports.local = passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// creates the json web token
exports.getToken = function(user) {
  return jwt.sign(user, config.secretKey, {
    expiresIn: 30*24*3600 // an hour later you have to renew the jwt
  })
};

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = config.secretKey;

// done callback provided by passport - passing back info to passport to load to request message 
// done takes 3 parameters, 
exports.jwtPassport = passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
  console.log('JWT payload', jwt_payload);
  User.findOne({ _id: jwt_payload._id }, (err, user) => {
    if(err) {
      return done(err, false);
    } else if(user) {
      return done(null, user);
    } else {
      return done(null, false); // could not find user
    }
  })
}));


// used to verify an incoming user
// passport.authenticate - jwt strategy configured above
// session is false because we are using token-based authentication
exports.verifyUser = passport.authenticate('jwt', { session: false });


// verifyUser loads new property named user to req with user details
exports.verifyAdmin = (req, res, next) => {
  // console.log('***req.user***', req.user)
  User.findOne({ username: req.user.username }, function (err, user) {
    if (err || !req.user.admin) {
      err = new Error(`You are not authorized to perform this operation!`);
      err.status = 403;
      return next(err);
    }
    // Pass to next
    next();
  });
};

exports.facebookPassport = passport.use(
  new FacebookTokenStrategy({
    clientID: config.facebook.clientId,
    clientSecret: config.facebook.clientSecret
  }, (accessToek, refreshToken, profile, done) => {
    
    User.findOne({ facebookId: profile.id }, (err, user) => {
      if(err) {
        return done(err, false);
      }
      // check if user logged in earlier
      if(!err && user != null) {
        return done(null, user);
      } else { // user does not exist - create new user
        user = new User({ username: profile.displayName });
        user.facebookId = profile.id;
        user.firstname = profile.name.givenName;
        user.lastname = profile.name.familyName;
        user.save((err, user) => {
          if(err) {
            return done(err, false);
          } else {
            return done(null, user);
          }
        })
      }
    });
  })
);