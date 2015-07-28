const GroupRoutes = require('../group');
const GroupsView = require('../../views/groups');
const GroupView = require('../../views/group');
const PubSub = require('../../utility/pubsub');

class GroupClientRoutes {
  constructor(router, prefix = '') {
    this.routes = new GroupRoutes(router, prefix);

    this.groupsView = new GroupsView();
    this.groupView = new GroupView();
  }

  registerRoutes() {
    this.routes.registerRoute('all', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: (groups) => {
            this.groupsView.render(false, {
              groups
            });

            PubSub.publish('routeChanged', {
              name: 'Groups'
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
            this.groupView.render(false, {
              group
            });

            PubSub.publish('routeChanged', {
              name: 'Group'
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
