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

          preAction: () => {
            PubSub.publish('routeChanged', {
              name: 'Jot',
              order: [],
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
            });

            this.homeView.render(false, {
              loading: true
            });
          },

          resolve: stats => {
            this.homeView.render(false, {
              stats
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
