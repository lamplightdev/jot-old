const GroupRoutes = require('../group');
const GroupsView = require('../../views/groups');
const PubSub = require('../../utility/pubsub');

const Group = require('../../models/group');

class GroupClientRoutes {
  constructor(router, prefix = '') {
    this.routes = new GroupRoutes(router, prefix);

    this.groupsView = new GroupsView();
  }

  registerRoutes() {
    this.routes.registerRoute('all', (ctx, next) => {
      return Group.loadAll().then(groups => {
        return {
          params: {},

          resolve: (events) => {
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
  }
}

module.exports = GroupClientRoutes;
