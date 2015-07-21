'use strict';

const page = require('page');

module.exports = (function() {

  return {
    activate: function() {
      page();
    },

    get: function(path, callback) {
      page(path, callback);
    },

    go: function(path) {
      page(path);
    },

    back: function() {
      if (window.history.length) {
        window.history.back();
      } else {
        page('/');
      }
    },

    stop: function(path) {
      page.stop();
      if (path) {
        window.location = path;
      }
    }
  };

})();
