const JotRoutes = require('../jot');
const Jot = require('../../models/jot');

class JotServerRoutes {
  constructor(router) {
    this.router = router;
    this.routes = new JotRoutes(router);
  }

  registerRoutes() {
    this.routes.registerRoute('all', (req, res, next) => {
      return Jot.loadAll().then(jots => {
        return {
          params: {},

          resolve: (events) => {
            res.render('app', {
              name: 'Jots',
              content: 'jots',
              jots,
              editID: req.query.edit
            });
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('add', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          content: req.body.content,
          group: req.body.group
        };

        return {
          params,

          resolve: () => {
            res.redirect('/jot');
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
            res.redirect('/jot');
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('update', (req, res, next) => {
      return Promise.resolve().then(() => {
        const fields = {
          content: req.body.content,
          group: req.body.group
        };

        if (typeof req.body.done !== 'undefined') {
          fields.done = true;
        } else if (typeof req.body.undone !== 'undefined') {
          fields.done = false;
        }

        const params = {
          id: req.params.id,
          action: req.body.action,
          fields
        };

        return {
          params,

          resolve: () => {
            res.redirect('/jot');
          },

          reject: next
        };
      }).catch(next);
    });

    return this.router;
  }
}

module.exports = JotServerRoutes;
