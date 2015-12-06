'use strict';

class Routes {

  constructor(router, prefix = '') {
    this._router = router;
    this._prefix = prefix;

    this._routes = {};
  }

  registerRoute(name, config) {
    const route = this._routes[name];
    route._method.forEach(method => {
      this._router[method](this._prefix + route._path, (...params) => {
        config(...params).then(result => {
          return Promise.resolve().then(() => {
            if (result.preAction) {
              result.preAction();
            }

            return route._action(result.params)
            .then(result.resolve);
          }).catch(result.reject);
        });
      });
    });
  }
}

module.exports = Routes;
