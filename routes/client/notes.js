const NotesRoutes = require('../notes');
const NotesView = require('../../views/notes');
const PubSub = require('../../utility/pubsub');

class NotesRouter {
  constructor(router, prefix = '') {
    this.routes = new NotesRoutes(router, prefix);

    this.notesView = new NotesView();
  }

  registerRoutes() {
    this.routes.registerRoute('all', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (events) => {
            this.notesView.render(false, {});

            /*
            PubSub.publish('routeChanged', {
              name: 'Home'
            });
            */
          },

          reject: (err) => {
            throw new Error(err);
          }
        };
      });
    });
  }
}

module.exports = NotesRouter;
