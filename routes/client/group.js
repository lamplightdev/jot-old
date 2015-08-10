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
              name: 'Jot',
              order: [{
                name: 'Alpha',
                type: 'alpha',
                direction: 'asc',
                current: false
              }],
              tabs: [{
                title: 'Home',
                link: '/'
              }, {
                title: 'All',
                link: '/jot'
              }, {
                title: 'Lists',
                link: '/group',
                current: true
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
            id: ctx.params.id,
            done: ctx.params.status === 'done'
          },

          resolve: (group) => {
            const queryObject = {};
            ctx.querystring.split('&').forEach(bit => {
              const vals = bit.split('=');
              queryObject[vals[0]] = vals[1];
            });

            this.groupView.setShowDone(ctx.params.status === 'done');
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
              }],
              tabs: [{
                link: '/group/' + group.id,
                title: 'undone',
                current: ctx.params.status !== 'done'
              }, {
                link: '/group/' + group.id + '/done',
                title: 'done',
                current: ctx.params.status === 'done'
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
