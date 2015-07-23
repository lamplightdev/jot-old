const NotesRoutes = require('../notes');
const Jot = require('../../models/jot');

class NotesRouter {
  constructor(router) {
    this.router = router;
    this.routes = new NotesRoutes(router);
  }

  registerRoutes() {
    this.routes.registerRoute('all', (req, res, next) => {
      return Jot.loadAll().then(jots => {
        console.log(jots);
        return {
          params: {},

          resolve: (events) => {
            res.render('app', {
              name: 'Notes',
              content: 'notes',
              jots
            });
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('save', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          content: req.body.content
        };
        return {
          params,

          resolve: () => {
            res.redirect('/notes');
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('delete', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          id: req.params.id
        };
        return {
          params,

          resolve: () => {
            res.redirect('/notes');
          },

          reject: next
        };
      }).catch(next);
    });

    return this.router;
  }
}

module.exports = NotesRouter;
