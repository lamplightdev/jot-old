const JotRoutes = require('../jot');
const JotsView = require('../../views/jots');
const LoadingView = require('../../views/loading');
const PubSub = require('../../utility/pubsub');

class JotClientRoutes {
  constructor(router, prefix, viewContainer) {
    this.routes = new JotRoutes(router, prefix);

    this.jotsView = new JotsView(viewContainer);
    this.loadingView = new LoadingView(viewContainer);
  }

  registerRoutes() {

    this.routes.registerRoute('all', (ctx, next) => {
      return Promise.resolve().then(() => {
        const page = {
          name: 'Jot'
        };

        const ordering = {
          orders: [{
            name: 'Alpha',
            type: 'alpha',
            direction: 'asc'
          }, {
            name: 'Date',
            type: 'date',
            direction: 'desc'
          }, {
            name: 'Priority',
            type: 'priority',
            direction: 'desc'
          }],
          current: 'date'
        };

        const tabs = [{
          title: 'Home',
          link: '/'
        }, {
          title: 'Jots',
          link: '/jot',
          current: true
        }, {
          title: 'Lists',
          link: '/group'
        }];

        return {
          params: {
            order: ordering.current,
            direction: ordering.orders.find(order => order.type === ordering.current).direction
          },

          preAction: () => {
            PubSub.publish('routeChanged', {
              name: page.name,
              ordering,
              tabs
            });

            this.loadingView.render(false, {
              items: [0, 0, 0, 0, 0, 0, 0]
            });
          },

          resolve: (jots) => {
            this.jotsView.render(false, {
              jots
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
