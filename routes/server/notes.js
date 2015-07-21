const NotesRoutes = require('../notes');

class NotesRouter {
  constructor(router) {
    this.router = router;
    this.routes = new NotesRoutes(router);
  }

  registerRoutes() {
    this.routes.registerRoute('all', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (events) => {
            res.render('app', {
              name: 'Notes',
              content: 'notes'
            });
          },

          reject: next
        };
      });
    });

    return this.router;
  }
}

module.exports = NotesRouter;
