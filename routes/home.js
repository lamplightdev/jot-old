'use strict';

const Routes = require('./routes');

class HomeRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.home = {
      _path: '/',
      _method: ['get'],
      _action: () => {
        return Promise.resolve();
      }
    };
  }
}

module.exports = HomeRoutes;
