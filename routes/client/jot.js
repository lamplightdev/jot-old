const JotRoutes = require('../jot');
const JotsView = require('../../views/jots');
const PubSub = require('../../utility/pubsub');

class JotClientRoutes {
  constructor(router, prefix, viewContainer) {
    this.routes = new JotRoutes(router, prefix);

    this.jotsView = new JotsView(viewContainer);
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
              name: 'Jots',
              order: [{
                name: 'Alpha',
                type: 'alpha',
                direction: 'asc',
                current: false
              }, {
                name: 'Date',
                type: 'date',
                direction: 'desc',
                current: false
              }, {
                name: 'Priority',
                type: 'priority',
                direction: 'asc',
                current: false
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

module.exports = JotClientRoutes;
