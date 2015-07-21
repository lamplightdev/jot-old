const HomeRoutes = require('../home');

class HomeRouter {
  constructor(router) {
    this.router = router;
    this.routes = new HomeRoutes(router);
  }

  registerRoutes() {
    this.routes.registerRoute('home', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (events) => {
            res.render('app', {
              name: 'Home',
              content: 'home'
            });
          },

          reject: next
        };
      });
    });

    return this.router;
  }
}

module.exports = HomeRouter;
