const JotRoutes = require('../jot');
const JotsView = require('../../views/jots');
const PubSub = require('../../utility/pubsub');

const Jot = require('../../models/jot');

class JotClientRoutes {
  constructor(router, prefix = '') {
    this.routes = new JotRoutes(router, prefix);

    this.jotsView = new JotsView();
  }

  registerRoutes() {
    this.routes.registerRoute('all', (ctx, next) => {
      return Jot.loadAll().then(jots => {
        return {
          params: {},

          resolve: (events) => {
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
