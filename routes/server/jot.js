'use strict';

const JotRoutes = require('../jot');

class JotServerRoutes {
  constructor(router) {
    this.router = router;
    this.routes = new JotRoutes(router);
  }

  _commonParams(req) {
    return {
      menuOpen: req.query.menu && req.query.menu === 'open',
    };
  }

  registerRoutes() {
    const routeParams = {
      tabs: [{
        title: 'Home',
        link: '/',
      }, {
        title: 'Jots',
        link: '/jot',
        current: true,
      }, {
        title: 'Lists',
        link: '/group',
      }],
    };

    this.routes.registerRoute('all', (req, res, next) => {
      return Promise.resolve().then(() => {
        if (!req.user) return res.redirect('/auth/continue');

        return {
          params: {
            user: req.dbUser,
          },

          resolve: (jots) => {
            res.render('app', Object.assign(this._commonParams(req), routeParams, {
              name: 'Jot',
              content: 'jots',
              jots,
              editID: req.query.edit,
            }));
          },

          reject: next,
        };
      }).catch(next);
    });

    this.routes.registerRoute('add', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          user: req.dbUser,
          content: req.body.content,
          group: req.body.group,
          priority: req.body.priority,
        };

        return {
          params,

          resolve: () => {
            res.redirect('/group/' + req.body.group);
          },

          reject: next,
        };
      }).catch(next);
    });

    this.routes.registerRoute('delete', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          user: req.dbUser,
          id: req.params.id,
          action: req.body.action,
        };

        return {
          params,

          resolve: () => {
            res.redirect('/group/' + req.body.group);
          },

          reject: next,
        };
      }).catch(next);
    });

    this.routes.registerRoute('update', (req, res, next) => {
      return Promise.resolve().then(() => {
        const fields = {
          content: req.body.content,
          group: req.body.group,
          priority: req.body.priority,
        };

        if (typeof req.body.done !== 'undefined') {
          fields.done = true;
        } else if (typeof req.body.undone !== 'undefined') {
          fields.done = false;
        }

        const params = {
          user: req.dbUser,
          id: req.params.id,
          action: req.body.action,
          fields,
        };

        return {
          params,

          resolve: () => {
            const done = fields.done ? '' : '/done';
            res.redirect('/group/' + req.body.group + done);
          },

          reject: next,
        };
      }).catch(next);
    });

    return this.router;
  }
}

module.exports = JotServerRoutes;
