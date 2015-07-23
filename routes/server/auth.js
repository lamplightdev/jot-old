const AuthRoutes = require('../auth');
const passport = require('passport');

const cloudantClient = require('../../db/cloudant-client')(
  process.env.JOT_CLOUDANT_ACCOUNT,
  process.env.JOT_CLOUDANT_PASSWORD
);

class AuthRouter {
  constructor(router) {
    this.router = router;
    this.routes = new AuthRoutes(router);
  }

  registerRoutes() {
    this.routes.registerRoute('authGoogle', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (authenticate) => {
            passport.authenticate('google', {
              scope: [
                'openid email'
              ]

              //loginHint: req.user ? req.user.getEmail() : null
            })(req, res, next);
          },

          reject: next
        };
      });
    });

    this.routes.registerRoute('callbackGoogle', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: () => {
            passport.authenticate('google', (err, user) => {
              if (err) {
                return next(err);
              }

              if (!user) {
                return res.redirect('/');
              }

              cloudantClient.createUser('google', user.id, user.emails[0].value, user.displayName).then(userDoc => {
                req.logIn(userDoc, (err) => {
                  if (err) {
                    return next(err);
                  } else {
                    return res.redirect('/notes');
                  }
                });
              }, next);
            })(req, res, next);
          },

          reject: next
        };
      });
    });

    this.routes.registerRoute('signout', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: () => {
            req.logOut();
            res.redirect('/');
          },

          reject: next
        };
      });
    });

    return this.router;
  }
}

module.exports = AuthRouter;
