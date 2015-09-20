const AuthRoutes = require('../auth');
const ImportView = require('../../views/import');

const PubSub = require('../../utility/pubsub');

class AuthRouter {
  constructor(router, prefix, viewContainer) {
    this._db = require('../../db/db')();

    this._router = router;
    this.routes = new AuthRoutes(router, prefix);

    this.importView = new ImportView(viewContainer);
  }

  registerRoutes() {
    this.routes.registerRoute('signout', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          resolve: () => {
            this._db.destroy().then(() => {
              this._router.stop(ctx.canonicalPath);
            });
          },

          reject: (err) => {
            throw new Error(err);
          }
        };
      });
    });

    this.routes.registerRoute('import', (ctx, next) => {
      return Promise.resolve().then(() => {
        return {
          params: {},

          preAction: () => {
            PubSub.publish('routeChanged', {
              name: 'Jot',
              order: [],
              tabs: [{
                title: 'Home',
                link: '/'
              }, {
                title: 'Jots',
                link: '/jot'
              }, {
                title: 'Lists',
                link: '/group'
              }]
            });
          },

          resolve: (groups) => {
            this.importView.render(false, {
              groups
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

module.exports = AuthRouter;
