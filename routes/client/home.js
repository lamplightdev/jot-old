const HomeRoutes = require('../home');
const HomeView = require('../../views/home');
const PubSub = require('../../utility/pubsub');

class HomeRouter {
  constructor(router, prefix, viewContainer) {
    this.routes = new HomeRoutes(router, prefix);

    this.homeView = new HomeView(viewContainer);
  }

  registerRoutes() {
    this.routes.registerRoute('home', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (events) => {
            this.homeView.render(false, {});

            PubSub.publish('routeChanged', {
              name: 'Home',
              order: [],
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
            });
          },

          reject: (err) => {
            throw new Error(err);
          }
        };
      });
    });
  }
}

module.exports = HomeRouter;
