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

  _commonParams(req) {
    return {
      menuOpen: req.query.menu && req.query.menu === 'open',
    };
  }

  registerRoutes() {
    const routeParams = {
      tabs: [{
        title: 'Home',
        link: '/',
      }, {
        title: 'Jots',
        link: '/jot',
      }, {
        title: 'Lists',
        link: '/group',
      }],
    };

    this.routes.registerRoute('authGoogle', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (authenticate) => {
            passport.authenticate('google', {
              scope: [
                'openid email',
              ],

              // loginHint: req.user ? req.user.getEmail() : null
            })(req, res, next);
          },

          reject: next,
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

              let photo = null;
              if (user.photos[0].value) {
                photo = user.photos[0].value.replace(/sz=\d+$/, 'sz=100');
              }

              cloudantClient.createUser('google', user.id, user.emails[0].value, user.displayName, photo).then(userDoc => {
                req.logIn(userDoc, (err) => {
                  if (err) {
                    return next(err);
                  }
                  return res.redirect('/jot');
                });
              }, next);
            })(req, res, next);
          },

          reject: next,
        };
      });
    });

    this.routes.registerRoute('user', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: () => {
            res.json(req.user || false);
          },

          reject: next,
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

          reject: next,
        };
      });
    });

    this.routes.registerRoute('import', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: () => {
            res.render('app', Object.assign(this._commonParams(req), routeParams, {
              content: 'import',
            }));
          },

          reject: next,
        };
      });
    });

    this.routes.registerRoute('continue', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: () => {
            res.render('app', Object.assign(this._commonParams(req), routeParams, {
              content: 'continue',
            }));
          },

          reject: next,
        };
      });
    });

    return this.router;
  }
}

module.exports = AuthRouter;
