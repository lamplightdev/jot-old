const NotesRoutes = require('../notes');
const NotesView = require('../../views/notes');
const PubSub = require('../../utility/pubsub');

const Jot = require('../../models/jot');

class NotesRouter {
  constructor(router, prefix = '') {
    this.routes = new NotesRoutes(router, prefix);

    this.notesView = new NotesView();
  }

  registerRoutes() {
    this.routes.registerRoute('all', (ctx, next) => {
      return Jot.loadAll().then(jots => {
        console.log(jots);
        return {
          params: {},

          resolve: (events) => {
            this.notesView.render(false, {
              jots
            });

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
