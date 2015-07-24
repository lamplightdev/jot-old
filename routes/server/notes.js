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
        return {
          params: {},

          resolve: (events) => {
            res.render('app', {
              name: 'Notes',
              content: 'notes',
              jots,
              editJotID: req.query.edit
            });
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('add', (req, res, next) => {
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
          id: req.params.id,
          action: req.body.action
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

    this.routes.registerRoute('update', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          id: req.params.id,
          action: req.body.action,
          fields: {
            content: req.body.content
          }
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
