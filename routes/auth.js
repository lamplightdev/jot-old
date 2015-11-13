const Routes = require('./routes');

const Group = require('../models/group');

class AuthRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.authGoogle = {
      _path: '/google',
      _method: ['get'],
      _action: () => {
        return Promise.resolve();
      },
    };

    this._routes.callbackGoogle = {
      _path: '/google/callback',
      _method: ['get'],
      _action: () => {
        return Promise.resolve();
      },
    };

    this._routes.import = {
      _path: '/import',
      _method: ['get'],
      _action: () => {
        return Promise.resolve().then(() => {
          return Group.importFromLocal();
        });
      },
    };

    this._routes.user = {
      _path: '/user',
      _method: ['get'],
      _action: () => {
        return Promise.resolve();
      },
    };

    this._routes.signout = {
      _path: '/signout',
      _method: ['get'],
      _action: () => {
        return Promise.resolve();
      },
    };
  }
}

module.exports = AuthRoutes;
