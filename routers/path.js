'use strict';

const page = require('page');

module.exports = (() => {
  return {
    setUser: dbUser => {
      page('*', (ctx, next) => {
        ctx.dbUser = dbUser;
        next();
      });
    },

    activate: () => {
      page();
    },

    get: (path, callback) => {
      page(path, callback);
    },

    go: (path) => {
      page(path);
    },

    back: () => {
      if (window.history.length) {
        window.history.back();
      } else {
        page('/');
      }
    },

    stop: (path) => {
      page.stop();
      if (path) {
        window.location = path;
      }
    },
  };
})();
