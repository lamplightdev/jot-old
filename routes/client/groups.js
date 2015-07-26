const GroupsRoutes = require('../groups');
const GroupsView = require('../../views/groups');
const PubSub = require('../../utility/pubsub');

const Group = require('../../models/group');

class GroupsRouter {
  constructor(router, prefix = '') {
    this.routes = new GroupsRoutes(router, prefix);

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

            /*
            PubSub.publish('routeChanged', {
              name: 'Home'
            });
            */
          },

          reject: (err) => {
            throw new Error(err);
          }
        };
      });
    });
  }
}

module.exports = GroupsRouter;
