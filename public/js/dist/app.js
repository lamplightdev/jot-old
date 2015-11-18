(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PubSub = require('../utility/pubsub');

var DB = (function () {
  function DB() {
    _classCallCheck(this, DB);

    this._remoteCouch = null;
    this._db = null;
  }

  _createClass(DB, [{
    key: 'init',
    value: function init(options) {
      var _this = this;

      options = options || {
        protocol: null,
        domain: null,
        port: null,
        username: null,
        password: null,
        dbName: null
      };

      if (options.domain) {
        this._remoteCouch = options.protocol + '://';

        if (options.username) {
          this._remoteCouch += options.username;
        }

        if (options.password) {
          this._remoteCouch += ':' + options.password;
        }

        if (options.username || options.password) {
          this._remoteCouch += '@';
        }

        this._remoteCouch += options.domain;

        if (options.port) {
          this._remoteCouch += ':' + options.port;
        }

        this._remoteCouch += '/' + options.dbName;
      } else {
        this._remoteCouch = null;
      }

      if (typeof PouchDB !== 'undefined') {
        //browser
        PouchDB.debug.disable();
        this._db = new PouchDB(options.dbName, {
          auto_compaction: true
        });

        if (this._remoteCouch) {
          (function () {

            var opts = { live: true, retry: true };

            _this._db.replicate.to(_this._remoteCouch, opts).on('change', function (info) {
              console.log('browser replicate to change');
            }).on('paused', function () {
              console.log('browser replicate to paused');
            }).on('active', function () {
              console.log('browser replicate to active');
            }).on('denied', function (info) {
              console.log('browser replicate to denied', info);
            }).on('complete', function (info) {
              console.log('browser replicate to complete');
            }).on('error', function (err) {
              console.log('browser replicate to error', err);
            });

            var changes = [];

            _this._db.replicate.from(_this._remoteCouch, opts).on('change', function (info) {
              console.log('browser replicate from change', info);
              changes = changes.concat(info.docs);
            }).on('paused', function () {
              console.log('browser replicate from paused');

              PubSub.publish('update', {
                changes: changes
              });

              changes = [];
            }).on('active', function () {
              console.log('browser replicate from active');
            }).on('denied', function (info) {
              console.log('browser replicate from denied', info);
            }).on('complete', function (info) {
              console.log('browser replicate from complete', info);
            }).on('error', function (err) {
              console.log('browser replicate from error', err);
            });
          })();
        } else {
          var ddoc = {
            _id: '_design/index',
            views: {
              group: {
                map: (function (doc) {
                  if (doc.fields.group) {
                    emit(doc.fields.group);
                  }
                }).toString()
              }
            }
          };

          this._db.put(ddoc).then(function () {
            // kick off an initial build, return immediately
            return _this._db.query('index/group', { stale: 'update_after' });
          }).catch(function (err) {
            //conflict occured, i.e. ddoc already existed
          });
        }
      } else {
          var _PouchDB = require('pouchdb');
          _PouchDB.debug.disable();

          this._db = new _PouchDB(this._remoteCouch);
        }
    }
  }, {
    key: 'db',
    get: function get() {
      return this._db;
    }
  }]);

  return DB;
})();

var dbs = {
  'main': new DB()
};
var currentDB = 'main';

module.exports = function (options) {
  var id = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

  if (id !== false) {
    currentDB = id;
  }

  if (options) {
    if (!dbs[currentDB]) {
      dbs[currentDB] = new DB();
    }

    dbs[currentDB].init(options);
  }

  return dbs[currentDB].db;
};

},{"../utility/pubsub":30,"pouchdb":46}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Model = require('./model');

var Jot = (function (_Model) {
  _inherits(Jot, _Model);

  function Jot(members) {
    _classCallCheck(this, Jot);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Jot).call(this, members, ['content', 'group', 'done', 'priority']));

    _this._group = null;
    return _this;
  }

  _createClass(Jot, [{
    key: 'isDone',
    value: function isDone() {
      return this.fields.done;
    }
  }, {
    key: 'loadGroup',
    value: function loadGroup() {
      var _this2 = this;

      return Promise.resolve().then(function () {
        var Group = require('./group');

        return Group.load(_this2.fields.group, false).then(function (group) {
          _this2._group = group;
          return _this2;
        });
      });
    }
  }, {
    key: 'priorities',
    get: function get() {
      return this.constructor.getPriorities();
    }
  }, {
    key: 'group',
    get: function get() {
      return this._group;
    }
  }, {
    key: 'groupName',
    get: function get() {
      if (this._group) {
        return this._group.fields.name;
      } else {
        return '-';
      }
    }
  }], [{
    key: 'getPriorities',
    value: function getPriorities() {
      return ['2', '1', '0'];
    }
  }, {
    key: 'getPercentageDone',
    value: function getPercentageDone() {
      return this.loadAll(false).then(function (jots) {
        var numDone = jots.reduce(function (prevVal, jot) {
          if (jot.isDone()) {
            return prevVal + 1;
          } else {
            return prevVal;
          }
        }, 0);

        return {
          percent: parseInt(numDone / jots.length * 100, 10)
        };
      }).then(function (stats) {
        var Group = require('./group');

        return Group.loadAll(false).then(function (groups) {
          stats.numGroups = groups.length;

          return stats;
        });
      });
    }
  }, {
    key: 'load',
    value: function load(id) {
      var loadGroup = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

      return _get(Object.getPrototypeOf(Jot), 'load', this).call(this, id).then(function (jot) {
        if (loadGroup) {
          return jot.loadGroup().then(function () {
            return jot;
          });
        } else {
          return jot;
        }
      });
    }
  }, {
    key: 'loadAll',
    value: function loadAll() {
      var loadGroups = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var _this3 = this;

      var order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      return _get(Object.getPrototypeOf(Jot), 'loadAll', this).call(this).then(function (jots) {
        var Group = require('./group');

        var promises = [];

        if (loadGroups) {
          promises.push(Group.loadForJots(jots));
        }

        return Promise.all(promises).then(function () {
          return _this3.order(jots, order, direction);
        });
      });
    }
  }, {
    key: 'order',
    value: function order(jots) {
      var sortOrder = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var sortDirection = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      switch (sortOrder) {
        case 'date':
          jots.sort(function (a, b) {
            if (a._dateAdded > b._dateAdded) {
              return 1;
            }

            if (a._dateAdded < b._dateAdded) {
              return -1;
            }

            return 0;
          });

          break;
        case 'alpha':
          jots.sort(function (a, b) {
            if (a.fields.content.toLowerCase() > b.fields.content.toLowerCase()) {
              return 1;
            }

            if (a.fields.content.toLowerCase() < b.fields.content.toLowerCase()) {
              return -1;
            }

            return 0;
          });

          break;
        case 'priority':
          jots.sort(function (a, b) {
            if (a.fields.priority > b.fields.priority) {
              return 1;
            }

            if (a.fields.priority < b.fields.priority) {
              return -1;
            }

            return 0;
          });

          break;
      }

      if (sortDirection === 'desc') {
        jots.reverse();
      }

      var undoneJots = [];
      var doneJots = [];

      jots.forEach(function (jot) {
        if (jot.isDone()) {
          doneJots.push(jot);
        } else {
          undoneJots.push(jot);
        }
      });

      return undoneJots.concat(doneJots);
    }
  }, {
    key: 'loadForGroup',
    value: function loadForGroup(groupId) {
      var _this4 = this;

      var order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      return Promise.resolve().then(function () {

        return _this4.db.query('index/group', {
          descending: true,
          key: groupId,
          include_docs: true
        }).then(function (result) {
          var jots = [];

          result.rows.forEach(function (row) {
            jots.push(new _this4(row.doc));
          });

          return _this4.order(jots, order, direction);
        });
      });
    }
  }, {
    key: 'loadForGroups',
    value: function loadForGroups(groups) {
      var _this5 = this;

      var order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      return Promise.resolve().then(function () {

        var groupIds = groups.map(function (group) {
          return group.id;
        });

        return _this5.db.query('index/group', {
          keys: groupIds,
          include_docs: true
        }).then(function (result) {
          var groupJots = {};

          groupIds.forEach(function (groupId) {
            groupJots[groupId] = [];
          });

          result.rows.forEach(function (row) {
            groupJots[row.doc.fields.group].push(new _this5(row.doc));
          });

          groups.forEach(function (group) {
            group._jots = groupJots[group.id];
          });
        });
      });
    }
  }]);

  return Jot;
})(Model);

module.exports = Jot;

},{"./group":3,"./model":5}],3:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Model = require('./model');
var Jot = require('./jot');

var Group = (function (_Model) {
  _inherits(Group, _Model);

  function Group(members) {
    _classCallCheck(this, Group);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Group).call(this, members, ['name', 'colour']));

    _this._jots = [];
    return _this;
  }

  _createClass(Group, [{
    key: 'getJots',
    value: function getJots() {
      var done = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (done === null) {
        return this.jots;
      } else if (done) {
        return this.jots.filter(function (jot) {
          return !!jot.fields.done;
        });
      } else {
        return this.jots.filter(function (jot) {
          return !jot.fields.done;
        });
      }
    }
  }, {
    key: 'loadJots',
    value: function loadJots() {
      var _this2 = this;

      var order = arguments.length <= 0 || arguments[0] === undefined ? 'alpha' : arguments[0];
      var direction = arguments.length <= 1 || arguments[1] === undefined ? 'asc' : arguments[1];

      return Jot.loadForGroup(this.id, order, direction).then(function (jots) {
        _this2._jots = jots;
        return _this2;
      });
    }
  }, {
    key: 'colours',
    get: function get() {
      return this.constructor.getColours();
    }
  }, {
    key: 'jots',
    get: function get() {
      return this._jots;
    },
    set: function set(jots) {
      this._jots = jots;
    }
  }, {
    key: 'jotCount',
    get: function get() {
      return this._jots.length;
    }
  }, {
    key: 'jotDoneCount',
    get: function get() {
      return this._jots.filter(function (jot) {
        return !!jot.fields.done;
      }).length;
    }
  }], [{
    key: 'getColours',
    value: function getColours() {
      return ['blue', 'red', 'teal', 'yellow', 'orange', 'brown'];
    }
  }, {
    key: 'load',
    value: function load(id) {
      var loadJots = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];
      var jotOrder = arguments.length <= 2 || arguments[2] === undefined ? 'alpha' : arguments[2];
      var jotDirection = arguments.length <= 3 || arguments[3] === undefined ? 'asc' : arguments[3];

      return _get(Object.getPrototypeOf(Group), 'load', this).call(this, id).then(function (group) {
        if (loadJots) {
          return group.loadJots(jotOrder, jotDirection).then(function () {
            return group;
          });
        } else {
          return group;
        }
      });
    }
  }, {
    key: 'loadAll',
    value: function loadAll() {
      var loadJots = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var _this3 = this;

      var order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      return _get(Object.getPrototypeOf(Group), 'loadAll', this).call(this).then(function (groups) {
        var promises = [];

        if (loadJots) {
          promises.push(Jot.loadForGroups(groups));
        }

        return Promise.all(promises).then(function () {
          return _this3.order(groups, order, direction);
        });
      });
    }
  }, {
    key: 'loadForJots',
    value: function loadForJots(jots) {
      var _this4 = this;

      return Promise.resolve().then(function () {

        var groupIds = jots.map(function (jot) {
          return jot.fields.group;
        });

        return _this4.db.allDocs({
          descending: true,
          keys: groupIds,
          include_docs: true
        }).then(function (result) {
          var jotGroups = {};

          result.rows.forEach(function (row) {
            jotGroups[row.doc._id] = new _this4(row.doc);
          });

          jots.forEach(function (jot) {
            jot._group = jotGroups[jot.fields.group];
          });
        });
      });
    }
  }, {
    key: 'order',
    value: function order(groups) {
      var _order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];

      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      switch (_order) {
        case 'date':
          groups.sort(function (a, b) {
            if (a._dateAdded > b._dateAdded) {
              return 1;
            }

            if (a._dateAdded < b._dateAdded) {
              return -1;
            }

            return 0;
          });

          break;
        case 'alpha':
          groups.sort(function (a, b) {
            if (a.fields.name.toLowerCase() > b.fields.name.toLowerCase()) {
              return 1;
            }

            if (a.fields.name.toLowerCase() < b.fields.name.toLowerCase()) {
              return -1;
            }

            return 0;
          });

          break;
      }

      if (direction === 'desc') {
        groups.reverse();
      }

      return groups;
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      var _this5 = this;

      return _get(Object.getPrototypeOf(Group), 'remove', this).call(this, id).then(function () {

        return Jot.loadForGroup(id).then(function (jots) {
          var docs = jots.map(function (jot) {
            return {
              _id: jot.id,
              _rev: jot.rev,
              _deleted: true
            };
          });

          return _this5.db.bulkDocs(docs).then(function () {
            return true;
          });
        });
      });
    }
  }, {
    key: 'importFromLocal',
    value: function importFromLocal() {
      var _this6 = this;

      return Promise.resolve().then(function () {
        if (typeof PouchDB === 'undefined') {
          //server
          return false;
        }

        //load local db
        require('../db/db')({
          dbName: 'jot-local'
        }, 'local');

        return _this6.loadAll().then(function (groups) {
          //restore main db
          require('../db/db')(null, 'main');

          return groups;
        });
      });
    }
  }, {
    key: 'removeFromLocal',
    value: function removeFromLocal() {
      var _this7 = this;

      return Promise.resolve().then(function () {
        if (typeof PouchDB === 'undefined') {
          //server
          return false;
        }

        //load local db
        require('../db/db')({
          dbName: 'jot-local'
        }, 'local');

        return _this7.loadAll().then(function (groups) {
          var promises = [];
          groups.forEach(function (group) {
            promises.push(Group.remove(group.id));
          });

          return Promise.all(promises);
        }).then(function () {
          //restore main db
          require('../db/db')(null, 'main');

          return true;
        });
      });
    }
  }]);

  return Group;
})(Model);

module.exports = Group;

},{"../db/db":1,"./jot":4,"./model":5}],4:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Model = require('./model');

var Jot = (function (_Model) {
  _inherits(Jot, _Model);

  function Jot(members) {
    _classCallCheck(this, Jot);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Jot).call(this, members, ['content', 'group', 'done', 'priority']));

    _this._group = null;
    return _this;
  }

  _createClass(Jot, [{
    key: 'isDone',
    value: function isDone() {
      return this.fields.done;
    }
  }, {
    key: 'loadGroup',
    value: function loadGroup() {
      var _this2 = this;

      return Promise.resolve().then(function () {
        var Group = require('./group');

        return Group.load(_this2.fields.group, false).then(function (group) {
          _this2._group = group;
          return _this2;
        });
      });
    }
  }, {
    key: 'priorities',
    get: function get() {
      return this.constructor.getPriorities();
    }
  }, {
    key: 'group',
    get: function get() {
      return this._group;
    }
  }, {
    key: 'groupName',
    get: function get() {
      if (this._group) {
        return this._group.fields.name;
      } else {
        return '-';
      }
    }
  }], [{
    key: 'getPriorities',
    value: function getPriorities() {
      return ['2', '1', '0'];
    }
  }, {
    key: 'getPercentageDone',
    value: function getPercentageDone() {
      return this.loadAll(false).then(function (jots) {
        var numDone = jots.reduce(function (prevVal, jot) {
          if (jot.isDone()) {
            return prevVal + 1;
          } else {
            return prevVal;
          }
        }, 0);

        return {
          percent: parseInt(numDone / jots.length * 100, 10)
        };
      }).then(function (stats) {
        var Group = require('./group');

        return Group.loadAll(false).then(function (groups) {
          stats.numGroups = groups.length;

          return stats;
        });
      });
    }
  }, {
    key: 'load',
    value: function load(id) {
      var loadGroup = arguments.length <= 1 || arguments[1] === undefined ? true : arguments[1];

      return _get(Object.getPrototypeOf(Jot), 'load', this).call(this, id).then(function (jot) {
        if (loadGroup) {
          return jot.loadGroup().then(function () {
            return jot;
          });
        } else {
          return jot;
        }
      });
    }
  }, {
    key: 'loadAll',
    value: function loadAll() {
      var loadGroups = arguments.length <= 0 || arguments[0] === undefined ? true : arguments[0];

      var _this3 = this;

      var order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      return _get(Object.getPrototypeOf(Jot), 'loadAll', this).call(this).then(function (jots) {
        var Group = require('./group');

        var promises = [];

        if (loadGroups) {
          promises.push(Group.loadForJots(jots));
        }

        return Promise.all(promises).then(function () {
          return _this3.order(jots, order, direction);
        });
      });
    }
  }, {
    key: 'order',
    value: function order(jots) {
      var sortOrder = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var sortDirection = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      switch (sortOrder) {
        case 'date':
          jots.sort(function (a, b) {
            if (a._dateAdded > b._dateAdded) {
              return 1;
            }

            if (a._dateAdded < b._dateAdded) {
              return -1;
            }

            return 0;
          });

          break;
        case 'alpha':
          jots.sort(function (a, b) {
            if (a.fields.content.toLowerCase() > b.fields.content.toLowerCase()) {
              return 1;
            }

            if (a.fields.content.toLowerCase() < b.fields.content.toLowerCase()) {
              return -1;
            }

            return 0;
          });

          break;
        case 'priority':
          jots.sort(function (a, b) {
            if (a.fields.priority > b.fields.priority) {
              return 1;
            }

            if (a.fields.priority < b.fields.priority) {
              return -1;
            }

            return 0;
          });

          break;
      }

      if (sortDirection === 'desc') {
        jots.reverse();
      }

      var undoneJots = [];
      var doneJots = [];

      jots.forEach(function (jot) {
        if (jot.isDone()) {
          doneJots.push(jot);
        } else {
          undoneJots.push(jot);
        }
      });

      return undoneJots.concat(doneJots);
    }
  }, {
    key: 'loadForGroup',
    value: function loadForGroup(groupId) {
      var _this4 = this;

      var order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      return Promise.resolve().then(function () {

        return _this4.db.query('index/group', {
          descending: true,
          key: groupId,
          include_docs: true
        }).then(function (result) {
          var jots = [];

          result.rows.forEach(function (row) {
            jots.push(new _this4(row.doc));
          });

          return _this4.order(jots, order, direction);
        });
      });
    }
  }, {
    key: 'loadForGroups',
    value: function loadForGroups(groups) {
      var _this5 = this;

      var order = arguments.length <= 1 || arguments[1] === undefined ? 'alpha' : arguments[1];
      var direction = arguments.length <= 2 || arguments[2] === undefined ? 'asc' : arguments[2];

      return Promise.resolve().then(function () {

        var groupIds = groups.map(function (group) {
          return group.id;
        });

        return _this5.db.query('index/group', {
          keys: groupIds,
          include_docs: true
        }).then(function (result) {
          var groupJots = {};

          groupIds.forEach(function (groupId) {
            groupJots[groupId] = [];
          });

          result.rows.forEach(function (row) {
            groupJots[row.doc.fields.group].push(new _this5(row.doc));
          });

          groups.forEach(function (group) {
            group._jots = groupJots[group.id];
          });
        });
      });
    }
  }]);

  return Jot;
})(Model);

module.exports = Jot;

},{"./group":3,"./model":5}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DateUtils = require('../utility/date');

var Model = (function () {
  function Model(members, allowedFields) {
    _classCallCheck(this, Model);

    this._id = members._id || null;
    this._rev = members._rev || null;

    this._dateAdded = members.dateAdded || null;

    this._fields = members.fields || {};

    this._allowedFields = allowedFields;
  }

  _createClass(Model, [{
    key: 'isNew',
    value: function isNew() {
      return !this.id;
    }
  }, {
    key: 'getSlug',
    value: function getSlug() {
      var _this = this;

      return Promise.resolve().then(function () {
        if (!_this.isNew()) {
          return Promise.resolve(_this.id);
        } else {
          var _ret = (function () {
            var slug = _this.refName + '-';

            var padding = 5; //the length of the number, e.g. '5' will start at 00000, 00001, etc.

            return {
              v: _this.constructor.db.allDocs({
                startkey: slug + '￿',
                endkey: slug,
                descending: true,
                limit: 1
              }).then(function (result) {
                if (result.rows.length > 0) {
                  var lastDoc = result.rows[result.rows.length - 1];
                  var lastNum = parseInt(lastDoc.id.substring(slug.length), 10);

                  return slug + ('0'.repeat(padding) + (lastNum + 1)).slice(-padding);
                } else {
                  return slug + '0'.repeat(padding);
                }
              })
            };
          })();

          if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        }
      });
    }
  }, {
    key: 'save',
    value: function save() {
      var _this2 = this;

      return this.getSlug().then(function (slug) {
        var params = {
          _id: slug,
          dateAdded: _this2._dateAdded,
          fields: _this2.fields
        };

        if (!_this2.isNew()) {
          params._rev = _this2.rev;
        }

        if (_this2.isNew() && !_this2._dateAdded) {
          params.dateAdded = new Date().toISOString();
        }

        return _this2.constructor.db.put(params).then(function (response) {
          if (response.ok) {
            _this2.id = response.id;
            _this2.rev = response.rev;

            return _this2;
          } else {
            return false;
          }
        });
      });
    }
  }, {
    key: 'refName',
    get: function get() {
      return this.constructor.getRefName();
    }
  }, {
    key: 'id',
    get: function get() {
      return this._id;
    },
    set: function set(id) {
      this._id = id;

      return this;
    }
  }, {
    key: 'rev',
    get: function get() {
      return this._rev;
    },
    set: function set(rev) {
      this._rev = rev;

      return this;
    }
  }, {
    key: 'dateAdded',
    get: function get() {
      if (this._dateAdded) {
        return DateUtils.format(new Date(this._dateAdded));
      } else {
        return '';
      }
    },
    set: function set(date) {
      this._dateAdded = date;

      return this;
    }
  }, {
    key: 'fields',
    set: function set(fields) {
      this._fields = {};

      for (var fieldName in fields) {
        if (this._allowedFields.indexOf(fieldName) > -1) {
          this._fields[fieldName] = fields[fieldName];
        }
      }

      return this;
    },
    get: function get() {
      return this._fields;
    }
  }], [{
    key: 'getRefName',
    value: function getRefName() {
      return this.name.toLowerCase();
    }
  }, {
    key: 'loadAll',
    value: function loadAll() {
      var _this3 = this;

      return Promise.resolve().then(function () {

        return _this3.db.allDocs({
          endkey: _this3.getRefName() + '-',
          startkey: _this3.getRefName() + '-￿',
          include_docs: true,
          descending: true
        }).then(function (result) {
          var models = [];

          result.rows.forEach(function (row) {
            models.push(new _this3(row.doc));
          });

          return models;
        });
      });
    }
  }, {
    key: 'load',
    value: function load(id) {
      var _this4 = this;

      return Promise.resolve().then(function () {
        if (typeof id !== 'undefined') {

          return _this4.db.get(id).then(function (doc) {
            return new _this4(doc);
          }).catch(function (err) {
            return false;
          });
        } else {
          return false;
        }
      });
    }
  }, {
    key: 'remove',
    value: function remove(id) {
      var _this5 = this;

      return Promise.resolve().then(function () {

        return _this5.db.get(id).then(function (doc) {
          return _this5.db.remove(doc);
        });
      });
    }
  }, {
    key: 'insert',
    value: function insert(members) {
      var model = new this(members);
      return model.save();
    }
  }, {
    key: 'db',
    get: function get() {
      return require('../db/db')();
    }
  }]);

  return Model;
})();

module.exports = Model;

},{"../db/db":1,"../utility/date":29}],6:[function(require,module,exports){
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function () {
      return (root['Autolinker'] = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Autolinker'] = factory();
  }
}(this, function () {

/*!
 * Autolinker.js
 * 0.22.0
 *
 * Copyright(c) 2015 Gregory Jacobs <greg@greg-jacobs.com>
 * MIT
 *
 * https://github.com/gregjacobs/Autolinker.js
 */
/**
 * @class Autolinker
 * @extends Object
 *
 * Utility class used to process a given string of text, and wrap the matches in
 * the appropriate anchor (&lt;a&gt;) tags to turn them into links.
 *
 * Any of the configuration options may be provided in an Object (map) provided
 * to the Autolinker constructor, which will configure how the {@link #link link()}
 * method will process the links.
 *
 * For example:
 *
 *     var autolinker = new Autolinker( {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *
 *     var html = autolinker.link( "Joe went to www.yahoo.com" );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 *
 *
 * The {@link #static-link static link()} method may also be used to inline options into a single call, which may
 * be more convenient for one-off uses. For example:
 *
 *     var html = Autolinker.link( "Joe went to www.yahoo.com", {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 *
 *
 * ## Custom Replacements of Links
 *
 * If the configuration options do not provide enough flexibility, a {@link #replaceFn}
 * may be provided to fully customize the output of Autolinker. This function is
 * called once for each URL/Email/Phone#/Twitter Handle/Hashtag match that is
 * encountered.
 *
 * For example:
 *
 *     var input = "...";  // string with URLs, Email Addresses, Phone #s, Twitter Handles, and Hashtags
 *
 *     var linkedText = Autolinker.link( input, {
 *         replaceFn : function( autolinker, match ) {
 *             console.log( "href = ", match.getAnchorHref() );
 *             console.log( "text = ", match.getAnchorText() );
 *
 *             switch( match.getType() ) {
 *                 case 'url' :
 *                     console.log( "url: ", match.getUrl() );
 *
 *                     if( match.getUrl().indexOf( 'mysite.com' ) === -1 ) {
 *                         var tag = autolinker.getTagBuilder().build( match );  // returns an `Autolinker.HtmlTag` instance, which provides mutator methods for easy changes
 *                         tag.setAttr( 'rel', 'nofollow' );
 *                         tag.addClass( 'external-link' );
 *
 *                         return tag;
 *
 *                     } else {
 *                         return true;  // let Autolinker perform its normal anchor tag replacement
 *                     }
 *
 *                 case 'email' :
 *                     var email = match.getEmail();
 *                     console.log( "email: ", email );
 *
 *                     if( email === "my@own.address" ) {
 *                         return false;  // don't auto-link this particular email address; leave as-is
 *                     } else {
 *                         return;  // no return value will have Autolinker perform its normal anchor tag replacement (same as returning `true`)
 *                     }
 *
 *                 case 'phone' :
 *                     var phoneNumber = match.getPhoneNumber();
 *                     console.log( phoneNumber );
 *
 *                     return '<a href="http://newplace.to.link.phone.numbers.to/">' + phoneNumber + '</a>';
 *
 *                 case 'twitter' :
 *                     var twitterHandle = match.getTwitterHandle();
 *                     console.log( twitterHandle );
 *
 *                     return '<a href="http://newplace.to.link.twitter.handles.to/">' + twitterHandle + '</a>';
 *
 *                 case 'hashtag' :
 *                     var hashtag = match.getHashtag();
 *                     console.log( hashtag );
 *
 *                     return '<a href="http://newplace.to.link.hashtag.handles.to/">' + hashtag + '</a>';
 *             }
 *         }
 *     } );
 *
 *
 * The function may return the following values:
 *
 * - `true` (Boolean): Allow Autolinker to replace the match as it normally would.
 * - `false` (Boolean): Do not replace the current match at all - leave as-is.
 * - Any String: If a string is returned from the function, the string will be used directly as the replacement HTML for
 *   the match.
 * - An {@link Autolinker.HtmlTag} instance, which can be used to build/modify an HTML tag before writing out its HTML text.
 *
 * @constructor
 * @param {Object} [cfg] The configuration options for the Autolinker instance, specified in an Object (map).
 */
var Autolinker = function( cfg ) {
	Autolinker.Util.assign( this, cfg );  // assign the properties of `cfg` onto the Autolinker instance. Prototype properties will be used for missing configs.

	// Validate the value of the `hashtag` cfg.
	var hashtag = this.hashtag;
	if( hashtag !== false && hashtag !== 'twitter' && hashtag !== 'facebook' && hashtag !== 'instagram' ) {
		throw new Error( "invalid `hashtag` cfg - see docs" );
	}

	// Normalize the configs
	this.urls     = this.normalizeUrlsCfg( this.urls );
	this.truncate = this.normalizeTruncateCfg( this.truncate );
};

Autolinker.prototype = {
	constructor : Autolinker,  // fix constructor property

	/**
	 * @cfg {Boolean/Object} urls
	 *
	 * `true` if URLs should be automatically linked, `false` if they should not
	 * be.
	 *
	 * This option also accepts an Object form with 3 properties, to allow for
	 * more customization of what exactly gets linked. All default to `true`:
	 *
	 * @param {Boolean} schemeMatches `true` to match URLs found prefixed with a
	 *   scheme, i.e. `http://google.com`, or `other+scheme://google.com`,
	 *   `false` to prevent these types of matches.
	 * @param {Boolean} wwwMatches `true` to match urls found prefixed with
	 *   `'www.'`, i.e. `www.google.com`. `false` to prevent these types of
	 *   matches. Note that if the URL had a prefixed scheme, and
	 *   `schemeMatches` is true, it will still be linked.
	 * @param {Boolean} tldMatches `true` to match URLs with known top level
	 *   domains (.com, .net, etc.) that are not prefixed with a scheme or
	 *   `'www.'`. This option attempts to match anything that looks like a URL
	 *   in the given text. Ex: `google.com`, `asdf.org/?page=1`, etc. `false`
	 *   to prevent these types of matches.
	 */
	urls : true,

	/**
	 * @cfg {Boolean} email
	 *
	 * `true` if email addresses should be automatically linked, `false` if they
	 * should not be.
	 */
	email : true,

	/**
	 * @cfg {Boolean} twitter
	 *
	 * `true` if Twitter handles ("@example") should be automatically linked,
	 * `false` if they should not be.
	 */
	twitter : true,

	/**
	 * @cfg {Boolean} phone
	 *
	 * `true` if Phone numbers ("(555)555-5555") should be automatically linked,
	 * `false` if they should not be.
	 */
	phone: true,

	/**
	 * @cfg {Boolean/String} hashtag
	 *
	 * A string for the service name to have hashtags (ex: "#myHashtag")
	 * auto-linked to. The currently-supported values are:
	 *
	 * - 'twitter'
	 * - 'facebook'
	 * - 'instagram'
	 *
	 * Pass `false` to skip auto-linking of hashtags.
	 */
	hashtag : false,

	/**
	 * @cfg {Boolean} newWindow
	 *
	 * `true` if the links should open in a new window, `false` otherwise.
	 */
	newWindow : true,

	/**
	 * @cfg {Boolean} stripPrefix
	 *
	 * `true` if 'http://' or 'https://' and/or the 'www.' should be stripped
	 * from the beginning of URL links' text, `false` otherwise.
	 */
	stripPrefix : true,

	/**
	 * @cfg {Number/Object} truncate
	 *
	 * ## Number Form
	 *
	 * A number for how many characters matched text should be truncated to
	 * inside the text of a link. If the matched text is over this number of
	 * characters, it will be truncated to this length by adding a two period
	 * ellipsis ('..') to the end of the string.
	 *
	 * For example: A url like 'http://www.yahoo.com/some/long/path/to/a/file'
	 * truncated to 25 characters might look something like this:
	 * 'yahoo.com/some/long/pat..'
	 *
	 * Example Usage:
	 *
	 *     truncate: 25
	 *
	 *
	 * ## Object Form
	 *
	 * An Object may also be provided with two properties: `length` (Number) and
	 * `location` (String). `location` may be one of the following: 'end'
	 * (default), 'middle', or 'smart'.
	 *
	 * Example Usage:
	 *
	 *     truncate: { length: 25, location: 'middle' }
	 *
	 * @cfg {Number} truncate.length How many characters to allow before
	 *   truncation will occur.
	 * @cfg {"end"/"middle"/"smart"} [truncate.location="end"]
	 *
	 * - 'end' (default): will truncate up to the number of characters, and then
	 *   add an ellipsis at the end. Ex: 'yahoo.com/some/long/pat..'
	 * - 'middle': will truncate and add the ellipsis in the middle. Ex:
	 *   'yahoo.com/s..th/to/a/file'
	 * - 'smart': for URLs where the algorithm attempts to strip out unnecessary
	 *   parts first (such as the 'www.', then URL scheme, hash, etc.),
	 *   attempting to make the URL human-readable before looking for a good
	 *   point to insert the ellipsis if it is still too long. Ex:
	 *   'yahoo.com/some..to/a/file'. For more details, see
	 *   {@link Autolinker.truncate.TruncateSmart}.
	 */
	truncate : undefined,

	/**
	 * @cfg {String} className
	 *
	 * A CSS class name to add to the generated links. This class will be added to all links, as well as this class
	 * plus match suffixes for styling url/email/phone/twitter/hashtag links differently.
	 *
	 * For example, if this config is provided as "myLink", then:
	 *
	 * - URL links will have the CSS classes: "myLink myLink-url"
	 * - Email links will have the CSS classes: "myLink myLink-email", and
	 * - Twitter links will have the CSS classes: "myLink myLink-twitter"
	 * - Phone links will have the CSS classes: "myLink myLink-phone"
	 * - Hashtag links will have the CSS classes: "myLink myLink-hashtag"
	 */
	className : "",

	/**
	 * @cfg {Function} replaceFn
	 *
	 * A function to individually process each match found in the input string.
	 *
	 * See the class's description for usage.
	 *
	 * This function is called with the following parameters:
	 *
	 * @cfg {Autolinker} replaceFn.autolinker The Autolinker instance, which may be used to retrieve child objects from (such
	 *   as the instance's {@link #getTagBuilder tag builder}).
	 * @cfg {Autolinker.match.Match} replaceFn.match The Match instance which can be used to retrieve information about the
	 *   match that the `replaceFn` is currently processing. See {@link Autolinker.match.Match} subclasses for details.
	 */


	/**
	 * @private
	 * @property {Autolinker.htmlParser.HtmlParser} htmlParser
	 *
	 * The HtmlParser instance used to skip over HTML tags, while finding text nodes to process. This is lazily instantiated
	 * in the {@link #getHtmlParser} method.
	 */
	htmlParser : undefined,

	/**
	 * @private
	 * @property {Autolinker.matchParser.MatchParser} matchParser
	 *
	 * The MatchParser instance used to find matches in the text nodes of an input string passed to
	 * {@link #link}. This is lazily instantiated in the {@link #getMatchParser} method.
	 */
	matchParser : undefined,

	/**
	 * @private
	 * @property {Autolinker.AnchorTagBuilder} tagBuilder
	 *
	 * The AnchorTagBuilder instance used to build match replacement anchor tags. Note: this is lazily instantiated
	 * in the {@link #getTagBuilder} method.
	 */
	tagBuilder : undefined,


	/**
	 * Normalizes the {@link #urls} config into an Object with 3 properties:
	 * `schemeMatches`, `wwwMatches`, and `tldMatches`, all Booleans.
	 *
	 * See {@link #urls} config for details.
	 *
	 * @private
	 * @param {Boolean/Object} urls
	 * @return {Object}
	 */
	normalizeUrlsCfg : function( urls ) {
		if( typeof urls === 'boolean' ) {
			return { schemeMatches: urls, wwwMatches: urls, tldMatches: urls };
		} else {
			return Autolinker.Util.defaults( urls || {}, { schemeMatches: true, wwwMatches: true, tldMatches: true } );
		}
	},


	/**
	 * Normalizes the {@link #truncate} config into an Object with 2 properties:
	 * `length` (Number), and `location` (String).
	 *
	 * See {@link #truncate} config for details.
	 *
	 * @private
	 * @param {Number/Object} truncate
	 * @return {Object}
	 */
	normalizeTruncateCfg : function( truncate ) {
		if( typeof truncate === 'number' ) {
			return { length: truncate, location: 'end' };

		} else {  // object, or undefined/null
			return Autolinker.Util.defaults( truncate || {}, {
				length   : Number.POSITIVE_INFINITY,
				location : 'end'
			} );
		}
	},


	/**
	 * Automatically links URLs, Email addresses, Phone numbers, Twitter
	 * handles, and Hashtags found in the given chunk of HTML. Does not link
	 * URLs found within HTML tags.
	 *
	 * For instance, if given the text: `You should go to http://www.yahoo.com`,
	 * then the result will be `You should go to
	 * &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
	 *
	 * This method finds the text around any HTML elements in the input
	 * `textOrHtml`, which will be the text that is processed. Any original HTML
	 * elements will be left as-is, as well as the text that is already wrapped
	 * in anchor (&lt;a&gt;) tags.
	 *
	 * @param {String} textOrHtml The HTML or text to autolink matches within
	 *   (depending on if the {@link #urls}, {@link #email}, {@link #phone},
	 *   {@link #twitter}, and {@link #hashtag} options are enabled).
	 * @return {String} The HTML, with matches automatically linked.
	 */
	link : function( textOrHtml ) {
		if( !textOrHtml ) { return ""; }  // handle `null` and `undefined`

		var htmlParser = this.getHtmlParser(),
		    htmlNodes = htmlParser.parse( textOrHtml ),
		    anchorTagStackCount = 0,  // used to only process text around anchor tags, and any inner text/html they may have
		    resultHtml = [];

		for( var i = 0, len = htmlNodes.length; i < len; i++ ) {
			var node = htmlNodes[ i ],
			    nodeType = node.getType(),
			    nodeText = node.getText();

			if( nodeType === 'element' ) {
				// Process HTML nodes in the input `textOrHtml`
				if( node.getTagName() === 'a' ) {
					if( !node.isClosing() ) {  // it's the start <a> tag
						anchorTagStackCount++;
					} else {   // it's the end </a> tag
						anchorTagStackCount = Math.max( anchorTagStackCount - 1, 0 );  // attempt to handle extraneous </a> tags by making sure the stack count never goes below 0
					}
				}
				resultHtml.push( nodeText );  // now add the text of the tag itself verbatim

			} else if( nodeType === 'entity' || nodeType === 'comment' ) {
				resultHtml.push( nodeText );  // append HTML entity nodes (such as '&nbsp;') or HTML comments (such as '<!-- Comment -->') verbatim

			} else {
				// Process text nodes in the input `textOrHtml`
				if( anchorTagStackCount === 0 ) {
					// If we're not within an <a> tag, process the text node to linkify
					var linkifiedStr = this.linkifyStr( nodeText );
					resultHtml.push( linkifiedStr );

				} else {
					// `text` is within an <a> tag, simply append the text - we do not want to autolink anything
					// already within an <a>...</a> tag
					resultHtml.push( nodeText );
				}
			}
		}

		return resultHtml.join( "" );
	},

	/**
	 * Process the text that lies in between HTML tags, performing the anchor
	 * tag replacements for the matches, and returns the string with the
	 * replacements made.
	 *
	 * This method does the actual wrapping of matches with anchor tags.
	 *
	 * @private
	 * @param {String} str The string of text to auto-link.
	 * @return {String} The text with anchor tags auto-filled.
	 */
	linkifyStr : function( str ) {
		return this.getMatchParser().replace( str, this.createMatchReturnVal, this );
	},


	/**
	 * Creates the return string value for a given match in the input string,
	 * for the {@link #linkifyStr} method.
	 *
	 * This method handles the {@link #replaceFn}, if one was provided.
	 *
	 * @private
	 * @param {Autolinker.match.Match} match The Match object that represents the match.
	 * @return {String} The string that the `match` should be replaced with. This is usually the anchor tag string, but
	 *   may be the `matchStr` itself if the match is not to be replaced.
	 */
	createMatchReturnVal : function( match ) {
		// Handle a custom `replaceFn` being provided
		var replaceFnResult;
		if( this.replaceFn ) {
			replaceFnResult = this.replaceFn.call( this, this, match );  // Autolinker instance is the context, and the first arg
		}

		if( typeof replaceFnResult === 'string' ) {
			return replaceFnResult;  // `replaceFn` returned a string, use that

		} else if( replaceFnResult === false ) {
			return match.getMatchedText();  // no replacement for the match

		} else if( replaceFnResult instanceof Autolinker.HtmlTag ) {
			return replaceFnResult.toAnchorString();

		} else {  // replaceFnResult === true, or no/unknown return value from function
			// Perform Autolinker's default anchor tag generation
			var tagBuilder = this.getTagBuilder(),
			    anchorTag = tagBuilder.build( match );  // returns an Autolinker.HtmlTag instance

			return anchorTag.toAnchorString();
		}
	},


	/**
	 * Lazily instantiates and returns the {@link #htmlParser} instance for this Autolinker instance.
	 *
	 * @protected
	 * @return {Autolinker.htmlParser.HtmlParser}
	 */
	getHtmlParser : function() {
		var htmlParser = this.htmlParser;

		if( !htmlParser ) {
			htmlParser = this.htmlParser = new Autolinker.htmlParser.HtmlParser();
		}

		return htmlParser;
	},


	/**
	 * Lazily instantiates and returns the {@link #matchParser} instance for this Autolinker instance.
	 *
	 * @protected
	 * @return {Autolinker.matchParser.MatchParser}
	 */
	getMatchParser : function() {
		var matchParser = this.matchParser;

		if( !matchParser ) {
			matchParser = this.matchParser = new Autolinker.matchParser.MatchParser( {
				urls        : this.urls,
				email       : this.email,
				twitter     : this.twitter,
				phone       : this.phone,
				hashtag     : this.hashtag,
				stripPrefix : this.stripPrefix
			} );
		}

		return matchParser;
	},


	/**
	 * Returns the {@link #tagBuilder} instance for this Autolinker instance, lazily instantiating it
	 * if it does not yet exist.
	 *
	 * This method may be used in a {@link #replaceFn} to generate the {@link Autolinker.HtmlTag HtmlTag} instance that
	 * Autolinker would normally generate, and then allow for modifications before returning it. For example:
	 *
	 *     var html = Autolinker.link( "Test google.com", {
	 *         replaceFn : function( autolinker, match ) {
	 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance
	 *             tag.setAttr( 'rel', 'nofollow' );
	 *
	 *             return tag;
	 *         }
	 *     } );
	 *
	 *     // generated html:
	 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
	 *
	 * @return {Autolinker.AnchorTagBuilder}
	 */
	getTagBuilder : function() {
		var tagBuilder = this.tagBuilder;

		if( !tagBuilder ) {
			tagBuilder = this.tagBuilder = new Autolinker.AnchorTagBuilder( {
				newWindow   : this.newWindow,
				truncate    : this.truncate,
				className   : this.className
			} );
		}

		return tagBuilder;
	}

};


/**
 * Automatically links URLs, Email addresses, Phone Numbers, Twitter handles,
 * and Hashtags found in the given chunk of HTML. Does not link URLs found
 * within HTML tags.
 *
 * For instance, if given the text: `You should go to http://www.yahoo.com`,
 * then the result will be `You should go to &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
 *
 * Example:
 *
 *     var linkedText = Autolinker.link( "Go to google.com", { newWindow: false } );
 *     // Produces: "Go to <a href="http://google.com">google.com</a>"
 *
 * @static
 * @param {String} textOrHtml The HTML or text to find matches within (depending
 *   on if the {@link #urls}, {@link #email}, {@link #phone}, {@link #twitter},
 *   and {@link #hashtag} options are enabled).
 * @param {Object} [options] Any of the configuration options for the Autolinker
 *   class, specified in an Object (map). See the class description for an
 *   example call.
 * @return {String} The HTML text, with matches automatically linked.
 */
Autolinker.link = function( textOrHtml, options ) {
	var autolinker = new Autolinker( options );
	return autolinker.link( textOrHtml );
};


// Autolinker Namespaces
Autolinker.match = {};
Autolinker.htmlParser = {};
Autolinker.matchParser = {};
Autolinker.truncate = {};

/*global Autolinker */
/*jshint eqnull:true, boss:true */
/**
 * @class Autolinker.Util
 * @singleton
 *
 * A few utility methods for Autolinker.
 */
Autolinker.Util = {

	/**
	 * @property {Function} abstractMethod
	 *
	 * A function object which represents an abstract method.
	 */
	abstractMethod : function() { throw "abstract"; },


	/**
	 * @private
	 * @property {RegExp} trimRegex
	 *
	 * The regular expression used to trim the leading and trailing whitespace
	 * from a string.
	 */
	trimRegex : /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,


	/**
	 * Assigns (shallow copies) the properties of `src` onto `dest`.
	 *
	 * @param {Object} dest The destination object.
	 * @param {Object} src The source object.
	 * @return {Object} The destination object (`dest`)
	 */
	assign : function( dest, src ) {
		for( var prop in src ) {
			if( src.hasOwnProperty( prop ) ) {
				dest[ prop ] = src[ prop ];
			}
		}

		return dest;
	},


	/**
	 * Assigns (shallow copies) the properties of `src` onto `dest`, if the
	 * corresponding property on `dest` === `undefined`.
	 *
	 * @param {Object} dest The destination object.
	 * @param {Object} src The source object.
	 * @return {Object} The destination object (`dest`)
	 */
	defaults : function( dest, src ) {
		for( var prop in src ) {
			if( src.hasOwnProperty( prop ) && dest[ prop ] === undefined ) {
				dest[ prop ] = src[ prop ];
			}
		}

		return dest;
	},


	/**
	 * Extends `superclass` to create a new subclass, adding the `protoProps` to the new subclass's prototype.
	 *
	 * @param {Function} superclass The constructor function for the superclass.
	 * @param {Object} protoProps The methods/properties to add to the subclass's prototype. This may contain the
	 *   special property `constructor`, which will be used as the new subclass's constructor function.
	 * @return {Function} The new subclass function.
	 */
	extend : function( superclass, protoProps ) {
		var superclassProto = superclass.prototype;

		var F = function() {};
		F.prototype = superclassProto;

		var subclass;
		if( protoProps.hasOwnProperty( 'constructor' ) ) {
			subclass = protoProps.constructor;
		} else {
			subclass = function() { superclassProto.constructor.apply( this, arguments ); };
		}

		var subclassProto = subclass.prototype = new F();  // set up prototype chain
		subclassProto.constructor = subclass;  // fix constructor property
		subclassProto.superclass = superclassProto;

		delete protoProps.constructor;  // don't re-assign constructor property to the prototype, since a new function may have been created (`subclass`), which is now already there
		Autolinker.Util.assign( subclassProto, protoProps );

		return subclass;
	},


	/**
	 * Truncates the `str` at `len - ellipsisChars.length`, and adds the `ellipsisChars` to the
	 * end of the string (by default, two periods: '..'). If the `str` length does not exceed
	 * `len`, the string will be returned unchanged.
	 *
	 * @param {String} str The string to truncate and add an ellipsis to.
	 * @param {Number} truncateLen The length to truncate the string at.
	 * @param {String} [ellipsisChars=..] The ellipsis character(s) to add to the end of `str`
	 *   when truncated. Defaults to '..'
	 */
	ellipsis : function( str, truncateLen, ellipsisChars ) {
		if( str.length > truncateLen ) {
			ellipsisChars = ( ellipsisChars == null ) ? '..' : ellipsisChars;
			str = str.substring( 0, truncateLen - ellipsisChars.length ) + ellipsisChars;
		}
		return str;
	},


	/**
	 * Supports `Array.prototype.indexOf()` functionality for old IE (IE8 and below).
	 *
	 * @param {Array} arr The array to find an element of.
	 * @param {*} element The element to find in the array, and return the index of.
	 * @return {Number} The index of the `element`, or -1 if it was not found.
	 */
	indexOf : function( arr, element ) {
		if( Array.prototype.indexOf ) {
			return arr.indexOf( element );

		} else {
			for( var i = 0, len = arr.length; i < len; i++ ) {
				if( arr[ i ] === element ) return i;
			}
			return -1;
		}
	},



	/**
	 * Performs the functionality of what modern browsers do when `String.prototype.split()` is called
	 * with a regular expression that contains capturing parenthesis.
	 *
	 * For example:
	 *
	 *     // Modern browsers:
	 *     "a,b,c".split( /(,)/ );  // --> [ 'a', ',', 'b', ',', 'c' ]
	 *
	 *     // Old IE (including IE8):
	 *     "a,b,c".split( /(,)/ );  // --> [ 'a', 'b', 'c' ]
	 *
	 * This method emulates the functionality of modern browsers for the old IE case.
	 *
	 * @param {String} str The string to split.
	 * @param {RegExp} splitRegex The regular expression to split the input `str` on. The splitting
	 *   character(s) will be spliced into the array, as in the "modern browsers" example in the
	 *   description of this method.
	 *   Note #1: the supplied regular expression **must** have the 'g' flag specified.
	 *   Note #2: for simplicity's sake, the regular expression does not need
	 *   to contain capturing parenthesis - it will be assumed that any match has them.
	 * @return {String[]} The split array of strings, with the splitting character(s) included.
	 */
	splitAndCapture : function( str, splitRegex ) {
		if( !splitRegex.global ) throw new Error( "`splitRegex` must have the 'g' flag set" );

		var result = [],
		    lastIdx = 0,
		    match;

		while( match = splitRegex.exec( str ) ) {
			result.push( str.substring( lastIdx, match.index ) );
			result.push( match[ 0 ] );  // push the splitting char(s)

			lastIdx = match.index + match[ 0 ].length;
		}
		result.push( str.substring( lastIdx ) );

		return result;
	},


	/**
	 * Trims the leading and trailing whitespace from a string.
	 *
	 * @param {String} str The string to trim.
	 * @return {String}
	 */
	trim : function( str ) {
		return str.replace( this.trimRegex, '' );
	}

};
/*global Autolinker */
/*jshint boss:true */
/**
 * @class Autolinker.HtmlTag
 * @extends Object
 *
 * Represents an HTML tag, which can be used to easily build/modify HTML tags programmatically.
 *
 * Autolinker uses this abstraction to create HTML tags, and then write them out as strings. You may also use
 * this class in your code, especially within a {@link Autolinker#replaceFn replaceFn}.
 *
 * ## Examples
 *
 * Example instantiation:
 *
 *     var tag = new Autolinker.HtmlTag( {
 *         tagName : 'a',
 *         attrs   : { 'href': 'http://google.com', 'class': 'external-link' },
 *         innerHtml : 'Google'
 *     } );
 *
 *     tag.toAnchorString();  // <a href="http://google.com" class="external-link">Google</a>
 *
 *     // Individual accessor methods
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 *
 *
 * Using mutator methods (which may be used in combination with instantiation config properties):
 *
 *     var tag = new Autolinker.HtmlTag();
 *     tag.setTagName( 'a' );
 *     tag.setAttr( 'href', 'http://google.com' );
 *     tag.addClass( 'external-link' );
 *     tag.setInnerHtml( 'Google' );
 *
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 *
 *     tag.toAnchorString();  // <a href="http://google.com" class="external-link">Google</a>
 *
 *
 * ## Example use within a {@link Autolinker#replaceFn replaceFn}
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance, configured with the Match's href and anchor text
 *             tag.setAttr( 'rel', 'nofollow' );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 *
 *
 * ## Example use with a new tag for the replacement
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = new Autolinker.HtmlTag( {
 *                 tagName : 'button',
 *                 attrs   : { 'title': 'Load URL: ' + match.getAnchorHref() },
 *                 innerHtml : 'Load URL: ' + match.getAnchorText()
 *             } );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <button title="Load URL: http://google.com">Load URL: google.com</button>
 */
Autolinker.HtmlTag = Autolinker.Util.extend( Object, {

	/**
	 * @cfg {String} tagName
	 *
	 * The tag name. Ex: 'a', 'button', etc.
	 *
	 * Not required at instantiation time, but should be set using {@link #setTagName} before {@link #toAnchorString}
	 * is executed.
	 */

	/**
	 * @cfg {Object.<String, String>} attrs
	 *
	 * An key/value Object (map) of attributes to create the tag with. The keys are the attribute names, and the
	 * values are the attribute values.
	 */

	/**
	 * @cfg {String} innerHtml
	 *
	 * The inner HTML for the tag.
	 *
	 * Note the camel case name on `innerHtml`. Acronyms are camelCased in this utility (such as not to run into the acronym
	 * naming inconsistency that the DOM developers created with `XMLHttpRequest`). You may alternatively use {@link #innerHTML}
	 * if you prefer, but this one is recommended.
	 */

	/**
	 * @cfg {String} innerHTML
	 *
	 * Alias of {@link #innerHtml}, accepted for consistency with the browser DOM api, but prefer the camelCased version
	 * for acronym names.
	 */


	/**
	 * @protected
	 * @property {RegExp} whitespaceRegex
	 *
	 * Regular expression used to match whitespace in a string of CSS classes.
	 */
	whitespaceRegex : /\s+/,


	/**
	 * @constructor
	 * @param {Object} [cfg] The configuration properties for this class, in an Object (map)
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );

		this.innerHtml = this.innerHtml || this.innerHTML;  // accept either the camelCased form or the fully capitalized acronym
	},


	/**
	 * Sets the tag name that will be used to generate the tag with.
	 *
	 * @param {String} tagName
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setTagName : function( tagName ) {
		this.tagName = tagName;
		return this;
	},


	/**
	 * Retrieves the tag name.
	 *
	 * @return {String}
	 */
	getTagName : function() {
		return this.tagName || "";
	},


	/**
	 * Sets an attribute on the HtmlTag.
	 *
	 * @param {String} attrName The attribute name to set.
	 * @param {String} attrValue The attribute value to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setAttr : function( attrName, attrValue ) {
		var tagAttrs = this.getAttrs();
		tagAttrs[ attrName ] = attrValue;

		return this;
	},


	/**
	 * Retrieves an attribute from the HtmlTag. If the attribute does not exist, returns `undefined`.
	 *
	 * @param {String} attrName The attribute name to retrieve.
	 * @return {String} The attribute's value, or `undefined` if it does not exist on the HtmlTag.
	 */
	getAttr : function( attrName ) {
		return this.getAttrs()[ attrName ];
	},


	/**
	 * Sets one or more attributes on the HtmlTag.
	 *
	 * @param {Object.<String, String>} attrs A key/value Object (map) of the attributes to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setAttrs : function( attrs ) {
		var tagAttrs = this.getAttrs();
		Autolinker.Util.assign( tagAttrs, attrs );

		return this;
	},


	/**
	 * Retrieves the attributes Object (map) for the HtmlTag.
	 *
	 * @return {Object.<String, String>} A key/value object of the attributes for the HtmlTag.
	 */
	getAttrs : function() {
		return this.attrs || ( this.attrs = {} );
	},


	/**
	 * Sets the provided `cssClass`, overwriting any current CSS classes on the HtmlTag.
	 *
	 * @param {String} cssClass One or more space-separated CSS classes to set (overwrite).
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setClass : function( cssClass ) {
		return this.setAttr( 'class', cssClass );
	},


	/**
	 * Convenience method to add one or more CSS classes to the HtmlTag. Will not add duplicate CSS classes.
	 *
	 * @param {String} cssClass One or more space-separated CSS classes to add.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	addClass : function( cssClass ) {
		var classAttr = this.getClass(),
		    whitespaceRegex = this.whitespaceRegex,
		    indexOf = Autolinker.Util.indexOf,  // to support IE8 and below
		    classes = ( !classAttr ) ? [] : classAttr.split( whitespaceRegex ),
		    newClasses = cssClass.split( whitespaceRegex ),
		    newClass;

		while( newClass = newClasses.shift() ) {
			if( indexOf( classes, newClass ) === -1 ) {
				classes.push( newClass );
			}
		}

		this.getAttrs()[ 'class' ] = classes.join( " " );
		return this;
	},


	/**
	 * Convenience method to remove one or more CSS classes from the HtmlTag.
	 *
	 * @param {String} cssClass One or more space-separated CSS classes to remove.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	removeClass : function( cssClass ) {
		var classAttr = this.getClass(),
		    whitespaceRegex = this.whitespaceRegex,
		    indexOf = Autolinker.Util.indexOf,  // to support IE8 and below
		    classes = ( !classAttr ) ? [] : classAttr.split( whitespaceRegex ),
		    removeClasses = cssClass.split( whitespaceRegex ),
		    removeClass;

		while( classes.length && ( removeClass = removeClasses.shift() ) ) {
			var idx = indexOf( classes, removeClass );
			if( idx !== -1 ) {
				classes.splice( idx, 1 );
			}
		}

		this.getAttrs()[ 'class' ] = classes.join( " " );
		return this;
	},


	/**
	 * Convenience method to retrieve the CSS class(es) for the HtmlTag, which will each be separated by spaces when
	 * there are multiple.
	 *
	 * @return {String}
	 */
	getClass : function() {
		return this.getAttrs()[ 'class' ] || "";
	},


	/**
	 * Convenience method to check if the tag has a CSS class or not.
	 *
	 * @param {String} cssClass The CSS class to check for.
	 * @return {Boolean} `true` if the HtmlTag has the CSS class, `false` otherwise.
	 */
	hasClass : function( cssClass ) {
		return ( ' ' + this.getClass() + ' ' ).indexOf( ' ' + cssClass + ' ' ) !== -1;
	},


	/**
	 * Sets the inner HTML for the tag.
	 *
	 * @param {String} html The inner HTML to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */
	setInnerHtml : function( html ) {
		this.innerHtml = html;

		return this;
	},


	/**
	 * Retrieves the inner HTML for the tag.
	 *
	 * @return {String}
	 */
	getInnerHtml : function() {
		return this.innerHtml || "";
	},


	/**
	 * Override of superclass method used to generate the HTML string for the tag.
	 *
	 * @return {String}
	 */
	toAnchorString : function() {
		var tagName = this.getTagName(),
		    attrsStr = this.buildAttrsStr();

		attrsStr = ( attrsStr ) ? ' ' + attrsStr : '';  // prepend a space if there are actually attributes

		return [ '<', tagName, attrsStr, '>', this.getInnerHtml(), '</', tagName, '>' ].join( "" );
	},


	/**
	 * Support method for {@link #toAnchorString}, returns the string space-separated key="value" pairs, used to populate
	 * the stringified HtmlTag.
	 *
	 * @protected
	 * @return {String} Example return: `attr1="value1" attr2="value2"`
	 */
	buildAttrsStr : function() {
		if( !this.attrs ) return "";  // no `attrs` Object (map) has been set, return empty string

		var attrs = this.getAttrs(),
		    attrsArr = [];

		for( var prop in attrs ) {
			if( attrs.hasOwnProperty( prop ) ) {
				attrsArr.push( prop + '="' + attrs[ prop ] + '"' );
			}
		}
		return attrsArr.join( " " );
	}

} );

/*global Autolinker */
/*jshint sub:true */
/**
 * @protected
 * @class Autolinker.AnchorTagBuilder
 * @extends Object
 *
 * Builds anchor (&lt;a&gt;) tags for the Autolinker utility when a match is found.
 *
 * Normally this class is instantiated, configured, and used internally by an
 * {@link Autolinker} instance, but may actually be retrieved in a {@link Autolinker#replaceFn replaceFn}
 * to create {@link Autolinker.HtmlTag HtmlTag} instances which may be modified
 * before returning from the {@link Autolinker#replaceFn replaceFn}. For
 * example:
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance
 *             tag.setAttr( 'rel', 'nofollow' );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 */
Autolinker.AnchorTagBuilder = Autolinker.Util.extend( Object, {

	/**
	 * @cfg {Boolean} newWindow
	 * @inheritdoc Autolinker#newWindow
	 */

	/**
	 * @cfg {Object} truncate
	 * @inheritdoc Autolinker#truncate
	 */

	/**
	 * @cfg {String} className
	 * @inheritdoc Autolinker#className
	 */


	/**
	 * @constructor
	 * @param {Object} [cfg] The configuration options for the AnchorTagBuilder instance, specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
	},


	/**
	 * Generates the actual anchor (&lt;a&gt;) tag to use in place of the
	 * matched text, via its `match` object.
	 *
	 * @param {Autolinker.match.Match} match The Match instance to generate an
	 *   anchor tag from.
	 * @return {Autolinker.HtmlTag} The HtmlTag instance for the anchor tag.
	 */
	build : function( match ) {
		return new Autolinker.HtmlTag( {
			tagName   : 'a',
			attrs     : this.createAttrs( match.getType(), match.getAnchorHref() ),
			innerHtml : this.processAnchorText( match.getAnchorText() )
		} );
	},


	/**
	 * Creates the Object (map) of the HTML attributes for the anchor (&lt;a&gt;)
	 *   tag being generated.
	 *
	 * @protected
	 * @param {"url"/"email"/"phone"/"twitter"/"hashtag"} matchType The type of
	 *   match that an anchor tag is being generated for.
	 * @param {String} anchorHref The href for the anchor tag.
	 * @return {Object} A key/value Object (map) of the anchor tag's attributes.
	 */
	createAttrs : function( matchType, anchorHref ) {
		var attrs = {
			'href' : anchorHref  // we'll always have the `href` attribute
		};

		var cssClass = this.createCssClass( matchType );
		if( cssClass ) {
			attrs[ 'class' ] = cssClass;
		}
		if( this.newWindow ) {
			attrs[ 'target' ] = "_blank";
		}

		return attrs;
	},


	/**
	 * Creates the CSS class that will be used for a given anchor tag, based on
	 * the `matchType` and the {@link #className} config.
	 *
	 * @private
	 * @param {"url"/"email"/"phone"/"twitter"/"hashtag"} matchType The type of
	 *   match that an anchor tag is being generated for.
	 * @return {String} The CSS class string for the link. Example return:
	 *   "myLink myLink-url". If no {@link #className} was configured, returns
	 *   an empty string.
	 */
	createCssClass : function( matchType ) {
		var className = this.className;

		if( !className )
			return "";
		else
			return className + " " + className + "-" + matchType;  // ex: "myLink myLink-url", "myLink myLink-email", "myLink myLink-phone", "myLink myLink-twitter", or "myLink myLink-hashtag"
	},


	/**
	 * Processes the `anchorText` by truncating the text according to the
	 * {@link #truncate} config.
	 *
	 * @private
	 * @param {String} anchorText The anchor tag's text (i.e. what will be
	 *   displayed).
	 * @return {String} The processed `anchorText`.
	 */
	processAnchorText : function( anchorText ) {
		anchorText = this.doTruncate( anchorText );

		return anchorText;
	},


	/**
	 * Performs the truncation of the `anchorText` based on the {@link #truncate}
	 * option. If the `anchorText` is longer than the length specified by the
	 * {@link #truncate} option, the truncation is performed based on the
	 * `location` property. See {@link #truncate} for details.
	 *
	 * @private
	 * @param {String} anchorText The anchor tag's text (i.e. what will be
	 *   displayed).
	 * @return {String} The truncated anchor text.
	 */
	doTruncate : function( anchorText ) {
		var truncate = this.truncate;
		if( !truncate ) return anchorText;

		var truncateLength = truncate.length,
			truncateLocation = truncate.location;

		if( truncateLocation === 'smart' ) {
			return Autolinker.truncate.TruncateSmart( anchorText, truncateLength, '..' );

		} else if( truncateLocation === 'middle' ) {
			return Autolinker.truncate.TruncateMiddle( anchorText, truncateLength, '..' );

		} else {
			return Autolinker.truncate.TruncateEnd( anchorText, truncateLength, '..' );
		}
	}

} );

/*global Autolinker */
/**
 * @private
 * @class Autolinker.htmlParser.HtmlParser
 * @extends Object
 *
 * An HTML parser implementation which simply walks an HTML string and returns an array of
 * {@link Autolinker.htmlParser.HtmlNode HtmlNodes} that represent the basic HTML structure of the input string.
 *
 * Autolinker uses this to only link URLs/emails/Twitter handles within text nodes, effectively ignoring / "walking
 * around" HTML tags.
 */
Autolinker.htmlParser.HtmlParser = Autolinker.Util.extend( Object, {

	/**
	 * @private
	 * @property {RegExp} htmlRegex
	 *
	 * The regular expression used to pull out HTML tags from a string. Handles namespaced HTML tags and
	 * attribute names, as specified by http://www.w3.org/TR/html-markup/syntax.html.
	 *
	 * Capturing groups:
	 *
	 * 1. The "!DOCTYPE" tag name, if a tag is a &lt;!DOCTYPE&gt; tag.
	 * 2. If it is an end tag, this group will have the '/'.
	 * 3. If it is a comment tag, this group will hold the comment text (i.e.
	 *    the text inside the `&lt;!--` and `--&gt;`.
	 * 4. The tag name for all tags (other than the &lt;!DOCTYPE&gt; tag)
	 */
	htmlRegex : (function() {
		var commentTagRegex = /!--([\s\S]+?)--/,
		    tagNameRegex = /[0-9a-zA-Z][0-9a-zA-Z:]*/,
		    attrNameRegex = /[^\s\0"'>\/=\x01-\x1F\x7F]+/,   // the unicode range accounts for excluding control chars, and the delete char
		    attrValueRegex = /(?:"[^"]*?"|'[^']*?'|[^'"=<>`\s]+)/, // double quoted, single quoted, or unquoted attribute values
		    nameEqualsValueRegex = attrNameRegex.source + '(?:\\s*=\\s*' + attrValueRegex.source + ')?';  // optional '=[value]'

		return new RegExp( [
			// for <!DOCTYPE> tag. Ex: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">)
			'(?:',
				'<(!DOCTYPE)',  // *** Capturing Group 1 - If it's a doctype tag

					// Zero or more attributes following the tag name
					'(?:',
						'\\s+',  // one or more whitespace chars before an attribute

						// Either:
						// A. attr="value", or
						// B. "value" alone (To cover example doctype tag: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">)
						'(?:', nameEqualsValueRegex, '|', attrValueRegex.source + ')',
					')*',
				'>',
			')',

			'|',

			// All other HTML tags (i.e. tags that are not <!DOCTYPE>)
			'(?:',
				'<(/)?',  // Beginning of a tag or comment. Either '<' for a start tag, or '</' for an end tag.
				          // *** Capturing Group 2: The slash or an empty string. Slash ('/') for end tag, empty string for start or self-closing tag.

					'(?:',
						commentTagRegex.source,  // *** Capturing Group 3 - A Comment Tag's Text

						'|',

						'(?:',

							// *** Capturing Group 4 - The tag name
							'(' + tagNameRegex.source + ')',

							// Zero or more attributes following the tag name
							'(?:',
								'\\s+',                // one or more whitespace chars before an attribute
								nameEqualsValueRegex,  // attr="value" (with optional ="value" part)
							')*',

							'\\s*/?',  // any trailing spaces and optional '/' before the closing '>'

						')',
					')',
				'>',
			')'
		].join( "" ), 'gi' );
	} )(),

	/**
	 * @private
	 * @property {RegExp} htmlCharacterEntitiesRegex
	 *
	 * The regular expression that matches common HTML character entities.
	 *
	 * Ignoring &amp; as it could be part of a query string -- handling it separately.
	 */
	htmlCharacterEntitiesRegex: /(&nbsp;|&#160;|&lt;|&#60;|&gt;|&#62;|&quot;|&#34;|&#39;)/gi,


	/**
	 * Parses an HTML string and returns a simple array of {@link Autolinker.htmlParser.HtmlNode HtmlNodes}
	 * to represent the HTML structure of the input string.
	 *
	 * @param {String} html The HTML to parse.
	 * @return {Autolinker.htmlParser.HtmlNode[]}
	 */
	parse : function( html ) {
		var htmlRegex = this.htmlRegex,
		    currentResult,
		    lastIndex = 0,
		    textAndEntityNodes,
		    nodes = [];  // will be the result of the method

		while( ( currentResult = htmlRegex.exec( html ) ) !== null ) {
			var tagText = currentResult[ 0 ],
			    commentText = currentResult[ 3 ], // if we've matched a comment
			    tagName = currentResult[ 1 ] || currentResult[ 4 ],  // The <!DOCTYPE> tag (ex: "!DOCTYPE"), or another tag (ex: "a" or "img")
			    isClosingTag = !!currentResult[ 2 ],
			    inBetweenTagsText = html.substring( lastIndex, currentResult.index );

			// Push TextNodes and EntityNodes for any text found between tags
			if( inBetweenTagsText ) {
				textAndEntityNodes = this.parseTextAndEntityNodes( inBetweenTagsText );
				nodes.push.apply( nodes, textAndEntityNodes );
			}

			// Push the CommentNode or ElementNode
			if( commentText ) {
				nodes.push( this.createCommentNode( tagText, commentText ) );
			} else {
				nodes.push( this.createElementNode( tagText, tagName, isClosingTag ) );
			}

			lastIndex = currentResult.index + tagText.length;
		}

		// Process any remaining text after the last HTML element. Will process all of the text if there were no HTML elements.
		if( lastIndex < html.length ) {
			var text = html.substring( lastIndex );

			// Push TextNodes and EntityNodes for any text found between tags
			if( text ) {
				textAndEntityNodes = this.parseTextAndEntityNodes( text );
				nodes.push.apply( nodes, textAndEntityNodes );
			}
		}

		return nodes;
	},


	/**
	 * Parses text and HTML entity nodes from a given string. The input string
	 * should not have any HTML tags (elements) within it.
	 *
	 * @private
	 * @param {String} text The text to parse.
	 * @return {Autolinker.htmlParser.HtmlNode[]} An array of HtmlNodes to
	 *   represent the {@link Autolinker.htmlParser.TextNode TextNodes} and
	 *   {@link Autolinker.htmlParser.EntityNode EntityNodes} found.
	 */
	parseTextAndEntityNodes : function( text ) {
		var nodes = [],
		    textAndEntityTokens = Autolinker.Util.splitAndCapture( text, this.htmlCharacterEntitiesRegex );  // split at HTML entities, but include the HTML entities in the results array

		// Every even numbered token is a TextNode, and every odd numbered token is an EntityNode
		// For example: an input `text` of "Test &quot;this&quot; today" would turn into the
		//   `textAndEntityTokens`: [ 'Test ', '&quot;', 'this', '&quot;', ' today' ]
		for( var i = 0, len = textAndEntityTokens.length; i < len; i += 2 ) {
			var textToken = textAndEntityTokens[ i ],
			    entityToken = textAndEntityTokens[ i + 1 ];

			if( textToken ) nodes.push( this.createTextNode( textToken ) );
			if( entityToken ) nodes.push( this.createEntityNode( entityToken ) );
		}
		return nodes;
	},


	/**
	 * Factory method to create an {@link Autolinker.htmlParser.CommentNode CommentNode}.
	 *
	 * @private
	 * @param {String} tagText The full text of the tag (comment) that was
	 *   matched, including its &lt;!-- and --&gt;.
	 * @param {String} comment The full text of the comment that was matched.
	 */
	createCommentNode : function( tagText, commentText ) {
		return new Autolinker.htmlParser.CommentNode( {
			text: tagText,
			comment: Autolinker.Util.trim( commentText )
		} );
	},


	/**
	 * Factory method to create an {@link Autolinker.htmlParser.ElementNode ElementNode}.
	 *
	 * @private
	 * @param {String} tagText The full text of the tag (element) that was
	 *   matched, including its attributes.
	 * @param {String} tagName The name of the tag. Ex: An &lt;img&gt; tag would
	 *   be passed to this method as "img".
	 * @param {Boolean} isClosingTag `true` if it's a closing tag, false
	 *   otherwise.
	 * @return {Autolinker.htmlParser.ElementNode}
	 */
	createElementNode : function( tagText, tagName, isClosingTag ) {
		return new Autolinker.htmlParser.ElementNode( {
			text    : tagText,
			tagName : tagName.toLowerCase(),
			closing : isClosingTag
		} );
	},


	/**
	 * Factory method to create a {@link Autolinker.htmlParser.EntityNode EntityNode}.
	 *
	 * @private
	 * @param {String} text The text that was matched for the HTML entity (such
	 *   as '&amp;nbsp;').
	 * @return {Autolinker.htmlParser.EntityNode}
	 */
	createEntityNode : function( text ) {
		return new Autolinker.htmlParser.EntityNode( { text: text } );
	},


	/**
	 * Factory method to create a {@link Autolinker.htmlParser.TextNode TextNode}.
	 *
	 * @private
	 * @param {String} text The text that was matched.
	 * @return {Autolinker.htmlParser.TextNode}
	 */
	createTextNode : function( text ) {
		return new Autolinker.htmlParser.TextNode( { text: text } );
	}

} );
/*global Autolinker */
/**
 * @abstract
 * @class Autolinker.htmlParser.HtmlNode
 *
 * Represents an HTML node found in an input string. An HTML node is one of the
 * following:
 *
 * 1. An {@link Autolinker.htmlParser.ElementNode ElementNode}, which represents
 *    HTML tags.
 * 2. A {@link Autolinker.htmlParser.CommentNode CommentNode}, which represents
 *    HTML comments.
 * 3. A {@link Autolinker.htmlParser.TextNode TextNode}, which represents text
 *    outside or within HTML tags.
 * 4. A {@link Autolinker.htmlParser.EntityNode EntityNode}, which represents
 *    one of the known HTML entities that Autolinker looks for. This includes
 *    common ones such as &amp;quot; and &amp;nbsp;
 */
Autolinker.htmlParser.HtmlNode = Autolinker.Util.extend( Object, {

	/**
	 * @cfg {String} text (required)
	 *
	 * The original text that was matched for the HtmlNode.
	 *
	 * - In the case of an {@link Autolinker.htmlParser.ElementNode ElementNode},
	 *   this will be the tag's text.
	 * - In the case of an {@link Autolinker.htmlParser.CommentNode CommentNode},
	 *   this will be the comment's text.
	 * - In the case of a {@link Autolinker.htmlParser.TextNode TextNode}, this
	 *   will be the text itself.
	 * - In the case of a {@link Autolinker.htmlParser.EntityNode EntityNode},
	 *   this will be the text of the HTML entity.
	 */
	text : "",


	/**
	 * @constructor
	 * @param {Object} cfg The configuration properties for the Match instance,
	 * specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
	},


	/**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @abstract
	 * @return {String}
	 */
	getType : Autolinker.Util.abstractMethod,


	/**
	 * Retrieves the {@link #text} for the HtmlNode.
	 *
	 * @return {String}
	 */
	getText : function() {
		return this.text;
	}

} );
/*global Autolinker */
/**
 * @class Autolinker.htmlParser.CommentNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents an HTML comment node that has been parsed by the
 * {@link Autolinker.htmlParser.HtmlParser}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */
Autolinker.htmlParser.CommentNode = Autolinker.Util.extend( Autolinker.htmlParser.HtmlNode, {

	/**
	 * @cfg {String} comment (required)
	 *
	 * The text inside the comment tag. This text is stripped of any leading or
	 * trailing whitespace.
	 */
	comment : '',


	/**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */
	getType : function() {
		return 'comment';
	},


	/**
	 * Returns the comment inside the comment tag.
	 *
	 * @return {String}
	 */
	getComment : function() {
		return this.comment;
	}

} );
/*global Autolinker */
/**
 * @class Autolinker.htmlParser.ElementNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents an HTML element node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */
Autolinker.htmlParser.ElementNode = Autolinker.Util.extend( Autolinker.htmlParser.HtmlNode, {

	/**
	 * @cfg {String} tagName (required)
	 *
	 * The name of the tag that was matched.
	 */
	tagName : '',

	/**
	 * @cfg {Boolean} closing (required)
	 *
	 * `true` if the element (tag) is a closing tag, `false` if its an opening
	 * tag.
	 */
	closing : false,


	/**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */
	getType : function() {
		return 'element';
	},


	/**
	 * Returns the HTML element's (tag's) name. Ex: for an &lt;img&gt; tag,
	 * returns "img".
	 *
	 * @return {String}
	 */
	getTagName : function() {
		return this.tagName;
	},


	/**
	 * Determines if the HTML element (tag) is a closing tag. Ex: &lt;div&gt;
	 * returns `false`, while &lt;/div&gt; returns `true`.
	 *
	 * @return {Boolean}
	 */
	isClosing : function() {
		return this.closing;
	}

} );
/*global Autolinker */
/**
 * @class Autolinker.htmlParser.EntityNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents a known HTML entity node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 * Ex: '&amp;nbsp;', or '&amp#160;' (which will be retrievable from the {@link #getText}
 * method.
 *
 * Note that this class will only be returned from the HtmlParser for the set of
 * checked HTML entity nodes  defined by the {@link Autolinker.htmlParser.HtmlParser#htmlCharacterEntitiesRegex}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */
Autolinker.htmlParser.EntityNode = Autolinker.Util.extend( Autolinker.htmlParser.HtmlNode, {

	/**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */
	getType : function() {
		return 'entity';
	}

} );
/*global Autolinker */
/**
 * @class Autolinker.htmlParser.TextNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents a text node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */
Autolinker.htmlParser.TextNode = Autolinker.Util.extend( Autolinker.htmlParser.HtmlNode, {

	/**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */
	getType : function() {
		return 'text';
	}

} );
/*global Autolinker */
/**
 * @private
 * @class Autolinker.matchParser.MatchParser
 * @extends Object
 *
 * Used by Autolinker to parse potential matches, given an input string of text.
 *
 * The MatchParser is fed a non-HTML string in order to search for matches.
 * Autolinker first uses the {@link Autolinker.htmlParser.HtmlParser} to "walk
 * around" HTML tags, and then the text around the HTML tags is passed into the
 * MatchParser in order to find the actual matches.
 */
Autolinker.matchParser.MatchParser = Autolinker.Util.extend( Object, {

	/**
	 * @cfg {Object} urls
	 * @inheritdoc Autolinker#urls
	 */
	urls : true,

	/**
	 * @cfg {Boolean} email
	 * @inheritdoc Autolinker#email
	 */
	email : true,

	/**
	 * @cfg {Boolean} twitter
	 * @inheritdoc Autolinker#twitter
	 */
	twitter : true,

	/**
	 * @cfg {Boolean} phone
	 * @inheritdoc Autolinker#phone
	 */
	phone: true,

	/**
	 * @cfg {Boolean/String} hashtag
	 * @inheritdoc Autolinker#hashtag
	 */
	hashtag : false,

	/**
	 * @cfg {Boolean} stripPrefix
	 * @inheritdoc Autolinker#stripPrefix
	 */
	stripPrefix : true,


	/**
	 * @private
	 * @property {RegExp} matcherRegex
	 *
	 * The regular expression that matches URLs, email addresses, phone #s,
	 * Twitter handles, and Hashtags.
	 *
	 * This regular expression has the following capturing groups:
	 *
	 * 1.  Group that is used to determine if there is a Twitter handle match
	 *     (i.e. \@someTwitterUser). Simply check for its existence to determine
	 *     if there is a Twitter handle match. The next couple of capturing
	 *     groups give information about the Twitter handle match.
	 * 2.  The whitespace character before the \@sign in a Twitter handle. This
	 *     is needed because there are no lookbehinds in JS regular expressions,
	 *     and can be used to reconstruct the original string in a replace().
	 * 3.  The Twitter handle itself in a Twitter match. If the match is
	 *     '@someTwitterUser', the handle is 'someTwitterUser'.
	 * 4.  Group that matches an email address. Used to determine if the match
	 *     is an email address, as well as holding the full address. Ex:
	 *     'me@my.com'
	 * 5.  Group that matches a URL in the input text. Ex: 'http://google.com',
	 *     'www.google.com', or just 'google.com'. This also includes a path,
	 *     url parameters, or hash anchors. Ex: google.com/path/to/file?q1=1&q2=2#myAnchor
	 * 6.  Group that matches a protocol URL (i.e. 'http://google.com'). This is
	 *     used to match protocol URLs with just a single word, like 'http://localhost',
	 *     where we won't double check that the domain name has at least one '.'
	 *     in it.
	 * 7.  Group that matches a 'www.' prefixed URL. This is only matched if the
	 *     'www.' text was not prefixed by a scheme (i.e.: not prefixed by
	 *     'http://', 'ftp:', etc.)
	 * 8.  A protocol-relative ('//') match for the case of a 'www.' prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     We need to know the character before the '//' in order to determine
	 *     if it is a valid match or the // was in a string we don't want to
	 *     auto-link.
	 * 9.  Group that matches a known TLD (top level domain), when a scheme
	 *     or 'www.'-prefixed domain is not matched.
	 * 10.  A protocol-relative ('//') match for the case of a known TLD prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     See #6 for more info.
	 * 11. Group that is used to determine if there is a phone number match.
	 * 12. If there is a phone number match, and a '+' sign was included with
	 *     the phone number, this group will be populated with the '+' sign.
	 * 13. Group that is used to determine if there is a Hashtag match
	 *     (i.e. \#someHashtag). Simply check for its existence to determine if
	 *     there is a Hashtag match. The next couple of capturing groups give
	 *     information about the Hashtag match.
	 * 14. The whitespace character before the #sign in a Hashtag handle. This
	 *     is needed because there are no look-behinds in JS regular
	 *     expressions, and can be used to reconstruct the original string in a
	 *     replace().
	 * 15. The Hashtag itself in a Hashtag match. If the match is
	 *     '#someHashtag', the hashtag is 'someHashtag'.
	 */
	matcherRegex : (function() {
		var twitterRegex = /(^|[^\w])@(\w{1,15})/,              // For matching a twitter handle. Ex: @gregory_jacobs

		    hashtagRegex = /(^|[^\w])#(\w{1,139})/,              // For matching a Hashtag. Ex: #games

		    emailRegex = /(?:[\-;:&=\+\$,\w\.]+@)/,             // something@ for email addresses (a.k.a. local-part)
		    phoneRegex = /(?:(\+)?\d{1,3}[-\040.])?\(?\d{3}\)?[-\040.]?\d{3}[-\040.]\d{4}/,  // ex: (123) 456-7890, 123 456 7890, 123-456-7890, etc.
		    protocolRegex = /(?:[A-Za-z][-.+A-Za-z0-9]*:(?![A-Za-z][-.+A-Za-z0-9]*:\/\/)(?!\d+\/?)(?:\/\/)?)/,  // match protocol, allow in format "http://" or "mailto:". However, do not match the first part of something like 'link:http://www.google.com' (i.e. don't match "link:"). Also, make sure we don't interpret 'google.com:8000' as if 'google.com' was a protocol here (i.e. ignore a trailing port number in this regex)
		    wwwRegex = /(?:www\.)/,                             // starting with 'www.'
		    domainNameRegex = /[A-Za-z0-9\.\-]*[A-Za-z0-9\-]/,  // anything looking at all like a domain, non-unicode domains, not ending in a period
		    tldRegex = /\.(?:international|construction|contractors|enterprises|photography|productions|foundation|immobilien|industries|management|properties|technology|christmas|community|directory|education|equipment|institute|marketing|solutions|vacations|bargains|boutique|builders|catering|cleaning|clothing|computer|democrat|diamonds|graphics|holdings|lighting|partners|plumbing|supplies|training|ventures|academy|careers|company|cruises|domains|exposed|flights|florist|gallery|guitars|holiday|kitchen|neustar|okinawa|recipes|rentals|reviews|shiksha|singles|support|systems|agency|berlin|camera|center|coffee|condos|dating|estate|events|expert|futbol|kaufen|luxury|maison|monash|museum|nagoya|photos|repair|report|social|supply|tattoo|tienda|travel|viajes|villas|vision|voting|voyage|actor|build|cards|cheap|codes|dance|email|glass|house|mango|ninja|parts|photo|press|shoes|solar|today|tokyo|tools|watch|works|aero|arpa|asia|best|bike|blue|buzz|camp|club|cool|coop|farm|fish|gift|guru|info|jobs|kiwi|kred|land|limo|link|menu|mobi|moda|name|pics|pink|post|qpon|rich|ruhr|sexy|tips|vote|voto|wang|wien|wiki|zone|bar|bid|biz|cab|cat|ceo|com|edu|gov|int|kim|mil|net|onl|org|pro|pub|red|tel|uno|wed|xxx|xyz|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)\b/,   // match our known top level domains (TLDs)

		    // Allow optional path, query string, and hash anchor, not ending in the following characters: "?!:,.;"
		    // http://blog.codinghorror.com/the-problem-with-urls/
		    urlSuffixRegex = /[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]?!:,.;]*[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]]/;

		return new RegExp( [
			'(',  // *** Capturing group $1, which can be used to check for a twitter handle match. Use group $3 for the actual twitter handle though. $2 may be used to reconstruct the original string in a replace()
				// *** Capturing group $2, which matches the whitespace character before the '@' sign (needed because of no lookbehinds), and
				// *** Capturing group $3, which matches the actual twitter handle
				twitterRegex.source,
			')',

			'|',

			'(',  // *** Capturing group $4, which is used to determine an email match
				emailRegex.source,
				domainNameRegex.source,
				tldRegex.source,
			')',

			'|',

			'(',  // *** Capturing group $5, which is used to match a URL
				'(?:', // parens to cover match for protocol (optional), and domain
					'(',  // *** Capturing group $6, for a scheme-prefixed url (ex: http://google.com)
						protocolRegex.source,
						domainNameRegex.source,
					')',

					'|',

					'(',  // *** Capturing group $7, for a 'www.' prefixed url (ex: www.google.com)
						'(.?//)?',  // *** Capturing group $8 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
						wwwRegex.source,
						domainNameRegex.source,
					')',

					'|',

					'(',  // *** Capturing group $9, for known a TLD url (ex: google.com)
						'(.?//)?',  // *** Capturing group $10 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
						domainNameRegex.source,
						tldRegex.source,
					')',
				')',

				'(?:' + urlSuffixRegex.source + ')?',  // match for path, query string, and/or hash anchor - optional
			')',

			'|',

			// this setup does not scale well for open extension :( Need to rethink design of autolinker...
			// *** Capturing group $11, which matches a (USA for now) phone number, and
			// *** Capturing group $12, which matches the '+' sign for international numbers, if it exists
			'(',
				phoneRegex.source,
			')',

			'|',

			'(',  // *** Capturing group $13, which can be used to check for a Hashtag match. Use group $12 for the actual Hashtag though. $11 may be used to reconstruct the original string in a replace()
				// *** Capturing group $14, which matches the whitespace character before the '#' sign (needed because of no lookbehinds), and
				// *** Capturing group $15, which matches the actual Hashtag
				hashtagRegex.source,
			')'
		].join( "" ), 'gi' );
	} )(),

	/**
	 * @private
	 * @property {RegExp} charBeforeProtocolRelMatchRegex
	 *
	 * The regular expression used to retrieve the character before a
	 * protocol-relative URL match.
	 *
	 * This is used in conjunction with the {@link #matcherRegex}, which needs
	 * to grab the character before a protocol-relative '//' due to the lack of
	 * a negative look-behind in JavaScript regular expressions. The character
	 * before the match is stripped from the URL.
	 */
	charBeforeProtocolRelMatchRegex : /^(.)?\/\//,

	/**
	 * @private
	 * @property {Autolinker.MatchValidator} matchValidator
	 *
	 * The MatchValidator object, used to filter out any false positives from
	 * the {@link #matcherRegex}. See {@link Autolinker.MatchValidator} for details.
	 */


	/**
	 * @constructor
	 * @param {Object} [cfg] The configuration options for the AnchorTagBuilder
	 * instance, specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );

		this.matchValidator = new Autolinker.MatchValidator();
	},


	/**
	 * Parses the input `text` to search for matches, and calls the `replaceFn`
	 * to allow replacements of the matches. Returns the `text` with matches
	 * replaced.
	 *
	 * @param {String} text The text to search and repace matches in.
	 * @param {Function} replaceFn The iterator function to handle the
	 *   replacements. The function takes a single argument, a {@link Autolinker.match.Match}
	 *   object, and should return the text that should make the replacement.
	 * @param {Object} [contextObj=window] The context object ("scope") to run
	 *   the `replaceFn` in.
	 * @return {String}
	 */
	replace : function( text, replaceFn, contextObj ) {
		var me = this;  // for closure

		return text.replace( this.matcherRegex, function( matchStr/*, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15*/ ) {
			var matchDescObj = me.processCandidateMatch.apply( me, arguments );  // "match description" object

			// Return out with no changes for match types that are disabled (url,
			// email, phone, etc.), or for matches that are invalid (false
			// positives from the matcherRegex, which can't use look-behinds
			// since they are unavailable in JS).
			if( !matchDescObj ) {
				return matchStr;

			} else {
				// Generate replacement text for the match from the `replaceFn`
				var replaceStr = replaceFn.call( contextObj, matchDescObj.match );
				return matchDescObj.prefixStr + replaceStr + matchDescObj.suffixStr;
			}
		} );
	},


	/**
	 * Processes a candidate match from the {@link #matcherRegex}.
	 *
	 * Not all matches found by the regex are actual URL/Email/Phone/Twitter/Hashtag
	 * matches, as determined by the {@link #matchValidator}. In this case, the
	 * method returns `null`. Otherwise, a valid Object with `prefixStr`,
	 * `match`, and `suffixStr` is returned.
	 *
	 * @private
	 * @param {String} matchStr The full match that was found by the
	 *   {@link #matcherRegex}.
	 * @param {String} twitterMatch The matched text of a Twitter handle, if the
	 *   match is a Twitter match.
	 * @param {String} twitterHandlePrefixWhitespaceChar The whitespace char
	 *   before the @ sign in a Twitter handle match. This is needed because of
	 *   no lookbehinds in JS regexes, and is need to re-include the character
	 *   for the anchor tag replacement.
	 * @param {String} twitterHandle The actual Twitter user (i.e the word after
	 *   the @ sign in a Twitter match).
	 * @param {String} emailAddressMatch The matched email address for an email
	 *   address match.
	 * @param {String} urlMatch The matched URL string for a URL match.
	 * @param {String} schemeUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @param {String} wwwMatch The matched string of a 'www.'-prefixed URL that
	 *   was matched. This is only matched if the 'www.' text was not prefixed
	 *   by a scheme (i.e.: not prefixed by 'http://', 'ftp:', etc.).
	 * @param {String} wwwProtocolRelativeMatch The '//' for a protocol-relative
	 *   match from a 'www' url, with the character that comes before the '//'.
	 * @param {String} tldMatch The matched string of a known TLD (top level
	 *   domain), when a scheme or 'www.'-prefixed domain is not matched.
	 * @param {String} tldProtocolRelativeMatch The '//' for a protocol-relative
	 *   match from a TLD (top level domain) match, with the character that
	 *   comes before the '//'.
	 * @param {String} phoneMatch The matched text of a phone number
	 * @param {String} phonePlusSignMatch The '+' sign in the phone number, if
	 *   it was there.
	 * @param {String} hashtagMatch The matched text of a Twitter
	 *   Hashtag, if the match is a Hashtag match.
	 * @param {String} hashtagPrefixWhitespaceChar The whitespace char
	 *   before the # sign in a Hashtag match. This is needed because of no
	 *   lookbehinds in JS regexes, and is need to re-include the character for
	 *   the anchor tag replacement.
	 * @param {String} hashtag The actual Hashtag (i.e the word
	 *   after the # sign in a Hashtag match).
	 *
	 * @return {Object} A "match description object". This will be `null` if the
	 *   match was invalid, or if a match type is disabled. Otherwise, this will
	 *   be an Object (map) with the following properties:
	 * @return {String} return.prefixStr The char(s) that should be prepended to
	 *   the replacement string. These are char(s) that were needed to be
	 *   included from the regex match that were ignored by processing code, and
	 *   should be re-inserted into the replacement stream.
	 * @return {String} return.suffixStr The char(s) that should be appended to
	 *   the replacement string. These are char(s) that were needed to be
	 *   included from the regex match that were ignored by processing code, and
	 *   should be re-inserted into the replacement stream.
	 * @return {Autolinker.match.Match} return.match The Match object that
	 *   represents the match that was found.
	 */
	processCandidateMatch : function(
		matchStr, twitterMatch, twitterHandlePrefixWhitespaceChar, twitterHandle,
		emailAddressMatch, urlMatch, schemeUrlMatch, wwwMatch, wwwProtocolRelativeMatch,
		tldMatch, tldProtocolRelativeMatch, phoneMatch, phonePlusSignMatch, hashtagMatch,
		hashtagPrefixWhitespaceChar, hashtag
	) {
		// Note: The `matchStr` variable wil be fixed up to remove characters that are no longer needed (which will
		// be added to `prefixStr` and `suffixStr`).

		var protocolRelativeMatch = wwwProtocolRelativeMatch || tldProtocolRelativeMatch,
		    match,  // Will be an Autolinker.match.Match object

		    prefixStr = "",  // A string to use to prefix the anchor tag that is created. This is needed for the Twitter and Hashtag matches.
		    suffixStr = "",  // A string to suffix the anchor tag that is created. This is used if there is a trailing parenthesis that should not be auto-linked.

		    urls = this.urls;  // the 'urls' config

		// Return out with `null` for match types that are disabled (url, email,
		// twitter, hashtag), or for matches that are invalid (false positives
		// from the matcherRegex, which can't use look-behinds since they are
		// unavailable in JS).
		if(
			( schemeUrlMatch && !urls.schemeMatches ) ||
			( wwwMatch && !urls.wwwMatches ) ||
			( tldMatch && !urls.tldMatches ) ||
			( emailAddressMatch && !this.email ) ||
			( phoneMatch && !this.phone ) ||
			( twitterMatch && !this.twitter ) ||
			( hashtagMatch && !this.hashtag ) ||
			!this.matchValidator.isValidMatch( urlMatch, schemeUrlMatch, protocolRelativeMatch )
		) {
			return null;
		}

		// Handle a closing parenthesis at the end of the match, and exclude it
		// if there is not a matching open parenthesis
		// in the match itself.
		if( this.matchHasUnbalancedClosingParen( matchStr ) ) {
			matchStr = matchStr.substr( 0, matchStr.length - 1 );  // remove the trailing ")"
			suffixStr = ")";  // this will be added after the generated <a> tag
		} else {
			// Handle an invalid character after the TLD
			var pos = this.matchHasInvalidCharAfterTld( urlMatch, schemeUrlMatch );
			if( pos > -1 ) {
				suffixStr = matchStr.substr(pos);  // this will be added after the generated <a> tag
				matchStr = matchStr.substr( 0, pos ); // remove the trailing invalid chars
			}
		}

		if( emailAddressMatch ) {
			match = new Autolinker.match.Email( { matchedText: matchStr, email: emailAddressMatch } );

		} else if( twitterMatch ) {
			// fix up the `matchStr` if there was a preceding whitespace char,
			// which was needed to determine the match itself (since there are
			// no look-behinds in JS regexes)
			if( twitterHandlePrefixWhitespaceChar ) {
				prefixStr = twitterHandlePrefixWhitespaceChar;
				matchStr = matchStr.slice( 1 );  // remove the prefixed whitespace char from the match
			}
			match = new Autolinker.match.Twitter( { matchedText: matchStr, twitterHandle: twitterHandle } );

		} else if( phoneMatch ) {
			// remove non-numeric values from phone number string
			var cleanNumber = matchStr.replace( /\D/g, '' );
 			match = new Autolinker.match.Phone( { matchedText: matchStr, number: cleanNumber, plusSign: !!phonePlusSignMatch } );

		} else if( hashtagMatch ) {
			// fix up the `matchStr` if there was a preceding whitespace char,
			// which was needed to determine the match itself (since there are
			// no look-behinds in JS regexes)
			if( hashtagPrefixWhitespaceChar ) {
				prefixStr = hashtagPrefixWhitespaceChar;
				matchStr = matchStr.slice( 1 );  // remove the prefixed whitespace char from the match
			}
			match = new Autolinker.match.Hashtag( { matchedText: matchStr, serviceName: this.hashtag, hashtag: hashtag } );

		} else {  // url match
			// If it's a protocol-relative '//' match, remove the character
			// before the '//' (which the matcherRegex needed to match due to
			// the lack of a negative look-behind in JavaScript regular
			// expressions)
			if( protocolRelativeMatch ) {
				var charBeforeMatch = protocolRelativeMatch.match( this.charBeforeProtocolRelMatchRegex )[ 1 ] || "";

				if( charBeforeMatch ) {  // fix up the `matchStr` if there was a preceding char before a protocol-relative match, which was needed to determine the match itself (since there are no look-behinds in JS regexes)
					prefixStr = charBeforeMatch;
					matchStr = matchStr.slice( 1 );  // remove the prefixed char from the match
				}
			}

			match = new Autolinker.match.Url( {
				matchedText : matchStr,
				url : matchStr,
				protocolUrlMatch : !!schemeUrlMatch,
				protocolRelativeMatch : !!protocolRelativeMatch,
				stripPrefix : this.stripPrefix
			} );
		}

		return {
			prefixStr : prefixStr,
			suffixStr : suffixStr,
			match     : match
		};
	},


	/**
	 * Determines if a match found has an unmatched closing parenthesis. If so,
	 * this parenthesis will be removed from the match itself, and appended
	 * after the generated anchor tag in {@link #processCandidateMatch}.
	 *
	 * A match may have an extra closing parenthesis at the end of the match
	 * because the regular expression must include parenthesis for URLs such as
	 * "wikipedia.com/something_(disambiguation)", which should be auto-linked.
	 *
	 * However, an extra parenthesis *will* be included when the URL itself is
	 * wrapped in parenthesis, such as in the case of "(wikipedia.com/something_(disambiguation))".
	 * In this case, the last closing parenthesis should *not* be part of the
	 * URL itself, and this method will return `true`.
	 *
	 * @private
	 * @param {String} matchStr The full match string from the {@link #matcherRegex}.
	 * @return {Boolean} `true` if there is an unbalanced closing parenthesis at
	 *   the end of the `matchStr`, `false` otherwise.
	 */
	matchHasUnbalancedClosingParen : function( matchStr ) {
		var lastChar = matchStr.charAt( matchStr.length - 1 );

		if( lastChar === ')' ) {
			var openParensMatch = matchStr.match( /\(/g ),
			    closeParensMatch = matchStr.match( /\)/g ),
			    numOpenParens = ( openParensMatch && openParensMatch.length ) || 0,
			    numCloseParens = ( closeParensMatch && closeParensMatch.length ) || 0;

			if( numOpenParens < numCloseParens ) {
				return true;
			}
		}

		return false;
	},


	/**
	 * Determine if there's an invalid character after the TLD in a URL. Valid
	 * characters after TLD are ':/?#'. Exclude protocol matched URLs from this
	 * check.
	 *
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @return {Number} the position where the invalid character was found. If
	 *   no such character was found, returns -1
	 */
	matchHasInvalidCharAfterTld : function( urlMatch, protocolUrlMatch ) {
		if ( !urlMatch ) {
			return -1;
		}

		var offset = 0;
		if ( protocolUrlMatch ) {
			offset = urlMatch.indexOf(':');
			urlMatch = urlMatch.slice(offset);
		}

		var re = /^((.?\/\/)?[A-Za-z0-9\.\-]*[A-Za-z0-9\-]\.[A-Za-z]+)/;
		var res = re.exec( urlMatch );
		if ( res === null ) {
			return -1;
		}

		offset += res[1].length;
		urlMatch = urlMatch.slice(res[1].length);
		if (/^[^.A-Za-z:\/?#]/.test(urlMatch)) {
			return offset;
		}

		return -1;
	}

} );

/*global Autolinker */
/*jshint scripturl:true */
/**
 * @private
 * @class Autolinker.MatchValidator
 * @extends Object
 *
 * Used by Autolinker to filter out false positives from the
 * {@link Autolinker.matchParser.MatchParser#matcherRegex}.
 *
 * Due to the limitations of regular expressions (including the missing feature
 * of look-behinds in JS regular expressions), we cannot always determine the
 * validity of a given match. This class applies a bit of additional logic to
 * filter out any false positives that have been matched by the
 * {@link Autolinker.matchParser.MatchParser#matcherRegex}.
 */
Autolinker.MatchValidator = Autolinker.Util.extend( Object, {

	/**
	 * @private
	 * @property {RegExp} invalidProtocolRelMatchRegex
	 *
	 * The regular expression used to check a potential protocol-relative URL
	 * match, coming from the {@link Autolinker.matchParser.MatchParser#matcherRegex}.
	 * A protocol-relative URL is, for example, "//yahoo.com"
	 *
	 * This regular expression checks to see if there is a word character before
	 * the '//' match in order to determine if we should actually autolink a
	 * protocol-relative URL. This is needed because there is no negative
	 * look-behind in JavaScript regular expressions.
	 *
	 * For instance, we want to autolink something like "Go to: //google.com",
	 * but we don't want to autolink something like "abc//google.com"
	 */
	invalidProtocolRelMatchRegex : /^[\w]\/\//,

	/**
	 * Regex to test for a full protocol, with the two trailing slashes. Ex: 'http://'
	 *
	 * @private
	 * @property {RegExp} hasFullProtocolRegex
	 */
	hasFullProtocolRegex : /^[A-Za-z][-.+A-Za-z0-9]*:\/\//,

	/**
	 * Regex to find the URI scheme, such as 'mailto:'.
	 *
	 * This is used to filter out 'javascript:' and 'vbscript:' schemes.
	 *
	 * @private
	 * @property {RegExp} uriSchemeRegex
	 */
	uriSchemeRegex : /^[A-Za-z][-.+A-Za-z0-9]*:/,

	/**
	 * Regex to determine if at least one word char exists after the protocol (i.e. after the ':')
	 *
	 * @private
	 * @property {RegExp} hasWordCharAfterProtocolRegex
	 */
	hasWordCharAfterProtocolRegex : /:[^\s]*?[A-Za-z]/,


	/**
	 * Determines if a given match found by the {@link Autolinker.matchParser.MatchParser}
	 * is valid. Will return `false` for:
	 *
	 * 1) URL matches which do not have at least have one period ('.') in the
	 *    domain name (effectively skipping over matches like "abc:def").
	 *    However, URL matches with a protocol will be allowed (ex: 'http://localhost')
	 * 2) URL matches which do not have at least one word character in the
	 *    domain name (effectively skipping over matches like "git:1.0").
	 * 3) A protocol-relative url match (a URL beginning with '//') whose
	 *    previous character is a word character (effectively skipping over
	 *    strings like "abc//google.com")
	 *
	 * Otherwise, returns `true`.
	 *
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @param {String} protocolRelativeMatch The protocol-relative string for a
	 *   URL match (i.e. '//'), possibly with a preceding character (ex, a
	 *   space, such as: ' //', or a letter, such as: 'a//'). The match is
	 *   invalid if there is a word character preceding the '//'.
	 * @return {Boolean} `true` if the match given is valid and should be
	 *   processed, or `false` if the match is invalid and/or should just not be
	 *   processed.
	 */
	isValidMatch : function( urlMatch, protocolUrlMatch, protocolRelativeMatch ) {
		if(
			( protocolUrlMatch && !this.isValidUriScheme( protocolUrlMatch ) ) ||
			this.urlMatchDoesNotHaveProtocolOrDot( urlMatch, protocolUrlMatch ) ||       // At least one period ('.') must exist in the URL match for us to consider it an actual URL, *unless* it was a full protocol match (like 'http://localhost')
			this.urlMatchDoesNotHaveAtLeastOneWordChar( urlMatch, protocolUrlMatch ) ||  // At least one letter character must exist in the domain name after a protocol match. Ex: skip over something like "git:1.0"
			this.isInvalidProtocolRelativeMatch( protocolRelativeMatch )                 // A protocol-relative match which has a word character in front of it (so we can skip something like "abc//google.com")
		) {
			return false;
		}

		return true;
	},


	/**
	 * Determines if the URI scheme is a valid scheme to be autolinked. Returns
	 * `false` if the scheme is 'javascript:' or 'vbscript:'
	 *
	 * @private
	 * @param {String} uriSchemeMatch The match URL string for a full URI scheme
	 *   match. Ex: 'http://yahoo.com' or 'mailto:a@a.com'.
	 * @return {Boolean} `true` if the scheme is a valid one, `false` otherwise.
	 */
	isValidUriScheme : function( uriSchemeMatch ) {
		var uriScheme = uriSchemeMatch.match( this.uriSchemeRegex )[ 0 ].toLowerCase();

		return ( uriScheme !== 'javascript:' && uriScheme !== 'vbscript:' );
	},


	/**
	 * Determines if a URL match does not have either:
	 *
	 * a) a full protocol (i.e. 'http://'), or
	 * b) at least one dot ('.') in the domain name (for a non-full-protocol
	 *    match).
	 *
	 * Either situation is considered an invalid URL (ex: 'git:d' does not have
	 * either the '://' part, or at least one dot in the domain name. If the
	 * match was 'git:abc.com', we would consider this valid.)
	 *
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @return {Boolean} `true` if the URL match does not have a full protocol,
	 *   or at least one dot ('.') in a non-full-protocol match.
	 */
	urlMatchDoesNotHaveProtocolOrDot : function( urlMatch, protocolUrlMatch ) {
		return ( !!urlMatch && ( !protocolUrlMatch || !this.hasFullProtocolRegex.test( protocolUrlMatch ) ) && urlMatch.indexOf( '.' ) === -1 );
	},


	/**
	 * Determines if a URL match does not have at least one word character after
	 * the protocol (i.e. in the domain name).
	 *
	 * At least one letter character must exist in the domain name after a
	 * protocol match. Ex: skip over something like "git:1.0"
	 *
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to know whether or not we
	 *   have a protocol in the URL string, in order to check for a word
	 *   character after the protocol separator (':').
	 * @return {Boolean} `true` if the URL match does not have at least one word
	 *   character in it after the protocol, `false` otherwise.
	 */
	urlMatchDoesNotHaveAtLeastOneWordChar : function( urlMatch, protocolUrlMatch ) {
		if( urlMatch && protocolUrlMatch ) {
			return !this.hasWordCharAfterProtocolRegex.test( urlMatch );
		} else {
			return false;
		}
	},


	/**
	 * Determines if a protocol-relative match is an invalid one. This method
	 * returns `true` if there is a `protocolRelativeMatch`, and that match
	 * contains a word character before the '//' (i.e. it must contain
	 * whitespace or nothing before the '//' in order to be considered valid).
	 *
	 * @private
	 * @param {String} protocolRelativeMatch The protocol-relative string for a
	 *   URL match (i.e. '//'), possibly with a preceding character (ex, a
	 *   space, such as: ' //', or a letter, such as: 'a//'). The match is
	 *   invalid if there is a word character preceding the '//'.
	 * @return {Boolean} `true` if it is an invalid protocol-relative match,
	 *   `false` otherwise.
	 */
	isInvalidProtocolRelativeMatch : function( protocolRelativeMatch ) {
		return ( !!protocolRelativeMatch && this.invalidProtocolRelMatchRegex.test( protocolRelativeMatch ) );
	}

} );

/*global Autolinker */
/**
 * @abstract
 * @class Autolinker.match.Match
 * 
 * Represents a match found in an input string which should be Autolinked. A Match object is what is provided in a 
 * {@link Autolinker#replaceFn replaceFn}, and may be used to query for details about the match.
 * 
 * For example:
 * 
 *     var input = "...";  // string with URLs, Email Addresses, and Twitter Handles
 *     
 *     var linkedText = Autolinker.link( input, {
 *         replaceFn : function( autolinker, match ) {
 *             console.log( "href = ", match.getAnchorHref() );
 *             console.log( "text = ", match.getAnchorText() );
 *         
 *             switch( match.getType() ) {
 *                 case 'url' : 
 *                     console.log( "url: ", match.getUrl() );
 *                     
 *                 case 'email' :
 *                     console.log( "email: ", match.getEmail() );
 *                     
 *                 case 'twitter' :
 *                     console.log( "twitter: ", match.getTwitterHandle() );
 *             }
 *         }
 *     } );
 *     
 * See the {@link Autolinker} class for more details on using the {@link Autolinker#replaceFn replaceFn}.
 */
Autolinker.match.Match = Autolinker.Util.extend( Object, {
	
	/**
	 * @cfg {String} matchedText (required)
	 * 
	 * The original text that was matched.
	 */
	
	
	/**
	 * @constructor
	 * @param {Object} cfg The configuration properties for the Match instance, specified in an Object (map).
	 */
	constructor : function( cfg ) {
		Autolinker.Util.assign( this, cfg );
	},

	
	/**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @abstract
	 * @return {String}
	 */
	getType : Autolinker.Util.abstractMethod,
	
	
	/**
	 * Returns the original text that was matched.
	 * 
	 * @return {String}
	 */
	getMatchedText : function() {
		return this.matchedText;
	},
	

	/**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @abstract
	 * @return {String}
	 */
	getAnchorHref : Autolinker.Util.abstractMethod,
	
	
	/**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @abstract
	 * @return {String}
	 */
	getAnchorText : Autolinker.Util.abstractMethod

} );
/*global Autolinker */
/**
 * @class Autolinker.match.Email
 * @extends Autolinker.match.Match
 * 
 * Represents a Email match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
Autolinker.match.Email = Autolinker.Util.extend( Autolinker.match.Match, {
	
	/**
	 * @cfg {String} email (required)
	 * 
	 * The email address that was matched.
	 */
	

	/**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'email';
	},
	
	
	/**
	 * Returns the email address that was matched.
	 * 
	 * @return {String}
	 */
	getEmail : function() {
		return this.email;
	},
	

	/**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorHref : function() {
		return 'mailto:' + this.email;
	},
	
	
	/**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorText : function() {
		return this.email;
	}
	
} );
/*global Autolinker */
/**
 * @class Autolinker.match.Hashtag
 * @extends Autolinker.match.Match
 *
 * Represents a Hashtag match found in an input string which should be
 * Autolinked.
 *
 * See this class's superclass ({@link Autolinker.match.Match}) for more
 * details.
 */
Autolinker.match.Hashtag = Autolinker.Util.extend( Autolinker.match.Match, {

	/**
	 * @cfg {String} serviceName (required)
	 *
	 * The service to point hashtag matches to. See {@link Autolinker#hashtag}
	 * for available values.
	 */

	/**
	 * @cfg {String} hashtag (required)
	 *
	 * The Hashtag that was matched, without the '#'.
	 */


	/**
	 * Returns the type of match that this class represents.
	 *
	 * @return {String}
	 */
	getType : function() {
		return 'hashtag';
	},


	/**
	 * Returns the matched hashtag.
	 *
	 * @return {String}
	 */
	getHashtag : function() {
		return this.hashtag;
	},


	/**
	 * Returns the anchor href that should be generated for the match.
	 *
	 * @return {String}
	 */
	getAnchorHref : function() {
		var serviceName = this.serviceName,
		    hashtag = this.hashtag;

		switch( serviceName ) {
			case 'twitter' :
				return 'https://twitter.com/hashtag/' + hashtag;
			case 'facebook' :
				return 'https://www.facebook.com/hashtag/' + hashtag;
			case 'instagram' :
				return 'https://instagram.com/explore/tags/' + hashtag;

			default :  // Shouldn't happen because Autolinker's constructor should block any invalid values, but just in case.
				throw new Error( 'Unknown service name to point hashtag to: ', serviceName );
		}
	},


	/**
	 * Returns the anchor text that should be generated for the match.
	 *
	 * @return {String}
	 */
	getAnchorText : function() {
		return '#' + this.hashtag;
	}

} );

/*global Autolinker */
/**
 * @class Autolinker.match.Phone
 * @extends Autolinker.match.Match
 *
 * Represents a Phone number match found in an input string which should be
 * Autolinked.
 *
 * See this class's superclass ({@link Autolinker.match.Match}) for more
 * details.
 */
Autolinker.match.Phone = Autolinker.Util.extend( Autolinker.match.Match, {

	/**
	 * @cfg {String} number (required)
	 *
	 * The phone number that was matched.
	 */

	/**
	 * @cfg {Boolean} plusSign (required)
	 *
	 * `true` if the matched phone number started with a '+' sign. We'll include
	 * it in the `tel:` URL if so, as this is needed for international numbers.
	 *
	 * Ex: '+1 (123) 456 7879'
	 */


	/**
	 * Returns a string name for the type of match that this class represents.
	 *
	 * @return {String}
	 */
	getType : function() {
		return 'phone';
	},


	/**
	 * Returns the phone number that was matched.
	 *
	 * @return {String}
	 */
	getNumber: function() {
		return this.number;
	},


	/**
	 * Returns the anchor href that should be generated for the match.
	 *
	 * @return {String}
	 */
	getAnchorHref : function() {
		return 'tel:' + ( this.plusSign ? '+' : '' ) + this.number;
	},


	/**
	 * Returns the anchor text that should be generated for the match.
	 *
	 * @return {String}
	 */
	getAnchorText : function() {
		return this.matchedText;
	}

} );

/*global Autolinker */
/**
 * @class Autolinker.match.Twitter
 * @extends Autolinker.match.Match
 * 
 * Represents a Twitter match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
Autolinker.match.Twitter = Autolinker.Util.extend( Autolinker.match.Match, {
	
	/**
	 * @cfg {String} twitterHandle (required)
	 * 
	 * The Twitter handle that was matched.
	 */
	

	/**
	 * Returns the type of match that this class represents.
	 * 
	 * @return {String}
	 */
	getType : function() {
		return 'twitter';
	},
	
	
	/**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */
	getTwitterHandle : function() {
		return this.twitterHandle;
	},
	

	/**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorHref : function() {
		return 'https://twitter.com/' + this.twitterHandle;
	},
	
	
	/**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */
	getAnchorText : function() {
		return '@' + this.twitterHandle;
	}
	
} );
/*global Autolinker */
/**
 * @class Autolinker.match.Url
 * @extends Autolinker.match.Match
 *
 * Represents a Url match found in an input string which should be Autolinked.
 *
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */
Autolinker.match.Url = Autolinker.Util.extend( Autolinker.match.Match, {

	/**
	 * @cfg {String} url (required)
	 *
	 * The url that was matched.
	 */

	/**
	 * @cfg {Boolean} protocolUrlMatch (required)
	 *
	 * `true` if the URL is a match which already has a protocol (i.e. 'http://'), `false` if the match was from a 'www' or
	 * known TLD match.
	 */

	/**
	 * @cfg {Boolean} protocolRelativeMatch (required)
	 *
	 * `true` if the URL is a protocol-relative match. A protocol-relative match is a URL that starts with '//',
	 * and will be either http:// or https:// based on the protocol that the site is loaded under.
	 */

	/**
	 * @cfg {Boolean} stripPrefix (required)
	 * @inheritdoc Autolinker#stripPrefix
	 */


	/**
	 * @private
	 * @property {RegExp} urlPrefixRegex
	 *
	 * A regular expression used to remove the 'http://' or 'https://' and/or the 'www.' from URLs.
	 */
	urlPrefixRegex: /^(https?:\/\/)?(www\.)?/i,

	/**
	 * @private
	 * @property {RegExp} protocolRelativeRegex
	 *
	 * The regular expression used to remove the protocol-relative '//' from the {@link #url} string, for purposes
	 * of {@link #getAnchorText}. A protocol-relative URL is, for example, "//yahoo.com"
	 */
	protocolRelativeRegex : /^\/\//,

	/**
	 * @private
	 * @property {Boolean} protocolPrepended
	 *
	 * Will be set to `true` if the 'http://' protocol has been prepended to the {@link #url} (because the
	 * {@link #url} did not have a protocol)
	 */
	protocolPrepended : false,


	/**
	 * Returns a string name for the type of match that this class represents.
	 *
	 * @return {String}
	 */
	getType : function() {
		return 'url';
	},


	/**
	 * Returns the url that was matched, assuming the protocol to be 'http://' if the original
	 * match was missing a protocol.
	 *
	 * @return {String}
	 */
	getUrl : function() {
		var url = this.url;

		// if the url string doesn't begin with a protocol, assume 'http://'
		if( !this.protocolRelativeMatch && !this.protocolUrlMatch && !this.protocolPrepended ) {
			url = this.url = 'http://' + url;

			this.protocolPrepended = true;
		}

		return url;
	},


	/**
	 * Returns the anchor href that should be generated for the match.
	 *
	 * @return {String}
	 */
	getAnchorHref : function() {
		var url = this.getUrl();

		return url.replace( /&amp;/g, '&' );  // any &amp;'s in the URL should be converted back to '&' if they were displayed as &amp; in the source html
	},


	/**
	 * Returns the anchor text that should be generated for the match.
	 *
	 * @return {String}
	 */
	getAnchorText : function() {
		var anchorText = this.getMatchedText();

		if( this.protocolRelativeMatch ) {
			// Strip off any protocol-relative '//' from the anchor text
			anchorText = this.stripProtocolRelativePrefix( anchorText );
		}
		if( this.stripPrefix ) {
			anchorText = this.stripUrlPrefix( anchorText );
		}
		anchorText = this.removeTrailingSlash( anchorText );  // remove trailing slash, if there is one

		return anchorText;
	},


	// ---------------------------------------

	// Utility Functionality

	/**
	 * Strips the URL prefix (such as "http://" or "https://") from the given text.
	 *
	 * @private
	 * @param {String} text The text of the anchor that is being generated, for which to strip off the
	 *   url prefix (such as stripping off "http://")
	 * @return {String} The `anchorText`, with the prefix stripped.
	 */
	stripUrlPrefix : function( text ) {
		return text.replace( this.urlPrefixRegex, '' );
	},


	/**
	 * Strips any protocol-relative '//' from the anchor text.
	 *
	 * @private
	 * @param {String} text The text of the anchor that is being generated, for which to strip off the
	 *   protocol-relative prefix (such as stripping off "//")
	 * @return {String} The `anchorText`, with the protocol-relative prefix stripped.
	 */
	stripProtocolRelativePrefix : function( text ) {
		return text.replace( this.protocolRelativeRegex, '' );
	},


	/**
	 * Removes any trailing slash from the given `anchorText`, in preparation for the text to be displayed.
	 *
	 * @private
	 * @param {String} anchorText The text of the anchor that is being generated, for which to remove any trailing
	 *   slash ('/') that may exist.
	 * @return {String} The `anchorText`, with the trailing slash removed.
	 */
	removeTrailingSlash : function( anchorText ) {
		if( anchorText.charAt( anchorText.length - 1 ) === '/' ) {
			anchorText = anchorText.slice( 0, -1 );
		}
		return anchorText;
	}

} );
/*global Autolinker */
/**
 * A truncation feature where the ellipsis will be placed at the end of the URL.
 *
 * @param {String} anchorText
 * @param {Number} truncateLen The maximum length of the truncated output URL string.
 * @param {String} ellipsisChars The characters to place within the url, e.g. "..".
 * @return {String} The truncated URL.
 */
Autolinker.truncate.TruncateEnd = function(anchorText, truncateLen, ellipsisChars){
	return Autolinker.Util.ellipsis( anchorText, truncateLen, ellipsisChars );
};

/*global Autolinker */
/**
 * Date: 2015-10-05
 * Author: Kasper Søfren <soefritz@gmail.com> (https://github.com/kafoso)
 *
 * A truncation feature, where the ellipsis will be placed in the dead-center of the URL.
 *
 * @param {String} url             A URL.
 * @param {Number} truncateLen     The maximum length of the truncated output URL string.
 * @param {String} ellipsisChars   The characters to place within the url, e.g. "..".
 * @return {String} The truncated URL.
 */
Autolinker.truncate.TruncateMiddle = function(url, truncateLen, ellipsisChars){
  if (url.length <= truncateLen) {
    return url;
  }
  var availableLength = truncateLen - ellipsisChars.length;
  var end = "";
  if (availableLength > 0) {
    end = url.substr((-1)*Math.floor(availableLength/2));
  }
  return (url.substr(0, Math.ceil(availableLength/2)) + ellipsisChars + end).substr(0, truncateLen);
};

/*global Autolinker */
/**
 * Date: 2015-10-05
 * Author: Kasper Søfren <soefritz@gmail.com> (https://github.com/kafoso)
 *
 * A truncation feature, where the ellipsis will be placed at a section within
 * the URL making it still somewhat human readable.
 *
 * @param {String} url						 A URL.
 * @param {Number} truncateLen		 The maximum length of the truncated output URL string.
 * @param {String} ellipsisChars	 The characters to place within the url, e.g. "..".
 * @return {String} The truncated URL.
 */
Autolinker.truncate.TruncateSmart = function(url, truncateLen, ellipsisChars){
	var parse_url = function(url){ // Functionality inspired by PHP function of same name
		var urlObj = {};
		var urlSub = url;
		var match = urlSub.match(/^([a-z]+):\/\//i);
		if (match) {
			urlObj.scheme = match[1];
			urlSub = urlSub.substr(match[0].length);
		}
		match = urlSub.match(/^(.*?)(?=(\?|#|\/|$))/i);
		if (match) {
			urlObj.host = match[1];
			urlSub = urlSub.substr(match[0].length);
		}
		match = urlSub.match(/^\/(.*?)(?=(\?|#|$))/i);
		if (match) {
			urlObj.path = match[1];
			urlSub = urlSub.substr(match[0].length);
		}
		match = urlSub.match(/^\?(.*?)(?=(#|$))/i);
		if (match) {
			urlObj.query = match[1];
			urlSub = urlSub.substr(match[0].length);
		}
		match = urlSub.match(/^#(.*?)$/i);
		if (match) {
			urlObj.fragment = match[1];
			//urlSub = urlSub.substr(match[0].length);  -- not used. Uncomment if adding another block.
		}
		return urlObj;
	};

	var buildUrl = function(urlObj){
		var url = "";
		if (urlObj.scheme && urlObj.host) {
			url += urlObj.scheme + "://";
		}
		if (urlObj.host) {
			url += urlObj.host;
		}
		if (urlObj.path) {
			url += "/" + urlObj.path;
		}
		if (urlObj.query) {
			url += "?" + urlObj.query;
		}
		if (urlObj.fragment) {
			url += "#" + urlObj.fragment;
		}
		return url;
	};

	var buildSegment = function(segment, remainingAvailableLength){
		var remainingAvailableLengthHalf = remainingAvailableLength/ 2,
				startOffset = Math.ceil(remainingAvailableLengthHalf),
				endOffset = (-1)*Math.floor(remainingAvailableLengthHalf),
				end = "";
		if (endOffset < 0) {
			end = segment.substr(endOffset);
		}
		return segment.substr(0, startOffset) + ellipsisChars + end;
	};
	if (url.length <= truncateLen) {
		return url;
	}
	var availableLength = truncateLen - ellipsisChars.length;
	var urlObj = parse_url(url);
	// Clean up the URL
	if (urlObj.query) {
		var matchQuery = urlObj.query.match(/^(.*?)(?=(\?|\#))(.*?)$/i);
		if (matchQuery) {
			// Malformed URL; two or more "?". Removed any content behind the 2nd.
			urlObj.query = urlObj.query.substr(0, matchQuery[1].length);
			url = buildUrl(urlObj);
		}
	}
	if (url.length <= truncateLen) {
		return url;
	}
	if (urlObj.host) {
		urlObj.host = urlObj.host.replace(/^www\./, "");
		url = buildUrl(urlObj);
	}
	if (url.length <= truncateLen) {
		return url;
	}
	// Process and build the URL
	var str = "";
	if (urlObj.host) {
		str += urlObj.host;
	}
	if (str.length >= availableLength) {
		if (urlObj.host.length == truncateLen) {
			return (urlObj.host.substr(0, (truncateLen - ellipsisChars.length)) + ellipsisChars).substr(0, truncateLen);
		}
		return buildSegment(str, availableLength).substr(0, truncateLen);
	}
	var pathAndQuery = "";
	if (urlObj.path) {
		pathAndQuery += "/" + urlObj.path;
	}
	if (urlObj.query) {
		pathAndQuery += "?" + urlObj.query;
	}
	if (pathAndQuery) {
		if ((str+pathAndQuery).length >= availableLength) {
			if ((str+pathAndQuery).length == truncateLen) {
				return (str + pathAndQuery).substr(0, truncateLen);
			}
			var remainingAvailableLength = availableLength - str.length;
			return (str + buildSegment(pathAndQuery, remainingAvailableLength)).substr(0, truncateLen);
		} else {
			str += pathAndQuery;
		}
	}
	if (urlObj.fragment) {
		var fragment = "#"+urlObj.fragment;
		if ((str+fragment).length >= availableLength) {
			if ((str+fragment).length == truncateLen) {
				return (str + fragment).substr(0, truncateLen);
			}
			var remainingAvailableLength2 = availableLength - str.length;
			return (str + buildSegment(fragment, remainingAvailableLength2)).substr(0, truncateLen);
		} else {
			str += fragment;
		}
	}
	if (urlObj.scheme && urlObj.host) {
		var scheme = urlObj.scheme + "://";
		if ((str+scheme).length < availableLength) {
			return (scheme + str).substr(0, truncateLen);
		}
	}
	if (str.length <= truncateLen) {
		return str;
	}
	var end = "";
	if (availableLength > 0) {
		end = str.substr((-1)*Math.floor(availableLength/2));
	}
	return (str.substr(0, Math.ceil(availableLength/2)) + ellipsisChars + end).substr(0, truncateLen);
};

return Autolinker;

}));

},{}],7:[function(require,module,exports){
;(function () {
	'use strict';

	/**
	 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
	 *
	 * @codingstandard ftlabs-jsv2
	 * @copyright The Financial Times Limited [All Rights Reserved]
	 * @license MIT License (see LICENSE.txt)
	 */

	/*jslint browser:true, node:true*/
	/*global define, Event, Node*/


	/**
	 * Instantiate fast-clicking listeners on the specified layer.
	 *
	 * @constructor
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	function FastClick(layer, options) {
		var oldOnClick;

		options = options || {};

		/**
		 * Whether a click is currently being tracked.
		 *
		 * @type boolean
		 */
		this.trackingClick = false;


		/**
		 * Timestamp for when click tracking started.
		 *
		 * @type number
		 */
		this.trackingClickStart = 0;


		/**
		 * The element being tracked for a click.
		 *
		 * @type EventTarget
		 */
		this.targetElement = null;


		/**
		 * X-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartX = 0;


		/**
		 * Y-coordinate of touch start event.
		 *
		 * @type number
		 */
		this.touchStartY = 0;


		/**
		 * ID of the last touch, retrieved from Touch.identifier.
		 *
		 * @type number
		 */
		this.lastTouchIdentifier = 0;


		/**
		 * Touchmove boundary, beyond which a click will be cancelled.
		 *
		 * @type number
		 */
		this.touchBoundary = options.touchBoundary || 10;


		/**
		 * The FastClick layer.
		 *
		 * @type Element
		 */
		this.layer = layer;

		/**
		 * The minimum time between tap(touchstart and touchend) events
		 *
		 * @type number
		 */
		this.tapDelay = options.tapDelay || 200;

		/**
		 * The maximum time for a tap
		 *
		 * @type number
		 */
		this.tapTimeout = options.tapTimeout || 700;

		if (FastClick.notNeeded(layer)) {
			return;
		}

		// Some old versions of Android don't have Function.prototype.bind
		function bind(method, context) {
			return function() { return method.apply(context, arguments); };
		}


		var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
		var context = this;
		for (var i = 0, l = methods.length; i < l; i++) {
			context[methods[i]] = bind(context[methods[i]], context);
		}

		// Set up event handlers as required
		if (deviceIsAndroid) {
			layer.addEventListener('mouseover', this.onMouse, true);
			layer.addEventListener('mousedown', this.onMouse, true);
			layer.addEventListener('mouseup', this.onMouse, true);
		}

		layer.addEventListener('click', this.onClick, true);
		layer.addEventListener('touchstart', this.onTouchStart, false);
		layer.addEventListener('touchmove', this.onTouchMove, false);
		layer.addEventListener('touchend', this.onTouchEnd, false);
		layer.addEventListener('touchcancel', this.onTouchCancel, false);

		// Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
		// which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
		// layer when they are cancelled.
		if (!Event.prototype.stopImmediatePropagation) {
			layer.removeEventListener = function(type, callback, capture) {
				var rmv = Node.prototype.removeEventListener;
				if (type === 'click') {
					rmv.call(layer, type, callback.hijacked || callback, capture);
				} else {
					rmv.call(layer, type, callback, capture);
				}
			};

			layer.addEventListener = function(type, callback, capture) {
				var adv = Node.prototype.addEventListener;
				if (type === 'click') {
					adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
						if (!event.propagationStopped) {
							callback(event);
						}
					}), capture);
				} else {
					adv.call(layer, type, callback, capture);
				}
			};
		}

		// If a handler is already declared in the element's onclick attribute, it will be fired before
		// FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
		// adding it as listener.
		if (typeof layer.onclick === 'function') {

			// Android browser on at least 3.2 requires a new reference to the function in layer.onclick
			// - the old one won't work if passed to addEventListener directly.
			oldOnClick = layer.onclick;
			layer.addEventListener('click', function(event) {
				oldOnClick(event);
			}, false);
			layer.onclick = null;
		}
	}

	/**
	* Windows Phone 8.1 fakes user agent string to look like Android and iPhone.
	*
	* @type boolean
	*/
	var deviceIsWindowsPhone = navigator.userAgent.indexOf("Windows Phone") >= 0;

	/**
	 * Android requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0 && !deviceIsWindowsPhone;


	/**
	 * iOS requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent) && !deviceIsWindowsPhone;


	/**
	 * iOS 4 requires an exception for select elements.
	 *
	 * @type boolean
	 */
	var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


	/**
	 * iOS 6.0-7.* requires the target element to be manually derived
	 *
	 * @type boolean
	 */
	var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS [6-7]_\d/).test(navigator.userAgent);

	/**
	 * BlackBerry requires exceptions.
	 *
	 * @type boolean
	 */
	var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

	/**
	 * Determine whether a given element requires a native click.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element needs a native click
	 */
	FastClick.prototype.needsClick = function(target) {
		switch (target.nodeName.toLowerCase()) {

		// Don't send a synthetic click to disabled inputs (issue #62)
		case 'button':
		case 'select':
		case 'textarea':
			if (target.disabled) {
				return true;
			}

			break;
		case 'input':

			// File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
			if ((deviceIsIOS && target.type === 'file') || target.disabled) {
				return true;
			}

			break;
		case 'label':
		case 'iframe': // iOS8 homescreen apps can prevent events bubbling into frames
		case 'video':
			return true;
		}

		return (/\bneedsclick\b/).test(target.className);
	};


	/**
	 * Determine whether a given element requires a call to focus to simulate click into element.
	 *
	 * @param {EventTarget|Element} target Target DOM element
	 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
	 */
	FastClick.prototype.needsFocus = function(target) {
		switch (target.nodeName.toLowerCase()) {
		case 'textarea':
			return true;
		case 'select':
			return !deviceIsAndroid;
		case 'input':
			switch (target.type) {
			case 'button':
			case 'checkbox':
			case 'file':
			case 'image':
			case 'radio':
			case 'submit':
				return false;
			}

			// No point in attempting to focus disabled inputs
			return !target.disabled && !target.readOnly;
		default:
			return (/\bneedsfocus\b/).test(target.className);
		}
	};


	/**
	 * Send a click event to the specified element.
	 *
	 * @param {EventTarget|Element} targetElement
	 * @param {Event} event
	 */
	FastClick.prototype.sendClick = function(targetElement, event) {
		var clickEvent, touch;

		// On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
		if (document.activeElement && document.activeElement !== targetElement) {
			document.activeElement.blur();
		}

		touch = event.changedTouches[0];

		// Synthesise a click event, with an extra attribute so it can be tracked
		clickEvent = document.createEvent('MouseEvents');
		clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
		clickEvent.forwardedTouchEvent = true;
		targetElement.dispatchEvent(clickEvent);
	};

	FastClick.prototype.determineEventType = function(targetElement) {

		//Issue #159: Android Chrome Select Box does not open with a synthetic click event
		if (deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
			return 'mousedown';
		}

		return 'click';
	};


	/**
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.focus = function(targetElement) {
		var length;

		// Issue #160: on iOS 7, some input elements (e.g. date datetime month) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
		if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time' && targetElement.type !== 'month') {
			length = targetElement.value.length;
			targetElement.setSelectionRange(length, length);
		} else {
			targetElement.focus();
		}
	};


	/**
	 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
	 *
	 * @param {EventTarget|Element} targetElement
	 */
	FastClick.prototype.updateScrollParent = function(targetElement) {
		var scrollParent, parentElement;

		scrollParent = targetElement.fastClickScrollParent;

		// Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
		// target element was moved to another parent.
		if (!scrollParent || !scrollParent.contains(targetElement)) {
			parentElement = targetElement;
			do {
				if (parentElement.scrollHeight > parentElement.offsetHeight) {
					scrollParent = parentElement;
					targetElement.fastClickScrollParent = parentElement;
					break;
				}

				parentElement = parentElement.parentElement;
			} while (parentElement);
		}

		// Always update the scroll top tracker if possible.
		if (scrollParent) {
			scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
		}
	};


	/**
	 * @param {EventTarget} targetElement
	 * @returns {Element|EventTarget}
	 */
	FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {

		// On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
		if (eventTarget.nodeType === Node.TEXT_NODE) {
			return eventTarget.parentNode;
		}

		return eventTarget;
	};


	/**
	 * On touch start, record the position and scroll offset.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchStart = function(event) {
		var targetElement, touch, selection;

		// Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
		if (event.targetTouches.length > 1) {
			return true;
		}

		targetElement = this.getTargetElementFromEventTarget(event.target);
		touch = event.targetTouches[0];

		if (deviceIsIOS) {

			// Only trusted events will deselect text on iOS (issue #49)
			selection = window.getSelection();
			if (selection.rangeCount && !selection.isCollapsed) {
				return true;
			}

			if (!deviceIsIOS4) {

				// Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
				// when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
				// with the same identifier as the touch event that previously triggered the click that triggered the alert.
				// Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
				// immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
				// Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
				// which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
				// random integers, it's safe to to continue if the identifier is 0 here.
				if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
					event.preventDefault();
					return false;
				}

				this.lastTouchIdentifier = touch.identifier;

				// If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
				// 1) the user does a fling scroll on the scrollable layer
				// 2) the user stops the fling scroll with another tap
				// then the event.target of the last 'touchend' event will be the element that was under the user's finger
				// when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
				// is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
				this.updateScrollParent(targetElement);
			}
		}

		this.trackingClick = true;
		this.trackingClickStart = event.timeStamp;
		this.targetElement = targetElement;

		this.touchStartX = touch.pageX;
		this.touchStartY = touch.pageY;

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			event.preventDefault();
		}

		return true;
	};


	/**
	 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.touchHasMoved = function(event) {
		var touch = event.changedTouches[0], boundary = this.touchBoundary;

		if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
			return true;
		}

		return false;
	};


	/**
	 * Update the last position.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchMove = function(event) {
		if (!this.trackingClick) {
			return true;
		}

		// If the touch has moved, cancel the click tracking
		if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
			this.trackingClick = false;
			this.targetElement = null;
		}

		return true;
	};


	/**
	 * Attempt to find the labelled control for the given label element.
	 *
	 * @param {EventTarget|HTMLLabelElement} labelElement
	 * @returns {Element|null}
	 */
	FastClick.prototype.findControl = function(labelElement) {

		// Fast path for newer browsers supporting the HTML5 control attribute
		if (labelElement.control !== undefined) {
			return labelElement.control;
		}

		// All browsers under test that support touch events also support the HTML5 htmlFor attribute
		if (labelElement.htmlFor) {
			return document.getElementById(labelElement.htmlFor);
		}

		// If no for attribute exists, attempt to retrieve the first labellable descendant element
		// the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
		return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
	};


	/**
	 * On touch end, determine whether to send a click event at once.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onTouchEnd = function(event) {
		var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

		if (!this.trackingClick) {
			return true;
		}

		// Prevent phantom clicks on fast double-tap (issue #36)
		if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
			this.cancelNextClick = true;
			return true;
		}

		if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {
			return true;
		}

		// Reset to prevent wrong click cancel on input (issue #156).
		this.cancelNextClick = false;

		this.lastClickTime = event.timeStamp;

		trackingClickStart = this.trackingClickStart;
		this.trackingClick = false;
		this.trackingClickStart = 0;

		// On some iOS devices, the targetElement supplied with the event is invalid if the layer
		// is performing a transition or scroll, and has to be re-detected manually. Note that
		// for this to function correctly, it must be called *after* the event target is checked!
		// See issue #57; also filed as rdar://13048589 .
		if (deviceIsIOSWithBadTarget) {
			touch = event.changedTouches[0];

			// In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
			targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
			targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
		}

		targetTagName = targetElement.tagName.toLowerCase();
		if (targetTagName === 'label') {
			forElement = this.findControl(targetElement);
			if (forElement) {
				this.focus(targetElement);
				if (deviceIsAndroid) {
					return false;
				}

				targetElement = forElement;
			}
		} else if (this.needsFocus(targetElement)) {

			// Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
			// Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
			if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
				this.targetElement = null;
				return false;
			}

			this.focus(targetElement);
			this.sendClick(targetElement, event);

			// Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
			// Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
			if (!deviceIsIOS || targetTagName !== 'select') {
				this.targetElement = null;
				event.preventDefault();
			}

			return false;
		}

		if (deviceIsIOS && !deviceIsIOS4) {

			// Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
			// and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
			scrollParent = targetElement.fastClickScrollParent;
			if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
				return true;
			}
		}

		// Prevent the actual click from going though - unless the target node is marked as requiring
		// real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
		if (!this.needsClick(targetElement)) {
			event.preventDefault();
			this.sendClick(targetElement, event);
		}

		return false;
	};


	/**
	 * On touch cancel, stop tracking the click.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.onTouchCancel = function() {
		this.trackingClick = false;
		this.targetElement = null;
	};


	/**
	 * Determine mouse events which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onMouse = function(event) {

		// If a target element was never set (because a touch event was never fired) allow the event
		if (!this.targetElement) {
			return true;
		}

		if (event.forwardedTouchEvent) {
			return true;
		}

		// Programmatically generated events targeting a specific element should be permitted
		if (!event.cancelable) {
			return true;
		}

		// Derive and check the target element to see whether the mouse event needs to be permitted;
		// unless explicitly enabled, prevent non-touch click events from triggering actions,
		// to prevent ghost/doubleclicks.
		if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

			// Prevent any user-added listeners declared on FastClick element from being fired.
			if (event.stopImmediatePropagation) {
				event.stopImmediatePropagation();
			} else {

				// Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
				event.propagationStopped = true;
			}

			// Cancel the event
			event.stopPropagation();
			event.preventDefault();

			return false;
		}

		// If the mouse event is permitted, return true for the action to go through.
		return true;
	};


	/**
	 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
	 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
	 * an actual click which should be permitted.
	 *
	 * @param {Event} event
	 * @returns {boolean}
	 */
	FastClick.prototype.onClick = function(event) {
		var permitted;

		// It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
		if (this.trackingClick) {
			this.targetElement = null;
			this.trackingClick = false;
			return true;
		}

		// Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
		if (event.target.type === 'submit' && event.detail === 0) {
			return true;
		}

		permitted = this.onMouse(event);

		// Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
		if (!permitted) {
			this.targetElement = null;
		}

		// If clicks are permitted, return true for the action to go through.
		return permitted;
	};


	/**
	 * Remove all FastClick's event listeners.
	 *
	 * @returns {void}
	 */
	FastClick.prototype.destroy = function() {
		var layer = this.layer;

		if (deviceIsAndroid) {
			layer.removeEventListener('mouseover', this.onMouse, true);
			layer.removeEventListener('mousedown', this.onMouse, true);
			layer.removeEventListener('mouseup', this.onMouse, true);
		}

		layer.removeEventListener('click', this.onClick, true);
		layer.removeEventListener('touchstart', this.onTouchStart, false);
		layer.removeEventListener('touchmove', this.onTouchMove, false);
		layer.removeEventListener('touchend', this.onTouchEnd, false);
		layer.removeEventListener('touchcancel', this.onTouchCancel, false);
	};


	/**
	 * Check whether FastClick is needed.
	 *
	 * @param {Element} layer The layer to listen on
	 */
	FastClick.notNeeded = function(layer) {
		var metaViewport;
		var chromeVersion;
		var blackberryVersion;
		var firefoxVersion;

		// Devices that don't support touch don't need FastClick
		if (typeof window.ontouchstart === 'undefined') {
			return true;
		}

		// Chrome version - zero for other browsers
		chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (chromeVersion) {

			if (deviceIsAndroid) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// Chrome 32 and above with width=device-width or less don't need FastClick
					if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}

			// Chrome desktop doesn't need FastClick (issue #15)
			} else {
				return true;
			}
		}

		if (deviceIsBlackBerry10) {
			blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

			// BlackBerry 10.3+ does not require Fastclick library.
			// https://github.com/ftlabs/fastclick/issues/251
			if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
				metaViewport = document.querySelector('meta[name=viewport]');

				if (metaViewport) {
					// user-scalable=no eliminates click delay.
					if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
						return true;
					}
					// width=device-width (or less than device-width) eliminates click delay.
					if (document.documentElement.scrollWidth <= window.outerWidth) {
						return true;
					}
				}
			}
		}

		// IE10 with -ms-touch-action: none or manipulation, which disables double-tap-to-zoom (issue #97)
		if (layer.style.msTouchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		// Firefox version - zero for other browsers
		firefoxVersion = +(/Firefox\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

		if (firefoxVersion >= 27) {
			// Firefox 27+ does not have tap delay if the content is not zoomable - https://bugzilla.mozilla.org/show_bug.cgi?id=922896

			metaViewport = document.querySelector('meta[name=viewport]');
			if (metaViewport && (metaViewport.content.indexOf('user-scalable=no') !== -1 || document.documentElement.scrollWidth <= window.outerWidth)) {
				return true;
			}
		}

		// IE11: prefixed -ms-touch-action is no longer supported and it's recomended to use non-prefixed version
		// http://msdn.microsoft.com/en-us/library/windows/apps/Hh767313.aspx
		if (layer.style.touchAction === 'none' || layer.style.touchAction === 'manipulation') {
			return true;
		}

		return false;
	};


	/**
	 * Factory method for creating a FastClick object
	 *
	 * @param {Element} layer The layer to listen on
	 * @param {Object} [options={}] The options to override the defaults
	 */
	FastClick.attach = function(layer, options) {
		return new FastClick(layer, options);
	};


	if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {

		// AMD. Register as an anonymous module.
		define(function() {
			return FastClick;
		});
	} else if (typeof module !== 'undefined' && module.exports) {
		module.exports = FastClick.attach;
		module.exports.FastClick = FastClick;
	} else {
		window.FastClick = FastClick;
	}
}());

},{}],8:[function(require,module,exports){
/*!

 handlebars v3.0.3

Copyright (C) 2011-2014 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

@license
*/
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define(factory);
	else if(typeof exports === 'object')
		exports["Handlebars"] = factory();
	else
		root["Handlebars"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireWildcard = __webpack_require__(7)['default'];

	exports.__esModule = true;

	var _import = __webpack_require__(1);

	var base = _interopRequireWildcard(_import);

	// Each of these augment the Handlebars object. No need to setup here.
	// (This is done to easily share code between commonjs and browse envs)

	var _SafeString = __webpack_require__(2);

	var _SafeString2 = _interopRequireWildcard(_SafeString);

	var _Exception = __webpack_require__(3);

	var _Exception2 = _interopRequireWildcard(_Exception);

	var _import2 = __webpack_require__(4);

	var Utils = _interopRequireWildcard(_import2);

	var _import3 = __webpack_require__(5);

	var runtime = _interopRequireWildcard(_import3);

	var _noConflict = __webpack_require__(6);

	var _noConflict2 = _interopRequireWildcard(_noConflict);

	// For compatibility and usage outside of module systems, make the Handlebars object a namespace
	function create() {
	  var hb = new base.HandlebarsEnvironment();

	  Utils.extend(hb, base);
	  hb.SafeString = _SafeString2['default'];
	  hb.Exception = _Exception2['default'];
	  hb.Utils = Utils;
	  hb.escapeExpression = Utils.escapeExpression;

	  hb.VM = runtime;
	  hb.template = function (spec) {
	    return runtime.template(spec, hb);
	  };

	  return hb;
	}

	var inst = create();
	inst.create = create;

	_noConflict2['default'](inst);

	inst['default'] = inst;

	exports['default'] = inst;
	module.exports = exports['default'];

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireWildcard = __webpack_require__(7)['default'];

	exports.__esModule = true;
	exports.HandlebarsEnvironment = HandlebarsEnvironment;
	exports.createFrame = createFrame;

	var _import = __webpack_require__(4);

	var Utils = _interopRequireWildcard(_import);

	var _Exception = __webpack_require__(3);

	var _Exception2 = _interopRequireWildcard(_Exception);

	var VERSION = '3.0.1';
	exports.VERSION = VERSION;
	var COMPILER_REVISION = 6;

	exports.COMPILER_REVISION = COMPILER_REVISION;
	var REVISION_CHANGES = {
	  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
	  2: '== 1.0.0-rc.3',
	  3: '== 1.0.0-rc.4',
	  4: '== 1.x.x',
	  5: '== 2.0.0-alpha.x',
	  6: '>= 2.0.0-beta.1'
	};

	exports.REVISION_CHANGES = REVISION_CHANGES;
	var isArray = Utils.isArray,
	    isFunction = Utils.isFunction,
	    toString = Utils.toString,
	    objectType = '[object Object]';

	function HandlebarsEnvironment(helpers, partials) {
	  this.helpers = helpers || {};
	  this.partials = partials || {};

	  registerDefaultHelpers(this);
	}

	HandlebarsEnvironment.prototype = {
	  constructor: HandlebarsEnvironment,

	  logger: logger,
	  log: log,

	  registerHelper: function registerHelper(name, fn) {
	    if (toString.call(name) === objectType) {
	      if (fn) {
	        throw new _Exception2['default']('Arg not supported with multiple helpers');
	      }
	      Utils.extend(this.helpers, name);
	    } else {
	      this.helpers[name] = fn;
	    }
	  },
	  unregisterHelper: function unregisterHelper(name) {
	    delete this.helpers[name];
	  },

	  registerPartial: function registerPartial(name, partial) {
	    if (toString.call(name) === objectType) {
	      Utils.extend(this.partials, name);
	    } else {
	      if (typeof partial === 'undefined') {
	        throw new _Exception2['default']('Attempting to register a partial as undefined');
	      }
	      this.partials[name] = partial;
	    }
	  },
	  unregisterPartial: function unregisterPartial(name) {
	    delete this.partials[name];
	  }
	};

	function registerDefaultHelpers(instance) {
	  instance.registerHelper('helperMissing', function () {
	    if (arguments.length === 1) {
	      // A missing field in a {{foo}} constuct.
	      return undefined;
	    } else {
	      // Someone is actually trying to call something, blow up.
	      throw new _Exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');
	    }
	  });

	  instance.registerHelper('blockHelperMissing', function (context, options) {
	    var inverse = options.inverse,
	        fn = options.fn;

	    if (context === true) {
	      return fn(this);
	    } else if (context === false || context == null) {
	      return inverse(this);
	    } else if (isArray(context)) {
	      if (context.length > 0) {
	        if (options.ids) {
	          options.ids = [options.name];
	        }

	        return instance.helpers.each(context, options);
	      } else {
	        return inverse(this);
	      }
	    } else {
	      if (options.data && options.ids) {
	        var data = createFrame(options.data);
	        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
	        options = { data: data };
	      }

	      return fn(context, options);
	    }
	  });

	  instance.registerHelper('each', function (context, options) {
	    if (!options) {
	      throw new _Exception2['default']('Must pass iterator to #each');
	    }

	    var fn = options.fn,
	        inverse = options.inverse,
	        i = 0,
	        ret = '',
	        data = undefined,
	        contextPath = undefined;

	    if (options.data && options.ids) {
	      contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
	    }

	    if (isFunction(context)) {
	      context = context.call(this);
	    }

	    if (options.data) {
	      data = createFrame(options.data);
	    }

	    function execIteration(field, index, last) {
	      if (data) {
	        data.key = field;
	        data.index = index;
	        data.first = index === 0;
	        data.last = !!last;

	        if (contextPath) {
	          data.contextPath = contextPath + field;
	        }
	      }

	      ret = ret + fn(context[field], {
	        data: data,
	        blockParams: Utils.blockParams([context[field], field], [contextPath + field, null])
	      });
	    }

	    if (context && typeof context === 'object') {
	      if (isArray(context)) {
	        for (var j = context.length; i < j; i++) {
	          execIteration(i, i, i === context.length - 1);
	        }
	      } else {
	        var priorKey = undefined;

	        for (var key in context) {
	          if (context.hasOwnProperty(key)) {
	            // We're running the iterations one step out of sync so we can detect
	            // the last iteration without have to scan the object twice and create
	            // an itermediate keys array.
	            if (priorKey) {
	              execIteration(priorKey, i - 1);
	            }
	            priorKey = key;
	            i++;
	          }
	        }
	        if (priorKey) {
	          execIteration(priorKey, i - 1, true);
	        }
	      }
	    }

	    if (i === 0) {
	      ret = inverse(this);
	    }

	    return ret;
	  });

	  instance.registerHelper('if', function (conditional, options) {
	    if (isFunction(conditional)) {
	      conditional = conditional.call(this);
	    }

	    // Default behavior is to render the positive path if the value is truthy and not empty.
	    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
	    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
	    if (!options.hash.includeZero && !conditional || Utils.isEmpty(conditional)) {
	      return options.inverse(this);
	    } else {
	      return options.fn(this);
	    }
	  });

	  instance.registerHelper('unless', function (conditional, options) {
	    return instance.helpers['if'].call(this, conditional, { fn: options.inverse, inverse: options.fn, hash: options.hash });
	  });

	  instance.registerHelper('with', function (context, options) {
	    if (isFunction(context)) {
	      context = context.call(this);
	    }

	    var fn = options.fn;

	    if (!Utils.isEmpty(context)) {
	      if (options.data && options.ids) {
	        var data = createFrame(options.data);
	        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
	        options = { data: data };
	      }

	      return fn(context, options);
	    } else {
	      return options.inverse(this);
	    }
	  });

	  instance.registerHelper('log', function (message, options) {
	    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
	    instance.log(level, message);
	  });

	  instance.registerHelper('lookup', function (obj, field) {
	    return obj && obj[field];
	  });
	}

	var logger = {
	  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

	  // State enum
	  DEBUG: 0,
	  INFO: 1,
	  WARN: 2,
	  ERROR: 3,
	  level: 1,

	  // Can be overridden in the host environment
	  log: function log(level, message) {
	    if (typeof console !== 'undefined' && logger.level <= level) {
	      var method = logger.methodMap[level];
	      (console[method] || console.log).call(console, message); // eslint-disable-line no-console
	    }
	  }
	};

	exports.logger = logger;
	var log = logger.log;

	exports.log = log;

	function createFrame(object) {
	  var frame = Utils.extend({}, object);
	  frame._parent = object;
	  return frame;
	}

	/* [args, ]options */

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;
	// Build out our basic SafeString type
	function SafeString(string) {
	  this.string = string;
	}

	SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
	  return '' + this.string;
	};

	exports['default'] = SafeString;
	module.exports = exports['default'];

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;

	var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

	function Exception(message, node) {
	  var loc = node && node.loc,
	      line = undefined,
	      column = undefined;
	  if (loc) {
	    line = loc.start.line;
	    column = loc.start.column;

	    message += ' - ' + line + ':' + column;
	  }

	  var tmp = Error.prototype.constructor.call(this, message);

	  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
	  for (var idx = 0; idx < errorProps.length; idx++) {
	    this[errorProps[idx]] = tmp[errorProps[idx]];
	  }

	  if (Error.captureStackTrace) {
	    Error.captureStackTrace(this, Exception);
	  }

	  if (loc) {
	    this.lineNumber = line;
	    this.column = column;
	  }
	}

	Exception.prototype = new Error();

	exports['default'] = Exception;
	module.exports = exports['default'];

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	exports.__esModule = true;
	exports.extend = extend;

	// Older IE versions do not directly support indexOf so we must implement our own, sadly.
	exports.indexOf = indexOf;
	exports.escapeExpression = escapeExpression;
	exports.isEmpty = isEmpty;
	exports.blockParams = blockParams;
	exports.appendContextPath = appendContextPath;
	var escape = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&quot;',
	  '\'': '&#x27;',
	  '`': '&#x60;'
	};

	var badChars = /[&<>"'`]/g,
	    possible = /[&<>"'`]/;

	function escapeChar(chr) {
	  return escape[chr];
	}

	function extend(obj /* , ...source */) {
	  for (var i = 1; i < arguments.length; i++) {
	    for (var key in arguments[i]) {
	      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
	        obj[key] = arguments[i][key];
	      }
	    }
	  }

	  return obj;
	}

	var toString = Object.prototype.toString;

	exports.toString = toString;
	// Sourced from lodash
	// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
	/*eslint-disable func-style, no-var */
	var isFunction = function isFunction(value) {
	  return typeof value === 'function';
	};
	// fallback for older versions of Chrome and Safari
	/* istanbul ignore next */
	if (isFunction(/x/)) {
	  exports.isFunction = isFunction = function (value) {
	    return typeof value === 'function' && toString.call(value) === '[object Function]';
	  };
	}
	var isFunction;
	exports.isFunction = isFunction;
	/*eslint-enable func-style, no-var */

	/* istanbul ignore next */
	var isArray = Array.isArray || function (value) {
	  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
	};exports.isArray = isArray;

	function indexOf(array, value) {
	  for (var i = 0, len = array.length; i < len; i++) {
	    if (array[i] === value) {
	      return i;
	    }
	  }
	  return -1;
	}

	function escapeExpression(string) {
	  if (typeof string !== 'string') {
	    // don't escape SafeStrings, since they're already safe
	    if (string && string.toHTML) {
	      return string.toHTML();
	    } else if (string == null) {
	      return '';
	    } else if (!string) {
	      return string + '';
	    }

	    // Force a string conversion as this will be done by the append regardless and
	    // the regex test will do this transparently behind the scenes, causing issues if
	    // an object's to string has escaped characters in it.
	    string = '' + string;
	  }

	  if (!possible.test(string)) {
	    return string;
	  }
	  return string.replace(badChars, escapeChar);
	}

	function isEmpty(value) {
	  if (!value && value !== 0) {
	    return true;
	  } else if (isArray(value) && value.length === 0) {
	    return true;
	  } else {
	    return false;
	  }
	}

	function blockParams(params, ids) {
	  params.path = ids;
	  return params;
	}

	function appendContextPath(contextPath, id) {
	  return (contextPath ? contextPath + '.' : '') + id;
	}

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _interopRequireWildcard = __webpack_require__(7)['default'];

	exports.__esModule = true;
	exports.checkRevision = checkRevision;

	// TODO: Remove this line and break up compilePartial

	exports.template = template;
	exports.wrapProgram = wrapProgram;
	exports.resolvePartial = resolvePartial;
	exports.invokePartial = invokePartial;
	exports.noop = noop;

	var _import = __webpack_require__(4);

	var Utils = _interopRequireWildcard(_import);

	var _Exception = __webpack_require__(3);

	var _Exception2 = _interopRequireWildcard(_Exception);

	var _COMPILER_REVISION$REVISION_CHANGES$createFrame = __webpack_require__(1);

	function checkRevision(compilerInfo) {
	  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
	      currentRevision = _COMPILER_REVISION$REVISION_CHANGES$createFrame.COMPILER_REVISION;

	  if (compilerRevision !== currentRevision) {
	    if (compilerRevision < currentRevision) {
	      var runtimeVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[currentRevision],
	          compilerVersions = _COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[compilerRevision];
	      throw new _Exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');
	    } else {
	      // Use the embedded version info since the runtime doesn't know about this revision yet
	      throw new _Exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');
	    }
	  }
	}

	function template(templateSpec, env) {
	  /* istanbul ignore next */
	  if (!env) {
	    throw new _Exception2['default']('No environment passed to template');
	  }
	  if (!templateSpec || !templateSpec.main) {
	    throw new _Exception2['default']('Unknown template object: ' + typeof templateSpec);
	  }

	  // Note: Using env.VM references rather than local var references throughout this section to allow
	  // for external users to override these as psuedo-supported APIs.
	  env.VM.checkRevision(templateSpec.compiler);

	  function invokePartialWrapper(partial, context, options) {
	    if (options.hash) {
	      context = Utils.extend({}, context, options.hash);
	    }

	    partial = env.VM.resolvePartial.call(this, partial, context, options);
	    var result = env.VM.invokePartial.call(this, partial, context, options);

	    if (result == null && env.compile) {
	      options.partials[options.name] = env.compile(partial, templateSpec.compilerOptions, env);
	      result = options.partials[options.name](context, options);
	    }
	    if (result != null) {
	      if (options.indent) {
	        var lines = result.split('\n');
	        for (var i = 0, l = lines.length; i < l; i++) {
	          if (!lines[i] && i + 1 === l) {
	            break;
	          }

	          lines[i] = options.indent + lines[i];
	        }
	        result = lines.join('\n');
	      }
	      return result;
	    } else {
	      throw new _Exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');
	    }
	  }

	  // Just add water
	  var container = {
	    strict: function strict(obj, name) {
	      if (!(name in obj)) {
	        throw new _Exception2['default']('"' + name + '" not defined in ' + obj);
	      }
	      return obj[name];
	    },
	    lookup: function lookup(depths, name) {
	      var len = depths.length;
	      for (var i = 0; i < len; i++) {
	        if (depths[i] && depths[i][name] != null) {
	          return depths[i][name];
	        }
	      }
	    },
	    lambda: function lambda(current, context) {
	      return typeof current === 'function' ? current.call(context) : current;
	    },

	    escapeExpression: Utils.escapeExpression,
	    invokePartial: invokePartialWrapper,

	    fn: function fn(i) {
	      return templateSpec[i];
	    },

	    programs: [],
	    program: function program(i, data, declaredBlockParams, blockParams, depths) {
	      var programWrapper = this.programs[i],
	          fn = this.fn(i);
	      if (data || depths || blockParams || declaredBlockParams) {
	        programWrapper = wrapProgram(this, i, fn, data, declaredBlockParams, blockParams, depths);
	      } else if (!programWrapper) {
	        programWrapper = this.programs[i] = wrapProgram(this, i, fn);
	      }
	      return programWrapper;
	    },

	    data: function data(value, depth) {
	      while (value && depth--) {
	        value = value._parent;
	      }
	      return value;
	    },
	    merge: function merge(param, common) {
	      var obj = param || common;

	      if (param && common && param !== common) {
	        obj = Utils.extend({}, common, param);
	      }

	      return obj;
	    },

	    noop: env.VM.noop,
	    compilerInfo: templateSpec.compiler
	  };

	  function ret(context) {
	    var options = arguments[1] === undefined ? {} : arguments[1];

	    var data = options.data;

	    ret._setup(options);
	    if (!options.partial && templateSpec.useData) {
	      data = initData(context, data);
	    }
	    var depths = undefined,
	        blockParams = templateSpec.useBlockParams ? [] : undefined;
	    if (templateSpec.useDepths) {
	      depths = options.depths ? [context].concat(options.depths) : [context];
	    }

	    return templateSpec.main.call(container, context, container.helpers, container.partials, data, blockParams, depths);
	  }
	  ret.isTop = true;

	  ret._setup = function (options) {
	    if (!options.partial) {
	      container.helpers = container.merge(options.helpers, env.helpers);

	      if (templateSpec.usePartial) {
	        container.partials = container.merge(options.partials, env.partials);
	      }
	    } else {
	      container.helpers = options.helpers;
	      container.partials = options.partials;
	    }
	  };

	  ret._child = function (i, data, blockParams, depths) {
	    if (templateSpec.useBlockParams && !blockParams) {
	      throw new _Exception2['default']('must pass block params');
	    }
	    if (templateSpec.useDepths && !depths) {
	      throw new _Exception2['default']('must pass parent depths');
	    }

	    return wrapProgram(container, i, templateSpec[i], data, 0, blockParams, depths);
	  };
	  return ret;
	}

	function wrapProgram(container, i, fn, data, declaredBlockParams, blockParams, depths) {
	  function prog(context) {
	    var options = arguments[1] === undefined ? {} : arguments[1];

	    return fn.call(container, context, container.helpers, container.partials, options.data || data, blockParams && [options.blockParams].concat(blockParams), depths && [context].concat(depths));
	  }
	  prog.program = i;
	  prog.depth = depths ? depths.length : 0;
	  prog.blockParams = declaredBlockParams || 0;
	  return prog;
	}

	function resolvePartial(partial, context, options) {
	  if (!partial) {
	    partial = options.partials[options.name];
	  } else if (!partial.call && !options.name) {
	    // This is a dynamic partial that returned a string
	    options.name = partial;
	    partial = options.partials[partial];
	  }
	  return partial;
	}

	function invokePartial(partial, context, options) {
	  options.partial = true;

	  if (partial === undefined) {
	    throw new _Exception2['default']('The partial ' + options.name + ' could not be found');
	  } else if (partial instanceof Function) {
	    return partial(context, options);
	  }
	}

	function noop() {
	  return '';
	}

	function initData(context, data) {
	  if (!data || !('root' in data)) {
	    data = data ? _COMPILER_REVISION$REVISION_CHANGES$createFrame.createFrame(data) : {};
	    data.root = context;
	  }
	  return data;
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {'use strict';

	exports.__esModule = true;
	/*global window */

	exports['default'] = function (Handlebars) {
	  /* istanbul ignore next */
	  var root = typeof global !== 'undefined' ? global : window,
	      $Handlebars = root.Handlebars;
	  /* istanbul ignore next */
	  Handlebars.noConflict = function () {
	    if (root.Handlebars === Handlebars) {
	      root.Handlebars = $Handlebars;
	    }
	  };
	};

	module.exports = exports['default'];
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	exports["default"] = function (obj) {
	  return obj && obj.__esModule ? obj : {
	    "default": obj
	  };
	};

	exports.__esModule = true;

/***/ }
/******/ ])
});
;
},{}],9:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],10:[function(require,module,exports){
(function (process){
  /* globals require, module */

  'use strict';

  /**
   * Module dependencies.
   */

  var pathtoRegexp = require('path-to-regexp');

  /**
   * Module exports.
   */

  module.exports = page;

  /**
   * Detect click event
   */
  var clickEvent = ('undefined' !== typeof document) && document.ontouchstart ? 'touchstart' : 'click';

  /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */

  var location = ('undefined' !== typeof window) && (window.history.location || window.location);

  /**
   * Perform initial dispatch.
   */

  var dispatch = true;


  /**
   * Decode URL components (query string, pathname, hash).
   * Accommodates both regular percent encoding and x-www-form-urlencoded format.
   */
  var decodeURLComponents = true;

  /**
   * Base path.
   */

  var base = '';

  /**
   * Running flag.
   */

  var running;

  /**
   * HashBang option
   */

  var hashbang = false;

  /**
   * Previous context, for capturing
   * page exit events.
   */

  var prevContext;

  /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */

  function page(path, fn) {
    // <callback>
    if ('function' === typeof path) {
      return page('*', path);
    }

    // route <path> to <callback ...>
    if ('function' === typeof fn) {
      var route = new Route(path);
      for (var i = 1; i < arguments.length; ++i) {
        page.callbacks.push(route.middleware(arguments[i]));
      }
      // show <path> with [state]
    } else if ('string' === typeof path) {
      page['string' === typeof fn ? 'redirect' : 'show'](path, fn);
      // start [options]
    } else {
      page.start(path);
    }
  }

  /**
   * Callback functions.
   */

  page.callbacks = [];
  page.exits = [];

  /**
   * Current path being processed
   * @type {String}
   */
  page.current = '';

  /**
   * Number of pages navigated to.
   * @type {number}
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */

  page.len = 0;

  /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */

  page.base = function(path) {
    if (0 === arguments.length) return base;
    base = path;
  };

  /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */

  page.start = function(options) {
    options = options || {};
    if (running) return;
    running = true;
    if (false === options.dispatch) dispatch = false;
    if (false === options.decodeURLComponents) decodeURLComponents = false;
    if (false !== options.popstate) window.addEventListener('popstate', onpopstate, false);
    if (false !== options.click) {
      document.addEventListener(clickEvent, onclick, false);
    }
    if (true === options.hashbang) hashbang = true;
    if (!dispatch) return;
    var url = (hashbang && ~location.hash.indexOf('#!')) ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
    page.replace(url, null, true, dispatch);
  };

  /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */

  page.stop = function() {
    if (!running) return;
    page.current = '';
    page.len = 0;
    running = false;
    document.removeEventListener(clickEvent, onclick, false);
    window.removeEventListener('popstate', onpopstate, false);
  };

  /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */

  page.show = function(path, state, dispatch, push) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    if (false !== dispatch) page.dispatch(ctx);
    if (false !== ctx.handled && false !== push) ctx.pushState();
    return ctx;
  };

  /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {String} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object} [state]
   * @api public
   */

  page.back = function(path, state) {
    if (page.len > 0) {
      // this may need more testing to see if all browsers
      // wait for the next tick to go back in history
      history.back();
      page.len--;
    } else if (path) {
      setTimeout(function() {
        page.show(path, state);
      });
    }else{
      setTimeout(function() {
        page.show(base, state);
      });
    }
  };


  /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {String} from - if param 'to' is undefined redirects to 'from'
   * @param {String} [to]
   * @api public
   */
  page.redirect = function(from, to) {
    // Define route from a path to another
    if ('string' === typeof from && 'string' === typeof to) {
      page(from, function(e) {
        setTimeout(function() {
          page.replace(to);
        }, 0);
      });
    }

    // Wait for the push state and replace it with another
    if ('string' === typeof from && 'undefined' === typeof to) {
      setTimeout(function() {
        page.replace(from);
      }, 0);
    }
  };

  /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */


  page.replace = function(path, state, init, dispatch) {
    var ctx = new Context(path, state);
    page.current = ctx.path;
    ctx.init = init;
    ctx.save(); // save before dispatching, which may redirect
    if (false !== dispatch) page.dispatch(ctx);
    return ctx;
  };

  /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */

  page.dispatch = function(ctx) {
    var prev = prevContext,
      i = 0,
      j = 0;

    prevContext = ctx;

    function nextExit() {
      var fn = page.exits[j++];
      if (!fn) return nextEnter();
      fn(prev, nextExit);
    }

    function nextEnter() {
      var fn = page.callbacks[i++];

      if (ctx.path !== page.current) {
        ctx.handled = false;
        return;
      }
      if (!fn) return unhandled(ctx);
      fn(ctx, nextEnter);
    }

    if (prev) {
      nextExit();
    } else {
      nextEnter();
    }
  };

  /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */

  function unhandled(ctx) {
    if (ctx.handled) return;
    var current;

    if (hashbang) {
      current = base + location.hash.replace('#!', '');
    } else {
      current = location.pathname + location.search;
    }

    if (current === ctx.canonicalPath) return;
    page.stop();
    ctx.handled = false;
    location.href = ctx.canonicalPath;
  }

  /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */
  page.exit = function(path, fn) {
    if (typeof path === 'function') {
      return page.exit('*', path);
    }

    var route = new Route(path);
    for (var i = 1; i < arguments.length; ++i) {
      page.exits.push(route.middleware(arguments[i]));
    }
  };

  /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */
  function decodeURLEncodedURIComponent(val) {
    if (typeof val !== 'string') { return val; }
    return decodeURLComponents ? decodeURIComponent(val.replace(/\+/g, ' ')) : val;
  }

  /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */

  function Context(path, state) {
    if ('/' === path[0] && 0 !== path.indexOf(base)) path = base + (hashbang ? '#!' : '') + path;
    var i = path.indexOf('?');

    this.canonicalPath = path;
    this.path = path.replace(base, '') || '/';
    if (hashbang) this.path = this.path.replace('#!', '') || '/';

    this.title = document.title;
    this.state = state || {};
    this.state.path = path;
    this.querystring = ~i ? decodeURLEncodedURIComponent(path.slice(i + 1)) : '';
    this.pathname = decodeURLEncodedURIComponent(~i ? path.slice(0, i) : path);
    this.params = {};

    // fragment
    this.hash = '';
    if (!hashbang) {
      if (!~this.path.indexOf('#')) return;
      var parts = this.path.split('#');
      this.path = parts[0];
      this.hash = decodeURLEncodedURIComponent(parts[1]) || '';
      this.querystring = this.querystring.split('#')[0];
    }
  }

  /**
   * Expose `Context`.
   */

  page.Context = Context;

  /**
   * Push state.
   *
   * @api private
   */

  Context.prototype.pushState = function() {
    page.len++;
    history.pushState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Save the context state.
   *
   * @api public
   */

  Context.prototype.save = function() {
    history.replaceState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
  };

  /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */

  function Route(path, options) {
    options = options || {};
    this.path = (path === '*') ? '(.*)' : path;
    this.method = 'GET';
    this.regexp = pathtoRegexp(this.path,
      this.keys = [],
      options.sensitive,
      options.strict);
  }

  /**
   * Expose `Route`.
   */

  page.Route = Route;

  /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */

  Route.prototype.middleware = function(fn) {
    var self = this;
    return function(ctx, next) {
      if (self.match(ctx.path, ctx.params)) return fn(ctx, next);
      next();
    };
  };

  /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Object} params
   * @return {Boolean}
   * @api private
   */

  Route.prototype.match = function(path, params) {
    var keys = this.keys,
      qsIndex = path.indexOf('?'),
      pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
      m = this.regexp.exec(decodeURIComponent(pathname));

    if (!m) return false;

    for (var i = 1, len = m.length; i < len; ++i) {
      var key = keys[i - 1];
      var val = decodeURLEncodedURIComponent(m[i]);
      if (val !== undefined || !(hasOwnProperty.call(params, key.name))) {
        params[key.name] = val;
      }
    }

    return true;
  };


  /**
   * Handle "populate" events.
   */

  var onpopstate = (function () {
    var loaded = false;
    if ('undefined' === typeof window) {
      return;
    }
    if (document.readyState === 'complete') {
      loaded = true;
    } else {
      window.addEventListener('load', function() {
        setTimeout(function() {
          loaded = true;
        }, 0);
      });
    }
    return function onpopstate(e) {
      if (!loaded) return;
      if (e.state) {
        var path = e.state.path;
        page.replace(path, e.state);
      } else {
        page.show(location.pathname + location.hash, undefined, undefined, false);
      }
    };
  })();
  /**
   * Handle "click" events.
   */

  function onclick(e) {

    if (1 !== which(e)) return;

    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (e.defaultPrevented) return;



    // ensure link
    var el = e.target;
    while (el && 'A' !== el.nodeName) el = el.parentNode;
    if (!el || 'A' !== el.nodeName) return;



    // Ignore if tag has
    // 1. "download" attribute
    // 2. rel="external" attribute
    if (el.hasAttribute('download') || el.getAttribute('rel') === 'external') return;

    // ensure non-hash for the same path
    var link = el.getAttribute('href');
    if (!hashbang && el.pathname === location.pathname && (el.hash || '#' === link)) return;



    // Check for mailto: in the href
    if (link && link.indexOf('mailto:') > -1) return;

    // check target
    if (el.target) return;

    // x-origin
    if (!sameOrigin(el.href)) return;



    // rebuild path
    var path = el.pathname + el.search + (el.hash || '');

    // strip leading "/[drive letter]:" on NW.js on Windows
    if (typeof process !== 'undefined' && path.match(/^\/[a-zA-Z]:\//)) {
      path = path.replace(/^\/[a-zA-Z]:\//, '/');
    }

    // same page
    var orig = path;

    if (path.indexOf(base) === 0) {
      path = path.substr(base.length);
    }

    if (hashbang) path = path.replace('#!', '');

    if (base && orig === path) return;

    e.preventDefault();
    page.show(orig);
  }

  /**
   * Event button.
   */

  function which(e) {
    e = e || window.event;
    return null === e.which ? e.button : e.which;
  }

  /**
   * Check if `href` is the same origin.
   */

  function sameOrigin(href) {
    var origin = location.protocol + '//' + location.hostname;
    if (location.port) origin += ':' + location.port;
    return (href && (0 === href.indexOf(origin)));
  }

  page.sameOrigin = sameOrigin;

}).call(this,require('_process'))

},{"_process":47,"path-to-regexp":11}],11:[function(require,module,exports){
var isarray = require('isarray')

/**
 * Expose `pathToRegexp`.
 */
module.exports = pathToRegexp
module.exports.parse = parse
module.exports.compile = compile
module.exports.tokensToFunction = tokensToFunction
module.exports.tokensToRegExp = tokensToRegExp

/**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */
var PATH_REGEXP = new RegExp([
  // Match escaped characters that would otherwise appear in future matches.
  // This allows the user to escape special characters that won't transform.
  '(\\\\.)',
  // Match Express-style parameters and un-named parameters with a prefix
  // and optional suffixes. Matches appear as:
  //
  // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?", undefined]
  // "/route(\\d+)"  => [undefined, undefined, undefined, "\d+", undefined, undefined]
  // "/*"            => ["/", undefined, undefined, undefined, undefined, "*"]
  '([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))'
].join('|'), 'g')

/**
 * Parse a string for the raw tokens.
 *
 * @param  {String} str
 * @return {Array}
 */
function parse (str) {
  var tokens = []
  var key = 0
  var index = 0
  var path = ''
  var res

  while ((res = PATH_REGEXP.exec(str)) != null) {
    var m = res[0]
    var escaped = res[1]
    var offset = res.index
    path += str.slice(index, offset)
    index = offset + m.length

    // Ignore already escaped sequences.
    if (escaped) {
      path += escaped[1]
      continue
    }

    // Push the current path onto the tokens.
    if (path) {
      tokens.push(path)
      path = ''
    }

    var prefix = res[2]
    var name = res[3]
    var capture = res[4]
    var group = res[5]
    var suffix = res[6]
    var asterisk = res[7]

    var repeat = suffix === '+' || suffix === '*'
    var optional = suffix === '?' || suffix === '*'
    var delimiter = prefix || '/'
    var pattern = capture || group || (asterisk ? '.*' : '[^' + delimiter + ']+?')

    tokens.push({
      name: name || key++,
      prefix: prefix || '',
      delimiter: delimiter,
      optional: optional,
      repeat: repeat,
      pattern: escapeGroup(pattern)
    })
  }

  // Match any characters still remaining.
  if (index < str.length) {
    path += str.substr(index)
  }

  // If the path exists, push it onto the end.
  if (path) {
    tokens.push(path)
  }

  return tokens
}

/**
 * Compile a string to a template function for the path.
 *
 * @param  {String}   str
 * @return {Function}
 */
function compile (str) {
  return tokensToFunction(parse(str))
}

/**
 * Expose a method for transforming tokens into the path function.
 */
function tokensToFunction (tokens) {
  // Compile all the tokens into regexps.
  var matches = new Array(tokens.length)

  // Compile all the patterns before compilation.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] === 'object') {
      matches[i] = new RegExp('^' + tokens[i].pattern + '$')
    }
  }

  return function (obj) {
    var path = ''
    var data = obj || {}

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i]

      if (typeof token === 'string') {
        path += token

        continue
      }

      var value = data[token.name]
      var segment

      if (value == null) {
        if (token.optional) {
          continue
        } else {
          throw new TypeError('Expected "' + token.name + '" to be defined')
        }
      }

      if (isarray(value)) {
        if (!token.repeat) {
          throw new TypeError('Expected "' + token.name + '" to not repeat, but received "' + value + '"')
        }

        if (value.length === 0) {
          if (token.optional) {
            continue
          } else {
            throw new TypeError('Expected "' + token.name + '" to not be empty')
          }
        }

        for (var j = 0; j < value.length; j++) {
          segment = encodeURIComponent(value[j])

          if (!matches[i].test(segment)) {
            throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
          }

          path += (j === 0 ? token.prefix : token.delimiter) + segment
        }

        continue
      }

      segment = encodeURIComponent(value)

      if (!matches[i].test(segment)) {
        throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but received "' + segment + '"')
      }

      path += token.prefix + segment
    }

    return path
  }
}

/**
 * Escape a regular expression string.
 *
 * @param  {String} str
 * @return {String}
 */
function escapeString (str) {
  return str.replace(/([.+*?=^!:${}()[\]|\/])/g, '\\$1')
}

/**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */
function escapeGroup (group) {
  return group.replace(/([=!:$\/()])/g, '\\$1')
}

/**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */
function attachKeys (re, keys) {
  re.keys = keys
  return re
}

/**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */
function flags (options) {
  return options.sensitive ? '' : 'i'
}

/**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */
function regexpToRegexp (path, keys) {
  // Use a negative lookahead to match only capturing groups.
  var groups = path.source.match(/\((?!\?)/g)

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: null,
        delimiter: null,
        optional: false,
        repeat: false,
        pattern: null
      })
    }
  }

  return attachKeys(path, keys)
}

/**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function arrayToRegexp (path, keys, options) {
  var parts = []

  for (var i = 0; i < path.length; i++) {
    parts.push(pathToRegexp(path[i], keys, options).source)
  }

  var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options))

  return attachKeys(regexp, keys)
}

/**
 * Create a path regexp from string input.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function stringToRegexp (path, keys, options) {
  var tokens = parse(path)
  var re = tokensToRegExp(tokens, options)

  // Attach keys back to the regexp.
  for (var i = 0; i < tokens.length; i++) {
    if (typeof tokens[i] !== 'string') {
      keys.push(tokens[i])
    }
  }

  return attachKeys(re, keys)
}

/**
 * Expose a function for taking tokens and returning a RegExp.
 *
 * @param  {Array}  tokens
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */
function tokensToRegExp (tokens, options) {
  options = options || {}

  var strict = options.strict
  var end = options.end !== false
  var route = ''
  var lastToken = tokens[tokens.length - 1]
  var endsWithSlash = typeof lastToken === 'string' && /\/$/.test(lastToken)

  // Iterate over the tokens and create our regexp string.
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i]

    if (typeof token === 'string') {
      route += escapeString(token)
    } else {
      var prefix = escapeString(token.prefix)
      var capture = token.pattern

      if (token.repeat) {
        capture += '(?:' + prefix + capture + ')*'
      }

      if (token.optional) {
        if (prefix) {
          capture = '(?:' + prefix + '(' + capture + '))?'
        } else {
          capture = '(' + capture + ')?'
        }
      } else {
        capture = prefix + '(' + capture + ')'
      }

      route += capture
    }
  }

  // In non-strict mode we allow a slash at the end of match. If the path to
  // match already ends with a slash, we remove it for consistency. The slash
  // is valid at the end of a path match, not in the middle. This is important
  // in non-ending mode, where "/test/" shouldn't match "/test//route".
  if (!strict) {
    route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?'
  }

  if (end) {
    route += '$'
  } else {
    // In non-ending mode, we need the capturing groups to match as much as
    // possible by using a positive lookahead to the end or next path segment.
    route += strict && endsWithSlash ? '' : '(?=\\/|$)'
  }

  return new RegExp('^' + route, flags(options))
}

/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */
function pathToRegexp (path, keys, options) {
  keys = keys || []

  if (!isarray(keys)) {
    options = keys
    keys = []
  } else if (!options) {
    options = {}
  }

  if (path instanceof RegExp) {
    return regexpToRegexp(path, keys, options)
  }

  if (isarray(path)) {
    return arrayToRegexp(path, keys, options)
  }

  return stringToRegexp(path, keys, options)
}

},{"isarray":9}],12:[function(require,module,exports){
(function() {
  'use strict';

  if (self.fetch) {
    return
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name)
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name')
    }
    return name.toLowerCase()
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value)
    }
    return value
  }

  function Headers(headers) {
    this.map = {}

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value)
      }, this)

    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function(name) {
        this.append(name, headers[name])
      }, this)
    }
  }

  Headers.prototype.append = function(name, value) {
    name = normalizeName(name)
    value = normalizeValue(value)
    var list = this.map[name]
    if (!list) {
      list = []
      this.map[name] = list
    }
    list.push(value)
  }

  Headers.prototype['delete'] = function(name) {
    delete this.map[normalizeName(name)]
  }

  Headers.prototype.get = function(name) {
    var values = this.map[normalizeName(name)]
    return values ? values[0] : null
  }

  Headers.prototype.getAll = function(name) {
    return this.map[normalizeName(name)] || []
  }

  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name))
  }

  Headers.prototype.set = function(name, value) {
    this.map[normalizeName(name)] = [normalizeValue(value)]
  }

  Headers.prototype.forEach = function(callback, thisArg) {
    Object.getOwnPropertyNames(this.map).forEach(function(name) {
      this.map[name].forEach(function(value) {
        callback.call(thisArg, value, name, this)
      }, this)
    }, this)
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'))
    }
    body.bodyUsed = true
  }

  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result)
      }
      reader.onerror = function() {
        reject(reader.error)
      }
    })
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader()
    reader.readAsArrayBuffer(blob)
    return fileReaderReady(reader)
  }

  function readBlobAsText(blob) {
    var reader = new FileReader()
    reader.readAsText(blob)
    return fileReaderReady(reader)
  }

  var support = {
    blob: 'FileReader' in self && 'Blob' in self && (function() {
      try {
        new Blob();
        return true
      } catch(e) {
        return false
      }
    })(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  }

  function Body() {
    this.bodyUsed = false


    this._initBody = function(body) {
      this._bodyInit = body
      if (typeof body === 'string') {
        this._bodyText = body
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body
      } else if (!body) {
        this._bodyText = ''
      } else if (support.arrayBuffer && ArrayBuffer.prototype.isPrototypeOf(body)) {
        // Only support ArrayBuffers for POST method.
        // Receiving ArrayBuffers happens via Blobs, instead.
      } else {
        throw new Error('unsupported BodyInit type')
      }
    }

    if (support.blob) {
      this.blob = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob')
        } else {
          return Promise.resolve(new Blob([this._bodyText]))
        }
      }

      this.arrayBuffer = function() {
        return this.blob().then(readBlobAsArrayBuffer)
      }

      this.text = function() {
        var rejected = consumed(this)
        if (rejected) {
          return rejected
        }

        if (this._bodyBlob) {
          return readBlobAsText(this._bodyBlob)
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as text')
        } else {
          return Promise.resolve(this._bodyText)
        }
      }
    } else {
      this.text = function() {
        var rejected = consumed(this)
        return rejected ? rejected : Promise.resolve(this._bodyText)
      }
    }

    if (support.formData) {
      this.formData = function() {
        return this.text().then(decode)
      }
    }

    this.json = function() {
      return this.text().then(JSON.parse)
    }

    return this
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT']

  function normalizeMethod(method) {
    var upcased = method.toUpperCase()
    return (methods.indexOf(upcased) > -1) ? upcased : method
  }

  function Request(input, options) {
    options = options || {}
    var body = options.body
    if (Request.prototype.isPrototypeOf(input)) {
      if (input.bodyUsed) {
        throw new TypeError('Already read')
      }
      this.url = input.url
      this.credentials = input.credentials
      if (!options.headers) {
        this.headers = new Headers(input.headers)
      }
      this.method = input.method
      this.mode = input.mode
      if (!body) {
        body = input._bodyInit
        input.bodyUsed = true
      }
    } else {
      this.url = input
    }

    this.credentials = options.credentials || this.credentials || 'omit'
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers)
    }
    this.method = normalizeMethod(options.method || this.method || 'GET')
    this.mode = options.mode || this.mode || null
    this.referrer = null

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests')
    }
    this._initBody(body)
  }

  Request.prototype.clone = function() {
    return new Request(this)
  }

  function decode(body) {
    var form = new FormData()
    body.trim().split('&').forEach(function(bytes) {
      if (bytes) {
        var split = bytes.split('=')
        var name = split.shift().replace(/\+/g, ' ')
        var value = split.join('=').replace(/\+/g, ' ')
        form.append(decodeURIComponent(name), decodeURIComponent(value))
      }
    })
    return form
  }

  function headers(xhr) {
    var head = new Headers()
    var pairs = xhr.getAllResponseHeaders().trim().split('\n')
    pairs.forEach(function(header) {
      var split = header.trim().split(':')
      var key = split.shift().trim()
      var value = split.join(':').trim()
      head.append(key, value)
    })
    return head
  }

  Body.call(Request.prototype)

  function Response(bodyInit, options) {
    if (!options) {
      options = {}
    }

    this._initBody(bodyInit)
    this.type = 'default'
    this.status = options.status
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = options.statusText
    this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers)
    this.url = options.url || ''
  }

  Body.call(Response.prototype)

  Response.prototype.clone = function() {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    })
  }

  Response.error = function() {
    var response = new Response(null, {status: 0, statusText: ''})
    response.type = 'error'
    return response
  }

  var redirectStatuses = [301, 302, 303, 307, 308]

  Response.redirect = function(url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code')
    }

    return new Response(null, {status: status, headers: {location: url}})
  }

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function(input, init) {
    return new Promise(function(resolve, reject) {
      var request
      if (Request.prototype.isPrototypeOf(input) && !init) {
        request = input
      } else {
        request = new Request(input, init)
      }

      var xhr = new XMLHttpRequest()

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (/^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL')
        }

        return;
      }

      xhr.onload = function() {
        var status = (xhr.status === 1223) ? 204 : xhr.status
        if (status < 100 || status > 599) {
          reject(new TypeError('Network request failed'))
          return
        }
        var options = {
          status: status,
          statusText: xhr.statusText,
          headers: headers(xhr),
          url: responseURL()
        }
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options))
      }

      xhr.onerror = function() {
        reject(new TypeError('Network request failed'))
      }

      xhr.open(request.method, request.url, true)

      if (request.credentials === 'include') {
        xhr.withCredentials = true
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob'
      }

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value)
      })

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit)
    })
  }
  self.fetch.polyfill = true
})();

},{}],13:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Preferences = require('./preferences');

var Jot = require('../models/Jot');

var GroupPreferences = (function (_Preferences) {
  _inherits(GroupPreferences, _Preferences);

  function GroupPreferences() {
    _classCallCheck(this, GroupPreferences);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(GroupPreferences).call(this));

    _this._order = _this.getOrder();
    return _this;
  }

  _createClass(GroupPreferences, [{
    key: 'getOrder',
    value: function getOrder() {
      var order = this.getItem('order');

      if (!order || !order.type || !order.direction) {
        order = {
          type: 'date',
          direction: 'desc'
        };
      }

      this._order = order;

      return order;
    }
  }, {
    key: 'setOrder',
    value: function setOrder(type, direction) {
      this._order.type = type;
      this._order.direction = direction;

      this.setItem('order', this._order);
    }
  }, {
    key: 'order',
    value: function order(jots) {
      return Jot.order(jots, this._order.type, this._order.direction);
    }
  }]);

  return GroupPreferences;
})(Preferences);

module.exports = GroupPreferences;

},{"../models/Jot":2,"./preferences":16}],14:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Preferences = require('./preferences');

var Group = require('../models/group');

var GroupsPreferences = (function (_Preferences) {
  _inherits(GroupsPreferences, _Preferences);

  function GroupsPreferences() {
    _classCallCheck(this, GroupsPreferences);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(GroupsPreferences).call(this));

    _this._order = _this.getOrder();
    return _this;
  }

  _createClass(GroupsPreferences, [{
    key: 'getOrder',
    value: function getOrder() {
      var order = this.getItem('order');

      if (!order || !order.type || !order.direction) {
        order = {
          type: 'date',
          direction: 'desc'
        };
      }

      this._order = order;

      return order;
    }
  }, {
    key: 'setOrder',
    value: function setOrder(type, direction) {
      this._order.type = type;
      this._order.direction = direction;

      this.setItem('order', this._order);
    }
  }, {
    key: 'order',
    value: function order(groups) {
      return Group.order(groups, this._order.type, this._order.direction);
    }
  }]);

  return GroupsPreferences;
})(Preferences);

module.exports = GroupsPreferences;

},{"../models/group":3,"./preferences":16}],15:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Preferences = require('./preferences');

var Jot = require('../models/Jot');

var JotsPreferences = (function (_Preferences) {
  _inherits(JotsPreferences, _Preferences);

  function JotsPreferences() {
    _classCallCheck(this, JotsPreferences);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(JotsPreferences).call(this));

    _this._order = _this.getOrder();
    return _this;
  }

  _createClass(JotsPreferences, [{
    key: 'getOrder',
    value: function getOrder() {
      var order = this.getItem('order');

      if (!order || !order.type || !order.direction) {
        order = {
          type: 'date',
          direction: 'desc'
        };
      }

      this._order = order;

      return order;
    }
  }, {
    key: 'setOrder',
    value: function setOrder(type, direction) {
      this._order.type = type;
      this._order.direction = direction;

      this.setItem('order', this._order);
    }
  }, {
    key: 'order',
    value: function order(jots) {
      return Jot.order(jots, this._order.type, this._order.direction);
    }
  }]);

  return JotsPreferences;
})(Preferences);

module.exports = JotsPreferences;

},{"../models/Jot":2,"./preferences":16}],16:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Preferences = (function () {
  function Preferences() {
    _classCallCheck(this, Preferences);

    if (localStorage) {
      this._storage = localStorage;
    } else {
      this._storage = {
        fields: {},

        getItem: function getItem(name) {
          return this.fields[name];
        },

        setItem: function setItem(name, item) {
          this.fields[name] = item;
        }
      };
    }

    this._key = this.constructor.name.toLowerCase();
  }

  _createClass(Preferences, [{
    key: "getItem",
    value: function getItem(name) {
      var prefs = this._storage.getItem(this._key);

      if (prefs) {
        prefs = JSON.parse(prefs);
      } else {
        prefs = {};
      }

      return prefs.name;
    }
  }, {
    key: "setItem",
    value: function setItem(name, item) {
      var prefs = this._storage.getItem(this._key);

      if (prefs) {
        prefs = JSON.parse(prefs);
      } else {
        prefs = {};
      }

      prefs.name = item;

      this._storage.setItem(this._key, JSON.stringify(prefs));
    }
  }]);

  return Preferences;
})();

module.exports = Preferences;

},{}],17:[function(require,module,exports){
'use strict';

if (window.operamini) {
  document.body.classList.add('operamini');
}

// cutting the ol' mustard like a pro
if ('visibilityState' in document) {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/serviceworker.js', {
      scope: '/'
    }).then(function (reg) {
      console.log('SW register success', reg);
    }, function (err) {
      console.log('SW register fail', err);
    });
  }

  if (!window.fetch) {
    require('whatwg-fetch');
  }

  fetch('/auth/user', {
    credentials: 'same-origin'
  }).then(function (response) {
    return response.json();
  }).then(function (json) {
    JotApp.user = json;

    if (JotApp.user !== false) {
      if (JotApp.user.credentials) {
        require('../../db/db')({
          protocol: JotApp.server.protocol,
          domain: JotApp.server.domain,
          username: JotApp.user.credentials.key,
          password: JotApp.user.credentials.password,
          dbName: 'jot-' + JotApp.user._id
        });
        localStorage.setItem('jot-user', JSON.stringify(JotApp.user));
      } else {
        var localUser = localStorage.getItem('jot-user');

        if (localUser) {
          JotApp.user = JSON.parse(localUser);
          if (JotApp.user) {
            require('../../db/db')({
              protocol: JotApp.server.protocol,
              domain: JotApp.server.domain,
              username: JotApp.user.credentials.key,
              password: JotApp.user.credentials.password,
              dbName: 'jot-' + JotApp.user._id
            });
          } else {
            require('../../db/db')({
              dbName: 'jot-local'
            });
          }
        } else {
          require('../../db/db')({
            dbName: 'jot-local'
          });
        }
      }
    } else {
      localStorage.setItem('jot-user', JSON.stringify(false));
      require('../../db/db')({
        dbName: 'jot-local'
      });
    }

    var attachFastClick = require('fastclick');

    var ViewContainer = require('../../views/view-container');

    var router = require('../../routers/path');

    var RoutesHome = require('../../routes/client/home');
    var RoutesAuth = require('../../routes/client/auth');
    var RoutesJot = require('../../routes/client/jot');
    var RoutesGroup = require('../../routes/client/group');

    var TitleBarView = require('../../views/titlebar');
    var NotificationManagerView = require('../../views/notification-manager');

    var Handlebars = require('handlebars/dist/handlebars.runtime');
    var helpers = require('../../templates/helpers');

    attachFastClick(document.body);

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = Object.keys(JotApp.templates)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var key = _step.value;

        Handlebars.registerPartial(key, Handlebars.template(JotApp.templates[key]));
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    for (var helper in helpers) {
      if (helpers.hasOwnProperty(helper)) {
        Handlebars.registerHelper(helper, helpers[helper]);
      }
    }

    var containerMain = new ViewContainer('view', {
      home: JotApp.templates.home,
      group: JotApp.templates.group,
      groups: JotApp.templates.groups,
      jots: JotApp.templates.jots,
      loading: JotApp.templates.loading,
      loadinggroups: JotApp.templates.loadinggroups,
      import: JotApp.templates.import
    }, {
      'group-list': JotApp.templates['group-list'],
      'jot-list': JotApp.templates['jot-list']
    });

    var routesHome = new RoutesHome(router, '/', containerMain);
    var routesAuth = new RoutesAuth(router, '/auth', containerMain);
    var routesJot = new RoutesJot(router, '/jot', containerMain);
    var routesGroup = new RoutesGroup(router, '/group', containerMain);

    routesHome.registerRoutes();
    routesAuth.registerRoutes();
    routesJot.registerRoutes();
    routesGroup.registerRoutes();

    var containerHeader = new ViewContainer('header', {
      titlebar: JotApp.templates.titlebar
    }, {
      'titlebar-title': JotApp.templates['titlebar-title'],
      'titlebar-tabs': JotApp.templates['titlebar-tabs'],
      'list-order': JotApp.templates['list-order']
    });

    var titleBar = new TitleBarView(containerHeader);

    titleBar.render(false, {
      user: JotApp.user
    });

    var containerNotifications = new ViewContainer('notifications', {
      notifications: JotApp.templates.notifications
    }, {
      notification: JotApp.templates.notification
    });

    var notificationManager = new NotificationManagerView(containerNotifications);

    notificationManager.render(true);

    router.activate();
  }).catch(function (ex) {
    console.log('something went wrong with auth/user', ex);
  });
}

},{"../../db/db":1,"../../routers/path":18,"../../routes/client/auth":20,"../../routes/client/group":21,"../../routes/client/home":22,"../../routes/client/jot":23,"../../templates/helpers":28,"../../views/notification-manager":41,"../../views/titlebar":42,"../../views/view-container":43,"fastclick":7,"handlebars/dist/handlebars.runtime":8,"whatwg-fetch":12}],18:[function(require,module,exports){
'use strict';

var page = require('page');

module.exports = (function () {

  return {
    activate: function activate() {
      page();
    },

    get: function get(path, callback) {
      page(path, callback);
    },

    go: function go(path) {
      page(path);
    },

    back: function back() {
      if (window.history.length) {
        window.history.back();
      } else {
        page('/');
      }
    },

    stop: function stop(path) {
      page.stop();
      if (path) {
        window.location = path;
      }
    }
  };
})();

},{"page":10}],19:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Routes = require('./routes');

var Group = require('../models/group');

var AuthRoutes = (function (_Routes) {
  _inherits(AuthRoutes, _Routes);

  function AuthRoutes(router) {
    var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    _classCallCheck(this, AuthRoutes);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AuthRoutes).call(this, router, prefix));

    _this._routes.authGoogle = {
      _path: '/google',
      _method: ['get'],
      _action: function _action() {
        return Promise.resolve();
      }
    };

    _this._routes.callbackGoogle = {
      _path: '/google/callback',
      _method: ['get'],
      _action: function _action() {
        return Promise.resolve();
      }
    };

    _this._routes.import = {
      _path: '/import',
      _method: ['get'],
      _action: function _action() {
        return Promise.resolve().then(function () {
          return Group.importFromLocal();
        });
      }
    };

    _this._routes.user = {
      _path: '/user',
      _method: ['get'],
      _action: function _action() {
        return Promise.resolve();
      }
    };

    _this._routes.signout = {
      _path: '/signout',
      _method: ['get'],
      _action: function _action() {
        return Promise.resolve();
      }
    };
    return _this;
  }

  return AuthRoutes;
})(Routes);

module.exports = AuthRoutes;

},{"../models/group":3,"./routes":27}],20:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AuthRoutes = require('../auth');
var ImportView = require('../../views/import');

var PubSub = require('../../utility/pubsub');

var AuthRouter = (function () {
  function AuthRouter(router, prefix, viewContainer) {
    _classCallCheck(this, AuthRouter);

    this._db = require('../../db/db')();

    this._router = router;
    this.routes = new AuthRoutes(router, prefix);

    this.importView = new ImportView(viewContainer);
  }

  _createClass(AuthRouter, [{
    key: 'registerRoutes',
    value: function registerRoutes() {
      var _this = this;

      this.routes.registerRoute('signout', function (ctx, next) {
        return Promise.resolve().then(function () {
          return {
            params: {},

            resolve: function resolve() {
              localStorage.setItem('jot-user', false);
              _this._db.destroy().then(function () {
                _this._router.stop(ctx.canonicalPath);
              });
            },

            reject: function reject(err) {
              throw new Error(err);
            }
          };
        });
      });

      this.routes.registerRoute('import', function (ctx, next) {
        return Promise.resolve().then(function () {
          return {
            params: {},

            preAction: function preAction() {
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

            resolve: function resolve(groups) {
              _this.importView.render(false, {
                groups: groups
              });
            },

            reject: function reject(err) {
              throw new Error(err);
            }
          };
        });
      });
    }
  }]);

  return AuthRouter;
})();

module.exports = AuthRouter;

},{"../../db/db":1,"../../utility/pubsub":30,"../../views/import":36,"../auth":19}],21:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Jot = require('../../models/jot');
var Group = require('../../models/group');
var GroupRoutes = require('../group');
var GroupsView = require('../../views/groups');
var GroupView = require('../../views/group');
var LoadingGroupsView = require('../../views/loadinggroups');

var GroupsPreferences = require('../../preferences/groups');
var GroupPreference = require('../../preferences/group');

var PubSub = require('../../utility/pubsub');

var GroupClientRoutes = (function () {
  function GroupClientRoutes(router, prefix, viewContainer) {
    _classCallCheck(this, GroupClientRoutes);

    this.routes = new GroupRoutes(router, prefix);

    this.groupsView = new GroupsView(viewContainer);
    this.groupView = new GroupView(viewContainer);
    this.loadingGroupsView = new LoadingGroupsView(viewContainer);

    this._groupsPreferences = new GroupsPreferences();
    this._groupPreferences = new GroupPreference();
  }

  _createClass(GroupClientRoutes, [{
    key: 'registerRoutes',
    value: function registerRoutes() {
      var _this = this;

      this.routes.registerRoute('all', function (ctx, next) {
        return Promise.resolve().then(function () {

          var page = {
            name: 'Jot'
          };

          var ordering = {
            orders: [{
              name: 'Alpha',
              type: 'alpha',
              direction: 'asc'
            }, {
              name: 'Date',
              type: 'date',
              direction: 'desc'
            }]
          };

          var tabs = [{
            title: 'Home',
            link: '/'
          }, {
            title: 'Jots',
            link: '/jot'
          }, {
            title: 'Lists',
            link: '/group',
            current: true
          }];

          return {
            params: {
              orderType: _this._groupsPreferences.getOrder().type,
              orderDirection: _this._groupsPreferences.getOrder().direction
            },

            preAction: function preAction() {
              PubSub.publish('routeChanged', {
                name: page.name,
                ordering: ordering,
                currentOrdering: _this._groupsPreferences.getOrder().type,
                tabs: tabs
              });

              _this.loadingGroupsView.render(false, {
                items: [0, 0, 0, 0, 0, 0, 0]
              });
            },

            resolve: function resolve(groups) {
              _this.groupsView.render(false, {
                colours: Group.getColours(),
                groups: groups
              });
            },

            reject: function reject(err) {
              throw new Error(err);
            }
          };
        });
      });

      this.routes.registerRoute('view', function (ctx, next) {
        return Promise.resolve().then(function () {
          var ordering = {
            orders: [{
              name: 'Alpha',
              type: 'alpha',
              direction: 'asc'
            }, {
              name: 'Date',
              type: 'date',
              direction: 'desc'
            }, {
              name: 'Priority',
              type: 'priority',
              direction: 'desc'
            }]
          };

          return {
            params: {
              id: ctx.params.id,
              done: ctx.params.status === 'done',
              orderType: _this._groupPreferences.getOrder().type,
              orderDirection: _this._groupPreferences.getOrder().direction,

              postLoadGroup: function postLoadGroup(group) {

                PubSub.publish('routeChanged', {
                  name: group.fields.name,
                  ordering: ordering,
                  currentOrdering: _this._groupPreferences.getOrder().type,
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
              }
            },

            resolve: function resolve(group) {
              var queryObject = {};
              ctx.querystring.split('&').forEach(function (bit) {
                var vals = bit.split('=');
                queryObject[vals[0]] = vals[1];
              });

              _this.groupView.setShowDone(ctx.params.status === 'done');
              _this.groupView.render(false, {
                done: ctx.params.status === 'done',
                group: group,
                editID: queryObject.edit,
                priorities: Jot.getPriorities()
              });
            },

            reject: function reject(err) {
              throw new Error(err);
            }
          };
        });
      });
    }
  }]);

  return GroupClientRoutes;
})();

module.exports = GroupClientRoutes;

},{"../../models/group":3,"../../models/jot":4,"../../preferences/group":13,"../../preferences/groups":14,"../../utility/pubsub":30,"../../views/group":33,"../../views/groups":34,"../../views/loadinggroups":40,"../group":24}],22:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var HomeRoutes = require('../home');
var HomeView = require('../../views/home');
var PubSub = require('../../utility/pubsub');

var HomeRouter = (function () {
  function HomeRouter(router, prefix, viewContainer) {
    _classCallCheck(this, HomeRouter);

    this.routes = new HomeRoutes(router, prefix);

    this.homeView = new HomeView(viewContainer);
  }

  _createClass(HomeRouter, [{
    key: 'registerRoutes',
    value: function registerRoutes() {
      var _this = this;

      this.routes.registerRoute('home', function (ctx, next) {
        return Promise.resolve().then(function () {
          return {
            params: {},

            preAction: function preAction() {
              PubSub.publish('routeChanged', {
                name: 'Jot',
                order: [],
                tabs: [{
                  title: 'Home',
                  link: '/',
                  current: true
                }, {
                  title: 'Jots',
                  link: '/jot'
                }, {
                  title: 'Lists',
                  link: '/group'
                }]
              });

              _this.homeView.render(false, {
                loading: true
              });
            },

            resolve: function resolve(stats) {
              _this.homeView.render(false, {
                stats: stats
              });
            },

            reject: function reject(err) {
              throw new Error(err);
            }
          };
        });
      });
    }
  }]);

  return HomeRouter;
})();

module.exports = HomeRouter;

},{"../../utility/pubsub":30,"../../views/home":35,"../home":25}],23:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var JotRoutes = require('../jot');
var JotsView = require('../../views/jots');
var LoadingView = require('../../views/loading');
var PubSub = require('../../utility/pubsub');

var JotsPreferences = require('../../preferences/jots');

var JotClientRoutes = (function () {
  function JotClientRoutes(router, prefix, viewContainer) {
    _classCallCheck(this, JotClientRoutes);

    this.routes = new JotRoutes(router, prefix);

    this.jotsView = new JotsView(viewContainer);
    this.loadingView = new LoadingView(viewContainer);

    this._jotsPreferences = new JotsPreferences();
  }

  _createClass(JotClientRoutes, [{
    key: 'registerRoutes',
    value: function registerRoutes() {
      var _this = this;

      this.routes.registerRoute('all', function (ctx, next) {
        return Promise.resolve().then(function () {
          var page = {
            name: 'Jot'
          };

          var ordering = {
            orders: [{
              name: 'Alpha',
              type: 'alpha',
              direction: 'asc'
            }, {
              name: 'Date',
              type: 'date',
              direction: 'desc'
            }, {
              name: 'Priority',
              type: 'priority',
              direction: 'desc'
            }]
          };

          var tabs = [{
            title: 'Home',
            link: '/'
          }, {
            title: 'Jots',
            link: '/jot',
            current: true
          }, {
            title: 'Lists',
            link: '/group'
          }];

          return {
            params: {
              orderType: _this._jotsPreferences.getOrder().type,
              orderDirection: _this._jotsPreferences.getOrder().direction
            },

            preAction: function preAction() {
              PubSub.publish('routeChanged', {
                name: page.name,
                ordering: ordering,
                currentOrdering: _this._jotsPreferences.getOrder().type,
                tabs: tabs
              });

              _this.loadingView.render(false, {
                items: [0, 0, 0, 0, 0, 0, 0]
              });
            },

            resolve: function resolve(jots) {
              _this.jotsView.render(false, {
                jots: jots
              });
            },

            reject: function reject(err) {
              throw new Error(err);
            }
          };
        });
      });
    }
  }]);

  return JotClientRoutes;
})();

module.exports = JotClientRoutes;

},{"../../preferences/jots":15,"../../utility/pubsub":30,"../../views/jots":37,"../../views/loading":39,"../jot":26}],24:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Routes = require('./routes');

var Group = require('../models/group');

var GroupRoutes = (function (_Routes) {
  _inherits(GroupRoutes, _Routes);

  function GroupRoutes(router) {
    var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    _classCallCheck(this, GroupRoutes);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(GroupRoutes).call(this, router, prefix));

    _this._routes.all = {
      _path: '/',
      _method: ['get'],
      _action: function _action(params) {
        return Group.loadAll(true, params.orderType, params.orderDirection);
      }
    };

    _this._routes.view = {
      _path: '/:id/:status?',
      _method: ['get'],
      _action: function _action(params) {
        return Group.load(params.id, true, params.orderType, params.orderDirection).then(function (group) {
          if (params.postLoadGroup) {
            params.postLoadGroup(group);
          }

          group._jots = group.getJots(params.done);
          return group;
        });
      }
    };

    _this._routes.add = {
      _path: '/',
      _method: ['post'],
      _action: function _action(params) {
        return new Group({
          fields: {
            name: params.name,
            colour: params.colour
          }
        }).save();
      }
    };

    _this._routes.delete = {
      _path: '/:id',
      _method: ['post'],
      _action: function _action(params) {
        if (params.action !== 'delete') {
          return Promise.reject(); //will cascade down to update etc.
        } else {
            return Group.remove(params.id).then(function (result) {
              return true;
            });
          }
      }
    };

    _this._routes.update = {
      _path: '/:id',
      _method: ['post'],
      _action: function _action(params) {
        if (params.action !== 'update') {
          return Promise.reject();
        } else {
          return Group.load(params.id).then(function (group) {
            group.fields = params.fields;

            return group.save();
          });
        }
      }
    };
    return _this;
  }

  return GroupRoutes;
})(Routes);

module.exports = GroupRoutes;

},{"../models/group":3,"./routes":27}],25:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Routes = require('./routes');

var Jot = require('../models/jot');

var HomeRoutes = (function (_Routes) {
  _inherits(HomeRoutes, _Routes);

  function HomeRoutes(router) {
    var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    _classCallCheck(this, HomeRoutes);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(HomeRoutes).call(this, router, prefix));

    _this._routes.home = {
      _path: '/',
      _method: ['get'],
      _action: function _action() {
        return Jot.getPercentageDone().then(function (stats) {
          var segments = {
            one: 90,
            two: 90,
            three: 90,
            four: 90
          };

          if (stats.percent <= 25) {
            segments.one = 90 - stats.percent / 25 * 90;
          } else {
            segments.one = 0;

            if (stats.percent <= 50) {
              segments.two = 90 - (stats.percent - 25) / 25 * 90;
            } else {
              segments.two = 0;

              if (stats.percent <= 75) {
                segments.three = 90 - (stats.percent - 50) / 25 * 90;
              } else {
                segments.three = 0;

                segments.four = 90 - (stats.percent - 75) / 25 * 90;
              }
            }
          }

          stats.segments = segments;

          if (stats.numGroups > 0) {
            var plural = stats.numGroups === 1 ? '' : 's';
            stats.message = stats.percent + '% done in ' + stats.numGroups + ' list' + plural;
          } else {
            stats.message = 'No lists. Add one now';
          }

          return stats;
        });
      }
    };
    return _this;
  }

  return HomeRoutes;
})(Routes);

module.exports = HomeRoutes;

},{"../models/jot":4,"./routes":27}],26:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Routes = require('./routes');

var Jot = require('../models/jot');

var JotRoutes = (function (_Routes) {
  _inherits(JotRoutes, _Routes);

  function JotRoutes(router) {
    var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    _classCallCheck(this, JotRoutes);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(JotRoutes).call(this, router, prefix));

    _this._routes.all = {
      _path: '/',
      _method: ['get'],
      _action: function _action(params) {
        return Jot.loadAll(true, params.orderType, params.orderDirection);
      }
    };

    _this._routes.add = {
      _path: '/',
      _method: ['post'],
      _action: function _action(params) {
        return new Jot({
          fields: {
            content: params.content,
            group: params.group,
            priority: params.priority
          }
        }).save();
      }
    };

    _this._routes.delete = {
      _path: '/:id',
      _method: ['post'],
      _action: function _action(params) {
        if (params.action !== 'delete') {
          return Promise.reject(); //will cascade down to update etc.
        } else {
            return Jot.remove(params.id).then(function (result) {
              return true;
            });
          }
      }
    };

    _this._routes.update = {
      _path: '/:id',
      _method: ['post'],
      _action: function _action(params) {
        if (params.action !== 'update') {
          return Promise.reject();
        } else {
          return Jot.load(params.id).then(function (jot) {
            var currentFields = jot.fields;

            jot.fields = params.fields;

            if (typeof params.fields.done === 'undefined') {
              jot.fields.done = currentFields.done;
            }

            return jot.save();
          });
        }
      }
    };
    return _this;
  }

  return JotRoutes;
})(Routes);

module.exports = JotRoutes;

},{"../models/jot":4,"./routes":27}],27:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Routes = (function () {
  function Routes(router) {
    var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

    _classCallCheck(this, Routes);

    this._router = router;
    this._prefix = prefix;

    this._routes = {};
  }

  _createClass(Routes, [{
    key: 'registerRoute',
    value: function registerRoute(name, config) {
      var _this = this;

      var route = this._routes[name];
      route._method.forEach(function (method) {
        _this._router[method](_this._prefix + route._path, function () {
          config.apply(undefined, arguments).then(function (result) {
            return Promise.resolve().then(function () {
              if (result.preAction) {
                result.preAction();
              }

              return route._action(result.params).then(result.resolve);
            }).catch(result.reject);
          });
        });
      });
    }
  }]);

  return Routes;
})();

module.exports = Routes;

},{}],28:[function(require,module,exports){
'use strict';

var Autolinker = require('autolinker');

var Handlebars = require('handlebars/dist/handlebars.runtime');

function ifEqual(conditional, equalTo, options) {
  if (conditional === equalTo) {
    return options.fn(this);
  }

  return options.inverse(this);
}

function ifNotEqual(conditional, equalTo, options) {
  if (conditional !== equalTo) {
    return options.fn(this);
  }

  return options.inverse(this);
}

function ifIn(elem, arr, options) {
  if (arr.indexOf(elem) > -1) {
    return options.fn(this);
  }

  return options.inverse(this);
}

function autoLink(elem, options) {
  var url = Autolinker.link(Handlebars.escapeExpression(elem));

  return new Handlebars.SafeString(url);
}

exports.ifEqual = ifEqual;
exports.ifNotEqual = ifNotEqual;
exports.ifIn = ifIn;
exports.autoLink = autoLink;

},{"autolinker":6,"handlebars/dist/handlebars.runtime":8}],29:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DateUtils = (function () {
  function DateUtils() {
    _classCallCheck(this, DateUtils);
  }

  _createClass(DateUtils, null, [{
    key: 'getDays',
    value: function getDays() {
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }
  }, {
    key: 'getMonths',
    value: function getMonths() {
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  }, {
    key: 'format',
    value: function format(date) {
      var day = date.getDay();
      var dayNum = date.getDate();
      var monthNum = date.getMonth();
      var minutes = this._pad(date.getMinutes(), 2);
      var hours = this._pad(date.getHours(), 2);

      return this.getDays()[day] + ' ' + dayNum + ' ' + this.getMonths()[monthNum] + ' ' + hours + ':' + minutes;
    }
  }, {
    key: '_pad',
    value: function _pad(num, size) {
      var s = '000000000' + num;
      return s.substr(s.length - size);
    }
  }]);

  return DateUtils;
})();

module.exports = DateUtils;

},{}],30:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var PubSub = (function () {
  //based on pubsub implementation at http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript

  function PubSub() {
    _classCallCheck(this, PubSub);

    // Storage for topics that can be broadcast
    // or listened to
    this._topics = {};

    // An topic identifier
    this._subUid = -1;
  }

  // Publish or broadcast events of interest
  // with a specific topic name and arguments
  // such as the data to pass along

  _createClass(PubSub, [{
    key: "publish",
    value: function publish(topic, args) {
      if (!this._topics[topic]) {
        return false;
      }

      var subscribers = this._topics[topic];
      var len = subscribers ? subscribers.length : 0;

      while (len--) {
        subscribers[len].func(topic, args);
      }

      return this;
    }

    // Subscribe to events of interest
    // with a specific topic name and a
    // callback function, to be executed
    // when the topic/event is observed

  }, {
    key: "subscribe",
    value: function subscribe(topic, func) {
      if (!this._topics[topic]) {
        this._topics[topic] = [];
      }

      var token = (++this._subUid).toString();
      this._topics[topic].push({
        token: token,
        func: func
      });

      return token;
    }

    // Unsubscribe from a specific
    // topic, based on a tokenized reference
    // to the subscription

  }, {
    key: "unsubscribe",
    value: function unsubscribe(token) {
      for (var m in this._topics) {
        if (this._topics[m]) {
          for (var i = 0, j = this._topics[m].length; i < j; i++) {
            if (this._topics[m][i].token === token) {
              this._topics[m].splice(i, 1);
              return token;
            }
          }
        }
      }

      return this;
    }
  }]);

  return PubSub;
})();

module.exports = new PubSub();

},{}],31:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Touch = (function () {
  function Touch(element) {
    _classCallCheck(this, Touch);

    this._element = element || null;

    this._xDown = null;
    this._yDown = null;

    this._registered = {
      left: [],
      right: [],
      up: [],
      down: []
    };

    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
  }

  _createClass(Touch, [{
    key: 'setElement',
    value: function setElement(element) {
      this.destroy();

      this._element = element;

      this._element.addEventListener('touchstart', this.handleTouchStart, false);
      this._element.addEventListener('touchmove', this.handleTouchMove, false);
    }
  }, {
    key: 'register',
    value: function register(direction, fn) {
      this._registered[direction].push(fn);
    }
  }, {
    key: 'handleTouchStart',
    value: function handleTouchStart(evt) {
      this._xDown = evt.touches[0].clientX;
      this._yDown = evt.touches[0].clientY;
    }
  }, {
    key: 'handleTouchMove',
    value: function handleTouchMove(evt) {
      if (!this._xDown || !this._yDown) {
        return;
      }

      var xUp = evt.touches[0].clientX;
      var yUp = evt.touches[0].clientY;

      var xDiff = this._xDown - xUp;
      var yDiff = this._yDown - yUp;

      if (Math.abs(xDiff) > Math.abs(yDiff)) {
        if (xDiff > 0) {
          this._registered.left.forEach(function (fn) {
            return fn();
          });
        } else {
          this._registered.right.forEach(function (fn) {
            return fn();
          });
        }
      } else {
        if (yDiff > 0) {
          this._registered.up.forEach(function (fn) {
            return fn();
          });
        } else {
          this._registered.down.forEach(function (fn) {
            return fn();
          });
        }
      }

      this._xDown = null;
      this._yDown = null;
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      if (this._element) {
        this._element.removeEventListener('touchstart', this.handleTouchStart, false);
        this._element.removeEventListener('touchmove', this.handleTouchMove, false);
      }

      this._element = null;
    }
  }]);

  return Touch;
})();

module.exports = Touch;

},{}],32:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Widget = require('./widget');

var ColourSelector = (function (_Widget) {
  _inherits(ColourSelector, _Widget);

  function ColourSelector() {
    _classCallCheck(this, ColourSelector);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ColourSelector).apply(this, arguments));
  }

  _createClass(ColourSelector, [{
    key: 'initEvents',
    value: function initEvents(el) {
      var _this2 = this;

      _get(Object.getPrototypeOf(ColourSelector.prototype), 'initEvents', this).call(this);

      var widgets = el.querySelectorAll('.partial-colour-selector');
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var widget = _step.value;

          var options = widget.querySelectorAll('.colour-selector__colour');
          var select = widget.querySelector('select');

          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            var _loop2 = function _loop2() {
              var option = _step2.value;

              option.addEventListener('click', function () {
                _this2.unselectAll(options);
                option.classList.add('colour-selector__colour--current');
                select.value = option.dataset.value;
              });
            };

            for (var _iterator2 = options[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              _loop2();
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2.return) {
                _iterator2.return();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }
        };

        for (var _iterator = widgets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'unselectAll',
    value: function unselectAll(options) {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = options[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var _option = _step3.value;

          _option.classList.remove('colour-selector__colour--current');
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }]);

  return ColourSelector;
})(Widget);

module.exports = ColourSelector;

},{"./widget":45}],33:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var Jot = require('../models/jot');
var Group = require('../models/group');

var GroupPreferences = require('../preferences/group');

var ColourSelectorWidget = require('./colour-selector');

var PubSub = require('../utility/pubsub');

var ViewGroup = (function (_View) {
  _inherits(ViewGroup, _View);

  function ViewGroup(container) {
    _classCallCheck(this, ViewGroup);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ViewGroup).call(this, container));

    _this.registerWidget(ColourSelectorWidget);

    _this._showDone = false;

    _this._preferences = new GroupPreferences();
    return _this;
  }

  _createClass(ViewGroup, [{
    key: 'setShowDone',
    value: function setShowDone(done) {
      this._showDone = done;
    }
  }, {
    key: 'render',
    value: function render(preRendered, params) {
      var _this2 = this;

      _get(Object.getPrototypeOf(ViewGroup.prototype), 'render', this).call(this, preRendered, params);

      this._subscriptions.push(PubSub.subscribe('update', function (topic, args) {
        if (args.changes && args.changes.length) {
          Group.load(params.group.id).then(function (group) {
            _this2.renderPartial('jot-list', {
              group: group
            });
          });
        }
      }));

      this._subscriptions.push(PubSub.subscribe('orderChanged', function (topic, args) {
        _this2._preferences.setOrder(args.type, args.direction);

        var params = _this2.lastParams;
        _this2.renderPartial('jot-list', params);
      }));

      this._addDocumentListener('unselectAll', 'click', function () {
        _this2.unselectAll();
      });
    }
  }, {
    key: 'renderPartial',
    value: function renderPartial(name, params) {
      switch (name) {
        case 'jot-list':
          params.jots = params.group.getJots(this._showDone);
          params.jots = this._preferences.order(params.jots);
          break;
      }

      var el = _get(Object.getPrototypeOf(ViewGroup.prototype), 'renderPartial', this).call(this, name, params);

      switch (name) {
        case 'jot-list':
          this.initEdit();
          this.initDeleteForms();
          this.initUpdateForms();
          this.initWidgets(el);
          break;
      }
    }
  }, {
    key: 'initEvents',
    value: function initEvents() {
      _get(Object.getPrototypeOf(ViewGroup.prototype), 'initEvents', this).call(this);

      this.initAddForm();
      this.initEdit();
      this.initDeleteForms();
      this.initUpdateForms();
    }
  }, {
    key: 'initAddForm',
    value: function initAddForm() {
      var _this3 = this;

      var form = this._el.querySelector('.form-jot-add');
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var contentField = form.elements.content;
        var content = contentField.value;

        var groupField = form.elements.group;
        var group = groupField.value;

        var priority = form.elements.priority.value;

        new Jot({
          fields: {
            content: content,
            group: group,
            priority: priority
          }
        }).save().then(function () {
          contentField.value = '';
          //contentField.focus();
          contentField.blur();
          _this3.unselectAll();
          Group.load(group).then(function (group) {
            _this3.renderPartial('jot-list', {
              group: group
            });
          });
        });
      });

      var toShow = form.querySelector('.show-on-focus');

      form.addEventListener('click', function (event) {
        event.stopPropagation();
        _this3.unselectAll();
        toShow.classList.add('show');
      });
    }
  }, {
    key: 'initEdit',
    value: function initEdit() {
      var _this4 = this;

      var links = this._el.querySelectorAll('.jots__jot__edit');
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var link = _step.value;

          link.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation(); //stop document listener from removing 'edit' class

            var id = link.dataset.id;
            var item = _this4._el.querySelector('.jots__jot-' + id);

            if (!item.classList.contains('edit')) {
              _this4.unselectAll();

              item.classList.add('edit');

              //const contentField = this._el.querySelector('.form-jot-update-' + id).elements.content;
              //contentField.focus();
              //contentField.value = contentField.value; //forces cursor to go to end of text
            } else {
                _this4.unselectAll();
              }
          });
        };

        for (var _iterator = links[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'unselectAll',
    value: function unselectAll() {
      //TODO: have class member to hold reference to common element/element groups to avoid requerying
      var items = this._el.querySelectorAll('.jots__jot');
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = items[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var item = _step2.value;

          item.classList.remove('edit');
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var shows = this._el.querySelectorAll('.show-on-focus');
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = shows[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var show = _step3.value;

          show.classList.remove('show');
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: 'initDeleteForms',
    value: function initDeleteForms() {
      var _this5 = this;

      var forms = this._el.querySelectorAll('.form-jot-delete');
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        var _loop2 = function _loop2() {
          var form = _step4.value;

          form.addEventListener('submit', function (event) {
            event.preventDefault();

            var id = form.dataset.id;
            var group = form.dataset.groupId;

            var item = _this5._el.querySelector('.jots__jot-' + id);
            item.parentNode.removeChild(item);

            Jot.load(id).then(function (jot) {
              Jot.remove(id).then(function () {
                Group.load(group).then(function (group) {
                  _this5.renderPartial('jot-list', {
                    group: group
                  });
                });
              }).then(function () {
                PubSub.publish('notify', {
                  title: 'Jot deleted',
                  action: {
                    name: 'undo',
                    fn: function fn() {
                      return Promise.resolve().then(function () {
                        jot.rev = null;
                        jot.save().then(function () {
                          return Group.load(group).then(function (group) {
                            _this5.renderPartial('jot-list', {
                              group: group
                            });
                            return true;
                          });
                        });
                      });
                    },
                    msg: 'Jot undeleted'
                  }
                });
              });
            });
          });
        };

        for (var _iterator4 = forms[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          _loop2();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: 'initUpdateForms',
    value: function initUpdateForms() {
      var _this6 = this;

      var forms = this._el.querySelectorAll('.form-jot-update');

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        var _loop3 = function _loop3() {
          var form = _step5.value;

          var doneButton = form.elements.done;
          var undoneButton = form.elements.undone;

          if (doneButton) {
            doneButton.addEventListener('click', function () {
              form.elements['done-status'].value = 'done';
            });
          }

          if (undoneButton) {
            undoneButton.addEventListener('click', function () {
              form.elements['done-status'].value = 'undone';
            });
          }

          form.addEventListener('click', function (event) {
            event.stopPropagation(); //stop document listener from removing 'edit' class
          });

          form.addEventListener('submit', function (event) {
            event.preventDefault();

            var id = form.dataset.id;

            var content = form.elements.content.value;
            var group = form.elements.group.value;
            var doneStatus = form.elements['done-status'].value;
            var priority = form.elements.priority.value;

            Jot.load(id).then(function (jot) {

              var currentFields = jot.fields;

              jot.fields = {
                content: content,
                group: group,
                priority: priority
              };

              if (doneStatus === 'done') {
                jot.fields.done = true;
              } else if (doneStatus === 'undone') {
                jot.fields.done = false;
              } else {
                jot.fields.done = currentFields.done;
              }

              jot.save().then(function () {
                Group.load(group).then(function (group) {
                  _this6.renderPartial('jot-list', {
                    group: group
                  });
                });
              });
            });
          });
        };

        for (var _iterator5 = forms[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          _loop3();
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }]);

  return ViewGroup;
})(View);

module.exports = ViewGroup;

},{"../models/group":3,"../models/jot":4,"../preferences/group":13,"../utility/pubsub":30,"./colour-selector":32,"./view":44}],34:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var Group = require('../models/group');

var GroupsPreferences = require('../preferences/groups');

var ColourSelectorWidget = require('./colour-selector');

var PubSub = require('../utility/pubsub');

var ViewGroups = (function (_View) {
  _inherits(ViewGroups, _View);

  function ViewGroups(container) {
    _classCallCheck(this, ViewGroups);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ViewGroups).call(this, container));

    _this.registerWidget(ColourSelectorWidget);

    _this._preferences = new GroupsPreferences();
    return _this;
  }

  _createClass(ViewGroups, [{
    key: 'render',
    value: function render(preRendered, params) {
      var _this2 = this;

      _get(Object.getPrototypeOf(ViewGroups.prototype), 'render', this).call(this, preRendered, params);

      this._subscriptions.push(PubSub.subscribe('update', function (topic, args) {
        if (args.changes && args.changes.length) {
          Group.loadAll().then(function (groups) {
            _this2.renderPartial('group-list', {
              groups: groups
            });
          });
        }
      }));

      this._subscriptions.push(PubSub.subscribe('orderChanged', function (topic, args) {
        _this2._preferences.setOrder(args.type, args.direction);

        var params = _this2.lastParams;
        _this2.renderPartial('group-list', params);
      }));

      this._addDocumentListener('unselectAll', 'click', function () {
        _this2.unselectAll();
      });
    }
  }, {
    key: 'renderPartial',
    value: function renderPartial(name, params) {
      switch (name) {
        case 'group-list':
          params.groups = this._preferences.order(params.groups);
          break;
      }

      var el = _get(Object.getPrototypeOf(ViewGroups.prototype), 'renderPartial', this).call(this, name, params);

      switch (name) {
        case 'group-list':
          this.initEdit();
          this.initDeleteForms();
          this.initUpdateForms();
          this.initWidgets(el);
          break;
      }
    }
  }, {
    key: 'initEvents',
    value: function initEvents() {
      _get(Object.getPrototypeOf(ViewGroups.prototype), 'initEvents', this).call(this);

      this.initAddForm();
      this.initEdit();
      this.initDeleteForms();
      this.initUpdateForms();
    }
  }, {
    key: 'initAddForm',
    value: function initAddForm() {
      var _this3 = this;

      var form = this._el.querySelector('.form-group-add');
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var nameField = form.elements.name;
        var name = nameField.value;

        var colour = form.elements.colour.value;

        new Group({
          fields: {
            name: name,
            colour: colour
          }
        }).save().then(function () {
          nameField.value = '';
          //nameField.focus();
          nameField.blur();
          _this3.unselectAll();
          Group.loadAll().then(function (groups) {
            _this3.renderPartial('group-list', {
              groups: groups
            });
          });
        });
      });

      var toShow = form.querySelector('.show-on-focus');

      form.addEventListener('click', function (event) {
        event.stopPropagation();
        _this3.unselectAll();
        toShow.classList.add('show');
      });
    }
  }, {
    key: 'initEdit',
    value: function initEdit() {
      var _this4 = this;

      var editLinks = this._el.querySelectorAll('.groups__group__edit');
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function _loop() {
          var link = _step.value;

          link.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation(); //stop document listener from removing 'edit' class

            var id = link.dataset.id;
            var item = _this4._el.querySelector('.groups__group-' + id);

            if (!item.classList.contains('edit')) {
              _this4.unselectAll();

              item.classList.add('edit');

              //const nameField = this._el.querySelector('.form-group-update-' + id).elements.name;
              //nameField.focus();
              //nameField.value = nameField.value; //forces cursor to go to end of text
            } else {
                _this4.unselectAll();
              }
          });
        };

        for (var _iterator = editLinks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'unselectAll',
    value: function unselectAll() {
      //TODO: have class member to hold reference to common element/element groups to avoid requerying
      var items = this._el.querySelectorAll('.groups__group');
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = items[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var item = _step2.value;

          item.classList.remove('edit');
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2.return) {
            _iterator2.return();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      var shows = this._el.querySelectorAll('.show-on-focus');
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = shows[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var show = _step3.value;

          show.classList.remove('show');
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3.return) {
            _iterator3.return();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  }, {
    key: 'initDeleteForms',
    value: function initDeleteForms() {
      var _this5 = this;

      var forms = this._el.querySelectorAll('.form-group-delete');
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        var _loop2 = function _loop2() {
          var form = _step4.value;

          form.addEventListener('submit', function (event) {
            event.preventDefault();

            var id = form.dataset.id;

            var item = _this5._el.querySelector('.groups__group-' + id);
            item.parentNode.removeChild(item);

            Group.load(id).then(function (group) {
              Group.remove(id).then(function () {
                Group.loadAll().then(function (groups) {
                  _this5.renderPartial('group-list', {
                    groups: groups
                  });
                });
              }).then(function () {
                PubSub.publish('notify', {
                  title: 'List deleted',
                  action: {
                    name: 'undo',
                    fn: function fn() {
                      return Promise.resolve().then(function () {
                        group.rev = null;
                        group.save().then(function () {

                          var docs = group.jots.map(function (jot) {
                            return {
                              _rev: null,
                              _id: jot.id,
                              dateAdded: jot._dateAdded,
                              fields: jot.fields
                            };
                            jot.rev = null;
                            return jot;
                          });

                          var db = require('../db/db')();
                          return db.bulkDocs(docs).then(function () {
                            return Group.loadAll().then(function (groups) {
                              _this5.renderPartial('group-list', {
                                groups: groups
                              });
                              return true;
                            });
                          });
                        });
                      });
                    },
                    msg: 'List undeleted'
                  }
                });
              });
            });
          });
        };

        for (var _iterator4 = forms[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          _loop2();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  }, {
    key: 'initUpdateForms',
    value: function initUpdateForms() {
      var _this6 = this;

      var forms = this._el.querySelectorAll('.form-group-update');

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        var _loop3 = function _loop3() {
          var form = _step5.value;

          form.addEventListener('click', function (event) {
            event.stopPropagation(); //stop document listener from removing 'edit' class
          });

          form.addEventListener('submit', function (event) {
            event.preventDefault();

            var id = form.dataset.id;

            var name = form.elements.name.value;
            var colour = form.elements.colour.value;

            Group.load(id).then(function (group) {

              group.fields = {
                name: name,
                colour: colour
              };

              group.save().then(function () {
                Group.loadAll().then(function (groups) {
                  _this6.renderPartial('group-list', {
                    groups: groups
                  });
                });
              });
            });
          });
        };

        for (var _iterator5 = forms[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          _loop3();
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
  }]);

  return ViewGroups;
})(View);

module.exports = ViewGroups;

},{"../db/db":1,"../models/group":3,"../preferences/groups":14,"../utility/pubsub":30,"./colour-selector":32,"./view":44}],35:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var ViewHome = (function (_View) {
  _inherits(ViewHome, _View);

  function ViewHome() {
    _classCallCheck(this, ViewHome);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ViewHome).apply(this, arguments));
  }

  return ViewHome;
})(View);

module.exports = ViewHome;

},{"./view":44}],36:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var Jot = require('../models/jot');
var Group = require('../models/group');

var PubSub = require('../utility/pubsub');

var router = require('../routers/path');

var ViewImport = (function (_View) {
  _inherits(ViewImport, _View);

  function ViewImport() {
    _classCallCheck(this, ViewImport);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ViewImport).apply(this, arguments));
  }

  _createClass(ViewImport, [{
    key: 'initEvents',
    value: function initEvents() {
      _get(Object.getPrototypeOf(ViewImport.prototype), 'initEvents', this).call(this);

      this.initImportForm();
    }
  }, {
    key: 'initImportForm',
    value: function initImportForm() {
      var form = this._el.querySelector('.form-import');

      if (form) {
        form.addEventListener('submit', function (event) {
          event.preventDefault();

          Group.importFromLocal().then(function (groups) {
            var groupPromises = [];

            groups.forEach(function (group) {
              groupPromises.push(function (newGroups) {
                return Group.insert({
                  fields: group.fields,
                  dateAdded: group._dateAdded
                }).then(function (newGroup) {
                  newGroups.push(newGroup);
                  return newGroups;
                });
              });
            });

            var groupPromiseChain = Promise.resolve([]);
            groupPromises.forEach(function (groupPromise) {
              groupPromiseChain = groupPromiseChain.then(groupPromise);
            });

            return groupPromiseChain.then(function (newGroups) {
              var jotPromises = [];

              groups.forEach(function (group, index) {
                group.jots.forEach(function (jot) {
                  var newFields = jot.fields;
                  newFields.group = newGroups[index].id;
                  jotPromises.push(function () {
                    return Jot.insert({
                      fields: newFields,
                      dateAdded: jot._dateAdded
                    });
                  });
                });
              });

              var jotPromiseChain = Promise.resolve();
              jotPromises.forEach(function (jotPromise) {
                jotPromiseChain = jotPromiseChain.then(jotPromise);
              });

              return jotPromiseChain;
            });
          }).then(function () {
            return Group.removeFromLocal();
          }).then(function () {
            PubSub.publish('notify', {
              title: 'Jots imported'
            });
            router.go('/group');
            return true;
          });
        });
      }
    }
  }]);

  return ViewImport;
})(View);

module.exports = ViewImport;

},{"../models/group":3,"../models/jot":4,"../routers/path":18,"../utility/pubsub":30,"./view":44}],37:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var Jot = require('../models/jot');

var JotsPreferences = require('../preferences/jots');

var PubSub = require('../utility/pubsub');

var ViewJots = (function (_View) {
  _inherits(ViewJots, _View);

  function ViewJots(container) {
    _classCallCheck(this, ViewJots);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ViewJots).call(this, container));

    _this._preferences = new JotsPreferences();
    return _this;
  }

  _createClass(ViewJots, [{
    key: 'render',
    value: function render(preRendered, params) {
      var _this2 = this;

      params.jots = this._preferences.order(params.jots);

      _get(Object.getPrototypeOf(ViewJots.prototype), 'render', this).call(this, preRendered, params);

      this._subscriptions.push(PubSub.subscribe('update', function (topic, args) {
        if (args.changes && args.changes.length) {
          Jot.loadAll().then(function (jots) {
            _this2.render(false, {
              jots: jots
            });
          });
        }
      }));

      this._subscriptions.push(PubSub.subscribe('orderChanged', function (topic, args) {
        _this2._preferences.setOrder(args.type, args.direction);

        var params = _this2.lastParams;
        _this2.render(false, params);
      }));
    }
  }]);

  return ViewJots;
})(View);

module.exports = ViewJots;

},{"../models/jot":4,"../preferences/jots":15,"../utility/pubsub":30,"./view":44}],38:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Widget = require('./widget');

var PubSub = require('../utility/pubsub');

var ListOrder = (function (_Widget) {
  _inherits(ListOrder, _Widget);

  function ListOrder() {
    _classCallCheck(this, ListOrder);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ListOrder).apply(this, arguments));
  }

  _createClass(ListOrder, [{
    key: 'initEvents',
    value: function initEvents(el) {
      _get(Object.getPrototypeOf(ListOrder.prototype), 'initEvents', this).call(this);

      var widgets = undefined;
      if (el.classList.contains('partial-list-order')) {
        widgets = [el];
      } else {
        widgets = el.querySelectorAll('.partial-list-order');
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = widgets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var widget = _step.value;

          var links = widget.querySelectorAll('a');

          var _loop = function _loop(index) {
            var link = links[index];
            var nextLink = links[(index + 1) % links.length];

            link.addEventListener('click', function (event) {
              event.preventDefault();

              PubSub.publish('orderChanged', {
                type: nextLink.dataset.type,
                direction: nextLink.dataset.direction
              });

              link.classList.remove('current');
              nextLink.classList.add('current');
            });
          };

          for (var index = 0; index < links.length; index++) {
            _loop(index);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }]);

  return ListOrder;
})(Widget);

module.exports = ListOrder;

},{"../utility/pubsub":30,"./widget":45}],39:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var ViewLoading = (function (_View) {
  _inherits(ViewLoading, _View);

  function ViewLoading() {
    _classCallCheck(this, ViewLoading);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ViewLoading).apply(this, arguments));
  }

  return ViewLoading;
})(View);

module.exports = ViewLoading;

},{"./view":44}],40:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LoadingView = require('./loading.js');

var ViewLoadingGroups = (function (_LoadingView) {
  _inherits(ViewLoadingGroups, _LoadingView);

  function ViewLoadingGroups() {
    _classCallCheck(this, ViewLoadingGroups);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(ViewLoadingGroups).apply(this, arguments));
  }

  return ViewLoadingGroups;
})(LoadingView);

module.exports = ViewLoadingGroups;

},{"./loading.js":39}],41:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var PubSub = require('../utility/pubsub');

var NotificationManagerView = (function (_View) {
  _inherits(NotificationManagerView, _View);

  function NotificationManagerView(container) {
    _classCallCheck(this, NotificationManagerView);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(NotificationManagerView).call(this, container));

    _this._timer = null;
    return _this;
  }

  _createClass(NotificationManagerView, [{
    key: 'render',
    value: function render(preRendered, params) {
      var _this2 = this;

      _get(Object.getPrototypeOf(NotificationManagerView.prototype), 'render', this).call(this, preRendered, params);

      this._subscriptions.push(PubSub.subscribe('notify', function (topic, args) {
        _this2.showNotification(args);
      }));
    }
  }, {
    key: 'showNotification',
    value: function showNotification(_ref) {
      var _this3 = this;

      var _ref$title = _ref.title;
      var title = _ref$title === undefined ? false : _ref$title;
      var _ref$body = _ref.body;
      var body = _ref$body === undefined ? false : _ref$body;
      var _ref$action = _ref.action;
      var action = _ref$action === undefined ? false : _ref$action;
      var _ref$duration = _ref.duration;
      var duration = _ref$duration === undefined ? 5000 : _ref$duration;

      var fn = function fn() {
        _this3.renderPartial('notification', {
          title: title,
          actionName: action ? action.name : false
        });

        if (action && action.fn) {
          var actionPrimary = _this3._el.querySelector('.md-snackbar__action--primary');
          if (actionPrimary) {
            actionPrimary.addEventListener('click', function () {

              if (_this3._timer) {
                clearTimeout(_this3._timer);
              }

              action.fn().then(function () {
                if (action.msg) {
                  _this3.showNotification({
                    title: action.msg
                  });
                } else {
                  _this3._el.querySelector('.md-snackbar-container').classList.remove('has-notification');
                }
              });
            });
          }
        }

        _this3._el.querySelector('.md-snackbar-container').classList.add('has-notification');

        if (_this3._timer) {
          clearTimeout(_this3._timer);
        }

        _this3._timer = setTimeout(function () {
          _this3._el.querySelector('.md-snackbar-container').classList.remove('has-notification');
        }, duration);
      };

      if (this._el.querySelector('.md-snackbar-container').classList.contains('has-notification')) {
        this._el.querySelector('.md-snackbar-container').classList.remove('has-notification');
        setTimeout(fn, 300);
      } else {
        fn();
      }
    }
  }]);

  return NotificationManagerView;
})(View);

module.exports = NotificationManagerView;

},{"../utility/pubsub":30,"./view":44}],42:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var View = require('./view');

var ListOrder = require('./list-order');
var PubSub = require('../utility/pubsub');

var Touch = require('../utility/touch');

var ViewTitleBar = (function (_View) {
  _inherits(ViewTitleBar, _View);

  function ViewTitleBar(container) {
    _classCallCheck(this, ViewTitleBar);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ViewTitleBar).call(this, container));

    _this.registerWidget(ListOrder);

    _this._touchHandler = new Touch();
    _this._touchHandler.register('left', _this._closeNav.bind(_this));
    _this._touchHandler.register('right', _this._openNav.bind(_this));
    return _this;
  }

  _createClass(ViewTitleBar, [{
    key: 'render',
    value: function render(preRendered, params) {
      var _this2 = this;

      _get(Object.getPrototypeOf(ViewTitleBar.prototype), 'render', this).call(this, preRendered, params);

      this._subscriptions.push(PubSub.subscribe('routeChanged', function (topic, args) {
        _this2.renderPartial('titlebar-title', args);
        _this2.renderPartial('titlebar-tabs', args);

        _this2.updateSorting(args);
      }));

      this._touchHandler.setElement(this._el);
    }
  }, {
    key: 'renderPartial',
    value: function renderPartial(name, params) {
      var el = _get(Object.getPrototypeOf(ViewTitleBar.prototype), 'renderPartial', this).call(this, name, params);

      switch (name) {
        case 'list-order':
          this.initWidgets(el);
          break;
      }
    }
  }, {
    key: 'initEvents',
    value: function initEvents() {
      var _this3 = this;

      _get(Object.getPrototypeOf(ViewTitleBar.prototype), 'initEvents', this).call(this);

      this._nav = this._el.querySelector('nav');
      this._navOverlay = this._el.querySelector('.md-nav-overlay');
      this._btnMenuOpen = this._el.querySelector('.md-btn-menu');
      this._btnMenuClose = this._el.querySelector('.md-btn-menu.close');
      this._links = this._el.querySelectorAll('.md-nav-body a');

      this._btnMenuOpen.addEventListener('click', function (event) {
        event.preventDefault();
        _this3._openNav();
      });

      this._btnMenuClose.addEventListener('click', function (event) {
        event.preventDefault();
        _this3._closeNav();
      });

      for (var i = 0; i < this._links.length; i++) {
        this._links[i].addEventListener('click', function () {
          return _this3._closeNav();
        });
      }
    }
  }, {
    key: 'cleanup',
    value: function cleanup() {
      _get(Object.getPrototypeOf(ViewTitleBar.prototype), 'cleanup', this).call(this);

      this._touchHandler.destroy();
    }
  }, {
    key: '_openNav',
    value: function _openNav() {
      this._nav.classList.add('show');
      this._navOverlay.classList.add('show');
    }
  }, {
    key: '_closeNav',
    value: function _closeNav() {
      this._nav.classList.remove('show');
      this._navOverlay.classList.remove('show');
    }
  }, {
    key: 'updateSorting',
    value: function updateSorting(args) {
      this.renderPartial('list-order', args);
    }
  }]);

  return ViewTitleBar;
})(View);

module.exports = ViewTitleBar;

},{"../utility/pubsub":30,"../utility/touch":31,"./list-order":38,"./view":44}],43:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ViewContainer = (function () {
  function ViewContainer(elID, templates, partials) {
    _classCallCheck(this, ViewContainer);

    this._el = document.getElementById(elID);

    this._templates = templates;
    this._partials = partials;

    this._currentView = null;
  }

  _createClass(ViewContainer, [{
    key: "update",
    value: function update(view, html) {
      if (this._currentView) {
        this._currentView.cleanup();
      }

      this._currentView = view;
      this._el.innerHTML = html;
    }
  }]);

  return ViewContainer;
})();

module.exports = ViewContainer;

},{}],44:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Handlebars = require('handlebars/dist/handlebars.runtime');
var PubSub = require('../utility/pubsub');

var View = (function () {
  function View(container) {
    _classCallCheck(this, View);

    this._container = container;

    this._subscriptions = [];
    this._documentListeners = {};
    this._widgets = [];

    this._lastParams = null;
  }

  //tidy this up?

  _createClass(View, [{
    key: 'render',
    value: function render(preRendered, params) {
      this.cleanup();

      if (!preRendered) {
        var template = Handlebars.template(this._container._templates[this._getTemplate()]);
        this._container.update(this, template(params));
      }

      this.initEvents();

      this._lastParams = params;
    }
  }, {
    key: 'renderPartial',
    value: function renderPartial(name, params) {
      console.log('render partial', name);

      var template = Handlebars.template(this._container._partials[name]);
      var view = this._el.querySelector('.partial-' + name);
      view.outerHTML = template(params);

      this._lastParams = params;

      return this._el.querySelector('.partial-' + name);
    }
  }, {
    key: '_getTemplate',
    value: function _getTemplate() {
      return this.constructor.name.toLowerCase().substring(4);
    }
  }, {
    key: '_addDocumentListener',
    value: function _addDocumentListener(name, type, fn) {
      if (!this._documentListeners[name]) {
        this._documentListeners[name] = {
          type: type,
          fn: fn.bind(this)
        };
      }

      document.addEventListener(type, this._documentListeners[name].fn);
    }
  }, {
    key: 'cleanup',
    value: function cleanup() {
      //console.log('view cleaup', this);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._subscriptions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var sub = _step.value;

          PubSub.unsubscribe(sub);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      for (var lname in this._documentListeners) {
        var listener = this._documentListeners[lname];
        document.removeEventListener(listener.type, listener.fn);
      }

      this.cleanupWidgets();
    }
  }, {
    key: 'initEvents',
    value: function initEvents() {
      this.initWidgets(this._el);
    }
  }, {
    key: 'registerWidget',
    value: function registerWidget(Widget) {
      this._widgets.push(new Widget());
    }
  }, {
    key: 'initWidgets',
    value: function initWidgets(el) {
      this._widgets.forEach(function (widget) {
        widget.initEvents(el);
      });
    }
  }, {
    key: 'cleanupWidgets',
    value: function cleanupWidgets() {
      this._widgets.forEach(function (widget) {
        widget.cleanup();
      });
    }
  }, {
    key: '_el',
    get: function get() {
      return this._container._el;
    }
  }, {
    key: 'lastParams',
    get: function get() {
      return this._lastParams;
    }
  }]);

  return View;
})();

module.exports = View;

},{"../utility/pubsub":30,"handlebars/dist/handlebars.runtime":8}],45:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Widget = (function () {
  function Widget() {
    _classCallCheck(this, Widget);
  }

  _createClass(Widget, [{
    key: "initEvents",
    value: function initEvents() {}
  }, {
    key: "cleanup",
    value: function cleanup() {}
  }]);

  return Widget;
})();

module.exports = Widget;

},{}],46:[function(require,module,exports){

},{}],47:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[17])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL1VzZXJzL2NocmlzLy5udm0vdmVyc2lvbnMvbm9kZS92NS4wLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGIvZGIuanMiLCJtb2RlbHMvSm90LmpzIiwibW9kZWxzL2dyb3VwLmpzIiwibW9kZWxzL2pvdC5qcyIsIm1vZGVscy9tb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9hdXRvbGlua2VyL2Rpc3QvQXV0b2xpbmtlci5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0Y2xpY2svbGliL2Zhc3RjbGljay5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvaGFuZGxlYmFycy5ydW50aW1lLmpzIiwibm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGFnZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJwcmVmZXJlbmNlcy9ncm91cC5qcyIsInByZWZlcmVuY2VzL2dyb3Vwcy5qcyIsInByZWZlcmVuY2VzL2pvdHMuanMiLCJwcmVmZXJlbmNlcy9wcmVmZXJlbmNlcy5qcyIsInB1YmxpYy9qcy9hcHAuanMiLCJyb3V0ZXJzL3BhdGguanMiLCJyb3V0ZXMvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvZ3JvdXAuanMiLCJyb3V0ZXMvY2xpZW50L2hvbWUuanMiLCJyb3V0ZXMvY2xpZW50L2pvdC5qcyIsInJvdXRlcy9ncm91cC5qcyIsInJvdXRlcy9ob21lLmpzIiwicm91dGVzL2pvdC5qcyIsInJvdXRlcy9yb3V0ZXMuanMiLCJ0ZW1wbGF0ZXMvaGVscGVycy5qcyIsInV0aWxpdHkvZGF0ZS5qcyIsInV0aWxpdHkvcHVic3ViLmpzIiwidXRpbGl0eS90b3VjaC5qcyIsInZpZXdzL2NvbG91ci1zZWxlY3Rvci5qcyIsInZpZXdzL2dyb3VwLmpzIiwidmlld3MvZ3JvdXBzLmpzIiwidmlld3MvaG9tZS5qcyIsInZpZXdzL2ltcG9ydC5qcyIsInZpZXdzL2pvdHMuanMiLCJ2aWV3cy9saXN0LW9yZGVyLmpzIiwidmlld3MvbG9hZGluZy5qcyIsInZpZXdzL2xvYWRpbmdncm91cHMuanMiLCJ2aWV3cy9ub3RpZmljYXRpb24tbWFuYWdlci5qcyIsInZpZXdzL3RpdGxlYmFyLmpzIiwidmlld3Mvdmlldy1jb250YWluZXIuanMiLCJ2aWV3cy92aWV3LmpzIiwidmlld3Mvd2lkZ2V0LmpzIiwiLi4vLi4vLi4vLi4vVXNlcnMvY2hyaXMvLm52bS92ZXJzaW9ucy9ub2RlL3Y1LjAuMC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIuLi8uLi8uLi8uLi9Vc2Vycy9jaHJpcy8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRXRDLEVBQUU7QUFDTixXQURJLEVBQUUsR0FDUTswQkFEVixFQUFFOztBQUVKLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0dBQ2pCOztlQUpHLEVBQUU7O3lCQVVELE9BQU8sRUFBRTs7O0FBRVosYUFBTyxHQUFHLE9BQU8sSUFBSTtBQUNuQixnQkFBUSxFQUFFLElBQUk7QUFDZCxjQUFNLEVBQUUsSUFBSTtBQUNaLFlBQUksRUFBRSxJQUFJO0FBQ1YsZ0JBQVEsRUFBRSxJQUFJO0FBQ2QsZ0JBQVEsRUFBRSxJ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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbG5HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoM0JBO0FBQ0E7QUFDQTtBQUNBOzs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM21CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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LENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQzs7Ozs7Ozs7O0lDdEdoQixNQUFNO0FBRVYsV0FGSSxNQUFNLEdBRUk7MEJBRlYsTUFBTTtHQUdUOztlQUhHLE1BQU07O2lDQUtHLEVBRVo7Ozs4QkFFUyxFQUNUOzs7U0FWRyxNQUFNOzs7QUFhWixNQUFNLENBQUMsT0FBTyxHQUFHLE1BQU0sQ0FBQzs7O0FDYnhCOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBEQiB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3JlbW90ZUNvdWNoID0gbnVsbDtcbiAgICB0aGlzLl9kYiA9IG51bGw7XG4gIH1cblxuICBnZXQgZGIoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2RiO1xuICB9XG5cbiAgaW5pdChvcHRpb25zKSB7XG5cbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7XG4gICAgICBwcm90b2NvbDogbnVsbCxcbiAgICAgIGRvbWFpbjogbnVsbCxcbiAgICAgIHBvcnQ6IG51bGwsXG4gICAgICB1c2VybmFtZTogbnVsbCxcbiAgICAgIHBhc3N3b3JkOiBudWxsLFxuICAgICAgZGJOYW1lOiBudWxsXG4gICAgfTtcblxuICAgIGlmIChvcHRpb25zLmRvbWFpbikge1xuICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggPSBvcHRpb25zLnByb3RvY29sICsgJzovLyc7XG5cbiAgICAgIGlmIChvcHRpb25zLnVzZXJuYW1lKSB7XG4gICAgICAgIHRoaXMuX3JlbW90ZUNvdWNoICs9IG9wdGlvbnMudXNlcm5hbWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLnBhc3N3b3JkKSB7XG4gICAgICAgIHRoaXMuX3JlbW90ZUNvdWNoICs9ICc6JyArIG9wdGlvbnMucGFzc3dvcmQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChvcHRpb25zLnVzZXJuYW1lIHx8IG9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gJ0AnO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSBvcHRpb25zLmRvbWFpbjtcblxuICAgICAgaWYgKG9wdGlvbnMucG9ydCkge1xuICAgICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSAnOicgKyBvcHRpb25zLnBvcnQ7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3JlbW90ZUNvdWNoICs9ICcvJyArIG9wdGlvbnMuZGJOYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9yZW1vdGVDb3VjaCA9IG51bGw7XG4gICAgfVxuXG4gICAgaWYgKHR5cGVvZiBQb3VjaERCICE9PSAndW5kZWZpbmVkJykgeyAvL2Jyb3dzZXJcbiAgICAgIFBvdWNoREIuZGVidWcuZGlzYWJsZSgpO1xuICAgICAgdGhpcy5fZGIgPSBuZXcgUG91Y2hEQihvcHRpb25zLmRiTmFtZSwge1xuICAgICAgICBhdXRvX2NvbXBhY3Rpb246IHRydWVcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5fcmVtb3RlQ291Y2gpIHtcblxuICAgICAgICBjb25zdCBvcHRzID0ge2xpdmU6IHRydWUsIHJldHJ5OiB0cnVlfTtcblxuICAgICAgICB0aGlzLl9kYi5yZXBsaWNhdGUudG8odGhpcy5fcmVtb3RlQ291Y2gsIG9wdHMpLm9uKCdjaGFuZ2UnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gY2hhbmdlJyk7XG4gICAgICAgIH0pLm9uKCdwYXVzZWQnLCAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIHRvIHBhdXNlZCcpO1xuICAgICAgICB9KS5vbignYWN0aXZlJywgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBhY3RpdmUnKTtcbiAgICAgICAgfSkub24oJ2RlbmllZCcsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBkZW5pZWQnLCBpbmZvKTtcbiAgICAgICAgfSkub24oJ2NvbXBsZXRlJywgaW5mbyA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIHRvIGNvbXBsZXRlJyk7XG4gICAgICAgIH0pLm9uKCdlcnJvcicsIGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIHRvIGVycm9yJywgZXJyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IGNoYW5nZXMgPSBbXTtcblxuICAgICAgICB0aGlzLl9kYi5yZXBsaWNhdGUuZnJvbSh0aGlzLl9yZW1vdGVDb3VjaCwgb3B0cykub24oJ2NoYW5nZScsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIGNoYW5nZScsIGluZm8pO1xuICAgICAgICAgIGNoYW5nZXMgPSBjaGFuZ2VzLmNvbmNhdChpbmZvLmRvY3MpO1xuICAgICAgICB9KS5vbigncGF1c2VkJywgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIHBhdXNlZCcpO1xuXG4gICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3VwZGF0ZScsIHtcbiAgICAgICAgICAgIGNoYW5nZXNcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGNoYW5nZXMgPSBbXTtcblxuICAgICAgICB9KS5vbignYWN0aXZlJywgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIGFjdGl2ZScpO1xuICAgICAgICB9KS5vbignZGVuaWVkJywgaW5mbyA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIGZyb20gZGVuaWVkJywgaW5mbyk7XG4gICAgICAgIH0pLm9uKCdjb21wbGV0ZScsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIGNvbXBsZXRlJywgaW5mbyk7XG4gICAgICAgIH0pLm9uKCdlcnJvcicsIGVyciA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIGZyb20gZXJyb3InLCBlcnIpO1xuICAgICAgICB9KTtcblxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZGRvYyA9IHtcbiAgICAgICAgICBfaWQ6ICdfZGVzaWduL2luZGV4JyxcbiAgICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgZ3JvdXA6IHtcbiAgICAgICAgICAgICAgbWFwOiAoZG9jID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoZG9jLmZpZWxkcy5ncm91cCkge1xuICAgICAgICAgICAgICAgICAgZW1pdChkb2MuZmllbGRzLmdyb3VwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pLnRvU3RyaW5nKClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5fZGIucHV0KGRkb2MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIC8vIGtpY2sgb2ZmIGFuIGluaXRpYWwgYnVpbGQsIHJldHVybiBpbW1lZGlhdGVseVxuICAgICAgICAgIHJldHVybiB0aGlzLl9kYi5xdWVyeSgnaW5kZXgvZ3JvdXAnLCB7c3RhbGU6ICd1cGRhdGVfYWZ0ZXInfSk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAvL2NvbmZsaWN0IG9jY3VyZWQsIGkuZS4gZGRvYyBhbHJlYWR5IGV4aXN0ZWRcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgUG91Y2hEQiA9IHJlcXVpcmUoJ3BvdWNoZGInKTtcbiAgICAgIFBvdWNoREIuZGVidWcuZGlzYWJsZSgpO1xuXG4gICAgICB0aGlzLl9kYiA9IG5ldyBQb3VjaERCKHRoaXMuX3JlbW90ZUNvdWNoKTtcbiAgICB9XG4gIH1cbn1cblxuY29uc3QgZGJzID0ge1xuICAnbWFpbic6IG5ldyBEQigpXG59O1xubGV0IGN1cnJlbnREQiA9ICdtYWluJztcblxubW9kdWxlLmV4cG9ydHMgPSAob3B0aW9ucywgaWQ9ZmFsc2UpID0+IHtcbiAgaWYgKGlkICE9PSBmYWxzZSkge1xuICAgIGN1cnJlbnREQiA9IGlkO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMpIHtcbiAgICBpZiAoIWRic1tjdXJyZW50REJdKSB7XG4gICAgICBkYnNbY3VycmVudERCXSA9IG5ldyBEQigpO1xuICAgIH1cblxuICAgIGRic1tjdXJyZW50REJdLmluaXQob3B0aW9ucyk7XG4gIH1cblxuICByZXR1cm4gZGJzW2N1cnJlbnREQl0uZGI7XG59O1xuIiwiY29uc3QgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG5cbmNsYXNzIEpvdCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihtZW1iZXJzKSB7XG4gICAgc3VwZXIobWVtYmVycywgW1xuICAgICAgJ2NvbnRlbnQnLFxuICAgICAgJ2dyb3VwJyxcbiAgICAgICdkb25lJyxcbiAgICAgICdwcmlvcml0eSdcbiAgICBdKTtcblxuICAgIHRoaXMuX2dyb3VwID0gbnVsbDtcbiAgfVxuXG4gIHN0YXRpYyBnZXRQcmlvcml0aWVzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnMicsXG4gICAgICAnMScsXG4gICAgICAnMCdcbiAgICBdO1xuICB9XG5cbiAgZ2V0IHByaW9yaXRpZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0UHJpb3JpdGllcygpO1xuICB9XG5cbiAgZ2V0IGdyb3VwKCkge1xuICAgIHJldHVybiB0aGlzLl9ncm91cDtcbiAgfVxuXG4gIGdldCBncm91cE5hbWUoKSB7XG4gICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ3JvdXAuZmllbGRzLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnLSc7XG4gICAgfVxuICB9XG5cbiAgaXNEb25lKCkge1xuICAgIHJldHVybiB0aGlzLmZpZWxkcy5kb25lO1xuICB9XG5cbiAgbG9hZEdyb3VwKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICByZXR1cm4gR3JvdXAubG9hZCh0aGlzLmZpZWxkcy5ncm91cCwgZmFsc2UpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICB0aGlzLl9ncm91cCA9IGdyb3VwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldFBlcmNlbnRhZ2VEb25lKCkge1xuICAgIHJldHVybiB0aGlzLmxvYWRBbGwoZmFsc2UpLnRoZW4oam90cyA9PiB7XG4gICAgICBsZXQgbnVtRG9uZSA9IGpvdHMucmVkdWNlKChwcmV2VmFsLCBqb3QpID0+IHtcbiAgICAgICAgaWYgKGpvdC5pc0RvbmUoKSkge1xuICAgICAgICAgIHJldHVybiBwcmV2VmFsICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcHJldlZhbDtcbiAgICAgICAgfVxuICAgICAgfSwgMCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBlcmNlbnQ6IHBhcnNlSW50KChudW1Eb25lIC8gam90cy5sZW5ndGgpICogMTAwLCAxMClcbiAgICAgIH07XG4gICAgfSlcblxuICAgIC50aGVuKHN0YXRzID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICByZXR1cm4gR3JvdXAubG9hZEFsbChmYWxzZSkudGhlbihncm91cHMgPT4ge1xuICAgICAgICBzdGF0cy5udW1Hcm91cHMgPSBncm91cHMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiBzdGF0cztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWQoaWQsIGxvYWRHcm91cCA9IHRydWUpIHtcbiAgICByZXR1cm4gc3VwZXIubG9hZChpZCkudGhlbihqb3QgPT4ge1xuICAgICAgaWYgKGxvYWRHcm91cCkge1xuICAgICAgICByZXR1cm4gam90LmxvYWRHcm91cCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBqb3Q7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGpvdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkQWxsKGxvYWRHcm91cHMgPSB0cnVlLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWRBbGwoKS50aGVuKGpvdHMgPT4ge1xuICAgICAgY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5cbiAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICAgIGlmIChsb2FkR3JvdXBzKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2goR3JvdXAubG9hZEZvckpvdHMoam90cykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmRlcihqb3RzLCBvcmRlciwgZGlyZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG9yZGVyKGpvdHMsIHNvcnRPcmRlciA9ICdhbHBoYScsIHNvcnREaXJlY3Rpb24gPSAnYXNjJykge1xuXG4gICAgc3dpdGNoIChzb3J0T3JkZXIpIHtcbiAgICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkID4gYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkIDwgYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYWxwaGEnOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpID4gYi5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpIDwgYi5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHJpb3JpdHknOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMucHJpb3JpdHkgPiBiLmZpZWxkcy5wcmlvcml0eSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuZmllbGRzLnByaW9yaXR5IDwgYi5maWVsZHMucHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHNvcnREaXJlY3Rpb24gPT09ICdkZXNjJykge1xuICAgICAgam90cy5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgdW5kb25lSm90cyA9IFtdO1xuICAgIGNvbnN0IGRvbmVKb3RzID0gW107XG5cbiAgICBqb3RzLmZvckVhY2goam90ID0+IHtcbiAgICAgIGlmIChqb3QuaXNEb25lKCkpIHtcbiAgICAgICAgZG9uZUpvdHMucHVzaChqb3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5kb25lSm90cy5wdXNoKGpvdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdW5kb25lSm90cy5jb25jYXQoZG9uZUpvdHMpO1xuICB9XG5cbiAgc3RhdGljIGxvYWRGb3JHcm91cChncm91cElkLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5xdWVyeSgnaW5kZXgvZ3JvdXAnLCB7XG4gICAgICAgIGRlc2NlbmRpbmc6IHRydWUsXG4gICAgICAgIGtleTogZ3JvdXBJZCxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IGpvdHMgPSBbXTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgam90cy5wdXNoKG5ldyB0aGlzKHJvdy5kb2MpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoam90cywgb3JkZXIsIGRpcmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkRm9yR3JvdXBzKGdyb3Vwcywgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgY29uc3QgZ3JvdXBJZHMgPSBncm91cHMubWFwKGdyb3VwID0+IGdyb3VwLmlkKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge1xuICAgICAgICBrZXlzOiBncm91cElkcyxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IGdyb3VwSm90cyA9IHt9O1xuXG4gICAgICAgIGdyb3VwSWRzLmZvckVhY2goZ3JvdXBJZCA9PiB7XG4gICAgICAgICAgZ3JvdXBKb3RzW2dyb3VwSWRdID0gW107XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5yb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICBncm91cEpvdHNbcm93LmRvYy5maWVsZHMuZ3JvdXBdLnB1c2gobmV3IHRoaXMocm93LmRvYykpO1xuICAgICAgICB9KTtcblxuICAgICAgICBncm91cHMuZm9yRWFjaChncm91cCA9PiB7XG4gICAgICAgICAgZ3JvdXAuX2pvdHMgPSBncm91cEpvdHNbZ3JvdXAuaWRdO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSm90O1xuIiwiY29uc3QgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG5jb25zdCBKb3QgPSByZXF1aXJlKCcuL2pvdCcpO1xuXG5jbGFzcyBHcm91cCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihtZW1iZXJzKSB7XG4gICAgc3VwZXIobWVtYmVycywgW1xuICAgICAgJ25hbWUnLFxuICAgICAgJ2NvbG91cidcbiAgICBdKTtcblxuICAgIHRoaXMuX2pvdHMgPSBbXTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRDb2xvdXJzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnYmx1ZScsXG4gICAgICAncmVkJyxcbiAgICAgICd0ZWFsJyxcbiAgICAgICd5ZWxsb3cnLFxuICAgICAgJ29yYW5nZScsXG4gICAgICAnYnJvd24nXG4gICAgXTtcbiAgfVxuXG4gIGdldCBjb2xvdXJzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldENvbG91cnMoKTtcbiAgfVxuXG4gIGdldCBqb3RzKCkge1xuICAgIHJldHVybiB0aGlzLl9qb3RzO1xuICB9XG5cbiAgc2V0IGpvdHMoam90cykge1xuICAgIHRoaXMuX2pvdHMgPSBqb3RzO1xuICB9XG5cbiAgZ2V0Sm90cyhkb25lID0gbnVsbCkge1xuICAgIGlmIChkb25lID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5qb3RzO1xuICAgIH0gZWxzZSBpZiAoZG9uZSkge1xuICAgICAgcmV0dXJuIHRoaXMuam90cy5maWx0ZXIoam90ID0+ICEham90LmZpZWxkcy5kb25lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuam90cy5maWx0ZXIoam90ID0+ICFqb3QuZmllbGRzLmRvbmUpO1xuICAgIH1cbiAgfVxuXG4gIGdldCBqb3RDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fam90cy5sZW5ndGg7XG4gIH1cblxuICBnZXQgam90RG9uZUNvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9qb3RzLmZpbHRlcihqb3QgPT4gISFqb3QuZmllbGRzLmRvbmUpLmxlbmd0aDtcbiAgfVxuXG4gIGxvYWRKb3RzKG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gSm90LmxvYWRGb3JHcm91cCh0aGlzLmlkLCBvcmRlciwgZGlyZWN0aW9uKS50aGVuKGpvdHMgPT4ge1xuICAgICAgdGhpcy5fam90cyA9IGpvdHM7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkKGlkLCBsb2FkSm90cyA9IHRydWUsIGpvdE9yZGVyID0gJ2FscGhhJywgam90RGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gc3VwZXIubG9hZChpZCkudGhlbihncm91cCA9PiB7XG4gICAgICBpZiAobG9hZEpvdHMpIHtcbiAgICAgICAgcmV0dXJuIGdyb3VwLmxvYWRKb3RzKGpvdE9yZGVyLCBqb3REaXJlY3Rpb24pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBncm91cDtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEFsbChsb2FkSm90cyA9IHRydWUsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gc3VwZXIubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICAgIGlmIChsb2FkSm90cykge1xuICAgICAgICBwcm9taXNlcy5wdXNoKEpvdC5sb2FkRm9yR3JvdXBzKGdyb3VwcykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmRlcihncm91cHMsIG9yZGVyLCBkaXJlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEZvckpvdHMoam90cykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgY29uc3QgZ3JvdXBJZHMgPSBqb3RzLm1hcChqb3QgPT4gam90LmZpZWxkcy5ncm91cCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLmFsbERvY3Moe1xuICAgICAgICBkZXNjZW5kaW5nOiB0cnVlLFxuICAgICAgICBrZXlzOiBncm91cElkcyxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IGpvdEdyb3VwcyA9IHt9O1xuXG4gICAgICAgIHJlc3VsdC5yb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICBqb3RHcm91cHNbcm93LmRvYy5faWRdID0gbmV3IHRoaXMocm93LmRvYyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGpvdHMuZm9yRWFjaChqb3QgPT4ge1xuICAgICAgICAgIGpvdC5fZ3JvdXAgPSBqb3RHcm91cHNbam90LmZpZWxkcy5ncm91cF07XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgb3JkZXIoZ3JvdXBzLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG5cbiAgICBzd2l0Y2ggKG9yZGVyKSB7XG4gICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgZ3JvdXBzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkID4gYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkIDwgYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYWxwaGEnOlxuICAgICAgICBncm91cHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLmZpZWxkcy5uYW1lLnRvTG93ZXJDYXNlKCkgPiBiLmZpZWxkcy5uYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLmZpZWxkcy5uYW1lLnRvTG93ZXJDYXNlKCkgPCBiLmZpZWxkcy5uYW1lLnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGlvbiA9PT0gJ2Rlc2MnKSB7XG4gICAgICBncm91cHMucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIHJldHVybiBncm91cHM7XG4gIH1cblxuICBzdGF0aWMgcmVtb3ZlKGlkKSB7XG4gICAgcmV0dXJuIHN1cGVyLnJlbW92ZShpZCkudGhlbigoKSA9PiB7XG5cbiAgICAgIHJldHVybiBKb3QubG9hZEZvckdyb3VwKGlkKS50aGVuKGpvdHMgPT4ge1xuICAgICAgICBjb25zdCBkb2NzID0gam90cy5tYXAoam90ID0+IHtcbiAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgX2lkOiBqb3QuaWQsXG4gICAgICAgICAgICBfcmV2OiBqb3QucmV2LFxuICAgICAgICAgICAgX2RlbGV0ZWQ6IHRydWVcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5kYi5idWxrRG9jcyhkb2NzKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBpbXBvcnRGcm9tTG9jYWwoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBQb3VjaERCID09PSAndW5kZWZpbmVkJykgeyAvL3NlcnZlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vbG9hZCBsb2NhbCBkYlxuICAgICAgcmVxdWlyZSgnLi4vZGIvZGInKSh7XG4gICAgICAgIGRiTmFtZTogJ2pvdC1sb2NhbCdcbiAgICAgIH0sICdsb2NhbCcpO1xuXG4gICAgICByZXR1cm4gdGhpcy5sb2FkQWxsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICAvL3Jlc3RvcmUgbWFpbiBkYlxuICAgICAgICByZXF1aXJlKCcuLi9kYi9kYicpKG51bGwsICdtYWluJyk7XG5cbiAgICAgICAgcmV0dXJuIGdyb3VwcztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHJlbW92ZUZyb21Mb2NhbCgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIFBvdWNoREIgPT09ICd1bmRlZmluZWQnKSB7IC8vc2VydmVyXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy9sb2FkIGxvY2FsIGRiXG4gICAgICByZXF1aXJlKCcuLi9kYi9kYicpKHtcbiAgICAgICAgZGJOYW1lOiAnam90LWxvY2FsJ1xuICAgICAgfSwgJ2xvY2FsJyk7XG5cbiAgICAgIHJldHVybiB0aGlzLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG4gICAgICAgIGdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICAgICAgICBwcm9taXNlcy5wdXNoKEdyb3VwLnJlbW92ZShncm91cC5pZCkpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgIC8vcmVzdG9yZSBtYWluIGRiXG4gICAgICAgIHJlcXVpcmUoJy4uL2RiL2RiJykobnVsbCwgJ21haW4nKTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JvdXA7XG4iLCJjb25zdCBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwnKTtcblxuY2xhc3MgSm90IGV4dGVuZHMgTW9kZWwge1xuXG4gIGNvbnN0cnVjdG9yKG1lbWJlcnMpIHtcbiAgICBzdXBlcihtZW1iZXJzLCBbXG4gICAgICAnY29udGVudCcsXG4gICAgICAnZ3JvdXAnLFxuICAgICAgJ2RvbmUnLFxuICAgICAgJ3ByaW9yaXR5J1xuICAgIF0pO1xuXG4gICAgdGhpcy5fZ3JvdXAgPSBudWxsO1xuICB9XG5cbiAgc3RhdGljIGdldFByaW9yaXRpZXMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICcyJyxcbiAgICAgICcxJyxcbiAgICAgICcwJ1xuICAgIF07XG4gIH1cblxuICBnZXQgcHJpb3JpdGllcygpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRQcmlvcml0aWVzKCk7XG4gIH1cblxuICBnZXQgZ3JvdXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dyb3VwO1xuICB9XG5cbiAgZ2V0IGdyb3VwTmFtZSgpIHtcbiAgICBpZiAodGhpcy5fZ3JvdXApIHtcbiAgICAgIHJldHVybiB0aGlzLl9ncm91cC5maWVsZHMubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICctJztcbiAgICB9XG4gIH1cblxuICBpc0RvbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmllbGRzLmRvbmU7XG4gIH1cblxuICBsb2FkR3JvdXAoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5cbiAgICAgIHJldHVybiBHcm91cC5sb2FkKHRoaXMuZmllbGRzLmdyb3VwLCBmYWxzZSkudGhlbihncm91cCA9PiB7XG4gICAgICAgIHRoaXMuX2dyb3VwID0gZ3JvdXA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0UGVyY2VudGFnZURvbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9hZEFsbChmYWxzZSkudGhlbihqb3RzID0+IHtcbiAgICAgIGxldCBudW1Eb25lID0gam90cy5yZWR1Y2UoKHByZXZWYWwsIGpvdCkgPT4ge1xuICAgICAgICBpZiAoam90LmlzRG9uZSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHByZXZWYWwgKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwcmV2VmFsO1xuICAgICAgICB9XG4gICAgICB9LCAwKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGVyY2VudDogcGFyc2VJbnQoKG51bURvbmUgLyBqb3RzLmxlbmd0aCkgKiAxMDAsIDEwKVxuICAgICAgfTtcbiAgICB9KVxuXG4gICAgLnRoZW4oc3RhdHMgPT4ge1xuICAgICAgY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5cbiAgICAgIHJldHVybiBHcm91cC5sb2FkQWxsKGZhbHNlKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgIHN0YXRzLm51bUdyb3VwcyA9IGdyb3Vwcy5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHN0YXRzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZChpZCwgbG9hZEdyb3VwID0gdHJ1ZSkge1xuICAgIHJldHVybiBzdXBlci5sb2FkKGlkKS50aGVuKGpvdCA9PiB7XG4gICAgICBpZiAobG9hZEdyb3VwKSB7XG4gICAgICAgIHJldHVybiBqb3QubG9hZEdyb3VwKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGpvdDtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gam90O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRBbGwobG9hZEdyb3VwcyA9IHRydWUsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gc3VwZXIubG9hZEFsbCgpLnRoZW4oam90cyA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcblxuICAgICAgaWYgKGxvYWRHcm91cHMpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChHcm91cC5sb2FkRm9ySm90cyhqb3RzKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yZGVyKGpvdHMsIG9yZGVyLCBkaXJlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgb3JkZXIoam90cywgc29ydE9yZGVyID0gJ2FscGhhJywgc29ydERpcmVjdGlvbiA9ICdhc2MnKSB7XG5cbiAgICBzd2l0Y2ggKHNvcnRPcmRlcikge1xuICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgIGpvdHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLl9kYXRlQWRkZWQgPiBiLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLl9kYXRlQWRkZWQgPCBiLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhbHBoYSc6XG4gICAgICAgIGpvdHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkgPiBiLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkgPCBiLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwcmlvcml0eSc6XG4gICAgICAgIGpvdHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLmZpZWxkcy5wcmlvcml0eSA+IGIuZmllbGRzLnByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5maWVsZHMucHJpb3JpdHkgPCBiLmZpZWxkcy5wcmlvcml0eSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc29ydERpcmVjdGlvbiA9PT0gJ2Rlc2MnKSB7XG4gICAgICBqb3RzLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICBjb25zdCB1bmRvbmVKb3RzID0gW107XG4gICAgY29uc3QgZG9uZUpvdHMgPSBbXTtcblxuICAgIGpvdHMuZm9yRWFjaChqb3QgPT4ge1xuICAgICAgaWYgKGpvdC5pc0RvbmUoKSkge1xuICAgICAgICBkb25lSm90cy5wdXNoKGpvdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmRvbmVKb3RzLnB1c2goam90KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB1bmRvbmVKb3RzLmNvbmNhdChkb25lSm90cyk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEZvckdyb3VwKGdyb3VwSWQsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLnF1ZXJ5KCdpbmRleC9ncm91cCcsIHtcbiAgICAgICAgZGVzY2VuZGluZzogdHJ1ZSxcbiAgICAgICAga2V5OiBncm91cElkLFxuICAgICAgICBpbmNsdWRlX2RvY3M6IHRydWVcbiAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3Qgam90cyA9IFtdO1xuXG4gICAgICAgIHJlc3VsdC5yb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICBqb3RzLnB1c2gobmV3IHRoaXMocm93LmRvYykpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5vcmRlcihqb3RzLCBvcmRlciwgZGlyZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRGb3JHcm91cHMoZ3JvdXBzLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICBjb25zdCBncm91cElkcyA9IGdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXAuaWQpO1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5xdWVyeSgnaW5kZXgvZ3JvdXAnLCB7XG4gICAgICAgIGtleXM6IGdyb3VwSWRzLFxuICAgICAgICBpbmNsdWRlX2RvY3M6IHRydWVcbiAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3QgZ3JvdXBKb3RzID0ge307XG5cbiAgICAgICAgZ3JvdXBJZHMuZm9yRWFjaChncm91cElkID0+IHtcbiAgICAgICAgICBncm91cEpvdHNbZ3JvdXBJZF0gPSBbXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LnJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgIGdyb3VwSm90c1tyb3cuZG9jLmZpZWxkcy5ncm91cF0ucHVzaChuZXcgdGhpcyhyb3cuZG9jKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICAgICAgICBncm91cC5fam90cyA9IGdyb3VwSm90c1tncm91cC5pZF07XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3Q7XG4iLCJjb25zdCBEYXRlVXRpbHMgPSByZXF1aXJlKCcuLi91dGlsaXR5L2RhdGUnKTtcblxuY2xhc3MgTW9kZWwge1xuXG4gIGNvbnN0cnVjdG9yKG1lbWJlcnMsIGFsbG93ZWRGaWVsZHMpIHtcbiAgICB0aGlzLl9pZCA9IG1lbWJlcnMuX2lkIHx8IG51bGw7XG4gICAgdGhpcy5fcmV2ID0gbWVtYmVycy5fcmV2IHx8IG51bGw7XG5cbiAgICB0aGlzLl9kYXRlQWRkZWQgPSBtZW1iZXJzLmRhdGVBZGRlZCB8fCBudWxsO1xuXG4gICAgdGhpcy5fZmllbGRzID0gbWVtYmVycy5maWVsZHMgfHwge307XG5cbiAgICB0aGlzLl9hbGxvd2VkRmllbGRzID0gYWxsb3dlZEZpZWxkcztcbiAgfVxuXG4gIHN0YXRpYyBnZXQgZGIoKSB7XG4gICAgcmV0dXJuIHJlcXVpcmUoJy4uL2RiL2RiJykoKTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRSZWZOYW1lKCkge1xuICAgIHJldHVybiB0aGlzLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIGdldCByZWZOYW1lKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldFJlZk5hbWUoKTtcbiAgfVxuXG4gIGdldCBpZCgpIHtcbiAgICByZXR1cm4gdGhpcy5faWQ7XG4gIH1cblxuICBzZXQgaWQoaWQpIHtcbiAgICB0aGlzLl9pZCA9IGlkO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgcmV2KCkge1xuICAgIHJldHVybiB0aGlzLl9yZXY7XG4gIH1cblxuICBzZXQgcmV2KHJldikge1xuICAgIHRoaXMuX3JldiA9IHJldjtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IGRhdGVBZGRlZCgpIHtcbiAgICBpZiAodGhpcy5fZGF0ZUFkZGVkKSB7XG4gICAgICByZXR1cm4gRGF0ZVV0aWxzLmZvcm1hdChuZXcgRGF0ZSh0aGlzLl9kYXRlQWRkZWQpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfVxuXG4gIHNldCBkYXRlQWRkZWQoZGF0ZSkge1xuICAgIHRoaXMuX2RhdGVBZGRlZCA9IGRhdGU7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldCBmaWVsZHMoZmllbGRzKSB7XG4gICAgdGhpcy5fZmllbGRzID0ge307XG5cbiAgICBmb3IgKGxldCBmaWVsZE5hbWUgaW4gZmllbGRzKSB7XG4gICAgICBpZiAodGhpcy5fYWxsb3dlZEZpZWxkcy5pbmRleE9mKGZpZWxkTmFtZSkgPiAtMSkge1xuICAgICAgICB0aGlzLl9maWVsZHNbZmllbGROYW1lXSA9IGZpZWxkc1tmaWVsZE5hbWVdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IGZpZWxkcygpIHtcbiAgICByZXR1cm4gdGhpcy5fZmllbGRzO1xuICB9XG5cbiAgaXNOZXcoKSB7XG4gICAgcmV0dXJuICF0aGlzLmlkO1xuICB9XG5cbiAgZ2V0U2x1ZygpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBpZiAoIXRoaXMuaXNOZXcoKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuaWQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbGV0IHNsdWcgPSB0aGlzLnJlZk5hbWUgKyAnLSc7XG5cbiAgICAgICAgY29uc3QgcGFkZGluZyA9IDU7IC8vdGhlIGxlbmd0aCBvZiB0aGUgbnVtYmVyLCBlLmcuICc1JyB3aWxsIHN0YXJ0IGF0IDAwMDAwLCAwMDAwMSwgZXRjLlxuXG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmRiLmFsbERvY3Moe1xuICAgICAgICAgIHN0YXJ0a2V5OiBzbHVnICsgJ1xcdWZmZmYnLFxuICAgICAgICAgIGVuZGtleTogc2x1ZyxcbiAgICAgICAgICBkZXNjZW5kaW5nOiB0cnVlLFxuICAgICAgICAgIGxpbWl0OiAxXG4gICAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICBpZiAocmVzdWx0LnJvd3MubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgbGFzdERvYyA9IHJlc3VsdC5yb3dzW3Jlc3VsdC5yb3dzLmxlbmd0aCAtIDFdO1xuICAgICAgICAgICAgY29uc3QgbGFzdE51bSA9IHBhcnNlSW50KGxhc3REb2MuaWQuc3Vic3RyaW5nKHNsdWcubGVuZ3RoKSwgMTApO1xuXG4gICAgICAgICAgICByZXR1cm4gc2x1ZyArICgnMCcucmVwZWF0KHBhZGRpbmcpICsgKGxhc3ROdW0gKyAxKSkuc2xpY2UoLXBhZGRpbmcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc2x1ZyArICcwJy5yZXBlYXQocGFkZGluZyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHNhdmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0U2x1ZygpLnRoZW4oc2x1ZyA9PiB7XG4gICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgIF9pZDogc2x1ZyxcbiAgICAgICAgZGF0ZUFkZGVkOiB0aGlzLl9kYXRlQWRkZWQsXG4gICAgICAgIGZpZWxkczogdGhpcy5maWVsZHNcbiAgICAgIH07XG5cbiAgICAgIGlmICghdGhpcy5pc05ldygpKSB7XG4gICAgICAgIHBhcmFtcy5fcmV2ID0gdGhpcy5yZXY7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLmlzTmV3KCkgJiYgIXRoaXMuX2RhdGVBZGRlZCkge1xuICAgICAgICBwYXJhbXMuZGF0ZUFkZGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5kYi5wdXQocGFyYW1zKS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICAgICAgaWYgKHJlc3BvbnNlLm9rKSB7XG4gICAgICAgICAgdGhpcy5pZCA9IHJlc3BvbnNlLmlkO1xuICAgICAgICAgIHRoaXMucmV2ID0gcmVzcG9uc2UucmV2O1xuXG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRBbGwoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5hbGxEb2NzKHtcbiAgICAgICAgZW5ka2V5OiB0aGlzLmdldFJlZk5hbWUoKSArICctJyxcbiAgICAgICAgc3RhcnRrZXk6IHRoaXMuZ2V0UmVmTmFtZSgpICsgJy1cXHVmZmZmJyxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlLFxuICAgICAgICBkZXNjZW5kaW5nOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IG1vZGVscyA9IFtdO1xuXG4gICAgICAgIHJlc3VsdC5yb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICBtb2RlbHMucHVzaChuZXcgdGhpcyhyb3cuZG9jKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBtb2RlbHM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkKGlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3VuZGVmaW5lZCcpIHtcblxuICAgICAgICByZXR1cm4gdGhpcy5kYi5nZXQoaWQpLnRoZW4oZG9jID0+IHtcbiAgICAgICAgICByZXR1cm4gbmV3IHRoaXMoZG9jKTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIHJlbW92ZShpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIuZ2V0KGlkKS50aGVuKGRvYyA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLmRiLnJlbW92ZShkb2MpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgaW5zZXJ0KG1lbWJlcnMpIHtcbiAgICBjb25zdCBtb2RlbCA9IG5ldyB0aGlzKG1lbWJlcnMpO1xuICAgIHJldHVybiBtb2RlbC5zYXZlKCk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbDtcbiIsIihmdW5jdGlvbiAocm9vdCwgZmFjdG9yeSkge1xuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgLy8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlIHVubGVzcyBhbWRNb2R1bGVJZCBpcyBzZXRcbiAgICBkZWZpbmUoW10sIGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiAocm9vdFsnQXV0b2xpbmtlciddID0gZmFjdG9yeSgpKTtcbiAgICB9KTtcbiAgfSBlbHNlIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpIHtcbiAgICAvLyBOb2RlLiBEb2VzIG5vdCB3b3JrIHdpdGggc3RyaWN0IENvbW1vbkpTLCBidXRcbiAgICAvLyBvbmx5IENvbW1vbkpTLWxpa2UgZW52aXJvbm1lbnRzIHRoYXQgc3VwcG9ydCBtb2R1bGUuZXhwb3J0cyxcbiAgICAvLyBsaWtlIE5vZGUuXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG4gIH0gZWxzZSB7XG4gICAgcm9vdFsnQXV0b2xpbmtlciddID0gZmFjdG9yeSgpO1xuICB9XG59KHRoaXMsIGZ1bmN0aW9uICgpIHtcblxuLyohXG4gKiBBdXRvbGlua2VyLmpzXG4gKiAwLjIyLjBcbiAqXG4gKiBDb3B5cmlnaHQoYykgMjAxNSBHcmVnb3J5IEphY29icyA8Z3JlZ0BncmVnLWphY29icy5jb20+XG4gKiBNSVRcbiAqXG4gKiBodHRwczovL2dpdGh1Yi5jb20vZ3JlZ2phY29icy9BdXRvbGlua2VyLmpzXG4gKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXJcbiAqIEBleHRlbmRzIE9iamVjdFxuICpcbiAqIFV0aWxpdHkgY2xhc3MgdXNlZCB0byBwcm9jZXNzIGEgZ2l2ZW4gc3RyaW5nIG9mIHRleHQsIGFuZCB3cmFwIHRoZSBtYXRjaGVzIGluXG4gKiB0aGUgYXBwcm9wcmlhdGUgYW5jaG9yICgmbHQ7YSZndDspIHRhZ3MgdG8gdHVybiB0aGVtIGludG8gbGlua3MuXG4gKlxuICogQW55IG9mIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgbWF5IGJlIHByb3ZpZGVkIGluIGFuIE9iamVjdCAobWFwKSBwcm92aWRlZFxuICogdG8gdGhlIEF1dG9saW5rZXIgY29uc3RydWN0b3IsIHdoaWNoIHdpbGwgY29uZmlndXJlIGhvdyB0aGUge0BsaW5rICNsaW5rIGxpbmsoKX1cbiAqIG1ldGhvZCB3aWxsIHByb2Nlc3MgdGhlIGxpbmtzLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICpcbiAqICAgICB2YXIgYXV0b2xpbmtlciA9IG5ldyBBdXRvbGlua2VyKCB7XG4gKiAgICAgICAgIG5ld1dpbmRvdyA6IGZhbHNlLFxuICogICAgICAgICB0cnVuY2F0ZSAgOiAzMFxuICogICAgIH0gKTtcbiAqXG4gKiAgICAgdmFyIGh0bWwgPSBhdXRvbGlua2VyLmxpbmsoIFwiSm9lIHdlbnQgdG8gd3d3LnlhaG9vLmNvbVwiICk7XG4gKiAgICAgLy8gcHJvZHVjZXM6ICdKb2Ugd2VudCB0byA8YSBocmVmPVwiaHR0cDovL3d3dy55YWhvby5jb21cIj55YWhvby5jb208L2E+J1xuICpcbiAqXG4gKiBUaGUge0BsaW5rICNzdGF0aWMtbGluayBzdGF0aWMgbGluaygpfSBtZXRob2QgbWF5IGFsc28gYmUgdXNlZCB0byBpbmxpbmUgb3B0aW9ucyBpbnRvIGEgc2luZ2xlIGNhbGwsIHdoaWNoIG1heVxuICogYmUgbW9yZSBjb252ZW5pZW50IGZvciBvbmUtb2ZmIHVzZXMuIEZvciBleGFtcGxlOlxuICpcbiAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJKb2Ugd2VudCB0byB3d3cueWFob28uY29tXCIsIHtcbiAqICAgICAgICAgbmV3V2luZG93IDogZmFsc2UsXG4gKiAgICAgICAgIHRydW5jYXRlICA6IDMwXG4gKiAgICAgfSApO1xuICogICAgIC8vIHByb2R1Y2VzOiAnSm9lIHdlbnQgdG8gPGEgaHJlZj1cImh0dHA6Ly93d3cueWFob28uY29tXCI+eWFob28uY29tPC9hPidcbiAqXG4gKlxuICogIyMgQ3VzdG9tIFJlcGxhY2VtZW50cyBvZiBMaW5rc1xuICpcbiAqIElmIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZG8gbm90IHByb3ZpZGUgZW5vdWdoIGZsZXhpYmlsaXR5LCBhIHtAbGluayAjcmVwbGFjZUZufVxuICogbWF5IGJlIHByb3ZpZGVkIHRvIGZ1bGx5IGN1c3RvbWl6ZSB0aGUgb3V0cHV0IG9mIEF1dG9saW5rZXIuIFRoaXMgZnVuY3Rpb24gaXNcbiAqIGNhbGxlZCBvbmNlIGZvciBlYWNoIFVSTC9FbWFpbC9QaG9uZSMvVHdpdHRlciBIYW5kbGUvSGFzaHRhZyBtYXRjaCB0aGF0IGlzXG4gKiBlbmNvdW50ZXJlZC5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgICAgdmFyIGlucHV0ID0gXCIuLi5cIjsgIC8vIHN0cmluZyB3aXRoIFVSTHMsIEVtYWlsIEFkZHJlc3NlcywgUGhvbmUgI3MsIFR3aXR0ZXIgSGFuZGxlcywgYW5kIEhhc2h0YWdzXG4gKlxuICogICAgIHZhciBsaW5rZWRUZXh0ID0gQXV0b2xpbmtlci5saW5rKCBpbnB1dCwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJocmVmID0gXCIsIG1hdGNoLmdldEFuY2hvckhyZWYoKSApO1xuICogICAgICAgICAgICAgY29uc29sZS5sb2coIFwidGV4dCA9IFwiLCBtYXRjaC5nZXRBbmNob3JUZXh0KCkgKTtcbiAqXG4gKiAgICAgICAgICAgICBzd2l0Y2goIG1hdGNoLmdldFR5cGUoKSApIHtcbiAqICAgICAgICAgICAgICAgICBjYXNlICd1cmwnIDpcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwidXJsOiBcIiwgbWF0Y2guZ2V0VXJsKCkgKTtcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIGlmKCBtYXRjaC5nZXRVcmwoKS5pbmRleE9mKCAnbXlzaXRlLmNvbScgKSA9PT0gLTEgKSB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgdGFnID0gYXV0b2xpbmtlci5nZXRUYWdCdWlsZGVyKCkuYnVpbGQoIG1hdGNoICk7ICAvLyByZXR1cm5zIGFuIGBBdXRvbGlua2VyLkh0bWxUYWdgIGluc3RhbmNlLCB3aGljaCBwcm92aWRlcyBtdXRhdG9yIG1ldGhvZHMgZm9yIGVhc3kgY2hhbmdlc1xuICogICAgICAgICAgICAgICAgICAgICAgICAgdGFnLnNldEF0dHIoICdyZWwnLCAnbm9mb2xsb3cnICk7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuYWRkQ2xhc3MoICdleHRlcm5hbC1saW5rJyApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0YWc7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7ICAvLyBsZXQgQXV0b2xpbmtlciBwZXJmb3JtIGl0cyBub3JtYWwgYW5jaG9yIHRhZyByZXBsYWNlbWVudFxuICogICAgICAgICAgICAgICAgICAgICB9XG4gKlxuICogICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciBlbWFpbCA9IG1hdGNoLmdldEVtYWlsKCk7XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImVtYWlsOiBcIiwgZW1haWwgKTtcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIGlmKCBlbWFpbCA9PT0gXCJteUBvd24uYWRkcmVzc1wiICkge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlOyAgLy8gZG9uJ3QgYXV0by1saW5rIHRoaXMgcGFydGljdWxhciBlbWFpbCBhZGRyZXNzOyBsZWF2ZSBhcy1pc1xuICogICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAgLy8gbm8gcmV0dXJuIHZhbHVlIHdpbGwgaGF2ZSBBdXRvbGlua2VyIHBlcmZvcm0gaXRzIG5vcm1hbCBhbmNob3IgdGFnIHJlcGxhY2VtZW50IChzYW1lIGFzIHJldHVybmluZyBgdHJ1ZWApXG4gKiAgICAgICAgICAgICAgICAgICAgIH1cbiAqXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAncGhvbmUnIDpcbiAqICAgICAgICAgICAgICAgICAgICAgdmFyIHBob25lTnVtYmVyID0gbWF0Y2guZ2V0UGhvbmVOdW1iZXIoKTtcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIHBob25lTnVtYmVyICk7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vbmV3cGxhY2UudG8ubGluay5waG9uZS5udW1iZXJzLnRvL1wiPicgKyBwaG9uZU51bWJlciArICc8L2E+JztcbiAqXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAndHdpdHRlcicgOlxuICogICAgICAgICAgICAgICAgICAgICB2YXIgdHdpdHRlckhhbmRsZSA9IG1hdGNoLmdldFR3aXR0ZXJIYW5kbGUoKTtcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIHR3aXR0ZXJIYW5kbGUgKTtcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly9uZXdwbGFjZS50by5saW5rLnR3aXR0ZXIuaGFuZGxlcy50by9cIj4nICsgdHdpdHRlckhhbmRsZSArICc8L2E+JztcbiAqXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAnaGFzaHRhZycgOlxuICogICAgICAgICAgICAgICAgICAgICB2YXIgaGFzaHRhZyA9IG1hdGNoLmdldEhhc2h0YWcoKTtcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIGhhc2h0YWcgKTtcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly9uZXdwbGFjZS50by5saW5rLmhhc2h0YWcuaGFuZGxlcy50by9cIj4nICsgaGFzaHRhZyArICc8L2E+JztcbiAqICAgICAgICAgICAgIH1cbiAqICAgICAgICAgfVxuICogICAgIH0gKTtcbiAqXG4gKlxuICogVGhlIGZ1bmN0aW9uIG1heSByZXR1cm4gdGhlIGZvbGxvd2luZyB2YWx1ZXM6XG4gKlxuICogLSBgdHJ1ZWAgKEJvb2xlYW4pOiBBbGxvdyBBdXRvbGlua2VyIHRvIHJlcGxhY2UgdGhlIG1hdGNoIGFzIGl0IG5vcm1hbGx5IHdvdWxkLlxuICogLSBgZmFsc2VgIChCb29sZWFuKTogRG8gbm90IHJlcGxhY2UgdGhlIGN1cnJlbnQgbWF0Y2ggYXQgYWxsIC0gbGVhdmUgYXMtaXMuXG4gKiAtIEFueSBTdHJpbmc6IElmIGEgc3RyaW5nIGlzIHJldHVybmVkIGZyb20gdGhlIGZ1bmN0aW9uLCB0aGUgc3RyaW5nIHdpbGwgYmUgdXNlZCBkaXJlY3RseSBhcyB0aGUgcmVwbGFjZW1lbnQgSFRNTCBmb3JcbiAqICAgdGhlIG1hdGNoLlxuICogLSBBbiB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnfSBpbnN0YW5jZSwgd2hpY2ggY2FuIGJlIHVzZWQgdG8gYnVpbGQvbW9kaWZ5IGFuIEhUTUwgdGFnIGJlZm9yZSB3cml0aW5nIG91dCBpdHMgSFRNTCB0ZXh0LlxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IFtjZmddIFRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBBdXRvbGlua2VyIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuICovXG52YXIgQXV0b2xpbmtlciA9IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApOyAgLy8gYXNzaWduIHRoZSBwcm9wZXJ0aWVzIG9mIGBjZmdgIG9udG8gdGhlIEF1dG9saW5rZXIgaW5zdGFuY2UuIFByb3RvdHlwZSBwcm9wZXJ0aWVzIHdpbGwgYmUgdXNlZCBmb3IgbWlzc2luZyBjb25maWdzLlxuXG5cdC8vIFZhbGlkYXRlIHRoZSB2YWx1ZSBvZiB0aGUgYGhhc2h0YWdgIGNmZy5cblx0dmFyIGhhc2h0YWcgPSB0aGlzLmhhc2h0YWc7XG5cdGlmKCBoYXNodGFnICE9PSBmYWxzZSAmJiBoYXNodGFnICE9PSAndHdpdHRlcicgJiYgaGFzaHRhZyAhPT0gJ2ZhY2Vib29rJyAmJiBoYXNodGFnICE9PSAnaW5zdGFncmFtJyApIHtcblx0XHR0aHJvdyBuZXcgRXJyb3IoIFwiaW52YWxpZCBgaGFzaHRhZ2AgY2ZnIC0gc2VlIGRvY3NcIiApO1xuXHR9XG5cblx0Ly8gTm9ybWFsaXplIHRoZSBjb25maWdzXG5cdHRoaXMudXJscyAgICAgPSB0aGlzLm5vcm1hbGl6ZVVybHNDZmcoIHRoaXMudXJscyApO1xuXHR0aGlzLnRydW5jYXRlID0gdGhpcy5ub3JtYWxpemVUcnVuY2F0ZUNmZyggdGhpcy50cnVuY2F0ZSApO1xufTtcblxuQXV0b2xpbmtlci5wcm90b3R5cGUgPSB7XG5cdGNvbnN0cnVjdG9yIDogQXV0b2xpbmtlciwgIC8vIGZpeCBjb25zdHJ1Y3RvciBwcm9wZXJ0eVxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFuL09iamVjdH0gdXJsc1xuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgVVJMcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBsaW5rZWQsIGBmYWxzZWAgaWYgdGhleSBzaG91bGQgbm90XG5cdCAqIGJlLlxuXHQgKlxuXHQgKiBUaGlzIG9wdGlvbiBhbHNvIGFjY2VwdHMgYW4gT2JqZWN0IGZvcm0gd2l0aCAzIHByb3BlcnRpZXMsIHRvIGFsbG93IGZvclxuXHQgKiBtb3JlIGN1c3RvbWl6YXRpb24gb2Ygd2hhdCBleGFjdGx5IGdldHMgbGlua2VkLiBBbGwgZGVmYXVsdCB0byBgdHJ1ZWA6XG5cdCAqXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gc2NoZW1lTWF0Y2hlcyBgdHJ1ZWAgdG8gbWF0Y2ggVVJMcyBmb3VuZCBwcmVmaXhlZCB3aXRoIGFcblx0ICogICBzY2hlbWUsIGkuZS4gYGh0dHA6Ly9nb29nbGUuY29tYCwgb3IgYG90aGVyK3NjaGVtZTovL2dvb2dsZS5jb21gLFxuXHQgKiAgIGBmYWxzZWAgdG8gcHJldmVudCB0aGVzZSB0eXBlcyBvZiBtYXRjaGVzLlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHd3d01hdGNoZXMgYHRydWVgIHRvIG1hdGNoIHVybHMgZm91bmQgcHJlZml4ZWQgd2l0aFxuXHQgKiAgIGAnd3d3LidgLCBpLmUuIGB3d3cuZ29vZ2xlLmNvbWAuIGBmYWxzZWAgdG8gcHJldmVudCB0aGVzZSB0eXBlcyBvZlxuXHQgKiAgIG1hdGNoZXMuIE5vdGUgdGhhdCBpZiB0aGUgVVJMIGhhZCBhIHByZWZpeGVkIHNjaGVtZSwgYW5kXG5cdCAqICAgYHNjaGVtZU1hdGNoZXNgIGlzIHRydWUsIGl0IHdpbGwgc3RpbGwgYmUgbGlua2VkLlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHRsZE1hdGNoZXMgYHRydWVgIHRvIG1hdGNoIFVSTHMgd2l0aCBrbm93biB0b3AgbGV2ZWxcblx0ICogICBkb21haW5zICguY29tLCAubmV0LCBldGMuKSB0aGF0IGFyZSBub3QgcHJlZml4ZWQgd2l0aCBhIHNjaGVtZSBvclxuXHQgKiAgIGAnd3d3LidgLiBUaGlzIG9wdGlvbiBhdHRlbXB0cyB0byBtYXRjaCBhbnl0aGluZyB0aGF0IGxvb2tzIGxpa2UgYSBVUkxcblx0ICogICBpbiB0aGUgZ2l2ZW4gdGV4dC4gRXg6IGBnb29nbGUuY29tYCwgYGFzZGYub3JnLz9wYWdlPTFgLCBldGMuIGBmYWxzZWBcblx0ICogICB0byBwcmV2ZW50IHRoZXNlIHR5cGVzIG9mIG1hdGNoZXMuXG5cdCAqL1xuXHR1cmxzIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gZW1haWxcblx0ICpcblx0ICogYHRydWVgIGlmIGVtYWlsIGFkZHJlc3NlcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBsaW5rZWQsIGBmYWxzZWAgaWYgdGhleVxuXHQgKiBzaG91bGQgbm90IGJlLlxuXHQgKi9cblx0ZW1haWwgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSB0d2l0dGVyXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiBUd2l0dGVyIGhhbmRsZXMgKFwiQGV4YW1wbGVcIikgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbGlua2VkLFxuXHQgKiBgZmFsc2VgIGlmIHRoZXkgc2hvdWxkIG5vdCBiZS5cblx0ICovXG5cdHR3aXR0ZXIgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBwaG9uZVxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgUGhvbmUgbnVtYmVycyAoXCIoNTU1KTU1NS01NTU1XCIpIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCxcblx0ICogYGZhbHNlYCBpZiB0aGV5IHNob3VsZCBub3QgYmUuXG5cdCAqL1xuXHRwaG9uZTogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbi9TdHJpbmd9IGhhc2h0YWdcblx0ICpcblx0ICogQSBzdHJpbmcgZm9yIHRoZSBzZXJ2aWNlIG5hbWUgdG8gaGF2ZSBoYXNodGFncyAoZXg6IFwiI215SGFzaHRhZ1wiKVxuXHQgKiBhdXRvLWxpbmtlZCB0by4gVGhlIGN1cnJlbnRseS1zdXBwb3J0ZWQgdmFsdWVzIGFyZTpcblx0ICpcblx0ICogLSAndHdpdHRlcidcblx0ICogLSAnZmFjZWJvb2snXG5cdCAqIC0gJ2luc3RhZ3JhbSdcblx0ICpcblx0ICogUGFzcyBgZmFsc2VgIHRvIHNraXAgYXV0by1saW5raW5nIG9mIGhhc2h0YWdzLlxuXHQgKi9cblx0aGFzaHRhZyA6IGZhbHNlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBuZXdXaW5kb3dcblx0ICpcblx0ICogYHRydWVgIGlmIHRoZSBsaW5rcyBzaG91bGQgb3BlbiBpbiBhIG5ldyB3aW5kb3csIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0bmV3V2luZG93IDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gc3RyaXBQcmVmaXhcblx0ICpcblx0ICogYHRydWVgIGlmICdodHRwOi8vJyBvciAnaHR0cHM6Ly8nIGFuZC9vciB0aGUgJ3d3dy4nIHNob3VsZCBiZSBzdHJpcHBlZFxuXHQgKiBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgVVJMIGxpbmtzJyB0ZXh0LCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdHN0cmlwUHJlZml4IDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7TnVtYmVyL09iamVjdH0gdHJ1bmNhdGVcblx0ICpcblx0ICogIyMgTnVtYmVyIEZvcm1cblx0ICpcblx0ICogQSBudW1iZXIgZm9yIGhvdyBtYW55IGNoYXJhY3RlcnMgbWF0Y2hlZCB0ZXh0IHNob3VsZCBiZSB0cnVuY2F0ZWQgdG9cblx0ICogaW5zaWRlIHRoZSB0ZXh0IG9mIGEgbGluay4gSWYgdGhlIG1hdGNoZWQgdGV4dCBpcyBvdmVyIHRoaXMgbnVtYmVyIG9mXG5cdCAqIGNoYXJhY3RlcnMsIGl0IHdpbGwgYmUgdHJ1bmNhdGVkIHRvIHRoaXMgbGVuZ3RoIGJ5IGFkZGluZyBhIHR3byBwZXJpb2Rcblx0ICogZWxsaXBzaXMgKCcuLicpIHRvIHRoZSBlbmQgb2YgdGhlIHN0cmluZy5cblx0ICpcblx0ICogRm9yIGV4YW1wbGU6IEEgdXJsIGxpa2UgJ2h0dHA6Ly93d3cueWFob28uY29tL3NvbWUvbG9uZy9wYXRoL3RvL2EvZmlsZSdcblx0ICogdHJ1bmNhdGVkIHRvIDI1IGNoYXJhY3RlcnMgbWlnaHQgbG9vayBzb21ldGhpbmcgbGlrZSB0aGlzOlxuXHQgKiAneWFob28uY29tL3NvbWUvbG9uZy9wYXQuLidcblx0ICpcblx0ICogRXhhbXBsZSBVc2FnZTpcblx0ICpcblx0ICogICAgIHRydW5jYXRlOiAyNVxuXHQgKlxuXHQgKlxuXHQgKiAjIyBPYmplY3QgRm9ybVxuXHQgKlxuXHQgKiBBbiBPYmplY3QgbWF5IGFsc28gYmUgcHJvdmlkZWQgd2l0aCB0d28gcHJvcGVydGllczogYGxlbmd0aGAgKE51bWJlcikgYW5kXG5cdCAqIGBsb2NhdGlvbmAgKFN0cmluZykuIGBsb2NhdGlvbmAgbWF5IGJlIG9uZSBvZiB0aGUgZm9sbG93aW5nOiAnZW5kJ1xuXHQgKiAoZGVmYXVsdCksICdtaWRkbGUnLCBvciAnc21hcnQnLlxuXHQgKlxuXHQgKiBFeGFtcGxlIFVzYWdlOlxuXHQgKlxuXHQgKiAgICAgdHJ1bmNhdGU6IHsgbGVuZ3RoOiAyNSwgbG9jYXRpb246ICdtaWRkbGUnIH1cblx0ICpcblx0ICogQGNmZyB7TnVtYmVyfSB0cnVuY2F0ZS5sZW5ndGggSG93IG1hbnkgY2hhcmFjdGVycyB0byBhbGxvdyBiZWZvcmVcblx0ICogICB0cnVuY2F0aW9uIHdpbGwgb2NjdXIuXG5cdCAqIEBjZmcge1wiZW5kXCIvXCJtaWRkbGVcIi9cInNtYXJ0XCJ9IFt0cnVuY2F0ZS5sb2NhdGlvbj1cImVuZFwiXVxuXHQgKlxuXHQgKiAtICdlbmQnIChkZWZhdWx0KTogd2lsbCB0cnVuY2F0ZSB1cCB0byB0aGUgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIGFuZCB0aGVuXG5cdCAqICAgYWRkIGFuIGVsbGlwc2lzIGF0IHRoZSBlbmQuIEV4OiAneWFob28uY29tL3NvbWUvbG9uZy9wYXQuLidcblx0ICogLSAnbWlkZGxlJzogd2lsbCB0cnVuY2F0ZSBhbmQgYWRkIHRoZSBlbGxpcHNpcyBpbiB0aGUgbWlkZGxlLiBFeDpcblx0ICogICAneWFob28uY29tL3MuLnRoL3RvL2EvZmlsZSdcblx0ICogLSAnc21hcnQnOiBmb3IgVVJMcyB3aGVyZSB0aGUgYWxnb3JpdGhtIGF0dGVtcHRzIHRvIHN0cmlwIG91dCB1bm5lY2Vzc2FyeVxuXHQgKiAgIHBhcnRzIGZpcnN0IChzdWNoIGFzIHRoZSAnd3d3LicsIHRoZW4gVVJMIHNjaGVtZSwgaGFzaCwgZXRjLiksXG5cdCAqICAgYXR0ZW1wdGluZyB0byBtYWtlIHRoZSBVUkwgaHVtYW4tcmVhZGFibGUgYmVmb3JlIGxvb2tpbmcgZm9yIGEgZ29vZFxuXHQgKiAgIHBvaW50IHRvIGluc2VydCB0aGUgZWxsaXBzaXMgaWYgaXQgaXMgc3RpbGwgdG9vIGxvbmcuIEV4OlxuXHQgKiAgICd5YWhvby5jb20vc29tZS4udG8vYS9maWxlJy4gRm9yIG1vcmUgZGV0YWlscywgc2VlXG5cdCAqICAge0BsaW5rIEF1dG9saW5rZXIudHJ1bmNhdGUuVHJ1bmNhdGVTbWFydH0uXG5cdCAqL1xuXHR0cnVuY2F0ZSA6IHVuZGVmaW5lZCxcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBjbGFzc05hbWVcblx0ICpcblx0ICogQSBDU1MgY2xhc3MgbmFtZSB0byBhZGQgdG8gdGhlIGdlbmVyYXRlZCBsaW5rcy4gVGhpcyBjbGFzcyB3aWxsIGJlIGFkZGVkIHRvIGFsbCBsaW5rcywgYXMgd2VsbCBhcyB0aGlzIGNsYXNzXG5cdCAqIHBsdXMgbWF0Y2ggc3VmZml4ZXMgZm9yIHN0eWxpbmcgdXJsL2VtYWlsL3Bob25lL3R3aXR0ZXIvaGFzaHRhZyBsaW5rcyBkaWZmZXJlbnRseS5cblx0ICpcblx0ICogRm9yIGV4YW1wbGUsIGlmIHRoaXMgY29uZmlnIGlzIHByb3ZpZGVkIGFzIFwibXlMaW5rXCIsIHRoZW46XG5cdCAqXG5cdCAqIC0gVVJMIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay11cmxcIlxuXHQgKiAtIEVtYWlsIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay1lbWFpbFwiLCBhbmRcblx0ICogLSBUd2l0dGVyIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay10d2l0dGVyXCJcblx0ICogLSBQaG9uZSBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstcGhvbmVcIlxuXHQgKiAtIEhhc2h0YWcgbGlua3Mgd2lsbCBoYXZlIHRoZSBDU1MgY2xhc3NlczogXCJteUxpbmsgbXlMaW5rLWhhc2h0YWdcIlxuXHQgKi9cblx0Y2xhc3NOYW1lIDogXCJcIixcblxuXHQvKipcblx0ICogQGNmZyB7RnVuY3Rpb259IHJlcGxhY2VGblxuXHQgKlxuXHQgKiBBIGZ1bmN0aW9uIHRvIGluZGl2aWR1YWxseSBwcm9jZXNzIGVhY2ggbWF0Y2ggZm91bmQgaW4gdGhlIGlucHV0IHN0cmluZy5cblx0ICpcblx0ICogU2VlIHRoZSBjbGFzcydzIGRlc2NyaXB0aW9uIGZvciB1c2FnZS5cblx0ICpcblx0ICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnM6XG5cdCAqXG5cdCAqIEBjZmcge0F1dG9saW5rZXJ9IHJlcGxhY2VGbi5hdXRvbGlua2VyIFRoZSBBdXRvbGlua2VyIGluc3RhbmNlLCB3aGljaCBtYXkgYmUgdXNlZCB0byByZXRyaWV2ZSBjaGlsZCBvYmplY3RzIGZyb20gKHN1Y2hcblx0ICogICBhcyB0aGUgaW5zdGFuY2UncyB7QGxpbmsgI2dldFRhZ0J1aWxkZXIgdGFnIGJ1aWxkZXJ9KS5cblx0ICogQGNmZyB7QXV0b2xpbmtlci5tYXRjaC5NYXRjaH0gcmVwbGFjZUZuLm1hdGNoIFRoZSBNYXRjaCBpbnN0YW5jZSB3aGljaCBjYW4gYmUgdXNlZCB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGVcblx0ICogICBtYXRjaCB0aGF0IHRoZSBgcmVwbGFjZUZuYCBpcyBjdXJyZW50bHkgcHJvY2Vzc2luZy4gU2VlIHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSBzdWJjbGFzc2VzIGZvciBkZXRhaWxzLlxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfSBodG1sUGFyc2VyXG5cdCAqXG5cdCAqIFRoZSBIdG1sUGFyc2VyIGluc3RhbmNlIHVzZWQgdG8gc2tpcCBvdmVyIEhUTUwgdGFncywgd2hpbGUgZmluZGluZyB0ZXh0IG5vZGVzIHRvIHByb2Nlc3MuIFRoaXMgaXMgbGF6aWx5IGluc3RhbnRpYXRlZFxuXHQgKiBpbiB0aGUge0BsaW5rICNnZXRIdG1sUGFyc2VyfSBtZXRob2QuXG5cdCAqL1xuXHRodG1sUGFyc2VyIDogdW5kZWZpbmVkLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXJ9IG1hdGNoUGFyc2VyXG5cdCAqXG5cdCAqIFRoZSBNYXRjaFBhcnNlciBpbnN0YW5jZSB1c2VkIHRvIGZpbmQgbWF0Y2hlcyBpbiB0aGUgdGV4dCBub2RlcyBvZiBhbiBpbnB1dCBzdHJpbmcgcGFzc2VkIHRvXG5cdCAqIHtAbGluayAjbGlua30uIFRoaXMgaXMgbGF6aWx5IGluc3RhbnRpYXRlZCBpbiB0aGUge0BsaW5rICNnZXRNYXRjaFBhcnNlcn0gbWV0aG9kLlxuXHQgKi9cblx0bWF0Y2hQYXJzZXIgOiB1bmRlZmluZWQsXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7QXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyfSB0YWdCdWlsZGVyXG5cdCAqXG5cdCAqIFRoZSBBbmNob3JUYWdCdWlsZGVyIGluc3RhbmNlIHVzZWQgdG8gYnVpbGQgbWF0Y2ggcmVwbGFjZW1lbnQgYW5jaG9yIHRhZ3MuIE5vdGU6IHRoaXMgaXMgbGF6aWx5IGluc3RhbnRpYXRlZFxuXHQgKiBpbiB0aGUge0BsaW5rICNnZXRUYWdCdWlsZGVyfSBtZXRob2QuXG5cdCAqL1xuXHR0YWdCdWlsZGVyIDogdW5kZWZpbmVkLFxuXG5cblx0LyoqXG5cdCAqIE5vcm1hbGl6ZXMgdGhlIHtAbGluayAjdXJsc30gY29uZmlnIGludG8gYW4gT2JqZWN0IHdpdGggMyBwcm9wZXJ0aWVzOlxuXHQgKiBgc2NoZW1lTWF0Y2hlc2AsIGB3d3dNYXRjaGVzYCwgYW5kIGB0bGRNYXRjaGVzYCwgYWxsIEJvb2xlYW5zLlxuXHQgKlxuXHQgKiBTZWUge0BsaW5rICN1cmxzfSBjb25maWcgZm9yIGRldGFpbHMuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbi9PYmplY3R9IHVybHNcblx0ICogQHJldHVybiB7T2JqZWN0fVxuXHQgKi9cblx0bm9ybWFsaXplVXJsc0NmZyA6IGZ1bmN0aW9uKCB1cmxzICkge1xuXHRcdGlmKCB0eXBlb2YgdXJscyA9PT0gJ2Jvb2xlYW4nICkge1xuXHRcdFx0cmV0dXJuIHsgc2NoZW1lTWF0Y2hlczogdXJscywgd3d3TWF0Y2hlczogdXJscywgdGxkTWF0Y2hlczogdXJscyB9O1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gQXV0b2xpbmtlci5VdGlsLmRlZmF1bHRzKCB1cmxzIHx8IHt9LCB7IHNjaGVtZU1hdGNoZXM6IHRydWUsIHd3d01hdGNoZXM6IHRydWUsIHRsZE1hdGNoZXM6IHRydWUgfSApO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBOb3JtYWxpemVzIHRoZSB7QGxpbmsgI3RydW5jYXRlfSBjb25maWcgaW50byBhbiBPYmplY3Qgd2l0aCAyIHByb3BlcnRpZXM6XG5cdCAqIGBsZW5ndGhgIChOdW1iZXIpLCBhbmQgYGxvY2F0aW9uYCAoU3RyaW5nKS5cblx0ICpcblx0ICogU2VlIHtAbGluayAjdHJ1bmNhdGV9IGNvbmZpZyBmb3IgZGV0YWlscy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtOdW1iZXIvT2JqZWN0fSB0cnVuY2F0ZVxuXHQgKiBAcmV0dXJuIHtPYmplY3R9XG5cdCAqL1xuXHRub3JtYWxpemVUcnVuY2F0ZUNmZyA6IGZ1bmN0aW9uKCB0cnVuY2F0ZSApIHtcblx0XHRpZiggdHlwZW9mIHRydW5jYXRlID09PSAnbnVtYmVyJyApIHtcblx0XHRcdHJldHVybiB7IGxlbmd0aDogdHJ1bmNhdGUsIGxvY2F0aW9uOiAnZW5kJyB9O1xuXG5cdFx0fSBlbHNlIHsgIC8vIG9iamVjdCwgb3IgdW5kZWZpbmVkL251bGxcblx0XHRcdHJldHVybiBBdXRvbGlua2VyLlV0aWwuZGVmYXVsdHMoIHRydW5jYXRlIHx8IHt9LCB7XG5cdFx0XHRcdGxlbmd0aCAgIDogTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZLFxuXHRcdFx0XHRsb2NhdGlvbiA6ICdlbmQnXG5cdFx0XHR9ICk7XG5cdFx0fVxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEF1dG9tYXRpY2FsbHkgbGlua3MgVVJMcywgRW1haWwgYWRkcmVzc2VzLCBQaG9uZSBudW1iZXJzLCBUd2l0dGVyXG5cdCAqIGhhbmRsZXMsIGFuZCBIYXNodGFncyBmb3VuZCBpbiB0aGUgZ2l2ZW4gY2h1bmsgb2YgSFRNTC4gRG9lcyBub3QgbGlua1xuXHQgKiBVUkxzIGZvdW5kIHdpdGhpbiBIVE1MIHRhZ3MuXG5cdCAqXG5cdCAqIEZvciBpbnN0YW5jZSwgaWYgZ2l2ZW4gdGhlIHRleHQ6IGBZb3Ugc2hvdWxkIGdvIHRvIGh0dHA6Ly93d3cueWFob28uY29tYCxcblx0ICogdGhlbiB0aGUgcmVzdWx0IHdpbGwgYmUgYFlvdSBzaG91bGQgZ28gdG9cblx0ICogJmx0O2EgaHJlZj1cImh0dHA6Ly93d3cueWFob28uY29tXCImZ3Q7aHR0cDovL3d3dy55YWhvby5jb20mbHQ7L2EmZ3Q7YFxuXHQgKlxuXHQgKiBUaGlzIG1ldGhvZCBmaW5kcyB0aGUgdGV4dCBhcm91bmQgYW55IEhUTUwgZWxlbWVudHMgaW4gdGhlIGlucHV0XG5cdCAqIGB0ZXh0T3JIdG1sYCwgd2hpY2ggd2lsbCBiZSB0aGUgdGV4dCB0aGF0IGlzIHByb2Nlc3NlZC4gQW55IG9yaWdpbmFsIEhUTUxcblx0ICogZWxlbWVudHMgd2lsbCBiZSBsZWZ0IGFzLWlzLCBhcyB3ZWxsIGFzIHRoZSB0ZXh0IHRoYXQgaXMgYWxyZWFkeSB3cmFwcGVkXG5cdCAqIGluIGFuY2hvciAoJmx0O2EmZ3Q7KSB0YWdzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dE9ySHRtbCBUaGUgSFRNTCBvciB0ZXh0IHRvIGF1dG9saW5rIG1hdGNoZXMgd2l0aGluXG5cdCAqICAgKGRlcGVuZGluZyBvbiBpZiB0aGUge0BsaW5rICN1cmxzfSwge0BsaW5rICNlbWFpbH0sIHtAbGluayAjcGhvbmV9LFxuXHQgKiAgIHtAbGluayAjdHdpdHRlcn0sIGFuZCB7QGxpbmsgI2hhc2h0YWd9IG9wdGlvbnMgYXJlIGVuYWJsZWQpLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBIVE1MLCB3aXRoIG1hdGNoZXMgYXV0b21hdGljYWxseSBsaW5rZWQuXG5cdCAqL1xuXHRsaW5rIDogZnVuY3Rpb24oIHRleHRPckh0bWwgKSB7XG5cdFx0aWYoICF0ZXh0T3JIdG1sICkgeyByZXR1cm4gXCJcIjsgfSAgLy8gaGFuZGxlIGBudWxsYCBhbmQgYHVuZGVmaW5lZGBcblxuXHRcdHZhciBodG1sUGFyc2VyID0gdGhpcy5nZXRIdG1sUGFyc2VyKCksXG5cdFx0ICAgIGh0bWxOb2RlcyA9IGh0bWxQYXJzZXIucGFyc2UoIHRleHRPckh0bWwgKSxcblx0XHQgICAgYW5jaG9yVGFnU3RhY2tDb3VudCA9IDAsICAvLyB1c2VkIHRvIG9ubHkgcHJvY2VzcyB0ZXh0IGFyb3VuZCBhbmNob3IgdGFncywgYW5kIGFueSBpbm5lciB0ZXh0L2h0bWwgdGhleSBtYXkgaGF2ZVxuXHRcdCAgICByZXN1bHRIdG1sID0gW107XG5cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gaHRtbE5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0dmFyIG5vZGUgPSBodG1sTm9kZXNbIGkgXSxcblx0XHRcdCAgICBub2RlVHlwZSA9IG5vZGUuZ2V0VHlwZSgpLFxuXHRcdFx0ICAgIG5vZGVUZXh0ID0gbm9kZS5nZXRUZXh0KCk7XG5cblx0XHRcdGlmKCBub2RlVHlwZSA9PT0gJ2VsZW1lbnQnICkge1xuXHRcdFx0XHQvLyBQcm9jZXNzIEhUTUwgbm9kZXMgaW4gdGhlIGlucHV0IGB0ZXh0T3JIdG1sYFxuXHRcdFx0XHRpZiggbm9kZS5nZXRUYWdOYW1lKCkgPT09ICdhJyApIHtcblx0XHRcdFx0XHRpZiggIW5vZGUuaXNDbG9zaW5nKCkgKSB7ICAvLyBpdCdzIHRoZSBzdGFydCA8YT4gdGFnXG5cdFx0XHRcdFx0XHRhbmNob3JUYWdTdGFja0NvdW50Kys7XG5cdFx0XHRcdFx0fSBlbHNlIHsgICAvLyBpdCdzIHRoZSBlbmQgPC9hPiB0YWdcblx0XHRcdFx0XHRcdGFuY2hvclRhZ1N0YWNrQ291bnQgPSBNYXRoLm1heCggYW5jaG9yVGFnU3RhY2tDb3VudCAtIDEsIDAgKTsgIC8vIGF0dGVtcHQgdG8gaGFuZGxlIGV4dHJhbmVvdXMgPC9hPiB0YWdzIGJ5IG1ha2luZyBzdXJlIHRoZSBzdGFjayBjb3VudCBuZXZlciBnb2VzIGJlbG93IDBcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBub2RlVGV4dCApOyAgLy8gbm93IGFkZCB0aGUgdGV4dCBvZiB0aGUgdGFnIGl0c2VsZiB2ZXJiYXRpbVxuXG5cdFx0XHR9IGVsc2UgaWYoIG5vZGVUeXBlID09PSAnZW50aXR5JyB8fCBub2RlVHlwZSA9PT0gJ2NvbW1lbnQnICkge1xuXHRcdFx0XHRyZXN1bHRIdG1sLnB1c2goIG5vZGVUZXh0ICk7ICAvLyBhcHBlbmQgSFRNTCBlbnRpdHkgbm9kZXMgKHN1Y2ggYXMgJyZuYnNwOycpIG9yIEhUTUwgY29tbWVudHMgKHN1Y2ggYXMgJzwhLS0gQ29tbWVudCAtLT4nKSB2ZXJiYXRpbVxuXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBQcm9jZXNzIHRleHQgbm9kZXMgaW4gdGhlIGlucHV0IGB0ZXh0T3JIdG1sYFxuXHRcdFx0XHRpZiggYW5jaG9yVGFnU3RhY2tDb3VudCA9PT0gMCApIHtcblx0XHRcdFx0XHQvLyBJZiB3ZSdyZSBub3Qgd2l0aGluIGFuIDxhPiB0YWcsIHByb2Nlc3MgdGhlIHRleHQgbm9kZSB0byBsaW5raWZ5XG5cdFx0XHRcdFx0dmFyIGxpbmtpZmllZFN0ciA9IHRoaXMubGlua2lmeVN0ciggbm9kZVRleHQgKTtcblx0XHRcdFx0XHRyZXN1bHRIdG1sLnB1c2goIGxpbmtpZmllZFN0ciApO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0Ly8gYHRleHRgIGlzIHdpdGhpbiBhbiA8YT4gdGFnLCBzaW1wbHkgYXBwZW5kIHRoZSB0ZXh0IC0gd2UgZG8gbm90IHdhbnQgdG8gYXV0b2xpbmsgYW55dGhpbmdcblx0XHRcdFx0XHQvLyBhbHJlYWR5IHdpdGhpbiBhbiA8YT4uLi48L2E+IHRhZ1xuXHRcdFx0XHRcdHJlc3VsdEh0bWwucHVzaCggbm9kZVRleHQgKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiByZXN1bHRIdG1sLmpvaW4oIFwiXCIgKTtcblx0fSxcblxuXHQvKipcblx0ICogUHJvY2VzcyB0aGUgdGV4dCB0aGF0IGxpZXMgaW4gYmV0d2VlbiBIVE1MIHRhZ3MsIHBlcmZvcm1pbmcgdGhlIGFuY2hvclxuXHQgKiB0YWcgcmVwbGFjZW1lbnRzIGZvciB0aGUgbWF0Y2hlcywgYW5kIHJldHVybnMgdGhlIHN0cmluZyB3aXRoIHRoZVxuXHQgKiByZXBsYWNlbWVudHMgbWFkZS5cblx0ICpcblx0ICogVGhpcyBtZXRob2QgZG9lcyB0aGUgYWN0dWFsIHdyYXBwaW5nIG9mIG1hdGNoZXMgd2l0aCBhbmNob3IgdGFncy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIG9mIHRleHQgdG8gYXV0by1saW5rLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB0ZXh0IHdpdGggYW5jaG9yIHRhZ3MgYXV0by1maWxsZWQuXG5cdCAqL1xuXHRsaW5raWZ5U3RyIDogZnVuY3Rpb24oIHN0ciApIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRNYXRjaFBhcnNlcigpLnJlcGxhY2UoIHN0ciwgdGhpcy5jcmVhdGVNYXRjaFJldHVyblZhbCwgdGhpcyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgdGhlIHJldHVybiBzdHJpbmcgdmFsdWUgZm9yIGEgZ2l2ZW4gbWF0Y2ggaW4gdGhlIGlucHV0IHN0cmluZyxcblx0ICogZm9yIHRoZSB7QGxpbmsgI2xpbmtpZnlTdHJ9IG1ldGhvZC5cblx0ICpcblx0ICogVGhpcyBtZXRob2QgaGFuZGxlcyB0aGUge0BsaW5rICNyZXBsYWNlRm59LCBpZiBvbmUgd2FzIHByb3ZpZGVkLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0F1dG9saW5rZXIubWF0Y2guTWF0Y2h9IG1hdGNoIFRoZSBNYXRjaCBvYmplY3QgdGhhdCByZXByZXNlbnRzIHRoZSBtYXRjaC5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgc3RyaW5nIHRoYXQgdGhlIGBtYXRjaGAgc2hvdWxkIGJlIHJlcGxhY2VkIHdpdGguIFRoaXMgaXMgdXN1YWxseSB0aGUgYW5jaG9yIHRhZyBzdHJpbmcsIGJ1dFxuXHQgKiAgIG1heSBiZSB0aGUgYG1hdGNoU3RyYCBpdHNlbGYgaWYgdGhlIG1hdGNoIGlzIG5vdCB0byBiZSByZXBsYWNlZC5cblx0ICovXG5cdGNyZWF0ZU1hdGNoUmV0dXJuVmFsIDogZnVuY3Rpb24oIG1hdGNoICkge1xuXHRcdC8vIEhhbmRsZSBhIGN1c3RvbSBgcmVwbGFjZUZuYCBiZWluZyBwcm92aWRlZFxuXHRcdHZhciByZXBsYWNlRm5SZXN1bHQ7XG5cdFx0aWYoIHRoaXMucmVwbGFjZUZuICkge1xuXHRcdFx0cmVwbGFjZUZuUmVzdWx0ID0gdGhpcy5yZXBsYWNlRm4uY2FsbCggdGhpcywgdGhpcywgbWF0Y2ggKTsgIC8vIEF1dG9saW5rZXIgaW5zdGFuY2UgaXMgdGhlIGNvbnRleHQsIGFuZCB0aGUgZmlyc3QgYXJnXG5cdFx0fVxuXG5cdFx0aWYoIHR5cGVvZiByZXBsYWNlRm5SZXN1bHQgPT09ICdzdHJpbmcnICkge1xuXHRcdFx0cmV0dXJuIHJlcGxhY2VGblJlc3VsdDsgIC8vIGByZXBsYWNlRm5gIHJldHVybmVkIGEgc3RyaW5nLCB1c2UgdGhhdFxuXG5cdFx0fSBlbHNlIGlmKCByZXBsYWNlRm5SZXN1bHQgPT09IGZhbHNlICkge1xuXHRcdFx0cmV0dXJuIG1hdGNoLmdldE1hdGNoZWRUZXh0KCk7ICAvLyBubyByZXBsYWNlbWVudCBmb3IgdGhlIG1hdGNoXG5cblx0XHR9IGVsc2UgaWYoIHJlcGxhY2VGblJlc3VsdCBpbnN0YW5jZW9mIEF1dG9saW5rZXIuSHRtbFRhZyApIHtcblx0XHRcdHJldHVybiByZXBsYWNlRm5SZXN1bHQudG9BbmNob3JTdHJpbmcoKTtcblxuXHRcdH0gZWxzZSB7ICAvLyByZXBsYWNlRm5SZXN1bHQgPT09IHRydWUsIG9yIG5vL3Vua25vd24gcmV0dXJuIHZhbHVlIGZyb20gZnVuY3Rpb25cblx0XHRcdC8vIFBlcmZvcm0gQXV0b2xpbmtlcidzIGRlZmF1bHQgYW5jaG9yIHRhZyBnZW5lcmF0aW9uXG5cdFx0XHR2YXIgdGFnQnVpbGRlciA9IHRoaXMuZ2V0VGFnQnVpbGRlcigpLFxuXHRcdFx0ICAgIGFuY2hvclRhZyA9IHRhZ0J1aWxkZXIuYnVpbGQoIG1hdGNoICk7ICAvLyByZXR1cm5zIGFuIEF1dG9saW5rZXIuSHRtbFRhZyBpbnN0YW5jZVxuXG5cdFx0XHRyZXR1cm4gYW5jaG9yVGFnLnRvQW5jaG9yU3RyaW5nKCk7XG5cdFx0fVxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIExhemlseSBpbnN0YW50aWF0ZXMgYW5kIHJldHVybnMgdGhlIHtAbGluayAjaHRtbFBhcnNlcn0gaW5zdGFuY2UgZm9yIHRoaXMgQXV0b2xpbmtlciBpbnN0YW5jZS5cblx0ICpcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn1cblx0ICovXG5cdGdldEh0bWxQYXJzZXIgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgaHRtbFBhcnNlciA9IHRoaXMuaHRtbFBhcnNlcjtcblxuXHRcdGlmKCAhaHRtbFBhcnNlciApIHtcblx0XHRcdGh0bWxQYXJzZXIgPSB0aGlzLmh0bWxQYXJzZXIgPSBuZXcgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXIoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaHRtbFBhcnNlcjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBMYXppbHkgaW5zdGFudGlhdGVzIGFuZCByZXR1cm5zIHRoZSB7QGxpbmsgI21hdGNoUGFyc2VyfSBpbnN0YW5jZSBmb3IgdGhpcyBBdXRvbGlua2VyIGluc3RhbmNlLlxuXHQgKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXJ9XG5cdCAqL1xuXHRnZXRNYXRjaFBhcnNlciA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBtYXRjaFBhcnNlciA9IHRoaXMubWF0Y2hQYXJzZXI7XG5cblx0XHRpZiggIW1hdGNoUGFyc2VyICkge1xuXHRcdFx0bWF0Y2hQYXJzZXIgPSB0aGlzLm1hdGNoUGFyc2VyID0gbmV3IEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXIoIHtcblx0XHRcdFx0dXJscyAgICAgICAgOiB0aGlzLnVybHMsXG5cdFx0XHRcdGVtYWlsICAgICAgIDogdGhpcy5lbWFpbCxcblx0XHRcdFx0dHdpdHRlciAgICAgOiB0aGlzLnR3aXR0ZXIsXG5cdFx0XHRcdHBob25lICAgICAgIDogdGhpcy5waG9uZSxcblx0XHRcdFx0aGFzaHRhZyAgICAgOiB0aGlzLmhhc2h0YWcsXG5cdFx0XHRcdHN0cmlwUHJlZml4IDogdGhpcy5zdHJpcFByZWZpeFxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiBtYXRjaFBhcnNlcjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB7QGxpbmsgI3RhZ0J1aWxkZXJ9IGluc3RhbmNlIGZvciB0aGlzIEF1dG9saW5rZXIgaW5zdGFuY2UsIGxhemlseSBpbnN0YW50aWF0aW5nIGl0XG5cdCAqIGlmIGl0IGRvZXMgbm90IHlldCBleGlzdC5cblx0ICpcblx0ICogVGhpcyBtZXRob2QgbWF5IGJlIHVzZWQgaW4gYSB7QGxpbmsgI3JlcGxhY2VGbn0gdG8gZ2VuZXJhdGUgdGhlIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWcgSHRtbFRhZ30gaW5zdGFuY2UgdGhhdFxuXHQgKiBBdXRvbGlua2VyIHdvdWxkIG5vcm1hbGx5IGdlbmVyYXRlLCBhbmQgdGhlbiBhbGxvdyBmb3IgbW9kaWZpY2F0aW9ucyBiZWZvcmUgcmV0dXJuaW5nIGl0LiBGb3IgZXhhbXBsZTpcblx0ICpcblx0ICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG5cdCAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuXHQgKiAgICAgICAgICAgICB2YXIgdGFnID0gYXV0b2xpbmtlci5nZXRUYWdCdWlsZGVyKCkuYnVpbGQoIG1hdGNoICk7ICAvLyByZXR1cm5zIGFuIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWd9IGluc3RhbmNlXG5cdCAqICAgICAgICAgICAgIHRhZy5zZXRBdHRyKCAncmVsJywgJ25vZm9sbG93JyApO1xuXHQgKlxuXHQgKiAgICAgICAgICAgICByZXR1cm4gdGFnO1xuXHQgKiAgICAgICAgIH1cblx0ICogICAgIH0gKTtcblx0ICpcblx0ICogICAgIC8vIGdlbmVyYXRlZCBodG1sOlxuXHQgKiAgICAgLy8gICBUZXN0IDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vZm9sbG93XCI+Z29vZ2xlLmNvbTwvYT5cblx0ICpcblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyfVxuXHQgKi9cblx0Z2V0VGFnQnVpbGRlciA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0YWdCdWlsZGVyID0gdGhpcy50YWdCdWlsZGVyO1xuXG5cdFx0aWYoICF0YWdCdWlsZGVyICkge1xuXHRcdFx0dGFnQnVpbGRlciA9IHRoaXMudGFnQnVpbGRlciA9IG5ldyBBdXRvbGlua2VyLkFuY2hvclRhZ0J1aWxkZXIoIHtcblx0XHRcdFx0bmV3V2luZG93ICAgOiB0aGlzLm5ld1dpbmRvdyxcblx0XHRcdFx0dHJ1bmNhdGUgICAgOiB0aGlzLnRydW5jYXRlLFxuXHRcdFx0XHRjbGFzc05hbWUgICA6IHRoaXMuY2xhc3NOYW1lXG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRhZ0J1aWxkZXI7XG5cdH1cblxufTtcblxuXG4vKipcbiAqIEF1dG9tYXRpY2FsbHkgbGlua3MgVVJMcywgRW1haWwgYWRkcmVzc2VzLCBQaG9uZSBOdW1iZXJzLCBUd2l0dGVyIGhhbmRsZXMsXG4gKiBhbmQgSGFzaHRhZ3MgZm91bmQgaW4gdGhlIGdpdmVuIGNodW5rIG9mIEhUTUwuIERvZXMgbm90IGxpbmsgVVJMcyBmb3VuZFxuICogd2l0aGluIEhUTUwgdGFncy5cbiAqXG4gKiBGb3IgaW5zdGFuY2UsIGlmIGdpdmVuIHRoZSB0ZXh0OiBgWW91IHNob3VsZCBnbyB0byBodHRwOi8vd3d3LnlhaG9vLmNvbWAsXG4gKiB0aGVuIHRoZSByZXN1bHQgd2lsbCBiZSBgWW91IHNob3VsZCBnbyB0byAmbHQ7YSBocmVmPVwiaHR0cDovL3d3dy55YWhvby5jb21cIiZndDtodHRwOi8vd3d3LnlhaG9vLmNvbSZsdDsvYSZndDtgXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiAgICAgdmFyIGxpbmtlZFRleHQgPSBBdXRvbGlua2VyLmxpbmsoIFwiR28gdG8gZ29vZ2xlLmNvbVwiLCB7IG5ld1dpbmRvdzogZmFsc2UgfSApO1xuICogICAgIC8vIFByb2R1Y2VzOiBcIkdvIHRvIDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiPmdvb2dsZS5jb208L2E+XCJcbiAqXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge1N0cmluZ30gdGV4dE9ySHRtbCBUaGUgSFRNTCBvciB0ZXh0IHRvIGZpbmQgbWF0Y2hlcyB3aXRoaW4gKGRlcGVuZGluZ1xuICogICBvbiBpZiB0aGUge0BsaW5rICN1cmxzfSwge0BsaW5rICNlbWFpbH0sIHtAbGluayAjcGhvbmV9LCB7QGxpbmsgI3R3aXR0ZXJ9LFxuICogICBhbmQge0BsaW5rICNoYXNodGFnfSBvcHRpb25zIGFyZSBlbmFibGVkKS5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gQW55IG9mIHRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBBdXRvbGlua2VyXG4gKiAgIGNsYXNzLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLiBTZWUgdGhlIGNsYXNzIGRlc2NyaXB0aW9uIGZvciBhblxuICogICBleGFtcGxlIGNhbGwuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBIVE1MIHRleHQsIHdpdGggbWF0Y2hlcyBhdXRvbWF0aWNhbGx5IGxpbmtlZC5cbiAqL1xuQXV0b2xpbmtlci5saW5rID0gZnVuY3Rpb24oIHRleHRPckh0bWwsIG9wdGlvbnMgKSB7XG5cdHZhciBhdXRvbGlua2VyID0gbmV3IEF1dG9saW5rZXIoIG9wdGlvbnMgKTtcblx0cmV0dXJuIGF1dG9saW5rZXIubGluayggdGV4dE9ySHRtbCApO1xufTtcblxuXG4vLyBBdXRvbGlua2VyIE5hbWVzcGFjZXNcbkF1dG9saW5rZXIubWF0Y2ggPSB7fTtcbkF1dG9saW5rZXIuaHRtbFBhcnNlciA9IHt9O1xuQXV0b2xpbmtlci5tYXRjaFBhcnNlciA9IHt9O1xuQXV0b2xpbmtlci50cnVuY2F0ZSA9IHt9O1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKmpzaGludCBlcW51bGw6dHJ1ZSwgYm9zczp0cnVlICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLlV0aWxcbiAqIEBzaW5nbGV0b25cbiAqXG4gKiBBIGZldyB1dGlsaXR5IG1ldGhvZHMgZm9yIEF1dG9saW5rZXIuXG4gKi9cbkF1dG9saW5rZXIuVXRpbCA9IHtcblxuXHQvKipcblx0ICogQHByb3BlcnR5IHtGdW5jdGlvbn0gYWJzdHJhY3RNZXRob2Rcblx0ICpcblx0ICogQSBmdW5jdGlvbiBvYmplY3Qgd2hpY2ggcmVwcmVzZW50cyBhbiBhYnN0cmFjdCBtZXRob2QuXG5cdCAqL1xuXHRhYnN0cmFjdE1ldGhvZCA6IGZ1bmN0aW9uKCkgeyB0aHJvdyBcImFic3RyYWN0XCI7IH0sXG5cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHRyaW1SZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gdHJpbSB0aGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZVxuXHQgKiBmcm9tIGEgc3RyaW5nLlxuXHQgKi9cblx0dHJpbVJlZ2V4IDogL15bXFxzXFx1RkVGRlxceEEwXSt8W1xcc1xcdUZFRkZcXHhBMF0rJC9nLFxuXG5cblx0LyoqXG5cdCAqIEFzc2lnbnMgKHNoYWxsb3cgY29waWVzKSB0aGUgcHJvcGVydGllcyBvZiBgc3JjYCBvbnRvIGBkZXN0YC5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGRlc3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cblx0ICogQHBhcmFtIHtPYmplY3R9IHNyYyBUaGUgc291cmNlIG9iamVjdC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZGVzdGluYXRpb24gb2JqZWN0IChgZGVzdGApXG5cdCAqL1xuXHRhc3NpZ24gOiBmdW5jdGlvbiggZGVzdCwgc3JjICkge1xuXHRcdGZvciggdmFyIHByb3AgaW4gc3JjICkge1xuXHRcdFx0aWYoIHNyYy5oYXNPd25Qcm9wZXJ0eSggcHJvcCApICkge1xuXHRcdFx0XHRkZXN0WyBwcm9wIF0gPSBzcmNbIHByb3AgXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZGVzdDtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBBc3NpZ25zIChzaGFsbG93IGNvcGllcykgdGhlIHByb3BlcnRpZXMgb2YgYHNyY2Agb250byBgZGVzdGAsIGlmIHRoZVxuXHQgKiBjb3JyZXNwb25kaW5nIHByb3BlcnR5IG9uIGBkZXN0YCA9PT0gYHVuZGVmaW5lZGAuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBzcmMgVGhlIHNvdXJjZSBvYmplY3QuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGRlc3RpbmF0aW9uIG9iamVjdCAoYGRlc3RgKVxuXHQgKi9cblx0ZGVmYXVsdHMgOiBmdW5jdGlvbiggZGVzdCwgc3JjICkge1xuXHRcdGZvciggdmFyIHByb3AgaW4gc3JjICkge1xuXHRcdFx0aWYoIHNyYy5oYXNPd25Qcm9wZXJ0eSggcHJvcCApICYmIGRlc3RbIHByb3AgXSA9PT0gdW5kZWZpbmVkICkge1xuXHRcdFx0XHRkZXN0WyBwcm9wIF0gPSBzcmNbIHByb3AgXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZGVzdDtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBFeHRlbmRzIGBzdXBlcmNsYXNzYCB0byBjcmVhdGUgYSBuZXcgc3ViY2xhc3MsIGFkZGluZyB0aGUgYHByb3RvUHJvcHNgIHRvIHRoZSBuZXcgc3ViY2xhc3MncyBwcm90b3R5cGUuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHN1cGVyY2xhc3MgVGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uIGZvciB0aGUgc3VwZXJjbGFzcy5cblx0ICogQHBhcmFtIHtPYmplY3R9IHByb3RvUHJvcHMgVGhlIG1ldGhvZHMvcHJvcGVydGllcyB0byBhZGQgdG8gdGhlIHN1YmNsYXNzJ3MgcHJvdG90eXBlLiBUaGlzIG1heSBjb250YWluIHRoZVxuXHQgKiAgIHNwZWNpYWwgcHJvcGVydHkgYGNvbnN0cnVjdG9yYCwgd2hpY2ggd2lsbCBiZSB1c2VkIGFzIHRoZSBuZXcgc3ViY2xhc3MncyBjb25zdHJ1Y3RvciBmdW5jdGlvbi5cblx0ICogQHJldHVybiB7RnVuY3Rpb259IFRoZSBuZXcgc3ViY2xhc3MgZnVuY3Rpb24uXG5cdCAqL1xuXHRleHRlbmQgOiBmdW5jdGlvbiggc3VwZXJjbGFzcywgcHJvdG9Qcm9wcyApIHtcblx0XHR2YXIgc3VwZXJjbGFzc1Byb3RvID0gc3VwZXJjbGFzcy5wcm90b3R5cGU7XG5cblx0XHR2YXIgRiA9IGZ1bmN0aW9uKCkge307XG5cdFx0Ri5wcm90b3R5cGUgPSBzdXBlcmNsYXNzUHJvdG87XG5cblx0XHR2YXIgc3ViY2xhc3M7XG5cdFx0aWYoIHByb3RvUHJvcHMuaGFzT3duUHJvcGVydHkoICdjb25zdHJ1Y3RvcicgKSApIHtcblx0XHRcdHN1YmNsYXNzID0gcHJvdG9Qcm9wcy5jb25zdHJ1Y3Rvcjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3ViY2xhc3MgPSBmdW5jdGlvbigpIHsgc3VwZXJjbGFzc1Byb3RvLmNvbnN0cnVjdG9yLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTsgfTtcblx0XHR9XG5cblx0XHR2YXIgc3ViY2xhc3NQcm90byA9IHN1YmNsYXNzLnByb3RvdHlwZSA9IG5ldyBGKCk7ICAvLyBzZXQgdXAgcHJvdG90eXBlIGNoYWluXG5cdFx0c3ViY2xhc3NQcm90by5jb25zdHJ1Y3RvciA9IHN1YmNsYXNzOyAgLy8gZml4IGNvbnN0cnVjdG9yIHByb3BlcnR5XG5cdFx0c3ViY2xhc3NQcm90by5zdXBlcmNsYXNzID0gc3VwZXJjbGFzc1Byb3RvO1xuXG5cdFx0ZGVsZXRlIHByb3RvUHJvcHMuY29uc3RydWN0b3I7ICAvLyBkb24ndCByZS1hc3NpZ24gY29uc3RydWN0b3IgcHJvcGVydHkgdG8gdGhlIHByb3RvdHlwZSwgc2luY2UgYSBuZXcgZnVuY3Rpb24gbWF5IGhhdmUgYmVlbiBjcmVhdGVkIChgc3ViY2xhc3NgKSwgd2hpY2ggaXMgbm93IGFscmVhZHkgdGhlcmVcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCBzdWJjbGFzc1Byb3RvLCBwcm90b1Byb3BzICk7XG5cblx0XHRyZXR1cm4gc3ViY2xhc3M7XG5cdH0sXG5cblxuXHQvKipcblx0ICogVHJ1bmNhdGVzIHRoZSBgc3RyYCBhdCBgbGVuIC0gZWxsaXBzaXNDaGFycy5sZW5ndGhgLCBhbmQgYWRkcyB0aGUgYGVsbGlwc2lzQ2hhcnNgIHRvIHRoZVxuXHQgKiBlbmQgb2YgdGhlIHN0cmluZyAoYnkgZGVmYXVsdCwgdHdvIHBlcmlvZHM6ICcuLicpLiBJZiB0aGUgYHN0cmAgbGVuZ3RoIGRvZXMgbm90IGV4Y2VlZFxuXHQgKiBgbGVuYCwgdGhlIHN0cmluZyB3aWxsIGJlIHJldHVybmVkIHVuY2hhbmdlZC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIHRydW5jYXRlIGFuZCBhZGQgYW4gZWxsaXBzaXMgdG8uXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSB0cnVuY2F0ZUxlbiBUaGUgbGVuZ3RoIHRvIHRydW5jYXRlIHRoZSBzdHJpbmcgYXQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBbZWxsaXBzaXNDaGFycz0uLl0gVGhlIGVsbGlwc2lzIGNoYXJhY3RlcihzKSB0byBhZGQgdG8gdGhlIGVuZCBvZiBgc3RyYFxuXHQgKiAgIHdoZW4gdHJ1bmNhdGVkLiBEZWZhdWx0cyB0byAnLi4nXG5cdCAqL1xuXHRlbGxpcHNpcyA6IGZ1bmN0aW9uKCBzdHIsIHRydW5jYXRlTGVuLCBlbGxpcHNpc0NoYXJzICkge1xuXHRcdGlmKCBzdHIubGVuZ3RoID4gdHJ1bmNhdGVMZW4gKSB7XG5cdFx0XHRlbGxpcHNpc0NoYXJzID0gKCBlbGxpcHNpc0NoYXJzID09IG51bGwgKSA/ICcuLicgOiBlbGxpcHNpc0NoYXJzO1xuXHRcdFx0c3RyID0gc3RyLnN1YnN0cmluZyggMCwgdHJ1bmNhdGVMZW4gLSBlbGxpcHNpc0NoYXJzLmxlbmd0aCApICsgZWxsaXBzaXNDaGFycztcblx0XHR9XG5cdFx0cmV0dXJuIHN0cjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTdXBwb3J0cyBgQXJyYXkucHJvdG90eXBlLmluZGV4T2YoKWAgZnVuY3Rpb25hbGl0eSBmb3Igb2xkIElFIChJRTggYW5kIGJlbG93KS5cblx0ICpcblx0ICogQHBhcmFtIHtBcnJheX0gYXJyIFRoZSBhcnJheSB0byBmaW5kIGFuIGVsZW1lbnQgb2YuXG5cdCAqIEBwYXJhbSB7Kn0gZWxlbWVudCBUaGUgZWxlbWVudCB0byBmaW5kIGluIHRoZSBhcnJheSwgYW5kIHJldHVybiB0aGUgaW5kZXggb2YuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gVGhlIGluZGV4IG9mIHRoZSBgZWxlbWVudGAsIG9yIC0xIGlmIGl0IHdhcyBub3QgZm91bmQuXG5cdCAqL1xuXHRpbmRleE9mIDogZnVuY3Rpb24oIGFyciwgZWxlbWVudCApIHtcblx0XHRpZiggQXJyYXkucHJvdG90eXBlLmluZGV4T2YgKSB7XG5cdFx0XHRyZXR1cm4gYXJyLmluZGV4T2YoIGVsZW1lbnQgKTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gYXJyLmxlbmd0aDsgaSA8IGxlbjsgaSsrICkge1xuXHRcdFx0XHRpZiggYXJyWyBpIF0gPT09IGVsZW1lbnQgKSByZXR1cm4gaTtcblx0XHRcdH1cblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cdH0sXG5cblxuXG5cdC8qKlxuXHQgKiBQZXJmb3JtcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiB3aGF0IG1vZGVybiBicm93c2VycyBkbyB3aGVuIGBTdHJpbmcucHJvdG90eXBlLnNwbGl0KClgIGlzIGNhbGxlZFxuXHQgKiB3aXRoIGEgcmVndWxhciBleHByZXNzaW9uIHRoYXQgY29udGFpbnMgY2FwdHVyaW5nIHBhcmVudGhlc2lzLlxuXHQgKlxuXHQgKiBGb3IgZXhhbXBsZTpcblx0ICpcblx0ICogICAgIC8vIE1vZGVybiBicm93c2Vyczpcblx0ICogICAgIFwiYSxiLGNcIi5zcGxpdCggLygsKS8gKTsgIC8vIC0tPiBbICdhJywgJywnLCAnYicsICcsJywgJ2MnIF1cblx0ICpcblx0ICogICAgIC8vIE9sZCBJRSAoaW5jbHVkaW5nIElFOCk6XG5cdCAqICAgICBcImEsYixjXCIuc3BsaXQoIC8oLCkvICk7ICAvLyAtLT4gWyAnYScsICdiJywgJ2MnIF1cblx0ICpcblx0ICogVGhpcyBtZXRob2QgZW11bGF0ZXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2YgbW9kZXJuIGJyb3dzZXJzIGZvciB0aGUgb2xkIElFIGNhc2UuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byBzcGxpdC5cblx0ICogQHBhcmFtIHtSZWdFeHB9IHNwbGl0UmVnZXggVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0byBzcGxpdCB0aGUgaW5wdXQgYHN0cmAgb24uIFRoZSBzcGxpdHRpbmdcblx0ICogICBjaGFyYWN0ZXIocykgd2lsbCBiZSBzcGxpY2VkIGludG8gdGhlIGFycmF5LCBhcyBpbiB0aGUgXCJtb2Rlcm4gYnJvd3NlcnNcIiBleGFtcGxlIGluIHRoZVxuXHQgKiAgIGRlc2NyaXB0aW9uIG9mIHRoaXMgbWV0aG9kLlxuXHQgKiAgIE5vdGUgIzE6IHRoZSBzdXBwbGllZCByZWd1bGFyIGV4cHJlc3Npb24gKiptdXN0KiogaGF2ZSB0aGUgJ2cnIGZsYWcgc3BlY2lmaWVkLlxuXHQgKiAgIE5vdGUgIzI6IGZvciBzaW1wbGljaXR5J3Mgc2FrZSwgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBkb2VzIG5vdCBuZWVkXG5cdCAqICAgdG8gY29udGFpbiBjYXB0dXJpbmcgcGFyZW50aGVzaXMgLSBpdCB3aWxsIGJlIGFzc3VtZWQgdGhhdCBhbnkgbWF0Y2ggaGFzIHRoZW0uXG5cdCAqIEByZXR1cm4ge1N0cmluZ1tdfSBUaGUgc3BsaXQgYXJyYXkgb2Ygc3RyaW5ncywgd2l0aCB0aGUgc3BsaXR0aW5nIGNoYXJhY3RlcihzKSBpbmNsdWRlZC5cblx0ICovXG5cdHNwbGl0QW5kQ2FwdHVyZSA6IGZ1bmN0aW9uKCBzdHIsIHNwbGl0UmVnZXggKSB7XG5cdFx0aWYoICFzcGxpdFJlZ2V4Lmdsb2JhbCApIHRocm93IG5ldyBFcnJvciggXCJgc3BsaXRSZWdleGAgbXVzdCBoYXZlIHRoZSAnZycgZmxhZyBzZXRcIiApO1xuXG5cdFx0dmFyIHJlc3VsdCA9IFtdLFxuXHRcdCAgICBsYXN0SWR4ID0gMCxcblx0XHQgICAgbWF0Y2g7XG5cblx0XHR3aGlsZSggbWF0Y2ggPSBzcGxpdFJlZ2V4LmV4ZWMoIHN0ciApICkge1xuXHRcdFx0cmVzdWx0LnB1c2goIHN0ci5zdWJzdHJpbmcoIGxhc3RJZHgsIG1hdGNoLmluZGV4ICkgKTtcblx0XHRcdHJlc3VsdC5wdXNoKCBtYXRjaFsgMCBdICk7ICAvLyBwdXNoIHRoZSBzcGxpdHRpbmcgY2hhcihzKVxuXG5cdFx0XHRsYXN0SWR4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFsgMCBdLmxlbmd0aDtcblx0XHR9XG5cdFx0cmVzdWx0LnB1c2goIHN0ci5zdWJzdHJpbmcoIGxhc3RJZHggKSApO1xuXG5cdFx0cmV0dXJuIHJlc3VsdDtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBUcmltcyB0aGUgbGVhZGluZyBhbmQgdHJhaWxpbmcgd2hpdGVzcGFjZSBmcm9tIGEgc3RyaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gdHJpbS5cblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0dHJpbSA6IGZ1bmN0aW9uKCBzdHIgKSB7XG5cdFx0cmV0dXJuIHN0ci5yZXBsYWNlKCB0aGlzLnRyaW1SZWdleCwgJycgKTtcblx0fVxuXG59O1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLypqc2hpbnQgYm9zczp0cnVlICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLkh0bWxUYWdcbiAqIEBleHRlbmRzIE9iamVjdFxuICpcbiAqIFJlcHJlc2VudHMgYW4gSFRNTCB0YWcsIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGVhc2lseSBidWlsZC9tb2RpZnkgSFRNTCB0YWdzIHByb2dyYW1tYXRpY2FsbHkuXG4gKlxuICogQXV0b2xpbmtlciB1c2VzIHRoaXMgYWJzdHJhY3Rpb24gdG8gY3JlYXRlIEhUTUwgdGFncywgYW5kIHRoZW4gd3JpdGUgdGhlbSBvdXQgYXMgc3RyaW5ncy4gWW91IG1heSBhbHNvIHVzZVxuICogdGhpcyBjbGFzcyBpbiB5b3VyIGNvZGUsIGVzcGVjaWFsbHkgd2l0aGluIGEge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0uXG4gKlxuICogIyMgRXhhbXBsZXNcbiAqXG4gKiBFeGFtcGxlIGluc3RhbnRpYXRpb246XG4gKlxuICogICAgIHZhciB0YWcgPSBuZXcgQXV0b2xpbmtlci5IdG1sVGFnKCB7XG4gKiAgICAgICAgIHRhZ05hbWUgOiAnYScsXG4gKiAgICAgICAgIGF0dHJzICAgOiB7ICdocmVmJzogJ2h0dHA6Ly9nb29nbGUuY29tJywgJ2NsYXNzJzogJ2V4dGVybmFsLWxpbmsnIH0sXG4gKiAgICAgICAgIGlubmVySHRtbCA6ICdHb29nbGUnXG4gKiAgICAgfSApO1xuICpcbiAqICAgICB0YWcudG9BbmNob3JTdHJpbmcoKTsgIC8vIDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIGNsYXNzPVwiZXh0ZXJuYWwtbGlua1wiPkdvb2dsZTwvYT5cbiAqXG4gKiAgICAgLy8gSW5kaXZpZHVhbCBhY2Nlc3NvciBtZXRob2RzXG4gKiAgICAgdGFnLmdldFRhZ05hbWUoKTsgICAgICAgICAgICAgICAgIC8vICdhJ1xuICogICAgIHRhZy5nZXRBdHRyKCAnaHJlZicgKTsgICAgICAgICAgICAvLyAnaHR0cDovL2dvb2dsZS5jb20nXG4gKiAgICAgdGFnLmhhc0NsYXNzKCAnZXh0ZXJuYWwtbGluaycgKTsgIC8vIHRydWVcbiAqXG4gKlxuICogVXNpbmcgbXV0YXRvciBtZXRob2RzICh3aGljaCBtYXkgYmUgdXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIGluc3RhbnRpYXRpb24gY29uZmlnIHByb3BlcnRpZXMpOlxuICpcbiAqICAgICB2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygpO1xuICogICAgIHRhZy5zZXRUYWdOYW1lKCAnYScgKTtcbiAqICAgICB0YWcuc2V0QXR0ciggJ2hyZWYnLCAnaHR0cDovL2dvb2dsZS5jb20nICk7XG4gKiAgICAgdGFnLmFkZENsYXNzKCAnZXh0ZXJuYWwtbGluaycgKTtcbiAqICAgICB0YWcuc2V0SW5uZXJIdG1sKCAnR29vZ2xlJyApO1xuICpcbiAqICAgICB0YWcuZ2V0VGFnTmFtZSgpOyAgICAgICAgICAgICAgICAgLy8gJ2EnXG4gKiAgICAgdGFnLmdldEF0dHIoICdocmVmJyApOyAgICAgICAgICAgIC8vICdodHRwOi8vZ29vZ2xlLmNvbSdcbiAqICAgICB0YWcuaGFzQ2xhc3MoICdleHRlcm5hbC1saW5rJyApOyAgLy8gdHJ1ZVxuICpcbiAqICAgICB0YWcudG9BbmNob3JTdHJpbmcoKTsgIC8vIDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIGNsYXNzPVwiZXh0ZXJuYWwtbGlua1wiPkdvb2dsZTwvYT5cbiAqXG4gKlxuICogIyMgRXhhbXBsZSB1c2Ugd2l0aGluIGEge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn1cbiAqXG4gKiAgICAgdmFyIGh0bWwgPSBBdXRvbGlua2VyLmxpbmsoIFwiVGVzdCBnb29nbGUuY29tXCIsIHtcbiAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuICogICAgICAgICAgICAgdmFyIHRhZyA9IGF1dG9saW5rZXIuZ2V0VGFnQnVpbGRlcigpLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnfSBpbnN0YW5jZSwgY29uZmlndXJlZCB3aXRoIHRoZSBNYXRjaCdzIGhyZWYgYW5kIGFuY2hvciB0ZXh0XG4gKiAgICAgICAgICAgICB0YWcuc2V0QXR0ciggJ3JlbCcsICdub2ZvbGxvdycgKTtcbiAqXG4gKiAgICAgICAgICAgICByZXR1cm4gdGFnO1xuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICpcbiAqICAgICAvLyBnZW5lcmF0ZWQgaHRtbDpcbiAqICAgICAvLyAgIFRlc3QgPGEgaHJlZj1cImh0dHA6Ly9nb29nbGUuY29tXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9mb2xsb3dcIj5nb29nbGUuY29tPC9hPlxuICpcbiAqXG4gKiAjIyBFeGFtcGxlIHVzZSB3aXRoIGEgbmV3IHRhZyBmb3IgdGhlIHJlcGxhY2VtZW50XG4gKlxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIHZhciB0YWcgPSBuZXcgQXV0b2xpbmtlci5IdG1sVGFnKCB7XG4gKiAgICAgICAgICAgICAgICAgdGFnTmFtZSA6ICdidXR0b24nLFxuICogICAgICAgICAgICAgICAgIGF0dHJzICAgOiB7ICd0aXRsZSc6ICdMb2FkIFVSTDogJyArIG1hdGNoLmdldEFuY2hvckhyZWYoKSB9LFxuICogICAgICAgICAgICAgICAgIGlubmVySHRtbCA6ICdMb2FkIFVSTDogJyArIG1hdGNoLmdldEFuY2hvclRleHQoKVxuICogICAgICAgICAgICAgfSApO1xuICpcbiAqICAgICAgICAgICAgIHJldHVybiB0YWc7XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKlxuICogICAgIC8vIGdlbmVyYXRlZCBodG1sOlxuICogICAgIC8vICAgVGVzdCA8YnV0dG9uIHRpdGxlPVwiTG9hZCBVUkw6IGh0dHA6Ly9nb29nbGUuY29tXCI+TG9hZCBVUkw6IGdvb2dsZS5jb208L2J1dHRvbj5cbiAqL1xuQXV0b2xpbmtlci5IdG1sVGFnID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gdGFnTmFtZVxuXHQgKlxuXHQgKiBUaGUgdGFnIG5hbWUuIEV4OiAnYScsICdidXR0b24nLCBldGMuXG5cdCAqXG5cdCAqIE5vdCByZXF1aXJlZCBhdCBpbnN0YW50aWF0aW9uIHRpbWUsIGJ1dCBzaG91bGQgYmUgc2V0IHVzaW5nIHtAbGluayAjc2V0VGFnTmFtZX0gYmVmb3JlIHtAbGluayAjdG9BbmNob3JTdHJpbmd9XG5cdCAqIGlzIGV4ZWN1dGVkLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7T2JqZWN0LjxTdHJpbmcsIFN0cmluZz59IGF0dHJzXG5cdCAqXG5cdCAqIEFuIGtleS92YWx1ZSBPYmplY3QgKG1hcCkgb2YgYXR0cmlidXRlcyB0byBjcmVhdGUgdGhlIHRhZyB3aXRoLiBUaGUga2V5cyBhcmUgdGhlIGF0dHJpYnV0ZSBuYW1lcywgYW5kIHRoZVxuXHQgKiB2YWx1ZXMgYXJlIHRoZSBhdHRyaWJ1dGUgdmFsdWVzLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBpbm5lckh0bWxcblx0ICpcblx0ICogVGhlIGlubmVyIEhUTUwgZm9yIHRoZSB0YWcuXG5cdCAqXG5cdCAqIE5vdGUgdGhlIGNhbWVsIGNhc2UgbmFtZSBvbiBgaW5uZXJIdG1sYC4gQWNyb255bXMgYXJlIGNhbWVsQ2FzZWQgaW4gdGhpcyB1dGlsaXR5IChzdWNoIGFzIG5vdCB0byBydW4gaW50byB0aGUgYWNyb255bVxuXHQgKiBuYW1pbmcgaW5jb25zaXN0ZW5jeSB0aGF0IHRoZSBET00gZGV2ZWxvcGVycyBjcmVhdGVkIHdpdGggYFhNTEh0dHBSZXF1ZXN0YCkuIFlvdSBtYXkgYWx0ZXJuYXRpdmVseSB1c2Uge0BsaW5rICNpbm5lckhUTUx9XG5cdCAqIGlmIHlvdSBwcmVmZXIsIGJ1dCB0aGlzIG9uZSBpcyByZWNvbW1lbmRlZC5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gaW5uZXJIVE1MXG5cdCAqXG5cdCAqIEFsaWFzIG9mIHtAbGluayAjaW5uZXJIdG1sfSwgYWNjZXB0ZWQgZm9yIGNvbnNpc3RlbmN5IHdpdGggdGhlIGJyb3dzZXIgRE9NIGFwaSwgYnV0IHByZWZlciB0aGUgY2FtZWxDYXNlZCB2ZXJzaW9uXG5cdCAqIGZvciBhY3JvbnltIG5hbWVzLlxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSB3aGl0ZXNwYWNlUmVnZXhcblx0ICpcblx0ICogUmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gbWF0Y2ggd2hpdGVzcGFjZSBpbiBhIHN0cmluZyBvZiBDU1MgY2xhc3Nlcy5cblx0ICovXG5cdHdoaXRlc3BhY2VSZWdleCA6IC9cXHMrLyxcblxuXG5cdC8qKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtPYmplY3R9IFtjZmddIFRoZSBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMgZm9yIHRoaXMgY2xhc3MsIGluIGFuIE9iamVjdCAobWFwKVxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXG5cdFx0dGhpcy5pbm5lckh0bWwgPSB0aGlzLmlubmVySHRtbCB8fCB0aGlzLmlubmVySFRNTDsgIC8vIGFjY2VwdCBlaXRoZXIgdGhlIGNhbWVsQ2FzZWQgZm9ybSBvciB0aGUgZnVsbHkgY2FwaXRhbGl6ZWQgYWNyb255bVxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIHRhZyBuYW1lIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGdlbmVyYXRlIHRoZSB0YWcgd2l0aC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRhZ05hbWVcblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0VGFnTmFtZSA6IGZ1bmN0aW9uKCB0YWdOYW1lICkge1xuXHRcdHRoaXMudGFnTmFtZSA9IHRhZ05hbWU7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSB0YWcgbmFtZS5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VGFnTmFtZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnRhZ05hbWUgfHwgXCJcIjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIGFuIGF0dHJpYnV0ZSBvbiB0aGUgSHRtbFRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGF0dHJOYW1lIFRoZSBhdHRyaWJ1dGUgbmFtZSB0byBzZXQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhdHRyVmFsdWUgVGhlIGF0dHJpYnV0ZSB2YWx1ZSB0byBzZXQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldEF0dHIgOiBmdW5jdGlvbiggYXR0ck5hbWUsIGF0dHJWYWx1ZSApIHtcblx0XHR2YXIgdGFnQXR0cnMgPSB0aGlzLmdldEF0dHJzKCk7XG5cdFx0dGFnQXR0cnNbIGF0dHJOYW1lIF0gPSBhdHRyVmFsdWU7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgYW4gYXR0cmlidXRlIGZyb20gdGhlIEh0bWxUYWcuIElmIHRoZSBhdHRyaWJ1dGUgZG9lcyBub3QgZXhpc3QsIHJldHVybnMgYHVuZGVmaW5lZGAuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhdHRyTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdG8gcmV0cmlldmUuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLCBvciBgdW5kZWZpbmVkYCBpZiBpdCBkb2VzIG5vdCBleGlzdCBvbiB0aGUgSHRtbFRhZy5cblx0ICovXG5cdGdldEF0dHIgOiBmdW5jdGlvbiggYXR0ck5hbWUgKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QXR0cnMoKVsgYXR0ck5hbWUgXTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgb24gdGhlIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0LjxTdHJpbmcsIFN0cmluZz59IGF0dHJzIEEga2V5L3ZhbHVlIE9iamVjdCAobWFwKSBvZiB0aGUgYXR0cmlidXRlcyB0byBzZXQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldEF0dHJzIDogZnVuY3Rpb24oIGF0dHJzICkge1xuXHRcdHZhciB0YWdBdHRycyA9IHRoaXMuZ2V0QXR0cnMoKTtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0YWdBdHRycywgYXR0cnMgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgYXR0cmlidXRlcyBPYmplY3QgKG1hcCkgZm9yIHRoZSBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3QuPFN0cmluZywgU3RyaW5nPn0gQSBrZXkvdmFsdWUgb2JqZWN0IG9mIHRoZSBhdHRyaWJ1dGVzIGZvciB0aGUgSHRtbFRhZy5cblx0ICovXG5cdGdldEF0dHJzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuYXR0cnMgfHwgKCB0aGlzLmF0dHJzID0ge30gKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBwcm92aWRlZCBgY3NzQ2xhc3NgLCBvdmVyd3JpdGluZyBhbnkgY3VycmVudCBDU1MgY2xhc3NlcyBvbiB0aGUgSHRtbFRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIE9uZSBvciBtb3JlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NlcyB0byBzZXQgKG92ZXJ3cml0ZSkuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldENsYXNzIDogZnVuY3Rpb24oIGNzc0NsYXNzICkge1xuXHRcdHJldHVybiB0aGlzLnNldEF0dHIoICdjbGFzcycsIGNzc0NsYXNzICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIGFkZCBvbmUgb3IgbW9yZSBDU1MgY2xhc3NlcyB0byB0aGUgSHRtbFRhZy4gV2lsbCBub3QgYWRkIGR1cGxpY2F0ZSBDU1MgY2xhc3Nlcy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIE9uZSBvciBtb3JlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NlcyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdGFkZENsYXNzIDogZnVuY3Rpb24oIGNzc0NsYXNzICkge1xuXHRcdHZhciBjbGFzc0F0dHIgPSB0aGlzLmdldENsYXNzKCksXG5cdFx0ICAgIHdoaXRlc3BhY2VSZWdleCA9IHRoaXMud2hpdGVzcGFjZVJlZ2V4LFxuXHRcdCAgICBpbmRleE9mID0gQXV0b2xpbmtlci5VdGlsLmluZGV4T2YsICAvLyB0byBzdXBwb3J0IElFOCBhbmQgYmVsb3dcblx0XHQgICAgY2xhc3NlcyA9ICggIWNsYXNzQXR0ciApID8gW10gOiBjbGFzc0F0dHIuc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICBuZXdDbGFzc2VzID0gY3NzQ2xhc3Muc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICBuZXdDbGFzcztcblxuXHRcdHdoaWxlKCBuZXdDbGFzcyA9IG5ld0NsYXNzZXMuc2hpZnQoKSApIHtcblx0XHRcdGlmKCBpbmRleE9mKCBjbGFzc2VzLCBuZXdDbGFzcyApID09PSAtMSApIHtcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKCBuZXdDbGFzcyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdID0gY2xhc3Nlcy5qb2luKCBcIiBcIiApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENvbnZlbmllbmNlIG1ldGhvZCB0byByZW1vdmUgb25lIG9yIG1vcmUgQ1NTIGNsYXNzZXMgZnJvbSB0aGUgSHRtbFRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIE9uZSBvciBtb3JlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NlcyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHJlbW92ZUNsYXNzIDogZnVuY3Rpb24oIGNzc0NsYXNzICkge1xuXHRcdHZhciBjbGFzc0F0dHIgPSB0aGlzLmdldENsYXNzKCksXG5cdFx0ICAgIHdoaXRlc3BhY2VSZWdleCA9IHRoaXMud2hpdGVzcGFjZVJlZ2V4LFxuXHRcdCAgICBpbmRleE9mID0gQXV0b2xpbmtlci5VdGlsLmluZGV4T2YsICAvLyB0byBzdXBwb3J0IElFOCBhbmQgYmVsb3dcblx0XHQgICAgY2xhc3NlcyA9ICggIWNsYXNzQXR0ciApID8gW10gOiBjbGFzc0F0dHIuc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICByZW1vdmVDbGFzc2VzID0gY3NzQ2xhc3Muc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICByZW1vdmVDbGFzcztcblxuXHRcdHdoaWxlKCBjbGFzc2VzLmxlbmd0aCAmJiAoIHJlbW92ZUNsYXNzID0gcmVtb3ZlQ2xhc3Nlcy5zaGlmdCgpICkgKSB7XG5cdFx0XHR2YXIgaWR4ID0gaW5kZXhPZiggY2xhc3NlcywgcmVtb3ZlQ2xhc3MgKTtcblx0XHRcdGlmKCBpZHggIT09IC0xICkge1xuXHRcdFx0XHRjbGFzc2VzLnNwbGljZSggaWR4LCAxICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRBdHRycygpWyAnY2xhc3MnIF0gPSBjbGFzc2VzLmpvaW4oIFwiIFwiICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIHJldHJpZXZlIHRoZSBDU1MgY2xhc3MoZXMpIGZvciB0aGUgSHRtbFRhZywgd2hpY2ggd2lsbCBlYWNoIGJlIHNlcGFyYXRlZCBieSBzcGFjZXMgd2hlblxuXHQgKiB0aGVyZSBhcmUgbXVsdGlwbGUuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldENsYXNzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdIHx8IFwiXCI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIGNoZWNrIGlmIHRoZSB0YWcgaGFzIGEgQ1NTIGNsYXNzIG9yIG5vdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIFRoZSBDU1MgY2xhc3MgdG8gY2hlY2sgZm9yLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIEh0bWxUYWcgaGFzIHRoZSBDU1MgY2xhc3MsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0aGFzQ2xhc3MgOiBmdW5jdGlvbiggY3NzQ2xhc3MgKSB7XG5cdFx0cmV0dXJuICggJyAnICsgdGhpcy5nZXRDbGFzcygpICsgJyAnICkuaW5kZXhPZiggJyAnICsgY3NzQ2xhc3MgKyAnICcgKSAhPT0gLTE7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyB0aGUgaW5uZXIgSFRNTCBmb3IgdGhlIHRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGh0bWwgVGhlIGlubmVyIEhUTUwgdG8gc2V0LlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRzZXRJbm5lckh0bWwgOiBmdW5jdGlvbiggaHRtbCApIHtcblx0XHR0aGlzLmlubmVySHRtbCA9IGh0bWw7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIGlubmVyIEhUTUwgZm9yIHRoZSB0YWcuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldElubmVySHRtbCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmlubmVySHRtbCB8fCBcIlwiO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIE92ZXJyaWRlIG9mIHN1cGVyY2xhc3MgbWV0aG9kIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIEhUTUwgc3RyaW5nIGZvciB0aGUgdGFnLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHR0b0FuY2hvclN0cmluZyA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0YWdOYW1lID0gdGhpcy5nZXRUYWdOYW1lKCksXG5cdFx0ICAgIGF0dHJzU3RyID0gdGhpcy5idWlsZEF0dHJzU3RyKCk7XG5cblx0XHRhdHRyc1N0ciA9ICggYXR0cnNTdHIgKSA/ICcgJyArIGF0dHJzU3RyIDogJyc7ICAvLyBwcmVwZW5kIGEgc3BhY2UgaWYgdGhlcmUgYXJlIGFjdHVhbGx5IGF0dHJpYnV0ZXNcblxuXHRcdHJldHVybiBbICc8JywgdGFnTmFtZSwgYXR0cnNTdHIsICc+JywgdGhpcy5nZXRJbm5lckh0bWwoKSwgJzwvJywgdGFnTmFtZSwgJz4nIF0uam9pbiggXCJcIiApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFN1cHBvcnQgbWV0aG9kIGZvciB7QGxpbmsgI3RvQW5jaG9yU3RyaW5nfSwgcmV0dXJucyB0aGUgc3RyaW5nIHNwYWNlLXNlcGFyYXRlZCBrZXk9XCJ2YWx1ZVwiIHBhaXJzLCB1c2VkIHRvIHBvcHVsYXRlXG5cdCAqIHRoZSBzdHJpbmdpZmllZCBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gRXhhbXBsZSByZXR1cm46IGBhdHRyMT1cInZhbHVlMVwiIGF0dHIyPVwidmFsdWUyXCJgXG5cdCAqL1xuXHRidWlsZEF0dHJzU3RyIDogZnVuY3Rpb24oKSB7XG5cdFx0aWYoICF0aGlzLmF0dHJzICkgcmV0dXJuIFwiXCI7ICAvLyBubyBgYXR0cnNgIE9iamVjdCAobWFwKSBoYXMgYmVlbiBzZXQsIHJldHVybiBlbXB0eSBzdHJpbmdcblxuXHRcdHZhciBhdHRycyA9IHRoaXMuZ2V0QXR0cnMoKSxcblx0XHQgICAgYXR0cnNBcnIgPSBbXTtcblxuXHRcdGZvciggdmFyIHByb3AgaW4gYXR0cnMgKSB7XG5cdFx0XHRpZiggYXR0cnMuaGFzT3duUHJvcGVydHkoIHByb3AgKSApIHtcblx0XHRcdFx0YXR0cnNBcnIucHVzaCggcHJvcCArICc9XCInICsgYXR0cnNbIHByb3AgXSArICdcIicgKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGF0dHJzQXJyLmpvaW4oIFwiIFwiICk7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKmpzaGludCBzdWI6dHJ1ZSAqL1xuLyoqXG4gKiBAcHJvdGVjdGVkXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBCdWlsZHMgYW5jaG9yICgmbHQ7YSZndDspIHRhZ3MgZm9yIHRoZSBBdXRvbGlua2VyIHV0aWxpdHkgd2hlbiBhIG1hdGNoIGlzIGZvdW5kLlxuICpcbiAqIE5vcm1hbGx5IHRoaXMgY2xhc3MgaXMgaW5zdGFudGlhdGVkLCBjb25maWd1cmVkLCBhbmQgdXNlZCBpbnRlcm5hbGx5IGJ5IGFuXG4gKiB7QGxpbmsgQXV0b2xpbmtlcn0gaW5zdGFuY2UsIGJ1dCBtYXkgYWN0dWFsbHkgYmUgcmV0cmlldmVkIGluIGEge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn1cbiAqIHRvIGNyZWF0ZSB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnIEh0bWxUYWd9IGluc3RhbmNlcyB3aGljaCBtYXkgYmUgbW9kaWZpZWRcbiAqIGJlZm9yZSByZXR1cm5pbmcgZnJvbSB0aGUge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0uIEZvclxuICogZXhhbXBsZTpcbiAqXG4gKiAgICAgdmFyIGh0bWwgPSBBdXRvbGlua2VyLmxpbmsoIFwiVGVzdCBnb29nbGUuY29tXCIsIHtcbiAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuICogICAgICAgICAgICAgdmFyIHRhZyA9IGF1dG9saW5rZXIuZ2V0VGFnQnVpbGRlcigpLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnfSBpbnN0YW5jZVxuICogICAgICAgICAgICAgdGFnLnNldEF0dHIoICdyZWwnLCAnbm9mb2xsb3cnICk7XG4gKlxuICogICAgICAgICAgICAgcmV0dXJuIHRhZztcbiAqICAgICAgICAgfVxuICogICAgIH0gKTtcbiAqXG4gKiAgICAgLy8gZ2VuZXJhdGVkIGh0bWw6XG4gKiAgICAgLy8gICBUZXN0IDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vZm9sbG93XCI+Z29vZ2xlLmNvbTwvYT5cbiAqL1xuQXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IG5ld1dpbmRvd1xuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI25ld1dpbmRvd1xuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7T2JqZWN0fSB0cnVuY2F0ZVxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI3RydW5jYXRlXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGNsYXNzTmFtZVxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI2NsYXNzTmFtZVxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtPYmplY3R9IFtjZmddIFRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBBbmNob3JUYWdCdWlsZGVyIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlcyB0aGUgYWN0dWFsIGFuY2hvciAoJmx0O2EmZ3Q7KSB0YWcgdG8gdXNlIGluIHBsYWNlIG9mIHRoZVxuXHQgKiBtYXRjaGVkIHRleHQsIHZpYSBpdHMgYG1hdGNoYCBvYmplY3QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7QXV0b2xpbmtlci5tYXRjaC5NYXRjaH0gbWF0Y2ggVGhlIE1hdGNoIGluc3RhbmNlIHRvIGdlbmVyYXRlIGFuXG5cdCAqICAgYW5jaG9yIHRhZyBmcm9tLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoZSBIdG1sVGFnIGluc3RhbmNlIGZvciB0aGUgYW5jaG9yIHRhZy5cblx0ICovXG5cdGJ1aWxkIDogZnVuY3Rpb24oIG1hdGNoICkge1xuXHRcdHJldHVybiBuZXcgQXV0b2xpbmtlci5IdG1sVGFnKCB7XG5cdFx0XHR0YWdOYW1lICAgOiAnYScsXG5cdFx0XHRhdHRycyAgICAgOiB0aGlzLmNyZWF0ZUF0dHJzKCBtYXRjaC5nZXRUeXBlKCksIG1hdGNoLmdldEFuY2hvckhyZWYoKSApLFxuXHRcdFx0aW5uZXJIdG1sIDogdGhpcy5wcm9jZXNzQW5jaG9yVGV4dCggbWF0Y2guZ2V0QW5jaG9yVGV4dCgpIClcblx0XHR9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGUgT2JqZWN0IChtYXApIG9mIHRoZSBIVE1MIGF0dHJpYnV0ZXMgZm9yIHRoZSBhbmNob3IgKCZsdDthJmd0Oylcblx0ICogICB0YWcgYmVpbmcgZ2VuZXJhdGVkLlxuXHQgKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEBwYXJhbSB7XCJ1cmxcIi9cImVtYWlsXCIvXCJwaG9uZVwiL1widHdpdHRlclwiL1wiaGFzaHRhZ1wifSBtYXRjaFR5cGUgVGhlIHR5cGUgb2Zcblx0ICogICBtYXRjaCB0aGF0IGFuIGFuY2hvciB0YWcgaXMgYmVpbmcgZ2VuZXJhdGVkIGZvci5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGFuY2hvckhyZWYgVGhlIGhyZWYgZm9yIHRoZSBhbmNob3IgdGFnLlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEEga2V5L3ZhbHVlIE9iamVjdCAobWFwKSBvZiB0aGUgYW5jaG9yIHRhZydzIGF0dHJpYnV0ZXMuXG5cdCAqL1xuXHRjcmVhdGVBdHRycyA6IGZ1bmN0aW9uKCBtYXRjaFR5cGUsIGFuY2hvckhyZWYgKSB7XG5cdFx0dmFyIGF0dHJzID0ge1xuXHRcdFx0J2hyZWYnIDogYW5jaG9ySHJlZiAgLy8gd2UnbGwgYWx3YXlzIGhhdmUgdGhlIGBocmVmYCBhdHRyaWJ1dGVcblx0XHR9O1xuXG5cdFx0dmFyIGNzc0NsYXNzID0gdGhpcy5jcmVhdGVDc3NDbGFzcyggbWF0Y2hUeXBlICk7XG5cdFx0aWYoIGNzc0NsYXNzICkge1xuXHRcdFx0YXR0cnNbICdjbGFzcycgXSA9IGNzc0NsYXNzO1xuXHRcdH1cblx0XHRpZiggdGhpcy5uZXdXaW5kb3cgKSB7XG5cdFx0XHRhdHRyc1sgJ3RhcmdldCcgXSA9IFwiX2JsYW5rXCI7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGF0dHJzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgdGhlIENTUyBjbGFzcyB0aGF0IHdpbGwgYmUgdXNlZCBmb3IgYSBnaXZlbiBhbmNob3IgdGFnLCBiYXNlZCBvblxuXHQgKiB0aGUgYG1hdGNoVHlwZWAgYW5kIHRoZSB7QGxpbmsgI2NsYXNzTmFtZX0gY29uZmlnLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1widXJsXCIvXCJlbWFpbFwiL1wicGhvbmVcIi9cInR3aXR0ZXJcIi9cImhhc2h0YWdcIn0gbWF0Y2hUeXBlIFRoZSB0eXBlIG9mXG5cdCAqICAgbWF0Y2ggdGhhdCBhbiBhbmNob3IgdGFnIGlzIGJlaW5nIGdlbmVyYXRlZCBmb3IuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIENTUyBjbGFzcyBzdHJpbmcgZm9yIHRoZSBsaW5rLiBFeGFtcGxlIHJldHVybjpcblx0ICogICBcIm15TGluayBteUxpbmstdXJsXCIuIElmIG5vIHtAbGluayAjY2xhc3NOYW1lfSB3YXMgY29uZmlndXJlZCwgcmV0dXJuc1xuXHQgKiAgIGFuIGVtcHR5IHN0cmluZy5cblx0ICovXG5cdGNyZWF0ZUNzc0NsYXNzIDogZnVuY3Rpb24oIG1hdGNoVHlwZSApIHtcblx0XHR2YXIgY2xhc3NOYW1lID0gdGhpcy5jbGFzc05hbWU7XG5cblx0XHRpZiggIWNsYXNzTmFtZSApXG5cdFx0XHRyZXR1cm4gXCJcIjtcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gY2xhc3NOYW1lICsgXCIgXCIgKyBjbGFzc05hbWUgKyBcIi1cIiArIG1hdGNoVHlwZTsgIC8vIGV4OiBcIm15TGluayBteUxpbmstdXJsXCIsIFwibXlMaW5rIG15TGluay1lbWFpbFwiLCBcIm15TGluayBteUxpbmstcGhvbmVcIiwgXCJteUxpbmsgbXlMaW5rLXR3aXR0ZXJcIiwgb3IgXCJteUxpbmsgbXlMaW5rLWhhc2h0YWdcIlxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFByb2Nlc3NlcyB0aGUgYGFuY2hvclRleHRgIGJ5IHRydW5jYXRpbmcgdGhlIHRleHQgYWNjb3JkaW5nIHRvIHRoZVxuXHQgKiB7QGxpbmsgI3RydW5jYXRlfSBjb25maWcuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhbmNob3JUZXh0IFRoZSBhbmNob3IgdGFnJ3MgdGV4dCAoaS5lLiB3aGF0IHdpbGwgYmVcblx0ICogICBkaXNwbGF5ZWQpLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBwcm9jZXNzZWQgYGFuY2hvclRleHRgLlxuXHQgKi9cblx0cHJvY2Vzc0FuY2hvclRleHQgOiBmdW5jdGlvbiggYW5jaG9yVGV4dCApIHtcblx0XHRhbmNob3JUZXh0ID0gdGhpcy5kb1RydW5jYXRlKCBhbmNob3JUZXh0ICk7XG5cblx0XHRyZXR1cm4gYW5jaG9yVGV4dDtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBQZXJmb3JtcyB0aGUgdHJ1bmNhdGlvbiBvZiB0aGUgYGFuY2hvclRleHRgIGJhc2VkIG9uIHRoZSB7QGxpbmsgI3RydW5jYXRlfVxuXHQgKiBvcHRpb24uIElmIHRoZSBgYW5jaG9yVGV4dGAgaXMgbG9uZ2VyIHRoYW4gdGhlIGxlbmd0aCBzcGVjaWZpZWQgYnkgdGhlXG5cdCAqIHtAbGluayAjdHJ1bmNhdGV9IG9wdGlvbiwgdGhlIHRydW5jYXRpb24gaXMgcGVyZm9ybWVkIGJhc2VkIG9uIHRoZVxuXHQgKiBgbG9jYXRpb25gIHByb3BlcnR5LiBTZWUge0BsaW5rICN0cnVuY2F0ZX0gZm9yIGRldGFpbHMuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhbmNob3JUZXh0IFRoZSBhbmNob3IgdGFnJ3MgdGV4dCAoaS5lLiB3aGF0IHdpbGwgYmVcblx0ICogICBkaXNwbGF5ZWQpLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB0cnVuY2F0ZWQgYW5jaG9yIHRleHQuXG5cdCAqL1xuXHRkb1RydW5jYXRlIDogZnVuY3Rpb24oIGFuY2hvclRleHQgKSB7XG5cdFx0dmFyIHRydW5jYXRlID0gdGhpcy50cnVuY2F0ZTtcblx0XHRpZiggIXRydW5jYXRlICkgcmV0dXJuIGFuY2hvclRleHQ7XG5cblx0XHR2YXIgdHJ1bmNhdGVMZW5ndGggPSB0cnVuY2F0ZS5sZW5ndGgsXG5cdFx0XHR0cnVuY2F0ZUxvY2F0aW9uID0gdHJ1bmNhdGUubG9jYXRpb247XG5cblx0XHRpZiggdHJ1bmNhdGVMb2NhdGlvbiA9PT0gJ3NtYXJ0JyApIHtcblx0XHRcdHJldHVybiBBdXRvbGlua2VyLnRydW5jYXRlLlRydW5jYXRlU21hcnQoIGFuY2hvclRleHQsIHRydW5jYXRlTGVuZ3RoLCAnLi4nICk7XG5cblx0XHR9IGVsc2UgaWYoIHRydW5jYXRlTG9jYXRpb24gPT09ICdtaWRkbGUnICkge1xuXHRcdFx0cmV0dXJuIEF1dG9saW5rZXIudHJ1bmNhdGUuVHJ1bmNhdGVNaWRkbGUoIGFuY2hvclRleHQsIHRydW5jYXRlTGVuZ3RoLCAnLi4nICk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIEF1dG9saW5rZXIudHJ1bmNhdGUuVHJ1bmNhdGVFbmQoIGFuY2hvclRleHQsIHRydW5jYXRlTGVuZ3RoLCAnLi4nICk7XG5cdFx0fVxuXHR9XG5cbn0gKTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBBbiBIVE1MIHBhcnNlciBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd2Fsa3MgYW4gSFRNTCBzdHJpbmcgYW5kIHJldHVybnMgYW4gYXJyYXkgb2ZcbiAqIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUgSHRtbE5vZGVzfSB0aGF0IHJlcHJlc2VudCB0aGUgYmFzaWMgSFRNTCBzdHJ1Y3R1cmUgb2YgdGhlIGlucHV0IHN0cmluZy5cbiAqXG4gKiBBdXRvbGlua2VyIHVzZXMgdGhpcyB0byBvbmx5IGxpbmsgVVJMcy9lbWFpbHMvVHdpdHRlciBoYW5kbGVzIHdpdGhpbiB0ZXh0IG5vZGVzLCBlZmZlY3RpdmVseSBpZ25vcmluZyAvIFwid2Fsa2luZ1xuICogYXJvdW5kXCIgSFRNTCB0YWdzLlxuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlciA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaHRtbFJlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBwdWxsIG91dCBIVE1MIHRhZ3MgZnJvbSBhIHN0cmluZy4gSGFuZGxlcyBuYW1lc3BhY2VkIEhUTUwgdGFncyBhbmRcblx0ICogYXR0cmlidXRlIG5hbWVzLCBhcyBzcGVjaWZpZWQgYnkgaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbC1tYXJrdXAvc3ludGF4Lmh0bWwuXG5cdCAqXG5cdCAqIENhcHR1cmluZyBncm91cHM6XG5cdCAqXG5cdCAqIDEuIFRoZSBcIiFET0NUWVBFXCIgdGFnIG5hbWUsIGlmIGEgdGFnIGlzIGEgJmx0OyFET0NUWVBFJmd0OyB0YWcuXG5cdCAqIDIuIElmIGl0IGlzIGFuIGVuZCB0YWcsIHRoaXMgZ3JvdXAgd2lsbCBoYXZlIHRoZSAnLycuXG5cdCAqIDMuIElmIGl0IGlzIGEgY29tbWVudCB0YWcsIHRoaXMgZ3JvdXAgd2lsbCBob2xkIHRoZSBjb21tZW50IHRleHQgKGkuZS5cblx0ICogICAgdGhlIHRleHQgaW5zaWRlIHRoZSBgJmx0OyEtLWAgYW5kIGAtLSZndDtgLlxuXHQgKiA0LiBUaGUgdGFnIG5hbWUgZm9yIGFsbCB0YWdzIChvdGhlciB0aGFuIHRoZSAmbHQ7IURPQ1RZUEUmZ3Q7IHRhZylcblx0ICovXG5cdGh0bWxSZWdleCA6IChmdW5jdGlvbigpIHtcblx0XHR2YXIgY29tbWVudFRhZ1JlZ2V4ID0gLyEtLShbXFxzXFxTXSs/KS0tLyxcblx0XHQgICAgdGFnTmFtZVJlZ2V4ID0gL1swLTlhLXpBLVpdWzAtOWEtekEtWjpdKi8sXG5cdFx0ICAgIGF0dHJOYW1lUmVnZXggPSAvW15cXHNcXDBcIic+XFwvPVxceDAxLVxceDFGXFx4N0ZdKy8sICAgLy8gdGhlIHVuaWNvZGUgcmFuZ2UgYWNjb3VudHMgZm9yIGV4Y2x1ZGluZyBjb250cm9sIGNoYXJzLCBhbmQgdGhlIGRlbGV0ZSBjaGFyXG5cdFx0ICAgIGF0dHJWYWx1ZVJlZ2V4ID0gLyg/OlwiW15cIl0qP1wifCdbXiddKj8nfFteJ1wiPTw+YFxcc10rKS8sIC8vIGRvdWJsZSBxdW90ZWQsIHNpbmdsZSBxdW90ZWQsIG9yIHVucXVvdGVkIGF0dHJpYnV0ZSB2YWx1ZXNcblx0XHQgICAgbmFtZUVxdWFsc1ZhbHVlUmVnZXggPSBhdHRyTmFtZVJlZ2V4LnNvdXJjZSArICcoPzpcXFxccyo9XFxcXHMqJyArIGF0dHJWYWx1ZVJlZ2V4LnNvdXJjZSArICcpPyc7ICAvLyBvcHRpb25hbCAnPVt2YWx1ZV0nXG5cblx0XHRyZXR1cm4gbmV3IFJlZ0V4cCggW1xuXHRcdFx0Ly8gZm9yIDwhRE9DVFlQRT4gdGFnLiBFeDogPCFET0NUWVBFIGh0bWwgUFVCTElDIFwiLS8vVzNDLy9EVEQgWEhUTUwgMS4wIFN0cmljdC8vRU5cIiBcImh0dHA6Ly93d3cudzMub3JnL1RSL3hodG1sMS9EVEQveGh0bWwxLXN0cmljdC5kdGRcIj4pXG5cdFx0XHQnKD86Jyxcblx0XHRcdFx0JzwoIURPQ1RZUEUpJywgIC8vICoqKiBDYXB0dXJpbmcgR3JvdXAgMSAtIElmIGl0J3MgYSBkb2N0eXBlIHRhZ1xuXG5cdFx0XHRcdFx0Ly8gWmVybyBvciBtb3JlIGF0dHJpYnV0ZXMgZm9sbG93aW5nIHRoZSB0YWcgbmFtZVxuXHRcdFx0XHRcdCcoPzonLFxuXHRcdFx0XHRcdFx0J1xcXFxzKycsICAvLyBvbmUgb3IgbW9yZSB3aGl0ZXNwYWNlIGNoYXJzIGJlZm9yZSBhbiBhdHRyaWJ1dGVcblxuXHRcdFx0XHRcdFx0Ly8gRWl0aGVyOlxuXHRcdFx0XHRcdFx0Ly8gQS4gYXR0cj1cInZhbHVlXCIsIG9yXG5cdFx0XHRcdFx0XHQvLyBCLiBcInZhbHVlXCIgYWxvbmUgKFRvIGNvdmVyIGV4YW1wbGUgZG9jdHlwZSB0YWc6IDwhRE9DVFlQRSBodG1sIFBVQkxJQyBcIi0vL1czQy8vRFREIFhIVE1MIDEuMCBTdHJpY3QvL0VOXCIgXCJodHRwOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvRFREL3hodG1sMS1zdHJpY3QuZHRkXCI+KVxuXHRcdFx0XHRcdFx0Jyg/OicsIG5hbWVFcXVhbHNWYWx1ZVJlZ2V4LCAnfCcsIGF0dHJWYWx1ZVJlZ2V4LnNvdXJjZSArICcpJyxcblx0XHRcdFx0XHQnKSonLFxuXHRcdFx0XHQnPicsXG5cdFx0XHQnKScsXG5cblx0XHRcdCd8JyxcblxuXHRcdFx0Ly8gQWxsIG90aGVyIEhUTUwgdGFncyAoaS5lLiB0YWdzIHRoYXQgYXJlIG5vdCA8IURPQ1RZUEU+KVxuXHRcdFx0Jyg/OicsXG5cdFx0XHRcdCc8KC8pPycsICAvLyBCZWdpbm5pbmcgb2YgYSB0YWcgb3IgY29tbWVudC4gRWl0aGVyICc8JyBmb3IgYSBzdGFydCB0YWcsIG9yICc8LycgZm9yIGFuIGVuZCB0YWcuXG5cdFx0XHRcdCAgICAgICAgICAvLyAqKiogQ2FwdHVyaW5nIEdyb3VwIDI6IFRoZSBzbGFzaCBvciBhbiBlbXB0eSBzdHJpbmcuIFNsYXNoICgnLycpIGZvciBlbmQgdGFnLCBlbXB0eSBzdHJpbmcgZm9yIHN0YXJ0IG9yIHNlbGYtY2xvc2luZyB0YWcuXG5cblx0XHRcdFx0XHQnKD86Jyxcblx0XHRcdFx0XHRcdGNvbW1lbnRUYWdSZWdleC5zb3VyY2UsICAvLyAqKiogQ2FwdHVyaW5nIEdyb3VwIDMgLSBBIENvbW1lbnQgVGFnJ3MgVGV4dFxuXG5cdFx0XHRcdFx0XHQnfCcsXG5cblx0XHRcdFx0XHRcdCcoPzonLFxuXG5cdFx0XHRcdFx0XHRcdC8vICoqKiBDYXB0dXJpbmcgR3JvdXAgNCAtIFRoZSB0YWcgbmFtZVxuXHRcdFx0XHRcdFx0XHQnKCcgKyB0YWdOYW1lUmVnZXguc291cmNlICsgJyknLFxuXG5cdFx0XHRcdFx0XHRcdC8vIFplcm8gb3IgbW9yZSBhdHRyaWJ1dGVzIGZvbGxvd2luZyB0aGUgdGFnIG5hbWVcblx0XHRcdFx0XHRcdFx0Jyg/OicsXG5cdFx0XHRcdFx0XHRcdFx0J1xcXFxzKycsICAgICAgICAgICAgICAgIC8vIG9uZSBvciBtb3JlIHdoaXRlc3BhY2UgY2hhcnMgYmVmb3JlIGFuIGF0dHJpYnV0ZVxuXHRcdFx0XHRcdFx0XHRcdG5hbWVFcXVhbHNWYWx1ZVJlZ2V4LCAgLy8gYXR0cj1cInZhbHVlXCIgKHdpdGggb3B0aW9uYWwgPVwidmFsdWVcIiBwYXJ0KVxuXHRcdFx0XHRcdFx0XHQnKSonLFxuXG5cdFx0XHRcdFx0XHRcdCdcXFxccyovPycsICAvLyBhbnkgdHJhaWxpbmcgc3BhY2VzIGFuZCBvcHRpb25hbCAnLycgYmVmb3JlIHRoZSBjbG9zaW5nICc+J1xuXG5cdFx0XHRcdFx0XHQnKScsXG5cdFx0XHRcdFx0JyknLFxuXHRcdFx0XHQnPicsXG5cdFx0XHQnKSdcblx0XHRdLmpvaW4oIFwiXCIgKSwgJ2dpJyApO1xuXHR9ICkoKSxcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGh0bWxDaGFyYWN0ZXJFbnRpdGllc1JlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBtYXRjaGVzIGNvbW1vbiBIVE1MIGNoYXJhY3RlciBlbnRpdGllcy5cblx0ICpcblx0ICogSWdub3JpbmcgJmFtcDsgYXMgaXQgY291bGQgYmUgcGFydCBvZiBhIHF1ZXJ5IHN0cmluZyAtLSBoYW5kbGluZyBpdCBzZXBhcmF0ZWx5LlxuXHQgKi9cblx0aHRtbENoYXJhY3RlckVudGl0aWVzUmVnZXg6IC8oJm5ic3A7fCYjMTYwO3wmbHQ7fCYjNjA7fCZndDt8JiM2Mjt8JnF1b3Q7fCYjMzQ7fCYjMzk7KS9naSxcblxuXG5cdC8qKlxuXHQgKiBQYXJzZXMgYW4gSFRNTCBzdHJpbmcgYW5kIHJldHVybnMgYSBzaW1wbGUgYXJyYXkgb2Yge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSBIdG1sTm9kZXN9XG5cdCAqIHRvIHJlcHJlc2VudCB0aGUgSFRNTCBzdHJ1Y3R1cmUgb2YgdGhlIGlucHV0IHN0cmluZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGh0bWwgVGhlIEhUTUwgdG8gcGFyc2UuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVtdfVxuXHQgKi9cblx0cGFyc2UgOiBmdW5jdGlvbiggaHRtbCApIHtcblx0XHR2YXIgaHRtbFJlZ2V4ID0gdGhpcy5odG1sUmVnZXgsXG5cdFx0ICAgIGN1cnJlbnRSZXN1bHQsXG5cdFx0ICAgIGxhc3RJbmRleCA9IDAsXG5cdFx0ICAgIHRleHRBbmRFbnRpdHlOb2Rlcyxcblx0XHQgICAgbm9kZXMgPSBbXTsgIC8vIHdpbGwgYmUgdGhlIHJlc3VsdCBvZiB0aGUgbWV0aG9kXG5cblx0XHR3aGlsZSggKCBjdXJyZW50UmVzdWx0ID0gaHRtbFJlZ2V4LmV4ZWMoIGh0bWwgKSApICE9PSBudWxsICkge1xuXHRcdFx0dmFyIHRhZ1RleHQgPSBjdXJyZW50UmVzdWx0WyAwIF0sXG5cdFx0XHQgICAgY29tbWVudFRleHQgPSBjdXJyZW50UmVzdWx0WyAzIF0sIC8vIGlmIHdlJ3ZlIG1hdGNoZWQgYSBjb21tZW50XG5cdFx0XHQgICAgdGFnTmFtZSA9IGN1cnJlbnRSZXN1bHRbIDEgXSB8fCBjdXJyZW50UmVzdWx0WyA0IF0sICAvLyBUaGUgPCFET0NUWVBFPiB0YWcgKGV4OiBcIiFET0NUWVBFXCIpLCBvciBhbm90aGVyIHRhZyAoZXg6IFwiYVwiIG9yIFwiaW1nXCIpXG5cdFx0XHQgICAgaXNDbG9zaW5nVGFnID0gISFjdXJyZW50UmVzdWx0WyAyIF0sXG5cdFx0XHQgICAgaW5CZXR3ZWVuVGFnc1RleHQgPSBodG1sLnN1YnN0cmluZyggbGFzdEluZGV4LCBjdXJyZW50UmVzdWx0LmluZGV4ICk7XG5cblx0XHRcdC8vIFB1c2ggVGV4dE5vZGVzIGFuZCBFbnRpdHlOb2RlcyBmb3IgYW55IHRleHQgZm91bmQgYmV0d2VlbiB0YWdzXG5cdFx0XHRpZiggaW5CZXR3ZWVuVGFnc1RleHQgKSB7XG5cdFx0XHRcdHRleHRBbmRFbnRpdHlOb2RlcyA9IHRoaXMucGFyc2VUZXh0QW5kRW50aXR5Tm9kZXMoIGluQmV0d2VlblRhZ3NUZXh0ICk7XG5cdFx0XHRcdG5vZGVzLnB1c2guYXBwbHkoIG5vZGVzLCB0ZXh0QW5kRW50aXR5Tm9kZXMgKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gUHVzaCB0aGUgQ29tbWVudE5vZGUgb3IgRWxlbWVudE5vZGVcblx0XHRcdGlmKCBjb21tZW50VGV4dCApIHtcblx0XHRcdFx0bm9kZXMucHVzaCggdGhpcy5jcmVhdGVDb21tZW50Tm9kZSggdGFnVGV4dCwgY29tbWVudFRleHQgKSApO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0bm9kZXMucHVzaCggdGhpcy5jcmVhdGVFbGVtZW50Tm9kZSggdGFnVGV4dCwgdGFnTmFtZSwgaXNDbG9zaW5nVGFnICkgKTtcblx0XHRcdH1cblxuXHRcdFx0bGFzdEluZGV4ID0gY3VycmVudFJlc3VsdC5pbmRleCArIHRhZ1RleHQubGVuZ3RoO1xuXHRcdH1cblxuXHRcdC8vIFByb2Nlc3MgYW55IHJlbWFpbmluZyB0ZXh0IGFmdGVyIHRoZSBsYXN0IEhUTUwgZWxlbWVudC4gV2lsbCBwcm9jZXNzIGFsbCBvZiB0aGUgdGV4dCBpZiB0aGVyZSB3ZXJlIG5vIEhUTUwgZWxlbWVudHMuXG5cdFx0aWYoIGxhc3RJbmRleCA8IGh0bWwubGVuZ3RoICkge1xuXHRcdFx0dmFyIHRleHQgPSBodG1sLnN1YnN0cmluZyggbGFzdEluZGV4ICk7XG5cblx0XHRcdC8vIFB1c2ggVGV4dE5vZGVzIGFuZCBFbnRpdHlOb2RlcyBmb3IgYW55IHRleHQgZm91bmQgYmV0d2VlbiB0YWdzXG5cdFx0XHRpZiggdGV4dCApIHtcblx0XHRcdFx0dGV4dEFuZEVudGl0eU5vZGVzID0gdGhpcy5wYXJzZVRleHRBbmRFbnRpdHlOb2RlcyggdGV4dCApO1xuXHRcdFx0XHRub2Rlcy5wdXNoLmFwcGx5KCBub2RlcywgdGV4dEFuZEVudGl0eU5vZGVzICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5vZGVzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFBhcnNlcyB0ZXh0IGFuZCBIVE1MIGVudGl0eSBub2RlcyBmcm9tIGEgZ2l2ZW4gc3RyaW5nLiBUaGUgaW5wdXQgc3RyaW5nXG5cdCAqIHNob3VsZCBub3QgaGF2ZSBhbnkgSFRNTCB0YWdzIChlbGVtZW50cykgd2l0aGluIGl0LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0byBwYXJzZS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlW119IEFuIGFycmF5IG9mIEh0bWxOb2RlcyB0b1xuXHQgKiAgIHJlcHJlc2VudCB0aGUge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSBUZXh0Tm9kZXN9IGFuZFxuXHQgKiAgIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2Rlc30gZm91bmQuXG5cdCAqL1xuXHRwYXJzZVRleHRBbmRFbnRpdHlOb2RlcyA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHZhciBub2RlcyA9IFtdLFxuXHRcdCAgICB0ZXh0QW5kRW50aXR5VG9rZW5zID0gQXV0b2xpbmtlci5VdGlsLnNwbGl0QW5kQ2FwdHVyZSggdGV4dCwgdGhpcy5odG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleCApOyAgLy8gc3BsaXQgYXQgSFRNTCBlbnRpdGllcywgYnV0IGluY2x1ZGUgdGhlIEhUTUwgZW50aXRpZXMgaW4gdGhlIHJlc3VsdHMgYXJyYXlcblxuXHRcdC8vIEV2ZXJ5IGV2ZW4gbnVtYmVyZWQgdG9rZW4gaXMgYSBUZXh0Tm9kZSwgYW5kIGV2ZXJ5IG9kZCBudW1iZXJlZCB0b2tlbiBpcyBhbiBFbnRpdHlOb2RlXG5cdFx0Ly8gRm9yIGV4YW1wbGU6IGFuIGlucHV0IGB0ZXh0YCBvZiBcIlRlc3QgJnF1b3Q7dGhpcyZxdW90OyB0b2RheVwiIHdvdWxkIHR1cm4gaW50byB0aGVcblx0XHQvLyAgIGB0ZXh0QW5kRW50aXR5VG9rZW5zYDogWyAnVGVzdCAnLCAnJnF1b3Q7JywgJ3RoaXMnLCAnJnF1b3Q7JywgJyB0b2RheScgXVxuXHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSB0ZXh0QW5kRW50aXR5VG9rZW5zLmxlbmd0aDsgaSA8IGxlbjsgaSArPSAyICkge1xuXHRcdFx0dmFyIHRleHRUb2tlbiA9IHRleHRBbmRFbnRpdHlUb2tlbnNbIGkgXSxcblx0XHRcdCAgICBlbnRpdHlUb2tlbiA9IHRleHRBbmRFbnRpdHlUb2tlbnNbIGkgKyAxIF07XG5cblx0XHRcdGlmKCB0ZXh0VG9rZW4gKSBub2Rlcy5wdXNoKCB0aGlzLmNyZWF0ZVRleHROb2RlKCB0ZXh0VG9rZW4gKSApO1xuXHRcdFx0aWYoIGVudGl0eVRva2VuICkgbm9kZXMucHVzaCggdGhpcy5jcmVhdGVFbnRpdHlOb2RlKCBlbnRpdHlUb2tlbiApICk7XG5cdFx0fVxuXHRcdHJldHVybiBub2Rlcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCB0byBjcmVhdGUgYW4ge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZSBDb21tZW50Tm9kZX0uXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0YWdUZXh0IFRoZSBmdWxsIHRleHQgb2YgdGhlIHRhZyAoY29tbWVudCkgdGhhdCB3YXNcblx0ICogICBtYXRjaGVkLCBpbmNsdWRpbmcgaXRzICZsdDshLS0gYW5kIC0tJmd0Oy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGNvbW1lbnQgVGhlIGZ1bGwgdGV4dCBvZiB0aGUgY29tbWVudCB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0Y3JlYXRlQ29tbWVudE5vZGUgOiBmdW5jdGlvbiggdGFnVGV4dCwgY29tbWVudFRleHQgKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGUoIHtcblx0XHRcdHRleHQ6IHRhZ1RleHQsXG5cdFx0XHRjb21tZW50OiBBdXRvbGlua2VyLlV0aWwudHJpbSggY29tbWVudFRleHQgKVxuXHRcdH0gKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCB0byBjcmVhdGUgYW4ge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZSBFbGVtZW50Tm9kZX0uXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0YWdUZXh0IFRoZSBmdWxsIHRleHQgb2YgdGhlIHRhZyAoZWxlbWVudCkgdGhhdCB3YXNcblx0ICogICBtYXRjaGVkLCBpbmNsdWRpbmcgaXRzIGF0dHJpYnV0ZXMuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSB0YWcuIEV4OiBBbiAmbHQ7aW1nJmd0OyB0YWcgd291bGRcblx0ICogICBiZSBwYXNzZWQgdG8gdGhpcyBtZXRob2QgYXMgXCJpbWdcIi5cblx0ICogQHBhcmFtIHtCb29sZWFufSBpc0Nsb3NpbmdUYWcgYHRydWVgIGlmIGl0J3MgYSBjbG9zaW5nIHRhZywgZmFsc2Vcblx0ICogICBvdGhlcndpc2UuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZX1cblx0ICovXG5cdGNyZWF0ZUVsZW1lbnROb2RlIDogZnVuY3Rpb24oIHRhZ1RleHQsIHRhZ05hbWUsIGlzQ2xvc2luZ1RhZyApIHtcblx0XHRyZXR1cm4gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZSgge1xuXHRcdFx0dGV4dCAgICA6IHRhZ1RleHQsXG5cdFx0XHR0YWdOYW1lIDogdGFnTmFtZS50b0xvd2VyQ2FzZSgpLFxuXHRcdFx0Y2xvc2luZyA6IGlzQ2xvc2luZ1RhZ1xuXHRcdH0gKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCB0byBjcmVhdGUgYSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGUgRW50aXR5Tm9kZX0uXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQgZm9yIHRoZSBIVE1MIGVudGl0eSAoc3VjaFxuXHQgKiAgIGFzICcmYW1wO25ic3A7JykuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlfVxuXHQgKi9cblx0Y3JlYXRlRW50aXR5Tm9kZSA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHJldHVybiBuZXcgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGUoIHsgdGV4dDogdGV4dCB9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSBUZXh0Tm9kZX0uXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZX1cblx0ICovXG5cdGNyZWF0ZVRleHROb2RlIDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUoIHsgdGV4dDogdGV4dCB9ICk7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAYWJzdHJhY3RcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqXG4gKiBSZXByZXNlbnRzIGFuIEhUTUwgbm9kZSBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcuIEFuIEhUTUwgbm9kZSBpcyBvbmUgb2YgdGhlXG4gKiBmb2xsb3dpbmc6XG4gKlxuICogMS4gQW4ge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZSBFbGVtZW50Tm9kZX0sIHdoaWNoIHJlcHJlc2VudHNcbiAqICAgIEhUTUwgdGFncy5cbiAqIDIuIEEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZSBDb21tZW50Tm9kZX0sIHdoaWNoIHJlcHJlc2VudHNcbiAqICAgIEhUTUwgY29tbWVudHMuXG4gKiAzLiBBIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgVGV4dE5vZGV9LCB3aGljaCByZXByZXNlbnRzIHRleHRcbiAqICAgIG91dHNpZGUgb3Igd2l0aGluIEhUTUwgdGFncy5cbiAqIDQuIEEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlIEVudGl0eU5vZGV9LCB3aGljaCByZXByZXNlbnRzXG4gKiAgICBvbmUgb2YgdGhlIGtub3duIEhUTUwgZW50aXRpZXMgdGhhdCBBdXRvbGlua2VyIGxvb2tzIGZvci4gVGhpcyBpbmNsdWRlc1xuICogICAgY29tbW9uIG9uZXMgc3VjaCBhcyAmYW1wO3F1b3Q7IGFuZCAmYW1wO25ic3A7XG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHRleHQgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgb3JpZ2luYWwgdGV4dCB0aGF0IHdhcyBtYXRjaGVkIGZvciB0aGUgSHRtbE5vZGUuXG5cdCAqXG5cdCAqIC0gSW4gdGhlIGNhc2Ugb2YgYW4ge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZSBFbGVtZW50Tm9kZX0sXG5cdCAqICAgdGhpcyB3aWxsIGJlIHRoZSB0YWcncyB0ZXh0LlxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGUgQ29tbWVudE5vZGV9LFxuXHQgKiAgIHRoaXMgd2lsbCBiZSB0aGUgY29tbWVudCdzIHRleHQuXG5cdCAqIC0gSW4gdGhlIGNhc2Ugb2YgYSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2RlfSwgdGhpc1xuXHQgKiAgIHdpbGwgYmUgdGhlIHRleHQgaXRzZWxmLlxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlIEVudGl0eU5vZGV9LFxuXHQgKiAgIHRoaXMgd2lsbCBiZSB0aGUgdGV4dCBvZiB0aGUgSFRNTCBlbnRpdHkuXG5cdCAqL1xuXHR0ZXh0IDogXCJcIixcblxuXG5cdC8qKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtPYmplY3R9IGNmZyBUaGUgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGUgTWF0Y2ggaW5zdGFuY2UsXG5cdCAqIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciA6IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IEF1dG9saW5rZXIuVXRpbC5hYnN0cmFjdE1ldGhvZCxcblxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIHtAbGluayAjdGV4dH0gZm9yIHRoZSBIdG1sTm9kZS5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnRleHQ7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqXG4gKiBSZXByZXNlbnRzIGFuIEhUTUwgY29tbWVudCBub2RlIHRoYXQgaGFzIGJlZW4gcGFyc2VkIGJ5IHRoZVxuICoge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfS5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGV9KSBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlLCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gY29tbWVudCAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSB0ZXh0IGluc2lkZSB0aGUgY29tbWVudCB0YWcuIFRoaXMgdGV4dCBpcyBzdHJpcHBlZCBvZiBhbnkgbGVhZGluZyBvclxuXHQgKiB0cmFpbGluZyB3aGl0ZXNwYWNlLlxuXHQgKi9cblx0Y29tbWVudCA6ICcnLFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnY29tbWVudCc7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgY29tbWVudCBpbnNpZGUgdGhlIGNvbW1lbnQgdGFnLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRDb21tZW50IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY29tbWVudDtcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGVcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVxuICpcbiAqIFJlcHJlc2VudHMgYW4gSFRNTCBlbGVtZW50IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHRhZ05hbWUgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgbmFtZSBvZiB0aGUgdGFnIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXHR0YWdOYW1lIDogJycsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IGNsb3NpbmcgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgdGhlIGVsZW1lbnQgKHRhZykgaXMgYSBjbG9zaW5nIHRhZywgYGZhbHNlYCBpZiBpdHMgYW4gb3BlbmluZ1xuXHQgKiB0YWcuXG5cdCAqL1xuXHRjbG9zaW5nIDogZmFsc2UsXG5cblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdlbGVtZW50Jztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBIVE1MIGVsZW1lbnQncyAodGFnJ3MpIG5hbWUuIEV4OiBmb3IgYW4gJmx0O2ltZyZndDsgdGFnLFxuXHQgKiByZXR1cm5zIFwiaW1nXCIuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFRhZ05hbWUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy50YWdOYW1lO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgdGhlIEhUTUwgZWxlbWVudCAodGFnKSBpcyBhIGNsb3NpbmcgdGFnLiBFeDogJmx0O2RpdiZndDtcblx0ICogcmV0dXJucyBgZmFsc2VgLCB3aGlsZSAmbHQ7L2RpdiZndDsgcmV0dXJucyBgdHJ1ZWAuXG5cdCAqXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59XG5cdCAqL1xuXHRpc0Nsb3NpbmcgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jbG9zaW5nO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqXG4gKiBSZXByZXNlbnRzIGEga25vd24gSFRNTCBlbnRpdHkgbm9kZSB0aGF0IGhhcyBiZWVuIHBhcnNlZCBieSB0aGUge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfS5cbiAqIEV4OiAnJmFtcDtuYnNwOycsIG9yICcmYW1wIzE2MDsnICh3aGljaCB3aWxsIGJlIHJldHJpZXZhYmxlIGZyb20gdGhlIHtAbGluayAjZ2V0VGV4dH1cbiAqIG1ldGhvZC5cbiAqXG4gKiBOb3RlIHRoYXQgdGhpcyBjbGFzcyB3aWxsIG9ubHkgYmUgcmV0dXJuZWQgZnJvbSB0aGUgSHRtbFBhcnNlciBmb3IgdGhlIHNldCBvZlxuICogY2hlY2tlZCBIVE1MIGVudGl0eSBub2RlcyAgZGVmaW5lZCBieSB0aGUge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyI2h0bWxDaGFyYWN0ZXJFbnRpdGllc1JlZ2V4fS5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGV9KSBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUsIHtcblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdlbnRpdHknO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhIHRleHQgbm9kZSB0aGF0IGhhcyBiZWVuIHBhcnNlZCBieSB0aGUge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfS5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGV9KSBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlLCB7XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAndGV4dCc7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXJcbiAqIEBleHRlbmRzIE9iamVjdFxuICpcbiAqIFVzZWQgYnkgQXV0b2xpbmtlciB0byBwYXJzZSBwb3RlbnRpYWwgbWF0Y2hlcywgZ2l2ZW4gYW4gaW5wdXQgc3RyaW5nIG9mIHRleHQuXG4gKlxuICogVGhlIE1hdGNoUGFyc2VyIGlzIGZlZCBhIG5vbi1IVE1MIHN0cmluZyBpbiBvcmRlciB0byBzZWFyY2ggZm9yIG1hdGNoZXMuXG4gKiBBdXRvbGlua2VyIGZpcnN0IHVzZXMgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0gdG8gXCJ3YWxrXG4gKiBhcm91bmRcIiBIVE1MIHRhZ3MsIGFuZCB0aGVuIHRoZSB0ZXh0IGFyb3VuZCB0aGUgSFRNTCB0YWdzIGlzIHBhc3NlZCBpbnRvIHRoZVxuICogTWF0Y2hQYXJzZXIgaW4gb3JkZXIgdG8gZmluZCB0aGUgYWN0dWFsIG1hdGNoZXMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXIgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQGNmZyB7T2JqZWN0fSB1cmxzXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjdXJsc1xuXHQgKi9cblx0dXJscyA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IGVtYWlsXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjZW1haWxcblx0ICovXG5cdGVtYWlsIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gdHdpdHRlclxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI3R3aXR0ZXJcblx0ICovXG5cdHR3aXR0ZXIgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBwaG9uZVxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI3Bob25lXG5cdCAqL1xuXHRwaG9uZTogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbi9TdHJpbmd9IGhhc2h0YWdcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNoYXNodGFnXG5cdCAqL1xuXHRoYXNodGFnIDogZmFsc2UsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHN0cmlwUHJlZml4XG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjc3RyaXBQcmVmaXhcblx0ICovXG5cdHN0cmlwUHJlZml4IDogdHJ1ZSxcblxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gbWF0Y2hlclJlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBtYXRjaGVzIFVSTHMsIGVtYWlsIGFkZHJlc3NlcywgcGhvbmUgI3MsXG5cdCAqIFR3aXR0ZXIgaGFuZGxlcywgYW5kIEhhc2h0YWdzLlxuXHQgKlxuXHQgKiBUaGlzIHJlZ3VsYXIgZXhwcmVzc2lvbiBoYXMgdGhlIGZvbGxvd2luZyBjYXB0dXJpbmcgZ3JvdXBzOlxuXHQgKlxuXHQgKiAxLiAgR3JvdXAgdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSBpZiB0aGVyZSBpcyBhIFR3aXR0ZXIgaGFuZGxlIG1hdGNoXG5cdCAqICAgICAoaS5lLiBcXEBzb21lVHdpdHRlclVzZXIpLiBTaW1wbHkgY2hlY2sgZm9yIGl0cyBleGlzdGVuY2UgdG8gZGV0ZXJtaW5lXG5cdCAqICAgICBpZiB0aGVyZSBpcyBhIFR3aXR0ZXIgaGFuZGxlIG1hdGNoLiBUaGUgbmV4dCBjb3VwbGUgb2YgY2FwdHVyaW5nXG5cdCAqICAgICBncm91cHMgZ2l2ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGUgVHdpdHRlciBoYW5kbGUgbWF0Y2guXG5cdCAqIDIuICBUaGUgd2hpdGVzcGFjZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSBcXEBzaWduIGluIGEgVHdpdHRlciBoYW5kbGUuIFRoaXNcblx0ICogICAgIGlzIG5lZWRlZCBiZWNhdXNlIHRoZXJlIGFyZSBubyBsb29rYmVoaW5kcyBpbiBKUyByZWd1bGFyIGV4cHJlc3Npb25zLFxuXHQgKiAgICAgYW5kIGNhbiBiZSB1c2VkIHRvIHJlY29uc3RydWN0IHRoZSBvcmlnaW5hbCBzdHJpbmcgaW4gYSByZXBsYWNlKCkuXG5cdCAqIDMuICBUaGUgVHdpdHRlciBoYW5kbGUgaXRzZWxmIGluIGEgVHdpdHRlciBtYXRjaC4gSWYgdGhlIG1hdGNoIGlzXG5cdCAqICAgICAnQHNvbWVUd2l0dGVyVXNlcicsIHRoZSBoYW5kbGUgaXMgJ3NvbWVUd2l0dGVyVXNlcicuXG5cdCAqIDQuICBHcm91cCB0aGF0IG1hdGNoZXMgYW4gZW1haWwgYWRkcmVzcy4gVXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlIG1hdGNoXG5cdCAqICAgICBpcyBhbiBlbWFpbCBhZGRyZXNzLCBhcyB3ZWxsIGFzIGhvbGRpbmcgdGhlIGZ1bGwgYWRkcmVzcy4gRXg6XG5cdCAqICAgICAnbWVAbXkuY29tJ1xuXHQgKiA1LiAgR3JvdXAgdGhhdCBtYXRjaGVzIGEgVVJMIGluIHRoZSBpbnB1dCB0ZXh0LiBFeDogJ2h0dHA6Ly9nb29nbGUuY29tJyxcblx0ICogICAgICd3d3cuZ29vZ2xlLmNvbScsIG9yIGp1c3QgJ2dvb2dsZS5jb20nLiBUaGlzIGFsc28gaW5jbHVkZXMgYSBwYXRoLFxuXHQgKiAgICAgdXJsIHBhcmFtZXRlcnMsIG9yIGhhc2ggYW5jaG9ycy4gRXg6IGdvb2dsZS5jb20vcGF0aC90by9maWxlP3ExPTEmcTI9MiNteUFuY2hvclxuXHQgKiA2LiAgR3JvdXAgdGhhdCBtYXRjaGVzIGEgcHJvdG9jb2wgVVJMIChpLmUuICdodHRwOi8vZ29vZ2xlLmNvbScpLiBUaGlzIGlzXG5cdCAqICAgICB1c2VkIHRvIG1hdGNoIHByb3RvY29sIFVSTHMgd2l0aCBqdXN0IGEgc2luZ2xlIHdvcmQsIGxpa2UgJ2h0dHA6Ly9sb2NhbGhvc3QnLFxuXHQgKiAgICAgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lIGhhcyBhdCBsZWFzdCBvbmUgJy4nXG5cdCAqICAgICBpbiBpdC5cblx0ICogNy4gIEdyb3VwIHRoYXQgbWF0Y2hlcyBhICd3d3cuJyBwcmVmaXhlZCBVUkwuIFRoaXMgaXMgb25seSBtYXRjaGVkIGlmIHRoZVxuXHQgKiAgICAgJ3d3dy4nIHRleHQgd2FzIG5vdCBwcmVmaXhlZCBieSBhIHNjaGVtZSAoaS5lLjogbm90IHByZWZpeGVkIGJ5XG5cdCAqICAgICAnaHR0cDovLycsICdmdHA6JywgZXRjLilcblx0ICogOC4gIEEgcHJvdG9jb2wtcmVsYXRpdmUgKCcvLycpIG1hdGNoIGZvciB0aGUgY2FzZSBvZiBhICd3d3cuJyBwcmVmaXhlZFxuXHQgKiAgICAgVVJMLiBXaWxsIGJlIGFuIGVtcHR5IHN0cmluZyBpZiBpdCBpcyBub3QgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaC5cblx0ICogICAgIFdlIG5lZWQgdG8ga25vdyB0aGUgY2hhcmFjdGVyIGJlZm9yZSB0aGUgJy8vJyBpbiBvcmRlciB0byBkZXRlcm1pbmVcblx0ICogICAgIGlmIGl0IGlzIGEgdmFsaWQgbWF0Y2ggb3IgdGhlIC8vIHdhcyBpbiBhIHN0cmluZyB3ZSBkb24ndCB3YW50IHRvXG5cdCAqICAgICBhdXRvLWxpbmsuXG5cdCAqIDkuICBHcm91cCB0aGF0IG1hdGNoZXMgYSBrbm93biBUTEQgKHRvcCBsZXZlbCBkb21haW4pLCB3aGVuIGEgc2NoZW1lXG5cdCAqICAgICBvciAnd3d3LictcHJlZml4ZWQgZG9tYWluIGlzIG5vdCBtYXRjaGVkLlxuXHQgKiAxMC4gIEEgcHJvdG9jb2wtcmVsYXRpdmUgKCcvLycpIG1hdGNoIGZvciB0aGUgY2FzZSBvZiBhIGtub3duIFRMRCBwcmVmaXhlZFxuXHQgKiAgICAgVVJMLiBXaWxsIGJlIGFuIGVtcHR5IHN0cmluZyBpZiBpdCBpcyBub3QgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaC5cblx0ICogICAgIFNlZSAjNiBmb3IgbW9yZSBpbmZvLlxuXHQgKiAxMS4gR3JvdXAgdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSBpZiB0aGVyZSBpcyBhIHBob25lIG51bWJlciBtYXRjaC5cblx0ICogMTIuIElmIHRoZXJlIGlzIGEgcGhvbmUgbnVtYmVyIG1hdGNoLCBhbmQgYSAnKycgc2lnbiB3YXMgaW5jbHVkZWQgd2l0aFxuXHQgKiAgICAgdGhlIHBob25lIG51bWJlciwgdGhpcyBncm91cCB3aWxsIGJlIHBvcHVsYXRlZCB3aXRoIHRoZSAnKycgc2lnbi5cblx0ICogMTMuIEdyb3VwIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlcmUgaXMgYSBIYXNodGFnIG1hdGNoXG5cdCAqICAgICAoaS5lLiBcXCNzb21lSGFzaHRhZykuIFNpbXBseSBjaGVjayBmb3IgaXRzIGV4aXN0ZW5jZSB0byBkZXRlcm1pbmUgaWZcblx0ICogICAgIHRoZXJlIGlzIGEgSGFzaHRhZyBtYXRjaC4gVGhlIG5leHQgY291cGxlIG9mIGNhcHR1cmluZyBncm91cHMgZ2l2ZVxuXHQgKiAgICAgaW5mb3JtYXRpb24gYWJvdXQgdGhlIEhhc2h0YWcgbWF0Y2guXG5cdCAqIDE0LiBUaGUgd2hpdGVzcGFjZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAjc2lnbiBpbiBhIEhhc2h0YWcgaGFuZGxlLiBUaGlzXG5cdCAqICAgICBpcyBuZWVkZWQgYmVjYXVzZSB0aGVyZSBhcmUgbm8gbG9vay1iZWhpbmRzIGluIEpTIHJlZ3VsYXJcblx0ICogICAgIGV4cHJlc3Npb25zLCBhbmQgY2FuIGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhXG5cdCAqICAgICByZXBsYWNlKCkuXG5cdCAqIDE1LiBUaGUgSGFzaHRhZyBpdHNlbGYgaW4gYSBIYXNodGFnIG1hdGNoLiBJZiB0aGUgbWF0Y2ggaXNcblx0ICogICAgICcjc29tZUhhc2h0YWcnLCB0aGUgaGFzaHRhZyBpcyAnc29tZUhhc2h0YWcnLlxuXHQgKi9cblx0bWF0Y2hlclJlZ2V4IDogKGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0d2l0dGVyUmVnZXggPSAvKF58W15cXHddKUAoXFx3ezEsMTV9KS8sICAgICAgICAgICAgICAvLyBGb3IgbWF0Y2hpbmcgYSB0d2l0dGVyIGhhbmRsZS4gRXg6IEBncmVnb3J5X2phY29ic1xuXG5cdFx0ICAgIGhhc2h0YWdSZWdleCA9IC8oXnxbXlxcd10pIyhcXHd7MSwxMzl9KS8sICAgICAgICAgICAgICAvLyBGb3IgbWF0Y2hpbmcgYSBIYXNodGFnLiBFeDogI2dhbWVzXG5cblx0XHQgICAgZW1haWxSZWdleCA9IC8oPzpbXFwtOzomPVxcK1xcJCxcXHdcXC5dK0ApLywgICAgICAgICAgICAgLy8gc29tZXRoaW5nQCBmb3IgZW1haWwgYWRkcmVzc2VzIChhLmsuYS4gbG9jYWwtcGFydClcblx0XHQgICAgcGhvbmVSZWdleCA9IC8oPzooXFwrKT9cXGR7MSwzfVstXFwwNDAuXSk/XFwoP1xcZHszfVxcKT9bLVxcMDQwLl0/XFxkezN9Wy1cXDA0MC5dXFxkezR9LywgIC8vIGV4OiAoMTIzKSA0NTYtNzg5MCwgMTIzIDQ1NiA3ODkwLCAxMjMtNDU2LTc4OTAsIGV0Yy5cblx0XHQgICAgcHJvdG9jb2xSZWdleCA9IC8oPzpbQS1aYS16XVstLitBLVphLXowLTldKjooPyFbQS1aYS16XVstLitBLVphLXowLTldKjpcXC9cXC8pKD8hXFxkK1xcLz8pKD86XFwvXFwvKT8pLywgIC8vIG1hdGNoIHByb3RvY29sLCBhbGxvdyBpbiBmb3JtYXQgXCJodHRwOi8vXCIgb3IgXCJtYWlsdG86XCIuIEhvd2V2ZXIsIGRvIG5vdCBtYXRjaCB0aGUgZmlyc3QgcGFydCBvZiBzb21ldGhpbmcgbGlrZSAnbGluazpodHRwOi8vd3d3Lmdvb2dsZS5jb20nIChpLmUuIGRvbid0IG1hdGNoIFwibGluazpcIikuIEFsc28sIG1ha2Ugc3VyZSB3ZSBkb24ndCBpbnRlcnByZXQgJ2dvb2dsZS5jb206ODAwMCcgYXMgaWYgJ2dvb2dsZS5jb20nIHdhcyBhIHByb3RvY29sIGhlcmUgKGkuZS4gaWdub3JlIGEgdHJhaWxpbmcgcG9ydCBudW1iZXIgaW4gdGhpcyByZWdleClcblx0XHQgICAgd3d3UmVnZXggPSAvKD86d3d3XFwuKS8sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGFydGluZyB3aXRoICd3d3cuJ1xuXHRcdCAgICBkb21haW5OYW1lUmVnZXggPSAvW0EtWmEtejAtOVxcLlxcLV0qW0EtWmEtejAtOVxcLV0vLCAgLy8gYW55dGhpbmcgbG9va2luZyBhdCBhbGwgbGlrZSBhIGRvbWFpbiwgbm9uLXVuaWNvZGUgZG9tYWlucywgbm90IGVuZGluZyBpbiBhIHBlcmlvZFxuXHRcdCAgICB0bGRSZWdleCA9IC9cXC4oPzppbnRlcm5hdGlvbmFsfGNvbnN0cnVjdGlvbnxjb250cmFjdG9yc3xlbnRlcnByaXNlc3xwaG90b2dyYXBoeXxwcm9kdWN0aW9uc3xmb3VuZGF0aW9ufGltbW9iaWxpZW58aW5kdXN0cmllc3xtYW5hZ2VtZW50fHByb3BlcnRpZXN8dGVjaG5vbG9neXxjaHJpc3RtYXN8Y29tbXVuaXR5fGRpcmVjdG9yeXxlZHVjYXRpb258ZXF1aXBtZW50fGluc3RpdHV0ZXxtYXJrZXRpbmd8c29sdXRpb25zfHZhY2F0aW9uc3xiYXJnYWluc3xib3V0aXF1ZXxidWlsZGVyc3xjYXRlcmluZ3xjbGVhbmluZ3xjbG90aGluZ3xjb21wdXRlcnxkZW1vY3JhdHxkaWFtb25kc3xncmFwaGljc3xob2xkaW5nc3xsaWdodGluZ3xwYXJ0bmVyc3xwbHVtYmluZ3xzdXBwbGllc3x0cmFpbmluZ3x2ZW50dXJlc3xhY2FkZW15fGNhcmVlcnN8Y29tcGFueXxjcnVpc2VzfGRvbWFpbnN8ZXhwb3NlZHxmbGlnaHRzfGZsb3Jpc3R8Z2FsbGVyeXxndWl0YXJzfGhvbGlkYXl8a2l0Y2hlbnxuZXVzdGFyfG9raW5hd2F8cmVjaXBlc3xyZW50YWxzfHJldmlld3N8c2hpa3NoYXxzaW5nbGVzfHN1cHBvcnR8c3lzdGVtc3xhZ2VuY3l8YmVybGlufGNhbWVyYXxjZW50ZXJ8Y29mZmVlfGNvbmRvc3xkYXRpbmd8ZXN0YXRlfGV2ZW50c3xleHBlcnR8ZnV0Ym9sfGthdWZlbnxsdXh1cnl8bWFpc29ufG1vbmFzaHxtdXNldW18bmFnb3lhfHBob3Rvc3xyZXBhaXJ8cmVwb3J0fHNvY2lhbHxzdXBwbHl8dGF0dG9vfHRpZW5kYXx0cmF2ZWx8dmlhamVzfHZpbGxhc3x2aXNpb258dm90aW5nfHZveWFnZXxhY3RvcnxidWlsZHxjYXJkc3xjaGVhcHxjb2Rlc3xkYW5jZXxlbWFpbHxnbGFzc3xob3VzZXxtYW5nb3xuaW5qYXxwYXJ0c3xwaG90b3xwcmVzc3xzaG9lc3xzb2xhcnx0b2RheXx0b2t5b3x0b29sc3x3YXRjaHx3b3Jrc3xhZXJvfGFycGF8YXNpYXxiZXN0fGJpa2V8Ymx1ZXxidXp6fGNhbXB8Y2x1Ynxjb29sfGNvb3B8ZmFybXxmaXNofGdpZnR8Z3VydXxpbmZvfGpvYnN8a2l3aXxrcmVkfGxhbmR8bGltb3xsaW5rfG1lbnV8bW9iaXxtb2RhfG5hbWV8cGljc3xwaW5rfHBvc3R8cXBvbnxyaWNofHJ1aHJ8c2V4eXx0aXBzfHZvdGV8dm90b3x3YW5nfHdpZW58d2lraXx6b25lfGJhcnxiaWR8Yml6fGNhYnxjYXR8Y2VvfGNvbXxlZHV8Z292fGludHxraW18bWlsfG5ldHxvbmx8b3JnfHByb3xwdWJ8cmVkfHRlbHx1bm98d2VkfHh4eHx4eXp8YWN8YWR8YWV8YWZ8YWd8YWl8YWx8YW18YW58YW98YXF8YXJ8YXN8YXR8YXV8YXd8YXh8YXp8YmF8YmJ8YmR8YmV8YmZ8Ymd8Ymh8Yml8Ymp8Ym18Ym58Ym98YnJ8YnN8YnR8YnZ8Ynd8Ynl8Ynp8Y2F8Y2N8Y2R8Y2Z8Y2d8Y2h8Y2l8Y2t8Y2x8Y218Y258Y298Y3J8Y3V8Y3Z8Y3d8Y3h8Y3l8Y3p8ZGV8ZGp8ZGt8ZG18ZG98ZHp8ZWN8ZWV8ZWd8ZXJ8ZXN8ZXR8ZXV8Zml8Zmp8Zmt8Zm18Zm98ZnJ8Z2F8Z2J8Z2R8Z2V8Z2Z8Z2d8Z2h8Z2l8Z2x8Z218Z258Z3B8Z3F8Z3J8Z3N8Z3R8Z3V8Z3d8Z3l8aGt8aG18aG58aHJ8aHR8aHV8aWR8aWV8aWx8aW18aW58aW98aXF8aXJ8aXN8aXR8amV8am18am98anB8a2V8a2d8a2h8a2l8a218a258a3B8a3J8a3d8a3l8a3p8bGF8bGJ8bGN8bGl8bGt8bHJ8bHN8bHR8bHV8bHZ8bHl8bWF8bWN8bWR8bWV8bWd8bWh8bWt8bWx8bW18bW58bW98bXB8bXF8bXJ8bXN8bXR8bXV8bXZ8bXd8bXh8bXl8bXp8bmF8bmN8bmV8bmZ8bmd8bml8bmx8bm98bnB8bnJ8bnV8bnp8b218cGF8cGV8cGZ8cGd8cGh8cGt8cGx8cG18cG58cHJ8cHN8cHR8cHd8cHl8cWF8cmV8cm98cnN8cnV8cnd8c2F8c2J8c2N8c2R8c2V8c2d8c2h8c2l8c2p8c2t8c2x8c218c258c298c3J8c3R8c3V8c3Z8c3h8c3l8c3p8dGN8dGR8dGZ8dGd8dGh8dGp8dGt8dGx8dG18dG58dG98dHB8dHJ8dHR8dHZ8dHd8dHp8dWF8dWd8dWt8dXN8dXl8dXp8dmF8dmN8dmV8dmd8dml8dm58dnV8d2Z8d3N8eWV8eXR8emF8em18encpXFxiLywgICAvLyBtYXRjaCBvdXIga25vd24gdG9wIGxldmVsIGRvbWFpbnMgKFRMRHMpXG5cblx0XHQgICAgLy8gQWxsb3cgb3B0aW9uYWwgcGF0aCwgcXVlcnkgc3RyaW5nLCBhbmQgaGFzaCBhbmNob3IsIG5vdCBlbmRpbmcgaW4gdGhlIGZvbGxvd2luZyBjaGFyYWN0ZXJzOiBcIj8hOiwuO1wiXG5cdFx0ICAgIC8vIGh0dHA6Ly9ibG9nLmNvZGluZ2hvcnJvci5jb20vdGhlLXByb2JsZW0td2l0aC11cmxzL1xuXHRcdCAgICB1cmxTdWZmaXhSZWdleCA9IC9bXFwtQS1aYS16MC05KyZAI1xcLyU9fl8oKXwnJCpcXFtcXF0/ITosLjtdKltcXC1BLVphLXowLTkrJkAjXFwvJT1+XygpfCckKlxcW1xcXV0vO1xuXG5cdFx0cmV0dXJuIG5ldyBSZWdFeHAoIFtcblx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDEsIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGNoZWNrIGZvciBhIHR3aXR0ZXIgaGFuZGxlIG1hdGNoLiBVc2UgZ3JvdXAgJDMgZm9yIHRoZSBhY3R1YWwgdHdpdHRlciBoYW5kbGUgdGhvdWdoLiAkMiBtYXkgYmUgdXNlZCB0byByZWNvbnN0cnVjdCB0aGUgb3JpZ2luYWwgc3RyaW5nIGluIGEgcmVwbGFjZSgpXG5cdFx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDIsIHdoaWNoIG1hdGNoZXMgdGhlIHdoaXRlc3BhY2UgY2hhcmFjdGVyIGJlZm9yZSB0aGUgJ0AnIHNpZ24gKG5lZWRlZCBiZWNhdXNlIG9mIG5vIGxvb2tiZWhpbmRzKSwgYW5kXG5cdFx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDMsIHdoaWNoIG1hdGNoZXMgdGhlIGFjdHVhbCB0d2l0dGVyIGhhbmRsZVxuXHRcdFx0XHR0d2l0dGVyUmVnZXguc291cmNlLFxuXHRcdFx0JyknLFxuXG5cdFx0XHQnfCcsXG5cblx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDQsIHdoaWNoIGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGFuIGVtYWlsIG1hdGNoXG5cdFx0XHRcdGVtYWlsUmVnZXguc291cmNlLFxuXHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHR0bGRSZWdleC5zb3VyY2UsXG5cdFx0XHQnKScsXG5cblx0XHRcdCd8JyxcblxuXHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkNSwgd2hpY2ggaXMgdXNlZCB0byBtYXRjaCBhIFVSTFxuXHRcdFx0XHQnKD86JywgLy8gcGFyZW5zIHRvIGNvdmVyIG1hdGNoIGZvciBwcm90b2NvbCAob3B0aW9uYWwpLCBhbmQgZG9tYWluXG5cdFx0XHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkNiwgZm9yIGEgc2NoZW1lLXByZWZpeGVkIHVybCAoZXg6IGh0dHA6Ly9nb29nbGUuY29tKVxuXHRcdFx0XHRcdFx0cHJvdG9jb2xSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdCcpJyxcblxuXHRcdFx0XHRcdCd8JyxcblxuXHRcdFx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDcsIGZvciBhICd3d3cuJyBwcmVmaXhlZCB1cmwgKGV4OiB3d3cuZ29vZ2xlLmNvbSlcblx0XHRcdFx0XHRcdCcoLj8vLyk/JywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDggZm9yIGFuIG9wdGlvbmFsIHByb3RvY29sLXJlbGF0aXZlIFVSTC4gTXVzdCBiZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmcgb3Igc3RhcnQgd2l0aCBhIG5vbi13b3JkIGNoYXJhY3RlclxuXHRcdFx0XHRcdFx0d3d3UmVnZXguc291cmNlLFxuXHRcdFx0XHRcdFx0ZG9tYWluTmFtZVJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHQnKScsXG5cblx0XHRcdFx0XHQnfCcsXG5cblx0XHRcdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ5LCBmb3Iga25vd24gYSBUTEQgdXJsIChleDogZ29vZ2xlLmNvbSlcblx0XHRcdFx0XHRcdCcoLj8vLyk/JywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDEwIGZvciBhbiBvcHRpb25hbCBwcm90b2NvbC1yZWxhdGl2ZSBVUkwuIE11c3QgYmUgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nIG9yIHN0YXJ0IHdpdGggYSBub24td29yZCBjaGFyYWN0ZXJcblx0XHRcdFx0XHRcdGRvbWFpbk5hbWVSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0XHR0bGRSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0JyknLFxuXHRcdFx0XHQnKScsXG5cblx0XHRcdFx0Jyg/OicgKyB1cmxTdWZmaXhSZWdleC5zb3VyY2UgKyAnKT8nLCAgLy8gbWF0Y2ggZm9yIHBhdGgsIHF1ZXJ5IHN0cmluZywgYW5kL29yIGhhc2ggYW5jaG9yIC0gb3B0aW9uYWxcblx0XHRcdCcpJyxcblxuXHRcdFx0J3wnLFxuXG5cdFx0XHQvLyB0aGlzIHNldHVwIGRvZXMgbm90IHNjYWxlIHdlbGwgZm9yIG9wZW4gZXh0ZW5zaW9uIDooIE5lZWQgdG8gcmV0aGluayBkZXNpZ24gb2YgYXV0b2xpbmtlci4uLlxuXHRcdFx0Ly8gKioqIENhcHR1cmluZyBncm91cCAkMTEsIHdoaWNoIG1hdGNoZXMgYSAoVVNBIGZvciBub3cpIHBob25lIG51bWJlciwgYW5kXG5cdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxMiwgd2hpY2ggbWF0Y2hlcyB0aGUgJysnIHNpZ24gZm9yIGludGVybmF0aW9uYWwgbnVtYmVycywgaWYgaXQgZXhpc3RzXG5cdFx0XHQnKCcsXG5cdFx0XHRcdHBob25lUmVnZXguc291cmNlLFxuXHRcdFx0JyknLFxuXG5cdFx0XHQnfCcsXG5cblx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDEzLCB3aGljaCBjYW4gYmUgdXNlZCB0byBjaGVjayBmb3IgYSBIYXNodGFnIG1hdGNoLiBVc2UgZ3JvdXAgJDEyIGZvciB0aGUgYWN0dWFsIEhhc2h0YWcgdGhvdWdoLiAkMTEgbWF5IGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhIHJlcGxhY2UoKVxuXHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxNCwgd2hpY2ggbWF0Y2hlcyB0aGUgd2hpdGVzcGFjZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnIycgc2lnbiAobmVlZGVkIGJlY2F1c2Ugb2Ygbm8gbG9va2JlaGluZHMpLCBhbmRcblx0XHRcdFx0Ly8gKioqIENhcHR1cmluZyBncm91cCAkMTUsIHdoaWNoIG1hdGNoZXMgdGhlIGFjdHVhbCBIYXNodGFnXG5cdFx0XHRcdGhhc2h0YWdSZWdleC5zb3VyY2UsXG5cdFx0XHQnKSdcblx0XHRdLmpvaW4oIFwiXCIgKSwgJ2dpJyApO1xuXHR9ICkoKSxcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGNoYXJCZWZvcmVQcm90b2NvbFJlbE1hdGNoUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHJldHJpZXZlIHRoZSBjaGFyYWN0ZXIgYmVmb3JlIGFcblx0ICogcHJvdG9jb2wtcmVsYXRpdmUgVVJMIG1hdGNoLlxuXHQgKlxuXHQgKiBUaGlzIGlzIHVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUge0BsaW5rICNtYXRjaGVyUmVnZXh9LCB3aGljaCBuZWVkc1xuXHQgKiB0byBncmFiIHRoZSBjaGFyYWN0ZXIgYmVmb3JlIGEgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBkdWUgdG8gdGhlIGxhY2sgb2Zcblx0ICogYSBuZWdhdGl2ZSBsb29rLWJlaGluZCBpbiBKYXZhU2NyaXB0IHJlZ3VsYXIgZXhwcmVzc2lvbnMuIFRoZSBjaGFyYWN0ZXJcblx0ICogYmVmb3JlIHRoZSBtYXRjaCBpcyBzdHJpcHBlZCBmcm9tIHRoZSBVUkwuXG5cdCAqL1xuXHRjaGFyQmVmb3JlUHJvdG9jb2xSZWxNYXRjaFJlZ2V4IDogL14oLik/XFwvXFwvLyxcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtBdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yfSBtYXRjaFZhbGlkYXRvclxuXHQgKlxuXHQgKiBUaGUgTWF0Y2hWYWxpZGF0b3Igb2JqZWN0LCB1c2VkIHRvIGZpbHRlciBvdXQgYW55IGZhbHNlIHBvc2l0aXZlcyBmcm9tXG5cdCAqIHRoZSB7QGxpbmsgI21hdGNoZXJSZWdleH0uIFNlZSB7QGxpbmsgQXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvcn0gZm9yIGRldGFpbHMuXG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge09iamVjdH0gW2NmZ10gVGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEFuY2hvclRhZ0J1aWxkZXJcblx0ICogaW5zdGFuY2UsIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciA6IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7XG5cblx0XHR0aGlzLm1hdGNoVmFsaWRhdG9yID0gbmV3IEF1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3IoKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBQYXJzZXMgdGhlIGlucHV0IGB0ZXh0YCB0byBzZWFyY2ggZm9yIG1hdGNoZXMsIGFuZCBjYWxscyB0aGUgYHJlcGxhY2VGbmBcblx0ICogdG8gYWxsb3cgcmVwbGFjZW1lbnRzIG9mIHRoZSBtYXRjaGVzLiBSZXR1cm5zIHRoZSBgdGV4dGAgd2l0aCBtYXRjaGVzXG5cdCAqIHJlcGxhY2VkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0byBzZWFyY2ggYW5kIHJlcGFjZSBtYXRjaGVzIGluLlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSByZXBsYWNlRm4gVGhlIGl0ZXJhdG9yIGZ1bmN0aW9uIHRvIGhhbmRsZSB0aGVcblx0ICogICByZXBsYWNlbWVudHMuIFRoZSBmdW5jdGlvbiB0YWtlcyBhIHNpbmdsZSBhcmd1bWVudCwgYSB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH1cblx0ICogICBvYmplY3QsIGFuZCBzaG91bGQgcmV0dXJuIHRoZSB0ZXh0IHRoYXQgc2hvdWxkIG1ha2UgdGhlIHJlcGxhY2VtZW50LlxuXHQgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRPYmo9d2luZG93XSBUaGUgY29udGV4dCBvYmplY3QgKFwic2NvcGVcIikgdG8gcnVuXG5cdCAqICAgdGhlIGByZXBsYWNlRm5gIGluLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRyZXBsYWNlIDogZnVuY3Rpb24oIHRleHQsIHJlcGxhY2VGbiwgY29udGV4dE9iaiApIHtcblx0XHR2YXIgbWUgPSB0aGlzOyAgLy8gZm9yIGNsb3N1cmVcblxuXHRcdHJldHVybiB0ZXh0LnJlcGxhY2UoIHRoaXMubWF0Y2hlclJlZ2V4LCBmdW5jdGlvbiggbWF0Y2hTdHIvKiwgJDEsICQyLCAkMywgJDQsICQ1LCAkNiwgJDcsICQ4LCAkOSwgJDEwLCAkMTEsICQxMiwgJDEzLCAkMTQsICQxNSovICkge1xuXHRcdFx0dmFyIG1hdGNoRGVzY09iaiA9IG1lLnByb2Nlc3NDYW5kaWRhdGVNYXRjaC5hcHBseSggbWUsIGFyZ3VtZW50cyApOyAgLy8gXCJtYXRjaCBkZXNjcmlwdGlvblwiIG9iamVjdFxuXG5cdFx0XHQvLyBSZXR1cm4gb3V0IHdpdGggbm8gY2hhbmdlcyBmb3IgbWF0Y2ggdHlwZXMgdGhhdCBhcmUgZGlzYWJsZWQgKHVybCxcblx0XHRcdC8vIGVtYWlsLCBwaG9uZSwgZXRjLiksIG9yIGZvciBtYXRjaGVzIHRoYXQgYXJlIGludmFsaWQgKGZhbHNlXG5cdFx0XHQvLyBwb3NpdGl2ZXMgZnJvbSB0aGUgbWF0Y2hlclJlZ2V4LCB3aGljaCBjYW4ndCB1c2UgbG9vay1iZWhpbmRzXG5cdFx0XHQvLyBzaW5jZSB0aGV5IGFyZSB1bmF2YWlsYWJsZSBpbiBKUykuXG5cdFx0XHRpZiggIW1hdGNoRGVzY09iaiApIHtcblx0XHRcdFx0cmV0dXJuIG1hdGNoU3RyO1xuXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBHZW5lcmF0ZSByZXBsYWNlbWVudCB0ZXh0IGZvciB0aGUgbWF0Y2ggZnJvbSB0aGUgYHJlcGxhY2VGbmBcblx0XHRcdFx0dmFyIHJlcGxhY2VTdHIgPSByZXBsYWNlRm4uY2FsbCggY29udGV4dE9iaiwgbWF0Y2hEZXNjT2JqLm1hdGNoICk7XG5cdFx0XHRcdHJldHVybiBtYXRjaERlc2NPYmoucHJlZml4U3RyICsgcmVwbGFjZVN0ciArIG1hdGNoRGVzY09iai5zdWZmaXhTdHI7XG5cdFx0XHR9XG5cdFx0fSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFByb2Nlc3NlcyBhIGNhbmRpZGF0ZSBtYXRjaCBmcm9tIHRoZSB7QGxpbmsgI21hdGNoZXJSZWdleH0uXG5cdCAqXG5cdCAqIE5vdCBhbGwgbWF0Y2hlcyBmb3VuZCBieSB0aGUgcmVnZXggYXJlIGFjdHVhbCBVUkwvRW1haWwvUGhvbmUvVHdpdHRlci9IYXNodGFnXG5cdCAqIG1hdGNoZXMsIGFzIGRldGVybWluZWQgYnkgdGhlIHtAbGluayAjbWF0Y2hWYWxpZGF0b3J9LiBJbiB0aGlzIGNhc2UsIHRoZVxuXHQgKiBtZXRob2QgcmV0dXJucyBgbnVsbGAuIE90aGVyd2lzZSwgYSB2YWxpZCBPYmplY3Qgd2l0aCBgcHJlZml4U3RyYCxcblx0ICogYG1hdGNoYCwgYW5kIGBzdWZmaXhTdHJgIGlzIHJldHVybmVkLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbWF0Y2hTdHIgVGhlIGZ1bGwgbWF0Y2ggdGhhdCB3YXMgZm91bmQgYnkgdGhlXG5cdCAqICAge0BsaW5rICNtYXRjaGVyUmVnZXh9LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdHdpdHRlck1hdGNoIFRoZSBtYXRjaGVkIHRleHQgb2YgYSBUd2l0dGVyIGhhbmRsZSwgaWYgdGhlXG5cdCAqICAgbWF0Y2ggaXMgYSBUd2l0dGVyIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdHdpdHRlckhhbmRsZVByZWZpeFdoaXRlc3BhY2VDaGFyIFRoZSB3aGl0ZXNwYWNlIGNoYXJcblx0ICogICBiZWZvcmUgdGhlIEAgc2lnbiBpbiBhIFR3aXR0ZXIgaGFuZGxlIG1hdGNoLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIG9mXG5cdCAqICAgbm8gbG9va2JlaGluZHMgaW4gSlMgcmVnZXhlcywgYW5kIGlzIG5lZWQgdG8gcmUtaW5jbHVkZSB0aGUgY2hhcmFjdGVyXG5cdCAqICAgZm9yIHRoZSBhbmNob3IgdGFnIHJlcGxhY2VtZW50LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdHdpdHRlckhhbmRsZSBUaGUgYWN0dWFsIFR3aXR0ZXIgdXNlciAoaS5lIHRoZSB3b3JkIGFmdGVyXG5cdCAqICAgdGhlIEAgc2lnbiBpbiBhIFR3aXR0ZXIgbWF0Y2gpLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gZW1haWxBZGRyZXNzTWF0Y2ggVGhlIG1hdGNoZWQgZW1haWwgYWRkcmVzcyBmb3IgYW4gZW1haWxcblx0ICogICBhZGRyZXNzIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMIHN0cmluZyBmb3IgYSBVUkwgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzY2hlbWVVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbFxuXHQgKiAgIG1hdGNoLiBFeDogJ2h0dHA6Ly95YWhvby5jb20nLiBUaGlzIGlzIHVzZWQgdG8gbWF0Y2ggc29tZXRoaW5nIGxpa2Vcblx0ICogICAnaHR0cDovL2xvY2FsaG9zdCcsIHdoZXJlIHdlIHdvbid0IGRvdWJsZSBjaGVjayB0aGF0IHRoZSBkb21haW4gbmFtZVxuXHQgKiAgIGhhcyBhdCBsZWFzdCBvbmUgJy4nIGluIGl0LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gd3d3TWF0Y2ggVGhlIG1hdGNoZWQgc3RyaW5nIG9mIGEgJ3d3dy4nLXByZWZpeGVkIFVSTCB0aGF0XG5cdCAqICAgd2FzIG1hdGNoZWQuIFRoaXMgaXMgb25seSBtYXRjaGVkIGlmIHRoZSAnd3d3LicgdGV4dCB3YXMgbm90IHByZWZpeGVkXG5cdCAqICAgYnkgYSBzY2hlbWUgKGkuZS46IG5vdCBwcmVmaXhlZCBieSAnaHR0cDovLycsICdmdHA6JywgZXRjLikuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2ggVGhlICcvLycgZm9yIGEgcHJvdG9jb2wtcmVsYXRpdmVcblx0ICogICBtYXRjaCBmcm9tIGEgJ3d3dycgdXJsLCB3aXRoIHRoZSBjaGFyYWN0ZXIgdGhhdCBjb21lcyBiZWZvcmUgdGhlICcvLycuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0bGRNYXRjaCBUaGUgbWF0Y2hlZCBzdHJpbmcgb2YgYSBrbm93biBUTEQgKHRvcCBsZXZlbFxuXHQgKiAgIGRvbWFpbiksIHdoZW4gYSBzY2hlbWUgb3IgJ3d3dy4nLXByZWZpeGVkIGRvbWFpbiBpcyBub3QgbWF0Y2hlZC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHRsZFByb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgJy8vJyBmb3IgYSBwcm90b2NvbC1yZWxhdGl2ZVxuXHQgKiAgIG1hdGNoIGZyb20gYSBUTEQgKHRvcCBsZXZlbCBkb21haW4pIG1hdGNoLCB3aXRoIHRoZSBjaGFyYWN0ZXIgdGhhdFxuXHQgKiAgIGNvbWVzIGJlZm9yZSB0aGUgJy8vJy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHBob25lTWF0Y2ggVGhlIG1hdGNoZWQgdGV4dCBvZiBhIHBob25lIG51bWJlclxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcGhvbmVQbHVzU2lnbk1hdGNoIFRoZSAnKycgc2lnbiBpbiB0aGUgcGhvbmUgbnVtYmVyLCBpZlxuXHQgKiAgIGl0IHdhcyB0aGVyZS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGhhc2h0YWdNYXRjaCBUaGUgbWF0Y2hlZCB0ZXh0IG9mIGEgVHdpdHRlclxuXHQgKiAgIEhhc2h0YWcsIGlmIHRoZSBtYXRjaCBpcyBhIEhhc2h0YWcgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBoYXNodGFnUHJlZml4V2hpdGVzcGFjZUNoYXIgVGhlIHdoaXRlc3BhY2UgY2hhclxuXHQgKiAgIGJlZm9yZSB0aGUgIyBzaWduIGluIGEgSGFzaHRhZyBtYXRjaC4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSBvZiBub1xuXHQgKiAgIGxvb2tiZWhpbmRzIGluIEpTIHJlZ2V4ZXMsIGFuZCBpcyBuZWVkIHRvIHJlLWluY2x1ZGUgdGhlIGNoYXJhY3RlciBmb3Jcblx0ICogICB0aGUgYW5jaG9yIHRhZyByZXBsYWNlbWVudC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGhhc2h0YWcgVGhlIGFjdHVhbCBIYXNodGFnIChpLmUgdGhlIHdvcmRcblx0ICogICBhZnRlciB0aGUgIyBzaWduIGluIGEgSGFzaHRhZyBtYXRjaCkuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQSBcIm1hdGNoIGRlc2NyaXB0aW9uIG9iamVjdFwiLiBUaGlzIHdpbGwgYmUgYG51bGxgIGlmIHRoZVxuXHQgKiAgIG1hdGNoIHdhcyBpbnZhbGlkLCBvciBpZiBhIG1hdGNoIHR5cGUgaXMgZGlzYWJsZWQuIE90aGVyd2lzZSwgdGhpcyB3aWxsXG5cdCAqICAgYmUgYW4gT2JqZWN0IChtYXApIHdpdGggdGhlIGZvbGxvd2luZyBwcm9wZXJ0aWVzOlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybi5wcmVmaXhTdHIgVGhlIGNoYXIocykgdGhhdCBzaG91bGQgYmUgcHJlcGVuZGVkIHRvXG5cdCAqICAgdGhlIHJlcGxhY2VtZW50IHN0cmluZy4gVGhlc2UgYXJlIGNoYXIocykgdGhhdCB3ZXJlIG5lZWRlZCB0byBiZVxuXHQgKiAgIGluY2x1ZGVkIGZyb20gdGhlIHJlZ2V4IG1hdGNoIHRoYXQgd2VyZSBpZ25vcmVkIGJ5IHByb2Nlc3NpbmcgY29kZSwgYW5kXG5cdCAqICAgc2hvdWxkIGJlIHJlLWluc2VydGVkIGludG8gdGhlIHJlcGxhY2VtZW50IHN0cmVhbS5cblx0ICogQHJldHVybiB7U3RyaW5nfSByZXR1cm4uc3VmZml4U3RyIFRoZSBjaGFyKHMpIHRoYXQgc2hvdWxkIGJlIGFwcGVuZGVkIHRvXG5cdCAqICAgdGhlIHJlcGxhY2VtZW50IHN0cmluZy4gVGhlc2UgYXJlIGNoYXIocykgdGhhdCB3ZXJlIG5lZWRlZCB0byBiZVxuXHQgKiAgIGluY2x1ZGVkIGZyb20gdGhlIHJlZ2V4IG1hdGNoIHRoYXQgd2VyZSBpZ25vcmVkIGJ5IHByb2Nlc3NpbmcgY29kZSwgYW5kXG5cdCAqICAgc2hvdWxkIGJlIHJlLWluc2VydGVkIGludG8gdGhlIHJlcGxhY2VtZW50IHN0cmVhbS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5tYXRjaC5NYXRjaH0gcmV0dXJuLm1hdGNoIFRoZSBNYXRjaCBvYmplY3QgdGhhdFxuXHQgKiAgIHJlcHJlc2VudHMgdGhlIG1hdGNoIHRoYXQgd2FzIGZvdW5kLlxuXHQgKi9cblx0cHJvY2Vzc0NhbmRpZGF0ZU1hdGNoIDogZnVuY3Rpb24oXG5cdFx0bWF0Y2hTdHIsIHR3aXR0ZXJNYXRjaCwgdHdpdHRlckhhbmRsZVByZWZpeFdoaXRlc3BhY2VDaGFyLCB0d2l0dGVySGFuZGxlLFxuXHRcdGVtYWlsQWRkcmVzc01hdGNoLCB1cmxNYXRjaCwgc2NoZW1lVXJsTWF0Y2gsIHd3d01hdGNoLCB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2gsXG5cdFx0dGxkTWF0Y2gsIHRsZFByb3RvY29sUmVsYXRpdmVNYXRjaCwgcGhvbmVNYXRjaCwgcGhvbmVQbHVzU2lnbk1hdGNoLCBoYXNodGFnTWF0Y2gsXG5cdFx0aGFzaHRhZ1ByZWZpeFdoaXRlc3BhY2VDaGFyLCBoYXNodGFnXG5cdCkge1xuXHRcdC8vIE5vdGU6IFRoZSBgbWF0Y2hTdHJgIHZhcmlhYmxlIHdpbCBiZSBmaXhlZCB1cCB0byByZW1vdmUgY2hhcmFjdGVycyB0aGF0IGFyZSBubyBsb25nZXIgbmVlZGVkICh3aGljaCB3aWxsXG5cdFx0Ly8gYmUgYWRkZWQgdG8gYHByZWZpeFN0cmAgYW5kIGBzdWZmaXhTdHJgKS5cblxuXHRcdHZhciBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggPSB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2ggfHwgdGxkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoLFxuXHRcdCAgICBtYXRjaCwgIC8vIFdpbGwgYmUgYW4gQXV0b2xpbmtlci5tYXRjaC5NYXRjaCBvYmplY3RcblxuXHRcdCAgICBwcmVmaXhTdHIgPSBcIlwiLCAgLy8gQSBzdHJpbmcgdG8gdXNlIHRvIHByZWZpeCB0aGUgYW5jaG9yIHRhZyB0aGF0IGlzIGNyZWF0ZWQuIFRoaXMgaXMgbmVlZGVkIGZvciB0aGUgVHdpdHRlciBhbmQgSGFzaHRhZyBtYXRjaGVzLlxuXHRcdCAgICBzdWZmaXhTdHIgPSBcIlwiLCAgLy8gQSBzdHJpbmcgdG8gc3VmZml4IHRoZSBhbmNob3IgdGFnIHRoYXQgaXMgY3JlYXRlZC4gVGhpcyBpcyB1c2VkIGlmIHRoZXJlIGlzIGEgdHJhaWxpbmcgcGFyZW50aGVzaXMgdGhhdCBzaG91bGQgbm90IGJlIGF1dG8tbGlua2VkLlxuXG5cdFx0ICAgIHVybHMgPSB0aGlzLnVybHM7ICAvLyB0aGUgJ3VybHMnIGNvbmZpZ1xuXG5cdFx0Ly8gUmV0dXJuIG91dCB3aXRoIGBudWxsYCBmb3IgbWF0Y2ggdHlwZXMgdGhhdCBhcmUgZGlzYWJsZWQgKHVybCwgZW1haWwsXG5cdFx0Ly8gdHdpdHRlciwgaGFzaHRhZyksIG9yIGZvciBtYXRjaGVzIHRoYXQgYXJlIGludmFsaWQgKGZhbHNlIHBvc2l0aXZlc1xuXHRcdC8vIGZyb20gdGhlIG1hdGNoZXJSZWdleCwgd2hpY2ggY2FuJ3QgdXNlIGxvb2stYmVoaW5kcyBzaW5jZSB0aGV5IGFyZVxuXHRcdC8vIHVuYXZhaWxhYmxlIGluIEpTKS5cblx0XHRpZihcblx0XHRcdCggc2NoZW1lVXJsTWF0Y2ggJiYgIXVybHMuc2NoZW1lTWF0Y2hlcyApIHx8XG5cdFx0XHQoIHd3d01hdGNoICYmICF1cmxzLnd3d01hdGNoZXMgKSB8fFxuXHRcdFx0KCB0bGRNYXRjaCAmJiAhdXJscy50bGRNYXRjaGVzICkgfHxcblx0XHRcdCggZW1haWxBZGRyZXNzTWF0Y2ggJiYgIXRoaXMuZW1haWwgKSB8fFxuXHRcdFx0KCBwaG9uZU1hdGNoICYmICF0aGlzLnBob25lICkgfHxcblx0XHRcdCggdHdpdHRlck1hdGNoICYmICF0aGlzLnR3aXR0ZXIgKSB8fFxuXHRcdFx0KCBoYXNodGFnTWF0Y2ggJiYgIXRoaXMuaGFzaHRhZyApIHx8XG5cdFx0XHQhdGhpcy5tYXRjaFZhbGlkYXRvci5pc1ZhbGlkTWF0Y2goIHVybE1hdGNoLCBzY2hlbWVVcmxNYXRjaCwgcHJvdG9jb2xSZWxhdGl2ZU1hdGNoIClcblx0XHQpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdC8vIEhhbmRsZSBhIGNsb3NpbmcgcGFyZW50aGVzaXMgYXQgdGhlIGVuZCBvZiB0aGUgbWF0Y2gsIGFuZCBleGNsdWRlIGl0XG5cdFx0Ly8gaWYgdGhlcmUgaXMgbm90IGEgbWF0Y2hpbmcgb3BlbiBwYXJlbnRoZXNpc1xuXHRcdC8vIGluIHRoZSBtYXRjaCBpdHNlbGYuXG5cdFx0aWYoIHRoaXMubWF0Y2hIYXNVbmJhbGFuY2VkQ2xvc2luZ1BhcmVuKCBtYXRjaFN0ciApICkge1xuXHRcdFx0bWF0Y2hTdHIgPSBtYXRjaFN0ci5zdWJzdHIoIDAsIG1hdGNoU3RyLmxlbmd0aCAtIDEgKTsgIC8vIHJlbW92ZSB0aGUgdHJhaWxpbmcgXCIpXCJcblx0XHRcdHN1ZmZpeFN0ciA9IFwiKVwiOyAgLy8gdGhpcyB3aWxsIGJlIGFkZGVkIGFmdGVyIHRoZSBnZW5lcmF0ZWQgPGE+IHRhZ1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBIYW5kbGUgYW4gaW52YWxpZCBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIFRMRFxuXHRcdFx0dmFyIHBvcyA9IHRoaXMubWF0Y2hIYXNJbnZhbGlkQ2hhckFmdGVyVGxkKCB1cmxNYXRjaCwgc2NoZW1lVXJsTWF0Y2ggKTtcblx0XHRcdGlmKCBwb3MgPiAtMSApIHtcblx0XHRcdFx0c3VmZml4U3RyID0gbWF0Y2hTdHIuc3Vic3RyKHBvcyk7ICAvLyB0aGlzIHdpbGwgYmUgYWRkZWQgYWZ0ZXIgdGhlIGdlbmVyYXRlZCA8YT4gdGFnXG5cdFx0XHRcdG1hdGNoU3RyID0gbWF0Y2hTdHIuc3Vic3RyKCAwLCBwb3MgKTsgLy8gcmVtb3ZlIHRoZSB0cmFpbGluZyBpbnZhbGlkIGNoYXJzXG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYoIGVtYWlsQWRkcmVzc01hdGNoICkge1xuXHRcdFx0bWF0Y2ggPSBuZXcgQXV0b2xpbmtlci5tYXRjaC5FbWFpbCggeyBtYXRjaGVkVGV4dDogbWF0Y2hTdHIsIGVtYWlsOiBlbWFpbEFkZHJlc3NNYXRjaCB9ICk7XG5cblx0XHR9IGVsc2UgaWYoIHR3aXR0ZXJNYXRjaCApIHtcblx0XHRcdC8vIGZpeCB1cCB0aGUgYG1hdGNoU3RyYCBpZiB0aGVyZSB3YXMgYSBwcmVjZWRpbmcgd2hpdGVzcGFjZSBjaGFyLFxuXHRcdFx0Ly8gd2hpY2ggd2FzIG5lZWRlZCB0byBkZXRlcm1pbmUgdGhlIG1hdGNoIGl0c2VsZiAoc2luY2UgdGhlcmUgYXJlXG5cdFx0XHQvLyBubyBsb29rLWJlaGluZHMgaW4gSlMgcmVnZXhlcylcblx0XHRcdGlmKCB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXIgKSB7XG5cdFx0XHRcdHByZWZpeFN0ciA9IHR3aXR0ZXJIYW5kbGVQcmVmaXhXaGl0ZXNwYWNlQ2hhcjtcblx0XHRcdFx0bWF0Y2hTdHIgPSBtYXRjaFN0ci5zbGljZSggMSApOyAgLy8gcmVtb3ZlIHRoZSBwcmVmaXhlZCB3aGl0ZXNwYWNlIGNoYXIgZnJvbSB0aGUgbWF0Y2hcblx0XHRcdH1cblx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guVHdpdHRlciggeyBtYXRjaGVkVGV4dDogbWF0Y2hTdHIsIHR3aXR0ZXJIYW5kbGU6IHR3aXR0ZXJIYW5kbGUgfSApO1xuXG5cdFx0fSBlbHNlIGlmKCBwaG9uZU1hdGNoICkge1xuXHRcdFx0Ly8gcmVtb3ZlIG5vbi1udW1lcmljIHZhbHVlcyBmcm9tIHBob25lIG51bWJlciBzdHJpbmdcblx0XHRcdHZhciBjbGVhbk51bWJlciA9IG1hdGNoU3RyLnJlcGxhY2UoIC9cXEQvZywgJycgKTtcbiBcdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLlBob25lKCB7IG1hdGNoZWRUZXh0OiBtYXRjaFN0ciwgbnVtYmVyOiBjbGVhbk51bWJlciwgcGx1c1NpZ246ICEhcGhvbmVQbHVzU2lnbk1hdGNoIH0gKTtcblxuXHRcdH0gZWxzZSBpZiggaGFzaHRhZ01hdGNoICkge1xuXHRcdFx0Ly8gZml4IHVwIHRoZSBgbWF0Y2hTdHJgIGlmIHRoZXJlIHdhcyBhIHByZWNlZGluZyB3aGl0ZXNwYWNlIGNoYXIsXG5cdFx0XHQvLyB3aGljaCB3YXMgbmVlZGVkIHRvIGRldGVybWluZSB0aGUgbWF0Y2ggaXRzZWxmIChzaW5jZSB0aGVyZSBhcmVcblx0XHRcdC8vIG5vIGxvb2stYmVoaW5kcyBpbiBKUyByZWdleGVzKVxuXHRcdFx0aWYoIGhhc2h0YWdQcmVmaXhXaGl0ZXNwYWNlQ2hhciApIHtcblx0XHRcdFx0cHJlZml4U3RyID0gaGFzaHRhZ1ByZWZpeFdoaXRlc3BhY2VDaGFyO1xuXHRcdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnNsaWNlKCAxICk7ICAvLyByZW1vdmUgdGhlIHByZWZpeGVkIHdoaXRlc3BhY2UgY2hhciBmcm9tIHRoZSBtYXRjaFxuXHRcdFx0fVxuXHRcdFx0bWF0Y2ggPSBuZXcgQXV0b2xpbmtlci5tYXRjaC5IYXNodGFnKCB7IG1hdGNoZWRUZXh0OiBtYXRjaFN0ciwgc2VydmljZU5hbWU6IHRoaXMuaGFzaHRhZywgaGFzaHRhZzogaGFzaHRhZyB9ICk7XG5cblx0XHR9IGVsc2UgeyAgLy8gdXJsIG1hdGNoXG5cdFx0XHQvLyBJZiBpdCdzIGEgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBtYXRjaCwgcmVtb3ZlIHRoZSBjaGFyYWN0ZXJcblx0XHRcdC8vIGJlZm9yZSB0aGUgJy8vJyAod2hpY2ggdGhlIG1hdGNoZXJSZWdleCBuZWVkZWQgdG8gbWF0Y2ggZHVlIHRvXG5cdFx0XHQvLyB0aGUgbGFjayBvZiBhIG5lZ2F0aXZlIGxvb2stYmVoaW5kIGluIEphdmFTY3JpcHQgcmVndWxhclxuXHRcdFx0Ly8gZXhwcmVzc2lvbnMpXG5cdFx0XHRpZiggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdFx0XHR2YXIgY2hhckJlZm9yZU1hdGNoID0gcHJvdG9jb2xSZWxhdGl2ZU1hdGNoLm1hdGNoKCB0aGlzLmNoYXJCZWZvcmVQcm90b2NvbFJlbE1hdGNoUmVnZXggKVsgMSBdIHx8IFwiXCI7XG5cblx0XHRcdFx0aWYoIGNoYXJCZWZvcmVNYXRjaCApIHsgIC8vIGZpeCB1cCB0aGUgYG1hdGNoU3RyYCBpZiB0aGVyZSB3YXMgYSBwcmVjZWRpbmcgY2hhciBiZWZvcmUgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCwgd2hpY2ggd2FzIG5lZWRlZCB0byBkZXRlcm1pbmUgdGhlIG1hdGNoIGl0c2VsZiAoc2luY2UgdGhlcmUgYXJlIG5vIGxvb2stYmVoaW5kcyBpbiBKUyByZWdleGVzKVxuXHRcdFx0XHRcdHByZWZpeFN0ciA9IGNoYXJCZWZvcmVNYXRjaDtcblx0XHRcdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnNsaWNlKCAxICk7ICAvLyByZW1vdmUgdGhlIHByZWZpeGVkIGNoYXIgZnJvbSB0aGUgbWF0Y2hcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLlVybCgge1xuXHRcdFx0XHRtYXRjaGVkVGV4dCA6IG1hdGNoU3RyLFxuXHRcdFx0XHR1cmwgOiBtYXRjaFN0cixcblx0XHRcdFx0cHJvdG9jb2xVcmxNYXRjaCA6ICEhc2NoZW1lVXJsTWF0Y2gsXG5cdFx0XHRcdHByb3RvY29sUmVsYXRpdmVNYXRjaCA6ICEhcHJvdG9jb2xSZWxhdGl2ZU1hdGNoLFxuXHRcdFx0XHRzdHJpcFByZWZpeCA6IHRoaXMuc3RyaXBQcmVmaXhcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4ge1xuXHRcdFx0cHJlZml4U3RyIDogcHJlZml4U3RyLFxuXHRcdFx0c3VmZml4U3RyIDogc3VmZml4U3RyLFxuXHRcdFx0bWF0Y2ggICAgIDogbWF0Y2hcblx0XHR9O1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgYSBtYXRjaCBmb3VuZCBoYXMgYW4gdW5tYXRjaGVkIGNsb3NpbmcgcGFyZW50aGVzaXMuIElmIHNvLFxuXHQgKiB0aGlzIHBhcmVudGhlc2lzIHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBtYXRjaCBpdHNlbGYsIGFuZCBhcHBlbmRlZFxuXHQgKiBhZnRlciB0aGUgZ2VuZXJhdGVkIGFuY2hvciB0YWcgaW4ge0BsaW5rICNwcm9jZXNzQ2FuZGlkYXRlTWF0Y2h9LlxuXHQgKlxuXHQgKiBBIG1hdGNoIG1heSBoYXZlIGFuIGV4dHJhIGNsb3NpbmcgcGFyZW50aGVzaXMgYXQgdGhlIGVuZCBvZiB0aGUgbWF0Y2hcblx0ICogYmVjYXVzZSB0aGUgcmVndWxhciBleHByZXNzaW9uIG11c3QgaW5jbHVkZSBwYXJlbnRoZXNpcyBmb3IgVVJMcyBzdWNoIGFzXG5cdCAqIFwid2lraXBlZGlhLmNvbS9zb21ldGhpbmdfKGRpc2FtYmlndWF0aW9uKVwiLCB3aGljaCBzaG91bGQgYmUgYXV0by1saW5rZWQuXG5cdCAqXG5cdCAqIEhvd2V2ZXIsIGFuIGV4dHJhIHBhcmVudGhlc2lzICp3aWxsKiBiZSBpbmNsdWRlZCB3aGVuIHRoZSBVUkwgaXRzZWxmIGlzXG5cdCAqIHdyYXBwZWQgaW4gcGFyZW50aGVzaXMsIHN1Y2ggYXMgaW4gdGhlIGNhc2Ugb2YgXCIod2lraXBlZGlhLmNvbS9zb21ldGhpbmdfKGRpc2FtYmlndWF0aW9uKSlcIi5cblx0ICogSW4gdGhpcyBjYXNlLCB0aGUgbGFzdCBjbG9zaW5nIHBhcmVudGhlc2lzIHNob3VsZCAqbm90KiBiZSBwYXJ0IG9mIHRoZVxuXHQgKiBVUkwgaXRzZWxmLCBhbmQgdGhpcyBtZXRob2Qgd2lsbCByZXR1cm4gYHRydWVgLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbWF0Y2hTdHIgVGhlIGZ1bGwgbWF0Y2ggc3RyaW5nIGZyb20gdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fS5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZXJlIGlzIGFuIHVuYmFsYW5jZWQgY2xvc2luZyBwYXJlbnRoZXNpcyBhdFxuXHQgKiAgIHRoZSBlbmQgb2YgdGhlIGBtYXRjaFN0cmAsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0bWF0Y2hIYXNVbmJhbGFuY2VkQ2xvc2luZ1BhcmVuIDogZnVuY3Rpb24oIG1hdGNoU3RyICkge1xuXHRcdHZhciBsYXN0Q2hhciA9IG1hdGNoU3RyLmNoYXJBdCggbWF0Y2hTdHIubGVuZ3RoIC0gMSApO1xuXG5cdFx0aWYoIGxhc3RDaGFyID09PSAnKScgKSB7XG5cdFx0XHR2YXIgb3BlblBhcmVuc01hdGNoID0gbWF0Y2hTdHIubWF0Y2goIC9cXCgvZyApLFxuXHRcdFx0ICAgIGNsb3NlUGFyZW5zTWF0Y2ggPSBtYXRjaFN0ci5tYXRjaCggL1xcKS9nICksXG5cdFx0XHQgICAgbnVtT3BlblBhcmVucyA9ICggb3BlblBhcmVuc01hdGNoICYmIG9wZW5QYXJlbnNNYXRjaC5sZW5ndGggKSB8fCAwLFxuXHRcdFx0ICAgIG51bUNsb3NlUGFyZW5zID0gKCBjbG9zZVBhcmVuc01hdGNoICYmIGNsb3NlUGFyZW5zTWF0Y2gubGVuZ3RoICkgfHwgMDtcblxuXHRcdFx0aWYoIG51bU9wZW5QYXJlbnMgPCBudW1DbG9zZVBhcmVucyApIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSBpZiB0aGVyZSdzIGFuIGludmFsaWQgY2hhcmFjdGVyIGFmdGVyIHRoZSBUTEQgaW4gYSBVUkwuIFZhbGlkXG5cdCAqIGNoYXJhY3RlcnMgYWZ0ZXIgVExEIGFyZSAnOi8/IycuIEV4Y2x1ZGUgcHJvdG9jb2wgbWF0Y2hlZCBVUkxzIGZyb20gdGhpc1xuXHQgKiBjaGVjay5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHVybE1hdGNoIFRoZSBtYXRjaGVkIFVSTCwgaWYgdGhlcmUgd2FzIG9uZS4gV2lsbCBiZSBhblxuXHQgKiAgIGVtcHR5IHN0cmluZyBpZiB0aGUgbWF0Y2ggaXMgbm90IGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbFxuXHQgKiAgIG1hdGNoLiBFeDogJ2h0dHA6Ly95YWhvby5jb20nLiBUaGlzIGlzIHVzZWQgdG8gbWF0Y2ggc29tZXRoaW5nIGxpa2Vcblx0ICogICAnaHR0cDovL2xvY2FsaG9zdCcsIHdoZXJlIHdlIHdvbid0IGRvdWJsZSBjaGVjayB0aGF0IHRoZSBkb21haW4gbmFtZVxuXHQgKiAgIGhhcyBhdCBsZWFzdCBvbmUgJy4nIGluIGl0LlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBwb3NpdGlvbiB3aGVyZSB0aGUgaW52YWxpZCBjaGFyYWN0ZXIgd2FzIGZvdW5kLiBJZlxuXHQgKiAgIG5vIHN1Y2ggY2hhcmFjdGVyIHdhcyBmb3VuZCwgcmV0dXJucyAtMVxuXHQgKi9cblx0bWF0Y2hIYXNJbnZhbGlkQ2hhckFmdGVyVGxkIDogZnVuY3Rpb24oIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdGlmICggIXVybE1hdGNoICkge1xuXHRcdFx0cmV0dXJuIC0xO1xuXHRcdH1cblxuXHRcdHZhciBvZmZzZXQgPSAwO1xuXHRcdGlmICggcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRcdG9mZnNldCA9IHVybE1hdGNoLmluZGV4T2YoJzonKTtcblx0XHRcdHVybE1hdGNoID0gdXJsTWF0Y2guc2xpY2Uob2Zmc2V0KTtcblx0XHR9XG5cblx0XHR2YXIgcmUgPSAvXigoLj9cXC9cXC8pP1tBLVphLXowLTlcXC5cXC1dKltBLVphLXowLTlcXC1dXFwuW0EtWmEtel0rKS87XG5cdFx0dmFyIHJlcyA9IHJlLmV4ZWMoIHVybE1hdGNoICk7XG5cdFx0aWYgKCByZXMgPT09IG51bGwgKSB7XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXG5cdFx0b2Zmc2V0ICs9IHJlc1sxXS5sZW5ndGg7XG5cdFx0dXJsTWF0Y2ggPSB1cmxNYXRjaC5zbGljZShyZXNbMV0ubGVuZ3RoKTtcblx0XHRpZiAoL15bXi5BLVphLXo6XFwvPyNdLy50ZXN0KHVybE1hdGNoKSkge1xuXHRcdFx0cmV0dXJuIG9mZnNldDtcblx0XHR9XG5cblx0XHRyZXR1cm4gLTE7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKmpzaGludCBzY3JpcHR1cmw6dHJ1ZSAqL1xuLyoqXG4gKiBAcHJpdmF0ZVxuICogQGNsYXNzIEF1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3JcbiAqIEBleHRlbmRzIE9iamVjdFxuICpcbiAqIFVzZWQgYnkgQXV0b2xpbmtlciB0byBmaWx0ZXIgb3V0IGZhbHNlIHBvc2l0aXZlcyBmcm9tIHRoZVxuICoge0BsaW5rIEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXIjbWF0Y2hlclJlZ2V4fS5cbiAqXG4gKiBEdWUgdG8gdGhlIGxpbWl0YXRpb25zIG9mIHJlZ3VsYXIgZXhwcmVzc2lvbnMgKGluY2x1ZGluZyB0aGUgbWlzc2luZyBmZWF0dXJlXG4gKiBvZiBsb29rLWJlaGluZHMgaW4gSlMgcmVndWxhciBleHByZXNzaW9ucyksIHdlIGNhbm5vdCBhbHdheXMgZGV0ZXJtaW5lIHRoZVxuICogdmFsaWRpdHkgb2YgYSBnaXZlbiBtYXRjaC4gVGhpcyBjbGFzcyBhcHBsaWVzIGEgYml0IG9mIGFkZGl0aW9uYWwgbG9naWMgdG9cbiAqIGZpbHRlciBvdXQgYW55IGZhbHNlIHBvc2l0aXZlcyB0aGF0IGhhdmUgYmVlbiBtYXRjaGVkIGJ5IHRoZVxuICoge0BsaW5rIEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXIjbWF0Y2hlclJlZ2V4fS5cbiAqL1xuQXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvciA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaW52YWxpZFByb3RvY29sUmVsTWF0Y2hSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gY2hlY2sgYSBwb3RlbnRpYWwgcHJvdG9jb2wtcmVsYXRpdmUgVVJMXG5cdCAqIG1hdGNoLCBjb21pbmcgZnJvbSB0aGUge0BsaW5rIEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXIjbWF0Y2hlclJlZ2V4fS5cblx0ICogQSBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgaXMsIGZvciBleGFtcGxlLCBcIi8veWFob28uY29tXCJcblx0ICpcblx0ICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gY2hlY2tzIHRvIHNlZSBpZiB0aGVyZSBpcyBhIHdvcmQgY2hhcmFjdGVyIGJlZm9yZVxuXHQgKiB0aGUgJy8vJyBtYXRjaCBpbiBvcmRlciB0byBkZXRlcm1pbmUgaWYgd2Ugc2hvdWxkIGFjdHVhbGx5IGF1dG9saW5rIGFcblx0ICogcHJvdG9jb2wtcmVsYXRpdmUgVVJMLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZ2F0aXZlXG5cdCAqIGxvb2stYmVoaW5kIGluIEphdmFTY3JpcHQgcmVndWxhciBleHByZXNzaW9ucy5cblx0ICpcblx0ICogRm9yIGluc3RhbmNlLCB3ZSB3YW50IHRvIGF1dG9saW5rIHNvbWV0aGluZyBsaWtlIFwiR28gdG86IC8vZ29vZ2xlLmNvbVwiLFxuXHQgKiBidXQgd2UgZG9uJ3Qgd2FudCB0byBhdXRvbGluayBzb21ldGhpbmcgbGlrZSBcImFiYy8vZ29vZ2xlLmNvbVwiXG5cdCAqL1xuXHRpbnZhbGlkUHJvdG9jb2xSZWxNYXRjaFJlZ2V4IDogL15bXFx3XVxcL1xcLy8sXG5cblx0LyoqXG5cdCAqIFJlZ2V4IHRvIHRlc3QgZm9yIGEgZnVsbCBwcm90b2NvbCwgd2l0aCB0aGUgdHdvIHRyYWlsaW5nIHNsYXNoZXMuIEV4OiAnaHR0cDovLydcblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGhhc0Z1bGxQcm90b2NvbFJlZ2V4XG5cdCAqL1xuXHRoYXNGdWxsUHJvdG9jb2xSZWdleCA6IC9eW0EtWmEtel1bLS4rQS1aYS16MC05XSo6XFwvXFwvLyxcblxuXHQvKipcblx0ICogUmVnZXggdG8gZmluZCB0aGUgVVJJIHNjaGVtZSwgc3VjaCBhcyAnbWFpbHRvOicuXG5cdCAqXG5cdCAqIFRoaXMgaXMgdXNlZCB0byBmaWx0ZXIgb3V0ICdqYXZhc2NyaXB0OicgYW5kICd2YnNjcmlwdDonIHNjaGVtZXMuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSB1cmlTY2hlbWVSZWdleFxuXHQgKi9cblx0dXJpU2NoZW1lUmVnZXggOiAvXltBLVphLXpdWy0uK0EtWmEtejAtOV0qOi8sXG5cblx0LyoqXG5cdCAqIFJlZ2V4IHRvIGRldGVybWluZSBpZiBhdCBsZWFzdCBvbmUgd29yZCBjaGFyIGV4aXN0cyBhZnRlciB0aGUgcHJvdG9jb2wgKGkuZS4gYWZ0ZXIgdGhlICc6Jylcblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGhhc1dvcmRDaGFyQWZ0ZXJQcm90b2NvbFJlZ2V4XG5cdCAqL1xuXHRoYXNXb3JkQ2hhckFmdGVyUHJvdG9jb2xSZWdleCA6IC86W15cXHNdKj9bQS1aYS16XS8sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIGdpdmVuIG1hdGNoIGZvdW5kIGJ5IHRoZSB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlcn1cblx0ICogaXMgdmFsaWQuIFdpbGwgcmV0dXJuIGBmYWxzZWAgZm9yOlxuXHQgKlxuXHQgKiAxKSBVUkwgbWF0Y2hlcyB3aGljaCBkbyBub3QgaGF2ZSBhdCBsZWFzdCBoYXZlIG9uZSBwZXJpb2QgKCcuJykgaW4gdGhlXG5cdCAqICAgIGRvbWFpbiBuYW1lIChlZmZlY3RpdmVseSBza2lwcGluZyBvdmVyIG1hdGNoZXMgbGlrZSBcImFiYzpkZWZcIikuXG5cdCAqICAgIEhvd2V2ZXIsIFVSTCBtYXRjaGVzIHdpdGggYSBwcm90b2NvbCB3aWxsIGJlIGFsbG93ZWQgKGV4OiAnaHR0cDovL2xvY2FsaG9zdCcpXG5cdCAqIDIpIFVSTCBtYXRjaGVzIHdoaWNoIGRvIG5vdCBoYXZlIGF0IGxlYXN0IG9uZSB3b3JkIGNoYXJhY3RlciBpbiB0aGVcblx0ICogICAgZG9tYWluIG5hbWUgKGVmZmVjdGl2ZWx5IHNraXBwaW5nIG92ZXIgbWF0Y2hlcyBsaWtlIFwiZ2l0OjEuMFwiKS5cblx0ICogMykgQSBwcm90b2NvbC1yZWxhdGl2ZSB1cmwgbWF0Y2ggKGEgVVJMIGJlZ2lubmluZyB3aXRoICcvLycpIHdob3NlXG5cdCAqICAgIHByZXZpb3VzIGNoYXJhY3RlciBpcyBhIHdvcmQgY2hhcmFjdGVyIChlZmZlY3RpdmVseSBza2lwcGluZyBvdmVyXG5cdCAqICAgIHN0cmluZ3MgbGlrZSBcImFiYy8vZ29vZ2xlLmNvbVwiKVxuXHQgKlxuXHQgKiBPdGhlcndpc2UsIHJldHVybnMgYHRydWVgLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuXG5cdCAqICAgZW1wdHkgc3RyaW5nIGlmIHRoZSBtYXRjaCBpcyBub3QgYSBVUkwgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFVybE1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIHByb3RvY29sXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBtYXRjaCBzb21ldGhpbmcgbGlrZVxuXHQgKiAgICdodHRwOi8vbG9jYWxob3N0Jywgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lXG5cdCAqICAgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggVGhlIHByb3RvY29sLXJlbGF0aXZlIHN0cmluZyBmb3IgYVxuXHQgKiAgIFVSTCBtYXRjaCAoaS5lLiAnLy8nKSwgcG9zc2libHkgd2l0aCBhIHByZWNlZGluZyBjaGFyYWN0ZXIgKGV4LCBhXG5cdCAqICAgc3BhY2UsIHN1Y2ggYXM6ICcgLy8nLCBvciBhIGxldHRlciwgc3VjaCBhczogJ2EvLycpLiBUaGUgbWF0Y2ggaXNcblx0ICogICBpbnZhbGlkIGlmIHRoZXJlIGlzIGEgd29yZCBjaGFyYWN0ZXIgcHJlY2VkaW5nIHRoZSAnLy8nLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIG1hdGNoIGdpdmVuIGlzIHZhbGlkIGFuZCBzaG91bGQgYmVcblx0ICogICBwcm9jZXNzZWQsIG9yIGBmYWxzZWAgaWYgdGhlIG1hdGNoIGlzIGludmFsaWQgYW5kL29yIHNob3VsZCBqdXN0IG5vdCBiZVxuXHQgKiAgIHByb2Nlc3NlZC5cblx0ICovXG5cdGlzVmFsaWRNYXRjaCA6IGZ1bmN0aW9uKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCwgcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdGlmKFxuXHRcdFx0KCBwcm90b2NvbFVybE1hdGNoICYmICF0aGlzLmlzVmFsaWRVcmlTY2hlbWUoIHByb3RvY29sVXJsTWF0Y2ggKSApIHx8XG5cdFx0XHR0aGlzLnVybE1hdGNoRG9lc05vdEhhdmVQcm90b2NvbE9yRG90KCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHx8ICAgICAgIC8vIEF0IGxlYXN0IG9uZSBwZXJpb2QgKCcuJykgbXVzdCBleGlzdCBpbiB0aGUgVVJMIG1hdGNoIGZvciB1cyB0byBjb25zaWRlciBpdCBhbiBhY3R1YWwgVVJMLCAqdW5sZXNzKiBpdCB3YXMgYSBmdWxsIHByb3RvY29sIG1hdGNoIChsaWtlICdodHRwOi8vbG9jYWxob3N0Jylcblx0XHRcdHRoaXMudXJsTWF0Y2hEb2VzTm90SGF2ZUF0TGVhc3RPbmVXb3JkQ2hhciggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2ggKSB8fCAgLy8gQXQgbGVhc3Qgb25lIGxldHRlciBjaGFyYWN0ZXIgbXVzdCBleGlzdCBpbiB0aGUgZG9tYWluIG5hbWUgYWZ0ZXIgYSBwcm90b2NvbCBtYXRjaC4gRXg6IHNraXAgb3ZlciBzb21ldGhpbmcgbGlrZSBcImdpdDoxLjBcIlxuXHRcdFx0dGhpcy5pc0ludmFsaWRQcm90b2NvbFJlbGF0aXZlTWF0Y2goIHByb3RvY29sUmVsYXRpdmVNYXRjaCApICAgICAgICAgICAgICAgICAvLyBBIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoIHdoaWNoIGhhcyBhIHdvcmQgY2hhcmFjdGVyIGluIGZyb250IG9mIGl0IChzbyB3ZSBjYW4gc2tpcCBzb21ldGhpbmcgbGlrZSBcImFiYy8vZ29vZ2xlLmNvbVwiKVxuXHRcdCkge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgdGhlIFVSSSBzY2hlbWUgaXMgYSB2YWxpZCBzY2hlbWUgdG8gYmUgYXV0b2xpbmtlZC4gUmV0dXJuc1xuXHQgKiBgZmFsc2VgIGlmIHRoZSBzY2hlbWUgaXMgJ2phdmFzY3JpcHQ6JyBvciAndmJzY3JpcHQ6J1xuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJpU2NoZW1lTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgZnVsbCBVUkkgc2NoZW1lXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScgb3IgJ21haWx0bzphQGEuY29tJy5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBzY2hlbWUgaXMgYSB2YWxpZCBvbmUsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0aXNWYWxpZFVyaVNjaGVtZSA6IGZ1bmN0aW9uKCB1cmlTY2hlbWVNYXRjaCApIHtcblx0XHR2YXIgdXJpU2NoZW1lID0gdXJpU2NoZW1lTWF0Y2gubWF0Y2goIHRoaXMudXJpU2NoZW1lUmVnZXggKVsgMCBdLnRvTG93ZXJDYXNlKCk7XG5cblx0XHRyZXR1cm4gKCB1cmlTY2hlbWUgIT09ICdqYXZhc2NyaXB0OicgJiYgdXJpU2NoZW1lICE9PSAndmJzY3JpcHQ6JyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgYSBVUkwgbWF0Y2ggZG9lcyBub3QgaGF2ZSBlaXRoZXI6XG5cdCAqXG5cdCAqIGEpIGEgZnVsbCBwcm90b2NvbCAoaS5lLiAnaHR0cDovLycpLCBvclxuXHQgKiBiKSBhdCBsZWFzdCBvbmUgZG90ICgnLicpIGluIHRoZSBkb21haW4gbmFtZSAoZm9yIGEgbm9uLWZ1bGwtcHJvdG9jb2xcblx0ICogICAgbWF0Y2gpLlxuXHQgKlxuXHQgKiBFaXRoZXIgc2l0dWF0aW9uIGlzIGNvbnNpZGVyZWQgYW4gaW52YWxpZCBVUkwgKGV4OiAnZ2l0OmQnIGRvZXMgbm90IGhhdmVcblx0ICogZWl0aGVyIHRoZSAnOi8vJyBwYXJ0LCBvciBhdCBsZWFzdCBvbmUgZG90IGluIHRoZSBkb21haW4gbmFtZS4gSWYgdGhlXG5cdCAqIG1hdGNoIHdhcyAnZ2l0OmFiYy5jb20nLCB3ZSB3b3VsZCBjb25zaWRlciB0aGlzIHZhbGlkLilcblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHVybE1hdGNoIFRoZSBtYXRjaGVkIFVSTCwgaWYgdGhlcmUgd2FzIG9uZS4gV2lsbCBiZSBhblxuXHQgKiAgIGVtcHR5IHN0cmluZyBpZiB0aGUgbWF0Y2ggaXMgbm90IGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbFxuXHQgKiAgIG1hdGNoLiBFeDogJ2h0dHA6Ly95YWhvby5jb20nLiBUaGlzIGlzIHVzZWQgdG8gbWF0Y2ggc29tZXRoaW5nIGxpa2Vcblx0ICogICAnaHR0cDovL2xvY2FsaG9zdCcsIHdoZXJlIHdlIHdvbid0IGRvdWJsZSBjaGVjayB0aGF0IHRoZSBkb21haW4gbmFtZVxuXHQgKiAgIGhhcyBhdCBsZWFzdCBvbmUgJy4nIGluIGl0LlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIFVSTCBtYXRjaCBkb2VzIG5vdCBoYXZlIGEgZnVsbCBwcm90b2NvbCxcblx0ICogICBvciBhdCBsZWFzdCBvbmUgZG90ICgnLicpIGluIGEgbm9uLWZ1bGwtcHJvdG9jb2wgbWF0Y2guXG5cdCAqL1xuXHR1cmxNYXRjaERvZXNOb3RIYXZlUHJvdG9jb2xPckRvdCA6IGZ1bmN0aW9uKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRyZXR1cm4gKCAhIXVybE1hdGNoICYmICggIXByb3RvY29sVXJsTWF0Y2ggfHwgIXRoaXMuaGFzRnVsbFByb3RvY29sUmVnZXgudGVzdCggcHJvdG9jb2xVcmxNYXRjaCApICkgJiYgdXJsTWF0Y2guaW5kZXhPZiggJy4nICkgPT09IC0xICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIFVSTCBtYXRjaCBkb2VzIG5vdCBoYXZlIGF0IGxlYXN0IG9uZSB3b3JkIGNoYXJhY3RlciBhZnRlclxuXHQgKiB0aGUgcHJvdG9jb2wgKGkuZS4gaW4gdGhlIGRvbWFpbiBuYW1lKS5cblx0ICpcblx0ICogQXQgbGVhc3Qgb25lIGxldHRlciBjaGFyYWN0ZXIgbXVzdCBleGlzdCBpbiB0aGUgZG9tYWluIG5hbWUgYWZ0ZXIgYVxuXHQgKiBwcm90b2NvbCBtYXRjaC4gRXg6IHNraXAgb3ZlciBzb21ldGhpbmcgbGlrZSBcImdpdDoxLjBcIlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuXG5cdCAqICAgZW1wdHkgc3RyaW5nIGlmIHRoZSBtYXRjaCBpcyBub3QgYSBVUkwgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFVybE1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIHByb3RvY29sXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBrbm93IHdoZXRoZXIgb3Igbm90IHdlXG5cdCAqICAgaGF2ZSBhIHByb3RvY29sIGluIHRoZSBVUkwgc3RyaW5nLCBpbiBvcmRlciB0byBjaGVjayBmb3IgYSB3b3JkXG5cdCAqICAgY2hhcmFjdGVyIGFmdGVyIHRoZSBwcm90b2NvbCBzZXBhcmF0b3IgKCc6JykuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgVVJMIG1hdGNoIGRvZXMgbm90IGhhdmUgYXQgbGVhc3Qgb25lIHdvcmRcblx0ICogICBjaGFyYWN0ZXIgaW4gaXQgYWZ0ZXIgdGhlIHByb3RvY29sLCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdHVybE1hdGNoRG9lc05vdEhhdmVBdExlYXN0T25lV29yZENoYXIgOiBmdW5jdGlvbiggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2ggKSB7XG5cdFx0aWYoIHVybE1hdGNoICYmIHByb3RvY29sVXJsTWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gIXRoaXMuaGFzV29yZENoYXJBZnRlclByb3RvY29sUmVnZXgudGVzdCggdXJsTWF0Y2ggKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2ggaXMgYW4gaW52YWxpZCBvbmUuIFRoaXMgbWV0aG9kXG5cdCAqIHJldHVybnMgYHRydWVgIGlmIHRoZXJlIGlzIGEgYHByb3RvY29sUmVsYXRpdmVNYXRjaGAsIGFuZCB0aGF0IG1hdGNoXG5cdCAqIGNvbnRhaW5zIGEgd29yZCBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnLy8nIChpLmUuIGl0IG11c3QgY29udGFpblxuXHQgKiB3aGl0ZXNwYWNlIG9yIG5vdGhpbmcgYmVmb3JlIHRoZSAnLy8nIGluIG9yZGVyIHRvIGJlIGNvbnNpZGVyZWQgdmFsaWQpLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xSZWxhdGl2ZU1hdGNoIFRoZSBwcm90b2NvbC1yZWxhdGl2ZSBzdHJpbmcgZm9yIGFcblx0ICogICBVUkwgbWF0Y2ggKGkuZS4gJy8vJyksIHBvc3NpYmx5IHdpdGggYSBwcmVjZWRpbmcgY2hhcmFjdGVyIChleCwgYVxuXHQgKiAgIHNwYWNlLCBzdWNoIGFzOiAnIC8vJywgb3IgYSBsZXR0ZXIsIHN1Y2ggYXM6ICdhLy8nKS4gVGhlIG1hdGNoIGlzXG5cdCAqICAgaW52YWxpZCBpZiB0aGVyZSBpcyBhIHdvcmQgY2hhcmFjdGVyIHByZWNlZGluZyB0aGUgJy8vJy5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIGl0IGlzIGFuIGludmFsaWQgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2gsXG5cdCAqICAgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRpc0ludmFsaWRQcm90b2NvbFJlbGF0aXZlTWF0Y2ggOiBmdW5jdGlvbiggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdHJldHVybiAoICEhcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICYmIHRoaXMuaW52YWxpZFByb3RvY29sUmVsTWF0Y2hSZWdleC50ZXN0KCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSApO1xuXHR9XG5cbn0gKTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAYWJzdHJhY3RcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKiBcbiAqIFJlcHJlc2VudHMgYSBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlIEF1dG9saW5rZWQuIEEgTWF0Y2ggb2JqZWN0IGlzIHdoYXQgaXMgcHJvdmlkZWQgaW4gYSBcbiAqIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59LCBhbmQgbWF5IGJlIHVzZWQgdG8gcXVlcnkgZm9yIGRldGFpbHMgYWJvdXQgdGhlIG1hdGNoLlxuICogXG4gKiBGb3IgZXhhbXBsZTpcbiAqIFxuICogICAgIHZhciBpbnB1dCA9IFwiLi4uXCI7ICAvLyBzdHJpbmcgd2l0aCBVUkxzLCBFbWFpbCBBZGRyZXNzZXMsIGFuZCBUd2l0dGVyIEhhbmRsZXNcbiAqICAgICBcbiAqICAgICB2YXIgbGlua2VkVGV4dCA9IEF1dG9saW5rZXIubGluayggaW5wdXQsIHtcbiAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuICogICAgICAgICAgICAgY29uc29sZS5sb2coIFwiaHJlZiA9IFwiLCBtYXRjaC5nZXRBbmNob3JIcmVmKCkgKTtcbiAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInRleHQgPSBcIiwgbWF0Y2guZ2V0QW5jaG9yVGV4dCgpICk7XG4gKiAgICAgICAgIFxuICogICAgICAgICAgICAgc3dpdGNoKCBtYXRjaC5nZXRUeXBlKCkgKSB7XG4gKiAgICAgICAgICAgICAgICAgY2FzZSAndXJsJyA6IFxuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ1cmw6IFwiLCBtYXRjaC5nZXRVcmwoKSApO1xuICogICAgICAgICAgICAgICAgICAgICBcbiAqICAgICAgICAgICAgICAgICBjYXNlICdlbWFpbCcgOlxuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJlbWFpbDogXCIsIG1hdGNoLmdldEVtYWlsKCkgKTtcbiAqICAgICAgICAgICAgICAgICAgICAgXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAndHdpdHRlcicgOlxuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ0d2l0dGVyOiBcIiwgbWF0Y2guZ2V0VHdpdHRlckhhbmRsZSgpICk7XG4gKiAgICAgICAgICAgICB9XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKiAgICAgXG4gKiBTZWUgdGhlIHtAbGluayBBdXRvbGlua2VyfSBjbGFzcyBmb3IgbW9yZSBkZXRhaWxzIG9uIHVzaW5nIHRoZSB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufS5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5NYXRjaCA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gbWF0Y2hlZFRleHQgKHJlcXVpcmVkKVxuXHQgKiBcblx0ICogVGhlIG9yaWdpbmFsIHRleHQgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdFxuXHRcblx0LyoqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge09iamVjdH0gY2ZnIFRoZSBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMgZm9yIHRoZSBNYXRjaCBpbnN0YW5jZSwgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblx0fSxcblxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IEF1dG9saW5rZXIuVXRpbC5hYnN0cmFjdE1ldGhvZCxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgb3JpZ2luYWwgdGV4dCB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0TWF0Y2hlZFRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXRjaGVkVGV4dDtcblx0fSxcblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQGFic3RyYWN0XG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBBdXRvbGlua2VyLlV0aWwuYWJzdHJhY3RNZXRob2QsXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQGFic3RyYWN0XG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBBdXRvbGlua2VyLlV0aWwuYWJzdHJhY3RNZXRob2RcblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5FbWFpbFxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICogXG4gKiBSZXByZXNlbnRzIGEgRW1haWwgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZSBBdXRvbGlua2VkLlxuICogXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSkgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5FbWFpbCA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGVtYWlsIChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSBlbWFpbCBhZGRyZXNzIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2VtYWlsJztcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgZW1haWwgYWRkcmVzcyB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0RW1haWwgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5lbWFpbDtcblx0fSxcblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnbWFpbHRvOicgKyB0aGlzLmVtYWlsO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5lbWFpbDtcblx0fVxuXHRcbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guSGFzaHRhZ1xuICogQGV4dGVuZHMgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICpcbiAqIFJlcHJlc2VudHMgYSBIYXNodGFnIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmVcbiAqIEF1dG9saW5rZWQuXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0pIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLkhhc2h0YWcgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLm1hdGNoLk1hdGNoLCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gc2VydmljZU5hbWUgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgc2VydmljZSB0byBwb2ludCBoYXNodGFnIG1hdGNoZXMgdG8uIFNlZSB7QGxpbmsgQXV0b2xpbmtlciNoYXNodGFnfVxuXHQgKiBmb3IgYXZhaWxhYmxlIHZhbHVlcy5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gaGFzaHRhZyAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSBIYXNodGFnIHRoYXQgd2FzIG1hdGNoZWQsIHdpdGhvdXQgdGhlICcjJy5cblx0ICovXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnaGFzaHRhZyc7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbWF0Y2hlZCBoYXNodGFnLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRIYXNodGFnIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaGFzaHRhZztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBzZXJ2aWNlTmFtZSA9IHRoaXMuc2VydmljZU5hbWUsXG5cdFx0ICAgIGhhc2h0YWcgPSB0aGlzLmhhc2h0YWc7XG5cblx0XHRzd2l0Y2goIHNlcnZpY2VOYW1lICkge1xuXHRcdFx0Y2FzZSAndHdpdHRlcicgOlxuXHRcdFx0XHRyZXR1cm4gJ2h0dHBzOi8vdHdpdHRlci5jb20vaGFzaHRhZy8nICsgaGFzaHRhZztcblx0XHRcdGNhc2UgJ2ZhY2Vib29rJyA6XG5cdFx0XHRcdHJldHVybiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL2hhc2h0YWcvJyArIGhhc2h0YWc7XG5cdFx0XHRjYXNlICdpbnN0YWdyYW0nIDpcblx0XHRcdFx0cmV0dXJuICdodHRwczovL2luc3RhZ3JhbS5jb20vZXhwbG9yZS90YWdzLycgKyBoYXNodGFnO1xuXG5cdFx0XHRkZWZhdWx0IDogIC8vIFNob3VsZG4ndCBoYXBwZW4gYmVjYXVzZSBBdXRvbGlua2VyJ3MgY29uc3RydWN0b3Igc2hvdWxkIGJsb2NrIGFueSBpbnZhbGlkIHZhbHVlcywgYnV0IGp1c3QgaW4gY2FzZS5cblx0XHRcdFx0dGhyb3cgbmV3IEVycm9yKCAnVW5rbm93biBzZXJ2aWNlIG5hbWUgdG8gcG9pbnQgaGFzaHRhZyB0bzogJywgc2VydmljZU5hbWUgKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJyMnICsgdGhpcy5oYXNodGFnO1xuXHR9XG5cbn0gKTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5QaG9uZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICpcbiAqIFJlcHJlc2VudHMgYSBQaG9uZSBudW1iZXIgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZVxuICogQXV0b2xpbmtlZC5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guUGhvbmUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLm1hdGNoLk1hdGNoLCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gbnVtYmVyIChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIHBob25lIG51bWJlciB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gcGx1c1NpZ24gKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgdGhlIG1hdGNoZWQgcGhvbmUgbnVtYmVyIHN0YXJ0ZWQgd2l0aCBhICcrJyBzaWduLiBXZSdsbCBpbmNsdWRlXG5cdCAqIGl0IGluIHRoZSBgdGVsOmAgVVJMIGlmIHNvLCBhcyB0aGlzIGlzIG5lZWRlZCBmb3IgaW50ZXJuYXRpb25hbCBudW1iZXJzLlxuXHQgKlxuXHQgKiBFeDogJysxICgxMjMpIDQ1NiA3ODc5J1xuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdwaG9uZSc7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgcGhvbmUgbnVtYmVyIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldE51bWJlcjogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMubnVtYmVyO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICd0ZWw6JyArICggdGhpcy5wbHVzU2lnbiA/ICcrJyA6ICcnICkgKyB0aGlzLm51bWJlcjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLm1hdGNoZWRUZXh0O1xuXHR9XG5cbn0gKTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5Ud2l0dGVyXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKiBcbiAqIFJlcHJlc2VudHMgYSBUd2l0dGVyIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmUgQXV0b2xpbmtlZC5cbiAqIFxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0pIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guVHdpdHRlciA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHR3aXR0ZXJIYW5kbGUgKHJlcXVpcmVkKVxuXHQgKiBcblx0ICogVGhlIFR3aXR0ZXIgaGFuZGxlIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3R3aXR0ZXInO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHdpdHRlckhhbmRsZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnR3aXR0ZXJIYW5kbGU7XG5cdH0sXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2h0dHBzOi8vdHdpdHRlci5jb20vJyArIHRoaXMudHdpdHRlckhhbmRsZTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdAJyArIHRoaXMudHdpdHRlckhhbmRsZTtcblx0fVxuXHRcbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guVXJsXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKlxuICogUmVwcmVzZW50cyBhIFVybCBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlIEF1dG9saW5rZWQuXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0pIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guVXJsID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHVybCAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSB1cmwgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHByb3RvY29sVXJsTWF0Y2ggKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgdGhlIFVSTCBpcyBhIG1hdGNoIHdoaWNoIGFscmVhZHkgaGFzIGEgcHJvdG9jb2wgKGkuZS4gJ2h0dHA6Ly8nKSwgYGZhbHNlYCBpZiB0aGUgbWF0Y2ggd2FzIGZyb20gYSAnd3d3JyBvclxuXHQgKiBrbm93biBUTEQgbWF0Y2guXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgdGhlIFVSTCBpcyBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLiBBIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoIGlzIGEgVVJMIHRoYXQgc3RhcnRzIHdpdGggJy8vJyxcblx0ICogYW5kIHdpbGwgYmUgZWl0aGVyIGh0dHA6Ly8gb3IgaHR0cHM6Ly8gYmFzZWQgb24gdGhlIHByb3RvY29sIHRoYXQgdGhlIHNpdGUgaXMgbG9hZGVkIHVuZGVyLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gc3RyaXBQcmVmaXggKHJlcXVpcmVkKVxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI3N0cmlwUHJlZml4XG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSB1cmxQcmVmaXhSZWdleFxuXHQgKlxuXHQgKiBBIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHJlbW92ZSB0aGUgJ2h0dHA6Ly8nIG9yICdodHRwczovLycgYW5kL29yIHRoZSAnd3d3LicgZnJvbSBVUkxzLlxuXHQgKi9cblx0dXJsUHJlZml4UmVnZXg6IC9eKGh0dHBzPzpcXC9cXC8pPyh3d3dcXC4pPy9pLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gcHJvdG9jb2xSZWxhdGl2ZVJlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byByZW1vdmUgdGhlIHByb3RvY29sLXJlbGF0aXZlICcvLycgZnJvbSB0aGUge0BsaW5rICN1cmx9IHN0cmluZywgZm9yIHB1cnBvc2VzXG5cdCAqIG9mIHtAbGluayAjZ2V0QW5jaG9yVGV4dH0uIEEgcHJvdG9jb2wtcmVsYXRpdmUgVVJMIGlzLCBmb3IgZXhhbXBsZSwgXCIvL3lhaG9vLmNvbVwiXG5cdCAqL1xuXHRwcm90b2NvbFJlbGF0aXZlUmVnZXggOiAvXlxcL1xcLy8sXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gcHJvdG9jb2xQcmVwZW5kZWRcblx0ICpcblx0ICogV2lsbCBiZSBzZXQgdG8gYHRydWVgIGlmIHRoZSAnaHR0cDovLycgcHJvdG9jb2wgaGFzIGJlZW4gcHJlcGVuZGVkIHRvIHRoZSB7QGxpbmsgI3VybH0gKGJlY2F1c2UgdGhlXG5cdCAqIHtAbGluayAjdXJsfSBkaWQgbm90IGhhdmUgYSBwcm90b2NvbClcblx0ICovXG5cdHByb3RvY29sUHJlcGVuZGVkIDogZmFsc2UsXG5cblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAndXJsJztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB1cmwgdGhhdCB3YXMgbWF0Y2hlZCwgYXNzdW1pbmcgdGhlIHByb3RvY29sIHRvIGJlICdodHRwOi8vJyBpZiB0aGUgb3JpZ2luYWxcblx0ICogbWF0Y2ggd2FzIG1pc3NpbmcgYSBwcm90b2NvbC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VXJsIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVybCA9IHRoaXMudXJsO1xuXG5cdFx0Ly8gaWYgdGhlIHVybCBzdHJpbmcgZG9lc24ndCBiZWdpbiB3aXRoIGEgcHJvdG9jb2wsIGFzc3VtZSAnaHR0cDovLydcblx0XHRpZiggIXRoaXMucHJvdG9jb2xSZWxhdGl2ZU1hdGNoICYmICF0aGlzLnByb3RvY29sVXJsTWF0Y2ggJiYgIXRoaXMucHJvdG9jb2xQcmVwZW5kZWQgKSB7XG5cdFx0XHR1cmwgPSB0aGlzLnVybCA9ICdodHRwOi8vJyArIHVybDtcblxuXHRcdFx0dGhpcy5wcm90b2NvbFByZXBlbmRlZCA9IHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHVybDtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cmwgPSB0aGlzLmdldFVybCgpO1xuXG5cdFx0cmV0dXJuIHVybC5yZXBsYWNlKCAvJmFtcDsvZywgJyYnICk7ICAvLyBhbnkgJmFtcDsncyBpbiB0aGUgVVJMIHNob3VsZCBiZSBjb252ZXJ0ZWQgYmFjayB0byAnJicgaWYgdGhleSB3ZXJlIGRpc3BsYXllZCBhcyAmYW1wOyBpbiB0aGUgc291cmNlIGh0bWxcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBhbmNob3JUZXh0ID0gdGhpcy5nZXRNYXRjaGVkVGV4dCgpO1xuXG5cdFx0aWYoIHRoaXMucHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdFx0Ly8gU3RyaXAgb2ZmIGFueSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIGZyb20gdGhlIGFuY2hvciB0ZXh0XG5cdFx0XHRhbmNob3JUZXh0ID0gdGhpcy5zdHJpcFByb3RvY29sUmVsYXRpdmVQcmVmaXgoIGFuY2hvclRleHQgKTtcblx0XHR9XG5cdFx0aWYoIHRoaXMuc3RyaXBQcmVmaXggKSB7XG5cdFx0XHRhbmNob3JUZXh0ID0gdGhpcy5zdHJpcFVybFByZWZpeCggYW5jaG9yVGV4dCApO1xuXHRcdH1cblx0XHRhbmNob3JUZXh0ID0gdGhpcy5yZW1vdmVUcmFpbGluZ1NsYXNoKCBhbmNob3JUZXh0ICk7ICAvLyByZW1vdmUgdHJhaWxpbmcgc2xhc2gsIGlmIHRoZXJlIGlzIG9uZVxuXG5cdFx0cmV0dXJuIGFuY2hvclRleHQ7XG5cdH0sXG5cblxuXHQvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXHQvLyBVdGlsaXR5IEZ1bmN0aW9uYWxpdHlcblxuXHQvKipcblx0ICogU3RyaXBzIHRoZSBVUkwgcHJlZml4IChzdWNoIGFzIFwiaHR0cDovL1wiIG9yIFwiaHR0cHM6Ly9cIikgZnJvbSB0aGUgZ2l2ZW4gdGV4dC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgb2YgdGhlIGFuY2hvciB0aGF0IGlzIGJlaW5nIGdlbmVyYXRlZCwgZm9yIHdoaWNoIHRvIHN0cmlwIG9mZiB0aGVcblx0ICogICB1cmwgcHJlZml4IChzdWNoIGFzIHN0cmlwcGluZyBvZmYgXCJodHRwOi8vXCIpXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGBhbmNob3JUZXh0YCwgd2l0aCB0aGUgcHJlZml4IHN0cmlwcGVkLlxuXHQgKi9cblx0c3RyaXBVcmxQcmVmaXggOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHRyZXR1cm4gdGV4dC5yZXBsYWNlKCB0aGlzLnVybFByZWZpeFJlZ2V4LCAnJyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFN0cmlwcyBhbnkgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBmcm9tIHRoZSBhbmNob3IgdGV4dC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgb2YgdGhlIGFuY2hvciB0aGF0IGlzIGJlaW5nIGdlbmVyYXRlZCwgZm9yIHdoaWNoIHRvIHN0cmlwIG9mZiB0aGVcblx0ICogICBwcm90b2NvbC1yZWxhdGl2ZSBwcmVmaXggKHN1Y2ggYXMgc3RyaXBwaW5nIG9mZiBcIi8vXCIpXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGBhbmNob3JUZXh0YCwgd2l0aCB0aGUgcHJvdG9jb2wtcmVsYXRpdmUgcHJlZml4IHN0cmlwcGVkLlxuXHQgKi9cblx0c3RyaXBQcm90b2NvbFJlbGF0aXZlUHJlZml4IDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIHRleHQucmVwbGFjZSggdGhpcy5wcm90b2NvbFJlbGF0aXZlUmVnZXgsICcnICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmVtb3ZlcyBhbnkgdHJhaWxpbmcgc2xhc2ggZnJvbSB0aGUgZ2l2ZW4gYGFuY2hvclRleHRgLCBpbiBwcmVwYXJhdGlvbiBmb3IgdGhlIHRleHQgdG8gYmUgZGlzcGxheWVkLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYW5jaG9yVGV4dCBUaGUgdGV4dCBvZiB0aGUgYW5jaG9yIHRoYXQgaXMgYmVpbmcgZ2VuZXJhdGVkLCBmb3Igd2hpY2ggdG8gcmVtb3ZlIGFueSB0cmFpbGluZ1xuXHQgKiAgIHNsYXNoICgnLycpIHRoYXQgbWF5IGV4aXN0LlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBgYW5jaG9yVGV4dGAsIHdpdGggdGhlIHRyYWlsaW5nIHNsYXNoIHJlbW92ZWQuXG5cdCAqL1xuXHRyZW1vdmVUcmFpbGluZ1NsYXNoIDogZnVuY3Rpb24oIGFuY2hvclRleHQgKSB7XG5cdFx0aWYoIGFuY2hvclRleHQuY2hhckF0KCBhbmNob3JUZXh0Lmxlbmd0aCAtIDEgKSA9PT0gJy8nICkge1xuXHRcdFx0YW5jaG9yVGV4dCA9IGFuY2hvclRleHQuc2xpY2UoIDAsIC0xICk7XG5cdFx0fVxuXHRcdHJldHVybiBhbmNob3JUZXh0O1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQSB0cnVuY2F0aW9uIGZlYXR1cmUgd2hlcmUgdGhlIGVsbGlwc2lzIHdpbGwgYmUgcGxhY2VkIGF0IHRoZSBlbmQgb2YgdGhlIFVSTC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gYW5jaG9yVGV4dFxuICogQHBhcmFtIHtOdW1iZXJ9IHRydW5jYXRlTGVuIFRoZSBtYXhpbXVtIGxlbmd0aCBvZiB0aGUgdHJ1bmNhdGVkIG91dHB1dCBVUkwgc3RyaW5nLlxuICogQHBhcmFtIHtTdHJpbmd9IGVsbGlwc2lzQ2hhcnMgVGhlIGNoYXJhY3RlcnMgdG8gcGxhY2Ugd2l0aGluIHRoZSB1cmwsIGUuZy4gXCIuLlwiLlxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgdHJ1bmNhdGVkIFVSTC5cbiAqL1xuQXV0b2xpbmtlci50cnVuY2F0ZS5UcnVuY2F0ZUVuZCA9IGZ1bmN0aW9uKGFuY2hvclRleHQsIHRydW5jYXRlTGVuLCBlbGxpcHNpc0NoYXJzKXtcblx0cmV0dXJuIEF1dG9saW5rZXIuVXRpbC5lbGxpcHNpcyggYW5jaG9yVGV4dCwgdHJ1bmNhdGVMZW4sIGVsbGlwc2lzQ2hhcnMgKTtcbn07XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogRGF0ZTogMjAxNS0xMC0wNVxuICogQXV0aG9yOiBLYXNwZXIgU8O4ZnJlbiA8c29lZnJpdHpAZ21haWwuY29tPiAoaHR0cHM6Ly9naXRodWIuY29tL2thZm9zbylcbiAqXG4gKiBBIHRydW5jYXRpb24gZmVhdHVyZSwgd2hlcmUgdGhlIGVsbGlwc2lzIHdpbGwgYmUgcGxhY2VkIGluIHRoZSBkZWFkLWNlbnRlciBvZiB0aGUgVVJMLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgICAgICAgICAgICAgQSBVUkwuXG4gKiBAcGFyYW0ge051bWJlcn0gdHJ1bmNhdGVMZW4gICAgIFRoZSBtYXhpbXVtIGxlbmd0aCBvZiB0aGUgdHJ1bmNhdGVkIG91dHB1dCBVUkwgc3RyaW5nLlxuICogQHBhcmFtIHtTdHJpbmd9IGVsbGlwc2lzQ2hhcnMgICBUaGUgY2hhcmFjdGVycyB0byBwbGFjZSB3aXRoaW4gdGhlIHVybCwgZS5nLiBcIi4uXCIuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB0cnVuY2F0ZWQgVVJMLlxuICovXG5BdXRvbGlua2VyLnRydW5jYXRlLlRydW5jYXRlTWlkZGxlID0gZnVuY3Rpb24odXJsLCB0cnVuY2F0ZUxlbiwgZWxsaXBzaXNDaGFycyl7XG4gIGlmICh1cmwubGVuZ3RoIDw9IHRydW5jYXRlTGVuKSB7XG4gICAgcmV0dXJuIHVybDtcbiAgfVxuICB2YXIgYXZhaWxhYmxlTGVuZ3RoID0gdHJ1bmNhdGVMZW4gLSBlbGxpcHNpc0NoYXJzLmxlbmd0aDtcbiAgdmFyIGVuZCA9IFwiXCI7XG4gIGlmIChhdmFpbGFibGVMZW5ndGggPiAwKSB7XG4gICAgZW5kID0gdXJsLnN1YnN0cigoLTEpKk1hdGguZmxvb3IoYXZhaWxhYmxlTGVuZ3RoLzIpKTtcbiAgfVxuICByZXR1cm4gKHVybC5zdWJzdHIoMCwgTWF0aC5jZWlsKGF2YWlsYWJsZUxlbmd0aC8yKSkgKyBlbGxpcHNpc0NoYXJzICsgZW5kKS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xufTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBEYXRlOiAyMDE1LTEwLTA1XG4gKiBBdXRob3I6IEthc3BlciBTw7hmcmVuIDxzb2Vmcml0ekBnbWFpbC5jb20+IChodHRwczovL2dpdGh1Yi5jb20va2Fmb3NvKVxuICpcbiAqIEEgdHJ1bmNhdGlvbiBmZWF0dXJlLCB3aGVyZSB0aGUgZWxsaXBzaXMgd2lsbCBiZSBwbGFjZWQgYXQgYSBzZWN0aW9uIHdpdGhpblxuICogdGhlIFVSTCBtYWtpbmcgaXQgc3RpbGwgc29tZXdoYXQgaHVtYW4gcmVhZGFibGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybFx0XHRcdFx0XHRcdCBBIFVSTC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0cnVuY2F0ZUxlblx0XHQgVGhlIG1heGltdW0gbGVuZ3RoIG9mIHRoZSB0cnVuY2F0ZWQgb3V0cHV0IFVSTCBzdHJpbmcuXG4gKiBAcGFyYW0ge1N0cmluZ30gZWxsaXBzaXNDaGFyc1x0IFRoZSBjaGFyYWN0ZXJzIHRvIHBsYWNlIHdpdGhpbiB0aGUgdXJsLCBlLmcuIFwiLi5cIi5cbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHRydW5jYXRlZCBVUkwuXG4gKi9cbkF1dG9saW5rZXIudHJ1bmNhdGUuVHJ1bmNhdGVTbWFydCA9IGZ1bmN0aW9uKHVybCwgdHJ1bmNhdGVMZW4sIGVsbGlwc2lzQ2hhcnMpe1xuXHR2YXIgcGFyc2VfdXJsID0gZnVuY3Rpb24odXJsKXsgLy8gRnVuY3Rpb25hbGl0eSBpbnNwaXJlZCBieSBQSFAgZnVuY3Rpb24gb2Ygc2FtZSBuYW1lXG5cdFx0dmFyIHVybE9iaiA9IHt9O1xuXHRcdHZhciB1cmxTdWIgPSB1cmw7XG5cdFx0dmFyIG1hdGNoID0gdXJsU3ViLm1hdGNoKC9eKFthLXpdKyk6XFwvXFwvL2kpO1xuXHRcdGlmIChtYXRjaCkge1xuXHRcdFx0dXJsT2JqLnNjaGVtZSA9IG1hdGNoWzFdO1xuXHRcdFx0dXJsU3ViID0gdXJsU3ViLnN1YnN0cihtYXRjaFswXS5sZW5ndGgpO1xuXHRcdH1cblx0XHRtYXRjaCA9IHVybFN1Yi5tYXRjaCgvXiguKj8pKD89KFxcP3wjfFxcL3wkKSkvaSk7XG5cdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHR1cmxPYmouaG9zdCA9IG1hdGNoWzFdO1xuXHRcdFx0dXJsU3ViID0gdXJsU3ViLnN1YnN0cihtYXRjaFswXS5sZW5ndGgpO1xuXHRcdH1cblx0XHRtYXRjaCA9IHVybFN1Yi5tYXRjaCgvXlxcLyguKj8pKD89KFxcP3wjfCQpKS9pKTtcblx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdHVybE9iai5wYXRoID0gbWF0Y2hbMV07XG5cdFx0XHR1cmxTdWIgPSB1cmxTdWIuc3Vic3RyKG1hdGNoWzBdLmxlbmd0aCk7XG5cdFx0fVxuXHRcdG1hdGNoID0gdXJsU3ViLm1hdGNoKC9eXFw/KC4qPykoPz0oI3wkKSkvaSk7XG5cdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHR1cmxPYmoucXVlcnkgPSBtYXRjaFsxXTtcblx0XHRcdHVybFN1YiA9IHVybFN1Yi5zdWJzdHIobWF0Y2hbMF0ubGVuZ3RoKTtcblx0XHR9XG5cdFx0bWF0Y2ggPSB1cmxTdWIubWF0Y2goL14jKC4qPykkL2kpO1xuXHRcdGlmIChtYXRjaCkge1xuXHRcdFx0dXJsT2JqLmZyYWdtZW50ID0gbWF0Y2hbMV07XG5cdFx0XHQvL3VybFN1YiA9IHVybFN1Yi5zdWJzdHIobWF0Y2hbMF0ubGVuZ3RoKTsgIC0tIG5vdCB1c2VkLiBVbmNvbW1lbnQgaWYgYWRkaW5nIGFub3RoZXIgYmxvY2suXG5cdFx0fVxuXHRcdHJldHVybiB1cmxPYmo7XG5cdH07XG5cblx0dmFyIGJ1aWxkVXJsID0gZnVuY3Rpb24odXJsT2JqKXtcblx0XHR2YXIgdXJsID0gXCJcIjtcblx0XHRpZiAodXJsT2JqLnNjaGVtZSAmJiB1cmxPYmouaG9zdCkge1xuXHRcdFx0dXJsICs9IHVybE9iai5zY2hlbWUgKyBcIjovL1wiO1xuXHRcdH1cblx0XHRpZiAodXJsT2JqLmhvc3QpIHtcblx0XHRcdHVybCArPSB1cmxPYmouaG9zdDtcblx0XHR9XG5cdFx0aWYgKHVybE9iai5wYXRoKSB7XG5cdFx0XHR1cmwgKz0gXCIvXCIgKyB1cmxPYmoucGF0aDtcblx0XHR9XG5cdFx0aWYgKHVybE9iai5xdWVyeSkge1xuXHRcdFx0dXJsICs9IFwiP1wiICsgdXJsT2JqLnF1ZXJ5O1xuXHRcdH1cblx0XHRpZiAodXJsT2JqLmZyYWdtZW50KSB7XG5cdFx0XHR1cmwgKz0gXCIjXCIgKyB1cmxPYmouZnJhZ21lbnQ7XG5cdFx0fVxuXHRcdHJldHVybiB1cmw7XG5cdH07XG5cblx0dmFyIGJ1aWxkU2VnbWVudCA9IGZ1bmN0aW9uKHNlZ21lbnQsIHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aCl7XG5cdFx0dmFyIHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aEhhbGYgPSByZW1haW5pbmdBdmFpbGFibGVMZW5ndGgvIDIsXG5cdFx0XHRcdHN0YXJ0T2Zmc2V0ID0gTWF0aC5jZWlsKHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aEhhbGYpLFxuXHRcdFx0XHRlbmRPZmZzZXQgPSAoLTEpKk1hdGguZmxvb3IocmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoSGFsZiksXG5cdFx0XHRcdGVuZCA9IFwiXCI7XG5cdFx0aWYgKGVuZE9mZnNldCA8IDApIHtcblx0XHRcdGVuZCA9IHNlZ21lbnQuc3Vic3RyKGVuZE9mZnNldCk7XG5cdFx0fVxuXHRcdHJldHVybiBzZWdtZW50LnN1YnN0cigwLCBzdGFydE9mZnNldCkgKyBlbGxpcHNpc0NoYXJzICsgZW5kO1xuXHR9O1xuXHRpZiAodXJsLmxlbmd0aCA8PSB0cnVuY2F0ZUxlbikge1xuXHRcdHJldHVybiB1cmw7XG5cdH1cblx0dmFyIGF2YWlsYWJsZUxlbmd0aCA9IHRydW5jYXRlTGVuIC0gZWxsaXBzaXNDaGFycy5sZW5ndGg7XG5cdHZhciB1cmxPYmogPSBwYXJzZV91cmwodXJsKTtcblx0Ly8gQ2xlYW4gdXAgdGhlIFVSTFxuXHRpZiAodXJsT2JqLnF1ZXJ5KSB7XG5cdFx0dmFyIG1hdGNoUXVlcnkgPSB1cmxPYmoucXVlcnkubWF0Y2goL14oLio/KSg/PShcXD98XFwjKSkoLio/KSQvaSk7XG5cdFx0aWYgKG1hdGNoUXVlcnkpIHtcblx0XHRcdC8vIE1hbGZvcm1lZCBVUkw7IHR3byBvciBtb3JlIFwiP1wiLiBSZW1vdmVkIGFueSBjb250ZW50IGJlaGluZCB0aGUgMm5kLlxuXHRcdFx0dXJsT2JqLnF1ZXJ5ID0gdXJsT2JqLnF1ZXJ5LnN1YnN0cigwLCBtYXRjaFF1ZXJ5WzFdLmxlbmd0aCk7XG5cdFx0XHR1cmwgPSBidWlsZFVybCh1cmxPYmopO1xuXHRcdH1cblx0fVxuXHRpZiAodXJsLmxlbmd0aCA8PSB0cnVuY2F0ZUxlbikge1xuXHRcdHJldHVybiB1cmw7XG5cdH1cblx0aWYgKHVybE9iai5ob3N0KSB7XG5cdFx0dXJsT2JqLmhvc3QgPSB1cmxPYmouaG9zdC5yZXBsYWNlKC9ed3d3XFwuLywgXCJcIik7XG5cdFx0dXJsID0gYnVpbGRVcmwodXJsT2JqKTtcblx0fVxuXHRpZiAodXJsLmxlbmd0aCA8PSB0cnVuY2F0ZUxlbikge1xuXHRcdHJldHVybiB1cmw7XG5cdH1cblx0Ly8gUHJvY2VzcyBhbmQgYnVpbGQgdGhlIFVSTFxuXHR2YXIgc3RyID0gXCJcIjtcblx0aWYgKHVybE9iai5ob3N0KSB7XG5cdFx0c3RyICs9IHVybE9iai5ob3N0O1xuXHR9XG5cdGlmIChzdHIubGVuZ3RoID49IGF2YWlsYWJsZUxlbmd0aCkge1xuXHRcdGlmICh1cmxPYmouaG9zdC5sZW5ndGggPT0gdHJ1bmNhdGVMZW4pIHtcblx0XHRcdHJldHVybiAodXJsT2JqLmhvc3Quc3Vic3RyKDAsICh0cnVuY2F0ZUxlbiAtIGVsbGlwc2lzQ2hhcnMubGVuZ3RoKSkgKyBlbGxpcHNpc0NoYXJzKS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xuXHRcdH1cblx0XHRyZXR1cm4gYnVpbGRTZWdtZW50KHN0ciwgYXZhaWxhYmxlTGVuZ3RoKS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xuXHR9XG5cdHZhciBwYXRoQW5kUXVlcnkgPSBcIlwiO1xuXHRpZiAodXJsT2JqLnBhdGgpIHtcblx0XHRwYXRoQW5kUXVlcnkgKz0gXCIvXCIgKyB1cmxPYmoucGF0aDtcblx0fVxuXHRpZiAodXJsT2JqLnF1ZXJ5KSB7XG5cdFx0cGF0aEFuZFF1ZXJ5ICs9IFwiP1wiICsgdXJsT2JqLnF1ZXJ5O1xuXHR9XG5cdGlmIChwYXRoQW5kUXVlcnkpIHtcblx0XHRpZiAoKHN0citwYXRoQW5kUXVlcnkpLmxlbmd0aCA+PSBhdmFpbGFibGVMZW5ndGgpIHtcblx0XHRcdGlmICgoc3RyK3BhdGhBbmRRdWVyeSkubGVuZ3RoID09IHRydW5jYXRlTGVuKSB7XG5cdFx0XHRcdHJldHVybiAoc3RyICsgcGF0aEFuZFF1ZXJ5KS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aCA9IGF2YWlsYWJsZUxlbmd0aCAtIHN0ci5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gKHN0ciArIGJ1aWxkU2VnbWVudChwYXRoQW5kUXVlcnksIHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aCkpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN0ciArPSBwYXRoQW5kUXVlcnk7XG5cdFx0fVxuXHR9XG5cdGlmICh1cmxPYmouZnJhZ21lbnQpIHtcblx0XHR2YXIgZnJhZ21lbnQgPSBcIiNcIit1cmxPYmouZnJhZ21lbnQ7XG5cdFx0aWYgKChzdHIrZnJhZ21lbnQpLmxlbmd0aCA+PSBhdmFpbGFibGVMZW5ndGgpIHtcblx0XHRcdGlmICgoc3RyK2ZyYWdtZW50KS5sZW5ndGggPT0gdHJ1bmNhdGVMZW4pIHtcblx0XHRcdFx0cmV0dXJuIChzdHIgKyBmcmFnbWVudCkuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcblx0XHRcdH1cblx0XHRcdHZhciByZW1haW5pbmdBdmFpbGFibGVMZW5ndGgyID0gYXZhaWxhYmxlTGVuZ3RoIC0gc3RyLmxlbmd0aDtcblx0XHRcdHJldHVybiAoc3RyICsgYnVpbGRTZWdtZW50KGZyYWdtZW50LCByZW1haW5pbmdBdmFpbGFibGVMZW5ndGgyKSkuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RyICs9IGZyYWdtZW50O1xuXHRcdH1cblx0fVxuXHRpZiAodXJsT2JqLnNjaGVtZSAmJiB1cmxPYmouaG9zdCkge1xuXHRcdHZhciBzY2hlbWUgPSB1cmxPYmouc2NoZW1lICsgXCI6Ly9cIjtcblx0XHRpZiAoKHN0citzY2hlbWUpLmxlbmd0aCA8IGF2YWlsYWJsZUxlbmd0aCkge1xuXHRcdFx0cmV0dXJuIChzY2hlbWUgKyBzdHIpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG5cdFx0fVxuXHR9XG5cdGlmIChzdHIubGVuZ3RoIDw9IHRydW5jYXRlTGVuKSB7XG5cdFx0cmV0dXJuIHN0cjtcblx0fVxuXHR2YXIgZW5kID0gXCJcIjtcblx0aWYgKGF2YWlsYWJsZUxlbmd0aCA+IDApIHtcblx0XHRlbmQgPSBzdHIuc3Vic3RyKCgtMSkqTWF0aC5mbG9vcihhdmFpbGFibGVMZW5ndGgvMikpO1xuXHR9XG5cdHJldHVybiAoc3RyLnN1YnN0cigwLCBNYXRoLmNlaWwoYXZhaWxhYmxlTGVuZ3RoLzIpKSArIGVsbGlwc2lzQ2hhcnMgKyBlbmQpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG59O1xuXG5yZXR1cm4gQXV0b2xpbmtlcjtcblxufSkpO1xuIiwiOyhmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQHByZXNlcnZlIEZhc3RDbGljazogcG9seWZpbGwgdG8gcmVtb3ZlIGNsaWNrIGRlbGF5cyBvbiBicm93c2VycyB3aXRoIHRvdWNoIFVJcy5cblx0ICpcblx0ICogQGNvZGluZ3N0YW5kYXJkIGZ0bGFicy1qc3YyXG5cdCAqIEBjb3B5cmlnaHQgVGhlIEZpbmFuY2lhbCBUaW1lcyBMaW1pdGVkIFtBbGwgUmlnaHRzIFJlc2VydmVkXVxuXHQgKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoc2VlIExJQ0VOU0UudHh0KVxuXHQgKi9cblxuXHQvKmpzbGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cdC8qZ2xvYmFsIGRlZmluZSwgRXZlbnQsIE5vZGUqL1xuXG5cblx0LyoqXG5cdCAqIEluc3RhbnRpYXRlIGZhc3QtY2xpY2tpbmcgbGlzdGVuZXJzIG9uIHRoZSBzcGVjaWZpZWQgbGF5ZXIuXG5cdCAqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdGZ1bmN0aW9uIEZhc3RDbGljayhsYXllciwgb3B0aW9ucykge1xuXHRcdHZhciBvbGRPbkNsaWNrO1xuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHQvKipcblx0XHQgKiBXaGV0aGVyIGEgY2xpY2sgaXMgY3VycmVudGx5IGJlaW5nIHRyYWNrZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBib29sZWFuXG5cdFx0ICovXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRpbWVzdGFtcCBmb3Igd2hlbiBjbGljayB0cmFja2luZyBzdGFydGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgZWxlbWVudCBiZWluZyB0cmFja2VkIGZvciBhIGNsaWNrLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRXZlbnRUYXJnZXRcblx0XHQgKi9cblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXG5cblx0XHQvKipcblx0XHQgKiBYLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogWS1jb29yZGluYXRlIG9mIHRvdWNoIHN0YXJ0IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIElEIG9mIHRoZSBsYXN0IHRvdWNoLCByZXRyaWV2ZWQgZnJvbSBUb3VjaC5pZGVudGlmaWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVG91Y2htb3ZlIGJvdW5kYXJ5LCBiZXlvbmQgd2hpY2ggYSBjbGljayB3aWxsIGJlIGNhbmNlbGxlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hCb3VuZGFyeSA9IG9wdGlvbnMudG91Y2hCb3VuZGFyeSB8fCAxMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIEZhc3RDbGljayBsYXllci5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIEVsZW1lbnRcblx0XHQgKi9cblx0XHR0aGlzLmxheWVyID0gbGF5ZXI7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbWluaW11bSB0aW1lIGJldHdlZW4gdGFwKHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kKSBldmVudHNcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwRGVsYXkgPSBvcHRpb25zLnRhcERlbGF5IHx8IDIwMDtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtYXhpbXVtIHRpbWUgZm9yIGEgdGFwXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRhcFRpbWVvdXQgPSBvcHRpb25zLnRhcFRpbWVvdXQgfHwgNzAwO1xuXG5cdFx0aWYgKEZhc3RDbGljay5ub3ROZWVkZWQobGF5ZXIpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gU29tZSBvbGQgdmVyc2lvbnMgb2YgQW5kcm9pZCBkb24ndCBoYXZlIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kXG5cdFx0ZnVuY3Rpb24gYmluZChtZXRob2QsIGNvbnRleHQpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ldGhvZC5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpOyB9O1xuXHRcdH1cblxuXG5cdFx0dmFyIG1ldGhvZHMgPSBbJ29uTW91c2UnLCAnb25DbGljaycsICdvblRvdWNoU3RhcnQnLCAnb25Ub3VjaE1vdmUnLCAnb25Ub3VjaEVuZCcsICdvblRvdWNoQ2FuY2VsJ107XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzO1xuXHRcdGZvciAodmFyIGkgPSAwLCBsID0gbWV0aG9kcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRcdGNvbnRleHRbbWV0aG9kc1tpXV0gPSBiaW5kKGNvbnRleHRbbWV0aG9kc1tpXV0sIGNvbnRleHQpO1xuXHRcdH1cblxuXHRcdC8vIFNldCB1cCBldmVudCBoYW5kbGVycyBhcyByZXF1aXJlZFxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cblx0XHQvLyBIYWNrIGlzIHJlcXVpcmVkIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHQvLyB3aGljaCBpcyBob3cgRmFzdENsaWNrIG5vcm1hbGx5IHN0b3BzIGNsaWNrIGV2ZW50cyBidWJibGluZyB0byBjYWxsYmFja3MgcmVnaXN0ZXJlZCBvbiB0aGUgRmFzdENsaWNrXG5cdFx0Ly8gbGF5ZXIgd2hlbiB0aGV5IGFyZSBjYW5jZWxsZWQuXG5cdFx0aWYgKCFFdmVudC5wcm90b3R5cGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcblx0XHRcdFx0dmFyIHJtdiA9IE5vZGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG5cdFx0XHRcdGlmICh0eXBlID09PSAnY2xpY2snKSB7XG5cdFx0XHRcdFx0cm12LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLmhpamFja2VkIHx8IGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcblx0XHRcdFx0dmFyIGFkdiA9IE5vZGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cdFx0XHRcdGlmICh0eXBlID09PSAnY2xpY2snKSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLmhpamFja2VkIHx8IChjYWxsYmFjay5oaWphY2tlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdFx0XHRpZiAoIWV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCkge1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjayhldmVudCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSksIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFkdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gSWYgYSBoYW5kbGVyIGlzIGFscmVhZHkgZGVjbGFyZWQgaW4gdGhlIGVsZW1lbnQncyBvbmNsaWNrIGF0dHJpYnV0ZSwgaXQgd2lsbCBiZSBmaXJlZCBiZWZvcmVcblx0XHQvLyBGYXN0Q2xpY2sncyBvbkNsaWNrIGhhbmRsZXIuIEZpeCB0aGlzIGJ5IHB1bGxpbmcgb3V0IHRoZSB1c2VyLWRlZmluZWQgaGFuZGxlciBmdW5jdGlvbiBhbmRcblx0XHQvLyBhZGRpbmcgaXQgYXMgbGlzdGVuZXIuXG5cdFx0aWYgKHR5cGVvZiBsYXllci5vbmNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG5cblx0XHRcdC8vIEFuZHJvaWQgYnJvd3NlciBvbiBhdCBsZWFzdCAzLjIgcmVxdWlyZXMgYSBuZXcgcmVmZXJlbmNlIHRvIHRoZSBmdW5jdGlvbiBpbiBsYXllci5vbmNsaWNrXG5cdFx0XHQvLyAtIHRoZSBvbGQgb25lIHdvbid0IHdvcmsgaWYgcGFzc2VkIHRvIGFkZEV2ZW50TGlzdGVuZXIgZGlyZWN0bHkuXG5cdFx0XHRvbGRPbkNsaWNrID0gbGF5ZXIub25jbGljaztcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0b2xkT25DbGljayhldmVudCk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cdFx0XHRsYXllci5vbmNsaWNrID0gbnVsbDtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBXaW5kb3dzIFBob25lIDguMSBmYWtlcyB1c2VyIGFnZW50IHN0cmluZyB0byBsb29rIGxpa2UgQW5kcm9pZCBhbmQgaVBob25lLlxuXHQqXG5cdCogQHR5cGUgYm9vbGVhblxuXHQqL1xuXHR2YXIgZGV2aWNlSXNXaW5kb3dzUGhvbmUgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJXaW5kb3dzIFBob25lXCIpID49IDA7XG5cblx0LyoqXG5cdCAqIEFuZHJvaWQgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzQW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpID4gMCAmJiAhZGV2aWNlSXNXaW5kb3dzUGhvbmU7XG5cblxuXHQvKipcblx0ICogaU9TIHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPUyA9IC9pUChhZHxob25lfG9kKS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAhZGV2aWNlSXNXaW5kb3dzUGhvbmU7XG5cblxuXHQvKipcblx0ICogaU9TIDQgcmVxdWlyZXMgYW4gZXhjZXB0aW9uIGZvciBzZWxlY3QgZWxlbWVudHMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPUzQgPSBkZXZpY2VJc0lPUyAmJiAoL09TIDRfXFxkKF9cXGQpPy8pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cblxuXHQvKipcblx0ICogaU9TIDYuMC03LiogcmVxdWlyZXMgdGhlIHRhcmdldCBlbGVtZW50IHRvIGJlIG1hbnVhbGx5IGRlcml2ZWRcblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCA9IGRldmljZUlzSU9TICYmICgvT1MgWzYtN11fXFxkLykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXHQvKipcblx0ICogQmxhY2tCZXJyeSByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNCbGFja0JlcnJ5MTAgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0JCMTAnKSA+IDA7XG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIG5hdGl2ZSBjbGljay5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXQgVGFyZ2V0IERPTSBlbGVtZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgbmVlZHMgYSBuYXRpdmUgY2xpY2tcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUubmVlZHNDbGljayA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHRcdHN3aXRjaCAodGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcblxuXHRcdC8vIERvbid0IHNlbmQgYSBzeW50aGV0aWMgY2xpY2sgdG8gZGlzYWJsZWQgaW5wdXRzIChpc3N1ZSAjNjIpXG5cdFx0Y2FzZSAnYnV0dG9uJzpcblx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdGlmICh0YXJnZXQuZGlzYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2lucHV0JzpcblxuXHRcdFx0Ly8gRmlsZSBpbnB1dHMgbmVlZCByZWFsIGNsaWNrcyBvbiBpT1MgNiBkdWUgdG8gYSBicm93c2VyIGJ1ZyAoaXNzdWUgIzY4KVxuXHRcdFx0aWYgKChkZXZpY2VJc0lPUyAmJiB0YXJnZXQudHlwZSA9PT0gJ2ZpbGUnKSB8fCB0YXJnZXQuZGlzYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2xhYmVsJzpcblx0XHRjYXNlICdpZnJhbWUnOiAvLyBpT1M4IGhvbWVzY3JlZW4gYXBwcyBjYW4gcHJldmVudCBldmVudHMgYnViYmxpbmcgaW50byBmcmFtZXNcblx0XHRjYXNlICd2aWRlbyc6XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKC9cXGJuZWVkc2NsaWNrXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hldGhlciBhIGdpdmVuIGVsZW1lbnQgcmVxdWlyZXMgYSBjYWxsIHRvIGZvY3VzIHRvIHNpbXVsYXRlIGNsaWNrIGludG8gZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXQgVGFyZ2V0IERPTSBlbGVtZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgcmVxdWlyZXMgYSBjYWxsIHRvIGZvY3VzIHRvIHNpbXVsYXRlIG5hdGl2ZSBjbGljay5cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUubmVlZHNGb2N1cyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHRcdHN3aXRjaCAodGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRjYXNlICd0ZXh0YXJlYSc6XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdFx0cmV0dXJuICFkZXZpY2VJc0FuZHJvaWQ7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXHRcdFx0c3dpdGNoICh0YXJnZXQudHlwZSkge1xuXHRcdFx0Y2FzZSAnYnV0dG9uJzpcblx0XHRcdGNhc2UgJ2NoZWNrYm94Jzpcblx0XHRcdGNhc2UgJ2ZpbGUnOlxuXHRcdFx0Y2FzZSAnaW1hZ2UnOlxuXHRcdFx0Y2FzZSAncmFkaW8nOlxuXHRcdFx0Y2FzZSAnc3VibWl0Jzpcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBObyBwb2ludCBpbiBhdHRlbXB0aW5nIHRvIGZvY3VzIGRpc2FibGVkIGlucHV0c1xuXHRcdFx0cmV0dXJuICF0YXJnZXQuZGlzYWJsZWQgJiYgIXRhcmdldC5yZWFkT25seTtcblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuICgvXFxibmVlZHNmb2N1c1xcYi8pLnRlc3QodGFyZ2V0LmNsYXNzTmFtZSk7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFNlbmQgYSBjbGljayBldmVudCB0byB0aGUgc3BlY2lmaWVkIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5zZW5kQ2xpY2sgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50LCBldmVudCkge1xuXHRcdHZhciBjbGlja0V2ZW50LCB0b3VjaDtcblxuXHRcdC8vIE9uIHNvbWUgQW5kcm9pZCBkZXZpY2VzIGFjdGl2ZUVsZW1lbnQgbmVlZHMgdG8gYmUgYmx1cnJlZCBvdGhlcndpc2UgdGhlIHN5bnRoZXRpYyBjbGljayB3aWxsIGhhdmUgbm8gZWZmZWN0ICgjMjQpXG5cdFx0aWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0fVxuXG5cdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdC8vIFN5bnRoZXNpc2UgYSBjbGljayBldmVudCwgd2l0aCBhbiBleHRyYSBhdHRyaWJ1dGUgc28gaXQgY2FuIGJlIHRyYWNrZWRcblx0XHRjbGlja0V2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnRzJyk7XG5cdFx0Y2xpY2tFdmVudC5pbml0TW91c2VFdmVudCh0aGlzLmRldGVybWluZUV2ZW50VHlwZSh0YXJnZXRFbGVtZW50KSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAxLCB0b3VjaC5zY3JlZW5YLCB0b3VjaC5zY3JlZW5ZLCB0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgbnVsbCk7XG5cdFx0Y2xpY2tFdmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50ID0gdHJ1ZTtcblx0XHR0YXJnZXRFbGVtZW50LmRpc3BhdGNoRXZlbnQoY2xpY2tFdmVudCk7XG5cdH07XG5cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXRlcm1pbmVFdmVudFR5cGUgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cblx0XHQvL0lzc3VlICMxNTk6IEFuZHJvaWQgQ2hyb21lIFNlbGVjdCBCb3ggZG9lcyBub3Qgb3BlbiB3aXRoIGEgc3ludGhldGljIGNsaWNrIGV2ZW50XG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCAmJiB0YXJnZXRFbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3NlbGVjdCcpIHtcblx0XHRcdHJldHVybiAnbW91c2Vkb3duJztcblx0XHR9XG5cblx0XHRyZXR1cm4gJ2NsaWNrJztcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZm9jdXMgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIGxlbmd0aDtcblxuXHRcdC8vIElzc3VlICMxNjA6IG9uIGlPUyA3LCBzb21lIGlucHV0IGVsZW1lbnRzIChlLmcuIGRhdGUgZGF0ZXRpbWUgbW9udGgpIHRocm93IGEgdmFndWUgVHlwZUVycm9yIG9uIHNldFNlbGVjdGlvblJhbmdlLiBUaGVzZSBlbGVtZW50cyBkb24ndCBoYXZlIGFuIGludGVnZXIgdmFsdWUgZm9yIHRoZSBzZWxlY3Rpb25TdGFydCBhbmQgc2VsZWN0aW9uRW5kIHByb3BlcnRpZXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IHRoYXQgY2FuJ3QgYmUgdXNlZCBmb3IgZGV0ZWN0aW9uIGJlY2F1c2UgYWNjZXNzaW5nIHRoZSBwcm9wZXJ0aWVzIGFsc28gdGhyb3dzIGEgVHlwZUVycm9yLiBKdXN0IGNoZWNrIHRoZSB0eXBlIGluc3RlYWQuIEZpbGVkIGFzIEFwcGxlIGJ1ZyAjMTUxMjI3MjQuXG5cdFx0aWYgKGRldmljZUlzSU9TICYmIHRhcmdldEVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UgJiYgdGFyZ2V0RWxlbWVudC50eXBlLmluZGV4T2YoJ2RhdGUnKSAhPT0gMCAmJiB0YXJnZXRFbGVtZW50LnR5cGUgIT09ICd0aW1lJyAmJiB0YXJnZXRFbGVtZW50LnR5cGUgIT09ICdtb250aCcpIHtcblx0XHRcdGxlbmd0aCA9IHRhcmdldEVsZW1lbnQudmFsdWUubGVuZ3RoO1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShsZW5ndGgsIGxlbmd0aCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRhcmdldEVsZW1lbnQuZm9jdXMoKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciB0aGUgZ2l2ZW4gdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiBhIHNjcm9sbGFibGUgbGF5ZXIgYW5kIGlmIHNvLCBzZXQgYSBmbGFnIG9uIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudXBkYXRlU2Nyb2xsUGFyZW50ID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXHRcdHZhciBzY3JvbGxQYXJlbnQsIHBhcmVudEVsZW1lbnQ7XG5cblx0XHRzY3JvbGxQYXJlbnQgPSB0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblxuXHRcdC8vIEF0dGVtcHQgdG8gZGlzY292ZXIgd2hldGhlciB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgY29udGFpbmVkIHdpdGhpbiBhIHNjcm9sbGFibGUgbGF5ZXIuIFJlLWNoZWNrIGlmIHRoZVxuXHRcdC8vIHRhcmdldCBlbGVtZW50IHdhcyBtb3ZlZCB0byBhbm90aGVyIHBhcmVudC5cblx0XHRpZiAoIXNjcm9sbFBhcmVudCB8fCAhc2Nyb2xsUGFyZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpKSB7XG5cdFx0XHRwYXJlbnRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblx0XHRcdGRvIHtcblx0XHRcdFx0aWYgKHBhcmVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gcGFyZW50RWxlbWVudC5vZmZzZXRIZWlnaHQpIHtcblx0XHRcdFx0XHRzY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gcGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQgPSBwYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHR9IHdoaWxlIChwYXJlbnRFbGVtZW50KTtcblx0XHR9XG5cblx0XHQvLyBBbHdheXMgdXBkYXRlIHRoZSBzY3JvbGwgdG9wIHRyYWNrZXIgaWYgcG9zc2libGUuXG5cdFx0aWYgKHNjcm9sbFBhcmVudCkge1xuXHRcdFx0c2Nyb2xsUGFyZW50LmZhc3RDbGlja0xhc3RTY3JvbGxUb3AgPSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRFbGVtZW50XG5cdCAqIEByZXR1cm5zIHtFbGVtZW50fEV2ZW50VGFyZ2V0fVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0ID0gZnVuY3Rpb24oZXZlbnRUYXJnZXQpIHtcblxuXHRcdC8vIE9uIHNvbWUgb2xkZXIgYnJvd3NlcnMgKG5vdGFibHkgU2FmYXJpIG9uIGlPUyA0LjEgLSBzZWUgaXNzdWUgIzU2KSB0aGUgZXZlbnQgdGFyZ2V0IG1heSBiZSBhIHRleHQgbm9kZS5cblx0XHRpZiAoZXZlbnRUYXJnZXQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG5cdFx0XHRyZXR1cm4gZXZlbnRUYXJnZXQucGFyZW50Tm9kZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZXZlbnRUYXJnZXQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggc3RhcnQsIHJlY29yZCB0aGUgcG9zaXRpb24gYW5kIHNjcm9sbCBvZmZzZXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoU3RhcnQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciB0YXJnZXRFbGVtZW50LCB0b3VjaCwgc2VsZWN0aW9uO1xuXG5cdFx0Ly8gSWdub3JlIG11bHRpcGxlIHRvdWNoZXMsIG90aGVyd2lzZSBwaW5jaC10by16b29tIGlzIHByZXZlbnRlZCBpZiBib3RoIGZpbmdlcnMgYXJlIG9uIHRoZSBGYXN0Q2xpY2sgZWxlbWVudCAoaXNzdWUgIzExMSkuXG5cdFx0aWYgKGV2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0dGFyZ2V0RWxlbWVudCA9IHRoaXMuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldChldmVudC50YXJnZXQpO1xuXHRcdHRvdWNoID0gZXZlbnQudGFyZ2V0VG91Y2hlc1swXTtcblxuXHRcdGlmIChkZXZpY2VJc0lPUykge1xuXG5cdFx0XHQvLyBPbmx5IHRydXN0ZWQgZXZlbnRzIHdpbGwgZGVzZWxlY3QgdGV4dCBvbiBpT1MgKGlzc3VlICM0OSlcblx0XHRcdHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcblx0XHRcdGlmIChzZWxlY3Rpb24ucmFuZ2VDb3VudCAmJiAhc2VsZWN0aW9uLmlzQ29sbGFwc2VkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHRcdC8vIFdlaXJkIHRoaW5ncyBoYXBwZW4gb24gaU9TIHdoZW4gYW4gYWxlcnQgb3IgY29uZmlybSBkaWFsb2cgaXMgb3BlbmVkIGZyb20gYSBjbGljayBldmVudCBjYWxsYmFjayAoaXNzdWUgIzIzKTpcblx0XHRcdFx0Ly8gd2hlbiB0aGUgdXNlciBuZXh0IHRhcHMgYW55d2hlcmUgZWxzZSBvbiB0aGUgcGFnZSwgbmV3IHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kIGV2ZW50cyBhcmUgZGlzcGF0Y2hlZFxuXHRcdFx0XHQvLyB3aXRoIHRoZSBzYW1lIGlkZW50aWZpZXIgYXMgdGhlIHRvdWNoIGV2ZW50IHRoYXQgcHJldmlvdXNseSB0cmlnZ2VyZWQgdGhlIGNsaWNrIHRoYXQgdHJpZ2dlcmVkIHRoZSBhbGVydC5cblx0XHRcdFx0Ly8gU2FkbHksIHRoZXJlIGlzIGFuIGlzc3VlIG9uIGlPUyA0IHRoYXQgY2F1c2VzIHNvbWUgbm9ybWFsIHRvdWNoIGV2ZW50cyB0byBoYXZlIHRoZSBzYW1lIGlkZW50aWZpZXIgYXMgYW5cblx0XHRcdFx0Ly8gaW1tZWRpYXRlbHkgcHJlY2VlZGluZyB0b3VjaCBldmVudCAoaXNzdWUgIzUyKSwgc28gdGhpcyBmaXggaXMgdW5hdmFpbGFibGUgb24gdGhhdCBwbGF0Zm9ybS5cblx0XHRcdFx0Ly8gSXNzdWUgMTIwOiB0b3VjaC5pZGVudGlmaWVyIGlzIDAgd2hlbiBDaHJvbWUgZGV2IHRvb2xzICdFbXVsYXRlIHRvdWNoIGV2ZW50cycgaXMgc2V0IHdpdGggYW4gaU9TIGRldmljZSBVQSBzdHJpbmcsXG5cdFx0XHRcdC8vIHdoaWNoIGNhdXNlcyBhbGwgdG91Y2ggZXZlbnRzIHRvIGJlIGlnbm9yZWQuIEFzIHRoaXMgYmxvY2sgb25seSBhcHBsaWVzIHRvIGlPUywgYW5kIGlPUyBpZGVudGlmaWVycyBhcmUgYWx3YXlzIGxvbmcsXG5cdFx0XHRcdC8vIHJhbmRvbSBpbnRlZ2VycywgaXQncyBzYWZlIHRvIHRvIGNvbnRpbnVlIGlmIHRoZSBpZGVudGlmaWVyIGlzIDAgaGVyZS5cblx0XHRcdFx0aWYgKHRvdWNoLmlkZW50aWZpZXIgJiYgdG91Y2guaWRlbnRpZmllciA9PT0gdGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyKSB7XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG5cdFx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciAodXNpbmcgLXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6IHRvdWNoKSBhbmQ6XG5cdFx0XHRcdC8vIDEpIHRoZSB1c2VyIGRvZXMgYSBmbGluZyBzY3JvbGwgb24gdGhlIHNjcm9sbGFibGUgbGF5ZXJcblx0XHRcdFx0Ly8gMikgdGhlIHVzZXIgc3RvcHMgdGhlIGZsaW5nIHNjcm9sbCB3aXRoIGFub3RoZXIgdGFwXG5cdFx0XHRcdC8vIHRoZW4gdGhlIGV2ZW50LnRhcmdldCBvZiB0aGUgbGFzdCAndG91Y2hlbmQnIGV2ZW50IHdpbGwgYmUgdGhlIGVsZW1lbnQgdGhhdCB3YXMgdW5kZXIgdGhlIHVzZXIncyBmaW5nZXJcblx0XHRcdFx0Ly8gd2hlbiB0aGUgZmxpbmcgc2Nyb2xsIHdhcyBzdGFydGVkLCBjYXVzaW5nIEZhc3RDbGljayB0byBzZW5kIGEgY2xpY2sgZXZlbnQgdG8gdGhhdCBsYXllciAtIHVubGVzcyBhIGNoZWNrXG5cdFx0XHRcdC8vIGlzIG1hZGUgdG8gZW5zdXJlIHRoYXQgYSBwYXJlbnQgbGF5ZXIgd2FzIG5vdCBzY3JvbGxlZCBiZWZvcmUgc2VuZGluZyBhIHN5bnRoZXRpYyBjbGljayAoaXNzdWUgIzQyKS5cblx0XHRcdFx0dGhpcy51cGRhdGVTY3JvbGxQYXJlbnQodGFyZ2V0RWxlbWVudCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gdHJ1ZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IGV2ZW50LnRpbWVTdGFtcDtcblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXG5cdFx0dGhpcy50b3VjaFN0YXJ0WCA9IHRvdWNoLnBhZ2VYO1xuXHRcdHRoaXMudG91Y2hTdGFydFkgPSB0b3VjaC5wYWdlWTtcblxuXHRcdC8vIFByZXZlbnQgcGhhbnRvbSBjbGlja3Mgb24gZmFzdCBkb3VibGUtdGFwIChpc3N1ZSAjMzYpXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLmxhc3RDbGlja1RpbWUpIDwgdGhpcy50YXBEZWxheSkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBCYXNlZCBvbiBhIHRvdWNobW92ZSBldmVudCBvYmplY3QsIGNoZWNrIHdoZXRoZXIgdGhlIHRvdWNoIGhhcyBtb3ZlZCBwYXN0IGEgYm91bmRhcnkgc2luY2UgaXQgc3RhcnRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnRvdWNoSGFzTW92ZWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLCBib3VuZGFyeSA9IHRoaXMudG91Y2hCb3VuZGFyeTtcblxuXHRcdGlmIChNYXRoLmFicyh0b3VjaC5wYWdlWCAtIHRoaXMudG91Y2hTdGFydFgpID4gYm91bmRhcnkgfHwgTWF0aC5hYnModG91Y2gucGFnZVkgLSB0aGlzLnRvdWNoU3RhcnRZKSA+IGJvdW5kYXJ5KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogVXBkYXRlIHRoZSBsYXN0IHBvc2l0aW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaE1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdGlmICghdGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgdG91Y2ggaGFzIG1vdmVkLCBjYW5jZWwgdGhlIGNsaWNrIHRyYWNraW5nXG5cdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudCAhPT0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCkgfHwgdGhpcy50b3VjaEhhc01vdmVkKGV2ZW50KSkge1xuXHRcdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEF0dGVtcHQgdG8gZmluZCB0aGUgbGFiZWxsZWQgY29udHJvbCBmb3IgdGhlIGdpdmVuIGxhYmVsIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8SFRNTExhYmVsRWxlbWVudH0gbGFiZWxFbGVtZW50XG5cdCAqIEByZXR1cm5zIHtFbGVtZW50fG51bGx9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmZpbmRDb250cm9sID0gZnVuY3Rpb24obGFiZWxFbGVtZW50KSB7XG5cblx0XHQvLyBGYXN0IHBhdGggZm9yIG5ld2VyIGJyb3dzZXJzIHN1cHBvcnRpbmcgdGhlIEhUTUw1IGNvbnRyb2wgYXR0cmlidXRlXG5cdFx0aWYgKGxhYmVsRWxlbWVudC5jb250cm9sICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBsYWJlbEVsZW1lbnQuY29udHJvbDtcblx0XHR9XG5cblx0XHQvLyBBbGwgYnJvd3NlcnMgdW5kZXIgdGVzdCB0aGF0IHN1cHBvcnQgdG91Y2ggZXZlbnRzIGFsc28gc3VwcG9ydCB0aGUgSFRNTDUgaHRtbEZvciBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50Lmh0bWxGb3IpIHtcblx0XHRcdHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChsYWJlbEVsZW1lbnQuaHRtbEZvcik7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgbm8gZm9yIGF0dHJpYnV0ZSBleGlzdHMsIGF0dGVtcHQgdG8gcmV0cmlldmUgdGhlIGZpcnN0IGxhYmVsbGFibGUgZGVzY2VuZGFudCBlbGVtZW50XG5cdFx0Ly8gdGhlIGxpc3Qgb2Ygd2hpY2ggaXMgZGVmaW5lZCBoZXJlOiBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sNS9mb3Jtcy5odG1sI2NhdGVnb3J5LWxhYmVsXG5cdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdidXR0b24sIGlucHV0Om5vdChbdHlwZT1oaWRkZW5dKSwga2V5Z2VuLCBtZXRlciwgb3V0cHV0LCBwcm9ncmVzcywgc2VsZWN0LCB0ZXh0YXJlYScpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGVuZCwgZGV0ZXJtaW5lIHdoZXRoZXIgdG8gc2VuZCBhIGNsaWNrIGV2ZW50IGF0IG9uY2UuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoRW5kID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgZm9yRWxlbWVudCwgdHJhY2tpbmdDbGlja1N0YXJ0LCB0YXJnZXRUYWdOYW1lLCBzY3JvbGxQYXJlbnQsIHRvdWNoLCB0YXJnZXRFbGVtZW50ID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgcGhhbnRvbSBjbGlja3Mgb24gZmFzdCBkb3VibGUtdGFwIChpc3N1ZSAjMzYpXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLmxhc3RDbGlja1RpbWUpIDwgdGhpcy50YXBEZWxheSkge1xuXHRcdFx0dGhpcy5jYW5jZWxOZXh0Q2xpY2sgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCkgPiB0aGlzLnRhcFRpbWVvdXQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFJlc2V0IHRvIHByZXZlbnQgd3JvbmcgY2xpY2sgY2FuY2VsIG9uIGlucHV0IChpc3N1ZSAjMTU2KS5cblx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IGZhbHNlO1xuXG5cdFx0dGhpcy5sYXN0Q2xpY2tUaW1lID0gZXZlbnQudGltZVN0YW1wO1xuXG5cdFx0dHJhY2tpbmdDbGlja1N0YXJ0ID0gdGhpcy50cmFja2luZ0NsaWNrU3RhcnQ7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSAwO1xuXG5cdFx0Ly8gT24gc29tZSBpT1MgZGV2aWNlcywgdGhlIHRhcmdldEVsZW1lbnQgc3VwcGxpZWQgd2l0aCB0aGUgZXZlbnQgaXMgaW52YWxpZCBpZiB0aGUgbGF5ZXJcblx0XHQvLyBpcyBwZXJmb3JtaW5nIGEgdHJhbnNpdGlvbiBvciBzY3JvbGwsIGFuZCBoYXMgdG8gYmUgcmUtZGV0ZWN0ZWQgbWFudWFsbHkuIE5vdGUgdGhhdFxuXHRcdC8vIGZvciB0aGlzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSwgaXQgbXVzdCBiZSBjYWxsZWQgKmFmdGVyKiB0aGUgZXZlbnQgdGFyZ2V0IGlzIGNoZWNrZWQhXG5cdFx0Ly8gU2VlIGlzc3VlICM1NzsgYWxzbyBmaWxlZCBhcyByZGFyOi8vMTMwNDg1ODkgLlxuXHRcdGlmIChkZXZpY2VJc0lPU1dpdGhCYWRUYXJnZXQpIHtcblx0XHRcdHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHRcdC8vIEluIGNlcnRhaW4gY2FzZXMgYXJndW1lbnRzIG9mIGVsZW1lbnRGcm9tUG9pbnQgY2FuIGJlIG5lZ2F0aXZlLCBzbyBwcmV2ZW50IHNldHRpbmcgdGFyZ2V0RWxlbWVudCB0byBudWxsXG5cdFx0XHR0YXJnZXRFbGVtZW50ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5wYWdlWCAtIHdpbmRvdy5wYWdlWE9mZnNldCwgdG91Y2gucGFnZVkgLSB3aW5kb3cucGFnZVlPZmZzZXQpIHx8IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHR0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudCA9IHRoaXMudGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0fVxuXG5cdFx0dGFyZ2V0VGFnTmFtZSA9IHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0YXJnZXRUYWdOYW1lID09PSAnbGFiZWwnKSB7XG5cdFx0XHRmb3JFbGVtZW50ID0gdGhpcy5maW5kQ29udHJvbCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdGlmIChmb3JFbGVtZW50KSB7XG5cdFx0XHRcdHRoaXMuZm9jdXModGFyZ2V0RWxlbWVudCk7XG5cdFx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0YXJnZXRFbGVtZW50ID0gZm9yRWxlbWVudDtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRoaXMubmVlZHNGb2N1cyh0YXJnZXRFbGVtZW50KSkge1xuXG5cdFx0XHQvLyBDYXNlIDE6IElmIHRoZSB0b3VjaCBzdGFydGVkIGEgd2hpbGUgYWdvIChiZXN0IGd1ZXNzIGlzIDEwMG1zIGJhc2VkIG9uIHRlc3RzIGZvciBpc3N1ZSAjMzYpIHRoZW4gZm9jdXMgd2lsbCBiZSB0cmlnZ2VyZWQgYW55d2F5LiBSZXR1cm4gZWFybHkgYW5kIHVuc2V0IHRoZSB0YXJnZXQgZWxlbWVudCByZWZlcmVuY2Ugc28gdGhhdCB0aGUgc3Vic2VxdWVudCBjbGljayB3aWxsIGJlIGFsbG93ZWQgdGhyb3VnaC5cblx0XHRcdC8vIENhc2UgMjogV2l0aG91dCB0aGlzIGV4Y2VwdGlvbiBmb3IgaW5wdXQgZWxlbWVudHMgdGFwcGVkIHdoZW4gdGhlIGRvY3VtZW50IGlzIGNvbnRhaW5lZCBpbiBhbiBpZnJhbWUsIHRoZW4gYW55IGlucHV0dGVkIHRleHQgd29uJ3QgYmUgdmlzaWJsZSBldmVuIHRob3VnaCB0aGUgdmFsdWUgYXR0cmlidXRlIGlzIHVwZGF0ZWQgYXMgdGhlIHVzZXIgdHlwZXMgKGlzc3VlICMzNykuXG5cdFx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRyYWNraW5nQ2xpY2tTdGFydCkgPiAxMDAgfHwgKGRldmljZUlzSU9TICYmIHdpbmRvdy50b3AgIT09IHdpbmRvdyAmJiB0YXJnZXRUYWdOYW1lID09PSAnaW5wdXQnKSkge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZm9jdXModGFyZ2V0RWxlbWVudCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cblx0XHRcdC8vIFNlbGVjdCBlbGVtZW50cyBuZWVkIHRoZSBldmVudCB0byBnbyB0aHJvdWdoIG9uIGlPUyA0LCBvdGhlcndpc2UgdGhlIHNlbGVjdG9yIG1lbnUgd29uJ3Qgb3Blbi5cblx0XHRcdC8vIEFsc28gdGhpcyBicmVha3Mgb3BlbmluZyBzZWxlY3RzIHdoZW4gVm9pY2VPdmVyIGlzIGFjdGl2ZSBvbiBpT1M2LCBpT1M3IChhbmQgcG9zc2libHkgb3RoZXJzKVxuXHRcdFx0aWYgKCFkZXZpY2VJc0lPUyB8fCB0YXJnZXRUYWdOYW1lICE9PSAnc2VsZWN0Jykge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzSU9TICYmICFkZXZpY2VJc0lPUzQpIHtcblxuXHRcdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayBldmVudCBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgY29udGFpbmVkIHdpdGhpbiBhIHBhcmVudCBsYXllciB0aGF0IHdhcyBzY3JvbGxlZFxuXHRcdFx0Ly8gYW5kIHRoaXMgdGFwIGlzIGJlaW5nIHVzZWQgdG8gc3RvcCB0aGUgc2Nyb2xsaW5nICh1c3VhbGx5IGluaXRpYXRlZCBieSBhIGZsaW5nIC0gaXNzdWUgIzQyKS5cblx0XHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXHRcdFx0aWYgKHNjcm9sbFBhcmVudCAmJiBzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCAhPT0gc2Nyb2xsUGFyZW50LnNjcm9sbFRvcCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBQcmV2ZW50IHRoZSBhY3R1YWwgY2xpY2sgZnJvbSBnb2luZyB0aG91Z2ggLSB1bmxlc3MgdGhlIHRhcmdldCBub2RlIGlzIG1hcmtlZCBhcyByZXF1aXJpbmdcblx0XHQvLyByZWFsIGNsaWNrcyBvciBpZiBpdCBpcyBpbiB0aGUgd2hpdGVsaXN0IGluIHdoaWNoIGNhc2Ugb25seSBub24tcHJvZ3JhbW1hdGljIGNsaWNrcyBhcmUgcGVybWl0dGVkLlxuXHRcdGlmICghdGhpcy5uZWVkc0NsaWNrKHRhcmdldEVsZW1lbnQpKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5zZW5kQ2xpY2sodGFyZ2V0RWxlbWVudCwgZXZlbnQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBjYW5jZWwsIHN0b3AgdHJhY2tpbmcgdGhlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaENhbmNlbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdH07XG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIG1vdXNlIGV2ZW50cyB3aGljaCBzaG91bGQgYmUgcGVybWl0dGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Nb3VzZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cblx0XHQvLyBJZiBhIHRhcmdldCBlbGVtZW50IHdhcyBuZXZlciBzZXQgKGJlY2F1c2UgYSB0b3VjaCBldmVudCB3YXMgbmV2ZXIgZmlyZWQpIGFsbG93IHRoZSBldmVudFxuXHRcdGlmICghdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoZXZlbnQuZm9yd2FyZGVkVG91Y2hFdmVudCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJvZ3JhbW1hdGljYWxseSBnZW5lcmF0ZWQgZXZlbnRzIHRhcmdldGluZyBhIHNwZWNpZmljIGVsZW1lbnQgc2hvdWxkIGJlIHBlcm1pdHRlZFxuXHRcdGlmICghZXZlbnQuY2FuY2VsYWJsZSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gRGVyaXZlIGFuZCBjaGVjayB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gc2VlIHdoZXRoZXIgdGhlIG1vdXNlIGV2ZW50IG5lZWRzIHRvIGJlIHBlcm1pdHRlZDtcblx0XHQvLyB1bmxlc3MgZXhwbGljaXRseSBlbmFibGVkLCBwcmV2ZW50IG5vbi10b3VjaCBjbGljayBldmVudHMgZnJvbSB0cmlnZ2VyaW5nIGFjdGlvbnMsXG5cdFx0Ly8gdG8gcHJldmVudCBnaG9zdC9kb3VibGVjbGlja3MuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGhpcy50YXJnZXRFbGVtZW50KSB8fCB0aGlzLmNhbmNlbE5leHRDbGljaykge1xuXG5cdFx0XHQvLyBQcmV2ZW50IGFueSB1c2VyLWFkZGVkIGxpc3RlbmVycyBkZWNsYXJlZCBvbiBGYXN0Q2xpY2sgZWxlbWVudCBmcm9tIGJlaW5nIGZpcmVkLlxuXHRcdFx0aWYgKGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbikge1xuXHRcdFx0XHRldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gUGFydCBvZiB0aGUgaGFjayBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IEV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoZS5nLiBBbmRyb2lkIDIpXG5cdFx0XHRcdGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENhbmNlbCB0aGUgZXZlbnRcblx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSBtb3VzZSBldmVudCBpcyBwZXJtaXR0ZWQsIHJldHVybiB0cnVlIGZvciB0aGUgYWN0aW9uIHRvIGdvIHRocm91Z2guXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gYWN0dWFsIGNsaWNrcywgZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBpcyBhIHRvdWNoLWdlbmVyYXRlZCBjbGljaywgYSBjbGljayBhY3Rpb24gb2NjdXJyaW5nXG5cdCAqIG5hdHVyYWxseSBhZnRlciBhIGRlbGF5IGFmdGVyIGEgdG91Y2ggKHdoaWNoIG5lZWRzIHRvIGJlIGNhbmNlbGxlZCB0byBhdm9pZCBkdXBsaWNhdGlvbiksIG9yXG5cdCAqIGFuIGFjdHVhbCBjbGljayB3aGljaCBzaG91bGQgYmUgcGVybWl0dGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHBlcm1pdHRlZDtcblxuXHRcdC8vIEl0J3MgcG9zc2libGUgZm9yIGFub3RoZXIgRmFzdENsaWNrLWxpa2UgbGlicmFyeSBkZWxpdmVyZWQgd2l0aCB0aGlyZC1wYXJ0eSBjb2RlIHRvIGZpcmUgYSBjbGljayBldmVudCBiZWZvcmUgRmFzdENsaWNrIGRvZXMgKGlzc3VlICM0NCkuIEluIHRoYXQgY2FzZSwgc2V0IHRoZSBjbGljay10cmFja2luZyBmbGFnIGJhY2sgdG8gZmFsc2UgYW5kIHJldHVybiBlYXJseS4gVGhpcyB3aWxsIGNhdXNlIG9uVG91Y2hFbmQgdG8gcmV0dXJuIGVhcmx5LlxuXHRcdGlmICh0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFZlcnkgb2RkIGJlaGF2aW91ciBvbiBpT1MgKGlzc3VlICMxOCk6IGlmIGEgc3VibWl0IGVsZW1lbnQgaXMgcHJlc2VudCBpbnNpZGUgYSBmb3JtIGFuZCB0aGUgdXNlciBoaXRzIGVudGVyIGluIHRoZSBpT1Mgc2ltdWxhdG9yIG9yIGNsaWNrcyB0aGUgR28gYnV0dG9uIG9uIHRoZSBwb3AtdXAgT1Mga2V5Ym9hcmQgdGhlIGEga2luZCBvZiAnZmFrZScgY2xpY2sgZXZlbnQgd2lsbCBiZSB0cmlnZ2VyZWQgd2l0aCB0aGUgc3VibWl0LXR5cGUgaW5wdXQgZWxlbWVudCBhcyB0aGUgdGFyZ2V0LlxuXHRcdGlmIChldmVudC50YXJnZXQudHlwZSA9PT0gJ3N1Ym1pdCcgJiYgZXZlbnQuZGV0YWlsID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRwZXJtaXR0ZWQgPSB0aGlzLm9uTW91c2UoZXZlbnQpO1xuXG5cdFx0Ly8gT25seSB1bnNldCB0YXJnZXRFbGVtZW50IGlmIHRoZSBjbGljayBpcyBub3QgcGVybWl0dGVkLiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgdGhlIGNoZWNrIGZvciAhdGFyZ2V0RWxlbWVudCBpbiBvbk1vdXNlIGZhaWxzIGFuZCB0aGUgYnJvd3NlcidzIGNsaWNrIGRvZXNuJ3QgZ28gdGhyb3VnaC5cblx0XHRpZiAoIXBlcm1pdHRlZCkge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBJZiBjbGlja3MgYXJlIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gcGVybWl0dGVkO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFJlbW92ZSBhbGwgRmFzdENsaWNrJ3MgZXZlbnQgbGlzdGVuZXJzLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsYXllciA9IHRoaXMubGF5ZXI7XG5cblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdH1cblxuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0cnVlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnQsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlLCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmQsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMub25Ub3VjaENhbmNlbCwgZmFsc2UpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIENoZWNrIHdoZXRoZXIgRmFzdENsaWNrIGlzIG5lZWRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqL1xuXHRGYXN0Q2xpY2subm90TmVlZGVkID0gZnVuY3Rpb24obGF5ZXIpIHtcblx0XHR2YXIgbWV0YVZpZXdwb3J0O1xuXHRcdHZhciBjaHJvbWVWZXJzaW9uO1xuXHRcdHZhciBibGFja2JlcnJ5VmVyc2lvbjtcblx0XHR2YXIgZmlyZWZveFZlcnNpb247XG5cblx0XHQvLyBEZXZpY2VzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0b3VjaCBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdGlmICh0eXBlb2Ygd2luZG93Lm9udG91Y2hzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIENocm9tZSB2ZXJzaW9uIC0gemVybyBmb3Igb3RoZXIgYnJvd3NlcnNcblx0XHRjaHJvbWVWZXJzaW9uID0gKygvQ2hyb21lXFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoY2hyb21lVmVyc2lvbikge1xuXG5cdFx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gQ2hyb21lIG9uIEFuZHJvaWQgd2l0aCB1c2VyLXNjYWxhYmxlPVwibm9cIiBkb2Vzbid0IG5lZWQgRmFzdENsaWNrIChpc3N1ZSAjODkpXG5cdFx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBDaHJvbWUgMzIgYW5kIGFib3ZlIHdpdGggd2lkdGg9ZGV2aWNlLXdpZHRoIG9yIGxlc3MgZG9uJ3QgbmVlZCBGYXN0Q2xpY2tcblx0XHRcdFx0XHRpZiAoY2hyb21lVmVyc2lvbiA+IDMxICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdC8vIENocm9tZSBkZXNrdG9wIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICMxNSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChkZXZpY2VJc0JsYWNrQmVycnkxMCkge1xuXHRcdFx0YmxhY2tiZXJyeVZlcnNpb24gPSBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9WZXJzaW9uXFwvKFswLTldKilcXC4oWzAtOV0qKS8pO1xuXG5cdFx0XHQvLyBCbGFja0JlcnJ5IDEwLjMrIGRvZXMgbm90IHJlcXVpcmUgRmFzdGNsaWNrIGxpYnJhcnkuXG5cdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vZnRsYWJzL2Zhc3RjbGljay9pc3N1ZXMvMjUxXG5cdFx0XHRpZiAoYmxhY2tiZXJyeVZlcnNpb25bMV0gPj0gMTAgJiYgYmxhY2tiZXJyeVZlcnNpb25bMl0gPj0gMykge1xuXHRcdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cblx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydCkge1xuXHRcdFx0XHRcdC8vIHVzZXItc2NhbGFibGU9bm8gZWxpbWluYXRlcyBjbGljayBkZWxheS5cblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHdpZHRoPWRldmljZS13aWR0aCAob3IgbGVzcyB0aGFuIGRldmljZS13aWR0aCkgZWxpbWluYXRlcyBjbGljayBkZWxheS5cblx0XHRcdFx0XHRpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJRTEwIHdpdGggLW1zLXRvdWNoLWFjdGlvbjogbm9uZSBvciBtYW5pcHVsYXRpb24sIHdoaWNoIGRpc2FibGVzIGRvdWJsZS10YXAtdG8tem9vbSAoaXNzdWUgIzk3KVxuXHRcdGlmIChsYXllci5zdHlsZS5tc1RvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBGaXJlZm94IHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGZpcmVmb3hWZXJzaW9uID0gKygvRmlyZWZveFxcLyhbMC05XSspLy5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpIHx8IFssMF0pWzFdO1xuXG5cdFx0aWYgKGZpcmVmb3hWZXJzaW9uID49IDI3KSB7XG5cdFx0XHQvLyBGaXJlZm94IDI3KyBkb2VzIG5vdCBoYXZlIHRhcCBkZWxheSBpZiB0aGUgY29udGVudCBpcyBub3Qgem9vbWFibGUgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD05MjI4OTZcblxuXHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXHRcdFx0aWYgKG1ldGFWaWV3cG9ydCAmJiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTE6IHByZWZpeGVkIC1tcy10b3VjaC1hY3Rpb24gaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCBhbmQgaXQncyByZWNvbWVuZGVkIHRvIHVzZSBub24tcHJlZml4ZWQgdmVyc2lvblxuXHRcdC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS93aW5kb3dzL2FwcHMvSGg3NjczMTMuYXNweFxuXHRcdGlmIChsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ25vbmUnIHx8IGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbWFuaXB1bGF0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIGZvciBjcmVhdGluZyBhIEZhc3RDbGljayBvYmplY3Rcblx0ICpcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzXG5cdCAqL1xuXHRGYXN0Q2xpY2suYXR0YWNoID0gZnVuY3Rpb24obGF5ZXIsIG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gbmV3IEZhc3RDbGljayhsYXllciwgb3B0aW9ucyk7XG5cdH07XG5cblxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXG5cdFx0Ly8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuXHRcdGRlZmluZShmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBGYXN0Q2xpY2s7XG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEZhc3RDbGljay5hdHRhY2g7XG5cdFx0bW9kdWxlLmV4cG9ydHMuRmFzdENsaWNrID0gRmFzdENsaWNrO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH1cbn0oKSk7XG4iLCIvKiFcblxuIGhhbmRsZWJhcnMgdjMuMC4zXG5cbkNvcHlyaWdodCAoQykgMjAxMS0yMDE0IGJ5IFllaHVkYSBLYXR6XG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cblxuQGxpY2Vuc2VcbiovXG4oZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIkhhbmRsZWJhcnNcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiSGFuZGxlYmFyc1wiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KVsnZGVmYXVsdCddO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cblx0dmFyIF9pbXBvcnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG5cdHZhciBiYXNlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cblx0Ly8gRWFjaCBvZiB0aGVzZSBhdWdtZW50IHRoZSBIYW5kbGViYXJzIG9iamVjdC4gTm8gbmVlZCB0byBzZXR1cCBoZXJlLlxuXHQvLyAoVGhpcyBpcyBkb25lIHRvIGVhc2lseSBzaGFyZSBjb2RlIGJldHdlZW4gY29tbW9uanMgYW5kIGJyb3dzZSBlbnZzKVxuXG5cdHZhciBfU2FmZVN0cmluZyA9IF9fd2VicGFja19yZXF1aXJlX18oMik7XG5cblx0dmFyIF9TYWZlU3RyaW5nMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9TYWZlU3RyaW5nKTtcblxuXHR2YXIgX0V4Y2VwdGlvbiA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0dmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cblx0dmFyIF9pbXBvcnQyID0gX193ZWJwYWNrX3JlcXVpcmVfXyg0KTtcblxuXHR2YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0Mik7XG5cblx0dmFyIF9pbXBvcnQzID0gX193ZWJwYWNrX3JlcXVpcmVfXyg1KTtcblxuXHR2YXIgcnVudGltZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQzKTtcblxuXHR2YXIgX25vQ29uZmxpY3QgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXG5cdHZhciBfbm9Db25mbGljdDIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfbm9Db25mbGljdCk7XG5cblx0Ly8gRm9yIGNvbXBhdGliaWxpdHkgYW5kIHVzYWdlIG91dHNpZGUgb2YgbW9kdWxlIHN5c3RlbXMsIG1ha2UgdGhlIEhhbmRsZWJhcnMgb2JqZWN0IGEgbmFtZXNwYWNlXG5cdGZ1bmN0aW9uIGNyZWF0ZSgpIHtcblx0ICB2YXIgaGIgPSBuZXcgYmFzZS5IYW5kbGViYXJzRW52aXJvbm1lbnQoKTtcblxuXHQgIFV0aWxzLmV4dGVuZChoYiwgYmFzZSk7XG5cdCAgaGIuU2FmZVN0cmluZyA9IF9TYWZlU3RyaW5nMlsnZGVmYXVsdCddO1xuXHQgIGhiLkV4Y2VwdGlvbiA9IF9FeGNlcHRpb24yWydkZWZhdWx0J107XG5cdCAgaGIuVXRpbHMgPSBVdGlscztcblx0ICBoYi5lc2NhcGVFeHByZXNzaW9uID0gVXRpbHMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXHQgIGhiLlZNID0gcnVudGltZTtcblx0ICBoYi50ZW1wbGF0ZSA9IGZ1bmN0aW9uIChzcGVjKSB7XG5cdCAgICByZXR1cm4gcnVudGltZS50ZW1wbGF0ZShzcGVjLCBoYik7XG5cdCAgfTtcblxuXHQgIHJldHVybiBoYjtcblx0fVxuXG5cdHZhciBpbnN0ID0gY3JlYXRlKCk7XG5cdGluc3QuY3JlYXRlID0gY3JlYXRlO1xuXG5cdF9ub0NvbmZsaWN0MlsnZGVmYXVsdCddKGluc3QpO1xuXG5cdGluc3RbJ2RlZmF1bHQnXSA9IGluc3Q7XG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gaW5zdDtcblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8qKiovIH0sXG4vKiAxICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KVsnZGVmYXVsdCddO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdGV4cG9ydHMuSGFuZGxlYmFyc0Vudmlyb25tZW50ID0gSGFuZGxlYmFyc0Vudmlyb25tZW50O1xuXHRleHBvcnRzLmNyZWF0ZUZyYW1lID0gY3JlYXRlRnJhbWU7XG5cblx0dmFyIF9pbXBvcnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpO1xuXG5cdHZhciBVdGlscyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG5cdHZhciBfRXhjZXB0aW9uID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHR2YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxuXHR2YXIgVkVSU0lPTiA9ICczLjAuMSc7XG5cdGV4cG9ydHMuVkVSU0lPTiA9IFZFUlNJT047XG5cdHZhciBDT01QSUxFUl9SRVZJU0lPTiA9IDY7XG5cblx0ZXhwb3J0cy5DT01QSUxFUl9SRVZJU0lPTiA9IENPTVBJTEVSX1JFVklTSU9OO1xuXHR2YXIgUkVWSVNJT05fQ0hBTkdFUyA9IHtcblx0ICAxOiAnPD0gMS4wLnJjLjInLCAvLyAxLjAucmMuMiBpcyBhY3R1YWxseSByZXYyIGJ1dCBkb2Vzbid0IHJlcG9ydCBpdFxuXHQgIDI6ICc9PSAxLjAuMC1yYy4zJyxcblx0ICAzOiAnPT0gMS4wLjAtcmMuNCcsXG5cdCAgNDogJz09IDEueC54Jyxcblx0ICA1OiAnPT0gMi4wLjAtYWxwaGEueCcsXG5cdCAgNjogJz49IDIuMC4wLWJldGEuMSdcblx0fTtcblxuXHRleHBvcnRzLlJFVklTSU9OX0NIQU5HRVMgPSBSRVZJU0lPTl9DSEFOR0VTO1xuXHR2YXIgaXNBcnJheSA9IFV0aWxzLmlzQXJyYXksXG5cdCAgICBpc0Z1bmN0aW9uID0gVXRpbHMuaXNGdW5jdGlvbixcblx0ICAgIHRvU3RyaW5nID0gVXRpbHMudG9TdHJpbmcsXG5cdCAgICBvYmplY3RUeXBlID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cblx0ZnVuY3Rpb24gSGFuZGxlYmFyc0Vudmlyb25tZW50KGhlbHBlcnMsIHBhcnRpYWxzKSB7XG5cdCAgdGhpcy5oZWxwZXJzID0gaGVscGVycyB8fCB7fTtcblx0ICB0aGlzLnBhcnRpYWxzID0gcGFydGlhbHMgfHwge307XG5cblx0ICByZWdpc3RlckRlZmF1bHRIZWxwZXJzKHRoaXMpO1xuXHR9XG5cblx0SGFuZGxlYmFyc0Vudmlyb25tZW50LnByb3RvdHlwZSA9IHtcblx0ICBjb25zdHJ1Y3RvcjogSGFuZGxlYmFyc0Vudmlyb25tZW50LFxuXG5cdCAgbG9nZ2VyOiBsb2dnZXIsXG5cdCAgbG9nOiBsb2csXG5cblx0ICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24gcmVnaXN0ZXJIZWxwZXIobmFtZSwgZm4pIHtcblx0ICAgIGlmICh0b1N0cmluZy5jYWxsKG5hbWUpID09PSBvYmplY3RUeXBlKSB7XG5cdCAgICAgIGlmIChmbikge1xuXHQgICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdBcmcgbm90IHN1cHBvcnRlZCB3aXRoIG11bHRpcGxlIGhlbHBlcnMnKTtcblx0ICAgICAgfVxuXHQgICAgICBVdGlscy5leHRlbmQodGhpcy5oZWxwZXJzLCBuYW1lKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHRoaXMuaGVscGVyc1tuYW1lXSA9IGZuO1xuXHQgICAgfVxuXHQgIH0sXG5cdCAgdW5yZWdpc3RlckhlbHBlcjogZnVuY3Rpb24gdW5yZWdpc3RlckhlbHBlcihuYW1lKSB7XG5cdCAgICBkZWxldGUgdGhpcy5oZWxwZXJzW25hbWVdO1xuXHQgIH0sXG5cblx0ICByZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uIHJlZ2lzdGVyUGFydGlhbChuYW1lLCBwYXJ0aWFsKSB7XG5cdCAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuXHQgICAgICBVdGlscy5leHRlbmQodGhpcy5wYXJ0aWFscywgbmFtZSk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBpZiAodHlwZW9mIHBhcnRpYWwgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ0F0dGVtcHRpbmcgdG8gcmVnaXN0ZXIgYSBwYXJ0aWFsIGFzIHVuZGVmaW5lZCcpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMucGFydGlhbHNbbmFtZV0gPSBwYXJ0aWFsO1xuXHQgICAgfVxuXHQgIH0sXG5cdCAgdW5yZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uIHVucmVnaXN0ZXJQYXJ0aWFsKG5hbWUpIHtcblx0ICAgIGRlbGV0ZSB0aGlzLnBhcnRpYWxzW25hbWVdO1xuXHQgIH1cblx0fTtcblxuXHRmdW5jdGlvbiByZWdpc3RlckRlZmF1bHRIZWxwZXJzKGluc3RhbmNlKSB7XG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgICAvLyBBIG1pc3NpbmcgZmllbGQgaW4gYSB7e2Zvb319IGNvbnN0dWN0LlxuXHQgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgLy8gU29tZW9uZSBpcyBhY3R1YWxseSB0cnlpbmcgdG8gY2FsbCBzb21ldGhpbmcsIGJsb3cgdXAuXG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdNaXNzaW5nIGhlbHBlcjogXCInICsgYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAxXS5uYW1lICsgJ1wiJyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignYmxvY2tIZWxwZXJNaXNzaW5nJywgZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICAgIHZhciBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlLFxuXHQgICAgICAgIGZuID0gb3B0aW9ucy5mbjtcblxuXHQgICAgaWYgKGNvbnRleHQgPT09IHRydWUpIHtcblx0ICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuXHQgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcblx0ICAgICAgcmV0dXJuIGludmVyc2UodGhpcyk7XG5cdCAgICB9IGVsc2UgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcblx0ICAgICAgaWYgKGNvbnRleHQubGVuZ3RoID4gMCkge1xuXHQgICAgICAgIGlmIChvcHRpb25zLmlkcykge1xuXHQgICAgICAgICAgb3B0aW9ucy5pZHMgPSBbb3B0aW9ucy5uYW1lXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gaW5zdGFuY2UuaGVscGVycy5lYWNoKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuXHQgICAgICB9XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG5cdCAgICAgICAgdmFyIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuXHQgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMubmFtZSk7XG5cdCAgICAgICAgb3B0aW9ucyA9IHsgZGF0YTogZGF0YSB9O1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuXHQgICAgaWYgKCFvcHRpb25zKSB7XG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdNdXN0IHBhc3MgaXRlcmF0b3IgdG8gI2VhY2gnKTtcblx0ICAgIH1cblxuXHQgICAgdmFyIGZuID0gb3B0aW9ucy5mbixcblx0ICAgICAgICBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlLFxuXHQgICAgICAgIGkgPSAwLFxuXHQgICAgICAgIHJldCA9ICcnLFxuXHQgICAgICAgIGRhdGEgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgY29udGV4dFBhdGggPSB1bmRlZmluZWQ7XG5cblx0ICAgIGlmIChvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5pZHMpIHtcblx0ICAgICAgY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMuaWRzWzBdKSArICcuJztcblx0ICAgIH1cblxuXHQgICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHtcblx0ICAgICAgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTtcblx0ICAgIH1cblxuXHQgICAgaWYgKG9wdGlvbnMuZGF0YSkge1xuXHQgICAgICBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gZXhlY0l0ZXJhdGlvbihmaWVsZCwgaW5kZXgsIGxhc3QpIHtcblx0ICAgICAgaWYgKGRhdGEpIHtcblx0ICAgICAgICBkYXRhLmtleSA9IGZpZWxkO1xuXHQgICAgICAgIGRhdGEuaW5kZXggPSBpbmRleDtcblx0ICAgICAgICBkYXRhLmZpcnN0ID0gaW5kZXggPT09IDA7XG5cdCAgICAgICAgZGF0YS5sYXN0ID0gISFsYXN0O1xuXG5cdCAgICAgICAgaWYgKGNvbnRleHRQYXRoKSB7XG5cdCAgICAgICAgICBkYXRhLmNvbnRleHRQYXRoID0gY29udGV4dFBhdGggKyBmaWVsZDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICByZXQgPSByZXQgKyBmbihjb250ZXh0W2ZpZWxkXSwge1xuXHQgICAgICAgIGRhdGE6IGRhdGEsXG5cdCAgICAgICAgYmxvY2tQYXJhbXM6IFV0aWxzLmJsb2NrUGFyYW1zKFtjb250ZXh0W2ZpZWxkXSwgZmllbGRdLCBbY29udGV4dFBhdGggKyBmaWVsZCwgbnVsbF0pXG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBpZiAoY29udGV4dCAmJiB0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcpIHtcblx0ICAgICAgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcblx0ICAgICAgICBmb3IgKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0ICAgICAgICAgIGV4ZWNJdGVyYXRpb24oaSwgaSwgaSA9PT0gY29udGV4dC5sZW5ndGggLSAxKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdmFyIHByaW9yS2V5ID0gdW5kZWZpbmVkO1xuXG5cdCAgICAgICAgZm9yICh2YXIga2V5IGluIGNvbnRleHQpIHtcblx0ICAgICAgICAgIGlmIChjb250ZXh0Lmhhc093blByb3BlcnR5KGtleSkpIHtcblx0ICAgICAgICAgICAgLy8gV2UncmUgcnVubmluZyB0aGUgaXRlcmF0aW9ucyBvbmUgc3RlcCBvdXQgb2Ygc3luYyBzbyB3ZSBjYW4gZGV0ZWN0XG5cdCAgICAgICAgICAgIC8vIHRoZSBsYXN0IGl0ZXJhdGlvbiB3aXRob3V0IGhhdmUgdG8gc2NhbiB0aGUgb2JqZWN0IHR3aWNlIGFuZCBjcmVhdGVcblx0ICAgICAgICAgICAgLy8gYW4gaXRlcm1lZGlhdGUga2V5cyBhcnJheS5cblx0ICAgICAgICAgICAgaWYgKHByaW9yS2V5KSB7XG5cdCAgICAgICAgICAgICAgZXhlY0l0ZXJhdGlvbihwcmlvcktleSwgaSAtIDEpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHByaW9yS2V5ID0ga2V5O1xuXHQgICAgICAgICAgICBpKys7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGlmIChwcmlvcktleSkge1xuXHQgICAgICAgICAgZXhlY0l0ZXJhdGlvbihwcmlvcktleSwgaSAtIDEsIHRydWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBpZiAoaSA9PT0gMCkge1xuXHQgICAgICByZXQgPSBpbnZlcnNlKHRoaXMpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gcmV0O1xuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2lmJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG5cdCAgICBpZiAoaXNGdW5jdGlvbihjb25kaXRpb25hbCkpIHtcblx0ICAgICAgY29uZGl0aW9uYWwgPSBjb25kaXRpb25hbC5jYWxsKHRoaXMpO1xuXHQgICAgfVxuXG5cdCAgICAvLyBEZWZhdWx0IGJlaGF2aW9yIGlzIHRvIHJlbmRlciB0aGUgcG9zaXRpdmUgcGF0aCBpZiB0aGUgdmFsdWUgaXMgdHJ1dGh5IGFuZCBub3QgZW1wdHkuXG5cdCAgICAvLyBUaGUgYGluY2x1ZGVaZXJvYCBvcHRpb24gbWF5IGJlIHNldCB0byB0cmVhdCB0aGUgY29uZHRpb25hbCBhcyBwdXJlbHkgbm90IGVtcHR5IGJhc2VkIG9uIHRoZVxuXHQgICAgLy8gYmVoYXZpb3Igb2YgaXNFbXB0eS4gRWZmZWN0aXZlbHkgdGhpcyBkZXRlcm1pbmVzIGlmIDAgaXMgaGFuZGxlZCBieSB0aGUgcG9zaXRpdmUgcGF0aCBvciBuZWdhdGl2ZS5cblx0ICAgIGlmICghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCB8fCBVdGlscy5pc0VtcHR5KGNvbmRpdGlvbmFsKSkge1xuXHQgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcigndW5sZXNzJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG5cdCAgICByZXR1cm4gaW5zdGFuY2UuaGVscGVyc1snaWYnXS5jYWxsKHRoaXMsIGNvbmRpdGlvbmFsLCB7IGZuOiBvcHRpb25zLmludmVyc2UsIGludmVyc2U6IG9wdGlvbnMuZm4sIGhhc2g6IG9wdGlvbnMuaGFzaCB9KTtcblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCd3aXRoJywgZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7XG5cdCAgICAgIGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7XG5cdCAgICB9XG5cblx0ICAgIHZhciBmbiA9IG9wdGlvbnMuZm47XG5cblx0ICAgIGlmICghVXRpbHMuaXNFbXB0eShjb250ZXh0KSkge1xuXHQgICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG5cdCAgICAgICAgdmFyIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuXHQgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMuaWRzWzBdKTtcblx0ICAgICAgICBvcHRpb25zID0geyBkYXRhOiBkYXRhIH07XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvZycsIGZ1bmN0aW9uIChtZXNzYWdlLCBvcHRpb25zKSB7XG5cdCAgICB2YXIgbGV2ZWwgPSBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5kYXRhLmxldmVsICE9IG51bGwgPyBwYXJzZUludChvcHRpb25zLmRhdGEubGV2ZWwsIDEwKSA6IDE7XG5cdCAgICBpbnN0YW5jZS5sb2cobGV2ZWwsIG1lc3NhZ2UpO1xuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvb2t1cCcsIGZ1bmN0aW9uIChvYmosIGZpZWxkKSB7XG5cdCAgICByZXR1cm4gb2JqICYmIG9ialtmaWVsZF07XG5cdCAgfSk7XG5cdH1cblxuXHR2YXIgbG9nZ2VyID0ge1xuXHQgIG1ldGhvZE1hcDogeyAwOiAnZGVidWcnLCAxOiAnaW5mbycsIDI6ICd3YXJuJywgMzogJ2Vycm9yJyB9LFxuXG5cdCAgLy8gU3RhdGUgZW51bVxuXHQgIERFQlVHOiAwLFxuXHQgIElORk86IDEsXG5cdCAgV0FSTjogMixcblx0ICBFUlJPUjogMyxcblx0ICBsZXZlbDogMSxcblxuXHQgIC8vIENhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG5cdCAgbG9nOiBmdW5jdGlvbiBsb2cobGV2ZWwsIG1lc3NhZ2UpIHtcblx0ICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbG9nZ2VyLmxldmVsIDw9IGxldmVsKSB7XG5cdCAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcblx0ICAgICAgKGNvbnNvbGVbbWV0aG9kXSB8fCBjb25zb2xlLmxvZykuY2FsbChjb25zb2xlLCBtZXNzYWdlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG5cdCAgICB9XG5cdCAgfVxuXHR9O1xuXG5cdGV4cG9ydHMubG9nZ2VyID0gbG9nZ2VyO1xuXHR2YXIgbG9nID0gbG9nZ2VyLmxvZztcblxuXHRleHBvcnRzLmxvZyA9IGxvZztcblxuXHRmdW5jdGlvbiBjcmVhdGVGcmFtZShvYmplY3QpIHtcblx0ICB2YXIgZnJhbWUgPSBVdGlscy5leHRlbmQoe30sIG9iamVjdCk7XG5cdCAgZnJhbWUuX3BhcmVudCA9IG9iamVjdDtcblx0ICByZXR1cm4gZnJhbWU7XG5cdH1cblxuXHQvKiBbYXJncywgXW9wdGlvbnMgKi9cblxuLyoqKi8gfSxcbi8qIDIgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHQvLyBCdWlsZCBvdXQgb3VyIGJhc2ljIFNhZmVTdHJpbmcgdHlwZVxuXHRmdW5jdGlvbiBTYWZlU3RyaW5nKHN0cmluZykge1xuXHQgIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xuXHR9XG5cblx0U2FmZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBTYWZlU3RyaW5nLnByb3RvdHlwZS50b0hUTUwgPSBmdW5jdGlvbiAoKSB7XG5cdCAgcmV0dXJuICcnICsgdGhpcy5zdHJpbmc7XG5cdH07XG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gU2FmZVN0cmluZztcblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8qKiovIH0sXG4vKiAzICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXHR2YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cblx0ZnVuY3Rpb24gRXhjZXB0aW9uKG1lc3NhZ2UsIG5vZGUpIHtcblx0ICB2YXIgbG9jID0gbm9kZSAmJiBub2RlLmxvYyxcblx0ICAgICAgbGluZSA9IHVuZGVmaW5lZCxcblx0ICAgICAgY29sdW1uID0gdW5kZWZpbmVkO1xuXHQgIGlmIChsb2MpIHtcblx0ICAgIGxpbmUgPSBsb2Muc3RhcnQubGluZTtcblx0ICAgIGNvbHVtbiA9IGxvYy5zdGFydC5jb2x1bW47XG5cblx0ICAgIG1lc3NhZ2UgKz0gJyAtICcgKyBsaW5lICsgJzonICsgY29sdW1uO1xuXHQgIH1cblxuXHQgIHZhciB0bXAgPSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuXHQgIC8vIFVuZm9ydHVuYXRlbHkgZXJyb3JzIGFyZSBub3QgZW51bWVyYWJsZSBpbiBDaHJvbWUgKGF0IGxlYXN0KSwgc28gYGZvciBwcm9wIGluIHRtcGAgZG9lc24ndCB3b3JrLlxuXHQgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGVycm9yUHJvcHMubGVuZ3RoOyBpZHgrKykge1xuXHQgICAgdGhpc1tlcnJvclByb3BzW2lkeF1dID0gdG1wW2Vycm9yUHJvcHNbaWR4XV07XG5cdCAgfVxuXG5cdCAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdCAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBFeGNlcHRpb24pO1xuXHQgIH1cblxuXHQgIGlmIChsb2MpIHtcblx0ICAgIHRoaXMubGluZU51bWJlciA9IGxpbmU7XG5cdCAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcblx0ICB9XG5cdH1cblxuXHRFeGNlcHRpb24ucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gRXhjZXB0aW9uO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDQgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHRleHBvcnRzLmV4dGVuZCA9IGV4dGVuZDtcblxuXHQvLyBPbGRlciBJRSB2ZXJzaW9ucyBkbyBub3QgZGlyZWN0bHkgc3VwcG9ydCBpbmRleE9mIHNvIHdlIG11c3QgaW1wbGVtZW50IG91ciBvd24sIHNhZGx5LlxuXHRleHBvcnRzLmluZGV4T2YgPSBpbmRleE9mO1xuXHRleHBvcnRzLmVzY2FwZUV4cHJlc3Npb24gPSBlc2NhcGVFeHByZXNzaW9uO1xuXHRleHBvcnRzLmlzRW1wdHkgPSBpc0VtcHR5O1xuXHRleHBvcnRzLmJsb2NrUGFyYW1zID0gYmxvY2tQYXJhbXM7XG5cdGV4cG9ydHMuYXBwZW5kQ29udGV4dFBhdGggPSBhcHBlbmRDb250ZXh0UGF0aDtcblx0dmFyIGVzY2FwZSA9IHtcblx0ICAnJic6ICcmYW1wOycsXG5cdCAgJzwnOiAnJmx0OycsXG5cdCAgJz4nOiAnJmd0OycsXG5cdCAgJ1wiJzogJyZxdW90OycsXG5cdCAgJ1xcJyc6ICcmI3gyNzsnLFxuXHQgICdgJzogJyYjeDYwOydcblx0fTtcblxuXHR2YXIgYmFkQ2hhcnMgPSAvWyY8PlwiJ2BdL2csXG5cdCAgICBwb3NzaWJsZSA9IC9bJjw+XCInYF0vO1xuXG5cdGZ1bmN0aW9uIGVzY2FwZUNoYXIoY2hyKSB7XG5cdCAgcmV0dXJuIGVzY2FwZVtjaHJdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiAvKiAsIC4uLnNvdXJjZSAqLykge1xuXHQgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBmb3IgKHZhciBrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG5cdCAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXJndW1lbnRzW2ldLCBrZXkpKSB7XG5cdCAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1cblxuXHQgIHJldHVybiBvYmo7XG5cdH1cblxuXHR2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cdGV4cG9ydHMudG9TdHJpbmcgPSB0b1N0cmluZztcblx0Ly8gU291cmNlZCBmcm9tIGxvZGFzaFxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vYmVzdGllanMvbG9kYXNoL2Jsb2IvbWFzdGVyL0xJQ0VOU0UudHh0XG5cdC8qZXNsaW50LWRpc2FibGUgZnVuYy1zdHlsZSwgbm8tdmFyICovXG5cdHZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuXHQgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG5cdH07XG5cdC8vIGZhbGxiYWNrIGZvciBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaVxuXHQvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXHRpZiAoaXNGdW5jdGlvbigveC8pKSB7XG5cdCAgZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0ICB9O1xuXHR9XG5cdHZhciBpc0Z1bmN0aW9uO1xuXHRleHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXHQvKmVzbGludC1lbmFibGUgZnVuYy1zdHlsZSwgbm8tdmFyICovXG5cblx0LyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblx0dmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcblx0fTtleHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5cdGZ1bmN0aW9uIGluZGV4T2YoYXJyYXksIHZhbHVlKSB7XG5cdCAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdCAgICBpZiAoYXJyYXlbaV0gPT09IHZhbHVlKSB7XG5cdCAgICAgIHJldHVybiBpO1xuXHQgICAgfVxuXHQgIH1cblx0ICByZXR1cm4gLTE7XG5cdH1cblxuXHRmdW5jdGlvbiBlc2NhcGVFeHByZXNzaW9uKHN0cmluZykge1xuXHQgIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuXHQgICAgLy8gZG9uJ3QgZXNjYXBlIFNhZmVTdHJpbmdzLCBzaW5jZSB0aGV5J3JlIGFscmVhZHkgc2FmZVxuXHQgICAgaWYgKHN0cmluZyAmJiBzdHJpbmcudG9IVE1MKSB7XG5cdCAgICAgIHJldHVybiBzdHJpbmcudG9IVE1MKCk7XG5cdCAgICB9IGVsc2UgaWYgKHN0cmluZyA9PSBudWxsKSB7XG5cdCAgICAgIHJldHVybiAnJztcblx0ICAgIH0gZWxzZSBpZiAoIXN0cmluZykge1xuXHQgICAgICByZXR1cm4gc3RyaW5nICsgJyc7XG5cdCAgICB9XG5cblx0ICAgIC8vIEZvcmNlIGEgc3RyaW5nIGNvbnZlcnNpb24gYXMgdGhpcyB3aWxsIGJlIGRvbmUgYnkgdGhlIGFwcGVuZCByZWdhcmRsZXNzIGFuZFxuXHQgICAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG5cdCAgICAvLyBhbiBvYmplY3QncyB0byBzdHJpbmcgaGFzIGVzY2FwZWQgY2hhcmFjdGVycyBpbiBpdC5cblx0ICAgIHN0cmluZyA9ICcnICsgc3RyaW5nO1xuXHQgIH1cblxuXHQgIGlmICghcG9zc2libGUudGVzdChzdHJpbmcpKSB7XG5cdCAgICByZXR1cm4gc3RyaW5nO1xuXHQgIH1cblx0ICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoYmFkQ2hhcnMsIGVzY2FwZUNoYXIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuXHQgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHtcblx0ICAgIHJldHVybiB0cnVlO1xuXHQgIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG5cdCAgICByZXR1cm4gdHJ1ZTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGJsb2NrUGFyYW1zKHBhcmFtcywgaWRzKSB7XG5cdCAgcGFyYW1zLnBhdGggPSBpZHM7XG5cdCAgcmV0dXJuIHBhcmFtcztcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZENvbnRleHRQYXRoKGNvbnRleHRQYXRoLCBpZCkge1xuXHQgIHJldHVybiAoY29udGV4dFBhdGggPyBjb250ZXh0UGF0aCArICcuJyA6ICcnKSArIGlkO1xuXHR9XG5cbi8qKiovIH0sXG4vKiA1ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KVsnZGVmYXVsdCddO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdGV4cG9ydHMuY2hlY2tSZXZpc2lvbiA9IGNoZWNrUmV2aXNpb247XG5cblx0Ly8gVE9ETzogUmVtb3ZlIHRoaXMgbGluZSBhbmQgYnJlYWsgdXAgY29tcGlsZVBhcnRpYWxcblxuXHRleHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5cdGV4cG9ydHMud3JhcFByb2dyYW0gPSB3cmFwUHJvZ3JhbTtcblx0ZXhwb3J0cy5yZXNvbHZlUGFydGlhbCA9IHJlc29sdmVQYXJ0aWFsO1xuXHRleHBvcnRzLmludm9rZVBhcnRpYWwgPSBpbnZva2VQYXJ0aWFsO1xuXHRleHBvcnRzLm5vb3AgPSBub29wO1xuXG5cdHZhciBfaW1wb3J0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyg0KTtcblxuXHR2YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxuXHR2YXIgX0V4Y2VwdGlvbiA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0dmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cblx0dmFyIF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxuXHRmdW5jdGlvbiBjaGVja1JldmlzaW9uKGNvbXBpbGVySW5mbykge1xuXHQgIHZhciBjb21waWxlclJldmlzaW9uID0gY29tcGlsZXJJbmZvICYmIGNvbXBpbGVySW5mb1swXSB8fCAxLFxuXHQgICAgICBjdXJyZW50UmV2aXNpb24gPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5DT01QSUxFUl9SRVZJU0lPTjtcblxuXHQgIGlmIChjb21waWxlclJldmlzaW9uICE9PSBjdXJyZW50UmV2aXNpb24pIHtcblx0ICAgIGlmIChjb21waWxlclJldmlzaW9uIDwgY3VycmVudFJldmlzaW9uKSB7XG5cdCAgICAgIHZhciBydW50aW1lVmVyc2lvbnMgPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5SRVZJU0lPTl9DSEFOR0VTW2N1cnJlbnRSZXZpc2lvbl0sXG5cdCAgICAgICAgICBjb21waWxlclZlcnNpb25zID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuUkVWSVNJT05fQ0hBTkdFU1tjb21waWxlclJldmlzaW9uXTtcblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGFuIG9sZGVyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuICcgKyAnUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIHJ1bnRpbWVWZXJzaW9ucyArICcpIG9yIGRvd25ncmFkZSB5b3VyIHJ1bnRpbWUgdG8gYW4gb2xkZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVyVmVyc2lvbnMgKyAnKS4nKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIC8vIFVzZSB0aGUgZW1iZWRkZWQgdmVyc2lvbiBpbmZvIHNpbmNlIHRoZSBydW50aW1lIGRvZXNuJ3Qga25vdyBhYm91dCB0aGlzIHJldmlzaW9uIHlldFxuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiAnICsgJ1BsZWFzZSB1cGRhdGUgeW91ciBydW50aW1lIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVySW5mb1sxXSArICcpLicpO1xuXHQgICAgfVxuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRlbXBsYXRlKHRlbXBsYXRlU3BlYywgZW52KSB7XG5cdCAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblx0ICBpZiAoIWVudikge1xuXHQgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ05vIGVudmlyb25tZW50IHBhc3NlZCB0byB0ZW1wbGF0ZScpO1xuXHQgIH1cblx0ICBpZiAoIXRlbXBsYXRlU3BlYyB8fCAhdGVtcGxhdGVTcGVjLm1haW4pIHtcblx0ICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdVbmtub3duIHRlbXBsYXRlIG9iamVjdDogJyArIHR5cGVvZiB0ZW1wbGF0ZVNwZWMpO1xuXHQgIH1cblxuXHQgIC8vIE5vdGU6IFVzaW5nIGVudi5WTSByZWZlcmVuY2VzIHJhdGhlciB0aGFuIGxvY2FsIHZhciByZWZlcmVuY2VzIHRocm91Z2hvdXQgdGhpcyBzZWN0aW9uIHRvIGFsbG93XG5cdCAgLy8gZm9yIGV4dGVybmFsIHVzZXJzIHRvIG92ZXJyaWRlIHRoZXNlIGFzIHBzdWVkby1zdXBwb3J0ZWQgQVBJcy5cblx0ICBlbnYuVk0uY2hlY2tSZXZpc2lvbih0ZW1wbGF0ZVNwZWMuY29tcGlsZXIpO1xuXG5cdCAgZnVuY3Rpb24gaW52b2tlUGFydGlhbFdyYXBwZXIocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuXHQgICAgaWYgKG9wdGlvbnMuaGFzaCkge1xuXHQgICAgICBjb250ZXh0ID0gVXRpbHMuZXh0ZW5kKHt9LCBjb250ZXh0LCBvcHRpb25zLmhhc2gpO1xuXHQgICAgfVxuXG5cdCAgICBwYXJ0aWFsID0gZW52LlZNLnJlc29sdmVQYXJ0aWFsLmNhbGwodGhpcywgcGFydGlhbCwgY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgICB2YXIgcmVzdWx0ID0gZW52LlZNLmludm9rZVBhcnRpYWwuY2FsbCh0aGlzLCBwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKTtcblxuXHQgICAgaWYgKHJlc3VsdCA9PSBudWxsICYmIGVudi5jb21waWxlKSB7XG5cdCAgICAgIG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXSA9IGVudi5jb21waWxlKHBhcnRpYWwsIHRlbXBsYXRlU3BlYy5jb21waWxlck9wdGlvbnMsIGVudik7XG5cdCAgICAgIHJlc3VsdCA9IG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXShjb250ZXh0LCBvcHRpb25zKTtcblx0ICAgIH1cblx0ICAgIGlmIChyZXN1bHQgIT0gbnVsbCkge1xuXHQgICAgICBpZiAob3B0aW9ucy5pbmRlbnQpIHtcblx0ICAgICAgICB2YXIgbGluZXMgPSByZXN1bHQuc3BsaXQoJ1xcbicpO1xuXHQgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGluZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdCAgICAgICAgICBpZiAoIWxpbmVzW2ldICYmIGkgKyAxID09PSBsKSB7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBsaW5lc1tpXSA9IG9wdGlvbnMuaW5kZW50ICsgbGluZXNbaV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJlc3VsdCA9IGxpbmVzLmpvaW4oJ1xcbicpO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGhlIHBhcnRpYWwgJyArIG9wdGlvbnMubmFtZSArICcgY291bGQgbm90IGJlIGNvbXBpbGVkIHdoZW4gcnVubmluZyBpbiBydW50aW1lLW9ubHkgbW9kZScpO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIC8vIEp1c3QgYWRkIHdhdGVyXG5cdCAgdmFyIGNvbnRhaW5lciA9IHtcblx0ICAgIHN0cmljdDogZnVuY3Rpb24gc3RyaWN0KG9iaiwgbmFtZSkge1xuXHQgICAgICBpZiAoIShuYW1lIGluIG9iaikpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnXCInICsgbmFtZSArICdcIiBub3QgZGVmaW5lZCBpbiAnICsgb2JqKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gb2JqW25hbWVdO1xuXHQgICAgfSxcblx0ICAgIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKGRlcHRocywgbmFtZSkge1xuXHQgICAgICB2YXIgbGVuID0gZGVwdGhzLmxlbmd0aDtcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHQgICAgICAgIGlmIChkZXB0aHNbaV0gJiYgZGVwdGhzW2ldW25hbWVdICE9IG51bGwpIHtcblx0ICAgICAgICAgIHJldHVybiBkZXB0aHNbaV1bbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9LFxuXHQgICAgbGFtYmRhOiBmdW5jdGlvbiBsYW1iZGEoY3VycmVudCwgY29udGV4dCkge1xuXHQgICAgICByZXR1cm4gdHlwZW9mIGN1cnJlbnQgPT09ICdmdW5jdGlvbicgPyBjdXJyZW50LmNhbGwoY29udGV4dCkgOiBjdXJyZW50O1xuXHQgICAgfSxcblxuXHQgICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcblx0ICAgIGludm9rZVBhcnRpYWw6IGludm9rZVBhcnRpYWxXcmFwcGVyLFxuXG5cdCAgICBmbjogZnVuY3Rpb24gZm4oaSkge1xuXHQgICAgICByZXR1cm4gdGVtcGxhdGVTcGVjW2ldO1xuXHQgICAgfSxcblxuXHQgICAgcHJvZ3JhbXM6IFtdLFxuXHQgICAgcHJvZ3JhbTogZnVuY3Rpb24gcHJvZ3JhbShpLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG5cdCAgICAgIHZhciBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0sXG5cdCAgICAgICAgICBmbiA9IHRoaXMuZm4oaSk7XG5cdCAgICAgIGlmIChkYXRhIHx8IGRlcHRocyB8fCBibG9ja1BhcmFtcyB8fCBkZWNsYXJlZEJsb2NrUGFyYW1zKSB7XG5cdCAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB3cmFwUHJvZ3JhbSh0aGlzLCBpLCBmbiwgZGF0YSwgZGVjbGFyZWRCbG9ja1BhcmFtcywgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG5cdCAgICAgIH0gZWxzZSBpZiAoIXByb2dyYW1XcmFwcGVyKSB7XG5cdCAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4pO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBwcm9ncmFtV3JhcHBlcjtcblx0ICAgIH0sXG5cblx0ICAgIGRhdGE6IGZ1bmN0aW9uIGRhdGEodmFsdWUsIGRlcHRoKSB7XG5cdCAgICAgIHdoaWxlICh2YWx1ZSAmJiBkZXB0aC0tKSB7XG5cdCAgICAgICAgdmFsdWUgPSB2YWx1ZS5fcGFyZW50O1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiB2YWx1ZTtcblx0ICAgIH0sXG5cdCAgICBtZXJnZTogZnVuY3Rpb24gbWVyZ2UocGFyYW0sIGNvbW1vbikge1xuXHQgICAgICB2YXIgb2JqID0gcGFyYW0gfHwgY29tbW9uO1xuXG5cdCAgICAgIGlmIChwYXJhbSAmJiBjb21tb24gJiYgcGFyYW0gIT09IGNvbW1vbikge1xuXHQgICAgICAgIG9iaiA9IFV0aWxzLmV4dGVuZCh7fSwgY29tbW9uLCBwYXJhbSk7XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gb2JqO1xuXHQgICAgfSxcblxuXHQgICAgbm9vcDogZW52LlZNLm5vb3AsXG5cdCAgICBjb21waWxlckluZm86IHRlbXBsYXRlU3BlYy5jb21waWxlclxuXHQgIH07XG5cblx0ICBmdW5jdGlvbiByZXQoY29udGV4dCkge1xuXHQgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG5cdCAgICB2YXIgZGF0YSA9IG9wdGlvbnMuZGF0YTtcblxuXHQgICAgcmV0Ll9zZXR1cChvcHRpb25zKTtcblx0ICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsICYmIHRlbXBsYXRlU3BlYy51c2VEYXRhKSB7XG5cdCAgICAgIGRhdGEgPSBpbml0RGF0YShjb250ZXh0LCBkYXRhKTtcblx0ICAgIH1cblx0ICAgIHZhciBkZXB0aHMgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgYmxvY2tQYXJhbXMgPSB0ZW1wbGF0ZVNwZWMudXNlQmxvY2tQYXJhbXMgPyBbXSA6IHVuZGVmaW5lZDtcblx0ICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlRGVwdGhzKSB7XG5cdCAgICAgIGRlcHRocyA9IG9wdGlvbnMuZGVwdGhzID8gW2NvbnRleHRdLmNvbmNhdChvcHRpb25zLmRlcHRocykgOiBbY29udGV4dF07XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiB0ZW1wbGF0ZVNwZWMubWFpbi5jYWxsKGNvbnRhaW5lciwgY29udGV4dCwgY29udGFpbmVyLmhlbHBlcnMsIGNvbnRhaW5lci5wYXJ0aWFscywgZGF0YSwgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG5cdCAgfVxuXHQgIHJldC5pc1RvcCA9IHRydWU7XG5cblx0ICByZXQuX3NldHVwID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0ICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG5cdCAgICAgIGNvbnRhaW5lci5oZWxwZXJzID0gY29udGFpbmVyLm1lcmdlKG9wdGlvbnMuaGVscGVycywgZW52LmhlbHBlcnMpO1xuXG5cdCAgICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlUGFydGlhbCkge1xuXHQgICAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLnBhcnRpYWxzLCBlbnYucGFydGlhbHMpO1xuXHQgICAgICB9XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBjb250YWluZXIuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycztcblx0ICAgICAgY29udGFpbmVyLnBhcnRpYWxzID0gb3B0aW9ucy5wYXJ0aWFscztcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgcmV0Ll9jaGlsZCA9IGZ1bmN0aW9uIChpLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG5cdCAgICBpZiAodGVtcGxhdGVTcGVjLnVzZUJsb2NrUGFyYW1zICYmICFibG9ja1BhcmFtcykge1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIGJsb2NrIHBhcmFtcycpO1xuXHQgICAgfVxuXHQgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VEZXB0aHMgJiYgIWRlcHRocykge1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIHBhcmVudCBkZXB0aHMnKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHdyYXBQcm9ncmFtKGNvbnRhaW5lciwgaSwgdGVtcGxhdGVTcGVjW2ldLCBkYXRhLCAwLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcblx0ICB9O1xuXHQgIHJldHVybiByZXQ7XG5cdH1cblxuXHRmdW5jdGlvbiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIGZuLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG5cdCAgZnVuY3Rpb24gcHJvZyhjb250ZXh0KSB7XG5cdCAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMV07XG5cblx0ICAgIHJldHVybiBmbi5jYWxsKGNvbnRhaW5lciwgY29udGV4dCwgY29udGFpbmVyLmhlbHBlcnMsIGNvbnRhaW5lci5wYXJ0aWFscywgb3B0aW9ucy5kYXRhIHx8IGRhdGEsIGJsb2NrUGFyYW1zICYmIFtvcHRpb25zLmJsb2NrUGFyYW1zXS5jb25jYXQoYmxvY2tQYXJhbXMpLCBkZXB0aHMgJiYgW2NvbnRleHRdLmNvbmNhdChkZXB0aHMpKTtcblx0ICB9XG5cdCAgcHJvZy5wcm9ncmFtID0gaTtcblx0ICBwcm9nLmRlcHRoID0gZGVwdGhzID8gZGVwdGhzLmxlbmd0aCA6IDA7XG5cdCAgcHJvZy5ibG9ja1BhcmFtcyA9IGRlY2xhcmVkQmxvY2tQYXJhbXMgfHwgMDtcblx0ICByZXR1cm4gcHJvZztcblx0fVxuXG5cdGZ1bmN0aW9uIHJlc29sdmVQYXJ0aWFsKHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICBpZiAoIXBhcnRpYWwpIHtcblx0ICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV07XG5cdCAgfSBlbHNlIGlmICghcGFydGlhbC5jYWxsICYmICFvcHRpb25zLm5hbWUpIHtcblx0ICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljIHBhcnRpYWwgdGhhdCByZXR1cm5lZCBhIHN0cmluZ1xuXHQgICAgb3B0aW9ucy5uYW1lID0gcGFydGlhbDtcblx0ICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW3BhcnRpYWxdO1xuXHQgIH1cblx0ICByZXR1cm4gcGFydGlhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIGludm9rZVBhcnRpYWwocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuXHQgIG9wdGlvbnMucGFydGlhbCA9IHRydWU7XG5cblx0ICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGhlIHBhcnRpYWwgJyArIG9wdGlvbnMubmFtZSArICcgY291bGQgbm90IGJlIGZvdW5kJyk7XG5cdCAgfSBlbHNlIGlmIChwYXJ0aWFsIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcblx0ICAgIHJldHVybiBwYXJ0aWFsKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIG5vb3AoKSB7XG5cdCAgcmV0dXJuICcnO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdERhdGEoY29udGV4dCwgZGF0YSkge1xuXHQgIGlmICghZGF0YSB8fCAhKCdyb290JyBpbiBkYXRhKSkge1xuXHQgICAgZGF0YSA9IGRhdGEgPyBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5jcmVhdGVGcmFtZShkYXRhKSA6IHt9O1xuXHQgICAgZGF0YS5yb290ID0gY29udGV4dDtcblx0ICB9XG5cdCAgcmV0dXJuIGRhdGE7XG5cdH1cblxuLyoqKi8gfSxcbi8qIDYgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihnbG9iYWwpIHsndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0LypnbG9iYWwgd2luZG93ICovXG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gZnVuY3Rpb24gKEhhbmRsZWJhcnMpIHtcblx0ICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXHQgIHZhciByb290ID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB3aW5kb3csXG5cdCAgICAgICRIYW5kbGViYXJzID0gcm9vdC5IYW5kbGViYXJzO1xuXHQgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5cdCAgSGFuZGxlYmFycy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuXHQgICAgaWYgKHJvb3QuSGFuZGxlYmFycyA9PT0gSGFuZGxlYmFycykge1xuXHQgICAgICByb290LkhhbmRsZWJhcnMgPSAkSGFuZGxlYmFycztcblx0ICAgIH1cblx0ICB9O1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSgpKSkpXG5cbi8qKiovIH0sXG4vKiA3ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRleHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDoge1xuXHQgICAgXCJkZWZhdWx0XCI6IG9ialxuXHQgIH07XG5cdH07XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuLyoqKi8gfVxuLyoqKioqKi8gXSlcbn0pO1xuOyIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIiAgLyogZ2xvYmFscyByZXF1aXJlLCBtb2R1bGUgKi9cblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gICAqL1xuXG4gIHZhciBwYXRodG9SZWdleHAgPSByZXF1aXJlKCdwYXRoLXRvLXJlZ2V4cCcpO1xuXG4gIC8qKlxuICAgKiBNb2R1bGUgZXhwb3J0cy5cbiAgICovXG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwYWdlO1xuXG4gIC8qKlxuICAgKiBEZXRlY3QgY2xpY2sgZXZlbnRcbiAgICovXG4gIHZhciBjbGlja0V2ZW50ID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgZG9jdW1lbnQpICYmIGRvY3VtZW50Lm9udG91Y2hzdGFydCA/ICd0b3VjaHN0YXJ0JyA6ICdjbGljayc7XG5cbiAgLyoqXG4gICAqIFRvIHdvcmsgcHJvcGVybHkgd2l0aCB0aGUgVVJMXG4gICAqIGhpc3RvcnkubG9jYXRpb24gZ2VuZXJhdGVkIHBvbHlmaWxsIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9kZXZvdGUvSFRNTDUtSGlzdG9yeS1BUElcbiAgICovXG5cbiAgdmFyIGxvY2F0aW9uID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygd2luZG93KSAmJiAod2luZG93Lmhpc3RvcnkubG9jYXRpb24gfHwgd2luZG93LmxvY2F0aW9uKTtcblxuICAvKipcbiAgICogUGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoLlxuICAgKi9cblxuICB2YXIgZGlzcGF0Y2ggPSB0cnVlO1xuXG5cbiAgLyoqXG4gICAqIERlY29kZSBVUkwgY29tcG9uZW50cyAocXVlcnkgc3RyaW5nLCBwYXRobmFtZSwgaGFzaCkuXG4gICAqIEFjY29tbW9kYXRlcyBib3RoIHJlZ3VsYXIgcGVyY2VudCBlbmNvZGluZyBhbmQgeC13d3ctZm9ybS11cmxlbmNvZGVkIGZvcm1hdC5cbiAgICovXG4gIHZhciBkZWNvZGVVUkxDb21wb25lbnRzID0gdHJ1ZTtcblxuICAvKipcbiAgICogQmFzZSBwYXRoLlxuICAgKi9cblxuICB2YXIgYmFzZSA9ICcnO1xuXG4gIC8qKlxuICAgKiBSdW5uaW5nIGZsYWcuXG4gICAqL1xuXG4gIHZhciBydW5uaW5nO1xuXG4gIC8qKlxuICAgKiBIYXNoQmFuZyBvcHRpb25cbiAgICovXG5cbiAgdmFyIGhhc2hiYW5nID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIGNvbnRleHQsIGZvciBjYXB0dXJpbmdcbiAgICogcGFnZSBleGl0IGV2ZW50cy5cbiAgICovXG5cbiAgdmFyIHByZXZDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBgcGF0aGAgd2l0aCBjYWxsYmFjayBgZm4oKWAsXG4gICAqIG9yIHJvdXRlIGBwYXRoYCwgb3IgcmVkaXJlY3Rpb24sXG4gICAqIG9yIGBwYWdlLnN0YXJ0KClgLlxuICAgKlxuICAgKiAgIHBhZ2UoZm4pO1xuICAgKiAgIHBhZ2UoJyonLCBmbik7XG4gICAqICAgcGFnZSgnL3VzZXIvOmlkJywgbG9hZCwgdXNlcik7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQsIHsgc29tZTogJ3RoaW5nJyB9KTtcbiAgICogICBwYWdlKCcvdXNlci8nICsgdXNlci5pZCk7XG4gICAqICAgcGFnZSgnL2Zyb20nLCAnL3RvJylcbiAgICogICBwYWdlKCk7XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBwYXRoXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuLi4uXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBhZ2UocGF0aCwgZm4pIHtcbiAgICAvLyA8Y2FsbGJhY2s+XG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICByZXR1cm4gcGFnZSgnKicsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIHJvdXRlIDxwYXRoPiB0byA8Y2FsbGJhY2sgLi4uPlxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm4pIHtcbiAgICAgIHZhciByb3V0ZSA9IG5ldyBSb3V0ZShwYXRoKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHBhZ2UuY2FsbGJhY2tzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICAgIH1cbiAgICAgIC8vIHNob3cgPHBhdGg+IHdpdGggW3N0YXRlXVxuICAgIH0gZWxzZSBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICBwYWdlWydzdHJpbmcnID09PSB0eXBlb2YgZm4gPyAncmVkaXJlY3QnIDogJ3Nob3cnXShwYXRoLCBmbik7XG4gICAgICAvLyBzdGFydCBbb3B0aW9uc11cbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZS5zdGFydChwYXRoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb25zLlxuICAgKi9cblxuICBwYWdlLmNhbGxiYWNrcyA9IFtdO1xuICBwYWdlLmV4aXRzID0gW107XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgcGF0aCBiZWluZyBwcm9jZXNzZWRcbiAgICogQHR5cGUge1N0cmluZ31cbiAgICovXG4gIHBhZ2UuY3VycmVudCA9ICcnO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGFnZXMgbmF2aWdhdGVkIHRvLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKlxuICAgKiAgICAgcGFnZS5sZW4gPT0gMDtcbiAgICogICAgIHBhZ2UoJy9sb2dpbicpO1xuICAgKiAgICAgcGFnZS5sZW4gPT0gMTtcbiAgICovXG5cbiAgcGFnZS5sZW4gPSAwO1xuXG4gIC8qKlxuICAgKiBHZXQgb3Igc2V0IGJhc2VwYXRoIHRvIGBwYXRoYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYXNlID0gZnVuY3Rpb24ocGF0aCkge1xuICAgIGlmICgwID09PSBhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gYmFzZTtcbiAgICBiYXNlID0gcGF0aDtcbiAgfTtcblxuICAvKipcbiAgICogQmluZCB3aXRoIHRoZSBnaXZlbiBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgIC0gYGNsaWNrYCBiaW5kIHRvIGNsaWNrIGV2ZW50cyBbdHJ1ZV1cbiAgICogICAgLSBgcG9wc3RhdGVgIGJpbmQgdG8gcG9wc3RhdGUgW3RydWVdXG4gICAqICAgIC0gYGRpc3BhdGNoYCBwZXJmb3JtIGluaXRpYWwgZGlzcGF0Y2ggW3RydWVdXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc3RhcnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKHJ1bm5pbmcpIHJldHVybjtcbiAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICBpZiAoZmFsc2UgPT09IG9wdGlvbnMuZGlzcGF0Y2gpIGRpc3BhdGNoID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlID09PSBvcHRpb25zLmRlY29kZVVSTENvbXBvbmVudHMpIGRlY29kZVVSTENvbXBvbmVudHMgPSBmYWxzZTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMucG9wc3RhdGUpIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMuY2xpY2spIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIH1cbiAgICBpZiAodHJ1ZSA9PT0gb3B0aW9ucy5oYXNoYmFuZykgaGFzaGJhbmcgPSB0cnVlO1xuICAgIGlmICghZGlzcGF0Y2gpIHJldHVybjtcbiAgICB2YXIgdXJsID0gKGhhc2hiYW5nICYmIH5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJyMhJykpID8gbG9jYXRpb24uaGFzaC5zdWJzdHIoMikgKyBsb2NhdGlvbi5zZWFyY2ggOiBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaCArIGxvY2F0aW9uLmhhc2g7XG4gICAgcGFnZS5yZXBsYWNlKHVybCwgbnVsbCwgdHJ1ZSwgZGlzcGF0Y2gpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVbmJpbmQgY2xpY2sgYW5kIHBvcHN0YXRlIGV2ZW50IGhhbmRsZXJzLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcbiAgICBwYWdlLmN1cnJlbnQgPSAnJztcbiAgICBwYWdlLmxlbiA9IDA7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZGlzcGF0Y2hcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zaG93ID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGRpc3BhdGNoLCBwdXNoKSB7XG4gICAgdmFyIGN0eCA9IG5ldyBDb250ZXh0KHBhdGgsIHN0YXRlKTtcbiAgICBwYWdlLmN1cnJlbnQgPSBjdHgucGF0aDtcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgaWYgKGZhbHNlICE9PSBjdHguaGFuZGxlZCAmJiBmYWxzZSAhPT0gcHVzaCkgY3R4LnB1c2hTdGF0ZSgpO1xuICAgIHJldHVybiBjdHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdvZXMgYmFjayBpbiB0aGUgaGlzdG9yeVxuICAgKiBCYWNrIHNob3VsZCBhbHdheXMgbGV0IHRoZSBjdXJyZW50IHJvdXRlIHB1c2ggc3RhdGUgYW5kIHRoZW4gZ28gYmFjay5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBmYWxsYmFjayBwYXRoIHRvIGdvIGJhY2sgaWYgbm8gbW9yZSBoaXN0b3J5IGV4aXN0cywgaWYgdW5kZWZpbmVkIGRlZmF1bHRzIHRvIHBhZ2UuYmFzZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3N0YXRlXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLmJhY2sgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSkge1xuICAgIGlmIChwYWdlLmxlbiA+IDApIHtcbiAgICAgIC8vIHRoaXMgbWF5IG5lZWQgbW9yZSB0ZXN0aW5nIHRvIHNlZSBpZiBhbGwgYnJvd3NlcnNcbiAgICAgIC8vIHdhaXQgZm9yIHRoZSBuZXh0IHRpY2sgdG8gZ28gYmFjayBpbiBoaXN0b3J5XG4gICAgICBoaXN0b3J5LmJhY2soKTtcbiAgICAgIHBhZ2UubGVuLS07XG4gICAgfSBlbHNlIGlmIChwYXRoKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3cocGF0aCwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfWVsc2V7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3coYmFzZSwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHJvdXRlIHRvIHJlZGlyZWN0IGZyb20gb25lIHBhdGggdG8gb3RoZXJcbiAgICogb3IganVzdCByZWRpcmVjdCB0byBhbm90aGVyIHJvdXRlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBmcm9tIC0gaWYgcGFyYW0gJ3RvJyBpcyB1bmRlZmluZWQgcmVkaXJlY3RzIHRvICdmcm9tJ1xuICAgKiBAcGFyYW0ge1N0cmluZ30gW3RvXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgcGFnZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gICAgLy8gRGVmaW5lIHJvdXRlIGZyb20gYSBwYXRoIHRvIGFub3RoZXJcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBmcm9tICYmICdzdHJpbmcnID09PSB0eXBlb2YgdG8pIHtcbiAgICAgIHBhZ2UoZnJvbSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHBhZ2UucmVwbGFjZSh0byk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gV2FpdCBmb3IgdGhlIHB1c2ggc3RhdGUgYW5kIHJlcGxhY2UgaXQgd2l0aCBhbm90aGVyXG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZnJvbSAmJiAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHRvKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnJlcGxhY2UoZnJvbSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgYHBhdGhgIHdpdGggb3B0aW9uYWwgYHN0YXRlYCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAcmV0dXJuIHtDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuXG4gIHBhZ2UucmVwbGFjZSA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlLCBpbml0LCBkaXNwYXRjaCkge1xuICAgIHZhciBjdHggPSBuZXcgQ29udGV4dChwYXRoLCBzdGF0ZSk7XG4gICAgcGFnZS5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgY3R4LmluaXQgPSBpbml0O1xuICAgIGN0eC5zYXZlKCk7IC8vIHNhdmUgYmVmb3JlIGRpc3BhdGNoaW5nLCB3aGljaCBtYXkgcmVkaXJlY3RcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgcmV0dXJuIGN0eDtcbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2ggdGhlIGdpdmVuIGBjdHhgLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBwYWdlLmRpc3BhdGNoID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgdmFyIHByZXYgPSBwcmV2Q29udGV4dCxcbiAgICAgIGkgPSAwLFxuICAgICAgaiA9IDA7XG5cbiAgICBwcmV2Q29udGV4dCA9IGN0eDtcblxuICAgIGZ1bmN0aW9uIG5leHRFeGl0KCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5leGl0c1tqKytdO1xuICAgICAgaWYgKCFmbikgcmV0dXJuIG5leHRFbnRlcigpO1xuICAgICAgZm4ocHJldiwgbmV4dEV4aXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5leHRFbnRlcigpIHtcbiAgICAgIHZhciBmbiA9IHBhZ2UuY2FsbGJhY2tzW2krK107XG5cbiAgICAgIGlmIChjdHgucGF0aCAhPT0gcGFnZS5jdXJyZW50KSB7XG4gICAgICAgIGN0eC5oYW5kbGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghZm4pIHJldHVybiB1bmhhbmRsZWQoY3R4KTtcbiAgICAgIGZuKGN0eCwgbmV4dEVudGVyKTtcbiAgICB9XG5cbiAgICBpZiAocHJldikge1xuICAgICAgbmV4dEV4aXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dEVudGVyKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVbmhhbmRsZWQgYGN0eGAuIFdoZW4gaXQncyBub3QgdGhlIGluaXRpYWxcbiAgICogcG9wc3RhdGUgdGhlbiByZWRpcmVjdC4gSWYgeW91IHdpc2ggdG8gaGFuZGxlXG4gICAqIDQwNHMgb24geW91ciBvd24gdXNlIGBwYWdlKCcqJywgY2FsbGJhY2spYC5cbiAgICpcbiAgICogQHBhcmFtIHtDb250ZXh0fSBjdHhcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHVuaGFuZGxlZChjdHgpIHtcbiAgICBpZiAoY3R4LmhhbmRsZWQpIHJldHVybjtcbiAgICB2YXIgY3VycmVudDtcblxuICAgIGlmIChoYXNoYmFuZykge1xuICAgICAgY3VycmVudCA9IGJhc2UgKyBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMhJywgJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50ID0gbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2g7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT09IGN0eC5jYW5vbmljYWxQYXRoKSByZXR1cm47XG4gICAgcGFnZS5zdG9wKCk7XG4gICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICBsb2NhdGlvbi5ocmVmID0gY3R4LmNhbm9uaWNhbFBhdGg7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYW4gZXhpdCByb3V0ZSBvbiBgcGF0aGAgd2l0aFxuICAgKiBjYWxsYmFjayBgZm4oKWAsIHdoaWNoIHdpbGwgYmUgY2FsbGVkXG4gICAqIG9uIHRoZSBwcmV2aW91cyBjb250ZXh0IHdoZW4gYSBuZXdcbiAgICogcGFnZSBpcyB2aXNpdGVkLlxuICAgKi9cbiAgcGFnZS5leGl0ID0gZnVuY3Rpb24ocGF0aCwgZm4pIHtcbiAgICBpZiAodHlwZW9mIHBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBwYWdlLmV4aXQoJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHBhZ2UuZXhpdHMucHVzaChyb3V0ZS5taWRkbGV3YXJlKGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIFVSTCBlbmNvZGluZyBmcm9tIHRoZSBnaXZlbiBgc3RyYC5cbiAgICogQWNjb21tb2RhdGVzIHdoaXRlc3BhY2UgaW4gYm90aCB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICogYW5kIHJlZ3VsYXIgcGVyY2VudC1lbmNvZGVkIGZvcm0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyfSBVUkwgY29tcG9uZW50IHRvIGRlY29kZVxuICAgKi9cbiAgZnVuY3Rpb24gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudCh2YWwpIHtcbiAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHsgcmV0dXJuIHZhbDsgfVxuICAgIHJldHVybiBkZWNvZGVVUkxDb21wb25lbnRzID8gZGVjb2RlVVJJQ29tcG9uZW50KHZhbC5yZXBsYWNlKC9cXCsvZywgJyAnKSkgOiB2YWw7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG5ldyBcInJlcXVlc3RcIiBgQ29udGV4dGBcbiAgICogd2l0aCB0aGUgZ2l2ZW4gYHBhdGhgIGFuZCBvcHRpb25hbCBpbml0aWFsIGBzdGF0ZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBDb250ZXh0KHBhdGgsIHN0YXRlKSB7XG4gICAgaWYgKCcvJyA9PT0gcGF0aFswXSAmJiAwICE9PSBwYXRoLmluZGV4T2YoYmFzZSkpIHBhdGggPSBiYXNlICsgKGhhc2hiYW5nID8gJyMhJyA6ICcnKSArIHBhdGg7XG4gICAgdmFyIGkgPSBwYXRoLmluZGV4T2YoJz8nKTtcblxuICAgIHRoaXMuY2Fub25pY2FsUGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXRoID0gcGF0aC5yZXBsYWNlKGJhc2UsICcnKSB8fCAnLyc7XG4gICAgaWYgKGhhc2hiYW5nKSB0aGlzLnBhdGggPSB0aGlzLnBhdGgucmVwbGFjZSgnIyEnLCAnJykgfHwgJy8nO1xuXG4gICAgdGhpcy50aXRsZSA9IGRvY3VtZW50LnRpdGxlO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZSB8fCB7fTtcbiAgICB0aGlzLnN0YXRlLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucXVlcnlzdHJpbmcgPSB+aSA/IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGF0aC5zbGljZShpICsgMSkpIDogJyc7XG4gICAgdGhpcy5wYXRobmFtZSA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQofmkgPyBwYXRoLnNsaWNlKDAsIGkpIDogcGF0aCk7XG4gICAgdGhpcy5wYXJhbXMgPSB7fTtcblxuICAgIC8vIGZyYWdtZW50XG4gICAgdGhpcy5oYXNoID0gJyc7XG4gICAgaWYgKCFoYXNoYmFuZykge1xuICAgICAgaWYgKCF+dGhpcy5wYXRoLmluZGV4T2YoJyMnKSkgcmV0dXJuO1xuICAgICAgdmFyIHBhcnRzID0gdGhpcy5wYXRoLnNwbGl0KCcjJyk7XG4gICAgICB0aGlzLnBhdGggPSBwYXJ0c1swXTtcbiAgICAgIHRoaXMuaGFzaCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGFydHNbMV0pIHx8ICcnO1xuICAgICAgdGhpcy5xdWVyeXN0cmluZyA9IHRoaXMucXVlcnlzdHJpbmcuc3BsaXQoJyMnKVswXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBDb250ZXh0YC5cbiAgICovXG5cbiAgcGFnZS5Db250ZXh0ID0gQ29udGV4dDtcblxuICAvKipcbiAgICogUHVzaCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHBhZ2UubGVuKys7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUodGhpcy5zdGF0ZSwgdGhpcy50aXRsZSwgaGFzaGJhbmcgJiYgdGhpcy5wYXRoICE9PSAnLycgPyAnIyEnICsgdGhpcy5wYXRoIDogdGhpcy5jYW5vbmljYWxQYXRoKTtcbiAgfTtcblxuICAvKipcbiAgICogU2F2ZSB0aGUgY29udGV4dCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQ29udGV4dC5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIGhhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYFJvdXRlYCB3aXRoIHRoZSBnaXZlbiBIVFRQIGBwYXRoYCxcbiAgICogYW5kIGFuIGFycmF5IG9mIGBjYWxsYmFja3NgIGFuZCBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgLSBgc2Vuc2l0aXZlYCAgICBlbmFibGUgY2FzZS1zZW5zaXRpdmUgcm91dGVzXG4gICAqICAgLSBgc3RyaWN0YCAgICAgICBlbmFibGUgc3RyaWN0IG1hdGNoaW5nIGZvciB0cmFpbGluZyBzbGFzaGVzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gUm91dGUocGF0aCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucGF0aCA9IChwYXRoID09PSAnKicpID8gJyguKiknIDogcGF0aDtcbiAgICB0aGlzLm1ldGhvZCA9ICdHRVQnO1xuICAgIHRoaXMucmVnZXhwID0gcGF0aHRvUmVnZXhwKHRoaXMucGF0aCxcbiAgICAgIHRoaXMua2V5cyA9IFtdLFxuICAgICAgb3B0aW9ucy5zZW5zaXRpdmUsXG4gICAgICBvcHRpb25zLnN0cmljdCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBSb3V0ZWAuXG4gICAqL1xuXG4gIHBhZ2UuUm91dGUgPSBSb3V0ZTtcblxuICAvKipcbiAgICogUmV0dXJuIHJvdXRlIG1pZGRsZXdhcmUgd2l0aFxuICAgKiB0aGUgZ2l2ZW4gY2FsbGJhY2sgYGZuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1pZGRsZXdhcmUgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24oY3R4LCBuZXh0KSB7XG4gICAgICBpZiAoc2VsZi5tYXRjaChjdHgucGF0aCwgY3R4LnBhcmFtcykpIHJldHVybiBmbihjdHgsIG5leHQpO1xuICAgICAgbmV4dCgpO1xuICAgIH07XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgcm91dGUgbWF0Y2hlcyBgcGF0aGAsIGlmIHNvXG4gICAqIHBvcHVsYXRlIGBwYXJhbXNgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbihwYXRoLCBwYXJhbXMpIHtcbiAgICB2YXIga2V5cyA9IHRoaXMua2V5cyxcbiAgICAgIHFzSW5kZXggPSBwYXRoLmluZGV4T2YoJz8nKSxcbiAgICAgIHBhdGhuYW1lID0gfnFzSW5kZXggPyBwYXRoLnNsaWNlKDAsIHFzSW5kZXgpIDogcGF0aCxcbiAgICAgIG0gPSB0aGlzLnJlZ2V4cC5leGVjKGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSkpO1xuXG4gICAgaWYgKCFtKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMSwgbGVuID0gbS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdmFyIGtleSA9IGtleXNbaSAtIDFdO1xuICAgICAgdmFyIHZhbCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQobVtpXSk7XG4gICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQgfHwgIShoYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtcywga2V5Lm5hbWUpKSkge1xuICAgICAgICBwYXJhbXNba2V5Lm5hbWVdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEhhbmRsZSBcInBvcHVsYXRlXCIgZXZlbnRzLlxuICAgKi9cblxuICB2YXIgb25wb3BzdGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xuICAgIGlmICgndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHdpbmRvdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBsb2FkZWQgPSB0cnVlO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gb25wb3BzdGF0ZShlKSB7XG4gICAgICBpZiAoIWxvYWRlZCkgcmV0dXJuO1xuICAgICAgaWYgKGUuc3RhdGUpIHtcbiAgICAgICAgdmFyIHBhdGggPSBlLnN0YXRlLnBhdGg7XG4gICAgICAgIHBhZ2UucmVwbGFjZShwYXRoLCBlLnN0YXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLmhhc2gsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSkoKTtcbiAgLyoqXG4gICAqIEhhbmRsZSBcImNsaWNrXCIgZXZlbnRzLlxuICAgKi9cblxuICBmdW5jdGlvbiBvbmNsaWNrKGUpIHtcblxuICAgIGlmICgxICE9PSB3aGljaChlKSkgcmV0dXJuO1xuXG4gICAgaWYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkgfHwgZS5zaGlmdEtleSkgcmV0dXJuO1xuICAgIGlmIChlLmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcblxuXG5cbiAgICAvLyBlbnN1cmUgbGlua1xuICAgIHZhciBlbCA9IGUudGFyZ2V0O1xuICAgIHdoaWxlIChlbCAmJiAnQScgIT09IGVsLm5vZGVOYW1lKSBlbCA9IGVsLnBhcmVudE5vZGU7XG4gICAgaWYgKCFlbCB8fCAnQScgIT09IGVsLm5vZGVOYW1lKSByZXR1cm47XG5cblxuXG4gICAgLy8gSWdub3JlIGlmIHRhZyBoYXNcbiAgICAvLyAxLiBcImRvd25sb2FkXCIgYXR0cmlidXRlXG4gICAgLy8gMi4gcmVsPVwiZXh0ZXJuYWxcIiBhdHRyaWJ1dGVcbiAgICBpZiAoZWwuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpIHx8IGVsLmdldEF0dHJpYnV0ZSgncmVsJykgPT09ICdleHRlcm5hbCcpIHJldHVybjtcblxuICAgIC8vIGVuc3VyZSBub24taGFzaCBmb3IgdGhlIHNhbWUgcGF0aFxuICAgIHZhciBsaW5rID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgaWYgKCFoYXNoYmFuZyAmJiBlbC5wYXRobmFtZSA9PT0gbG9jYXRpb24ucGF0aG5hbWUgJiYgKGVsLmhhc2ggfHwgJyMnID09PSBsaW5rKSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIENoZWNrIGZvciBtYWlsdG86IGluIHRoZSBocmVmXG4gICAgaWYgKGxpbmsgJiYgbGluay5pbmRleE9mKCdtYWlsdG86JykgPiAtMSkgcmV0dXJuO1xuXG4gICAgLy8gY2hlY2sgdGFyZ2V0XG4gICAgaWYgKGVsLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgLy8geC1vcmlnaW5cbiAgICBpZiAoIXNhbWVPcmlnaW4oZWwuaHJlZikpIHJldHVybjtcblxuXG5cbiAgICAvLyByZWJ1aWxkIHBhdGhcbiAgICB2YXIgcGF0aCA9IGVsLnBhdGhuYW1lICsgZWwuc2VhcmNoICsgKGVsLmhhc2ggfHwgJycpO1xuXG4gICAgLy8gc3RyaXAgbGVhZGluZyBcIi9bZHJpdmUgbGV0dGVyXTpcIiBvbiBOVy5qcyBvbiBXaW5kb3dzXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwYXRoLm1hdGNoKC9eXFwvW2EtekEtWl06XFwvLykpIHtcbiAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL15cXC9bYS16QS1aXTpcXC8vLCAnLycpO1xuICAgIH1cblxuICAgIC8vIHNhbWUgcGFnZVxuICAgIHZhciBvcmlnID0gcGF0aDtcblxuICAgIGlmIChwYXRoLmluZGV4T2YoYmFzZSkgPT09IDApIHtcbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cihiYXNlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKGhhc2hiYW5nKSBwYXRoID0gcGF0aC5yZXBsYWNlKCcjIScsICcnKTtcblxuICAgIGlmIChiYXNlICYmIG9yaWcgPT09IHBhdGgpIHJldHVybjtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBwYWdlLnNob3cob3JpZyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgYnV0dG9uLlxuICAgKi9cblxuICBmdW5jdGlvbiB3aGljaChlKSB7XG4gICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgIHJldHVybiBudWxsID09PSBlLndoaWNoID8gZS5idXR0b24gOiBlLndoaWNoO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGBocmVmYCBpcyB0aGUgc2FtZSBvcmlnaW4uXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNhbWVPcmlnaW4oaHJlZikge1xuICAgIHZhciBvcmlnaW4gPSBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0bmFtZTtcbiAgICBpZiAobG9jYXRpb24ucG9ydCkgb3JpZ2luICs9ICc6JyArIGxvY2F0aW9uLnBvcnQ7XG4gICAgcmV0dXJuIChocmVmICYmICgwID09PSBocmVmLmluZGV4T2Yob3JpZ2luKSkpO1xuICB9XG5cbiAgcGFnZS5zYW1lT3JpZ2luID0gc2FtZU9yaWdpbjtcbiIsInZhciBpc2FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbi8qKlxuICogRXhwb3NlIGBwYXRoVG9SZWdleHBgLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhUb1JlZ2V4cFxubW9kdWxlLmV4cG9ydHMucGFyc2UgPSBwYXJzZVxubW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGNvbXBpbGVcbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvRnVuY3Rpb24gPSB0b2tlbnNUb0Z1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb1JlZ0V4cCA9IHRva2Vuc1RvUmVnRXhwXG5cbi8qKlxuICogVGhlIG1haW4gcGF0aCBtYXRjaGluZyByZWdleHAgdXRpbGl0eS5cbiAqXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG52YXIgUEFUSF9SRUdFWFAgPSBuZXcgUmVnRXhwKFtcbiAgLy8gTWF0Y2ggZXNjYXBlZCBjaGFyYWN0ZXJzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGFwcGVhciBpbiBmdXR1cmUgbWF0Y2hlcy5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0IHdvbid0IHRyYW5zZm9ybS5cbiAgJyhcXFxcXFxcXC4pJyxcbiAgLy8gTWF0Y2ggRXhwcmVzcy1zdHlsZSBwYXJhbWV0ZXJzIGFuZCB1bi1uYW1lZCBwYXJhbWV0ZXJzIHdpdGggYSBwcmVmaXhcbiAgLy8gYW5kIG9wdGlvbmFsIHN1ZmZpeGVzLiBNYXRjaGVzIGFwcGVhciBhczpcbiAgLy9cbiAgLy8gXCIvOnRlc3QoXFxcXGQrKT9cIiA9PiBbXCIvXCIsIFwidGVzdFwiLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCBcIj9cIiwgdW5kZWZpbmVkXVxuICAvLyBcIi9yb3V0ZShcXFxcZCspXCIgID0+IFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gIC8vIFwiLypcIiAgICAgICAgICAgID0+IFtcIi9cIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIipcIl1cbiAgJyhbXFxcXC8uXSk/KD86KD86XFxcXDooXFxcXHcrKSg/OlxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgcmVzXG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXVxuICAgIHZhciBlc2NhcGVkID0gcmVzWzFdXG4gICAgdmFyIG9mZnNldCA9IHJlcy5pbmRleFxuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgaW5kZXggPSBvZmZzZXQgKyBtLmxlbmd0aFxuXG4gICAgLy8gSWdub3JlIGFscmVhZHkgZXNjYXBlZCBzZXF1ZW5jZXMuXG4gICAgaWYgKGVzY2FwZWQpIHtcbiAgICAgIHBhdGggKz0gZXNjYXBlZFsxXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBQdXNoIHRoZSBjdXJyZW50IHBhdGggb250byB0aGUgdG9rZW5zLlxuICAgIGlmIChwYXRoKSB7XG4gICAgICB0b2tlbnMucHVzaChwYXRoKVxuICAgICAgcGF0aCA9ICcnXG4gICAgfVxuXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgc3VmZml4ID0gcmVzWzZdXG4gICAgdmFyIGFzdGVyaXNrID0gcmVzWzddXG5cbiAgICB2YXIgcmVwZWF0ID0gc3VmZml4ID09PSAnKycgfHwgc3VmZml4ID09PSAnKidcbiAgICB2YXIgb3B0aW9uYWwgPSBzdWZmaXggPT09ICc/JyB8fCBzdWZmaXggPT09ICcqJ1xuICAgIHZhciBkZWxpbWl0ZXIgPSBwcmVmaXggfHwgJy8nXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwIHx8IChhc3RlcmlzayA/ICcuKicgOiAnW14nICsgZGVsaW1pdGVyICsgJ10rPycpXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGF0dGVybjogZXNjYXBlR3JvdXAocGF0dGVybilcbiAgICB9KVxuICB9XG5cbiAgLy8gTWF0Y2ggYW55IGNoYXJhY3RlcnMgc3RpbGwgcmVtYWluaW5nLlxuICBpZiAoaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgcGF0aCArPSBzdHIuc3Vic3RyKGluZGV4KVxuICB9XG5cbiAgLy8gSWYgdGhlIHBhdGggZXhpc3RzLCBwdXNoIGl0IG9udG8gdGhlIGVuZC5cbiAgaWYgKHBhdGgpIHtcbiAgICB0b2tlbnMucHVzaChwYXRoKVxuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzdHJpbmcgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBmb3IgdGhlIHBhdGguXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIG1ldGhvZCBmb3IgdHJhbnNmb3JtaW5nIHRva2VucyBpbnRvIHRoZSBwYXRoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0b2tlbnNUb0Z1bmN0aW9uICh0b2tlbnMpIHtcbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHRva2VucyBpbnRvIHJlZ2V4cHMuXG4gIHZhciBtYXRjaGVzID0gbmV3IEFycmF5KHRva2Vucy5sZW5ndGgpXG5cbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHBhdHRlcm5zIGJlZm9yZSBjb21waWxhdGlvbi5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hdGNoZXNbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRva2Vuc1tpXS5wYXR0ZXJuICsgJyQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHBhdGggPSAnJ1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhdGggKz0gdG9rZW5cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdXG4gICAgICB2YXIgc2VnbWVudFxuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gYmUgZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzYXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICghdG9rZW4ucmVwZWF0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgcmVwZWF0LCBidXQgcmVjZWl2ZWQgXCInICsgdmFsdWUgKyAnXCInKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXRoICs9IChqID09PSAwID8gdG9rZW4ucHJlZml4IDogdG9rZW4uZGVsaW1pdGVyKSArIHNlZ21lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXG5cbiAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgfVxuXG4gICAgICBwYXRoICs9IHRva2VuLnByZWZpeCArIHNlZ21lbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogRXNjYXBlIHRoZSBjYXB0dXJpbmcgZ3JvdXAgYnkgZXNjYXBpbmcgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBtZWFuaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlR3JvdXAgKGdyb3VwKSB7XG4gIHJldHVybiBncm91cC5yZXBsYWNlKC8oWz0hOiRcXC8oKV0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEF0dGFjaCB0aGUga2V5cyBhcyBhIHByb3BlcnR5IG9mIHRoZSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGF0dGFjaEtleXMgKHJlLCBrZXlzKSB7XG4gIHJlLmtleXMgPSBrZXlzXG4gIHJldHVybiByZVxufVxuXG4vKipcbiAqIEdldCB0aGUgZmxhZ3MgZm9yIGEgcmVnZXhwIGZyb20gdGhlIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZsYWdzIChvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zLnNlbnNpdGl2ZSA/ICcnIDogJ2knXG59XG5cbi8qKlxuICogUHVsbCBvdXQga2V5cyBmcm9tIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge1JlZ0V4cH0gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHJlZ2V4cFRvUmVnZXhwIChwYXRoLCBrZXlzKSB7XG4gIC8vIFVzZSBhIG5lZ2F0aXZlIGxvb2thaGVhZCB0byBtYXRjaCBvbmx5IGNhcHR1cmluZyBncm91cHMuXG4gIHZhciBncm91cHMgPSBwYXRoLnNvdXJjZS5tYXRjaCgvXFwoKD8hXFw/KS9nKVxuXG4gIGlmIChncm91cHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAga2V5cy5wdXNoKHtcbiAgICAgICAgbmFtZTogaSxcbiAgICAgICAgcHJlZml4OiBudWxsLFxuICAgICAgICBkZWxpbWl0ZXI6IG51bGwsXG4gICAgICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICAgICAgcmVwZWF0OiBmYWxzZSxcbiAgICAgICAgcGF0dGVybjogbnVsbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhwYXRoLCBrZXlzKVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhbiBhcnJheSBpbnRvIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXJyYXlUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgIHBhcnRzLnB1c2gocGF0aFRvUmVnZXhwKHBhdGhbaV0sIGtleXMsIG9wdGlvbnMpLnNvdXJjZSlcbiAgfVxuXG4gIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcoPzonICsgcGFydHMuam9pbignfCcpICsgJyknLCBmbGFncyhvcHRpb25zKSlcblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZWdleHAsIGtleXMpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcGF0aCByZWdleHAgZnJvbSBzdHJpbmcgaW5wdXQuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aClcbiAgdmFyIHJlID0gdG9rZW5zVG9SZWdFeHAodG9rZW5zLCBvcHRpb25zKVxuXG4gIC8vIEF0dGFjaCBrZXlzIGJhY2sgdG8gdGhlIHJlZ2V4cC5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGtleXMucHVzaCh0b2tlbnNbaV0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHRva2Vuc1xuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9SZWdFeHAgKHRva2Vucywgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBzdHJpY3QgPSBvcHRpb25zLnN0cmljdFxuICB2YXIgZW5kID0gb3B0aW9ucy5lbmQgIT09IGZhbHNlXG4gIHZhciByb3V0ZSA9ICcnXG4gIHZhciBsYXN0VG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gIHZhciBlbmRzV2l0aFNsYXNoID0gdHlwZW9mIGxhc3RUb2tlbiA9PT0gJ3N0cmluZycgJiYgL1xcLyQvLnRlc3QobGFzdFRva2VuKVxuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdG9rZW5zIGFuZCBjcmVhdGUgb3VyIHJlZ2V4cCBzdHJpbmcuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgcm91dGUgKz0gZXNjYXBlU3RyaW5nKHRva2VuKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcHJlZml4ID0gZXNjYXBlU3RyaW5nKHRva2VuLnByZWZpeClcbiAgICAgIHZhciBjYXB0dXJlID0gdG9rZW4ucGF0dGVyblxuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKHByZWZpeCkge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKD86JyArIHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSk/J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKCcgKyBjYXB0dXJlICsgJyk/J1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpJ1xuICAgICAgfVxuXG4gICAgICByb3V0ZSArPSBjYXB0dXJlXG4gICAgfVxuICB9XG5cbiAgLy8gSW4gbm9uLXN0cmljdCBtb2RlIHdlIGFsbG93IGEgc2xhc2ggYXQgdGhlIGVuZCBvZiBtYXRjaC4gSWYgdGhlIHBhdGggdG9cbiAgLy8gbWF0Y2ggYWxyZWFkeSBlbmRzIHdpdGggYSBzbGFzaCwgd2UgcmVtb3ZlIGl0IGZvciBjb25zaXN0ZW5jeS4gVGhlIHNsYXNoXG4gIC8vIGlzIHZhbGlkIGF0IHRoZSBlbmQgb2YgYSBwYXRoIG1hdGNoLCBub3QgaW4gdGhlIG1pZGRsZS4gVGhpcyBpcyBpbXBvcnRhbnRcbiAgLy8gaW4gbm9uLWVuZGluZyBtb2RlLCB3aGVyZSBcIi90ZXN0L1wiIHNob3VsZG4ndCBtYXRjaCBcIi90ZXN0Ly9yb3V0ZVwiLlxuICBpZiAoIXN0cmljdCkge1xuICAgIHJvdXRlID0gKGVuZHNXaXRoU2xhc2ggPyByb3V0ZS5zbGljZSgwLCAtMikgOiByb3V0ZSkgKyAnKD86XFxcXC8oPz0kKSk/J1xuICB9XG5cbiAgaWYgKGVuZCkge1xuICAgIHJvdXRlICs9ICckJ1xuICB9IGVsc2Uge1xuICAgIC8vIEluIG5vbi1lbmRpbmcgbW9kZSwgd2UgbmVlZCB0aGUgY2FwdHVyaW5nIGdyb3VwcyB0byBtYXRjaCBhcyBtdWNoIGFzXG4gICAgLy8gcG9zc2libGUgYnkgdXNpbmcgYSBwb3NpdGl2ZSBsb29rYWhlYWQgdG8gdGhlIGVuZCBvciBuZXh0IHBhdGggc2VnbWVudC5cbiAgICByb3V0ZSArPSBzdHJpY3QgJiYgZW5kc1dpdGhTbGFzaCA/ICcnIDogJyg/PVxcXFwvfCQpJ1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgcm91dGUsIGZsYWdzKG9wdGlvbnMpKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KFN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgICAgICAgICAgIFtrZXlzXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICBbb3B0aW9uc11cbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGtleXMgPSBrZXlzIHx8IFtdXG5cbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IGtleXNcbiAgICBrZXlzID0gW11cbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gcmVnZXhwVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIGlmIChpc2FycmF5KHBhdGgpKSB7XG4gICAgcmV0dXJuIGFycmF5VG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxufVxuIiwiKGZ1bmN0aW9uKCkge1xuICAndXNlIHN0cmljdCc7XG5cbiAgaWYgKHNlbGYuZmV0Y2gpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU5hbWUobmFtZSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSlcbiAgICB9XG4gICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXFxeX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGNoYXJhY3RlciBpbiBoZWFkZXIgZmllbGQgbmFtZScpXG4gICAgfVxuICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgIHRoaXMubWFwID0ge31cblxuICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKVxuICAgICAgfSwgdGhpcylcblxuICAgIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoaGVhZGVycykuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pXG4gICAgICB9LCB0aGlzKVxuICAgIH1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSlcbiAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKVxuICAgIHZhciBsaXN0ID0gdGhpcy5tYXBbbmFtZV1cbiAgICBpZiAoIWxpc3QpIHtcbiAgICAgIGxpc3QgPSBbXVxuICAgICAgdGhpcy5tYXBbbmFtZV0gPSBsaXN0XG4gICAgfVxuICAgIGxpc3QucHVzaCh2YWx1ZSlcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlWydkZWxldGUnXSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgdmFsdWVzID0gdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV1cbiAgICByZXR1cm4gdmFsdWVzID8gdmFsdWVzWzBdIDogbnVsbFxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0QWxsID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXSB8fCBbXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXSA9IFtub3JtYWxpemVWYWx1ZSh2YWx1ZSldXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0aGlzLm1hcCkuZm9yRWFjaChmdW5jdGlvbihuYW1lKSB7XG4gICAgICB0aGlzLm1hcFtuYW1lXS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdmFsdWUsIG5hbWUsIHRoaXMpXG4gICAgICB9LCB0aGlzKVxuICAgIH0sIHRoaXMpXG4gIH1cblxuICBmdW5jdGlvbiBjb25zdW1lZChib2R5KSB7XG4gICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKSlcbiAgICB9XG4gICAgYm9keS5ib2R5VXNlZCA9IHRydWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcbiAgICAgIH1cbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZWFkZXIuZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYilcbiAgICByZXR1cm4gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpXG4gICAgcmV0dXJuIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gIH1cblxuICB2YXIgc3VwcG9ydCA9IHtcbiAgICBibG9iOiAnRmlsZVJlYWRlcicgaW4gc2VsZiAmJiAnQmxvYicgaW4gc2VsZiAmJiAoZnVuY3Rpb24oKSB7XG4gICAgICB0cnkge1xuICAgICAgICBuZXcgQmxvYigpO1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZVxuICAgICAgfVxuICAgIH0pKCksXG4gICAgZm9ybURhdGE6ICdGb3JtRGF0YScgaW4gc2VsZixcbiAgICBhcnJheUJ1ZmZlcjogJ0FycmF5QnVmZmVyJyBpbiBzZWxmXG4gIH1cblxuICBmdW5jdGlvbiBCb2R5KCkge1xuICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZVxuXG5cbiAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgIHRoaXMuX2JvZHlJbml0ID0gYm9keVxuICAgICAgaWYgKHR5cGVvZiBib2R5ID09PSAnc3RyaW5nJykge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUJsb2IgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuZm9ybURhdGEgJiYgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUZvcm1EYXRhID0gYm9keVxuICAgICAgfSBlbHNlIGlmICghYm9keSkge1xuICAgICAgICB0aGlzLl9ib2R5VGV4dCA9ICcnXG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgQXJyYXlCdWZmZXIucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgLy8gT25seSBzdXBwb3J0IEFycmF5QnVmZmVycyBmb3IgUE9TVCBtZXRob2QuXG4gICAgICAgIC8vIFJlY2VpdmluZyBBcnJheUJ1ZmZlcnMgaGFwcGVucyB2aWEgQmxvYnMsIGluc3RlYWQuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Vuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGUnKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgIHRoaXMuYmxvYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ibG9iKCkudGhlbihyZWFkQmxvYkFzQXJyYXlCdWZmZXIpXG4gICAgICB9XG5cbiAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiByZWFkQmxvYkFzVGV4dCh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dCcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgcmV0dXJuIHJlamVjdGVkID8gcmVqZWN0ZWQgOiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddXG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICByZXR1cm4gKG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xKSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5XG4gICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpKSB7XG4gICAgICBpZiAoaW5wdXQuYm9keVVzZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJylcbiAgICAgIH1cbiAgICAgIHRoaXMudXJsID0gaW5wdXQudXJsXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHNcbiAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpXG4gICAgICB9XG4gICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZFxuICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZVxuICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXRcbiAgICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXJsID0gaW5wdXRcbiAgICB9XG5cbiAgICB0aGlzLmNyZWRlbnRpYWxzID0gb3B0aW9ucy5jcmVkZW50aWFscyB8fCB0aGlzLmNyZWRlbnRpYWxzIHx8ICdvbWl0J1xuICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIH1cbiAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCAnR0VUJylcbiAgICB0aGlzLm1vZGUgPSBvcHRpb25zLm1vZGUgfHwgdGhpcy5tb2RlIHx8IG51bGxcbiAgICB0aGlzLnJlZmVycmVyID0gbnVsbFxuXG4gICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gJ0dFVCcgfHwgdGhpcy5tZXRob2QgPT09ICdIRUFEJykgJiYgYm9keSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHMnKVxuICAgIH1cbiAgICB0aGlzLl9pbml0Qm9keShib2R5KVxuICB9XG5cbiAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlcXVlc3QodGhpcylcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlY29kZShib2R5KSB7XG4gICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKVxuICAgIGJvZHkudHJpbSgpLnNwbGl0KCcmJykuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KCc9JylcbiAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJz0nKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXG4gICAgICB9XG4gICAgfSlcbiAgICByZXR1cm4gZm9ybVxuICB9XG5cbiAgZnVuY3Rpb24gaGVhZGVycyh4aHIpIHtcbiAgICB2YXIgaGVhZCA9IG5ldyBIZWFkZXJzKClcbiAgICB2YXIgcGFpcnMgPSB4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkudHJpbSgpLnNwbGl0KCdcXG4nKVxuICAgIHBhaXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICB2YXIgc3BsaXQgPSBoZWFkZXIudHJpbSgpLnNwbGl0KCc6JylcbiAgICAgIHZhciBrZXkgPSBzcGxpdC5zaGlmdCgpLnRyaW0oKVxuICAgICAgdmFyIHZhbHVlID0gc3BsaXQuam9pbignOicpLnRyaW0oKVxuICAgICAgaGVhZC5hcHBlbmQoa2V5LCB2YWx1ZSlcbiAgICB9KVxuICAgIHJldHVybiBoZWFkXG4gIH1cblxuICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpXG5cbiAgZnVuY3Rpb24gUmVzcG9uc2UoYm9keUluaXQsIG9wdGlvbnMpIHtcbiAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbnMgPSB7fVxuICAgIH1cblxuICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KVxuICAgIHRoaXMudHlwZSA9ICdkZWZhdWx0J1xuICAgIHRoaXMuc3RhdHVzID0gb3B0aW9ucy5zdGF0dXNcbiAgICB0aGlzLm9rID0gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwXG4gICAgdGhpcy5zdGF0dXNUZXh0ID0gb3B0aW9ucy5zdGF0dXNUZXh0XG4gICAgdGhpcy5oZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycyA/IG9wdGlvbnMuaGVhZGVycyA6IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8ICcnXG4gIH1cblxuICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKVxuXG4gIFJlc3BvbnNlLnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICBzdGF0dXNUZXh0OiB0aGlzLnN0YXR1c1RleHQsXG4gICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgdXJsOiB0aGlzLnVybFxuICAgIH0pXG4gIH1cblxuICBSZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiAwLCBzdGF0dXNUZXh0OiAnJ30pXG4gICAgcmVzcG9uc2UudHlwZSA9ICdlcnJvcidcbiAgICByZXR1cm4gcmVzcG9uc2VcbiAgfVxuXG4gIHZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XVxuXG4gIFJlc3BvbnNlLnJlZGlyZWN0ID0gZnVuY3Rpb24odXJsLCBzdGF0dXMpIHtcbiAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignSW52YWxpZCBzdGF0dXMgY29kZScpXG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7c3RhdHVzOiBzdGF0dXMsIGhlYWRlcnM6IHtsb2NhdGlvbjogdXJsfX0pXG4gIH1cblxuICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0O1xuICBzZWxmLlJlc3BvbnNlID0gUmVzcG9uc2U7XG5cbiAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgdmFyIHJlcXVlc3RcbiAgICAgIGlmIChSZXF1ZXN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGlucHV0KSAmJiAhaW5pdCkge1xuICAgICAgICByZXF1ZXN0ID0gaW5wdXRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcXVlc3QgPSBuZXcgUmVxdWVzdChpbnB1dCwgaW5pdClcbiAgICAgIH1cblxuICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG5cbiAgICAgIGZ1bmN0aW9uIHJlc3BvbnNlVVJMKCkge1xuICAgICAgICBpZiAoJ3Jlc3BvbnNlVVJMJyBpbiB4aHIpIHtcbiAgICAgICAgICByZXR1cm4geGhyLnJlc3BvbnNlVVJMXG4gICAgICAgIH1cblxuICAgICAgICAvLyBBdm9pZCBzZWN1cml0eSB3YXJuaW5ncyBvbiBnZXRSZXNwb25zZUhlYWRlciB3aGVuIG5vdCBhbGxvd2VkIGJ5IENPUlNcbiAgICAgICAgaWYgKC9eWC1SZXF1ZXN0LVVSTDovbS50ZXN0KHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSkpIHtcbiAgICAgICAgICByZXR1cm4geGhyLmdldFJlc3BvbnNlSGVhZGVyKCdYLVJlcXVlc3QtVVJMJylcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgeGhyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc3RhdHVzID0gKHhoci5zdGF0dXMgPT09IDEyMjMpID8gMjA0IDogeGhyLnN0YXR1c1xuICAgICAgICBpZiAoc3RhdHVzIDwgMTAwIHx8IHN0YXR1cyA+IDU5OSkge1xuICAgICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgICAgICAgcmV0dXJuXG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgaGVhZGVyczogaGVhZGVycyh4aHIpLFxuICAgICAgICAgIHVybDogcmVzcG9uc2VVUkwoKVxuICAgICAgICB9XG4gICAgICAgIHZhciBib2R5ID0gJ3Jlc3BvbnNlJyBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKVxuXG4gICAgICBpZiAocmVxdWVzdC5jcmVkZW50aWFscyA9PT0gJ2luY2x1ZGUnKSB7XG4gICAgICAgIHhoci53aXRoQ3JlZGVudGlhbHMgPSB0cnVlXG4gICAgICB9XG5cbiAgICAgIGlmICgncmVzcG9uc2VUeXBlJyBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgIHhoci5yZXNwb25zZVR5cGUgPSAnYmxvYidcbiAgICAgIH1cblxuICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgeGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgdmFsdWUpXG4gICAgICB9KVxuXG4gICAgICB4aHIuc2VuZCh0eXBlb2YgcmVxdWVzdC5fYm9keUluaXQgPT09ICd1bmRlZmluZWQnID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0KVxuICAgIH0pXG4gIH1cbiAgc2VsZi5mZXRjaC5wb2x5ZmlsbCA9IHRydWVcbn0pKCk7XG4iLCJjb25zdCBQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0pvdCcpO1xuXG5jbGFzcyBHcm91cFByZWZlcmVuY2VzIGV4dGVuZHMgUHJlZmVyZW5jZXMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fb3JkZXIgPSB0aGlzLmdldE9yZGVyKCk7XG4gIH1cblxuICBnZXRPcmRlcigpIHtcbiAgICBsZXQgb3JkZXIgPSB0aGlzLmdldEl0ZW0oJ29yZGVyJyk7XG5cbiAgICBpZiAoIW9yZGVyIHx8ICFvcmRlci50eXBlIHx8ICFvcmRlci5kaXJlY3Rpb24pIHtcbiAgICAgIG9yZGVyID0ge1xuICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX29yZGVyID0gb3JkZXI7XG5cbiAgICByZXR1cm4gb3JkZXI7XG4gIH1cblxuICBzZXRPcmRlcih0eXBlLCBkaXJlY3Rpb24pIHtcbiAgICB0aGlzLl9vcmRlci50eXBlID0gdHlwZTtcbiAgICB0aGlzLl9vcmRlci5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICB0aGlzLnNldEl0ZW0oJ29yZGVyJywgdGhpcy5fb3JkZXIpO1xuICB9XG5cbiAgb3JkZXIoam90cykge1xuICAgIHJldHVybiBKb3Qub3JkZXIoam90cywgdGhpcy5fb3JkZXIudHlwZSwgdGhpcy5fb3JkZXIuZGlyZWN0aW9uKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwUHJlZmVyZW5jZXM7XG4iLCJjb25zdCBQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZXMnKTtcblxuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi9tb2RlbHMvZ3JvdXAnKTtcblxuY2xhc3MgR3JvdXBzUHJlZmVyZW5jZXMgZXh0ZW5kcyBQcmVmZXJlbmNlcyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLl9vcmRlciA9IHRoaXMuZ2V0T3JkZXIoKTtcbiAgfVxuXG4gIGdldE9yZGVyKCkge1xuICAgIGxldCBvcmRlciA9IHRoaXMuZ2V0SXRlbSgnb3JkZXInKTtcblxuICAgIGlmICghb3JkZXIgfHwgIW9yZGVyLnR5cGUgfHwgIW9yZGVyLmRpcmVjdGlvbikge1xuICAgICAgb3JkZXIgPSB7XG4gICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5fb3JkZXIgPSBvcmRlcjtcblxuICAgIHJldHVybiBvcmRlcjtcbiAgfVxuXG4gIHNldE9yZGVyKHR5cGUsIGRpcmVjdGlvbikge1xuICAgIHRoaXMuX29yZGVyLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuX29yZGVyLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgIHRoaXMuc2V0SXRlbSgnb3JkZXInLCB0aGlzLl9vcmRlcik7XG4gIH1cblxuICBvcmRlcihncm91cHMpIHtcbiAgICByZXR1cm4gR3JvdXAub3JkZXIoZ3JvdXBzLCB0aGlzLl9vcmRlci50eXBlLCB0aGlzLl9vcmRlci5kaXJlY3Rpb24pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JvdXBzUHJlZmVyZW5jZXM7XG4iLCJjb25zdCBQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0pvdCcpO1xuXG5jbGFzcyBKb3RzUHJlZmVyZW5jZXMgZXh0ZW5kcyBQcmVmZXJlbmNlcyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLl9vcmRlciA9IHRoaXMuZ2V0T3JkZXIoKTtcbiAgfVxuXG4gIGdldE9yZGVyKCkge1xuICAgIGxldCBvcmRlciA9IHRoaXMuZ2V0SXRlbSgnb3JkZXInKTtcblxuICAgIGlmICghb3JkZXIgfHwgIW9yZGVyLnR5cGUgfHwgIW9yZGVyLmRpcmVjdGlvbikge1xuICAgICAgb3JkZXIgPSB7XG4gICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5fb3JkZXIgPSBvcmRlcjtcblxuICAgIHJldHVybiBvcmRlcjtcbiAgfVxuXG4gIHNldE9yZGVyKHR5cGUsIGRpcmVjdGlvbikge1xuICAgIHRoaXMuX29yZGVyLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuX29yZGVyLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgIHRoaXMuc2V0SXRlbSgnb3JkZXInLCB0aGlzLl9vcmRlcik7XG4gIH1cblxuICBvcmRlcihqb3RzKSB7XG4gICAgcmV0dXJuIEpvdC5vcmRlcihqb3RzLCB0aGlzLl9vcmRlci50eXBlLCB0aGlzLl9vcmRlci5kaXJlY3Rpb24pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSm90c1ByZWZlcmVuY2VzO1xuIiwiY2xhc3MgUHJlZmVyZW5jZXMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBpZiAobG9jYWxTdG9yYWdlKSB7XG4gICAgICB0aGlzLl9zdG9yYWdlID0gbG9jYWxTdG9yYWdlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdG9yYWdlID0ge1xuICAgICAgICBmaWVsZHM6IHt9LFxuXG4gICAgICAgIGdldEl0ZW06IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5maWVsZHNbbmFtZV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0SXRlbTogZnVuY3Rpb24obmFtZSwgaXRlbSkge1xuICAgICAgICAgIHRoaXMuZmllbGRzW25hbWVdID0gaXRlbTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLl9rZXkgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIGdldEl0ZW0obmFtZSkge1xuICAgIGxldCBwcmVmcyA9IHRoaXMuX3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLl9rZXkpO1xuXG4gICAgaWYgKHByZWZzKSB7XG4gICAgICBwcmVmcyA9IEpTT04ucGFyc2UocHJlZnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmcyA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiBwcmVmcy5uYW1lO1xuICB9XG5cbiAgc2V0SXRlbShuYW1lLCBpdGVtKSB7XG4gICAgbGV0IHByZWZzID0gdGhpcy5fc3RvcmFnZS5nZXRJdGVtKHRoaXMuX2tleSk7XG5cbiAgICBpZiAocHJlZnMpIHtcbiAgICAgIHByZWZzID0gSlNPTi5wYXJzZShwcmVmcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZWZzID0ge307XG4gICAgfVxuXG4gICAgcHJlZnMubmFtZSA9IGl0ZW07XG5cbiAgICB0aGlzLl9zdG9yYWdlLnNldEl0ZW0odGhpcy5fa2V5LCBKU09OLnN0cmluZ2lmeShwcmVmcykpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJlZmVyZW5jZXM7XG4iLCJpZiAod2luZG93Lm9wZXJhbWluaSkge1xuICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoJ29wZXJhbWluaScpO1xufVxuXG4vLyBjdXR0aW5nIHRoZSBvbCcgbXVzdGFyZCBsaWtlIGEgcHJvXG5pZiAoJ3Zpc2liaWxpdHlTdGF0ZScgaW4gZG9jdW1lbnQpIHtcbiAgaWYgKG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyKSB7XG4gICAgbmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIucmVnaXN0ZXIoJy9zZXJ2aWNld29ya2VyLmpzJywge1xuICAgICAgc2NvcGU6ICcvJyxcbiAgICB9KS50aGVuKHJlZyA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnU1cgcmVnaXN0ZXIgc3VjY2VzcycsIHJlZyk7XG4gICAgfSwgZXJyID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdTVyByZWdpc3RlciBmYWlsJywgZXJyKTtcbiAgICB9KTtcbiAgfVxuXG4gIGlmICghd2luZG93LmZldGNoKSB7XG4gICAgcmVxdWlyZSgnd2hhdHdnLWZldGNoJyk7XG4gIH1cblxuICBmZXRjaCgnL2F1dGgvdXNlcicsIHtcbiAgICBjcmVkZW50aWFsczogJ3NhbWUtb3JpZ2luJyxcbiAgfSkudGhlbihyZXNwb25zZSA9PiB7XG4gICAgcmV0dXJuIHJlc3BvbnNlLmpzb24oKTtcbiAgfSkudGhlbihqc29uID0+IHtcbiAgICBKb3RBcHAudXNlciA9IGpzb247XG5cbiAgICBpZiAoSm90QXBwLnVzZXIgIT09IGZhbHNlKSB7XG4gICAgICBpZiAoSm90QXBwLnVzZXIuY3JlZGVudGlhbHMpIHtcbiAgICAgICAgcmVxdWlyZSgnLi4vLi4vZGIvZGInKSh7XG4gICAgICAgICAgcHJvdG9jb2w6IEpvdEFwcC5zZXJ2ZXIucHJvdG9jb2wsXG4gICAgICAgICAgZG9tYWluOiBKb3RBcHAuc2VydmVyLmRvbWFpbixcbiAgICAgICAgICB1c2VybmFtZTogSm90QXBwLnVzZXIuY3JlZGVudGlhbHMua2V5LFxuICAgICAgICAgIHBhc3N3b3JkOiBKb3RBcHAudXNlci5jcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgICAgICBkYk5hbWU6ICdqb3QtJyArIEpvdEFwcC51c2VyLl9pZCxcbiAgICAgICAgfSk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdqb3QtdXNlcicsIEpTT04uc3RyaW5naWZ5KEpvdEFwcC51c2VyKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBsb2NhbFVzZXIgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnam90LXVzZXInKTtcblxuICAgICAgICBpZiAobG9jYWxVc2VyKSB7XG4gICAgICAgICAgSm90QXBwLnVzZXIgPSBKU09OLnBhcnNlKGxvY2FsVXNlcik7XG4gICAgICAgICAgaWYgKEpvdEFwcC51c2VyKSB7XG4gICAgICAgICAgICByZXF1aXJlKCcuLi8uLi9kYi9kYicpKHtcbiAgICAgICAgICAgICAgcHJvdG9jb2w6IEpvdEFwcC5zZXJ2ZXIucHJvdG9jb2wsXG4gICAgICAgICAgICAgIGRvbWFpbjogSm90QXBwLnNlcnZlci5kb21haW4sXG4gICAgICAgICAgICAgIHVzZXJuYW1lOiBKb3RBcHAudXNlci5jcmVkZW50aWFscy5rZXksXG4gICAgICAgICAgICAgIHBhc3N3b3JkOiBKb3RBcHAudXNlci5jcmVkZW50aWFscy5wYXNzd29yZCxcbiAgICAgICAgICAgICAgZGJOYW1lOiAnam90LScgKyBKb3RBcHAudXNlci5faWQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmVxdWlyZSgnLi4vLi4vZGIvZGInKSh7XG4gICAgICAgICAgICAgIGRiTmFtZTogJ2pvdC1sb2NhbCcsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmVxdWlyZSgnLi4vLi4vZGIvZGInKSh7XG4gICAgICAgICAgICBkYk5hbWU6ICdqb3QtbG9jYWwnLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdqb3QtdXNlcicsIEpTT04uc3RyaW5naWZ5KGZhbHNlKSk7XG4gICAgICByZXF1aXJlKCcuLi8uLi9kYi9kYicpKHtcbiAgICAgICAgZGJOYW1lOiAnam90LWxvY2FsJyxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGF0dGFjaEZhc3RDbGljayA9IHJlcXVpcmUoJ2Zhc3RjbGljaycpO1xuXG4gICAgY29uc3QgVmlld0NvbnRhaW5lciA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL3ZpZXctY29udGFpbmVyJyk7XG5cbiAgICBjb25zdCByb3V0ZXIgPSByZXF1aXJlKCcuLi8uLi9yb3V0ZXJzL3BhdGgnKTtcblxuICAgIGNvbnN0IFJvdXRlc0hvbWUgPSByZXF1aXJlKCcuLi8uLi9yb3V0ZXMvY2xpZW50L2hvbWUnKTtcbiAgICBjb25zdCBSb3V0ZXNBdXRoID0gcmVxdWlyZSgnLi4vLi4vcm91dGVzL2NsaWVudC9hdXRoJyk7XG4gICAgY29uc3QgUm91dGVzSm90ID0gcmVxdWlyZSgnLi4vLi4vcm91dGVzL2NsaWVudC9qb3QnKTtcbiAgICBjb25zdCBSb3V0ZXNHcm91cCA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcy9jbGllbnQvZ3JvdXAnKTtcblxuICAgIGNvbnN0IFRpdGxlQmFyVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL3RpdGxlYmFyJyk7XG4gICAgY29uc3QgTm90aWZpY2F0aW9uTWFuYWdlclZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy9ub3RpZmljYXRpb24tbWFuYWdlcicpO1xuXG4gICAgY29uc3QgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMvZGlzdC9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcbiAgICBjb25zdCBoZWxwZXJzID0gcmVxdWlyZSgnLi4vLi4vdGVtcGxhdGVzL2hlbHBlcnMnKTtcblxuICAgIGF0dGFjaEZhc3RDbGljayhkb2N1bWVudC5ib2R5KTtcblxuICAgIGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5rZXlzKEpvdEFwcC50ZW1wbGF0ZXMpKSB7XG4gICAgICBIYW5kbGViYXJzLnJlZ2lzdGVyUGFydGlhbChrZXksIEhhbmRsZWJhcnMudGVtcGxhdGUoSm90QXBwLnRlbXBsYXRlc1trZXldKSk7XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBoZWxwZXIgaW4gaGVscGVycykge1xuICAgICAgaWYgKGhlbHBlcnMuaGFzT3duUHJvcGVydHkoaGVscGVyKSkge1xuICAgICAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKGhlbHBlciwgaGVscGVyc1toZWxwZXJdKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBjb250YWluZXJNYWluID0gbmV3IFZpZXdDb250YWluZXIoJ3ZpZXcnLCB7XG4gICAgICBob21lOiBKb3RBcHAudGVtcGxhdGVzLmhvbWUsXG4gICAgICBncm91cDogSm90QXBwLnRlbXBsYXRlcy5ncm91cCxcbiAgICAgIGdyb3VwczogSm90QXBwLnRlbXBsYXRlcy5ncm91cHMsXG4gICAgICBqb3RzOiBKb3RBcHAudGVtcGxhdGVzLmpvdHMsXG4gICAgICBsb2FkaW5nOiBKb3RBcHAudGVtcGxhdGVzLmxvYWRpbmcsXG4gICAgICBsb2FkaW5nZ3JvdXBzOiBKb3RBcHAudGVtcGxhdGVzLmxvYWRpbmdncm91cHMsXG4gICAgICBpbXBvcnQ6IEpvdEFwcC50ZW1wbGF0ZXMuaW1wb3J0LFxuICAgIH0sIHtcbiAgICAgICdncm91cC1saXN0JzogSm90QXBwLnRlbXBsYXRlc1snZ3JvdXAtbGlzdCddLFxuICAgICAgJ2pvdC1saXN0JzogSm90QXBwLnRlbXBsYXRlc1snam90LWxpc3QnXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHJvdXRlc0hvbWUgPSBuZXcgUm91dGVzSG9tZShyb3V0ZXIsICcvJywgY29udGFpbmVyTWFpbik7XG4gICAgY29uc3Qgcm91dGVzQXV0aCA9IG5ldyBSb3V0ZXNBdXRoKHJvdXRlciwgJy9hdXRoJywgY29udGFpbmVyTWFpbik7XG4gICAgY29uc3Qgcm91dGVzSm90ID0gbmV3IFJvdXRlc0pvdChyb3V0ZXIsICcvam90JywgY29udGFpbmVyTWFpbik7XG4gICAgY29uc3Qgcm91dGVzR3JvdXAgPSBuZXcgUm91dGVzR3JvdXAocm91dGVyLCAnL2dyb3VwJywgY29udGFpbmVyTWFpbik7XG5cbiAgICByb3V0ZXNIb21lLnJlZ2lzdGVyUm91dGVzKCk7XG4gICAgcm91dGVzQXV0aC5yZWdpc3RlclJvdXRlcygpO1xuICAgIHJvdXRlc0pvdC5yZWdpc3RlclJvdXRlcygpO1xuICAgIHJvdXRlc0dyb3VwLnJlZ2lzdGVyUm91dGVzKCk7XG5cbiAgICBjb25zdCBjb250YWluZXJIZWFkZXIgPSBuZXcgVmlld0NvbnRhaW5lcignaGVhZGVyJywge1xuICAgICAgdGl0bGViYXI6IEpvdEFwcC50ZW1wbGF0ZXMudGl0bGViYXIsXG4gICAgfSwge1xuICAgICAgJ3RpdGxlYmFyLXRpdGxlJzogSm90QXBwLnRlbXBsYXRlc1sndGl0bGViYXItdGl0bGUnXSxcbiAgICAgICd0aXRsZWJhci10YWJzJzogSm90QXBwLnRlbXBsYXRlc1sndGl0bGViYXItdGFicyddLFxuICAgICAgJ2xpc3Qtb3JkZXInOiBKb3RBcHAudGVtcGxhdGVzWydsaXN0LW9yZGVyJ10sXG4gICAgfSk7XG5cbiAgICBjb25zdCB0aXRsZUJhciA9IG5ldyBUaXRsZUJhclZpZXcoY29udGFpbmVySGVhZGVyKTtcblxuICAgIHRpdGxlQmFyLnJlbmRlcihmYWxzZSwge1xuICAgICAgdXNlcjogSm90QXBwLnVzZXIsXG4gICAgfSk7XG5cbiAgICBjb25zdCBjb250YWluZXJOb3RpZmljYXRpb25zID0gbmV3IFZpZXdDb250YWluZXIoJ25vdGlmaWNhdGlvbnMnLCB7XG4gICAgICBub3RpZmljYXRpb25zOiBKb3RBcHAudGVtcGxhdGVzLm5vdGlmaWNhdGlvbnMsXG4gICAgfSwge1xuICAgICAgbm90aWZpY2F0aW9uOiBKb3RBcHAudGVtcGxhdGVzLm5vdGlmaWNhdGlvbixcbiAgICB9KTtcblxuICAgIGNvbnN0IG5vdGlmaWNhdGlvbk1hbmFnZXIgPSBuZXcgTm90aWZpY2F0aW9uTWFuYWdlclZpZXcoY29udGFpbmVyTm90aWZpY2F0aW9ucyk7XG5cbiAgICBub3RpZmljYXRpb25NYW5hZ2VyLnJlbmRlcih0cnVlKTtcblxuICAgIHJvdXRlci5hY3RpdmF0ZSgpO1xuICB9KS5jYXRjaChleCA9PiB7XG4gICAgY29uc29sZS5sb2coJ3NvbWV0aGluZyB3ZW50IHdyb25nIHdpdGggYXV0aC91c2VyJywgZXgpO1xuICB9KTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICBwYWdlKCk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcbiAgICAgIHBhZ2UocGF0aCwgY2FsbGJhY2spO1xuICAgIH0sXG5cbiAgICBnbzogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgcGFnZShwYXRoKTtcbiAgICB9LFxuXG4gICAgYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAod2luZG93Lmhpc3RvcnkubGVuZ3RoKSB7XG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhZ2UoJy8nKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgcGFnZS5zdG9wKCk7XG4gICAgICBpZiAocGF0aCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBwYXRoO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxufSkoKTtcbiIsImNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNsYXNzIEF1dGhSb3V0ZXMgZXh0ZW5kcyBSb3V0ZXMge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCA9ICcnKSB7XG4gICAgc3VwZXIocm91dGVyLCBwcmVmaXgpO1xuXG4gICAgdGhpcy5fcm91dGVzLmF1dGhHb29nbGUgPSB7XG4gICAgICBfcGF0aDogJy9nb29nbGUnLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgdGhpcy5fcm91dGVzLmNhbGxiYWNrR29vZ2xlID0ge1xuICAgICAgX3BhdGg6ICcvZ29vZ2xlL2NhbGxiYWNrJyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy5pbXBvcnQgPSB7XG4gICAgICBfcGF0aDogJy9pbXBvcnQnLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBHcm91cC5pbXBvcnRGcm9tTG9jYWwoKTtcbiAgICAgICAgfSk7XG4gICAgICB9LFxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMudXNlciA9IHtcbiAgICAgIF9wYXRoOiAnL3VzZXInLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgdGhpcy5fcm91dGVzLnNpZ25vdXQgPSB7XG4gICAgICBfcGF0aDogJy9zaWdub3V0JyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0sXG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhSb3V0ZXM7XG4iLCJjb25zdCBBdXRoUm91dGVzID0gcmVxdWlyZSgnLi4vYXV0aCcpO1xuY29uc3QgSW1wb3J0VmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2ltcG9ydCcpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi8uLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBBdXRoUm91dGVyIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXgsIHZpZXdDb250YWluZXIpIHtcbiAgICB0aGlzLl9kYiA9IHJlcXVpcmUoJy4uLy4uL2RiL2RiJykoKTtcblxuICAgIHRoaXMuX3JvdXRlciA9IHJvdXRlcjtcbiAgICB0aGlzLnJvdXRlcyA9IG5ldyBBdXRoUm91dGVzKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuaW1wb3J0VmlldyA9IG5ldyBJbXBvcnRWaWV3KHZpZXdDb250YWluZXIpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgnc2lnbm91dCcsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHt9LFxuXG4gICAgICAgICAgcmVzb2x2ZTogKCkgPT4ge1xuICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2pvdC11c2VyJywgZmFsc2UpO1xuICAgICAgICAgICAgdGhpcy5fZGIuZGVzdHJveSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIuc3RvcChjdHguY2Fub25pY2FsUGF0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVqZWN0OiAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJvdXRlcy5yZWdpc3RlclJvdXRlKCdpbXBvcnQnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7fSxcblxuICAgICAgICAgIHByZUFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3JvdXRlQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgICAgbmFtZTogJ0pvdCcsXG4gICAgICAgICAgICAgIG9yZGVyOiBbXSxcbiAgICAgICAgICAgICAgdGFiczogW3tcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvJyxcbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSm90cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9qb3QnLFxuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdMaXN0cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9ncm91cCcsXG4gICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChncm91cHMpID0+IHtcbiAgICAgICAgICAgIHRoaXMuaW1wb3J0Vmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgZ3JvdXBzLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0aFJvdXRlcjtcbiIsImNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uLy4uL21vZGVscy9qb3QnKTtcbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vLi4vbW9kZWxzL2dyb3VwJyk7XG5jb25zdCBHcm91cFJvdXRlcyA9IHJlcXVpcmUoJy4uL2dyb3VwJyk7XG5jb25zdCBHcm91cHNWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvZ3JvdXBzJyk7XG5jb25zdCBHcm91cFZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy9ncm91cCcpO1xuY29uc3QgTG9hZGluZ0dyb3Vwc1ZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy9sb2FkaW5nZ3JvdXBzJyk7XG5cbmNvbnN0IEdyb3Vwc1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vLi4vcHJlZmVyZW5jZXMvZ3JvdXBzJyk7XG5jb25zdCBHcm91cFByZWZlcmVuY2UgPSByZXF1aXJlKCcuLi8uLi9wcmVmZXJlbmNlcy9ncm91cCcpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi8uLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBHcm91cENsaWVudFJvdXRlcyB7XG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4LCB2aWV3Q29udGFpbmVyKSB7XG4gICAgdGhpcy5yb3V0ZXMgPSBuZXcgR3JvdXBSb3V0ZXMocm91dGVyLCBwcmVmaXgpO1xuXG4gICAgdGhpcy5ncm91cHNWaWV3ID0gbmV3IEdyb3Vwc1ZpZXcodmlld0NvbnRhaW5lcik7XG4gICAgdGhpcy5ncm91cFZpZXcgPSBuZXcgR3JvdXBWaWV3KHZpZXdDb250YWluZXIpO1xuICAgIHRoaXMubG9hZGluZ0dyb3Vwc1ZpZXcgPSBuZXcgTG9hZGluZ0dyb3Vwc1ZpZXcodmlld0NvbnRhaW5lcik7XG5cbiAgICB0aGlzLl9ncm91cHNQcmVmZXJlbmNlcyA9IG5ldyBHcm91cHNQcmVmZXJlbmNlcygpO1xuICAgIHRoaXMuX2dyb3VwUHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBQcmVmZXJlbmNlKCk7XG4gIH1cblxuICByZWdpc3RlclJvdXRlcygpIHtcbiAgICB0aGlzLnJvdXRlcy5yZWdpc3RlclJvdXRlKCdhbGwnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgICAgY29uc3QgcGFnZSA9IHtcbiAgICAgICAgICBuYW1lOiAnSm90J1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9yZGVyaW5nID0ge1xuICAgICAgICAgIG9yZGVyczogW3tcbiAgICAgICAgICAgIG5hbWU6ICdBbHBoYScsXG4gICAgICAgICAgICB0eXBlOiAnYWxwaGEnLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnYXNjJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdEYXRlJyxcbiAgICAgICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCB0YWJzID0gW3tcbiAgICAgICAgICB0aXRsZTogJ0hvbWUnLFxuICAgICAgICAgIGxpbms6ICcvJ1xuICAgICAgICB9LCB7XG4gICAgICAgICAgdGl0bGU6ICdKb3RzJyxcbiAgICAgICAgICBsaW5rOiAnL2pvdCdcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRpdGxlOiAnTGlzdHMnLFxuICAgICAgICAgIGxpbms6ICcvZ3JvdXAnLFxuICAgICAgICAgIGN1cnJlbnQ6IHRydWVcbiAgICAgICAgfV07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIG9yZGVyVHlwZTogdGhpcy5fZ3JvdXBzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgb3JkZXJEaXJlY3Rpb246IHRoaXMuX2dyb3Vwc1ByZWZlcmVuY2VzLmdldE9yZGVyKCkuZGlyZWN0aW9uXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHByZUFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3JvdXRlQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgICAgbmFtZTogcGFnZS5uYW1lLFxuICAgICAgICAgICAgICBvcmRlcmluZyxcbiAgICAgICAgICAgICAgY3VycmVudE9yZGVyaW5nOiB0aGlzLl9ncm91cHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLnR5cGUsXG4gICAgICAgICAgICAgIHRhYnNcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmxvYWRpbmdHcm91cHNWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBpdGVtczogWzAsIDAsIDAsIDAsIDAsIDAsIDBdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVzb2x2ZTogKGdyb3VwcykgPT4ge1xuICAgICAgICAgICAgdGhpcy5ncm91cHNWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBjb2xvdXJzOiBHcm91cC5nZXRDb2xvdXJzKCksXG4gICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLnJvdXRlcy5yZWdpc3RlclJvdXRlKCd2aWV3JywgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICBjb25zdCBvcmRlcmluZyA9IHtcbiAgICAgICAgICBvcmRlcnM6IFt7XG4gICAgICAgICAgICBuYW1lOiAnQWxwaGEnLFxuICAgICAgICAgICAgdHlwZTogJ2FscGhhJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2FzYydcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnRGF0ZScsXG4gICAgICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdQcmlvcml0eScsXG4gICAgICAgICAgICB0eXBlOiAncHJpb3JpdHknLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBpZDogY3R4LnBhcmFtcy5pZCxcbiAgICAgICAgICAgIGRvbmU6IGN0eC5wYXJhbXMuc3RhdHVzID09PSAnZG9uZScsXG4gICAgICAgICAgICBvcmRlclR5cGU6IHRoaXMuX2dyb3VwUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgb3JkZXJEaXJlY3Rpb246IHRoaXMuX2dyb3VwUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS5kaXJlY3Rpb24sXG5cbiAgICAgICAgICAgIHBvc3RMb2FkR3JvdXA6IChncm91cCkgPT4ge1xuXG4gICAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdyb3V0ZUNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgICAgbmFtZTogZ3JvdXAuZmllbGRzLm5hbWUsXG4gICAgICAgICAgICAgICAgb3JkZXJpbmcsXG4gICAgICAgICAgICAgICAgY3VycmVudE9yZGVyaW5nOiB0aGlzLl9ncm91cFByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgICAgICB0YWJzOiBbe1xuICAgICAgICAgICAgICAgICAgbGluazogJy9ncm91cC8nICsgZ3JvdXAuaWQsXG4gICAgICAgICAgICAgICAgICB0aXRsZTogJ3VuZG9uZScsXG4gICAgICAgICAgICAgICAgICBjdXJyZW50OiBjdHgucGFyYW1zLnN0YXR1cyAhPT0gJ2RvbmUnXG4gICAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgICAgbGluazogJy9ncm91cC8nICsgZ3JvdXAuaWQgKyAnL2RvbmUnLFxuICAgICAgICAgICAgICAgICAgdGl0bGU6ICdkb25lJyxcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN0eC5wYXJhbXMuc3RhdHVzID09PSAnZG9uZSdcbiAgICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVzb2x2ZTogKGdyb3VwKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBxdWVyeU9iamVjdCA9IHt9O1xuICAgICAgICAgICAgY3R4LnF1ZXJ5c3RyaW5nLnNwbGl0KCcmJykuZm9yRWFjaChiaXQgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB2YWxzID0gYml0LnNwbGl0KCc9Jyk7XG4gICAgICAgICAgICAgIHF1ZXJ5T2JqZWN0W3ZhbHNbMF1dID0gdmFsc1sxXTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmdyb3VwVmlldy5zZXRTaG93RG9uZShjdHgucGFyYW1zLnN0YXR1cyA9PT0gJ2RvbmUnKTtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBkb25lOiBjdHgucGFyYW1zLnN0YXR1cyA9PT0gJ2RvbmUnLFxuICAgICAgICAgICAgICBncm91cCxcbiAgICAgICAgICAgICAgZWRpdElEOiBxdWVyeU9iamVjdC5lZGl0LFxuICAgICAgICAgICAgICBwcmlvcml0aWVzOiBKb3QuZ2V0UHJpb3JpdGllcygpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVqZWN0OiAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwQ2xpZW50Um91dGVzO1xuIiwiY29uc3QgSG9tZVJvdXRlcyA9IHJlcXVpcmUoJy4uL2hvbWUnKTtcbmNvbnN0IEhvbWVWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvaG9tZScpO1xuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgSG9tZVJvdXRlciB7XG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4LCB2aWV3Q29udGFpbmVyKSB7XG4gICAgdGhpcy5yb3V0ZXMgPSBuZXcgSG9tZVJvdXRlcyhyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLmhvbWVWaWV3ID0gbmV3IEhvbWVWaWV3KHZpZXdDb250YWluZXIpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgnaG9tZScsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHt9LFxuXG4gICAgICAgICAgcHJlQWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgncm91dGVDaGFuZ2VkJywge1xuICAgICAgICAgICAgICBuYW1lOiAnSm90JyxcbiAgICAgICAgICAgICAgb3JkZXI6IFtdLFxuICAgICAgICAgICAgICB0YWJzOiBbe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgbGluazogJy8nLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHRydWVcbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSm90cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9qb3QnXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0xpc3RzJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2dyb3VwJ1xuICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuaG9tZVZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGxvYWRpbmc6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZXNvbHZlOiBzdGF0cyA9PiB7XG4gICAgICAgICAgICB0aGlzLmhvbWVWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBzdGF0c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIb21lUm91dGVyO1xuIiwiY29uc3QgSm90Um91dGVzID0gcmVxdWlyZSgnLi4vam90Jyk7XG5jb25zdCBKb3RzVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2pvdHMnKTtcbmNvbnN0IExvYWRpbmdWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvbG9hZGluZycpO1xuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY29uc3QgSm90c1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vLi4vcHJlZmVyZW5jZXMvam90cycpO1xuXG5jbGFzcyBKb3RDbGllbnRSb3V0ZXMge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCwgdmlld0NvbnRhaW5lcikge1xuICAgIHRoaXMucm91dGVzID0gbmV3IEpvdFJvdXRlcyhyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLmpvdHNWaWV3ID0gbmV3IEpvdHNWaWV3KHZpZXdDb250YWluZXIpO1xuICAgIHRoaXMubG9hZGluZ1ZpZXcgPSBuZXcgTG9hZGluZ1ZpZXcodmlld0NvbnRhaW5lcik7XG5cbiAgICB0aGlzLl9qb3RzUHJlZmVyZW5jZXMgPSBuZXcgSm90c1ByZWZlcmVuY2VzKCk7XG4gIH1cblxuICByZWdpc3RlclJvdXRlcygpIHtcblxuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ2FsbCcsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgcGFnZSA9IHtcbiAgICAgICAgICBuYW1lOiAnSm90J1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9yZGVyaW5nID0ge1xuICAgICAgICAgIG9yZGVyczogW3tcbiAgICAgICAgICAgIG5hbWU6ICdBbHBoYScsXG4gICAgICAgICAgICB0eXBlOiAnYWxwaGEnLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnYXNjJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdEYXRlJyxcbiAgICAgICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbmFtZTogJ1ByaW9yaXR5JyxcbiAgICAgICAgICAgIHR5cGU6ICdwcmlvcml0eScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGFicyA9IFt7XG4gICAgICAgICAgdGl0bGU6ICdIb21lJyxcbiAgICAgICAgICBsaW5rOiAnLydcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRpdGxlOiAnSm90cycsXG4gICAgICAgICAgbGluazogJy9qb3QnLFxuICAgICAgICAgIGN1cnJlbnQ6IHRydWVcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRpdGxlOiAnTGlzdHMnLFxuICAgICAgICAgIGxpbms6ICcvZ3JvdXAnXG4gICAgICAgIH1dO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBvcmRlclR5cGU6IHRoaXMuX2pvdHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLnR5cGUsXG4gICAgICAgICAgICBvcmRlckRpcmVjdGlvbjogdGhpcy5fam90c1ByZWZlcmVuY2VzLmdldE9yZGVyKCkuZGlyZWN0aW9uXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHByZUFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3JvdXRlQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgICAgbmFtZTogcGFnZS5uYW1lLFxuICAgICAgICAgICAgICBvcmRlcmluZyxcbiAgICAgICAgICAgICAgY3VycmVudE9yZGVyaW5nOiB0aGlzLl9qb3RzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgICB0YWJzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5sb2FkaW5nVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgaXRlbXM6IFswLCAwLCAwLCAwLCAwLCAwLCAwXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChqb3RzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmpvdHNWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBqb3RzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVqZWN0OiAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvdENsaWVudFJvdXRlcztcbiIsImNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNsYXNzIEdyb3VwUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBHcm91cC5sb2FkQWxsKHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy52aWV3ID0ge1xuICAgICAgX3BhdGg6ICcvOmlkLzpzdGF0dXM/JyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQsIHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbikudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgaWYgKHBhcmFtcy5wb3N0TG9hZEdyb3VwKSB7XG4gICAgICAgICAgICBwYXJhbXMucG9zdExvYWRHcm91cChncm91cCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXAuX2pvdHMgPSBncm91cC5nZXRKb3RzKHBhcmFtcy5kb25lKTtcbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBHcm91cCh7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBuYW1lOiBwYXJhbXMubmFtZSxcbiAgICAgICAgICAgIGNvbG91cjogcGFyYW1zLmNvbG91clxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLnJlbW92ZShwYXJhbXMuaWQpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy51cGRhdGUgPSB7XG4gICAgICBfcGF0aDogJy86aWQnLFxuICAgICAgX21ldGhvZDogWydwb3N0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICBpZiAocGFyYW1zLmFjdGlvbiAhPT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgZ3JvdXAuZmllbGRzID0gcGFyYW1zLmZpZWxkcztcblxuICAgICAgICAgICAgcmV0dXJuIGdyb3VwLnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUm91dGVzID0gcmVxdWlyZSgnLi9yb3V0ZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL2pvdCcpO1xuXG5jbGFzcyBIb21lUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5ob21lID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBKb3QuZ2V0UGVyY2VudGFnZURvbmUoKS50aGVuKHN0YXRzID0+IHtcbiAgICAgICAgICBjb25zdCBzZWdtZW50cyA9IHtcbiAgICAgICAgICAgIG9uZTogOTAsXG4gICAgICAgICAgICB0d286IDkwLFxuICAgICAgICAgICAgdGhyZWU6IDkwLFxuICAgICAgICAgICAgZm91cjogOTBcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gMjUpIHtcbiAgICAgICAgICAgIHNlZ21lbnRzLm9uZSA9IDkwIC0gKHN0YXRzLnBlcmNlbnQgLyAyNSkgKiA5MDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VnbWVudHMub25lID0gMDtcblxuICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNTApIHtcbiAgICAgICAgICAgICAgc2VnbWVudHMudHdvID0gOTAgLSAoKHN0YXRzLnBlcmNlbnQgLSAyNSkgLyAyNSkgKiA5MDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlZ21lbnRzLnR3byA9IDA7XG5cbiAgICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNzUpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy50aHJlZSA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNTApIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMudGhyZWUgPSAwO1xuXG4gICAgICAgICAgICAgICAgc2VnbWVudHMuZm91ciA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNzUpIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzdGF0cy5zZWdtZW50cyA9IHNlZ21lbnRzO1xuXG4gICAgICAgICAgaWYgKHN0YXRzLm51bUdyb3VwcyA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHBsdXJhbCA9IHN0YXRzLm51bUdyb3VwcyA9PT0gMSA/ICcnIDogJ3MnO1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9IGAke3N0YXRzLnBlcmNlbnR9JSBkb25lIGluICR7c3RhdHMubnVtR3JvdXBzfSBsaXN0JHtwbHVyYWx9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9ICdObyBsaXN0cy4gQWRkIG9uZSBub3cnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBzdGF0cztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWVSb3V0ZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcblxuY2xhc3MgSm90Um91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBKb3QubG9hZEFsbCh0cnVlLCBwYXJhbXMub3JkZXJUeXBlLCBwYXJhbXMub3JkZXJEaXJlY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBKb3Qoe1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgY29udGVudDogcGFyYW1zLmNvbnRlbnQsXG4gICAgICAgICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHBhcmFtcy5wcmlvcml0eVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5yZW1vdmUocGFyYW1zLmlkKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMudXBkYXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5sb2FkKHBhcmFtcy5pZCkudGhlbihqb3QgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEZpZWxkcyA9IGpvdC5maWVsZHM7XG5cbiAgICAgICAgICAgIGpvdC5maWVsZHMgPSBwYXJhbXMuZmllbGRzO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcy5maWVsZHMuZG9uZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgam90LmZpZWxkcy5kb25lID0gY3VycmVudEZpZWxkcy5kb25lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gam90LnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3RSb3V0ZXM7XG4iLCJjbGFzcyBSb3V0ZXMge1xuXG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4ID0gJycpIHtcbiAgICB0aGlzLl9yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5fcHJlZml4ID0gcHJlZml4O1xuXG4gICAgdGhpcy5fcm91dGVzID0ge307XG4gIH1cblxuICByZWdpc3RlclJvdXRlKG5hbWUsIGNvbmZpZykge1xuICAgIGNvbnN0IHJvdXRlID0gdGhpcy5fcm91dGVzW25hbWVdO1xuICAgIHJvdXRlLl9tZXRob2QuZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgdGhpcy5fcm91dGVyW21ldGhvZF0odGhpcy5fcHJlZml4ICsgcm91dGUuX3BhdGgsICguLi5wYXJhbXMpID0+IHtcbiAgICAgICAgY29uZmlnKC4uLnBhcmFtcykudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQucHJlQWN0aW9uKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5wcmVBY3Rpb24oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJvdXRlLl9hY3Rpb24ocmVzdWx0LnBhcmFtcylcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdC5yZXNvbHZlKTtcbiAgICAgICAgICB9KS5jYXRjaChyZXN1bHQucmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgQXV0b2xpbmtlciA9IHJlcXVpcmUoJ2F1dG9saW5rZXInKTtcblxuY29uc3QgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMvZGlzdC9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcblxuZnVuY3Rpb24gaWZFcXVhbChjb25kaXRpb25hbCwgZXF1YWxUbywgb3B0aW9ucykge1xuICBpZiAoY29uZGl0aW9uYWwgPT09IGVxdWFsVG8pIHtcbiAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcbiAgfVxuXG4gIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG59XG5cbmZ1bmN0aW9uIGlmTm90RXF1YWwoY29uZGl0aW9uYWwsIGVxdWFsVG8sIG9wdGlvbnMpIHtcbiAgaWYgKGNvbmRpdGlvbmFsICE9PSBlcXVhbFRvKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpZkluKGVsZW0sIGFyciwgb3B0aW9ucykge1xuICBpZiAoYXJyLmluZGV4T2YoZWxlbSkgPiAtMSkge1xuICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbn1cblxuZnVuY3Rpb24gYXV0b0xpbmsoZWxlbSwgb3B0aW9ucykge1xuICBjb25zdCB1cmwgPSBBdXRvbGlua2VyLmxpbmsoSGFuZGxlYmFycy5lc2NhcGVFeHByZXNzaW9uKGVsZW0pKTtcblxuICByZXR1cm4gbmV3IEhhbmRsZWJhcnMuU2FmZVN0cmluZyh1cmwpO1xufVxuXG5leHBvcnRzLmlmRXF1YWwgPSBpZkVxdWFsO1xuZXhwb3J0cy5pZk5vdEVxdWFsID0gaWZOb3RFcXVhbDtcbmV4cG9ydHMuaWZJbiA9IGlmSW47XG5leHBvcnRzLmF1dG9MaW5rID0gYXV0b0xpbms7XG4iLCJjbGFzcyBEYXRlVXRpbHMge1xuXG4gIHN0YXRpYyBnZXREYXlzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnU3VuJyxcbiAgICAgICdNb24nLFxuICAgICAgJ1R1ZScsXG4gICAgICAnV2VkJyxcbiAgICAgICdUaHUnLFxuICAgICAgJ0ZyaScsXG4gICAgICAnU2F0J1xuICAgIF07XG4gIH1cblxuICBzdGF0aWMgZ2V0TW9udGhzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnSmFuJyxcbiAgICAgICdGZWInLFxuICAgICAgJ01hcicsXG4gICAgICAnQXByJyxcbiAgICAgICdNYXknLFxuICAgICAgJ0p1bicsXG4gICAgICAnSnVsJyxcbiAgICAgICdBdWcnLFxuICAgICAgJ1NlcCcsXG4gICAgICAnT2N0JyxcbiAgICAgICdOb3YnLFxuICAgICAgJ0RlYydcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGZvcm1hdChkYXRlKSB7XG4gICAgY29uc3QgZGF5ID0gZGF0ZS5nZXREYXkoKTtcbiAgICBjb25zdCBkYXlOdW0gPSBkYXRlLmdldERhdGUoKTtcbiAgICBjb25zdCBtb250aE51bSA9IGRhdGUuZ2V0TW9udGgoKTtcbiAgICBjb25zdCBtaW51dGVzID0gdGhpcy5fcGFkKGRhdGUuZ2V0TWludXRlcygpLCAyKTtcbiAgICBjb25zdCBob3VycyA9IHRoaXMuX3BhZChkYXRlLmdldEhvdXJzKCksIDIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF5cygpW2RheV0gKyAnICcgKyBkYXlOdW0gKyAnICcgKyB0aGlzLmdldE1vbnRocygpW21vbnRoTnVtXSArICcgJyArIGhvdXJzICsgJzonICsgbWludXRlcztcbiAgfVxuXG4gIHN0YXRpYyBfcGFkKG51bSwgc2l6ZSkge1xuICAgIGNvbnN0IHMgPSAnMDAwMDAwMDAwJyArIG51bTtcbiAgICByZXR1cm4gcy5zdWJzdHIocy5sZW5ndGggLSBzaXplKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGVVdGlscztcbiIsImNsYXNzIFB1YlN1YiB7XG4gIC8vYmFzZWQgb24gcHVic3ViIGltcGxlbWVudGF0aW9uIGF0IGh0dHA6Ly9hZGR5b3NtYW5pLmNvbS9yZXNvdXJjZXMvZXNzZW50aWFsanNkZXNpZ25wYXR0ZXJucy9ib29rLyNvYnNlcnZlcnBhdHRlcm5qYXZhc2NyaXB0XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gU3RvcmFnZSBmb3IgdG9waWNzIHRoYXQgY2FuIGJlIGJyb2FkY2FzdFxuICAgIC8vIG9yIGxpc3RlbmVkIHRvXG4gICAgdGhpcy5fdG9waWNzID0ge307XG5cbiAgICAvLyBBbiB0b3BpYyBpZGVudGlmaWVyXG4gICAgdGhpcy5fc3ViVWlkID0gLTE7XG4gIH1cblxuICAvLyBQdWJsaXNoIG9yIGJyb2FkY2FzdCBldmVudHMgb2YgaW50ZXJlc3RcbiAgLy8gd2l0aCBhIHNwZWNpZmljIHRvcGljIG5hbWUgYW5kIGFyZ3VtZW50c1xuICAvLyBzdWNoIGFzIHRoZSBkYXRhIHRvIHBhc3MgYWxvbmdcbiAgcHVibGlzaCh0b3BpYywgYXJncykge1xuICAgIGlmICghdGhpcy5fdG9waWNzW3RvcGljXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBzdWJzY3JpYmVycyA9IHRoaXMuX3RvcGljc1t0b3BpY107XG4gICAgdmFyIGxlbiA9IHN1YnNjcmliZXJzID8gc3Vic2NyaWJlcnMubGVuZ3RoIDogMDtcblxuICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgc3Vic2NyaWJlcnNbbGVuXS5mdW5jKHRvcGljLCBhcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFN1YnNjcmliZSB0byBldmVudHMgb2YgaW50ZXJlc3RcbiAgLy8gd2l0aCBhIHNwZWNpZmljIHRvcGljIG5hbWUgYW5kIGFcbiAgLy8gY2FsbGJhY2sgZnVuY3Rpb24sIHRvIGJlIGV4ZWN1dGVkXG4gIC8vIHdoZW4gdGhlIHRvcGljL2V2ZW50IGlzIG9ic2VydmVkXG4gIHN1YnNjcmliZSh0b3BpYywgZnVuYykge1xuICAgIGlmICghdGhpcy5fdG9waWNzW3RvcGljXSkge1xuICAgICAgdGhpcy5fdG9waWNzW3RvcGljXSA9IFtdO1xuICAgIH1cblxuICAgIHZhciB0b2tlbiA9ICgrK3RoaXMuX3N1YlVpZCkudG9TdHJpbmcoKTtcbiAgICB0aGlzLl90b3BpY3NbdG9waWNdLnB1c2goe1xuICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgZnVuYzogZnVuY1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgLy8gVW5zdWJzY3JpYmUgZnJvbSBhIHNwZWNpZmljXG4gIC8vIHRvcGljLCBiYXNlZCBvbiBhIHRva2VuaXplZCByZWZlcmVuY2VcbiAgLy8gdG8gdGhlIHN1YnNjcmlwdGlvblxuICB1bnN1YnNjcmliZSh0b2tlbikge1xuICAgIGZvciAodmFyIG0gaW4gdGhpcy5fdG9waWNzKSB7XG4gICAgICBpZiAodGhpcy5fdG9waWNzW21dKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gdGhpcy5fdG9waWNzW21dLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgIGlmICh0aGlzLl90b3BpY3NbbV1baV0udG9rZW4gPT09IHRva2VuKSB7XG4gICAgICAgICAgICB0aGlzLl90b3BpY3NbbV0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFB1YlN1YigpO1xuIiwiY2xhc3MgVG91Y2gge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgdGhpcy5fZWxlbWVudCA9IGVsZW1lbnQgfHwgbnVsbDtcblxuICAgIHRoaXMuX3hEb3duID0gbnVsbDtcbiAgICB0aGlzLl95RG93biA9IG51bGw7XG5cbiAgICB0aGlzLl9yZWdpc3RlcmVkID0ge1xuICAgICAgbGVmdDogW10sXG4gICAgICByaWdodDogW10sXG4gICAgICB1cDogW10sXG4gICAgICBkb3duOiBbXVxuICAgIH07XG5cbiAgICB0aGlzLmhhbmRsZVRvdWNoU3RhcnQgPSB0aGlzLmhhbmRsZVRvdWNoU3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZVRvdWNoTW92ZSA9IHRoaXMuaGFuZGxlVG91Y2hNb3ZlLmJpbmQodGhpcyk7XG4gIH1cblxuICBzZXRFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB0aGlzLmRlc3Ryb3koKTtcblxuICAgIHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5oYW5kbGVUb3VjaFN0YXJ0LCBmYWxzZSk7XG4gICAgdGhpcy5fZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLmhhbmRsZVRvdWNoTW92ZSwgZmFsc2UpO1xuICB9XG5cbiAgcmVnaXN0ZXIoZGlyZWN0aW9uLCBmbikge1xuICAgIHRoaXMuX3JlZ2lzdGVyZWRbZGlyZWN0aW9uXS5wdXNoKGZuKTtcbiAgfVxuXG4gIGhhbmRsZVRvdWNoU3RhcnQoZXZ0KSB7XG4gICAgdGhpcy5feERvd24gPSBldnQudG91Y2hlc1swXS5jbGllbnRYO1xuICAgIHRoaXMuX3lEb3duID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgfVxuXG4gIGhhbmRsZVRvdWNoTW92ZShldnQpIHtcbiAgICBpZiAoICEgdGhpcy5feERvd24gfHwgISB0aGlzLl95RG93biApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB4VXAgPSBldnQudG91Y2hlc1swXS5jbGllbnRYO1xuICAgIHZhciB5VXAgPSBldnQudG91Y2hlc1swXS5jbGllbnRZO1xuXG4gICAgdmFyIHhEaWZmID0gdGhpcy5feERvd24gLSB4VXA7XG4gICAgdmFyIHlEaWZmID0gdGhpcy5feURvd24gLSB5VXA7XG5cbiAgICBpZiAoIE1hdGguYWJzKCB4RGlmZiApID4gTWF0aC5hYnMoIHlEaWZmICkgKSB7XG4gICAgICAgIGlmICggeERpZmYgPiAwICkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJlZC5sZWZ0LmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlcmVkLnJpZ2h0LmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIHlEaWZmID4gMCApIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWQudXAuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWQuZG93bi5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5feERvd24gPSBudWxsO1xuICAgIHRoaXMuX3lEb3duID0gbnVsbDtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2VsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuaGFuZGxlVG91Y2hTdGFydCwgZmFsc2UpO1xuICAgICAgdGhpcy5fZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLmhhbmRsZVRvdWNoTW92ZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIHRoaXMuX2VsZW1lbnQgPSBudWxsO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVG91Y2g7XG4iLCJjb25zdCBXaWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpO1xuXG5jbGFzcyBDb2xvdXJTZWxlY3RvciBleHRlbmRzIFdpZGdldCB7XG4gIGluaXRFdmVudHMoZWwpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICBjb25zdCB3aWRnZXRzID0gZWwucXVlcnlTZWxlY3RvckFsbCgnLnBhcnRpYWwtY29sb3VyLXNlbGVjdG9yJyk7XG4gICAgZm9yIChsZXQgd2lkZ2V0IG9mIHdpZGdldHMpIHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB3aWRnZXQucXVlcnlTZWxlY3RvckFsbCgnLmNvbG91ci1zZWxlY3Rvcl9fY29sb3VyJyk7XG4gICAgICBjb25zdCBzZWxlY3QgPSB3aWRnZXQucXVlcnlTZWxlY3Rvcignc2VsZWN0Jyk7XG5cbiAgICAgIGZvciAobGV0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKG9wdGlvbnMpO1xuICAgICAgICAgIG9wdGlvbi5jbGFzc0xpc3QuYWRkKCdjb2xvdXItc2VsZWN0b3JfX2NvbG91ci0tY3VycmVudCcpO1xuICAgICAgICAgIHNlbGVjdC52YWx1ZSA9IG9wdGlvbi5kYXRhc2V0LnZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1bnNlbGVjdEFsbChvcHRpb25zKSB7XG4gICAgZm9yIChsZXQgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbi5jbGFzc0xpc3QucmVtb3ZlKCdjb2xvdXItc2VsZWN0b3JfX2NvbG91ci0tY3VycmVudCcpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG91clNlbGVjdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNvbnN0IEdyb3VwUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi9wcmVmZXJlbmNlcy9ncm91cCcpO1xuXG5jb25zdCBDb2xvdXJTZWxlY3RvcldpZGdldCA9IHJlcXVpcmUoJy4vY29sb3VyLXNlbGVjdG9yJyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIFZpZXdHcm91cCBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICBzdXBlcihjb250YWluZXIpO1xuXG4gICAgdGhpcy5yZWdpc3RlcldpZGdldChDb2xvdXJTZWxlY3RvcldpZGdldCk7XG5cbiAgICB0aGlzLl9zaG93RG9uZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fcHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBQcmVmZXJlbmNlcygpO1xuICB9XG5cbiAgc2V0U2hvd0RvbmUoZG9uZSkge1xuICAgIHRoaXMuX3Nob3dEb25lID0gZG9uZTtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3VwZGF0ZScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MuY2hhbmdlcyAmJiBhcmdzLmNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIEdyb3VwLmxvYWQocGFyYW1zLmdyb3VwLmlkKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2pvdC1saXN0Jywge1xuICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ29yZGVyQ2hhbmdlZCcsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgdGhpcy5fcHJlZmVyZW5jZXMuc2V0T3JkZXIoYXJncy50eXBlLCBhcmdzLmRpcmVjdGlvbik7XG5cbiAgICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMubGFzdFBhcmFtcztcbiAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCBwYXJhbXMpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuX2FkZERvY3VtZW50TGlzdGVuZXIoJ3Vuc2VsZWN0QWxsJywgJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2pvdC1saXN0JzpcbiAgICAgICAgcGFyYW1zLmpvdHMgPSBwYXJhbXMuZ3JvdXAuZ2V0Sm90cyh0aGlzLl9zaG93RG9uZSk7XG4gICAgICAgIHBhcmFtcy5qb3RzID0gdGhpcy5fcHJlZmVyZW5jZXMub3JkZXIocGFyYW1zLmpvdHMpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBlbCA9IHN1cGVyLnJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKTtcblxuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgY2FzZSAnam90LWxpc3QnOlxuICAgICAgICB0aGlzLmluaXRFZGl0KCk7XG4gICAgICAgIHRoaXMuaW5pdERlbGV0ZUZvcm1zKCk7XG4gICAgICAgIHRoaXMuaW5pdFVwZGF0ZUZvcm1zKCk7XG4gICAgICAgIHRoaXMuaW5pdFdpZGdldHMoZWwpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpbml0RXZlbnRzKCkge1xuICAgIHN1cGVyLmluaXRFdmVudHMoKTtcblxuICAgIHRoaXMuaW5pdEFkZEZvcm0oKTtcbiAgICB0aGlzLmluaXRFZGl0KCk7XG4gICAgdGhpcy5pbml0RGVsZXRlRm9ybXMoKTtcbiAgICB0aGlzLmluaXRVcGRhdGVGb3JtcygpO1xuICB9XG5cbiAgaW5pdEFkZEZvcm0oKSB7XG4gICAgY29uc3QgZm9ybSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5mb3JtLWpvdC1hZGQnKTtcbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnRGaWVsZCA9IGZvcm0uZWxlbWVudHMuY29udGVudDtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBjb250ZW50RmllbGQudmFsdWU7XG5cbiAgICAgIGNvbnN0IGdyb3VwRmllbGQgPSBmb3JtLmVsZW1lbnRzLmdyb3VwO1xuICAgICAgY29uc3QgZ3JvdXAgPSBncm91cEZpZWxkLnZhbHVlO1xuXG4gICAgICBjb25zdCBwcmlvcml0eSA9IGZvcm0uZWxlbWVudHMucHJpb3JpdHkudmFsdWU7XG5cbiAgICAgIG5ldyBKb3Qoe1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgIGdyb3VwLFxuICAgICAgICAgIHByaW9yaXR5XG4gICAgICAgIH1cbiAgICAgIH0pLnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29udGVudEZpZWxkLnZhbHVlID0gJyc7XG4gICAgICAgIC8vY29udGVudEZpZWxkLmZvY3VzKCk7XG4gICAgICAgIGNvbnRlbnRGaWVsZC5ibHVyKCk7XG4gICAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0b1Nob3cgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy5zaG93LW9uLWZvY3VzJyk7XG5cbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICB0b1Nob3cuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgIH0pO1xuICB9XG5cbiAgaW5pdEVkaXQoKSB7XG4gICAgY29uc3QgbGlua3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuam90c19fam90X19lZGl0Jyk7XG4gICAgZm9yIChsZXQgbGluayBvZiBsaW5rcykge1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvL3N0b3AgZG9jdW1lbnQgbGlzdGVuZXIgZnJvbSByZW1vdmluZyAnZWRpdCcgY2xhc3NcblxuICAgICAgICBjb25zdCBpZCA9IGxpbmsuZGF0YXNldC5pZDtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5qb3RzX19qb3QtJyArIGlkKTtcblxuICAgICAgICBpZiAoIWl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0JykpIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG5cbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXQnKTtcblxuICAgICAgICAgIC8vY29uc3QgY29udGVudEZpZWxkID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0tam90LXVwZGF0ZS0nICsgaWQpLmVsZW1lbnRzLmNvbnRlbnQ7XG4gICAgICAgICAgLy9jb250ZW50RmllbGQuZm9jdXMoKTtcbiAgICAgICAgICAvL2NvbnRlbnRGaWVsZC52YWx1ZSA9IGNvbnRlbnRGaWVsZC52YWx1ZTsgLy9mb3JjZXMgY3Vyc29yIHRvIGdvIHRvIGVuZCBvZiB0ZXh0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB1bnNlbGVjdEFsbCgpIHtcbiAgICAvL1RPRE86IGhhdmUgY2xhc3MgbWVtYmVyIHRvIGhvbGQgcmVmZXJlbmNlIHRvIGNvbW1vbiBlbGVtZW50L2VsZW1lbnQgZ3JvdXBzIHRvIGF2b2lkIHJlcXVlcnlpbmdcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5qb3RzX19qb3QnKTtcbiAgICBmb3IgKGxldCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaG93cyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zaG93LW9uLWZvY3VzJyk7XG4gICAgZm9yIChsZXQgc2hvdyBvZiBzaG93cykge1xuICAgICAgc2hvdy5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgaW5pdERlbGV0ZUZvcm1zKCkge1xuICAgIGNvbnN0IGZvcm1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmZvcm0tam90LWRlbGV0ZScpO1xuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IGlkID0gZm9ybS5kYXRhc2V0LmlkO1xuICAgICAgICBjb25zdCBncm91cCA9IGZvcm0uZGF0YXNldC5ncm91cElkO1xuXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuam90c19fam90LScgKyBpZCk7XG4gICAgICAgIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcblxuICAgICAgICBKb3QubG9hZChpZCkudGhlbihqb3QgPT4ge1xuICAgICAgICAgIEpvdC5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdub3RpZnknLCB7XG4gICAgICAgICAgICAgIHRpdGxlOiAnSm90IGRlbGV0ZWQnLFxuICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndW5kbycsXG4gICAgICAgICAgICAgICAgZm46ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgam90LnJldiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGpvdC5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdyb3VwLmxvYWQoZ3JvdXApLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtc2c6ICdKb3QgdW5kZWxldGVkJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGluaXRVcGRhdGVGb3JtcygpIHtcbiAgICBjb25zdCBmb3JtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mb3JtLWpvdC11cGRhdGUnKTtcblxuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGNvbnN0IGRvbmVCdXR0b24gPSBmb3JtLmVsZW1lbnRzLmRvbmU7XG4gICAgICBjb25zdCB1bmRvbmVCdXR0b24gPSBmb3JtLmVsZW1lbnRzLnVuZG9uZTtcblxuICAgICAgaWYgKGRvbmVCdXR0b24pIHtcbiAgICAgICAgZG9uZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICBmb3JtLmVsZW1lbnRzWydkb25lLXN0YXR1cyddLnZhbHVlID0gJ2RvbmUnO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHVuZG9uZUJ1dHRvbikge1xuICAgICAgICB1bmRvbmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgZm9ybS5lbGVtZW50c1snZG9uZS1zdGF0dXMnXS52YWx1ZSA9ICd1bmRvbmUnO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvL3N0b3AgZG9jdW1lbnQgbGlzdGVuZXIgZnJvbSByZW1vdmluZyAnZWRpdCcgY2xhc3NcbiAgICAgIH0pO1xuXG4gICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjb25zdCBpZCA9IGZvcm0uZGF0YXNldC5pZDtcblxuICAgICAgICBjb25zdCBjb250ZW50ID0gZm9ybS5lbGVtZW50cy5jb250ZW50LnZhbHVlO1xuICAgICAgICBjb25zdCBncm91cCA9IGZvcm0uZWxlbWVudHMuZ3JvdXAudmFsdWU7XG4gICAgICAgIGNvbnN0IGRvbmVTdGF0dXMgPSBmb3JtLmVsZW1lbnRzWydkb25lLXN0YXR1cyddLnZhbHVlO1xuICAgICAgICBjb25zdCBwcmlvcml0eSA9IGZvcm0uZWxlbWVudHMucHJpb3JpdHkudmFsdWU7XG5cbiAgICAgICAgSm90LmxvYWQoaWQpLnRoZW4oam90ID0+IHtcblxuICAgICAgICAgIGNvbnN0IGN1cnJlbnRGaWVsZHMgPSBqb3QuZmllbGRzO1xuXG4gICAgICAgICAgam90LmZpZWxkcyA9IHtcbiAgICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgICBncm91cCxcbiAgICAgICAgICAgIHByaW9yaXR5XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChkb25lU3RhdHVzID09PSAnZG9uZScpIHtcbiAgICAgICAgICAgIGpvdC5maWVsZHMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChkb25lU3RhdHVzID09PSAndW5kb25lJykge1xuICAgICAgICAgICAgam90LmZpZWxkcy5kb25lID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGpvdC5maWVsZHMuZG9uZSA9IGN1cnJlbnRGaWVsZHMuZG9uZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBqb3Quc2F2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3R3JvdXA7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi9tb2RlbHMvZ3JvdXAnKTtcblxuY29uc3QgR3JvdXBzUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi9wcmVmZXJlbmNlcy9ncm91cHMnKTtcblxuY29uc3QgQ29sb3VyU2VsZWN0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2NvbG91ci1zZWxlY3RvcicpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3R3JvdXBzIGV4dGVuZHMgVmlldyB7XG5cbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJXaWRnZXQoQ29sb3VyU2VsZWN0b3JXaWRnZXQpO1xuXG4gICAgdGhpcy5fcHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBzUHJlZmVyZW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3VwZGF0ZScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MuY2hhbmdlcyAmJiBhcmdzLmNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgZ3JvdXBzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdvcmRlckNoYW5nZWQnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuX3ByZWZlcmVuY2VzLnNldE9yZGVyKGFyZ3MudHlwZSwgYXJncy5kaXJlY3Rpb24pO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmxhc3RQYXJhbXM7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2dyb3VwLWxpc3QnLCBwYXJhbXMpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuX2FkZERvY3VtZW50TGlzdGVuZXIoJ3Vuc2VsZWN0QWxsJywgJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2dyb3VwLWxpc3QnOlxuICAgICAgICBwYXJhbXMuZ3JvdXBzID0gdGhpcy5fcHJlZmVyZW5jZXMub3JkZXIocGFyYW1zLmdyb3Vwcyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGVsID0gc3VwZXIucmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpO1xuXG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdncm91cC1saXN0JzpcbiAgICAgICAgdGhpcy5pbml0RWRpdCgpO1xuICAgICAgICB0aGlzLmluaXREZWxldGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRVcGRhdGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRXaWRnZXRzKGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRBZGRGb3JtKCk7XG4gICAgdGhpcy5pbml0RWRpdCgpO1xuICAgIHRoaXMuaW5pdERlbGV0ZUZvcm1zKCk7XG4gICAgdGhpcy5pbml0VXBkYXRlRm9ybXMoKTtcbiAgfVxuXG4gIGluaXRBZGRGb3JtKCkge1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuZm9ybS1ncm91cC1hZGQnKTtcbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IG5hbWVGaWVsZCA9IGZvcm0uZWxlbWVudHMubmFtZTtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lRmllbGQudmFsdWU7XG5cbiAgICAgIGNvbnN0IGNvbG91ciA9IGZvcm0uZWxlbWVudHMuY29sb3VyLnZhbHVlO1xuXG4gICAgICBuZXcgR3JvdXAoe1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGNvbG91cixcbiAgICAgICAgfSxcbiAgICAgIH0pLnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgbmFtZUZpZWxkLnZhbHVlID0gJyc7XG4gICAgICAgIC8vbmFtZUZpZWxkLmZvY3VzKCk7XG4gICAgICAgIG5hbWVGaWVsZC5ibHVyKCk7XG4gICAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgICAgR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2dyb3VwLWxpc3QnLCB7XG4gICAgICAgICAgICBncm91cHNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRvU2hvdyA9IGZvcm0ucXVlcnlTZWxlY3RvcignLnNob3ctb24tZm9jdXMnKTtcblxuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgIHRvU2hvdy5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfSk7XG4gIH1cblxuICBpbml0RWRpdCgpIHtcbiAgICBjb25zdCBlZGl0TGlua3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuZ3JvdXBzX19ncm91cF9fZWRpdCcpO1xuICAgIGZvciAobGV0IGxpbmsgb2YgZWRpdExpbmtzKSB7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgIC8vc3RvcCBkb2N1bWVudCBsaXN0ZW5lciBmcm9tIHJlbW92aW5nICdlZGl0JyBjbGFzc1xuXG4gICAgICAgIGNvbnN0IGlkID0gbGluay5kYXRhc2V0LmlkO1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmdyb3Vwc19fZ3JvdXAtJyArIGlkKTtcblxuICAgICAgICBpZiAoIWl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0JykpIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG5cbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXQnKTtcblxuICAgICAgICAgIC8vY29uc3QgbmFtZUZpZWxkID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0tZ3JvdXAtdXBkYXRlLScgKyBpZCkuZWxlbWVudHMubmFtZTtcbiAgICAgICAgICAvL25hbWVGaWVsZC5mb2N1cygpO1xuICAgICAgICAgIC8vbmFtZUZpZWxkLnZhbHVlID0gbmFtZUZpZWxkLnZhbHVlOyAvL2ZvcmNlcyBjdXJzb3IgdG8gZ28gdG8gZW5kIG9mIHRleHRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHVuc2VsZWN0QWxsKCkge1xuICAgIC8vVE9ETzogaGF2ZSBjbGFzcyBtZW1iZXIgdG8gaG9sZCByZWZlcmVuY2UgdG8gY29tbW9uIGVsZW1lbnQvZWxlbWVudCBncm91cHMgdG8gYXZvaWQgcmVxdWVyeWluZ1xuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmdyb3Vwc19fZ3JvdXAnKTtcbiAgICBmb3IgKGxldCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaG93cyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zaG93LW9uLWZvY3VzJyk7XG4gICAgZm9yIChsZXQgc2hvdyBvZiBzaG93cykge1xuICAgICAgc2hvdy5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgaW5pdERlbGV0ZUZvcm1zKCkge1xuICAgIGNvbnN0IGZvcm1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmZvcm0tZ3JvdXAtZGVsZXRlJyk7XG4gICAgZm9yIChsZXQgZm9ybSBvZiBmb3Jtcykge1xuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLmRhdGFzZXQuaWQ7XG5cbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5ncm91cHNfX2dyb3VwLScgKyBpZCk7XG4gICAgICAgIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcblxuICAgICAgICBHcm91cC5sb2FkKGlkKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgICBHcm91cC5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ25vdGlmeScsIHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdMaXN0IGRlbGV0ZWQnLFxuICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndW5kbycsXG4gICAgICAgICAgICAgICAgZm46ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAucmV2ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuc2F2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jcyA9IGdyb3VwLmpvdHMubWFwKGpvdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBfcmV2OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBfaWQ6IGpvdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZUFkZGVkOiBqb3QuX2RhdGVBZGRlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBqb3QuZmllbGRzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBqb3QucmV2ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBqb3Q7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYiA9IHJlcXVpcmUoJy4uL2RiL2RiJykoKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGIuYnVsa0RvY3MoZG9jcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1zZzogJ0xpc3QgdW5kZWxldGVkJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbml0VXBkYXRlRm9ybXMoKSB7XG4gICAgY29uc3QgZm9ybXMgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuZm9ybS1ncm91cC11cGRhdGUnKTtcblxuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyAgLy9zdG9wIGRvY3VtZW50IGxpc3RlbmVyIGZyb20gcmVtb3ZpbmcgJ2VkaXQnIGNsYXNzXG4gICAgICB9KTtcblxuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLmRhdGFzZXQuaWQ7XG5cbiAgICAgICAgY29uc3QgbmFtZSA9IGZvcm0uZWxlbWVudHMubmFtZS52YWx1ZTtcbiAgICAgICAgY29uc3QgY29sb3VyID0gZm9ybS5lbGVtZW50cy5jb2xvdXIudmFsdWU7XG5cbiAgICAgICAgR3JvdXAubG9hZChpZCkudGhlbihncm91cCA9PiB7XG5cbiAgICAgICAgICBncm91cC5maWVsZHMgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY29sb3VyXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGdyb3VwLnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnZ3JvdXAtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICBncm91cHNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdHcm91cHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY2xhc3MgVmlld0hvbWUgZXh0ZW5kcyBWaWV3IHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdIb21lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNvbnN0IHJvdXRlciA9IHJlcXVpcmUoJy4uL3JvdXRlcnMvcGF0aCcpO1xuXG5jbGFzcyBWaWV3SW1wb3J0IGV4dGVuZHMgVmlldyB7XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRJbXBvcnRGb3JtKCk7XG4gIH1cblxuICBpbml0SW1wb3J0Rm9ybSgpIHtcbiAgICBjb25zdCBmb3JtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0taW1wb3J0Jyk7XG5cbiAgICBpZiAoZm9ybSkge1xuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgR3JvdXAuaW1wb3J0RnJvbUxvY2FsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwUHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICAgICAgICAgIGdyb3VwUHJvbWlzZXMucHVzaCgobmV3R3JvdXBzKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBHcm91cC5pbnNlcnQoe1xuICAgICAgICAgICAgICAgIGZpZWxkczogZ3JvdXAuZmllbGRzLFxuICAgICAgICAgICAgICAgIGRhdGVBZGRlZDogZ3JvdXAuX2RhdGVBZGRlZFxuICAgICAgICAgICAgICB9KS50aGVuKG5ld0dyb3VwID0+IHtcbiAgICAgICAgICAgICAgICBuZXdHcm91cHMucHVzaChuZXdHcm91cCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld0dyb3VwcztcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxldCBncm91cFByb21pc2VDaGFpbiA9IFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgICAgZ3JvdXBQcm9taXNlcy5mb3JFYWNoKGdyb3VwUHJvbWlzZSA9PiB7XG4gICAgICAgICAgICBncm91cFByb21pc2VDaGFpbiA9IGdyb3VwUHJvbWlzZUNoYWluLnRoZW4oZ3JvdXBQcm9taXNlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBncm91cFByb21pc2VDaGFpbi50aGVuKG5ld0dyb3VwcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb3RQcm9taXNlcyA9IFtdO1xuXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaCgoZ3JvdXAsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIGdyb3VwLmpvdHMuZm9yRWFjaChqb3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0ZpZWxkcyA9IGpvdC5maWVsZHM7XG4gICAgICAgICAgICAgICAgbmV3RmllbGRzLmdyb3VwID0gbmV3R3JvdXBzW2luZGV4XS5pZDtcbiAgICAgICAgICAgICAgICBqb3RQcm9taXNlcy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBKb3QuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBuZXdGaWVsZHMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGVBZGRlZDogam90Ll9kYXRlQWRkZWRcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgam90UHJvbWlzZUNoYWluID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICBqb3RQcm9taXNlcy5mb3JFYWNoKGpvdFByb21pc2UgPT4ge1xuICAgICAgICAgICAgICBqb3RQcm9taXNlQ2hhaW4gPSBqb3RQcm9taXNlQ2hhaW4udGhlbihqb3RQcm9taXNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gam90UHJvbWlzZUNoYWluO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLnJlbW92ZUZyb21Mb2NhbCgpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ25vdGlmeScsIHtcbiAgICAgICAgICAgIHRpdGxlOiAnSm90cyBpbXBvcnRlZCdcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByb3V0ZXIuZ28oJy9ncm91cCcpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdJbXBvcnQ7XG4iLCJjb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcblxuY29uc3QgSm90c1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vcHJlZmVyZW5jZXMvam90cycpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3Sm90cyBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICBzdXBlcihjb250YWluZXIpO1xuXG4gICAgdGhpcy5fcHJlZmVyZW5jZXMgPSBuZXcgSm90c1ByZWZlcmVuY2VzKCk7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHBhcmFtcy5qb3RzID0gdGhpcy5fcHJlZmVyZW5jZXMub3JkZXIocGFyYW1zLmpvdHMpO1xuXG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3VwZGF0ZScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MuY2hhbmdlcyAmJiBhcmdzLmNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIEpvdC5sb2FkQWxsKCkudGhlbihqb3RzID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgam90c1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goUHViU3ViLnN1YnNjcmliZSgnb3JkZXJDaGFuZ2VkJywgKHRvcGljLCBhcmdzKSA9PiB7XG4gICAgICB0aGlzLl9wcmVmZXJlbmNlcy5zZXRPcmRlcihhcmdzLnR5cGUsIGFyZ3MuZGlyZWN0aW9uKTtcblxuICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5sYXN0UGFyYW1zO1xuICAgICAgdGhpcy5yZW5kZXIoZmFsc2UsIHBhcmFtcyk7XG4gICAgfSkpO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3Sm90cztcbiIsImNvbnN0IFdpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIExpc3RPcmRlciBleHRlbmRzIFdpZGdldCB7XG4gIGluaXRFdmVudHMoZWwpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICBsZXQgd2lkZ2V0cztcbiAgICBpZiAoZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdwYXJ0aWFsLWxpc3Qtb3JkZXInKSkge1xuICAgICAgd2lkZ2V0cyA9IFtlbF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZGdldHMgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKCcucGFydGlhbC1saXN0LW9yZGVyJyk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgd2lkZ2V0IG9mIHdpZGdldHMpIHtcbiAgICAgIGNvbnN0IGxpbmtzID0gd2lkZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKTtcblxuICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxpbmtzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBsaW5rID0gbGlua3NbaW5kZXhdO1xuICAgICAgICBjb25zdCBuZXh0TGluayA9IGxpbmtzWyhpbmRleCArIDEpICUgbGlua3MubGVuZ3RoXTtcblxuICAgICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBQdWJTdWIucHVibGlzaCgnb3JkZXJDaGFuZ2VkJywge1xuICAgICAgICAgICAgdHlwZTogbmV4dExpbmsuZGF0YXNldC50eXBlLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiBuZXh0TGluay5kYXRhc2V0LmRpcmVjdGlvblxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgbGluay5jbGFzc0xpc3QucmVtb3ZlKCdjdXJyZW50Jyk7XG4gICAgICAgICAgbmV4dExpbmsuY2xhc3NMaXN0LmFkZCgnY3VycmVudCcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RPcmRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jbGFzcyBWaWV3TG9hZGluZyBleHRlbmRzIFZpZXcge1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0xvYWRpbmc7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IExvYWRpbmdWaWV3ID0gcmVxdWlyZSgnLi9sb2FkaW5nLmpzJyk7XG5cbmNsYXNzIFZpZXdMb2FkaW5nR3JvdXBzIGV4dGVuZHMgTG9hZGluZ1ZpZXcge1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0xvYWRpbmdHcm91cHM7XG4iLCJjb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIE5vdGlmaWNhdGlvbk1hbmFnZXJWaWV3IGV4dGVuZHMgVmlldyB7XG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNvbnRhaW5lcik7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHN1cGVyLnJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdub3RpZnknLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuc2hvd05vdGlmaWNhdGlvbihhcmdzKTtcbiAgICB9KSk7XG4gIH1cblxuICBzaG93Tm90aWZpY2F0aW9uKHtcbiAgICB0aXRsZSA9IGZhbHNlLFxuICAgIGJvZHkgPSBmYWxzZSxcbiAgICBhY3Rpb24gPSBmYWxzZSxcbiAgICBkdXJhdGlvbiA9IDUwMDBcbiAgfSkge1xuXG4gICAgdmFyIGZuID0gKCkgPT4ge1xuICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdub3RpZmljYXRpb24nLCB7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBhY3Rpb25OYW1lOiBhY3Rpb24gPyBhY3Rpb24ubmFtZSA6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgaWYgKGFjdGlvbiAmJiBhY3Rpb24uZm4pIHtcbiAgICAgICAgY29uc3QgYWN0aW9uUHJpbWFyeSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhcl9fYWN0aW9uLS1wcmltYXJ5Jyk7XG4gICAgICAgIGlmIChhY3Rpb25QcmltYXJ5KSB7XG4gICAgICAgICAgYWN0aW9uUHJpbWFyeS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3RpbWVyKSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFjdGlvbi5mbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWN0aW9uLm1zZykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd05vdGlmaWNhdGlvbih7XG4gICAgICAgICAgICAgICAgICB0aXRsZTogYWN0aW9uLm1zZ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhci1jb250YWluZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtbm90aWZpY2F0aW9uJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhci1jb250YWluZXInKS5jbGFzc0xpc3QuYWRkKCdoYXMtbm90aWZpY2F0aW9uJyk7XG5cbiAgICAgIGlmICh0aGlzLl90aW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXItY29udGFpbmVyJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLW5vdGlmaWNhdGlvbicpO1xuICAgICAgfSwgZHVyYXRpb24pO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLXNuYWNrYmFyLWNvbnRhaW5lcicpLmNsYXNzTGlzdC5jb250YWlucygnaGFzLW5vdGlmaWNhdGlvbicpKSB7XG4gICAgICB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXItY29udGFpbmVyJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLW5vdGlmaWNhdGlvbicpO1xuICAgICAgc2V0VGltZW91dChmbiwgMzAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm4oKTtcbiAgICB9XG5cbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTm90aWZpY2F0aW9uTWFuYWdlclZpZXc7XG4iLCJjb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IExpc3RPcmRlciA9IHJlcXVpcmUoJy4vbGlzdC1vcmRlcicpO1xuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY29uc3QgVG91Y2ggPSByZXF1aXJlKCcuLi91dGlsaXR5L3RvdWNoJyk7XG5cbmNsYXNzIFZpZXdUaXRsZUJhciBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICBzdXBlcihjb250YWluZXIpO1xuXG4gICAgdGhpcy5yZWdpc3RlcldpZGdldChMaXN0T3JkZXIpO1xuXG4gICAgdGhpcy5fdG91Y2hIYW5kbGVyID0gbmV3IFRvdWNoKCk7XG4gICAgdGhpcy5fdG91Y2hIYW5kbGVyLnJlZ2lzdGVyKCdsZWZ0JywgKHRoaXMuX2Nsb3NlTmF2KS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl90b3VjaEhhbmRsZXIucmVnaXN0ZXIoJ3JpZ2h0JywgKHRoaXMuX29wZW5OYXYpLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpIHtcbiAgICBzdXBlci5yZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcyk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goUHViU3ViLnN1YnNjcmliZSgncm91dGVDaGFuZ2VkJywgKHRvcGljLCBhcmdzKSA9PiB7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ3RpdGxlYmFyLXRpdGxlJywgYXJncyk7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ3RpdGxlYmFyLXRhYnMnLCBhcmdzKTtcblxuICAgICAgdGhpcy51cGRhdGVTb3J0aW5nKGFyZ3MpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuX3RvdWNoSGFuZGxlci5zZXRFbGVtZW50KHRoaXMuX2VsKTtcbiAgfVxuXG4gIHJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKSB7XG4gICAgY29uc3QgZWwgPSBzdXBlci5yZW5kZXJQYXJ0aWFsKG5hbWUsIHBhcmFtcyk7XG5cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2xpc3Qtb3JkZXInOlxuICAgICAgICB0aGlzLmluaXRXaWRnZXRzKGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLl9uYXYgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCduYXYnKTtcbiAgICB0aGlzLl9uYXZPdmVybGF5ID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLW5hdi1vdmVybGF5Jyk7XG4gICAgdGhpcy5fYnRuTWVudU9wZW4gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtYnRuLW1lbnUnKTtcbiAgICB0aGlzLl9idG5NZW51Q2xvc2UgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtYnRuLW1lbnUuY2xvc2UnKTtcbiAgICB0aGlzLl9saW5rcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5tZC1uYXYtYm9keSBhJyk7XG5cbiAgICB0aGlzLl9idG5NZW51T3Blbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLl9vcGVuTmF2KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9idG5NZW51Q2xvc2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5fY2xvc2VOYXYoKTtcbiAgICB9KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX2xpbmtzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5fY2xvc2VOYXYoKSk7XG4gICAgfVxuICB9XG5cbiAgY2xlYW51cCgpIHtcbiAgICBzdXBlci5jbGVhbnVwKCk7XG5cbiAgICB0aGlzLl90b3VjaEhhbmRsZXIuZGVzdHJveSgpO1xuICB9XG5cbiAgX29wZW5OYXYoKSB7XG4gICAgdGhpcy5fbmF2LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICB0aGlzLl9uYXZPdmVybGF5LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgfVxuXG4gIF9jbG9zZU5hdigpIHtcbiAgICB0aGlzLl9uYXYuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIHRoaXMuX25hdk92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICB9XG5cbiAgdXBkYXRlU29ydGluZyhhcmdzKSB7XG4gICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdsaXN0LW9yZGVyJywgYXJncyk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdUaXRsZUJhcjtcbiIsImNsYXNzIFZpZXdDb250YWluZXIge1xuICBjb25zdHJ1Y3RvcihlbElELCB0ZW1wbGF0ZXMsIHBhcnRpYWxzKSB7XG4gICAgdGhpcy5fZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbElEKTtcblxuICAgIHRoaXMuX3RlbXBsYXRlcyA9IHRlbXBsYXRlcztcbiAgICB0aGlzLl9wYXJ0aWFscyA9IHBhcnRpYWxzO1xuXG4gICAgdGhpcy5fY3VycmVudFZpZXcgPSBudWxsO1xuICB9XG5cbiAgdXBkYXRlKHZpZXcsIGh0bWwpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFZpZXcpIHtcbiAgICAgIHRoaXMuX2N1cnJlbnRWaWV3LmNsZWFudXAoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jdXJyZW50VmlldyA9IHZpZXc7XG4gICAgdGhpcy5fZWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdDb250YWluZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYW5kbGViYXJzL2Rpc3QvaGFuZGxlYmFycy5ydW50aW1lJyk7XG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3IHtcbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgdGhpcy5fY29udGFpbmVyID0gY29udGFpbmVyO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzID0ge307XG4gICAgdGhpcy5fd2lkZ2V0cyA9IFtdO1xuXG4gICAgdGhpcy5fbGFzdFBhcmFtcyA9IG51bGw7XG4gIH1cblxuICAvL3RpZHkgdGhpcyB1cD9cbiAgZ2V0IF9lbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyLl9lbDtcbiAgfVxuXG4gIGdldCBsYXN0UGFyYW1zKCkge1xuICAgIHJldHVybiB0aGlzLl9sYXN0UGFyYW1zO1xuICB9XG5cbiAgcmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpIHtcbiAgICB0aGlzLmNsZWFudXAoKTtcblxuICAgIGlmICghcHJlUmVuZGVyZWQpIHtcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGUodGhpcy5fY29udGFpbmVyLl90ZW1wbGF0ZXNbdGhpcy5fZ2V0VGVtcGxhdGUoKV0pO1xuICAgICAgdGhpcy5fY29udGFpbmVyLnVwZGF0ZSh0aGlzLCB0ZW1wbGF0ZShwYXJhbXMpKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRFdmVudHMoKTtcblxuICAgIHRoaXMuX2xhc3RQYXJhbXMgPSBwYXJhbXM7XG4gIH1cblxuICByZW5kZXJQYXJ0aWFsKG5hbWUsIHBhcmFtcykge1xuICAgIGNvbnNvbGUubG9nKCdyZW5kZXIgcGFydGlhbCcsIG5hbWUpO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZSh0aGlzLl9jb250YWluZXIuX3BhcnRpYWxzW25hbWVdKTtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLnBhcnRpYWwtJyArIG5hbWUpO1xuICAgIHZpZXcub3V0ZXJIVE1MID0gdGVtcGxhdGUocGFyYW1zKTtcblxuICAgIHRoaXMuX2xhc3RQYXJhbXMgPSBwYXJhbXM7XG5cbiAgICByZXR1cm4gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLnBhcnRpYWwtJyArIG5hbWUpO1xuICB9XG5cbiAgX2dldFRlbXBsYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWUudG9Mb3dlckNhc2UoKS5zdWJzdHJpbmcoNCk7XG4gIH1cblxuICBfYWRkRG9jdW1lbnRMaXN0ZW5lcihuYW1lLCB0eXBlLCBmbikge1xuICAgIGlmICghdGhpcy5fZG9jdW1lbnRMaXN0ZW5lcnNbbmFtZV0pIHtcbiAgICAgIHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzW25hbWVdID0ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBmbjogZm4uYmluZCh0aGlzKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzW25hbWVdLmZuKTtcbiAgfVxuXG4gIGNsZWFudXAoKSB7XG4gICAgLy9jb25zb2xlLmxvZygndmlldyBjbGVhdXAnLCB0aGlzKTtcblxuICAgIGZvciAobGV0IHN1YiBvZiB0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICBQdWJTdWIudW5zdWJzY3JpYmUoc3ViKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBsbmFtZSBpbiB0aGlzLl9kb2N1bWVudExpc3RlbmVycykge1xuICAgICAgY29uc3QgbGlzdGVuZXIgPSB0aGlzLl9kb2N1bWVudExpc3RlbmVyc1tsbmFtZV07XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGxpc3RlbmVyLnR5cGUsIGxpc3RlbmVyLmZuKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFudXBXaWRnZXRzKCk7XG4gIH1cblxuICBpbml0RXZlbnRzKCkge1xuICAgIHRoaXMuaW5pdFdpZGdldHModGhpcy5fZWwpO1xuICB9XG5cbiAgcmVnaXN0ZXJXaWRnZXQoV2lkZ2V0KSB7XG4gICAgdGhpcy5fd2lkZ2V0cy5wdXNoKG5ldyBXaWRnZXQoKSk7XG4gIH1cblxuICBpbml0V2lkZ2V0cyhlbCkge1xuICAgIHRoaXMuX3dpZGdldHMuZm9yRWFjaCh3aWRnZXQgPT4ge1xuICAgICAgd2lkZ2V0LmluaXRFdmVudHMoZWwpO1xuICAgIH0pO1xuICB9XG5cbiAgY2xlYW51cFdpZGdldHMoKSB7XG4gICAgdGhpcy5fd2lkZ2V0cy5mb3JFYWNoKHdpZGdldCA9PiB7XG4gICAgICB3aWRnZXQuY2xlYW51cCgpO1xuICAgIH0pO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3O1xuIiwiY2xhc3MgV2lkZ2V0IHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgfVxuXG4gIGluaXRFdmVudHMoKSB7XG5cbiAgfVxuXG4gIGNsZWFudXAoKSB7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXaWRnZXQ7XG4iLCIiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiJdfQ==
