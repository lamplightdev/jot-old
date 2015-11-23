const Group = require('../../models/group');
const GroupRoutes = require('../group');
const Jot = require('../../models/jot');

class GroupsServerRoutes {
  constructor(router) {
    this.router = router;
    this.routes = new GroupRoutes(router);
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
      }, {
        title: 'Lists',
        link: '/group',
        current: true,
      }],
    };

    this.routes.registerRoute('all', (req, res, next) => {
      return Promise.resolve().then(() => {
        if (!req.user) return res.redirect('/');

        return {
          params: {},

          resolve: (groups) => {
            res.render('app', Object.assign(this._commonParams(req), routeParams, {
              name: 'Jot',
              content: 'groups',
              colours: Group.getColours(),
              selectorlabel: 'Colour',
              groups,
              editID: req.query.edit,
            }));
          },

          reject: next,
        };
      }).catch(next);
    });

    this.routes.registerRoute('view', (req, res, next) => {
      return Promise.resolve().then(() => {
        if (!req.user) return res.redirect('/');

        return {
          params: {
            id: req.params.id,
            done: req.params.status === 'done',
          },

          resolve: (group) => {
            res.render('app', Object.assign(this._commonParams(req), {
              name: group.fields.name,
              content: 'group',
              group,
              done: req.params.status === 'done',
              editID: req.query.edit,
              priorities: Jot.getPriorities(),
              selectorlabel: 'Priority',
              tabs: [{
                link: '/group/' + req.params.id,
                title: 'undone',
                current: req.params.status !== 'done',
              }, {
                link: '/group/' + req.params.id + '/done',
                title: 'done',
                current: req.params.status === 'done',
              }],
            }));
          },

          reject: next,
        };
      }).catch(next);
    });

    this.routes.registerRoute('add', (req, res, next) => {
      return Promise.resolve().then(() => {
        const params = {
          name: req.body.name,
          colour: req.body.colour,
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
