const AuthRoutes = require('../auth');

class AuthRouter {
  constructor(router, prefix = '') {
    this._db = require('../../db/db')();

    this._router = router;
    this.routes = new AuthRoutes(router, prefix);
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
  }
}

module.exports = AuthRouter;
