const GroupRoutes = require('../group');
const Group = require('../../models/group');

class GroupsServerRoutes {
  constructor(router) {
    this.router = router;
    this.routes = new GroupRoutes(router);
  }

  registerRoutes() {
    this.routes.registerRoute('all', (req, res, next) => {
      return Group.loadAll().then(groups => {
        return {
          params: {},

          resolve: (events) => {
            res.render('app', {
              name: 'Groups',
              content: 'groups',
              groups,
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
          name: req.body.name
        };

        return {
          params,

          resolve: () => {
            res.redirect('/group');
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
            res.redirect('/group');
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('update', (req, res, next) => {
      return Promise.resolve().then(() => {
        const fields = {
          name: req.body.name
        };

        const params = {
          id: req.params.id,
          action: req.body.action,
          fields
        };

        return {
          params,

          resolve: () => {
            res.redirect('/group');
          },

          reject: next
        };
      }).catch(next);
    });

    return this.router;
  }
}

module.exports = GroupsServerRoutes;
