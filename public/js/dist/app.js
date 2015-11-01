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

},{"../utility/pubsub":31,"pouchdb":7}],2:[function(require,module,exports){
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

function _typeof(obj) { return obj && obj.constructor === Symbol ? "symbol" : typeof obj; }

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
                startkey: slug + '\uffff',
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
          startkey: _this3.getRefName() + '-\uffff',
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

},{"../db/db":1,"../utility/date":30}],6:[function(require,module,exports){
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
 * 0.19.0
 *
 * Copyright(c) 2015 Gregory Jacobs <greg@greg-jacobs.com>
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
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
 * @param {Object} [config] The configuration options for the Autolinker instance, specified in an Object (map).
 */
var Autolinker = function( cfg ) {
	Autolinker.Util.assign( this, cfg );  // assign the properties of `cfg` onto the Autolinker instance. Prototype properties will be used for missing configs.

	// Validate the value of the `hashtag` cfg.
	var hashtag = this.hashtag;
	if( hashtag !== false && hashtag !== 'twitter' && hashtag !== 'facebook' && hashtag !== 'instagram' ) {
		throw new Error( "invalid `hashtag` cfg - see docs" );
	}
};

Autolinker.prototype = {
	constructor : Autolinker,  // fix constructor property

	/**
	 * @cfg {Boolean} urls
	 *
	 * `true` if miscellaneous URLs should be automatically linked, `false` if they should not be.
	 */
	urls : true,

	/**
	 * @cfg {Boolean} email
	 *
	 * `true` if email addresses should be automatically linked, `false` if they should not be.
	 */
	email : true,

	/**
	 * @cfg {Boolean} twitter
	 *
	 * `true` if Twitter handles ("@example") should be automatically linked, `false` if they should not be.
	 */
	twitter : true,

	/**
	 * @cfg {Boolean} phone
	 *
	 * `true` if Phone numbers ("(555)555-5555") should be automatically linked, `false` if they should not be.
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
	 * @cfg {Number} truncate
	 *
	 * A number for how many characters long matched text should be truncated to inside the text of
	 * a link. If the matched text is over this number of characters, it will be truncated to this length by
	 * adding a two period ellipsis ('..') to the end of the string.
	 *
	 * For example: A url like 'http://www.yahoo.com/some/long/path/to/a/file' truncated to 25 characters might look
	 * something like this: 'yahoo.com/some/long/pat..'
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
	 * @param {String} name The attribute name to retrieve.
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
 * Normally this class is instantiated, configured, and used internally by an {@link Autolinker} instance, but may
 * actually be retrieved in a {@link Autolinker#replaceFn replaceFn} to create {@link Autolinker.HtmlTag HtmlTag} instances
 * which may be modified before returning from the {@link Autolinker#replaceFn replaceFn}. For example:
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
	 * @cfg {Number} truncate
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
		var tag = new Autolinker.HtmlTag( {
			tagName   : 'a',
			attrs     : this.createAttrs( match.getType(), match.getAnchorHref() ),
			innerHtml : this.processAnchorText( match.getAnchorText() )
		} );

		return tag;
	},


	/**
	 * Creates the Object (map) of the HTML attributes for the anchor (&lt;a&gt;)
	 *   tag being generated.
	 *
	 * @protected
	 * @param {"url"/"email"/"phone"/"twitter"/"hashtag"} matchType The type of
	 *   match that an anchor tag is being generated for.
	 * @param {String} href The href for the anchor tag.
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
	 * Performs the truncation of the `anchorText`, if the `anchorText` is
	 * longer than the {@link #truncate} option. Truncates the text to 2
	 * characters fewer than the {@link #truncate} option, and adds ".." to the
	 * end.
	 *
	 * @private
	 * @param {String} text The anchor tag's text (i.e. what will be displayed).
	 * @return {String} The truncated anchor text.
	 */
	doTruncate : function( anchorText ) {
		return Autolinker.Util.ellipsis( anchorText, this.truncate || Number.POSITIVE_INFINITY );
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
	 * @cfg {Boolean} urls
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
	 * 7.  A protocol-relative ('//') match for the case of a 'www.' prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     We need to know the character before the '//' in order to determine
	 *     if it is a valid match or the // was in a string we don't want to
	 *     auto-link.
	 * 8.  A protocol-relative ('//') match for the case of a known TLD prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     See #6 for more info.
	 * 9.  Group that is used to determine if there is a phone number match. The
	 *     next 3 groups give segments of the phone number.
	 * 10. Group that is used to determine if there is a Hashtag match
	 *     (i.e. \#someHashtag). Simply check for its existence to determine if
	 *     there is a Hashtag match. The next couple of capturing groups give
	 *     information about the Hashtag match.
	 * 11. The whitespace character before the #sign in a Hashtag handle. This
	 *     is needed because there are no look-behinds in JS regular
	 *     expressions, and can be used to reconstruct the original string in a
	 *     replace().
	 * 12. The Hashtag itself in a Hashtag match. If the match is
	 *     '#someHashtag', the hashtag is 'someHashtag'.
	 */
	matcherRegex : (function() {
		var twitterRegex = /(^|[^\w])@(\w{1,15})/,              // For matching a twitter handle. Ex: @gregory_jacobs

		    hashtagRegex = /(^|[^\w])#(\w{1,139})/,              // For matching a Hashtag. Ex: #games

		    emailRegex = /(?:[\-;:&=\+\$,\w\.]+@)/,             // something@ for email addresses (a.k.a. local-part)
		    phoneRegex = /(?:\+?\d{1,3}[-\s.])?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]\d{4}/,  // ex: (123) 456-7890, 123 456 7890, 123-456-7890, etc.
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
					'(',  // *** Capturing group $6, for a protocol-prefixed url (ex: http://google.com)
						protocolRegex.source,
						domainNameRegex.source,
					')',

					'|',

					'(?:',  // non-capturing paren for a 'www.' prefixed url (ex: www.google.com)
						'(.?//)?',  // *** Capturing group $7 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
						wwwRegex.source,
						domainNameRegex.source,
					')',

					'|',

					'(?:',  // non-capturing paren for known a TLD url (ex: google.com)
						'(.?//)?',  // *** Capturing group $8 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
						domainNameRegex.source,
						tldRegex.source,
					')',
				')',

				'(?:' + urlSuffixRegex.source + ')?',  // match for path, query string, and/or hash anchor - optional
			')',

			'|',

			// this setup does not scale well for open extension :( Need to rethink design of autolinker...
			// ***  Capturing group $9, which matches a (USA for now) phone number
			'(',
				phoneRegex.source,
			')',

			'|',

			'(',  // *** Capturing group $10, which can be used to check for a Hashtag match. Use group $12 for the actual Hashtag though. $11 may be used to reconstruct the original string in a replace()
				// *** Capturing group $11, which matches the whitespace character before the '#' sign (needed because of no lookbehinds), and
				// *** Capturing group $12, which matches the actual Hashtag
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

		return text.replace( this.matcherRegex, function( matchStr, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 ) {
			var matchDescObj = me.processCandidateMatch( matchStr, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12 );  // "match description" object

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
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @param {String} wwwProtocolRelativeMatch The '//' for a protocol-relative
	 *   match from a 'www' url, with the character that comes before the '//'.
	 * @param {String} tldProtocolRelativeMatch The '//' for a protocol-relative
	 *   match from a TLD (top level domain) match, with the character that
	 *   comes before the '//'.
	 * @param {String} phoneMatch The matched text of a phone number
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
		emailAddressMatch, urlMatch, protocolUrlMatch, wwwProtocolRelativeMatch,
		tldProtocolRelativeMatch, phoneMatch, hashtagMatch,
		hashtagPrefixWhitespaceChar, hashtag
	) {
		// Note: The `matchStr` variable wil be fixed up to remove characters that are no longer needed (which will
		// be added to `prefixStr` and `suffixStr`).

		var protocolRelativeMatch = wwwProtocolRelativeMatch || tldProtocolRelativeMatch,
		    match,  // Will be an Autolinker.match.Match object

		    prefixStr = "",  // A string to use to prefix the anchor tag that is created. This is needed for the Twitter and Hashtag matches.
		    suffixStr = "";  // A string to suffix the anchor tag that is created. This is used if there is a trailing parenthesis that should not be auto-linked.

		// Return out with `null` for match types that are disabled (url, email,
		// twitter, hashtag), or for matches that are invalid (false positives
		// from the matcherRegex, which can't use look-behinds since they are
		// unavailable in JS).
		if(
			( urlMatch && !this.urls ) ||
			( emailAddressMatch && !this.email ) ||
			( phoneMatch && !this.phone ) ||
			( twitterMatch && !this.twitter ) ||
			( hashtagMatch && !this.hashtag ) ||
			!this.matchValidator.isValidMatch( urlMatch, protocolUrlMatch, protocolRelativeMatch )
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
			var pos = this.matchHasInvalidCharAfterTld( urlMatch, protocolUrlMatch );
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
 			match = new Autolinker.match.Phone( { matchedText: matchStr, number: cleanNumber } );

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
				protocolUrlMatch : !!protocolUrlMatch,
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
		return 'tel:' + this.number;
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
		var anchorText = this.getUrl();
		
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
return Autolinker;

}));

},{}],7:[function(require,module,exports){

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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
},{}],10:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],11:[function(require,module,exports){
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

},{"_process":13,"path-to-regexp":12}],12:[function(require,module,exports){
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

},{"isarray":10}],13:[function(require,module,exports){
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

},{}],14:[function(require,module,exports){
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

},{"../models/Jot":2,"./preferences":17}],15:[function(require,module,exports){
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

},{"../models/group":3,"./preferences":17}],16:[function(require,module,exports){
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

},{"../models/Jot":2,"./preferences":17}],17:[function(require,module,exports){
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

},{}],18:[function(require,module,exports){
'use strict';

if (window.operamini) {
  document.body.classList.add('operamini');
}

//cutting the ol' mustard like a pro
if ('visibilityState' in document) {

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
    Handlebars.registerHelper(helper, helpers[helper]);
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

  titleBar.render(true);

  var containerNotifications = new ViewContainer('notifications', {
    notifications: JotApp.templates.notifications
  }, {
    notification: JotApp.templates.notification
  });

  var notificationManager = new NotificationManagerView(containerNotifications);

  notificationManager.render(true);

  router.activate();
}

},{"../../db/db":1,"../../routers/path":19,"../../routes/client/auth":21,"../../routes/client/group":22,"../../routes/client/home":23,"../../routes/client/jot":24,"../../templates/helpers":29,"../../views/notification-manager":42,"../../views/titlebar":43,"../../views/view-container":44,"fastclick":8,"handlebars/dist/handlebars.runtime":9}],19:[function(require,module,exports){
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

},{"page":11}],20:[function(require,module,exports){
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

},{"../models/group":3,"./routes":28}],21:[function(require,module,exports){
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

},{"../../db/db":1,"../../utility/pubsub":31,"../../views/import":37,"../auth":20}],22:[function(require,module,exports){
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

},{"../../models/group":3,"../../models/jot":4,"../../preferences/group":14,"../../preferences/groups":15,"../../utility/pubsub":31,"../../views/group":34,"../../views/groups":35,"../../views/loadinggroups":41,"../group":25}],23:[function(require,module,exports){
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

},{"../../utility/pubsub":31,"../../views/home":36,"../home":26}],24:[function(require,module,exports){
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

},{"../../preferences/jots":16,"../../utility/pubsub":31,"../../views/jots":38,"../../views/loading":40,"../jot":27}],25:[function(require,module,exports){
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

},{"../models/group":3,"./routes":28}],26:[function(require,module,exports){
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

},{"../models/jot":4,"./routes":28}],27:[function(require,module,exports){
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

},{"../models/jot":4,"./routes":28}],28:[function(require,module,exports){
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

},{}],29:[function(require,module,exports){
'use strict';

var Autolinker = require('autolinker');

var Handlebars = require('handlebars/dist/handlebars.runtime');

exports.ifEqual = ifEqual;
exports.ifIn = ifIn;
exports.autoLink = autoLink;

function ifEqual(conditional, equalTo, options) {
  if (conditional === equalTo) {
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

},{"autolinker":6,"handlebars/dist/handlebars.runtime":9}],30:[function(require,module,exports){
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

},{}],31:[function(require,module,exports){
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

},{}],32:[function(require,module,exports){
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

},{}],33:[function(require,module,exports){
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
        for (var _iterator = widgets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var widget = _step.value;

          var options = widget.querySelectorAll('.colour-selector__colour');
          var select = widget.querySelector('select');

          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            var _loop = function _loop() {
              var option = _step2.value;

              option.addEventListener('click', function () {
                _this2.unselectAll(options);
                option.classList.add('colour-selector__colour--current');
                select.value = option.dataset.value;
              });
            };

            for (var _iterator2 = options[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              _loop();
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
          var option = _step3.value;

          option.classList.remove('colour-selector__colour--current');
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

},{"./widget":46}],34:[function(require,module,exports){
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
          contentField.focus();
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

},{"../models/group":3,"../models/jot":4,"../preferences/group":14,"../utility/pubsub":31,"./colour-selector":33,"./view":45}],35:[function(require,module,exports){
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
          nameField.focus();
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

},{"../db/db":1,"../models/group":3,"../preferences/groups":15,"../utility/pubsub":31,"./colour-selector":33,"./view":45}],36:[function(require,module,exports){
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

},{"./view":45}],37:[function(require,module,exports){
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

},{"../models/group":3,"../models/jot":4,"../routers/path":19,"../utility/pubsub":31,"./view":45}],38:[function(require,module,exports){
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

},{"../models/jot":4,"../preferences/jots":16,"../utility/pubsub":31,"./view":45}],39:[function(require,module,exports){
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

          for (var index = 0; index < links.length; index++) {
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

},{"../utility/pubsub":31,"./widget":46}],40:[function(require,module,exports){
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

},{"./view":45}],41:[function(require,module,exports){
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

},{"./loading.js":40}],42:[function(require,module,exports){
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

},{"../utility/pubsub":31,"./view":45}],43:[function(require,module,exports){
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

var TitleBarView = (function (_View) {
  _inherits(TitleBarView, _View);

  function TitleBarView(container) {
    _classCallCheck(this, TitleBarView);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(TitleBarView).call(this, container));

    _this.registerWidget(ListOrder);

    _this._touchHandler = new Touch();
    _this._touchHandler.register('left', _this._closeNav.bind(_this));
    _this._touchHandler.register('right', _this._openNav.bind(_this));
    return _this;
  }

  _createClass(TitleBarView, [{
    key: 'render',
    value: function render(preRendered, params) {
      var _this2 = this;

      _get(Object.getPrototypeOf(TitleBarView.prototype), 'render', this).call(this, preRendered, params);

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
      var el = _get(Object.getPrototypeOf(TitleBarView.prototype), 'renderPartial', this).call(this, name, params);

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

      _get(Object.getPrototypeOf(TitleBarView.prototype), 'initEvents', this).call(this);

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
      _get(Object.getPrototypeOf(TitleBarView.prototype), 'cleanup', this).call(this);

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

  return TitleBarView;
})(View);

module.exports = TitleBarView;

},{"../utility/pubsub":31,"../utility/touch":32,"./list-order":39,"./view":45}],44:[function(require,module,exports){
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

},{}],45:[function(require,module,exports){
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

},{"../utility/pubsub":31,"handlebars/dist/handlebars.runtime":9}],46:[function(require,module,exports){
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

},{}]},{},[18])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJkYi9kYi5qcyIsIm1vZGVscy9Kb3QuanMiLCJtb2RlbHMvZ3JvdXAuanMiLCJtb2RlbHMvam90LmpzIiwibW9kZWxzL21vZGVsLmpzIiwibm9kZV9tb2R1bGVzL2F1dG9saW5rZXIvZGlzdC9BdXRvbGlua2VyLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbGliL19lbXB0eS5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0Y2xpY2svbGliL2Zhc3RjbGljay5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvaGFuZGxlYmFycy5ydW50aW1lLmpzIiwibm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGFnZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJwcmVmZXJlbmNlcy9ncm91cC5qcyIsInByZWZlcmVuY2VzL2dyb3Vwcy5qcyIsInByZWZlcmVuY2VzL2pvdHMuanMiLCJwcmVmZXJlbmNlcy9wcmVmZXJlbmNlcy5qcyIsInB1YmxpYy9qcy9hcHAuanMiLCJyb3V0ZXJzL3BhdGguanMiLCJyb3V0ZXMvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvZ3JvdXAuanMiLCJyb3V0ZXMvY2xpZW50L2hvbWUuanMiLCJyb3V0ZXMvY2xpZW50L2pvdC5qcyIsInJvdXRlcy9ncm91cC5qcyIsInJvdXRlcy9ob21lLmpzIiwicm91dGVzL2pvdC5qcyIsInJvdXRlcy9yb3V0ZXMuanMiLCJ0ZW1wbGF0ZXMvaGVscGVycy5qcyIsInV0aWxpdHkvZGF0ZS5qcyIsInV0aWxpdHkvcHVic3ViLmpzIiwidXRpbGl0eS90b3VjaC5qcyIsInZpZXdzL2NvbG91ci1zZWxlY3Rvci5qcyIsInZpZXdzL2dyb3VwLmpzIiwidmlld3MvZ3JvdXBzLmpzIiwidmlld3MvaG9tZS5qcyIsInZpZXdzL2ltcG9ydC5qcyIsInZpZXdzL2pvdHMuanMiLCJ2aWV3cy9saXN0LW9yZGVyLmpzIiwidmlld3MvbG9hZGluZy5qcyIsInZpZXdzL2xvYWRpbmdncm91cHMuanMiLCJ2aWV3cy9ub3RpZmljYXRpb24tbWFuYWdlci5qcyIsInZpZXdzL3RpdGxlYmFyLmpzIiwidmlld3Mvdmlldy1jb250YWluZXIuanMiLCJ2aWV3cy92aWV3LmpzIiwidmlld3Mvd2lkZ2V0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUEsWUFBWSxDQUFDOzs7Ozs7QUFFYixJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7SUFFdEMsRUFBRTtBQUNOLFdBREksRUFBRSxHQUNROzBCQURWLEVBQUU7O0FBRUosUUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsUUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7R0FDakI7O2VBSkcsRUFBRTs7eUJBVUQsT0FBTyxFQUFFOzs7QUFFWixhQUFPLEdBQUcsT0FBTyxJQUFJO0FBQ25CLGdCQUFRLEVBQUUsSUFBSTtBQUNkLGNBQU0sRUFBRSxJQUFJO0FBQ1osWUFBSSxFQUFFLElBQUk7QUFDVixnQkFBUSxFQUFFLElBQUk7QUFDZCxnQkFBUSxFQUFFLElBQUk7QUFDZCxjQUFNLEVBQUUsSUFBSTtPQUNiLENBQUM7O0FBRUYsVUFBSSxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ2xCLFlBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7O0FBRTdDLFlBQUksT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUNwQixjQUFJLENBQUMsWUFBWSxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7U0FDdkM7O0FBRUQsWUFBSSxPQUFPLENBQUMsUUFBUSxFQUFFO0FBQ3BCLGNBQUksQ0FBQyxZQUFZLElBQUksR0FB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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3d0ZBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDejBCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2gzQkE7QUFDQTtBQUNBO0FBQ0E7OztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUMzbUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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Y3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgREIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZW1vdGVDb3VjaCA9IG51bGw7XG4gICAgdGhpcy5fZGIgPSBudWxsO1xuICB9XG5cbiAgZ2V0IGRiKCkge1xuICAgIHJldHVybiB0aGlzLl9kYjtcbiAgfVxuXG4gIGluaXQob3B0aW9ucykge1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge1xuICAgICAgcHJvdG9jb2w6IG51bGwsXG4gICAgICBkb21haW46IG51bGwsXG4gICAgICBwb3J0OiBudWxsLFxuICAgICAgdXNlcm5hbWU6IG51bGwsXG4gICAgICBwYXNzd29yZDogbnVsbCxcbiAgICAgIGRiTmFtZTogbnVsbFxuICAgIH07XG5cbiAgICBpZiAob3B0aW9ucy5kb21haW4pIHtcbiAgICAgIHRoaXMuX3JlbW90ZUNvdWNoID0gb3B0aW9ucy5wcm90b2NvbCArICc6Ly8nO1xuXG4gICAgICBpZiAob3B0aW9ucy51c2VybmFtZSkge1xuICAgICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSBvcHRpb25zLnVzZXJuYW1lO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSAnOicgKyBvcHRpb25zLnBhc3N3b3JkO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy51c2VybmFtZSB8fCBvcHRpb25zLnBhc3N3b3JkKSB7XG4gICAgICAgIHRoaXMuX3JlbW90ZUNvdWNoICs9ICdAJztcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gb3B0aW9ucy5kb21haW47XG5cbiAgICAgIGlmIChvcHRpb25zLnBvcnQpIHtcbiAgICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gJzonICsgb3B0aW9ucy5wb3J0O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSAnLycgKyBvcHRpb25zLmRiTmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggPSBudWxsO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgUG91Y2hEQiAhPT0gJ3VuZGVmaW5lZCcpIHsgLy9icm93c2VyXG4gICAgICBQb3VjaERCLmRlYnVnLmRpc2FibGUoKTtcbiAgICAgIHRoaXMuX2RiID0gbmV3IFBvdWNoREIob3B0aW9ucy5kYk5hbWUsIHtcbiAgICAgICAgYXV0b19jb21wYWN0aW9uOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuX3JlbW90ZUNvdWNoKSB7XG5cbiAgICAgICAgY29uc3Qgb3B0cyA9IHtsaXZlOiB0cnVlLCByZXRyeTogdHJ1ZX07XG5cbiAgICAgICAgdGhpcy5fZGIucmVwbGljYXRlLnRvKHRoaXMuX3JlbW90ZUNvdWNoLCBvcHRzKS5vbignY2hhbmdlJywgaW5mbyA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIHRvIGNoYW5nZScpO1xuICAgICAgICB9KS5vbigncGF1c2VkJywgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBwYXVzZWQnKTtcbiAgICAgICAgfSkub24oJ2FjdGl2ZScsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gYWN0aXZlJyk7XG4gICAgICAgIH0pLm9uKCdkZW5pZWQnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gZGVuaWVkJywgaW5mbyk7XG4gICAgICAgIH0pLm9uKCdjb21wbGV0ZScsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBjb21wbGV0ZScpO1xuICAgICAgICB9KS5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBlcnJvcicsIGVycik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBjaGFuZ2VzID0gW107XG5cbiAgICAgICAgdGhpcy5fZGIucmVwbGljYXRlLmZyb20odGhpcy5fcmVtb3RlQ291Y2gsIG9wdHMpLm9uKCdjaGFuZ2UnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBjaGFuZ2UnLCBpbmZvKTtcbiAgICAgICAgICBjaGFuZ2VzID0gY2hhbmdlcy5jb25jYXQoaW5mby5kb2NzKTtcbiAgICAgICAgfSkub24oJ3BhdXNlZCcsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBwYXVzZWQnKTtcblxuICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCd1cGRhdGUnLCB7XG4gICAgICAgICAgICBjaGFuZ2VzXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjaGFuZ2VzID0gW107XG5cbiAgICAgICAgfSkub24oJ2FjdGl2ZScsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBhY3RpdmUnKTtcbiAgICAgICAgfSkub24oJ2RlbmllZCcsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIGRlbmllZCcsIGluZm8pO1xuICAgICAgICB9KS5vbignY29tcGxldGUnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBjb21wbGV0ZScsIGluZm8pO1xuICAgICAgICB9KS5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIGVycm9yJywgZXJyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRkb2MgPSB7XG4gICAgICAgICAgX2lkOiAnX2Rlc2lnbi9pbmRleCcsXG4gICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgIGdyb3VwOiB7XG4gICAgICAgICAgICAgIG1hcDogKGRvYyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvYy5maWVsZHMuZ3JvdXApIHtcbiAgICAgICAgICAgICAgICAgIGVtaXQoZG9jLmZpZWxkcy5ncm91cCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KS50b1N0cmluZygpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX2RiLnB1dChkZG9jKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAvLyBraWNrIG9mZiBhbiBpbml0aWFsIGJ1aWxkLCByZXR1cm4gaW1tZWRpYXRlbHlcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge3N0YWxlOiAndXBkYXRlX2FmdGVyJ30pO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy9jb25mbGljdCBvY2N1cmVkLCBpLmUuIGRkb2MgYWxyZWFkeSBleGlzdGVkXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IFBvdWNoREIgPSByZXF1aXJlKCdwb3VjaGRiJyk7XG4gICAgICBQb3VjaERCLmRlYnVnLmRpc2FibGUoKTtcblxuICAgICAgdGhpcy5fZGIgPSBuZXcgUG91Y2hEQih0aGlzLl9yZW1vdGVDb3VjaCk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGRicyA9IHtcbiAgJ21haW4nOiBuZXcgREIoKVxufTtcbmxldCBjdXJyZW50REIgPSAnbWFpbic7XG5cbm1vZHVsZS5leHBvcnRzID0gKG9wdGlvbnMsIGlkPWZhbHNlKSA9PiB7XG4gIGlmIChpZCAhPT0gZmFsc2UpIHtcbiAgICBjdXJyZW50REIgPSBpZDtcbiAgfVxuXG4gIGlmIChvcHRpb25zKSB7XG4gICAgaWYgKCFkYnNbY3VycmVudERCXSkge1xuICAgICAgZGJzW2N1cnJlbnREQl0gPSBuZXcgREIoKTtcbiAgICB9XG5cbiAgICBkYnNbY3VycmVudERCXS5pbml0KG9wdGlvbnMpO1xuICB9XG5cbiAgcmV0dXJuIGRic1tjdXJyZW50REJdLmRiO1xufTtcbiIsImNvbnN0IE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xuXG5jbGFzcyBKb3QgZXh0ZW5kcyBNb2RlbCB7XG5cbiAgY29uc3RydWN0b3IobWVtYmVycykge1xuICAgIHN1cGVyKG1lbWJlcnMsIFtcbiAgICAgICdjb250ZW50JyxcbiAgICAgICdncm91cCcsXG4gICAgICAnZG9uZScsXG4gICAgICAncHJpb3JpdHknXG4gICAgXSk7XG5cbiAgICB0aGlzLl9ncm91cCA9IG51bGw7XG4gIH1cblxuICBzdGF0aWMgZ2V0UHJpb3JpdGllcygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJzInLFxuICAgICAgJzEnLFxuICAgICAgJzAnXG4gICAgXTtcbiAgfVxuXG4gIGdldCBwcmlvcml0aWVzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldFByaW9yaXRpZXMoKTtcbiAgfVxuXG4gIGdldCBncm91cCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ3JvdXA7XG4gIH1cblxuICBnZXQgZ3JvdXBOYW1lKCkge1xuICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwLmZpZWxkcy5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJy0nO1xuICAgIH1cbiAgfVxuXG4gIGlzRG9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5maWVsZHMuZG9uZTtcbiAgfVxuXG4gIGxvYWRHcm91cCgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgcmV0dXJuIEdyb3VwLmxvYWQodGhpcy5maWVsZHMuZ3JvdXAsIGZhbHNlKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgdGhpcy5fZ3JvdXAgPSBncm91cDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRQZXJjZW50YWdlRG9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5sb2FkQWxsKGZhbHNlKS50aGVuKGpvdHMgPT4ge1xuICAgICAgbGV0IG51bURvbmUgPSBqb3RzLnJlZHVjZSgocHJldlZhbCwgam90KSA9PiB7XG4gICAgICAgIGlmIChqb3QuaXNEb25lKCkpIHtcbiAgICAgICAgICByZXR1cm4gcHJldlZhbCArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHByZXZWYWw7XG4gICAgICAgIH1cbiAgICAgIH0sIDApO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwZXJjZW50OiBwYXJzZUludCgobnVtRG9uZSAvIGpvdHMubGVuZ3RoKSAqIDEwMCwgMTApXG4gICAgICB9O1xuICAgIH0pXG5cbiAgICAudGhlbihzdGF0cyA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgcmV0dXJuIEdyb3VwLmxvYWRBbGwoZmFsc2UpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgc3RhdHMubnVtR3JvdXBzID0gZ3JvdXBzLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gc3RhdHM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkKGlkLCBsb2FkR3JvdXAgPSB0cnVlKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWQoaWQpLnRoZW4oam90ID0+IHtcbiAgICAgIGlmIChsb2FkR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIGpvdC5sb2FkR3JvdXAoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gam90O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBqb3Q7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEFsbChsb2FkR3JvdXBzID0gdHJ1ZSwgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBzdXBlci5sb2FkQWxsKCkudGhlbihqb3RzID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICBpZiAobG9hZEdyb3Vwcykge1xuICAgICAgICBwcm9taXNlcy5wdXNoKEdyb3VwLmxvYWRGb3JKb3RzKGpvdHMpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoam90cywgb3JkZXIsIGRpcmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBvcmRlcihqb3RzLCBzb3J0T3JkZXIgPSAnYWxwaGEnLCBzb3J0RGlyZWN0aW9uID0gJ2FzYycpIHtcblxuICAgIHN3aXRjaCAoc29ydE9yZGVyKSB7XG4gICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA+IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA8IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2FscGhhJzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSA+IGIuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSA8IGIuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3ByaW9yaXR5JzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuZmllbGRzLnByaW9yaXR5ID4gYi5maWVsZHMucHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLmZpZWxkcy5wcmlvcml0eSA8IGIuZmllbGRzLnByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzb3J0RGlyZWN0aW9uID09PSAnZGVzYycpIHtcbiAgICAgIGpvdHMucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVuZG9uZUpvdHMgPSBbXTtcbiAgICBjb25zdCBkb25lSm90cyA9IFtdO1xuXG4gICAgam90cy5mb3JFYWNoKGpvdCA9PiB7XG4gICAgICBpZiAoam90LmlzRG9uZSgpKSB7XG4gICAgICAgIGRvbmVKb3RzLnB1c2goam90KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZG9uZUpvdHMucHVzaChqb3QpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVuZG9uZUpvdHMuY29uY2F0KGRvbmVKb3RzKTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkRm9yR3JvdXAoZ3JvdXBJZCwgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge1xuICAgICAgICBkZXNjZW5kaW5nOiB0cnVlLFxuICAgICAgICBrZXk6IGdyb3VwSWQsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBqb3RzID0gW107XG5cbiAgICAgICAgcmVzdWx0LnJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgIGpvdHMucHVzaChuZXcgdGhpcyhyb3cuZG9jKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm9yZGVyKGpvdHMsIG9yZGVyLCBkaXJlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEZvckdyb3Vwcyhncm91cHMsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGdyb3VwSWRzID0gZ3JvdXBzLm1hcChncm91cCA9PiBncm91cC5pZCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLnF1ZXJ5KCdpbmRleC9ncm91cCcsIHtcbiAgICAgICAga2V5czogZ3JvdXBJZHMsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBncm91cEpvdHMgPSB7fTtcblxuICAgICAgICBncm91cElkcy5mb3JFYWNoKGdyb3VwSWQgPT4ge1xuICAgICAgICAgIGdyb3VwSm90c1tncm91cElkXSA9IFtdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgZ3JvdXBKb3RzW3Jvdy5kb2MuZmllbGRzLmdyb3VwXS5wdXNoKG5ldyB0aGlzKHJvdy5kb2MpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ3JvdXBzLmZvckVhY2goZ3JvdXAgPT4ge1xuICAgICAgICAgIGdyb3VwLl9qb3RzID0gZ3JvdXBKb3RzW2dyb3VwLmlkXTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvdDtcbiIsImNvbnN0IE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xuY29uc3QgSm90ID0gcmVxdWlyZSgnLi9qb3QnKTtcblxuY2xhc3MgR3JvdXAgZXh0ZW5kcyBNb2RlbCB7XG5cbiAgY29uc3RydWN0b3IobWVtYmVycykge1xuICAgIHN1cGVyKG1lbWJlcnMsIFtcbiAgICAgICduYW1lJyxcbiAgICAgICdjb2xvdXInXG4gICAgXSk7XG5cbiAgICB0aGlzLl9qb3RzID0gW107XG4gIH1cblxuICBzdGF0aWMgZ2V0Q29sb3VycygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ2JsdWUnLFxuICAgICAgJ3JlZCcsXG4gICAgICAndGVhbCcsXG4gICAgICAneWVsbG93JyxcbiAgICAgICdvcmFuZ2UnLFxuICAgICAgJ2Jyb3duJ1xuICAgIF07XG4gIH1cblxuICBnZXQgY29sb3VycygpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRDb2xvdXJzKCk7XG4gIH1cblxuICBnZXQgam90cygpIHtcbiAgICByZXR1cm4gdGhpcy5fam90cztcbiAgfVxuXG4gIHNldCBqb3RzKGpvdHMpIHtcbiAgICB0aGlzLl9qb3RzID0gam90cztcbiAgfVxuXG4gIGdldEpvdHMoZG9uZSA9IG51bGwpIHtcbiAgICBpZiAoZG9uZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuam90cztcbiAgICB9IGVsc2UgaWYgKGRvbmUpIHtcbiAgICAgIHJldHVybiB0aGlzLmpvdHMuZmlsdGVyKGpvdCA9PiAhIWpvdC5maWVsZHMuZG9uZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmpvdHMuZmlsdGVyKGpvdCA9PiAham90LmZpZWxkcy5kb25lKTtcbiAgICB9XG4gIH1cblxuICBnZXQgam90Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvdHMubGVuZ3RoO1xuICB9XG5cbiAgZ2V0IGpvdERvbmVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fam90cy5maWx0ZXIoam90ID0+ICEham90LmZpZWxkcy5kb25lKS5sZW5ndGg7XG4gIH1cblxuICBsb2FkSm90cyhvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIEpvdC5sb2FkRm9yR3JvdXAodGhpcy5pZCwgb3JkZXIsIGRpcmVjdGlvbikudGhlbihqb3RzID0+IHtcbiAgICAgIHRoaXMuX2pvdHMgPSBqb3RzO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZChpZCwgbG9hZEpvdHMgPSB0cnVlLCBqb3RPcmRlciA9ICdhbHBoYScsIGpvdERpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWQoaWQpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgaWYgKGxvYWRKb3RzKSB7XG4gICAgICAgIHJldHVybiBncm91cC5sb2FkSm90cyhqb3RPcmRlciwgam90RGlyZWN0aW9uKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRBbGwobG9hZEpvdHMgPSB0cnVlLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICBpZiAobG9hZEpvdHMpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChKb3QubG9hZEZvckdyb3Vwcyhncm91cHMpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoZ3JvdXBzLCBvcmRlciwgZGlyZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRGb3JKb3RzKGpvdHMpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGdyb3VwSWRzID0gam90cy5tYXAoam90ID0+IGpvdC5maWVsZHMuZ3JvdXApO1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5hbGxEb2NzKHtcbiAgICAgICAgZGVzY2VuZGluZzogdHJ1ZSxcbiAgICAgICAga2V5czogZ3JvdXBJZHMsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBqb3RHcm91cHMgPSB7fTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgam90R3JvdXBzW3Jvdy5kb2MuX2lkXSA9IG5ldyB0aGlzKHJvdy5kb2MpO1xuICAgICAgICB9KTtcblxuICAgICAgICBqb3RzLmZvckVhY2goam90ID0+IHtcbiAgICAgICAgICBqb3QuX2dyb3VwID0gam90R3JvdXBzW2pvdC5maWVsZHMuZ3JvdXBdO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG9yZGVyKGdyb3Vwcywgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuXG4gICAgc3dpdGNoIChvcmRlcikge1xuICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgIGdyb3Vwcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA+IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA8IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2FscGhhJzpcbiAgICAgICAgZ3JvdXBzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpID4gYi5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpIDwgYi5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3Rpb24gPT09ICdkZXNjJykge1xuICAgICAgZ3JvdXBzLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JvdXBzO1xuICB9XG5cbiAgc3RhdGljIHJlbW92ZShpZCkge1xuICAgIHJldHVybiBzdXBlci5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuXG4gICAgICByZXR1cm4gSm90LmxvYWRGb3JHcm91cChpZCkudGhlbihqb3RzID0+IHtcbiAgICAgICAgY29uc3QgZG9jcyA9IGpvdHMubWFwKGpvdCA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIF9pZDogam90LmlkLFxuICAgICAgICAgICAgX3Jldjogam90LnJldixcbiAgICAgICAgICAgIF9kZWxldGVkOiB0cnVlXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuYnVsa0RvY3MoZG9jcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgaW1wb3J0RnJvbUxvY2FsKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgUG91Y2hEQiA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zZXJ2ZXJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvL2xvYWQgbG9jYWwgZGJcbiAgICAgIHJlcXVpcmUoJy4uL2RiL2RiJykoe1xuICAgICAgICBkYk5hbWU6ICdqb3QtbG9jYWwnXG4gICAgICB9LCAnbG9jYWwnKTtcblxuICAgICAgcmV0dXJuIHRoaXMubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgLy9yZXN0b3JlIG1haW4gZGJcbiAgICAgICAgcmVxdWlyZSgnLi4vZGIvZGInKShudWxsLCAnbWFpbicpO1xuXG4gICAgICAgIHJldHVybiBncm91cHM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyByZW1vdmVGcm9tTG9jYWwoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBQb3VjaERCID09PSAndW5kZWZpbmVkJykgeyAvL3NlcnZlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vbG9hZCBsb2NhbCBkYlxuICAgICAgcmVxdWlyZSgnLi4vZGIvZGInKSh7XG4gICAgICAgIGRiTmFtZTogJ2pvdC1sb2NhbCdcbiAgICAgIH0sICdsb2NhbCcpO1xuXG4gICAgICByZXR1cm4gdGhpcy5sb2FkQWxsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuICAgICAgICBncm91cHMuZm9yRWFjaChncm91cCA9PiB7XG4gICAgICAgICAgcHJvbWlzZXMucHVzaChHcm91cC5yZW1vdmUoZ3JvdXAuaWQpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL3Jlc3RvcmUgbWFpbiBkYlxuICAgICAgICByZXF1aXJlKCcuLi9kYi9kYicpKG51bGwsICdtYWluJyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xuIiwiY29uc3QgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG5cbmNsYXNzIEpvdCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihtZW1iZXJzKSB7XG4gICAgc3VwZXIobWVtYmVycywgW1xuICAgICAgJ2NvbnRlbnQnLFxuICAgICAgJ2dyb3VwJyxcbiAgICAgICdkb25lJyxcbiAgICAgICdwcmlvcml0eSdcbiAgICBdKTtcblxuICAgIHRoaXMuX2dyb3VwID0gbnVsbDtcbiAgfVxuXG4gIHN0YXRpYyBnZXRQcmlvcml0aWVzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnMicsXG4gICAgICAnMScsXG4gICAgICAnMCdcbiAgICBdO1xuICB9XG5cbiAgZ2V0IHByaW9yaXRpZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0UHJpb3JpdGllcygpO1xuICB9XG5cbiAgZ2V0IGdyb3VwKCkge1xuICAgIHJldHVybiB0aGlzLl9ncm91cDtcbiAgfVxuXG4gIGdldCBncm91cE5hbWUoKSB7XG4gICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ3JvdXAuZmllbGRzLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnLSc7XG4gICAgfVxuICB9XG5cbiAgaXNEb25lKCkge1xuICAgIHJldHVybiB0aGlzLmZpZWxkcy5kb25lO1xuICB9XG5cbiAgbG9hZEdyb3VwKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICByZXR1cm4gR3JvdXAubG9hZCh0aGlzLmZpZWxkcy5ncm91cCwgZmFsc2UpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICB0aGlzLl9ncm91cCA9IGdyb3VwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldFBlcmNlbnRhZ2VEb25lKCkge1xuICAgIHJldHVybiB0aGlzLmxvYWRBbGwoZmFsc2UpLnRoZW4oam90cyA9PiB7XG4gICAgICBsZXQgbnVtRG9uZSA9IGpvdHMucmVkdWNlKChwcmV2VmFsLCBqb3QpID0+IHtcbiAgICAgICAgaWYgKGpvdC5pc0RvbmUoKSkge1xuICAgICAgICAgIHJldHVybiBwcmV2VmFsICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcHJldlZhbDtcbiAgICAgICAgfVxuICAgICAgfSwgMCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBlcmNlbnQ6IHBhcnNlSW50KChudW1Eb25lIC8gam90cy5sZW5ndGgpICogMTAwLCAxMClcbiAgICAgIH07XG4gICAgfSlcblxuICAgIC50aGVuKHN0YXRzID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICByZXR1cm4gR3JvdXAubG9hZEFsbChmYWxzZSkudGhlbihncm91cHMgPT4ge1xuICAgICAgICBzdGF0cy5udW1Hcm91cHMgPSBncm91cHMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiBzdGF0cztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWQoaWQsIGxvYWRHcm91cCA9IHRydWUpIHtcbiAgICByZXR1cm4gc3VwZXIubG9hZChpZCkudGhlbihqb3QgPT4ge1xuICAgICAgaWYgKGxvYWRHcm91cCkge1xuICAgICAgICByZXR1cm4gam90LmxvYWRHcm91cCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBqb3Q7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGpvdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkQWxsKGxvYWRHcm91cHMgPSB0cnVlLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWRBbGwoKS50aGVuKGpvdHMgPT4ge1xuICAgICAgY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5cbiAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICAgIGlmIChsb2FkR3JvdXBzKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2goR3JvdXAubG9hZEZvckpvdHMoam90cykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmRlcihqb3RzLCBvcmRlciwgZGlyZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG9yZGVyKGpvdHMsIHNvcnRPcmRlciA9ICdhbHBoYScsIHNvcnREaXJlY3Rpb24gPSAnYXNjJykge1xuXG4gICAgc3dpdGNoIChzb3J0T3JkZXIpIHtcbiAgICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkID4gYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkIDwgYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYWxwaGEnOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpID4gYi5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpIDwgYi5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHJpb3JpdHknOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMucHJpb3JpdHkgPiBiLmZpZWxkcy5wcmlvcml0eSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuZmllbGRzLnByaW9yaXR5IDwgYi5maWVsZHMucHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHNvcnREaXJlY3Rpb24gPT09ICdkZXNjJykge1xuICAgICAgam90cy5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgdW5kb25lSm90cyA9IFtdO1xuICAgIGNvbnN0IGRvbmVKb3RzID0gW107XG5cbiAgICBqb3RzLmZvckVhY2goam90ID0+IHtcbiAgICAgIGlmIChqb3QuaXNEb25lKCkpIHtcbiAgICAgICAgZG9uZUpvdHMucHVzaChqb3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5kb25lSm90cy5wdXNoKGpvdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdW5kb25lSm90cy5jb25jYXQoZG9uZUpvdHMpO1xuICB9XG5cbiAgc3RhdGljIGxvYWRGb3JHcm91cChncm91cElkLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5xdWVyeSgnaW5kZXgvZ3JvdXAnLCB7XG4gICAgICAgIGRlc2NlbmRpbmc6IHRydWUsXG4gICAgICAgIGtleTogZ3JvdXBJZCxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IGpvdHMgPSBbXTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgam90cy5wdXNoKG5ldyB0aGlzKHJvdy5kb2MpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoam90cywgb3JkZXIsIGRpcmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkRm9yR3JvdXBzKGdyb3Vwcywgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgY29uc3QgZ3JvdXBJZHMgPSBncm91cHMubWFwKGdyb3VwID0+IGdyb3VwLmlkKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge1xuICAgICAgICBrZXlzOiBncm91cElkcyxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IGdyb3VwSm90cyA9IHt9O1xuXG4gICAgICAgIGdyb3VwSWRzLmZvckVhY2goZ3JvdXBJZCA9PiB7XG4gICAgICAgICAgZ3JvdXBKb3RzW2dyb3VwSWRdID0gW107XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5yb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICBncm91cEpvdHNbcm93LmRvYy5maWVsZHMuZ3JvdXBdLnB1c2gobmV3IHRoaXMocm93LmRvYykpO1xuICAgICAgICB9KTtcblxuICAgICAgICBncm91cHMuZm9yRWFjaChncm91cCA9PiB7XG4gICAgICAgICAgZ3JvdXAuX2pvdHMgPSBncm91cEpvdHNbZ3JvdXAuaWRdO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSm90O1xuIiwiY29uc3QgRGF0ZVV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9kYXRlJyk7XG5cbmNsYXNzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihtZW1iZXJzLCBhbGxvd2VkRmllbGRzKSB7XG4gICAgdGhpcy5faWQgPSBtZW1iZXJzLl9pZCB8fCBudWxsO1xuICAgIHRoaXMuX3JldiA9IG1lbWJlcnMuX3JldiB8fCBudWxsO1xuXG4gICAgdGhpcy5fZGF0ZUFkZGVkID0gbWVtYmVycy5kYXRlQWRkZWQgfHwgbnVsbDtcblxuICAgIHRoaXMuX2ZpZWxkcyA9IG1lbWJlcnMuZmllbGRzIHx8IHt9O1xuXG4gICAgdGhpcy5fYWxsb3dlZEZpZWxkcyA9IGFsbG93ZWRGaWVsZHM7XG4gIH1cblxuICBzdGF0aWMgZ2V0IGRiKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuLi9kYi9kYicpKCk7XG4gIH1cblxuICBzdGF0aWMgZ2V0UmVmTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gIH1cblxuICBnZXQgcmVmTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRSZWZOYW1lKCk7XG4gIH1cblxuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lkO1xuICB9XG5cbiAgc2V0IGlkKGlkKSB7XG4gICAgdGhpcy5faWQgPSBpZDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IHJldigpIHtcbiAgICByZXR1cm4gdGhpcy5fcmV2O1xuICB9XG5cbiAgc2V0IHJldihyZXYpIHtcbiAgICB0aGlzLl9yZXYgPSByZXY7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCBkYXRlQWRkZWQoKSB7XG4gICAgaWYgKHRoaXMuX2RhdGVBZGRlZCkge1xuICAgICAgcmV0dXJuIERhdGVVdGlscy5mb3JtYXQobmV3IERhdGUodGhpcy5fZGF0ZUFkZGVkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1cblxuICBzZXQgZGF0ZUFkZGVkKGRhdGUpIHtcbiAgICB0aGlzLl9kYXRlQWRkZWQgPSBkYXRlO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXQgZmllbGRzKGZpZWxkcykge1xuICAgIHRoaXMuX2ZpZWxkcyA9IHt9O1xuXG4gICAgZm9yIChsZXQgZmllbGROYW1lIGluIGZpZWxkcykge1xuICAgICAgaWYgKHRoaXMuX2FsbG93ZWRGaWVsZHMuaW5kZXhPZihmaWVsZE5hbWUpID4gLTEpIHtcbiAgICAgICAgdGhpcy5fZmllbGRzW2ZpZWxkTmFtZV0gPSBmaWVsZHNbZmllbGROYW1lXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCBmaWVsZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpZWxkcztcbiAgfVxuXG4gIGlzTmV3KCkge1xuICAgIHJldHVybiAhdGhpcy5pZDtcbiAgfVxuXG4gIGdldFNsdWcoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmlzTmV3KCkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzbHVnID0gdGhpcy5yZWZOYW1lICsgJy0nO1xuXG4gICAgICAgIGNvbnN0IHBhZGRpbmcgPSA1OyAvL3RoZSBsZW5ndGggb2YgdGhlIG51bWJlciwgZS5nLiAnNScgd2lsbCBzdGFydCBhdCAwMDAwMCwgMDAwMDEsIGV0Yy5cblxuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5kYi5hbGxEb2NzKHtcbiAgICAgICAgICBzdGFydGtleTogc2x1ZyArICdcXHVmZmZmJyxcbiAgICAgICAgICBlbmRrZXk6IHNsdWcsXG4gICAgICAgICAgZGVzY2VuZGluZzogdHJ1ZSxcbiAgICAgICAgICBsaW1pdDogMVxuICAgICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgaWYgKHJlc3VsdC5yb3dzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3REb2MgPSByZXN1bHQucm93c1tyZXN1bHQucm93cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3ROdW0gPSBwYXJzZUludChsYXN0RG9jLmlkLnN1YnN0cmluZyhzbHVnLmxlbmd0aCksIDEwKTtcblxuICAgICAgICAgICAgcmV0dXJuIHNsdWcgKyAoJzAnLnJlcGVhdChwYWRkaW5nKSArIChsYXN0TnVtICsgMSkpLnNsaWNlKC1wYWRkaW5nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNsdWcgKyAnMCcucmVwZWF0KHBhZGRpbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLmdldFNsdWcoKS50aGVuKHNsdWcgPT4ge1xuICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICBfaWQ6IHNsdWcsXG4gICAgICAgIGRhdGVBZGRlZDogdGhpcy5fZGF0ZUFkZGVkLFxuICAgICAgICBmaWVsZHM6IHRoaXMuZmllbGRzXG4gICAgICB9O1xuXG4gICAgICBpZiAoIXRoaXMuaXNOZXcoKSkge1xuICAgICAgICBwYXJhbXMuX3JldiA9IHRoaXMucmV2O1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pc05ldygpICYmICF0aGlzLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgcGFyYW1zLmRhdGVBZGRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZGIucHV0KHBhcmFtcykudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgIHRoaXMuaWQgPSByZXNwb25zZS5pZDtcbiAgICAgICAgICB0aGlzLnJldiA9IHJlc3BvbnNlLnJldjtcblxuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkQWxsKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIuYWxsRG9jcyh7XG4gICAgICAgIGVuZGtleTogdGhpcy5nZXRSZWZOYW1lKCkgKyAnLScsXG4gICAgICAgIHN0YXJ0a2V5OiB0aGlzLmdldFJlZk5hbWUoKSArICctXFx1ZmZmZicsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZSxcbiAgICAgICAgZGVzY2VuZGluZzogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBtb2RlbHMgPSBbXTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgbW9kZWxzLnB1c2gobmV3IHRoaXMocm93LmRvYykpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbW9kZWxzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZChpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgaWQgIT09ICd1bmRlZmluZWQnKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuZ2V0KGlkKS50aGVuKGRvYyA9PiB7XG4gICAgICAgICAgcmV0dXJuIG5ldyB0aGlzKGRvYyk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyByZW1vdmUoaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLmdldChpZCkudGhlbihkb2MgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5yZW1vdmUoZG9jKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGluc2VydChtZW1iZXJzKSB7XG4gICAgY29uc3QgbW9kZWwgPSBuZXcgdGhpcyhtZW1iZXJzKTtcbiAgICByZXR1cm4gbW9kZWwuc2F2ZSgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZSB1bmxlc3MgYW1kTW9kdWxlSWQgaXMgc2V0XG4gICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gKHJvb3RbJ0F1dG9saW5rZXInXSA9IGZhY3RvcnkoKSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gTm9kZS4gRG9lcyBub3Qgd29yayB3aXRoIHN0cmljdCBDb21tb25KUywgYnV0XG4gICAgLy8gb25seSBDb21tb25KUy1saWtlIGVudmlyb25tZW50cyB0aGF0IHN1cHBvcnQgbW9kdWxlLmV4cG9ydHMsXG4gICAgLy8gbGlrZSBOb2RlLlxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIHJvb3RbJ0F1dG9saW5rZXInXSA9IGZhY3RvcnkoKTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbi8qIVxuICogQXV0b2xpbmtlci5qc1xuICogMC4xOS4wXG4gKlxuICogQ29weXJpZ2h0KGMpIDIwMTUgR3JlZ29yeSBKYWNvYnMgPGdyZWdAZ3JlZy1qYWNvYnMuY29tPlxuICogTUlUIExpY2Vuc2VkLiBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9ncmVnamFjb2JzL0F1dG9saW5rZXIuanNcbiAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogVXRpbGl0eSBjbGFzcyB1c2VkIHRvIHByb2Nlc3MgYSBnaXZlbiBzdHJpbmcgb2YgdGV4dCwgYW5kIHdyYXAgdGhlIG1hdGNoZXMgaW5cbiAqIHRoZSBhcHByb3ByaWF0ZSBhbmNob3IgKCZsdDthJmd0OykgdGFncyB0byB0dXJuIHRoZW0gaW50byBsaW5rcy5cbiAqXG4gKiBBbnkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBtYXkgYmUgcHJvdmlkZWQgaW4gYW4gT2JqZWN0IChtYXApIHByb3ZpZGVkXG4gKiB0byB0aGUgQXV0b2xpbmtlciBjb25zdHJ1Y3Rvciwgd2hpY2ggd2lsbCBjb25maWd1cmUgaG93IHRoZSB7QGxpbmsgI2xpbmsgbGluaygpfVxuICogbWV0aG9kIHdpbGwgcHJvY2VzcyB0aGUgbGlua3MuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciBhdXRvbGlua2VyID0gbmV3IEF1dG9saW5rZXIoIHtcbiAqICAgICAgICAgbmV3V2luZG93IDogZmFsc2UsXG4gKiAgICAgICAgIHRydW5jYXRlICA6IDMwXG4gKiAgICAgfSApO1xuICpcbiAqICAgICB2YXIgaHRtbCA9IGF1dG9saW5rZXIubGluayggXCJKb2Ugd2VudCB0byB3d3cueWFob28uY29tXCIgKTtcbiAqICAgICAvLyBwcm9kdWNlczogJ0pvZSB3ZW50IHRvIDxhIGhyZWY9XCJodHRwOi8vd3d3LnlhaG9vLmNvbVwiPnlhaG9vLmNvbTwvYT4nXG4gKlxuICpcbiAqIFRoZSB7QGxpbmsgI3N0YXRpYy1saW5rIHN0YXRpYyBsaW5rKCl9IG1ldGhvZCBtYXkgYWxzbyBiZSB1c2VkIHRvIGlubGluZSBvcHRpb25zIGludG8gYSBzaW5nbGUgY2FsbCwgd2hpY2ggbWF5XG4gKiBiZSBtb3JlIGNvbnZlbmllbnQgZm9yIG9uZS1vZmYgdXNlcy4gRm9yIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIkpvZSB3ZW50IHRvIHd3dy55YWhvby5jb21cIiwge1xuICogICAgICAgICBuZXdXaW5kb3cgOiBmYWxzZSxcbiAqICAgICAgICAgdHJ1bmNhdGUgIDogMzBcbiAqICAgICB9ICk7XG4gKiAgICAgLy8gcHJvZHVjZXM6ICdKb2Ugd2VudCB0byA8YSBocmVmPVwiaHR0cDovL3d3dy55YWhvby5jb21cIj55YWhvby5jb208L2E+J1xuICpcbiAqXG4gKiAjIyBDdXN0b20gUmVwbGFjZW1lbnRzIG9mIExpbmtzXG4gKlxuICogSWYgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBkbyBub3QgcHJvdmlkZSBlbm91Z2ggZmxleGliaWxpdHksIGEge0BsaW5rICNyZXBsYWNlRm59XG4gKiBtYXkgYmUgcHJvdmlkZWQgdG8gZnVsbHkgY3VzdG9taXplIHRoZSBvdXRwdXQgb2YgQXV0b2xpbmtlci4gVGhpcyBmdW5jdGlvbiBpc1xuICogY2FsbGVkIG9uY2UgZm9yIGVhY2ggVVJML0VtYWlsL1Bob25lIy9Ud2l0dGVyIEhhbmRsZS9IYXNodGFnIG1hdGNoIHRoYXQgaXNcbiAqIGVuY291bnRlcmVkLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICpcbiAqICAgICB2YXIgaW5wdXQgPSBcIi4uLlwiOyAgLy8gc3RyaW5nIHdpdGggVVJMcywgRW1haWwgQWRkcmVzc2VzLCBQaG9uZSAjcywgVHdpdHRlciBIYW5kbGVzLCBhbmQgSGFzaHRhZ3NcbiAqXG4gKiAgICAgdmFyIGxpbmtlZFRleHQgPSBBdXRvbGlua2VyLmxpbmsoIGlucHV0LCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImhyZWYgPSBcIiwgbWF0Y2guZ2V0QW5jaG9ySHJlZigpICk7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ0ZXh0ID0gXCIsIG1hdGNoLmdldEFuY2hvclRleHQoKSApO1xuICpcbiAqICAgICAgICAgICAgIHN3aXRjaCggbWF0Y2guZ2V0VHlwZSgpICkge1xuICogICAgICAgICAgICAgICAgIGNhc2UgJ3VybCcgOlxuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ1cmw6IFwiLCBtYXRjaC5nZXRVcmwoKSApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgaWYoIG1hdGNoLmdldFVybCgpLmluZGV4T2YoICdteXNpdGUuY29tJyApID09PSAtMSApIHtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4gYEF1dG9saW5rZXIuSHRtbFRhZ2AgaW5zdGFuY2UsIHdoaWNoIHByb3ZpZGVzIG11dGF0b3IgbWV0aG9kcyBmb3IgZWFzeSBjaGFuZ2VzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0ciggJ3JlbCcsICdub2ZvbGxvdycgKTtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hZGRDbGFzcyggJ2V4dGVybmFsLWxpbmsnICk7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhZztcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgIC8vIGxldCBBdXRvbGlua2VyIHBlcmZvcm0gaXRzIG5vcm1hbCBhbmNob3IgdGFnIHJlcGxhY2VtZW50XG4gKiAgICAgICAgICAgICAgICAgICAgIH1cbiAqXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnIDpcbiAqICAgICAgICAgICAgICAgICAgICAgdmFyIGVtYWlsID0gbWF0Y2guZ2V0RW1haWwoKTtcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwiZW1haWw6IFwiLCBlbWFpbCApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgaWYoIGVtYWlsID09PSBcIm15QG93bi5hZGRyZXNzXCIgKSB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7ICAvLyBkb24ndCBhdXRvLWxpbmsgdGhpcyBwYXJ0aWN1bGFyIGVtYWlsIGFkZHJlc3M7IGxlYXZlIGFzLWlzXG4gKiAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47ICAvLyBubyByZXR1cm4gdmFsdWUgd2lsbCBoYXZlIEF1dG9saW5rZXIgcGVyZm9ybSBpdHMgbm9ybWFsIGFuY2hvciB0YWcgcmVwbGFjZW1lbnQgKHNhbWUgYXMgcmV0dXJuaW5nIGB0cnVlYClcbiAqICAgICAgICAgICAgICAgICAgICAgfVxuICpcbiAqICAgICAgICAgICAgICAgICBjYXNlICdwaG9uZScgOlxuICogICAgICAgICAgICAgICAgICAgICB2YXIgcGhvbmVOdW1iZXIgPSBtYXRjaC5nZXRQaG9uZU51bWJlcigpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggcGhvbmVOdW1iZXIgKTtcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly9uZXdwbGFjZS50by5saW5rLnBob25lLm51bWJlcnMudG8vXCI+JyArIHBob25lTnVtYmVyICsgJzwvYT4nO1xuICpcbiAqICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciB0d2l0dGVySGFuZGxlID0gbWF0Y2guZ2V0VHdpdHRlckhhbmRsZSgpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggdHdpdHRlckhhbmRsZSApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovL25ld3BsYWNlLnRvLmxpbmsudHdpdHRlci5oYW5kbGVzLnRvL1wiPicgKyB0d2l0dGVySGFuZGxlICsgJzwvYT4nO1xuICpcbiAqICAgICAgICAgICAgICAgICBjYXNlICdoYXNodGFnJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciBoYXNodGFnID0gbWF0Y2guZ2V0SGFzaHRhZygpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggaGFzaHRhZyApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovL25ld3BsYWNlLnRvLmxpbmsuaGFzaHRhZy5oYW5kbGVzLnRvL1wiPicgKyBoYXNodGFnICsgJzwvYT4nO1xuICogICAgICAgICAgICAgfVxuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICpcbiAqXG4gKiBUaGUgZnVuY3Rpb24gbWF5IHJldHVybiB0aGUgZm9sbG93aW5nIHZhbHVlczpcbiAqXG4gKiAtIGB0cnVlYCAoQm9vbGVhbik6IEFsbG93IEF1dG9saW5rZXIgdG8gcmVwbGFjZSB0aGUgbWF0Y2ggYXMgaXQgbm9ybWFsbHkgd291bGQuXG4gKiAtIGBmYWxzZWAgKEJvb2xlYW4pOiBEbyBub3QgcmVwbGFjZSB0aGUgY3VycmVudCBtYXRjaCBhdCBhbGwgLSBsZWF2ZSBhcy1pcy5cbiAqIC0gQW55IFN0cmluZzogSWYgYSBzdHJpbmcgaXMgcmV0dXJuZWQgZnJvbSB0aGUgZnVuY3Rpb24sIHRoZSBzdHJpbmcgd2lsbCBiZSB1c2VkIGRpcmVjdGx5IGFzIHRoZSByZXBsYWNlbWVudCBIVE1MIGZvclxuICogICB0aGUgbWF0Y2guXG4gKiAtIEFuIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWd9IGluc3RhbmNlLCB3aGljaCBjYW4gYmUgdXNlZCB0byBidWlsZC9tb2RpZnkgYW4gSFRNTCB0YWcgYmVmb3JlIHdyaXRpbmcgb3V0IGl0cyBIVE1MIHRleHQuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gW2NvbmZpZ10gVGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEF1dG9saW5rZXIgaW5zdGFuY2UsIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuXG4gKi9cbnZhciBBdXRvbGlua2VyID0gZnVuY3Rpb24oIGNmZyApIHtcblx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7ICAvLyBhc3NpZ24gdGhlIHByb3BlcnRpZXMgb2YgYGNmZ2Agb250byB0aGUgQXV0b2xpbmtlciBpbnN0YW5jZS4gUHJvdG90eXBlIHByb3BlcnRpZXMgd2lsbCBiZSB1c2VkIGZvciBtaXNzaW5nIGNvbmZpZ3MuXG5cblx0Ly8gVmFsaWRhdGUgdGhlIHZhbHVlIG9mIHRoZSBgaGFzaHRhZ2AgY2ZnLlxuXHR2YXIgaGFzaHRhZyA9IHRoaXMuaGFzaHRhZztcblx0aWYoIGhhc2h0YWcgIT09IGZhbHNlICYmIGhhc2h0YWcgIT09ICd0d2l0dGVyJyAmJiBoYXNodGFnICE9PSAnZmFjZWJvb2snICYmIGhhc2h0YWcgIT09ICdpbnN0YWdyYW0nICkge1xuXHRcdHRocm93IG5ldyBFcnJvciggXCJpbnZhbGlkIGBoYXNodGFnYCBjZmcgLSBzZWUgZG9jc1wiICk7XG5cdH1cbn07XG5cbkF1dG9saW5rZXIucHJvdG90eXBlID0ge1xuXHRjb25zdHJ1Y3RvciA6IEF1dG9saW5rZXIsICAvLyBmaXggY29uc3RydWN0b3IgcHJvcGVydHlcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gdXJsc1xuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgbWlzY2VsbGFuZW91cyBVUkxzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCwgYGZhbHNlYCBpZiB0aGV5IHNob3VsZCBub3QgYmUuXG5cdCAqL1xuXHR1cmxzIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gZW1haWxcblx0ICpcblx0ICogYHRydWVgIGlmIGVtYWlsIGFkZHJlc3NlcyBzaG91bGQgYmUgYXV0b21hdGljYWxseSBsaW5rZWQsIGBmYWxzZWAgaWYgdGhleSBzaG91bGQgbm90IGJlLlxuXHQgKi9cblx0ZW1haWwgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSB0d2l0dGVyXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiBUd2l0dGVyIGhhbmRsZXMgKFwiQGV4YW1wbGVcIikgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbGlua2VkLCBgZmFsc2VgIGlmIHRoZXkgc2hvdWxkIG5vdCBiZS5cblx0ICovXG5cdHR3aXR0ZXIgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBwaG9uZVxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgUGhvbmUgbnVtYmVycyAoXCIoNTU1KTU1NS01NTU1XCIpIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCwgYGZhbHNlYCBpZiB0aGV5IHNob3VsZCBub3QgYmUuXG5cdCAqL1xuXHRwaG9uZTogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbi9TdHJpbmd9IGhhc2h0YWdcblx0ICpcblx0ICogQSBzdHJpbmcgZm9yIHRoZSBzZXJ2aWNlIG5hbWUgdG8gaGF2ZSBoYXNodGFncyAoZXg6IFwiI215SGFzaHRhZ1wiKVxuXHQgKiBhdXRvLWxpbmtlZCB0by4gVGhlIGN1cnJlbnRseS1zdXBwb3J0ZWQgdmFsdWVzIGFyZTpcblx0ICpcblx0ICogLSAndHdpdHRlcidcblx0ICogLSAnZmFjZWJvb2snXG5cdCAqIC0gJ2luc3RhZ3JhbSdcblx0ICpcblx0ICogUGFzcyBgZmFsc2VgIHRvIHNraXAgYXV0by1saW5raW5nIG9mIGhhc2h0YWdzLlxuXHQgKi9cblx0aGFzaHRhZyA6IGZhbHNlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBuZXdXaW5kb3dcblx0ICpcblx0ICogYHRydWVgIGlmIHRoZSBsaW5rcyBzaG91bGQgb3BlbiBpbiBhIG5ldyB3aW5kb3csIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0bmV3V2luZG93IDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gc3RyaXBQcmVmaXhcblx0ICpcblx0ICogYHRydWVgIGlmICdodHRwOi8vJyBvciAnaHR0cHM6Ly8nIGFuZC9vciB0aGUgJ3d3dy4nIHNob3VsZCBiZSBzdHJpcHBlZFxuXHQgKiBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgVVJMIGxpbmtzJyB0ZXh0LCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdHN0cmlwUHJlZml4IDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7TnVtYmVyfSB0cnVuY2F0ZVxuXHQgKlxuXHQgKiBBIG51bWJlciBmb3IgaG93IG1hbnkgY2hhcmFjdGVycyBsb25nIG1hdGNoZWQgdGV4dCBzaG91bGQgYmUgdHJ1bmNhdGVkIHRvIGluc2lkZSB0aGUgdGV4dCBvZlxuXHQgKiBhIGxpbmsuIElmIHRoZSBtYXRjaGVkIHRleHQgaXMgb3ZlciB0aGlzIG51bWJlciBvZiBjaGFyYWN0ZXJzLCBpdCB3aWxsIGJlIHRydW5jYXRlZCB0byB0aGlzIGxlbmd0aCBieVxuXHQgKiBhZGRpbmcgYSB0d28gcGVyaW9kIGVsbGlwc2lzICgnLi4nKSB0byB0aGUgZW5kIG9mIHRoZSBzdHJpbmcuXG5cdCAqXG5cdCAqIEZvciBleGFtcGxlOiBBIHVybCBsaWtlICdodHRwOi8vd3d3LnlhaG9vLmNvbS9zb21lL2xvbmcvcGF0aC90by9hL2ZpbGUnIHRydW5jYXRlZCB0byAyNSBjaGFyYWN0ZXJzIG1pZ2h0IGxvb2tcblx0ICogc29tZXRoaW5nIGxpa2UgdGhpczogJ3lhaG9vLmNvbS9zb21lL2xvbmcvcGF0Li4nXG5cdCAqL1xuXHR0cnVuY2F0ZSA6IHVuZGVmaW5lZCxcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBjbGFzc05hbWVcblx0ICpcblx0ICogQSBDU1MgY2xhc3MgbmFtZSB0byBhZGQgdG8gdGhlIGdlbmVyYXRlZCBsaW5rcy4gVGhpcyBjbGFzcyB3aWxsIGJlIGFkZGVkIHRvIGFsbCBsaW5rcywgYXMgd2VsbCBhcyB0aGlzIGNsYXNzXG5cdCAqIHBsdXMgbWF0Y2ggc3VmZml4ZXMgZm9yIHN0eWxpbmcgdXJsL2VtYWlsL3Bob25lL3R3aXR0ZXIvaGFzaHRhZyBsaW5rcyBkaWZmZXJlbnRseS5cblx0ICpcblx0ICogRm9yIGV4YW1wbGUsIGlmIHRoaXMgY29uZmlnIGlzIHByb3ZpZGVkIGFzIFwibXlMaW5rXCIsIHRoZW46XG5cdCAqXG5cdCAqIC0gVVJMIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay11cmxcIlxuXHQgKiAtIEVtYWlsIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay1lbWFpbFwiLCBhbmRcblx0ICogLSBUd2l0dGVyIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay10d2l0dGVyXCJcblx0ICogLSBQaG9uZSBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstcGhvbmVcIlxuXHQgKiAtIEhhc2h0YWcgbGlua3Mgd2lsbCBoYXZlIHRoZSBDU1MgY2xhc3NlczogXCJteUxpbmsgbXlMaW5rLWhhc2h0YWdcIlxuXHQgKi9cblx0Y2xhc3NOYW1lIDogXCJcIixcblxuXHQvKipcblx0ICogQGNmZyB7RnVuY3Rpb259IHJlcGxhY2VGblxuXHQgKlxuXHQgKiBBIGZ1bmN0aW9uIHRvIGluZGl2aWR1YWxseSBwcm9jZXNzIGVhY2ggbWF0Y2ggZm91bmQgaW4gdGhlIGlucHV0IHN0cmluZy5cblx0ICpcblx0ICogU2VlIHRoZSBjbGFzcydzIGRlc2NyaXB0aW9uIGZvciB1c2FnZS5cblx0ICpcblx0ICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2l0aCB0aGUgZm9sbG93aW5nIHBhcmFtZXRlcnM6XG5cdCAqXG5cdCAqIEBjZmcge0F1dG9saW5rZXJ9IHJlcGxhY2VGbi5hdXRvbGlua2VyIFRoZSBBdXRvbGlua2VyIGluc3RhbmNlLCB3aGljaCBtYXkgYmUgdXNlZCB0byByZXRyaWV2ZSBjaGlsZCBvYmplY3RzIGZyb20gKHN1Y2hcblx0ICogICBhcyB0aGUgaW5zdGFuY2UncyB7QGxpbmsgI2dldFRhZ0J1aWxkZXIgdGFnIGJ1aWxkZXJ9KS5cblx0ICogQGNmZyB7QXV0b2xpbmtlci5tYXRjaC5NYXRjaH0gcmVwbGFjZUZuLm1hdGNoIFRoZSBNYXRjaCBpbnN0YW5jZSB3aGljaCBjYW4gYmUgdXNlZCB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiBhYm91dCB0aGVcblx0ICogICBtYXRjaCB0aGF0IHRoZSBgcmVwbGFjZUZuYCBpcyBjdXJyZW50bHkgcHJvY2Vzc2luZy4gU2VlIHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSBzdWJjbGFzc2VzIGZvciBkZXRhaWxzLlxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfSBodG1sUGFyc2VyXG5cdCAqXG5cdCAqIFRoZSBIdG1sUGFyc2VyIGluc3RhbmNlIHVzZWQgdG8gc2tpcCBvdmVyIEhUTUwgdGFncywgd2hpbGUgZmluZGluZyB0ZXh0IG5vZGVzIHRvIHByb2Nlc3MuIFRoaXMgaXMgbGF6aWx5IGluc3RhbnRpYXRlZFxuXHQgKiBpbiB0aGUge0BsaW5rICNnZXRIdG1sUGFyc2VyfSBtZXRob2QuXG5cdCAqL1xuXHRodG1sUGFyc2VyIDogdW5kZWZpbmVkLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXJ9IG1hdGNoUGFyc2VyXG5cdCAqXG5cdCAqIFRoZSBNYXRjaFBhcnNlciBpbnN0YW5jZSB1c2VkIHRvIGZpbmQgbWF0Y2hlcyBpbiB0aGUgdGV4dCBub2RlcyBvZiBhbiBpbnB1dCBzdHJpbmcgcGFzc2VkIHRvXG5cdCAqIHtAbGluayAjbGlua30uIFRoaXMgaXMgbGF6aWx5IGluc3RhbnRpYXRlZCBpbiB0aGUge0BsaW5rICNnZXRNYXRjaFBhcnNlcn0gbWV0aG9kLlxuXHQgKi9cblx0bWF0Y2hQYXJzZXIgOiB1bmRlZmluZWQsXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7QXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyfSB0YWdCdWlsZGVyXG5cdCAqXG5cdCAqIFRoZSBBbmNob3JUYWdCdWlsZGVyIGluc3RhbmNlIHVzZWQgdG8gYnVpbGQgbWF0Y2ggcmVwbGFjZW1lbnQgYW5jaG9yIHRhZ3MuIE5vdGU6IHRoaXMgaXMgbGF6aWx5IGluc3RhbnRpYXRlZFxuXHQgKiBpbiB0aGUge0BsaW5rICNnZXRUYWdCdWlsZGVyfSBtZXRob2QuXG5cdCAqL1xuXHR0YWdCdWlsZGVyIDogdW5kZWZpbmVkLFxuXG5cdC8qKlxuXHQgKiBBdXRvbWF0aWNhbGx5IGxpbmtzIFVSTHMsIEVtYWlsIGFkZHJlc3NlcywgUGhvbmUgbnVtYmVycywgVHdpdHRlclxuXHQgKiBoYW5kbGVzLCBhbmQgSGFzaHRhZ3MgZm91bmQgaW4gdGhlIGdpdmVuIGNodW5rIG9mIEhUTUwuIERvZXMgbm90IGxpbmtcblx0ICogVVJMcyBmb3VuZCB3aXRoaW4gSFRNTCB0YWdzLlxuXHQgKlxuXHQgKiBGb3IgaW5zdGFuY2UsIGlmIGdpdmVuIHRoZSB0ZXh0OiBgWW91IHNob3VsZCBnbyB0byBodHRwOi8vd3d3LnlhaG9vLmNvbWAsXG5cdCAqIHRoZW4gdGhlIHJlc3VsdCB3aWxsIGJlIGBZb3Ugc2hvdWxkIGdvIHRvXG5cdCAqICZsdDthIGhyZWY9XCJodHRwOi8vd3d3LnlhaG9vLmNvbVwiJmd0O2h0dHA6Ly93d3cueWFob28uY29tJmx0Oy9hJmd0O2Bcblx0ICpcblx0ICogVGhpcyBtZXRob2QgZmluZHMgdGhlIHRleHQgYXJvdW5kIGFueSBIVE1MIGVsZW1lbnRzIGluIHRoZSBpbnB1dFxuXHQgKiBgdGV4dE9ySHRtbGAsIHdoaWNoIHdpbGwgYmUgdGhlIHRleHQgdGhhdCBpcyBwcm9jZXNzZWQuIEFueSBvcmlnaW5hbCBIVE1MXG5cdCAqIGVsZW1lbnRzIHdpbGwgYmUgbGVmdCBhcy1pcywgYXMgd2VsbCBhcyB0aGUgdGV4dCB0aGF0IGlzIGFscmVhZHkgd3JhcHBlZFxuXHQgKiBpbiBhbmNob3IgKCZsdDthJmd0OykgdGFncy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHRPckh0bWwgVGhlIEhUTUwgb3IgdGV4dCB0byBhdXRvbGluayBtYXRjaGVzIHdpdGhpblxuXHQgKiAgIChkZXBlbmRpbmcgb24gaWYgdGhlIHtAbGluayAjdXJsc30sIHtAbGluayAjZW1haWx9LCB7QGxpbmsgI3Bob25lfSxcblx0ICogICB7QGxpbmsgI3R3aXR0ZXJ9LCBhbmQge0BsaW5rICNoYXNodGFnfSBvcHRpb25zIGFyZSBlbmFibGVkKS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgSFRNTCwgd2l0aCBtYXRjaGVzIGF1dG9tYXRpY2FsbHkgbGlua2VkLlxuXHQgKi9cblx0bGluayA6IGZ1bmN0aW9uKCB0ZXh0T3JIdG1sICkge1xuXHRcdGlmKCAhdGV4dE9ySHRtbCApIHsgcmV0dXJuIFwiXCI7IH0gIC8vIGhhbmRsZSBgbnVsbGAgYW5kIGB1bmRlZmluZWRgXG5cblx0XHR2YXIgaHRtbFBhcnNlciA9IHRoaXMuZ2V0SHRtbFBhcnNlcigpLFxuXHRcdCAgICBodG1sTm9kZXMgPSBodG1sUGFyc2VyLnBhcnNlKCB0ZXh0T3JIdG1sICksXG5cdFx0ICAgIGFuY2hvclRhZ1N0YWNrQ291bnQgPSAwLCAgLy8gdXNlZCB0byBvbmx5IHByb2Nlc3MgdGV4dCBhcm91bmQgYW5jaG9yIHRhZ3MsIGFuZCBhbnkgaW5uZXIgdGV4dC9odG1sIHRoZXkgbWF5IGhhdmVcblx0XHQgICAgcmVzdWx0SHRtbCA9IFtdO1xuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGh0bWxOb2Rlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdHZhciBub2RlID0gaHRtbE5vZGVzWyBpIF0sXG5cdFx0XHQgICAgbm9kZVR5cGUgPSBub2RlLmdldFR5cGUoKSxcblx0XHRcdCAgICBub2RlVGV4dCA9IG5vZGUuZ2V0VGV4dCgpO1xuXG5cdFx0XHRpZiggbm9kZVR5cGUgPT09ICdlbGVtZW50JyApIHtcblx0XHRcdFx0Ly8gUHJvY2VzcyBIVE1MIG5vZGVzIGluIHRoZSBpbnB1dCBgdGV4dE9ySHRtbGBcblx0XHRcdFx0aWYoIG5vZGUuZ2V0VGFnTmFtZSgpID09PSAnYScgKSB7XG5cdFx0XHRcdFx0aWYoICFub2RlLmlzQ2xvc2luZygpICkgeyAgLy8gaXQncyB0aGUgc3RhcnQgPGE+IHRhZ1xuXHRcdFx0XHRcdFx0YW5jaG9yVGFnU3RhY2tDb3VudCsrO1xuXHRcdFx0XHRcdH0gZWxzZSB7ICAgLy8gaXQncyB0aGUgZW5kIDwvYT4gdGFnXG5cdFx0XHRcdFx0XHRhbmNob3JUYWdTdGFja0NvdW50ID0gTWF0aC5tYXgoIGFuY2hvclRhZ1N0YWNrQ291bnQgLSAxLCAwICk7ICAvLyBhdHRlbXB0IHRvIGhhbmRsZSBleHRyYW5lb3VzIDwvYT4gdGFncyBieSBtYWtpbmcgc3VyZSB0aGUgc3RhY2sgY291bnQgbmV2ZXIgZ29lcyBiZWxvdyAwXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc3VsdEh0bWwucHVzaCggbm9kZVRleHQgKTsgIC8vIG5vdyBhZGQgdGhlIHRleHQgb2YgdGhlIHRhZyBpdHNlbGYgdmVyYmF0aW1cblxuXHRcdFx0fSBlbHNlIGlmKCBub2RlVHlwZSA9PT0gJ2VudGl0eScgfHwgbm9kZVR5cGUgPT09ICdjb21tZW50JyApIHtcblx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBub2RlVGV4dCApOyAgLy8gYXBwZW5kIEhUTUwgZW50aXR5IG5vZGVzIChzdWNoIGFzICcmbmJzcDsnKSBvciBIVE1MIGNvbW1lbnRzIChzdWNoIGFzICc8IS0tIENvbW1lbnQgLS0+JykgdmVyYmF0aW1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gUHJvY2VzcyB0ZXh0IG5vZGVzIGluIHRoZSBpbnB1dCBgdGV4dE9ySHRtbGBcblx0XHRcdFx0aWYoIGFuY2hvclRhZ1N0YWNrQ291bnQgPT09IDAgKSB7XG5cdFx0XHRcdFx0Ly8gSWYgd2UncmUgbm90IHdpdGhpbiBhbiA8YT4gdGFnLCBwcm9jZXNzIHRoZSB0ZXh0IG5vZGUgdG8gbGlua2lmeVxuXHRcdFx0XHRcdHZhciBsaW5raWZpZWRTdHIgPSB0aGlzLmxpbmtpZnlTdHIoIG5vZGVUZXh0ICk7XG5cdFx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBsaW5raWZpZWRTdHIgKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGB0ZXh0YCBpcyB3aXRoaW4gYW4gPGE+IHRhZywgc2ltcGx5IGFwcGVuZCB0aGUgdGV4dCAtIHdlIGRvIG5vdCB3YW50IHRvIGF1dG9saW5rIGFueXRoaW5nXG5cdFx0XHRcdFx0Ly8gYWxyZWFkeSB3aXRoaW4gYW4gPGE+Li4uPC9hPiB0YWdcblx0XHRcdFx0XHRyZXN1bHRIdG1sLnB1c2goIG5vZGVUZXh0ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0SHRtbC5qb2luKCBcIlwiICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFByb2Nlc3MgdGhlIHRleHQgdGhhdCBsaWVzIGluIGJldHdlZW4gSFRNTCB0YWdzLCBwZXJmb3JtaW5nIHRoZSBhbmNob3Jcblx0ICogdGFnIHJlcGxhY2VtZW50cyBmb3IgdGhlIG1hdGNoZXMsIGFuZCByZXR1cm5zIHRoZSBzdHJpbmcgd2l0aCB0aGVcblx0ICogcmVwbGFjZW1lbnRzIG1hZGUuXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGRvZXMgdGhlIGFjdHVhbCB3cmFwcGluZyBvZiBtYXRjaGVzIHdpdGggYW5jaG9yIHRhZ3MuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyBvZiB0ZXh0IHRvIGF1dG8tbGluay5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgdGV4dCB3aXRoIGFuY2hvciB0YWdzIGF1dG8tZmlsbGVkLlxuXHQgKi9cblx0bGlua2lmeVN0ciA6IGZ1bmN0aW9uKCBzdHIgKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TWF0Y2hQYXJzZXIoKS5yZXBsYWNlKCBzdHIsIHRoaXMuY3JlYXRlTWF0Y2hSZXR1cm5WYWwsIHRoaXMgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSByZXR1cm4gc3RyaW5nIHZhbHVlIGZvciBhIGdpdmVuIG1hdGNoIGluIHRoZSBpbnB1dCBzdHJpbmcsXG5cdCAqIGZvciB0aGUge0BsaW5rICNsaW5raWZ5U3RyfSBtZXRob2QuXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdGhlIHtAbGluayAjcmVwbGFjZUZufSwgaWYgb25lIHdhcyBwcm92aWRlZC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSBtYXRjaCBUaGUgTWF0Y2ggb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgbWF0Y2guXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHN0cmluZyB0aGF0IHRoZSBgbWF0Y2hgIHNob3VsZCBiZSByZXBsYWNlZCB3aXRoLiBUaGlzIGlzIHVzdWFsbHkgdGhlIGFuY2hvciB0YWcgc3RyaW5nLCBidXRcblx0ICogICBtYXkgYmUgdGhlIGBtYXRjaFN0cmAgaXRzZWxmIGlmIHRoZSBtYXRjaCBpcyBub3QgdG8gYmUgcmVwbGFjZWQuXG5cdCAqL1xuXHRjcmVhdGVNYXRjaFJldHVyblZhbCA6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHQvLyBIYW5kbGUgYSBjdXN0b20gYHJlcGxhY2VGbmAgYmVpbmcgcHJvdmlkZWRcblx0XHR2YXIgcmVwbGFjZUZuUmVzdWx0O1xuXHRcdGlmKCB0aGlzLnJlcGxhY2VGbiApIHtcblx0XHRcdHJlcGxhY2VGblJlc3VsdCA9IHRoaXMucmVwbGFjZUZuLmNhbGwoIHRoaXMsIHRoaXMsIG1hdGNoICk7ICAvLyBBdXRvbGlua2VyIGluc3RhbmNlIGlzIHRoZSBjb250ZXh0LCBhbmQgdGhlIGZpcnN0IGFyZ1xuXHRcdH1cblxuXHRcdGlmKCB0eXBlb2YgcmVwbGFjZUZuUmVzdWx0ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdHJldHVybiByZXBsYWNlRm5SZXN1bHQ7ICAvLyBgcmVwbGFjZUZuYCByZXR1cm5lZCBhIHN0cmluZywgdXNlIHRoYXRcblxuXHRcdH0gZWxzZSBpZiggcmVwbGFjZUZuUmVzdWx0ID09PSBmYWxzZSApIHtcblx0XHRcdHJldHVybiBtYXRjaC5nZXRNYXRjaGVkVGV4dCgpOyAgLy8gbm8gcmVwbGFjZW1lbnQgZm9yIHRoZSBtYXRjaFxuXG5cdFx0fSBlbHNlIGlmKCByZXBsYWNlRm5SZXN1bHQgaW5zdGFuY2VvZiBBdXRvbGlua2VyLkh0bWxUYWcgKSB7XG5cdFx0XHRyZXR1cm4gcmVwbGFjZUZuUmVzdWx0LnRvQW5jaG9yU3RyaW5nKCk7XG5cblx0XHR9IGVsc2UgeyAgLy8gcmVwbGFjZUZuUmVzdWx0ID09PSB0cnVlLCBvciBuby91bmtub3duIHJldHVybiB2YWx1ZSBmcm9tIGZ1bmN0aW9uXG5cdFx0XHQvLyBQZXJmb3JtIEF1dG9saW5rZXIncyBkZWZhdWx0IGFuY2hvciB0YWcgZ2VuZXJhdGlvblxuXHRcdFx0dmFyIHRhZ0J1aWxkZXIgPSB0aGlzLmdldFRhZ0J1aWxkZXIoKSxcblx0XHRcdCAgICBhbmNob3JUYWcgPSB0YWdCdWlsZGVyLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiBBdXRvbGlua2VyLkh0bWxUYWcgaW5zdGFuY2VcblxuXHRcdFx0cmV0dXJuIGFuY2hvclRhZy50b0FuY2hvclN0cmluZygpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBMYXppbHkgaW5zdGFudGlhdGVzIGFuZCByZXR1cm5zIHRoZSB7QGxpbmsgI2h0bWxQYXJzZXJ9IGluc3RhbmNlIGZvciB0aGlzIEF1dG9saW5rZXIgaW5zdGFuY2UuXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9XG5cdCAqL1xuXHRnZXRIdG1sUGFyc2VyIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGh0bWxQYXJzZXIgPSB0aGlzLmh0bWxQYXJzZXI7XG5cblx0XHRpZiggIWh0bWxQYXJzZXIgKSB7XG5cdFx0XHRodG1sUGFyc2VyID0gdGhpcy5odG1sUGFyc2VyID0gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGh0bWxQYXJzZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogTGF6aWx5IGluc3RhbnRpYXRlcyBhbmQgcmV0dXJucyB0aGUge0BsaW5rICNtYXRjaFBhcnNlcn0gaW5zdGFuY2UgZm9yIHRoaXMgQXV0b2xpbmtlciBpbnN0YW5jZS5cblx0ICpcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyfVxuXHQgKi9cblx0Z2V0TWF0Y2hQYXJzZXIgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWF0Y2hQYXJzZXIgPSB0aGlzLm1hdGNoUGFyc2VyO1xuXG5cdFx0aWYoICFtYXRjaFBhcnNlciApIHtcblx0XHRcdG1hdGNoUGFyc2VyID0gdGhpcy5tYXRjaFBhcnNlciA9IG5ldyBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyKCB7XG5cdFx0XHRcdHVybHMgICAgICAgIDogdGhpcy51cmxzLFxuXHRcdFx0XHRlbWFpbCAgICAgICA6IHRoaXMuZW1haWwsXG5cdFx0XHRcdHR3aXR0ZXIgICAgIDogdGhpcy50d2l0dGVyLFxuXHRcdFx0XHRwaG9uZSAgICAgICA6IHRoaXMucGhvbmUsXG5cdFx0XHRcdGhhc2h0YWcgICAgIDogdGhpcy5oYXNodGFnLFxuXHRcdFx0XHRzdHJpcFByZWZpeCA6IHRoaXMuc3RyaXBQcmVmaXhcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbWF0Y2hQYXJzZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUge0BsaW5rICN0YWdCdWlsZGVyfSBpbnN0YW5jZSBmb3IgdGhpcyBBdXRvbGlua2VyIGluc3RhbmNlLCBsYXppbHkgaW5zdGFudGlhdGluZyBpdFxuXHQgKiBpZiBpdCBkb2VzIG5vdCB5ZXQgZXhpc3QuXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIG1heSBiZSB1c2VkIGluIGEge0BsaW5rICNyZXBsYWNlRm59IHRvIGdlbmVyYXRlIHRoZSB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnIEh0bWxUYWd9IGluc3RhbmNlIHRoYXRcblx0ICogQXV0b2xpbmtlciB3b3VsZCBub3JtYWxseSBnZW5lcmF0ZSwgYW5kIHRoZW4gYWxsb3cgZm9yIG1vZGlmaWNhdGlvbnMgYmVmb3JlIHJldHVybmluZyBpdC4gRm9yIGV4YW1wbGU6XG5cdCAqXG5cdCAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJUZXN0IGdvb2dsZS5jb21cIiwge1xuXHQgKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcblx0ICogICAgICAgICAgICAgdmFyIHRhZyA9IGF1dG9saW5rZXIuZ2V0VGFnQnVpbGRlcigpLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnfSBpbnN0YW5jZVxuXHQgKiAgICAgICAgICAgICB0YWcuc2V0QXR0ciggJ3JlbCcsICdub2ZvbGxvdycgKTtcblx0ICpcblx0ICogICAgICAgICAgICAgcmV0dXJuIHRhZztcblx0ICogICAgICAgICB9XG5cdCAqICAgICB9ICk7XG5cdCAqXG5cdCAqICAgICAvLyBnZW5lcmF0ZWQgaHRtbDpcblx0ICogICAgIC8vICAgVGVzdCA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub2ZvbGxvd1wiPmdvb2dsZS5jb208L2E+XG5cdCAqXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlcn1cblx0ICovXG5cdGdldFRhZ0J1aWxkZXIgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdGFnQnVpbGRlciA9IHRoaXMudGFnQnVpbGRlcjtcblxuXHRcdGlmKCAhdGFnQnVpbGRlciApIHtcblx0XHRcdHRhZ0J1aWxkZXIgPSB0aGlzLnRhZ0J1aWxkZXIgPSBuZXcgQXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyKCB7XG5cdFx0XHRcdG5ld1dpbmRvdyAgIDogdGhpcy5uZXdXaW5kb3csXG5cdFx0XHRcdHRydW5jYXRlICAgIDogdGhpcy50cnVuY2F0ZSxcblx0XHRcdFx0Y2xhc3NOYW1lICAgOiB0aGlzLmNsYXNzTmFtZVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0YWdCdWlsZGVyO1xuXHR9XG5cbn07XG5cblxuLyoqXG4gKiBBdXRvbWF0aWNhbGx5IGxpbmtzIFVSTHMsIEVtYWlsIGFkZHJlc3NlcywgUGhvbmUgTnVtYmVycywgVHdpdHRlciBoYW5kbGVzLFxuICogYW5kIEhhc2h0YWdzIGZvdW5kIGluIHRoZSBnaXZlbiBjaHVuayBvZiBIVE1MLiBEb2VzIG5vdCBsaW5rIFVSTHMgZm91bmRcbiAqIHdpdGhpbiBIVE1MIHRhZ3MuXG4gKlxuICogRm9yIGluc3RhbmNlLCBpZiBnaXZlbiB0aGUgdGV4dDogYFlvdSBzaG91bGQgZ28gdG8gaHR0cDovL3d3dy55YWhvby5jb21gLFxuICogdGhlbiB0aGUgcmVzdWx0IHdpbGwgYmUgYFlvdSBzaG91bGQgZ28gdG8gJmx0O2EgaHJlZj1cImh0dHA6Ly93d3cueWFob28uY29tXCImZ3Q7aHR0cDovL3d3dy55YWhvby5jb20mbHQ7L2EmZ3Q7YFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogICAgIHZhciBsaW5rZWRUZXh0ID0gQXV0b2xpbmtlci5saW5rKCBcIkdvIHRvIGdvb2dsZS5jb21cIiwgeyBuZXdXaW5kb3c6IGZhbHNlIH0gKTtcbiAqICAgICAvLyBQcm9kdWNlczogXCJHbyB0byA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIj5nb29nbGUuY29tPC9hPlwiXG4gKlxuICogQHN0YXRpY1xuICogQHBhcmFtIHtTdHJpbmd9IHRleHRPckh0bWwgVGhlIEhUTUwgb3IgdGV4dCB0byBmaW5kIG1hdGNoZXMgd2l0aGluIChkZXBlbmRpbmdcbiAqICAgb24gaWYgdGhlIHtAbGluayAjdXJsc30sIHtAbGluayAjZW1haWx9LCB7QGxpbmsgI3Bob25lfSwge0BsaW5rICN0d2l0dGVyfSxcbiAqICAgYW5kIHtAbGluayAjaGFzaHRhZ30gb3B0aW9ucyBhcmUgZW5hYmxlZCkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIEFueSBvZiB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQXV0b2xpbmtlclxuICogICBjbGFzcywgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS4gU2VlIHRoZSBjbGFzcyBkZXNjcmlwdGlvbiBmb3IgYW5cbiAqICAgZXhhbXBsZSBjYWxsLlxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgSFRNTCB0ZXh0LCB3aXRoIG1hdGNoZXMgYXV0b21hdGljYWxseSBsaW5rZWQuXG4gKi9cbkF1dG9saW5rZXIubGluayA9IGZ1bmN0aW9uKCB0ZXh0T3JIdG1sLCBvcHRpb25zICkge1xuXHR2YXIgYXV0b2xpbmtlciA9IG5ldyBBdXRvbGlua2VyKCBvcHRpb25zICk7XG5cdHJldHVybiBhdXRvbGlua2VyLmxpbmsoIHRleHRPckh0bWwgKTtcbn07XG5cblxuLy8gQXV0b2xpbmtlciBOYW1lc3BhY2VzXG5BdXRvbGlua2VyLm1hdGNoID0ge307XG5BdXRvbGlua2VyLmh0bWxQYXJzZXIgPSB7fTtcbkF1dG9saW5rZXIubWF0Y2hQYXJzZXIgPSB7fTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLypqc2hpbnQgZXFudWxsOnRydWUsIGJvc3M6dHJ1ZSAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5VdGlsXG4gKiBAc2luZ2xldG9uXG4gKlxuICogQSBmZXcgdXRpbGl0eSBtZXRob2RzIGZvciBBdXRvbGlua2VyLlxuICovXG5BdXRvbGlua2VyLlV0aWwgPSB7XG5cblx0LyoqXG5cdCAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGFic3RyYWN0TWV0aG9kXG5cdCAqXG5cdCAqIEEgZnVuY3Rpb24gb2JqZWN0IHdoaWNoIHJlcHJlc2VudHMgYW4gYWJzdHJhY3QgbWV0aG9kLlxuXHQgKi9cblx0YWJzdHJhY3RNZXRob2QgOiBmdW5jdGlvbigpIHsgdGhyb3cgXCJhYnN0cmFjdFwiOyB9LFxuXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSB0cmltUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHRyaW0gdGhlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2Vcblx0ICogZnJvbSBhIHN0cmluZy5cblx0ICovXG5cdHRyaW1SZWdleCA6IC9eW1xcc1xcdUZFRkZcXHhBMF0rfFtcXHNcXHVGRUZGXFx4QTBdKyQvZyxcblxuXG5cdC8qKlxuXHQgKiBBc3NpZ25zIChzaGFsbG93IGNvcGllcykgdGhlIHByb3BlcnRpZXMgb2YgYHNyY2Agb250byBgZGVzdGAuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBzcmMgVGhlIHNvdXJjZSBvYmplY3QuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGRlc3RpbmF0aW9uIG9iamVjdCAoYGRlc3RgKVxuXHQgKi9cblx0YXNzaWduIDogZnVuY3Rpb24oIGRlc3QsIHNyYyApIHtcblx0XHRmb3IoIHZhciBwcm9wIGluIHNyYyApIHtcblx0XHRcdGlmKCBzcmMuaGFzT3duUHJvcGVydHkoIHByb3AgKSApIHtcblx0XHRcdFx0ZGVzdFsgcHJvcCBdID0gc3JjWyBwcm9wIF07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRlc3Q7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRXh0ZW5kcyBgc3VwZXJjbGFzc2AgdG8gY3JlYXRlIGEgbmV3IHN1YmNsYXNzLCBhZGRpbmcgdGhlIGBwcm90b1Byb3BzYCB0byB0aGUgbmV3IHN1YmNsYXNzJ3MgcHJvdG90eXBlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdXBlcmNsYXNzIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIHN1cGVyY2xhc3MuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b1Byb3BzIFRoZSBtZXRob2RzL3Byb3BlcnRpZXMgdG8gYWRkIHRvIHRoZSBzdWJjbGFzcydzIHByb3RvdHlwZS4gVGhpcyBtYXkgY29udGFpbiB0aGVcblx0ICogICBzcGVjaWFsIHByb3BlcnR5IGBjb25zdHJ1Y3RvcmAsIHdoaWNoIHdpbGwgYmUgdXNlZCBhcyB0aGUgbmV3IHN1YmNsYXNzJ3MgY29uc3RydWN0b3IgZnVuY3Rpb24uXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgbmV3IHN1YmNsYXNzIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZXh0ZW5kIDogZnVuY3Rpb24oIHN1cGVyY2xhc3MsIHByb3RvUHJvcHMgKSB7XG5cdFx0dmFyIHN1cGVyY2xhc3NQcm90byA9IHN1cGVyY2xhc3MucHJvdG90eXBlO1xuXG5cdFx0dmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuXHRcdEYucHJvdG90eXBlID0gc3VwZXJjbGFzc1Byb3RvO1xuXG5cdFx0dmFyIHN1YmNsYXNzO1xuXHRcdGlmKCBwcm90b1Byb3BzLmhhc093blByb3BlcnR5KCAnY29uc3RydWN0b3InICkgKSB7XG5cdFx0XHRzdWJjbGFzcyA9IHByb3RvUHJvcHMuY29uc3RydWN0b3I7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN1YmNsYXNzID0gZnVuY3Rpb24oKSB7IHN1cGVyY2xhc3NQcm90by5jb25zdHJ1Y3Rvci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7IH07XG5cdFx0fVxuXG5cdFx0dmFyIHN1YmNsYXNzUHJvdG8gPSBzdWJjbGFzcy5wcm90b3R5cGUgPSBuZXcgRigpOyAgLy8gc2V0IHVwIHByb3RvdHlwZSBjaGFpblxuXHRcdHN1YmNsYXNzUHJvdG8uY29uc3RydWN0b3IgPSBzdWJjbGFzczsgIC8vIGZpeCBjb25zdHJ1Y3RvciBwcm9wZXJ0eVxuXHRcdHN1YmNsYXNzUHJvdG8uc3VwZXJjbGFzcyA9IHN1cGVyY2xhc3NQcm90bztcblxuXHRcdGRlbGV0ZSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yOyAgLy8gZG9uJ3QgcmUtYXNzaWduIGNvbnN0cnVjdG9yIHByb3BlcnR5IHRvIHRoZSBwcm90b3R5cGUsIHNpbmNlIGEgbmV3IGZ1bmN0aW9uIG1heSBoYXZlIGJlZW4gY3JlYXRlZCAoYHN1YmNsYXNzYCksIHdoaWNoIGlzIG5vdyBhbHJlYWR5IHRoZXJlXG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggc3ViY2xhc3NQcm90bywgcHJvdG9Qcm9wcyApO1xuXG5cdFx0cmV0dXJuIHN1YmNsYXNzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFRydW5jYXRlcyB0aGUgYHN0cmAgYXQgYGxlbiAtIGVsbGlwc2lzQ2hhcnMubGVuZ3RoYCwgYW5kIGFkZHMgdGhlIGBlbGxpcHNpc0NoYXJzYCB0byB0aGVcblx0ICogZW5kIG9mIHRoZSBzdHJpbmcgKGJ5IGRlZmF1bHQsIHR3byBwZXJpb2RzOiAnLi4nKS4gSWYgdGhlIGBzdHJgIGxlbmd0aCBkb2VzIG5vdCBleGNlZWRcblx0ICogYGxlbmAsIHRoZSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCB1bmNoYW5nZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byB0cnVuY2F0ZSBhbmQgYWRkIGFuIGVsbGlwc2lzIHRvLlxuXHQgKiBAcGFyYW0ge051bWJlcn0gdHJ1bmNhdGVMZW4gVGhlIGxlbmd0aCB0byB0cnVuY2F0ZSB0aGUgc3RyaW5nIGF0LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gW2VsbGlwc2lzQ2hhcnM9Li5dIFRoZSBlbGxpcHNpcyBjaGFyYWN0ZXIocykgdG8gYWRkIHRvIHRoZSBlbmQgb2YgYHN0cmBcblx0ICogICB3aGVuIHRydW5jYXRlZC4gRGVmYXVsdHMgdG8gJy4uJ1xuXHQgKi9cblx0ZWxsaXBzaXMgOiBmdW5jdGlvbiggc3RyLCB0cnVuY2F0ZUxlbiwgZWxsaXBzaXNDaGFycyApIHtcblx0XHRpZiggc3RyLmxlbmd0aCA+IHRydW5jYXRlTGVuICkge1xuXHRcdFx0ZWxsaXBzaXNDaGFycyA9ICggZWxsaXBzaXNDaGFycyA9PSBudWxsICkgPyAnLi4nIDogZWxsaXBzaXNDaGFycztcblx0XHRcdHN0ciA9IHN0ci5zdWJzdHJpbmcoIDAsIHRydW5jYXRlTGVuIC0gZWxsaXBzaXNDaGFycy5sZW5ndGggKSArIGVsbGlwc2lzQ2hhcnM7XG5cdFx0fVxuXHRcdHJldHVybiBzdHI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU3VwcG9ydHMgYEFycmF5LnByb3RvdHlwZS5pbmRleE9mKClgIGZ1bmN0aW9uYWxpdHkgZm9yIG9sZCBJRSAoSUU4IGFuZCBiZWxvdykuXG5cdCAqXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFyciBUaGUgYXJyYXkgdG8gZmluZCBhbiBlbGVtZW50IG9mLlxuXHQgKiBAcGFyYW0geyp9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gZmluZCBpbiB0aGUgYXJyYXksIGFuZCByZXR1cm4gdGhlIGluZGV4IG9mLlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBpbmRleCBvZiB0aGUgYGVsZW1lbnRgLCBvciAtMSBpZiBpdCB3YXMgbm90IGZvdW5kLlxuXHQgKi9cblx0aW5kZXhPZiA6IGZ1bmN0aW9uKCBhcnIsIGVsZW1lbnQgKSB7XG5cdFx0aWYoIEFycmF5LnByb3RvdHlwZS5pbmRleE9mICkge1xuXHRcdFx0cmV0dXJuIGFyci5pbmRleE9mKCBlbGVtZW50ICk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0aWYoIGFyclsgaSBdID09PSBlbGVtZW50ICkgcmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXHR9LFxuXG5cblxuXHQvKipcblx0ICogUGVyZm9ybXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2Ygd2hhdCBtb2Rlcm4gYnJvd3NlcnMgZG8gd2hlbiBgU3RyaW5nLnByb3RvdHlwZS5zcGxpdCgpYCBpcyBjYWxsZWRcblx0ICogd2l0aCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IGNvbnRhaW5zIGNhcHR1cmluZyBwYXJlbnRoZXNpcy5cblx0ICpcblx0ICogRm9yIGV4YW1wbGU6XG5cdCAqXG5cdCAqICAgICAvLyBNb2Rlcm4gYnJvd3NlcnM6XG5cdCAqICAgICBcImEsYixjXCIuc3BsaXQoIC8oLCkvICk7ICAvLyAtLT4gWyAnYScsICcsJywgJ2InLCAnLCcsICdjJyBdXG5cdCAqXG5cdCAqICAgICAvLyBPbGQgSUUgKGluY2x1ZGluZyBJRTgpOlxuXHQgKiAgICAgXCJhLGIsY1wiLnNwbGl0KCAvKCwpLyApOyAgLy8gLS0+IFsgJ2EnLCAnYicsICdjJyBdXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGVtdWxhdGVzIHRoZSBmdW5jdGlvbmFsaXR5IG9mIG1vZGVybiBicm93c2VycyBmb3IgdGhlIG9sZCBJRSBjYXNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gc3BsaXQuXG5cdCAqIEBwYXJhbSB7UmVnRXhwfSBzcGxpdFJlZ2V4IFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdG8gc3BsaXQgdGhlIGlucHV0IGBzdHJgIG9uLiBUaGUgc3BsaXR0aW5nXG5cdCAqICAgY2hhcmFjdGVyKHMpIHdpbGwgYmUgc3BsaWNlZCBpbnRvIHRoZSBhcnJheSwgYXMgaW4gdGhlIFwibW9kZXJuIGJyb3dzZXJzXCIgZXhhbXBsZSBpbiB0aGVcblx0ICogICBkZXNjcmlwdGlvbiBvZiB0aGlzIG1ldGhvZC5cblx0ICogICBOb3RlICMxOiB0aGUgc3VwcGxpZWQgcmVndWxhciBleHByZXNzaW9uICoqbXVzdCoqIGhhdmUgdGhlICdnJyBmbGFnIHNwZWNpZmllZC5cblx0ICogICBOb3RlICMyOiBmb3Igc2ltcGxpY2l0eSdzIHNha2UsIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gZG9lcyBub3QgbmVlZFxuXHQgKiAgIHRvIGNvbnRhaW4gY2FwdHVyaW5nIHBhcmVudGhlc2lzIC0gaXQgd2lsbCBiZSBhc3N1bWVkIHRoYXQgYW55IG1hdGNoIGhhcyB0aGVtLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmdbXX0gVGhlIHNwbGl0IGFycmF5IG9mIHN0cmluZ3MsIHdpdGggdGhlIHNwbGl0dGluZyBjaGFyYWN0ZXIocykgaW5jbHVkZWQuXG5cdCAqL1xuXHRzcGxpdEFuZENhcHR1cmUgOiBmdW5jdGlvbiggc3RyLCBzcGxpdFJlZ2V4ICkge1xuXHRcdGlmKCAhc3BsaXRSZWdleC5nbG9iYWwgKSB0aHJvdyBuZXcgRXJyb3IoIFwiYHNwbGl0UmVnZXhgIG11c3QgaGF2ZSB0aGUgJ2cnIGZsYWcgc2V0XCIgKTtcblxuXHRcdHZhciByZXN1bHQgPSBbXSxcblx0XHQgICAgbGFzdElkeCA9IDAsXG5cdFx0ICAgIG1hdGNoO1xuXG5cdFx0d2hpbGUoIG1hdGNoID0gc3BsaXRSZWdleC5leGVjKCBzdHIgKSApIHtcblx0XHRcdHJlc3VsdC5wdXNoKCBzdHIuc3Vic3RyaW5nKCBsYXN0SWR4LCBtYXRjaC5pbmRleCApICk7XG5cdFx0XHRyZXN1bHQucHVzaCggbWF0Y2hbIDAgXSApOyAgLy8gcHVzaCB0aGUgc3BsaXR0aW5nIGNoYXIocylcblxuXHRcdFx0bGFzdElkeCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbIDAgXS5sZW5ndGg7XG5cdFx0fVxuXHRcdHJlc3VsdC5wdXNoKCBzdHIuc3Vic3RyaW5nKCBsYXN0SWR4ICkgKTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cblxuXHQvKipcblx0ICogVHJpbXMgdGhlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UgZnJvbSBhIHN0cmluZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIHRyaW0uXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdHRyaW0gOiBmdW5jdGlvbiggc3RyICkge1xuXHRcdHJldHVybiBzdHIucmVwbGFjZSggdGhpcy50cmltUmVnZXgsICcnICk7XG5cdH1cblxufTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qanNoaW50IGJvc3M6dHJ1ZSAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5IdG1sVGFnXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBSZXByZXNlbnRzIGFuIEhUTUwgdGFnLCB3aGljaCBjYW4gYmUgdXNlZCB0byBlYXNpbHkgYnVpbGQvbW9kaWZ5IEhUTUwgdGFncyBwcm9ncmFtbWF0aWNhbGx5LlxuICpcbiAqIEF1dG9saW5rZXIgdXNlcyB0aGlzIGFic3RyYWN0aW9uIHRvIGNyZWF0ZSBIVE1MIHRhZ3MsIGFuZCB0aGVuIHdyaXRlIHRoZW0gb3V0IGFzIHN0cmluZ3MuIFlvdSBtYXkgYWxzbyB1c2VcbiAqIHRoaXMgY2xhc3MgaW4geW91ciBjb2RlLCBlc3BlY2lhbGx5IHdpdGhpbiBhIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59LlxuICpcbiAqICMjIEV4YW1wbGVzXG4gKlxuICogRXhhbXBsZSBpbnN0YW50aWF0aW9uOlxuICpcbiAqICAgICB2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuICogICAgICAgICB0YWdOYW1lIDogJ2EnLFxuICogICAgICAgICBhdHRycyAgIDogeyAnaHJlZic6ICdodHRwOi8vZ29vZ2xlLmNvbScsICdjbGFzcyc6ICdleHRlcm5hbC1saW5rJyB9LFxuICogICAgICAgICBpbm5lckh0bWwgOiAnR29vZ2xlJ1xuICogICAgIH0gKTtcbiAqXG4gKiAgICAgdGFnLnRvQW5jaG9yU3RyaW5nKCk7ICAvLyA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiBjbGFzcz1cImV4dGVybmFsLWxpbmtcIj5Hb29nbGU8L2E+XG4gKlxuICogICAgIC8vIEluZGl2aWR1YWwgYWNjZXNzb3IgbWV0aG9kc1xuICogICAgIHRhZy5nZXRUYWdOYW1lKCk7ICAgICAgICAgICAgICAgICAvLyAnYSdcbiAqICAgICB0YWcuZ2V0QXR0ciggJ2hyZWYnICk7ICAgICAgICAgICAgLy8gJ2h0dHA6Ly9nb29nbGUuY29tJ1xuICogICAgIHRhZy5oYXNDbGFzcyggJ2V4dGVybmFsLWxpbmsnICk7ICAvLyB0cnVlXG4gKlxuICpcbiAqIFVzaW5nIG11dGF0b3IgbWV0aG9kcyAod2hpY2ggbWF5IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBpbnN0YW50aWF0aW9uIGNvbmZpZyBwcm9wZXJ0aWVzKTpcbiAqXG4gKiAgICAgdmFyIHRhZyA9IG5ldyBBdXRvbGlua2VyLkh0bWxUYWcoKTtcbiAqICAgICB0YWcuc2V0VGFnTmFtZSggJ2EnICk7XG4gKiAgICAgdGFnLnNldEF0dHIoICdocmVmJywgJ2h0dHA6Ly9nb29nbGUuY29tJyApO1xuICogICAgIHRhZy5hZGRDbGFzcyggJ2V4dGVybmFsLWxpbmsnICk7XG4gKiAgICAgdGFnLnNldElubmVySHRtbCggJ0dvb2dsZScgKTtcbiAqXG4gKiAgICAgdGFnLmdldFRhZ05hbWUoKTsgICAgICAgICAgICAgICAgIC8vICdhJ1xuICogICAgIHRhZy5nZXRBdHRyKCAnaHJlZicgKTsgICAgICAgICAgICAvLyAnaHR0cDovL2dvb2dsZS5jb20nXG4gKiAgICAgdGFnLmhhc0NsYXNzKCAnZXh0ZXJuYWwtbGluaycgKTsgIC8vIHRydWVcbiAqXG4gKiAgICAgdGFnLnRvQW5jaG9yU3RyaW5nKCk7ICAvLyA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiBjbGFzcz1cImV4dGVybmFsLWxpbmtcIj5Hb29nbGU8L2E+XG4gKlxuICpcbiAqICMjIEV4YW1wbGUgdXNlIHdpdGhpbiBhIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59XG4gKlxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4ge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZ30gaW5zdGFuY2UsIGNvbmZpZ3VyZWQgd2l0aCB0aGUgTWF0Y2gncyBocmVmIGFuZCBhbmNob3IgdGV4dFxuICogICAgICAgICAgICAgdGFnLnNldEF0dHIoICdyZWwnLCAnbm9mb2xsb3cnICk7XG4gKlxuICogICAgICAgICAgICAgcmV0dXJuIHRhZztcbiAqICAgICAgICAgfVxuICogICAgIH0gKTtcbiAqXG4gKiAgICAgLy8gZ2VuZXJhdGVkIGh0bWw6XG4gKiAgICAgLy8gICBUZXN0IDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vZm9sbG93XCI+Z29vZ2xlLmNvbTwvYT5cbiAqXG4gKlxuICogIyMgRXhhbXBsZSB1c2Ugd2l0aCBhIG5ldyB0YWcgZm9yIHRoZSByZXBsYWNlbWVudFxuICpcbiAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJUZXN0IGdvb2dsZS5jb21cIiwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICB2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuICogICAgICAgICAgICAgICAgIHRhZ05hbWUgOiAnYnV0dG9uJyxcbiAqICAgICAgICAgICAgICAgICBhdHRycyAgIDogeyAndGl0bGUnOiAnTG9hZCBVUkw6ICcgKyBtYXRjaC5nZXRBbmNob3JIcmVmKCkgfSxcbiAqICAgICAgICAgICAgICAgICBpbm5lckh0bWwgOiAnTG9hZCBVUkw6ICcgKyBtYXRjaC5nZXRBbmNob3JUZXh0KClcbiAqICAgICAgICAgICAgIH0gKTtcbiAqXG4gKiAgICAgICAgICAgICByZXR1cm4gdGFnO1xuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICpcbiAqICAgICAvLyBnZW5lcmF0ZWQgaHRtbDpcbiAqICAgICAvLyAgIFRlc3QgPGJ1dHRvbiB0aXRsZT1cIkxvYWQgVVJMOiBodHRwOi8vZ29vZ2xlLmNvbVwiPkxvYWQgVVJMOiBnb29nbGUuY29tPC9idXR0b24+XG4gKi9cbkF1dG9saW5rZXIuSHRtbFRhZyA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHRhZ05hbWVcblx0ICpcblx0ICogVGhlIHRhZyBuYW1lLiBFeDogJ2EnLCAnYnV0dG9uJywgZXRjLlxuXHQgKlxuXHQgKiBOb3QgcmVxdWlyZWQgYXQgaW5zdGFudGlhdGlvbiB0aW1lLCBidXQgc2hvdWxkIGJlIHNldCB1c2luZyB7QGxpbmsgI3NldFRhZ05hbWV9IGJlZm9yZSB7QGxpbmsgI3RvQW5jaG9yU3RyaW5nfVxuXHQgKiBpcyBleGVjdXRlZC5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge09iamVjdC48U3RyaW5nLCBTdHJpbmc+fSBhdHRyc1xuXHQgKlxuXHQgKiBBbiBrZXkvdmFsdWUgT2JqZWN0IChtYXApIG9mIGF0dHJpYnV0ZXMgdG8gY3JlYXRlIHRoZSB0YWcgd2l0aC4gVGhlIGtleXMgYXJlIHRoZSBhdHRyaWJ1dGUgbmFtZXMsIGFuZCB0aGVcblx0ICogdmFsdWVzIGFyZSB0aGUgYXR0cmlidXRlIHZhbHVlcy5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gaW5uZXJIdG1sXG5cdCAqXG5cdCAqIFRoZSBpbm5lciBIVE1MIGZvciB0aGUgdGFnLlxuXHQgKlxuXHQgKiBOb3RlIHRoZSBjYW1lbCBjYXNlIG5hbWUgb24gYGlubmVySHRtbGAuIEFjcm9ueW1zIGFyZSBjYW1lbENhc2VkIGluIHRoaXMgdXRpbGl0eSAoc3VjaCBhcyBub3QgdG8gcnVuIGludG8gdGhlIGFjcm9ueW1cblx0ICogbmFtaW5nIGluY29uc2lzdGVuY3kgdGhhdCB0aGUgRE9NIGRldmVsb3BlcnMgY3JlYXRlZCB3aXRoIGBYTUxIdHRwUmVxdWVzdGApLiBZb3UgbWF5IGFsdGVybmF0aXZlbHkgdXNlIHtAbGluayAjaW5uZXJIVE1MfVxuXHQgKiBpZiB5b3UgcHJlZmVyLCBidXQgdGhpcyBvbmUgaXMgcmVjb21tZW5kZWQuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGlubmVySFRNTFxuXHQgKlxuXHQgKiBBbGlhcyBvZiB7QGxpbmsgI2lubmVySHRtbH0sIGFjY2VwdGVkIGZvciBjb25zaXN0ZW5jeSB3aXRoIHRoZSBicm93c2VyIERPTSBhcGksIGJ1dCBwcmVmZXIgdGhlIGNhbWVsQ2FzZWQgdmVyc2lvblxuXHQgKiBmb3IgYWNyb255bSBuYW1lcy5cblx0ICovXG5cblxuXHQvKipcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gd2hpdGVzcGFjZVJlZ2V4XG5cdCAqXG5cdCAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIG1hdGNoIHdoaXRlc3BhY2UgaW4gYSBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMuXG5cdCAqL1xuXHR3aGl0ZXNwYWNlUmVnZXggOiAvXFxzKy8sXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGlzIGNsYXNzLCBpbiBhbiBPYmplY3QgKG1hcClcblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblxuXHRcdHRoaXMuaW5uZXJIdG1sID0gdGhpcy5pbm5lckh0bWwgfHwgdGhpcy5pbm5lckhUTUw7ICAvLyBhY2NlcHQgZWl0aGVyIHRoZSBjYW1lbENhc2VkIGZvcm0gb3IgdGhlIGZ1bGx5IGNhcGl0YWxpemVkIGFjcm9ueW1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSB0YWcgbmFtZSB0aGF0IHdpbGwgYmUgdXNlZCB0byBnZW5lcmF0ZSB0aGUgdGFnIHdpdGguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0YWdOYW1lXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldFRhZ05hbWUgOiBmdW5jdGlvbiggdGFnTmFtZSApIHtcblx0XHR0aGlzLnRhZ05hbWUgPSB0YWdOYW1lO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgdGFnIG5hbWUuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFRhZ05hbWUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy50YWdOYW1lIHx8IFwiXCI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyBhbiBhdHRyaWJ1dGUgb24gdGhlIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhdHRyTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdG8gc2V0LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYXR0clZhbHVlIFRoZSBhdHRyaWJ1dGUgdmFsdWUgdG8gc2V0LlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRzZXRBdHRyIDogZnVuY3Rpb24oIGF0dHJOYW1lLCBhdHRyVmFsdWUgKSB7XG5cdFx0dmFyIHRhZ0F0dHJzID0gdGhpcy5nZXRBdHRycygpO1xuXHRcdHRhZ0F0dHJzWyBhdHRyTmFtZSBdID0gYXR0clZhbHVlO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0cmlldmVzIGFuIGF0dHJpYnV0ZSBmcm9tIHRoZSBIdG1sVGFnLiBJZiB0aGUgYXR0cmlidXRlIGRvZXMgbm90IGV4aXN0LCByZXR1cm5zIGB1bmRlZmluZWRgLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdG8gcmV0cmlldmUuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGF0dHJpYnV0ZSdzIHZhbHVlLCBvciBgdW5kZWZpbmVkYCBpZiBpdCBkb2VzIG5vdCBleGlzdCBvbiB0aGUgSHRtbFRhZy5cblx0ICovXG5cdGdldEF0dHIgOiBmdW5jdGlvbiggYXR0ck5hbWUgKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QXR0cnMoKVsgYXR0ck5hbWUgXTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIG9uZSBvciBtb3JlIGF0dHJpYnV0ZXMgb24gdGhlIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0LjxTdHJpbmcsIFN0cmluZz59IGF0dHJzIEEga2V5L3ZhbHVlIE9iamVjdCAobWFwKSBvZiB0aGUgYXR0cmlidXRlcyB0byBzZXQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldEF0dHJzIDogZnVuY3Rpb24oIGF0dHJzICkge1xuXHRcdHZhciB0YWdBdHRycyA9IHRoaXMuZ2V0QXR0cnMoKTtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0YWdBdHRycywgYXR0cnMgKTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgYXR0cmlidXRlcyBPYmplY3QgKG1hcCkgZm9yIHRoZSBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3QuPFN0cmluZywgU3RyaW5nPn0gQSBrZXkvdmFsdWUgb2JqZWN0IG9mIHRoZSBhdHRyaWJ1dGVzIGZvciB0aGUgSHRtbFRhZy5cblx0ICovXG5cdGdldEF0dHJzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuYXR0cnMgfHwgKCB0aGlzLmF0dHJzID0ge30gKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBwcm92aWRlZCBgY3NzQ2xhc3NgLCBvdmVyd3JpdGluZyBhbnkgY3VycmVudCBDU1MgY2xhc3NlcyBvbiB0aGUgSHRtbFRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIE9uZSBvciBtb3JlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NlcyB0byBzZXQgKG92ZXJ3cml0ZSkuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldENsYXNzIDogZnVuY3Rpb24oIGNzc0NsYXNzICkge1xuXHRcdHJldHVybiB0aGlzLnNldEF0dHIoICdjbGFzcycsIGNzc0NsYXNzICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIGFkZCBvbmUgb3IgbW9yZSBDU1MgY2xhc3NlcyB0byB0aGUgSHRtbFRhZy4gV2lsbCBub3QgYWRkIGR1cGxpY2F0ZSBDU1MgY2xhc3Nlcy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIE9uZSBvciBtb3JlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NlcyB0byBhZGQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdGFkZENsYXNzIDogZnVuY3Rpb24oIGNzc0NsYXNzICkge1xuXHRcdHZhciBjbGFzc0F0dHIgPSB0aGlzLmdldENsYXNzKCksXG5cdFx0ICAgIHdoaXRlc3BhY2VSZWdleCA9IHRoaXMud2hpdGVzcGFjZVJlZ2V4LFxuXHRcdCAgICBpbmRleE9mID0gQXV0b2xpbmtlci5VdGlsLmluZGV4T2YsICAvLyB0byBzdXBwb3J0IElFOCBhbmQgYmVsb3dcblx0XHQgICAgY2xhc3NlcyA9ICggIWNsYXNzQXR0ciApID8gW10gOiBjbGFzc0F0dHIuc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICBuZXdDbGFzc2VzID0gY3NzQ2xhc3Muc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICBuZXdDbGFzcztcblxuXHRcdHdoaWxlKCBuZXdDbGFzcyA9IG5ld0NsYXNzZXMuc2hpZnQoKSApIHtcblx0XHRcdGlmKCBpbmRleE9mKCBjbGFzc2VzLCBuZXdDbGFzcyApID09PSAtMSApIHtcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKCBuZXdDbGFzcyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdID0gY2xhc3Nlcy5qb2luKCBcIiBcIiApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENvbnZlbmllbmNlIG1ldGhvZCB0byByZW1vdmUgb25lIG9yIG1vcmUgQ1NTIGNsYXNzZXMgZnJvbSB0aGUgSHRtbFRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIE9uZSBvciBtb3JlIHNwYWNlLXNlcGFyYXRlZCBDU1MgY2xhc3NlcyB0byByZW1vdmUuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHJlbW92ZUNsYXNzIDogZnVuY3Rpb24oIGNzc0NsYXNzICkge1xuXHRcdHZhciBjbGFzc0F0dHIgPSB0aGlzLmdldENsYXNzKCksXG5cdFx0ICAgIHdoaXRlc3BhY2VSZWdleCA9IHRoaXMud2hpdGVzcGFjZVJlZ2V4LFxuXHRcdCAgICBpbmRleE9mID0gQXV0b2xpbmtlci5VdGlsLmluZGV4T2YsICAvLyB0byBzdXBwb3J0IElFOCBhbmQgYmVsb3dcblx0XHQgICAgY2xhc3NlcyA9ICggIWNsYXNzQXR0ciApID8gW10gOiBjbGFzc0F0dHIuc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICByZW1vdmVDbGFzc2VzID0gY3NzQ2xhc3Muc3BsaXQoIHdoaXRlc3BhY2VSZWdleCApLFxuXHRcdCAgICByZW1vdmVDbGFzcztcblxuXHRcdHdoaWxlKCBjbGFzc2VzLmxlbmd0aCAmJiAoIHJlbW92ZUNsYXNzID0gcmVtb3ZlQ2xhc3Nlcy5zaGlmdCgpICkgKSB7XG5cdFx0XHR2YXIgaWR4ID0gaW5kZXhPZiggY2xhc3NlcywgcmVtb3ZlQ2xhc3MgKTtcblx0XHRcdGlmKCBpZHggIT09IC0xICkge1xuXHRcdFx0XHRjbGFzc2VzLnNwbGljZSggaWR4LCAxICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRBdHRycygpWyAnY2xhc3MnIF0gPSBjbGFzc2VzLmpvaW4oIFwiIFwiICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIHJldHJpZXZlIHRoZSBDU1MgY2xhc3MoZXMpIGZvciB0aGUgSHRtbFRhZywgd2hpY2ggd2lsbCBlYWNoIGJlIHNlcGFyYXRlZCBieSBzcGFjZXMgd2hlblxuXHQgKiB0aGVyZSBhcmUgbXVsdGlwbGUuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldENsYXNzIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdIHx8IFwiXCI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIGNoZWNrIGlmIHRoZSB0YWcgaGFzIGEgQ1NTIGNsYXNzIG9yIG5vdC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGNzc0NsYXNzIFRoZSBDU1MgY2xhc3MgdG8gY2hlY2sgZm9yLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIEh0bWxUYWcgaGFzIHRoZSBDU1MgY2xhc3MsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0aGFzQ2xhc3MgOiBmdW5jdGlvbiggY3NzQ2xhc3MgKSB7XG5cdFx0cmV0dXJuICggJyAnICsgdGhpcy5nZXRDbGFzcygpICsgJyAnICkuaW5kZXhPZiggJyAnICsgY3NzQ2xhc3MgKyAnICcgKSAhPT0gLTE7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyB0aGUgaW5uZXIgSFRNTCBmb3IgdGhlIHRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGh0bWwgVGhlIGlubmVyIEhUTUwgdG8gc2V0LlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRzZXRJbm5lckh0bWwgOiBmdW5jdGlvbiggaHRtbCApIHtcblx0XHR0aGlzLmlubmVySHRtbCA9IGh0bWw7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIGlubmVyIEhUTUwgZm9yIHRoZSB0YWcuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldElubmVySHRtbCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmlubmVySHRtbCB8fCBcIlwiO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIE92ZXJyaWRlIG9mIHN1cGVyY2xhc3MgbWV0aG9kIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIEhUTUwgc3RyaW5nIGZvciB0aGUgdGFnLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHR0b0FuY2hvclN0cmluZyA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0YWdOYW1lID0gdGhpcy5nZXRUYWdOYW1lKCksXG5cdFx0ICAgIGF0dHJzU3RyID0gdGhpcy5idWlsZEF0dHJzU3RyKCk7XG5cblx0XHRhdHRyc1N0ciA9ICggYXR0cnNTdHIgKSA/ICcgJyArIGF0dHJzU3RyIDogJyc7ICAvLyBwcmVwZW5kIGEgc3BhY2UgaWYgdGhlcmUgYXJlIGFjdHVhbGx5IGF0dHJpYnV0ZXNcblxuXHRcdHJldHVybiBbICc8JywgdGFnTmFtZSwgYXR0cnNTdHIsICc+JywgdGhpcy5nZXRJbm5lckh0bWwoKSwgJzwvJywgdGFnTmFtZSwgJz4nIF0uam9pbiggXCJcIiApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFN1cHBvcnQgbWV0aG9kIGZvciB7QGxpbmsgI3RvQW5jaG9yU3RyaW5nfSwgcmV0dXJucyB0aGUgc3RyaW5nIHNwYWNlLXNlcGFyYXRlZCBrZXk9XCJ2YWx1ZVwiIHBhaXJzLCB1c2VkIHRvIHBvcHVsYXRlXG5cdCAqIHRoZSBzdHJpbmdpZmllZCBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gRXhhbXBsZSByZXR1cm46IGBhdHRyMT1cInZhbHVlMVwiIGF0dHIyPVwidmFsdWUyXCJgXG5cdCAqL1xuXHRidWlsZEF0dHJzU3RyIDogZnVuY3Rpb24oKSB7XG5cdFx0aWYoICF0aGlzLmF0dHJzICkgcmV0dXJuIFwiXCI7ICAvLyBubyBgYXR0cnNgIE9iamVjdCAobWFwKSBoYXMgYmVlbiBzZXQsIHJldHVybiBlbXB0eSBzdHJpbmdcblxuXHRcdHZhciBhdHRycyA9IHRoaXMuZ2V0QXR0cnMoKSxcblx0XHQgICAgYXR0cnNBcnIgPSBbXTtcblxuXHRcdGZvciggdmFyIHByb3AgaW4gYXR0cnMgKSB7XG5cdFx0XHRpZiggYXR0cnMuaGFzT3duUHJvcGVydHkoIHByb3AgKSApIHtcblx0XHRcdFx0YXR0cnNBcnIucHVzaCggcHJvcCArICc9XCInICsgYXR0cnNbIHByb3AgXSArICdcIicgKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIGF0dHJzQXJyLmpvaW4oIFwiIFwiICk7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKmpzaGludCBzdWI6dHJ1ZSAqL1xuLyoqXG4gKiBAcHJvdGVjdGVkXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBCdWlsZHMgYW5jaG9yICgmbHQ7YSZndDspIHRhZ3MgZm9yIHRoZSBBdXRvbGlua2VyIHV0aWxpdHkgd2hlbiBhIG1hdGNoIGlzIGZvdW5kLlxuICpcbiAqIE5vcm1hbGx5IHRoaXMgY2xhc3MgaXMgaW5zdGFudGlhdGVkLCBjb25maWd1cmVkLCBhbmQgdXNlZCBpbnRlcm5hbGx5IGJ5IGFuIHtAbGluayBBdXRvbGlua2VyfSBpbnN0YW5jZSwgYnV0IG1heVxuICogYWN0dWFsbHkgYmUgcmV0cmlldmVkIGluIGEge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0gdG8gY3JlYXRlIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWcgSHRtbFRhZ30gaW5zdGFuY2VzXG4gKiB3aGljaCBtYXkgYmUgbW9kaWZpZWQgYmVmb3JlIHJldHVybmluZyBmcm9tIHRoZSB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufS4gRm9yIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4ge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZ30gaW5zdGFuY2VcbiAqICAgICAgICAgICAgIHRhZy5zZXRBdHRyKCAncmVsJywgJ25vZm9sbG93JyApO1xuICpcbiAqICAgICAgICAgICAgIHJldHVybiB0YWc7XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKlxuICogICAgIC8vIGdlbmVyYXRlZCBodG1sOlxuICogICAgIC8vICAgVGVzdCA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub2ZvbGxvd1wiPmdvb2dsZS5jb208L2E+XG4gKi9cbkF1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlciA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBuZXdXaW5kb3dcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNuZXdXaW5kb3dcblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge051bWJlcn0gdHJ1bmNhdGVcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciN0cnVuY2F0ZVxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBjbGFzc05hbWVcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNjbGFzc05hbWVcblx0ICovXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQW5jaG9yVGFnQnVpbGRlciBpbnN0YW5jZSwgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgdGhlIGFjdHVhbCBhbmNob3IgKCZsdDthJmd0OykgdGFnIHRvIHVzZSBpbiBwbGFjZSBvZiB0aGVcblx0ICogbWF0Y2hlZCB0ZXh0LCB2aWEgaXRzIGBtYXRjaGAgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0F1dG9saW5rZXIubWF0Y2guTWF0Y2h9IG1hdGNoIFRoZSBNYXRjaCBpbnN0YW5jZSB0byBnZW5lcmF0ZSBhblxuXHQgKiAgIGFuY2hvciB0YWcgZnJvbS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGUgSHRtbFRhZyBpbnN0YW5jZSBmb3IgdGhlIGFuY2hvciB0YWcuXG5cdCAqL1xuXHRidWlsZCA6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHR2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuXHRcdFx0dGFnTmFtZSAgIDogJ2EnLFxuXHRcdFx0YXR0cnMgICAgIDogdGhpcy5jcmVhdGVBdHRycyggbWF0Y2guZ2V0VHlwZSgpLCBtYXRjaC5nZXRBbmNob3JIcmVmKCkgKSxcblx0XHRcdGlubmVySHRtbCA6IHRoaXMucHJvY2Vzc0FuY2hvclRleHQoIG1hdGNoLmdldEFuY2hvclRleHQoKSApXG5cdFx0fSApO1xuXG5cdFx0cmV0dXJuIHRhZztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSBPYmplY3QgKG1hcCkgb2YgdGhlIEhUTUwgYXR0cmlidXRlcyBmb3IgdGhlIGFuY2hvciAoJmx0O2EmZ3Q7KVxuXHQgKiAgIHRhZyBiZWluZyBnZW5lcmF0ZWQuXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtcInVybFwiL1wiZW1haWxcIi9cInBob25lXCIvXCJ0d2l0dGVyXCIvXCJoYXNodGFnXCJ9IG1hdGNoVHlwZSBUaGUgdHlwZSBvZlxuXHQgKiAgIG1hdGNoIHRoYXQgYW4gYW5jaG9yIHRhZyBpcyBiZWluZyBnZW5lcmF0ZWQgZm9yLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaHJlZiBUaGUgaHJlZiBmb3IgdGhlIGFuY2hvciB0YWcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQSBrZXkvdmFsdWUgT2JqZWN0IChtYXApIG9mIHRoZSBhbmNob3IgdGFnJ3MgYXR0cmlidXRlcy5cblx0ICovXG5cdGNyZWF0ZUF0dHJzIDogZnVuY3Rpb24oIG1hdGNoVHlwZSwgYW5jaG9ySHJlZiApIHtcblx0XHR2YXIgYXR0cnMgPSB7XG5cdFx0XHQnaHJlZicgOiBhbmNob3JIcmVmICAvLyB3ZSdsbCBhbHdheXMgaGF2ZSB0aGUgYGhyZWZgIGF0dHJpYnV0ZVxuXHRcdH07XG5cblx0XHR2YXIgY3NzQ2xhc3MgPSB0aGlzLmNyZWF0ZUNzc0NsYXNzKCBtYXRjaFR5cGUgKTtcblx0XHRpZiggY3NzQ2xhc3MgKSB7XG5cdFx0XHRhdHRyc1sgJ2NsYXNzJyBdID0gY3NzQ2xhc3M7XG5cdFx0fVxuXHRcdGlmKCB0aGlzLm5ld1dpbmRvdyApIHtcblx0XHRcdGF0dHJzWyAndGFyZ2V0JyBdID0gXCJfYmxhbmtcIjtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXR0cnM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGUgQ1NTIGNsYXNzIHRoYXQgd2lsbCBiZSB1c2VkIGZvciBhIGdpdmVuIGFuY2hvciB0YWcsIGJhc2VkIG9uXG5cdCAqIHRoZSBgbWF0Y2hUeXBlYCBhbmQgdGhlIHtAbGluayAjY2xhc3NOYW1lfSBjb25maWcuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7XCJ1cmxcIi9cImVtYWlsXCIvXCJwaG9uZVwiL1widHdpdHRlclwiL1wiaGFzaHRhZ1wifSBtYXRjaFR5cGUgVGhlIHR5cGUgb2Zcblx0ICogICBtYXRjaCB0aGF0IGFuIGFuY2hvciB0YWcgaXMgYmVpbmcgZ2VuZXJhdGVkIGZvci5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgQ1NTIGNsYXNzIHN0cmluZyBmb3IgdGhlIGxpbmsuIEV4YW1wbGUgcmV0dXJuOlxuXHQgKiAgIFwibXlMaW5rIG15TGluay11cmxcIi4gSWYgbm8ge0BsaW5rICNjbGFzc05hbWV9IHdhcyBjb25maWd1cmVkLCByZXR1cm5zXG5cdCAqICAgYW4gZW1wdHkgc3RyaW5nLlxuXHQgKi9cblx0Y3JlYXRlQ3NzQ2xhc3MgOiBmdW5jdGlvbiggbWF0Y2hUeXBlICkge1xuXHRcdHZhciBjbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZTtcblxuXHRcdGlmKCAhY2xhc3NOYW1lIClcblx0XHRcdHJldHVybiBcIlwiO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiBjbGFzc05hbWUgKyBcIiBcIiArIGNsYXNzTmFtZSArIFwiLVwiICsgbWF0Y2hUeXBlOyAgLy8gZXg6IFwibXlMaW5rIG15TGluay11cmxcIiwgXCJteUxpbmsgbXlMaW5rLWVtYWlsXCIsIFwibXlMaW5rIG15TGluay1waG9uZVwiLCBcIm15TGluayBteUxpbmstdHdpdHRlclwiLCBvciBcIm15TGluayBteUxpbmstaGFzaHRhZ1wiXG5cdH0sXG5cblxuXHQvKipcblx0ICogUHJvY2Vzc2VzIHRoZSBgYW5jaG9yVGV4dGAgYnkgdHJ1bmNhdGluZyB0aGUgdGV4dCBhY2NvcmRpbmcgdG8gdGhlXG5cdCAqIHtAbGluayAjdHJ1bmNhdGV9IGNvbmZpZy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGFuY2hvclRleHQgVGhlIGFuY2hvciB0YWcncyB0ZXh0IChpLmUuIHdoYXQgd2lsbCBiZVxuXHQgKiAgIGRpc3BsYXllZCkuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHByb2Nlc3NlZCBgYW5jaG9yVGV4dGAuXG5cdCAqL1xuXHRwcm9jZXNzQW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCBhbmNob3JUZXh0ICkge1xuXHRcdGFuY2hvclRleHQgPSB0aGlzLmRvVHJ1bmNhdGUoIGFuY2hvclRleHQgKTtcblxuXHRcdHJldHVybiBhbmNob3JUZXh0O1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFBlcmZvcm1zIHRoZSB0cnVuY2F0aW9uIG9mIHRoZSBgYW5jaG9yVGV4dGAsIGlmIHRoZSBgYW5jaG9yVGV4dGAgaXNcblx0ICogbG9uZ2VyIHRoYW4gdGhlIHtAbGluayAjdHJ1bmNhdGV9IG9wdGlvbi4gVHJ1bmNhdGVzIHRoZSB0ZXh0IHRvIDJcblx0ICogY2hhcmFjdGVycyBmZXdlciB0aGFuIHRoZSB7QGxpbmsgI3RydW5jYXRlfSBvcHRpb24sIGFuZCBhZGRzIFwiLi5cIiB0byB0aGVcblx0ICogZW5kLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgYW5jaG9yIHRhZydzIHRleHQgKGkuZS4gd2hhdCB3aWxsIGJlIGRpc3BsYXllZCkuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHRydW5jYXRlZCBhbmNob3IgdGV4dC5cblx0ICovXG5cdGRvVHJ1bmNhdGUgOiBmdW5jdGlvbiggYW5jaG9yVGV4dCApIHtcblx0XHRyZXR1cm4gQXV0b2xpbmtlci5VdGlsLmVsbGlwc2lzKCBhbmNob3JUZXh0LCB0aGlzLnRydW5jYXRlIHx8IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSApO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQHByaXZhdGVcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogQW4gSFRNTCBwYXJzZXIgaW1wbGVtZW50YXRpb24gd2hpY2ggc2ltcGx5IHdhbGtzIGFuIEhUTUwgc3RyaW5nIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlIEh0bWxOb2Rlc30gdGhhdCByZXByZXNlbnQgdGhlIGJhc2ljIEhUTUwgc3RydWN0dXJlIG9mIHRoZSBpbnB1dCBzdHJpbmcuXG4gKlxuICogQXV0b2xpbmtlciB1c2VzIHRoaXMgdG8gb25seSBsaW5rIFVSTHMvZW1haWxzL1R3aXR0ZXIgaGFuZGxlcyB3aXRoaW4gdGV4dCBub2RlcywgZWZmZWN0aXZlbHkgaWdub3JpbmcgLyBcIndhbGtpbmdcbiAqIGFyb3VuZFwiIEhUTUwgdGFncy5cbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXIgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGh0bWxSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcHVsbCBvdXQgSFRNTCB0YWdzIGZyb20gYSBzdHJpbmcuIEhhbmRsZXMgbmFtZXNwYWNlZCBIVE1MIHRhZ3MgYW5kXG5cdCAqIGF0dHJpYnV0ZSBuYW1lcywgYXMgc3BlY2lmaWVkIGJ5IGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWwtbWFya3VwL3N5bnRheC5odG1sLlxuXHQgKlxuXHQgKiBDYXB0dXJpbmcgZ3JvdXBzOlxuXHQgKlxuXHQgKiAxLiBUaGUgXCIhRE9DVFlQRVwiIHRhZyBuYW1lLCBpZiBhIHRhZyBpcyBhICZsdDshRE9DVFlQRSZndDsgdGFnLlxuXHQgKiAyLiBJZiBpdCBpcyBhbiBlbmQgdGFnLCB0aGlzIGdyb3VwIHdpbGwgaGF2ZSB0aGUgJy8nLlxuXHQgKiAzLiBJZiBpdCBpcyBhIGNvbW1lbnQgdGFnLCB0aGlzIGdyb3VwIHdpbGwgaG9sZCB0aGUgY29tbWVudCB0ZXh0IChpLmUuXG5cdCAqICAgIHRoZSB0ZXh0IGluc2lkZSB0aGUgYCZsdDshLS1gIGFuZCBgLS0mZ3Q7YC5cblx0ICogNC4gVGhlIHRhZyBuYW1lIGZvciBhbGwgdGFncyAob3RoZXIgdGhhbiB0aGUgJmx0OyFET0NUWVBFJmd0OyB0YWcpXG5cdCAqL1xuXHRodG1sUmVnZXggOiAoZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbW1lbnRUYWdSZWdleCA9IC8hLS0oW1xcc1xcU10rPyktLS8sXG5cdFx0ICAgIHRhZ05hbWVSZWdleCA9IC9bMC05YS16QS1aXVswLTlhLXpBLVo6XSovLFxuXHRcdCAgICBhdHRyTmFtZVJlZ2V4ID0gL1teXFxzXFwwXCInPlxcLz1cXHgwMS1cXHgxRlxceDdGXSsvLCAgIC8vIHRoZSB1bmljb2RlIHJhbmdlIGFjY291bnRzIGZvciBleGNsdWRpbmcgY29udHJvbCBjaGFycywgYW5kIHRoZSBkZWxldGUgY2hhclxuXHRcdCAgICBhdHRyVmFsdWVSZWdleCA9IC8oPzpcIlteXCJdKj9cInwnW14nXSo/J3xbXidcIj08PmBcXHNdKykvLCAvLyBkb3VibGUgcXVvdGVkLCBzaW5nbGUgcXVvdGVkLCBvciB1bnF1b3RlZCBhdHRyaWJ1dGUgdmFsdWVzXG5cdFx0ICAgIG5hbWVFcXVhbHNWYWx1ZVJlZ2V4ID0gYXR0ck5hbWVSZWdleC5zb3VyY2UgKyAnKD86XFxcXHMqPVxcXFxzKicgKyBhdHRyVmFsdWVSZWdleC5zb3VyY2UgKyAnKT8nOyAgLy8gb3B0aW9uYWwgJz1bdmFsdWVdJ1xuXG5cdFx0cmV0dXJuIG5ldyBSZWdFeHAoIFtcblx0XHRcdC8vIGZvciA8IURPQ1RZUEU+IHRhZy4gRXg6IDwhRE9DVFlQRSBodG1sIFBVQkxJQyBcIi0vL1czQy8vRFREIFhIVE1MIDEuMCBTdHJpY3QvL0VOXCIgXCJodHRwOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvRFREL3hodG1sMS1zdHJpY3QuZHRkXCI+KVxuXHRcdFx0Jyg/OicsXG5cdFx0XHRcdCc8KCFET0NUWVBFKScsICAvLyAqKiogQ2FwdHVyaW5nIEdyb3VwIDEgLSBJZiBpdCdzIGEgZG9jdHlwZSB0YWdcblxuXHRcdFx0XHRcdC8vIFplcm8gb3IgbW9yZSBhdHRyaWJ1dGVzIGZvbGxvd2luZyB0aGUgdGFnIG5hbWVcblx0XHRcdFx0XHQnKD86Jyxcblx0XHRcdFx0XHRcdCdcXFxccysnLCAgLy8gb25lIG9yIG1vcmUgd2hpdGVzcGFjZSBjaGFycyBiZWZvcmUgYW4gYXR0cmlidXRlXG5cblx0XHRcdFx0XHRcdC8vIEVpdGhlcjpcblx0XHRcdFx0XHRcdC8vIEEuIGF0dHI9XCJ2YWx1ZVwiLCBvclxuXHRcdFx0XHRcdFx0Ly8gQi4gXCJ2YWx1ZVwiIGFsb25lIChUbyBjb3ZlciBleGFtcGxlIGRvY3R5cGUgdGFnOiA8IURPQ1RZUEUgaHRtbCBQVUJMSUMgXCItLy9XM0MvL0RURCBYSFRNTCAxLjAgU3RyaWN0Ly9FTlwiIFwiaHR0cDovL3d3dy53My5vcmcvVFIveGh0bWwxL0RURC94aHRtbDEtc3RyaWN0LmR0ZFwiPilcblx0XHRcdFx0XHRcdCcoPzonLCBuYW1lRXF1YWxzVmFsdWVSZWdleCwgJ3wnLCBhdHRyVmFsdWVSZWdleC5zb3VyY2UgKyAnKScsXG5cdFx0XHRcdFx0JykqJyxcblx0XHRcdFx0Jz4nLFxuXHRcdFx0JyknLFxuXG5cdFx0XHQnfCcsXG5cblx0XHRcdC8vIEFsbCBvdGhlciBIVE1MIHRhZ3MgKGkuZS4gdGFncyB0aGF0IGFyZSBub3QgPCFET0NUWVBFPilcblx0XHRcdCcoPzonLFxuXHRcdFx0XHQnPCgvKT8nLCAgLy8gQmVnaW5uaW5nIG9mIGEgdGFnIG9yIGNvbW1lbnQuIEVpdGhlciAnPCcgZm9yIGEgc3RhcnQgdGFnLCBvciAnPC8nIGZvciBhbiBlbmQgdGFnLlxuXHRcdFx0XHQgICAgICAgICAgLy8gKioqIENhcHR1cmluZyBHcm91cCAyOiBUaGUgc2xhc2ggb3IgYW4gZW1wdHkgc3RyaW5nLiBTbGFzaCAoJy8nKSBmb3IgZW5kIHRhZywgZW1wdHkgc3RyaW5nIGZvciBzdGFydCBvciBzZWxmLWNsb3NpbmcgdGFnLlxuXG5cdFx0XHRcdFx0Jyg/OicsXG5cdFx0XHRcdFx0XHRjb21tZW50VGFnUmVnZXguc291cmNlLCAgLy8gKioqIENhcHR1cmluZyBHcm91cCAzIC0gQSBDb21tZW50IFRhZydzIFRleHRcblxuXHRcdFx0XHRcdFx0J3wnLFxuXG5cdFx0XHRcdFx0XHQnKD86JyxcblxuXHRcdFx0XHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIEdyb3VwIDQgLSBUaGUgdGFnIG5hbWVcblx0XHRcdFx0XHRcdFx0JygnICsgdGFnTmFtZVJlZ2V4LnNvdXJjZSArICcpJyxcblxuXHRcdFx0XHRcdFx0XHQvLyBaZXJvIG9yIG1vcmUgYXR0cmlidXRlcyBmb2xsb3dpbmcgdGhlIHRhZyBuYW1lXG5cdFx0XHRcdFx0XHRcdCcoPzonLFxuXHRcdFx0XHRcdFx0XHRcdCdcXFxccysnLCAgICAgICAgICAgICAgICAvLyBvbmUgb3IgbW9yZSB3aGl0ZXNwYWNlIGNoYXJzIGJlZm9yZSBhbiBhdHRyaWJ1dGVcblx0XHRcdFx0XHRcdFx0XHRuYW1lRXF1YWxzVmFsdWVSZWdleCwgIC8vIGF0dHI9XCJ2YWx1ZVwiICh3aXRoIG9wdGlvbmFsID1cInZhbHVlXCIgcGFydClcblx0XHRcdFx0XHRcdFx0JykqJyxcblxuXHRcdFx0XHRcdFx0XHQnXFxcXHMqLz8nLCAgLy8gYW55IHRyYWlsaW5nIHNwYWNlcyBhbmQgb3B0aW9uYWwgJy8nIGJlZm9yZSB0aGUgY2xvc2luZyAnPidcblxuXHRcdFx0XHRcdFx0JyknLFxuXHRcdFx0XHRcdCcpJyxcblx0XHRcdFx0Jz4nLFxuXHRcdFx0JyknXG5cdFx0XS5qb2luKCBcIlwiICksICdnaScgKTtcblx0fSApKCksXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBodG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHRoYXQgbWF0Y2hlcyBjb21tb24gSFRNTCBjaGFyYWN0ZXIgZW50aXRpZXMuXG5cdCAqXG5cdCAqIElnbm9yaW5nICZhbXA7IGFzIGl0IGNvdWxkIGJlIHBhcnQgb2YgYSBxdWVyeSBzdHJpbmcgLS0gaGFuZGxpbmcgaXQgc2VwYXJhdGVseS5cblx0ICovXG5cdGh0bWxDaGFyYWN0ZXJFbnRpdGllc1JlZ2V4OiAvKCZuYnNwO3wmIzE2MDt8Jmx0O3wmIzYwO3wmZ3Q7fCYjNjI7fCZxdW90O3wmIzM0O3wmIzM5OykvZ2ksXG5cblxuXHQvKipcblx0ICogUGFyc2VzIGFuIEhUTUwgc3RyaW5nIGFuZCByZXR1cm5zIGEgc2ltcGxlIGFycmF5IG9mIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUgSHRtbE5vZGVzfVxuXHQgKiB0byByZXByZXNlbnQgdGhlIEhUTUwgc3RydWN0dXJlIG9mIHRoZSBpbnB1dCBzdHJpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIFRoZSBIVE1MIHRvIHBhcnNlLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVbXX1cblx0ICovXG5cdHBhcnNlIDogZnVuY3Rpb24oIGh0bWwgKSB7XG5cdFx0dmFyIGh0bWxSZWdleCA9IHRoaXMuaHRtbFJlZ2V4LFxuXHRcdCAgICBjdXJyZW50UmVzdWx0LFxuXHRcdCAgICBsYXN0SW5kZXggPSAwLFxuXHRcdCAgICB0ZXh0QW5kRW50aXR5Tm9kZXMsXG5cdFx0ICAgIG5vZGVzID0gW107ICAvLyB3aWxsIGJlIHRoZSByZXN1bHQgb2YgdGhlIG1ldGhvZFxuXG5cdFx0d2hpbGUoICggY3VycmVudFJlc3VsdCA9IGh0bWxSZWdleC5leGVjKCBodG1sICkgKSAhPT0gbnVsbCApIHtcblx0XHRcdHZhciB0YWdUZXh0ID0gY3VycmVudFJlc3VsdFsgMCBdLFxuXHRcdFx0ICAgIGNvbW1lbnRUZXh0ID0gY3VycmVudFJlc3VsdFsgMyBdLCAvLyBpZiB3ZSd2ZSBtYXRjaGVkIGEgY29tbWVudFxuXHRcdFx0ICAgIHRhZ05hbWUgPSBjdXJyZW50UmVzdWx0WyAxIF0gfHwgY3VycmVudFJlc3VsdFsgNCBdLCAgLy8gVGhlIDwhRE9DVFlQRT4gdGFnIChleDogXCIhRE9DVFlQRVwiKSwgb3IgYW5vdGhlciB0YWcgKGV4OiBcImFcIiBvciBcImltZ1wiKVxuXHRcdFx0ICAgIGlzQ2xvc2luZ1RhZyA9ICEhY3VycmVudFJlc3VsdFsgMiBdLFxuXHRcdFx0ICAgIGluQmV0d2VlblRhZ3NUZXh0ID0gaHRtbC5zdWJzdHJpbmcoIGxhc3RJbmRleCwgY3VycmVudFJlc3VsdC5pbmRleCApO1xuXG5cdFx0XHQvLyBQdXNoIFRleHROb2RlcyBhbmQgRW50aXR5Tm9kZXMgZm9yIGFueSB0ZXh0IGZvdW5kIGJldHdlZW4gdGFnc1xuXHRcdFx0aWYoIGluQmV0d2VlblRhZ3NUZXh0ICkge1xuXHRcdFx0XHR0ZXh0QW5kRW50aXR5Tm9kZXMgPSB0aGlzLnBhcnNlVGV4dEFuZEVudGl0eU5vZGVzKCBpbkJldHdlZW5UYWdzVGV4dCApO1xuXHRcdFx0XHRub2Rlcy5wdXNoLmFwcGx5KCBub2RlcywgdGV4dEFuZEVudGl0eU5vZGVzICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFB1c2ggdGhlIENvbW1lbnROb2RlIG9yIEVsZW1lbnROb2RlXG5cdFx0XHRpZiggY29tbWVudFRleHQgKSB7XG5cdFx0XHRcdG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlQ29tbWVudE5vZGUoIHRhZ1RleHQsIGNvbW1lbnRUZXh0ICkgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlRWxlbWVudE5vZGUoIHRhZ1RleHQsIHRhZ05hbWUsIGlzQ2xvc2luZ1RhZyApICk7XG5cdFx0XHR9XG5cblx0XHRcdGxhc3RJbmRleCA9IGN1cnJlbnRSZXN1bHQuaW5kZXggKyB0YWdUZXh0Lmxlbmd0aDtcblx0XHR9XG5cblx0XHQvLyBQcm9jZXNzIGFueSByZW1haW5pbmcgdGV4dCBhZnRlciB0aGUgbGFzdCBIVE1MIGVsZW1lbnQuIFdpbGwgcHJvY2VzcyBhbGwgb2YgdGhlIHRleHQgaWYgdGhlcmUgd2VyZSBubyBIVE1MIGVsZW1lbnRzLlxuXHRcdGlmKCBsYXN0SW5kZXggPCBodG1sLmxlbmd0aCApIHtcblx0XHRcdHZhciB0ZXh0ID0gaHRtbC5zdWJzdHJpbmcoIGxhc3RJbmRleCApO1xuXG5cdFx0XHQvLyBQdXNoIFRleHROb2RlcyBhbmQgRW50aXR5Tm9kZXMgZm9yIGFueSB0ZXh0IGZvdW5kIGJldHdlZW4gdGFnc1xuXHRcdFx0aWYoIHRleHQgKSB7XG5cdFx0XHRcdHRleHRBbmRFbnRpdHlOb2RlcyA9IHRoaXMucGFyc2VUZXh0QW5kRW50aXR5Tm9kZXMoIHRleHQgKTtcblx0XHRcdFx0bm9kZXMucHVzaC5hcHBseSggbm9kZXMsIHRleHRBbmRFbnRpdHlOb2RlcyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBub2Rlcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBQYXJzZXMgdGV4dCBhbmQgSFRNTCBlbnRpdHkgbm9kZXMgZnJvbSBhIGdpdmVuIHN0cmluZy4gVGhlIGlucHV0IHN0cmluZ1xuXHQgKiBzaG91bGQgbm90IGhhdmUgYW55IEhUTUwgdGFncyAoZWxlbWVudHMpIHdpdGhpbiBpdC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gcGFyc2UuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVtdfSBBbiBhcnJheSBvZiBIdG1sTm9kZXMgdG9cblx0ICogICByZXByZXNlbnQgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgVGV4dE5vZGVzfSBhbmRcblx0ICogICB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGUgRW50aXR5Tm9kZXN9IGZvdW5kLlxuXHQgKi9cblx0cGFyc2VUZXh0QW5kRW50aXR5Tm9kZXMgOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHR2YXIgbm9kZXMgPSBbXSxcblx0XHQgICAgdGV4dEFuZEVudGl0eVRva2VucyA9IEF1dG9saW5rZXIuVXRpbC5zcGxpdEFuZENhcHR1cmUoIHRleHQsIHRoaXMuaHRtbENoYXJhY3RlckVudGl0aWVzUmVnZXggKTsgIC8vIHNwbGl0IGF0IEhUTUwgZW50aXRpZXMsIGJ1dCBpbmNsdWRlIHRoZSBIVE1MIGVudGl0aWVzIGluIHRoZSByZXN1bHRzIGFycmF5XG5cblx0XHQvLyBFdmVyeSBldmVuIG51bWJlcmVkIHRva2VuIGlzIGEgVGV4dE5vZGUsIGFuZCBldmVyeSBvZGQgbnVtYmVyZWQgdG9rZW4gaXMgYW4gRW50aXR5Tm9kZVxuXHRcdC8vIEZvciBleGFtcGxlOiBhbiBpbnB1dCBgdGV4dGAgb2YgXCJUZXN0ICZxdW90O3RoaXMmcXVvdDsgdG9kYXlcIiB3b3VsZCB0dXJuIGludG8gdGhlXG5cdFx0Ly8gICBgdGV4dEFuZEVudGl0eVRva2Vuc2A6IFsgJ1Rlc3QgJywgJyZxdW90OycsICd0aGlzJywgJyZxdW90OycsICcgdG9kYXknIF1cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gdGV4dEFuZEVudGl0eVRva2Vucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMiApIHtcblx0XHRcdHZhciB0ZXh0VG9rZW4gPSB0ZXh0QW5kRW50aXR5VG9rZW5zWyBpIF0sXG5cdFx0XHQgICAgZW50aXR5VG9rZW4gPSB0ZXh0QW5kRW50aXR5VG9rZW5zWyBpICsgMSBdO1xuXG5cdFx0XHRpZiggdGV4dFRva2VuICkgbm9kZXMucHVzaCggdGhpcy5jcmVhdGVUZXh0Tm9kZSggdGV4dFRva2VuICkgKTtcblx0XHRcdGlmKCBlbnRpdHlUb2tlbiApIG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlRW50aXR5Tm9kZSggZW50aXR5VG9rZW4gKSApO1xuXHRcdH1cblx0XHRyZXR1cm4gbm9kZXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGUgQ29tbWVudE5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnVGV4dCBUaGUgZnVsbCB0ZXh0IG9mIHRoZSB0YWcgKGNvbW1lbnQpIHRoYXQgd2FzXG5cdCAqICAgbWF0Y2hlZCwgaW5jbHVkaW5nIGl0cyAmbHQ7IS0tIGFuZCAtLSZndDsuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjb21tZW50IFRoZSBmdWxsIHRleHQgb2YgdGhlIGNvbW1lbnQgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdGNyZWF0ZUNvbW1lbnROb2RlIDogZnVuY3Rpb24oIHRhZ1RleHQsIGNvbW1lbnRUZXh0ICkge1xuXHRcdHJldHVybiBuZXcgQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlKCB7XG5cdFx0XHR0ZXh0OiB0YWdUZXh0LFxuXHRcdFx0Y29tbWVudDogQXV0b2xpbmtlci5VdGlsLnRyaW0oIGNvbW1lbnRUZXh0IClcblx0XHR9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgRWxlbWVudE5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnVGV4dCBUaGUgZnVsbCB0ZXh0IG9mIHRoZSB0YWcgKGVsZW1lbnQpIHRoYXQgd2FzXG5cdCAqICAgbWF0Y2hlZCwgaW5jbHVkaW5nIGl0cyBhdHRyaWJ1dGVzLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgdGFnLiBFeDogQW4gJmx0O2ltZyZndDsgdGFnIHdvdWxkXG5cdCAqICAgYmUgcGFzc2VkIHRvIHRoaXMgbWV0aG9kIGFzIFwiaW1nXCIuXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNDbG9zaW5nVGFnIGB0cnVlYCBpZiBpdCdzIGEgY2xvc2luZyB0YWcsIGZhbHNlXG5cdCAqICAgb3RoZXJ3aXNlLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGV9XG5cdCAqL1xuXHRjcmVhdGVFbGVtZW50Tm9kZSA6IGZ1bmN0aW9uKCB0YWdUZXh0LCB0YWdOYW1lLCBpc0Nsb3NpbmdUYWcgKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUoIHtcblx0XHRcdHRleHQgICAgOiB0YWdUZXh0LFxuXHRcdFx0dGFnTmFtZSA6IHRhZ05hbWUudG9Mb3dlckNhc2UoKSxcblx0XHRcdGNsb3NpbmcgOiBpc0Nsb3NpbmdUYWdcblx0XHR9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlIEVudGl0eU5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0aGF0IHdhcyBtYXRjaGVkIGZvciB0aGUgSFRNTCBlbnRpdHkgKHN1Y2hcblx0ICogICBhcyAnJmFtcDtuYnNwOycpLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZX1cblx0ICovXG5cdGNyZWF0ZUVudGl0eU5vZGUgOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHRyZXR1cm4gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlKCB7IHRleHQ6IHRleHQgfSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgVGV4dE5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGV9XG5cdCAqL1xuXHRjcmVhdGVUZXh0Tm9kZSA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHJldHVybiBuZXcgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlKCB7IHRleHQ6IHRleHQgfSApO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGFic3RyYWN0XG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhbiBIVE1MIG5vZGUgZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nLiBBbiBIVE1MIG5vZGUgaXMgb25lIG9mIHRoZVxuICogZm9sbG93aW5nOlxuICpcbiAqIDEuIEFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgRWxlbWVudE5vZGV9LCB3aGljaCByZXByZXNlbnRzXG4gKiAgICBIVE1MIHRhZ3MuXG4gKiAyLiBBIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGUgQ29tbWVudE5vZGV9LCB3aGljaCByZXByZXNlbnRzXG4gKiAgICBIVE1MIGNvbW1lbnRzLlxuICogMy4gQSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2RlfSwgd2hpY2ggcmVwcmVzZW50cyB0ZXh0XG4gKiAgICBvdXRzaWRlIG9yIHdpdGhpbiBIVE1MIHRhZ3MuXG4gKiA0LiBBIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2RlfSwgd2hpY2ggcmVwcmVzZW50c1xuICogICAgb25lIG9mIHRoZSBrbm93biBIVE1MIGVudGl0aWVzIHRoYXQgQXV0b2xpbmtlciBsb29rcyBmb3IuIFRoaXMgaW5jbHVkZXNcbiAqICAgIGNvbW1vbiBvbmVzIHN1Y2ggYXMgJmFtcDtxdW90OyBhbmQgJmFtcDtuYnNwO1xuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0ZXh0IChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIG9yaWdpbmFsIHRleHQgdGhhdCB3YXMgbWF0Y2hlZCBmb3IgdGhlIEh0bWxOb2RlLlxuXHQgKlxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgRWxlbWVudE5vZGV9LFxuXHQgKiAgIHRoaXMgd2lsbCBiZSB0aGUgdGFnJ3MgdGV4dC5cblx0ICogLSBJbiB0aGUgY2FzZSBvZiBhbiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlIENvbW1lbnROb2RlfSxcblx0ICogICB0aGlzIHdpbGwgYmUgdGhlIGNvbW1lbnQncyB0ZXh0LlxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSBUZXh0Tm9kZX0sIHRoaXNcblx0ICogICB3aWxsIGJlIHRoZSB0ZXh0IGl0c2VsZi5cblx0ICogLSBJbiB0aGUgY2FzZSBvZiBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2RlfSxcblx0ICogICB0aGlzIHdpbGwgYmUgdGhlIHRleHQgb2YgdGhlIEhUTUwgZW50aXR5LlxuXHQgKi9cblx0dGV4dCA6IFwiXCIsXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjZmcgVGhlIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcyBmb3IgdGhlIE1hdGNoIGluc3RhbmNlLFxuXHQgKiBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQGFic3RyYWN0XG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBBdXRvbGlua2VyLlV0aWwuYWJzdHJhY3RNZXRob2QsXG5cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSB7QGxpbmsgI3RleHR9IGZvciB0aGUgSHRtbE5vZGUuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy50ZXh0O1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhbiBIVE1MIGNvbW1lbnQgbm9kZSB0aGF0IGhhcyBiZWVuIHBhcnNlZCBieSB0aGVcbiAqIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGNvbW1lbnQgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgdGV4dCBpbnNpZGUgdGhlIGNvbW1lbnQgdGFnLiBUaGlzIHRleHQgaXMgc3RyaXBwZWQgb2YgYW55IGxlYWRpbmcgb3Jcblx0ICogdHJhaWxpbmcgd2hpdGVzcGFjZS5cblx0ICovXG5cdGNvbW1lbnQgOiAnJyxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2NvbW1lbnQnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGNvbW1lbnQgaW5zaWRlIHRoZSBjb21tZW50IHRhZy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0Q29tbWVudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmNvbW1lbnQ7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqXG4gKiBSZXByZXNlbnRzIGFuIEhUTUwgZWxlbWVudCBub2RlIHRoYXQgaGFzIGJlZW4gcGFyc2VkIGJ5IHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9LlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZX0pIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0YWdOYW1lIChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIG5hbWUgb2YgdGhlIHRhZyB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0dGFnTmFtZSA6ICcnLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBjbG9zaW5nIChyZXF1aXJlZClcblx0ICpcblx0ICogYHRydWVgIGlmIHRoZSBlbGVtZW50ICh0YWcpIGlzIGEgY2xvc2luZyB0YWcsIGBmYWxzZWAgaWYgaXRzIGFuIG9wZW5pbmdcblx0ICogdGFnLlxuXHQgKi9cblx0Y2xvc2luZyA6IGZhbHNlLFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZWxlbWVudCc7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgSFRNTCBlbGVtZW50J3MgKHRhZydzKSBuYW1lLiBFeDogZm9yIGFuICZsdDtpbWcmZ3Q7IHRhZyxcblx0ICogcmV0dXJucyBcImltZ1wiLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUYWdOYW1lIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMudGFnTmFtZTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIHRoZSBIVE1MIGVsZW1lbnQgKHRhZykgaXMgYSBjbG9zaW5nIHRhZy4gRXg6ICZsdDtkaXYmZ3Q7XG5cdCAqIHJldHVybnMgYGZhbHNlYCwgd2hpbGUgJmx0Oy9kaXYmZ3Q7IHJldHVybnMgYHRydWVgLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHQgKi9cblx0aXNDbG9zaW5nIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2xvc2luZztcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhIGtub3duIEhUTUwgZW50aXR5IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKiBFeDogJyZhbXA7bmJzcDsnLCBvciAnJmFtcCMxNjA7JyAod2hpY2ggd2lsbCBiZSByZXRyaWV2YWJsZSBmcm9tIHRoZSB7QGxpbmsgI2dldFRleHR9XG4gKiBtZXRob2QuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgY2xhc3Mgd2lsbCBvbmx5IGJlIHJldHVybmVkIGZyb20gdGhlIEh0bWxQYXJzZXIgZm9yIHRoZSBzZXQgb2ZcbiAqIGNoZWNrZWQgSFRNTCBlbnRpdHkgbm9kZXMgIGRlZmluZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlciNodG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleH0uXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlLCB7XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZW50aXR5Jztcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGVcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVxuICpcbiAqIFJlcHJlc2VudHMgYSB0ZXh0IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSwge1xuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3RleHQnO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQHByaXZhdGVcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBVc2VkIGJ5IEF1dG9saW5rZXIgdG8gcGFyc2UgcG90ZW50aWFsIG1hdGNoZXMsIGdpdmVuIGFuIGlucHV0IHN0cmluZyBvZiB0ZXh0LlxuICpcbiAqIFRoZSBNYXRjaFBhcnNlciBpcyBmZWQgYSBub24tSFRNTCBzdHJpbmcgaW4gb3JkZXIgdG8gc2VhcmNoIGZvciBtYXRjaGVzLlxuICogQXV0b2xpbmtlciBmaXJzdCB1c2VzIHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9IHRvIFwid2Fsa1xuICogYXJvdW5kXCIgSFRNTCB0YWdzLCBhbmQgdGhlbiB0aGUgdGV4dCBhcm91bmQgdGhlIEhUTUwgdGFncyBpcyBwYXNzZWQgaW50byB0aGVcbiAqIE1hdGNoUGFyc2VyIGluIG9yZGVyIHRvIGZpbmQgdGhlIGFjdHVhbCBtYXRjaGVzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHVybHNcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciN1cmxzXG5cdCAqL1xuXHR1cmxzIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gZW1haWxcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNlbWFpbFxuXHQgKi9cblx0ZW1haWwgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSB0d2l0dGVyXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjdHdpdHRlclxuXHQgKi9cblx0dHdpdHRlciA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHBob25lXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjcGhvbmVcblx0ICovXG5cdHBob25lOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFuL1N0cmluZ30gaGFzaHRhZ1xuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI2hhc2h0YWdcblx0ICovXG5cdGhhc2h0YWcgOiBmYWxzZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gc3RyaXBQcmVmaXhcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNzdHJpcFByZWZpeFxuXHQgKi9cblx0c3RyaXBQcmVmaXggOiB0cnVlLFxuXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBtYXRjaGVyUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IG1hdGNoZXMgVVJMcywgZW1haWwgYWRkcmVzc2VzLCBwaG9uZSAjcyxcblx0ICogVHdpdHRlciBoYW5kbGVzLCBhbmQgSGFzaHRhZ3MuXG5cdCAqXG5cdCAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIGhhcyB0aGUgZm9sbG93aW5nIGNhcHR1cmluZyBncm91cHM6XG5cdCAqXG5cdCAqIDEuICBHcm91cCB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZXJlIGlzIGEgVHdpdHRlciBoYW5kbGUgbWF0Y2hcblx0ICogICAgIChpLmUuIFxcQHNvbWVUd2l0dGVyVXNlcikuIFNpbXBseSBjaGVjayBmb3IgaXRzIGV4aXN0ZW5jZSB0byBkZXRlcm1pbmVcblx0ICogICAgIGlmIHRoZXJlIGlzIGEgVHdpdHRlciBoYW5kbGUgbWF0Y2guIFRoZSBuZXh0IGNvdXBsZSBvZiBjYXB0dXJpbmdcblx0ICogICAgIGdyb3VwcyBnaXZlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBUd2l0dGVyIGhhbmRsZSBtYXRjaC5cblx0ICogMi4gIFRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlIFxcQHNpZ24gaW4gYSBUd2l0dGVyIGhhbmRsZS4gVGhpc1xuXHQgKiAgICAgaXMgbmVlZGVkIGJlY2F1c2UgdGhlcmUgYXJlIG5vIGxvb2tiZWhpbmRzIGluIEpTIHJlZ3VsYXIgZXhwcmVzc2lvbnMsXG5cdCAqICAgICBhbmQgY2FuIGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhIHJlcGxhY2UoKS5cblx0ICogMy4gIFRoZSBUd2l0dGVyIGhhbmRsZSBpdHNlbGYgaW4gYSBUd2l0dGVyIG1hdGNoLiBJZiB0aGUgbWF0Y2ggaXNcblx0ICogICAgICdAc29tZVR3aXR0ZXJVc2VyJywgdGhlIGhhbmRsZSBpcyAnc29tZVR3aXR0ZXJVc2VyJy5cblx0ICogNC4gIEdyb3VwIHRoYXQgbWF0Y2hlcyBhbiBlbWFpbCBhZGRyZXNzLiBVc2VkIHRvIGRldGVybWluZSBpZiB0aGUgbWF0Y2hcblx0ICogICAgIGlzIGFuIGVtYWlsIGFkZHJlc3MsIGFzIHdlbGwgYXMgaG9sZGluZyB0aGUgZnVsbCBhZGRyZXNzLiBFeDpcblx0ICogICAgICdtZUBteS5jb20nXG5cdCAqIDUuICBHcm91cCB0aGF0IG1hdGNoZXMgYSBVUkwgaW4gdGhlIGlucHV0IHRleHQuIEV4OiAnaHR0cDovL2dvb2dsZS5jb20nLFxuXHQgKiAgICAgJ3d3dy5nb29nbGUuY29tJywgb3IganVzdCAnZ29vZ2xlLmNvbScuIFRoaXMgYWxzbyBpbmNsdWRlcyBhIHBhdGgsXG5cdCAqICAgICB1cmwgcGFyYW1ldGVycywgb3IgaGFzaCBhbmNob3JzLiBFeDogZ29vZ2xlLmNvbS9wYXRoL3RvL2ZpbGU/cTE9MSZxMj0yI215QW5jaG9yXG5cdCAqIDYuICBHcm91cCB0aGF0IG1hdGNoZXMgYSBwcm90b2NvbCBVUkwgKGkuZS4gJ2h0dHA6Ly9nb29nbGUuY29tJykuIFRoaXMgaXNcblx0ICogICAgIHVzZWQgdG8gbWF0Y2ggcHJvdG9jb2wgVVJMcyB3aXRoIGp1c3QgYSBzaW5nbGUgd29yZCwgbGlrZSAnaHR0cDovL2xvY2FsaG9zdCcsXG5cdCAqICAgICB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWUgaGFzIGF0IGxlYXN0IG9uZSAnLidcblx0ICogICAgIGluIGl0LlxuXHQgKiA3LiAgQSBwcm90b2NvbC1yZWxhdGl2ZSAoJy8vJykgbWF0Y2ggZm9yIHRoZSBjYXNlIG9mIGEgJ3d3dy4nIHByZWZpeGVkXG5cdCAqICAgICBVUkwuIFdpbGwgYmUgYW4gZW1wdHkgc3RyaW5nIGlmIGl0IGlzIG5vdCBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLlxuXHQgKiAgICAgV2UgbmVlZCB0byBrbm93IHRoZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnLy8nIGluIG9yZGVyIHRvIGRldGVybWluZVxuXHQgKiAgICAgaWYgaXQgaXMgYSB2YWxpZCBtYXRjaCBvciB0aGUgLy8gd2FzIGluIGEgc3RyaW5nIHdlIGRvbid0IHdhbnQgdG9cblx0ICogICAgIGF1dG8tbGluay5cblx0ICogOC4gIEEgcHJvdG9jb2wtcmVsYXRpdmUgKCcvLycpIG1hdGNoIGZvciB0aGUgY2FzZSBvZiBhIGtub3duIFRMRCBwcmVmaXhlZFxuXHQgKiAgICAgVVJMLiBXaWxsIGJlIGFuIGVtcHR5IHN0cmluZyBpZiBpdCBpcyBub3QgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaC5cblx0ICogICAgIFNlZSAjNiBmb3IgbW9yZSBpbmZvLlxuXHQgKiA5LiAgR3JvdXAgdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSBpZiB0aGVyZSBpcyBhIHBob25lIG51bWJlciBtYXRjaC4gVGhlXG5cdCAqICAgICBuZXh0IDMgZ3JvdXBzIGdpdmUgc2VnbWVudHMgb2YgdGhlIHBob25lIG51bWJlci5cblx0ICogMTAuIEdyb3VwIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlcmUgaXMgYSBIYXNodGFnIG1hdGNoXG5cdCAqICAgICAoaS5lLiBcXCNzb21lSGFzaHRhZykuIFNpbXBseSBjaGVjayBmb3IgaXRzIGV4aXN0ZW5jZSB0byBkZXRlcm1pbmUgaWZcblx0ICogICAgIHRoZXJlIGlzIGEgSGFzaHRhZyBtYXRjaC4gVGhlIG5leHQgY291cGxlIG9mIGNhcHR1cmluZyBncm91cHMgZ2l2ZVxuXHQgKiAgICAgaW5mb3JtYXRpb24gYWJvdXQgdGhlIEhhc2h0YWcgbWF0Y2guXG5cdCAqIDExLiBUaGUgd2hpdGVzcGFjZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAjc2lnbiBpbiBhIEhhc2h0YWcgaGFuZGxlLiBUaGlzXG5cdCAqICAgICBpcyBuZWVkZWQgYmVjYXVzZSB0aGVyZSBhcmUgbm8gbG9vay1iZWhpbmRzIGluIEpTIHJlZ3VsYXJcblx0ICogICAgIGV4cHJlc3Npb25zLCBhbmQgY2FuIGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhXG5cdCAqICAgICByZXBsYWNlKCkuXG5cdCAqIDEyLiBUaGUgSGFzaHRhZyBpdHNlbGYgaW4gYSBIYXNodGFnIG1hdGNoLiBJZiB0aGUgbWF0Y2ggaXNcblx0ICogICAgICcjc29tZUhhc2h0YWcnLCB0aGUgaGFzaHRhZyBpcyAnc29tZUhhc2h0YWcnLlxuXHQgKi9cblx0bWF0Y2hlclJlZ2V4IDogKGZ1bmN0aW9uKCkge1xuXHRcdHZhciB0d2l0dGVyUmVnZXggPSAvKF58W15cXHddKUAoXFx3ezEsMTV9KS8sICAgICAgICAgICAgICAvLyBGb3IgbWF0Y2hpbmcgYSB0d2l0dGVyIGhhbmRsZS4gRXg6IEBncmVnb3J5X2phY29ic1xuXG5cdFx0ICAgIGhhc2h0YWdSZWdleCA9IC8oXnxbXlxcd10pIyhcXHd7MSwxMzl9KS8sICAgICAgICAgICAgICAvLyBGb3IgbWF0Y2hpbmcgYSBIYXNodGFnLiBFeDogI2dhbWVzXG5cblx0XHQgICAgZW1haWxSZWdleCA9IC8oPzpbXFwtOzomPVxcK1xcJCxcXHdcXC5dK0ApLywgICAgICAgICAgICAgLy8gc29tZXRoaW5nQCBmb3IgZW1haWwgYWRkcmVzc2VzIChhLmsuYS4gbG9jYWwtcGFydClcblx0XHQgICAgcGhvbmVSZWdleCA9IC8oPzpcXCs/XFxkezEsM31bLVxccy5dKT9cXCg/XFxkezN9XFwpP1stXFxzLl0/XFxkezN9Wy1cXHMuXVxcZHs0fS8sICAvLyBleDogKDEyMykgNDU2LTc4OTAsIDEyMyA0NTYgNzg5MCwgMTIzLTQ1Ni03ODkwLCBldGMuXG5cdFx0ICAgIHByb3RvY29sUmVnZXggPSAvKD86W0EtWmEtel1bLS4rQS1aYS16MC05XSo6KD8hW0EtWmEtel1bLS4rQS1aYS16MC05XSo6XFwvXFwvKSg/IVxcZCtcXC8/KSg/OlxcL1xcLyk/KS8sICAvLyBtYXRjaCBwcm90b2NvbCwgYWxsb3cgaW4gZm9ybWF0IFwiaHR0cDovL1wiIG9yIFwibWFpbHRvOlwiLiBIb3dldmVyLCBkbyBub3QgbWF0Y2ggdGhlIGZpcnN0IHBhcnQgb2Ygc29tZXRoaW5nIGxpa2UgJ2xpbms6aHR0cDovL3d3dy5nb29nbGUuY29tJyAoaS5lLiBkb24ndCBtYXRjaCBcImxpbms6XCIpLiBBbHNvLCBtYWtlIHN1cmUgd2UgZG9uJ3QgaW50ZXJwcmV0ICdnb29nbGUuY29tOjgwMDAnIGFzIGlmICdnb29nbGUuY29tJyB3YXMgYSBwcm90b2NvbCBoZXJlIChpLmUuIGlnbm9yZSBhIHRyYWlsaW5nIHBvcnQgbnVtYmVyIGluIHRoaXMgcmVnZXgpXG5cdFx0ICAgIHd3d1JlZ2V4ID0gLyg/Ond3d1xcLikvLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RhcnRpbmcgd2l0aCAnd3d3Lidcblx0XHQgICAgZG9tYWluTmFtZVJlZ2V4ID0gL1tBLVphLXowLTlcXC5cXC1dKltBLVphLXowLTlcXC1dLywgIC8vIGFueXRoaW5nIGxvb2tpbmcgYXQgYWxsIGxpa2UgYSBkb21haW4sIG5vbi11bmljb2RlIGRvbWFpbnMsIG5vdCBlbmRpbmcgaW4gYSBwZXJpb2Rcblx0XHQgICAgdGxkUmVnZXggPSAvXFwuKD86aW50ZXJuYXRpb25hbHxjb25zdHJ1Y3Rpb258Y29udHJhY3RvcnN8ZW50ZXJwcmlzZXN8cGhvdG9ncmFwaHl8cHJvZHVjdGlvbnN8Zm91bmRhdGlvbnxpbW1vYmlsaWVufGluZHVzdHJpZXN8bWFuYWdlbWVudHxwcm9wZXJ0aWVzfHRlY2hub2xvZ3l8Y2hyaXN0bWFzfGNvbW11bml0eXxkaXJlY3Rvcnl8ZWR1Y2F0aW9ufGVxdWlwbWVudHxpbnN0aXR1dGV8bWFya2V0aW5nfHNvbHV0aW9uc3x2YWNhdGlvbnN8YmFyZ2FpbnN8Ym91dGlxdWV8YnVpbGRlcnN8Y2F0ZXJpbmd8Y2xlYW5pbmd8Y2xvdGhpbmd8Y29tcHV0ZXJ8ZGVtb2NyYXR8ZGlhbW9uZHN8Z3JhcGhpY3N8aG9sZGluZ3N8bGlnaHRpbmd8cGFydG5lcnN8cGx1bWJpbmd8c3VwcGxpZXN8dHJhaW5pbmd8dmVudHVyZXN8YWNhZGVteXxjYXJlZXJzfGNvbXBhbnl8Y3J1aXNlc3xkb21haW5zfGV4cG9zZWR8ZmxpZ2h0c3xmbG9yaXN0fGdhbGxlcnl8Z3VpdGFyc3xob2xpZGF5fGtpdGNoZW58bmV1c3Rhcnxva2luYXdhfHJlY2lwZXN8cmVudGFsc3xyZXZpZXdzfHNoaWtzaGF8c2luZ2xlc3xzdXBwb3J0fHN5c3RlbXN8YWdlbmN5fGJlcmxpbnxjYW1lcmF8Y2VudGVyfGNvZmZlZXxjb25kb3N8ZGF0aW5nfGVzdGF0ZXxldmVudHN8ZXhwZXJ0fGZ1dGJvbHxrYXVmZW58bHV4dXJ5fG1haXNvbnxtb25hc2h8bXVzZXVtfG5hZ295YXxwaG90b3N8cmVwYWlyfHJlcG9ydHxzb2NpYWx8c3VwcGx5fHRhdHRvb3x0aWVuZGF8dHJhdmVsfHZpYWplc3x2aWxsYXN8dmlzaW9ufHZvdGluZ3x2b3lhZ2V8YWN0b3J8YnVpbGR8Y2FyZHN8Y2hlYXB8Y29kZXN8ZGFuY2V8ZW1haWx8Z2xhc3N8aG91c2V8bWFuZ298bmluamF8cGFydHN8cGhvdG98cHJlc3N8c2hvZXN8c29sYXJ8dG9kYXl8dG9reW98dG9vbHN8d2F0Y2h8d29ya3N8YWVyb3xhcnBhfGFzaWF8YmVzdHxiaWtlfGJsdWV8YnV6enxjYW1wfGNsdWJ8Y29vbHxjb29wfGZhcm18ZmlzaHxnaWZ0fGd1cnV8aW5mb3xqb2JzfGtpd2l8a3JlZHxsYW5kfGxpbW98bGlua3xtZW51fG1vYml8bW9kYXxuYW1lfHBpY3N8cGlua3xwb3N0fHFwb258cmljaHxydWhyfHNleHl8dGlwc3x2b3RlfHZvdG98d2FuZ3x3aWVufHdpa2l8em9uZXxiYXJ8YmlkfGJpenxjYWJ8Y2F0fGNlb3xjb218ZWR1fGdvdnxpbnR8a2ltfG1pbHxuZXR8b25sfG9yZ3xwcm98cHVifHJlZHx0ZWx8dW5vfHdlZHx4eHh8eHl6fGFjfGFkfGFlfGFmfGFnfGFpfGFsfGFtfGFufGFvfGFxfGFyfGFzfGF0fGF1fGF3fGF4fGF6fGJhfGJifGJkfGJlfGJmfGJnfGJofGJpfGJqfGJtfGJufGJvfGJyfGJzfGJ0fGJ2fGJ3fGJ5fGJ6fGNhfGNjfGNkfGNmfGNnfGNofGNpfGNrfGNsfGNtfGNufGNvfGNyfGN1fGN2fGN3fGN4fGN5fGN6fGRlfGRqfGRrfGRtfGRvfGR6fGVjfGVlfGVnfGVyfGVzfGV0fGV1fGZpfGZqfGZrfGZtfGZvfGZyfGdhfGdifGdkfGdlfGdmfGdnfGdofGdpfGdsfGdtfGdufGdwfGdxfGdyfGdzfGd0fGd1fGd3fGd5fGhrfGhtfGhufGhyfGh0fGh1fGlkfGllfGlsfGltfGlufGlvfGlxfGlyfGlzfGl0fGplfGptfGpvfGpwfGtlfGtnfGtofGtpfGttfGtufGtwfGtyfGt3fGt5fGt6fGxhfGxifGxjfGxpfGxrfGxyfGxzfGx0fGx1fGx2fGx5fG1hfG1jfG1kfG1lfG1nfG1ofG1rfG1sfG1tfG1ufG1vfG1wfG1xfG1yfG1zfG10fG11fG12fG13fG14fG15fG16fG5hfG5jfG5lfG5mfG5nfG5pfG5sfG5vfG5wfG5yfG51fG56fG9tfHBhfHBlfHBmfHBnfHBofHBrfHBsfHBtfHBufHByfHBzfHB0fHB3fHB5fHFhfHJlfHJvfHJzfHJ1fHJ3fHNhfHNifHNjfHNkfHNlfHNnfHNofHNpfHNqfHNrfHNsfHNtfHNufHNvfHNyfHN0fHN1fHN2fHN4fHN5fHN6fHRjfHRkfHRmfHRnfHRofHRqfHRrfHRsfHRtfHRufHRvfHRwfHRyfHR0fHR2fHR3fHR6fHVhfHVnfHVrfHVzfHV5fHV6fHZhfHZjfHZlfHZnfHZpfHZufHZ1fHdmfHdzfHllfHl0fHphfHptfHp3KVxcYi8sICAgLy8gbWF0Y2ggb3VyIGtub3duIHRvcCBsZXZlbCBkb21haW5zIChUTERzKVxuXG5cdFx0ICAgIC8vIEFsbG93IG9wdGlvbmFsIHBhdGgsIHF1ZXJ5IHN0cmluZywgYW5kIGhhc2ggYW5jaG9yLCBub3QgZW5kaW5nIGluIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVyczogXCI/ITosLjtcIlxuXHRcdCAgICAvLyBodHRwOi8vYmxvZy5jb2Rpbmdob3Jyb3IuY29tL3RoZS1wcm9ibGVtLXdpdGgtdXJscy9cblx0XHQgICAgdXJsU3VmZml4UmVnZXggPSAvW1xcLUEtWmEtejAtOSsmQCNcXC8lPX5fKCl8JyQqXFxbXFxdPyE6LC47XSpbXFwtQS1aYS16MC05KyZAI1xcLyU9fl8oKXwnJCpcXFtcXF1dLztcblxuXHRcdHJldHVybiBuZXcgUmVnRXhwKCBbXG5cdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxLCB3aGljaCBjYW4gYmUgdXNlZCB0byBjaGVjayBmb3IgYSB0d2l0dGVyIGhhbmRsZSBtYXRjaC4gVXNlIGdyb3VwICQzIGZvciB0aGUgYWN0dWFsIHR3aXR0ZXIgaGFuZGxlIHRob3VnaC4gJDIgbWF5IGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhIHJlcGxhY2UoKVxuXHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQyLCB3aGljaCBtYXRjaGVzIHRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlICdAJyBzaWduIChuZWVkZWQgYmVjYXVzZSBvZiBubyBsb29rYmVoaW5kcyksIGFuZFxuXHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQzLCB3aGljaCBtYXRjaGVzIHRoZSBhY3R1YWwgdHdpdHRlciBoYW5kbGVcblx0XHRcdFx0dHdpdHRlclJlZ2V4LnNvdXJjZSxcblx0XHRcdCcpJyxcblxuXHRcdFx0J3wnLFxuXG5cdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ0LCB3aGljaCBpcyB1c2VkIHRvIGRldGVybWluZSBhbiBlbWFpbCBtYXRjaFxuXHRcdFx0XHRlbWFpbFJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0ZG9tYWluTmFtZVJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0dGxkUmVnZXguc291cmNlLFxuXHRcdFx0JyknLFxuXG5cdFx0XHQnfCcsXG5cblx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDUsIHdoaWNoIGlzIHVzZWQgdG8gbWF0Y2ggYSBVUkxcblx0XHRcdFx0Jyg/OicsIC8vIHBhcmVucyB0byBjb3ZlciBtYXRjaCBmb3IgcHJvdG9jb2wgKG9wdGlvbmFsKSwgYW5kIGRvbWFpblxuXHRcdFx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDYsIGZvciBhIHByb3RvY29sLXByZWZpeGVkIHVybCAoZXg6IGh0dHA6Ly9nb29nbGUuY29tKVxuXHRcdFx0XHRcdFx0cHJvdG9jb2xSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdCcpJyxcblxuXHRcdFx0XHRcdCd8JyxcblxuXHRcdFx0XHRcdCcoPzonLCAgLy8gbm9uLWNhcHR1cmluZyBwYXJlbiBmb3IgYSAnd3d3LicgcHJlZml4ZWQgdXJsIChleDogd3d3Lmdvb2dsZS5jb20pXG5cdFx0XHRcdFx0XHQnKC4/Ly8pPycsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ3IGZvciBhbiBvcHRpb25hbCBwcm90b2NvbC1yZWxhdGl2ZSBVUkwuIE11c3QgYmUgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nIG9yIHN0YXJ0IHdpdGggYSBub24td29yZCBjaGFyYWN0ZXJcblx0XHRcdFx0XHRcdHd3d1JlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHRcdGRvbWFpbk5hbWVSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0JyknLFxuXG5cdFx0XHRcdFx0J3wnLFxuXG5cdFx0XHRcdFx0Jyg/OicsICAvLyBub24tY2FwdHVyaW5nIHBhcmVuIGZvciBrbm93biBhIFRMRCB1cmwgKGV4OiBnb29nbGUuY29tKVxuXHRcdFx0XHRcdFx0JyguPy8vKT8nLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkOCBmb3IgYW4gb3B0aW9uYWwgcHJvdG9jb2wtcmVsYXRpdmUgVVJMLiBNdXN0IGJlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZyBvciBzdGFydCB3aXRoIGEgbm9uLXdvcmQgY2hhcmFjdGVyXG5cdFx0XHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdFx0dGxkUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdCcpJyxcblx0XHRcdFx0JyknLFxuXG5cdFx0XHRcdCcoPzonICsgdXJsU3VmZml4UmVnZXguc291cmNlICsgJyk/JywgIC8vIG1hdGNoIGZvciBwYXRoLCBxdWVyeSBzdHJpbmcsIGFuZC9vciBoYXNoIGFuY2hvciAtIG9wdGlvbmFsXG5cdFx0XHQnKScsXG5cblx0XHRcdCd8JyxcblxuXHRcdFx0Ly8gdGhpcyBzZXR1cCBkb2VzIG5vdCBzY2FsZSB3ZWxsIGZvciBvcGVuIGV4dGVuc2lvbiA6KCBOZWVkIHRvIHJldGhpbmsgZGVzaWduIG9mIGF1dG9saW5rZXIuLi5cblx0XHRcdC8vICoqKiAgQ2FwdHVyaW5nIGdyb3VwICQ5LCB3aGljaCBtYXRjaGVzIGEgKFVTQSBmb3Igbm93KSBwaG9uZSBudW1iZXJcblx0XHRcdCcoJyxcblx0XHRcdFx0cGhvbmVSZWdleC5zb3VyY2UsXG5cdFx0XHQnKScsXG5cblx0XHRcdCd8JyxcblxuXHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkMTAsIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGNoZWNrIGZvciBhIEhhc2h0YWcgbWF0Y2guIFVzZSBncm91cCAkMTIgZm9yIHRoZSBhY3R1YWwgSGFzaHRhZyB0aG91Z2guICQxMSBtYXkgYmUgdXNlZCB0byByZWNvbnN0cnVjdCB0aGUgb3JpZ2luYWwgc3RyaW5nIGluIGEgcmVwbGFjZSgpXG5cdFx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDExLCB3aGljaCBtYXRjaGVzIHRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlICcjJyBzaWduIChuZWVkZWQgYmVjYXVzZSBvZiBubyBsb29rYmVoaW5kcyksIGFuZFxuXHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxMiwgd2hpY2ggbWF0Y2hlcyB0aGUgYWN0dWFsIEhhc2h0YWdcblx0XHRcdFx0aGFzaHRhZ1JlZ2V4LnNvdXJjZSxcblx0XHRcdCcpJ1xuXHRcdF0uam9pbiggXCJcIiApLCAnZ2knICk7XG5cdH0gKSgpLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gY2hhckJlZm9yZVByb3RvY29sUmVsTWF0Y2hSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcmV0cmlldmUgdGhlIGNoYXJhY3RlciBiZWZvcmUgYVxuXHQgKiBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgbWF0Y2guXG5cdCAqXG5cdCAqIFRoaXMgaXMgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSB7QGxpbmsgI21hdGNoZXJSZWdleH0sIHdoaWNoIG5lZWRzXG5cdCAqIHRvIGdyYWIgdGhlIGNoYXJhY3RlciBiZWZvcmUgYSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIGR1ZSB0byB0aGUgbGFjayBvZlxuXHQgKiBhIG5lZ2F0aXZlIGxvb2stYmVoaW5kIGluIEphdmFTY3JpcHQgcmVndWxhciBleHByZXNzaW9ucy4gVGhlIGNoYXJhY3RlclxuXHQgKiBiZWZvcmUgdGhlIG1hdGNoIGlzIHN0cmlwcGVkIGZyb20gdGhlIFVSTC5cblx0ICovXG5cdGNoYXJCZWZvcmVQcm90b2NvbFJlbE1hdGNoUmVnZXggOiAvXiguKT9cXC9cXC8vLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3J9IG1hdGNoVmFsaWRhdG9yXG5cdCAqXG5cdCAqIFRoZSBNYXRjaFZhbGlkYXRvciBvYmplY3QsIHVzZWQgdG8gZmlsdGVyIG91dCBhbnkgZmFsc2UgcG9zaXRpdmVzIGZyb21cblx0ICogdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fS4gU2VlIHtAbGluayBBdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yfSBmb3IgZGV0YWlscy5cblx0ICovXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQW5jaG9yVGFnQnVpbGRlclxuXHQgKiBpbnN0YW5jZSwgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblxuXHRcdHRoaXMubWF0Y2hWYWxpZGF0b3IgPSBuZXcgQXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvcigpO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFBhcnNlcyB0aGUgaW5wdXQgYHRleHRgIHRvIHNlYXJjaCBmb3IgbWF0Y2hlcywgYW5kIGNhbGxzIHRoZSBgcmVwbGFjZUZuYFxuXHQgKiB0byBhbGxvdyByZXBsYWNlbWVudHMgb2YgdGhlIG1hdGNoZXMuIFJldHVybnMgdGhlIGB0ZXh0YCB3aXRoIG1hdGNoZXNcblx0ICogcmVwbGFjZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRvIHNlYXJjaCBhbmQgcmVwYWNlIG1hdGNoZXMgaW4uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHJlcGxhY2VGbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24gdG8gaGFuZGxlIHRoZVxuXHQgKiAgIHJlcGxhY2VtZW50cy4gVGhlIGZ1bmN0aW9uIHRha2VzIGEgc2luZ2xlIGFyZ3VtZW50LCBhIHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofVxuXHQgKiAgIG9iamVjdCwgYW5kIHNob3VsZCByZXR1cm4gdGhlIHRleHQgdGhhdCBzaG91bGQgbWFrZSB0aGUgcmVwbGFjZW1lbnQuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dE9iaj13aW5kb3ddIFRoZSBjb250ZXh0IG9iamVjdCAoXCJzY29wZVwiKSB0byBydW5cblx0ICogICB0aGUgYHJlcGxhY2VGbmAgaW4uXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdHJlcGxhY2UgOiBmdW5jdGlvbiggdGV4dCwgcmVwbGFjZUZuLCBjb250ZXh0T2JqICkge1xuXHRcdHZhciBtZSA9IHRoaXM7ICAvLyBmb3IgY2xvc3VyZVxuXG5cdFx0cmV0dXJuIHRleHQucmVwbGFjZSggdGhpcy5tYXRjaGVyUmVnZXgsIGZ1bmN0aW9uKCBtYXRjaFN0ciwgJDEsICQyLCAkMywgJDQsICQ1LCAkNiwgJDcsICQ4LCAkOSwgJDEwLCAkMTEsICQxMiApIHtcblx0XHRcdHZhciBtYXRjaERlc2NPYmogPSBtZS5wcm9jZXNzQ2FuZGlkYXRlTWF0Y2goIG1hdGNoU3RyLCAkMSwgJDIsICQzLCAkNCwgJDUsICQ2LCAkNywgJDgsICQ5LCAkMTAsICQxMSwgJDEyICk7ICAvLyBcIm1hdGNoIGRlc2NyaXB0aW9uXCIgb2JqZWN0XG5cblx0XHRcdC8vIFJldHVybiBvdXQgd2l0aCBubyBjaGFuZ2VzIGZvciBtYXRjaCB0eXBlcyB0aGF0IGFyZSBkaXNhYmxlZCAodXJsLFxuXHRcdFx0Ly8gZW1haWwsIHBob25lLCBldGMuKSwgb3IgZm9yIG1hdGNoZXMgdGhhdCBhcmUgaW52YWxpZCAoZmFsc2Vcblx0XHRcdC8vIHBvc2l0aXZlcyBmcm9tIHRoZSBtYXRjaGVyUmVnZXgsIHdoaWNoIGNhbid0IHVzZSBsb29rLWJlaGluZHNcblx0XHRcdC8vIHNpbmNlIHRoZXkgYXJlIHVuYXZhaWxhYmxlIGluIEpTKS5cblx0XHRcdGlmKCAhbWF0Y2hEZXNjT2JqICkge1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2hTdHI7XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEdlbmVyYXRlIHJlcGxhY2VtZW50IHRleHQgZm9yIHRoZSBtYXRjaCBmcm9tIHRoZSBgcmVwbGFjZUZuYFxuXHRcdFx0XHR2YXIgcmVwbGFjZVN0ciA9IHJlcGxhY2VGbi5jYWxsKCBjb250ZXh0T2JqLCBtYXRjaERlc2NPYmoubWF0Y2ggKTtcblx0XHRcdFx0cmV0dXJuIG1hdGNoRGVzY09iai5wcmVmaXhTdHIgKyByZXBsYWNlU3RyICsgbWF0Y2hEZXNjT2JqLnN1ZmZpeFN0cjtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUHJvY2Vzc2VzIGEgY2FuZGlkYXRlIG1hdGNoIGZyb20gdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fS5cblx0ICpcblx0ICogTm90IGFsbCBtYXRjaGVzIGZvdW5kIGJ5IHRoZSByZWdleCBhcmUgYWN0dWFsIFVSTC9FbWFpbC9QaG9uZS9Ud2l0dGVyL0hhc2h0YWdcblx0ICogbWF0Y2hlcywgYXMgZGV0ZXJtaW5lZCBieSB0aGUge0BsaW5rICNtYXRjaFZhbGlkYXRvcn0uIEluIHRoaXMgY2FzZSwgdGhlXG5cdCAqIG1ldGhvZCByZXR1cm5zIGBudWxsYC4gT3RoZXJ3aXNlLCBhIHZhbGlkIE9iamVjdCB3aXRoIGBwcmVmaXhTdHJgLFxuXHQgKiBgbWF0Y2hgLCBhbmQgYHN1ZmZpeFN0cmAgaXMgcmV0dXJuZWQuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBtYXRjaFN0ciBUaGUgZnVsbCBtYXRjaCB0aGF0IHdhcyBmb3VuZCBieSB0aGVcblx0ICogICB7QGxpbmsgI21hdGNoZXJSZWdleH0uXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVyTWF0Y2ggVGhlIG1hdGNoZWQgdGV4dCBvZiBhIFR3aXR0ZXIgaGFuZGxlLCBpZiB0aGVcblx0ICogICBtYXRjaCBpcyBhIFR3aXR0ZXIgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXIgVGhlIHdoaXRlc3BhY2UgY2hhclxuXHQgKiAgIGJlZm9yZSB0aGUgQCBzaWduIGluIGEgVHdpdHRlciBoYW5kbGUgbWF0Y2guIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugb2Zcblx0ICogICBubyBsb29rYmVoaW5kcyBpbiBKUyByZWdleGVzLCBhbmQgaXMgbmVlZCB0byByZS1pbmNsdWRlIHRoZSBjaGFyYWN0ZXJcblx0ICogICBmb3IgdGhlIGFuY2hvciB0YWcgcmVwbGFjZW1lbnQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVySGFuZGxlIFRoZSBhY3R1YWwgVHdpdHRlciB1c2VyIChpLmUgdGhlIHdvcmQgYWZ0ZXJcblx0ICogICB0aGUgQCBzaWduIGluIGEgVHdpdHRlciBtYXRjaCkuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbEFkZHJlc3NNYXRjaCBUaGUgbWF0Y2hlZCBlbWFpbCBhZGRyZXNzIGZvciBhbiBlbWFpbFxuXHQgKiAgIGFkZHJlc3MgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwgc3RyaW5nIGZvciBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoIHNvbWV0aGluZyBsaWtlXG5cdCAqICAgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWVcblx0ICogICBoYXMgYXQgbGVhc3Qgb25lICcuJyBpbiBpdC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHd3d1Byb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgJy8vJyBmb3IgYSBwcm90b2NvbC1yZWxhdGl2ZVxuXHQgKiAgIG1hdGNoIGZyb20gYSAnd3d3JyB1cmwsIHdpdGggdGhlIGNoYXJhY3RlciB0aGF0IGNvbWVzIGJlZm9yZSB0aGUgJy8vJy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHRsZFByb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgJy8vJyBmb3IgYSBwcm90b2NvbC1yZWxhdGl2ZVxuXHQgKiAgIG1hdGNoIGZyb20gYSBUTEQgKHRvcCBsZXZlbCBkb21haW4pIG1hdGNoLCB3aXRoIHRoZSBjaGFyYWN0ZXIgdGhhdFxuXHQgKiAgIGNvbWVzIGJlZm9yZSB0aGUgJy8vJy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHBob25lTWF0Y2ggVGhlIG1hdGNoZWQgdGV4dCBvZiBhIHBob25lIG51bWJlclxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaGFzaHRhZ01hdGNoIFRoZSBtYXRjaGVkIHRleHQgb2YgYSBUd2l0dGVyXG5cdCAqICAgSGFzaHRhZywgaWYgdGhlIG1hdGNoIGlzIGEgSGFzaHRhZyBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGhhc2h0YWdQcmVmaXhXaGl0ZXNwYWNlQ2hhciBUaGUgd2hpdGVzcGFjZSBjaGFyXG5cdCAqICAgYmVmb3JlIHRoZSAjIHNpZ24gaW4gYSBIYXNodGFnIG1hdGNoLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIG9mIG5vXG5cdCAqICAgbG9va2JlaGluZHMgaW4gSlMgcmVnZXhlcywgYW5kIGlzIG5lZWQgdG8gcmUtaW5jbHVkZSB0aGUgY2hhcmFjdGVyIGZvclxuXHQgKiAgIHRoZSBhbmNob3IgdGFnIHJlcGxhY2VtZW50LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaGFzaHRhZyBUaGUgYWN0dWFsIEhhc2h0YWcgKGkuZSB0aGUgd29yZFxuXHQgKiAgIGFmdGVyIHRoZSAjIHNpZ24gaW4gYSBIYXNodGFnIG1hdGNoKS5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBBIFwibWF0Y2ggZGVzY3JpcHRpb24gb2JqZWN0XCIuIFRoaXMgd2lsbCBiZSBgbnVsbGAgaWYgdGhlXG5cdCAqICAgbWF0Y2ggd2FzIGludmFsaWQsIG9yIGlmIGEgbWF0Y2ggdHlwZSBpcyBkaXNhYmxlZC4gT3RoZXJ3aXNlLCB0aGlzIHdpbGxcblx0ICogICBiZSBhbiBPYmplY3QgKG1hcCkgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG5cdCAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJuLnByZWZpeFN0ciBUaGUgY2hhcihzKSB0aGF0IHNob3VsZCBiZSBwcmVwZW5kZWQgdG9cblx0ICogICB0aGUgcmVwbGFjZW1lbnQgc3RyaW5nLiBUaGVzZSBhcmUgY2hhcihzKSB0aGF0IHdlcmUgbmVlZGVkIHRvIGJlXG5cdCAqICAgaW5jbHVkZWQgZnJvbSB0aGUgcmVnZXggbWF0Y2ggdGhhdCB3ZXJlIGlnbm9yZWQgYnkgcHJvY2Vzc2luZyBjb2RlLCBhbmRcblx0ICogICBzaG91bGQgYmUgcmUtaW5zZXJ0ZWQgaW50byB0aGUgcmVwbGFjZW1lbnQgc3RyZWFtLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybi5zdWZmaXhTdHIgVGhlIGNoYXIocykgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWQgdG9cblx0ICogICB0aGUgcmVwbGFjZW1lbnQgc3RyaW5nLiBUaGVzZSBhcmUgY2hhcihzKSB0aGF0IHdlcmUgbmVlZGVkIHRvIGJlXG5cdCAqICAgaW5jbHVkZWQgZnJvbSB0aGUgcmVnZXggbWF0Y2ggdGhhdCB3ZXJlIGlnbm9yZWQgYnkgcHJvY2Vzc2luZyBjb2RlLCBhbmRcblx0ICogICBzaG91bGQgYmUgcmUtaW5zZXJ0ZWQgaW50byB0aGUgcmVwbGFjZW1lbnQgc3RyZWFtLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSByZXR1cm4ubWF0Y2ggVGhlIE1hdGNoIG9iamVjdCB0aGF0XG5cdCAqICAgcmVwcmVzZW50cyB0aGUgbWF0Y2ggdGhhdCB3YXMgZm91bmQuXG5cdCAqL1xuXHRwcm9jZXNzQ2FuZGlkYXRlTWF0Y2ggOiBmdW5jdGlvbihcblx0XHRtYXRjaFN0ciwgdHdpdHRlck1hdGNoLCB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXIsIHR3aXR0ZXJIYW5kbGUsXG5cdFx0ZW1haWxBZGRyZXNzTWF0Y2gsIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoLCB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2gsXG5cdFx0dGxkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoLCBwaG9uZU1hdGNoLCBoYXNodGFnTWF0Y2gsXG5cdFx0aGFzaHRhZ1ByZWZpeFdoaXRlc3BhY2VDaGFyLCBoYXNodGFnXG5cdCkge1xuXHRcdC8vIE5vdGU6IFRoZSBgbWF0Y2hTdHJgIHZhcmlhYmxlIHdpbCBiZSBmaXhlZCB1cCB0byByZW1vdmUgY2hhcmFjdGVycyB0aGF0IGFyZSBubyBsb25nZXIgbmVlZGVkICh3aGljaCB3aWxsXG5cdFx0Ly8gYmUgYWRkZWQgdG8gYHByZWZpeFN0cmAgYW5kIGBzdWZmaXhTdHJgKS5cblxuXHRcdHZhciBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggPSB3d3dQcm90b2NvbFJlbGF0aXZlTWF0Y2ggfHwgdGxkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoLFxuXHRcdCAgICBtYXRjaCwgIC8vIFdpbGwgYmUgYW4gQXV0b2xpbmtlci5tYXRjaC5NYXRjaCBvYmplY3RcblxuXHRcdCAgICBwcmVmaXhTdHIgPSBcIlwiLCAgLy8gQSBzdHJpbmcgdG8gdXNlIHRvIHByZWZpeCB0aGUgYW5jaG9yIHRhZyB0aGF0IGlzIGNyZWF0ZWQuIFRoaXMgaXMgbmVlZGVkIGZvciB0aGUgVHdpdHRlciBhbmQgSGFzaHRhZyBtYXRjaGVzLlxuXHRcdCAgICBzdWZmaXhTdHIgPSBcIlwiOyAgLy8gQSBzdHJpbmcgdG8gc3VmZml4IHRoZSBhbmNob3IgdGFnIHRoYXQgaXMgY3JlYXRlZC4gVGhpcyBpcyB1c2VkIGlmIHRoZXJlIGlzIGEgdHJhaWxpbmcgcGFyZW50aGVzaXMgdGhhdCBzaG91bGQgbm90IGJlIGF1dG8tbGlua2VkLlxuXG5cdFx0Ly8gUmV0dXJuIG91dCB3aXRoIGBudWxsYCBmb3IgbWF0Y2ggdHlwZXMgdGhhdCBhcmUgZGlzYWJsZWQgKHVybCwgZW1haWwsXG5cdFx0Ly8gdHdpdHRlciwgaGFzaHRhZyksIG9yIGZvciBtYXRjaGVzIHRoYXQgYXJlIGludmFsaWQgKGZhbHNlIHBvc2l0aXZlc1xuXHRcdC8vIGZyb20gdGhlIG1hdGNoZXJSZWdleCwgd2hpY2ggY2FuJ3QgdXNlIGxvb2stYmVoaW5kcyBzaW5jZSB0aGV5IGFyZVxuXHRcdC8vIHVuYXZhaWxhYmxlIGluIEpTKS5cblx0XHRpZihcblx0XHRcdCggdXJsTWF0Y2ggJiYgIXRoaXMudXJscyApIHx8XG5cdFx0XHQoIGVtYWlsQWRkcmVzc01hdGNoICYmICF0aGlzLmVtYWlsICkgfHxcblx0XHRcdCggcGhvbmVNYXRjaCAmJiAhdGhpcy5waG9uZSApIHx8XG5cdFx0XHQoIHR3aXR0ZXJNYXRjaCAmJiAhdGhpcy50d2l0dGVyICkgfHxcblx0XHRcdCggaGFzaHRhZ01hdGNoICYmICF0aGlzLmhhc2h0YWcgKSB8fFxuXHRcdFx0IXRoaXMubWF0Y2hWYWxpZGF0b3IuaXNWYWxpZE1hdGNoKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCwgcHJvdG9jb2xSZWxhdGl2ZU1hdGNoIClcblx0XHQpIHtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblxuXHRcdC8vIEhhbmRsZSBhIGNsb3NpbmcgcGFyZW50aGVzaXMgYXQgdGhlIGVuZCBvZiB0aGUgbWF0Y2gsIGFuZCBleGNsdWRlIGl0XG5cdFx0Ly8gaWYgdGhlcmUgaXMgbm90IGEgbWF0Y2hpbmcgb3BlbiBwYXJlbnRoZXNpc1xuXHRcdC8vIGluIHRoZSBtYXRjaCBpdHNlbGYuXG5cdFx0aWYoIHRoaXMubWF0Y2hIYXNVbmJhbGFuY2VkQ2xvc2luZ1BhcmVuKCBtYXRjaFN0ciApICkge1xuXHRcdFx0bWF0Y2hTdHIgPSBtYXRjaFN0ci5zdWJzdHIoIDAsIG1hdGNoU3RyLmxlbmd0aCAtIDEgKTsgIC8vIHJlbW92ZSB0aGUgdHJhaWxpbmcgXCIpXCJcblx0XHRcdHN1ZmZpeFN0ciA9IFwiKVwiOyAgLy8gdGhpcyB3aWxsIGJlIGFkZGVkIGFmdGVyIHRoZSBnZW5lcmF0ZWQgPGE+IHRhZ1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvLyBIYW5kbGUgYW4gaW52YWxpZCBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIFRMRFxuXHRcdFx0dmFyIHBvcyA9IHRoaXMubWF0Y2hIYXNJbnZhbGlkQ2hhckFmdGVyVGxkKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApO1xuXHRcdFx0aWYoIHBvcyA+IC0xICkge1xuXHRcdFx0XHRzdWZmaXhTdHIgPSBtYXRjaFN0ci5zdWJzdHIocG9zKTsgIC8vIHRoaXMgd2lsbCBiZSBhZGRlZCBhZnRlciB0aGUgZ2VuZXJhdGVkIDxhPiB0YWdcblx0XHRcdFx0bWF0Y2hTdHIgPSBtYXRjaFN0ci5zdWJzdHIoIDAsIHBvcyApOyAvLyByZW1vdmUgdGhlIHRyYWlsaW5nIGludmFsaWQgY2hhcnNcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiggZW1haWxBZGRyZXNzTWF0Y2ggKSB7XG5cdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLkVtYWlsKCB7IG1hdGNoZWRUZXh0OiBtYXRjaFN0ciwgZW1haWw6IGVtYWlsQWRkcmVzc01hdGNoIH0gKTtcblxuXHRcdH0gZWxzZSBpZiggdHdpdHRlck1hdGNoICkge1xuXHRcdFx0Ly8gZml4IHVwIHRoZSBgbWF0Y2hTdHJgIGlmIHRoZXJlIHdhcyBhIHByZWNlZGluZyB3aGl0ZXNwYWNlIGNoYXIsXG5cdFx0XHQvLyB3aGljaCB3YXMgbmVlZGVkIHRvIGRldGVybWluZSB0aGUgbWF0Y2ggaXRzZWxmIChzaW5jZSB0aGVyZSBhcmVcblx0XHRcdC8vIG5vIGxvb2stYmVoaW5kcyBpbiBKUyByZWdleGVzKVxuXHRcdFx0aWYoIHR3aXR0ZXJIYW5kbGVQcmVmaXhXaGl0ZXNwYWNlQ2hhciApIHtcblx0XHRcdFx0cHJlZml4U3RyID0gdHdpdHRlckhhbmRsZVByZWZpeFdoaXRlc3BhY2VDaGFyO1xuXHRcdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnNsaWNlKCAxICk7ICAvLyByZW1vdmUgdGhlIHByZWZpeGVkIHdoaXRlc3BhY2UgY2hhciBmcm9tIHRoZSBtYXRjaFxuXHRcdFx0fVxuXHRcdFx0bWF0Y2ggPSBuZXcgQXV0b2xpbmtlci5tYXRjaC5Ud2l0dGVyKCB7IG1hdGNoZWRUZXh0OiBtYXRjaFN0ciwgdHdpdHRlckhhbmRsZTogdHdpdHRlckhhbmRsZSB9ICk7XG5cblx0XHR9IGVsc2UgaWYoIHBob25lTWF0Y2ggKSB7XG5cdFx0XHQvLyByZW1vdmUgbm9uLW51bWVyaWMgdmFsdWVzIGZyb20gcGhvbmUgbnVtYmVyIHN0cmluZ1xuXHRcdFx0dmFyIGNsZWFuTnVtYmVyID0gbWF0Y2hTdHIucmVwbGFjZSggL1xcRC9nLCAnJyApO1xuIFx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guUGhvbmUoIHsgbWF0Y2hlZFRleHQ6IG1hdGNoU3RyLCBudW1iZXI6IGNsZWFuTnVtYmVyIH0gKTtcblxuXHRcdH0gZWxzZSBpZiggaGFzaHRhZ01hdGNoICkge1xuXHRcdFx0Ly8gZml4IHVwIHRoZSBgbWF0Y2hTdHJgIGlmIHRoZXJlIHdhcyBhIHByZWNlZGluZyB3aGl0ZXNwYWNlIGNoYXIsXG5cdFx0XHQvLyB3aGljaCB3YXMgbmVlZGVkIHRvIGRldGVybWluZSB0aGUgbWF0Y2ggaXRzZWxmIChzaW5jZSB0aGVyZSBhcmVcblx0XHRcdC8vIG5vIGxvb2stYmVoaW5kcyBpbiBKUyByZWdleGVzKVxuXHRcdFx0aWYoIGhhc2h0YWdQcmVmaXhXaGl0ZXNwYWNlQ2hhciApIHtcblx0XHRcdFx0cHJlZml4U3RyID0gaGFzaHRhZ1ByZWZpeFdoaXRlc3BhY2VDaGFyO1xuXHRcdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnNsaWNlKCAxICk7ICAvLyByZW1vdmUgdGhlIHByZWZpeGVkIHdoaXRlc3BhY2UgY2hhciBmcm9tIHRoZSBtYXRjaFxuXHRcdFx0fVxuXHRcdFx0bWF0Y2ggPSBuZXcgQXV0b2xpbmtlci5tYXRjaC5IYXNodGFnKCB7IG1hdGNoZWRUZXh0OiBtYXRjaFN0ciwgc2VydmljZU5hbWU6IHRoaXMuaGFzaHRhZywgaGFzaHRhZzogaGFzaHRhZyB9ICk7XG5cblx0XHR9IGVsc2UgeyAgLy8gdXJsIG1hdGNoXG5cdFx0XHQvLyBJZiBpdCdzIGEgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBtYXRjaCwgcmVtb3ZlIHRoZSBjaGFyYWN0ZXJcblx0XHRcdC8vIGJlZm9yZSB0aGUgJy8vJyAod2hpY2ggdGhlIG1hdGNoZXJSZWdleCBuZWVkZWQgdG8gbWF0Y2ggZHVlIHRvXG5cdFx0XHQvLyB0aGUgbGFjayBvZiBhIG5lZ2F0aXZlIGxvb2stYmVoaW5kIGluIEphdmFTY3JpcHQgcmVndWxhclxuXHRcdFx0Ly8gZXhwcmVzc2lvbnMpXG5cdFx0XHRpZiggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdFx0XHR2YXIgY2hhckJlZm9yZU1hdGNoID0gcHJvdG9jb2xSZWxhdGl2ZU1hdGNoLm1hdGNoKCB0aGlzLmNoYXJCZWZvcmVQcm90b2NvbFJlbE1hdGNoUmVnZXggKVsgMSBdIHx8IFwiXCI7XG5cblx0XHRcdFx0aWYoIGNoYXJCZWZvcmVNYXRjaCApIHsgIC8vIGZpeCB1cCB0aGUgYG1hdGNoU3RyYCBpZiB0aGVyZSB3YXMgYSBwcmVjZWRpbmcgY2hhciBiZWZvcmUgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCwgd2hpY2ggd2FzIG5lZWRlZCB0byBkZXRlcm1pbmUgdGhlIG1hdGNoIGl0c2VsZiAoc2luY2UgdGhlcmUgYXJlIG5vIGxvb2stYmVoaW5kcyBpbiBKUyByZWdleGVzKVxuXHRcdFx0XHRcdHByZWZpeFN0ciA9IGNoYXJCZWZvcmVNYXRjaDtcblx0XHRcdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnNsaWNlKCAxICk7ICAvLyByZW1vdmUgdGhlIHByZWZpeGVkIGNoYXIgZnJvbSB0aGUgbWF0Y2hcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLlVybCgge1xuXHRcdFx0XHRtYXRjaGVkVGV4dCA6IG1hdGNoU3RyLFxuXHRcdFx0XHR1cmwgOiBtYXRjaFN0cixcblx0XHRcdFx0cHJvdG9jb2xVcmxNYXRjaCA6ICEhcHJvdG9jb2xVcmxNYXRjaCxcblx0XHRcdFx0cHJvdG9jb2xSZWxhdGl2ZU1hdGNoIDogISFwcm90b2NvbFJlbGF0aXZlTWF0Y2gsXG5cdFx0XHRcdHN0cmlwUHJlZml4IDogdGhpcy5zdHJpcFByZWZpeFxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRwcmVmaXhTdHIgOiBwcmVmaXhTdHIsXG5cdFx0XHRzdWZmaXhTdHIgOiBzdWZmaXhTdHIsXG5cdFx0XHRtYXRjaCAgICAgOiBtYXRjaFxuXHRcdH07XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIG1hdGNoIGZvdW5kIGhhcyBhbiB1bm1hdGNoZWQgY2xvc2luZyBwYXJlbnRoZXNpcy4gSWYgc28sXG5cdCAqIHRoaXMgcGFyZW50aGVzaXMgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIG1hdGNoIGl0c2VsZiwgYW5kIGFwcGVuZGVkXG5cdCAqIGFmdGVyIHRoZSBnZW5lcmF0ZWQgYW5jaG9yIHRhZyBpbiB7QGxpbmsgI3Byb2Nlc3NDYW5kaWRhdGVNYXRjaH0uXG5cdCAqXG5cdCAqIEEgbWF0Y2ggbWF5IGhhdmUgYW4gZXh0cmEgY2xvc2luZyBwYXJlbnRoZXNpcyBhdCB0aGUgZW5kIG9mIHRoZSBtYXRjaFxuXHQgKiBiZWNhdXNlIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gbXVzdCBpbmNsdWRlIHBhcmVudGhlc2lzIGZvciBVUkxzIHN1Y2ggYXNcblx0ICogXCJ3aWtpcGVkaWEuY29tL3NvbWV0aGluZ18oZGlzYW1iaWd1YXRpb24pXCIsIHdoaWNoIHNob3VsZCBiZSBhdXRvLWxpbmtlZC5cblx0ICpcblx0ICogSG93ZXZlciwgYW4gZXh0cmEgcGFyZW50aGVzaXMgKndpbGwqIGJlIGluY2x1ZGVkIHdoZW4gdGhlIFVSTCBpdHNlbGYgaXNcblx0ICogd3JhcHBlZCBpbiBwYXJlbnRoZXNpcywgc3VjaCBhcyBpbiB0aGUgY2FzZSBvZiBcIih3aWtpcGVkaWEuY29tL3NvbWV0aGluZ18oZGlzYW1iaWd1YXRpb24pKVwiLlxuXHQgKiBJbiB0aGlzIGNhc2UsIHRoZSBsYXN0IGNsb3NpbmcgcGFyZW50aGVzaXMgc2hvdWxkICpub3QqIGJlIHBhcnQgb2YgdGhlXG5cdCAqIFVSTCBpdHNlbGYsIGFuZCB0aGlzIG1ldGhvZCB3aWxsIHJldHVybiBgdHJ1ZWAuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBtYXRjaFN0ciBUaGUgZnVsbCBtYXRjaCBzdHJpbmcgZnJvbSB0aGUge0BsaW5rICNtYXRjaGVyUmVnZXh9LlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlcmUgaXMgYW4gdW5iYWxhbmNlZCBjbG9zaW5nIHBhcmVudGhlc2lzIGF0XG5cdCAqICAgdGhlIGVuZCBvZiB0aGUgYG1hdGNoU3RyYCwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRtYXRjaEhhc1VuYmFsYW5jZWRDbG9zaW5nUGFyZW4gOiBmdW5jdGlvbiggbWF0Y2hTdHIgKSB7XG5cdFx0dmFyIGxhc3RDaGFyID0gbWF0Y2hTdHIuY2hhckF0KCBtYXRjaFN0ci5sZW5ndGggLSAxICk7XG5cblx0XHRpZiggbGFzdENoYXIgPT09ICcpJyApIHtcblx0XHRcdHZhciBvcGVuUGFyZW5zTWF0Y2ggPSBtYXRjaFN0ci5tYXRjaCggL1xcKC9nICksXG5cdFx0XHQgICAgY2xvc2VQYXJlbnNNYXRjaCA9IG1hdGNoU3RyLm1hdGNoKCAvXFwpL2cgKSxcblx0XHRcdCAgICBudW1PcGVuUGFyZW5zID0gKCBvcGVuUGFyZW5zTWF0Y2ggJiYgb3BlblBhcmVuc01hdGNoLmxlbmd0aCApIHx8IDAsXG5cdFx0XHQgICAgbnVtQ2xvc2VQYXJlbnMgPSAoIGNsb3NlUGFyZW5zTWF0Y2ggJiYgY2xvc2VQYXJlbnNNYXRjaC5sZW5ndGggKSB8fCAwO1xuXG5cdFx0XHRpZiggbnVtT3BlblBhcmVucyA8IG51bUNsb3NlUGFyZW5zICkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIGlmIHRoZXJlJ3MgYW4gaW52YWxpZCBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIFRMRCBpbiBhIFVSTC4gVmFsaWRcblx0ICogY2hhcmFjdGVycyBhZnRlciBUTEQgYXJlICc6Lz8jJy4gRXhjbHVkZSBwcm90b2NvbCBtYXRjaGVkIFVSTHMgZnJvbSB0aGlzXG5cdCAqIGNoZWNrLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuXG5cdCAqICAgZW1wdHkgc3RyaW5nIGlmIHRoZSBtYXRjaCBpcyBub3QgYSBVUkwgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFVybE1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIHByb3RvY29sXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBtYXRjaCBzb21ldGhpbmcgbGlrZVxuXHQgKiAgICdodHRwOi8vbG9jYWxob3N0Jywgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lXG5cdCAqICAgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBpbnZhbGlkIGNoYXJhY3RlciB3YXMgZm91bmQuIElmXG5cdCAqICAgbm8gc3VjaCBjaGFyYWN0ZXIgd2FzIGZvdW5kLCByZXR1cm5zIC0xXG5cdCAqL1xuXHRtYXRjaEhhc0ludmFsaWRDaGFyQWZ0ZXJUbGQgOiBmdW5jdGlvbiggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2ggKSB7XG5cdFx0aWYgKCAhdXJsTWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXG5cdFx0dmFyIG9mZnNldCA9IDA7XG5cdFx0aWYgKCBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdFx0b2Zmc2V0ID0gdXJsTWF0Y2guaW5kZXhPZignOicpO1xuXHRcdFx0dXJsTWF0Y2ggPSB1cmxNYXRjaC5zbGljZShvZmZzZXQpO1xuXHRcdH1cblxuXHRcdHZhciByZSA9IC9eKCguP1xcL1xcLyk/W0EtWmEtejAtOVxcLlxcLV0qW0EtWmEtejAtOVxcLV1cXC5bQS1aYS16XSspLztcblx0XHR2YXIgcmVzID0gcmUuZXhlYyggdXJsTWF0Y2ggKTtcblx0XHRpZiAoIHJlcyA9PT0gbnVsbCApIHtcblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cblx0XHRvZmZzZXQgKz0gcmVzWzFdLmxlbmd0aDtcblx0XHR1cmxNYXRjaCA9IHVybE1hdGNoLnNsaWNlKHJlc1sxXS5sZW5ndGgpO1xuXHRcdGlmICgvXlteLkEtWmEtejpcXC8/I10vLnRlc3QodXJsTWF0Y2gpKSB7XG5cdFx0XHRyZXR1cm4gb2Zmc2V0O1xuXHRcdH1cblxuXHRcdHJldHVybiAtMTtcblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qanNoaW50IHNjcmlwdHVybDp0cnVlICovXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogVXNlZCBieSBBdXRvbGlua2VyIHRvIGZpbHRlciBvdXQgZmFsc2UgcG9zaXRpdmVzIGZyb20gdGhlXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlciNtYXRjaGVyUmVnZXh9LlxuICpcbiAqIER1ZSB0byB0aGUgbGltaXRhdGlvbnMgb2YgcmVndWxhciBleHByZXNzaW9ucyAoaW5jbHVkaW5nIHRoZSBtaXNzaW5nIGZlYXR1cmVcbiAqIG9mIGxvb2stYmVoaW5kcyBpbiBKUyByZWd1bGFyIGV4cHJlc3Npb25zKSwgd2UgY2Fubm90IGFsd2F5cyBkZXRlcm1pbmUgdGhlXG4gKiB2YWxpZGl0eSBvZiBhIGdpdmVuIG1hdGNoLiBUaGlzIGNsYXNzIGFwcGxpZXMgYSBiaXQgb2YgYWRkaXRpb25hbCBsb2dpYyB0b1xuICogZmlsdGVyIG91dCBhbnkgZmFsc2UgcG9zaXRpdmVzIHRoYXQgaGF2ZSBiZWVuIG1hdGNoZWQgYnkgdGhlXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlciNtYXRjaGVyUmVnZXh9LlxuICovXG5BdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBpbnZhbGlkUHJvdG9jb2xSZWxNYXRjaFJlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBjaGVjayBhIHBvdGVudGlhbCBwcm90b2NvbC1yZWxhdGl2ZSBVUkxcblx0ICogbWF0Y2gsIGNvbWluZyBmcm9tIHRoZSB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlciNtYXRjaGVyUmVnZXh9LlxuXHQgKiBBIHByb3RvY29sLXJlbGF0aXZlIFVSTCBpcywgZm9yIGV4YW1wbGUsIFwiLy95YWhvby5jb21cIlxuXHQgKlxuXHQgKiBUaGlzIHJlZ3VsYXIgZXhwcmVzc2lvbiBjaGVja3MgdG8gc2VlIGlmIHRoZXJlIGlzIGEgd29yZCBjaGFyYWN0ZXIgYmVmb3JlXG5cdCAqIHRoZSAnLy8nIG1hdGNoIGluIG9yZGVyIHRvIGRldGVybWluZSBpZiB3ZSBzaG91bGQgYWN0dWFsbHkgYXV0b2xpbmsgYVxuXHQgKiBwcm90b2NvbC1yZWxhdGl2ZSBVUkwuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVnYXRpdmVcblx0ICogbG9vay1iZWhpbmQgaW4gSmF2YVNjcmlwdCByZWd1bGFyIGV4cHJlc3Npb25zLlxuXHQgKlxuXHQgKiBGb3IgaW5zdGFuY2UsIHdlIHdhbnQgdG8gYXV0b2xpbmsgc29tZXRoaW5nIGxpa2UgXCJHbyB0bzogLy9nb29nbGUuY29tXCIsXG5cdCAqIGJ1dCB3ZSBkb24ndCB3YW50IHRvIGF1dG9saW5rIHNvbWV0aGluZyBsaWtlIFwiYWJjLy9nb29nbGUuY29tXCJcblx0ICovXG5cdGludmFsaWRQcm90b2NvbFJlbE1hdGNoUmVnZXggOiAvXltcXHddXFwvXFwvLyxcblxuXHQvKipcblx0ICogUmVnZXggdG8gdGVzdCBmb3IgYSBmdWxsIHByb3RvY29sLCB3aXRoIHRoZSB0d28gdHJhaWxpbmcgc2xhc2hlcy4gRXg6ICdodHRwOi8vJ1xuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaGFzRnVsbFByb3RvY29sUmVnZXhcblx0ICovXG5cdGhhc0Z1bGxQcm90b2NvbFJlZ2V4IDogL15bQS1aYS16XVstLitBLVphLXowLTldKjpcXC9cXC8vLFxuXG5cdC8qKlxuXHQgKiBSZWdleCB0byBmaW5kIHRoZSBVUkkgc2NoZW1lLCBzdWNoIGFzICdtYWlsdG86Jy5cblx0ICpcblx0ICogVGhpcyBpcyB1c2VkIHRvIGZpbHRlciBvdXQgJ2phdmFzY3JpcHQ6JyBhbmQgJ3Zic2NyaXB0Oicgc2NoZW1lcy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHVyaVNjaGVtZVJlZ2V4XG5cdCAqL1xuXHR1cmlTY2hlbWVSZWdleCA6IC9eW0EtWmEtel1bLS4rQS1aYS16MC05XSo6LyxcblxuXHQvKipcblx0ICogUmVnZXggdG8gZGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSB3b3JkIGNoYXIgZXhpc3RzIGFmdGVyIHRoZSBwcm90b2NvbCAoaS5lLiBhZnRlciB0aGUgJzonKVxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaGFzV29yZENoYXJBZnRlclByb3RvY29sUmVnZXhcblx0ICovXG5cdGhhc1dvcmRDaGFyQWZ0ZXJQcm90b2NvbFJlZ2V4IDogLzpbXlxcc10qP1tBLVphLXpdLyxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gbWF0Y2ggZm91bmQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyfVxuXHQgKiBpcyB2YWxpZC4gV2lsbCByZXR1cm4gYGZhbHNlYCBmb3I6XG5cdCAqXG5cdCAqIDEpIFVSTCBtYXRjaGVzIHdoaWNoIGRvIG5vdCBoYXZlIGF0IGxlYXN0IGhhdmUgb25lIHBlcmlvZCAoJy4nKSBpbiB0aGVcblx0ICogICAgZG9tYWluIG5hbWUgKGVmZmVjdGl2ZWx5IHNraXBwaW5nIG92ZXIgbWF0Y2hlcyBsaWtlIFwiYWJjOmRlZlwiKS5cblx0ICogICAgSG93ZXZlciwgVVJMIG1hdGNoZXMgd2l0aCBhIHByb3RvY29sIHdpbGwgYmUgYWxsb3dlZCAoZXg6ICdodHRwOi8vbG9jYWxob3N0Jylcblx0ICogMikgVVJMIG1hdGNoZXMgd2hpY2ggZG8gbm90IGhhdmUgYXQgbGVhc3Qgb25lIHdvcmQgY2hhcmFjdGVyIGluIHRoZVxuXHQgKiAgICBkb21haW4gbmFtZSAoZWZmZWN0aXZlbHkgc2tpcHBpbmcgb3ZlciBtYXRjaGVzIGxpa2UgXCJnaXQ6MS4wXCIpLlxuXHQgKiAzKSBBIHByb3RvY29sLXJlbGF0aXZlIHVybCBtYXRjaCAoYSBVUkwgYmVnaW5uaW5nIHdpdGggJy8vJykgd2hvc2Vcblx0ICogICAgcHJldmlvdXMgY2hhcmFjdGVyIGlzIGEgd29yZCBjaGFyYWN0ZXIgKGVmZmVjdGl2ZWx5IHNraXBwaW5nIG92ZXJcblx0ICogICAgc3RyaW5ncyBsaWtlIFwiYWJjLy9nb29nbGUuY29tXCIpXG5cdCAqXG5cdCAqIE90aGVyd2lzZSwgcmV0dXJucyBgdHJ1ZWAuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwsIGlmIHRoZXJlIHdhcyBvbmUuIFdpbGwgYmUgYW5cblx0ICogICBlbXB0eSBzdHJpbmcgaWYgdGhlIG1hdGNoIGlzIG5vdCBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoIHNvbWV0aGluZyBsaWtlXG5cdCAqICAgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWVcblx0ICogICBoYXMgYXQgbGVhc3Qgb25lICcuJyBpbiBpdC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgcHJvdG9jb2wtcmVsYXRpdmUgc3RyaW5nIGZvciBhXG5cdCAqICAgVVJMIG1hdGNoIChpLmUuICcvLycpLCBwb3NzaWJseSB3aXRoIGEgcHJlY2VkaW5nIGNoYXJhY3RlciAoZXgsIGFcblx0ICogICBzcGFjZSwgc3VjaCBhczogJyAvLycsIG9yIGEgbGV0dGVyLCBzdWNoIGFzOiAnYS8vJykuIFRoZSBtYXRjaCBpc1xuXHQgKiAgIGludmFsaWQgaWYgdGhlcmUgaXMgYSB3b3JkIGNoYXJhY3RlciBwcmVjZWRpbmcgdGhlICcvLycuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgbWF0Y2ggZ2l2ZW4gaXMgdmFsaWQgYW5kIHNob3VsZCBiZVxuXHQgKiAgIHByb2Nlc3NlZCwgb3IgYGZhbHNlYCBpZiB0aGUgbWF0Y2ggaXMgaW52YWxpZCBhbmQvb3Igc2hvdWxkIGp1c3Qgbm90IGJlXG5cdCAqICAgcHJvY2Vzc2VkLlxuXHQgKi9cblx0aXNWYWxpZE1hdGNoIDogZnVuY3Rpb24oIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoLCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSB7XG5cdFx0aWYoXG5cdFx0XHQoIHByb3RvY29sVXJsTWF0Y2ggJiYgIXRoaXMuaXNWYWxpZFVyaVNjaGVtZSggcHJvdG9jb2xVcmxNYXRjaCApICkgfHxcblx0XHRcdHRoaXMudXJsTWF0Y2hEb2VzTm90SGF2ZVByb3RvY29sT3JEb3QoIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkgfHwgICAgICAgLy8gQXQgbGVhc3Qgb25lIHBlcmlvZCAoJy4nKSBtdXN0IGV4aXN0IGluIHRoZSBVUkwgbWF0Y2ggZm9yIHVzIHRvIGNvbnNpZGVyIGl0IGFuIGFjdHVhbCBVUkwsICp1bmxlc3MqIGl0IHdhcyBhIGZ1bGwgcHJvdG9jb2wgbWF0Y2ggKGxpa2UgJ2h0dHA6Ly9sb2NhbGhvc3QnKVxuXHRcdFx0dGhpcy51cmxNYXRjaERvZXNOb3RIYXZlQXRMZWFzdE9uZVdvcmRDaGFyKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHx8ICAvLyBBdCBsZWFzdCBvbmUgbGV0dGVyIGNoYXJhY3RlciBtdXN0IGV4aXN0IGluIHRoZSBkb21haW4gbmFtZSBhZnRlciBhIHByb3RvY29sIG1hdGNoLiBFeDogc2tpcCBvdmVyIHNvbWV0aGluZyBsaWtlIFwiZ2l0OjEuMFwiXG5cdFx0XHR0aGlzLmlzSW52YWxpZFByb3RvY29sUmVsYXRpdmVNYXRjaCggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkgICAgICAgICAgICAgICAgIC8vIEEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2ggd2hpY2ggaGFzIGEgd29yZCBjaGFyYWN0ZXIgaW4gZnJvbnQgb2YgaXQgKHNvIHdlIGNhbiBza2lwIHNvbWV0aGluZyBsaWtlIFwiYWJjLy9nb29nbGUuY29tXCIpXG5cdFx0KSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiB0aGUgVVJJIHNjaGVtZSBpcyBhIHZhbGlkIHNjaGVtZSB0byBiZSBhdXRvbGlua2VkLiBSZXR1cm5zXG5cdCAqIGBmYWxzZWAgaWYgdGhlIHNjaGVtZSBpcyAnamF2YXNjcmlwdDonIG9yICd2YnNjcmlwdDonXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmlTY2hlbWVNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBmdWxsIFVSSSBzY2hlbWVcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJyBvciAnbWFpbHRvOmFAYS5jb20nLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIHNjaGVtZSBpcyBhIHZhbGlkIG9uZSwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRpc1ZhbGlkVXJpU2NoZW1lIDogZnVuY3Rpb24oIHVyaVNjaGVtZU1hdGNoICkge1xuXHRcdHZhciB1cmlTY2hlbWUgPSB1cmlTY2hlbWVNYXRjaC5tYXRjaCggdGhpcy51cmlTY2hlbWVSZWdleCApWyAwIF0udG9Mb3dlckNhc2UoKTtcblxuXHRcdHJldHVybiAoIHVyaVNjaGVtZSAhPT0gJ2phdmFzY3JpcHQ6JyAmJiB1cmlTY2hlbWUgIT09ICd2YnNjcmlwdDonICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIFVSTCBtYXRjaCBkb2VzIG5vdCBoYXZlIGVpdGhlcjpcblx0ICpcblx0ICogYSkgYSBmdWxsIHByb3RvY29sIChpLmUuICdodHRwOi8vJyksIG9yXG5cdCAqIGIpIGF0IGxlYXN0IG9uZSBkb3QgKCcuJykgaW4gdGhlIGRvbWFpbiBuYW1lIChmb3IgYSBub24tZnVsbC1wcm90b2NvbFxuXHQgKiAgICBtYXRjaCkuXG5cdCAqXG5cdCAqIEVpdGhlciBzaXR1YXRpb24gaXMgY29uc2lkZXJlZCBhbiBpbnZhbGlkIFVSTCAoZXg6ICdnaXQ6ZCcgZG9lcyBub3QgaGF2ZVxuXHQgKiBlaXRoZXIgdGhlICc6Ly8nIHBhcnQsIG9yIGF0IGxlYXN0IG9uZSBkb3QgaW4gdGhlIGRvbWFpbiBuYW1lLiBJZiB0aGVcblx0ICogbWF0Y2ggd2FzICdnaXQ6YWJjLmNvbScsIHdlIHdvdWxkIGNvbnNpZGVyIHRoaXMgdmFsaWQuKVxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuXG5cdCAqICAgZW1wdHkgc3RyaW5nIGlmIHRoZSBtYXRjaCBpcyBub3QgYSBVUkwgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFVybE1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIHByb3RvY29sXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBtYXRjaCBzb21ldGhpbmcgbGlrZVxuXHQgKiAgICdodHRwOi8vbG9jYWxob3N0Jywgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lXG5cdCAqICAgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgVVJMIG1hdGNoIGRvZXMgbm90IGhhdmUgYSBmdWxsIHByb3RvY29sLFxuXHQgKiAgIG9yIGF0IGxlYXN0IG9uZSBkb3QgKCcuJykgaW4gYSBub24tZnVsbC1wcm90b2NvbCBtYXRjaC5cblx0ICovXG5cdHVybE1hdGNoRG9lc05vdEhhdmVQcm90b2NvbE9yRG90IDogZnVuY3Rpb24oIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdHJldHVybiAoICEhdXJsTWF0Y2ggJiYgKCAhcHJvdG9jb2xVcmxNYXRjaCB8fCAhdGhpcy5oYXNGdWxsUHJvdG9jb2xSZWdleC50ZXN0KCBwcm90b2NvbFVybE1hdGNoICkgKSAmJiB1cmxNYXRjaC5pbmRleE9mKCAnLicgKSA9PT0gLTEgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgVVJMIG1hdGNoIGRvZXMgbm90IGhhdmUgYXQgbGVhc3Qgb25lIHdvcmQgY2hhcmFjdGVyIGFmdGVyXG5cdCAqIHRoZSBwcm90b2NvbCAoaS5lLiBpbiB0aGUgZG9tYWluIG5hbWUpLlxuXHQgKlxuXHQgKiBBdCBsZWFzdCBvbmUgbGV0dGVyIGNoYXJhY3RlciBtdXN0IGV4aXN0IGluIHRoZSBkb21haW4gbmFtZSBhZnRlciBhXG5cdCAqIHByb3RvY29sIG1hdGNoLiBFeDogc2tpcCBvdmVyIHNvbWV0aGluZyBsaWtlIFwiZ2l0OjEuMFwiXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwsIGlmIHRoZXJlIHdhcyBvbmUuIFdpbGwgYmUgYW5cblx0ICogICBlbXB0eSBzdHJpbmcgaWYgdGhlIG1hdGNoIGlzIG5vdCBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIGtub3cgd2hldGhlciBvciBub3Qgd2Vcblx0ICogICBoYXZlIGEgcHJvdG9jb2wgaW4gdGhlIFVSTCBzdHJpbmcsIGluIG9yZGVyIHRvIGNoZWNrIGZvciBhIHdvcmRcblx0ICogICBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIHByb3RvY29sIHNlcGFyYXRvciAoJzonKS5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBVUkwgbWF0Y2ggZG9lcyBub3QgaGF2ZSBhdCBsZWFzdCBvbmUgd29yZFxuXHQgKiAgIGNoYXJhY3RlciBpbiBpdCBhZnRlciB0aGUgcHJvdG9jb2wsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0dXJsTWF0Y2hEb2VzTm90SGF2ZUF0TGVhc3RPbmVXb3JkQ2hhciA6IGZ1bmN0aW9uKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRpZiggdXJsTWF0Y2ggJiYgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRcdHJldHVybiAhdGhpcy5oYXNXb3JkQ2hhckFmdGVyUHJvdG9jb2xSZWdleC50ZXN0KCB1cmxNYXRjaCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCBpcyBhbiBpbnZhbGlkIG9uZS4gVGhpcyBtZXRob2Rcblx0ICogcmV0dXJucyBgdHJ1ZWAgaWYgdGhlcmUgaXMgYSBgcHJvdG9jb2xSZWxhdGl2ZU1hdGNoYCwgYW5kIHRoYXQgbWF0Y2hcblx0ICogY29udGFpbnMgYSB3b3JkIGNoYXJhY3RlciBiZWZvcmUgdGhlICcvLycgKGkuZS4gaXQgbXVzdCBjb250YWluXG5cdCAqIHdoaXRlc3BhY2Ugb3Igbm90aGluZyBiZWZvcmUgdGhlICcvLycgaW4gb3JkZXIgdG8gYmUgY29uc2lkZXJlZCB2YWxpZCkuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggVGhlIHByb3RvY29sLXJlbGF0aXZlIHN0cmluZyBmb3IgYVxuXHQgKiAgIFVSTCBtYXRjaCAoaS5lLiAnLy8nKSwgcG9zc2libHkgd2l0aCBhIHByZWNlZGluZyBjaGFyYWN0ZXIgKGV4LCBhXG5cdCAqICAgc3BhY2UsIHN1Y2ggYXM6ICcgLy8nLCBvciBhIGxldHRlciwgc3VjaCBhczogJ2EvLycpLiBUaGUgbWF0Y2ggaXNcblx0ICogICBpbnZhbGlkIGlmIHRoZXJlIGlzIGEgd29yZCBjaGFyYWN0ZXIgcHJlY2VkaW5nIHRoZSAnLy8nLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgaXQgaXMgYW4gaW52YWxpZCBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCxcblx0ICogICBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdGlzSW52YWxpZFByb3RvY29sUmVsYXRpdmVNYXRjaCA6IGZ1bmN0aW9uKCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSB7XG5cdFx0cmV0dXJuICggISFwcm90b2NvbFJlbGF0aXZlTWF0Y2ggJiYgdGhpcy5pbnZhbGlkUHJvdG9jb2xSZWxNYXRjaFJlZ2V4LnRlc3QoIHByb3RvY29sUmVsYXRpdmVNYXRjaCApICk7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqIFxuICogUmVwcmVzZW50cyBhIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmUgQXV0b2xpbmtlZC4gQSBNYXRjaCBvYmplY3QgaXMgd2hhdCBpcyBwcm92aWRlZCBpbiBhIFxuICoge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0sIGFuZCBtYXkgYmUgdXNlZCB0byBxdWVyeSBmb3IgZGV0YWlscyBhYm91dCB0aGUgbWF0Y2guXG4gKiBcbiAqIEZvciBleGFtcGxlOlxuICogXG4gKiAgICAgdmFyIGlucHV0ID0gXCIuLi5cIjsgIC8vIHN0cmluZyB3aXRoIFVSTHMsIEVtYWlsIEFkZHJlc3NlcywgYW5kIFR3aXR0ZXIgSGFuZGxlc1xuICogICAgIFxuICogICAgIHZhciBsaW5rZWRUZXh0ID0gQXV0b2xpbmtlci5saW5rKCBpbnB1dCwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJocmVmID0gXCIsIG1hdGNoLmdldEFuY2hvckhyZWYoKSApO1xuICogICAgICAgICAgICAgY29uc29sZS5sb2coIFwidGV4dCA9IFwiLCBtYXRjaC5nZXRBbmNob3JUZXh0KCkgKTtcbiAqICAgICAgICAgXG4gKiAgICAgICAgICAgICBzd2l0Y2goIG1hdGNoLmdldFR5cGUoKSApIHtcbiAqICAgICAgICAgICAgICAgICBjYXNlICd1cmwnIDogXG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInVybDogXCIsIG1hdGNoLmdldFVybCgpICk7XG4gKiAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImVtYWlsOiBcIiwgbWF0Y2guZ2V0RW1haWwoKSApO1xuICogICAgICAgICAgICAgICAgICAgICBcbiAqICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInR3aXR0ZXI6IFwiLCBtYXRjaC5nZXRUd2l0dGVySGFuZGxlKCkgKTtcbiAqICAgICAgICAgICAgIH1cbiAqICAgICAgICAgfVxuICogICAgIH0gKTtcbiAqICAgICBcbiAqIFNlZSB0aGUge0BsaW5rIEF1dG9saW5rZXJ9IGNsYXNzIGZvciBtb3JlIGRldGFpbHMgb24gdXNpbmcgdGhlIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59LlxuICovXG5BdXRvbGlua2VyLm1hdGNoLk1hdGNoID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBtYXRjaGVkVGV4dCAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBUaGUgb3JpZ2luYWwgdGV4dCB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0XG5cdFxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjZmcgVGhlIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcyBmb3IgdGhlIE1hdGNoIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXHR9LFxuXG5cdFxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogQXV0b2xpbmtlci5VdGlsLmFic3RyYWN0TWV0aG9kLFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBvcmlnaW5hbCB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRNYXRjaGVkVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLm1hdGNoZWRUZXh0O1xuXHR9LFxuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IEF1dG9saW5rZXIuVXRpbC5hYnN0cmFjdE1ldGhvZCxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IEF1dG9saW5rZXIuVXRpbC5hYnN0cmFjdE1ldGhvZFxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLkVtYWlsXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKiBcbiAqIFJlcHJlc2VudHMgYSBFbWFpbCBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlIEF1dG9saW5rZWQuXG4gKiBcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLkVtYWlsID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gZW1haWwgKHJlcXVpcmVkKVxuXHQgKiBcblx0ICogVGhlIGVtYWlsIGFkZHJlc3MgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZW1haWwnO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBlbWFpbCBhZGRyZXNzIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRFbWFpbCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmVtYWlsO1xuXHR9LFxuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdtYWlsdG86JyArIHRoaXMuZW1haWw7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmVtYWlsO1xuXHR9XG5cdFxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5IYXNodGFnXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKlxuICogUmVwcmVzZW50cyBhIEhhc2h0YWcgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZVxuICogQXV0b2xpbmtlZC5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guSGFzaHRhZyA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBzZXJ2aWNlTmFtZSAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSBzZXJ2aWNlIHRvIHBvaW50IGhhc2h0YWcgbWF0Y2hlcyB0by4gU2VlIHtAbGluayBBdXRvbGlua2VyI2hhc2h0YWd9XG5cdCAqIGZvciBhdmFpbGFibGUgdmFsdWVzLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBoYXNodGFnIChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIEhhc2h0YWcgdGhhdCB3YXMgbWF0Y2hlZCwgd2l0aG91dCB0aGUgJyMnLlxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdoYXNodGFnJztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBtYXRjaGVkIGhhc2h0YWcuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEhhc2h0YWcgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5oYXNodGFnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlcnZpY2VOYW1lID0gdGhpcy5zZXJ2aWNlTmFtZSxcblx0XHQgICAgaGFzaHRhZyA9IHRoaXMuaGFzaHRhZztcblxuXHRcdHN3aXRjaCggc2VydmljZU5hbWUgKSB7XG5cdFx0XHRjYXNlICd0d2l0dGVyJyA6XG5cdFx0XHRcdHJldHVybiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9oYXNodGFnLycgKyBoYXNodGFnO1xuXHRcdFx0Y2FzZSAnZmFjZWJvb2snIDpcblx0XHRcdFx0cmV0dXJuICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vaGFzaHRhZy8nICsgaGFzaHRhZztcblx0XHRcdGNhc2UgJ2luc3RhZ3JhbScgOlxuXHRcdFx0XHRyZXR1cm4gJ2h0dHBzOi8vaW5zdGFncmFtLmNvbS9leHBsb3JlL3RhZ3MvJyArIGhhc2h0YWc7XG5cblx0XHRcdGRlZmF1bHQgOiAgLy8gU2hvdWxkbid0IGhhcHBlbiBiZWNhdXNlIEF1dG9saW5rZXIncyBjb25zdHJ1Y3RvciBzaG91bGQgYmxvY2sgYW55IGludmFsaWQgdmFsdWVzLCBidXQganVzdCBpbiBjYXNlLlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoICdVbmtub3duIHNlcnZpY2UgbmFtZSB0byBwb2ludCBoYXNodGFnIHRvOiAnLCBzZXJ2aWNlTmFtZSApO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnIycgKyB0aGlzLmhhc2h0YWc7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLlBob25lXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKlxuICogUmVwcmVzZW50cyBhIFBob25lIG51bWJlciBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlXG4gKiBBdXRvbGlua2VkLlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5QaG9uZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBudW1iZXIgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgcGhvbmUgbnVtYmVyIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3Bob25lJztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBwaG9uZSBudW1iZXIgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0TnVtYmVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5udW1iZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3RlbDonICsgdGhpcy5udW1iZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXRjaGVkVGV4dDtcblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guVHdpdHRlclxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICogXG4gKiBSZXByZXNlbnRzIGEgVHdpdHRlciBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlIEF1dG9saW5rZWQuXG4gKiBcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLlR3aXR0ZXIgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLm1hdGNoLk1hdGNoLCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0d2l0dGVySGFuZGxlIChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSBUd2l0dGVyIGhhbmRsZSB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICd0d2l0dGVyJztcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR3aXR0ZXJIYW5kbGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy50d2l0dGVySGFuZGxlO1xuXHR9LFxuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdodHRwczovL3R3aXR0ZXIuY29tLycgKyB0aGlzLnR3aXR0ZXJIYW5kbGU7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnQCcgKyB0aGlzLnR3aXR0ZXJIYW5kbGU7XG5cdH1cblx0XG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLlVybFxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICogXG4gKiBSZXByZXNlbnRzIGEgVXJsIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmUgQXV0b2xpbmtlZC5cbiAqIFxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0pIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guVXJsID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gdXJsIChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSB1cmwgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdFxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gcHJvdG9jb2xVcmxNYXRjaCAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBgdHJ1ZWAgaWYgdGhlIFVSTCBpcyBhIG1hdGNoIHdoaWNoIGFscmVhZHkgaGFzIGEgcHJvdG9jb2wgKGkuZS4gJ2h0dHA6Ly8nKSwgYGZhbHNlYCBpZiB0aGUgbWF0Y2ggd2FzIGZyb20gYSAnd3d3JyBvclxuXHQgKiBrbm93biBUTEQgbWF0Y2guXG5cdCAqL1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHByb3RvY29sUmVsYXRpdmVNYXRjaCAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBgdHJ1ZWAgaWYgdGhlIFVSTCBpcyBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLiBBIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoIGlzIGEgVVJMIHRoYXQgc3RhcnRzIHdpdGggJy8vJyxcblx0ICogYW5kIHdpbGwgYmUgZWl0aGVyIGh0dHA6Ly8gb3IgaHR0cHM6Ly8gYmFzZWQgb24gdGhlIHByb3RvY29sIHRoYXQgdGhlIHNpdGUgaXMgbG9hZGVkIHVuZGVyLlxuXHQgKi9cblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBzdHJpcFByZWZpeCAocmVxdWlyZWQpXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjc3RyaXBQcmVmaXhcblx0ICovXG5cdFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gdXJsUHJlZml4UmVnZXhcblx0ICogXG5cdCAqIEEgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcmVtb3ZlIHRoZSAnaHR0cDovLycgb3IgJ2h0dHBzOi8vJyBhbmQvb3IgdGhlICd3d3cuJyBmcm9tIFVSTHMuXG5cdCAqL1xuXHR1cmxQcmVmaXhSZWdleDogL14oaHR0cHM/OlxcL1xcLyk/KHd3d1xcLik/L2ksXG5cdFxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHByb3RvY29sUmVsYXRpdmVSZWdleFxuXHQgKiBcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHJlbW92ZSB0aGUgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBmcm9tIHRoZSB7QGxpbmsgI3VybH0gc3RyaW5nLCBmb3IgcHVycG9zZXNcblx0ICogb2Yge0BsaW5rICNnZXRBbmNob3JUZXh0fS4gQSBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgaXMsIGZvciBleGFtcGxlLCBcIi8veWFob28uY29tXCJcblx0ICovXG5cdHByb3RvY29sUmVsYXRpdmVSZWdleCA6IC9eXFwvXFwvLyxcblx0XG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0Jvb2xlYW59IHByb3RvY29sUHJlcGVuZGVkXG5cdCAqIFxuXHQgKiBXaWxsIGJlIHNldCB0byBgdHJ1ZWAgaWYgdGhlICdodHRwOi8vJyBwcm90b2NvbCBoYXMgYmVlbiBwcmVwZW5kZWQgdG8gdGhlIHtAbGluayAjdXJsfSAoYmVjYXVzZSB0aGVcblx0ICoge0BsaW5rICN1cmx9IGRpZCBub3QgaGF2ZSBhIHByb3RvY29sKVxuXHQgKi9cblx0cHJvdG9jb2xQcmVwZW5kZWQgOiBmYWxzZSxcblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICd1cmwnO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB1cmwgdGhhdCB3YXMgbWF0Y2hlZCwgYXNzdW1pbmcgdGhlIHByb3RvY29sIHRvIGJlICdodHRwOi8vJyBpZiB0aGUgb3JpZ2luYWxcblx0ICogbWF0Y2ggd2FzIG1pc3NpbmcgYSBwcm90b2NvbC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFVybCA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cmwgPSB0aGlzLnVybDtcblx0XHRcblx0XHQvLyBpZiB0aGUgdXJsIHN0cmluZyBkb2Vzbid0IGJlZ2luIHdpdGggYSBwcm90b2NvbCwgYXNzdW1lICdodHRwOi8vJ1xuXHRcdGlmKCAhdGhpcy5wcm90b2NvbFJlbGF0aXZlTWF0Y2ggJiYgIXRoaXMucHJvdG9jb2xVcmxNYXRjaCAmJiAhdGhpcy5wcm90b2NvbFByZXBlbmRlZCApIHtcblx0XHRcdHVybCA9IHRoaXMudXJsID0gJ2h0dHA6Ly8nICsgdXJsO1xuXHRcdFx0XG5cdFx0XHR0aGlzLnByb3RvY29sUHJlcGVuZGVkID0gdHJ1ZTtcblx0XHR9XG5cdFx0XG5cdFx0cmV0dXJuIHVybDtcblx0fSxcblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cmwgPSB0aGlzLmdldFVybCgpO1xuXHRcdFxuXHRcdHJldHVybiB1cmwucmVwbGFjZSggLyZhbXA7L2csICcmJyApOyAgLy8gYW55ICZhbXA7J3MgaW4gdGhlIFVSTCBzaG91bGQgYmUgY29udmVydGVkIGJhY2sgdG8gJyYnIGlmIHRoZXkgd2VyZSBkaXNwbGF5ZWQgYXMgJmFtcDsgaW4gdGhlIHNvdXJjZSBodG1sIFxuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYW5jaG9yVGV4dCA9IHRoaXMuZ2V0VXJsKCk7XG5cdFx0XG5cdFx0aWYoIHRoaXMucHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkge1xuXHRcdFx0Ly8gU3RyaXAgb2ZmIGFueSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIGZyb20gdGhlIGFuY2hvciB0ZXh0XG5cdFx0XHRhbmNob3JUZXh0ID0gdGhpcy5zdHJpcFByb3RvY29sUmVsYXRpdmVQcmVmaXgoIGFuY2hvclRleHQgKTtcblx0XHR9XG5cdFx0aWYoIHRoaXMuc3RyaXBQcmVmaXggKSB7XG5cdFx0XHRhbmNob3JUZXh0ID0gdGhpcy5zdHJpcFVybFByZWZpeCggYW5jaG9yVGV4dCApO1xuXHRcdH1cblx0XHRhbmNob3JUZXh0ID0gdGhpcy5yZW1vdmVUcmFpbGluZ1NsYXNoKCBhbmNob3JUZXh0ICk7ICAvLyByZW1vdmUgdHJhaWxpbmcgc2xhc2gsIGlmIHRoZXJlIGlzIG9uZVxuXHRcdFxuXHRcdHJldHVybiBhbmNob3JUZXh0O1xuXHR9LFxuXHRcblx0XG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXHRcblx0Ly8gVXRpbGl0eSBGdW5jdGlvbmFsaXR5XG5cdFxuXHQvKipcblx0ICogU3RyaXBzIHRoZSBVUkwgcHJlZml4IChzdWNoIGFzIFwiaHR0cDovL1wiIG9yIFwiaHR0cHM6Ly9cIikgZnJvbSB0aGUgZ2l2ZW4gdGV4dC5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBhbmNob3IgdGhhdCBpcyBiZWluZyBnZW5lcmF0ZWQsIGZvciB3aGljaCB0byBzdHJpcCBvZmYgdGhlXG5cdCAqICAgdXJsIHByZWZpeCAoc3VjaCBhcyBzdHJpcHBpbmcgb2ZmIFwiaHR0cDovL1wiKVxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBgYW5jaG9yVGV4dGAsIHdpdGggdGhlIHByZWZpeCBzdHJpcHBlZC5cblx0ICovXG5cdHN0cmlwVXJsUHJlZml4IDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIHRleHQucmVwbGFjZSggdGhpcy51cmxQcmVmaXhSZWdleCwgJycgKTtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogU3RyaXBzIGFueSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIGZyb20gdGhlIGFuY2hvciB0ZXh0LlxuXHQgKiBcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgb2YgdGhlIGFuY2hvciB0aGF0IGlzIGJlaW5nIGdlbmVyYXRlZCwgZm9yIHdoaWNoIHRvIHN0cmlwIG9mZiB0aGVcblx0ICogICBwcm90b2NvbC1yZWxhdGl2ZSBwcmVmaXggKHN1Y2ggYXMgc3RyaXBwaW5nIG9mZiBcIi8vXCIpXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGBhbmNob3JUZXh0YCwgd2l0aCB0aGUgcHJvdG9jb2wtcmVsYXRpdmUgcHJlZml4IHN0cmlwcGVkLlxuXHQgKi9cblx0c3RyaXBQcm90b2NvbFJlbGF0aXZlUHJlZml4IDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIHRleHQucmVwbGFjZSggdGhpcy5wcm90b2NvbFJlbGF0aXZlUmVnZXgsICcnICk7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJlbW92ZXMgYW55IHRyYWlsaW5nIHNsYXNoIGZyb20gdGhlIGdpdmVuIGBhbmNob3JUZXh0YCwgaW4gcHJlcGFyYXRpb24gZm9yIHRoZSB0ZXh0IHRvIGJlIGRpc3BsYXllZC5cblx0ICogXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhbmNob3JUZXh0IFRoZSB0ZXh0IG9mIHRoZSBhbmNob3IgdGhhdCBpcyBiZWluZyBnZW5lcmF0ZWQsIGZvciB3aGljaCB0byByZW1vdmUgYW55IHRyYWlsaW5nXG5cdCAqICAgc2xhc2ggKCcvJykgdGhhdCBtYXkgZXhpc3QuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGBhbmNob3JUZXh0YCwgd2l0aCB0aGUgdHJhaWxpbmcgc2xhc2ggcmVtb3ZlZC5cblx0ICovXG5cdHJlbW92ZVRyYWlsaW5nU2xhc2ggOiBmdW5jdGlvbiggYW5jaG9yVGV4dCApIHtcblx0XHRpZiggYW5jaG9yVGV4dC5jaGFyQXQoIGFuY2hvclRleHQubGVuZ3RoIC0gMSApID09PSAnLycgKSB7XG5cdFx0XHRhbmNob3JUZXh0ID0gYW5jaG9yVGV4dC5zbGljZSggMCwgLTEgKTtcblx0XHR9XG5cdFx0cmV0dXJuIGFuY2hvclRleHQ7XG5cdH1cblx0XG59ICk7XG5yZXR1cm4gQXV0b2xpbmtlcjtcblxufSkpO1xuIiwiIiwiOyhmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHQvKipcblx0ICogQHByZXNlcnZlIEZhc3RDbGljazogcG9seWZpbGwgdG8gcmVtb3ZlIGNsaWNrIGRlbGF5cyBvbiBicm93c2VycyB3aXRoIHRvdWNoIFVJcy5cblx0ICpcblx0ICogQGNvZGluZ3N0YW5kYXJkIGZ0bGFicy1qc3YyXG5cdCAqIEBjb3B5cmlnaHQgVGhlIEZpbmFuY2lhbCBUaW1lcyBMaW1pdGVkIFtBbGwgUmlnaHRzIFJlc2VydmVkXVxuXHQgKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoc2VlIExJQ0VOU0UudHh0KVxuXHQgKi9cblxuXHQvKmpzbGludCBicm93c2VyOnRydWUsIG5vZGU6dHJ1ZSovXG5cdC8qZ2xvYmFsIGRlZmluZSwgRXZlbnQsIE5vZGUqL1xuXG5cblx0LyoqXG5cdCAqIEluc3RhbnRpYXRlIGZhc3QtY2xpY2tpbmcgbGlzdGVuZXJzIG9uIHRoZSBzcGVjaWZpZWQgbGF5ZXIuXG5cdCAqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdGZ1bmN0aW9uIEZhc3RDbGljayhsYXllciwgb3B0aW9ucykge1xuXHRcdHZhciBvbGRPbkNsaWNrO1xuXG5cdFx0b3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cblx0XHQvKipcblx0XHQgKiBXaGV0aGVyIGEgY2xpY2sgaXMgY3VycmVudGx5IGJlaW5nIHRyYWNrZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBib29sZWFuXG5cdFx0ICovXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRpbWVzdGFtcCBmb3Igd2hlbiBjbGljayB0cmFja2luZyBzdGFydGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgZWxlbWVudCBiZWluZyB0cmFja2VkIGZvciBhIGNsaWNrLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRXZlbnRUYXJnZXRcblx0XHQgKi9cblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXG5cblx0XHQvKipcblx0XHQgKiBYLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogWS1jb29yZGluYXRlIG9mIHRvdWNoIHN0YXJ0IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIElEIG9mIHRoZSBsYXN0IHRvdWNoLCByZXRyaWV2ZWQgZnJvbSBUb3VjaC5pZGVudGlmaWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVG91Y2htb3ZlIGJvdW5kYXJ5LCBiZXlvbmQgd2hpY2ggYSBjbGljayB3aWxsIGJlIGNhbmNlbGxlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hCb3VuZGFyeSA9IG9wdGlvbnMudG91Y2hCb3VuZGFyeSB8fCAxMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIEZhc3RDbGljayBsYXllci5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIEVsZW1lbnRcblx0XHQgKi9cblx0XHR0aGlzLmxheWVyID0gbGF5ZXI7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbWluaW11bSB0aW1lIGJldHdlZW4gdGFwKHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kKSBldmVudHNcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwRGVsYXkgPSBvcHRpb25zLnRhcERlbGF5IHx8IDIwMDtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtYXhpbXVtIHRpbWUgZm9yIGEgdGFwXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRhcFRpbWVvdXQgPSBvcHRpb25zLnRhcFRpbWVvdXQgfHwgNzAwO1xuXG5cdFx0aWYgKEZhc3RDbGljay5ub3ROZWVkZWQobGF5ZXIpKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXG5cdFx0Ly8gU29tZSBvbGQgdmVyc2lvbnMgb2YgQW5kcm9pZCBkb24ndCBoYXZlIEZ1bmN0aW9uLnByb3RvdHlwZS5iaW5kXG5cdFx0ZnVuY3Rpb24gYmluZChtZXRob2QsIGNvbnRleHQpIHtcblx0XHRcdHJldHVybiBmdW5jdGlvbigpIHsgcmV0dXJuIG1ldGhvZC5hcHBseShjb250ZXh0LCBhcmd1bWVudHMpOyB9O1xuXHRcdH1cblxuXG5cdFx0dmFyIG1ldGhvZHMgPSBbJ29uTW91c2UnLCAnb25DbGljaycsICdvblRvdWNoU3RhcnQnLCAnb25Ub3VjaE1vdmUnLCAnb25Ub3VjaEVuZCcsICdvblRvdWNoQ2FuY2VsJ107XG5cdFx0dmFyIGNvbnRleHQgPSB0aGlzO1xuXHRcdGZvciAodmFyIGkgPSAwLCBsID0gbWV0aG9kcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0XHRcdGNvbnRleHRbbWV0aG9kc1tpXV0gPSBiaW5kKGNvbnRleHRbbWV0aG9kc1tpXV0sIGNvbnRleHQpO1xuXHRcdH1cblxuXHRcdC8vIFNldCB1cCBldmVudCBoYW5kbGVycyBhcyByZXF1aXJlZFxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cblx0XHQvLyBIYWNrIGlzIHJlcXVpcmVkIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHQvLyB3aGljaCBpcyBob3cgRmFzdENsaWNrIG5vcm1hbGx5IHN0b3BzIGNsaWNrIGV2ZW50cyBidWJibGluZyB0byBjYWxsYmFja3MgcmVnaXN0ZXJlZCBvbiB0aGUgRmFzdENsaWNrXG5cdFx0Ly8gbGF5ZXIgd2hlbiB0aGV5IGFyZSBjYW5jZWxsZWQuXG5cdFx0aWYgKCFFdmVudC5wcm90b3R5cGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcblx0XHRcdFx0dmFyIHJtdiA9IE5vZGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG5cdFx0XHRcdGlmICh0eXBlID09PSAnY2xpY2snKSB7XG5cdFx0XHRcdFx0cm12LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLmhpamFja2VkIHx8IGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpIHtcblx0XHRcdFx0dmFyIGFkdiA9IE5vZGUucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXI7XG5cdFx0XHRcdGlmICh0eXBlID09PSAnY2xpY2snKSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLmhpamFja2VkIHx8IChjYWxsYmFjay5oaWphY2tlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdFx0XHRpZiAoIWV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCkge1xuXHRcdFx0XHRcdFx0XHRjYWxsYmFjayhldmVudCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSksIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGFkdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gSWYgYSBoYW5kbGVyIGlzIGFscmVhZHkgZGVjbGFyZWQgaW4gdGhlIGVsZW1lbnQncyBvbmNsaWNrIGF0dHJpYnV0ZSwgaXQgd2lsbCBiZSBmaXJlZCBiZWZvcmVcblx0XHQvLyBGYXN0Q2xpY2sncyBvbkNsaWNrIGhhbmRsZXIuIEZpeCB0aGlzIGJ5IHB1bGxpbmcgb3V0IHRoZSB1c2VyLWRlZmluZWQgaGFuZGxlciBmdW5jdGlvbiBhbmRcblx0XHQvLyBhZGRpbmcgaXQgYXMgbGlzdGVuZXIuXG5cdFx0aWYgKHR5cGVvZiBsYXllci5vbmNsaWNrID09PSAnZnVuY3Rpb24nKSB7XG5cblx0XHRcdC8vIEFuZHJvaWQgYnJvd3NlciBvbiBhdCBsZWFzdCAzLjIgcmVxdWlyZXMgYSBuZXcgcmVmZXJlbmNlIHRvIHRoZSBmdW5jdGlvbiBpbiBsYXllci5vbmNsaWNrXG5cdFx0XHQvLyAtIHRoZSBvbGQgb25lIHdvbid0IHdvcmsgaWYgcGFzc2VkIHRvIGFkZEV2ZW50TGlzdGVuZXIgZGlyZWN0bHkuXG5cdFx0XHRvbGRPbkNsaWNrID0gbGF5ZXIub25jbGljaztcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0b2xkT25DbGljayhldmVudCk7XG5cdFx0XHR9LCBmYWxzZSk7XG5cdFx0XHRsYXllci5vbmNsaWNrID0gbnVsbDtcblx0XHR9XG5cdH1cblxuXHQvKipcblx0KiBXaW5kb3dzIFBob25lIDguMSBmYWtlcyB1c2VyIGFnZW50IHN0cmluZyB0byBsb29rIGxpa2UgQW5kcm9pZCBhbmQgaVBob25lLlxuXHQqXG5cdCogQHR5cGUgYm9vbGVhblxuXHQqL1xuXHR2YXIgZGV2aWNlSXNXaW5kb3dzUGhvbmUgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoXCJXaW5kb3dzIFBob25lXCIpID49IDA7XG5cblx0LyoqXG5cdCAqIEFuZHJvaWQgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzQW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpID4gMCAmJiAhZGV2aWNlSXNXaW5kb3dzUGhvbmU7XG5cblxuXHQvKipcblx0ICogaU9TIHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPUyA9IC9pUChhZHxob25lfG9kKS8udGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSAmJiAhZGV2aWNlSXNXaW5kb3dzUGhvbmU7XG5cblxuXHQvKipcblx0ICogaU9TIDQgcmVxdWlyZXMgYW4gZXhjZXB0aW9uIGZvciBzZWxlY3QgZWxlbWVudHMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPUzQgPSBkZXZpY2VJc0lPUyAmJiAoL09TIDRfXFxkKF9cXGQpPy8pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cblxuXHQvKipcblx0ICogaU9TIDYuMC03LiogcmVxdWlyZXMgdGhlIHRhcmdldCBlbGVtZW50IHRvIGJlIG1hbnVhbGx5IGRlcml2ZWRcblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCA9IGRldmljZUlzSU9TICYmICgvT1MgWzYtN11fXFxkLykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXHQvKipcblx0ICogQmxhY2tCZXJyeSByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNCbGFja0JlcnJ5MTAgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0JCMTAnKSA+IDA7XG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIG5hdGl2ZSBjbGljay5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXQgVGFyZ2V0IERPTSBlbGVtZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgbmVlZHMgYSBuYXRpdmUgY2xpY2tcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUubmVlZHNDbGljayA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHRcdHN3aXRjaCAodGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcblxuXHRcdC8vIERvbid0IHNlbmQgYSBzeW50aGV0aWMgY2xpY2sgdG8gZGlzYWJsZWQgaW5wdXRzIChpc3N1ZSAjNjIpXG5cdFx0Y2FzZSAnYnV0dG9uJzpcblx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdGlmICh0YXJnZXQuZGlzYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2lucHV0JzpcblxuXHRcdFx0Ly8gRmlsZSBpbnB1dHMgbmVlZCByZWFsIGNsaWNrcyBvbiBpT1MgNiBkdWUgdG8gYSBicm93c2VyIGJ1ZyAoaXNzdWUgIzY4KVxuXHRcdFx0aWYgKChkZXZpY2VJc0lPUyAmJiB0YXJnZXQudHlwZSA9PT0gJ2ZpbGUnKSB8fCB0YXJnZXQuZGlzYWJsZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGJyZWFrO1xuXHRcdGNhc2UgJ2xhYmVsJzpcblx0XHRjYXNlICdpZnJhbWUnOiAvLyBpT1M4IGhvbWVzY3JlZW4gYXBwcyBjYW4gcHJldmVudCBldmVudHMgYnViYmxpbmcgaW50byBmcmFtZXNcblx0XHRjYXNlICd2aWRlbyc6XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gKC9cXGJuZWVkc2NsaWNrXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hldGhlciBhIGdpdmVuIGVsZW1lbnQgcmVxdWlyZXMgYSBjYWxsIHRvIGZvY3VzIHRvIHNpbXVsYXRlIGNsaWNrIGludG8gZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXQgVGFyZ2V0IERPTSBlbGVtZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufSBSZXR1cm5zIHRydWUgaWYgdGhlIGVsZW1lbnQgcmVxdWlyZXMgYSBjYWxsIHRvIGZvY3VzIHRvIHNpbXVsYXRlIG5hdGl2ZSBjbGljay5cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUubmVlZHNGb2N1cyA9IGZ1bmN0aW9uKHRhcmdldCkge1xuXHRcdHN3aXRjaCAodGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkpIHtcblx0XHRjYXNlICd0ZXh0YXJlYSc6XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRjYXNlICdzZWxlY3QnOlxuXHRcdFx0cmV0dXJuICFkZXZpY2VJc0FuZHJvaWQ7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXHRcdFx0c3dpdGNoICh0YXJnZXQudHlwZSkge1xuXHRcdFx0Y2FzZSAnYnV0dG9uJzpcblx0XHRcdGNhc2UgJ2NoZWNrYm94Jzpcblx0XHRcdGNhc2UgJ2ZpbGUnOlxuXHRcdFx0Y2FzZSAnaW1hZ2UnOlxuXHRcdFx0Y2FzZSAncmFkaW8nOlxuXHRcdFx0Y2FzZSAnc3VibWl0Jzpcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBObyBwb2ludCBpbiBhdHRlbXB0aW5nIHRvIGZvY3VzIGRpc2FibGVkIGlucHV0c1xuXHRcdFx0cmV0dXJuICF0YXJnZXQuZGlzYWJsZWQgJiYgIXRhcmdldC5yZWFkT25seTtcblx0XHRkZWZhdWx0OlxuXHRcdFx0cmV0dXJuICgvXFxibmVlZHNmb2N1c1xcYi8pLnRlc3QodGFyZ2V0LmNsYXNzTmFtZSk7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFNlbmQgYSBjbGljayBldmVudCB0byB0aGUgc3BlY2lmaWVkIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5zZW5kQ2xpY2sgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50LCBldmVudCkge1xuXHRcdHZhciBjbGlja0V2ZW50LCB0b3VjaDtcblxuXHRcdC8vIE9uIHNvbWUgQW5kcm9pZCBkZXZpY2VzIGFjdGl2ZUVsZW1lbnQgbmVlZHMgdG8gYmUgYmx1cnJlZCBvdGhlcndpc2UgdGhlIHN5bnRoZXRpYyBjbGljayB3aWxsIGhhdmUgbm8gZWZmZWN0ICgjMjQpXG5cdFx0aWYgKGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgJiYgZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0ZG9jdW1lbnQuYWN0aXZlRWxlbWVudC5ibHVyKCk7XG5cdFx0fVxuXG5cdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdC8vIFN5bnRoZXNpc2UgYSBjbGljayBldmVudCwgd2l0aCBhbiBleHRyYSBhdHRyaWJ1dGUgc28gaXQgY2FuIGJlIHRyYWNrZWRcblx0XHRjbGlja0V2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ01vdXNlRXZlbnRzJyk7XG5cdFx0Y2xpY2tFdmVudC5pbml0TW91c2VFdmVudCh0aGlzLmRldGVybWluZUV2ZW50VHlwZSh0YXJnZXRFbGVtZW50KSwgdHJ1ZSwgdHJ1ZSwgd2luZG93LCAxLCB0b3VjaC5zY3JlZW5YLCB0b3VjaC5zY3JlZW5ZLCB0b3VjaC5jbGllbnRYLCB0b3VjaC5jbGllbnRZLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgbnVsbCk7XG5cdFx0Y2xpY2tFdmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50ID0gdHJ1ZTtcblx0XHR0YXJnZXRFbGVtZW50LmRpc3BhdGNoRXZlbnQoY2xpY2tFdmVudCk7XG5cdH07XG5cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXRlcm1pbmVFdmVudFR5cGUgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cblx0XHQvL0lzc3VlICMxNTk6IEFuZHJvaWQgQ2hyb21lIFNlbGVjdCBCb3ggZG9lcyBub3Qgb3BlbiB3aXRoIGEgc3ludGhldGljIGNsaWNrIGV2ZW50XG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCAmJiB0YXJnZXRFbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKSA9PT0gJ3NlbGVjdCcpIHtcblx0XHRcdHJldHVybiAnbW91c2Vkb3duJztcblx0XHR9XG5cblx0XHRyZXR1cm4gJ2NsaWNrJztcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZm9jdXMgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIGxlbmd0aDtcblxuXHRcdC8vIElzc3VlICMxNjA6IG9uIGlPUyA3LCBzb21lIGlucHV0IGVsZW1lbnRzIChlLmcuIGRhdGUgZGF0ZXRpbWUgbW9udGgpIHRocm93IGEgdmFndWUgVHlwZUVycm9yIG9uIHNldFNlbGVjdGlvblJhbmdlLiBUaGVzZSBlbGVtZW50cyBkb24ndCBoYXZlIGFuIGludGVnZXIgdmFsdWUgZm9yIHRoZSBzZWxlY3Rpb25TdGFydCBhbmQgc2VsZWN0aW9uRW5kIHByb3BlcnRpZXMsIGJ1dCB1bmZvcnR1bmF0ZWx5IHRoYXQgY2FuJ3QgYmUgdXNlZCBmb3IgZGV0ZWN0aW9uIGJlY2F1c2UgYWNjZXNzaW5nIHRoZSBwcm9wZXJ0aWVzIGFsc28gdGhyb3dzIGEgVHlwZUVycm9yLiBKdXN0IGNoZWNrIHRoZSB0eXBlIGluc3RlYWQuIEZpbGVkIGFzIEFwcGxlIGJ1ZyAjMTUxMjI3MjQuXG5cdFx0aWYgKGRldmljZUlzSU9TICYmIHRhcmdldEVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UgJiYgdGFyZ2V0RWxlbWVudC50eXBlLmluZGV4T2YoJ2RhdGUnKSAhPT0gMCAmJiB0YXJnZXRFbGVtZW50LnR5cGUgIT09ICd0aW1lJyAmJiB0YXJnZXRFbGVtZW50LnR5cGUgIT09ICdtb250aCcpIHtcblx0XHRcdGxlbmd0aCA9IHRhcmdldEVsZW1lbnQudmFsdWUubGVuZ3RoO1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZShsZW5ndGgsIGxlbmd0aCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRhcmdldEVsZW1lbnQuZm9jdXMoKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciB0aGUgZ2l2ZW4gdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiBhIHNjcm9sbGFibGUgbGF5ZXIgYW5kIGlmIHNvLCBzZXQgYSBmbGFnIG9uIGl0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudXBkYXRlU2Nyb2xsUGFyZW50ID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXHRcdHZhciBzY3JvbGxQYXJlbnQsIHBhcmVudEVsZW1lbnQ7XG5cblx0XHRzY3JvbGxQYXJlbnQgPSB0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblxuXHRcdC8vIEF0dGVtcHQgdG8gZGlzY292ZXIgd2hldGhlciB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgY29udGFpbmVkIHdpdGhpbiBhIHNjcm9sbGFibGUgbGF5ZXIuIFJlLWNoZWNrIGlmIHRoZVxuXHRcdC8vIHRhcmdldCBlbGVtZW50IHdhcyBtb3ZlZCB0byBhbm90aGVyIHBhcmVudC5cblx0XHRpZiAoIXNjcm9sbFBhcmVudCB8fCAhc2Nyb2xsUGFyZW50LmNvbnRhaW5zKHRhcmdldEVsZW1lbnQpKSB7XG5cdFx0XHRwYXJlbnRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblx0XHRcdGRvIHtcblx0XHRcdFx0aWYgKHBhcmVudEVsZW1lbnQuc2Nyb2xsSGVpZ2h0ID4gcGFyZW50RWxlbWVudC5vZmZzZXRIZWlnaHQpIHtcblx0XHRcdFx0XHRzY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gcGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQgPSBwYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG5cdFx0XHR9IHdoaWxlIChwYXJlbnRFbGVtZW50KTtcblx0XHR9XG5cblx0XHQvLyBBbHdheXMgdXBkYXRlIHRoZSBzY3JvbGwgdG9wIHRyYWNrZXIgaWYgcG9zc2libGUuXG5cdFx0aWYgKHNjcm9sbFBhcmVudCkge1xuXHRcdFx0c2Nyb2xsUGFyZW50LmZhc3RDbGlja0xhc3RTY3JvbGxUb3AgPSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fSB0YXJnZXRFbGVtZW50XG5cdCAqIEByZXR1cm5zIHtFbGVtZW50fEV2ZW50VGFyZ2V0fVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0ID0gZnVuY3Rpb24oZXZlbnRUYXJnZXQpIHtcblxuXHRcdC8vIE9uIHNvbWUgb2xkZXIgYnJvd3NlcnMgKG5vdGFibHkgU2FmYXJpIG9uIGlPUyA0LjEgLSBzZWUgaXNzdWUgIzU2KSB0aGUgZXZlbnQgdGFyZ2V0IG1heSBiZSBhIHRleHQgbm9kZS5cblx0XHRpZiAoZXZlbnRUYXJnZXQubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFKSB7XG5cdFx0XHRyZXR1cm4gZXZlbnRUYXJnZXQucGFyZW50Tm9kZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZXZlbnRUYXJnZXQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggc3RhcnQsIHJlY29yZCB0aGUgcG9zaXRpb24gYW5kIHNjcm9sbCBvZmZzZXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoU3RhcnQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciB0YXJnZXRFbGVtZW50LCB0b3VjaCwgc2VsZWN0aW9uO1xuXG5cdFx0Ly8gSWdub3JlIG11bHRpcGxlIHRvdWNoZXMsIG90aGVyd2lzZSBwaW5jaC10by16b29tIGlzIHByZXZlbnRlZCBpZiBib3RoIGZpbmdlcnMgYXJlIG9uIHRoZSBGYXN0Q2xpY2sgZWxlbWVudCAoaXNzdWUgIzExMSkuXG5cdFx0aWYgKGV2ZW50LnRhcmdldFRvdWNoZXMubGVuZ3RoID4gMSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0dGFyZ2V0RWxlbWVudCA9IHRoaXMuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldChldmVudC50YXJnZXQpO1xuXHRcdHRvdWNoID0gZXZlbnQudGFyZ2V0VG91Y2hlc1swXTtcblxuXHRcdGlmIChkZXZpY2VJc0lPUykge1xuXG5cdFx0XHQvLyBPbmx5IHRydXN0ZWQgZXZlbnRzIHdpbGwgZGVzZWxlY3QgdGV4dCBvbiBpT1MgKGlzc3VlICM0OSlcblx0XHRcdHNlbGVjdGlvbiA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcblx0XHRcdGlmIChzZWxlY3Rpb24ucmFuZ2VDb3VudCAmJiAhc2VsZWN0aW9uLmlzQ29sbGFwc2VkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHRcdC8vIFdlaXJkIHRoaW5ncyBoYXBwZW4gb24gaU9TIHdoZW4gYW4gYWxlcnQgb3IgY29uZmlybSBkaWFsb2cgaXMgb3BlbmVkIGZyb20gYSBjbGljayBldmVudCBjYWxsYmFjayAoaXNzdWUgIzIzKTpcblx0XHRcdFx0Ly8gd2hlbiB0aGUgdXNlciBuZXh0IHRhcHMgYW55d2hlcmUgZWxzZSBvbiB0aGUgcGFnZSwgbmV3IHRvdWNoc3RhcnQgYW5kIHRvdWNoZW5kIGV2ZW50cyBhcmUgZGlzcGF0Y2hlZFxuXHRcdFx0XHQvLyB3aXRoIHRoZSBzYW1lIGlkZW50aWZpZXIgYXMgdGhlIHRvdWNoIGV2ZW50IHRoYXQgcHJldmlvdXNseSB0cmlnZ2VyZWQgdGhlIGNsaWNrIHRoYXQgdHJpZ2dlcmVkIHRoZSBhbGVydC5cblx0XHRcdFx0Ly8gU2FkbHksIHRoZXJlIGlzIGFuIGlzc3VlIG9uIGlPUyA0IHRoYXQgY2F1c2VzIHNvbWUgbm9ybWFsIHRvdWNoIGV2ZW50cyB0byBoYXZlIHRoZSBzYW1lIGlkZW50aWZpZXIgYXMgYW5cblx0XHRcdFx0Ly8gaW1tZWRpYXRlbHkgcHJlY2VlZGluZyB0b3VjaCBldmVudCAoaXNzdWUgIzUyKSwgc28gdGhpcyBmaXggaXMgdW5hdmFpbGFibGUgb24gdGhhdCBwbGF0Zm9ybS5cblx0XHRcdFx0Ly8gSXNzdWUgMTIwOiB0b3VjaC5pZGVudGlmaWVyIGlzIDAgd2hlbiBDaHJvbWUgZGV2IHRvb2xzICdFbXVsYXRlIHRvdWNoIGV2ZW50cycgaXMgc2V0IHdpdGggYW4gaU9TIGRldmljZSBVQSBzdHJpbmcsXG5cdFx0XHRcdC8vIHdoaWNoIGNhdXNlcyBhbGwgdG91Y2ggZXZlbnRzIHRvIGJlIGlnbm9yZWQuIEFzIHRoaXMgYmxvY2sgb25seSBhcHBsaWVzIHRvIGlPUywgYW5kIGlPUyBpZGVudGlmaWVycyBhcmUgYWx3YXlzIGxvbmcsXG5cdFx0XHRcdC8vIHJhbmRvbSBpbnRlZ2VycywgaXQncyBzYWZlIHRvIHRvIGNvbnRpbnVlIGlmIHRoZSBpZGVudGlmaWVyIGlzIDAgaGVyZS5cblx0XHRcdFx0aWYgKHRvdWNoLmlkZW50aWZpZXIgJiYgdG91Y2guaWRlbnRpZmllciA9PT0gdGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyKSB7XG5cdFx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSB0b3VjaC5pZGVudGlmaWVyO1xuXG5cdFx0XHRcdC8vIElmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciAodXNpbmcgLXdlYmtpdC1vdmVyZmxvdy1zY3JvbGxpbmc6IHRvdWNoKSBhbmQ6XG5cdFx0XHRcdC8vIDEpIHRoZSB1c2VyIGRvZXMgYSBmbGluZyBzY3JvbGwgb24gdGhlIHNjcm9sbGFibGUgbGF5ZXJcblx0XHRcdFx0Ly8gMikgdGhlIHVzZXIgc3RvcHMgdGhlIGZsaW5nIHNjcm9sbCB3aXRoIGFub3RoZXIgdGFwXG5cdFx0XHRcdC8vIHRoZW4gdGhlIGV2ZW50LnRhcmdldCBvZiB0aGUgbGFzdCAndG91Y2hlbmQnIGV2ZW50IHdpbGwgYmUgdGhlIGVsZW1lbnQgdGhhdCB3YXMgdW5kZXIgdGhlIHVzZXIncyBmaW5nZXJcblx0XHRcdFx0Ly8gd2hlbiB0aGUgZmxpbmcgc2Nyb2xsIHdhcyBzdGFydGVkLCBjYXVzaW5nIEZhc3RDbGljayB0byBzZW5kIGEgY2xpY2sgZXZlbnQgdG8gdGhhdCBsYXllciAtIHVubGVzcyBhIGNoZWNrXG5cdFx0XHRcdC8vIGlzIG1hZGUgdG8gZW5zdXJlIHRoYXQgYSBwYXJlbnQgbGF5ZXIgd2FzIG5vdCBzY3JvbGxlZCBiZWZvcmUgc2VuZGluZyBhIHN5bnRoZXRpYyBjbGljayAoaXNzdWUgIzQyKS5cblx0XHRcdFx0dGhpcy51cGRhdGVTY3JvbGxQYXJlbnQodGFyZ2V0RWxlbWVudCk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gdHJ1ZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IGV2ZW50LnRpbWVTdGFtcDtcblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXG5cdFx0dGhpcy50b3VjaFN0YXJ0WCA9IHRvdWNoLnBhZ2VYO1xuXHRcdHRoaXMudG91Y2hTdGFydFkgPSB0b3VjaC5wYWdlWTtcblxuXHRcdC8vIFByZXZlbnQgcGhhbnRvbSBjbGlja3Mgb24gZmFzdCBkb3VibGUtdGFwIChpc3N1ZSAjMzYpXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLmxhc3RDbGlja1RpbWUpIDwgdGhpcy50YXBEZWxheSkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBCYXNlZCBvbiBhIHRvdWNobW92ZSBldmVudCBvYmplY3QsIGNoZWNrIHdoZXRoZXIgdGhlIHRvdWNoIGhhcyBtb3ZlZCBwYXN0IGEgYm91bmRhcnkgc2luY2UgaXQgc3RhcnRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnRvdWNoSGFzTW92ZWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciB0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdLCBib3VuZGFyeSA9IHRoaXMudG91Y2hCb3VuZGFyeTtcblxuXHRcdGlmIChNYXRoLmFicyh0b3VjaC5wYWdlWCAtIHRoaXMudG91Y2hTdGFydFgpID4gYm91bmRhcnkgfHwgTWF0aC5hYnModG91Y2gucGFnZVkgLSB0aGlzLnRvdWNoU3RhcnRZKSA+IGJvdW5kYXJ5KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogVXBkYXRlIHRoZSBsYXN0IHBvc2l0aW9uLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaE1vdmUgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdGlmICghdGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgdG91Y2ggaGFzIG1vdmVkLCBjYW5jZWwgdGhlIGNsaWNrIHRyYWNraW5nXG5cdFx0aWYgKHRoaXMudGFyZ2V0RWxlbWVudCAhPT0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCkgfHwgdGhpcy50b3VjaEhhc01vdmVkKGV2ZW50KSkge1xuXHRcdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEF0dGVtcHQgdG8gZmluZCB0aGUgbGFiZWxsZWQgY29udHJvbCBmb3IgdGhlIGdpdmVuIGxhYmVsIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8SFRNTExhYmVsRWxlbWVudH0gbGFiZWxFbGVtZW50XG5cdCAqIEByZXR1cm5zIHtFbGVtZW50fG51bGx9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmZpbmRDb250cm9sID0gZnVuY3Rpb24obGFiZWxFbGVtZW50KSB7XG5cblx0XHQvLyBGYXN0IHBhdGggZm9yIG5ld2VyIGJyb3dzZXJzIHN1cHBvcnRpbmcgdGhlIEhUTUw1IGNvbnRyb2wgYXR0cmlidXRlXG5cdFx0aWYgKGxhYmVsRWxlbWVudC5jb250cm9sICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHJldHVybiBsYWJlbEVsZW1lbnQuY29udHJvbDtcblx0XHR9XG5cblx0XHQvLyBBbGwgYnJvd3NlcnMgdW5kZXIgdGVzdCB0aGF0IHN1cHBvcnQgdG91Y2ggZXZlbnRzIGFsc28gc3VwcG9ydCB0aGUgSFRNTDUgaHRtbEZvciBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50Lmh0bWxGb3IpIHtcblx0XHRcdHJldHVybiBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChsYWJlbEVsZW1lbnQuaHRtbEZvcik7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgbm8gZm9yIGF0dHJpYnV0ZSBleGlzdHMsIGF0dGVtcHQgdG8gcmV0cmlldmUgdGhlIGZpcnN0IGxhYmVsbGFibGUgZGVzY2VuZGFudCBlbGVtZW50XG5cdFx0Ly8gdGhlIGxpc3Qgb2Ygd2hpY2ggaXMgZGVmaW5lZCBoZXJlOiBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sNS9mb3Jtcy5odG1sI2NhdGVnb3J5LWxhYmVsXG5cdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5xdWVyeVNlbGVjdG9yKCdidXR0b24sIGlucHV0Om5vdChbdHlwZT1oaWRkZW5dKSwga2V5Z2VuLCBtZXRlciwgb3V0cHV0LCBwcm9ncmVzcywgc2VsZWN0LCB0ZXh0YXJlYScpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGVuZCwgZGV0ZXJtaW5lIHdoZXRoZXIgdG8gc2VuZCBhIGNsaWNrIGV2ZW50IGF0IG9uY2UuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoRW5kID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgZm9yRWxlbWVudCwgdHJhY2tpbmdDbGlja1N0YXJ0LCB0YXJnZXRUYWdOYW1lLCBzY3JvbGxQYXJlbnQsIHRvdWNoLCB0YXJnZXRFbGVtZW50ID0gdGhpcy50YXJnZXRFbGVtZW50O1xuXG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgcGhhbnRvbSBjbGlja3Mgb24gZmFzdCBkb3VibGUtdGFwIChpc3N1ZSAjMzYpXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLmxhc3RDbGlja1RpbWUpIDwgdGhpcy50YXBEZWxheSkge1xuXHRcdFx0dGhpcy5jYW5jZWxOZXh0Q2xpY2sgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCkgPiB0aGlzLnRhcFRpbWVvdXQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFJlc2V0IHRvIHByZXZlbnQgd3JvbmcgY2xpY2sgY2FuY2VsIG9uIGlucHV0IChpc3N1ZSAjMTU2KS5cblx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IGZhbHNlO1xuXG5cdFx0dGhpcy5sYXN0Q2xpY2tUaW1lID0gZXZlbnQudGltZVN0YW1wO1xuXG5cdFx0dHJhY2tpbmdDbGlja1N0YXJ0ID0gdGhpcy50cmFja2luZ0NsaWNrU3RhcnQ7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSAwO1xuXG5cdFx0Ly8gT24gc29tZSBpT1MgZGV2aWNlcywgdGhlIHRhcmdldEVsZW1lbnQgc3VwcGxpZWQgd2l0aCB0aGUgZXZlbnQgaXMgaW52YWxpZCBpZiB0aGUgbGF5ZXJcblx0XHQvLyBpcyBwZXJmb3JtaW5nIGEgdHJhbnNpdGlvbiBvciBzY3JvbGwsIGFuZCBoYXMgdG8gYmUgcmUtZGV0ZWN0ZWQgbWFudWFsbHkuIE5vdGUgdGhhdFxuXHRcdC8vIGZvciB0aGlzIHRvIGZ1bmN0aW9uIGNvcnJlY3RseSwgaXQgbXVzdCBiZSBjYWxsZWQgKmFmdGVyKiB0aGUgZXZlbnQgdGFyZ2V0IGlzIGNoZWNrZWQhXG5cdFx0Ly8gU2VlIGlzc3VlICM1NzsgYWxzbyBmaWxlZCBhcyByZGFyOi8vMTMwNDg1ODkgLlxuXHRcdGlmIChkZXZpY2VJc0lPU1dpdGhCYWRUYXJnZXQpIHtcblx0XHRcdHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHRcdC8vIEluIGNlcnRhaW4gY2FzZXMgYXJndW1lbnRzIG9mIGVsZW1lbnRGcm9tUG9pbnQgY2FuIGJlIG5lZ2F0aXZlLCBzbyBwcmV2ZW50IHNldHRpbmcgdGFyZ2V0RWxlbWVudCB0byBudWxsXG5cdFx0XHR0YXJnZXRFbGVtZW50ID0gZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh0b3VjaC5wYWdlWCAtIHdpbmRvdy5wYWdlWE9mZnNldCwgdG91Y2gucGFnZVkgLSB3aW5kb3cucGFnZVlPZmZzZXQpIHx8IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHR0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudCA9IHRoaXMudGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0fVxuXG5cdFx0dGFyZ2V0VGFnTmFtZSA9IHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmICh0YXJnZXRUYWdOYW1lID09PSAnbGFiZWwnKSB7XG5cdFx0XHRmb3JFbGVtZW50ID0gdGhpcy5maW5kQ29udHJvbCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdGlmIChmb3JFbGVtZW50KSB7XG5cdFx0XHRcdHRoaXMuZm9jdXModGFyZ2V0RWxlbWVudCk7XG5cdFx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHR0YXJnZXRFbGVtZW50ID0gZm9yRWxlbWVudDtcblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHRoaXMubmVlZHNGb2N1cyh0YXJnZXRFbGVtZW50KSkge1xuXG5cdFx0XHQvLyBDYXNlIDE6IElmIHRoZSB0b3VjaCBzdGFydGVkIGEgd2hpbGUgYWdvIChiZXN0IGd1ZXNzIGlzIDEwMG1zIGJhc2VkIG9uIHRlc3RzIGZvciBpc3N1ZSAjMzYpIHRoZW4gZm9jdXMgd2lsbCBiZSB0cmlnZ2VyZWQgYW55d2F5LiBSZXR1cm4gZWFybHkgYW5kIHVuc2V0IHRoZSB0YXJnZXQgZWxlbWVudCByZWZlcmVuY2Ugc28gdGhhdCB0aGUgc3Vic2VxdWVudCBjbGljayB3aWxsIGJlIGFsbG93ZWQgdGhyb3VnaC5cblx0XHRcdC8vIENhc2UgMjogV2l0aG91dCB0aGlzIGV4Y2VwdGlvbiBmb3IgaW5wdXQgZWxlbWVudHMgdGFwcGVkIHdoZW4gdGhlIGRvY3VtZW50IGlzIGNvbnRhaW5lZCBpbiBhbiBpZnJhbWUsIHRoZW4gYW55IGlucHV0dGVkIHRleHQgd29uJ3QgYmUgdmlzaWJsZSBldmVuIHRob3VnaCB0aGUgdmFsdWUgYXR0cmlidXRlIGlzIHVwZGF0ZWQgYXMgdGhlIHVzZXIgdHlwZXMgKGlzc3VlICMzNykuXG5cdFx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRyYWNraW5nQ2xpY2tTdGFydCkgPiAxMDAgfHwgKGRldmljZUlzSU9TICYmIHdpbmRvdy50b3AgIT09IHdpbmRvdyAmJiB0YXJnZXRUYWdOYW1lID09PSAnaW5wdXQnKSkge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuZm9jdXModGFyZ2V0RWxlbWVudCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cblx0XHRcdC8vIFNlbGVjdCBlbGVtZW50cyBuZWVkIHRoZSBldmVudCB0byBnbyB0aHJvdWdoIG9uIGlPUyA0LCBvdGhlcndpc2UgdGhlIHNlbGVjdG9yIG1lbnUgd29uJ3Qgb3Blbi5cblx0XHRcdC8vIEFsc28gdGhpcyBicmVha3Mgb3BlbmluZyBzZWxlY3RzIHdoZW4gVm9pY2VPdmVyIGlzIGFjdGl2ZSBvbiBpT1M2LCBpT1M3IChhbmQgcG9zc2libHkgb3RoZXJzKVxuXHRcdFx0aWYgKCFkZXZpY2VJc0lPUyB8fCB0YXJnZXRUYWdOYW1lICE9PSAnc2VsZWN0Jykge1xuXHRcdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzSU9TICYmICFkZXZpY2VJc0lPUzQpIHtcblxuXHRcdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayBldmVudCBpZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgY29udGFpbmVkIHdpdGhpbiBhIHBhcmVudCBsYXllciB0aGF0IHdhcyBzY3JvbGxlZFxuXHRcdFx0Ly8gYW5kIHRoaXMgdGFwIGlzIGJlaW5nIHVzZWQgdG8gc3RvcCB0aGUgc2Nyb2xsaW5nICh1c3VhbGx5IGluaXRpYXRlZCBieSBhIGZsaW5nIC0gaXNzdWUgIzQyKS5cblx0XHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXHRcdFx0aWYgKHNjcm9sbFBhcmVudCAmJiBzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCAhPT0gc2Nyb2xsUGFyZW50LnNjcm9sbFRvcCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBQcmV2ZW50IHRoZSBhY3R1YWwgY2xpY2sgZnJvbSBnb2luZyB0aG91Z2ggLSB1bmxlc3MgdGhlIHRhcmdldCBub2RlIGlzIG1hcmtlZCBhcyByZXF1aXJpbmdcblx0XHQvLyByZWFsIGNsaWNrcyBvciBpZiBpdCBpcyBpbiB0aGUgd2hpdGVsaXN0IGluIHdoaWNoIGNhc2Ugb25seSBub24tcHJvZ3JhbW1hdGljIGNsaWNrcyBhcmUgcGVybWl0dGVkLlxuXHRcdGlmICghdGhpcy5uZWVkc0NsaWNrKHRhcmdldEVsZW1lbnQpKSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5zZW5kQ2xpY2sodGFyZ2V0RWxlbWVudCwgZXZlbnQpO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBjYW5jZWwsIHN0b3AgdHJhY2tpbmcgdGhlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaENhbmNlbCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdH07XG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIG1vdXNlIGV2ZW50cyB3aGljaCBzaG91bGQgYmUgcGVybWl0dGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Nb3VzZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cblx0XHQvLyBJZiBhIHRhcmdldCBlbGVtZW50IHdhcyBuZXZlciBzZXQgKGJlY2F1c2UgYSB0b3VjaCBldmVudCB3YXMgbmV2ZXIgZmlyZWQpIGFsbG93IHRoZSBldmVudFxuXHRcdGlmICghdGhpcy50YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoZXZlbnQuZm9yd2FyZGVkVG91Y2hFdmVudCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJvZ3JhbW1hdGljYWxseSBnZW5lcmF0ZWQgZXZlbnRzIHRhcmdldGluZyBhIHNwZWNpZmljIGVsZW1lbnQgc2hvdWxkIGJlIHBlcm1pdHRlZFxuXHRcdGlmICghZXZlbnQuY2FuY2VsYWJsZSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gRGVyaXZlIGFuZCBjaGVjayB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gc2VlIHdoZXRoZXIgdGhlIG1vdXNlIGV2ZW50IG5lZWRzIHRvIGJlIHBlcm1pdHRlZDtcblx0XHQvLyB1bmxlc3MgZXhwbGljaXRseSBlbmFibGVkLCBwcmV2ZW50IG5vbi10b3VjaCBjbGljayBldmVudHMgZnJvbSB0cmlnZ2VyaW5nIGFjdGlvbnMsXG5cdFx0Ly8gdG8gcHJldmVudCBnaG9zdC9kb3VibGVjbGlja3MuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGhpcy50YXJnZXRFbGVtZW50KSB8fCB0aGlzLmNhbmNlbE5leHRDbGljaykge1xuXG5cdFx0XHQvLyBQcmV2ZW50IGFueSB1c2VyLWFkZGVkIGxpc3RlbmVycyBkZWNsYXJlZCBvbiBGYXN0Q2xpY2sgZWxlbWVudCBmcm9tIGJlaW5nIGZpcmVkLlxuXHRcdFx0aWYgKGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbikge1xuXHRcdFx0XHRldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHRcdH0gZWxzZSB7XG5cblx0XHRcdFx0Ly8gUGFydCBvZiB0aGUgaGFjayBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IEV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoZS5nLiBBbmRyb2lkIDIpXG5cdFx0XHRcdGV2ZW50LnByb3BhZ2F0aW9uU3RvcHBlZCA9IHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENhbmNlbCB0aGUgZXZlbnRcblx0XHRcdGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSBtb3VzZSBldmVudCBpcyBwZXJtaXR0ZWQsIHJldHVybiB0cnVlIGZvciB0aGUgYWN0aW9uIHRvIGdvIHRocm91Z2guXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gYWN0dWFsIGNsaWNrcywgZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyBpcyBhIHRvdWNoLWdlbmVyYXRlZCBjbGljaywgYSBjbGljayBhY3Rpb24gb2NjdXJyaW5nXG5cdCAqIG5hdHVyYWxseSBhZnRlciBhIGRlbGF5IGFmdGVyIGEgdG91Y2ggKHdoaWNoIG5lZWRzIHRvIGJlIGNhbmNlbGxlZCB0byBhdm9pZCBkdXBsaWNhdGlvbiksIG9yXG5cdCAqIGFuIGFjdHVhbCBjbGljayB3aGljaCBzaG91bGQgYmUgcGVybWl0dGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25DbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHBlcm1pdHRlZDtcblxuXHRcdC8vIEl0J3MgcG9zc2libGUgZm9yIGFub3RoZXIgRmFzdENsaWNrLWxpa2UgbGlicmFyeSBkZWxpdmVyZWQgd2l0aCB0aGlyZC1wYXJ0eSBjb2RlIHRvIGZpcmUgYSBjbGljayBldmVudCBiZWZvcmUgRmFzdENsaWNrIGRvZXMgKGlzc3VlICM0NCkuIEluIHRoYXQgY2FzZSwgc2V0IHRoZSBjbGljay10cmFja2luZyBmbGFnIGJhY2sgdG8gZmFsc2UgYW5kIHJldHVybiBlYXJseS4gVGhpcyB3aWxsIGNhdXNlIG9uVG91Y2hFbmQgdG8gcmV0dXJuIGVhcmx5LlxuXHRcdGlmICh0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFZlcnkgb2RkIGJlaGF2aW91ciBvbiBpT1MgKGlzc3VlICMxOCk6IGlmIGEgc3VibWl0IGVsZW1lbnQgaXMgcHJlc2VudCBpbnNpZGUgYSBmb3JtIGFuZCB0aGUgdXNlciBoaXRzIGVudGVyIGluIHRoZSBpT1Mgc2ltdWxhdG9yIG9yIGNsaWNrcyB0aGUgR28gYnV0dG9uIG9uIHRoZSBwb3AtdXAgT1Mga2V5Ym9hcmQgdGhlIGEga2luZCBvZiAnZmFrZScgY2xpY2sgZXZlbnQgd2lsbCBiZSB0cmlnZ2VyZWQgd2l0aCB0aGUgc3VibWl0LXR5cGUgaW5wdXQgZWxlbWVudCBhcyB0aGUgdGFyZ2V0LlxuXHRcdGlmIChldmVudC50YXJnZXQudHlwZSA9PT0gJ3N1Ym1pdCcgJiYgZXZlbnQuZGV0YWlsID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRwZXJtaXR0ZWQgPSB0aGlzLm9uTW91c2UoZXZlbnQpO1xuXG5cdFx0Ly8gT25seSB1bnNldCB0YXJnZXRFbGVtZW50IGlmIHRoZSBjbGljayBpcyBub3QgcGVybWl0dGVkLiBUaGlzIHdpbGwgZW5zdXJlIHRoYXQgdGhlIGNoZWNrIGZvciAhdGFyZ2V0RWxlbWVudCBpbiBvbk1vdXNlIGZhaWxzIGFuZCB0aGUgYnJvd3NlcidzIGNsaWNrIGRvZXNuJ3QgZ28gdGhyb3VnaC5cblx0XHRpZiAoIXBlcm1pdHRlZCkge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBJZiBjbGlja3MgYXJlIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gcGVybWl0dGVkO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFJlbW92ZSBhbGwgRmFzdENsaWNrJ3MgZXZlbnQgbGlzdGVuZXJzLlxuXHQgKlxuXHQgKiBAcmV0dXJucyB7dm9pZH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBsYXllciA9IHRoaXMubGF5ZXI7XG5cblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdH1cblxuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0cnVlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnQsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlLCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmQsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMub25Ub3VjaENhbmNlbCwgZmFsc2UpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIENoZWNrIHdoZXRoZXIgRmFzdENsaWNrIGlzIG5lZWRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqL1xuXHRGYXN0Q2xpY2subm90TmVlZGVkID0gZnVuY3Rpb24obGF5ZXIpIHtcblx0XHR2YXIgbWV0YVZpZXdwb3J0O1xuXHRcdHZhciBjaHJvbWVWZXJzaW9uO1xuXHRcdHZhciBibGFja2JlcnJ5VmVyc2lvbjtcblx0XHR2YXIgZmlyZWZveFZlcnNpb247XG5cblx0XHQvLyBEZXZpY2VzIHRoYXQgZG9uJ3Qgc3VwcG9ydCB0b3VjaCBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdGlmICh0eXBlb2Ygd2luZG93Lm9udG91Y2hzdGFydCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIENocm9tZSB2ZXJzaW9uIC0gemVybyBmb3Igb3RoZXIgYnJvd3NlcnNcblx0XHRjaHJvbWVWZXJzaW9uID0gKygvQ2hyb21lXFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoY2hyb21lVmVyc2lvbikge1xuXG5cdFx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gQ2hyb21lIG9uIEFuZHJvaWQgd2l0aCB1c2VyLXNjYWxhYmxlPVwibm9cIiBkb2Vzbid0IG5lZWQgRmFzdENsaWNrIChpc3N1ZSAjODkpXG5cdFx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyBDaHJvbWUgMzIgYW5kIGFib3ZlIHdpdGggd2lkdGg9ZGV2aWNlLXdpZHRoIG9yIGxlc3MgZG9uJ3QgbmVlZCBGYXN0Q2xpY2tcblx0XHRcdFx0XHRpZiAoY2hyb21lVmVyc2lvbiA+IDMxICYmIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cblx0XHRcdC8vIENocm9tZSBkZXNrdG9wIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICMxNSlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmIChkZXZpY2VJc0JsYWNrQmVycnkxMCkge1xuXHRcdFx0YmxhY2tiZXJyeVZlcnNpb24gPSBuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9WZXJzaW9uXFwvKFswLTldKilcXC4oWzAtOV0qKS8pO1xuXG5cdFx0XHQvLyBCbGFja0JlcnJ5IDEwLjMrIGRvZXMgbm90IHJlcXVpcmUgRmFzdGNsaWNrIGxpYnJhcnkuXG5cdFx0XHQvLyBodHRwczovL2dpdGh1Yi5jb20vZnRsYWJzL2Zhc3RjbGljay9pc3N1ZXMvMjUxXG5cdFx0XHRpZiAoYmxhY2tiZXJyeVZlcnNpb25bMV0gPj0gMTAgJiYgYmxhY2tiZXJyeVZlcnNpb25bMl0gPj0gMykge1xuXHRcdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cblx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydCkge1xuXHRcdFx0XHRcdC8vIHVzZXItc2NhbGFibGU9bm8gZWxpbWluYXRlcyBjbGljayBkZWxheS5cblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIHdpZHRoPWRldmljZS13aWR0aCAob3IgbGVzcyB0aGFuIGRldmljZS13aWR0aCkgZWxpbWluYXRlcyBjbGljayBkZWxheS5cblx0XHRcdFx0XHRpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJRTEwIHdpdGggLW1zLXRvdWNoLWFjdGlvbjogbm9uZSBvciBtYW5pcHVsYXRpb24sIHdoaWNoIGRpc2FibGVzIGRvdWJsZS10YXAtdG8tem9vbSAoaXNzdWUgIzk3KVxuXHRcdGlmIChsYXllci5zdHlsZS5tc1RvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBGaXJlZm94IHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGZpcmVmb3hWZXJzaW9uID0gKygvRmlyZWZveFxcLyhbMC05XSspLy5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpIHx8IFssMF0pWzFdO1xuXG5cdFx0aWYgKGZpcmVmb3hWZXJzaW9uID49IDI3KSB7XG5cdFx0XHQvLyBGaXJlZm94IDI3KyBkb2VzIG5vdCBoYXZlIHRhcCBkZWxheSBpZiB0aGUgY29udGVudCBpcyBub3Qgem9vbWFibGUgLSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD05MjI4OTZcblxuXHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXHRcdFx0aWYgKG1ldGFWaWV3cG9ydCAmJiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTE6IHByZWZpeGVkIC1tcy10b3VjaC1hY3Rpb24gaXMgbm8gbG9uZ2VyIHN1cHBvcnRlZCBhbmQgaXQncyByZWNvbWVuZGVkIHRvIHVzZSBub24tcHJlZml4ZWQgdmVyc2lvblxuXHRcdC8vIGh0dHA6Ly9tc2RuLm1pY3Jvc29mdC5jb20vZW4tdXMvbGlicmFyeS93aW5kb3dzL2FwcHMvSGg3NjczMTMuYXNweFxuXHRcdGlmIChsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ25vbmUnIHx8IGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbWFuaXB1bGF0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIGZvciBjcmVhdGluZyBhIEZhc3RDbGljayBvYmplY3Rcblx0ICpcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzXG5cdCAqL1xuXHRGYXN0Q2xpY2suYXR0YWNoID0gZnVuY3Rpb24obGF5ZXIsIG9wdGlvbnMpIHtcblx0XHRyZXR1cm4gbmV3IEZhc3RDbGljayhsYXllciwgb3B0aW9ucyk7XG5cdH07XG5cblxuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXG5cdFx0Ly8gQU1ELiBSZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgbW9kdWxlLlxuXHRcdGRlZmluZShmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiBGYXN0Q2xpY2s7XG5cdFx0fSk7XG5cdH0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IEZhc3RDbGljay5hdHRhY2g7XG5cdFx0bW9kdWxlLmV4cG9ydHMuRmFzdENsaWNrID0gRmFzdENsaWNrO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH1cbn0oKSk7XG4iLCIvKiFcblxuIGhhbmRsZWJhcnMgdjMuMC4zXG5cbkNvcHlyaWdodCAoQykgMjAxMS0yMDE0IGJ5IFllaHVkYSBLYXR6XG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbm9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbmluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbnRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbmNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcblxuVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW5cbmFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXG5USEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG5JTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbkZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbk9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU5cblRIRSBTT0ZUV0FSRS5cblxuQGxpY2Vuc2VcbiovXG4oZnVuY3Rpb24gd2VicGFja1VuaXZlcnNhbE1vZHVsZURlZmluaXRpb24ocm9vdCwgZmFjdG9yeSkge1xuXHRpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSA9PT0gJ29iamVjdCcpXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KCk7XG5cdGVsc2UgaWYodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuXHRcdGRlZmluZShmYWN0b3J5KTtcblx0ZWxzZSBpZih0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcpXG5cdFx0ZXhwb3J0c1tcIkhhbmRsZWJhcnNcIl0gPSBmYWN0b3J5KCk7XG5cdGVsc2Vcblx0XHRyb290W1wiSGFuZGxlYmFyc1wiXSA9IGZhY3RvcnkoKTtcbn0pKHRoaXMsIGZ1bmN0aW9uKCkge1xucmV0dXJuIC8qKioqKiovIChmdW5jdGlvbihtb2R1bGVzKSB7IC8vIHdlYnBhY2tCb290c3RyYXBcbi8qKioqKiovIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4vKioqKioqLyBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4vKioqKioqLyBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuLyoqKioqKi8gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuLyoqKioqKi8gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuLyoqKioqKi8gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbi8qKioqKiovIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuLyoqKioqKi8gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbi8qKioqKiovIFx0XHRcdGV4cG9ydHM6IHt9LFxuLyoqKioqKi8gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuLyoqKioqKi8gXHRcdFx0bG9hZGVkOiBmYWxzZVxuLyoqKioqKi8gXHRcdH07XG5cbi8qKioqKiovIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbi8qKioqKiovIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuLyoqKioqKi8gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbi8qKioqKiovIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuLyoqKioqKi8gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4vKioqKioqLyBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuLyoqKioqKi8gXHR9XG5cblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuLyoqKioqKi8gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8qKioqKiovIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG4vKioqKioqLyB9KVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKioqKiovIChbXG4vKiAwICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KVsnZGVmYXVsdCddO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cblx0dmFyIF9pbXBvcnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG5cdHZhciBiYXNlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cblx0Ly8gRWFjaCBvZiB0aGVzZSBhdWdtZW50IHRoZSBIYW5kbGViYXJzIG9iamVjdC4gTm8gbmVlZCB0byBzZXR1cCBoZXJlLlxuXHQvLyAoVGhpcyBpcyBkb25lIHRvIGVhc2lseSBzaGFyZSBjb2RlIGJldHdlZW4gY29tbW9uanMgYW5kIGJyb3dzZSBlbnZzKVxuXG5cdHZhciBfU2FmZVN0cmluZyA9IF9fd2VicGFja19yZXF1aXJlX18oMik7XG5cblx0dmFyIF9TYWZlU3RyaW5nMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9TYWZlU3RyaW5nKTtcblxuXHR2YXIgX0V4Y2VwdGlvbiA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0dmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cblx0dmFyIF9pbXBvcnQyID0gX193ZWJwYWNrX3JlcXVpcmVfXyg0KTtcblxuXHR2YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0Mik7XG5cblx0dmFyIF9pbXBvcnQzID0gX193ZWJwYWNrX3JlcXVpcmVfXyg1KTtcblxuXHR2YXIgcnVudGltZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQzKTtcblxuXHR2YXIgX25vQ29uZmxpY3QgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDYpO1xuXG5cdHZhciBfbm9Db25mbGljdDIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfbm9Db25mbGljdCk7XG5cblx0Ly8gRm9yIGNvbXBhdGliaWxpdHkgYW5kIHVzYWdlIG91dHNpZGUgb2YgbW9kdWxlIHN5c3RlbXMsIG1ha2UgdGhlIEhhbmRsZWJhcnMgb2JqZWN0IGEgbmFtZXNwYWNlXG5cdGZ1bmN0aW9uIGNyZWF0ZSgpIHtcblx0ICB2YXIgaGIgPSBuZXcgYmFzZS5IYW5kbGViYXJzRW52aXJvbm1lbnQoKTtcblxuXHQgIFV0aWxzLmV4dGVuZChoYiwgYmFzZSk7XG5cdCAgaGIuU2FmZVN0cmluZyA9IF9TYWZlU3RyaW5nMlsnZGVmYXVsdCddO1xuXHQgIGhiLkV4Y2VwdGlvbiA9IF9FeGNlcHRpb24yWydkZWZhdWx0J107XG5cdCAgaGIuVXRpbHMgPSBVdGlscztcblx0ICBoYi5lc2NhcGVFeHByZXNzaW9uID0gVXRpbHMuZXNjYXBlRXhwcmVzc2lvbjtcblxuXHQgIGhiLlZNID0gcnVudGltZTtcblx0ICBoYi50ZW1wbGF0ZSA9IGZ1bmN0aW9uIChzcGVjKSB7XG5cdCAgICByZXR1cm4gcnVudGltZS50ZW1wbGF0ZShzcGVjLCBoYik7XG5cdCAgfTtcblxuXHQgIHJldHVybiBoYjtcblx0fVxuXG5cdHZhciBpbnN0ID0gY3JlYXRlKCk7XG5cdGluc3QuY3JlYXRlID0gY3JlYXRlO1xuXG5cdF9ub0NvbmZsaWN0MlsnZGVmYXVsdCddKGluc3QpO1xuXG5cdGluc3RbJ2RlZmF1bHQnXSA9IGluc3Q7XG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gaW5zdDtcblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8qKiovIH0sXG4vKiAxICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KVsnZGVmYXVsdCddO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdGV4cG9ydHMuSGFuZGxlYmFyc0Vudmlyb25tZW50ID0gSGFuZGxlYmFyc0Vudmlyb25tZW50O1xuXHRleHBvcnRzLmNyZWF0ZUZyYW1lID0gY3JlYXRlRnJhbWU7XG5cblx0dmFyIF9pbXBvcnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpO1xuXG5cdHZhciBVdGlscyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG5cdHZhciBfRXhjZXB0aW9uID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHR2YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxuXHR2YXIgVkVSU0lPTiA9ICczLjAuMSc7XG5cdGV4cG9ydHMuVkVSU0lPTiA9IFZFUlNJT047XG5cdHZhciBDT01QSUxFUl9SRVZJU0lPTiA9IDY7XG5cblx0ZXhwb3J0cy5DT01QSUxFUl9SRVZJU0lPTiA9IENPTVBJTEVSX1JFVklTSU9OO1xuXHR2YXIgUkVWSVNJT05fQ0hBTkdFUyA9IHtcblx0ICAxOiAnPD0gMS4wLnJjLjInLCAvLyAxLjAucmMuMiBpcyBhY3R1YWxseSByZXYyIGJ1dCBkb2Vzbid0IHJlcG9ydCBpdFxuXHQgIDI6ICc9PSAxLjAuMC1yYy4zJyxcblx0ICAzOiAnPT0gMS4wLjAtcmMuNCcsXG5cdCAgNDogJz09IDEueC54Jyxcblx0ICA1OiAnPT0gMi4wLjAtYWxwaGEueCcsXG5cdCAgNjogJz49IDIuMC4wLWJldGEuMSdcblx0fTtcblxuXHRleHBvcnRzLlJFVklTSU9OX0NIQU5HRVMgPSBSRVZJU0lPTl9DSEFOR0VTO1xuXHR2YXIgaXNBcnJheSA9IFV0aWxzLmlzQXJyYXksXG5cdCAgICBpc0Z1bmN0aW9uID0gVXRpbHMuaXNGdW5jdGlvbixcblx0ICAgIHRvU3RyaW5nID0gVXRpbHMudG9TdHJpbmcsXG5cdCAgICBvYmplY3RUeXBlID0gJ1tvYmplY3QgT2JqZWN0XSc7XG5cblx0ZnVuY3Rpb24gSGFuZGxlYmFyc0Vudmlyb25tZW50KGhlbHBlcnMsIHBhcnRpYWxzKSB7XG5cdCAgdGhpcy5oZWxwZXJzID0gaGVscGVycyB8fCB7fTtcblx0ICB0aGlzLnBhcnRpYWxzID0gcGFydGlhbHMgfHwge307XG5cblx0ICByZWdpc3RlckRlZmF1bHRIZWxwZXJzKHRoaXMpO1xuXHR9XG5cblx0SGFuZGxlYmFyc0Vudmlyb25tZW50LnByb3RvdHlwZSA9IHtcblx0ICBjb25zdHJ1Y3RvcjogSGFuZGxlYmFyc0Vudmlyb25tZW50LFxuXG5cdCAgbG9nZ2VyOiBsb2dnZXIsXG5cdCAgbG9nOiBsb2csXG5cblx0ICByZWdpc3RlckhlbHBlcjogZnVuY3Rpb24gcmVnaXN0ZXJIZWxwZXIobmFtZSwgZm4pIHtcblx0ICAgIGlmICh0b1N0cmluZy5jYWxsKG5hbWUpID09PSBvYmplY3RUeXBlKSB7XG5cdCAgICAgIGlmIChmbikge1xuXHQgICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdBcmcgbm90IHN1cHBvcnRlZCB3aXRoIG11bHRpcGxlIGhlbHBlcnMnKTtcblx0ICAgICAgfVxuXHQgICAgICBVdGlscy5leHRlbmQodGhpcy5oZWxwZXJzLCBuYW1lKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHRoaXMuaGVscGVyc1tuYW1lXSA9IGZuO1xuXHQgICAgfVxuXHQgIH0sXG5cdCAgdW5yZWdpc3RlckhlbHBlcjogZnVuY3Rpb24gdW5yZWdpc3RlckhlbHBlcihuYW1lKSB7XG5cdCAgICBkZWxldGUgdGhpcy5oZWxwZXJzW25hbWVdO1xuXHQgIH0sXG5cblx0ICByZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uIHJlZ2lzdGVyUGFydGlhbChuYW1lLCBwYXJ0aWFsKSB7XG5cdCAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuXHQgICAgICBVdGlscy5leHRlbmQodGhpcy5wYXJ0aWFscywgbmFtZSk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBpZiAodHlwZW9mIHBhcnRpYWwgPT09ICd1bmRlZmluZWQnKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ0F0dGVtcHRpbmcgdG8gcmVnaXN0ZXIgYSBwYXJ0aWFsIGFzIHVuZGVmaW5lZCcpO1xuXHQgICAgICB9XG5cdCAgICAgIHRoaXMucGFydGlhbHNbbmFtZV0gPSBwYXJ0aWFsO1xuXHQgICAgfVxuXHQgIH0sXG5cdCAgdW5yZWdpc3RlclBhcnRpYWw6IGZ1bmN0aW9uIHVucmVnaXN0ZXJQYXJ0aWFsKG5hbWUpIHtcblx0ICAgIGRlbGV0ZSB0aGlzLnBhcnRpYWxzW25hbWVdO1xuXHQgIH1cblx0fTtcblxuXHRmdW5jdGlvbiByZWdpc3RlckRlZmF1bHRIZWxwZXJzKGluc3RhbmNlKSB7XG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbiAoKSB7XG5cdCAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgICAvLyBBIG1pc3NpbmcgZmllbGQgaW4gYSB7e2Zvb319IGNvbnN0dWN0LlxuXHQgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgLy8gU29tZW9uZSBpcyBhY3R1YWxseSB0cnlpbmcgdG8gY2FsbCBzb21ldGhpbmcsIGJsb3cgdXAuXG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdNaXNzaW5nIGhlbHBlcjogXCInICsgYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAxXS5uYW1lICsgJ1wiJyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignYmxvY2tIZWxwZXJNaXNzaW5nJywgZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICAgIHZhciBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlLFxuXHQgICAgICAgIGZuID0gb3B0aW9ucy5mbjtcblxuXHQgICAgaWYgKGNvbnRleHQgPT09IHRydWUpIHtcblx0ICAgICAgcmV0dXJuIGZuKHRoaXMpO1xuXHQgICAgfSBlbHNlIGlmIChjb250ZXh0ID09PSBmYWxzZSB8fCBjb250ZXh0ID09IG51bGwpIHtcblx0ICAgICAgcmV0dXJuIGludmVyc2UodGhpcyk7XG5cdCAgICB9IGVsc2UgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcblx0ICAgICAgaWYgKGNvbnRleHQubGVuZ3RoID4gMCkge1xuXHQgICAgICAgIGlmIChvcHRpb25zLmlkcykge1xuXHQgICAgICAgICAgb3B0aW9ucy5pZHMgPSBbb3B0aW9ucy5uYW1lXTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gaW5zdGFuY2UuaGVscGVycy5lYWNoKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuXHQgICAgICB9XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG5cdCAgICAgICAgdmFyIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuXHQgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMubmFtZSk7XG5cdCAgICAgICAgb3B0aW9ucyA9IHsgZGF0YTogZGF0YSB9O1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2VhY2gnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuXHQgICAgaWYgKCFvcHRpb25zKSB7XG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdNdXN0IHBhc3MgaXRlcmF0b3IgdG8gI2VhY2gnKTtcblx0ICAgIH1cblxuXHQgICAgdmFyIGZuID0gb3B0aW9ucy5mbixcblx0ICAgICAgICBpbnZlcnNlID0gb3B0aW9ucy5pbnZlcnNlLFxuXHQgICAgICAgIGkgPSAwLFxuXHQgICAgICAgIHJldCA9ICcnLFxuXHQgICAgICAgIGRhdGEgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgY29udGV4dFBhdGggPSB1bmRlZmluZWQ7XG5cblx0ICAgIGlmIChvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5pZHMpIHtcblx0ICAgICAgY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMuaWRzWzBdKSArICcuJztcblx0ICAgIH1cblxuXHQgICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHtcblx0ICAgICAgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTtcblx0ICAgIH1cblxuXHQgICAgaWYgKG9wdGlvbnMuZGF0YSkge1xuXHQgICAgICBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcblx0ICAgIH1cblxuXHQgICAgZnVuY3Rpb24gZXhlY0l0ZXJhdGlvbihmaWVsZCwgaW5kZXgsIGxhc3QpIHtcblx0ICAgICAgaWYgKGRhdGEpIHtcblx0ICAgICAgICBkYXRhLmtleSA9IGZpZWxkO1xuXHQgICAgICAgIGRhdGEuaW5kZXggPSBpbmRleDtcblx0ICAgICAgICBkYXRhLmZpcnN0ID0gaW5kZXggPT09IDA7XG5cdCAgICAgICAgZGF0YS5sYXN0ID0gISFsYXN0O1xuXG5cdCAgICAgICAgaWYgKGNvbnRleHRQYXRoKSB7XG5cdCAgICAgICAgICBkYXRhLmNvbnRleHRQYXRoID0gY29udGV4dFBhdGggKyBmaWVsZDtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblxuXHQgICAgICByZXQgPSByZXQgKyBmbihjb250ZXh0W2ZpZWxkXSwge1xuXHQgICAgICAgIGRhdGE6IGRhdGEsXG5cdCAgICAgICAgYmxvY2tQYXJhbXM6IFV0aWxzLmJsb2NrUGFyYW1zKFtjb250ZXh0W2ZpZWxkXSwgZmllbGRdLCBbY29udGV4dFBhdGggKyBmaWVsZCwgbnVsbF0pXG5cdCAgICAgIH0pO1xuXHQgICAgfVxuXG5cdCAgICBpZiAoY29udGV4dCAmJiB0eXBlb2YgY29udGV4dCA9PT0gJ29iamVjdCcpIHtcblx0ICAgICAgaWYgKGlzQXJyYXkoY29udGV4dCkpIHtcblx0ICAgICAgICBmb3IgKHZhciBqID0gY29udGV4dC5sZW5ndGg7IGkgPCBqOyBpKyspIHtcblx0ICAgICAgICAgIGV4ZWNJdGVyYXRpb24oaSwgaSwgaSA9PT0gY29udGV4dC5sZW5ndGggLSAxKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgdmFyIHByaW9yS2V5ID0gdW5kZWZpbmVkO1xuXG5cdCAgICAgICAgZm9yICh2YXIga2V5IGluIGNvbnRleHQpIHtcblx0ICAgICAgICAgIGlmIChjb250ZXh0Lmhhc093blByb3BlcnR5KGtleSkpIHtcblx0ICAgICAgICAgICAgLy8gV2UncmUgcnVubmluZyB0aGUgaXRlcmF0aW9ucyBvbmUgc3RlcCBvdXQgb2Ygc3luYyBzbyB3ZSBjYW4gZGV0ZWN0XG5cdCAgICAgICAgICAgIC8vIHRoZSBsYXN0IGl0ZXJhdGlvbiB3aXRob3V0IGhhdmUgdG8gc2NhbiB0aGUgb2JqZWN0IHR3aWNlIGFuZCBjcmVhdGVcblx0ICAgICAgICAgICAgLy8gYW4gaXRlcm1lZGlhdGUga2V5cyBhcnJheS5cblx0ICAgICAgICAgICAgaWYgKHByaW9yS2V5KSB7XG5cdCAgICAgICAgICAgICAgZXhlY0l0ZXJhdGlvbihwcmlvcktleSwgaSAtIDEpO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICAgIHByaW9yS2V5ID0ga2V5O1xuXHQgICAgICAgICAgICBpKys7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXHQgICAgICAgIGlmIChwcmlvcktleSkge1xuXHQgICAgICAgICAgZXhlY0l0ZXJhdGlvbihwcmlvcktleSwgaSAtIDEsIHRydWUpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBpZiAoaSA9PT0gMCkge1xuXHQgICAgICByZXQgPSBpbnZlcnNlKHRoaXMpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gcmV0O1xuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2lmJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG5cdCAgICBpZiAoaXNGdW5jdGlvbihjb25kaXRpb25hbCkpIHtcblx0ICAgICAgY29uZGl0aW9uYWwgPSBjb25kaXRpb25hbC5jYWxsKHRoaXMpO1xuXHQgICAgfVxuXG5cdCAgICAvLyBEZWZhdWx0IGJlaGF2aW9yIGlzIHRvIHJlbmRlciB0aGUgcG9zaXRpdmUgcGF0aCBpZiB0aGUgdmFsdWUgaXMgdHJ1dGh5IGFuZCBub3QgZW1wdHkuXG5cdCAgICAvLyBUaGUgYGluY2x1ZGVaZXJvYCBvcHRpb24gbWF5IGJlIHNldCB0byB0cmVhdCB0aGUgY29uZHRpb25hbCBhcyBwdXJlbHkgbm90IGVtcHR5IGJhc2VkIG9uIHRoZVxuXHQgICAgLy8gYmVoYXZpb3Igb2YgaXNFbXB0eS4gRWZmZWN0aXZlbHkgdGhpcyBkZXRlcm1pbmVzIGlmIDAgaXMgaGFuZGxlZCBieSB0aGUgcG9zaXRpdmUgcGF0aCBvciBuZWdhdGl2ZS5cblx0ICAgIGlmICghb3B0aW9ucy5oYXNoLmluY2x1ZGVaZXJvICYmICFjb25kaXRpb25hbCB8fCBVdGlscy5pc0VtcHR5KGNvbmRpdGlvbmFsKSkge1xuXHQgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcigndW5sZXNzJywgZnVuY3Rpb24gKGNvbmRpdGlvbmFsLCBvcHRpb25zKSB7XG5cdCAgICByZXR1cm4gaW5zdGFuY2UuaGVscGVyc1snaWYnXS5jYWxsKHRoaXMsIGNvbmRpdGlvbmFsLCB7IGZuOiBvcHRpb25zLmludmVyc2UsIGludmVyc2U6IG9wdGlvbnMuZm4sIGhhc2g6IG9wdGlvbnMuaGFzaCB9KTtcblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCd3aXRoJywgZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7XG5cdCAgICAgIGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7XG5cdCAgICB9XG5cblx0ICAgIHZhciBmbiA9IG9wdGlvbnMuZm47XG5cblx0ICAgIGlmICghVXRpbHMuaXNFbXB0eShjb250ZXh0KSkge1xuXHQgICAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG5cdCAgICAgICAgdmFyIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuXHQgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBVdGlscy5hcHBlbmRDb250ZXh0UGF0aChvcHRpb25zLmRhdGEuY29udGV4dFBhdGgsIG9wdGlvbnMuaWRzWzBdKTtcblx0ICAgICAgICBvcHRpb25zID0geyBkYXRhOiBkYXRhIH07XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvZycsIGZ1bmN0aW9uIChtZXNzYWdlLCBvcHRpb25zKSB7XG5cdCAgICB2YXIgbGV2ZWwgPSBvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5kYXRhLmxldmVsICE9IG51bGwgPyBwYXJzZUludChvcHRpb25zLmRhdGEubGV2ZWwsIDEwKSA6IDE7XG5cdCAgICBpbnN0YW5jZS5sb2cobGV2ZWwsIG1lc3NhZ2UpO1xuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2xvb2t1cCcsIGZ1bmN0aW9uIChvYmosIGZpZWxkKSB7XG5cdCAgICByZXR1cm4gb2JqICYmIG9ialtmaWVsZF07XG5cdCAgfSk7XG5cdH1cblxuXHR2YXIgbG9nZ2VyID0ge1xuXHQgIG1ldGhvZE1hcDogeyAwOiAnZGVidWcnLCAxOiAnaW5mbycsIDI6ICd3YXJuJywgMzogJ2Vycm9yJyB9LFxuXG5cdCAgLy8gU3RhdGUgZW51bVxuXHQgIERFQlVHOiAwLFxuXHQgIElORk86IDEsXG5cdCAgV0FSTjogMixcblx0ICBFUlJPUjogMyxcblx0ICBsZXZlbDogMSxcblxuXHQgIC8vIENhbiBiZSBvdmVycmlkZGVuIGluIHRoZSBob3N0IGVudmlyb25tZW50XG5cdCAgbG9nOiBmdW5jdGlvbiBsb2cobGV2ZWwsIG1lc3NhZ2UpIHtcblx0ICAgIGlmICh0eXBlb2YgY29uc29sZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbG9nZ2VyLmxldmVsIDw9IGxldmVsKSB7XG5cdCAgICAgIHZhciBtZXRob2QgPSBsb2dnZXIubWV0aG9kTWFwW2xldmVsXTtcblx0ICAgICAgKGNvbnNvbGVbbWV0aG9kXSB8fCBjb25zb2xlLmxvZykuY2FsbChjb25zb2xlLCBtZXNzYWdlKTsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1jb25zb2xlXG5cdCAgICB9XG5cdCAgfVxuXHR9O1xuXG5cdGV4cG9ydHMubG9nZ2VyID0gbG9nZ2VyO1xuXHR2YXIgbG9nID0gbG9nZ2VyLmxvZztcblxuXHRleHBvcnRzLmxvZyA9IGxvZztcblxuXHRmdW5jdGlvbiBjcmVhdGVGcmFtZShvYmplY3QpIHtcblx0ICB2YXIgZnJhbWUgPSBVdGlscy5leHRlbmQoe30sIG9iamVjdCk7XG5cdCAgZnJhbWUuX3BhcmVudCA9IG9iamVjdDtcblx0ICByZXR1cm4gZnJhbWU7XG5cdH1cblxuXHQvKiBbYXJncywgXW9wdGlvbnMgKi9cblxuLyoqKi8gfSxcbi8qIDIgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHQvLyBCdWlsZCBvdXQgb3VyIGJhc2ljIFNhZmVTdHJpbmcgdHlwZVxuXHRmdW5jdGlvbiBTYWZlU3RyaW5nKHN0cmluZykge1xuXHQgIHRoaXMuc3RyaW5nID0gc3RyaW5nO1xuXHR9XG5cblx0U2FmZVN0cmluZy5wcm90b3R5cGUudG9TdHJpbmcgPSBTYWZlU3RyaW5nLnByb3RvdHlwZS50b0hUTUwgPSBmdW5jdGlvbiAoKSB7XG5cdCAgcmV0dXJuICcnICsgdGhpcy5zdHJpbmc7XG5cdH07XG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gU2FmZVN0cmluZztcblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8qKiovIH0sXG4vKiAzICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXHR2YXIgZXJyb3JQcm9wcyA9IFsnZGVzY3JpcHRpb24nLCAnZmlsZU5hbWUnLCAnbGluZU51bWJlcicsICdtZXNzYWdlJywgJ25hbWUnLCAnbnVtYmVyJywgJ3N0YWNrJ107XG5cblx0ZnVuY3Rpb24gRXhjZXB0aW9uKG1lc3NhZ2UsIG5vZGUpIHtcblx0ICB2YXIgbG9jID0gbm9kZSAmJiBub2RlLmxvYyxcblx0ICAgICAgbGluZSA9IHVuZGVmaW5lZCxcblx0ICAgICAgY29sdW1uID0gdW5kZWZpbmVkO1xuXHQgIGlmIChsb2MpIHtcblx0ICAgIGxpbmUgPSBsb2Muc3RhcnQubGluZTtcblx0ICAgIGNvbHVtbiA9IGxvYy5zdGFydC5jb2x1bW47XG5cblx0ICAgIG1lc3NhZ2UgKz0gJyAtICcgKyBsaW5lICsgJzonICsgY29sdW1uO1xuXHQgIH1cblxuXHQgIHZhciB0bXAgPSBFcnJvci5wcm90b3R5cGUuY29uc3RydWN0b3IuY2FsbCh0aGlzLCBtZXNzYWdlKTtcblxuXHQgIC8vIFVuZm9ydHVuYXRlbHkgZXJyb3JzIGFyZSBub3QgZW51bWVyYWJsZSBpbiBDaHJvbWUgKGF0IGxlYXN0KSwgc28gYGZvciBwcm9wIGluIHRtcGAgZG9lc24ndCB3b3JrLlxuXHQgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IGVycm9yUHJvcHMubGVuZ3RoOyBpZHgrKykge1xuXHQgICAgdGhpc1tlcnJvclByb3BzW2lkeF1dID0gdG1wW2Vycm9yUHJvcHNbaWR4XV07XG5cdCAgfVxuXG5cdCAgaWYgKEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKSB7XG5cdCAgICBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSh0aGlzLCBFeGNlcHRpb24pO1xuXHQgIH1cblxuXHQgIGlmIChsb2MpIHtcblx0ICAgIHRoaXMubGluZU51bWJlciA9IGxpbmU7XG5cdCAgICB0aGlzLmNvbHVtbiA9IGNvbHVtbjtcblx0ICB9XG5cdH1cblxuXHRFeGNlcHRpb24ucHJvdG90eXBlID0gbmV3IEVycm9yKCk7XG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gRXhjZXB0aW9uO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDQgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHRleHBvcnRzLmV4dGVuZCA9IGV4dGVuZDtcblxuXHQvLyBPbGRlciBJRSB2ZXJzaW9ucyBkbyBub3QgZGlyZWN0bHkgc3VwcG9ydCBpbmRleE9mIHNvIHdlIG11c3QgaW1wbGVtZW50IG91ciBvd24sIHNhZGx5LlxuXHRleHBvcnRzLmluZGV4T2YgPSBpbmRleE9mO1xuXHRleHBvcnRzLmVzY2FwZUV4cHJlc3Npb24gPSBlc2NhcGVFeHByZXNzaW9uO1xuXHRleHBvcnRzLmlzRW1wdHkgPSBpc0VtcHR5O1xuXHRleHBvcnRzLmJsb2NrUGFyYW1zID0gYmxvY2tQYXJhbXM7XG5cdGV4cG9ydHMuYXBwZW5kQ29udGV4dFBhdGggPSBhcHBlbmRDb250ZXh0UGF0aDtcblx0dmFyIGVzY2FwZSA9IHtcblx0ICAnJic6ICcmYW1wOycsXG5cdCAgJzwnOiAnJmx0OycsXG5cdCAgJz4nOiAnJmd0OycsXG5cdCAgJ1wiJzogJyZxdW90OycsXG5cdCAgJ1xcJyc6ICcmI3gyNzsnLFxuXHQgICdgJzogJyYjeDYwOydcblx0fTtcblxuXHR2YXIgYmFkQ2hhcnMgPSAvWyY8PlwiJ2BdL2csXG5cdCAgICBwb3NzaWJsZSA9IC9bJjw+XCInYF0vO1xuXG5cdGZ1bmN0aW9uIGVzY2FwZUNoYXIoY2hyKSB7XG5cdCAgcmV0dXJuIGVzY2FwZVtjaHJdO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXh0ZW5kKG9iaiAvKiAsIC4uLnNvdXJjZSAqLykge1xuXHQgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdCAgICBmb3IgKHZhciBrZXkgaW4gYXJndW1lbnRzW2ldKSB7XG5cdCAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXJndW1lbnRzW2ldLCBrZXkpKSB7XG5cdCAgICAgICAgb2JqW2tleV0gPSBhcmd1bWVudHNbaV1ba2V5XTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1cblxuXHQgIHJldHVybiBvYmo7XG5cdH1cblxuXHR2YXIgdG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG5cdGV4cG9ydHMudG9TdHJpbmcgPSB0b1N0cmluZztcblx0Ly8gU291cmNlZCBmcm9tIGxvZGFzaFxuXHQvLyBodHRwczovL2dpdGh1Yi5jb20vYmVzdGllanMvbG9kYXNoL2Jsb2IvbWFzdGVyL0xJQ0VOU0UudHh0XG5cdC8qZXNsaW50LWRpc2FibGUgZnVuYy1zdHlsZSwgbm8tdmFyICovXG5cdHZhciBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gaXNGdW5jdGlvbih2YWx1ZSkge1xuXHQgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbic7XG5cdH07XG5cdC8vIGZhbGxiYWNrIGZvciBvbGRlciB2ZXJzaW9ucyBvZiBDaHJvbWUgYW5kIFNhZmFyaVxuXHQvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXHRpZiAoaXNGdW5jdGlvbigveC8pKSB7XG5cdCAgZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbiA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgRnVuY3Rpb25dJztcblx0ICB9O1xuXHR9XG5cdHZhciBpc0Z1bmN0aW9uO1xuXHRleHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uO1xuXHQvKmVzbGludC1lbmFibGUgZnVuYy1zdHlsZSwgbm8tdmFyICovXG5cblx0LyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblx0dmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgIHJldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnID8gdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEFycmF5XScgOiBmYWxzZTtcblx0fTtleHBvcnRzLmlzQXJyYXkgPSBpc0FycmF5O1xuXG5cdGZ1bmN0aW9uIGluZGV4T2YoYXJyYXksIHZhbHVlKSB7XG5cdCAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG5cdCAgICBpZiAoYXJyYXlbaV0gPT09IHZhbHVlKSB7XG5cdCAgICAgIHJldHVybiBpO1xuXHQgICAgfVxuXHQgIH1cblx0ICByZXR1cm4gLTE7XG5cdH1cblxuXHRmdW5jdGlvbiBlc2NhcGVFeHByZXNzaW9uKHN0cmluZykge1xuXHQgIGlmICh0eXBlb2Ygc3RyaW5nICE9PSAnc3RyaW5nJykge1xuXHQgICAgLy8gZG9uJ3QgZXNjYXBlIFNhZmVTdHJpbmdzLCBzaW5jZSB0aGV5J3JlIGFscmVhZHkgc2FmZVxuXHQgICAgaWYgKHN0cmluZyAmJiBzdHJpbmcudG9IVE1MKSB7XG5cdCAgICAgIHJldHVybiBzdHJpbmcudG9IVE1MKCk7XG5cdCAgICB9IGVsc2UgaWYgKHN0cmluZyA9PSBudWxsKSB7XG5cdCAgICAgIHJldHVybiAnJztcblx0ICAgIH0gZWxzZSBpZiAoIXN0cmluZykge1xuXHQgICAgICByZXR1cm4gc3RyaW5nICsgJyc7XG5cdCAgICB9XG5cblx0ICAgIC8vIEZvcmNlIGEgc3RyaW5nIGNvbnZlcnNpb24gYXMgdGhpcyB3aWxsIGJlIGRvbmUgYnkgdGhlIGFwcGVuZCByZWdhcmRsZXNzIGFuZFxuXHQgICAgLy8gdGhlIHJlZ2V4IHRlc3Qgd2lsbCBkbyB0aGlzIHRyYW5zcGFyZW50bHkgYmVoaW5kIHRoZSBzY2VuZXMsIGNhdXNpbmcgaXNzdWVzIGlmXG5cdCAgICAvLyBhbiBvYmplY3QncyB0byBzdHJpbmcgaGFzIGVzY2FwZWQgY2hhcmFjdGVycyBpbiBpdC5cblx0ICAgIHN0cmluZyA9ICcnICsgc3RyaW5nO1xuXHQgIH1cblxuXHQgIGlmICghcG9zc2libGUudGVzdChzdHJpbmcpKSB7XG5cdCAgICByZXR1cm4gc3RyaW5nO1xuXHQgIH1cblx0ICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoYmFkQ2hhcnMsIGVzY2FwZUNoYXIpO1xuXHR9XG5cblx0ZnVuY3Rpb24gaXNFbXB0eSh2YWx1ZSkge1xuXHQgIGlmICghdmFsdWUgJiYgdmFsdWUgIT09IDApIHtcblx0ICAgIHJldHVybiB0cnVlO1xuXHQgIH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwKSB7XG5cdCAgICByZXR1cm4gdHJ1ZTtcblx0ICB9IGVsc2Uge1xuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIGJsb2NrUGFyYW1zKHBhcmFtcywgaWRzKSB7XG5cdCAgcGFyYW1zLnBhdGggPSBpZHM7XG5cdCAgcmV0dXJuIHBhcmFtcztcblx0fVxuXG5cdGZ1bmN0aW9uIGFwcGVuZENvbnRleHRQYXRoKGNvbnRleHRQYXRoLCBpZCkge1xuXHQgIHJldHVybiAoY29udGV4dFBhdGggPyBjb250ZXh0UGF0aCArICcuJyA6ICcnKSArIGlkO1xuXHR9XG5cbi8qKiovIH0sXG4vKiA1ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0dmFyIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkID0gX193ZWJwYWNrX3JlcXVpcmVfXyg3KVsnZGVmYXVsdCddO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdGV4cG9ydHMuY2hlY2tSZXZpc2lvbiA9IGNoZWNrUmV2aXNpb247XG5cblx0Ly8gVE9ETzogUmVtb3ZlIHRoaXMgbGluZSBhbmQgYnJlYWsgdXAgY29tcGlsZVBhcnRpYWxcblxuXHRleHBvcnRzLnRlbXBsYXRlID0gdGVtcGxhdGU7XG5cdGV4cG9ydHMud3JhcFByb2dyYW0gPSB3cmFwUHJvZ3JhbTtcblx0ZXhwb3J0cy5yZXNvbHZlUGFydGlhbCA9IHJlc29sdmVQYXJ0aWFsO1xuXHRleHBvcnRzLmludm9rZVBhcnRpYWwgPSBpbnZva2VQYXJ0aWFsO1xuXHRleHBvcnRzLm5vb3AgPSBub29wO1xuXG5cdHZhciBfaW1wb3J0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyg0KTtcblxuXHR2YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxuXHR2YXIgX0V4Y2VwdGlvbiA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0dmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cblx0dmFyIF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxuXHRmdW5jdGlvbiBjaGVja1JldmlzaW9uKGNvbXBpbGVySW5mbykge1xuXHQgIHZhciBjb21waWxlclJldmlzaW9uID0gY29tcGlsZXJJbmZvICYmIGNvbXBpbGVySW5mb1swXSB8fCAxLFxuXHQgICAgICBjdXJyZW50UmV2aXNpb24gPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5DT01QSUxFUl9SRVZJU0lPTjtcblxuXHQgIGlmIChjb21waWxlclJldmlzaW9uICE9PSBjdXJyZW50UmV2aXNpb24pIHtcblx0ICAgIGlmIChjb21waWxlclJldmlzaW9uIDwgY3VycmVudFJldmlzaW9uKSB7XG5cdCAgICAgIHZhciBydW50aW1lVmVyc2lvbnMgPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5SRVZJU0lPTl9DSEFOR0VTW2N1cnJlbnRSZXZpc2lvbl0sXG5cdCAgICAgICAgICBjb21waWxlclZlcnNpb25zID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuUkVWSVNJT05fQ0hBTkdFU1tjb21waWxlclJldmlzaW9uXTtcblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGFuIG9sZGVyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuICcgKyAnUGxlYXNlIHVwZGF0ZSB5b3VyIHByZWNvbXBpbGVyIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIHJ1bnRpbWVWZXJzaW9ucyArICcpIG9yIGRvd25ncmFkZSB5b3VyIHJ1bnRpbWUgdG8gYW4gb2xkZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVyVmVyc2lvbnMgKyAnKS4nKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIC8vIFVzZSB0aGUgZW1iZWRkZWQgdmVyc2lvbiBpbmZvIHNpbmNlIHRoZSBydW50aW1lIGRvZXNuJ3Qga25vdyBhYm91dCB0aGlzIHJldmlzaW9uIHlldFxuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYSBuZXdlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiAnICsgJ1BsZWFzZSB1cGRhdGUgeW91ciBydW50aW1lIHRvIGEgbmV3ZXIgdmVyc2lvbiAoJyArIGNvbXBpbGVySW5mb1sxXSArICcpLicpO1xuXHQgICAgfVxuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIHRlbXBsYXRlKHRlbXBsYXRlU3BlYywgZW52KSB7XG5cdCAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblx0ICBpZiAoIWVudikge1xuXHQgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ05vIGVudmlyb25tZW50IHBhc3NlZCB0byB0ZW1wbGF0ZScpO1xuXHQgIH1cblx0ICBpZiAoIXRlbXBsYXRlU3BlYyB8fCAhdGVtcGxhdGVTcGVjLm1haW4pIHtcblx0ICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdVbmtub3duIHRlbXBsYXRlIG9iamVjdDogJyArIHR5cGVvZiB0ZW1wbGF0ZVNwZWMpO1xuXHQgIH1cblxuXHQgIC8vIE5vdGU6IFVzaW5nIGVudi5WTSByZWZlcmVuY2VzIHJhdGhlciB0aGFuIGxvY2FsIHZhciByZWZlcmVuY2VzIHRocm91Z2hvdXQgdGhpcyBzZWN0aW9uIHRvIGFsbG93XG5cdCAgLy8gZm9yIGV4dGVybmFsIHVzZXJzIHRvIG92ZXJyaWRlIHRoZXNlIGFzIHBzdWVkby1zdXBwb3J0ZWQgQVBJcy5cblx0ICBlbnYuVk0uY2hlY2tSZXZpc2lvbih0ZW1wbGF0ZVNwZWMuY29tcGlsZXIpO1xuXG5cdCAgZnVuY3Rpb24gaW52b2tlUGFydGlhbFdyYXBwZXIocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuXHQgICAgaWYgKG9wdGlvbnMuaGFzaCkge1xuXHQgICAgICBjb250ZXh0ID0gVXRpbHMuZXh0ZW5kKHt9LCBjb250ZXh0LCBvcHRpb25zLmhhc2gpO1xuXHQgICAgfVxuXG5cdCAgICBwYXJ0aWFsID0gZW52LlZNLnJlc29sdmVQYXJ0aWFsLmNhbGwodGhpcywgcGFydGlhbCwgY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgICB2YXIgcmVzdWx0ID0gZW52LlZNLmludm9rZVBhcnRpYWwuY2FsbCh0aGlzLCBwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKTtcblxuXHQgICAgaWYgKHJlc3VsdCA9PSBudWxsICYmIGVudi5jb21waWxlKSB7XG5cdCAgICAgIG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXSA9IGVudi5jb21waWxlKHBhcnRpYWwsIHRlbXBsYXRlU3BlYy5jb21waWxlck9wdGlvbnMsIGVudik7XG5cdCAgICAgIHJlc3VsdCA9IG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXShjb250ZXh0LCBvcHRpb25zKTtcblx0ICAgIH1cblx0ICAgIGlmIChyZXN1bHQgIT0gbnVsbCkge1xuXHQgICAgICBpZiAob3B0aW9ucy5pbmRlbnQpIHtcblx0ICAgICAgICB2YXIgbGluZXMgPSByZXN1bHQuc3BsaXQoJ1xcbicpO1xuXHQgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGluZXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdCAgICAgICAgICBpZiAoIWxpbmVzW2ldICYmIGkgKyAxID09PSBsKSB7XG5cdCAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgfVxuXG5cdCAgICAgICAgICBsaW5lc1tpXSA9IG9wdGlvbnMuaW5kZW50ICsgbGluZXNbaV07XG5cdCAgICAgICAgfVxuXHQgICAgICAgIHJlc3VsdCA9IGxpbmVzLmpvaW4oJ1xcbicpO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiByZXN1bHQ7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGhlIHBhcnRpYWwgJyArIG9wdGlvbnMubmFtZSArICcgY291bGQgbm90IGJlIGNvbXBpbGVkIHdoZW4gcnVubmluZyBpbiBydW50aW1lLW9ubHkgbW9kZScpO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIC8vIEp1c3QgYWRkIHdhdGVyXG5cdCAgdmFyIGNvbnRhaW5lciA9IHtcblx0ICAgIHN0cmljdDogZnVuY3Rpb24gc3RyaWN0KG9iaiwgbmFtZSkge1xuXHQgICAgICBpZiAoIShuYW1lIGluIG9iaikpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnXCInICsgbmFtZSArICdcIiBub3QgZGVmaW5lZCBpbiAnICsgb2JqKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gb2JqW25hbWVdO1xuXHQgICAgfSxcblx0ICAgIGxvb2t1cDogZnVuY3Rpb24gbG9va3VwKGRlcHRocywgbmFtZSkge1xuXHQgICAgICB2YXIgbGVuID0gZGVwdGhzLmxlbmd0aDtcblx0ICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHQgICAgICAgIGlmIChkZXB0aHNbaV0gJiYgZGVwdGhzW2ldW25hbWVdICE9IG51bGwpIHtcblx0ICAgICAgICAgIHJldHVybiBkZXB0aHNbaV1bbmFtZV07XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9LFxuXHQgICAgbGFtYmRhOiBmdW5jdGlvbiBsYW1iZGEoY3VycmVudCwgY29udGV4dCkge1xuXHQgICAgICByZXR1cm4gdHlwZW9mIGN1cnJlbnQgPT09ICdmdW5jdGlvbicgPyBjdXJyZW50LmNhbGwoY29udGV4dCkgOiBjdXJyZW50O1xuXHQgICAgfSxcblxuXHQgICAgZXNjYXBlRXhwcmVzc2lvbjogVXRpbHMuZXNjYXBlRXhwcmVzc2lvbixcblx0ICAgIGludm9rZVBhcnRpYWw6IGludm9rZVBhcnRpYWxXcmFwcGVyLFxuXG5cdCAgICBmbjogZnVuY3Rpb24gZm4oaSkge1xuXHQgICAgICByZXR1cm4gdGVtcGxhdGVTcGVjW2ldO1xuXHQgICAgfSxcblxuXHQgICAgcHJvZ3JhbXM6IFtdLFxuXHQgICAgcHJvZ3JhbTogZnVuY3Rpb24gcHJvZ3JhbShpLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG5cdCAgICAgIHZhciBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0sXG5cdCAgICAgICAgICBmbiA9IHRoaXMuZm4oaSk7XG5cdCAgICAgIGlmIChkYXRhIHx8IGRlcHRocyB8fCBibG9ja1BhcmFtcyB8fCBkZWNsYXJlZEJsb2NrUGFyYW1zKSB7XG5cdCAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB3cmFwUHJvZ3JhbSh0aGlzLCBpLCBmbiwgZGF0YSwgZGVjbGFyZWRCbG9ja1BhcmFtcywgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG5cdCAgICAgIH0gZWxzZSBpZiAoIXByb2dyYW1XcmFwcGVyKSB7XG5cdCAgICAgICAgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4pO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBwcm9ncmFtV3JhcHBlcjtcblx0ICAgIH0sXG5cblx0ICAgIGRhdGE6IGZ1bmN0aW9uIGRhdGEodmFsdWUsIGRlcHRoKSB7XG5cdCAgICAgIHdoaWxlICh2YWx1ZSAmJiBkZXB0aC0tKSB7XG5cdCAgICAgICAgdmFsdWUgPSB2YWx1ZS5fcGFyZW50O1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiB2YWx1ZTtcblx0ICAgIH0sXG5cdCAgICBtZXJnZTogZnVuY3Rpb24gbWVyZ2UocGFyYW0sIGNvbW1vbikge1xuXHQgICAgICB2YXIgb2JqID0gcGFyYW0gfHwgY29tbW9uO1xuXG5cdCAgICAgIGlmIChwYXJhbSAmJiBjb21tb24gJiYgcGFyYW0gIT09IGNvbW1vbikge1xuXHQgICAgICAgIG9iaiA9IFV0aWxzLmV4dGVuZCh7fSwgY29tbW9uLCBwYXJhbSk7XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gb2JqO1xuXHQgICAgfSxcblxuXHQgICAgbm9vcDogZW52LlZNLm5vb3AsXG5cdCAgICBjb21waWxlckluZm86IHRlbXBsYXRlU3BlYy5jb21waWxlclxuXHQgIH07XG5cblx0ICBmdW5jdGlvbiByZXQoY29udGV4dCkge1xuXHQgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG5cdCAgICB2YXIgZGF0YSA9IG9wdGlvbnMuZGF0YTtcblxuXHQgICAgcmV0Ll9zZXR1cChvcHRpb25zKTtcblx0ICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsICYmIHRlbXBsYXRlU3BlYy51c2VEYXRhKSB7XG5cdCAgICAgIGRhdGEgPSBpbml0RGF0YShjb250ZXh0LCBkYXRhKTtcblx0ICAgIH1cblx0ICAgIHZhciBkZXB0aHMgPSB1bmRlZmluZWQsXG5cdCAgICAgICAgYmxvY2tQYXJhbXMgPSB0ZW1wbGF0ZVNwZWMudXNlQmxvY2tQYXJhbXMgPyBbXSA6IHVuZGVmaW5lZDtcblx0ICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlRGVwdGhzKSB7XG5cdCAgICAgIGRlcHRocyA9IG9wdGlvbnMuZGVwdGhzID8gW2NvbnRleHRdLmNvbmNhdChvcHRpb25zLmRlcHRocykgOiBbY29udGV4dF07XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiB0ZW1wbGF0ZVNwZWMubWFpbi5jYWxsKGNvbnRhaW5lciwgY29udGV4dCwgY29udGFpbmVyLmhlbHBlcnMsIGNvbnRhaW5lci5wYXJ0aWFscywgZGF0YSwgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG5cdCAgfVxuXHQgIHJldC5pc1RvcCA9IHRydWU7XG5cblx0ICByZXQuX3NldHVwID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcblx0ICAgIGlmICghb3B0aW9ucy5wYXJ0aWFsKSB7XG5cdCAgICAgIGNvbnRhaW5lci5oZWxwZXJzID0gY29udGFpbmVyLm1lcmdlKG9wdGlvbnMuaGVscGVycywgZW52LmhlbHBlcnMpO1xuXG5cdCAgICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlUGFydGlhbCkge1xuXHQgICAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLnBhcnRpYWxzLCBlbnYucGFydGlhbHMpO1xuXHQgICAgICB9XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICBjb250YWluZXIuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycztcblx0ICAgICAgY29udGFpbmVyLnBhcnRpYWxzID0gb3B0aW9ucy5wYXJ0aWFscztcblx0ICAgIH1cblx0ICB9O1xuXG5cdCAgcmV0Ll9jaGlsZCA9IGZ1bmN0aW9uIChpLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG5cdCAgICBpZiAodGVtcGxhdGVTcGVjLnVzZUJsb2NrUGFyYW1zICYmICFibG9ja1BhcmFtcykge1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIGJsb2NrIHBhcmFtcycpO1xuXHQgICAgfVxuXHQgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VEZXB0aHMgJiYgIWRlcHRocykge1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnbXVzdCBwYXNzIHBhcmVudCBkZXB0aHMnKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHdyYXBQcm9ncmFtKGNvbnRhaW5lciwgaSwgdGVtcGxhdGVTcGVjW2ldLCBkYXRhLCAwLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcblx0ICB9O1xuXHQgIHJldHVybiByZXQ7XG5cdH1cblxuXHRmdW5jdGlvbiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIGZuLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKSB7XG5cdCAgZnVuY3Rpb24gcHJvZyhjb250ZXh0KSB7XG5cdCAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMV07XG5cblx0ICAgIHJldHVybiBmbi5jYWxsKGNvbnRhaW5lciwgY29udGV4dCwgY29udGFpbmVyLmhlbHBlcnMsIGNvbnRhaW5lci5wYXJ0aWFscywgb3B0aW9ucy5kYXRhIHx8IGRhdGEsIGJsb2NrUGFyYW1zICYmIFtvcHRpb25zLmJsb2NrUGFyYW1zXS5jb25jYXQoYmxvY2tQYXJhbXMpLCBkZXB0aHMgJiYgW2NvbnRleHRdLmNvbmNhdChkZXB0aHMpKTtcblx0ICB9XG5cdCAgcHJvZy5wcm9ncmFtID0gaTtcblx0ICBwcm9nLmRlcHRoID0gZGVwdGhzID8gZGVwdGhzLmxlbmd0aCA6IDA7XG5cdCAgcHJvZy5ibG9ja1BhcmFtcyA9IGRlY2xhcmVkQmxvY2tQYXJhbXMgfHwgMDtcblx0ICByZXR1cm4gcHJvZztcblx0fVxuXG5cdGZ1bmN0aW9uIHJlc29sdmVQYXJ0aWFsKHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICBpZiAoIXBhcnRpYWwpIHtcblx0ICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV07XG5cdCAgfSBlbHNlIGlmICghcGFydGlhbC5jYWxsICYmICFvcHRpb25zLm5hbWUpIHtcblx0ICAgIC8vIFRoaXMgaXMgYSBkeW5hbWljIHBhcnRpYWwgdGhhdCByZXR1cm5lZCBhIHN0cmluZ1xuXHQgICAgb3B0aW9ucy5uYW1lID0gcGFydGlhbDtcblx0ICAgIHBhcnRpYWwgPSBvcHRpb25zLnBhcnRpYWxzW3BhcnRpYWxdO1xuXHQgIH1cblx0ICByZXR1cm4gcGFydGlhbDtcblx0fVxuXG5cdGZ1bmN0aW9uIGludm9rZVBhcnRpYWwocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuXHQgIG9wdGlvbnMucGFydGlhbCA9IHRydWU7XG5cblx0ICBpZiAocGFydGlhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGhlIHBhcnRpYWwgJyArIG9wdGlvbnMubmFtZSArICcgY291bGQgbm90IGJlIGZvdW5kJyk7XG5cdCAgfSBlbHNlIGlmIChwYXJ0aWFsIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcblx0ICAgIHJldHVybiBwYXJ0aWFsKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgIH1cblx0fVxuXG5cdGZ1bmN0aW9uIG5vb3AoKSB7XG5cdCAgcmV0dXJuICcnO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW5pdERhdGEoY29udGV4dCwgZGF0YSkge1xuXHQgIGlmICghZGF0YSB8fCAhKCdyb290JyBpbiBkYXRhKSkge1xuXHQgICAgZGF0YSA9IGRhdGEgPyBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5jcmVhdGVGcmFtZShkYXRhKSA6IHt9O1xuXHQgICAgZGF0YS5yb290ID0gY29udGV4dDtcblx0ICB9XG5cdCAgcmV0dXJuIGRhdGE7XG5cdH1cblxuLyoqKi8gfSxcbi8qIDYgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqLyhmdW5jdGlvbihnbG9iYWwpIHsndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0LypnbG9iYWwgd2luZG93ICovXG5cblx0ZXhwb3J0c1snZGVmYXVsdCddID0gZnVuY3Rpb24gKEhhbmRsZWJhcnMpIHtcblx0ICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXHQgIHZhciByb290ID0gdHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcgPyBnbG9iYWwgOiB3aW5kb3csXG5cdCAgICAgICRIYW5kbGViYXJzID0gcm9vdC5IYW5kbGViYXJzO1xuXHQgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5cdCAgSGFuZGxlYmFycy5ub0NvbmZsaWN0ID0gZnVuY3Rpb24gKCkge1xuXHQgICAgaWYgKHJvb3QuSGFuZGxlYmFycyA9PT0gSGFuZGxlYmFycykge1xuXHQgICAgICByb290LkhhbmRsZWJhcnMgPSAkSGFuZGxlYmFycztcblx0ICAgIH1cblx0ICB9O1xuXHR9O1xuXG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi99LmNhbGwoZXhwb3J0cywgKGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSgpKSkpXG5cbi8qKiovIH0sXG4vKiA3ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHRcInVzZSBzdHJpY3RcIjtcblxuXHRleHBvcnRzW1wiZGVmYXVsdFwiXSA9IGZ1bmN0aW9uIChvYmopIHtcblx0ICByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDoge1xuXHQgICAgXCJkZWZhdWx0XCI6IG9ialxuXHQgIH07XG5cdH07XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuLyoqKi8gfVxuLyoqKioqKi8gXSlcbn0pO1xuOyIsIm1vZHVsZS5leHBvcnRzID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAoYXJyKSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoYXJyKSA9PSAnW29iamVjdCBBcnJheV0nO1xufTtcbiIsIiAgLyogZ2xvYmFscyByZXF1aXJlLCBtb2R1bGUgKi9cblxuICAndXNlIHN0cmljdCc7XG5cbiAgLyoqXG4gICAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXG4gICAqL1xuXG4gIHZhciBwYXRodG9SZWdleHAgPSByZXF1aXJlKCdwYXRoLXRvLXJlZ2V4cCcpO1xuXG4gIC8qKlxuICAgKiBNb2R1bGUgZXhwb3J0cy5cbiAgICovXG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBwYWdlO1xuXG4gIC8qKlxuICAgKiBEZXRlY3QgY2xpY2sgZXZlbnRcbiAgICovXG4gIHZhciBjbGlja0V2ZW50ID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2YgZG9jdW1lbnQpICYmIGRvY3VtZW50Lm9udG91Y2hzdGFydCA/ICd0b3VjaHN0YXJ0JyA6ICdjbGljayc7XG5cbiAgLyoqXG4gICAqIFRvIHdvcmsgcHJvcGVybHkgd2l0aCB0aGUgVVJMXG4gICAqIGhpc3RvcnkubG9jYXRpb24gZ2VuZXJhdGVkIHBvbHlmaWxsIGluIGh0dHBzOi8vZ2l0aHViLmNvbS9kZXZvdGUvSFRNTDUtSGlzdG9yeS1BUElcbiAgICovXG5cbiAgdmFyIGxvY2F0aW9uID0gKCd1bmRlZmluZWQnICE9PSB0eXBlb2Ygd2luZG93KSAmJiAod2luZG93Lmhpc3RvcnkubG9jYXRpb24gfHwgd2luZG93LmxvY2F0aW9uKTtcblxuICAvKipcbiAgICogUGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoLlxuICAgKi9cblxuICB2YXIgZGlzcGF0Y2ggPSB0cnVlO1xuXG5cbiAgLyoqXG4gICAqIERlY29kZSBVUkwgY29tcG9uZW50cyAocXVlcnkgc3RyaW5nLCBwYXRobmFtZSwgaGFzaCkuXG4gICAqIEFjY29tbW9kYXRlcyBib3RoIHJlZ3VsYXIgcGVyY2VudCBlbmNvZGluZyBhbmQgeC13d3ctZm9ybS11cmxlbmNvZGVkIGZvcm1hdC5cbiAgICovXG4gIHZhciBkZWNvZGVVUkxDb21wb25lbnRzID0gdHJ1ZTtcblxuICAvKipcbiAgICogQmFzZSBwYXRoLlxuICAgKi9cblxuICB2YXIgYmFzZSA9ICcnO1xuXG4gIC8qKlxuICAgKiBSdW5uaW5nIGZsYWcuXG4gICAqL1xuXG4gIHZhciBydW5uaW5nO1xuXG4gIC8qKlxuICAgKiBIYXNoQmFuZyBvcHRpb25cbiAgICovXG5cbiAgdmFyIGhhc2hiYW5nID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIFByZXZpb3VzIGNvbnRleHQsIGZvciBjYXB0dXJpbmdcbiAgICogcGFnZSBleGl0IGV2ZW50cy5cbiAgICovXG5cbiAgdmFyIHByZXZDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBgcGF0aGAgd2l0aCBjYWxsYmFjayBgZm4oKWAsXG4gICAqIG9yIHJvdXRlIGBwYXRoYCwgb3IgcmVkaXJlY3Rpb24sXG4gICAqIG9yIGBwYWdlLnN0YXJ0KClgLlxuICAgKlxuICAgKiAgIHBhZ2UoZm4pO1xuICAgKiAgIHBhZ2UoJyonLCBmbik7XG4gICAqICAgcGFnZSgnL3VzZXIvOmlkJywgbG9hZCwgdXNlcik7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQsIHsgc29tZTogJ3RoaW5nJyB9KTtcbiAgICogICBwYWdlKCcvdXNlci8nICsgdXNlci5pZCk7XG4gICAqICAgcGFnZSgnL2Zyb20nLCAnL3RvJylcbiAgICogICBwYWdlKCk7XG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfEZ1bmN0aW9ufSBwYXRoXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuLi4uXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHBhZ2UocGF0aCwgZm4pIHtcbiAgICAvLyA8Y2FsbGJhY2s+XG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICByZXR1cm4gcGFnZSgnKicsIHBhdGgpO1xuICAgIH1cblxuICAgIC8vIHJvdXRlIDxwYXRoPiB0byA8Y2FsbGJhY2sgLi4uPlxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgZm4pIHtcbiAgICAgIHZhciByb3V0ZSA9IG5ldyBSb3V0ZShwYXRoKTtcbiAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHBhZ2UuY2FsbGJhY2tzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICAgIH1cbiAgICAgIC8vIHNob3cgPHBhdGg+IHdpdGggW3N0YXRlXVxuICAgIH0gZWxzZSBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBwYXRoKSB7XG4gICAgICBwYWdlWydzdHJpbmcnID09PSB0eXBlb2YgZm4gPyAncmVkaXJlY3QnIDogJ3Nob3cnXShwYXRoLCBmbik7XG4gICAgICAvLyBzdGFydCBbb3B0aW9uc11cbiAgICB9IGVsc2Uge1xuICAgICAgcGFnZS5zdGFydChwYXRoKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQ2FsbGJhY2sgZnVuY3Rpb25zLlxuICAgKi9cblxuICBwYWdlLmNhbGxiYWNrcyA9IFtdO1xuICBwYWdlLmV4aXRzID0gW107XG5cbiAgLyoqXG4gICAqIEN1cnJlbnQgcGF0aCBiZWluZyBwcm9jZXNzZWRcbiAgICogQHR5cGUge1N0cmluZ31cbiAgICovXG4gIHBhZ2UuY3VycmVudCA9ICcnO1xuXG4gIC8qKlxuICAgKiBOdW1iZXIgb2YgcGFnZXMgbmF2aWdhdGVkIHRvLlxuICAgKiBAdHlwZSB7bnVtYmVyfVxuICAgKlxuICAgKiAgICAgcGFnZS5sZW4gPT0gMDtcbiAgICogICAgIHBhZ2UoJy9sb2dpbicpO1xuICAgKiAgICAgcGFnZS5sZW4gPT0gMTtcbiAgICovXG5cbiAgcGFnZS5sZW4gPSAwO1xuXG4gIC8qKlxuICAgKiBHZXQgb3Igc2V0IGJhc2VwYXRoIHRvIGBwYXRoYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYXNlID0gZnVuY3Rpb24ocGF0aCkge1xuICAgIGlmICgwID09PSBhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gYmFzZTtcbiAgICBiYXNlID0gcGF0aDtcbiAgfTtcblxuICAvKipcbiAgICogQmluZCB3aXRoIHRoZSBnaXZlbiBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgIC0gYGNsaWNrYCBiaW5kIHRvIGNsaWNrIGV2ZW50cyBbdHJ1ZV1cbiAgICogICAgLSBgcG9wc3RhdGVgIGJpbmQgdG8gcG9wc3RhdGUgW3RydWVdXG4gICAqICAgIC0gYGRpc3BhdGNoYCBwZXJmb3JtIGluaXRpYWwgZGlzcGF0Y2ggW3RydWVdXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc3RhcnQgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgaWYgKHJ1bm5pbmcpIHJldHVybjtcbiAgICBydW5uaW5nID0gdHJ1ZTtcbiAgICBpZiAoZmFsc2UgPT09IG9wdGlvbnMuZGlzcGF0Y2gpIGRpc3BhdGNoID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlID09PSBvcHRpb25zLmRlY29kZVVSTENvbXBvbmVudHMpIGRlY29kZVVSTENvbXBvbmVudHMgPSBmYWxzZTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMucG9wc3RhdGUpIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgICBpZiAoZmFsc2UgIT09IG9wdGlvbnMuY2xpY2spIHtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIH1cbiAgICBpZiAodHJ1ZSA9PT0gb3B0aW9ucy5oYXNoYmFuZykgaGFzaGJhbmcgPSB0cnVlO1xuICAgIGlmICghZGlzcGF0Y2gpIHJldHVybjtcbiAgICB2YXIgdXJsID0gKGhhc2hiYW5nICYmIH5sb2NhdGlvbi5oYXNoLmluZGV4T2YoJyMhJykpID8gbG9jYXRpb24uaGFzaC5zdWJzdHIoMikgKyBsb2NhdGlvbi5zZWFyY2ggOiBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaCArIGxvY2F0aW9uLmhhc2g7XG4gICAgcGFnZS5yZXBsYWNlKHVybCwgbnVsbCwgdHJ1ZSwgZGlzcGF0Y2gpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBVbmJpbmQgY2xpY2sgYW5kIHBvcHN0YXRlIGV2ZW50IGhhbmRsZXJzLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0b3AgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoIXJ1bm5pbmcpIHJldHVybjtcbiAgICBwYWdlLmN1cnJlbnQgPSAnJztcbiAgICBwYWdlLmxlbiA9IDA7XG4gICAgcnVubmluZyA9IGZhbHNlO1xuICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoY2xpY2tFdmVudCwgb25jbGljaywgZmFsc2UpO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdwb3BzdGF0ZScsIG9ucG9wc3RhdGUsIGZhbHNlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2hvdyBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gZGlzcGF0Y2hcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zaG93ID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGRpc3BhdGNoLCBwdXNoKSB7XG4gICAgdmFyIGN0eCA9IG5ldyBDb250ZXh0KHBhdGgsIHN0YXRlKTtcbiAgICBwYWdlLmN1cnJlbnQgPSBjdHgucGF0aDtcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgaWYgKGZhbHNlICE9PSBjdHguaGFuZGxlZCAmJiBmYWxzZSAhPT0gcHVzaCkgY3R4LnB1c2hTdGF0ZSgpO1xuICAgIHJldHVybiBjdHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEdvZXMgYmFjayBpbiB0aGUgaGlzdG9yeVxuICAgKiBCYWNrIHNob3VsZCBhbHdheXMgbGV0IHRoZSBjdXJyZW50IHJvdXRlIHB1c2ggc3RhdGUgYW5kIHRoZW4gZ28gYmFjay5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGggLSBmYWxsYmFjayBwYXRoIHRvIGdvIGJhY2sgaWYgbm8gbW9yZSBoaXN0b3J5IGV4aXN0cywgaWYgdW5kZWZpbmVkIGRlZmF1bHRzIHRvIHBhZ2UuYmFzZVxuICAgKiBAcGFyYW0ge09iamVjdH0gW3N0YXRlXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLmJhY2sgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSkge1xuICAgIGlmIChwYWdlLmxlbiA+IDApIHtcbiAgICAgIC8vIHRoaXMgbWF5IG5lZWQgbW9yZSB0ZXN0aW5nIHRvIHNlZSBpZiBhbGwgYnJvd3NlcnNcbiAgICAgIC8vIHdhaXQgZm9yIHRoZSBuZXh0IHRpY2sgdG8gZ28gYmFjayBpbiBoaXN0b3J5XG4gICAgICBoaXN0b3J5LmJhY2soKTtcbiAgICAgIHBhZ2UubGVuLS07XG4gICAgfSBlbHNlIGlmIChwYXRoKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3cocGF0aCwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfWVsc2V7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnNob3coYmFzZSwgc3RhdGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xuXG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIHJvdXRlIHRvIHJlZGlyZWN0IGZyb20gb25lIHBhdGggdG8gb3RoZXJcbiAgICogb3IganVzdCByZWRpcmVjdCB0byBhbm90aGVyIHJvdXRlXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBmcm9tIC0gaWYgcGFyYW0gJ3RvJyBpcyB1bmRlZmluZWQgcmVkaXJlY3RzIHRvICdmcm9tJ1xuICAgKiBAcGFyYW0ge1N0cmluZ30gW3RvXVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cbiAgcGFnZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gICAgLy8gRGVmaW5lIHJvdXRlIGZyb20gYSBwYXRoIHRvIGFub3RoZXJcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBmcm9tICYmICdzdHJpbmcnID09PSB0eXBlb2YgdG8pIHtcbiAgICAgIHBhZ2UoZnJvbSwgZnVuY3Rpb24oZSkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHBhZ2UucmVwbGFjZSh0byk7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gV2FpdCBmb3IgdGhlIHB1c2ggc3RhdGUgYW5kIHJlcGxhY2UgaXQgd2l0aCBhbm90aGVyXG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZnJvbSAmJiAndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHRvKSB7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICBwYWdlLnJlcGxhY2UoZnJvbSk7XG4gICAgICB9LCAwKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlcGxhY2UgYHBhdGhgIHdpdGggb3B0aW9uYWwgYHN0YXRlYCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAcmV0dXJuIHtDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuXG4gIHBhZ2UucmVwbGFjZSA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlLCBpbml0LCBkaXNwYXRjaCkge1xuICAgIHZhciBjdHggPSBuZXcgQ29udGV4dChwYXRoLCBzdGF0ZSk7XG4gICAgcGFnZS5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgY3R4LmluaXQgPSBpbml0O1xuICAgIGN0eC5zYXZlKCk7IC8vIHNhdmUgYmVmb3JlIGRpc3BhdGNoaW5nLCB3aGljaCBtYXkgcmVkaXJlY3RcbiAgICBpZiAoZmFsc2UgIT09IGRpc3BhdGNoKSBwYWdlLmRpc3BhdGNoKGN0eCk7XG4gICAgcmV0dXJuIGN0eDtcbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2ggdGhlIGdpdmVuIGBjdHhgLlxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBwYWdlLmRpc3BhdGNoID0gZnVuY3Rpb24oY3R4KSB7XG4gICAgdmFyIHByZXYgPSBwcmV2Q29udGV4dCxcbiAgICAgIGkgPSAwLFxuICAgICAgaiA9IDA7XG5cbiAgICBwcmV2Q29udGV4dCA9IGN0eDtcblxuICAgIGZ1bmN0aW9uIG5leHRFeGl0KCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5leGl0c1tqKytdO1xuICAgICAgaWYgKCFmbikgcmV0dXJuIG5leHRFbnRlcigpO1xuICAgICAgZm4ocHJldiwgbmV4dEV4aXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG5leHRFbnRlcigpIHtcbiAgICAgIHZhciBmbiA9IHBhZ2UuY2FsbGJhY2tzW2krK107XG5cbiAgICAgIGlmIChjdHgucGF0aCAhPT0gcGFnZS5jdXJyZW50KSB7XG4gICAgICAgIGN0eC5oYW5kbGVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghZm4pIHJldHVybiB1bmhhbmRsZWQoY3R4KTtcbiAgICAgIGZuKGN0eCwgbmV4dEVudGVyKTtcbiAgICB9XG5cbiAgICBpZiAocHJldikge1xuICAgICAgbmV4dEV4aXQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV4dEVudGVyKCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBVbmhhbmRsZWQgYGN0eGAuIFdoZW4gaXQncyBub3QgdGhlIGluaXRpYWxcbiAgICogcG9wc3RhdGUgdGhlbiByZWRpcmVjdC4gSWYgeW91IHdpc2ggdG8gaGFuZGxlXG4gICAqIDQwNHMgb24geW91ciBvd24gdXNlIGBwYWdlKCcqJywgY2FsbGJhY2spYC5cbiAgICpcbiAgICogQHBhcmFtIHtDb250ZXh0fSBjdHhcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHVuaGFuZGxlZChjdHgpIHtcbiAgICBpZiAoY3R4LmhhbmRsZWQpIHJldHVybjtcbiAgICB2YXIgY3VycmVudDtcblxuICAgIGlmIChoYXNoYmFuZykge1xuICAgICAgY3VycmVudCA9IGJhc2UgKyBsb2NhdGlvbi5oYXNoLnJlcGxhY2UoJyMhJywgJycpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjdXJyZW50ID0gbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2g7XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnQgPT09IGN0eC5jYW5vbmljYWxQYXRoKSByZXR1cm47XG4gICAgcGFnZS5zdG9wKCk7XG4gICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICBsb2NhdGlvbi5ocmVmID0gY3R4LmNhbm9uaWNhbFBhdGg7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXIgYW4gZXhpdCByb3V0ZSBvbiBgcGF0aGAgd2l0aFxuICAgKiBjYWxsYmFjayBgZm4oKWAsIHdoaWNoIHdpbGwgYmUgY2FsbGVkXG4gICAqIG9uIHRoZSBwcmV2aW91cyBjb250ZXh0IHdoZW4gYSBuZXdcbiAgICogcGFnZSBpcyB2aXNpdGVkLlxuICAgKi9cbiAgcGFnZS5leGl0ID0gZnVuY3Rpb24ocGF0aCwgZm4pIHtcbiAgICBpZiAodHlwZW9mIHBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBwYWdlLmV4aXQoJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIHBhZ2UuZXhpdHMucHVzaChyb3V0ZS5taWRkbGV3YXJlKGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVtb3ZlIFVSTCBlbmNvZGluZyBmcm9tIHRoZSBnaXZlbiBgc3RyYC5cbiAgICogQWNjb21tb2RhdGVzIHdoaXRlc3BhY2UgaW4gYm90aCB4LXd3dy1mb3JtLXVybGVuY29kZWRcbiAgICogYW5kIHJlZ3VsYXIgcGVyY2VudC1lbmNvZGVkIGZvcm0uXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyfSBVUkwgY29tcG9uZW50IHRvIGRlY29kZVxuICAgKi9cbiAgZnVuY3Rpb24gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudCh2YWwpIHtcbiAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHsgcmV0dXJuIHZhbDsgfVxuICAgIHJldHVybiBkZWNvZGVVUkxDb21wb25lbnRzID8gZGVjb2RlVVJJQ29tcG9uZW50KHZhbC5yZXBsYWNlKC9cXCsvZywgJyAnKSkgOiB2YWw7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBhIG5ldyBcInJlcXVlc3RcIiBgQ29udGV4dGBcbiAgICogd2l0aCB0aGUgZ2l2ZW4gYHBhdGhgIGFuZCBvcHRpb25hbCBpbml0aWFsIGBzdGF0ZWAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBDb250ZXh0KHBhdGgsIHN0YXRlKSB7XG4gICAgaWYgKCcvJyA9PT0gcGF0aFswXSAmJiAwICE9PSBwYXRoLmluZGV4T2YoYmFzZSkpIHBhdGggPSBiYXNlICsgKGhhc2hiYW5nID8gJyMhJyA6ICcnKSArIHBhdGg7XG4gICAgdmFyIGkgPSBwYXRoLmluZGV4T2YoJz8nKTtcblxuICAgIHRoaXMuY2Fub25pY2FsUGF0aCA9IHBhdGg7XG4gICAgdGhpcy5wYXRoID0gcGF0aC5yZXBsYWNlKGJhc2UsICcnKSB8fCAnLyc7XG4gICAgaWYgKGhhc2hiYW5nKSB0aGlzLnBhdGggPSB0aGlzLnBhdGgucmVwbGFjZSgnIyEnLCAnJykgfHwgJy8nO1xuXG4gICAgdGhpcy50aXRsZSA9IGRvY3VtZW50LnRpdGxlO1xuICAgIHRoaXMuc3RhdGUgPSBzdGF0ZSB8fCB7fTtcbiAgICB0aGlzLnN0YXRlLnBhdGggPSBwYXRoO1xuICAgIHRoaXMucXVlcnlzdHJpbmcgPSB+aSA/IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGF0aC5zbGljZShpICsgMSkpIDogJyc7XG4gICAgdGhpcy5wYXRobmFtZSA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQofmkgPyBwYXRoLnNsaWNlKDAsIGkpIDogcGF0aCk7XG4gICAgdGhpcy5wYXJhbXMgPSB7fTtcblxuICAgIC8vIGZyYWdtZW50XG4gICAgdGhpcy5oYXNoID0gJyc7XG4gICAgaWYgKCFoYXNoYmFuZykge1xuICAgICAgaWYgKCF+dGhpcy5wYXRoLmluZGV4T2YoJyMnKSkgcmV0dXJuO1xuICAgICAgdmFyIHBhcnRzID0gdGhpcy5wYXRoLnNwbGl0KCcjJyk7XG4gICAgICB0aGlzLnBhdGggPSBwYXJ0c1swXTtcbiAgICAgIHRoaXMuaGFzaCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQocGFydHNbMV0pIHx8ICcnO1xuICAgICAgdGhpcy5xdWVyeXN0cmluZyA9IHRoaXMucXVlcnlzdHJpbmcuc3BsaXQoJyMnKVswXTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBDb250ZXh0YC5cbiAgICovXG5cbiAgcGFnZS5Db250ZXh0ID0gQ29udGV4dDtcblxuICAvKipcbiAgICogUHVzaCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnB1c2hTdGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHBhZ2UubGVuKys7XG4gICAgaGlzdG9yeS5wdXNoU3RhdGUodGhpcy5zdGF0ZSwgdGhpcy50aXRsZSwgaGFzaGJhbmcgJiYgdGhpcy5wYXRoICE9PSAnLycgPyAnIyEnICsgdGhpcy5wYXRoIDogdGhpcy5jYW5vbmljYWxQYXRoKTtcbiAgfTtcblxuICAvKipcbiAgICogU2F2ZSB0aGUgY29udGV4dCBzdGF0ZS5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgQ29udGV4dC5wcm90b3R5cGUuc2F2ZSA9IGZ1bmN0aW9uKCkge1xuICAgIGhpc3RvcnkucmVwbGFjZVN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIGhhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYFJvdXRlYCB3aXRoIHRoZSBnaXZlbiBIVFRQIGBwYXRoYCxcbiAgICogYW5kIGFuIGFycmF5IG9mIGBjYWxsYmFja3NgIGFuZCBgb3B0aW9uc2AuXG4gICAqXG4gICAqIE9wdGlvbnM6XG4gICAqXG4gICAqICAgLSBgc2Vuc2l0aXZlYCAgICBlbmFibGUgY2FzZS1zZW5zaXRpdmUgcm91dGVzXG4gICAqICAgLSBgc3RyaWN0YCAgICAgICBlbmFibGUgc3RyaWN0IG1hdGNoaW5nIGZvciB0cmFpbGluZyBzbGFzaGVzXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gUm91dGUocGF0aCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIHRoaXMucGF0aCA9IChwYXRoID09PSAnKicpID8gJyguKiknIDogcGF0aDtcbiAgICB0aGlzLm1ldGhvZCA9ICdHRVQnO1xuICAgIHRoaXMucmVnZXhwID0gcGF0aHRvUmVnZXhwKHRoaXMucGF0aCxcbiAgICAgIHRoaXMua2V5cyA9IFtdLFxuICAgICAgb3B0aW9ucy5zZW5zaXRpdmUsXG4gICAgICBvcHRpb25zLnN0cmljdCk7XG4gIH1cblxuICAvKipcbiAgICogRXhwb3NlIGBSb3V0ZWAuXG4gICAqL1xuXG4gIHBhZ2UuUm91dGUgPSBSb3V0ZTtcblxuICAvKipcbiAgICogUmV0dXJuIHJvdXRlIG1pZGRsZXdhcmUgd2l0aFxuICAgKiB0aGUgZ2l2ZW4gY2FsbGJhY2sgYGZuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICAgKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1pZGRsZXdhcmUgPSBmdW5jdGlvbihmbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICByZXR1cm4gZnVuY3Rpb24oY3R4LCBuZXh0KSB7XG4gICAgICBpZiAoc2VsZi5tYXRjaChjdHgucGF0aCwgY3R4LnBhcmFtcykpIHJldHVybiBmbihjdHgsIG5leHQpO1xuICAgICAgbmV4dCgpO1xuICAgIH07XG4gIH07XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIHRoaXMgcm91dGUgbWF0Y2hlcyBgcGF0aGAsIGlmIHNvXG4gICAqIHBvcHVsYXRlIGBwYXJhbXNgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gcGFyYW1zXG4gICAqIEByZXR1cm4ge0Jvb2xlYW59XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWF0Y2ggPSBmdW5jdGlvbihwYXRoLCBwYXJhbXMpIHtcbiAgICB2YXIga2V5cyA9IHRoaXMua2V5cyxcbiAgICAgIHFzSW5kZXggPSBwYXRoLmluZGV4T2YoJz8nKSxcbiAgICAgIHBhdGhuYW1lID0gfnFzSW5kZXggPyBwYXRoLnNsaWNlKDAsIHFzSW5kZXgpIDogcGF0aCxcbiAgICAgIG0gPSB0aGlzLnJlZ2V4cC5leGVjKGRlY29kZVVSSUNvbXBvbmVudChwYXRobmFtZSkpO1xuXG4gICAgaWYgKCFtKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKHZhciBpID0gMSwgbGVuID0gbS5sZW5ndGg7IGkgPCBsZW47ICsraSkge1xuICAgICAgdmFyIGtleSA9IGtleXNbaSAtIDFdO1xuICAgICAgdmFyIHZhbCA9IGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQobVtpXSk7XG4gICAgICBpZiAodmFsICE9PSB1bmRlZmluZWQgfHwgIShoYXNPd25Qcm9wZXJ0eS5jYWxsKHBhcmFtcywga2V5Lm5hbWUpKSkge1xuICAgICAgICBwYXJhbXNba2V5Lm5hbWVdID0gdmFsO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEhhbmRsZSBcInBvcHVsYXRlXCIgZXZlbnRzLlxuICAgKi9cblxuICB2YXIgb25wb3BzdGF0ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxvYWRlZCA9IGZhbHNlO1xuICAgIGlmICgndW5kZWZpbmVkJyA9PT0gdHlwZW9mIHdpbmRvdykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZG9jdW1lbnQucmVhZHlTdGF0ZSA9PT0gJ2NvbXBsZXRlJykge1xuICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBsb2FkZWQgPSB0cnVlO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZnVuY3Rpb24gb25wb3BzdGF0ZShlKSB7XG4gICAgICBpZiAoIWxvYWRlZCkgcmV0dXJuO1xuICAgICAgaWYgKGUuc3RhdGUpIHtcbiAgICAgICAgdmFyIHBhdGggPSBlLnN0YXRlLnBhdGg7XG4gICAgICAgIHBhZ2UucmVwbGFjZShwYXRoLCBlLnN0YXRlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLmhhc2gsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBmYWxzZSk7XG4gICAgICB9XG4gICAgfTtcbiAgfSkoKTtcbiAgLyoqXG4gICAqIEhhbmRsZSBcImNsaWNrXCIgZXZlbnRzLlxuICAgKi9cblxuICBmdW5jdGlvbiBvbmNsaWNrKGUpIHtcblxuICAgIGlmICgxICE9PSB3aGljaChlKSkgcmV0dXJuO1xuXG4gICAgaWYgKGUubWV0YUtleSB8fCBlLmN0cmxLZXkgfHwgZS5zaGlmdEtleSkgcmV0dXJuO1xuICAgIGlmIChlLmRlZmF1bHRQcmV2ZW50ZWQpIHJldHVybjtcblxuXG5cbiAgICAvLyBlbnN1cmUgbGlua1xuICAgIHZhciBlbCA9IGUudGFyZ2V0O1xuICAgIHdoaWxlIChlbCAmJiAnQScgIT09IGVsLm5vZGVOYW1lKSBlbCA9IGVsLnBhcmVudE5vZGU7XG4gICAgaWYgKCFlbCB8fCAnQScgIT09IGVsLm5vZGVOYW1lKSByZXR1cm47XG5cblxuXG4gICAgLy8gSWdub3JlIGlmIHRhZyBoYXNcbiAgICAvLyAxLiBcImRvd25sb2FkXCIgYXR0cmlidXRlXG4gICAgLy8gMi4gcmVsPVwiZXh0ZXJuYWxcIiBhdHRyaWJ1dGVcbiAgICBpZiAoZWwuaGFzQXR0cmlidXRlKCdkb3dubG9hZCcpIHx8IGVsLmdldEF0dHJpYnV0ZSgncmVsJykgPT09ICdleHRlcm5hbCcpIHJldHVybjtcblxuICAgIC8vIGVuc3VyZSBub24taGFzaCBmb3IgdGhlIHNhbWUgcGF0aFxuICAgIHZhciBsaW5rID0gZWwuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG4gICAgaWYgKCFoYXNoYmFuZyAmJiBlbC5wYXRobmFtZSA9PT0gbG9jYXRpb24ucGF0aG5hbWUgJiYgKGVsLmhhc2ggfHwgJyMnID09PSBsaW5rKSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIENoZWNrIGZvciBtYWlsdG86IGluIHRoZSBocmVmXG4gICAgaWYgKGxpbmsgJiYgbGluay5pbmRleE9mKCdtYWlsdG86JykgPiAtMSkgcmV0dXJuO1xuXG4gICAgLy8gY2hlY2sgdGFyZ2V0XG4gICAgaWYgKGVsLnRhcmdldCkgcmV0dXJuO1xuXG4gICAgLy8geC1vcmlnaW5cbiAgICBpZiAoIXNhbWVPcmlnaW4oZWwuaHJlZikpIHJldHVybjtcblxuXG5cbiAgICAvLyByZWJ1aWxkIHBhdGhcbiAgICB2YXIgcGF0aCA9IGVsLnBhdGhuYW1lICsgZWwuc2VhcmNoICsgKGVsLmhhc2ggfHwgJycpO1xuXG4gICAgLy8gc3RyaXAgbGVhZGluZyBcIi9bZHJpdmUgbGV0dGVyXTpcIiBvbiBOVy5qcyBvbiBXaW5kb3dzXG4gICAgaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJyAmJiBwYXRoLm1hdGNoKC9eXFwvW2EtekEtWl06XFwvLykpIHtcbiAgICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoL15cXC9bYS16QS1aXTpcXC8vLCAnLycpO1xuICAgIH1cblxuICAgIC8vIHNhbWUgcGFnZVxuICAgIHZhciBvcmlnID0gcGF0aDtcblxuICAgIGlmIChwYXRoLmluZGV4T2YoYmFzZSkgPT09IDApIHtcbiAgICAgIHBhdGggPSBwYXRoLnN1YnN0cihiYXNlLmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKGhhc2hiYW5nKSBwYXRoID0gcGF0aC5yZXBsYWNlKCcjIScsICcnKTtcblxuICAgIGlmIChiYXNlICYmIG9yaWcgPT09IHBhdGgpIHJldHVybjtcblxuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBwYWdlLnNob3cob3JpZyk7XG4gIH1cblxuICAvKipcbiAgICogRXZlbnQgYnV0dG9uLlxuICAgKi9cblxuICBmdW5jdGlvbiB3aGljaChlKSB7XG4gICAgZSA9IGUgfHwgd2luZG93LmV2ZW50O1xuICAgIHJldHVybiBudWxsID09PSBlLndoaWNoID8gZS5idXR0b24gOiBlLndoaWNoO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIGlmIGBocmVmYCBpcyB0aGUgc2FtZSBvcmlnaW4uXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHNhbWVPcmlnaW4oaHJlZikge1xuICAgIHZhciBvcmlnaW4gPSBsb2NhdGlvbi5wcm90b2NvbCArICcvLycgKyBsb2NhdGlvbi5ob3N0bmFtZTtcbiAgICBpZiAobG9jYXRpb24ucG9ydCkgb3JpZ2luICs9ICc6JyArIGxvY2F0aW9uLnBvcnQ7XG4gICAgcmV0dXJuIChocmVmICYmICgwID09PSBocmVmLmluZGV4T2Yob3JpZ2luKSkpO1xuICB9XG5cbiAgcGFnZS5zYW1lT3JpZ2luID0gc2FtZU9yaWdpbjtcbiIsInZhciBpc2FycmF5ID0gcmVxdWlyZSgnaXNhcnJheScpXG5cbi8qKlxuICogRXhwb3NlIGBwYXRoVG9SZWdleHBgLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHBhdGhUb1JlZ2V4cFxubW9kdWxlLmV4cG9ydHMucGFyc2UgPSBwYXJzZVxubW9kdWxlLmV4cG9ydHMuY29tcGlsZSA9IGNvbXBpbGVcbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvRnVuY3Rpb24gPSB0b2tlbnNUb0Z1bmN0aW9uXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb1JlZ0V4cCA9IHRva2Vuc1RvUmVnRXhwXG5cbi8qKlxuICogVGhlIG1haW4gcGF0aCBtYXRjaGluZyByZWdleHAgdXRpbGl0eS5cbiAqXG4gKiBAdHlwZSB7UmVnRXhwfVxuICovXG52YXIgUEFUSF9SRUdFWFAgPSBuZXcgUmVnRXhwKFtcbiAgLy8gTWF0Y2ggZXNjYXBlZCBjaGFyYWN0ZXJzIHRoYXQgd291bGQgb3RoZXJ3aXNlIGFwcGVhciBpbiBmdXR1cmUgbWF0Y2hlcy5cbiAgLy8gVGhpcyBhbGxvd3MgdGhlIHVzZXIgdG8gZXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyB0aGF0IHdvbid0IHRyYW5zZm9ybS5cbiAgJyhcXFxcXFxcXC4pJyxcbiAgLy8gTWF0Y2ggRXhwcmVzcy1zdHlsZSBwYXJhbWV0ZXJzIGFuZCB1bi1uYW1lZCBwYXJhbWV0ZXJzIHdpdGggYSBwcmVmaXhcbiAgLy8gYW5kIG9wdGlvbmFsIHN1ZmZpeGVzLiBNYXRjaGVzIGFwcGVhciBhczpcbiAgLy9cbiAgLy8gXCIvOnRlc3QoXFxcXGQrKT9cIiA9PiBbXCIvXCIsIFwidGVzdFwiLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCBcIj9cIiwgdW5kZWZpbmVkXVxuICAvLyBcIi9yb3V0ZShcXFxcZCspXCIgID0+IFt1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIlxcZCtcIiwgdW5kZWZpbmVkLCB1bmRlZmluZWRdXG4gIC8vIFwiLypcIiAgICAgICAgICAgID0+IFtcIi9cIiwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCBcIipcIl1cbiAgJyhbXFxcXC8uXSk/KD86KD86XFxcXDooXFxcXHcrKSg/OlxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKT98XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpKFsrKj9dKT98KFxcXFwqKSknXG5dLmpvaW4oJ3wnKSwgJ2cnKVxuXG4vKipcbiAqIFBhcnNlIGEgc3RyaW5nIGZvciB0aGUgcmF3IHRva2Vucy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7QXJyYXl9XG4gKi9cbmZ1bmN0aW9uIHBhcnNlIChzdHIpIHtcbiAgdmFyIHRva2VucyA9IFtdXG4gIHZhciBrZXkgPSAwXG4gIHZhciBpbmRleCA9IDBcbiAgdmFyIHBhdGggPSAnJ1xuICB2YXIgcmVzXG5cbiAgd2hpbGUgKChyZXMgPSBQQVRIX1JFR0VYUC5leGVjKHN0cikpICE9IG51bGwpIHtcbiAgICB2YXIgbSA9IHJlc1swXVxuICAgIHZhciBlc2NhcGVkID0gcmVzWzFdXG4gICAgdmFyIG9mZnNldCA9IHJlcy5pbmRleFxuICAgIHBhdGggKz0gc3RyLnNsaWNlKGluZGV4LCBvZmZzZXQpXG4gICAgaW5kZXggPSBvZmZzZXQgKyBtLmxlbmd0aFxuXG4gICAgLy8gSWdub3JlIGFscmVhZHkgZXNjYXBlZCBzZXF1ZW5jZXMuXG4gICAgaWYgKGVzY2FwZWQpIHtcbiAgICAgIHBhdGggKz0gZXNjYXBlZFsxXVxuICAgICAgY29udGludWVcbiAgICB9XG5cbiAgICAvLyBQdXNoIHRoZSBjdXJyZW50IHBhdGggb250byB0aGUgdG9rZW5zLlxuICAgIGlmIChwYXRoKSB7XG4gICAgICB0b2tlbnMucHVzaChwYXRoKVxuICAgICAgcGF0aCA9ICcnXG4gICAgfVxuXG4gICAgdmFyIHByZWZpeCA9IHJlc1syXVxuICAgIHZhciBuYW1lID0gcmVzWzNdXG4gICAgdmFyIGNhcHR1cmUgPSByZXNbNF1cbiAgICB2YXIgZ3JvdXAgPSByZXNbNV1cbiAgICB2YXIgc3VmZml4ID0gcmVzWzZdXG4gICAgdmFyIGFzdGVyaXNrID0gcmVzWzddXG5cbiAgICB2YXIgcmVwZWF0ID0gc3VmZml4ID09PSAnKycgfHwgc3VmZml4ID09PSAnKidcbiAgICB2YXIgb3B0aW9uYWwgPSBzdWZmaXggPT09ICc/JyB8fCBzdWZmaXggPT09ICcqJ1xuICAgIHZhciBkZWxpbWl0ZXIgPSBwcmVmaXggfHwgJy8nXG4gICAgdmFyIHBhdHRlcm4gPSBjYXB0dXJlIHx8IGdyb3VwIHx8IChhc3RlcmlzayA/ICcuKicgOiAnW14nICsgZGVsaW1pdGVyICsgJ10rPycpXG5cbiAgICB0b2tlbnMucHVzaCh7XG4gICAgICBuYW1lOiBuYW1lIHx8IGtleSsrLFxuICAgICAgcHJlZml4OiBwcmVmaXggfHwgJycsXG4gICAgICBkZWxpbWl0ZXI6IGRlbGltaXRlcixcbiAgICAgIG9wdGlvbmFsOiBvcHRpb25hbCxcbiAgICAgIHJlcGVhdDogcmVwZWF0LFxuICAgICAgcGF0dGVybjogZXNjYXBlR3JvdXAocGF0dGVybilcbiAgICB9KVxuICB9XG5cbiAgLy8gTWF0Y2ggYW55IGNoYXJhY3RlcnMgc3RpbGwgcmVtYWluaW5nLlxuICBpZiAoaW5kZXggPCBzdHIubGVuZ3RoKSB7XG4gICAgcGF0aCArPSBzdHIuc3Vic3RyKGluZGV4KVxuICB9XG5cbiAgLy8gSWYgdGhlIHBhdGggZXhpc3RzLCBwdXNoIGl0IG9udG8gdGhlIGVuZC5cbiAgaWYgKHBhdGgpIHtcbiAgICB0b2tlbnMucHVzaChwYXRoKVxuICB9XG5cbiAgcmV0dXJuIHRva2Vuc1xufVxuXG4vKipcbiAqIENvbXBpbGUgYSBzdHJpbmcgdG8gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBmb3IgdGhlIHBhdGguXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSAgIHN0clxuICogQHJldHVybiB7RnVuY3Rpb259XG4gKi9cbmZ1bmN0aW9uIGNvbXBpbGUgKHN0cikge1xuICByZXR1cm4gdG9rZW5zVG9GdW5jdGlvbihwYXJzZShzdHIpKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIG1ldGhvZCBmb3IgdHJhbnNmb3JtaW5nIHRva2VucyBpbnRvIHRoZSBwYXRoIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB0b2tlbnNUb0Z1bmN0aW9uICh0b2tlbnMpIHtcbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHRva2VucyBpbnRvIHJlZ2V4cHMuXG4gIHZhciBtYXRjaGVzID0gbmV3IEFycmF5KHRva2Vucy5sZW5ndGgpXG5cbiAgLy8gQ29tcGlsZSBhbGwgdGhlIHBhdHRlcm5zIGJlZm9yZSBjb21waWxhdGlvbi5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIG1hdGNoZXNbaV0gPSBuZXcgUmVnRXhwKCdeJyArIHRva2Vuc1tpXS5wYXR0ZXJuICsgJyQnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmdW5jdGlvbiAob2JqKSB7XG4gICAgdmFyIHBhdGggPSAnJ1xuICAgIHZhciBkYXRhID0gb2JqIHx8IHt9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHBhdGggKz0gdG9rZW5cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICB2YXIgdmFsdWUgPSBkYXRhW3Rva2VuLm5hbWVdXG4gICAgICB2YXIgc2VnbWVudFxuXG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gYmUgZGVmaW5lZCcpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGlzYXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGlmICghdG9rZW4ucmVwZWF0KSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgcmVwZWF0LCBidXQgcmVjZWl2ZWQgXCInICsgdmFsdWUgKyAnXCInKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBub3QgYmUgZW1wdHknKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdmFsdWUubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlW2pdKVxuXG4gICAgICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIGFsbCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBwYXRoICs9IChqID09PSAwID8gdG9rZW4ucHJlZml4IDogdG9rZW4uZGVsaW1pdGVyKSArIHNlZ21lbnRcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWUpXG5cbiAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgfVxuXG4gICAgICBwYXRoICs9IHRva2VuLnByZWZpeCArIHNlZ21lbnRcbiAgICB9XG5cbiAgICByZXR1cm4gcGF0aFxuICB9XG59XG5cbi8qKlxuICogRXNjYXBlIGEgcmVndWxhciBleHByZXNzaW9uIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHN0clxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcgKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbLisqPz1eIToke30oKVtcXF18XFwvXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogRXNjYXBlIHRoZSBjYXB0dXJpbmcgZ3JvdXAgYnkgZXNjYXBpbmcgc3BlY2lhbCBjaGFyYWN0ZXJzIGFuZCBtZWFuaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlR3JvdXAgKGdyb3VwKSB7XG4gIHJldHVybiBncm91cC5yZXBsYWNlKC8oWz0hOiRcXC8oKV0pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEF0dGFjaCB0aGUga2V5cyBhcyBhIHByb3BlcnR5IG9mIHRoZSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSByZVxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGF0dGFjaEtleXMgKHJlLCBrZXlzKSB7XG4gIHJlLmtleXMgPSBrZXlzXG4gIHJldHVybiByZVxufVxuXG4vKipcbiAqIEdldCB0aGUgZmxhZ3MgZm9yIGEgcmVnZXhwIGZyb20gdGhlIG9wdGlvbnMuXG4gKlxuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGZsYWdzIChvcHRpb25zKSB7XG4gIHJldHVybiBvcHRpb25zLnNlbnNpdGl2ZSA/ICcnIDogJ2knXG59XG5cbi8qKlxuICogUHVsbCBvdXQga2V5cyBmcm9tIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge1JlZ0V4cH0gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHJlZ2V4cFRvUmVnZXhwIChwYXRoLCBrZXlzKSB7XG4gIC8vIFVzZSBhIG5lZ2F0aXZlIGxvb2thaGVhZCB0byBtYXRjaCBvbmx5IGNhcHR1cmluZyBncm91cHMuXG4gIHZhciBncm91cHMgPSBwYXRoLnNvdXJjZS5tYXRjaCgvXFwoKD8hXFw/KS9nKVxuXG4gIGlmIChncm91cHMpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAga2V5cy5wdXNoKHtcbiAgICAgICAgbmFtZTogaSxcbiAgICAgICAgcHJlZml4OiBudWxsLFxuICAgICAgICBkZWxpbWl0ZXI6IG51bGwsXG4gICAgICAgIG9wdGlvbmFsOiBmYWxzZSxcbiAgICAgICAgcmVwZWF0OiBmYWxzZSxcbiAgICAgICAgcGF0dGVybjogbnVsbFxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhwYXRoLCBrZXlzKVxufVxuXG4vKipcbiAqIFRyYW5zZm9ybSBhbiBhcnJheSBpbnRvIGEgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXJyYXlUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgcGFydHMgPSBbXVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcGF0aC5sZW5ndGg7IGkrKykge1xuICAgIHBhcnRzLnB1c2gocGF0aFRvUmVnZXhwKHBhdGhbaV0sIGtleXMsIG9wdGlvbnMpLnNvdXJjZSlcbiAgfVxuXG4gIHZhciByZWdleHAgPSBuZXcgUmVnRXhwKCcoPzonICsgcGFydHMuam9pbignfCcpICsgJyknLCBmbGFncyhvcHRpb25zKSlcblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZWdleHAsIGtleXMpXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgcGF0aCByZWdleHAgZnJvbSBzdHJpbmcgaW5wdXQuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBzdHJpbmdUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICB2YXIgdG9rZW5zID0gcGFyc2UocGF0aClcbiAgdmFyIHJlID0gdG9rZW5zVG9SZWdFeHAodG9rZW5zLCBvcHRpb25zKVxuXG4gIC8vIEF0dGFjaCBrZXlzIGJhY2sgdG8gdGhlIHJlZ2V4cC5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAodHlwZW9mIHRva2Vuc1tpXSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGtleXMucHVzaCh0b2tlbnNbaV0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmUsIGtleXMpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgZnVuY3Rpb24gZm9yIHRha2luZyB0b2tlbnMgYW5kIHJldHVybmluZyBhIFJlZ0V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHRva2Vuc1xuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9SZWdFeHAgKHRva2Vucywgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBzdHJpY3QgPSBvcHRpb25zLnN0cmljdFxuICB2YXIgZW5kID0gb3B0aW9ucy5lbmQgIT09IGZhbHNlXG4gIHZhciByb3V0ZSA9ICcnXG4gIHZhciBsYXN0VG9rZW4gPSB0b2tlbnNbdG9rZW5zLmxlbmd0aCAtIDFdXG4gIHZhciBlbmRzV2l0aFNsYXNoID0gdHlwZW9mIGxhc3RUb2tlbiA9PT0gJ3N0cmluZycgJiYgL1xcLyQvLnRlc3QobGFzdFRva2VuKVxuXG4gIC8vIEl0ZXJhdGUgb3ZlciB0aGUgdG9rZW5zIGFuZCBjcmVhdGUgb3VyIHJlZ2V4cCBzdHJpbmcuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRva2VuID0gdG9rZW5zW2ldXG5cbiAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgcm91dGUgKz0gZXNjYXBlU3RyaW5nKHRva2VuKVxuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgcHJlZml4ID0gZXNjYXBlU3RyaW5nKHRva2VuLnByZWZpeClcbiAgICAgIHZhciBjYXB0dXJlID0gdG9rZW4ucGF0dGVyblxuXG4gICAgICBpZiAodG9rZW4ucmVwZWF0KSB7XG4gICAgICAgIGNhcHR1cmUgKz0gJyg/OicgKyBwcmVmaXggKyBjYXB0dXJlICsgJykqJ1xuICAgICAgfVxuXG4gICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgaWYgKHByZWZpeCkge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKD86JyArIHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSk/J1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhcHR1cmUgPSAnKCcgKyBjYXB0dXJlICsgJyk/J1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjYXB0dXJlID0gcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpJ1xuICAgICAgfVxuXG4gICAgICByb3V0ZSArPSBjYXB0dXJlXG4gICAgfVxuICB9XG5cbiAgLy8gSW4gbm9uLXN0cmljdCBtb2RlIHdlIGFsbG93IGEgc2xhc2ggYXQgdGhlIGVuZCBvZiBtYXRjaC4gSWYgdGhlIHBhdGggdG9cbiAgLy8gbWF0Y2ggYWxyZWFkeSBlbmRzIHdpdGggYSBzbGFzaCwgd2UgcmVtb3ZlIGl0IGZvciBjb25zaXN0ZW5jeS4gVGhlIHNsYXNoXG4gIC8vIGlzIHZhbGlkIGF0IHRoZSBlbmQgb2YgYSBwYXRoIG1hdGNoLCBub3QgaW4gdGhlIG1pZGRsZS4gVGhpcyBpcyBpbXBvcnRhbnRcbiAgLy8gaW4gbm9uLWVuZGluZyBtb2RlLCB3aGVyZSBcIi90ZXN0L1wiIHNob3VsZG4ndCBtYXRjaCBcIi90ZXN0Ly9yb3V0ZVwiLlxuICBpZiAoIXN0cmljdCkge1xuICAgIHJvdXRlID0gKGVuZHNXaXRoU2xhc2ggPyByb3V0ZS5zbGljZSgwLCAtMikgOiByb3V0ZSkgKyAnKD86XFxcXC8oPz0kKSk/J1xuICB9XG5cbiAgaWYgKGVuZCkge1xuICAgIHJvdXRlICs9ICckJ1xuICB9IGVsc2Uge1xuICAgIC8vIEluIG5vbi1lbmRpbmcgbW9kZSwgd2UgbmVlZCB0aGUgY2FwdHVyaW5nIGdyb3VwcyB0byBtYXRjaCBhcyBtdWNoIGFzXG4gICAgLy8gcG9zc2libGUgYnkgdXNpbmcgYSBwb3NpdGl2ZSBsb29rYWhlYWQgdG8gdGhlIGVuZCBvciBuZXh0IHBhdGggc2VnbWVudC5cbiAgICByb3V0ZSArPSBzdHJpY3QgJiYgZW5kc1dpdGhTbGFzaCA/ICcnIDogJyg/PVxcXFwvfCQpJ1xuICB9XG5cbiAgcmV0dXJuIG5ldyBSZWdFeHAoJ14nICsgcm91dGUsIGZsYWdzKG9wdGlvbnMpKVxufVxuXG4vKipcbiAqIE5vcm1hbGl6ZSB0aGUgZ2l2ZW4gcGF0aCBzdHJpbmcsIHJldHVybmluZyBhIHJlZ3VsYXIgZXhwcmVzc2lvbi5cbiAqXG4gKiBBbiBlbXB0eSBhcnJheSBjYW4gYmUgcGFzc2VkIGluIGZvciB0aGUga2V5cywgd2hpY2ggd2lsbCBob2xkIHRoZVxuICogcGxhY2Vob2xkZXIga2V5IGRlc2NyaXB0aW9ucy4gRm9yIGV4YW1wbGUsIHVzaW5nIGAvdXNlci86aWRgLCBga2V5c2Agd2lsbFxuICogY29udGFpbiBgW3sgbmFtZTogJ2lkJywgZGVsaW1pdGVyOiAnLycsIG9wdGlvbmFsOiBmYWxzZSwgcmVwZWF0OiBmYWxzZSB9XWAuXG4gKlxuICogQHBhcmFtICB7KFN0cmluZ3xSZWdFeHB8QXJyYXkpfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gICAgICAgICAgICAgICAgIFtrZXlzXVxuICogQHBhcmFtICB7T2JqZWN0fSAgICAgICAgICAgICAgICBbb3B0aW9uc11cbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcGF0aFRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIGtleXMgPSBrZXlzIHx8IFtdXG5cbiAgaWYgKCFpc2FycmF5KGtleXMpKSB7XG4gICAgb3B0aW9ucyA9IGtleXNcbiAgICBrZXlzID0gW11cbiAgfSBlbHNlIGlmICghb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSB7fVxuICB9XG5cbiAgaWYgKHBhdGggaW5zdGFuY2VvZiBSZWdFeHApIHtcbiAgICByZXR1cm4gcmVnZXhwVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIGlmIChpc2FycmF5KHBhdGgpKSB7XG4gICAgcmV0dXJuIGFycmF5VG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbiAgfVxuXG4gIHJldHVybiBzdHJpbmdUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxufVxuIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJjb25zdCBQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0pvdCcpO1xuXG5jbGFzcyBHcm91cFByZWZlcmVuY2VzIGV4dGVuZHMgUHJlZmVyZW5jZXMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fb3JkZXIgPSB0aGlzLmdldE9yZGVyKCk7XG4gIH1cblxuICBnZXRPcmRlcigpIHtcbiAgICBsZXQgb3JkZXIgPSB0aGlzLmdldEl0ZW0oJ29yZGVyJyk7XG5cbiAgICBpZiAoIW9yZGVyIHx8ICFvcmRlci50eXBlIHx8ICFvcmRlci5kaXJlY3Rpb24pIHtcbiAgICAgIG9yZGVyID0ge1xuICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX29yZGVyID0gb3JkZXI7XG5cbiAgICByZXR1cm4gb3JkZXI7XG4gIH1cblxuICBzZXRPcmRlcih0eXBlLCBkaXJlY3Rpb24pIHtcbiAgICB0aGlzLl9vcmRlci50eXBlID0gdHlwZTtcbiAgICB0aGlzLl9vcmRlci5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICB0aGlzLnNldEl0ZW0oJ29yZGVyJywgdGhpcy5fb3JkZXIpO1xuICB9XG5cbiAgb3JkZXIoam90cykge1xuICAgIHJldHVybiBKb3Qub3JkZXIoam90cywgdGhpcy5fb3JkZXIudHlwZSwgdGhpcy5fb3JkZXIuZGlyZWN0aW9uKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwUHJlZmVyZW5jZXM7XG4iLCJjb25zdCBQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZXMnKTtcblxuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi9tb2RlbHMvZ3JvdXAnKTtcblxuY2xhc3MgR3JvdXBzUHJlZmVyZW5jZXMgZXh0ZW5kcyBQcmVmZXJlbmNlcyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLl9vcmRlciA9IHRoaXMuZ2V0T3JkZXIoKTtcbiAgfVxuXG4gIGdldE9yZGVyKCkge1xuICAgIGxldCBvcmRlciA9IHRoaXMuZ2V0SXRlbSgnb3JkZXInKTtcblxuICAgIGlmICghb3JkZXIgfHwgIW9yZGVyLnR5cGUgfHwgIW9yZGVyLmRpcmVjdGlvbikge1xuICAgICAgb3JkZXIgPSB7XG4gICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5fb3JkZXIgPSBvcmRlcjtcblxuICAgIHJldHVybiBvcmRlcjtcbiAgfVxuXG4gIHNldE9yZGVyKHR5cGUsIGRpcmVjdGlvbikge1xuICAgIHRoaXMuX29yZGVyLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuX29yZGVyLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgIHRoaXMuc2V0SXRlbSgnb3JkZXInLCB0aGlzLl9vcmRlcik7XG4gIH1cblxuICBvcmRlcihncm91cHMpIHtcbiAgICByZXR1cm4gR3JvdXAub3JkZXIoZ3JvdXBzLCB0aGlzLl9vcmRlci50eXBlLCB0aGlzLl9vcmRlci5kaXJlY3Rpb24pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JvdXBzUHJlZmVyZW5jZXM7XG4iLCJjb25zdCBQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4vcHJlZmVyZW5jZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL0pvdCcpO1xuXG5jbGFzcyBKb3RzUHJlZmVyZW5jZXMgZXh0ZW5kcyBQcmVmZXJlbmNlcyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLl9vcmRlciA9IHRoaXMuZ2V0T3JkZXIoKTtcbiAgfVxuXG4gIGdldE9yZGVyKCkge1xuICAgIGxldCBvcmRlciA9IHRoaXMuZ2V0SXRlbSgnb3JkZXInKTtcblxuICAgIGlmICghb3JkZXIgfHwgIW9yZGVyLnR5cGUgfHwgIW9yZGVyLmRpcmVjdGlvbikge1xuICAgICAgb3JkZXIgPSB7XG4gICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5fb3JkZXIgPSBvcmRlcjtcblxuICAgIHJldHVybiBvcmRlcjtcbiAgfVxuXG4gIHNldE9yZGVyKHR5cGUsIGRpcmVjdGlvbikge1xuICAgIHRoaXMuX29yZGVyLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuX29yZGVyLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgIHRoaXMuc2V0SXRlbSgnb3JkZXInLCB0aGlzLl9vcmRlcik7XG4gIH1cblxuICBvcmRlcihqb3RzKSB7XG4gICAgcmV0dXJuIEpvdC5vcmRlcihqb3RzLCB0aGlzLl9vcmRlci50eXBlLCB0aGlzLl9vcmRlci5kaXJlY3Rpb24pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSm90c1ByZWZlcmVuY2VzO1xuIiwiY2xhc3MgUHJlZmVyZW5jZXMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBpZiAobG9jYWxTdG9yYWdlKSB7XG4gICAgICB0aGlzLl9zdG9yYWdlID0gbG9jYWxTdG9yYWdlO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9zdG9yYWdlID0ge1xuICAgICAgICBmaWVsZHM6IHt9LFxuXG4gICAgICAgIGdldEl0ZW06IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5maWVsZHNbbmFtZV07XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2V0SXRlbTogZnVuY3Rpb24obmFtZSwgaXRlbSkge1xuICAgICAgICAgIHRoaXMuZmllbGRzW25hbWVdID0gaXRlbTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLl9rZXkgPSB0aGlzLmNvbnN0cnVjdG9yLm5hbWUudG9Mb3dlckNhc2UoKTtcbiAgfVxuXG4gIGdldEl0ZW0obmFtZSkge1xuICAgIGxldCBwcmVmcyA9IHRoaXMuX3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLl9rZXkpO1xuXG4gICAgaWYgKHByZWZzKSB7XG4gICAgICBwcmVmcyA9IEpTT04ucGFyc2UocHJlZnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmcyA9IHt9O1xuICAgIH1cblxuICAgIHJldHVybiBwcmVmcy5uYW1lO1xuICB9XG5cbiAgc2V0SXRlbShuYW1lLCBpdGVtKSB7XG4gICAgbGV0IHByZWZzID0gdGhpcy5fc3RvcmFnZS5nZXRJdGVtKHRoaXMuX2tleSk7XG5cbiAgICBpZiAocHJlZnMpIHtcbiAgICAgIHByZWZzID0gSlNPTi5wYXJzZShwcmVmcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZWZzID0ge307XG4gICAgfVxuXG4gICAgcHJlZnMubmFtZSA9IGl0ZW07XG5cbiAgICB0aGlzLl9zdG9yYWdlLnNldEl0ZW0odGhpcy5fa2V5LCBKU09OLnN0cmluZ2lmeShwcmVmcykpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUHJlZmVyZW5jZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmlmICh3aW5kb3cub3BlcmFtaW5pKSB7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnb3BlcmFtaW5pJyk7XG59XG5cbi8vY3V0dGluZyB0aGUgb2wnIG11c3RhcmQgbGlrZSBhIHByb1xuaWYgKCd2aXNpYmlsaXR5U3RhdGUnIGluIGRvY3VtZW50KSB7XG5cbiAgaWYgKEpvdEFwcC51c2VyKSB7XG4gICAgcmVxdWlyZSgnLi4vLi4vZGIvZGInKSh7XG4gICAgICBwcm90b2NvbDogSm90QXBwLnNlcnZlci5wcm90b2NvbCxcbiAgICAgIGRvbWFpbjogSm90QXBwLnNlcnZlci5kb21haW4sXG4gICAgICB1c2VybmFtZTogSm90QXBwLnVzZXIuY3JlZGVudGlhbHMua2V5LFxuICAgICAgcGFzc3dvcmQ6IEpvdEFwcC51c2VyLmNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgZGJOYW1lOiAnam90LScgKyBKb3RBcHAudXNlci5faWRcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICByZXF1aXJlKCcuLi8uLi9kYi9kYicpKHtcbiAgICAgIGRiTmFtZTogJ2pvdC1sb2NhbCdcbiAgICB9KTtcbiAgfVxuXG4gIGNvbnN0IGF0dGFjaEZhc3RDbGljayA9IHJlcXVpcmUoJ2Zhc3RjbGljaycpO1xuXG4gIGNvbnN0IFZpZXdDb250YWluZXIgPSByZXF1aXJlKCcuLi8uLi92aWV3cy92aWV3LWNvbnRhaW5lcicpO1xuXG4gIGNvbnN0IHJvdXRlciA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcnMvcGF0aCcpO1xuXG4gIGNvbnN0IFJvdXRlc0hvbWUgPSByZXF1aXJlKCcuLi8uLi9yb3V0ZXMvY2xpZW50L2hvbWUnKTtcbiAgY29uc3QgUm91dGVzQXV0aCA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcy9jbGllbnQvYXV0aCcpO1xuICBjb25zdCBSb3V0ZXNKb3QgPSByZXF1aXJlKCcuLi8uLi9yb3V0ZXMvY2xpZW50L2pvdCcpO1xuICBjb25zdCBSb3V0ZXNHcm91cCA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcy9jbGllbnQvZ3JvdXAnKTtcblxuICBjb25zdCBUaXRsZUJhclZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy90aXRsZWJhcicpO1xuICBjb25zdCBOb3RpZmljYXRpb25NYW5hZ2VyVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL25vdGlmaWNhdGlvbi1tYW5hZ2VyJyk7XG5cbiAgY29uc3QgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMvZGlzdC9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcbiAgY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJy4uLy4uL3RlbXBsYXRlcy9oZWxwZXJzJyk7XG5cbiAgYXR0YWNoRmFzdENsaWNrKGRvY3VtZW50LmJvZHkpO1xuXG4gIGZvciAobGV0IGtleSBvZiBPYmplY3Qua2V5cyhKb3RBcHAudGVtcGxhdGVzKSkge1xuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKGtleSwgSGFuZGxlYmFycy50ZW1wbGF0ZShKb3RBcHAudGVtcGxhdGVzW2tleV0pKTtcbiAgfVxuXG4gIGZvciAobGV0IGhlbHBlciBpbiBoZWxwZXJzKSB7XG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcihoZWxwZXIsIGhlbHBlcnNbaGVscGVyXSk7XG4gIH1cblxuICBjb25zdCBjb250YWluZXJNYWluID0gbmV3IFZpZXdDb250YWluZXIoJ3ZpZXcnLCB7XG4gICAgaG9tZTogSm90QXBwLnRlbXBsYXRlcy5ob21lLFxuICAgIGdyb3VwOiBKb3RBcHAudGVtcGxhdGVzLmdyb3VwLFxuICAgIGdyb3VwczogSm90QXBwLnRlbXBsYXRlcy5ncm91cHMsXG4gICAgam90czogSm90QXBwLnRlbXBsYXRlcy5qb3RzLFxuICAgIGxvYWRpbmc6IEpvdEFwcC50ZW1wbGF0ZXMubG9hZGluZyxcbiAgICBsb2FkaW5nZ3JvdXBzOiBKb3RBcHAudGVtcGxhdGVzLmxvYWRpbmdncm91cHMsXG4gICAgaW1wb3J0OiBKb3RBcHAudGVtcGxhdGVzLmltcG9ydFxuICB9LCB7XG4gICAgJ2dyb3VwLWxpc3QnOiBKb3RBcHAudGVtcGxhdGVzWydncm91cC1saXN0J10sXG4gICAgJ2pvdC1saXN0JzogSm90QXBwLnRlbXBsYXRlc1snam90LWxpc3QnXVxuICB9KTtcblxuICBjb25zdCByb3V0ZXNIb21lID0gbmV3IFJvdXRlc0hvbWUocm91dGVyLCAnLycsIGNvbnRhaW5lck1haW4pO1xuICBjb25zdCByb3V0ZXNBdXRoID0gbmV3IFJvdXRlc0F1dGgocm91dGVyLCAnL2F1dGgnLCBjb250YWluZXJNYWluKTtcbiAgY29uc3Qgcm91dGVzSm90ID0gbmV3IFJvdXRlc0pvdChyb3V0ZXIsICcvam90JywgY29udGFpbmVyTWFpbik7XG4gIGNvbnN0IHJvdXRlc0dyb3VwID0gbmV3IFJvdXRlc0dyb3VwKHJvdXRlciwgJy9ncm91cCcsIGNvbnRhaW5lck1haW4pO1xuXG4gIHJvdXRlc0hvbWUucmVnaXN0ZXJSb3V0ZXMoKTtcbiAgcm91dGVzQXV0aC5yZWdpc3RlclJvdXRlcygpO1xuICByb3V0ZXNKb3QucmVnaXN0ZXJSb3V0ZXMoKTtcbiAgcm91dGVzR3JvdXAucmVnaXN0ZXJSb3V0ZXMoKTtcblxuICBjb25zdCBjb250YWluZXJIZWFkZXIgPSBuZXcgVmlld0NvbnRhaW5lcignaGVhZGVyJywge1xuICAgIHRpdGxlYmFyOiBKb3RBcHAudGVtcGxhdGVzLnRpdGxlYmFyXG4gIH0sIHtcbiAgICAndGl0bGViYXItdGl0bGUnOiBKb3RBcHAudGVtcGxhdGVzWyd0aXRsZWJhci10aXRsZSddLFxuICAgICd0aXRsZWJhci10YWJzJzogSm90QXBwLnRlbXBsYXRlc1sndGl0bGViYXItdGFicyddLFxuICAgICdsaXN0LW9yZGVyJzogSm90QXBwLnRlbXBsYXRlc1snbGlzdC1vcmRlciddXG4gIH0pO1xuXG4gIGNvbnN0IHRpdGxlQmFyID0gbmV3IFRpdGxlQmFyVmlldyhjb250YWluZXJIZWFkZXIpO1xuXG4gIHRpdGxlQmFyLnJlbmRlcih0cnVlKTtcblxuICBjb25zdCBjb250YWluZXJOb3RpZmljYXRpb25zID0gbmV3IFZpZXdDb250YWluZXIoJ25vdGlmaWNhdGlvbnMnLCB7XG4gICAgbm90aWZpY2F0aW9uczogSm90QXBwLnRlbXBsYXRlcy5ub3RpZmljYXRpb25zXG4gIH0sIHtcbiAgICBub3RpZmljYXRpb246IEpvdEFwcC50ZW1wbGF0ZXMubm90aWZpY2F0aW9uXG4gIH0pO1xuXG4gIGNvbnN0IG5vdGlmaWNhdGlvbk1hbmFnZXIgPSBuZXcgTm90aWZpY2F0aW9uTWFuYWdlclZpZXcoY29udGFpbmVyTm90aWZpY2F0aW9ucyk7XG5cbiAgbm90aWZpY2F0aW9uTWFuYWdlci5yZW5kZXIodHJ1ZSk7XG5cbiAgcm91dGVyLmFjdGl2YXRlKCk7XG5cbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgcGFnZSA9IHJlcXVpcmUoJ3BhZ2UnKTtcblxubW9kdWxlLmV4cG9ydHMgPSAoZnVuY3Rpb24oKSB7XG5cbiAgcmV0dXJuIHtcbiAgICBhY3RpdmF0ZTogZnVuY3Rpb24oKSB7XG4gICAgICBwYWdlKCk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24ocGF0aCwgY2FsbGJhY2spIHtcbiAgICAgIHBhZ2UocGF0aCwgY2FsbGJhY2spO1xuICAgIH0sXG5cbiAgICBnbzogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgcGFnZShwYXRoKTtcbiAgICB9LFxuXG4gICAgYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICBpZiAod2luZG93Lmhpc3RvcnkubGVuZ3RoKSB7XG4gICAgICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhZ2UoJy8nKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RvcDogZnVuY3Rpb24ocGF0aCkge1xuICAgICAgcGFnZS5zdG9wKCk7XG4gICAgICBpZiAocGF0aCkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24gPSBwYXRoO1xuICAgICAgfVxuICAgIH1cbiAgfTtcblxufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUm91dGVzID0gcmVxdWlyZSgnLi9yb3V0ZXMnKTtcblxuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi9tb2RlbHMvZ3JvdXAnKTtcblxuY2xhc3MgQXV0aFJvdXRlcyBleHRlbmRzIFJvdXRlcyB7XG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4ID0gJycpIHtcbiAgICBzdXBlcihyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLl9yb3V0ZXMuYXV0aEdvb2dsZSA9IHtcbiAgICAgIF9wYXRoOiAnL2dvb2dsZScsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy5jYWxsYmFja0dvb2dsZSA9IHtcbiAgICAgIF9wYXRoOiAnL2dvb2dsZS9jYWxsYmFjaycsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy5pbXBvcnQgPSB7XG4gICAgICBfcGF0aDogJy9pbXBvcnQnLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBHcm91cC5pbXBvcnRGcm9tTG9jYWwoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy5zaWdub3V0ID0ge1xuICAgICAgX3BhdGg6ICcvc2lnbm91dCcsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhSb3V0ZXM7XG4iLCJjb25zdCBBdXRoUm91dGVzID0gcmVxdWlyZSgnLi4vYXV0aCcpO1xuY29uc3QgSW1wb3J0VmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2ltcG9ydCcpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi8uLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBBdXRoUm91dGVyIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXgsIHZpZXdDb250YWluZXIpIHtcbiAgICB0aGlzLl9kYiA9IHJlcXVpcmUoJy4uLy4uL2RiL2RiJykoKTtcblxuICAgIHRoaXMuX3JvdXRlciA9IHJvdXRlcjtcbiAgICB0aGlzLnJvdXRlcyA9IG5ldyBBdXRoUm91dGVzKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuaW1wb3J0VmlldyA9IG5ldyBJbXBvcnRWaWV3KHZpZXdDb250YWluZXIpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgnc2lnbm91dCcsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHt9LFxuXG4gICAgICAgICAgcmVzb2x2ZTogKCkgPT4ge1xuICAgICAgICAgICAgdGhpcy5fZGIuZGVzdHJveSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICB0aGlzLl9yb3V0ZXIuc3RvcChjdHguY2Fub25pY2FsUGF0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVqZWN0OiAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ2ltcG9ydCcsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHt9LFxuXG4gICAgICAgICAgcHJlQWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgncm91dGVDaGFuZ2VkJywge1xuICAgICAgICAgICAgICBuYW1lOiAnSm90JyxcbiAgICAgICAgICAgICAgb3JkZXI6IFtdLFxuICAgICAgICAgICAgICB0YWJzOiBbe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgbGluazogJy8nXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0pvdHMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvam90J1xuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdMaXN0cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9ncm91cCdcbiAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZXNvbHZlOiAoZ3JvdXBzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydFZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhSb3V0ZXI7XG4iLCJjb25zdCBKb3QgPSByZXF1aXJlKCcuLi8uLi9tb2RlbHMvam90Jyk7XG5jb25zdCBHcm91cCA9IHJlcXVpcmUoJy4uLy4uL21vZGVscy9ncm91cCcpO1xuY29uc3QgR3JvdXBSb3V0ZXMgPSByZXF1aXJlKCcuLi9ncm91cCcpO1xuY29uc3QgR3JvdXBzVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2dyb3VwcycpO1xuY29uc3QgR3JvdXBWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvZ3JvdXAnKTtcbmNvbnN0IExvYWRpbmdHcm91cHNWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvbG9hZGluZ2dyb3VwcycpO1xuXG5jb25zdCBHcm91cHNQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4uLy4uL3ByZWZlcmVuY2VzL2dyb3VwcycpO1xuY29uc3QgR3JvdXBQcmVmZXJlbmNlID0gcmVxdWlyZSgnLi4vLi4vcHJlZmVyZW5jZXMvZ3JvdXAnKTtcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgR3JvdXBDbGllbnRSb3V0ZXMge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCwgdmlld0NvbnRhaW5lcikge1xuICAgIHRoaXMucm91dGVzID0gbmV3IEdyb3VwUm91dGVzKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuZ3JvdXBzVmlldyA9IG5ldyBHcm91cHNWaWV3KHZpZXdDb250YWluZXIpO1xuICAgIHRoaXMuZ3JvdXBWaWV3ID0gbmV3IEdyb3VwVmlldyh2aWV3Q29udGFpbmVyKTtcbiAgICB0aGlzLmxvYWRpbmdHcm91cHNWaWV3ID0gbmV3IExvYWRpbmdHcm91cHNWaWV3KHZpZXdDb250YWluZXIpO1xuXG4gICAgdGhpcy5fZ3JvdXBzUHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBzUHJlZmVyZW5jZXMoKTtcbiAgICB0aGlzLl9ncm91cFByZWZlcmVuY2VzID0gbmV3IEdyb3VwUHJlZmVyZW5jZSgpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgnYWxsJywgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IHBhZ2UgPSB7XG4gICAgICAgICAgbmFtZTogJ0pvdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvcmRlcmluZyA9IHtcbiAgICAgICAgICBvcmRlcnM6IFt7XG4gICAgICAgICAgICBuYW1lOiAnQWxwaGEnLFxuICAgICAgICAgICAgdHlwZTogJ2FscGhhJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2FzYydcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnRGF0ZScsXG4gICAgICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGFicyA9IFt7XG4gICAgICAgICAgdGl0bGU6ICdIb21lJyxcbiAgICAgICAgICBsaW5rOiAnLydcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRpdGxlOiAnSm90cycsXG4gICAgICAgICAgbGluazogJy9qb3QnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0aXRsZTogJ0xpc3RzJyxcbiAgICAgICAgICBsaW5rOiAnL2dyb3VwJyxcbiAgICAgICAgICBjdXJyZW50OiB0cnVlXG4gICAgICAgIH1dO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBvcmRlclR5cGU6IHRoaXMuX2dyb3Vwc1ByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgIG9yZGVyRGlyZWN0aW9uOiB0aGlzLl9ncm91cHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLmRpcmVjdGlvblxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBwcmVBY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdyb3V0ZUNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgIG5hbWU6IHBhZ2UubmFtZSxcbiAgICAgICAgICAgICAgb3JkZXJpbmcsXG4gICAgICAgICAgICAgIGN1cnJlbnRPcmRlcmluZzogdGhpcy5fZ3JvdXBzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgICB0YWJzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5sb2FkaW5nR3JvdXBzVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgaXRlbXM6IFswLCAwLCAwLCAwLCAwLCAwLCAwXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChncm91cHMpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgY29sb3VyczogR3JvdXAuZ2V0Q29sb3VycygpLFxuICAgICAgICAgICAgICBncm91cHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZWplY3Q6IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgndmlldycsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgb3JkZXJpbmcgPSB7XG4gICAgICAgICAgb3JkZXJzOiBbe1xuICAgICAgICAgICAgbmFtZTogJ0FscGhhJyxcbiAgICAgICAgICAgIHR5cGU6ICdhbHBoYScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdhc2MnXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbmFtZTogJ0RhdGUnLFxuICAgICAgICAgICAgdHlwZTogJ2RhdGUnLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnUHJpb3JpdHknLFxuICAgICAgICAgICAgdHlwZTogJ3ByaW9yaXR5JyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgaWQ6IGN0eC5wYXJhbXMuaWQsXG4gICAgICAgICAgICBkb25lOiBjdHgucGFyYW1zLnN0YXR1cyA9PT0gJ2RvbmUnLFxuICAgICAgICAgICAgb3JkZXJUeXBlOiB0aGlzLl9ncm91cFByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgIG9yZGVyRGlyZWN0aW9uOiB0aGlzLl9ncm91cFByZWZlcmVuY2VzLmdldE9yZGVyKCkuZGlyZWN0aW9uLFxuXG4gICAgICAgICAgICBwb3N0TG9hZEdyb3VwOiAoZ3JvdXApID0+IHtcblxuICAgICAgICAgICAgICBQdWJTdWIucHVibGlzaCgncm91dGVDaGFuZ2VkJywge1xuICAgICAgICAgICAgICAgIG5hbWU6IGdyb3VwLmZpZWxkcy5uYW1lLFxuICAgICAgICAgICAgICAgIG9yZGVyaW5nLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRPcmRlcmluZzogdGhpcy5fZ3JvdXBQcmVmZXJlbmNlcy5nZXRPcmRlcigpLnR5cGUsXG4gICAgICAgICAgICAgICAgdGFiczogW3tcbiAgICAgICAgICAgICAgICAgIGxpbms6ICcvZ3JvdXAvJyArIGdyb3VwLmlkLFxuICAgICAgICAgICAgICAgICAgdGl0bGU6ICd1bmRvbmUnLFxuICAgICAgICAgICAgICAgICAgY3VycmVudDogY3R4LnBhcmFtcy5zdGF0dXMgIT09ICdkb25lJ1xuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgIGxpbms6ICcvZ3JvdXAvJyArIGdyb3VwLmlkICsgJy9kb25lJyxcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnZG9uZScsXG4gICAgICAgICAgICAgICAgICBjdXJyZW50OiBjdHgucGFyYW1zLnN0YXR1cyA9PT0gJ2RvbmUnXG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChncm91cCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXVlcnlPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIGN0eC5xdWVyeXN0cmluZy5zcGxpdCgnJicpLmZvckVhY2goYml0ID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgdmFscyA9IGJpdC5zcGxpdCgnPScpO1xuICAgICAgICAgICAgICBxdWVyeU9iamVjdFt2YWxzWzBdXSA9IHZhbHNbMV07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5ncm91cFZpZXcuc2V0U2hvd0RvbmUoY3R4LnBhcmFtcy5zdGF0dXMgPT09ICdkb25lJyk7XG4gICAgICAgICAgICB0aGlzLmdyb3VwVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgZ3JvdXAsXG4gICAgICAgICAgICAgIGVkaXRJRDogcXVlcnlPYmplY3QuZWRpdCxcbiAgICAgICAgICAgICAgcHJpb3JpdGllczogSm90LmdldFByaW9yaXRpZXMoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cENsaWVudFJvdXRlcztcbiIsImNvbnN0IEhvbWVSb3V0ZXMgPSByZXF1aXJlKCcuLi9ob21lJyk7XG5jb25zdCBIb21lVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2hvbWUnKTtcbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uLy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIEhvbWVSb3V0ZXIge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCwgdmlld0NvbnRhaW5lcikge1xuICAgIHRoaXMucm91dGVzID0gbmV3IEhvbWVSb3V0ZXMocm91dGVyLCBwcmVmaXgpO1xuXG4gICAgdGhpcy5ob21lVmlldyA9IG5ldyBIb21lVmlldyh2aWV3Q29udGFpbmVyKTtcbiAgfVxuXG4gIHJlZ2lzdGVyUm91dGVzKCkge1xuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ2hvbWUnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7fSxcblxuICAgICAgICAgIHByZUFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3JvdXRlQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgICAgbmFtZTogJ0pvdCcsXG4gICAgICAgICAgICAgIG9yZGVyOiBbXSxcbiAgICAgICAgICAgICAgdGFiczogW3tcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50OiB0cnVlXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0pvdHMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvam90J1xuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdMaXN0cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9ncm91cCdcbiAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmhvbWVWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBsb2FkaW5nOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVzb2x2ZTogc3RhdHMgPT4ge1xuICAgICAgICAgICAgdGhpcy5ob21lVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgc3RhdHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZWplY3Q6IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSG9tZVJvdXRlcjtcbiIsImNvbnN0IEpvdFJvdXRlcyA9IHJlcXVpcmUoJy4uL2pvdCcpO1xuY29uc3QgSm90c1ZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy9qb3RzJyk7XG5jb25zdCBMb2FkaW5nVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2xvYWRpbmcnKTtcbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uLy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNvbnN0IEpvdHNQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4uLy4uL3ByZWZlcmVuY2VzL2pvdHMnKTtcblxuY2xhc3MgSm90Q2xpZW50Um91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXgsIHZpZXdDb250YWluZXIpIHtcbiAgICB0aGlzLnJvdXRlcyA9IG5ldyBKb3RSb3V0ZXMocm91dGVyLCBwcmVmaXgpO1xuXG4gICAgdGhpcy5qb3RzVmlldyA9IG5ldyBKb3RzVmlldyh2aWV3Q29udGFpbmVyKTtcbiAgICB0aGlzLmxvYWRpbmdWaWV3ID0gbmV3IExvYWRpbmdWaWV3KHZpZXdDb250YWluZXIpO1xuXG4gICAgdGhpcy5fam90c1ByZWZlcmVuY2VzID0gbmV3IEpvdHNQcmVmZXJlbmNlcygpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG5cbiAgICB0aGlzLnJvdXRlcy5yZWdpc3RlclJvdXRlKCdhbGwnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2UgPSB7XG4gICAgICAgICAgbmFtZTogJ0pvdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvcmRlcmluZyA9IHtcbiAgICAgICAgICBvcmRlcnM6IFt7XG4gICAgICAgICAgICBuYW1lOiAnQWxwaGEnLFxuICAgICAgICAgICAgdHlwZTogJ2FscGhhJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2FzYydcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnRGF0ZScsXG4gICAgICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdQcmlvcml0eScsXG4gICAgICAgICAgICB0eXBlOiAncHJpb3JpdHknLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRhYnMgPSBbe1xuICAgICAgICAgIHRpdGxlOiAnSG9tZScsXG4gICAgICAgICAgbGluazogJy8nXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0aXRsZTogJ0pvdHMnLFxuICAgICAgICAgIGxpbms6ICcvam90JyxcbiAgICAgICAgICBjdXJyZW50OiB0cnVlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0aXRsZTogJ0xpc3RzJyxcbiAgICAgICAgICBsaW5rOiAnL2dyb3VwJ1xuICAgICAgICB9XTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgb3JkZXJUeXBlOiB0aGlzLl9qb3RzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgb3JkZXJEaXJlY3Rpb246IHRoaXMuX2pvdHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLmRpcmVjdGlvblxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBwcmVBY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdyb3V0ZUNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgIG5hbWU6IHBhZ2UubmFtZSxcbiAgICAgICAgICAgICAgb3JkZXJpbmcsXG4gICAgICAgICAgICAgIGN1cnJlbnRPcmRlcmluZzogdGhpcy5fam90c1ByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgICAgdGFic1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMubG9hZGluZ1ZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGl0ZW1zOiBbMCwgMCwgMCwgMCwgMCwgMCwgMF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZXNvbHZlOiAoam90cykgPT4ge1xuICAgICAgICAgICAgdGhpcy5qb3RzVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgam90c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3RDbGllbnRSb3V0ZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNsYXNzIEdyb3VwUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBHcm91cC5sb2FkQWxsKHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy52aWV3ID0ge1xuICAgICAgX3BhdGg6ICcvOmlkLzpzdGF0dXM/JyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQsIHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbikudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgaWYgKHBhcmFtcy5wb3N0TG9hZEdyb3VwKSB7XG4gICAgICAgICAgICBwYXJhbXMucG9zdExvYWRHcm91cChncm91cCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXAuX2pvdHMgPSBncm91cC5nZXRKb3RzKHBhcmFtcy5kb25lKTtcbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBHcm91cCh7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBuYW1lOiBwYXJhbXMubmFtZSxcbiAgICAgICAgICAgIGNvbG91cjogcGFyYW1zLmNvbG91clxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLnJlbW92ZShwYXJhbXMuaWQpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy51cGRhdGUgPSB7XG4gICAgICBfcGF0aDogJy86aWQnLFxuICAgICAgX21ldGhvZDogWydwb3N0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICBpZiAocGFyYW1zLmFjdGlvbiAhPT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgZ3JvdXAuZmllbGRzID0gcGFyYW1zLmZpZWxkcztcblxuICAgICAgICAgICAgcmV0dXJuIGdyb3VwLnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUm91dGVzID0gcmVxdWlyZSgnLi9yb3V0ZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL2pvdCcpO1xuXG5jbGFzcyBIb21lUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5ob21lID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBKb3QuZ2V0UGVyY2VudGFnZURvbmUoKS50aGVuKHN0YXRzID0+IHtcbiAgICAgICAgICBjb25zdCBzZWdtZW50cyA9IHtcbiAgICAgICAgICAgIG9uZTogOTAsXG4gICAgICAgICAgICB0d286IDkwLFxuICAgICAgICAgICAgdGhyZWU6IDkwLFxuICAgICAgICAgICAgZm91cjogOTBcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gMjUpIHtcbiAgICAgICAgICAgIHNlZ21lbnRzLm9uZSA9IDkwIC0gKHN0YXRzLnBlcmNlbnQgLyAyNSkgKiA5MDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VnbWVudHMub25lID0gMDtcblxuICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNTApIHtcbiAgICAgICAgICAgICAgc2VnbWVudHMudHdvID0gOTAgLSAoKHN0YXRzLnBlcmNlbnQgLSAyNSkgLyAyNSkgKiA5MDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlZ21lbnRzLnR3byA9IDA7XG5cbiAgICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNzUpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy50aHJlZSA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNTApIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMudGhyZWUgPSAwO1xuXG4gICAgICAgICAgICAgICAgc2VnbWVudHMuZm91ciA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNzUpIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzdGF0cy5zZWdtZW50cyA9IHNlZ21lbnRzO1xuXG4gICAgICAgICAgaWYgKHN0YXRzLm51bUdyb3VwcyA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHBsdXJhbCA9IHN0YXRzLm51bUdyb3VwcyA9PT0gMSA/ICcnIDogJ3MnO1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9IGAke3N0YXRzLnBlcmNlbnR9JSBkb25lIGluICR7c3RhdHMubnVtR3JvdXBzfSBsaXN0JHtwbHVyYWx9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9ICdObyBsaXN0cy4gQWRkIG9uZSBub3cnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBzdGF0cztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWVSb3V0ZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcblxuY2xhc3MgSm90Um91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBKb3QubG9hZEFsbCh0cnVlLCBwYXJhbXMub3JkZXJUeXBlLCBwYXJhbXMub3JkZXJEaXJlY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBKb3Qoe1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgY29udGVudDogcGFyYW1zLmNvbnRlbnQsXG4gICAgICAgICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHBhcmFtcy5wcmlvcml0eVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5yZW1vdmUocGFyYW1zLmlkKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMudXBkYXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5sb2FkKHBhcmFtcy5pZCkudGhlbihqb3QgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEZpZWxkcyA9IGpvdC5maWVsZHM7XG5cbiAgICAgICAgICAgIGpvdC5maWVsZHMgPSBwYXJhbXMuZmllbGRzO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcy5maWVsZHMuZG9uZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgam90LmZpZWxkcy5kb25lID0gY3VycmVudEZpZWxkcy5kb25lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gam90LnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3RSb3V0ZXM7XG4iLCJjbGFzcyBSb3V0ZXMge1xuXG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4ID0gJycpIHtcbiAgICB0aGlzLl9yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5fcHJlZml4ID0gcHJlZml4O1xuXG4gICAgdGhpcy5fcm91dGVzID0ge307XG4gIH1cblxuICByZWdpc3RlclJvdXRlKG5hbWUsIGNvbmZpZykge1xuICAgIGNvbnN0IHJvdXRlID0gdGhpcy5fcm91dGVzW25hbWVdO1xuICAgIHJvdXRlLl9tZXRob2QuZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgdGhpcy5fcm91dGVyW21ldGhvZF0odGhpcy5fcHJlZml4ICsgcm91dGUuX3BhdGgsICguLi5wYXJhbXMpID0+IHtcbiAgICAgICAgY29uZmlnKC4uLnBhcmFtcykudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQucHJlQWN0aW9uKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5wcmVBY3Rpb24oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJvdXRlLl9hY3Rpb24ocmVzdWx0LnBhcmFtcylcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdC5yZXNvbHZlKTtcbiAgICAgICAgICB9KS5jYXRjaChyZXN1bHQucmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgQXV0b2xpbmtlciA9IHJlcXVpcmUoJ2F1dG9saW5rZXInKTtcblxuY29uc3QgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMvZGlzdC9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcblxuZXhwb3J0cy5pZkVxdWFsID0gaWZFcXVhbDtcbmV4cG9ydHMuaWZJbiA9IGlmSW47XG5leHBvcnRzLmF1dG9MaW5rID0gYXV0b0xpbms7XG5cbmZ1bmN0aW9uIGlmRXF1YWwoY29uZGl0aW9uYWwsIGVxdWFsVG8sIG9wdGlvbnMpIHtcbiAgaWYgKGNvbmRpdGlvbmFsID09PSBlcXVhbFRvKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpZkluKGVsZW0sIGFyciwgb3B0aW9ucykge1xuICBpZiAoYXJyLmluZGV4T2YoZWxlbSkgPiAtMSkge1xuICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbn1cblxuZnVuY3Rpb24gYXV0b0xpbmsoZWxlbSwgb3B0aW9ucykge1xuICBjb25zdCB1cmwgPSBBdXRvbGlua2VyLmxpbmsoSGFuZGxlYmFycy5lc2NhcGVFeHByZXNzaW9uKGVsZW0pKTtcblxuICByZXR1cm4gbmV3IEhhbmRsZWJhcnMuU2FmZVN0cmluZyh1cmwpO1xufVxuIiwiY2xhc3MgRGF0ZVV0aWxzIHtcblxuICBzdGF0aWMgZ2V0RGF5cygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ1N1bicsXG4gICAgICAnTW9uJyxcbiAgICAgICdUdWUnLFxuICAgICAgJ1dlZCcsXG4gICAgICAnVGh1JyxcbiAgICAgICdGcmknLFxuICAgICAgJ1NhdCdcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGdldE1vbnRocygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ0phbicsXG4gICAgICAnRmViJyxcbiAgICAgICdNYXInLFxuICAgICAgJ0FwcicsXG4gICAgICAnTWF5JyxcbiAgICAgICdKdW4nLFxuICAgICAgJ0p1bCcsXG4gICAgICAnQXVnJyxcbiAgICAgICdTZXAnLFxuICAgICAgJ09jdCcsXG4gICAgICAnTm92JyxcbiAgICAgICdEZWMnXG4gICAgXTtcbiAgfVxuXG4gIHN0YXRpYyBmb3JtYXQoZGF0ZSkge1xuICAgIGNvbnN0IGRheSA9IGRhdGUuZ2V0RGF5KCk7XG4gICAgY29uc3QgZGF5TnVtID0gZGF0ZS5nZXREYXRlKCk7XG4gICAgY29uc3QgbW9udGhOdW0gPSBkYXRlLmdldE1vbnRoKCk7XG4gICAgY29uc3QgbWludXRlcyA9IHRoaXMuX3BhZChkYXRlLmdldE1pbnV0ZXMoKSwgMik7XG4gICAgY29uc3QgaG91cnMgPSB0aGlzLl9wYWQoZGF0ZS5nZXRIb3VycygpLCAyKTtcblxuICAgIHJldHVybiB0aGlzLmdldERheXMoKVtkYXldICsgJyAnICsgZGF5TnVtICsgJyAnICsgdGhpcy5nZXRNb250aHMoKVttb250aE51bV0gKyAnICcgKyBob3VycyArICc6JyArIG1pbnV0ZXM7XG4gIH1cblxuICBzdGF0aWMgX3BhZChudW0sIHNpemUpIHtcbiAgICBjb25zdCBzID0gJzAwMDAwMDAwMCcgKyBudW07XG4gICAgcmV0dXJuIHMuc3Vic3RyKHMubGVuZ3RoIC0gc2l6ZSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEYXRlVXRpbHM7XG4iLCJjbGFzcyBQdWJTdWIge1xuICAvL2Jhc2VkIG9uIHB1YnN1YiBpbXBsZW1lbnRhdGlvbiBhdCBodHRwOi8vYWRkeW9zbWFuaS5jb20vcmVzb3VyY2VzL2Vzc2VudGlhbGpzZGVzaWducGF0dGVybnMvYm9vay8jb2JzZXJ2ZXJwYXR0ZXJuamF2YXNjcmlwdFxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIFN0b3JhZ2UgZm9yIHRvcGljcyB0aGF0IGNhbiBiZSBicm9hZGNhc3RcbiAgICAvLyBvciBsaXN0ZW5lZCB0b1xuICAgIHRoaXMuX3RvcGljcyA9IHt9O1xuXG4gICAgLy8gQW4gdG9waWMgaWRlbnRpZmllclxuICAgIHRoaXMuX3N1YlVpZCA9IC0xO1xuICB9XG5cbiAgLy8gUHVibGlzaCBvciBicm9hZGNhc3QgZXZlbnRzIG9mIGludGVyZXN0XG4gIC8vIHdpdGggYSBzcGVjaWZpYyB0b3BpYyBuYW1lIGFuZCBhcmd1bWVudHNcbiAgLy8gc3VjaCBhcyB0aGUgZGF0YSB0byBwYXNzIGFsb25nXG4gIHB1Ymxpc2godG9waWMsIGFyZ3MpIHtcbiAgICBpZiAoIXRoaXMuX3RvcGljc1t0b3BpY10pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3Vic2NyaWJlcnMgPSB0aGlzLl90b3BpY3NbdG9waWNdO1xuICAgIHZhciBsZW4gPSBzdWJzY3JpYmVycyA/IHN1YnNjcmliZXJzLmxlbmd0aCA6IDA7XG5cbiAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgIHN1YnNjcmliZXJzW2xlbl0uZnVuYyh0b3BpYywgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBTdWJzY3JpYmUgdG8gZXZlbnRzIG9mIGludGVyZXN0XG4gIC8vIHdpdGggYSBzcGVjaWZpYyB0b3BpYyBuYW1lIGFuZCBhXG4gIC8vIGNhbGxiYWNrIGZ1bmN0aW9uLCB0byBiZSBleGVjdXRlZFxuICAvLyB3aGVuIHRoZSB0b3BpYy9ldmVudCBpcyBvYnNlcnZlZFxuICBzdWJzY3JpYmUodG9waWMsIGZ1bmMpIHtcbiAgICBpZiAoIXRoaXMuX3RvcGljc1t0b3BpY10pIHtcbiAgICAgIHRoaXMuX3RvcGljc1t0b3BpY10gPSBbXTtcbiAgICB9XG5cbiAgICB2YXIgdG9rZW4gPSAoKyt0aGlzLl9zdWJVaWQpLnRvU3RyaW5nKCk7XG4gICAgdGhpcy5fdG9waWNzW3RvcGljXS5wdXNoKHtcbiAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgIGZ1bmM6IGZ1bmNcbiAgICB9KTtcblxuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIC8vIFVuc3Vic2NyaWJlIGZyb20gYSBzcGVjaWZpY1xuICAvLyB0b3BpYywgYmFzZWQgb24gYSB0b2tlbml6ZWQgcmVmZXJlbmNlXG4gIC8vIHRvIHRoZSBzdWJzY3JpcHRpb25cbiAgdW5zdWJzY3JpYmUodG9rZW4pIHtcbiAgICBmb3IgKHZhciBtIGluIHRoaXMuX3RvcGljcykge1xuICAgICAgaWYgKHRoaXMuX3RvcGljc1ttXSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHRoaXMuX3RvcGljc1ttXS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICBpZiAodGhpcy5fdG9waWNzW21dW2ldLnRva2VuID09PSB0b2tlbikge1xuICAgICAgICAgICAgdGhpcy5fdG9waWNzW21dLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBQdWJTdWIoKTtcbiIsImNsYXNzIFRvdWNoIHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50IHx8IG51bGw7XG5cbiAgICB0aGlzLl94RG93biA9IG51bGw7XG4gICAgdGhpcy5feURvd24gPSBudWxsO1xuXG4gICAgdGhpcy5fcmVnaXN0ZXJlZCA9IHtcbiAgICAgIGxlZnQ6IFtdLFxuICAgICAgcmlnaHQ6IFtdLFxuICAgICAgdXA6IFtdLFxuICAgICAgZG93bjogW11cbiAgICB9O1xuXG4gICAgdGhpcy5oYW5kbGVUb3VjaFN0YXJ0ID0gdGhpcy5oYW5kbGVUb3VjaFN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVUb3VjaE1vdmUgPSB0aGlzLmhhbmRsZVRvdWNoTW92ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgc2V0RWxlbWVudChlbGVtZW50KSB7XG4gICAgdGhpcy5kZXN0cm95KCk7XG5cbiAgICB0aGlzLl9lbGVtZW50ID0gZWxlbWVudDtcblxuICAgIHRoaXMuX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuaGFuZGxlVG91Y2hTdGFydCwgZmFsc2UpO1xuICAgIHRoaXMuX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5oYW5kbGVUb3VjaE1vdmUsIGZhbHNlKTtcbiAgfVxuXG4gIHJlZ2lzdGVyKGRpcmVjdGlvbiwgZm4pIHtcbiAgICB0aGlzLl9yZWdpc3RlcmVkW2RpcmVjdGlvbl0ucHVzaChmbik7XG4gIH1cblxuICBoYW5kbGVUb3VjaFN0YXJ0KGV2dCkge1xuICAgIHRoaXMuX3hEb3duID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICB0aGlzLl95RG93biA9IGV2dC50b3VjaGVzWzBdLmNsaWVudFk7XG4gIH1cblxuICBoYW5kbGVUb3VjaE1vdmUoZXZ0KSB7XG4gICAgaWYgKCAhIHRoaXMuX3hEb3duIHx8ICEgdGhpcy5feURvd24gKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgeFVwID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICB2YXIgeVVwID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WTtcblxuICAgIHZhciB4RGlmZiA9IHRoaXMuX3hEb3duIC0geFVwO1xuICAgIHZhciB5RGlmZiA9IHRoaXMuX3lEb3duIC0geVVwO1xuXG4gICAgaWYgKCBNYXRoLmFicyggeERpZmYgKSA+IE1hdGguYWJzKCB5RGlmZiApICkge1xuICAgICAgICBpZiAoIHhEaWZmID4gMCApIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWQubGVmdC5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJlZC5yaWdodC5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCB5RGlmZiA+IDAgKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlcmVkLnVwLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlcmVkLmRvd24uZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3hEb3duID0gbnVsbDtcbiAgICB0aGlzLl95RG93biA9IG51bGw7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9lbGVtZW50KSB7XG4gICAgICB0aGlzLl9lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLmhhbmRsZVRvdWNoU3RhcnQsIGZhbHNlKTtcbiAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5oYW5kbGVUb3VjaE1vdmUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRvdWNoO1xuIiwiY29uc3QgV2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcblxuY2xhc3MgQ29sb3VyU2VsZWN0b3IgZXh0ZW5kcyBXaWRnZXQge1xuICBpbml0RXZlbnRzKGVsKSB7XG4gICAgc3VwZXIuaW5pdEV2ZW50cygpO1xuXG4gICAgY29uc3Qgd2lkZ2V0cyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYXJ0aWFsLWNvbG91ci1zZWxlY3RvcicpO1xuICAgIGZvciAobGV0IHdpZGdldCBvZiB3aWRnZXRzKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gd2lkZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5jb2xvdXItc2VsZWN0b3JfX2NvbG91cicpO1xuICAgICAgY29uc3Qgc2VsZWN0ID0gd2lkZ2V0LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpO1xuXG4gICAgICBmb3IgKGxldCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbChvcHRpb25zKTtcbiAgICAgICAgICBvcHRpb24uY2xhc3NMaXN0LmFkZCgnY29sb3VyLXNlbGVjdG9yX19jb2xvdXItLWN1cnJlbnQnKTtcbiAgICAgICAgICBzZWxlY3QudmFsdWUgPSBvcHRpb24uZGF0YXNldC52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdW5zZWxlY3RBbGwob3B0aW9ucykge1xuICAgIGZvciAobGV0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICBvcHRpb24uY2xhc3NMaXN0LnJlbW92ZSgnY29sb3VyLXNlbGVjdG9yX19jb2xvdXItLWN1cnJlbnQnKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvdXJTZWxlY3RvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jb25zdCBKb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvam90Jyk7XG5jb25zdCBHcm91cCA9IHJlcXVpcmUoJy4uL21vZGVscy9ncm91cCcpO1xuXG5jb25zdCBHcm91cFByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vcHJlZmVyZW5jZXMvZ3JvdXAnKTtcblxuY29uc3QgQ29sb3VyU2VsZWN0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2NvbG91ci1zZWxlY3RvcicpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3R3JvdXAgZXh0ZW5kcyBWaWV3IHtcbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJXaWRnZXQoQ29sb3VyU2VsZWN0b3JXaWRnZXQpO1xuXG4gICAgdGhpcy5fc2hvd0RvbmUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3ByZWZlcmVuY2VzID0gbmV3IEdyb3VwUHJlZmVyZW5jZXMoKTtcbiAgfVxuXG4gIHNldFNob3dEb25lKGRvbmUpIHtcbiAgICB0aGlzLl9zaG93RG9uZSA9IGRvbmU7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHN1cGVyLnJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCd1cGRhdGUnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIGlmIChhcmdzLmNoYW5nZXMgJiYgYXJncy5jaGFuZ2VzLmxlbmd0aCkge1xuICAgICAgICBHcm91cC5sb2FkKHBhcmFtcy5ncm91cC5pZCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdvcmRlckNoYW5nZWQnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuX3ByZWZlcmVuY2VzLnNldE9yZGVyKGFyZ3MudHlwZSwgYXJncy5kaXJlY3Rpb24pO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmxhc3RQYXJhbXM7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2pvdC1saXN0JywgcGFyYW1zKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLl9hZGREb2N1bWVudExpc3RlbmVyKCd1bnNlbGVjdEFsbCcsICdjbGljaycsICgpID0+IHtcbiAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKSB7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdqb3QtbGlzdCc6XG4gICAgICAgIHBhcmFtcy5qb3RzID0gcGFyYW1zLmdyb3VwLmdldEpvdHModGhpcy5fc2hvd0RvbmUpO1xuICAgICAgICBwYXJhbXMuam90cyA9IHRoaXMuX3ByZWZlcmVuY2VzLm9yZGVyKHBhcmFtcy5qb3RzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgZWwgPSBzdXBlci5yZW5kZXJQYXJ0aWFsKG5hbWUsIHBhcmFtcyk7XG5cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2pvdC1saXN0JzpcbiAgICAgICAgdGhpcy5pbml0RWRpdCgpO1xuICAgICAgICB0aGlzLmluaXREZWxldGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRVcGRhdGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRXaWRnZXRzKGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRBZGRGb3JtKCk7XG4gICAgdGhpcy5pbml0RWRpdCgpO1xuICAgIHRoaXMuaW5pdERlbGV0ZUZvcm1zKCk7XG4gICAgdGhpcy5pbml0VXBkYXRlRm9ybXMoKTtcbiAgfVxuXG4gIGluaXRBZGRGb3JtKCkge1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuZm9ybS1qb3QtYWRkJyk7XG4gICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBjb25zdCBjb250ZW50RmllbGQgPSBmb3JtLmVsZW1lbnRzLmNvbnRlbnQ7XG4gICAgICBjb25zdCBjb250ZW50ID0gY29udGVudEZpZWxkLnZhbHVlO1xuXG4gICAgICBjb25zdCBncm91cEZpZWxkID0gZm9ybS5lbGVtZW50cy5ncm91cDtcbiAgICAgIGNvbnN0IGdyb3VwID0gZ3JvdXBGaWVsZC52YWx1ZTtcblxuICAgICAgY29uc3QgcHJpb3JpdHkgPSBmb3JtLmVsZW1lbnRzLnByaW9yaXR5LnZhbHVlO1xuXG4gICAgICBuZXcgSm90KHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICBncm91cCxcbiAgICAgICAgICBwcmlvcml0eVxuICAgICAgICB9XG4gICAgICB9KS5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnRlbnRGaWVsZC52YWx1ZSA9ICcnO1xuICAgICAgICBjb250ZW50RmllbGQuZm9jdXMoKTtcbiAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0b1Nob3cgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy5zaG93LW9uLWZvY3VzJyk7XG5cbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICB0b1Nob3cuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgIH0pO1xuICB9XG5cbiAgaW5pdEVkaXQoKSB7XG4gICAgY29uc3QgbGlua3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuam90c19fam90X19lZGl0Jyk7XG4gICAgZm9yIChsZXQgbGluayBvZiBsaW5rcykge1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvL3N0b3AgZG9jdW1lbnQgbGlzdGVuZXIgZnJvbSByZW1vdmluZyAnZWRpdCcgY2xhc3NcblxuICAgICAgICBjb25zdCBpZCA9IGxpbmsuZGF0YXNldC5pZDtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5qb3RzX19qb3QtJyArIGlkKTtcblxuICAgICAgICBpZiAoIWl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0JykpIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG5cbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXQnKTtcblxuICAgICAgICAgIC8vY29uc3QgY29udGVudEZpZWxkID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0tam90LXVwZGF0ZS0nICsgaWQpLmVsZW1lbnRzLmNvbnRlbnQ7XG4gICAgICAgICAgLy9jb250ZW50RmllbGQuZm9jdXMoKTtcbiAgICAgICAgICAvL2NvbnRlbnRGaWVsZC52YWx1ZSA9IGNvbnRlbnRGaWVsZC52YWx1ZTsgLy9mb3JjZXMgY3Vyc29yIHRvIGdvIHRvIGVuZCBvZiB0ZXh0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB1bnNlbGVjdEFsbCgpIHtcbiAgICAvL1RPRE86IGhhdmUgY2xhc3MgbWVtYmVyIHRvIGhvbGQgcmVmZXJlbmNlIHRvIGNvbW1vbiBlbGVtZW50L2VsZW1lbnQgZ3JvdXBzIHRvIGF2b2lkIHJlcXVlcnlpbmdcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5qb3RzX19qb3QnKTtcbiAgICBmb3IgKGxldCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaG93cyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zaG93LW9uLWZvY3VzJyk7XG4gICAgZm9yIChsZXQgc2hvdyBvZiBzaG93cykge1xuICAgICAgc2hvdy5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgaW5pdERlbGV0ZUZvcm1zKCkge1xuICAgIGNvbnN0IGZvcm1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmZvcm0tam90LWRlbGV0ZScpO1xuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IGlkID0gZm9ybS5kYXRhc2V0LmlkO1xuICAgICAgICBjb25zdCBncm91cCA9IGZvcm0uZGF0YXNldC5ncm91cElkO1xuXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuam90c19fam90LScgKyBpZCk7XG4gICAgICAgIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcblxuICAgICAgICBKb3QubG9hZChpZCkudGhlbihqb3QgPT4ge1xuICAgICAgICAgIEpvdC5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdub3RpZnknLCB7XG4gICAgICAgICAgICAgIHRpdGxlOiAnSm90IGRlbGV0ZWQnLFxuICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndW5kbycsXG4gICAgICAgICAgICAgICAgZm46ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgam90LnJldiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGpvdC5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdyb3VwLmxvYWQoZ3JvdXApLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtc2c6ICdKb3QgdW5kZWxldGVkJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGluaXRVcGRhdGVGb3JtcygpIHtcbiAgICBjb25zdCBmb3JtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mb3JtLWpvdC11cGRhdGUnKTtcblxuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGNvbnN0IGRvbmVCdXR0b24gPSBmb3JtLmVsZW1lbnRzLmRvbmU7XG4gICAgICBjb25zdCB1bmRvbmVCdXR0b24gPSBmb3JtLmVsZW1lbnRzLnVuZG9uZTtcblxuICAgICAgaWYgKGRvbmVCdXR0b24pIHtcbiAgICAgICAgZG9uZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICBmb3JtLmVsZW1lbnRzWydkb25lLXN0YXR1cyddLnZhbHVlID0gJ2RvbmUnO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHVuZG9uZUJ1dHRvbikge1xuICAgICAgICB1bmRvbmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgZm9ybS5lbGVtZW50c1snZG9uZS1zdGF0dXMnXS52YWx1ZSA9ICd1bmRvbmUnO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvL3N0b3AgZG9jdW1lbnQgbGlzdGVuZXIgZnJvbSByZW1vdmluZyAnZWRpdCcgY2xhc3NcbiAgICAgIH0pO1xuXG4gICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjb25zdCBpZCA9IGZvcm0uZGF0YXNldC5pZDtcblxuICAgICAgICBjb25zdCBjb250ZW50ID0gZm9ybS5lbGVtZW50cy5jb250ZW50LnZhbHVlO1xuICAgICAgICBjb25zdCBncm91cCA9IGZvcm0uZWxlbWVudHMuZ3JvdXAudmFsdWU7XG4gICAgICAgIGNvbnN0IGRvbmVTdGF0dXMgPSBmb3JtLmVsZW1lbnRzWydkb25lLXN0YXR1cyddLnZhbHVlO1xuICAgICAgICBjb25zdCBwcmlvcml0eSA9IGZvcm0uZWxlbWVudHMucHJpb3JpdHkudmFsdWU7XG5cbiAgICAgICAgSm90LmxvYWQoaWQpLnRoZW4oam90ID0+IHtcblxuICAgICAgICAgIGNvbnN0IGN1cnJlbnRGaWVsZHMgPSBqb3QuZmllbGRzO1xuXG4gICAgICAgICAgam90LmZpZWxkcyA9IHtcbiAgICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgICBncm91cCxcbiAgICAgICAgICAgIHByaW9yaXR5XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChkb25lU3RhdHVzID09PSAnZG9uZScpIHtcbiAgICAgICAgICAgIGpvdC5maWVsZHMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChkb25lU3RhdHVzID09PSAndW5kb25lJykge1xuICAgICAgICAgICAgam90LmZpZWxkcy5kb25lID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGpvdC5maWVsZHMuZG9uZSA9IGN1cnJlbnRGaWVsZHMuZG9uZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBqb3Quc2F2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3R3JvdXA7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi9tb2RlbHMvZ3JvdXAnKTtcblxuY29uc3QgR3JvdXBzUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi9wcmVmZXJlbmNlcy9ncm91cHMnKTtcblxuY29uc3QgQ29sb3VyU2VsZWN0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2NvbG91ci1zZWxlY3RvcicpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3R3JvdXBzIGV4dGVuZHMgVmlldyB7XG5cbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJXaWRnZXQoQ29sb3VyU2VsZWN0b3JXaWRnZXQpO1xuXG4gICAgdGhpcy5fcHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBzUHJlZmVyZW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3VwZGF0ZScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MuY2hhbmdlcyAmJiBhcmdzLmNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgZ3JvdXBzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdvcmRlckNoYW5nZWQnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuX3ByZWZlcmVuY2VzLnNldE9yZGVyKGFyZ3MudHlwZSwgYXJncy5kaXJlY3Rpb24pO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmxhc3RQYXJhbXM7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2dyb3VwLWxpc3QnLCBwYXJhbXMpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuX2FkZERvY3VtZW50TGlzdGVuZXIoJ3Vuc2VsZWN0QWxsJywgJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2dyb3VwLWxpc3QnOlxuICAgICAgICBwYXJhbXMuZ3JvdXBzID0gdGhpcy5fcHJlZmVyZW5jZXMub3JkZXIocGFyYW1zLmdyb3Vwcyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGVsID0gc3VwZXIucmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpO1xuXG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdncm91cC1saXN0JzpcbiAgICAgICAgdGhpcy5pbml0RWRpdCgpO1xuICAgICAgICB0aGlzLmluaXREZWxldGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRVcGRhdGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRXaWRnZXRzKGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRBZGRGb3JtKCk7XG4gICAgdGhpcy5pbml0RWRpdCgpO1xuICAgIHRoaXMuaW5pdERlbGV0ZUZvcm1zKCk7XG4gICAgdGhpcy5pbml0VXBkYXRlRm9ybXMoKTtcbiAgfVxuXG4gIGluaXRBZGRGb3JtKCkge1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuZm9ybS1ncm91cC1hZGQnKTtcbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IG5hbWVGaWVsZCA9IGZvcm0uZWxlbWVudHMubmFtZTtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lRmllbGQudmFsdWU7XG5cbiAgICAgIGNvbnN0IGNvbG91ciA9IGZvcm0uZWxlbWVudHMuY29sb3VyLnZhbHVlO1xuXG4gICAgICBuZXcgR3JvdXAoe1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGNvbG91clxuICAgICAgICB9XG4gICAgICB9KS5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIG5hbWVGaWVsZC52YWx1ZSA9ICcnO1xuICAgICAgICBuYW1lRmllbGQuZm9jdXMoKTtcbiAgICAgICAgR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2dyb3VwLWxpc3QnLCB7XG4gICAgICAgICAgICBncm91cHNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRvU2hvdyA9IGZvcm0ucXVlcnlTZWxlY3RvcignLnNob3ctb24tZm9jdXMnKTtcblxuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgIHRvU2hvdy5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfSk7XG4gIH1cblxuICBpbml0RWRpdCgpIHtcbiAgICBjb25zdCBlZGl0TGlua3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuZ3JvdXBzX19ncm91cF9fZWRpdCcpO1xuICAgIGZvciAobGV0IGxpbmsgb2YgZWRpdExpbmtzKSB7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgIC8vc3RvcCBkb2N1bWVudCBsaXN0ZW5lciBmcm9tIHJlbW92aW5nICdlZGl0JyBjbGFzc1xuXG4gICAgICAgIGNvbnN0IGlkID0gbGluay5kYXRhc2V0LmlkO1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmdyb3Vwc19fZ3JvdXAtJyArIGlkKTtcblxuICAgICAgICBpZiAoIWl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0JykpIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG5cbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXQnKTtcblxuICAgICAgICAgIC8vY29uc3QgbmFtZUZpZWxkID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0tZ3JvdXAtdXBkYXRlLScgKyBpZCkuZWxlbWVudHMubmFtZTtcbiAgICAgICAgICAvL25hbWVGaWVsZC5mb2N1cygpO1xuICAgICAgICAgIC8vbmFtZUZpZWxkLnZhbHVlID0gbmFtZUZpZWxkLnZhbHVlOyAvL2ZvcmNlcyBjdXJzb3IgdG8gZ28gdG8gZW5kIG9mIHRleHRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHVuc2VsZWN0QWxsKCkge1xuICAgIC8vVE9ETzogaGF2ZSBjbGFzcyBtZW1iZXIgdG8gaG9sZCByZWZlcmVuY2UgdG8gY29tbW9uIGVsZW1lbnQvZWxlbWVudCBncm91cHMgdG8gYXZvaWQgcmVxdWVyeWluZ1xuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmdyb3Vwc19fZ3JvdXAnKTtcbiAgICBmb3IgKGxldCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaG93cyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zaG93LW9uLWZvY3VzJyk7XG4gICAgZm9yIChsZXQgc2hvdyBvZiBzaG93cykge1xuICAgICAgc2hvdy5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgaW5pdERlbGV0ZUZvcm1zKCkge1xuICAgIGNvbnN0IGZvcm1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmZvcm0tZ3JvdXAtZGVsZXRlJyk7XG4gICAgZm9yIChsZXQgZm9ybSBvZiBmb3Jtcykge1xuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLmRhdGFzZXQuaWQ7XG5cbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5ncm91cHNfX2dyb3VwLScgKyBpZCk7XG4gICAgICAgIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcblxuICAgICAgICBHcm91cC5sb2FkKGlkKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgICBHcm91cC5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ25vdGlmeScsIHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdMaXN0IGRlbGV0ZWQnLFxuICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndW5kbycsXG4gICAgICAgICAgICAgICAgZm46ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAucmV2ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuc2F2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jcyA9IGdyb3VwLmpvdHMubWFwKGpvdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBfcmV2OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBfaWQ6IGpvdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZUFkZGVkOiBqb3QuX2RhdGVBZGRlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBqb3QuZmllbGRzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBqb3QucmV2ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBqb3Q7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYiA9IHJlcXVpcmUoJy4uL2RiL2RiJykoKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGIuYnVsa0RvY3MoZG9jcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1zZzogJ0xpc3QgdW5kZWxldGVkJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbml0VXBkYXRlRm9ybXMoKSB7XG4gICAgY29uc3QgZm9ybXMgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuZm9ybS1ncm91cC11cGRhdGUnKTtcblxuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyAgLy9zdG9wIGRvY3VtZW50IGxpc3RlbmVyIGZyb20gcmVtb3ZpbmcgJ2VkaXQnIGNsYXNzXG4gICAgICB9KTtcblxuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLmRhdGFzZXQuaWQ7XG5cbiAgICAgICAgY29uc3QgbmFtZSA9IGZvcm0uZWxlbWVudHMubmFtZS52YWx1ZTtcbiAgICAgICAgY29uc3QgY29sb3VyID0gZm9ybS5lbGVtZW50cy5jb2xvdXIudmFsdWU7XG5cbiAgICAgICAgR3JvdXAubG9hZChpZCkudGhlbihncm91cCA9PiB7XG5cbiAgICAgICAgICBncm91cC5maWVsZHMgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY29sb3VyXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGdyb3VwLnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnZ3JvdXAtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICBncm91cHNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdHcm91cHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY2xhc3MgVmlld0hvbWUgZXh0ZW5kcyBWaWV3IHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdIb21lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNvbnN0IHJvdXRlciA9IHJlcXVpcmUoJy4uL3JvdXRlcnMvcGF0aCcpO1xuXG5jbGFzcyBWaWV3SW1wb3J0IGV4dGVuZHMgVmlldyB7XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRJbXBvcnRGb3JtKCk7XG4gIH1cblxuICBpbml0SW1wb3J0Rm9ybSgpIHtcbiAgICBjb25zdCBmb3JtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0taW1wb3J0Jyk7XG5cbiAgICBpZiAoZm9ybSkge1xuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgR3JvdXAuaW1wb3J0RnJvbUxvY2FsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwUHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICAgICAgICAgIGdyb3VwUHJvbWlzZXMucHVzaCgobmV3R3JvdXBzKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBHcm91cC5pbnNlcnQoe1xuICAgICAgICAgICAgICAgIGZpZWxkczogZ3JvdXAuZmllbGRzLFxuICAgICAgICAgICAgICAgIGRhdGVBZGRlZDogZ3JvdXAuX2RhdGVBZGRlZFxuICAgICAgICAgICAgICB9KS50aGVuKG5ld0dyb3VwID0+IHtcbiAgICAgICAgICAgICAgICBuZXdHcm91cHMucHVzaChuZXdHcm91cCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld0dyb3VwcztcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxldCBncm91cFByb21pc2VDaGFpbiA9IFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgICAgZ3JvdXBQcm9taXNlcy5mb3JFYWNoKGdyb3VwUHJvbWlzZSA9PiB7XG4gICAgICAgICAgICBncm91cFByb21pc2VDaGFpbiA9IGdyb3VwUHJvbWlzZUNoYWluLnRoZW4oZ3JvdXBQcm9taXNlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBncm91cFByb21pc2VDaGFpbi50aGVuKG5ld0dyb3VwcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb3RQcm9taXNlcyA9IFtdO1xuXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaCgoZ3JvdXAsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIGdyb3VwLmpvdHMuZm9yRWFjaChqb3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0ZpZWxkcyA9IGpvdC5maWVsZHM7XG4gICAgICAgICAgICAgICAgbmV3RmllbGRzLmdyb3VwID0gbmV3R3JvdXBzW2luZGV4XS5pZDtcbiAgICAgICAgICAgICAgICBqb3RQcm9taXNlcy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBKb3QuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBuZXdGaWVsZHMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGVBZGRlZDogam90Ll9kYXRlQWRkZWRcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgam90UHJvbWlzZUNoYWluID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICBqb3RQcm9taXNlcy5mb3JFYWNoKGpvdFByb21pc2UgPT4ge1xuICAgICAgICAgICAgICBqb3RQcm9taXNlQ2hhaW4gPSBqb3RQcm9taXNlQ2hhaW4udGhlbihqb3RQcm9taXNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gam90UHJvbWlzZUNoYWluO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLnJlbW92ZUZyb21Mb2NhbCgpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ25vdGlmeScsIHtcbiAgICAgICAgICAgIHRpdGxlOiAnSm90cyBpbXBvcnRlZCdcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByb3V0ZXIuZ28oJy9ncm91cCcpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdJbXBvcnQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL2pvdCcpO1xuXG5jb25zdCBKb3RzUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi9wcmVmZXJlbmNlcy9qb3RzJyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIFZpZXdKb3RzIGV4dGVuZHMgVmlldyB7XG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNvbnRhaW5lcik7XG5cbiAgICB0aGlzLl9wcmVmZXJlbmNlcyA9IG5ldyBKb3RzUHJlZmVyZW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgcGFyYW1zLmpvdHMgPSB0aGlzLl9wcmVmZXJlbmNlcy5vcmRlcihwYXJhbXMuam90cyk7XG5cbiAgICBzdXBlci5yZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcyk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goUHViU3ViLnN1YnNjcmliZSgndXBkYXRlJywgKHRvcGljLCBhcmdzKSA9PiB7XG4gICAgICBpZiAoYXJncy5jaGFuZ2VzICYmIGFyZ3MuY2hhbmdlcy5sZW5ndGgpIHtcbiAgICAgICAgSm90LmxvYWRBbGwoKS50aGVuKGpvdHMgPT4ge1xuICAgICAgICAgIHRoaXMucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICBqb3RzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdvcmRlckNoYW5nZWQnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuX3ByZWZlcmVuY2VzLnNldE9yZGVyKGFyZ3MudHlwZSwgYXJncy5kaXJlY3Rpb24pO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmxhc3RQYXJhbXM7XG4gICAgICB0aGlzLnJlbmRlcihmYWxzZSwgcGFyYW1zKTtcbiAgICB9KSk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdKb3RzO1xuIiwiY29uc3QgV2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgTGlzdE9yZGVyIGV4dGVuZHMgV2lkZ2V0IHtcbiAgaW5pdEV2ZW50cyhlbCkge1xuICAgIHN1cGVyLmluaXRFdmVudHMoKTtcblxuICAgIGxldCB3aWRnZXRzO1xuICAgIGlmIChlbC5jbGFzc0xpc3QuY29udGFpbnMoJ3BhcnRpYWwtbGlzdC1vcmRlcicpKSB7XG4gICAgICB3aWRnZXRzID0gW2VsXTtcbiAgICB9IGVsc2Uge1xuICAgICAgd2lkZ2V0cyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYXJ0aWFsLWxpc3Qtb3JkZXInKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCB3aWRnZXQgb2Ygd2lkZ2V0cykge1xuICAgICAgY29uc3QgbGlua3MgPSB3aWRnZXQucXVlcnlTZWxlY3RvckFsbCgnYScpO1xuXG4gICAgICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGlua3MubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGxpbmsgPSBsaW5rc1tpbmRleF07XG4gICAgICAgIGNvbnN0IG5leHRMaW5rID0gbGlua3NbKGluZGV4ICsgMSkgJSBsaW5rcy5sZW5ndGhdO1xuXG4gICAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdvcmRlckNoYW5nZWQnLCB7XG4gICAgICAgICAgICB0eXBlOiBuZXh0TGluay5kYXRhc2V0LnR5cGUsXG4gICAgICAgICAgICBkaXJlY3Rpb246IG5leHRMaW5rLmRhdGFzZXQuZGlyZWN0aW9uXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBsaW5rLmNsYXNzTGlzdC5yZW1vdmUoJ2N1cnJlbnQnKTtcbiAgICAgICAgICBuZXh0TGluay5jbGFzc0xpc3QuYWRkKCdjdXJyZW50Jyk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTGlzdE9yZGVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNsYXNzIFZpZXdMb2FkaW5nIGV4dGVuZHMgVmlldyB7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3TG9hZGluZztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgTG9hZGluZ1ZpZXcgPSByZXF1aXJlKCcuL2xvYWRpbmcuanMnKTtcblxuY2xhc3MgVmlld0xvYWRpbmdHcm91cHMgZXh0ZW5kcyBMb2FkaW5nVmlldyB7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3TG9hZGluZ0dyb3VwcztcbiIsImNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgTm90aWZpY2F0aW9uTWFuYWdlclZpZXcgZXh0ZW5kcyBWaWV3IHtcbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMuX3RpbWVyID0gbnVsbDtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ25vdGlmeScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgdGhpcy5zaG93Tm90aWZpY2F0aW9uKGFyZ3MpO1xuICAgIH0pKTtcbiAgfVxuXG4gIHNob3dOb3RpZmljYXRpb24oe1xuICAgIHRpdGxlID0gZmFsc2UsXG4gICAgYm9keSA9IGZhbHNlLFxuICAgIGFjdGlvbiA9IGZhbHNlLFxuICAgIGR1cmF0aW9uID0gNTAwMFxuICB9KSB7XG5cbiAgICB2YXIgZm4gPSAoKSA9PiB7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ25vdGlmaWNhdGlvbicsIHtcbiAgICAgICAgdGl0bGUsXG4gICAgICAgIGFjdGlvbk5hbWU6IGFjdGlvbiA/IGFjdGlvbi5uYW1lIDogZmFsc2VcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoYWN0aW9uICYmIGFjdGlvbi5mbikge1xuICAgICAgICBjb25zdCBhY3Rpb25QcmltYXJ5ID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLXNuYWNrYmFyX19hY3Rpb24tLXByaW1hcnknKTtcbiAgICAgICAgaWYgKGFjdGlvblByaW1hcnkpIHtcbiAgICAgICAgICBhY3Rpb25QcmltYXJ5LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuXG4gICAgICAgICAgICBpZiAodGhpcy5fdGltZXIpIHtcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYWN0aW9uLmZuKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChhY3Rpb24ubXNnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zaG93Tm90aWZpY2F0aW9uKHtcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiBhY3Rpb24ubXNnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLXNuYWNrYmFyLWNvbnRhaW5lcicpLmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1ub3RpZmljYXRpb24nKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLXNuYWNrYmFyLWNvbnRhaW5lcicpLmNsYXNzTGlzdC5hZGQoJ2hhcy1ub3RpZmljYXRpb24nKTtcblxuICAgICAgaWYgKHRoaXMuX3RpbWVyKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3RpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhci1jb250YWluZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtbm90aWZpY2F0aW9uJyk7XG4gICAgICB9LCBkdXJhdGlvbik7XG4gICAgfTtcblxuICAgIGlmICh0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXItY29udGFpbmVyJykuY2xhc3NMaXN0LmNvbnRhaW5zKCdoYXMtbm90aWZpY2F0aW9uJykpIHtcbiAgICAgIHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhci1jb250YWluZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtbm90aWZpY2F0aW9uJyk7XG4gICAgICBzZXRUaW1lb3V0KGZuLCAzMDApO1xuICAgIH0gZWxzZSB7XG4gICAgICBmbigpO1xuICAgIH1cblxuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBOb3RpZmljYXRpb25NYW5hZ2VyVmlldztcbiIsImNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgTGlzdE9yZGVyID0gcmVxdWlyZSgnLi9saXN0LW9yZGVyJyk7XG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jb25zdCBUb3VjaCA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvdG91Y2gnKTtcblxuY2xhc3MgVGl0bGVCYXJWaWV3IGV4dGVuZHMgVmlldyB7XG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNvbnRhaW5lcik7XG5cbiAgICB0aGlzLnJlZ2lzdGVyV2lkZ2V0KExpc3RPcmRlcik7XG5cbiAgICB0aGlzLl90b3VjaEhhbmRsZXIgPSBuZXcgVG91Y2goKTtcbiAgICB0aGlzLl90b3VjaEhhbmRsZXIucmVnaXN0ZXIoJ2xlZnQnLCAodGhpcy5fY2xvc2VOYXYpLmJpbmQodGhpcykpO1xuICAgIHRoaXMuX3RvdWNoSGFuZGxlci5yZWdpc3RlcigncmlnaHQnLCAodGhpcy5fb3Blbk5hdikuYmluZCh0aGlzKSk7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHN1cGVyLnJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdyb3V0ZUNoYW5nZWQnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgndGl0bGViYXItdGl0bGUnLCBhcmdzKTtcbiAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgndGl0bGViYXItdGFicycsIGFyZ3MpO1xuXG4gICAgICB0aGlzLnVwZGF0ZVNvcnRpbmcoYXJncyk7XG4gICAgfSkpO1xuXG4gICAgdGhpcy5fdG91Y2hIYW5kbGVyLnNldEVsZW1lbnQodGhpcy5fZWwpO1xuICB9XG5cbiAgcmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpIHtcbiAgICBjb25zdCBlbCA9IHN1cGVyLnJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKTtcblxuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgY2FzZSAnbGlzdC1vcmRlcic6XG4gICAgICAgIHRoaXMuaW5pdFdpZGdldHMoZWwpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpbml0RXZlbnRzKCkge1xuICAgIHN1cGVyLmluaXRFdmVudHMoKTtcblxuICAgIHRoaXMuX25hdiA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJ25hdicpO1xuICAgIHRoaXMuX25hdk92ZXJsYXkgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtbmF2LW92ZXJsYXknKTtcbiAgICB0aGlzLl9idG5NZW51T3BlbiA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1idG4tbWVudScpO1xuICAgIHRoaXMuX2J0bk1lbnVDbG9zZSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1idG4tbWVudS5jbG9zZScpO1xuICAgIHRoaXMuX2xpbmtzID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLm1kLW5hdi1ib2R5IGEnKTtcblxuICAgIHRoaXMuX2J0bk1lbnVPcGVuLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuX29wZW5OYXYoKTtcbiAgICB9KTtcblxuICAgIHRoaXMuX2J0bk1lbnVDbG9zZS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLl9jbG9zZU5hdigpO1xuICAgIH0pO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLl9saW5rcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpcy5fbGlua3NbaV0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLl9jbG9zZU5hdigpKTtcbiAgICB9XG4gIH1cblxuICBjbGVhbnVwKCkge1xuICAgIHN1cGVyLmNsZWFudXAoKTtcblxuICAgIHRoaXMuX3RvdWNoSGFuZGxlci5kZXN0cm95KCk7XG4gIH1cblxuICBfb3Blbk5hdigpIHtcbiAgICB0aGlzLl9uYXYuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgIHRoaXMuX25hdk92ZXJsYXkuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICB9XG5cbiAgX2Nsb3NlTmF2KCkge1xuICAgIHRoaXMuX25hdi5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgdGhpcy5fbmF2T3ZlcmxheS5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gIH1cblxuICB1cGRhdGVTb3J0aW5nKGFyZ3MpIHtcbiAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2xpc3Qtb3JkZXInLCBhcmdzKTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVGl0bGVCYXJWaWV3O1xuIiwiY2xhc3MgVmlld0NvbnRhaW5lciB7XG4gIGNvbnN0cnVjdG9yKGVsSUQsIHRlbXBsYXRlcywgcGFydGlhbHMpIHtcbiAgICB0aGlzLl9lbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGVsSUQpO1xuXG4gICAgdGhpcy5fdGVtcGxhdGVzID0gdGVtcGxhdGVzO1xuICAgIHRoaXMuX3BhcnRpYWxzID0gcGFydGlhbHM7XG5cbiAgICB0aGlzLl9jdXJyZW50VmlldyA9IG51bGw7XG4gIH1cblxuICB1cGRhdGUodmlldywgaHRtbCkge1xuICAgIGlmICh0aGlzLl9jdXJyZW50Vmlldykge1xuICAgICAgdGhpcy5fY3VycmVudFZpZXcuY2xlYW51cCgpO1xuICAgIH1cblxuICAgIHRoaXMuX2N1cnJlbnRWaWV3ID0gdmlldztcbiAgICB0aGlzLl9lbC5pbm5lckhUTUwgPSBodG1sO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0NvbnRhaW5lcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMvZGlzdC9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICB0aGlzLl9jb250YWluZXIgPSBjb250YWluZXI7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zID0gW107XG4gICAgdGhpcy5fZG9jdW1lbnRMaXN0ZW5lcnMgPSB7fTtcbiAgICB0aGlzLl93aWRnZXRzID0gW107XG5cbiAgICB0aGlzLl9sYXN0UGFyYW1zID0gbnVsbDtcbiAgfVxuXG4gIC8vdGlkeSB0aGlzIHVwP1xuICBnZXQgX2VsKCkge1xuICAgIHJldHVybiB0aGlzLl9jb250YWluZXIuX2VsO1xuICB9XG5cbiAgZ2V0IGxhc3RQYXJhbXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2xhc3RQYXJhbXM7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHRoaXMuY2xlYW51cCgpO1xuXG4gICAgaWYgKCFwcmVSZW5kZXJlZCkge1xuICAgICAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZSh0aGlzLl9jb250YWluZXIuX3RlbXBsYXRlc1t0aGlzLl9nZXRUZW1wbGF0ZSgpXSk7XG4gICAgICB0aGlzLl9jb250YWluZXIudXBkYXRlKHRoaXMsIHRlbXBsYXRlKHBhcmFtcykpO1xuICAgIH1cblxuICAgIHRoaXMuaW5pdEV2ZW50cygpO1xuXG4gICAgdGhpcy5fbGFzdFBhcmFtcyA9IHBhcmFtcztcbiAgfVxuXG4gIHJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKSB7XG4gICAgY29uc29sZS5sb2coJ3JlbmRlciBwYXJ0aWFsJywgbmFtZSk7XG5cbiAgICB2YXIgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlKHRoaXMuX2NvbnRhaW5lci5fcGFydGlhbHNbbmFtZV0pO1xuICAgIGNvbnN0IHZpZXcgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcucGFydGlhbC0nICsgbmFtZSk7XG4gICAgdmlldy5vdXRlckhUTUwgPSB0ZW1wbGF0ZShwYXJhbXMpO1xuXG4gICAgdGhpcy5fbGFzdFBhcmFtcyA9IHBhcmFtcztcblxuICAgIHJldHVybiB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcucGFydGlhbC0nICsgbmFtZSk7XG4gIH1cblxuICBfZ2V0VGVtcGxhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IubmFtZS50b0xvd2VyQ2FzZSgpLnN1YnN0cmluZyg0KTtcbiAgfVxuXG4gIF9hZGREb2N1bWVudExpc3RlbmVyKG5hbWUsIHR5cGUsIGZuKSB7XG4gICAgaWYgKCF0aGlzLl9kb2N1bWVudExpc3RlbmVyc1tuYW1lXSkge1xuICAgICAgdGhpcy5fZG9jdW1lbnRMaXN0ZW5lcnNbbmFtZV0gPSB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGZuOiBmbi5iaW5kKHRoaXMpXG4gICAgICB9O1xuICAgIH1cblxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIodHlwZSwgdGhpcy5fZG9jdW1lbnRMaXN0ZW5lcnNbbmFtZV0uZm4pO1xuICB9XG5cbiAgY2xlYW51cCgpIHtcbiAgICAvL2NvbnNvbGUubG9nKCd2aWV3IGNsZWF1cCcsIHRoaXMpO1xuXG4gICAgZm9yIChsZXQgc3ViIG9mIHRoaXMuX3N1YnNjcmlwdGlvbnMpIHtcbiAgICAgIFB1YlN1Yi51bnN1YnNjcmliZShzdWIpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGxuYW1lIGluIHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzKSB7XG4gICAgICBjb25zdCBsaXN0ZW5lciA9IHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzW2xuYW1lXTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIobGlzdGVuZXIudHlwZSwgbGlzdGVuZXIuZm4pO1xuICAgIH1cblxuICAgIHRoaXMuY2xlYW51cFdpZGdldHMoKTtcbiAgfVxuXG4gIGluaXRFdmVudHMoKSB7XG4gICAgdGhpcy5pbml0V2lkZ2V0cyh0aGlzLl9lbCk7XG4gIH1cblxuICByZWdpc3RlcldpZGdldChXaWRnZXQpIHtcbiAgICB0aGlzLl93aWRnZXRzLnB1c2gobmV3IFdpZGdldCgpKTtcbiAgfVxuXG4gIGluaXRXaWRnZXRzKGVsKSB7XG4gICAgdGhpcy5fd2lkZ2V0cy5mb3JFYWNoKHdpZGdldCA9PiB7XG4gICAgICB3aWRnZXQuaW5pdEV2ZW50cyhlbCk7XG4gICAgfSk7XG4gIH1cblxuICBjbGVhbnVwV2lkZ2V0cygpIHtcbiAgICB0aGlzLl93aWRnZXRzLmZvckVhY2god2lkZ2V0ID0+IHtcbiAgICAgIHdpZGdldC5jbGVhbnVwKCk7XG4gICAgfSk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXc7XG4iLCJjbGFzcyBXaWRnZXQge1xuXG4gIGNvbnN0cnVjdG9yKCkge1xuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcblxuICB9XG5cbiAgY2xlYW51cCgpIHtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFdpZGdldDtcbiJdfQ==
