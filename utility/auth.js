'use strict';

const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

function serialization() {
  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });
}

function Google() {
  try {
    passport.use(new GoogleStrategy({
        clientID: process.env.EVENTDASH_GOOGLE_ID,
        clientSecret: process.env.EVENTDASH_GOOGLE_SECRET,
        callbackURL: process.env.EVENTDASH_HOST_PROTOCOL +
         '://' +
         process.env.EVENTDASH_HOST_NAME +
         '/auth/google/callback'
      },

      function(accessToken, refreshToken, profile, done) {
        done(null, profile);
      }

    ));
  } catch (e) {
    console.log(e);
  }
}

module.exports.serialization = serialization;
module.exports.Google = Google;
