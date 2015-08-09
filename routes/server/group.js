const Group = require('../../models/group');
const GroupRoutes = require('../group');

class GroupsServerRoutes {
  constructor(router) {
    this.router = router;
    this.routes = new GroupRoutes(router);
  }

  registerRoutes() {
    const routeParams = {
      tabs: [{
        title: 'Home',
        link: '/'
      }, {
        title: 'Jots',
        link: '/jot'
      }, {
        title: 'Groups',
        link: '/group',
        current: true
      }]
    };

    this.routes.registerRoute('all', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (groups) => {
            res.render('app', Object.assign(routeParams, {
              name: 'Groups',
              content: 'groups',
              colours: Group.getColours(),
              groups,
              editID: req.query.edit
            }));
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('view', (req, res, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {
            id: req.params.id
          },

          resolve: (group) => {
            res.render('app', {
              name: group.fields.name,
              content: 'group',
              group,
              editID: req.query.edit,
              tabs: [{
                url: '/group/' + req.params.id,
                title: 'undone',
                current: true
              }, {
                url: '/group/' + req.params.id,
                title: 'done'
              }]
            });
          },

          reject: next
        };
      }).catch(next);
    });

    this.routes.registerRoute('add', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          name: req.body.name,
          colour: req.body.colour
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
          name: req.body.name,
          colour: req.body.colour
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
