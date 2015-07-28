const JotRoutes = require('../jot');
const JotsView = require('../../views/jots');
const PubSub = require('../../utility/pubsub');

class JotClientRoutes {
  constructor(router, prefix = '') {
    this.routes = new JotRoutes(router, prefix);

    this.jotsView = new JotsView();
  }

  registerRoutes() {
    this.routes.registerRoute('all', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (jots) => {
            this.jotsView.render(false, {
              jots
            });

            PubSub.publish('routeChanged', {
              name: 'Jots'
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

module.exports = JotClientRoutes;
