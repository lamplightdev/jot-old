const HomeRoutes = require('../home');

class HomeRouter {
  constructor(router) {
    this.router = router;
    this.routes = new HomeRoutes(router);
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
        title: 'Groups',
        link: '/group'
      }]
    };

    this.routes.registerRoute('home', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (events) => {
            res.render('app', Object.assign(routeParams, {
              name: 'Home',
              content: 'home'
            }));
          },

          reject: next
        };
      });
    });

    return this.router;
  }
}

module.exports = HomeRouter;
