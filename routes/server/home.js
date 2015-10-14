const HomeRoutes = require('../home');

class HomeRouter {
  constructor(router) {
    this.router = router;
    this.routes = new HomeRoutes(router);
  }

  _commonParams(req) {
    return {
      menuOpen: req.query.menu && req.query.menu === 'open'
    };
  }

  registerRoutes() {
    const routeParams = {
      tabs: [{
        title: 'Home',
        link: '/',
        current: true
      }, {
        title: 'Jots',
        link: '/jot'
      }, {
        title: 'Lists',
        link: '/group'
      }]
    };

    this.routes.registerRoute('home', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: stats => {
            res.render('app', Object.assign(this._commonParams(req), routeParams, {
              name: 'Jot',
              content: 'home',
              stats
            }));
          },

          reject: err => {
            if (!req.user) {
              res.render('app', Object.assign(this._commonParams(req), routeParams, {
                name: 'Jot',
                content: 'home'
              }));
            } else {
              next(err);
            }
          }
        };
      });
    });

    return this.router;
  }
}

module.exports = HomeRouter;
