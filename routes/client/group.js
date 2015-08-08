const Jot = require('../../models/jot');
const Group = require('../../models/group');
const GroupRoutes = require('../group');
const GroupsView = require('../../views/groups');
const GroupView = require('../../views/group');
const PubSub = require('../../utility/pubsub');

class GroupClientRoutes {
  constructor(router, prefix, viewContainer) {
    this.routes = new GroupRoutes(router, prefix);

    this.groupsView = new GroupsView(viewContainer);
    this.groupView = new GroupView(viewContainer);
  }

  registerRoutes() {
    this.routes.registerRoute('all', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (groups) => {
            this.groupsView.render(false, {
              colours: Group.getColours(),
              groups
            });

            PubSub.publish('routeChanged', {
              name: 'Groups',
              order: [{
                name: 'Alpha',
                type: 'alpha',
                direction: 'asc',
                current: false
              }]
            });
          },

          reject: (err) => {
            throw new Error(err);
          }
        };
      });
    });

    this.routes.registerRoute('view', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {
            id: ctx.params.id
          },

          resolve: (group) => {
            const queryObject = {};
            ctx.querystring.split('&').forEach(bit => {
              const vals = bit.split('=');
              queryObject[vals[0]] = vals[1];
            });

            this.groupView.render(false, {
              group,
              editID: queryObject.edit,
              priorities: Jot.getPriorities()
            });

            PubSub.publish('routeChanged', {
              name: group.fields.name,
              order: [{
                name: 'Alpha',
                type: 'alpha',
                direction: 'asc',
                current: false
              }, {
                name: 'Date',
                type: 'date',
                direction: 'desc',
                current: false
              }, {
                name: 'Priority',
                type: 'priority',
                direction: 'asc',
                current: false
              }]
            });
          },

          reject: (err) => {
            throw new Error(err);
          }
        };
      });
    });
  }
}

module.exports = GroupClientRoutes;
