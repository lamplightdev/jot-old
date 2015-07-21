'use strict';

const Routes = require('./routes');

class NotesRoutes extends Routes {
  constructor(router, prefix = '') {
    super(router, prefix);

    this._routes.all = {
      _path: '/',
      _method: ['get'],
      _action: () => {
        return Promise.resolve();
      }
    };
  }
}

module.exports = NotesRoutes;
