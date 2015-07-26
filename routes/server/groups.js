const GroupsRoutes = require('../groups');
const Group = require('../../models/group');

class GroupsRouter {
  constructor(router) {
    this.router = router;
    this.routes = new GroupsRoutes(router);
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
              groups
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
            res.redirect('/groups');
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
            res.redirect('/groups');
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
            res.redirect('/groups');
          },

          reject: next
        };
      }).catch(next);
    });

    return this.router;
  }
}

module.exports = GroupsRouter;
