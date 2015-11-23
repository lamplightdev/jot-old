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
if ('visibilityState' in document && !window.operamini) {
  document.querySelector('body').classList.remove('nojs');
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL1VzZXJzL2NocmlzLy5udm0vdmVyc2lvbnMvbm9kZS92NS4wLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGIvZGIuanMiLCJtb2RlbHMvSm90LmpzIiwibW9kZWxzL2dyb3VwLmpzIiwibW9kZWxzL2pvdC5qcyIsIm1vZGVscy9tb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9hdXRvbGlua2VyL2Rpc3QvQXV0b2xpbmtlci5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0Y2xpY2svbGliL2Zhc3RjbGljay5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvaGFuZGxlYmFycy5ydW50aW1lLmpzIiwibm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGFnZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJwcmVmZXJlbmNlcy9ncm91cC5qcyIsInByZWZlcmVuY2VzL2dyb3Vwcy5qcyIsInByZWZlcmVuY2VzL2pvdHMuanMiLCJwcmVmZXJlbmNlcy9wcmVmZXJlbmNlcy5qcyIsInB1YmxpYy9qcy9hcHAuanMiLCJyb3V0ZXJzL3BhdGguanMiLCJyb3V0ZXMvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvZ3JvdXAuanMiLCJyb3V0ZXMvY2xpZW50L2hvbWUuanMiLCJyb3V0ZXMvY2xpZW50L2pvdC5qcyIsInJvdXRlcy9ncm91cC5qcyIsInJvdXRlcy9ob21lLmpzIiwicm91dGVzL2pvdC5qcyIsInJvdXRlcy9yb3V0ZXMuanMiLCJ0ZW1wbGF0ZXMvaGVscGVycy5qcyIsInV0aWxpdHkvZGF0ZS5qcyIsInV0aWxpdHkvcHVic3ViLmpzIiwidXRpbGl0eS90b3VjaC5qcyIsInZpZXdzL2NvbG91ci1zZWxlY3Rvci5qcyIsInZpZXdzL2dyb3VwLmpzIiwidmlld3MvZ3JvdXBzLmpzIiwidmlld3MvaG9tZS5qcyIsInZpZXdzL2ltcG9ydC5qcyIsInZpZXdzL2pvdHMuanMiLCJ2aWV3cy9saXN0LW9yZGVyLmpzIiwidmlld3MvbG9hZGluZy5qcyIsInZpZXdzL2xvYWRpbmdncm91cHMuanMiLCJ2aWV3cy9ub3RpZmljYXRpb24tbWFuYWdlci5qcyIsInZpZXdzL3RpdGxlYmFyLmpzIiwidmlld3Mvdmlldy1jb250YWluZXIuanMiLCJ2aWV3cy92aWV3LmpzIiwidmlld3Mvd2lkZ2V0LmpzIiwiLi4vLi4vLi4vLi4vVXNlcnMvY2hyaXMvLm52bS92ZXJzaW9ucy9ub2RlL3Y1LjAuMC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIuLi8uLi8uLi8uLi9Vc2Vycy9jaHJpcy8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRXRDLEVBQUU7QUFDTixXQURJLEVBQUUsR0FDUTswQkFEVixFQUFFOztBQUVKLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0dBQ2pCOztlQUpHLEVBQUU7O3lCQVVELE9BQU8sRUFBRTs7O0FBRVosYUFBTyxHQUFHLE9BQU8sSUFBSTtBQUNuQixnQkFBUSxFQUFFLElBQUk7QUFDZCxjQUFNLEVBQUUsSUFBSTtBQUNaLFlBQUksRUFBRSxJQUFJO0FBQ1YsZ0JBQVEsRUFBRSxJQUFJO0FBQ2QsZ0JBQVEsRUFBRSxJ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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbG5HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoM0JBO0FBQ0E7QUFDQTtBQUNBOzs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM21CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7OztBQzdYQSxJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRTdDLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzs7SUFFL0IsZ0JBQWdCO1lBQWhCLGdCQUFnQjs7QUFDcEIsV0FESSxnQkFBZ0IsR0FDTjswQkFEVixnQkFBZ0I7O3VFQUFoQixnQkFBZ0I7O0FBSWxCLFVBQUssTUFBTSxHQUFHLE1BQUssUUFBUSxFQUFFLENBQUM7O0dBQy9COztlQUxHLGdCQUFnQjs7K0JBT1Q7QUFDVCxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUVsQyxVQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7QUFDN0MsYUFBSyxHQUFHO0FBQ04sY0FBSSxFQUFFLE1BQU07QUFDWixtQkFBUyxFQUFFLE1BQU07U0FDbEIsQ0FBQztPQUNIOztBQUVELFVBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDOztBQUVwQixhQUFPLEtBQUssQ0FBQztLQUNkOzs7NkJBRVEsSUFBSSxFQUFFLFNBQVMsRUFBRTtBQUN4QixVQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDeEIsVUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDOztBQUVsQyxVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDcEM7OzswQkFFSyxJQUFJLEVBQUU7QUFDVixhQUFPLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDakU7OztTQS9CRyxnQkFBZ0I7R0FBUyxXQUFXOztBQWtDMUMsTUFBTSxDQUFDLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQzs7Ozs7Ozs7Ozs7OztBQ3RDbEMsSUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDOztBQUU3QyxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7SUFFbkMsaUJBQWlCO1lBQWpCLGlCQUFpQjs7QUFDckIsV0FESSxpQkFBaUIsR0FDUDswQkFEVixpQkFBaUI7O3VFQUFqQixpQkFBaUI7O0FBSW5CLFVBQUssTUFBTSxHQUFHLE1BQUssUUFBUSxFQUFFLENBQUM7O0dBQy9COztlQUxHLGlCQUFpQjs7K0JBT1Y7QUFDVCxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDOztBQUVsQyxVQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUU7QUFDN0MsYUFBSyxHQUFHO0FBQ04sY0FBSSxFQUFFLE1BQU07QUFDWixtQkFBUyxFQUFFLE1BQU07U0FDbEIsQ0FBQztPQUNIOztBQUVELFVBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDOztBQUVwQixhQUFPLEtBQUssQ0FBQztLQUNkOzs7NkJBRVEsSUFBSSxFQUFFLFNBQVMsRUFBRTtBQUN4QixVQUFJLENBQUMsTUFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDeEIsVUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDOztBQUVsQyxVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDcEM7OzswQkFFSyxNQUFNLEVBQUU7QUFDWixhQUFPLEtBQUssQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDckU7OztTQS9CRyxpQkFBaUI7R0FBUyxXQUFXOztBQWtDM0MsTUFBTSxDQUFDLE9BQU8sR0FBRyxpQkFBaUIsQ0FBQzs7Ozs7Ozs7Ozs7OztBQ3RDbkMsSUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDOztBQUU3QyxJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7O0lBRS9CLGVBQWU7WUFBZixlQUFlOztBQUNuQixXQURJLGVBQWUsR0FDTDswQkFEVixlQUFlOzt1RUFBZixlQUFlOztBQUlqQixVQUFLLE1BQU0sR0FBRyxNQUFLLFFBQVEsRUFBRSxDQUFDOztHQUMvQjs7ZUFMRyxlQUFlOzsrQkFPUjtBQUNULFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7O0FBRWxDLFVBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRTtBQUM3QyxhQUFLLEdBQUc7QUFDTixjQUFJLEVBQUUsTUFBTTtBQUNaLG1CQUFTLEVBQUUsTUFBTTtTQUNsQixDQUFDO09BQ0g7O0FBRUQsVUFBSSxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUM7O0FBRXBCLGFBQU8sS0FBSyxDQUFDO0tBQ2Q7Ozs2QkFFUSxJQUFJLEVBQUUsU0FBUyxFQUFFO0FBQ3hCLFVBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUN4QixVQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7O0FBRWxDLFVBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNwQzs7OzBCQUVLLElBQUksRUFBRTtBQUNWLGFBQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNqRTs7O1NBL0JHLGVBQWU7R0FBUyxXQUFXOztBQWtDekMsTUFBTSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7Ozs7Ozs7OztJQ3RDM0IsV0FBVztBQUNmLFdBREksV0FBVyxHQUNEOzBCQURWLFdBQVc7O0FBRWIsUUFBSSxZQUFZLEVBQUU7QUFDaEIsVUFBSSxDQUFDLFFBQVEsR0FBRyxZQUFZLENBQUM7S0FDOUIsTUFBTTtBQUNMLFVBQUksQ0FBQyxRQUFRLEdBQUc7QUFDZCxjQUFNLEVBQUUsRUFBRTs7QUFFVixlQUFPLEVBQUUsaUJBQVMsSUFBSSxFQUFFO0FBQ3RCLGlCQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDMUI7O0FBRUQsZUFBTyxFQUFFLGlCQUFTLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDNUIsY0FBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7U0FDMUI7T0FDRixDQUFDO0tBQ0g7O0FBRUQsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztHQUNqRDs7ZUFuQkcsV0FBVzs7NEJBcUJQLElBQUksRUFBRTtBQUNaLFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFN0MsVUFBSSxLQUFLLEVBQUU7QUFDVCxhQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUMzQixNQUFNO0FBQ0wsYUFBSyxHQUFHLEVBQUUsQ0FBQztPQUNaOztBQUVELGFBQU8sS0FBSyxDQUFDLElBQUksQ0FBQztLQUNuQjs7OzRCQUVPLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDbEIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUU3QyxVQUFJLEtBQUssRUFBRTtBQUNULGFBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQzNCLE1BQU07QUFDTCxhQUFLLEdBQUcsRUFBRSxDQUFDO09BQ1o7O0FBRUQsV0FBSyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWxCLFVBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ3pEOzs7U0E3Q0csV0FBVzs7O0FBZ0RqQixNQUFNLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQzs7Ozs7QUNoRDdCLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRTtBQUNwQixVQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLENBQUM7Q0FDMUM7OztBQUFBLEFBR0QsSUFBSSxpQkFBaUIsSUFBSSxRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFO0FBQ3RELFVBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN4RCxNQUFJLFNBQVMsQ0FBQyxhQUFhLEVBQUU7QUFDM0IsYUFBUyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsbUJBQW1CLEVBQUU7QUFDcEQsV0FBSyxFQUFFLEdBQUc7S0FDWCxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQ2IsYUFBTyxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUN6QyxFQUFFLFVBQUEsR0FBRyxFQUFJO0FBQ1IsYUFBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUN0QyxDQUFDLENBQUM7R0FDSjs7QUFFRCxNQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUNqQixXQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7R0FDekI7O0FBRUQsT0FBSyxDQUFDLFlBQVksRUFBRTtBQUNsQixlQUFXLEVBQUUsYUFBYTtHQUMzQixDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsUUFBUSxFQUFJO0FBQ2xCLFdBQU8sUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDO0dBQ3hCLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxJQUFJLEVBQUk7QUFDZCxVQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzs7QUFFbkIsUUFBSSxNQUFNLENBQUMsSUFBSSxLQUFLLEtBQUssRUFBRTtBQUN6QixVQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFO0FBQzNCLGVBQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNyQixrQkFBUSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUTtBQUNoQyxnQkFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTTtBQUM1QixrQkFBUSxFQUFFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUc7QUFDckMsa0JBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRO0FBQzFDLGdCQUFNLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRztTQUNqQyxDQUFDLENBQUM7QUFDSCxvQkFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztPQUMvRCxNQUFNO0FBQ0wsWUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFbkQsWUFBSSxTQUFTLEVBQUU7QUFDYixnQkFBTSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ3BDLGNBQUksTUFBTSxDQUFDLElBQUksRUFBRTtBQUNmLG1CQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDckIsc0JBQVEsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVE7QUFDaEMsb0JBQU0sRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU07QUFDNUIsc0JBQVEsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHO0FBQ3JDLHNCQUFRLEVBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUTtBQUMxQyxvQkFBTSxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUc7YUFDakMsQ0FBQyxDQUFDO1dBQ0osTUFBTTtBQUNMLG1CQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDckIsb0JBQU0sRUFBRSxXQUFXO2FBQ3BCLENBQUMsQ0FBQztXQUNKO1NBQ0YsTUFBTTtBQUNMLGlCQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDckIsa0JBQU0sRUFBRSxXQUFXO1dBQ3BCLENBQUMsQ0FBQztTQUNKO09BQ0Y7S0FDRixNQUFNO0FBQ0wsa0JBQVksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN4RCxhQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDckIsY0FBTSxFQUFFLFdBQVc7T0FDcEIsQ0FBQyxDQUFDO0tBQ0o7O0FBRUQsUUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDOztBQUU3QyxRQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsNEJBQTRCLENBQUMsQ0FBQzs7QUFFNUQsUUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7O0FBRTdDLFFBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQ3ZELFFBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQ3ZELFFBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0FBQ3JELFFBQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDOztBQUV6RCxRQUFNLFlBQVksR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztBQUNyRCxRQUFNLHVCQUF1QixHQUFHLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFDOztBQUU1RSxRQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsb0NBQW9DLENBQUMsQ0FBQztBQUNqRSxRQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMseUJBQXlCLENBQUMsQ0FBQzs7QUFFbkQsbUJBQWUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Ozs7Ozs7QUFFL0IsMkJBQWtCLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyw4SEFBRTtZQUF0QyxHQUFHOztBQUNaLGtCQUFVLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxVQUFVLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO09BQzdFOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsU0FBSyxJQUFNLE1BQU0sSUFBSSxPQUFPLEVBQUU7QUFDNUIsVUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxFQUFFO0FBQ2xDLGtCQUFVLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztPQUNwRDtLQUNGOztBQUVELFFBQU0sYUFBYSxHQUFHLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRTtBQUM5QyxVQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJO0FBQzNCLFdBQUssRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLEtBQUs7QUFDN0IsWUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTTtBQUMvQixVQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJO0FBQzNCLGFBQU8sRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU87QUFDakMsbUJBQWEsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWE7QUFDN0MsWUFBTSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsTUFBTTtLQUNoQyxFQUFFO0FBQ0Qsa0JBQVksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztBQUM1QyxnQkFBVSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDO0tBQ3pDLENBQUMsQ0FBQzs7QUFFSCxRQUFNLFVBQVUsR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzlELFFBQU0sVUFBVSxHQUFHLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDbEUsUUFBTSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLENBQUMsQ0FBQztBQUMvRCxRQUFNLFdBQVcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDOztBQUVyRSxjQUFVLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDNUIsY0FBVSxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQzVCLGFBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUMzQixlQUFXLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRTdCLFFBQU0sZUFBZSxHQUFHLElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRTtBQUNsRCxjQUFRLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRO0tBQ3BDLEVBQUU7QUFDRCxzQkFBZ0IsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLGdCQUFnQixDQUFDO0FBQ3BELHFCQUFlLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUM7QUFDbEQsa0JBQVksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQztLQUM3QyxDQUFDLENBQUM7O0FBRUgsUUFBTSxRQUFRLEdBQUcsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLENBQUM7O0FBRW5ELFlBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQ3JCLFVBQUksRUFBRSxNQUFNLENBQUMsSUFBSTtLQUNsQixDQUFDLENBQUM7O0FBRUgsUUFBTSxzQkFBc0IsR0FBRyxJQUFJLGFBQWEsQ0FBQyxlQUFlLEVBQUU7QUFDaEUsbUJBQWEsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLGFBQWE7S0FDOUMsRUFBRTtBQUNELGtCQUFZLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZO0tBQzVDLENBQUMsQ0FBQzs7QUFFSCxRQUFNLG1CQUFtQixHQUFHLElBQUksdUJBQXVCLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7QUFFaEYsdUJBQW1CLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVqQyxVQUFNLENBQUMsUUFBUSxFQUFFLENBQUM7R0FDbkIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxVQUFBLEVBQUUsRUFBSTtBQUNiLFdBQU8sQ0FBQyxHQUFHLENBQUMscUNBQXFDLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDeEQsQ0FBQyxDQUFDO0NBQ0o7OztBQ3JKRCxZQUFZLENBQUM7O0FBRWIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU3QixNQUFNLENBQUMsT0FBTyxHQUFHLENBQUMsWUFBVzs7QUFFM0IsU0FBTztBQUNMLFlBQVEsRUFBRSxvQkFBVztBQUNuQixVQUFJLEVBQUUsQ0FBQztLQUNSOztBQUVELE9BQUcsRUFBRSxhQUFTLElBQUksRUFBRSxRQUFRLEVBQUU7QUFDNUIsVUFBSSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztLQUN0Qjs7QUFFRCxNQUFFLEVBQUUsWUFBUyxJQUFJLEVBQUU7QUFDakIsVUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ1o7O0FBRUQsUUFBSSxFQUFFLGdCQUFXO0FBQ2YsVUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUN6QixjQUFNLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxDQUFDO09BQ3ZCLE1BQU07QUFDTCxZQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDWDtLQUNGOztBQUVELFFBQUksRUFBRSxjQUFTLElBQUksRUFBRTtBQUNuQixVQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDWixVQUFJLElBQUksRUFBRTtBQUNSLGNBQU0sQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO09BQ3hCO0tBQ0Y7R0FDRixDQUFDO0NBRUgsQ0FBQSxFQUFHLENBQUM7Ozs7Ozs7Ozs7O0FDbkNMLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFbkMsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7O0lBRW5DLFVBQVU7WUFBVixVQUFVOztBQUNkLFdBREksVUFBVSxDQUNGLE1BQU0sRUFBZTtRQUFiLE1BQU0seURBQUcsRUFBRTs7MEJBRDNCLFVBQVU7O3VFQUFWLFVBQVUsYUFFTixNQUFNLEVBQUUsTUFBTTs7QUFFcEIsVUFBSyxPQUFPLENBQUMsVUFBVSxHQUFHO0FBQ3hCLFdBQUssRUFBRSxTQUFTO0FBQ2hCLGFBQU8sRUFBRSxDQUFDLEtBQUssQ0FBQztBQUNoQixhQUFPLEVBQUUsbUJBQU07QUFDYixlQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztPQUMxQjtLQUNGLENBQUM7O0FBRUYsVUFBSyxPQUFPLENBQUMsY0FBYyxHQUFHO0FBQzVCLFdBQUssRUFBRSxrQkFBa0I7QUFDekIsYUFBTyxFQUFFLENBQUMsS0FBSyxDQUFDO0FBQ2hCLGFBQU8sRUFBRSxtQkFBTTtBQUNiLGVBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO09BQzFCO0tBQ0YsQ0FBQzs7QUFFRixVQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUc7QUFDcEIsV0FBSyxFQUFFLFNBQVM7QUFDaEIsYUFBTyxFQUFFLENBQUMsS0FBSyxDQUFDO0FBQ2hCLGFBQU8sRUFBRSxtQkFBTTtBQUNiLGVBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFNO0FBQ2xDLGlCQUFPLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztTQUNoQyxDQUFDLENBQUM7T0FDSjtLQUNGLENBQUM7O0FBRUYsVUFBSyxPQUFPLENBQUMsSUFBSSxHQUFHO0FBQ2xCLFdBQUssRUFBRSxPQUFPO0FBQ2QsYUFBTyxFQUFFLENBQUMsS0FBSyxDQUFDO0FBQ2hCLGFBQU8sRUFBRSxtQkFBTTtBQUNiLGVBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO09BQzFCO0tBQ0YsQ0FBQzs7QUFFRixVQUFLLE9BQU8sQ0FBQyxPQUFPLEdBQUc7QUFDckIsV0FBSyxFQUFFLFVBQVU7QUFDakIsYUFBTyxFQUFFLENBQUMsS0FBSyxDQUFDO0FBQ2hCLGFBQU8sRUFBRSxtQkFBTTtBQUNiLGVBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO09BQzFCO0tBQ0YsQ0FBQzs7R0FDSDs7U0E3Q0csVUFBVTtHQUFTLE1BQU07O0FBZ0QvQixNQUFNLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQzs7Ozs7Ozs7O0FDcEQ1QixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDdEMsSUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7O0FBRWpELElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDOztJQUV6QyxVQUFVO0FBQ2QsV0FESSxVQUFVLENBQ0YsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7MEJBRHZDLFVBQVU7O0FBRVosUUFBSSxDQUFDLEdBQUcsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQzs7QUFFcEMsUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDdEIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRTdDLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7R0FDakQ7O2VBUkcsVUFBVTs7cUNBVUc7OztBQUNmLFVBQUksQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLFNBQVMsRUFBRSxVQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUs7QUFDbEQsZUFBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDbEMsaUJBQU87QUFDTCxrQkFBTSxFQUFFLEVBQUU7O0FBRVYsbUJBQU8sRUFBRSxtQkFBTTtBQUNiLDBCQUFZLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4QyxvQkFBSyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDNUIsc0JBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7ZUFDdEMsQ0FBQyxDQUFDO2FBQ0o7O0FBRUQsa0JBQU0sRUFBRSxnQkFBQyxHQUFHLEVBQUs7QUFDZixvQkFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN0QjtXQUNGLENBQUM7U0FDSCxDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7O0FBRUgsVUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsUUFBUSxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUNqRCxlQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNsQyxpQkFBTztBQUNMLGtCQUFNLEVBQUUsRUFBRTs7QUFFVixxQkFBUyxFQUFFLHFCQUFNO0FBQ2Ysb0JBQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFO0FBQzdCLG9CQUFJLEVBQUUsS0FBSztBQUNYLHFCQUFLLEVBQUUsRUFBRTtBQUNULG9CQUFJLEVBQUUsQ0FBQztBQUNMLHVCQUFLLEVBQUUsTUFBTTtBQUNiLHNCQUFJLEVBQUUsR0FBRztpQkFDVixFQUFFO0FBQ0QsdUJBQUssRUFBRSxNQUFNO0FBQ2Isc0JBQUksRUFBRSxNQUFNO2lCQUNiLEVBQUU7QUFDRCx1QkFBSyxFQUFFLE9BQU87QUFDZCxzQkFBSSxFQUFFLFFBQVE7aUJBQ2YsQ0FBQztlQUNILENBQUMsQ0FBQzthQUNKOztBQUVELG1CQUFPLEVBQUUsaUJBQUMsTUFBTSxFQUFLO0FBQ25CLG9CQUFLLFVBQVUsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQzVCLHNCQUFNLEVBQU4sTUFBTTtlQUNQLENBQUMsQ0FBQzthQUNKOztBQUVELGtCQUFNLEVBQUUsZ0JBQUMsR0FBRyxFQUFLO0FBQ2Ysb0JBQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDdEI7V0FDRixDQUFDO1NBQ0gsQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBQ0o7OztTQWhFRyxVQUFVOzs7QUFtRWhCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Ozs7QUN4RTVCLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQ3hDLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQzVDLElBQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN4QyxJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUNqRCxJQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUMvQyxJQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDOztBQUUvRCxJQUFNLGlCQUFpQixHQUFHLE9BQU8sQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBQzlELElBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDOztBQUUzRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7SUFFekMsaUJBQWlCO0FBQ3JCLFdBREksaUJBQWlCLENBQ1QsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7MEJBRHZDLGlCQUFpQjs7QUFFbkIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRTlDLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxVQUFVLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDaEQsUUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUM5QyxRQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsQ0FBQzs7QUFFOUQsUUFBSSxDQUFDLGtCQUFrQixHQUFHLElBQUksaUJBQWlCLEVBQUUsQ0FBQztBQUNsRCxRQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztHQUNoRDs7ZUFWRyxpQkFBaUI7O3FDQVlKOzs7QUFDZixVQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFLO0FBQzlDLGVBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFNOztBQUVsQyxjQUFNLElBQUksR0FBRztBQUNYLGdCQUFJLEVBQUUsS0FBSztXQUNaLENBQUM7O0FBRUYsY0FBTSxRQUFRLEdBQUc7QUFDZixrQkFBTSxFQUFFLENBQUM7QUFDUCxrQkFBSSxFQUFFLE9BQU87QUFDYixrQkFBSSxFQUFFLE9BQU87QUFDYix1QkFBUyxFQUFFLEtBQUs7YUFDakIsRUFBRTtBQUNELGtCQUFJLEVBQUUsTUFBTTtBQUNaLGtCQUFJLEVBQUUsTUFBTTtBQUNaLHVCQUFTLEVBQUUsTUFBTTthQUNsQixDQUFDO1dBQ0gsQ0FBQzs7QUFFRixjQUFNLElBQUksR0FBRyxDQUFDO0FBQ1osaUJBQUssRUFBRSxNQUFNO0FBQ2IsZ0JBQUksRUFBRSxHQUFHO1dBQ1YsRUFBRTtBQUNELGlCQUFLLEVBQUUsTUFBTTtBQUNiLGdCQUFJLEVBQUUsTUFBTTtXQUNiLEVBQUU7QUFDRCxpQkFBSyxFQUFFLE9BQU87QUFDZCxnQkFBSSxFQUFFLFFBQVE7QUFDZCxtQkFBTyxFQUFFLElBQUk7V0FDZCxDQUFDLENBQUM7O0FBRUgsaUJBQU87QUFDTCxrQkFBTSxFQUFFO0FBQ04sdUJBQVMsRUFBRSxNQUFLLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUk7QUFDbEQsNEJBQWMsRUFBRSxNQUFLLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVM7YUFDN0Q7O0FBRUQscUJBQVMsRUFBRSxxQkFBTTtBQUNmLG9CQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRTtBQUM3QixvQkFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0FBQ2Ysd0JBQVEsRUFBUixRQUFRO0FBQ1IsK0JBQWUsRUFBRSxNQUFLLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUk7QUFDeEQsb0JBQUksRUFBSixJQUFJO2VBQ0wsQ0FBQyxDQUFDOztBQUVILG9CQUFLLGlCQUFpQixDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDbkMscUJBQUssRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQztlQUM3QixDQUFDLENBQUM7YUFDSjs7QUFFRCxtQkFBTyxFQUFFLGlCQUFDLE1BQU0sRUFBSztBQUNuQixvQkFBSyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUM1Qix1QkFBTyxFQUFFLEtBQUssQ0FBQyxVQUFVLEVBQUU7QUFDM0Isc0JBQU0sRUFBTixNQUFNO2VBQ1AsQ0FBQyxDQUFDO2FBQ0o7O0FBRUQsa0JBQU0sRUFBRSxnQkFBQyxHQUFHLEVBQUs7QUFDZixvQkFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN0QjtXQUNGLENBQUM7U0FDSCxDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7O0FBRUgsVUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsTUFBTSxFQUFFLFVBQUMsR0FBRyxFQUFFLElBQUksRUFBSztBQUMvQyxlQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNsQyxjQUFNLFFBQVEsR0FBRztBQUNmLGtCQUFNLEVBQUUsQ0FBQztBQUNQLGtCQUFJLEVBQUUsT0FBTztBQUNiLGtCQUFJLEVBQUUsT0FBTztBQUNiLHVCQUFTLEVBQUUsS0FBSzthQUNqQixFQUFFO0FBQ0Qsa0JBQUksRUFBRSxNQUFNO0FBQ1osa0JBQUksRUFBRSxNQUFNO0FBQ1osdUJBQVMsRUFBRSxNQUFNO2FBQ2xCLEVBQUU7QUFDRCxrQkFBSSxFQUFFLFVBQVU7QUFDaEIsa0JBQUksRUFBRSxVQUFVO0FBQ2hCLHVCQUFTLEVBQUUsTUFBTTthQUNsQixDQUFDO1dBQ0gsQ0FBQzs7QUFFRixpQkFBTztBQUNMLGtCQUFNLEVBQUU7QUFDTixnQkFBRSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRTtBQUNqQixrQkFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLE1BQU07QUFDbEMsdUJBQVMsRUFBRSxNQUFLLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUk7QUFDakQsNEJBQWMsRUFBRSxNQUFLLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVM7O0FBRTNELDJCQUFhLEVBQUUsdUJBQUMsS0FBSyxFQUFLOztBQUV4QixzQkFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUU7QUFDN0Isc0JBQUksRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUk7QUFDdkIsMEJBQVEsRUFBUixRQUFRO0FBQ1IsaUNBQWUsRUFBRSxNQUFLLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUk7QUFDdkQsc0JBQUksRUFBRSxDQUFDO0FBQ0wsd0JBQUksRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLEVBQUU7QUFDMUIseUJBQUssRUFBRSxRQUFRO0FBQ2YsMkJBQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxNQUFNO21CQUN0QyxFQUFFO0FBQ0Qsd0JBQUksRUFBRSxTQUFTLEdBQUcsS0FBSyxDQUFDLEVBQUUsR0FBRyxPQUFPO0FBQ3BDLHlCQUFLLEVBQUUsTUFBTTtBQUNiLDJCQUFPLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUssTUFBTTttQkFDdEMsQ0FBQztpQkFDSCxDQUFDLENBQUM7ZUFDSjthQUNGOztBQUVELG1CQUFPLEVBQUUsaUJBQUMsS0FBSyxFQUFLO0FBQ2xCLGtCQUFNLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdkIsaUJBQUcsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEdBQUcsRUFBSTtBQUN4QyxvQkFBTSxJQUFJLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM1QiwyQkFBVyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztlQUNoQyxDQUFDLENBQUM7O0FBRUgsb0JBQUssU0FBUyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sS0FBSyxNQUFNLENBQUMsQ0FBQztBQUN6RCxvQkFBSyxTQUFTLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRTtBQUMzQixvQkFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLE1BQU07QUFDbEMscUJBQUssRUFBTCxLQUFLO0FBQ0wsc0JBQU0sRUFBRSxXQUFXLENBQUMsSUFBSTtBQUN4QiwwQkFBVSxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQUU7ZUFDaEMsQ0FBQyxDQUFDO2FBQ0o7O0FBRUQsa0JBQU0sRUFBRSxnQkFBQyxHQUFHLEVBQUs7QUFDZixvQkFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN0QjtXQUNGLENBQUM7U0FDSCxDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7S0FDSjs7O1NBL0lHLGlCQUFpQjs7O0FBa0p2QixNQUFNLENBQUMsT0FBTyxHQUFHLGlCQUFpQixDQUFDOzs7Ozs7Ozs7QUM5Sm5DLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUN0QyxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUM3QyxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7SUFFekMsVUFBVTtBQUNkLFdBREksVUFBVSxDQUNGLE1BQU0sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFOzBCQUR2QyxVQUFVOztBQUVaLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUU3QyxRQUFJLENBQUMsUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0dBQzdDOztlQUxHLFVBQVU7O3FDQU9HOzs7QUFDZixVQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFLO0FBQy9DLGVBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFNO0FBQ2xDLGlCQUFPO0FBQ0wsa0JBQU0sRUFBRSxFQUFFOztBQUVWLHFCQUFTLEVBQUUscUJBQU07QUFDZixvQkFBTSxDQUFDLE9BQU8sQ0FBQyxjQUFjLEVBQUU7QUFDN0Isb0JBQUksRUFBRSxLQUFLO0FBQ1gscUJBQUssRUFBRSxFQUFFO0FBQ1Qsb0JBQUksRUFBRSxDQUFDO0FBQ0wsdUJBQUssRUFBRSxNQUFNO0FBQ2Isc0JBQUksRUFBRSxHQUFHO0FBQ1QseUJBQU8sRUFBRSxJQUFJO2lCQUNkLEVBQUU7QUFDRCx1QkFBSyxFQUFFLE1BQU07QUFDYixzQkFBSSxFQUFFLE1BQU07aUJBQ2IsRUFBRTtBQUNELHVCQUFLLEVBQUUsT0FBTztBQUNkLHNCQUFJLEVBQUUsUUFBUTtpQkFDZixDQUFDO2VBQ0gsQ0FBQyxDQUFDOztBQUVILG9CQUFLLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQzFCLHVCQUFPLEVBQUUsSUFBSTtlQUNkLENBQUMsQ0FBQzthQUNKOztBQUVELG1CQUFPLEVBQUUsaUJBQUEsS0FBSyxFQUFJO0FBQ2hCLG9CQUFLLFFBQVEsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQzFCLHFCQUFLLEVBQUwsS0FBSztlQUNOLENBQUMsQ0FBQzthQUNKOztBQUVELGtCQUFNLEVBQUUsZ0JBQUMsR0FBRyxFQUFLO0FBQ2Ysb0JBQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDdEI7V0FDRixDQUFDO1NBQ0gsQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBQ0o7OztTQS9DRyxVQUFVOzs7QUFrRGhCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Ozs7QUN0RDVCLElBQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNwQyxJQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUM3QyxJQUFNLFdBQVcsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUNuRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQzs7QUFFL0MsSUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLENBQUM7O0lBRXBELGVBQWU7QUFDbkIsV0FESSxlQUFlLENBQ1AsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUU7MEJBRHZDLGVBQWU7O0FBRWpCLFFBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxTQUFTLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUU1QyxRQUFJLENBQUMsUUFBUSxHQUFHLElBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzVDLFFBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxXQUFXLENBQUMsYUFBYSxDQUFDLENBQUM7O0FBRWxELFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO0dBQy9DOztlQVJHLGVBQWU7O3FDQVVGOzs7QUFFZixVQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsVUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFLO0FBQzlDLGVBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFNO0FBQ2xDLGNBQU0sSUFBSSxHQUFHO0FBQ1gsZ0JBQUksRUFBRSxLQUFLO1dBQ1osQ0FBQzs7QUFFRixjQUFNLFFBQVEsR0FBRztBQUNmLGtCQUFNLEVBQUUsQ0FBQztBQUNQLGtCQUFJLEVBQUUsT0FBTztBQUNiLGtCQUFJLEVBQUUsT0FBTztBQUNiLHVCQUFTLEVBQUUsS0FBSzthQUNqQixFQUFFO0FBQ0Qsa0JBQUksRUFBRSxNQUFNO0FBQ1osa0JBQUksRUFBRSxNQUFNO0FBQ1osdUJBQVMsRUFBRSxNQUFNO2FBQ2xCLEVBQUU7QUFDRCxrQkFBSSxFQUFFLFVBQVU7QUFDaEIsa0JBQUksRUFBRSxVQUFVO0FBQ2hCLHVCQUFTLEVBQUUsTUFBTTthQUNsQixDQUFDO1dBQ0gsQ0FBQzs7QUFFRixjQUFNLElBQUksR0FBRyxDQUFDO0FBQ1osaUJBQUssRUFBRSxNQUFNO0FBQ2IsZ0JBQUksRUFBRSxHQUFHO1dBQ1YsRUFBRTtBQUNELGlCQUFLLEVBQUUsTUFBTTtBQUNiLGdCQUFJLEVBQUUsTUFBTTtBQUNaLG1CQUFPLEVBQUUsSUFBSTtXQUNkLEVBQUU7QUFDRCxpQkFBSyxFQUFFLE9BQU87QUFDZCxnQkFBSSxFQUFFLFFBQVE7V0FDZixDQUFDLENBQUM7O0FBRUgsaUJBQU87QUFDTCxrQkFBTSxFQUFFO0FBQ04sdUJBQVMsRUFBRSxNQUFLLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUk7QUFDaEQsNEJBQWMsRUFBRSxNQUFLLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLFNBQVM7YUFDM0Q7O0FBRUQscUJBQVMsRUFBRSxxQkFBTTtBQUNmLG9CQUFNLENBQUMsT0FBTyxDQUFDLGNBQWMsRUFBRTtBQUM3QixvQkFBSSxFQUFFLElBQUksQ0FBQyxJQUFJO0FBQ2Ysd0JBQVEsRUFBUixRQUFRO0FBQ1IsK0JBQWUsRUFBRSxNQUFLLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxDQUFDLElBQUk7QUFDdEQsb0JBQUksRUFBSixJQUFJO2VBQ0wsQ0FBQyxDQUFDOztBQUVILG9CQUFLLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQzdCLHFCQUFLLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUM7ZUFDN0IsQ0FBQyxDQUFDO2FBQ0o7O0FBRUQsbUJBQU8sRUFBRSxpQkFBQyxJQUFJLEVBQUs7QUFDakIsb0JBQUssUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUU7QUFDMUIsb0JBQUksRUFBSixJQUFJO2VBQ0wsQ0FBQyxDQUFDO2FBQ0o7O0FBRUQsa0JBQU0sRUFBRSxnQkFBQyxHQUFHLEVBQUs7QUFDZixvQkFBTSxJQUFJLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN0QjtXQUNGLENBQUM7U0FDSCxDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7S0FDSjs7O1NBN0VHLGVBQWU7OztBQWdGckIsTUFBTSxDQUFDLE9BQU8sR0FBRyxlQUFlLENBQUM7Ozs7Ozs7Ozs7O0FDdkZqQyxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRW5DLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDOztJQUVuQyxXQUFXO1lBQVgsV0FBVzs7QUFDZixXQURJLFdBQVcsQ0FDSCxNQUFNLEVBQWU7UUFBYixNQUFNLHlEQUFHLEVBQUU7OzBCQUQzQixXQUFXOzt1RUFBWCxXQUFXLGFBRVAsTUFBTSxFQUFFLE1BQU07O0FBRXBCLFVBQUssT0FBTyxDQUFDLEdBQUcsR0FBRztBQUNqQixXQUFLLEVBQUUsR0FBRztBQUNWLGFBQU8sRUFBRSxDQUFDLEtBQUssQ0FBQztBQUNoQixhQUFPLEVBQUUsaUJBQUEsTUFBTSxFQUFJO0FBQ2pCLGVBQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUM7T0FDckU7S0FDRixDQUFDOztBQUVGLFVBQUssT0FBTyxDQUFDLElBQUksR0FBRztBQUNsQixXQUFLLEVBQUUsZUFBZTtBQUN0QixhQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUM7QUFDaEIsYUFBTyxFQUFFLGlCQUFBLE1BQU0sRUFBSTtBQUNqQixlQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3hGLGNBQUksTUFBTSxDQUFDLGFBQWEsRUFBRTtBQUN4QixrQkFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztXQUM3Qjs7QUFFRCxlQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pDLGlCQUFPLEtBQUssQ0FBQztTQUNkLENBQUMsQ0FBQztPQUNKO0tBQ0YsQ0FBQzs7QUFFRixVQUFLLE9BQU8sQ0FBQyxHQUFHLEdBQUc7QUFDakIsV0FBSyxFQUFFLEdBQUc7QUFDVixhQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDakIsYUFBTyxFQUFFLGlCQUFBLE1BQU0sRUFBSTtBQUNqQixlQUFPLElBQUksS0FBSyxDQUFDO0FBQ2YsZ0JBQU0sRUFBRTtBQUNOLGdCQUFJLEVBQUUsTUFBTSxDQUFDLElBQUk7QUFDakIsa0JBQU0sRUFBRSxNQUFNLENBQUMsTUFBTTtXQUN0QjtTQUNGLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztPQUNYO0tBQ0YsQ0FBQzs7QUFFRixVQUFLLE9BQU8sQ0FBQyxNQUFNLEdBQUc7QUFDcEIsV0FBSyxFQUFFLE1BQU07QUFDYixhQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDakIsYUFBTyxFQUFFLGlCQUFBLE1BQU0sRUFBSTtBQUNqQixZQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssUUFBUSxFQUFFO0FBQzlCLGlCQUFPLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFBQyxTQUN6QixNQUFNO0FBQ0wsbUJBQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsTUFBTSxFQUFJO0FBQzVDLHFCQUFPLElBQUksQ0FBQzthQUNiLENBQUMsQ0FBQztXQUNKO09BQ0Y7S0FDRixDQUFDOztBQUVGLFVBQUssT0FBTyxDQUFDLE1BQU0sR0FBRztBQUNwQixXQUFLLEVBQUUsTUFBTTtBQUNiLGFBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQztBQUNqQixhQUFPLEVBQUUsaUJBQUEsTUFBTSxFQUFJO0FBQ2pCLFlBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUU7QUFDOUIsaUJBQU8sT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ3pCLE1BQU07QUFDTCxpQkFBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDekMsaUJBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQzs7QUFFN0IsbUJBQU8sS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1dBQ3JCLENBQUMsQ0FBQztTQUNKO09BQ0Y7S0FDRixDQUFDOztHQUNIOztTQXJFRyxXQUFXO0dBQVMsTUFBTTs7QUF3RWhDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsV0FBVyxDQUFDOzs7QUM1RTdCLFlBQVksQ0FBQzs7Ozs7Ozs7QUFFYixJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRW5DLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzs7SUFFL0IsVUFBVTtZQUFWLFVBQVU7O0FBQ2QsV0FESSxVQUFVLENBQ0YsTUFBTSxFQUFlO1FBQWIsTUFBTSx5REFBRyxFQUFFOzswQkFEM0IsVUFBVTs7dUVBQVYsVUFBVSxhQUVOLE1BQU0sRUFBRSxNQUFNOztBQUVwQixVQUFLLE9BQU8sQ0FBQyxJQUFJLEdBQUc7QUFDbEIsV0FBSyxFQUFFLEdBQUc7QUFDVixhQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUM7QUFDaEIsYUFBTyxFQUFFLG1CQUFNO0FBQ2IsZUFBTyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDM0MsY0FBTSxRQUFRLEdBQUc7QUFDZixlQUFHLEVBQUUsRUFBRTtBQUNQLGVBQUcsRUFBRSxFQUFFO0FBQ1AsaUJBQUssRUFBRSxFQUFFO0FBQ1QsZ0JBQUksRUFBRSxFQUFFO1dBQ1QsQ0FBQzs7QUFFRixjQUFJLEtBQUssQ0FBQyxPQUFPLElBQUksRUFBRSxFQUFFO0FBQ3ZCLG9CQUFRLENBQUMsR0FBRyxHQUFHLEVBQUUsR0FBRyxBQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxHQUFJLEVBQUUsQ0FBQztXQUMvQyxNQUFNO0FBQ0wsb0JBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDOztBQUVqQixnQkFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLEVBQUUsRUFBRTtBQUN2QixzQkFBUSxDQUFDLEdBQUcsR0FBRyxFQUFFLEdBQUcsQUFBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBLEdBQUksRUFBRSxHQUFJLEVBQUUsQ0FBQzthQUN0RCxNQUFNO0FBQ0wsc0JBQVEsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDOztBQUVqQixrQkFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLEVBQUUsRUFBRTtBQUN2Qix3QkFBUSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsQUFBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBLEdBQUksRUFBRSxHQUFJLEVBQUUsQ0FBQztlQUN4RCxNQUFNO0FBQ0wsd0JBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDOztBQUVuQix3QkFBUSxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsQUFBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBLEdBQUksRUFBRSxHQUFJLEVBQUUsQ0FBQztlQUN2RDthQUNGO1dBQ0Y7O0FBRUQsZUFBSyxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUM7O0FBRTFCLGNBQUksS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLEVBQUU7QUFDdkIsZ0JBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUM7QUFDaEQsaUJBQUssQ0FBQyxPQUFPLEdBQU0sS0FBSyxDQUFDLE9BQU8sa0JBQWEsS0FBSyxDQUFDLFNBQVMsYUFBUSxNQUFNLEFBQUUsQ0FBQztXQUM5RSxNQUFNO0FBQ0wsaUJBQUssQ0FBQyxPQUFPLEdBQUcsdUJBQXVCLENBQUM7V0FDekM7O0FBRUQsaUJBQU8sS0FBSyxDQUFDO1NBQ2QsQ0FBQyxDQUFDO09BQ0o7S0FDRixDQUFDOztHQUNIOztTQWpERyxVQUFVO0dBQVMsTUFBTTs7QUFvRC9CLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDOzs7QUMxRDVCLFlBQVksQ0FBQzs7Ozs7Ozs7QUFFYixJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRW5DLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzs7SUFFL0IsU0FBUztZQUFULFNBQVM7O0FBQ2IsV0FESSxTQUFTLENBQ0QsTUFBTSxFQUFlO1FBQWIsTUFBTSx5REFBRyxFQUFFOzswQkFEM0IsU0FBUzs7dUVBQVQsU0FBUyxhQUVMLE1BQU0sRUFBRSxNQUFNOztBQUVwQixVQUFLLE9BQU8sQ0FBQyxHQUFHLEdBQUc7QUFDakIsV0FBSyxFQUFFLEdBQUc7QUFDVixhQUFPLEVBQUUsQ0FBQyxLQUFLLENBQUM7QUFDaEIsYUFBTyxFQUFFLGlCQUFBLE1BQU0sRUFBSTtBQUNqQixlQUFPLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDO09BQ25FO0tBQ0YsQ0FBQzs7QUFFRixVQUFLLE9BQU8sQ0FBQyxHQUFHLEdBQUc7QUFDakIsV0FBSyxFQUFFLEdBQUc7QUFDVixhQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUM7QUFDakIsYUFBTyxFQUFFLGlCQUFBLE1BQU0sRUFBSTtBQUNqQixlQUFPLElBQUksR0FBRyxDQUFDO0FBQ2IsZ0JBQU0sRUFBRTtBQUNOLG1CQUFPLEVBQUUsTUFBTSxDQUFDLE9BQU87QUFDdkIsaUJBQUssRUFBRSxNQUFNLENBQUMsS0FBSztBQUNuQixvQkFBUSxFQUFFLE1BQU0sQ0FBQyxRQUFRO1dBQzFCO1NBQ0YsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO09BQ1g7S0FDRixDQUFDOztBQUVGLFVBQUssT0FBTyxDQUFDLE1BQU0sR0FBRztBQUNwQixXQUFLLEVBQUUsTUFBTTtBQUNiLGFBQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQztBQUNqQixhQUFPLEVBQUUsaUJBQUEsTUFBTSxFQUFJO0FBQ2pCLFlBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxRQUFRLEVBQUU7QUFDOUIsaUJBQU8sT0FBTyxDQUFDLE1BQU0sRUFBRTtBQUFDLFNBQ3pCLE1BQU07QUFDTCxtQkFBTyxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxNQUFNLEVBQUk7QUFDMUMscUJBQU8sSUFBSSxDQUFDO2FBQ2IsQ0FBQyxDQUFDO1dBQ0o7T0FDRjtLQUNGLENBQUM7O0FBRUYsVUFBSyxPQUFPLENBQUMsTUFBTSxHQUFHO0FBQ3BCLFdBQUssRUFBRSxNQUFNO0FBQ2IsYUFBTyxFQUFFLENBQUMsTUFBTSxDQUFDO0FBQ2pCLGFBQU8sRUFBRSxpQkFBQSxNQUFNLEVBQUk7QUFDakIsWUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLFFBQVEsRUFBRTtBQUM5QixpQkFBTyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDekIsTUFBTTtBQUNMLGlCQUFPLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLEdBQUcsRUFBSTtBQUNyQyxnQkFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQzs7QUFFakMsZUFBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDOztBQUUzQixnQkFBSSxPQUFPLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLFdBQVcsRUFBRTtBQUM3QyxpQkFBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQzthQUN0Qzs7QUFFRCxtQkFBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUM7V0FDbkIsQ0FBQyxDQUFDO1NBQ0o7T0FDRjtLQUNGLENBQUM7O0dBQ0g7O1NBN0RHLFNBQVM7R0FBUyxNQUFNOztBQWdFOUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7Ozs7Ozs7OztJQ3RFckIsTUFBTTtBQUVWLFdBRkksTUFBTSxDQUVFLE1BQU0sRUFBZTtRQUFiLE1BQU0seURBQUcsRUFBRTs7MEJBRjNCLE1BQU07O0FBR1IsUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7QUFDdEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7O0FBRXRCLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0dBQ25COztlQVBHLE1BQU07O2tDQVNJLElBQUksRUFBRSxNQUFNLEVBQUU7OztBQUMxQixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pDLFdBQUssQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQUEsTUFBTSxFQUFJO0FBQzlCLGNBQUssT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQUssT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsWUFBZTtBQUM5RCxnQkFBTSw0QkFBVyxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sRUFBSTtBQUMvQixtQkFBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDbEMsa0JBQUksTUFBTSxDQUFDLFNBQVMsRUFBRTtBQUNwQixzQkFBTSxDQUFDLFNBQVMsRUFBRSxDQUFDO2VBQ3BCOztBQUVELHFCQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQ3ZCLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1dBQ3pCLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQztLQUNKOzs7U0F6QkcsTUFBTTs7O0FBNEJaLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDOzs7QUM1QnhCLFlBQVksQ0FBQzs7QUFFYixJQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7O0FBRXpDLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDOztBQUVqRSxTQUFTLE9BQU8sQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtBQUM5QyxNQUFJLFdBQVcsS0FBSyxPQUFPLEVBQUU7QUFDM0IsV0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQ3pCOztBQUVELFNBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUM5Qjs7QUFFRCxTQUFTLFVBQVUsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRTtBQUNqRCxNQUFJLFdBQVcsS0FBSyxPQUFPLEVBQUU7QUFDM0IsV0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQ3pCOztBQUVELFNBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUM5Qjs7QUFFRCxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRTtBQUNoQyxNQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7QUFDMUIsV0FBTyxPQUFPLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDO0dBQ3pCOztBQUVELFNBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUM5Qjs7QUFFRCxTQUFTLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQy9CLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBRS9ELFNBQU8sSUFBSSxVQUFVLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3ZDOztBQUVELE9BQU8sQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO0FBQzFCLE9BQU8sQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBQ2hDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLE9BQU8sQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDOzs7Ozs7Ozs7SUN2Q3RCLFNBQVM7V0FBVCxTQUFTOzBCQUFULFNBQVM7OztlQUFULFNBQVM7OzhCQUVJO0FBQ2YsYUFBTyxDQUNMLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLEtBQUssQ0FDTixDQUFDO0tBQ0g7OztnQ0FFa0I7QUFDakIsYUFBTyxDQUNMLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxFQUNMLEtBQUssRUFDTCxLQUFLLEVBQ0wsS0FBSyxDQUNOLENBQUM7S0FDSDs7OzJCQUVhLElBQUksRUFBRTtBQUNsQixVQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDMUIsVUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQzlCLFVBQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNqQyxVQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNoRCxVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQzs7QUFFNUMsYUFBTyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLE1BQU0sR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLEdBQUcsR0FBRyxHQUFHLE9BQU8sQ0FBQztLQUM1Rzs7O3lCQUVXLEdBQUcsRUFBRSxJQUFJLEVBQUU7QUFDckIsVUFBTSxDQUFDLEdBQUcsV0FBVyxHQUFHLEdBQUcsQ0FBQztBQUM1QixhQUFPLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNsQzs7O1NBNUNHLFNBQVM7OztBQStDZixNQUFNLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQzs7Ozs7Ozs7O0lDL0NyQixNQUFNOzs7QUFHVixXQUhJLE1BQU0sR0FHSTswQkFIVixNQUFNOzs7O0FBTVIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFOzs7QUFBQyxBQUdsQixRQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDO0dBQ25COzs7OztBQUFBO2VBVkcsTUFBTTs7NEJBZUYsS0FBSyxFQUFFLElBQUksRUFBRTtBQUNuQixVQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUN4QixlQUFPLEtBQUssQ0FBQztPQUNkOztBQUVELFVBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDdEMsVUFBSSxHQUFHLEdBQUcsV0FBVyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDOztBQUUvQyxhQUFPLEdBQUcsRUFBRSxFQUFFO0FBQ1osbUJBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO09BQ3BDOztBQUVELGFBQU8sSUFBSSxDQUFDO0tBQ2I7Ozs7Ozs7Ozs4QkFNUyxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQ3JCLFVBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ3hCLFlBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO09BQzFCOztBQUVELFVBQUksS0FBSyxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFBLENBQUUsUUFBUSxFQUFFLENBQUM7QUFDeEMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDdkIsYUFBSyxFQUFFLEtBQUs7QUFDWixZQUFJLEVBQUUsSUFBSTtPQUNYLENBQUMsQ0FBQzs7QUFFSCxhQUFPLEtBQUssQ0FBQztLQUNkOzs7Ozs7OztnQ0FLVyxLQUFLLEVBQUU7QUFDakIsV0FBSyxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFFO0FBQzFCLFlBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNuQixlQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0RCxnQkFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUU7QUFDdEMsa0JBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QixxQkFBTyxLQUFLLENBQUM7YUFDZDtXQUNGO1NBQ0Y7T0FDRjs7QUFFRCxhQUFPLElBQUksQ0FBQztLQUNiOzs7U0FoRUcsTUFBTTs7O0FBbUVaLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxNQUFNLEVBQUUsQ0FBQzs7Ozs7Ozs7O0lDbkV4QixLQUFLO0FBQ1QsV0FESSxLQUFLLENBQ0csT0FBTyxFQUFFOzBCQURqQixLQUFLOztBQUVQLFFBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxJQUFJLElBQUksQ0FBQzs7QUFFaEMsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7QUFDbkIsUUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7O0FBRW5CLFFBQUksQ0FBQyxXQUFXLEdBQUc7QUFDakIsVUFBSSxFQUFFLEVBQUU7QUFDUixXQUFLLEVBQUUsRUFBRTtBQUNULFFBQUUsRUFBRSxFQUFFO0FBQ04sVUFBSSxFQUFFLEVBQUU7S0FDVCxDQUFDOztBQUVGLFFBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pELFFBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDeEQ7O2VBaEJHLEtBQUs7OytCQWtCRSxPQUFPLEVBQUU7QUFDbEIsVUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDOztBQUVmLFVBQUksQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDOztBQUV4QixVQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDM0UsVUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMxRTs7OzZCQUVRLFNBQVMsRUFBRSxFQUFFLEVBQUU7QUFDdEIsVUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7S0FDdEM7OztxQ0FFZ0IsR0FBRyxFQUFFO0FBQ3BCLFVBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7QUFDckMsVUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztLQUN0Qzs7O29DQUVlLEdBQUcsRUFBRTtBQUNuQixVQUFLLENBQUUsSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFFLElBQUksQ0FBQyxNQUFNLEVBQUc7QUFDbEMsZUFBTztPQUNWOztBQUVELFVBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ2pDLFVBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDOztBQUVqQyxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUM5QixVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQzs7QUFFOUIsVUFBSyxJQUFJLENBQUMsR0FBRyxDQUFFLEtBQUssQ0FBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUUsS0FBSyxDQUFFLEVBQUc7QUFDekMsWUFBSyxLQUFLLEdBQUcsQ0FBQyxFQUFHO0FBQ2IsY0FBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUEsRUFBRTttQkFBSSxFQUFFLEVBQUU7V0FBQSxDQUFDLENBQUM7U0FDN0MsTUFBTTtBQUNILGNBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFBLEVBQUU7bUJBQUksRUFBRSxFQUFFO1dBQUEsQ0FBQyxDQUFDO1NBQzlDO09BQ0osTUFBTTtBQUNILFlBQUssS0FBSyxHQUFHLENBQUMsRUFBRztBQUNiLGNBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxVQUFBLEVBQUU7bUJBQUksRUFBRSxFQUFFO1dBQUEsQ0FBQyxDQUFDO1NBQzNDLE1BQU07QUFDSCxjQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBQSxFQUFFO21CQUFJLEVBQUUsRUFBRTtXQUFBLENBQUMsQ0FBQztTQUM3QztPQUNKOztBQUVELFVBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFVBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO0tBQ3BCOzs7OEJBRVM7QUFDUixVQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7QUFDakIsWUFBSSxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzlFLFlBQUksQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7T0FDN0U7O0FBRUQsVUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7S0FDdEI7OztTQXhFRyxLQUFLOzs7QUEyRVgsTUFBTSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQzNFdkIsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDOztJQUU3QixjQUFjO1lBQWQsY0FBYzs7V0FBZCxjQUFjOzBCQUFkLGNBQWM7O2tFQUFkLGNBQWM7OztlQUFkLGNBQWM7OytCQUNQLEVBQUUsRUFBRTs7O0FBQ2IsaUNBRkUsY0FBYyw0Q0FFRzs7QUFFbkIsVUFBTSxPQUFPLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixDQUFDLDBCQUEwQixDQUFDLENBQUM7Ozs7Ozs7Y0FDdkQsTUFBTTs7QUFDYixjQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUNwRSxjQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDOzs7Ozs7OztrQkFFckMsTUFBTTs7QUFDYixvQkFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxZQUFNO0FBQ3JDLHVCQUFLLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQixzQkFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsa0NBQWtDLENBQUMsQ0FBQztBQUN6RCxzQkFBTSxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztlQUNyQyxDQUFDLENBQUM7OztBQUxMLGtDQUFtQixPQUFPLG1JQUFFOzthQU0zQjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFWSCw2QkFBbUIsT0FBTyw4SEFBRTs7U0FXM0I7Ozs7Ozs7Ozs7Ozs7OztLQUNGOzs7Z0NBRVcsT0FBTyxFQUFFOzs7Ozs7QUFDbkIsOEJBQW1CLE9BQU8sbUlBQUU7Y0FBbkIsT0FBTTs7QUFDYixpQkFBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0NBQWtDLENBQUMsQ0FBQztTQUM3RDs7Ozs7Ozs7Ozs7Ozs7O0tBQ0Y7OztTQXZCRyxjQUFjO0dBQVMsTUFBTTs7QUEwQm5DLE1BQU0sQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDOzs7QUM1QmhDLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7O0FBRWIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUUvQixJQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDckMsSUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLENBQUM7O0FBRXpDLElBQU0sZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7O0FBRXpELElBQU0sb0JBQW9CLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0FBRTFELElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOztJQUV0QyxTQUFTO1lBQVQsU0FBUzs7QUFDYixXQURJLFNBQVMsQ0FDRCxTQUFTLEVBQUU7MEJBRG5CLFNBQVM7O3VFQUFULFNBQVMsYUFFTCxTQUFTOztBQUVmLFVBQUssY0FBYyxDQUFDLG9CQUFvQixDQUFDLENBQUM7O0FBRTFDLFVBQUssU0FBUyxHQUFHLEtBQUssQ0FBQzs7QUFFdkIsVUFBSyxZQUFZLEdBQUcsSUFBSSxnQkFBZ0IsRUFBRSxDQUFDOztHQUM1Qzs7ZUFURyxTQUFTOztnQ0FXRCxJQUFJLEVBQUU7QUFDaEIsVUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7S0FDdkI7OzsyQkFFTSxXQUFXLEVBQUUsTUFBTSxFQUFFOzs7QUFDMUIsaUNBaEJFLFNBQVMsd0NBZ0JFLFdBQVcsRUFBRSxNQUFNLEVBQUU7O0FBRWxDLFVBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFVBQUMsS0FBSyxFQUFFLElBQUksRUFBSztBQUNuRSxZQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDdkMsZUFBSyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUN4QyxtQkFBSyxhQUFhLENBQUMsVUFBVSxFQUFFO0FBQzdCLG1CQUFLLEVBQUwsS0FBSzthQUNOLENBQUMsQ0FBQztXQUNKLENBQUMsQ0FBQztTQUNKO09BQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUosVUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsVUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFLO0FBQ3pFLGVBQUssWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFdEQsWUFBTSxNQUFNLEdBQUcsT0FBSyxVQUFVLENBQUM7QUFDL0IsZUFBSyxhQUFhLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxDQUFDO09BQ3hDLENBQUMsQ0FBQyxDQUFDOztBQUVKLFVBQUksQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLFlBQU07QUFDdEQsZUFBSyxXQUFXLEVBQUUsQ0FBQztPQUNwQixDQUFDLENBQUM7S0FDSjs7O2tDQUVhLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDMUIsY0FBUSxJQUFJO0FBQ1YsYUFBSyxVQUFVO0FBQ2IsZ0JBQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25ELGdCQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNuRCxnQkFBTTtBQUFBLE9BQ1Q7O0FBRUQsVUFBTSxFQUFFLDhCQWhETixTQUFTLCtDQWdEb0IsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUU3QyxjQUFRLElBQUk7QUFDVixhQUFLLFVBQVU7QUFDYixjQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsY0FBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3ZCLGNBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN2QixjQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JCLGdCQUFNO0FBQUEsT0FDVDtLQUNGOzs7aUNBRVk7QUFDWCxpQ0E3REUsU0FBUyw0Q0E2RFE7O0FBRW5CLFVBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNuQixVQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsVUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3ZCLFVBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztLQUN4Qjs7O2tDQUVhOzs7QUFDWixVQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNyRCxVQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQUEsS0FBSyxFQUFJO0FBQ3ZDLGFBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFdkIsWUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUM7QUFDM0MsWUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQzs7QUFFbkMsWUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7QUFDdkMsWUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQzs7QUFFL0IsWUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDOztBQUU5QyxZQUFJLEdBQUcsQ0FBQztBQUNOLGdCQUFNLEVBQUU7QUFDTixtQkFBTyxFQUFQLE9BQU87QUFDUCxpQkFBSyxFQUFMLEtBQUs7QUFDTCxvQkFBUSxFQUFSLFFBQVE7V0FDVDtTQUNGLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNuQixzQkFBWSxDQUFDLEtBQUssR0FBRyxFQUFFOztBQUFDLEFBRXhCLHNCQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEIsaUJBQUssV0FBVyxFQUFFLENBQUM7QUFDbkIsZUFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDOUIsbUJBQUssYUFBYSxDQUFDLFVBQVUsRUFBRTtBQUM3QixtQkFBSyxFQUFMLEtBQUs7YUFDTixDQUFDLENBQUM7V0FDSixDQUFDLENBQUM7U0FDSixDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7O0FBRUgsVUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOztBQUVwRCxVQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUEsS0FBSyxFQUFJO0FBQ3RDLGFBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN4QixlQUFLLFdBQVcsRUFBRSxDQUFDO0FBQ25CLGNBQU0sQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQzlCLENBQUMsQ0FBQztLQUNKOzs7K0JBRVU7OztBQUNULFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7Ozs7OztjQUNuRCxJQUFJOztBQUNYLGNBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDdEMsaUJBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixpQkFBSyxDQUFDLGVBQWUsRUFBRTs7QUFBQyxBQUV4QixnQkFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7QUFDM0IsZ0JBQU0sSUFBSSxHQUFHLE9BQUssR0FBRyxDQUFDLGFBQWEsQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDLENBQUM7O0FBRXhELGdCQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDcEMscUJBQUssV0FBVyxFQUFFLENBQUM7O0FBRW5CLGtCQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7Ozs7O0FBQUMsYUFLNUIsTUFBTTtBQUNMLHVCQUFLLFdBQVcsRUFBRSxDQUFDO2VBQ3BCO1dBQ0YsQ0FBQyxDQUFDOzs7QUFuQkwsNkJBQWlCLEtBQUssOEhBQUU7O1NBb0J2Qjs7Ozs7Ozs7Ozs7Ozs7O0tBQ0Y7OztrQ0FFYTs7QUFFWixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDOzs7Ozs7QUFDdEQsOEJBQWlCLEtBQUssbUlBQUU7Y0FBZixJQUFJOztBQUNYLGNBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQy9COzs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDOzs7Ozs7QUFDMUQsOEJBQWlCLEtBQUssbUlBQUU7Y0FBZixJQUFJOztBQUNYLGNBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQy9COzs7Ozs7Ozs7Ozs7Ozs7S0FDRjs7O3NDQUVpQjs7O0FBQ2hCLFVBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLENBQUMsQ0FBQzs7Ozs7OztjQUNuRCxJQUFJOztBQUNYLGNBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDdkMsaUJBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFdkIsZ0JBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQzNCLGdCQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQzs7QUFFbkMsZ0JBQU0sSUFBSSxHQUFHLE9BQUssR0FBRyxDQUFDLGFBQWEsQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDeEQsZ0JBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVsQyxlQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLEdBQUcsRUFBSTtBQUN2QixpQkFBRyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUN4QixxQkFBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDOUIseUJBQUssYUFBYSxDQUFDLFVBQVUsRUFBRTtBQUM3Qix5QkFBSyxFQUFMLEtBQUs7bUJBQ04sQ0FBQyxDQUFDO2lCQUNKLENBQUMsQ0FBQztlQUNKLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNaLHNCQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUN2Qix1QkFBSyxFQUFFLGFBQWE7QUFDcEIsd0JBQU0sRUFBRTtBQUNOLHdCQUFJLEVBQUUsTUFBTTtBQUNaLHNCQUFFLEVBQUUsY0FBTTtBQUNSLDZCQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNsQywyQkFBRyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDZiwyQkFBRyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFNO0FBQ3BCLGlDQUFPLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsS0FBSyxFQUFJO0FBQ3JDLG1DQUFLLGFBQWEsQ0FBQyxVQUFVLEVBQUU7QUFDN0IsbUNBQUssRUFBTCxLQUFLOzZCQUNOLENBQUMsQ0FBQztBQUNILG1DQUFPLElBQUksQ0FBQzsyQkFDYixDQUFDLENBQUM7eUJBQ0osQ0FBQyxDQUFDO3VCQUNKLENBQUMsQ0FBQztxQkFDSjtBQUNELHVCQUFHLEVBQUUsZUFBZTttQkFDckI7aUJBQ0YsQ0FBQyxDQUFDO2VBQ0osQ0FBQyxDQUFDO2FBRUosQ0FBQyxDQUFDO1dBQ0osQ0FBQyxDQUFDOzs7QUF6Q0wsOEJBQWlCLEtBQUssbUlBQUU7O1NBMEN2Qjs7Ozs7Ozs7Ozs7Ozs7O0tBQ0Y7OztzQ0FFaUI7OztBQUNoQixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLGtCQUFrQixDQUFDLENBQUM7Ozs7Ozs7O2NBRW5ELElBQUk7O0FBQ1gsY0FBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDdEMsY0FBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7O0FBRTFDLGNBQUksVUFBVSxFQUFFO0FBQ2Qsc0JBQVUsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBTTtBQUN6QyxrQkFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDO2FBQzdDLENBQUMsQ0FBQztXQUNKOztBQUVELGNBQUksWUFBWSxFQUFFO0FBQ2hCLHdCQUFZLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFlBQU07QUFDM0Msa0JBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQzthQUMvQyxDQUFDLENBQUM7V0FDSjs7QUFFRCxjQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUEsS0FBSyxFQUFJO0FBQ3RDLGlCQUFLLENBQUMsZUFBZSxFQUFFO0FBQUMsV0FDekIsQ0FBQyxDQUFDOztBQUVILGNBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDdkMsaUJBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFdkIsZ0JBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDOztBQUUzQixnQkFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQzVDLGdCQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7QUFDeEMsZ0JBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsS0FBSyxDQUFDO0FBQ3RELGdCQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUM7O0FBRTlDLGVBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsR0FBRyxFQUFJOztBQUV2QixrQkFBTSxhQUFhLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQzs7QUFFakMsaUJBQUcsQ0FBQyxNQUFNLEdBQUc7QUFDWCx1QkFBTyxFQUFQLE9BQU87QUFDUCxxQkFBSyxFQUFMLEtBQUs7QUFDTCx3QkFBUSxFQUFSLFFBQVE7ZUFDVCxDQUFDOztBQUVGLGtCQUFJLFVBQVUsS0FBSyxNQUFNLEVBQUU7QUFDekIsbUJBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztlQUN4QixNQUFNLElBQUksVUFBVSxLQUFLLFFBQVEsRUFBRTtBQUNsQyxtQkFBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO2VBQ3pCLE1BQU07QUFDTCxtQkFBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQztlQUN0Qzs7QUFFRCxpQkFBRyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFNO0FBQ3BCLHFCQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFBLEtBQUssRUFBSTtBQUM5Qix5QkFBSyxhQUFhLENBQUMsVUFBVSxFQUFFO0FBQzdCLHlCQUFLLEVBQUwsS0FBSzttQkFDTixDQUFDLENBQUM7aUJBQ0osQ0FBQyxDQUFDO2VBQ0osQ0FBQyxDQUFDO2FBQ0osQ0FBQyxDQUFDO1dBQ0osQ0FBQyxDQUFDOzs7QUF4REwsOEJBQWlCLEtBQUssbUlBQUU7O1NBeUR2Qjs7Ozs7Ozs7Ozs7Ozs7O0tBQ0Y7OztTQWhRRyxTQUFTO0dBQVMsSUFBSTs7QUFtUTVCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDOzs7QUNoUjNCLFlBQVksQ0FBQzs7Ozs7Ozs7Ozs7O0FBRWIsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUUvQixJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7QUFFekMsSUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsdUJBQXVCLENBQUMsQ0FBQzs7QUFFM0QsSUFBTSxvQkFBb0IsR0FBRyxPQUFPLENBQUMsbUJBQW1CLENBQUMsQ0FBQzs7QUFFMUQsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRXRDLFVBQVU7WUFBVixVQUFVOztBQUVkLFdBRkksVUFBVSxDQUVGLFNBQVMsRUFBRTswQkFGbkIsVUFBVTs7dUVBQVYsVUFBVSxhQUdOLFNBQVM7O0FBRWYsVUFBSyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQzs7QUFFMUMsVUFBSyxZQUFZLEdBQUcsSUFBSSxpQkFBaUIsRUFBRSxDQUFDOztHQUM3Qzs7ZUFSRyxVQUFVOzsyQkFVUCxXQUFXLEVBQUUsTUFBTSxFQUFFOzs7QUFDMUIsaUNBWEUsVUFBVSx3Q0FXQyxXQUFXLEVBQUUsTUFBTSxFQUFFOztBQUVsQyxVQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsRUFBRSxVQUFDLEtBQUssRUFBRSxJQUFJLEVBQUs7QUFDbkUsWUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFO0FBQ3ZDLGVBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxNQUFNLEVBQUk7QUFDN0IsbUJBQUssYUFBYSxDQUFDLFlBQVksRUFBRTtBQUMvQixvQkFBTSxFQUFOLE1BQU07YUFDUCxDQUFDLENBQUM7V0FDSixDQUFDLENBQUM7U0FDSjtPQUNGLENBQUMsQ0FBQyxDQUFDOztBQUVKLFVBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLFVBQUMsS0FBSyxFQUFFLElBQUksRUFBSztBQUN6RSxlQUFLLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7O0FBRXRELFlBQU0sTUFBTSxHQUFHLE9BQUssVUFBVSxDQUFDO0FBQy9CLGVBQUssYUFBYSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQztPQUMxQyxDQUFDLENBQUMsQ0FBQzs7QUFFSixVQUFJLENBQUMsb0JBQW9CLENBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxZQUFNO0FBQ3RELGVBQUssV0FBVyxFQUFFLENBQUM7T0FDcEIsQ0FBQyxDQUFDO0tBQ0o7OztrQ0FFYSxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQzFCLGNBQVEsSUFBSTtBQUNWLGFBQUssWUFBWTtBQUNmLGdCQUFNLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUN2RCxnQkFBTTtBQUFBLE9BQ1Q7O0FBRUQsVUFBTSxFQUFFLDhCQTFDTixVQUFVLCtDQTBDbUIsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUU3QyxjQUFRLElBQUk7QUFDVixhQUFLLFlBQVk7QUFDZixjQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsY0FBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3ZCLGNBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztBQUN2QixjQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3JCLGdCQUFNO0FBQUEsT0FDVDtLQUNGOzs7aUNBRVk7QUFDWCxpQ0F2REUsVUFBVSw0Q0F1RE87O0FBRW5CLFVBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQztBQUNuQixVQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDaEIsVUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3ZCLFVBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQztLQUN4Qjs7O2tDQUVhOzs7QUFDWixVQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3ZELFVBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDdkMsYUFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV2QixZQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztBQUNyQyxZQUFNLElBQUksR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDOztBQUU3QixZQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUM7O0FBRTFDLFlBQUksS0FBSyxDQUFDO0FBQ1IsZ0JBQU0sRUFBRTtBQUNOLGdCQUFJLEVBQUosSUFBSTtBQUNKLGtCQUFNLEVBQU4sTUFBTTtXQUNQO1NBQ0YsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxZQUFNO0FBQ25CLG1CQUFTLENBQUMsS0FBSyxHQUFHLEVBQUU7O0FBQUMsQUFFckIsbUJBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNqQixpQkFBSyxXQUFXLEVBQUUsQ0FBQztBQUNuQixlQUFLLENBQUMsT0FBTyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUEsTUFBTSxFQUFJO0FBQzdCLG1CQUFLLGFBQWEsQ0FBQyxZQUFZLEVBQUU7QUFDL0Isb0JBQU0sRUFBTixNQUFNO2FBQ1AsQ0FBQyxDQUFDO1dBQ0osQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDOztBQUVILFVBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7QUFFcEQsVUFBSSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxVQUFBLEtBQUssRUFBSTtBQUN0QyxhQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDeEIsZUFBSyxXQUFXLEVBQUUsQ0FBQztBQUNuQixjQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztPQUM5QixDQUFDLENBQUM7S0FDSjs7OytCQUVVOzs7QUFDVCxVQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLHNCQUFzQixDQUFDLENBQUM7Ozs7Ozs7Y0FDM0QsSUFBSTs7QUFDWCxjQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUEsS0FBSyxFQUFJO0FBQ3RDLGlCQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7QUFDdkIsaUJBQUssQ0FBQyxlQUFlLEVBQUU7O0FBQUMsQUFFeEIsZ0JBQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO0FBQzNCLGdCQUFNLElBQUksR0FBRyxPQUFLLEdBQUcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDLENBQUM7O0FBRTVELGdCQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDcEMscUJBQUssV0FBVyxFQUFFLENBQUM7O0FBRW5CLGtCQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUM7Ozs7O0FBQUMsYUFLNUIsTUFBTTtBQUNMLHVCQUFLLFdBQVcsRUFBRSxDQUFDO2VBQ3BCO1dBQ0YsQ0FBQyxDQUFDOzs7QUFuQkwsNkJBQWlCLFNBQVMsOEhBQUU7O1NBb0IzQjs7Ozs7Ozs7Ozs7Ozs7O0tBQ0Y7OztrQ0FFYTs7QUFFWixVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUM7Ozs7OztBQUMxRCw4QkFBaUIsS0FBSyxtSUFBRTtjQUFmLElBQUk7O0FBQ1gsY0FBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDL0I7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxVQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixDQUFDLENBQUM7Ozs7OztBQUMxRCw4QkFBaUIsS0FBSyxtSUFBRTtjQUFmLElBQUk7O0FBQ1gsY0FBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDL0I7Ozs7Ozs7Ozs7Ozs7OztLQUNGOzs7c0NBRWlCOzs7QUFDaEIsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOzs7Ozs7O2NBQ3JELElBQUk7O0FBQ1gsY0FBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFBLEtBQUssRUFBSTtBQUN2QyxpQkFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV2QixnQkFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7O0FBRTNCLGdCQUFNLElBQUksR0FBRyxPQUFLLEdBQUcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDNUQsZ0JBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVsQyxpQkFBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDM0IsbUJBQUssQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDMUIscUJBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxNQUFNLEVBQUk7QUFDN0IseUJBQUssYUFBYSxDQUFDLFlBQVksRUFBRTtBQUMvQiwwQkFBTSxFQUFOLE1BQU07bUJBQ1AsQ0FBQyxDQUFDO2lCQUNKLENBQUMsQ0FBQztlQUNKLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNaLHNCQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRTtBQUN2Qix1QkFBSyxFQUFFLGNBQWM7QUFDckIsd0JBQU0sRUFBRTtBQUNOLHdCQUFJLEVBQUUsTUFBTTtBQUNaLHNCQUFFLEVBQUUsY0FBTTtBQUNSLDZCQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNsQyw2QkFBSyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDakIsNkJBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTs7QUFFdEIsOEJBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQ2pDLG1DQUFPO0FBQ0wsa0NBQUksRUFBRSxJQUFJO0FBQ1YsaUNBQUcsRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNYLHVDQUFTLEVBQUUsR0FBRyxDQUFDLFVBQVU7QUFDekIsb0NBQU0sRUFBRSxHQUFHLENBQUMsTUFBTTs2QkFDbkIsQ0FBQTtBQUNELCtCQUFHLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztBQUNmLG1DQUFPLEdBQUcsQ0FBQzsyQkFDWixDQUFDLENBQUM7O0FBRUgsOEJBQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO0FBQ2pDLGlDQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDbEMsbUNBQU8sS0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sRUFBSTtBQUNwQyxxQ0FBSyxhQUFhLENBQUMsWUFBWSxFQUFFO0FBQy9CLHNDQUFNLEVBQU4sTUFBTTsrQkFDUCxDQUFDLENBQUM7QUFDSCxxQ0FBTyxJQUFJLENBQUM7NkJBQ2IsQ0FBQyxDQUFDOzJCQUNKLENBQUMsQ0FBQzt5QkFDSixDQUFDLENBQUM7dUJBQ0osQ0FBQyxDQUFDO3FCQUNKO0FBQ0QsdUJBQUcsRUFBRSxnQkFBZ0I7bUJBQ3RCO2lCQUNGLENBQUMsQ0FBQztlQUNKLENBQUMsQ0FBQzthQUNKLENBQUMsQ0FBQztXQUNKLENBQUMsQ0FBQzs7O0FBdERMLDhCQUFpQixLQUFLLG1JQUFFOztTQXVEdkI7Ozs7Ozs7Ozs7Ozs7OztLQUNGOzs7c0NBRWlCOzs7QUFDaEIsVUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOzs7Ozs7OztjQUVyRCxJQUFJOztBQUNYLGNBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDdEMsaUJBQUssQ0FBQyxlQUFlLEVBQUU7QUFBQyxXQUN6QixDQUFDLENBQUM7O0FBRUgsY0FBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFBLEtBQUssRUFBSTtBQUN2QyxpQkFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDOztBQUV2QixnQkFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7O0FBRTNCLGdCQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDdEMsZ0JBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQzs7QUFFMUMsaUJBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUEsS0FBSyxFQUFJOztBQUUzQixtQkFBSyxDQUFDLE1BQU0sR0FBRztBQUNiLG9CQUFJLEVBQUosSUFBSTtBQUNKLHNCQUFNLEVBQU4sTUFBTTtlQUNQLENBQUM7O0FBRUYsbUJBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUN0QixxQkFBSyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFBLE1BQU0sRUFBSTtBQUM3Qix5QkFBSyxhQUFhLENBQUMsWUFBWSxFQUFFO0FBQy9CLDBCQUFNLEVBQU4sTUFBTTttQkFDUCxDQUFDLENBQUM7aUJBQ0osQ0FBQyxDQUFDO2VBQ0osQ0FBQyxDQUFDO2FBQ0osQ0FBQyxDQUFDO1dBQ0osQ0FBQyxDQUFDOzs7QUE1QkwsOEJBQWlCLEtBQUssbUlBQUU7O1NBNkJ2Qjs7Ozs7Ozs7Ozs7Ozs7O0tBQ0Y7OztTQXZPRyxVQUFVO0dBQVMsSUFBSTs7QUEyTzdCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDOzs7QUN2UDVCLFlBQVksQ0FBQzs7Ozs7Ozs7QUFFYixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0lBRXpCLFFBQVE7WUFBUixRQUFROztXQUFSLFFBQVE7MEJBQVIsUUFBUTs7a0VBQVIsUUFBUTs7O1NBQVIsUUFBUTtHQUFTLElBQUk7O0FBSTNCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDOzs7QUNSMUIsWUFBWSxDQUFDOzs7Ozs7Ozs7Ozs7QUFFYixJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRS9CLElBQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUNyQyxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQzs7QUFFekMsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0FBRTVDLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDOztJQUVwQyxVQUFVO1lBQVYsVUFBVTs7V0FBVixVQUFVOzBCQUFWLFVBQVU7O2tFQUFWLFVBQVU7OztlQUFWLFVBQVU7O2lDQUVEO0FBQ1gsaUNBSEUsVUFBVSw0Q0FHTzs7QUFFbkIsVUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO0tBQ3ZCOzs7cUNBRWdCO0FBQ2YsVUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUM7O0FBRXBELFVBQUksSUFBSSxFQUFFO0FBQ1IsWUFBSSxDQUFDLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxVQUFBLEtBQUssRUFBSTtBQUN2QyxlQUFLLENBQUMsY0FBYyxFQUFFLENBQUM7O0FBRXZCLGVBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLENBQUMsVUFBQSxNQUFNLEVBQUk7QUFDckMsZ0JBQU0sYUFBYSxHQUFHLEVBQUUsQ0FBQzs7QUFFekIsa0JBQU0sQ0FBQyxPQUFPLENBQUMsVUFBQSxLQUFLLEVBQUk7QUFDdEIsMkJBQWEsQ0FBQyxJQUFJLENBQUMsVUFBQyxTQUFTLEVBQUs7QUFDaEMsdUJBQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUNsQix3QkFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNO0FBQ3BCLDJCQUFTLEVBQUUsS0FBSyxDQUFDLFVBQVU7aUJBQzVCLENBQUMsQ0FBQyxJQUFJLENBQUMsVUFBQSxRQUFRLEVBQUk7QUFDbEIsMkJBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDekIseUJBQU8sU0FBUyxDQUFDO2lCQUNsQixDQUFDLENBQUM7ZUFDSixDQUFDLENBQUM7YUFDSixDQUFDLENBQUM7O0FBRUgsZ0JBQUksaUJBQWlCLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1Qyx5QkFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFBLFlBQVksRUFBSTtBQUNwQywrQkFBaUIsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDMUQsQ0FBQyxDQUFDOztBQUVILG1CQUFPLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFBLFNBQVMsRUFBSTtBQUN6QyxrQkFBTSxXQUFXLEdBQUcsRUFBRSxDQUFDOztBQUV2QixvQkFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBRSxLQUFLLEVBQUs7QUFDL0IscUJBQUssQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQUEsR0FBRyxFQUFJO0FBQ3hCLHNCQUFNLFNBQVMsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQzdCLDJCQUFTLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDdEMsNkJBQVcsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNyQiwyQkFBTyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ2hCLDRCQUFNLEVBQUUsU0FBUztBQUNqQiwrQkFBUyxFQUFFLEdBQUcsQ0FBQyxVQUFVO3FCQUMxQixDQUFDLENBQUM7bUJBQ0osQ0FBQyxDQUFDO2lCQUNKLENBQUMsQ0FBQztlQUNKLENBQUMsQ0FBQzs7QUFFSCxrQkFBSSxlQUFlLEdBQUcsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ3hDLHlCQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsVUFBVSxFQUFJO0FBQ2hDLCtCQUFlLEdBQUcsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztlQUNwRCxDQUFDLENBQUM7O0FBRUgscUJBQU8sZUFBZSxDQUFDO2FBQ3hCLENBQUMsQ0FBQztXQUNKLENBQUMsQ0FDRCxJQUFJLENBQUMsWUFBTTtBQUNWLG1CQUFPLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztXQUNoQyxDQUFDLENBQ0QsSUFBSSxDQUFDLFlBQU07QUFDVixrQkFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUU7QUFDdkIsbUJBQUssRUFBRSxlQUFlO2FBQ3ZCLENBQUMsQ0FBQztBQUNILGtCQUFNLENBQUMsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3BCLG1CQUFPLElBQUksQ0FBQztXQUNiLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztPQUNKO0tBQ0Y7OztTQXZFRyxVQUFVO0dBQVMsSUFBSTs7QUEwRTdCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBVSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUNyRjVCLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFL0IsSUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDOztBQUVyQyxJQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQzs7QUFFdkQsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRXRDLFFBQVE7WUFBUixRQUFROztBQUNaLFdBREksUUFBUSxDQUNBLFNBQVMsRUFBRTswQkFEbkIsUUFBUTs7dUVBQVIsUUFBUSxhQUVKLFNBQVM7O0FBRWYsVUFBSyxZQUFZLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQzs7R0FDM0M7O2VBTEcsUUFBUTs7MkJBT0wsV0FBVyxFQUFFLE1BQU0sRUFBRTs7O0FBQzFCLFlBQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVuRCxpQ0FWRSxRQUFRLHdDQVVHLFdBQVcsRUFBRSxNQUFNLEVBQUU7O0FBRWxDLFVBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFVBQUMsS0FBSyxFQUFFLElBQUksRUFBSztBQUNuRSxZQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUU7QUFDdkMsYUFBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUksRUFBSTtBQUN6QixtQkFBSyxNQUFNLENBQUMsS0FBSyxFQUFFO0FBQ2pCLGtCQUFJLEVBQUosSUFBSTthQUNMLENBQUMsQ0FBQztXQUNKLENBQUMsQ0FBQztTQUNKO09BQ0YsQ0FBQyxDQUFDLENBQUM7O0FBRUosVUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsVUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFLO0FBQ3pFLGVBQUssWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFdEQsWUFBTSxNQUFNLEdBQUcsT0FBSyxVQUFVLENBQUM7QUFDL0IsZUFBSyxNQUFNLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO09BQzVCLENBQUMsQ0FBQyxDQUFDO0tBQ0w7OztTQTVCRyxRQUFRO0dBQVMsSUFBSTs7QUFnQzNCLE1BQU0sQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUN4QzFCLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFFbkMsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRXRDLFNBQVM7WUFBVCxTQUFTOztXQUFULFNBQVM7MEJBQVQsU0FBUzs7a0VBQVQsU0FBUzs7O2VBQVQsU0FBUzs7K0JBQ0YsRUFBRSxFQUFFO0FBQ2IsaUNBRkUsU0FBUyw0Q0FFUTs7QUFFbkIsVUFBSSxPQUFPLFlBQUEsQ0FBQztBQUNaLFVBQUksRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsb0JBQW9CLENBQUMsRUFBRTtBQUMvQyxlQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztPQUNoQixNQUFNO0FBQ0wsZUFBTyxHQUFHLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO09BQ3REOzs7Ozs7O0FBRUQsNkJBQW1CLE9BQU8sOEhBQUU7Y0FBbkIsTUFBTTs7QUFDYixjQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLENBQUM7O3FDQUVsQyxLQUFLO0FBQ1osZ0JBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMxQixnQkFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQSxHQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFbkQsZ0JBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDdEMsbUJBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7QUFFdkIsb0JBQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFO0FBQzdCLG9CQUFJLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJO0FBQzNCLHlCQUFTLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxTQUFTO2VBQ3RDLENBQUMsQ0FBQzs7QUFFSCxrQkFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakMsc0JBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQ25DLENBQUMsQ0FBQzs7O0FBZEwsZUFBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLEVBQUU7a0JBQTFDLEtBQUs7V0FlYjtTQUNGOzs7Ozs7Ozs7Ozs7Ozs7S0FDRjs7O1NBL0JHLFNBQVM7R0FBUyxNQUFNOztBQW1DOUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUM7OztBQ3ZDM0IsWUFBWSxDQUFDOzs7Ozs7OztBQUViLElBQU0sSUFBSSxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQzs7SUFFekIsV0FBVztZQUFYLFdBQVc7O1dBQVgsV0FBVzswQkFBWCxXQUFXOztrRUFBWCxXQUFXOzs7U0FBWCxXQUFXO0dBQVMsSUFBSTs7QUFJOUIsTUFBTSxDQUFDLE9BQU8sR0FBRyxXQUFXLENBQUM7OztBQ1I3QixZQUFZLENBQUM7Ozs7Ozs7O0FBRWIsSUFBTSxXQUFXLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDOztJQUV0QyxpQkFBaUI7WUFBakIsaUJBQWlCOztXQUFqQixpQkFBaUI7MEJBQWpCLGlCQUFpQjs7a0VBQWpCLGlCQUFpQjs7O1NBQWpCLGlCQUFpQjtHQUFTLFdBQVc7O0FBSTNDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsaUJBQWlCLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQ1JuQyxJQUFNLElBQUksR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRS9CLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOztJQUV0Qyx1QkFBdUI7WUFBdkIsdUJBQXVCOztBQUMzQixXQURJLHVCQUF1QixDQUNmLFNBQVMsRUFBRTswQkFEbkIsdUJBQXVCOzt1RUFBdkIsdUJBQXVCLGFBRW5CLFNBQVM7O0FBRWYsVUFBSyxNQUFNLEdBQUcsSUFBSSxDQUFDOztHQUNwQjs7ZUFMRyx1QkFBdUI7OzJCQU9wQixXQUFXLEVBQUUsTUFBTSxFQUFFOzs7QUFDMUIsaUNBUkUsdUJBQXVCLHdDQVFaLFdBQVcsRUFBRSxNQUFNLEVBQUU7O0FBRWxDLFVBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUSxFQUFFLFVBQUMsS0FBSyxFQUFFLElBQUksRUFBSztBQUNuRSxlQUFLLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO09BQzdCLENBQUMsQ0FBQyxDQUFDO0tBQ0w7OzsyQ0FPRTs7OzRCQUpELEtBQUs7VUFBTCxLQUFLLDhCQUFHLEtBQUs7MkJBQ2IsSUFBSTtVQUFKLElBQUksNkJBQUcsS0FBSzs2QkFDWixNQUFNO1VBQU4sTUFBTSwrQkFBRyxLQUFLOytCQUNkLFFBQVE7VUFBUixRQUFRLGlDQUFHLElBQUk7O0FBR2YsVUFBSSxFQUFFLEdBQUcsU0FBTCxFQUFFLEdBQVM7QUFDYixlQUFLLGFBQWEsQ0FBQyxjQUFjLEVBQUU7QUFDakMsZUFBSyxFQUFMLEtBQUs7QUFDTCxvQkFBVSxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsSUFBSSxHQUFHLEtBQUs7U0FDekMsQ0FBQyxDQUFDOztBQUVILFlBQUksTUFBTSxJQUFJLE1BQU0sQ0FBQyxFQUFFLEVBQUU7QUFDdkIsY0FBTSxhQUFhLEdBQUcsT0FBSyxHQUFHLENBQUMsYUFBYSxDQUFDLCtCQUErQixDQUFDLENBQUM7QUFDOUUsY0FBSSxhQUFhLEVBQUU7QUFDakIseUJBQWEsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBTTs7QUFFNUMsa0JBQUksT0FBSyxNQUFNLEVBQUU7QUFDZiw0QkFBWSxDQUFDLE9BQUssTUFBTSxDQUFDLENBQUM7ZUFDM0I7O0FBRUQsb0JBQU0sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUNyQixvQkFBSSxNQUFNLENBQUMsR0FBRyxFQUFFO0FBQ2QseUJBQUssZ0JBQWdCLENBQUM7QUFDcEIseUJBQUssRUFBRSxNQUFNLENBQUMsR0FBRzttQkFDbEIsQ0FBQyxDQUFDO2lCQUNKLE1BQU07QUFDTCx5QkFBSyxHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO2lCQUN2RjtlQUNGLENBQUMsQ0FBQzthQUNKLENBQUMsQ0FBQztXQUNKO1NBQ0Y7O0FBRUQsZUFBSyxHQUFHLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztBQUVuRixZQUFJLE9BQUssTUFBTSxFQUFFO0FBQ2Ysc0JBQVksQ0FBQyxPQUFLLE1BQU0sQ0FBQyxDQUFDO1NBQzNCOztBQUVELGVBQUssTUFBTSxHQUFHLFVBQVUsQ0FBQyxZQUFNO0FBQzdCLGlCQUFLLEdBQUcsQ0FBQyxhQUFhLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLGtCQUFrQixDQUFDLENBQUM7U0FDdkYsRUFBRSxRQUFRLENBQUMsQ0FBQztPQUNkLENBQUM7O0FBRUYsVUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsa0JBQWtCLENBQUMsRUFBRTtBQUMzRixZQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUN0RixrQkFBVSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztPQUNyQixNQUFNO0FBQ0wsVUFBRSxFQUFFLENBQUM7T0FDTjtLQUVGOzs7U0FwRUcsdUJBQXVCO0dBQVMsSUFBSTs7QUF3RTFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsdUJBQXVCLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQzVFekMsSUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUUvQixJQUFNLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDMUMsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0FBRTVDLElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOztJQUVwQyxZQUFZO1lBQVosWUFBWTs7QUFDaEIsV0FESSxZQUFZLENBQ0osU0FBUyxFQUFFOzBCQURuQixZQUFZOzt1RUFBWixZQUFZLGFBRVIsU0FBUzs7QUFFZixVQUFLLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFL0IsVUFBSyxhQUFhLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNqQyxVQUFLLGFBQWEsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEFBQUMsTUFBSyxTQUFTLENBQUUsSUFBSSxPQUFNLENBQUMsQ0FBQztBQUNqRSxVQUFLLGFBQWEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEFBQUMsTUFBSyxRQUFRLENBQUUsSUFBSSxPQUFNLENBQUMsQ0FBQzs7R0FDbEU7O2VBVEcsWUFBWTs7MkJBV1QsV0FBVyxFQUFFLE1BQU0sRUFBRTs7O0FBQzFCLGlDQVpFLFlBQVksd0NBWUQsV0FBVyxFQUFFLE1BQU0sRUFBRTs7QUFFbEMsVUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxjQUFjLEVBQUUsVUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFLO0FBQ3pFLGVBQUssYUFBYSxDQUFDLGdCQUFnQixFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzNDLGVBQUssYUFBYSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFMUMsZUFBSyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDMUIsQ0FBQyxDQUFDLENBQUM7O0FBRUosVUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3pDOzs7a0NBRWEsSUFBSSxFQUFFLE1BQU0sRUFBRTtBQUMxQixVQUFNLEVBQUUsOEJBekJOLFlBQVksK0NBeUJpQixJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRTdDLGNBQVEsSUFBSTtBQUNWLGFBQUssWUFBWTtBQUNmLGNBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDckIsZ0JBQU07QUFBQSxPQUNUO0tBQ0Y7OztpQ0FFWTs7O0FBQ1gsaUNBbkNFLFlBQVksNENBbUNLOztBQUVuQixVQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzFDLFVBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUM3RCxVQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQzNELFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUNsRSxVQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7QUFFMUQsVUFBSSxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsVUFBQSxLQUFLLEVBQUk7QUFDbkQsYUFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZCLGVBQUssUUFBUSxFQUFFLENBQUM7T0FDakIsQ0FBQyxDQUFDOztBQUVILFVBQUksQ0FBQyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxFQUFFLFVBQUEsS0FBSyxFQUFJO0FBQ3BELGFBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixlQUFLLFNBQVMsRUFBRSxDQUFDO09BQ2xCLENBQUMsQ0FBQzs7QUFFSCxXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDM0MsWUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUU7aUJBQU0sT0FBSyxTQUFTLEVBQUU7U0FBQSxDQUFDLENBQUM7T0FDbEU7S0FDRjs7OzhCQUVTO0FBQ1IsaUNBM0RFLFlBQVkseUNBMkRFOztBQUVoQixVQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzlCOzs7K0JBRVU7QUFDVCxVQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDaEMsVUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQ3hDOzs7Z0NBRVc7QUFDVixVQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbkMsVUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQzNDOzs7a0NBRWEsSUFBSSxFQUFFO0FBQ2xCLFVBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3hDOzs7U0E1RUcsWUFBWTtHQUFTLElBQUk7O0FBZ0YvQixNQUFNLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQzs7Ozs7Ozs7O0lDdkZ4QixhQUFhO0FBQ2pCLFdBREksYUFBYSxDQUNMLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFOzBCQURuQyxhQUFhOztBQUVmLFFBQUksQ0FBQyxHQUFHLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFekMsUUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7QUFDNUIsUUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7O0FBRTFCLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0dBQzFCOztlQVJHLGFBQWE7OzJCQVVWLElBQUksRUFBRSxJQUFJLEVBQUU7QUFDakIsVUFBSSxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ3JCLFlBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDN0I7O0FBRUQsVUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsVUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0tBQzNCOzs7U0FqQkcsYUFBYTs7O0FBb0JuQixNQUFNLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQzs7O0FDcEIvQixZQUFZLENBQUM7Ozs7OztBQUViLElBQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxvQ0FBb0MsQ0FBQyxDQUFDO0FBQ2pFLElBQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOztJQUV0QyxJQUFJO0FBQ1IsV0FESSxJQUFJLENBQ0ksU0FBUyxFQUFFOzBCQURuQixJQUFJOztBQUVOLFFBQUksQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDOztBQUU1QixRQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztBQUN6QixRQUFJLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDO0FBQzdCLFFBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDOztBQUVuQixRQUFJLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQztHQUN6Qjs7O0FBQUE7ZUFURyxJQUFJOzsyQkFvQkQsV0FBVyxFQUFFLE1BQU0sRUFBRTtBQUMxQixVQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7O0FBRWYsVUFBSSxDQUFDLFdBQVcsRUFBRTtBQUNoQixZQUFJLFFBQVEsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEYsWUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO09BQ2hEOztBQUVELFVBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQzs7QUFFbEIsVUFBSSxDQUFDLFdBQVcsR0FBRyxNQUFNLENBQUM7S0FDM0I7OztrQ0FFYSxJQUFJLEVBQUUsTUFBTSxFQUFFO0FBQzFCLGFBQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRXBDLFVBQUksUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUNwRSxVQUFNLElBQUksR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDeEQsVUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRWxDLFVBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDOztBQUUxQixhQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQztLQUNuRDs7O21DQUVjO0FBQ2IsYUFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDekQ7Ozt5Q0FFb0IsSUFBSSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUU7QUFDbkMsVUFBSSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNsQyxZQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLEdBQUc7QUFDOUIsY0FBSSxFQUFKLElBQUk7QUFDSixZQUFFLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7U0FDbEIsQ0FBQztPQUNIOztBQUVELGNBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0tBQ25FOzs7OEJBRVM7Ozs7Ozs7O0FBR1IsNkJBQWdCLElBQUksQ0FBQyxjQUFjLDhIQUFFO2NBQTVCLEdBQUc7O0FBQ1YsZ0JBQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDekI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFRCxXQUFLLElBQUksS0FBSyxJQUFJLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtBQUN6QyxZQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDaEQsZ0JBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztPQUMxRDs7QUFFRCxVQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7S0FDdkI7OztpQ0FFWTtBQUNYLFVBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzVCOzs7bUNBRWMsTUFBTSxFQUFFO0FBQ3JCLFVBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxFQUFFLENBQUMsQ0FBQztLQUNsQzs7O2dDQUVXLEVBQUUsRUFBRTtBQUNkLFVBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFVBQUEsTUFBTSxFQUFJO0FBQzlCLGNBQU0sQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUM7T0FDdkIsQ0FBQyxDQUFDO0tBQ0o7OztxQ0FFZ0I7QUFDZixVQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxVQUFBLE1BQU0sRUFBSTtBQUM5QixjQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7T0FDbEIsQ0FBQyxDQUFDO0tBQ0o7Ozt3QkFqRlM7QUFDUixhQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO0tBQzVCOzs7d0JBRWdCO0FBQ2YsYUFBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0tBQ3pCOzs7U0FsQkcsSUFBSTs7O0FBaUdWLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDOzs7Ozs7Ozs7SUN0R2hCLE1BQU07QUFFVixXQUZJLE1BQU0sR0FFSTswQkFGVixNQUFNO0dBR1Q7O2VBSEcsTUFBTTs7aUNBS0csRUFFWjs7OzhCQUVTLEVBQ1Q7OztTQVZHLE1BQU07OztBQWFaLE1BQU0sQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDOzs7QUNieEI7O0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIERCIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fcmVtb3RlQ291Y2ggPSBudWxsO1xuICAgIHRoaXMuX2RiID0gbnVsbDtcbiAgfVxuXG4gIGdldCBkYigpIHtcbiAgICByZXR1cm4gdGhpcy5fZGI7XG4gIH1cblxuICBpbml0KG9wdGlvbnMpIHtcblxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHtcbiAgICAgIHByb3RvY29sOiBudWxsLFxuICAgICAgZG9tYWluOiBudWxsLFxuICAgICAgcG9ydDogbnVsbCxcbiAgICAgIHVzZXJuYW1lOiBudWxsLFxuICAgICAgcGFzc3dvcmQ6IG51bGwsXG4gICAgICBkYk5hbWU6IG51bGxcbiAgICB9O1xuXG4gICAgaWYgKG9wdGlvbnMuZG9tYWluKSB7XG4gICAgICB0aGlzLl9yZW1vdGVDb3VjaCA9IG9wdGlvbnMucHJvdG9jb2wgKyAnOi8vJztcblxuICAgICAgaWYgKG9wdGlvbnMudXNlcm5hbWUpIHtcbiAgICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gb3B0aW9ucy51c2VybmFtZTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gJzonICsgb3B0aW9ucy5wYXNzd29yZDtcbiAgICAgIH1cblxuICAgICAgaWYgKG9wdGlvbnMudXNlcm5hbWUgfHwgb3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSAnQCc7XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX3JlbW90ZUNvdWNoICs9IG9wdGlvbnMuZG9tYWluO1xuXG4gICAgICBpZiAob3B0aW9ucy5wb3J0KSB7XG4gICAgICAgIHRoaXMuX3JlbW90ZUNvdWNoICs9ICc6JyArIG9wdGlvbnMucG9ydDtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gJy8nICsgb3B0aW9ucy5kYk5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3JlbW90ZUNvdWNoID0gbnVsbDtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIFBvdWNoREIgIT09ICd1bmRlZmluZWQnKSB7IC8vYnJvd3NlclxuICAgICAgUG91Y2hEQi5kZWJ1Zy5kaXNhYmxlKCk7XG4gICAgICB0aGlzLl9kYiA9IG5ldyBQb3VjaERCKG9wdGlvbnMuZGJOYW1lLCB7XG4gICAgICAgIGF1dG9fY29tcGFjdGlvbjogdHJ1ZVxuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLl9yZW1vdGVDb3VjaCkge1xuXG4gICAgICAgIGNvbnN0IG9wdHMgPSB7bGl2ZTogdHJ1ZSwgcmV0cnk6IHRydWV9O1xuXG4gICAgICAgIHRoaXMuX2RiLnJlcGxpY2F0ZS50byh0aGlzLl9yZW1vdGVDb3VjaCwgb3B0cykub24oJ2NoYW5nZScsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBjaGFuZ2UnKTtcbiAgICAgICAgfSkub24oJ3BhdXNlZCcsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gcGF1c2VkJyk7XG4gICAgICAgIH0pLm9uKCdhY3RpdmUnLCAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIHRvIGFjdGl2ZScpO1xuICAgICAgICB9KS5vbignZGVuaWVkJywgaW5mbyA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIHRvIGRlbmllZCcsIGluZm8pO1xuICAgICAgICB9KS5vbignY29tcGxldGUnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gY29tcGxldGUnKTtcbiAgICAgICAgfSkub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gZXJyb3InLCBlcnIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsZXQgY2hhbmdlcyA9IFtdO1xuXG4gICAgICAgIHRoaXMuX2RiLnJlcGxpY2F0ZS5mcm9tKHRoaXMuX3JlbW90ZUNvdWNoLCBvcHRzKS5vbignY2hhbmdlJywgaW5mbyA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIGZyb20gY2hhbmdlJywgaW5mbyk7XG4gICAgICAgICAgY2hhbmdlcyA9IGNoYW5nZXMuY29uY2F0KGluZm8uZG9jcyk7XG4gICAgICAgIH0pLm9uKCdwYXVzZWQnLCAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIGZyb20gcGF1c2VkJyk7XG5cbiAgICAgICAgICBQdWJTdWIucHVibGlzaCgndXBkYXRlJywge1xuICAgICAgICAgICAgY2hhbmdlc1xuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgY2hhbmdlcyA9IFtdO1xuXG4gICAgICAgIH0pLm9uKCdhY3RpdmUnLCAoKSA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIGZyb20gYWN0aXZlJyk7XG4gICAgICAgIH0pLm9uKCdkZW5pZWQnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBkZW5pZWQnLCBpbmZvKTtcbiAgICAgICAgfSkub24oJ2NvbXBsZXRlJywgaW5mbyA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIGZyb20gY29tcGxldGUnLCBpbmZvKTtcbiAgICAgICAgfSkub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBlcnJvcicsIGVycik7XG4gICAgICAgIH0pO1xuXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBkZG9jID0ge1xuICAgICAgICAgIF9pZDogJ19kZXNpZ24vaW5kZXgnLFxuICAgICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICBncm91cDoge1xuICAgICAgICAgICAgICBtYXA6IChkb2MgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChkb2MuZmllbGRzLmdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICBlbWl0KGRvYy5maWVsZHMuZ3JvdXApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSkudG9TdHJpbmcoKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLl9kYi5wdXQoZGRvYykudGhlbigoKSA9PiB7XG4gICAgICAgICAgLy8ga2ljayBvZmYgYW4gaW5pdGlhbCBidWlsZCwgcmV0dXJuIGltbWVkaWF0ZWx5XG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2RiLnF1ZXJ5KCdpbmRleC9ncm91cCcsIHtzdGFsZTogJ3VwZGF0ZV9hZnRlcid9KTtcbiAgICAgICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgIC8vY29uZmxpY3Qgb2NjdXJlZCwgaS5lLiBkZG9jIGFscmVhZHkgZXhpc3RlZFxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBQb3VjaERCID0gcmVxdWlyZSgncG91Y2hkYicpO1xuICAgICAgUG91Y2hEQi5kZWJ1Zy5kaXNhYmxlKCk7XG5cbiAgICAgIHRoaXMuX2RiID0gbmV3IFBvdWNoREIodGhpcy5fcmVtb3RlQ291Y2gpO1xuICAgIH1cbiAgfVxufVxuXG5jb25zdCBkYnMgPSB7XG4gICdtYWluJzogbmV3IERCKClcbn07XG5sZXQgY3VycmVudERCID0gJ21haW4nO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChvcHRpb25zLCBpZD1mYWxzZSkgPT4ge1xuICBpZiAoaWQgIT09IGZhbHNlKSB7XG4gICAgY3VycmVudERCID0gaWQ7XG4gIH1cblxuICBpZiAob3B0aW9ucykge1xuICAgIGlmICghZGJzW2N1cnJlbnREQl0pIHtcbiAgICAgIGRic1tjdXJyZW50REJdID0gbmV3IERCKCk7XG4gICAgfVxuXG4gICAgZGJzW2N1cnJlbnREQl0uaW5pdChvcHRpb25zKTtcbiAgfVxuXG4gIHJldHVybiBkYnNbY3VycmVudERCXS5kYjtcbn07XG4iLCJjb25zdCBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwnKTtcblxuY2xhc3MgSm90IGV4dGVuZHMgTW9kZWwge1xuXG4gIGNvbnN0cnVjdG9yKG1lbWJlcnMpIHtcbiAgICBzdXBlcihtZW1iZXJzLCBbXG4gICAgICAnY29udGVudCcsXG4gICAgICAnZ3JvdXAnLFxuICAgICAgJ2RvbmUnLFxuICAgICAgJ3ByaW9yaXR5J1xuICAgIF0pO1xuXG4gICAgdGhpcy5fZ3JvdXAgPSBudWxsO1xuICB9XG5cbiAgc3RhdGljIGdldFByaW9yaXRpZXMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICcyJyxcbiAgICAgICcxJyxcbiAgICAgICcwJ1xuICAgIF07XG4gIH1cblxuICBnZXQgcHJpb3JpdGllcygpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRQcmlvcml0aWVzKCk7XG4gIH1cblxuICBnZXQgZ3JvdXAoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2dyb3VwO1xuICB9XG5cbiAgZ2V0IGdyb3VwTmFtZSgpIHtcbiAgICBpZiAodGhpcy5fZ3JvdXApIHtcbiAgICAgIHJldHVybiB0aGlzLl9ncm91cC5maWVsZHMubmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICctJztcbiAgICB9XG4gIH1cblxuICBpc0RvbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZmllbGRzLmRvbmU7XG4gIH1cblxuICBsb2FkR3JvdXAoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5cbiAgICAgIHJldHVybiBHcm91cC5sb2FkKHRoaXMuZmllbGRzLmdyb3VwLCBmYWxzZSkudGhlbihncm91cCA9PiB7XG4gICAgICAgIHRoaXMuX2dyb3VwID0gZ3JvdXA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgZ2V0UGVyY2VudGFnZURvbmUoKSB7XG4gICAgcmV0dXJuIHRoaXMubG9hZEFsbChmYWxzZSkudGhlbihqb3RzID0+IHtcbiAgICAgIGxldCBudW1Eb25lID0gam90cy5yZWR1Y2UoKHByZXZWYWwsIGpvdCkgPT4ge1xuICAgICAgICBpZiAoam90LmlzRG9uZSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHByZXZWYWwgKyAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBwcmV2VmFsO1xuICAgICAgICB9XG4gICAgICB9LCAwKTtcblxuICAgICAgcmV0dXJuIHtcbiAgICAgICAgcGVyY2VudDogcGFyc2VJbnQoKG51bURvbmUgLyBqb3RzLmxlbmd0aCkgKiAxMDAsIDEwKVxuICAgICAgfTtcbiAgICB9KVxuXG4gICAgLnRoZW4oc3RhdHMgPT4ge1xuICAgICAgY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5cbiAgICAgIHJldHVybiBHcm91cC5sb2FkQWxsKGZhbHNlKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgIHN0YXRzLm51bUdyb3VwcyA9IGdyb3Vwcy5sZW5ndGg7XG5cbiAgICAgICAgcmV0dXJuIHN0YXRzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZChpZCwgbG9hZEdyb3VwID0gdHJ1ZSkge1xuICAgIHJldHVybiBzdXBlci5sb2FkKGlkKS50aGVuKGpvdCA9PiB7XG4gICAgICBpZiAobG9hZEdyb3VwKSB7XG4gICAgICAgIHJldHVybiBqb3QubG9hZEdyb3VwKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGpvdDtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gam90O1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRBbGwobG9hZEdyb3VwcyA9IHRydWUsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gc3VwZXIubG9hZEFsbCgpLnRoZW4oam90cyA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcblxuICAgICAgaWYgKGxvYWRHcm91cHMpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChHcm91cC5sb2FkRm9ySm90cyhqb3RzKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yZGVyKGpvdHMsIG9yZGVyLCBkaXJlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgb3JkZXIoam90cywgc29ydE9yZGVyID0gJ2FscGhhJywgc29ydERpcmVjdGlvbiA9ICdhc2MnKSB7XG5cbiAgICBzd2l0Y2ggKHNvcnRPcmRlcikge1xuICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgIGpvdHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLl9kYXRlQWRkZWQgPiBiLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLl9kYXRlQWRkZWQgPCBiLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhbHBoYSc6XG4gICAgICAgIGpvdHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkgPiBiLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkgPCBiLmZpZWxkcy5jb250ZW50LnRvTG93ZXJDYXNlKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdwcmlvcml0eSc6XG4gICAgICAgIGpvdHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLmZpZWxkcy5wcmlvcml0eSA+IGIuZmllbGRzLnByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5maWVsZHMucHJpb3JpdHkgPCBiLmZpZWxkcy5wcmlvcml0eSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoc29ydERpcmVjdGlvbiA9PT0gJ2Rlc2MnKSB7XG4gICAgICBqb3RzLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICBjb25zdCB1bmRvbmVKb3RzID0gW107XG4gICAgY29uc3QgZG9uZUpvdHMgPSBbXTtcblxuICAgIGpvdHMuZm9yRWFjaChqb3QgPT4ge1xuICAgICAgaWYgKGpvdC5pc0RvbmUoKSkge1xuICAgICAgICBkb25lSm90cy5wdXNoKGpvdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB1bmRvbmVKb3RzLnB1c2goam90KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiB1bmRvbmVKb3RzLmNvbmNhdChkb25lSm90cyk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEZvckdyb3VwKGdyb3VwSWQsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLnF1ZXJ5KCdpbmRleC9ncm91cCcsIHtcbiAgICAgICAgZGVzY2VuZGluZzogdHJ1ZSxcbiAgICAgICAga2V5OiBncm91cElkLFxuICAgICAgICBpbmNsdWRlX2RvY3M6IHRydWVcbiAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3Qgam90cyA9IFtdO1xuXG4gICAgICAgIHJlc3VsdC5yb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICBqb3RzLnB1c2gobmV3IHRoaXMocm93LmRvYykpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5vcmRlcihqb3RzLCBvcmRlciwgZGlyZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRGb3JHcm91cHMoZ3JvdXBzLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICBjb25zdCBncm91cElkcyA9IGdyb3Vwcy5tYXAoZ3JvdXAgPT4gZ3JvdXAuaWQpO1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5xdWVyeSgnaW5kZXgvZ3JvdXAnLCB7XG4gICAgICAgIGtleXM6IGdyb3VwSWRzLFxuICAgICAgICBpbmNsdWRlX2RvY3M6IHRydWVcbiAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3QgZ3JvdXBKb3RzID0ge307XG5cbiAgICAgICAgZ3JvdXBJZHMuZm9yRWFjaChncm91cElkID0+IHtcbiAgICAgICAgICBncm91cEpvdHNbZ3JvdXBJZF0gPSBbXTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmVzdWx0LnJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgIGdyb3VwSm90c1tyb3cuZG9jLmZpZWxkcy5ncm91cF0ucHVzaChuZXcgdGhpcyhyb3cuZG9jKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICAgICAgICBncm91cC5fam90cyA9IGdyb3VwSm90c1tncm91cC5pZF07XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3Q7XG4iLCJjb25zdCBNb2RlbCA9IHJlcXVpcmUoJy4vbW9kZWwnKTtcbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4vam90Jyk7XG5cbmNsYXNzIEdyb3VwIGV4dGVuZHMgTW9kZWwge1xuXG4gIGNvbnN0cnVjdG9yKG1lbWJlcnMpIHtcbiAgICBzdXBlcihtZW1iZXJzLCBbXG4gICAgICAnbmFtZScsXG4gICAgICAnY29sb3VyJ1xuICAgIF0pO1xuXG4gICAgdGhpcy5fam90cyA9IFtdO1xuICB9XG5cbiAgc3RhdGljIGdldENvbG91cnMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICdibHVlJyxcbiAgICAgICdyZWQnLFxuICAgICAgJ3RlYWwnLFxuICAgICAgJ3llbGxvdycsXG4gICAgICAnb3JhbmdlJyxcbiAgICAgICdicm93bidcbiAgICBdO1xuICB9XG5cbiAgZ2V0IGNvbG91cnMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0Q29sb3VycygpO1xuICB9XG5cbiAgZ2V0IGpvdHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvdHM7XG4gIH1cblxuICBzZXQgam90cyhqb3RzKSB7XG4gICAgdGhpcy5fam90cyA9IGpvdHM7XG4gIH1cblxuICBnZXRKb3RzKGRvbmUgPSBudWxsKSB7XG4gICAgaWYgKGRvbmUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLmpvdHM7XG4gICAgfSBlbHNlIGlmIChkb25lKSB7XG4gICAgICByZXR1cm4gdGhpcy5qb3RzLmZpbHRlcihqb3QgPT4gISFqb3QuZmllbGRzLmRvbmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5qb3RzLmZpbHRlcihqb3QgPT4gIWpvdC5maWVsZHMuZG9uZSk7XG4gICAgfVxuICB9XG5cbiAgZ2V0IGpvdENvdW50KCkge1xuICAgIHJldHVybiB0aGlzLl9qb3RzLmxlbmd0aDtcbiAgfVxuXG4gIGdldCBqb3REb25lQ291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvdHMuZmlsdGVyKGpvdCA9PiAhIWpvdC5maWVsZHMuZG9uZSkubGVuZ3RoO1xuICB9XG5cbiAgbG9hZEpvdHMob3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBKb3QubG9hZEZvckdyb3VwKHRoaXMuaWQsIG9yZGVyLCBkaXJlY3Rpb24pLnRoZW4oam90cyA9PiB7XG4gICAgICB0aGlzLl9qb3RzID0gam90cztcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWQoaWQsIGxvYWRKb3RzID0gdHJ1ZSwgam90T3JkZXIgPSAnYWxwaGEnLCBqb3REaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBzdXBlci5sb2FkKGlkKS50aGVuKGdyb3VwID0+IHtcbiAgICAgIGlmIChsb2FkSm90cykge1xuICAgICAgICByZXR1cm4gZ3JvdXAubG9hZEpvdHMoam90T3JkZXIsIGpvdERpcmVjdGlvbikudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBncm91cDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkQWxsKGxvYWRKb3RzID0gdHJ1ZSwgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBzdXBlci5sb2FkQWxsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcblxuICAgICAgaWYgKGxvYWRKb3RzKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2goSm90LmxvYWRGb3JHcm91cHMoZ3JvdXBzKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcykudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yZGVyKGdyb3Vwcywgb3JkZXIsIGRpcmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkRm9ySm90cyhqb3RzKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICBjb25zdCBncm91cElkcyA9IGpvdHMubWFwKGpvdCA9PiBqb3QuZmllbGRzLmdyb3VwKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIuYWxsRG9jcyh7XG4gICAgICAgIGRlc2NlbmRpbmc6IHRydWUsXG4gICAgICAgIGtleXM6IGdyb3VwSWRzLFxuICAgICAgICBpbmNsdWRlX2RvY3M6IHRydWVcbiAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3Qgam90R3JvdXBzID0ge307XG5cbiAgICAgICAgcmVzdWx0LnJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgIGpvdEdyb3Vwc1tyb3cuZG9jLl9pZF0gPSBuZXcgdGhpcyhyb3cuZG9jKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgam90cy5mb3JFYWNoKGpvdCA9PiB7XG4gICAgICAgICAgam90Ll9ncm91cCA9IGpvdEdyb3Vwc1tqb3QuZmllbGRzLmdyb3VwXTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBvcmRlcihncm91cHMsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcblxuICAgIHN3aXRjaCAob3JkZXIpIHtcbiAgICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgICBncm91cHMuc29ydCgoYSwgYikgPT4ge1xuICAgICAgICAgIGlmIChhLl9kYXRlQWRkZWQgPiBiLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLl9kYXRlQWRkZWQgPCBiLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdhbHBoYSc6XG4gICAgICAgIGdyb3Vwcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuZmllbGRzLm5hbWUudG9Mb3dlckNhc2UoKSA+IGIuZmllbGRzLm5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuZmllbGRzLm5hbWUudG9Mb3dlckNhc2UoKSA8IGIuZmllbGRzLm5hbWUudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBpZiAoZGlyZWN0aW9uID09PSAnZGVzYycpIHtcbiAgICAgIGdyb3Vwcy5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyb3VwcztcbiAgfVxuXG4gIHN0YXRpYyByZW1vdmUoaWQpIHtcbiAgICByZXR1cm4gc3VwZXIucmVtb3ZlKGlkKS50aGVuKCgpID0+IHtcblxuICAgICAgcmV0dXJuIEpvdC5sb2FkRm9yR3JvdXAoaWQpLnRoZW4oam90cyA9PiB7XG4gICAgICAgIGNvbnN0IGRvY3MgPSBqb3RzLm1hcChqb3QgPT4ge1xuICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBfaWQ6IGpvdC5pZCxcbiAgICAgICAgICAgIF9yZXY6IGpvdC5yZXYsXG4gICAgICAgICAgICBfZGVsZXRlZDogdHJ1ZVxuICAgICAgICAgIH07XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRiLmJ1bGtEb2NzKGRvY3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGltcG9ydEZyb21Mb2NhbCgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIFBvdWNoREIgPT09ICd1bmRlZmluZWQnKSB7IC8vc2VydmVyXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy9sb2FkIGxvY2FsIGRiXG4gICAgICByZXF1aXJlKCcuLi9kYi9kYicpKHtcbiAgICAgICAgZGJOYW1lOiAnam90LWxvY2FsJ1xuICAgICAgfSwgJ2xvY2FsJyk7XG5cbiAgICAgIHJldHVybiB0aGlzLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgIC8vcmVzdG9yZSBtYWluIGRiXG4gICAgICAgIHJlcXVpcmUoJy4uL2RiL2RiJykobnVsbCwgJ21haW4nKTtcblxuICAgICAgICByZXR1cm4gZ3JvdXBzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgcmVtb3ZlRnJvbUxvY2FsKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgUG91Y2hEQiA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zZXJ2ZXJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvL2xvYWQgbG9jYWwgZGJcbiAgICAgIHJlcXVpcmUoJy4uL2RiL2RiJykoe1xuICAgICAgICBkYk5hbWU6ICdqb3QtbG9jYWwnXG4gICAgICB9LCAnbG9jYWwnKTtcblxuICAgICAgcmV0dXJuIHRoaXMubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcbiAgICAgICAgZ3JvdXBzLmZvckVhY2goZ3JvdXAgPT4ge1xuICAgICAgICAgIHByb21pc2VzLnB1c2goR3JvdXAucmVtb3ZlKGdyb3VwLmlkKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgLy9yZXN0b3JlIG1haW4gZGJcbiAgICAgICAgcmVxdWlyZSgnLi4vZGIvZGInKShudWxsLCAnbWFpbicpO1xuXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cDtcbiIsImNvbnN0IE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xuXG5jbGFzcyBKb3QgZXh0ZW5kcyBNb2RlbCB7XG5cbiAgY29uc3RydWN0b3IobWVtYmVycykge1xuICAgIHN1cGVyKG1lbWJlcnMsIFtcbiAgICAgICdjb250ZW50JyxcbiAgICAgICdncm91cCcsXG4gICAgICAnZG9uZScsXG4gICAgICAncHJpb3JpdHknXG4gICAgXSk7XG5cbiAgICB0aGlzLl9ncm91cCA9IG51bGw7XG4gIH1cblxuICBzdGF0aWMgZ2V0UHJpb3JpdGllcygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJzInLFxuICAgICAgJzEnLFxuICAgICAgJzAnXG4gICAgXTtcbiAgfVxuXG4gIGdldCBwcmlvcml0aWVzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldFByaW9yaXRpZXMoKTtcbiAgfVxuXG4gIGdldCBncm91cCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ3JvdXA7XG4gIH1cblxuICBnZXQgZ3JvdXBOYW1lKCkge1xuICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwLmZpZWxkcy5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJy0nO1xuICAgIH1cbiAgfVxuXG4gIGlzRG9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5maWVsZHMuZG9uZTtcbiAgfVxuXG4gIGxvYWRHcm91cCgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgcmV0dXJuIEdyb3VwLmxvYWQodGhpcy5maWVsZHMuZ3JvdXAsIGZhbHNlKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgdGhpcy5fZ3JvdXAgPSBncm91cDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRQZXJjZW50YWdlRG9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5sb2FkQWxsKGZhbHNlKS50aGVuKGpvdHMgPT4ge1xuICAgICAgbGV0IG51bURvbmUgPSBqb3RzLnJlZHVjZSgocHJldlZhbCwgam90KSA9PiB7XG4gICAgICAgIGlmIChqb3QuaXNEb25lKCkpIHtcbiAgICAgICAgICByZXR1cm4gcHJldlZhbCArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHByZXZWYWw7XG4gICAgICAgIH1cbiAgICAgIH0sIDApO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwZXJjZW50OiBwYXJzZUludCgobnVtRG9uZSAvIGpvdHMubGVuZ3RoKSAqIDEwMCwgMTApXG4gICAgICB9O1xuICAgIH0pXG5cbiAgICAudGhlbihzdGF0cyA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgcmV0dXJuIEdyb3VwLmxvYWRBbGwoZmFsc2UpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgc3RhdHMubnVtR3JvdXBzID0gZ3JvdXBzLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gc3RhdHM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkKGlkLCBsb2FkR3JvdXAgPSB0cnVlKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWQoaWQpLnRoZW4oam90ID0+IHtcbiAgICAgIGlmIChsb2FkR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIGpvdC5sb2FkR3JvdXAoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gam90O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBqb3Q7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEFsbChsb2FkR3JvdXBzID0gdHJ1ZSwgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBzdXBlci5sb2FkQWxsKCkudGhlbihqb3RzID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICBpZiAobG9hZEdyb3Vwcykge1xuICAgICAgICBwcm9taXNlcy5wdXNoKEdyb3VwLmxvYWRGb3JKb3RzKGpvdHMpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoam90cywgb3JkZXIsIGRpcmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBvcmRlcihqb3RzLCBzb3J0T3JkZXIgPSAnYWxwaGEnLCBzb3J0RGlyZWN0aW9uID0gJ2FzYycpIHtcblxuICAgIHN3aXRjaCAoc29ydE9yZGVyKSB7XG4gICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA+IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA8IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2FscGhhJzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSA+IGIuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSA8IGIuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3ByaW9yaXR5JzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuZmllbGRzLnByaW9yaXR5ID4gYi5maWVsZHMucHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLmZpZWxkcy5wcmlvcml0eSA8IGIuZmllbGRzLnByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzb3J0RGlyZWN0aW9uID09PSAnZGVzYycpIHtcbiAgICAgIGpvdHMucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVuZG9uZUpvdHMgPSBbXTtcbiAgICBjb25zdCBkb25lSm90cyA9IFtdO1xuXG4gICAgam90cy5mb3JFYWNoKGpvdCA9PiB7XG4gICAgICBpZiAoam90LmlzRG9uZSgpKSB7XG4gICAgICAgIGRvbmVKb3RzLnB1c2goam90KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZG9uZUpvdHMucHVzaChqb3QpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVuZG9uZUpvdHMuY29uY2F0KGRvbmVKb3RzKTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkRm9yR3JvdXAoZ3JvdXBJZCwgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge1xuICAgICAgICBkZXNjZW5kaW5nOiB0cnVlLFxuICAgICAgICBrZXk6IGdyb3VwSWQsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBqb3RzID0gW107XG5cbiAgICAgICAgcmVzdWx0LnJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgIGpvdHMucHVzaChuZXcgdGhpcyhyb3cuZG9jKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm9yZGVyKGpvdHMsIG9yZGVyLCBkaXJlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEZvckdyb3Vwcyhncm91cHMsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGdyb3VwSWRzID0gZ3JvdXBzLm1hcChncm91cCA9PiBncm91cC5pZCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLnF1ZXJ5KCdpbmRleC9ncm91cCcsIHtcbiAgICAgICAga2V5czogZ3JvdXBJZHMsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBncm91cEpvdHMgPSB7fTtcblxuICAgICAgICBncm91cElkcy5mb3JFYWNoKGdyb3VwSWQgPT4ge1xuICAgICAgICAgIGdyb3VwSm90c1tncm91cElkXSA9IFtdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgZ3JvdXBKb3RzW3Jvdy5kb2MuZmllbGRzLmdyb3VwXS5wdXNoKG5ldyB0aGlzKHJvdy5kb2MpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ3JvdXBzLmZvckVhY2goZ3JvdXAgPT4ge1xuICAgICAgICAgIGdyb3VwLl9qb3RzID0gZ3JvdXBKb3RzW2dyb3VwLmlkXTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvdDtcbiIsImNvbnN0IERhdGVVdGlscyA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvZGF0ZScpO1xuXG5jbGFzcyBNb2RlbCB7XG5cbiAgY29uc3RydWN0b3IobWVtYmVycywgYWxsb3dlZEZpZWxkcykge1xuICAgIHRoaXMuX2lkID0gbWVtYmVycy5faWQgfHwgbnVsbDtcbiAgICB0aGlzLl9yZXYgPSBtZW1iZXJzLl9yZXYgfHwgbnVsbDtcblxuICAgIHRoaXMuX2RhdGVBZGRlZCA9IG1lbWJlcnMuZGF0ZUFkZGVkIHx8IG51bGw7XG5cbiAgICB0aGlzLl9maWVsZHMgPSBtZW1iZXJzLmZpZWxkcyB8fCB7fTtcblxuICAgIHRoaXMuX2FsbG93ZWRGaWVsZHMgPSBhbGxvd2VkRmllbGRzO1xuICB9XG5cbiAgc3RhdGljIGdldCBkYigpIHtcbiAgICByZXR1cm4gcmVxdWlyZSgnLi4vZGIvZGInKSgpO1xuICB9XG5cbiAgc3RhdGljIGdldFJlZk5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMubmFtZS50b0xvd2VyQ2FzZSgpO1xuICB9XG5cbiAgZ2V0IHJlZk5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0UmVmTmFtZSgpO1xuICB9XG5cbiAgZ2V0IGlkKCkge1xuICAgIHJldHVybiB0aGlzLl9pZDtcbiAgfVxuXG4gIHNldCBpZChpZCkge1xuICAgIHRoaXMuX2lkID0gaWQ7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCByZXYoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3JldjtcbiAgfVxuXG4gIHNldCByZXYocmV2KSB7XG4gICAgdGhpcy5fcmV2ID0gcmV2O1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgZGF0ZUFkZGVkKCkge1xuICAgIGlmICh0aGlzLl9kYXRlQWRkZWQpIHtcbiAgICAgIHJldHVybiBEYXRlVXRpbHMuZm9ybWF0KG5ldyBEYXRlKHRoaXMuX2RhdGVBZGRlZCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9XG5cbiAgc2V0IGRhdGVBZGRlZChkYXRlKSB7XG4gICAgdGhpcy5fZGF0ZUFkZGVkID0gZGF0ZTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0IGZpZWxkcyhmaWVsZHMpIHtcbiAgICB0aGlzLl9maWVsZHMgPSB7fTtcblxuICAgIGZvciAobGV0IGZpZWxkTmFtZSBpbiBmaWVsZHMpIHtcbiAgICAgIGlmICh0aGlzLl9hbGxvd2VkRmllbGRzLmluZGV4T2YoZmllbGROYW1lKSA+IC0xKSB7XG4gICAgICAgIHRoaXMuX2ZpZWxkc1tmaWVsZE5hbWVdID0gZmllbGRzW2ZpZWxkTmFtZV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQgZmllbGRzKCkge1xuICAgIHJldHVybiB0aGlzLl9maWVsZHM7XG4gIH1cblxuICBpc05ldygpIHtcbiAgICByZXR1cm4gIXRoaXMuaWQ7XG4gIH1cblxuICBnZXRTbHVnKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICghdGhpcy5pc05ldygpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5pZCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsZXQgc2x1ZyA9IHRoaXMucmVmTmFtZSArICctJztcblxuICAgICAgICBjb25zdCBwYWRkaW5nID0gNTsgLy90aGUgbGVuZ3RoIG9mIHRoZSBudW1iZXIsIGUuZy4gJzUnIHdpbGwgc3RhcnQgYXQgMDAwMDAsIDAwMDAxLCBldGMuXG5cbiAgICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZGIuYWxsRG9jcyh7XG4gICAgICAgICAgc3RhcnRrZXk6IHNsdWcgKyAnXFx1ZmZmZicsXG4gICAgICAgICAgZW5ka2V5OiBzbHVnLFxuICAgICAgICAgIGRlc2NlbmRpbmc6IHRydWUsXG4gICAgICAgICAgbGltaXQ6IDFcbiAgICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIGlmIChyZXN1bHQucm93cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBsYXN0RG9jID0gcmVzdWx0LnJvd3NbcmVzdWx0LnJvd3MubGVuZ3RoIC0gMV07XG4gICAgICAgICAgICBjb25zdCBsYXN0TnVtID0gcGFyc2VJbnQobGFzdERvYy5pZC5zdWJzdHJpbmcoc2x1Zy5sZW5ndGgpLCAxMCk7XG5cbiAgICAgICAgICAgIHJldHVybiBzbHVnICsgKCcwJy5yZXBlYXQocGFkZGluZykgKyAobGFzdE51bSArIDEpKS5zbGljZSgtcGFkZGluZyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzbHVnICsgJzAnLnJlcGVhdChwYWRkaW5nKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc2F2ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRTbHVnKCkudGhlbihzbHVnID0+IHtcbiAgICAgIGNvbnN0IHBhcmFtcyA9IHtcbiAgICAgICAgX2lkOiBzbHVnLFxuICAgICAgICBkYXRlQWRkZWQ6IHRoaXMuX2RhdGVBZGRlZCxcbiAgICAgICAgZmllbGRzOiB0aGlzLmZpZWxkc1xuICAgICAgfTtcblxuICAgICAgaWYgKCF0aGlzLmlzTmV3KCkpIHtcbiAgICAgICAgcGFyYW1zLl9yZXYgPSB0aGlzLnJldjtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMuaXNOZXcoKSAmJiAhdGhpcy5fZGF0ZUFkZGVkKSB7XG4gICAgICAgIHBhcmFtcy5kYXRlQWRkZWQgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmRiLnB1dChwYXJhbXMpLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgICAgICBpZiAocmVzcG9uc2Uub2spIHtcbiAgICAgICAgICB0aGlzLmlkID0gcmVzcG9uc2UuaWQ7XG4gICAgICAgICAgdGhpcy5yZXYgPSByZXNwb25zZS5yZXY7XG5cbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEFsbCgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLmFsbERvY3Moe1xuICAgICAgICBlbmRrZXk6IHRoaXMuZ2V0UmVmTmFtZSgpICsgJy0nLFxuICAgICAgICBzdGFydGtleTogdGhpcy5nZXRSZWZOYW1lKCkgKyAnLVxcdWZmZmYnLFxuICAgICAgICBpbmNsdWRlX2RvY3M6IHRydWUsXG4gICAgICAgIGRlc2NlbmRpbmc6IHRydWVcbiAgICAgIH0pLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgY29uc3QgbW9kZWxzID0gW107XG5cbiAgICAgICAgcmVzdWx0LnJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgIG1vZGVscy5wdXNoKG5ldyB0aGlzKHJvdy5kb2MpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG1vZGVscztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWQoaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGlkICE9PSAndW5kZWZpbmVkJykge1xuXG4gICAgICAgIHJldHVybiB0aGlzLmRiLmdldChpZCkudGhlbihkb2MgPT4ge1xuICAgICAgICAgIHJldHVybiBuZXcgdGhpcyhkb2MpO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgcmVtb3ZlKGlkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5nZXQoaWQpLnRoZW4oZG9jID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGIucmVtb3ZlKGRvYyk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBpbnNlcnQobWVtYmVycykge1xuICAgIGNvbnN0IG1vZGVsID0gbmV3IHRoaXMobWVtYmVycyk7XG4gICAgcmV0dXJuIG1vZGVsLnNhdmUoKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsO1xuIiwiKGZ1bmN0aW9uIChyb290LCBmYWN0b3J5KSB7XG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUgdW5sZXNzIGFtZE1vZHVsZUlkIGlzIHNldFxuICAgIGRlZmluZShbXSwgZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIChyb290WydBdXRvbGlua2VyJ10gPSBmYWN0b3J5KCkpO1xuICAgIH0pO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jykge1xuICAgIC8vIE5vZGUuIERvZXMgbm90IHdvcmsgd2l0aCBzdHJpY3QgQ29tbW9uSlMsIGJ1dFxuICAgIC8vIG9ubHkgQ29tbW9uSlMtbGlrZSBlbnZpcm9ubWVudHMgdGhhdCBzdXBwb3J0IG1vZHVsZS5leHBvcnRzLFxuICAgIC8vIGxpa2UgTm9kZS5cbiAgICBtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcbiAgfSBlbHNlIHtcbiAgICByb290WydBdXRvbGlua2VyJ10gPSBmYWN0b3J5KCk7XG4gIH1cbn0odGhpcywgZnVuY3Rpb24gKCkge1xuXG4vKiFcbiAqIEF1dG9saW5rZXIuanNcbiAqIDAuMjIuMFxuICpcbiAqIENvcHlyaWdodChjKSAyMDE1IEdyZWdvcnkgSmFjb2JzIDxncmVnQGdyZWctamFjb2JzLmNvbT5cbiAqIE1JVFxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9ncmVnamFjb2JzL0F1dG9saW5rZXIuanNcbiAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogVXRpbGl0eSBjbGFzcyB1c2VkIHRvIHByb2Nlc3MgYSBnaXZlbiBzdHJpbmcgb2YgdGV4dCwgYW5kIHdyYXAgdGhlIG1hdGNoZXMgaW5cbiAqIHRoZSBhcHByb3ByaWF0ZSBhbmNob3IgKCZsdDthJmd0OykgdGFncyB0byB0dXJuIHRoZW0gaW50byBsaW5rcy5cbiAqXG4gKiBBbnkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBtYXkgYmUgcHJvdmlkZWQgaW4gYW4gT2JqZWN0IChtYXApIHByb3ZpZGVkXG4gKiB0byB0aGUgQXV0b2xpbmtlciBjb25zdHJ1Y3Rvciwgd2hpY2ggd2lsbCBjb25maWd1cmUgaG93IHRoZSB7QGxpbmsgI2xpbmsgbGluaygpfVxuICogbWV0aG9kIHdpbGwgcHJvY2VzcyB0aGUgbGlua3MuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciBhdXRvbGlua2VyID0gbmV3IEF1dG9saW5rZXIoIHtcbiAqICAgICAgICAgbmV3V2luZG93IDogZmFsc2UsXG4gKiAgICAgICAgIHRydW5jYXRlICA6IDMwXG4gKiAgICAgfSApO1xuICpcbiAqICAgICB2YXIgaHRtbCA9IGF1dG9saW5rZXIubGluayggXCJKb2Ugd2VudCB0byB3d3cueWFob28uY29tXCIgKTtcbiAqICAgICAvLyBwcm9kdWNlczogJ0pvZSB3ZW50IHRvIDxhIGhyZWY9XCJodHRwOi8vd3d3LnlhaG9vLmNvbVwiPnlhaG9vLmNvbTwvYT4nXG4gKlxuICpcbiAqIFRoZSB7QGxpbmsgI3N0YXRpYy1saW5rIHN0YXRpYyBsaW5rKCl9IG1ldGhvZCBtYXkgYWxzbyBiZSB1c2VkIHRvIGlubGluZSBvcHRpb25zIGludG8gYSBzaW5nbGUgY2FsbCwgd2hpY2ggbWF5XG4gKiBiZSBtb3JlIGNvbnZlbmllbnQgZm9yIG9uZS1vZmYgdXNlcy4gRm9yIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIkpvZSB3ZW50IHRvIHd3dy55YWhvby5jb21cIiwge1xuICogICAgICAgICBuZXdXaW5kb3cgOiBmYWxzZSxcbiAqICAgICAgICAgdHJ1bmNhdGUgIDogMzBcbiAqICAgICB9ICk7XG4gKiAgICAgLy8gcHJvZHVjZXM6ICdKb2Ugd2VudCB0byA8YSBocmVmPVwiaHR0cDovL3d3dy55YWhvby5jb21cIj55YWhvby5jb208L2E+J1xuICpcbiAqXG4gKiAjIyBDdXN0b20gUmVwbGFjZW1lbnRzIG9mIExpbmtzXG4gKlxuICogSWYgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBkbyBub3QgcHJvdmlkZSBlbm91Z2ggZmxleGliaWxpdHksIGEge0BsaW5rICNyZXBsYWNlRm59XG4gKiBtYXkgYmUgcHJvdmlkZWQgdG8gZnVsbHkgY3VzdG9taXplIHRoZSBvdXRwdXQgb2YgQXV0b2xpbmtlci4gVGhpcyBmdW5jdGlvbiBpc1xuICogY2FsbGVkIG9uY2UgZm9yIGVhY2ggVVJML0VtYWlsL1Bob25lIy9Ud2l0dGVyIEhhbmRsZS9IYXNodGFnIG1hdGNoIHRoYXQgaXNcbiAqIGVuY291bnRlcmVkLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICpcbiAqICAgICB2YXIgaW5wdXQgPSBcIi4uLlwiOyAgLy8gc3RyaW5nIHdpdGggVVJMcywgRW1haWwgQWRkcmVzc2VzLCBQaG9uZSAjcywgVHdpdHRlciBIYW5kbGVzLCBhbmQgSGFzaHRhZ3NcbiAqXG4gKiAgICAgdmFyIGxpbmtlZFRleHQgPSBBdXRvbGlua2VyLmxpbmsoIGlucHV0LCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImhyZWYgPSBcIiwgbWF0Y2guZ2V0QW5jaG9ySHJlZigpICk7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ0ZXh0ID0gXCIsIG1hdGNoLmdldEFuY2hvclRleHQoKSApO1xuICpcbiAqICAgICAgICAgICAgIHN3aXRjaCggbWF0Y2guZ2V0VHlwZSgpICkge1xuICogICAgICAgICAgICAgICAgIGNhc2UgJ3VybCcgOlxuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ1cmw6IFwiLCBtYXRjaC5nZXRVcmwoKSApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgaWYoIG1hdGNoLmdldFVybCgpLmluZGV4T2YoICdteXNpdGUuY29tJyApID09PSAtMSApIHtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4gYEF1dG9saW5rZXIuSHRtbFRhZ2AgaW5zdGFuY2UsIHdoaWNoIHByb3ZpZGVzIG11dGF0b3IgbWV0aG9kcyBmb3IgZWFzeSBjaGFuZ2VzXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICB0YWcuc2V0QXR0ciggJ3JlbCcsICdub2ZvbGxvdycgKTtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5hZGRDbGFzcyggJ2V4dGVybmFsLWxpbmsnICk7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRhZztcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTsgIC8vIGxldCBBdXRvbGlua2VyIHBlcmZvcm0gaXRzIG5vcm1hbCBhbmNob3IgdGFnIHJlcGxhY2VtZW50XG4gKiAgICAgICAgICAgICAgICAgICAgIH1cbiAqXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnIDpcbiAqICAgICAgICAgICAgICAgICAgICAgdmFyIGVtYWlsID0gbWF0Y2guZ2V0RW1haWwoKTtcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwiZW1haWw6IFwiLCBlbWFpbCApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgaWYoIGVtYWlsID09PSBcIm15QG93bi5hZGRyZXNzXCIgKSB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7ICAvLyBkb24ndCBhdXRvLWxpbmsgdGhpcyBwYXJ0aWN1bGFyIGVtYWlsIGFkZHJlc3M7IGxlYXZlIGFzLWlzXG4gKiAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gKiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47ICAvLyBubyByZXR1cm4gdmFsdWUgd2lsbCBoYXZlIEF1dG9saW5rZXIgcGVyZm9ybSBpdHMgbm9ybWFsIGFuY2hvciB0YWcgcmVwbGFjZW1lbnQgKHNhbWUgYXMgcmV0dXJuaW5nIGB0cnVlYClcbiAqICAgICAgICAgICAgICAgICAgICAgfVxuICpcbiAqICAgICAgICAgICAgICAgICBjYXNlICdwaG9uZScgOlxuICogICAgICAgICAgICAgICAgICAgICB2YXIgcGhvbmVOdW1iZXIgPSBtYXRjaC5nZXRQaG9uZU51bWJlcigpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggcGhvbmVOdW1iZXIgKTtcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGEgaHJlZj1cImh0dHA6Ly9uZXdwbGFjZS50by5saW5rLnBob25lLm51bWJlcnMudG8vXCI+JyArIHBob25lTnVtYmVyICsgJzwvYT4nO1xuICpcbiAqICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciB0d2l0dGVySGFuZGxlID0gbWF0Y2guZ2V0VHdpdHRlckhhbmRsZSgpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggdHdpdHRlckhhbmRsZSApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovL25ld3BsYWNlLnRvLmxpbmsudHdpdHRlci5oYW5kbGVzLnRvL1wiPicgKyB0d2l0dGVySGFuZGxlICsgJzwvYT4nO1xuICpcbiAqICAgICAgICAgICAgICAgICBjYXNlICdoYXNodGFnJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciBoYXNodGFnID0gbWF0Y2guZ2V0SGFzaHRhZygpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggaGFzaHRhZyApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovL25ld3BsYWNlLnRvLmxpbmsuaGFzaHRhZy5oYW5kbGVzLnRvL1wiPicgKyBoYXNodGFnICsgJzwvYT4nO1xuICogICAgICAgICAgICAgfVxuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICpcbiAqXG4gKiBUaGUgZnVuY3Rpb24gbWF5IHJldHVybiB0aGUgZm9sbG93aW5nIHZhbHVlczpcbiAqXG4gKiAtIGB0cnVlYCAoQm9vbGVhbik6IEFsbG93IEF1dG9saW5rZXIgdG8gcmVwbGFjZSB0aGUgbWF0Y2ggYXMgaXQgbm9ybWFsbHkgd291bGQuXG4gKiAtIGBmYWxzZWAgKEJvb2xlYW4pOiBEbyBub3QgcmVwbGFjZSB0aGUgY3VycmVudCBtYXRjaCBhdCBhbGwgLSBsZWF2ZSBhcy1pcy5cbiAqIC0gQW55IFN0cmluZzogSWYgYSBzdHJpbmcgaXMgcmV0dXJuZWQgZnJvbSB0aGUgZnVuY3Rpb24sIHRoZSBzdHJpbmcgd2lsbCBiZSB1c2VkIGRpcmVjdGx5IGFzIHRoZSByZXBsYWNlbWVudCBIVE1MIGZvclxuICogICB0aGUgbWF0Y2guXG4gKiAtIEFuIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWd9IGluc3RhbmNlLCB3aGljaCBjYW4gYmUgdXNlZCB0byBidWlsZC9tb2RpZnkgYW4gSFRNTCB0YWcgYmVmb3JlIHdyaXRpbmcgb3V0IGl0cyBIVE1MIHRleHQuXG4gKlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gW2NmZ10gVGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEF1dG9saW5rZXIgaW5zdGFuY2UsIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuXG4gKi9cbnZhciBBdXRvbGlua2VyID0gZnVuY3Rpb24oIGNmZyApIHtcblx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7ICAvLyBhc3NpZ24gdGhlIHByb3BlcnRpZXMgb2YgYGNmZ2Agb250byB0aGUgQXV0b2xpbmtlciBpbnN0YW5jZS4gUHJvdG90eXBlIHByb3BlcnRpZXMgd2lsbCBiZSB1c2VkIGZvciBtaXNzaW5nIGNvbmZpZ3MuXG5cblx0Ly8gVmFsaWRhdGUgdGhlIHZhbHVlIG9mIHRoZSBgaGFzaHRhZ2AgY2ZnLlxuXHR2YXIgaGFzaHRhZyA9IHRoaXMuaGFzaHRhZztcblx0aWYoIGhhc2h0YWcgIT09IGZhbHNlICYmIGhhc2h0YWcgIT09ICd0d2l0dGVyJyAmJiBoYXNodGFnICE9PSAnZmFjZWJvb2snICYmIGhhc2h0YWcgIT09ICdpbnN0YWdyYW0nICkge1xuXHRcdHRocm93IG5ldyBFcnJvciggXCJpbnZhbGlkIGBoYXNodGFnYCBjZmcgLSBzZWUgZG9jc1wiICk7XG5cdH1cblxuXHQvLyBOb3JtYWxpemUgdGhlIGNvbmZpZ3Ncblx0dGhpcy51cmxzICAgICA9IHRoaXMubm9ybWFsaXplVXJsc0NmZyggdGhpcy51cmxzICk7XG5cdHRoaXMudHJ1bmNhdGUgPSB0aGlzLm5vcm1hbGl6ZVRydW5jYXRlQ2ZnKCB0aGlzLnRydW5jYXRlICk7XG59O1xuXG5BdXRvbGlua2VyLnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3IgOiBBdXRvbGlua2VyLCAgLy8gZml4IGNvbnN0cnVjdG9yIHByb3BlcnR5XG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW4vT2JqZWN0fSB1cmxzXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiBVUkxzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCwgYGZhbHNlYCBpZiB0aGV5IHNob3VsZCBub3Rcblx0ICogYmUuXG5cdCAqXG5cdCAqIFRoaXMgb3B0aW9uIGFsc28gYWNjZXB0cyBhbiBPYmplY3QgZm9ybSB3aXRoIDMgcHJvcGVydGllcywgdG8gYWxsb3cgZm9yXG5cdCAqIG1vcmUgY3VzdG9taXphdGlvbiBvZiB3aGF0IGV4YWN0bHkgZ2V0cyBsaW5rZWQuIEFsbCBkZWZhdWx0IHRvIGB0cnVlYDpcblx0ICpcblx0ICogQHBhcmFtIHtCb29sZWFufSBzY2hlbWVNYXRjaGVzIGB0cnVlYCB0byBtYXRjaCBVUkxzIGZvdW5kIHByZWZpeGVkIHdpdGggYVxuXHQgKiAgIHNjaGVtZSwgaS5lLiBgaHR0cDovL2dvb2dsZS5jb21gLCBvciBgb3RoZXIrc2NoZW1lOi8vZ29vZ2xlLmNvbWAsXG5cdCAqICAgYGZhbHNlYCB0byBwcmV2ZW50IHRoZXNlIHR5cGVzIG9mIG1hdGNoZXMuXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gd3d3TWF0Y2hlcyBgdHJ1ZWAgdG8gbWF0Y2ggdXJscyBmb3VuZCBwcmVmaXhlZCB3aXRoXG5cdCAqICAgYCd3d3cuJ2AsIGkuZS4gYHd3dy5nb29nbGUuY29tYC4gYGZhbHNlYCB0byBwcmV2ZW50IHRoZXNlIHR5cGVzIG9mXG5cdCAqICAgbWF0Y2hlcy4gTm90ZSB0aGF0IGlmIHRoZSBVUkwgaGFkIGEgcHJlZml4ZWQgc2NoZW1lLCBhbmRcblx0ICogICBgc2NoZW1lTWF0Y2hlc2AgaXMgdHJ1ZSwgaXQgd2lsbCBzdGlsbCBiZSBsaW5rZWQuXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gdGxkTWF0Y2hlcyBgdHJ1ZWAgdG8gbWF0Y2ggVVJMcyB3aXRoIGtub3duIHRvcCBsZXZlbFxuXHQgKiAgIGRvbWFpbnMgKC5jb20sIC5uZXQsIGV0Yy4pIHRoYXQgYXJlIG5vdCBwcmVmaXhlZCB3aXRoIGEgc2NoZW1lIG9yXG5cdCAqICAgYCd3d3cuJ2AuIFRoaXMgb3B0aW9uIGF0dGVtcHRzIHRvIG1hdGNoIGFueXRoaW5nIHRoYXQgbG9va3MgbGlrZSBhIFVSTFxuXHQgKiAgIGluIHRoZSBnaXZlbiB0ZXh0LiBFeDogYGdvb2dsZS5jb21gLCBgYXNkZi5vcmcvP3BhZ2U9MWAsIGV0Yy4gYGZhbHNlYFxuXHQgKiAgIHRvIHByZXZlbnQgdGhlc2UgdHlwZXMgb2YgbWF0Y2hlcy5cblx0ICovXG5cdHVybHMgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBlbWFpbFxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgZW1haWwgYWRkcmVzc2VzIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCwgYGZhbHNlYCBpZiB0aGV5XG5cdCAqIHNob3VsZCBub3QgYmUuXG5cdCAqL1xuXHRlbWFpbCA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHR3aXR0ZXJcblx0ICpcblx0ICogYHRydWVgIGlmIFR3aXR0ZXIgaGFuZGxlcyAoXCJAZXhhbXBsZVwiKSBzaG91bGQgYmUgYXV0b21hdGljYWxseSBsaW5rZWQsXG5cdCAqIGBmYWxzZWAgaWYgdGhleSBzaG91bGQgbm90IGJlLlxuXHQgKi9cblx0dHdpdHRlciA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHBob25lXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiBQaG9uZSBudW1iZXJzIChcIig1NTUpNTU1LTU1NTVcIikgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbGlua2VkLFxuXHQgKiBgZmFsc2VgIGlmIHRoZXkgc2hvdWxkIG5vdCBiZS5cblx0ICovXG5cdHBob25lOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFuL1N0cmluZ30gaGFzaHRhZ1xuXHQgKlxuXHQgKiBBIHN0cmluZyBmb3IgdGhlIHNlcnZpY2UgbmFtZSB0byBoYXZlIGhhc2h0YWdzIChleDogXCIjbXlIYXNodGFnXCIpXG5cdCAqIGF1dG8tbGlua2VkIHRvLiBUaGUgY3VycmVudGx5LXN1cHBvcnRlZCB2YWx1ZXMgYXJlOlxuXHQgKlxuXHQgKiAtICd0d2l0dGVyJ1xuXHQgKiAtICdmYWNlYm9vaydcblx0ICogLSAnaW5zdGFncmFtJ1xuXHQgKlxuXHQgKiBQYXNzIGBmYWxzZWAgdG8gc2tpcCBhdXRvLWxpbmtpbmcgb2YgaGFzaHRhZ3MuXG5cdCAqL1xuXHRoYXNodGFnIDogZmFsc2UsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IG5ld1dpbmRvd1xuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgdGhlIGxpbmtzIHNob3VsZCBvcGVuIGluIGEgbmV3IHdpbmRvdywgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRuZXdXaW5kb3cgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBzdHJpcFByZWZpeFxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgJ2h0dHA6Ly8nIG9yICdodHRwczovLycgYW5kL29yIHRoZSAnd3d3Licgc2hvdWxkIGJlIHN0cmlwcGVkXG5cdCAqIGZyb20gdGhlIGJlZ2lubmluZyBvZiBVUkwgbGlua3MnIHRleHQsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0c3RyaXBQcmVmaXggOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtOdW1iZXIvT2JqZWN0fSB0cnVuY2F0ZVxuXHQgKlxuXHQgKiAjIyBOdW1iZXIgRm9ybVxuXHQgKlxuXHQgKiBBIG51bWJlciBmb3IgaG93IG1hbnkgY2hhcmFjdGVycyBtYXRjaGVkIHRleHQgc2hvdWxkIGJlIHRydW5jYXRlZCB0b1xuXHQgKiBpbnNpZGUgdGhlIHRleHQgb2YgYSBsaW5rLiBJZiB0aGUgbWF0Y2hlZCB0ZXh0IGlzIG92ZXIgdGhpcyBudW1iZXIgb2Zcblx0ICogY2hhcmFjdGVycywgaXQgd2lsbCBiZSB0cnVuY2F0ZWQgdG8gdGhpcyBsZW5ndGggYnkgYWRkaW5nIGEgdHdvIHBlcmlvZFxuXHQgKiBlbGxpcHNpcyAoJy4uJykgdG8gdGhlIGVuZCBvZiB0aGUgc3RyaW5nLlxuXHQgKlxuXHQgKiBGb3IgZXhhbXBsZTogQSB1cmwgbGlrZSAnaHR0cDovL3d3dy55YWhvby5jb20vc29tZS9sb25nL3BhdGgvdG8vYS9maWxlJ1xuXHQgKiB0cnVuY2F0ZWQgdG8gMjUgY2hhcmFjdGVycyBtaWdodCBsb29rIHNvbWV0aGluZyBsaWtlIHRoaXM6XG5cdCAqICd5YWhvby5jb20vc29tZS9sb25nL3BhdC4uJ1xuXHQgKlxuXHQgKiBFeGFtcGxlIFVzYWdlOlxuXHQgKlxuXHQgKiAgICAgdHJ1bmNhdGU6IDI1XG5cdCAqXG5cdCAqXG5cdCAqICMjIE9iamVjdCBGb3JtXG5cdCAqXG5cdCAqIEFuIE9iamVjdCBtYXkgYWxzbyBiZSBwcm92aWRlZCB3aXRoIHR3byBwcm9wZXJ0aWVzOiBgbGVuZ3RoYCAoTnVtYmVyKSBhbmRcblx0ICogYGxvY2F0aW9uYCAoU3RyaW5nKS4gYGxvY2F0aW9uYCBtYXkgYmUgb25lIG9mIHRoZSBmb2xsb3dpbmc6ICdlbmQnXG5cdCAqIChkZWZhdWx0KSwgJ21pZGRsZScsIG9yICdzbWFydCcuXG5cdCAqXG5cdCAqIEV4YW1wbGUgVXNhZ2U6XG5cdCAqXG5cdCAqICAgICB0cnVuY2F0ZTogeyBsZW5ndGg6IDI1LCBsb2NhdGlvbjogJ21pZGRsZScgfVxuXHQgKlxuXHQgKiBAY2ZnIHtOdW1iZXJ9IHRydW5jYXRlLmxlbmd0aCBIb3cgbWFueSBjaGFyYWN0ZXJzIHRvIGFsbG93IGJlZm9yZVxuXHQgKiAgIHRydW5jYXRpb24gd2lsbCBvY2N1ci5cblx0ICogQGNmZyB7XCJlbmRcIi9cIm1pZGRsZVwiL1wic21hcnRcIn0gW3RydW5jYXRlLmxvY2F0aW9uPVwiZW5kXCJdXG5cdCAqXG5cdCAqIC0gJ2VuZCcgKGRlZmF1bHQpOiB3aWxsIHRydW5jYXRlIHVwIHRvIHRoZSBudW1iZXIgb2YgY2hhcmFjdGVycywgYW5kIHRoZW5cblx0ICogICBhZGQgYW4gZWxsaXBzaXMgYXQgdGhlIGVuZC4gRXg6ICd5YWhvby5jb20vc29tZS9sb25nL3BhdC4uJ1xuXHQgKiAtICdtaWRkbGUnOiB3aWxsIHRydW5jYXRlIGFuZCBhZGQgdGhlIGVsbGlwc2lzIGluIHRoZSBtaWRkbGUuIEV4OlxuXHQgKiAgICd5YWhvby5jb20vcy4udGgvdG8vYS9maWxlJ1xuXHQgKiAtICdzbWFydCc6IGZvciBVUkxzIHdoZXJlIHRoZSBhbGdvcml0aG0gYXR0ZW1wdHMgdG8gc3RyaXAgb3V0IHVubmVjZXNzYXJ5XG5cdCAqICAgcGFydHMgZmlyc3QgKHN1Y2ggYXMgdGhlICd3d3cuJywgdGhlbiBVUkwgc2NoZW1lLCBoYXNoLCBldGMuKSxcblx0ICogICBhdHRlbXB0aW5nIHRvIG1ha2UgdGhlIFVSTCBodW1hbi1yZWFkYWJsZSBiZWZvcmUgbG9va2luZyBmb3IgYSBnb29kXG5cdCAqICAgcG9pbnQgdG8gaW5zZXJ0IHRoZSBlbGxpcHNpcyBpZiBpdCBpcyBzdGlsbCB0b28gbG9uZy4gRXg6XG5cdCAqICAgJ3lhaG9vLmNvbS9zb21lLi50by9hL2ZpbGUnLiBGb3IgbW9yZSBkZXRhaWxzLCBzZWVcblx0ICogICB7QGxpbmsgQXV0b2xpbmtlci50cnVuY2F0ZS5UcnVuY2F0ZVNtYXJ0fS5cblx0ICovXG5cdHRydW5jYXRlIDogdW5kZWZpbmVkLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGNsYXNzTmFtZVxuXHQgKlxuXHQgKiBBIENTUyBjbGFzcyBuYW1lIHRvIGFkZCB0byB0aGUgZ2VuZXJhdGVkIGxpbmtzLiBUaGlzIGNsYXNzIHdpbGwgYmUgYWRkZWQgdG8gYWxsIGxpbmtzLCBhcyB3ZWxsIGFzIHRoaXMgY2xhc3Ncblx0ICogcGx1cyBtYXRjaCBzdWZmaXhlcyBmb3Igc3R5bGluZyB1cmwvZW1haWwvcGhvbmUvdHdpdHRlci9oYXNodGFnIGxpbmtzIGRpZmZlcmVudGx5LlxuXHQgKlxuXHQgKiBGb3IgZXhhbXBsZSwgaWYgdGhpcyBjb25maWcgaXMgcHJvdmlkZWQgYXMgXCJteUxpbmtcIiwgdGhlbjpcblx0ICpcblx0ICogLSBVUkwgbGlua3Mgd2lsbCBoYXZlIHRoZSBDU1MgY2xhc3NlczogXCJteUxpbmsgbXlMaW5rLXVybFwiXG5cdCAqIC0gRW1haWwgbGlua3Mgd2lsbCBoYXZlIHRoZSBDU1MgY2xhc3NlczogXCJteUxpbmsgbXlMaW5rLWVtYWlsXCIsIGFuZFxuXHQgKiAtIFR3aXR0ZXIgbGlua3Mgd2lsbCBoYXZlIHRoZSBDU1MgY2xhc3NlczogXCJteUxpbmsgbXlMaW5rLXR3aXR0ZXJcIlxuXHQgKiAtIFBob25lIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay1waG9uZVwiXG5cdCAqIC0gSGFzaHRhZyBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstaGFzaHRhZ1wiXG5cdCAqL1xuXHRjbGFzc05hbWUgOiBcIlwiLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtGdW5jdGlvbn0gcmVwbGFjZUZuXG5cdCAqXG5cdCAqIEEgZnVuY3Rpb24gdG8gaW5kaXZpZHVhbGx5IHByb2Nlc3MgZWFjaCBtYXRjaCBmb3VuZCBpbiB0aGUgaW5wdXQgc3RyaW5nLlxuXHQgKlxuXHQgKiBTZWUgdGhlIGNsYXNzJ3MgZGVzY3JpcHRpb24gZm9yIHVzYWdlLlxuXHQgKlxuXHQgKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aXRoIHRoZSBmb2xsb3dpbmcgcGFyYW1ldGVyczpcblx0ICpcblx0ICogQGNmZyB7QXV0b2xpbmtlcn0gcmVwbGFjZUZuLmF1dG9saW5rZXIgVGhlIEF1dG9saW5rZXIgaW5zdGFuY2UsIHdoaWNoIG1heSBiZSB1c2VkIHRvIHJldHJpZXZlIGNoaWxkIG9iamVjdHMgZnJvbSAoc3VjaFxuXHQgKiAgIGFzIHRoZSBpbnN0YW5jZSdzIHtAbGluayAjZ2V0VGFnQnVpbGRlciB0YWcgYnVpbGRlcn0pLlxuXHQgKiBAY2ZnIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSByZXBsYWNlRm4ubWF0Y2ggVGhlIE1hdGNoIGluc3RhbmNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIGFib3V0IHRoZVxuXHQgKiAgIG1hdGNoIHRoYXQgdGhlIGByZXBsYWNlRm5gIGlzIGN1cnJlbnRseSBwcm9jZXNzaW5nLiBTZWUge0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9IHN1YmNsYXNzZXMgZm9yIGRldGFpbHMuXG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9IGh0bWxQYXJzZXJcblx0ICpcblx0ICogVGhlIEh0bWxQYXJzZXIgaW5zdGFuY2UgdXNlZCB0byBza2lwIG92ZXIgSFRNTCB0YWdzLCB3aGlsZSBmaW5kaW5nIHRleHQgbm9kZXMgdG8gcHJvY2Vzcy4gVGhpcyBpcyBsYXppbHkgaW5zdGFudGlhdGVkXG5cdCAqIGluIHRoZSB7QGxpbmsgI2dldEh0bWxQYXJzZXJ9IG1ldGhvZC5cblx0ICovXG5cdGh0bWxQYXJzZXIgOiB1bmRlZmluZWQsXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7QXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlcn0gbWF0Y2hQYXJzZXJcblx0ICpcblx0ICogVGhlIE1hdGNoUGFyc2VyIGluc3RhbmNlIHVzZWQgdG8gZmluZCBtYXRjaGVzIGluIHRoZSB0ZXh0IG5vZGVzIG9mIGFuIGlucHV0IHN0cmluZyBwYXNzZWQgdG9cblx0ICoge0BsaW5rICNsaW5rfS4gVGhpcyBpcyBsYXppbHkgaW5zdGFudGlhdGVkIGluIHRoZSB7QGxpbmsgI2dldE1hdGNoUGFyc2VyfSBtZXRob2QuXG5cdCAqL1xuXHRtYXRjaFBhcnNlciA6IHVuZGVmaW5lZCxcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtBdXRvbGlua2VyLkFuY2hvclRhZ0J1aWxkZXJ9IHRhZ0J1aWxkZXJcblx0ICpcblx0ICogVGhlIEFuY2hvclRhZ0J1aWxkZXIgaW5zdGFuY2UgdXNlZCB0byBidWlsZCBtYXRjaCByZXBsYWNlbWVudCBhbmNob3IgdGFncy4gTm90ZTogdGhpcyBpcyBsYXppbHkgaW5zdGFudGlhdGVkXG5cdCAqIGluIHRoZSB7QGxpbmsgI2dldFRhZ0J1aWxkZXJ9IG1ldGhvZC5cblx0ICovXG5cdHRhZ0J1aWxkZXIgOiB1bmRlZmluZWQsXG5cblxuXHQvKipcblx0ICogTm9ybWFsaXplcyB0aGUge0BsaW5rICN1cmxzfSBjb25maWcgaW50byBhbiBPYmplY3Qgd2l0aCAzIHByb3BlcnRpZXM6XG5cdCAqIGBzY2hlbWVNYXRjaGVzYCwgYHd3d01hdGNoZXNgLCBhbmQgYHRsZE1hdGNoZXNgLCBhbGwgQm9vbGVhbnMuXG5cdCAqXG5cdCAqIFNlZSB7QGxpbmsgI3VybHN9IGNvbmZpZyBmb3IgZGV0YWlscy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtCb29sZWFuL09iamVjdH0gdXJsc1xuXHQgKiBAcmV0dXJuIHtPYmplY3R9XG5cdCAqL1xuXHRub3JtYWxpemVVcmxzQ2ZnIDogZnVuY3Rpb24oIHVybHMgKSB7XG5cdFx0aWYoIHR5cGVvZiB1cmxzID09PSAnYm9vbGVhbicgKSB7XG5cdFx0XHRyZXR1cm4geyBzY2hlbWVNYXRjaGVzOiB1cmxzLCB3d3dNYXRjaGVzOiB1cmxzLCB0bGRNYXRjaGVzOiB1cmxzIH07XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBBdXRvbGlua2VyLlV0aWwuZGVmYXVsdHMoIHVybHMgfHwge30sIHsgc2NoZW1lTWF0Y2hlczogdHJ1ZSwgd3d3TWF0Y2hlczogdHJ1ZSwgdGxkTWF0Y2hlczogdHJ1ZSB9ICk7XG5cdFx0fVxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIE5vcm1hbGl6ZXMgdGhlIHtAbGluayAjdHJ1bmNhdGV9IGNvbmZpZyBpbnRvIGFuIE9iamVjdCB3aXRoIDIgcHJvcGVydGllczpcblx0ICogYGxlbmd0aGAgKE51bWJlciksIGFuZCBgbG9jYXRpb25gIChTdHJpbmcpLlxuXHQgKlxuXHQgKiBTZWUge0BsaW5rICN0cnVuY2F0ZX0gY29uZmlnIGZvciBkZXRhaWxzLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge051bWJlci9PYmplY3R9IHRydW5jYXRlXG5cdCAqIEByZXR1cm4ge09iamVjdH1cblx0ICovXG5cdG5vcm1hbGl6ZVRydW5jYXRlQ2ZnIDogZnVuY3Rpb24oIHRydW5jYXRlICkge1xuXHRcdGlmKCB0eXBlb2YgdHJ1bmNhdGUgPT09ICdudW1iZXInICkge1xuXHRcdFx0cmV0dXJuIHsgbGVuZ3RoOiB0cnVuY2F0ZSwgbG9jYXRpb246ICdlbmQnIH07XG5cblx0XHR9IGVsc2UgeyAgLy8gb2JqZWN0LCBvciB1bmRlZmluZWQvbnVsbFxuXHRcdFx0cmV0dXJuIEF1dG9saW5rZXIuVXRpbC5kZWZhdWx0cyggdHJ1bmNhdGUgfHwge30sIHtcblx0XHRcdFx0bGVuZ3RoICAgOiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFksXG5cdFx0XHRcdGxvY2F0aW9uIDogJ2VuZCdcblx0XHRcdH0gKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvKipcblx0ICogQXV0b21hdGljYWxseSBsaW5rcyBVUkxzLCBFbWFpbCBhZGRyZXNzZXMsIFBob25lIG51bWJlcnMsIFR3aXR0ZXJcblx0ICogaGFuZGxlcywgYW5kIEhhc2h0YWdzIGZvdW5kIGluIHRoZSBnaXZlbiBjaHVuayBvZiBIVE1MLiBEb2VzIG5vdCBsaW5rXG5cdCAqIFVSTHMgZm91bmQgd2l0aGluIEhUTUwgdGFncy5cblx0ICpcblx0ICogRm9yIGluc3RhbmNlLCBpZiBnaXZlbiB0aGUgdGV4dDogYFlvdSBzaG91bGQgZ28gdG8gaHR0cDovL3d3dy55YWhvby5jb21gLFxuXHQgKiB0aGVuIHRoZSByZXN1bHQgd2lsbCBiZSBgWW91IHNob3VsZCBnbyB0b1xuXHQgKiAmbHQ7YSBocmVmPVwiaHR0cDovL3d3dy55YWhvby5jb21cIiZndDtodHRwOi8vd3d3LnlhaG9vLmNvbSZsdDsvYSZndDtgXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGZpbmRzIHRoZSB0ZXh0IGFyb3VuZCBhbnkgSFRNTCBlbGVtZW50cyBpbiB0aGUgaW5wdXRcblx0ICogYHRleHRPckh0bWxgLCB3aGljaCB3aWxsIGJlIHRoZSB0ZXh0IHRoYXQgaXMgcHJvY2Vzc2VkLiBBbnkgb3JpZ2luYWwgSFRNTFxuXHQgKiBlbGVtZW50cyB3aWxsIGJlIGxlZnQgYXMtaXMsIGFzIHdlbGwgYXMgdGhlIHRleHQgdGhhdCBpcyBhbHJlYWR5IHdyYXBwZWRcblx0ICogaW4gYW5jaG9yICgmbHQ7YSZndDspIHRhZ3MuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0T3JIdG1sIFRoZSBIVE1MIG9yIHRleHQgdG8gYXV0b2xpbmsgbWF0Y2hlcyB3aXRoaW5cblx0ICogICAoZGVwZW5kaW5nIG9uIGlmIHRoZSB7QGxpbmsgI3VybHN9LCB7QGxpbmsgI2VtYWlsfSwge0BsaW5rICNwaG9uZX0sXG5cdCAqICAge0BsaW5rICN0d2l0dGVyfSwgYW5kIHtAbGluayAjaGFzaHRhZ30gb3B0aW9ucyBhcmUgZW5hYmxlZCkuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIEhUTUwsIHdpdGggbWF0Y2hlcyBhdXRvbWF0aWNhbGx5IGxpbmtlZC5cblx0ICovXG5cdGxpbmsgOiBmdW5jdGlvbiggdGV4dE9ySHRtbCApIHtcblx0XHRpZiggIXRleHRPckh0bWwgKSB7IHJldHVybiBcIlwiOyB9ICAvLyBoYW5kbGUgYG51bGxgIGFuZCBgdW5kZWZpbmVkYFxuXG5cdFx0dmFyIGh0bWxQYXJzZXIgPSB0aGlzLmdldEh0bWxQYXJzZXIoKSxcblx0XHQgICAgaHRtbE5vZGVzID0gaHRtbFBhcnNlci5wYXJzZSggdGV4dE9ySHRtbCApLFxuXHRcdCAgICBhbmNob3JUYWdTdGFja0NvdW50ID0gMCwgIC8vIHVzZWQgdG8gb25seSBwcm9jZXNzIHRleHQgYXJvdW5kIGFuY2hvciB0YWdzLCBhbmQgYW55IGlubmVyIHRleHQvaHRtbCB0aGV5IG1heSBoYXZlXG5cdFx0ICAgIHJlc3VsdEh0bWwgPSBbXTtcblxuXHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBodG1sTm9kZXMubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHR2YXIgbm9kZSA9IGh0bWxOb2Rlc1sgaSBdLFxuXHRcdFx0ICAgIG5vZGVUeXBlID0gbm9kZS5nZXRUeXBlKCksXG5cdFx0XHQgICAgbm9kZVRleHQgPSBub2RlLmdldFRleHQoKTtcblxuXHRcdFx0aWYoIG5vZGVUeXBlID09PSAnZWxlbWVudCcgKSB7XG5cdFx0XHRcdC8vIFByb2Nlc3MgSFRNTCBub2RlcyBpbiB0aGUgaW5wdXQgYHRleHRPckh0bWxgXG5cdFx0XHRcdGlmKCBub2RlLmdldFRhZ05hbWUoKSA9PT0gJ2EnICkge1xuXHRcdFx0XHRcdGlmKCAhbm9kZS5pc0Nsb3NpbmcoKSApIHsgIC8vIGl0J3MgdGhlIHN0YXJ0IDxhPiB0YWdcblx0XHRcdFx0XHRcdGFuY2hvclRhZ1N0YWNrQ291bnQrKztcblx0XHRcdFx0XHR9IGVsc2UgeyAgIC8vIGl0J3MgdGhlIGVuZCA8L2E+IHRhZ1xuXHRcdFx0XHRcdFx0YW5jaG9yVGFnU3RhY2tDb3VudCA9IE1hdGgubWF4KCBhbmNob3JUYWdTdGFja0NvdW50IC0gMSwgMCApOyAgLy8gYXR0ZW1wdCB0byBoYW5kbGUgZXh0cmFuZW91cyA8L2E+IHRhZ3MgYnkgbWFraW5nIHN1cmUgdGhlIHN0YWNrIGNvdW50IG5ldmVyIGdvZXMgYmVsb3cgMFxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHRyZXN1bHRIdG1sLnB1c2goIG5vZGVUZXh0ICk7ICAvLyBub3cgYWRkIHRoZSB0ZXh0IG9mIHRoZSB0YWcgaXRzZWxmIHZlcmJhdGltXG5cblx0XHRcdH0gZWxzZSBpZiggbm9kZVR5cGUgPT09ICdlbnRpdHknIHx8IG5vZGVUeXBlID09PSAnY29tbWVudCcgKSB7XG5cdFx0XHRcdHJlc3VsdEh0bWwucHVzaCggbm9kZVRleHQgKTsgIC8vIGFwcGVuZCBIVE1MIGVudGl0eSBub2RlcyAoc3VjaCBhcyAnJm5ic3A7Jykgb3IgSFRNTCBjb21tZW50cyAoc3VjaCBhcyAnPCEtLSBDb21tZW50IC0tPicpIHZlcmJhdGltXG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIFByb2Nlc3MgdGV4dCBub2RlcyBpbiB0aGUgaW5wdXQgYHRleHRPckh0bWxgXG5cdFx0XHRcdGlmKCBhbmNob3JUYWdTdGFja0NvdW50ID09PSAwICkge1xuXHRcdFx0XHRcdC8vIElmIHdlJ3JlIG5vdCB3aXRoaW4gYW4gPGE+IHRhZywgcHJvY2VzcyB0aGUgdGV4dCBub2RlIHRvIGxpbmtpZnlcblx0XHRcdFx0XHR2YXIgbGlua2lmaWVkU3RyID0gdGhpcy5saW5raWZ5U3RyKCBub2RlVGV4dCApO1xuXHRcdFx0XHRcdHJlc3VsdEh0bWwucHVzaCggbGlua2lmaWVkU3RyICk7XG5cblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyBgdGV4dGAgaXMgd2l0aGluIGFuIDxhPiB0YWcsIHNpbXBseSBhcHBlbmQgdGhlIHRleHQgLSB3ZSBkbyBub3Qgd2FudCB0byBhdXRvbGluayBhbnl0aGluZ1xuXHRcdFx0XHRcdC8vIGFscmVhZHkgd2l0aGluIGFuIDxhPi4uLjwvYT4gdGFnXG5cdFx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBub2RlVGV4dCApO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHJlc3VsdEh0bWwuam9pbiggXCJcIiApO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBQcm9jZXNzIHRoZSB0ZXh0IHRoYXQgbGllcyBpbiBiZXR3ZWVuIEhUTUwgdGFncywgcGVyZm9ybWluZyB0aGUgYW5jaG9yXG5cdCAqIHRhZyByZXBsYWNlbWVudHMgZm9yIHRoZSBtYXRjaGVzLCBhbmQgcmV0dXJucyB0aGUgc3RyaW5nIHdpdGggdGhlXG5cdCAqIHJlcGxhY2VtZW50cyBtYWRlLlxuXHQgKlxuXHQgKiBUaGlzIG1ldGhvZCBkb2VzIHRoZSBhY3R1YWwgd3JhcHBpbmcgb2YgbWF0Y2hlcyB3aXRoIGFuY2hvciB0YWdzLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgb2YgdGV4dCB0byBhdXRvLWxpbmsuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHRleHQgd2l0aCBhbmNob3IgdGFncyBhdXRvLWZpbGxlZC5cblx0ICovXG5cdGxpbmtpZnlTdHIgOiBmdW5jdGlvbiggc3RyICkge1xuXHRcdHJldHVybiB0aGlzLmdldE1hdGNoUGFyc2VyKCkucmVwbGFjZSggc3RyLCB0aGlzLmNyZWF0ZU1hdGNoUmV0dXJuVmFsLCB0aGlzICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGUgcmV0dXJuIHN0cmluZyB2YWx1ZSBmb3IgYSBnaXZlbiBtYXRjaCBpbiB0aGUgaW5wdXQgc3RyaW5nLFxuXHQgKiBmb3IgdGhlIHtAbGluayAjbGlua2lmeVN0cn0gbWV0aG9kLlxuXHQgKlxuXHQgKiBUaGlzIG1ldGhvZCBoYW5kbGVzIHRoZSB7QGxpbmsgI3JlcGxhY2VGbn0sIGlmIG9uZSB3YXMgcHJvdmlkZWQuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7QXV0b2xpbmtlci5tYXRjaC5NYXRjaH0gbWF0Y2ggVGhlIE1hdGNoIG9iamVjdCB0aGF0IHJlcHJlc2VudHMgdGhlIG1hdGNoLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBzdHJpbmcgdGhhdCB0aGUgYG1hdGNoYCBzaG91bGQgYmUgcmVwbGFjZWQgd2l0aC4gVGhpcyBpcyB1c3VhbGx5IHRoZSBhbmNob3IgdGFnIHN0cmluZywgYnV0XG5cdCAqICAgbWF5IGJlIHRoZSBgbWF0Y2hTdHJgIGl0c2VsZiBpZiB0aGUgbWF0Y2ggaXMgbm90IHRvIGJlIHJlcGxhY2VkLlxuXHQgKi9cblx0Y3JlYXRlTWF0Y2hSZXR1cm5WYWwgOiBmdW5jdGlvbiggbWF0Y2ggKSB7XG5cdFx0Ly8gSGFuZGxlIGEgY3VzdG9tIGByZXBsYWNlRm5gIGJlaW5nIHByb3ZpZGVkXG5cdFx0dmFyIHJlcGxhY2VGblJlc3VsdDtcblx0XHRpZiggdGhpcy5yZXBsYWNlRm4gKSB7XG5cdFx0XHRyZXBsYWNlRm5SZXN1bHQgPSB0aGlzLnJlcGxhY2VGbi5jYWxsKCB0aGlzLCB0aGlzLCBtYXRjaCApOyAgLy8gQXV0b2xpbmtlciBpbnN0YW5jZSBpcyB0aGUgY29udGV4dCwgYW5kIHRoZSBmaXJzdCBhcmdcblx0XHR9XG5cblx0XHRpZiggdHlwZW9mIHJlcGxhY2VGblJlc3VsdCA9PT0gJ3N0cmluZycgKSB7XG5cdFx0XHRyZXR1cm4gcmVwbGFjZUZuUmVzdWx0OyAgLy8gYHJlcGxhY2VGbmAgcmV0dXJuZWQgYSBzdHJpbmcsIHVzZSB0aGF0XG5cblx0XHR9IGVsc2UgaWYoIHJlcGxhY2VGblJlc3VsdCA9PT0gZmFsc2UgKSB7XG5cdFx0XHRyZXR1cm4gbWF0Y2guZ2V0TWF0Y2hlZFRleHQoKTsgIC8vIG5vIHJlcGxhY2VtZW50IGZvciB0aGUgbWF0Y2hcblxuXHRcdH0gZWxzZSBpZiggcmVwbGFjZUZuUmVzdWx0IGluc3RhbmNlb2YgQXV0b2xpbmtlci5IdG1sVGFnICkge1xuXHRcdFx0cmV0dXJuIHJlcGxhY2VGblJlc3VsdC50b0FuY2hvclN0cmluZygpO1xuXG5cdFx0fSBlbHNlIHsgIC8vIHJlcGxhY2VGblJlc3VsdCA9PT0gdHJ1ZSwgb3Igbm8vdW5rbm93biByZXR1cm4gdmFsdWUgZnJvbSBmdW5jdGlvblxuXHRcdFx0Ly8gUGVyZm9ybSBBdXRvbGlua2VyJ3MgZGVmYXVsdCBhbmNob3IgdGFnIGdlbmVyYXRpb25cblx0XHRcdHZhciB0YWdCdWlsZGVyID0gdGhpcy5nZXRUYWdCdWlsZGVyKCksXG5cdFx0XHQgICAgYW5jaG9yVGFnID0gdGFnQnVpbGRlci5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4gQXV0b2xpbmtlci5IdG1sVGFnIGluc3RhbmNlXG5cblx0XHRcdHJldHVybiBhbmNob3JUYWcudG9BbmNob3JTdHJpbmcoKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvKipcblx0ICogTGF6aWx5IGluc3RhbnRpYXRlcyBhbmQgcmV0dXJucyB0aGUge0BsaW5rICNodG1sUGFyc2VyfSBpbnN0YW5jZSBmb3IgdGhpcyBBdXRvbGlua2VyIGluc3RhbmNlLlxuXHQgKlxuXHQgKiBAcHJvdGVjdGVkXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfVxuXHQgKi9cblx0Z2V0SHRtbFBhcnNlciA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBodG1sUGFyc2VyID0gdGhpcy5odG1sUGFyc2VyO1xuXG5cdFx0aWYoICFodG1sUGFyc2VyICkge1xuXHRcdFx0aHRtbFBhcnNlciA9IHRoaXMuaHRtbFBhcnNlciA9IG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcigpO1xuXHRcdH1cblxuXHRcdHJldHVybiBodG1sUGFyc2VyO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIExhemlseSBpbnN0YW50aWF0ZXMgYW5kIHJldHVybnMgdGhlIHtAbGluayAjbWF0Y2hQYXJzZXJ9IGluc3RhbmNlIGZvciB0aGlzIEF1dG9saW5rZXIgaW5zdGFuY2UuXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlcn1cblx0ICovXG5cdGdldE1hdGNoUGFyc2VyIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIG1hdGNoUGFyc2VyID0gdGhpcy5tYXRjaFBhcnNlcjtcblxuXHRcdGlmKCAhbWF0Y2hQYXJzZXIgKSB7XG5cdFx0XHRtYXRjaFBhcnNlciA9IHRoaXMubWF0Y2hQYXJzZXIgPSBuZXcgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlcigge1xuXHRcdFx0XHR1cmxzICAgICAgICA6IHRoaXMudXJscyxcblx0XHRcdFx0ZW1haWwgICAgICAgOiB0aGlzLmVtYWlsLFxuXHRcdFx0XHR0d2l0dGVyICAgICA6IHRoaXMudHdpdHRlcixcblx0XHRcdFx0cGhvbmUgICAgICAgOiB0aGlzLnBob25lLFxuXHRcdFx0XHRoYXNodGFnICAgICA6IHRoaXMuaGFzaHRhZyxcblx0XHRcdFx0c3RyaXBQcmVmaXggOiB0aGlzLnN0cmlwUHJlZml4XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG1hdGNoUGFyc2VyO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHtAbGluayAjdGFnQnVpbGRlcn0gaW5zdGFuY2UgZm9yIHRoaXMgQXV0b2xpbmtlciBpbnN0YW5jZSwgbGF6aWx5IGluc3RhbnRpYXRpbmcgaXRcblx0ICogaWYgaXQgZG9lcyBub3QgeWV0IGV4aXN0LlxuXHQgKlxuXHQgKiBUaGlzIG1ldGhvZCBtYXkgYmUgdXNlZCBpbiBhIHtAbGluayAjcmVwbGFjZUZufSB0byBnZW5lcmF0ZSB0aGUge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZyBIdG1sVGFnfSBpbnN0YW5jZSB0aGF0XG5cdCAqIEF1dG9saW5rZXIgd291bGQgbm9ybWFsbHkgZ2VuZXJhdGUsIGFuZCB0aGVuIGFsbG93IGZvciBtb2RpZmljYXRpb25zIGJlZm9yZSByZXR1cm5pbmcgaXQuIEZvciBleGFtcGxlOlxuXHQgKlxuXHQgKiAgICAgdmFyIGh0bWwgPSBBdXRvbGlua2VyLmxpbmsoIFwiVGVzdCBnb29nbGUuY29tXCIsIHtcblx0ICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG5cdCAqICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4ge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZ30gaW5zdGFuY2Vcblx0ICogICAgICAgICAgICAgdGFnLnNldEF0dHIoICdyZWwnLCAnbm9mb2xsb3cnICk7XG5cdCAqXG5cdCAqICAgICAgICAgICAgIHJldHVybiB0YWc7XG5cdCAqICAgICAgICAgfVxuXHQgKiAgICAgfSApO1xuXHQgKlxuXHQgKiAgICAgLy8gZ2VuZXJhdGVkIGh0bWw6XG5cdCAqICAgICAvLyAgIFRlc3QgPGEgaHJlZj1cImh0dHA6Ly9nb29nbGUuY29tXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9mb2xsb3dcIj5nb29nbGUuY29tPC9hPlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkFuY2hvclRhZ0J1aWxkZXJ9XG5cdCAqL1xuXHRnZXRUYWdCdWlsZGVyIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRhZ0J1aWxkZXIgPSB0aGlzLnRhZ0J1aWxkZXI7XG5cblx0XHRpZiggIXRhZ0J1aWxkZXIgKSB7XG5cdFx0XHR0YWdCdWlsZGVyID0gdGhpcy50YWdCdWlsZGVyID0gbmV3IEF1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlcigge1xuXHRcdFx0XHRuZXdXaW5kb3cgICA6IHRoaXMubmV3V2luZG93LFxuXHRcdFx0XHR0cnVuY2F0ZSAgICA6IHRoaXMudHJ1bmNhdGUsXG5cdFx0XHRcdGNsYXNzTmFtZSAgIDogdGhpcy5jbGFzc05hbWVcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdGFnQnVpbGRlcjtcblx0fVxuXG59O1xuXG5cbi8qKlxuICogQXV0b21hdGljYWxseSBsaW5rcyBVUkxzLCBFbWFpbCBhZGRyZXNzZXMsIFBob25lIE51bWJlcnMsIFR3aXR0ZXIgaGFuZGxlcyxcbiAqIGFuZCBIYXNodGFncyBmb3VuZCBpbiB0aGUgZ2l2ZW4gY2h1bmsgb2YgSFRNTC4gRG9lcyBub3QgbGluayBVUkxzIGZvdW5kXG4gKiB3aXRoaW4gSFRNTCB0YWdzLlxuICpcbiAqIEZvciBpbnN0YW5jZSwgaWYgZ2l2ZW4gdGhlIHRleHQ6IGBZb3Ugc2hvdWxkIGdvIHRvIGh0dHA6Ly93d3cueWFob28uY29tYCxcbiAqIHRoZW4gdGhlIHJlc3VsdCB3aWxsIGJlIGBZb3Ugc2hvdWxkIGdvIHRvICZsdDthIGhyZWY9XCJodHRwOi8vd3d3LnlhaG9vLmNvbVwiJmd0O2h0dHA6Ly93d3cueWFob28uY29tJmx0Oy9hJmd0O2BcbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqICAgICB2YXIgbGlua2VkVGV4dCA9IEF1dG9saW5rZXIubGluayggXCJHbyB0byBnb29nbGUuY29tXCIsIHsgbmV3V2luZG93OiBmYWxzZSB9ICk7XG4gKiAgICAgLy8gUHJvZHVjZXM6IFwiR28gdG8gPGEgaHJlZj1cImh0dHA6Ly9nb29nbGUuY29tXCI+Z29vZ2xlLmNvbTwvYT5cIlxuICpcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0T3JIdG1sIFRoZSBIVE1MIG9yIHRleHQgdG8gZmluZCBtYXRjaGVzIHdpdGhpbiAoZGVwZW5kaW5nXG4gKiAgIG9uIGlmIHRoZSB7QGxpbmsgI3VybHN9LCB7QGxpbmsgI2VtYWlsfSwge0BsaW5rICNwaG9uZX0sIHtAbGluayAjdHdpdHRlcn0sXG4gKiAgIGFuZCB7QGxpbmsgI2hhc2h0YWd9IG9wdGlvbnMgYXJlIGVuYWJsZWQpLlxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBBbnkgb2YgdGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEF1dG9saW5rZXJcbiAqICAgY2xhc3MsIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuIFNlZSB0aGUgY2xhc3MgZGVzY3JpcHRpb24gZm9yIGFuXG4gKiAgIGV4YW1wbGUgY2FsbC5cbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIEhUTUwgdGV4dCwgd2l0aCBtYXRjaGVzIGF1dG9tYXRpY2FsbHkgbGlua2VkLlxuICovXG5BdXRvbGlua2VyLmxpbmsgPSBmdW5jdGlvbiggdGV4dE9ySHRtbCwgb3B0aW9ucyApIHtcblx0dmFyIGF1dG9saW5rZXIgPSBuZXcgQXV0b2xpbmtlciggb3B0aW9ucyApO1xuXHRyZXR1cm4gYXV0b2xpbmtlci5saW5rKCB0ZXh0T3JIdG1sICk7XG59O1xuXG5cbi8vIEF1dG9saW5rZXIgTmFtZXNwYWNlc1xuQXV0b2xpbmtlci5tYXRjaCA9IHt9O1xuQXV0b2xpbmtlci5odG1sUGFyc2VyID0ge307XG5BdXRvbGlua2VyLm1hdGNoUGFyc2VyID0ge307XG5BdXRvbGlua2VyLnRydW5jYXRlID0ge307XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qanNoaW50IGVxbnVsbDp0cnVlLCBib3NzOnRydWUgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuVXRpbFxuICogQHNpbmdsZXRvblxuICpcbiAqIEEgZmV3IHV0aWxpdHkgbWV0aG9kcyBmb3IgQXV0b2xpbmtlci5cbiAqL1xuQXV0b2xpbmtlci5VdGlsID0ge1xuXG5cdC8qKlxuXHQgKiBAcHJvcGVydHkge0Z1bmN0aW9ufSBhYnN0cmFjdE1ldGhvZFxuXHQgKlxuXHQgKiBBIGZ1bmN0aW9uIG9iamVjdCB3aGljaCByZXByZXNlbnRzIGFuIGFic3RyYWN0IG1ldGhvZC5cblx0ICovXG5cdGFic3RyYWN0TWV0aG9kIDogZnVuY3Rpb24oKSB7IHRocm93IFwiYWJzdHJhY3RcIjsgfSxcblxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gdHJpbVJlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byB0cmltIHRoZSBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlXG5cdCAqIGZyb20gYSBzdHJpbmcuXG5cdCAqL1xuXHR0cmltUmVnZXggOiAvXltcXHNcXHVGRUZGXFx4QTBdK3xbXFxzXFx1RkVGRlxceEEwXSskL2csXG5cblxuXHQvKipcblx0ICogQXNzaWducyAoc2hhbGxvdyBjb3BpZXMpIHRoZSBwcm9wZXJ0aWVzIG9mIGBzcmNgIG9udG8gYGRlc3RgLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGVzdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuXHQgKiBAcGFyYW0ge09iamVjdH0gc3JjIFRoZSBzb3VyY2Ugb2JqZWN0LlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QgKGBkZXN0YClcblx0ICovXG5cdGFzc2lnbiA6IGZ1bmN0aW9uKCBkZXN0LCBzcmMgKSB7XG5cdFx0Zm9yKCB2YXIgcHJvcCBpbiBzcmMgKSB7XG5cdFx0XHRpZiggc3JjLmhhc093blByb3BlcnR5KCBwcm9wICkgKSB7XG5cdFx0XHRcdGRlc3RbIHByb3AgXSA9IHNyY1sgcHJvcCBdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBkZXN0O1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEFzc2lnbnMgKHNoYWxsb3cgY29waWVzKSB0aGUgcHJvcGVydGllcyBvZiBgc3JjYCBvbnRvIGBkZXN0YCwgaWYgdGhlXG5cdCAqIGNvcnJlc3BvbmRpbmcgcHJvcGVydHkgb24gYGRlc3RgID09PSBgdW5kZWZpbmVkYC5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3R9IGRlc3QgVGhlIGRlc3RpbmF0aW9uIG9iamVjdC5cblx0ICogQHBhcmFtIHtPYmplY3R9IHNyYyBUaGUgc291cmNlIG9iamVjdC5cblx0ICogQHJldHVybiB7T2JqZWN0fSBUaGUgZGVzdGluYXRpb24gb2JqZWN0IChgZGVzdGApXG5cdCAqL1xuXHRkZWZhdWx0cyA6IGZ1bmN0aW9uKCBkZXN0LCBzcmMgKSB7XG5cdFx0Zm9yKCB2YXIgcHJvcCBpbiBzcmMgKSB7XG5cdFx0XHRpZiggc3JjLmhhc093blByb3BlcnR5KCBwcm9wICkgJiYgZGVzdFsgcHJvcCBdID09PSB1bmRlZmluZWQgKSB7XG5cdFx0XHRcdGRlc3RbIHByb3AgXSA9IHNyY1sgcHJvcCBdO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBkZXN0O1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEV4dGVuZHMgYHN1cGVyY2xhc3NgIHRvIGNyZWF0ZSBhIG5ldyBzdWJjbGFzcywgYWRkaW5nIHRoZSBgcHJvdG9Qcm9wc2AgdG8gdGhlIG5ldyBzdWJjbGFzcydzIHByb3RvdHlwZS5cblx0ICpcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gc3VwZXJjbGFzcyBUaGUgY29uc3RydWN0b3IgZnVuY3Rpb24gZm9yIHRoZSBzdXBlcmNsYXNzLlxuXHQgKiBAcGFyYW0ge09iamVjdH0gcHJvdG9Qcm9wcyBUaGUgbWV0aG9kcy9wcm9wZXJ0aWVzIHRvIGFkZCB0byB0aGUgc3ViY2xhc3MncyBwcm90b3R5cGUuIFRoaXMgbWF5IGNvbnRhaW4gdGhlXG5cdCAqICAgc3BlY2lhbCBwcm9wZXJ0eSBgY29uc3RydWN0b3JgLCB3aGljaCB3aWxsIGJlIHVzZWQgYXMgdGhlIG5ldyBzdWJjbGFzcydzIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLlxuXHQgKiBAcmV0dXJuIHtGdW5jdGlvbn0gVGhlIG5ldyBzdWJjbGFzcyBmdW5jdGlvbi5cblx0ICovXG5cdGV4dGVuZCA6IGZ1bmN0aW9uKCBzdXBlcmNsYXNzLCBwcm90b1Byb3BzICkge1xuXHRcdHZhciBzdXBlcmNsYXNzUHJvdG8gPSBzdXBlcmNsYXNzLnByb3RvdHlwZTtcblxuXHRcdHZhciBGID0gZnVuY3Rpb24oKSB7fTtcblx0XHRGLnByb3RvdHlwZSA9IHN1cGVyY2xhc3NQcm90bztcblxuXHRcdHZhciBzdWJjbGFzcztcblx0XHRpZiggcHJvdG9Qcm9wcy5oYXNPd25Qcm9wZXJ0eSggJ2NvbnN0cnVjdG9yJyApICkge1xuXHRcdFx0c3ViY2xhc3MgPSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdWJjbGFzcyA9IGZ1bmN0aW9uKCkgeyBzdXBlcmNsYXNzUHJvdG8uY29uc3RydWN0b3IuYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApOyB9O1xuXHRcdH1cblxuXHRcdHZhciBzdWJjbGFzc1Byb3RvID0gc3ViY2xhc3MucHJvdG90eXBlID0gbmV3IEYoKTsgIC8vIHNldCB1cCBwcm90b3R5cGUgY2hhaW5cblx0XHRzdWJjbGFzc1Byb3RvLmNvbnN0cnVjdG9yID0gc3ViY2xhc3M7ICAvLyBmaXggY29uc3RydWN0b3IgcHJvcGVydHlcblx0XHRzdWJjbGFzc1Byb3RvLnN1cGVyY2xhc3MgPSBzdXBlcmNsYXNzUHJvdG87XG5cblx0XHRkZWxldGUgcHJvdG9Qcm9wcy5jb25zdHJ1Y3RvcjsgIC8vIGRvbid0IHJlLWFzc2lnbiBjb25zdHJ1Y3RvciBwcm9wZXJ0eSB0byB0aGUgcHJvdG90eXBlLCBzaW5jZSBhIG5ldyBmdW5jdGlvbiBtYXkgaGF2ZSBiZWVuIGNyZWF0ZWQgKGBzdWJjbGFzc2ApLCB3aGljaCBpcyBub3cgYWxyZWFkeSB0aGVyZVxuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHN1YmNsYXNzUHJvdG8sIHByb3RvUHJvcHMgKTtcblxuXHRcdHJldHVybiBzdWJjbGFzcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBUcnVuY2F0ZXMgdGhlIGBzdHJgIGF0IGBsZW4gLSBlbGxpcHNpc0NoYXJzLmxlbmd0aGAsIGFuZCBhZGRzIHRoZSBgZWxsaXBzaXNDaGFyc2AgdG8gdGhlXG5cdCAqIGVuZCBvZiB0aGUgc3RyaW5nIChieSBkZWZhdWx0LCB0d28gcGVyaW9kczogJy4uJykuIElmIHRoZSBgc3RyYCBsZW5ndGggZG9lcyBub3QgZXhjZWVkXG5cdCAqIGBsZW5gLCB0aGUgc3RyaW5nIHdpbGwgYmUgcmV0dXJuZWQgdW5jaGFuZ2VkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gdHJ1bmNhdGUgYW5kIGFkZCBhbiBlbGxpcHNpcyB0by5cblx0ICogQHBhcmFtIHtOdW1iZXJ9IHRydW5jYXRlTGVuIFRoZSBsZW5ndGggdG8gdHJ1bmNhdGUgdGhlIHN0cmluZyBhdC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IFtlbGxpcHNpc0NoYXJzPS4uXSBUaGUgZWxsaXBzaXMgY2hhcmFjdGVyKHMpIHRvIGFkZCB0byB0aGUgZW5kIG9mIGBzdHJgXG5cdCAqICAgd2hlbiB0cnVuY2F0ZWQuIERlZmF1bHRzIHRvICcuLidcblx0ICovXG5cdGVsbGlwc2lzIDogZnVuY3Rpb24oIHN0ciwgdHJ1bmNhdGVMZW4sIGVsbGlwc2lzQ2hhcnMgKSB7XG5cdFx0aWYoIHN0ci5sZW5ndGggPiB0cnVuY2F0ZUxlbiApIHtcblx0XHRcdGVsbGlwc2lzQ2hhcnMgPSAoIGVsbGlwc2lzQ2hhcnMgPT0gbnVsbCApID8gJy4uJyA6IGVsbGlwc2lzQ2hhcnM7XG5cdFx0XHRzdHIgPSBzdHIuc3Vic3RyaW5nKCAwLCB0cnVuY2F0ZUxlbiAtIGVsbGlwc2lzQ2hhcnMubGVuZ3RoICkgKyBlbGxpcHNpc0NoYXJzO1xuXHRcdH1cblx0XHRyZXR1cm4gc3RyO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFN1cHBvcnRzIGBBcnJheS5wcm90b3R5cGUuaW5kZXhPZigpYCBmdW5jdGlvbmFsaXR5IGZvciBvbGQgSUUgKElFOCBhbmQgYmVsb3cpLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0FycmF5fSBhcnIgVGhlIGFycmF5IHRvIGZpbmQgYW4gZWxlbWVudCBvZi5cblx0ICogQHBhcmFtIHsqfSBlbGVtZW50IFRoZSBlbGVtZW50IHRvIGZpbmQgaW4gdGhlIGFycmF5LCBhbmQgcmV0dXJuIHRoZSBpbmRleCBvZi5cblx0ICogQHJldHVybiB7TnVtYmVyfSBUaGUgaW5kZXggb2YgdGhlIGBlbGVtZW50YCwgb3IgLTEgaWYgaXQgd2FzIG5vdCBmb3VuZC5cblx0ICovXG5cdGluZGV4T2YgOiBmdW5jdGlvbiggYXJyLCBlbGVtZW50ICkge1xuXHRcdGlmKCBBcnJheS5wcm90b3R5cGUuaW5kZXhPZiApIHtcblx0XHRcdHJldHVybiBhcnIuaW5kZXhPZiggZWxlbWVudCApO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciggdmFyIGkgPSAwLCBsZW4gPSBhcnIubGVuZ3RoOyBpIDwgbGVuOyBpKysgKSB7XG5cdFx0XHRcdGlmKCBhcnJbIGkgXSA9PT0gZWxlbWVudCApIHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIC0xO1xuXHRcdH1cblx0fSxcblxuXG5cblx0LyoqXG5cdCAqIFBlcmZvcm1zIHRoZSBmdW5jdGlvbmFsaXR5IG9mIHdoYXQgbW9kZXJuIGJyb3dzZXJzIGRvIHdoZW4gYFN0cmluZy5wcm90b3R5cGUuc3BsaXQoKWAgaXMgY2FsbGVkXG5cdCAqIHdpdGggYSByZWd1bGFyIGV4cHJlc3Npb24gdGhhdCBjb250YWlucyBjYXB0dXJpbmcgcGFyZW50aGVzaXMuXG5cdCAqXG5cdCAqIEZvciBleGFtcGxlOlxuXHQgKlxuXHQgKiAgICAgLy8gTW9kZXJuIGJyb3dzZXJzOlxuXHQgKiAgICAgXCJhLGIsY1wiLnNwbGl0KCAvKCwpLyApOyAgLy8gLS0+IFsgJ2EnLCAnLCcsICdiJywgJywnLCAnYycgXVxuXHQgKlxuXHQgKiAgICAgLy8gT2xkIElFIChpbmNsdWRpbmcgSUU4KTpcblx0ICogICAgIFwiYSxiLGNcIi5zcGxpdCggLygsKS8gKTsgIC8vIC0tPiBbICdhJywgJ2InLCAnYycgXVxuXHQgKlxuXHQgKiBUaGlzIG1ldGhvZCBlbXVsYXRlcyB0aGUgZnVuY3Rpb25hbGl0eSBvZiBtb2Rlcm4gYnJvd3NlcnMgZm9yIHRoZSBvbGQgSUUgY2FzZS5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIHNwbGl0LlxuXHQgKiBAcGFyYW0ge1JlZ0V4cH0gc3BsaXRSZWdleCBUaGUgcmVndWxhciBleHByZXNzaW9uIHRvIHNwbGl0IHRoZSBpbnB1dCBgc3RyYCBvbi4gVGhlIHNwbGl0dGluZ1xuXHQgKiAgIGNoYXJhY3RlcihzKSB3aWxsIGJlIHNwbGljZWQgaW50byB0aGUgYXJyYXksIGFzIGluIHRoZSBcIm1vZGVybiBicm93c2Vyc1wiIGV4YW1wbGUgaW4gdGhlXG5cdCAqICAgZGVzY3JpcHRpb24gb2YgdGhpcyBtZXRob2QuXG5cdCAqICAgTm90ZSAjMTogdGhlIHN1cHBsaWVkIHJlZ3VsYXIgZXhwcmVzc2lvbiAqKm11c3QqKiBoYXZlIHRoZSAnZycgZmxhZyBzcGVjaWZpZWQuXG5cdCAqICAgTm90ZSAjMjogZm9yIHNpbXBsaWNpdHkncyBzYWtlLCB0aGUgcmVndWxhciBleHByZXNzaW9uIGRvZXMgbm90IG5lZWRcblx0ICogICB0byBjb250YWluIGNhcHR1cmluZyBwYXJlbnRoZXNpcyAtIGl0IHdpbGwgYmUgYXNzdW1lZCB0aGF0IGFueSBtYXRjaCBoYXMgdGhlbS5cblx0ICogQHJldHVybiB7U3RyaW5nW119IFRoZSBzcGxpdCBhcnJheSBvZiBzdHJpbmdzLCB3aXRoIHRoZSBzcGxpdHRpbmcgY2hhcmFjdGVyKHMpIGluY2x1ZGVkLlxuXHQgKi9cblx0c3BsaXRBbmRDYXB0dXJlIDogZnVuY3Rpb24oIHN0ciwgc3BsaXRSZWdleCApIHtcblx0XHRpZiggIXNwbGl0UmVnZXguZ2xvYmFsICkgdGhyb3cgbmV3IEVycm9yKCBcImBzcGxpdFJlZ2V4YCBtdXN0IGhhdmUgdGhlICdnJyBmbGFnIHNldFwiICk7XG5cblx0XHR2YXIgcmVzdWx0ID0gW10sXG5cdFx0ICAgIGxhc3RJZHggPSAwLFxuXHRcdCAgICBtYXRjaDtcblxuXHRcdHdoaWxlKCBtYXRjaCA9IHNwbGl0UmVnZXguZXhlYyggc3RyICkgKSB7XG5cdFx0XHRyZXN1bHQucHVzaCggc3RyLnN1YnN0cmluZyggbGFzdElkeCwgbWF0Y2guaW5kZXggKSApO1xuXHRcdFx0cmVzdWx0LnB1c2goIG1hdGNoWyAwIF0gKTsgIC8vIHB1c2ggdGhlIHNwbGl0dGluZyBjaGFyKHMpXG5cblx0XHRcdGxhc3RJZHggPSBtYXRjaC5pbmRleCArIG1hdGNoWyAwIF0ubGVuZ3RoO1xuXHRcdH1cblx0XHRyZXN1bHQucHVzaCggc3RyLnN1YnN0cmluZyggbGFzdElkeCApICk7XG5cblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFRyaW1zIHRoZSBsZWFkaW5nIGFuZCB0cmFpbGluZyB3aGl0ZXNwYWNlIGZyb20gYSBzdHJpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byB0cmltLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHR0cmltIDogZnVuY3Rpb24oIHN0ciApIHtcblx0XHRyZXR1cm4gc3RyLnJlcGxhY2UoIHRoaXMudHJpbVJlZ2V4LCAnJyApO1xuXHR9XG5cbn07XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKmpzaGludCBib3NzOnRydWUgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuSHRtbFRhZ1xuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogUmVwcmVzZW50cyBhbiBIVE1MIHRhZywgd2hpY2ggY2FuIGJlIHVzZWQgdG8gZWFzaWx5IGJ1aWxkL21vZGlmeSBIVE1MIHRhZ3MgcHJvZ3JhbW1hdGljYWxseS5cbiAqXG4gKiBBdXRvbGlua2VyIHVzZXMgdGhpcyBhYnN0cmFjdGlvbiB0byBjcmVhdGUgSFRNTCB0YWdzLCBhbmQgdGhlbiB3cml0ZSB0aGVtIG91dCBhcyBzdHJpbmdzLiBZb3UgbWF5IGFsc28gdXNlXG4gKiB0aGlzIGNsYXNzIGluIHlvdXIgY29kZSwgZXNwZWNpYWxseSB3aXRoaW4gYSB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufS5cbiAqXG4gKiAjIyBFeGFtcGxlc1xuICpcbiAqIEV4YW1wbGUgaW5zdGFudGlhdGlvbjpcbiAqXG4gKiAgICAgdmFyIHRhZyA9IG5ldyBBdXRvbGlua2VyLkh0bWxUYWcoIHtcbiAqICAgICAgICAgdGFnTmFtZSA6ICdhJyxcbiAqICAgICAgICAgYXR0cnMgICA6IHsgJ2hyZWYnOiAnaHR0cDovL2dvb2dsZS5jb20nLCAnY2xhc3MnOiAnZXh0ZXJuYWwtbGluaycgfSxcbiAqICAgICAgICAgaW5uZXJIdG1sIDogJ0dvb2dsZSdcbiAqICAgICB9ICk7XG4gKlxuICogICAgIHRhZy50b0FuY2hvclN0cmluZygpOyAgLy8gPGEgaHJlZj1cImh0dHA6Ly9nb29nbGUuY29tXCIgY2xhc3M9XCJleHRlcm5hbC1saW5rXCI+R29vZ2xlPC9hPlxuICpcbiAqICAgICAvLyBJbmRpdmlkdWFsIGFjY2Vzc29yIG1ldGhvZHNcbiAqICAgICB0YWcuZ2V0VGFnTmFtZSgpOyAgICAgICAgICAgICAgICAgLy8gJ2EnXG4gKiAgICAgdGFnLmdldEF0dHIoICdocmVmJyApOyAgICAgICAgICAgIC8vICdodHRwOi8vZ29vZ2xlLmNvbSdcbiAqICAgICB0YWcuaGFzQ2xhc3MoICdleHRlcm5hbC1saW5rJyApOyAgLy8gdHJ1ZVxuICpcbiAqXG4gKiBVc2luZyBtdXRhdG9yIG1ldGhvZHMgKHdoaWNoIG1heSBiZSB1c2VkIGluIGNvbWJpbmF0aW9uIHdpdGggaW5zdGFudGlhdGlvbiBjb25maWcgcHJvcGVydGllcyk6XG4gKlxuICogICAgIHZhciB0YWcgPSBuZXcgQXV0b2xpbmtlci5IdG1sVGFnKCk7XG4gKiAgICAgdGFnLnNldFRhZ05hbWUoICdhJyApO1xuICogICAgIHRhZy5zZXRBdHRyKCAnaHJlZicsICdodHRwOi8vZ29vZ2xlLmNvbScgKTtcbiAqICAgICB0YWcuYWRkQ2xhc3MoICdleHRlcm5hbC1saW5rJyApO1xuICogICAgIHRhZy5zZXRJbm5lckh0bWwoICdHb29nbGUnICk7XG4gKlxuICogICAgIHRhZy5nZXRUYWdOYW1lKCk7ICAgICAgICAgICAgICAgICAvLyAnYSdcbiAqICAgICB0YWcuZ2V0QXR0ciggJ2hyZWYnICk7ICAgICAgICAgICAgLy8gJ2h0dHA6Ly9nb29nbGUuY29tJ1xuICogICAgIHRhZy5oYXNDbGFzcyggJ2V4dGVybmFsLWxpbmsnICk7ICAvLyB0cnVlXG4gKlxuICogICAgIHRhZy50b0FuY2hvclN0cmluZygpOyAgLy8gPGEgaHJlZj1cImh0dHA6Ly9nb29nbGUuY29tXCIgY2xhc3M9XCJleHRlcm5hbC1saW5rXCI+R29vZ2xlPC9hPlxuICpcbiAqXG4gKiAjIyBFeGFtcGxlIHVzZSB3aXRoaW4gYSB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufVxuICpcbiAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJUZXN0IGdvb2dsZS5jb21cIiwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICB2YXIgdGFnID0gYXV0b2xpbmtlci5nZXRUYWdCdWlsZGVyKCkuYnVpbGQoIG1hdGNoICk7ICAvLyByZXR1cm5zIGFuIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWd9IGluc3RhbmNlLCBjb25maWd1cmVkIHdpdGggdGhlIE1hdGNoJ3MgaHJlZiBhbmQgYW5jaG9yIHRleHRcbiAqICAgICAgICAgICAgIHRhZy5zZXRBdHRyKCAncmVsJywgJ25vZm9sbG93JyApO1xuICpcbiAqICAgICAgICAgICAgIHJldHVybiB0YWc7XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKlxuICogICAgIC8vIGdlbmVyYXRlZCBodG1sOlxuICogICAgIC8vICAgVGVzdCA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub2ZvbGxvd1wiPmdvb2dsZS5jb208L2E+XG4gKlxuICpcbiAqICMjIEV4YW1wbGUgdXNlIHdpdGggYSBuZXcgdGFnIGZvciB0aGUgcmVwbGFjZW1lbnRcbiAqXG4gKiAgICAgdmFyIGh0bWwgPSBBdXRvbGlua2VyLmxpbmsoIFwiVGVzdCBnb29nbGUuY29tXCIsIHtcbiAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuICogICAgICAgICAgICAgdmFyIHRhZyA9IG5ldyBBdXRvbGlua2VyLkh0bWxUYWcoIHtcbiAqICAgICAgICAgICAgICAgICB0YWdOYW1lIDogJ2J1dHRvbicsXG4gKiAgICAgICAgICAgICAgICAgYXR0cnMgICA6IHsgJ3RpdGxlJzogJ0xvYWQgVVJMOiAnICsgbWF0Y2guZ2V0QW5jaG9ySHJlZigpIH0sXG4gKiAgICAgICAgICAgICAgICAgaW5uZXJIdG1sIDogJ0xvYWQgVVJMOiAnICsgbWF0Y2guZ2V0QW5jaG9yVGV4dCgpXG4gKiAgICAgICAgICAgICB9ICk7XG4gKlxuICogICAgICAgICAgICAgcmV0dXJuIHRhZztcbiAqICAgICAgICAgfVxuICogICAgIH0gKTtcbiAqXG4gKiAgICAgLy8gZ2VuZXJhdGVkIGh0bWw6XG4gKiAgICAgLy8gICBUZXN0IDxidXR0b24gdGl0bGU9XCJMb2FkIFVSTDogaHR0cDovL2dvb2dsZS5jb21cIj5Mb2FkIFVSTDogZ29vZ2xlLmNvbTwvYnV0dG9uPlxuICovXG5BdXRvbGlua2VyLkh0bWxUYWcgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0YWdOYW1lXG5cdCAqXG5cdCAqIFRoZSB0YWcgbmFtZS4gRXg6ICdhJywgJ2J1dHRvbicsIGV0Yy5cblx0ICpcblx0ICogTm90IHJlcXVpcmVkIGF0IGluc3RhbnRpYXRpb24gdGltZSwgYnV0IHNob3VsZCBiZSBzZXQgdXNpbmcge0BsaW5rICNzZXRUYWdOYW1lfSBiZWZvcmUge0BsaW5rICN0b0FuY2hvclN0cmluZ31cblx0ICogaXMgZXhlY3V0ZWQuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtPYmplY3QuPFN0cmluZywgU3RyaW5nPn0gYXR0cnNcblx0ICpcblx0ICogQW4ga2V5L3ZhbHVlIE9iamVjdCAobWFwKSBvZiBhdHRyaWJ1dGVzIHRvIGNyZWF0ZSB0aGUgdGFnIHdpdGguIFRoZSBrZXlzIGFyZSB0aGUgYXR0cmlidXRlIG5hbWVzLCBhbmQgdGhlXG5cdCAqIHZhbHVlcyBhcmUgdGhlIGF0dHJpYnV0ZSB2YWx1ZXMuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGlubmVySHRtbFxuXHQgKlxuXHQgKiBUaGUgaW5uZXIgSFRNTCBmb3IgdGhlIHRhZy5cblx0ICpcblx0ICogTm90ZSB0aGUgY2FtZWwgY2FzZSBuYW1lIG9uIGBpbm5lckh0bWxgLiBBY3JvbnltcyBhcmUgY2FtZWxDYXNlZCBpbiB0aGlzIHV0aWxpdHkgKHN1Y2ggYXMgbm90IHRvIHJ1biBpbnRvIHRoZSBhY3JvbnltXG5cdCAqIG5hbWluZyBpbmNvbnNpc3RlbmN5IHRoYXQgdGhlIERPTSBkZXZlbG9wZXJzIGNyZWF0ZWQgd2l0aCBgWE1MSHR0cFJlcXVlc3RgKS4gWW91IG1heSBhbHRlcm5hdGl2ZWx5IHVzZSB7QGxpbmsgI2lubmVySFRNTH1cblx0ICogaWYgeW91IHByZWZlciwgYnV0IHRoaXMgb25lIGlzIHJlY29tbWVuZGVkLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBpbm5lckhUTUxcblx0ICpcblx0ICogQWxpYXMgb2Yge0BsaW5rICNpbm5lckh0bWx9LCBhY2NlcHRlZCBmb3IgY29uc2lzdGVuY3kgd2l0aCB0aGUgYnJvd3NlciBET00gYXBpLCBidXQgcHJlZmVyIHRoZSBjYW1lbENhc2VkIHZlcnNpb25cblx0ICogZm9yIGFjcm9ueW0gbmFtZXMuXG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHdoaXRlc3BhY2VSZWdleFxuXHQgKlxuXHQgKiBSZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBtYXRjaCB3aGl0ZXNwYWNlIGluIGEgc3RyaW5nIG9mIENTUyBjbGFzc2VzLlxuXHQgKi9cblx0d2hpdGVzcGFjZVJlZ2V4IDogL1xccysvLFxuXG5cblx0LyoqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge09iamVjdH0gW2NmZ10gVGhlIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcyBmb3IgdGhpcyBjbGFzcywgaW4gYW4gT2JqZWN0IChtYXApXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciA6IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7XG5cblx0XHR0aGlzLmlubmVySHRtbCA9IHRoaXMuaW5uZXJIdG1sIHx8IHRoaXMuaW5uZXJIVE1MOyAgLy8gYWNjZXB0IGVpdGhlciB0aGUgY2FtZWxDYXNlZCBmb3JtIG9yIHRoZSBmdWxseSBjYXBpdGFsaXplZCBhY3JvbnltXG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyB0aGUgdGFnIG5hbWUgdGhhdCB3aWxsIGJlIHVzZWQgdG8gZ2VuZXJhdGUgdGhlIHRhZyB3aXRoLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnTmFtZVxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRzZXRUYWdOYW1lIDogZnVuY3Rpb24oIHRhZ05hbWUgKSB7XG5cdFx0dGhpcy50YWdOYW1lID0gdGFnTmFtZTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIHRhZyBuYW1lLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUYWdOYW1lIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMudGFnTmFtZSB8fCBcIlwiO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFNldHMgYW4gYXR0cmlidXRlIG9uIHRoZSBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYXR0ck5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRvIHNldC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGF0dHJWYWx1ZSBUaGUgYXR0cmlidXRlIHZhbHVlIHRvIHNldC5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0QXR0ciA6IGZ1bmN0aW9uKCBhdHRyTmFtZSwgYXR0clZhbHVlICkge1xuXHRcdHZhciB0YWdBdHRycyA9IHRoaXMuZ2V0QXR0cnMoKTtcblx0XHR0YWdBdHRyc1sgYXR0ck5hbWUgXSA9IGF0dHJWYWx1ZTtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyBhbiBhdHRyaWJ1dGUgZnJvbSB0aGUgSHRtbFRhZy4gSWYgdGhlIGF0dHJpYnV0ZSBkb2VzIG5vdCBleGlzdCwgcmV0dXJucyBgdW5kZWZpbmVkYC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IGF0dHJOYW1lIFRoZSBhdHRyaWJ1dGUgbmFtZSB0byByZXRyaWV2ZS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgYXR0cmlidXRlJ3MgdmFsdWUsIG9yIGB1bmRlZmluZWRgIGlmIGl0IGRvZXMgbm90IGV4aXN0IG9uIHRoZSBIdG1sVGFnLlxuXHQgKi9cblx0Z2V0QXR0ciA6IGZ1bmN0aW9uKCBhdHRyTmFtZSApIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRycygpWyBhdHRyTmFtZSBdO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFNldHMgb25lIG9yIG1vcmUgYXR0cmlidXRlcyBvbiB0aGUgSHRtbFRhZy5cblx0ICpcblx0ICogQHBhcmFtIHtPYmplY3QuPFN0cmluZywgU3RyaW5nPn0gYXR0cnMgQSBrZXkvdmFsdWUgT2JqZWN0IChtYXApIG9mIHRoZSBhdHRyaWJ1dGVzIHRvIHNldC5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0QXR0cnMgOiBmdW5jdGlvbiggYXR0cnMgKSB7XG5cdFx0dmFyIHRhZ0F0dHJzID0gdGhpcy5nZXRBdHRycygpO1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRhZ0F0dHJzLCBhdHRycyApO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBhdHRyaWJ1dGVzIE9iamVjdCAobWFwKSBmb3IgdGhlIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEByZXR1cm4ge09iamVjdC48U3RyaW5nLCBTdHJpbmc+fSBBIGtleS92YWx1ZSBvYmplY3Qgb2YgdGhlIGF0dHJpYnV0ZXMgZm9yIHRoZSBIdG1sVGFnLlxuXHQgKi9cblx0Z2V0QXR0cnMgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5hdHRycyB8fCAoIHRoaXMuYXR0cnMgPSB7fSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIHByb3ZpZGVkIGBjc3NDbGFzc2AsIG92ZXJ3cml0aW5nIGFueSBjdXJyZW50IENTUyBjbGFzc2VzIG9uIHRoZSBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgT25lIG9yIG1vcmUgc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIHRvIHNldCAob3ZlcndyaXRlKS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0Q2xhc3MgOiBmdW5jdGlvbiggY3NzQ2xhc3MgKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2V0QXR0ciggJ2NsYXNzJywgY3NzQ2xhc3MgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gYWRkIG9uZSBvciBtb3JlIENTUyBjbGFzc2VzIHRvIHRoZSBIdG1sVGFnLiBXaWxsIG5vdCBhZGQgZHVwbGljYXRlIENTUyBjbGFzc2VzLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgT25lIG9yIG1vcmUgc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIHRvIGFkZC5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0YWRkQ2xhc3MgOiBmdW5jdGlvbiggY3NzQ2xhc3MgKSB7XG5cdFx0dmFyIGNsYXNzQXR0ciA9IHRoaXMuZ2V0Q2xhc3MoKSxcblx0XHQgICAgd2hpdGVzcGFjZVJlZ2V4ID0gdGhpcy53aGl0ZXNwYWNlUmVnZXgsXG5cdFx0ICAgIGluZGV4T2YgPSBBdXRvbGlua2VyLlV0aWwuaW5kZXhPZiwgIC8vIHRvIHN1cHBvcnQgSUU4IGFuZCBiZWxvd1xuXHRcdCAgICBjbGFzc2VzID0gKCAhY2xhc3NBdHRyICkgPyBbXSA6IGNsYXNzQXR0ci5zcGxpdCggd2hpdGVzcGFjZVJlZ2V4ICksXG5cdFx0ICAgIG5ld0NsYXNzZXMgPSBjc3NDbGFzcy5zcGxpdCggd2hpdGVzcGFjZVJlZ2V4ICksXG5cdFx0ICAgIG5ld0NsYXNzO1xuXG5cdFx0d2hpbGUoIG5ld0NsYXNzID0gbmV3Q2xhc3Nlcy5zaGlmdCgpICkge1xuXHRcdFx0aWYoIGluZGV4T2YoIGNsYXNzZXMsIG5ld0NsYXNzICkgPT09IC0xICkge1xuXHRcdFx0XHRjbGFzc2VzLnB1c2goIG5ld0NsYXNzICk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0dGhpcy5nZXRBdHRycygpWyAnY2xhc3MnIF0gPSBjbGFzc2VzLmpvaW4oIFwiIFwiICk7XG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ29udmVuaWVuY2UgbWV0aG9kIHRvIHJlbW92ZSBvbmUgb3IgbW9yZSBDU1MgY2xhc3NlcyBmcm9tIHRoZSBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgT25lIG9yIG1vcmUgc3BhY2Utc2VwYXJhdGVkIENTUyBjbGFzc2VzIHRvIHJlbW92ZS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0cmVtb3ZlQ2xhc3MgOiBmdW5jdGlvbiggY3NzQ2xhc3MgKSB7XG5cdFx0dmFyIGNsYXNzQXR0ciA9IHRoaXMuZ2V0Q2xhc3MoKSxcblx0XHQgICAgd2hpdGVzcGFjZVJlZ2V4ID0gdGhpcy53aGl0ZXNwYWNlUmVnZXgsXG5cdFx0ICAgIGluZGV4T2YgPSBBdXRvbGlua2VyLlV0aWwuaW5kZXhPZiwgIC8vIHRvIHN1cHBvcnQgSUU4IGFuZCBiZWxvd1xuXHRcdCAgICBjbGFzc2VzID0gKCAhY2xhc3NBdHRyICkgPyBbXSA6IGNsYXNzQXR0ci5zcGxpdCggd2hpdGVzcGFjZVJlZ2V4ICksXG5cdFx0ICAgIHJlbW92ZUNsYXNzZXMgPSBjc3NDbGFzcy5zcGxpdCggd2hpdGVzcGFjZVJlZ2V4ICksXG5cdFx0ICAgIHJlbW92ZUNsYXNzO1xuXG5cdFx0d2hpbGUoIGNsYXNzZXMubGVuZ3RoICYmICggcmVtb3ZlQ2xhc3MgPSByZW1vdmVDbGFzc2VzLnNoaWZ0KCkgKSApIHtcblx0XHRcdHZhciBpZHggPSBpbmRleE9mKCBjbGFzc2VzLCByZW1vdmVDbGFzcyApO1xuXHRcdFx0aWYoIGlkeCAhPT0gLTEgKSB7XG5cdFx0XHRcdGNsYXNzZXMuc3BsaWNlKCBpZHgsIDEgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmdldEF0dHJzKClbICdjbGFzcycgXSA9IGNsYXNzZXMuam9pbiggXCIgXCIgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gcmV0cmlldmUgdGhlIENTUyBjbGFzcyhlcykgZm9yIHRoZSBIdG1sVGFnLCB3aGljaCB3aWxsIGVhY2ggYmUgc2VwYXJhdGVkIGJ5IHNwYWNlcyB3aGVuXG5cdCAqIHRoZXJlIGFyZSBtdWx0aXBsZS5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0Q2xhc3MgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5nZXRBdHRycygpWyAnY2xhc3MnIF0gfHwgXCJcIjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gY2hlY2sgaWYgdGhlIHRhZyBoYXMgYSBDU1MgY2xhc3Mgb3Igbm90LlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY3NzQ2xhc3MgVGhlIENTUyBjbGFzcyB0byBjaGVjayBmb3IuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgSHRtbFRhZyBoYXMgdGhlIENTUyBjbGFzcywgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRoYXNDbGFzcyA6IGZ1bmN0aW9uKCBjc3NDbGFzcyApIHtcblx0XHRyZXR1cm4gKCAnICcgKyB0aGlzLmdldENsYXNzKCkgKyAnICcgKS5pbmRleE9mKCAnICcgKyBjc3NDbGFzcyArICcgJyApICE9PSAtMTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSBpbm5lciBIVE1MIGZvciB0aGUgdGFnLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaHRtbCBUaGUgaW5uZXIgSFRNTCB0byBzZXQuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldElubmVySHRtbCA6IGZ1bmN0aW9uKCBodG1sICkge1xuXHRcdHRoaXMuaW5uZXJIdG1sID0gaHRtbDtcblxuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgaW5uZXIgSFRNTCBmb3IgdGhlIHRhZy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0SW5uZXJIdG1sIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaW5uZXJIdG1sIHx8IFwiXCI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogT3ZlcnJpZGUgb2Ygc3VwZXJjbGFzcyBtZXRob2QgdXNlZCB0byBnZW5lcmF0ZSB0aGUgSFRNTCBzdHJpbmcgZm9yIHRoZSB0YWcuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdHRvQW5jaG9yU3RyaW5nIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHRhZ05hbWUgPSB0aGlzLmdldFRhZ05hbWUoKSxcblx0XHQgICAgYXR0cnNTdHIgPSB0aGlzLmJ1aWxkQXR0cnNTdHIoKTtcblxuXHRcdGF0dHJzU3RyID0gKCBhdHRyc1N0ciApID8gJyAnICsgYXR0cnNTdHIgOiAnJzsgIC8vIHByZXBlbmQgYSBzcGFjZSBpZiB0aGVyZSBhcmUgYWN0dWFsbHkgYXR0cmlidXRlc1xuXG5cdFx0cmV0dXJuIFsgJzwnLCB0YWdOYW1lLCBhdHRyc1N0ciwgJz4nLCB0aGlzLmdldElubmVySHRtbCgpLCAnPC8nLCB0YWdOYW1lLCAnPicgXS5qb2luKCBcIlwiICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU3VwcG9ydCBtZXRob2QgZm9yIHtAbGluayAjdG9BbmNob3JTdHJpbmd9LCByZXR1cm5zIHRoZSBzdHJpbmcgc3BhY2Utc2VwYXJhdGVkIGtleT1cInZhbHVlXCIgcGFpcnMsIHVzZWQgdG8gcG9wdWxhdGVcblx0ICogdGhlIHN0cmluZ2lmaWVkIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7U3RyaW5nfSBFeGFtcGxlIHJldHVybjogYGF0dHIxPVwidmFsdWUxXCIgYXR0cjI9XCJ2YWx1ZTJcImBcblx0ICovXG5cdGJ1aWxkQXR0cnNTdHIgOiBmdW5jdGlvbigpIHtcblx0XHRpZiggIXRoaXMuYXR0cnMgKSByZXR1cm4gXCJcIjsgIC8vIG5vIGBhdHRyc2AgT2JqZWN0IChtYXApIGhhcyBiZWVuIHNldCwgcmV0dXJuIGVtcHR5IHN0cmluZ1xuXG5cdFx0dmFyIGF0dHJzID0gdGhpcy5nZXRBdHRycygpLFxuXHRcdCAgICBhdHRyc0FyciA9IFtdO1xuXG5cdFx0Zm9yKCB2YXIgcHJvcCBpbiBhdHRycyApIHtcblx0XHRcdGlmKCBhdHRycy5oYXNPd25Qcm9wZXJ0eSggcHJvcCApICkge1xuXHRcdFx0XHRhdHRyc0Fyci5wdXNoKCBwcm9wICsgJz1cIicgKyBhdHRyc1sgcHJvcCBdICsgJ1wiJyApO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gYXR0cnNBcnIuam9pbiggXCIgXCIgKTtcblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qanNoaW50IHN1Yjp0cnVlICovXG4vKipcbiAqIEBwcm90ZWN0ZWRcbiAqIEBjbGFzcyBBdXRvbGlua2VyLkFuY2hvclRhZ0J1aWxkZXJcbiAqIEBleHRlbmRzIE9iamVjdFxuICpcbiAqIEJ1aWxkcyBhbmNob3IgKCZsdDthJmd0OykgdGFncyBmb3IgdGhlIEF1dG9saW5rZXIgdXRpbGl0eSB3aGVuIGEgbWF0Y2ggaXMgZm91bmQuXG4gKlxuICogTm9ybWFsbHkgdGhpcyBjbGFzcyBpcyBpbnN0YW50aWF0ZWQsIGNvbmZpZ3VyZWQsIGFuZCB1c2VkIGludGVybmFsbHkgYnkgYW5cbiAqIHtAbGluayBBdXRvbGlua2VyfSBpbnN0YW5jZSwgYnV0IG1heSBhY3R1YWxseSBiZSByZXRyaWV2ZWQgaW4gYSB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufVxuICogdG8gY3JlYXRlIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWcgSHRtbFRhZ30gaW5zdGFuY2VzIHdoaWNoIG1heSBiZSBtb2RpZmllZFxuICogYmVmb3JlIHJldHVybmluZyBmcm9tIHRoZSB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufS4gRm9yXG4gKiBleGFtcGxlOlxuICpcbiAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJUZXN0IGdvb2dsZS5jb21cIiwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICB2YXIgdGFnID0gYXV0b2xpbmtlci5nZXRUYWdCdWlsZGVyKCkuYnVpbGQoIG1hdGNoICk7ICAvLyByZXR1cm5zIGFuIHtAbGluayBBdXRvbGlua2VyLkh0bWxUYWd9IGluc3RhbmNlXG4gKiAgICAgICAgICAgICB0YWcuc2V0QXR0ciggJ3JlbCcsICdub2ZvbGxvdycgKTtcbiAqXG4gKiAgICAgICAgICAgICByZXR1cm4gdGFnO1xuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICpcbiAqICAgICAvLyBnZW5lcmF0ZWQgaHRtbDpcbiAqICAgICAvLyAgIFRlc3QgPGEgaHJlZj1cImh0dHA6Ly9nb29nbGUuY29tXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9mb2xsb3dcIj5nb29nbGUuY29tPC9hPlxuICovXG5BdXRvbGlua2VyLkFuY2hvclRhZ0J1aWxkZXIgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gbmV3V2luZG93XG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjbmV3V2luZG93XG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtPYmplY3R9IHRydW5jYXRlXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjdHJ1bmNhdGVcblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gY2xhc3NOYW1lXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjY2xhc3NOYW1lXG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge09iamVjdH0gW2NmZ10gVGhlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEFuY2hvclRhZ0J1aWxkZXIgaW5zdGFuY2UsIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciA6IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogR2VuZXJhdGVzIHRoZSBhY3R1YWwgYW5jaG9yICgmbHQ7YSZndDspIHRhZyB0byB1c2UgaW4gcGxhY2Ugb2YgdGhlXG5cdCAqIG1hdGNoZWQgdGV4dCwgdmlhIGl0cyBgbWF0Y2hgIG9iamVjdC5cblx0ICpcblx0ICogQHBhcmFtIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSBtYXRjaCBUaGUgTWF0Y2ggaW5zdGFuY2UgdG8gZ2VuZXJhdGUgYW5cblx0ICogICBhbmNob3IgdGFnIGZyb20uXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhlIEh0bWxUYWcgaW5zdGFuY2UgZm9yIHRoZSBhbmNob3IgdGFnLlxuXHQgKi9cblx0YnVpbGQgOiBmdW5jdGlvbiggbWF0Y2ggKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLkh0bWxUYWcoIHtcblx0XHRcdHRhZ05hbWUgICA6ICdhJyxcblx0XHRcdGF0dHJzICAgICA6IHRoaXMuY3JlYXRlQXR0cnMoIG1hdGNoLmdldFR5cGUoKSwgbWF0Y2guZ2V0QW5jaG9ySHJlZigpICksXG5cdFx0XHRpbm5lckh0bWwgOiB0aGlzLnByb2Nlc3NBbmNob3JUZXh0KCBtYXRjaC5nZXRBbmNob3JUZXh0KCkgKVxuXHRcdH0gKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSBPYmplY3QgKG1hcCkgb2YgdGhlIEhUTUwgYXR0cmlidXRlcyBmb3IgdGhlIGFuY2hvciAoJmx0O2EmZ3Q7KVxuXHQgKiAgIHRhZyBiZWluZyBnZW5lcmF0ZWQuXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtIHtcInVybFwiL1wiZW1haWxcIi9cInBob25lXCIvXCJ0d2l0dGVyXCIvXCJoYXNodGFnXCJ9IG1hdGNoVHlwZSBUaGUgdHlwZSBvZlxuXHQgKiAgIG1hdGNoIHRoYXQgYW4gYW5jaG9yIHRhZyBpcyBiZWluZyBnZW5lcmF0ZWQgZm9yLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYW5jaG9ySHJlZiBUaGUgaHJlZiBmb3IgdGhlIGFuY2hvciB0YWcuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gQSBrZXkvdmFsdWUgT2JqZWN0IChtYXApIG9mIHRoZSBhbmNob3IgdGFnJ3MgYXR0cmlidXRlcy5cblx0ICovXG5cdGNyZWF0ZUF0dHJzIDogZnVuY3Rpb24oIG1hdGNoVHlwZSwgYW5jaG9ySHJlZiApIHtcblx0XHR2YXIgYXR0cnMgPSB7XG5cdFx0XHQnaHJlZicgOiBhbmNob3JIcmVmICAvLyB3ZSdsbCBhbHdheXMgaGF2ZSB0aGUgYGhyZWZgIGF0dHJpYnV0ZVxuXHRcdH07XG5cblx0XHR2YXIgY3NzQ2xhc3MgPSB0aGlzLmNyZWF0ZUNzc0NsYXNzKCBtYXRjaFR5cGUgKTtcblx0XHRpZiggY3NzQ2xhc3MgKSB7XG5cdFx0XHRhdHRyc1sgJ2NsYXNzJyBdID0gY3NzQ2xhc3M7XG5cdFx0fVxuXHRcdGlmKCB0aGlzLm5ld1dpbmRvdyApIHtcblx0XHRcdGF0dHJzWyAndGFyZ2V0JyBdID0gXCJfYmxhbmtcIjtcblx0XHR9XG5cblx0XHRyZXR1cm4gYXR0cnM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ3JlYXRlcyB0aGUgQ1NTIGNsYXNzIHRoYXQgd2lsbCBiZSB1c2VkIGZvciBhIGdpdmVuIGFuY2hvciB0YWcsIGJhc2VkIG9uXG5cdCAqIHRoZSBgbWF0Y2hUeXBlYCBhbmQgdGhlIHtAbGluayAjY2xhc3NOYW1lfSBjb25maWcuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7XCJ1cmxcIi9cImVtYWlsXCIvXCJwaG9uZVwiL1widHdpdHRlclwiL1wiaGFzaHRhZ1wifSBtYXRjaFR5cGUgVGhlIHR5cGUgb2Zcblx0ICogICBtYXRjaCB0aGF0IGFuIGFuY2hvciB0YWcgaXMgYmVpbmcgZ2VuZXJhdGVkIGZvci5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgQ1NTIGNsYXNzIHN0cmluZyBmb3IgdGhlIGxpbmsuIEV4YW1wbGUgcmV0dXJuOlxuXHQgKiAgIFwibXlMaW5rIG15TGluay11cmxcIi4gSWYgbm8ge0BsaW5rICNjbGFzc05hbWV9IHdhcyBjb25maWd1cmVkLCByZXR1cm5zXG5cdCAqICAgYW4gZW1wdHkgc3RyaW5nLlxuXHQgKi9cblx0Y3JlYXRlQ3NzQ2xhc3MgOiBmdW5jdGlvbiggbWF0Y2hUeXBlICkge1xuXHRcdHZhciBjbGFzc05hbWUgPSB0aGlzLmNsYXNzTmFtZTtcblxuXHRcdGlmKCAhY2xhc3NOYW1lIClcblx0XHRcdHJldHVybiBcIlwiO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiBjbGFzc05hbWUgKyBcIiBcIiArIGNsYXNzTmFtZSArIFwiLVwiICsgbWF0Y2hUeXBlOyAgLy8gZXg6IFwibXlMaW5rIG15TGluay11cmxcIiwgXCJteUxpbmsgbXlMaW5rLWVtYWlsXCIsIFwibXlMaW5rIG15TGluay1waG9uZVwiLCBcIm15TGluayBteUxpbmstdHdpdHRlclwiLCBvciBcIm15TGluayBteUxpbmstaGFzaHRhZ1wiXG5cdH0sXG5cblxuXHQvKipcblx0ICogUHJvY2Vzc2VzIHRoZSBgYW5jaG9yVGV4dGAgYnkgdHJ1bmNhdGluZyB0aGUgdGV4dCBhY2NvcmRpbmcgdG8gdGhlXG5cdCAqIHtAbGluayAjdHJ1bmNhdGV9IGNvbmZpZy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGFuY2hvclRleHQgVGhlIGFuY2hvciB0YWcncyB0ZXh0IChpLmUuIHdoYXQgd2lsbCBiZVxuXHQgKiAgIGRpc3BsYXllZCkuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHByb2Nlc3NlZCBgYW5jaG9yVGV4dGAuXG5cdCAqL1xuXHRwcm9jZXNzQW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCBhbmNob3JUZXh0ICkge1xuXHRcdGFuY2hvclRleHQgPSB0aGlzLmRvVHJ1bmNhdGUoIGFuY2hvclRleHQgKTtcblxuXHRcdHJldHVybiBhbmNob3JUZXh0O1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFBlcmZvcm1zIHRoZSB0cnVuY2F0aW9uIG9mIHRoZSBgYW5jaG9yVGV4dGAgYmFzZWQgb24gdGhlIHtAbGluayAjdHJ1bmNhdGV9XG5cdCAqIG9wdGlvbi4gSWYgdGhlIGBhbmNob3JUZXh0YCBpcyBsb25nZXIgdGhhbiB0aGUgbGVuZ3RoIHNwZWNpZmllZCBieSB0aGVcblx0ICoge0BsaW5rICN0cnVuY2F0ZX0gb3B0aW9uLCB0aGUgdHJ1bmNhdGlvbiBpcyBwZXJmb3JtZWQgYmFzZWQgb24gdGhlXG5cdCAqIGBsb2NhdGlvbmAgcHJvcGVydHkuIFNlZSB7QGxpbmsgI3RydW5jYXRlfSBmb3IgZGV0YWlscy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGFuY2hvclRleHQgVGhlIGFuY2hvciB0YWcncyB0ZXh0IChpLmUuIHdoYXQgd2lsbCBiZVxuXHQgKiAgIGRpc3BsYXllZCkuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHRydW5jYXRlZCBhbmNob3IgdGV4dC5cblx0ICovXG5cdGRvVHJ1bmNhdGUgOiBmdW5jdGlvbiggYW5jaG9yVGV4dCApIHtcblx0XHR2YXIgdHJ1bmNhdGUgPSB0aGlzLnRydW5jYXRlO1xuXHRcdGlmKCAhdHJ1bmNhdGUgKSByZXR1cm4gYW5jaG9yVGV4dDtcblxuXHRcdHZhciB0cnVuY2F0ZUxlbmd0aCA9IHRydW5jYXRlLmxlbmd0aCxcblx0XHRcdHRydW5jYXRlTG9jYXRpb24gPSB0cnVuY2F0ZS5sb2NhdGlvbjtcblxuXHRcdGlmKCB0cnVuY2F0ZUxvY2F0aW9uID09PSAnc21hcnQnICkge1xuXHRcdFx0cmV0dXJuIEF1dG9saW5rZXIudHJ1bmNhdGUuVHJ1bmNhdGVTbWFydCggYW5jaG9yVGV4dCwgdHJ1bmNhdGVMZW5ndGgsICcuLicgKTtcblxuXHRcdH0gZWxzZSBpZiggdHJ1bmNhdGVMb2NhdGlvbiA9PT0gJ21pZGRsZScgKSB7XG5cdFx0XHRyZXR1cm4gQXV0b2xpbmtlci50cnVuY2F0ZS5UcnVuY2F0ZU1pZGRsZSggYW5jaG9yVGV4dCwgdHJ1bmNhdGVMZW5ndGgsICcuLicgKTtcblxuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gQXV0b2xpbmtlci50cnVuY2F0ZS5UcnVuY2F0ZUVuZCggYW5jaG9yVGV4dCwgdHJ1bmNhdGVMZW5ndGgsICcuLicgKTtcblx0XHR9XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJcbiAqIEBleHRlbmRzIE9iamVjdFxuICpcbiAqIEFuIEhUTUwgcGFyc2VyIGltcGxlbWVudGF0aW9uIHdoaWNoIHNpbXBseSB3YWxrcyBhbiBIVE1MIHN0cmluZyBhbmQgcmV0dXJucyBhbiBhcnJheSBvZlxuICoge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSBIdG1sTm9kZXN9IHRoYXQgcmVwcmVzZW50IHRoZSBiYXNpYyBIVE1MIHN0cnVjdHVyZSBvZiB0aGUgaW5wdXQgc3RyaW5nLlxuICpcbiAqIEF1dG9saW5rZXIgdXNlcyB0aGlzIHRvIG9ubHkgbGluayBVUkxzL2VtYWlscy9Ud2l0dGVyIGhhbmRsZXMgd2l0aGluIHRleHQgbm9kZXMsIGVmZmVjdGl2ZWx5IGlnbm9yaW5nIC8gXCJ3YWxraW5nXG4gKiBhcm91bmRcIiBIVE1MIHRhZ3MuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBodG1sUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHB1bGwgb3V0IEhUTUwgdGFncyBmcm9tIGEgc3RyaW5nLiBIYW5kbGVzIG5hbWVzcGFjZWQgSFRNTCB0YWdzIGFuZFxuXHQgKiBhdHRyaWJ1dGUgbmFtZXMsIGFzIHNwZWNpZmllZCBieSBodHRwOi8vd3d3LnczLm9yZy9UUi9odG1sLW1hcmt1cC9zeW50YXguaHRtbC5cblx0ICpcblx0ICogQ2FwdHVyaW5nIGdyb3Vwczpcblx0ICpcblx0ICogMS4gVGhlIFwiIURPQ1RZUEVcIiB0YWcgbmFtZSwgaWYgYSB0YWcgaXMgYSAmbHQ7IURPQ1RZUEUmZ3Q7IHRhZy5cblx0ICogMi4gSWYgaXQgaXMgYW4gZW5kIHRhZywgdGhpcyBncm91cCB3aWxsIGhhdmUgdGhlICcvJy5cblx0ICogMy4gSWYgaXQgaXMgYSBjb21tZW50IHRhZywgdGhpcyBncm91cCB3aWxsIGhvbGQgdGhlIGNvbW1lbnQgdGV4dCAoaS5lLlxuXHQgKiAgICB0aGUgdGV4dCBpbnNpZGUgdGhlIGAmbHQ7IS0tYCBhbmQgYC0tJmd0O2AuXG5cdCAqIDQuIFRoZSB0YWcgbmFtZSBmb3IgYWxsIHRhZ3MgKG90aGVyIHRoYW4gdGhlICZsdDshRE9DVFlQRSZndDsgdGFnKVxuXHQgKi9cblx0aHRtbFJlZ2V4IDogKGZ1bmN0aW9uKCkge1xuXHRcdHZhciBjb21tZW50VGFnUmVnZXggPSAvIS0tKFtcXHNcXFNdKz8pLS0vLFxuXHRcdCAgICB0YWdOYW1lUmVnZXggPSAvWzAtOWEtekEtWl1bMC05YS16QS1aOl0qLyxcblx0XHQgICAgYXR0ck5hbWVSZWdleCA9IC9bXlxcc1xcMFwiJz5cXC89XFx4MDEtXFx4MUZcXHg3Rl0rLywgICAvLyB0aGUgdW5pY29kZSByYW5nZSBhY2NvdW50cyBmb3IgZXhjbHVkaW5nIGNvbnRyb2wgY2hhcnMsIGFuZCB0aGUgZGVsZXRlIGNoYXJcblx0XHQgICAgYXR0clZhbHVlUmVnZXggPSAvKD86XCJbXlwiXSo/XCJ8J1teJ10qPyd8W14nXCI9PD5gXFxzXSspLywgLy8gZG91YmxlIHF1b3RlZCwgc2luZ2xlIHF1b3RlZCwgb3IgdW5xdW90ZWQgYXR0cmlidXRlIHZhbHVlc1xuXHRcdCAgICBuYW1lRXF1YWxzVmFsdWVSZWdleCA9IGF0dHJOYW1lUmVnZXguc291cmNlICsgJyg/OlxcXFxzKj1cXFxccyonICsgYXR0clZhbHVlUmVnZXguc291cmNlICsgJyk/JzsgIC8vIG9wdGlvbmFsICc9W3ZhbHVlXSdcblxuXHRcdHJldHVybiBuZXcgUmVnRXhwKCBbXG5cdFx0XHQvLyBmb3IgPCFET0NUWVBFPiB0YWcuIEV4OiA8IURPQ1RZUEUgaHRtbCBQVUJMSUMgXCItLy9XM0MvL0RURCBYSFRNTCAxLjAgU3RyaWN0Ly9FTlwiIFwiaHR0cDovL3d3dy53My5vcmcvVFIveGh0bWwxL0RURC94aHRtbDEtc3RyaWN0LmR0ZFwiPilcblx0XHRcdCcoPzonLFxuXHRcdFx0XHQnPCghRE9DVFlQRSknLCAgLy8gKioqIENhcHR1cmluZyBHcm91cCAxIC0gSWYgaXQncyBhIGRvY3R5cGUgdGFnXG5cblx0XHRcdFx0XHQvLyBaZXJvIG9yIG1vcmUgYXR0cmlidXRlcyBmb2xsb3dpbmcgdGhlIHRhZyBuYW1lXG5cdFx0XHRcdFx0Jyg/OicsXG5cdFx0XHRcdFx0XHQnXFxcXHMrJywgIC8vIG9uZSBvciBtb3JlIHdoaXRlc3BhY2UgY2hhcnMgYmVmb3JlIGFuIGF0dHJpYnV0ZVxuXG5cdFx0XHRcdFx0XHQvLyBFaXRoZXI6XG5cdFx0XHRcdFx0XHQvLyBBLiBhdHRyPVwidmFsdWVcIiwgb3Jcblx0XHRcdFx0XHRcdC8vIEIuIFwidmFsdWVcIiBhbG9uZSAoVG8gY292ZXIgZXhhbXBsZSBkb2N0eXBlIHRhZzogPCFET0NUWVBFIGh0bWwgUFVCTElDIFwiLS8vVzNDLy9EVEQgWEhUTUwgMS4wIFN0cmljdC8vRU5cIiBcImh0dHA6Ly93d3cudzMub3JnL1RSL3hodG1sMS9EVEQveGh0bWwxLXN0cmljdC5kdGRcIj4pXG5cdFx0XHRcdFx0XHQnKD86JywgbmFtZUVxdWFsc1ZhbHVlUmVnZXgsICd8JywgYXR0clZhbHVlUmVnZXguc291cmNlICsgJyknLFxuXHRcdFx0XHRcdCcpKicsXG5cdFx0XHRcdCc+Jyxcblx0XHRcdCcpJyxcblxuXHRcdFx0J3wnLFxuXG5cdFx0XHQvLyBBbGwgb3RoZXIgSFRNTCB0YWdzIChpLmUuIHRhZ3MgdGhhdCBhcmUgbm90IDwhRE9DVFlQRT4pXG5cdFx0XHQnKD86Jyxcblx0XHRcdFx0JzwoLyk/JywgIC8vIEJlZ2lubmluZyBvZiBhIHRhZyBvciBjb21tZW50LiBFaXRoZXIgJzwnIGZvciBhIHN0YXJ0IHRhZywgb3IgJzwvJyBmb3IgYW4gZW5kIHRhZy5cblx0XHRcdFx0ICAgICAgICAgIC8vICoqKiBDYXB0dXJpbmcgR3JvdXAgMjogVGhlIHNsYXNoIG9yIGFuIGVtcHR5IHN0cmluZy4gU2xhc2ggKCcvJykgZm9yIGVuZCB0YWcsIGVtcHR5IHN0cmluZyBmb3Igc3RhcnQgb3Igc2VsZi1jbG9zaW5nIHRhZy5cblxuXHRcdFx0XHRcdCcoPzonLFxuXHRcdFx0XHRcdFx0Y29tbWVudFRhZ1JlZ2V4LnNvdXJjZSwgIC8vICoqKiBDYXB0dXJpbmcgR3JvdXAgMyAtIEEgQ29tbWVudCBUYWcncyBUZXh0XG5cblx0XHRcdFx0XHRcdCd8JyxcblxuXHRcdFx0XHRcdFx0Jyg/OicsXG5cblx0XHRcdFx0XHRcdFx0Ly8gKioqIENhcHR1cmluZyBHcm91cCA0IC0gVGhlIHRhZyBuYW1lXG5cdFx0XHRcdFx0XHRcdCcoJyArIHRhZ05hbWVSZWdleC5zb3VyY2UgKyAnKScsXG5cblx0XHRcdFx0XHRcdFx0Ly8gWmVybyBvciBtb3JlIGF0dHJpYnV0ZXMgZm9sbG93aW5nIHRoZSB0YWcgbmFtZVxuXHRcdFx0XHRcdFx0XHQnKD86Jyxcblx0XHRcdFx0XHRcdFx0XHQnXFxcXHMrJywgICAgICAgICAgICAgICAgLy8gb25lIG9yIG1vcmUgd2hpdGVzcGFjZSBjaGFycyBiZWZvcmUgYW4gYXR0cmlidXRlXG5cdFx0XHRcdFx0XHRcdFx0bmFtZUVxdWFsc1ZhbHVlUmVnZXgsICAvLyBhdHRyPVwidmFsdWVcIiAod2l0aCBvcHRpb25hbCA9XCJ2YWx1ZVwiIHBhcnQpXG5cdFx0XHRcdFx0XHRcdCcpKicsXG5cblx0XHRcdFx0XHRcdFx0J1xcXFxzKi8/JywgIC8vIGFueSB0cmFpbGluZyBzcGFjZXMgYW5kIG9wdGlvbmFsICcvJyBiZWZvcmUgdGhlIGNsb3NpbmcgJz4nXG5cblx0XHRcdFx0XHRcdCcpJyxcblx0XHRcdFx0XHQnKScsXG5cdFx0XHRcdCc+Jyxcblx0XHRcdCcpJ1xuXHRcdF0uam9pbiggXCJcIiApLCAnZ2knICk7XG5cdH0gKSgpLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaHRtbENoYXJhY3RlckVudGl0aWVzUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IG1hdGNoZXMgY29tbW9uIEhUTUwgY2hhcmFjdGVyIGVudGl0aWVzLlxuXHQgKlxuXHQgKiBJZ25vcmluZyAmYW1wOyBhcyBpdCBjb3VsZCBiZSBwYXJ0IG9mIGEgcXVlcnkgc3RyaW5nIC0tIGhhbmRsaW5nIGl0IHNlcGFyYXRlbHkuXG5cdCAqL1xuXHRodG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleDogLygmbmJzcDt8JiMxNjA7fCZsdDt8JiM2MDt8Jmd0O3wmIzYyO3wmcXVvdDt8JiMzNDt8JiMzOTspL2dpLFxuXG5cblx0LyoqXG5cdCAqIFBhcnNlcyBhbiBIVE1MIHN0cmluZyBhbmQgcmV0dXJucyBhIHNpbXBsZSBhcnJheSBvZiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlIEh0bWxOb2Rlc31cblx0ICogdG8gcmVwcmVzZW50IHRoZSBIVE1MIHN0cnVjdHVyZSBvZiB0aGUgaW5wdXQgc3RyaW5nLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaHRtbCBUaGUgSFRNTCB0byBwYXJzZS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlW119XG5cdCAqL1xuXHRwYXJzZSA6IGZ1bmN0aW9uKCBodG1sICkge1xuXHRcdHZhciBodG1sUmVnZXggPSB0aGlzLmh0bWxSZWdleCxcblx0XHQgICAgY3VycmVudFJlc3VsdCxcblx0XHQgICAgbGFzdEluZGV4ID0gMCxcblx0XHQgICAgdGV4dEFuZEVudGl0eU5vZGVzLFxuXHRcdCAgICBub2RlcyA9IFtdOyAgLy8gd2lsbCBiZSB0aGUgcmVzdWx0IG9mIHRoZSBtZXRob2RcblxuXHRcdHdoaWxlKCAoIGN1cnJlbnRSZXN1bHQgPSBodG1sUmVnZXguZXhlYyggaHRtbCApICkgIT09IG51bGwgKSB7XG5cdFx0XHR2YXIgdGFnVGV4dCA9IGN1cnJlbnRSZXN1bHRbIDAgXSxcblx0XHRcdCAgICBjb21tZW50VGV4dCA9IGN1cnJlbnRSZXN1bHRbIDMgXSwgLy8gaWYgd2UndmUgbWF0Y2hlZCBhIGNvbW1lbnRcblx0XHRcdCAgICB0YWdOYW1lID0gY3VycmVudFJlc3VsdFsgMSBdIHx8IGN1cnJlbnRSZXN1bHRbIDQgXSwgIC8vIFRoZSA8IURPQ1RZUEU+IHRhZyAoZXg6IFwiIURPQ1RZUEVcIiksIG9yIGFub3RoZXIgdGFnIChleDogXCJhXCIgb3IgXCJpbWdcIilcblx0XHRcdCAgICBpc0Nsb3NpbmdUYWcgPSAhIWN1cnJlbnRSZXN1bHRbIDIgXSxcblx0XHRcdCAgICBpbkJldHdlZW5UYWdzVGV4dCA9IGh0bWwuc3Vic3RyaW5nKCBsYXN0SW5kZXgsIGN1cnJlbnRSZXN1bHQuaW5kZXggKTtcblxuXHRcdFx0Ly8gUHVzaCBUZXh0Tm9kZXMgYW5kIEVudGl0eU5vZGVzIGZvciBhbnkgdGV4dCBmb3VuZCBiZXR3ZWVuIHRhZ3Ncblx0XHRcdGlmKCBpbkJldHdlZW5UYWdzVGV4dCApIHtcblx0XHRcdFx0dGV4dEFuZEVudGl0eU5vZGVzID0gdGhpcy5wYXJzZVRleHRBbmRFbnRpdHlOb2RlcyggaW5CZXR3ZWVuVGFnc1RleHQgKTtcblx0XHRcdFx0bm9kZXMucHVzaC5hcHBseSggbm9kZXMsIHRleHRBbmRFbnRpdHlOb2RlcyApO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBQdXNoIHRoZSBDb21tZW50Tm9kZSBvciBFbGVtZW50Tm9kZVxuXHRcdFx0aWYoIGNvbW1lbnRUZXh0ICkge1xuXHRcdFx0XHRub2Rlcy5wdXNoKCB0aGlzLmNyZWF0ZUNvbW1lbnROb2RlKCB0YWdUZXh0LCBjb21tZW50VGV4dCApICk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRub2Rlcy5wdXNoKCB0aGlzLmNyZWF0ZUVsZW1lbnROb2RlKCB0YWdUZXh0LCB0YWdOYW1lLCBpc0Nsb3NpbmdUYWcgKSApO1xuXHRcdFx0fVxuXG5cdFx0XHRsYXN0SW5kZXggPSBjdXJyZW50UmVzdWx0LmluZGV4ICsgdGFnVGV4dC5sZW5ndGg7XG5cdFx0fVxuXG5cdFx0Ly8gUHJvY2VzcyBhbnkgcmVtYWluaW5nIHRleHQgYWZ0ZXIgdGhlIGxhc3QgSFRNTCBlbGVtZW50LiBXaWxsIHByb2Nlc3MgYWxsIG9mIHRoZSB0ZXh0IGlmIHRoZXJlIHdlcmUgbm8gSFRNTCBlbGVtZW50cy5cblx0XHRpZiggbGFzdEluZGV4IDwgaHRtbC5sZW5ndGggKSB7XG5cdFx0XHR2YXIgdGV4dCA9IGh0bWwuc3Vic3RyaW5nKCBsYXN0SW5kZXggKTtcblxuXHRcdFx0Ly8gUHVzaCBUZXh0Tm9kZXMgYW5kIEVudGl0eU5vZGVzIGZvciBhbnkgdGV4dCBmb3VuZCBiZXR3ZWVuIHRhZ3Ncblx0XHRcdGlmKCB0ZXh0ICkge1xuXHRcdFx0XHR0ZXh0QW5kRW50aXR5Tm9kZXMgPSB0aGlzLnBhcnNlVGV4dEFuZEVudGl0eU5vZGVzKCB0ZXh0ICk7XG5cdFx0XHRcdG5vZGVzLnB1c2guYXBwbHkoIG5vZGVzLCB0ZXh0QW5kRW50aXR5Tm9kZXMgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbm9kZXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUGFyc2VzIHRleHQgYW5kIEhUTUwgZW50aXR5IG5vZGVzIGZyb20gYSBnaXZlbiBzdHJpbmcuIFRoZSBpbnB1dCBzdHJpbmdcblx0ICogc2hvdWxkIG5vdCBoYXZlIGFueSBIVE1MIHRhZ3MgKGVsZW1lbnRzKSB3aXRoaW4gaXQuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRvIHBhcnNlLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVbXX0gQW4gYXJyYXkgb2YgSHRtbE5vZGVzIHRvXG5cdCAqICAgcmVwcmVzZW50IHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2Rlc30gYW5kXG5cdCAqICAge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlIEVudGl0eU5vZGVzfSBmb3VuZC5cblx0ICovXG5cdHBhcnNlVGV4dEFuZEVudGl0eU5vZGVzIDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0dmFyIG5vZGVzID0gW10sXG5cdFx0ICAgIHRleHRBbmRFbnRpdHlUb2tlbnMgPSBBdXRvbGlua2VyLlV0aWwuc3BsaXRBbmRDYXB0dXJlKCB0ZXh0LCB0aGlzLmh0bWxDaGFyYWN0ZXJFbnRpdGllc1JlZ2V4ICk7ICAvLyBzcGxpdCBhdCBIVE1MIGVudGl0aWVzLCBidXQgaW5jbHVkZSB0aGUgSFRNTCBlbnRpdGllcyBpbiB0aGUgcmVzdWx0cyBhcnJheVxuXG5cdFx0Ly8gRXZlcnkgZXZlbiBudW1iZXJlZCB0b2tlbiBpcyBhIFRleHROb2RlLCBhbmQgZXZlcnkgb2RkIG51bWJlcmVkIHRva2VuIGlzIGFuIEVudGl0eU5vZGVcblx0XHQvLyBGb3IgZXhhbXBsZTogYW4gaW5wdXQgYHRleHRgIG9mIFwiVGVzdCAmcXVvdDt0aGlzJnF1b3Q7IHRvZGF5XCIgd291bGQgdHVybiBpbnRvIHRoZVxuXHRcdC8vICAgYHRleHRBbmRFbnRpdHlUb2tlbnNgOiBbICdUZXN0ICcsICcmcXVvdDsnLCAndGhpcycsICcmcXVvdDsnLCAnIHRvZGF5JyBdXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IHRleHRBbmRFbnRpdHlUb2tlbnMubGVuZ3RoOyBpIDwgbGVuOyBpICs9IDIgKSB7XG5cdFx0XHR2YXIgdGV4dFRva2VuID0gdGV4dEFuZEVudGl0eVRva2Vuc1sgaSBdLFxuXHRcdFx0ICAgIGVudGl0eVRva2VuID0gdGV4dEFuZEVudGl0eVRva2Vuc1sgaSArIDEgXTtcblxuXHRcdFx0aWYoIHRleHRUb2tlbiApIG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlVGV4dE5vZGUoIHRleHRUb2tlbiApICk7XG5cdFx0XHRpZiggZW50aXR5VG9rZW4gKSBub2Rlcy5wdXNoKCB0aGlzLmNyZWF0ZUVudGl0eU5vZGUoIGVudGl0eVRva2VuICkgKTtcblx0XHR9XG5cdFx0cmV0dXJuIG5vZGVzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhbiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlIENvbW1lbnROb2RlfS5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRhZ1RleHQgVGhlIGZ1bGwgdGV4dCBvZiB0aGUgdGFnIChjb21tZW50KSB0aGF0IHdhc1xuXHQgKiAgIG1hdGNoZWQsIGluY2x1ZGluZyBpdHMgJmx0OyEtLSBhbmQgLS0mZ3Q7LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gY29tbWVudCBUaGUgZnVsbCB0ZXh0IG9mIHRoZSBjb21tZW50IHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXHRjcmVhdGVDb21tZW50Tm9kZSA6IGZ1bmN0aW9uKCB0YWdUZXh0LCBjb21tZW50VGV4dCApIHtcblx0XHRyZXR1cm4gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZSgge1xuXHRcdFx0dGV4dDogdGFnVGV4dCxcblx0XHRcdGNvbW1lbnQ6IEF1dG9saW5rZXIuVXRpbC50cmltKCBjb21tZW50VGV4dCApXG5cdFx0fSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhbiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlIEVsZW1lbnROb2RlfS5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRhZ1RleHQgVGhlIGZ1bGwgdGV4dCBvZiB0aGUgdGFnIChlbGVtZW50KSB0aGF0IHdhc1xuXHQgKiAgIG1hdGNoZWQsIGluY2x1ZGluZyBpdHMgYXR0cmlidXRlcy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIHRhZy4gRXg6IEFuICZsdDtpbWcmZ3Q7IHRhZyB3b3VsZFxuXHQgKiAgIGJlIHBhc3NlZCB0byB0aGlzIG1ldGhvZCBhcyBcImltZ1wiLlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IGlzQ2xvc2luZ1RhZyBgdHJ1ZWAgaWYgaXQncyBhIGNsb3NpbmcgdGFnLCBmYWxzZVxuXHQgKiAgIG90aGVyd2lzZS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlfVxuXHQgKi9cblx0Y3JlYXRlRWxlbWVudE5vZGUgOiBmdW5jdGlvbiggdGFnVGV4dCwgdGFnTmFtZSwgaXNDbG9zaW5nVGFnICkge1xuXHRcdHJldHVybiBuZXcgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlKCB7XG5cdFx0XHR0ZXh0ICAgIDogdGFnVGV4dCxcblx0XHRcdHRhZ05hbWUgOiB0YWdOYW1lLnRvTG93ZXJDYXNlKCksXG5cdFx0XHRjbG9zaW5nIDogaXNDbG9zaW5nVGFnXG5cdFx0fSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2RlfS5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdGhhdCB3YXMgbWF0Y2hlZCBmb3IgdGhlIEhUTUwgZW50aXR5IChzdWNoXG5cdCAqICAgYXMgJyZhbXA7bmJzcDsnKS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGV9XG5cdCAqL1xuXHRjcmVhdGVFbnRpdHlOb2RlIDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSggeyB0ZXh0OiB0ZXh0IH0gKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCB0byBjcmVhdGUgYSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2RlfS5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlfVxuXHQgKi9cblx0Y3JlYXRlVGV4dE5vZGUgOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHRyZXR1cm4gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSggeyB0ZXh0OiB0ZXh0IH0gKTtcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVxuICpcbiAqIFJlcHJlc2VudHMgYW4gSFRNTCBub2RlIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZy4gQW4gSFRNTCBub2RlIGlzIG9uZSBvZiB0aGVcbiAqIGZvbGxvd2luZzpcbiAqXG4gKiAxLiBBbiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlIEVsZW1lbnROb2RlfSwgd2hpY2ggcmVwcmVzZW50c1xuICogICAgSFRNTCB0YWdzLlxuICogMi4gQSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlIENvbW1lbnROb2RlfSwgd2hpY2ggcmVwcmVzZW50c1xuICogICAgSFRNTCBjb21tZW50cy5cbiAqIDMuIEEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSBUZXh0Tm9kZX0sIHdoaWNoIHJlcHJlc2VudHMgdGV4dFxuICogICAgb3V0c2lkZSBvciB3aXRoaW4gSFRNTCB0YWdzLlxuICogNC4gQSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGUgRW50aXR5Tm9kZX0sIHdoaWNoIHJlcHJlc2VudHNcbiAqICAgIG9uZSBvZiB0aGUga25vd24gSFRNTCBlbnRpdGllcyB0aGF0IEF1dG9saW5rZXIgbG9va3MgZm9yLiBUaGlzIGluY2x1ZGVzXG4gKiAgICBjb21tb24gb25lcyBzdWNoIGFzICZhbXA7cXVvdDsgYW5kICZhbXA7bmJzcDtcbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gdGV4dCAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSBvcmlnaW5hbCB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQgZm9yIHRoZSBIdG1sTm9kZS5cblx0ICpcblx0ICogLSBJbiB0aGUgY2FzZSBvZiBhbiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlIEVsZW1lbnROb2RlfSxcblx0ICogICB0aGlzIHdpbGwgYmUgdGhlIHRhZydzIHRleHQuXG5cdCAqIC0gSW4gdGhlIGNhc2Ugb2YgYW4ge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZSBDb21tZW50Tm9kZX0sXG5cdCAqICAgdGhpcyB3aWxsIGJlIHRoZSBjb21tZW50J3MgdGV4dC5cblx0ICogLSBJbiB0aGUgY2FzZSBvZiBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgVGV4dE5vZGV9LCB0aGlzXG5cdCAqICAgd2lsbCBiZSB0aGUgdGV4dCBpdHNlbGYuXG5cdCAqIC0gSW4gdGhlIGNhc2Ugb2YgYSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGUgRW50aXR5Tm9kZX0sXG5cdCAqICAgdGhpcyB3aWxsIGJlIHRoZSB0ZXh0IG9mIHRoZSBIVE1MIGVudGl0eS5cblx0ICovXG5cdHRleHQgOiBcIlwiLFxuXG5cblx0LyoqXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0ge09iamVjdH0gY2ZnIFRoZSBjb25maWd1cmF0aW9uIHByb3BlcnRpZXMgZm9yIHRoZSBNYXRjaCBpbnN0YW5jZSxcblx0ICogc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogQXV0b2xpbmtlci5VdGlsLmFic3RyYWN0TWV0aG9kLFxuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUge0BsaW5rICN0ZXh0fSBmb3IgdGhlIEh0bWxOb2RlLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMudGV4dDtcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGVcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVxuICpcbiAqIFJlcHJlc2VudHMgYW4gSFRNTCBjb21tZW50IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9LlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZX0pIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBjb21tZW50IChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIHRleHQgaW5zaWRlIHRoZSBjb21tZW50IHRhZy4gVGhpcyB0ZXh0IGlzIHN0cmlwcGVkIG9mIGFueSBsZWFkaW5nIG9yXG5cdCAqIHRyYWlsaW5nIHdoaXRlc3BhY2UuXG5cdCAqL1xuXHRjb21tZW50IDogJycsXG5cblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdjb21tZW50Jztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBjb21tZW50IGluc2lkZSB0aGUgY29tbWVudCB0YWcuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldENvbW1lbnQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5jb21tZW50O1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbGVtZW50Tm9kZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhbiBIVE1MIGVsZW1lbnQgbm9kZSB0aGF0IGhhcyBiZWVuIHBhcnNlZCBieSB0aGUge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfS5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGV9KSBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlLCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gdGFnTmFtZSAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSBuYW1lIG9mIHRoZSB0YWcgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdHRhZ05hbWUgOiAnJyxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gY2xvc2luZyAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiB0aGUgZWxlbWVudCAodGFnKSBpcyBhIGNsb3NpbmcgdGFnLCBgZmFsc2VgIGlmIGl0cyBhbiBvcGVuaW5nXG5cdCAqIHRhZy5cblx0ICovXG5cdGNsb3NpbmcgOiBmYWxzZSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2VsZW1lbnQnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIEhUTUwgZWxlbWVudCdzICh0YWcncykgbmFtZS4gRXg6IGZvciBhbiAmbHQ7aW1nJmd0OyB0YWcsXG5cdCAqIHJldHVybnMgXCJpbWdcIi5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VGFnTmFtZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLnRhZ05hbWU7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiB0aGUgSFRNTCBlbGVtZW50ICh0YWcpIGlzIGEgY2xvc2luZyB0YWcuIEV4OiAmbHQ7ZGl2Jmd0O1xuXHQgKiByZXR1cm5zIGBmYWxzZWAsIHdoaWxlICZsdDsvZGl2Jmd0OyByZXR1cm5zIGB0cnVlYC5cblx0ICpcblx0ICogQHJldHVybiB7Qm9vbGVhbn1cblx0ICovXG5cdGlzQ2xvc2luZyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmNsb3Npbmc7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGVcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVxuICpcbiAqIFJlcHJlc2VudHMgYSBrbm93biBIVE1MIGVudGl0eSBub2RlIHRoYXQgaGFzIGJlZW4gcGFyc2VkIGJ5IHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9LlxuICogRXg6ICcmYW1wO25ic3A7Jywgb3IgJyZhbXAjMTYwOycgKHdoaWNoIHdpbGwgYmUgcmV0cmlldmFibGUgZnJvbSB0aGUge0BsaW5rICNnZXRUZXh0fVxuICogbWV0aG9kLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGNsYXNzIHdpbGwgb25seSBiZSByZXR1cm5lZCBmcm9tIHRoZSBIdG1sUGFyc2VyIGZvciB0aGUgc2V0IG9mXG4gKiBjaGVja2VkIEhUTUwgZW50aXR5IG5vZGVzICBkZWZpbmVkIGJ5IHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXIjaHRtbENoYXJhY3RlckVudGl0aWVzUmVnZXh9LlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZX0pIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSwge1xuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2VudGl0eSc7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqXG4gKiBSZXByZXNlbnRzIGEgdGV4dCBub2RlIHRoYXQgaGFzIGJlZW4gcGFyc2VkIGJ5IHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9LlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZX0pIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUsIHtcblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBub2RlIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICd0ZXh0Jztcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogVXNlZCBieSBBdXRvbGlua2VyIHRvIHBhcnNlIHBvdGVudGlhbCBtYXRjaGVzLCBnaXZlbiBhbiBpbnB1dCBzdHJpbmcgb2YgdGV4dC5cbiAqXG4gKiBUaGUgTWF0Y2hQYXJzZXIgaXMgZmVkIGEgbm9uLUhUTUwgc3RyaW5nIGluIG9yZGVyIHRvIHNlYXJjaCBmb3IgbWF0Y2hlcy5cbiAqIEF1dG9saW5rZXIgZmlyc3QgdXNlcyB0aGUge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyfSB0byBcIndhbGtcbiAqIGFyb3VuZFwiIEhUTUwgdGFncywgYW5kIHRoZW4gdGhlIHRleHQgYXJvdW5kIHRoZSBIVE1MIHRhZ3MgaXMgcGFzc2VkIGludG8gdGhlXG4gKiBNYXRjaFBhcnNlciBpbiBvcmRlciB0byBmaW5kIHRoZSBhY3R1YWwgbWF0Y2hlcy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlciA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtPYmplY3R9IHVybHNcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciN1cmxzXG5cdCAqL1xuXHR1cmxzIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gZW1haWxcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNlbWFpbFxuXHQgKi9cblx0ZW1haWwgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSB0d2l0dGVyXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjdHdpdHRlclxuXHQgKi9cblx0dHdpdHRlciA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHBob25lXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjcGhvbmVcblx0ICovXG5cdHBob25lOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFuL1N0cmluZ30gaGFzaHRhZ1xuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI2hhc2h0YWdcblx0ICovXG5cdGhhc2h0YWcgOiBmYWxzZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gc3RyaXBQcmVmaXhcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNzdHJpcFByZWZpeFxuXHQgKi9cblx0c3RyaXBQcmVmaXggOiB0cnVlLFxuXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBtYXRjaGVyUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IG1hdGNoZXMgVVJMcywgZW1haWwgYWRkcmVzc2VzLCBwaG9uZSAjcyxcblx0ICogVHdpdHRlciBoYW5kbGVzLCBhbmQgSGFzaHRhZ3MuXG5cdCAqXG5cdCAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIGhhcyB0aGUgZm9sbG93aW5nIGNhcHR1cmluZyBncm91cHM6XG5cdCAqXG5cdCAqIDEuICBHcm91cCB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZXJlIGlzIGEgVHdpdHRlciBoYW5kbGUgbWF0Y2hcblx0ICogICAgIChpLmUuIFxcQHNvbWVUd2l0dGVyVXNlcikuIFNpbXBseSBjaGVjayBmb3IgaXRzIGV4aXN0ZW5jZSB0byBkZXRlcm1pbmVcblx0ICogICAgIGlmIHRoZXJlIGlzIGEgVHdpdHRlciBoYW5kbGUgbWF0Y2guIFRoZSBuZXh0IGNvdXBsZSBvZiBjYXB0dXJpbmdcblx0ICogICAgIGdyb3VwcyBnaXZlIGluZm9ybWF0aW9uIGFib3V0IHRoZSBUd2l0dGVyIGhhbmRsZSBtYXRjaC5cblx0ICogMi4gIFRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlIFxcQHNpZ24gaW4gYSBUd2l0dGVyIGhhbmRsZS4gVGhpc1xuXHQgKiAgICAgaXMgbmVlZGVkIGJlY2F1c2UgdGhlcmUgYXJlIG5vIGxvb2tiZWhpbmRzIGluIEpTIHJlZ3VsYXIgZXhwcmVzc2lvbnMsXG5cdCAqICAgICBhbmQgY2FuIGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhIHJlcGxhY2UoKS5cblx0ICogMy4gIFRoZSBUd2l0dGVyIGhhbmRsZSBpdHNlbGYgaW4gYSBUd2l0dGVyIG1hdGNoLiBJZiB0aGUgbWF0Y2ggaXNcblx0ICogICAgICdAc29tZVR3aXR0ZXJVc2VyJywgdGhlIGhhbmRsZSBpcyAnc29tZVR3aXR0ZXJVc2VyJy5cblx0ICogNC4gIEdyb3VwIHRoYXQgbWF0Y2hlcyBhbiBlbWFpbCBhZGRyZXNzLiBVc2VkIHRvIGRldGVybWluZSBpZiB0aGUgbWF0Y2hcblx0ICogICAgIGlzIGFuIGVtYWlsIGFkZHJlc3MsIGFzIHdlbGwgYXMgaG9sZGluZyB0aGUgZnVsbCBhZGRyZXNzLiBFeDpcblx0ICogICAgICdtZUBteS5jb20nXG5cdCAqIDUuICBHcm91cCB0aGF0IG1hdGNoZXMgYSBVUkwgaW4gdGhlIGlucHV0IHRleHQuIEV4OiAnaHR0cDovL2dvb2dsZS5jb20nLFxuXHQgKiAgICAgJ3d3dy5nb29nbGUuY29tJywgb3IganVzdCAnZ29vZ2xlLmNvbScuIFRoaXMgYWxzbyBpbmNsdWRlcyBhIHBhdGgsXG5cdCAqICAgICB1cmwgcGFyYW1ldGVycywgb3IgaGFzaCBhbmNob3JzLiBFeDogZ29vZ2xlLmNvbS9wYXRoL3RvL2ZpbGU/cTE9MSZxMj0yI215QW5jaG9yXG5cdCAqIDYuICBHcm91cCB0aGF0IG1hdGNoZXMgYSBwcm90b2NvbCBVUkwgKGkuZS4gJ2h0dHA6Ly9nb29nbGUuY29tJykuIFRoaXMgaXNcblx0ICogICAgIHVzZWQgdG8gbWF0Y2ggcHJvdG9jb2wgVVJMcyB3aXRoIGp1c3QgYSBzaW5nbGUgd29yZCwgbGlrZSAnaHR0cDovL2xvY2FsaG9zdCcsXG5cdCAqICAgICB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWUgaGFzIGF0IGxlYXN0IG9uZSAnLidcblx0ICogICAgIGluIGl0LlxuXHQgKiA3LiAgR3JvdXAgdGhhdCBtYXRjaGVzIGEgJ3d3dy4nIHByZWZpeGVkIFVSTC4gVGhpcyBpcyBvbmx5IG1hdGNoZWQgaWYgdGhlXG5cdCAqICAgICAnd3d3LicgdGV4dCB3YXMgbm90IHByZWZpeGVkIGJ5IGEgc2NoZW1lIChpLmUuOiBub3QgcHJlZml4ZWQgYnlcblx0ICogICAgICdodHRwOi8vJywgJ2Z0cDonLCBldGMuKVxuXHQgKiA4LiAgQSBwcm90b2NvbC1yZWxhdGl2ZSAoJy8vJykgbWF0Y2ggZm9yIHRoZSBjYXNlIG9mIGEgJ3d3dy4nIHByZWZpeGVkXG5cdCAqICAgICBVUkwuIFdpbGwgYmUgYW4gZW1wdHkgc3RyaW5nIGlmIGl0IGlzIG5vdCBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLlxuXHQgKiAgICAgV2UgbmVlZCB0byBrbm93IHRoZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnLy8nIGluIG9yZGVyIHRvIGRldGVybWluZVxuXHQgKiAgICAgaWYgaXQgaXMgYSB2YWxpZCBtYXRjaCBvciB0aGUgLy8gd2FzIGluIGEgc3RyaW5nIHdlIGRvbid0IHdhbnQgdG9cblx0ICogICAgIGF1dG8tbGluay5cblx0ICogOS4gIEdyb3VwIHRoYXQgbWF0Y2hlcyBhIGtub3duIFRMRCAodG9wIGxldmVsIGRvbWFpbiksIHdoZW4gYSBzY2hlbWVcblx0ICogICAgIG9yICd3d3cuJy1wcmVmaXhlZCBkb21haW4gaXMgbm90IG1hdGNoZWQuXG5cdCAqIDEwLiAgQSBwcm90b2NvbC1yZWxhdGl2ZSAoJy8vJykgbWF0Y2ggZm9yIHRoZSBjYXNlIG9mIGEga25vd24gVExEIHByZWZpeGVkXG5cdCAqICAgICBVUkwuIFdpbGwgYmUgYW4gZW1wdHkgc3RyaW5nIGlmIGl0IGlzIG5vdCBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLlxuXHQgKiAgICAgU2VlICM2IGZvciBtb3JlIGluZm8uXG5cdCAqIDExLiBHcm91cCB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZXJlIGlzIGEgcGhvbmUgbnVtYmVyIG1hdGNoLlxuXHQgKiAxMi4gSWYgdGhlcmUgaXMgYSBwaG9uZSBudW1iZXIgbWF0Y2gsIGFuZCBhICcrJyBzaWduIHdhcyBpbmNsdWRlZCB3aXRoXG5cdCAqICAgICB0aGUgcGhvbmUgbnVtYmVyLCB0aGlzIGdyb3VwIHdpbGwgYmUgcG9wdWxhdGVkIHdpdGggdGhlICcrJyBzaWduLlxuXHQgKiAxMy4gR3JvdXAgdGhhdCBpcyB1c2VkIHRvIGRldGVybWluZSBpZiB0aGVyZSBpcyBhIEhhc2h0YWcgbWF0Y2hcblx0ICogICAgIChpLmUuIFxcI3NvbWVIYXNodGFnKS4gU2ltcGx5IGNoZWNrIGZvciBpdHMgZXhpc3RlbmNlIHRvIGRldGVybWluZSBpZlxuXHQgKiAgICAgdGhlcmUgaXMgYSBIYXNodGFnIG1hdGNoLiBUaGUgbmV4dCBjb3VwbGUgb2YgY2FwdHVyaW5nIGdyb3VwcyBnaXZlXG5cdCAqICAgICBpbmZvcm1hdGlvbiBhYm91dCB0aGUgSGFzaHRhZyBtYXRjaC5cblx0ICogMTQuIFRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlICNzaWduIGluIGEgSGFzaHRhZyBoYW5kbGUuIFRoaXNcblx0ICogICAgIGlzIG5lZWRlZCBiZWNhdXNlIHRoZXJlIGFyZSBubyBsb29rLWJlaGluZHMgaW4gSlMgcmVndWxhclxuXHQgKiAgICAgZXhwcmVzc2lvbnMsIGFuZCBjYW4gYmUgdXNlZCB0byByZWNvbnN0cnVjdCB0aGUgb3JpZ2luYWwgc3RyaW5nIGluIGFcblx0ICogICAgIHJlcGxhY2UoKS5cblx0ICogMTUuIFRoZSBIYXNodGFnIGl0c2VsZiBpbiBhIEhhc2h0YWcgbWF0Y2guIElmIHRoZSBtYXRjaCBpc1xuXHQgKiAgICAgJyNzb21lSGFzaHRhZycsIHRoZSBoYXNodGFnIGlzICdzb21lSGFzaHRhZycuXG5cdCAqL1xuXHRtYXRjaGVyUmVnZXggOiAoZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHR3aXR0ZXJSZWdleCA9IC8oXnxbXlxcd10pQChcXHd7MSwxNX0pLywgICAgICAgICAgICAgIC8vIEZvciBtYXRjaGluZyBhIHR3aXR0ZXIgaGFuZGxlLiBFeDogQGdyZWdvcnlfamFjb2JzXG5cblx0XHQgICAgaGFzaHRhZ1JlZ2V4ID0gLyhefFteXFx3XSkjKFxcd3sxLDEzOX0pLywgICAgICAgICAgICAgIC8vIEZvciBtYXRjaGluZyBhIEhhc2h0YWcuIEV4OiAjZ2FtZXNcblxuXHRcdCAgICBlbWFpbFJlZ2V4ID0gLyg/OltcXC07OiY9XFwrXFwkLFxcd1xcLl0rQCkvLCAgICAgICAgICAgICAvLyBzb21ldGhpbmdAIGZvciBlbWFpbCBhZGRyZXNzZXMgKGEuay5hLiBsb2NhbC1wYXJ0KVxuXHRcdCAgICBwaG9uZVJlZ2V4ID0gLyg/OihcXCspP1xcZHsxLDN9Wy1cXDA0MC5dKT9cXCg/XFxkezN9XFwpP1stXFwwNDAuXT9cXGR7M31bLVxcMDQwLl1cXGR7NH0vLCAgLy8gZXg6ICgxMjMpIDQ1Ni03ODkwLCAxMjMgNDU2IDc4OTAsIDEyMy00NTYtNzg5MCwgZXRjLlxuXHRcdCAgICBwcm90b2NvbFJlZ2V4ID0gLyg/OltBLVphLXpdWy0uK0EtWmEtejAtOV0qOig/IVtBLVphLXpdWy0uK0EtWmEtejAtOV0qOlxcL1xcLykoPyFcXGQrXFwvPykoPzpcXC9cXC8pPykvLCAgLy8gbWF0Y2ggcHJvdG9jb2wsIGFsbG93IGluIGZvcm1hdCBcImh0dHA6Ly9cIiBvciBcIm1haWx0bzpcIi4gSG93ZXZlciwgZG8gbm90IG1hdGNoIHRoZSBmaXJzdCBwYXJ0IG9mIHNvbWV0aGluZyBsaWtlICdsaW5rOmh0dHA6Ly93d3cuZ29vZ2xlLmNvbScgKGkuZS4gZG9uJ3QgbWF0Y2ggXCJsaW5rOlwiKS4gQWxzbywgbWFrZSBzdXJlIHdlIGRvbid0IGludGVycHJldCAnZ29vZ2xlLmNvbTo4MDAwJyBhcyBpZiAnZ29vZ2xlLmNvbScgd2FzIGEgcHJvdG9jb2wgaGVyZSAoaS5lLiBpZ25vcmUgYSB0cmFpbGluZyBwb3J0IG51bWJlciBpbiB0aGlzIHJlZ2V4KVxuXHRcdCAgICB3d3dSZWdleCA9IC8oPzp3d3dcXC4pLywgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0YXJ0aW5nIHdpdGggJ3d3dy4nXG5cdFx0ICAgIGRvbWFpbk5hbWVSZWdleCA9IC9bQS1aYS16MC05XFwuXFwtXSpbQS1aYS16MC05XFwtXS8sICAvLyBhbnl0aGluZyBsb29raW5nIGF0IGFsbCBsaWtlIGEgZG9tYWluLCBub24tdW5pY29kZSBkb21haW5zLCBub3QgZW5kaW5nIGluIGEgcGVyaW9kXG5cdFx0ICAgIHRsZFJlZ2V4ID0gL1xcLig/OmludGVybmF0aW9uYWx8Y29uc3RydWN0aW9ufGNvbnRyYWN0b3JzfGVudGVycHJpc2VzfHBob3RvZ3JhcGh5fHByb2R1Y3Rpb25zfGZvdW5kYXRpb258aW1tb2JpbGllbnxpbmR1c3RyaWVzfG1hbmFnZW1lbnR8cHJvcGVydGllc3x0ZWNobm9sb2d5fGNocmlzdG1hc3xjb21tdW5pdHl8ZGlyZWN0b3J5fGVkdWNhdGlvbnxlcXVpcG1lbnR8aW5zdGl0dXRlfG1hcmtldGluZ3xzb2x1dGlvbnN8dmFjYXRpb25zfGJhcmdhaW5zfGJvdXRpcXVlfGJ1aWxkZXJzfGNhdGVyaW5nfGNsZWFuaW5nfGNsb3RoaW5nfGNvbXB1dGVyfGRlbW9jcmF0fGRpYW1vbmRzfGdyYXBoaWNzfGhvbGRpbmdzfGxpZ2h0aW5nfHBhcnRuZXJzfHBsdW1iaW5nfHN1cHBsaWVzfHRyYWluaW5nfHZlbnR1cmVzfGFjYWRlbXl8Y2FyZWVyc3xjb21wYW55fGNydWlzZXN8ZG9tYWluc3xleHBvc2VkfGZsaWdodHN8ZmxvcmlzdHxnYWxsZXJ5fGd1aXRhcnN8aG9saWRheXxraXRjaGVufG5ldXN0YXJ8b2tpbmF3YXxyZWNpcGVzfHJlbnRhbHN8cmV2aWV3c3xzaGlrc2hhfHNpbmdsZXN8c3VwcG9ydHxzeXN0ZW1zfGFnZW5jeXxiZXJsaW58Y2FtZXJhfGNlbnRlcnxjb2ZmZWV8Y29uZG9zfGRhdGluZ3xlc3RhdGV8ZXZlbnRzfGV4cGVydHxmdXRib2x8a2F1ZmVufGx1eHVyeXxtYWlzb258bW9uYXNofG11c2V1bXxuYWdveWF8cGhvdG9zfHJlcGFpcnxyZXBvcnR8c29jaWFsfHN1cHBseXx0YXR0b298dGllbmRhfHRyYXZlbHx2aWFqZXN8dmlsbGFzfHZpc2lvbnx2b3Rpbmd8dm95YWdlfGFjdG9yfGJ1aWxkfGNhcmRzfGNoZWFwfGNvZGVzfGRhbmNlfGVtYWlsfGdsYXNzfGhvdXNlfG1hbmdvfG5pbmphfHBhcnRzfHBob3RvfHByZXNzfHNob2VzfHNvbGFyfHRvZGF5fHRva3lvfHRvb2xzfHdhdGNofHdvcmtzfGFlcm98YXJwYXxhc2lhfGJlc3R8YmlrZXxibHVlfGJ1enp8Y2FtcHxjbHVifGNvb2x8Y29vcHxmYXJtfGZpc2h8Z2lmdHxndXJ1fGluZm98am9ic3xraXdpfGtyZWR8bGFuZHxsaW1vfGxpbmt8bWVudXxtb2JpfG1vZGF8bmFtZXxwaWNzfHBpbmt8cG9zdHxxcG9ufHJpY2h8cnVocnxzZXh5fHRpcHN8dm90ZXx2b3RvfHdhbmd8d2llbnx3aWtpfHpvbmV8YmFyfGJpZHxiaXp8Y2FifGNhdHxjZW98Y29tfGVkdXxnb3Z8aW50fGtpbXxtaWx8bmV0fG9ubHxvcmd8cHJvfHB1YnxyZWR8dGVsfHVub3x3ZWR8eHh4fHh5enxhY3xhZHxhZXxhZnxhZ3xhaXxhbHxhbXxhbnxhb3xhcXxhcnxhc3xhdHxhdXxhd3xheHxhenxiYXxiYnxiZHxiZXxiZnxiZ3xiaHxiaXxianxibXxibnxib3xicnxic3xidHxidnxid3xieXxienxjYXxjY3xjZHxjZnxjZ3xjaHxjaXxja3xjbHxjbXxjbnxjb3xjcnxjdXxjdnxjd3xjeHxjeXxjenxkZXxkanxka3xkbXxkb3xkenxlY3xlZXxlZ3xlcnxlc3xldHxldXxmaXxmanxma3xmbXxmb3xmcnxnYXxnYnxnZHxnZXxnZnxnZ3xnaHxnaXxnbHxnbXxnbnxncHxncXxncnxnc3xndHxndXxnd3xneXxoa3xobXxobnxocnxodHxodXxpZHxpZXxpbHxpbXxpbnxpb3xpcXxpcnxpc3xpdHxqZXxqbXxqb3xqcHxrZXxrZ3xraHxraXxrbXxrbnxrcHxrcnxrd3xreXxrenxsYXxsYnxsY3xsaXxsa3xscnxsc3xsdHxsdXxsdnxseXxtYXxtY3xtZHxtZXxtZ3xtaHxta3xtbHxtbXxtbnxtb3xtcHxtcXxtcnxtc3xtdHxtdXxtdnxtd3xteHxteXxtenxuYXxuY3xuZXxuZnxuZ3xuaXxubHxub3xucHxucnxudXxuenxvbXxwYXxwZXxwZnxwZ3xwaHxwa3xwbHxwbXxwbnxwcnxwc3xwdHxwd3xweXxxYXxyZXxyb3xyc3xydXxyd3xzYXxzYnxzY3xzZHxzZXxzZ3xzaHxzaXxzanxza3xzbHxzbXxzbnxzb3xzcnxzdHxzdXxzdnxzeHxzeXxzenx0Y3x0ZHx0Znx0Z3x0aHx0anx0a3x0bHx0bXx0bnx0b3x0cHx0cnx0dHx0dnx0d3x0enx1YXx1Z3x1a3x1c3x1eXx1enx2YXx2Y3x2ZXx2Z3x2aXx2bnx2dXx3Znx3c3x5ZXx5dHx6YXx6bXx6dylcXGIvLCAgIC8vIG1hdGNoIG91ciBrbm93biB0b3AgbGV2ZWwgZG9tYWlucyAoVExEcylcblxuXHRcdCAgICAvLyBBbGxvdyBvcHRpb25hbCBwYXRoLCBxdWVyeSBzdHJpbmcsIGFuZCBoYXNoIGFuY2hvciwgbm90IGVuZGluZyBpbiB0aGUgZm9sbG93aW5nIGNoYXJhY3RlcnM6IFwiPyE6LC47XCJcblx0XHQgICAgLy8gaHR0cDovL2Jsb2cuY29kaW5naG9ycm9yLmNvbS90aGUtcHJvYmxlbS13aXRoLXVybHMvXG5cdFx0ICAgIHVybFN1ZmZpeFJlZ2V4ID0gL1tcXC1BLVphLXowLTkrJkAjXFwvJT1+XygpfCckKlxcW1xcXT8hOiwuO10qW1xcLUEtWmEtejAtOSsmQCNcXC8lPX5fKCl8JyQqXFxbXFxdXS87XG5cblx0XHRyZXR1cm4gbmV3IFJlZ0V4cCggW1xuXHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkMSwgd2hpY2ggY2FuIGJlIHVzZWQgdG8gY2hlY2sgZm9yIGEgdHdpdHRlciBoYW5kbGUgbWF0Y2guIFVzZSBncm91cCAkMyBmb3IgdGhlIGFjdHVhbCB0d2l0dGVyIGhhbmRsZSB0aG91Z2guICQyIG1heSBiZSB1c2VkIHRvIHJlY29uc3RydWN0IHRoZSBvcmlnaW5hbCBzdHJpbmcgaW4gYSByZXBsYWNlKClcblx0XHRcdFx0Ly8gKioqIENhcHR1cmluZyBncm91cCAkMiwgd2hpY2ggbWF0Y2hlcyB0aGUgd2hpdGVzcGFjZSBjaGFyYWN0ZXIgYmVmb3JlIHRoZSAnQCcgc2lnbiAobmVlZGVkIGJlY2F1c2Ugb2Ygbm8gbG9va2JlaGluZHMpLCBhbmRcblx0XHRcdFx0Ly8gKioqIENhcHR1cmluZyBncm91cCAkMywgd2hpY2ggbWF0Y2hlcyB0aGUgYWN0dWFsIHR3aXR0ZXIgaGFuZGxlXG5cdFx0XHRcdHR3aXR0ZXJSZWdleC5zb3VyY2UsXG5cdFx0XHQnKScsXG5cblx0XHRcdCd8JyxcblxuXHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkNCwgd2hpY2ggaXMgdXNlZCB0byBkZXRlcm1pbmUgYW4gZW1haWwgbWF0Y2hcblx0XHRcdFx0ZW1haWxSZWdleC5zb3VyY2UsXG5cdFx0XHRcdGRvbWFpbk5hbWVSZWdleC5zb3VyY2UsXG5cdFx0XHRcdHRsZFJlZ2V4LnNvdXJjZSxcblx0XHRcdCcpJyxcblxuXHRcdFx0J3wnLFxuXG5cdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ1LCB3aGljaCBpcyB1c2VkIHRvIG1hdGNoIGEgVVJMXG5cdFx0XHRcdCcoPzonLCAvLyBwYXJlbnMgdG8gY292ZXIgbWF0Y2ggZm9yIHByb3RvY29sIChvcHRpb25hbCksIGFuZCBkb21haW5cblx0XHRcdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ2LCBmb3IgYSBzY2hlbWUtcHJlZml4ZWQgdXJsIChleDogaHR0cDovL2dvb2dsZS5jb20pXG5cdFx0XHRcdFx0XHRwcm90b2NvbFJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHRcdGRvbWFpbk5hbWVSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0JyknLFxuXG5cdFx0XHRcdFx0J3wnLFxuXG5cdFx0XHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkNywgZm9yIGEgJ3d3dy4nIHByZWZpeGVkIHVybCAoZXg6IHd3dy5nb29nbGUuY29tKVxuXHRcdFx0XHRcdFx0JyguPy8vKT8nLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkOCBmb3IgYW4gb3B0aW9uYWwgcHJvdG9jb2wtcmVsYXRpdmUgVVJMLiBNdXN0IGJlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZyBvciBzdGFydCB3aXRoIGEgbm9uLXdvcmQgY2hhcmFjdGVyXG5cdFx0XHRcdFx0XHR3d3dSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdCcpJyxcblxuXHRcdFx0XHRcdCd8JyxcblxuXHRcdFx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDksIGZvciBrbm93biBhIFRMRCB1cmwgKGV4OiBnb29nbGUuY29tKVxuXHRcdFx0XHRcdFx0JyguPy8vKT8nLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkMTAgZm9yIGFuIG9wdGlvbmFsIHByb3RvY29sLXJlbGF0aXZlIFVSTC4gTXVzdCBiZSBhdCB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzdHJpbmcgb3Igc3RhcnQgd2l0aCBhIG5vbi13b3JkIGNoYXJhY3RlclxuXHRcdFx0XHRcdFx0ZG9tYWluTmFtZVJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHRcdHRsZFJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHQnKScsXG5cdFx0XHRcdCcpJyxcblxuXHRcdFx0XHQnKD86JyArIHVybFN1ZmZpeFJlZ2V4LnNvdXJjZSArICcpPycsICAvLyBtYXRjaCBmb3IgcGF0aCwgcXVlcnkgc3RyaW5nLCBhbmQvb3IgaGFzaCBhbmNob3IgLSBvcHRpb25hbFxuXHRcdFx0JyknLFxuXG5cdFx0XHQnfCcsXG5cblx0XHRcdC8vIHRoaXMgc2V0dXAgZG9lcyBub3Qgc2NhbGUgd2VsbCBmb3Igb3BlbiBleHRlbnNpb24gOiggTmVlZCB0byByZXRoaW5rIGRlc2lnbiBvZiBhdXRvbGlua2VyLi4uXG5cdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxMSwgd2hpY2ggbWF0Y2hlcyBhIChVU0EgZm9yIG5vdykgcGhvbmUgbnVtYmVyLCBhbmRcblx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDEyLCB3aGljaCBtYXRjaGVzIHRoZSAnKycgc2lnbiBmb3IgaW50ZXJuYXRpb25hbCBudW1iZXJzLCBpZiBpdCBleGlzdHNcblx0XHRcdCcoJyxcblx0XHRcdFx0cGhvbmVSZWdleC5zb3VyY2UsXG5cdFx0XHQnKScsXG5cblx0XHRcdCd8JyxcblxuXHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkMTMsIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGNoZWNrIGZvciBhIEhhc2h0YWcgbWF0Y2guIFVzZSBncm91cCAkMTIgZm9yIHRoZSBhY3R1YWwgSGFzaHRhZyB0aG91Z2guICQxMSBtYXkgYmUgdXNlZCB0byByZWNvbnN0cnVjdCB0aGUgb3JpZ2luYWwgc3RyaW5nIGluIGEgcmVwbGFjZSgpXG5cdFx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDE0LCB3aGljaCBtYXRjaGVzIHRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlICcjJyBzaWduIChuZWVkZWQgYmVjYXVzZSBvZiBubyBsb29rYmVoaW5kcyksIGFuZFxuXHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxNSwgd2hpY2ggbWF0Y2hlcyB0aGUgYWN0dWFsIEhhc2h0YWdcblx0XHRcdFx0aGFzaHRhZ1JlZ2V4LnNvdXJjZSxcblx0XHRcdCcpJ1xuXHRcdF0uam9pbiggXCJcIiApLCAnZ2knICk7XG5cdH0gKSgpLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gY2hhckJlZm9yZVByb3RvY29sUmVsTWF0Y2hSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcmV0cmlldmUgdGhlIGNoYXJhY3RlciBiZWZvcmUgYVxuXHQgKiBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgbWF0Y2guXG5cdCAqXG5cdCAqIFRoaXMgaXMgdXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSB7QGxpbmsgI21hdGNoZXJSZWdleH0sIHdoaWNoIG5lZWRzXG5cdCAqIHRvIGdyYWIgdGhlIGNoYXJhY3RlciBiZWZvcmUgYSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIGR1ZSB0byB0aGUgbGFjayBvZlxuXHQgKiBhIG5lZ2F0aXZlIGxvb2stYmVoaW5kIGluIEphdmFTY3JpcHQgcmVndWxhciBleHByZXNzaW9ucy4gVGhlIGNoYXJhY3RlclxuXHQgKiBiZWZvcmUgdGhlIG1hdGNoIGlzIHN0cmlwcGVkIGZyb20gdGhlIFVSTC5cblx0ICovXG5cdGNoYXJCZWZvcmVQcm90b2NvbFJlbE1hdGNoUmVnZXggOiAvXiguKT9cXC9cXC8vLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3J9IG1hdGNoVmFsaWRhdG9yXG5cdCAqXG5cdCAqIFRoZSBNYXRjaFZhbGlkYXRvciBvYmplY3QsIHVzZWQgdG8gZmlsdGVyIG91dCBhbnkgZmFsc2UgcG9zaXRpdmVzIGZyb21cblx0ICogdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fS4gU2VlIHtAbGluayBBdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yfSBmb3IgZGV0YWlscy5cblx0ICovXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQW5jaG9yVGFnQnVpbGRlclxuXHQgKiBpbnN0YW5jZSwgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblxuXHRcdHRoaXMubWF0Y2hWYWxpZGF0b3IgPSBuZXcgQXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvcigpO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFBhcnNlcyB0aGUgaW5wdXQgYHRleHRgIHRvIHNlYXJjaCBmb3IgbWF0Y2hlcywgYW5kIGNhbGxzIHRoZSBgcmVwbGFjZUZuYFxuXHQgKiB0byBhbGxvdyByZXBsYWNlbWVudHMgb2YgdGhlIG1hdGNoZXMuIFJldHVybnMgdGhlIGB0ZXh0YCB3aXRoIG1hdGNoZXNcblx0ICogcmVwbGFjZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IHRvIHNlYXJjaCBhbmQgcmVwYWNlIG1hdGNoZXMgaW4uXG5cdCAqIEBwYXJhbSB7RnVuY3Rpb259IHJlcGxhY2VGbiBUaGUgaXRlcmF0b3IgZnVuY3Rpb24gdG8gaGFuZGxlIHRoZVxuXHQgKiAgIHJlcGxhY2VtZW50cy4gVGhlIGZ1bmN0aW9uIHRha2VzIGEgc2luZ2xlIGFyZ3VtZW50LCBhIHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofVxuXHQgKiAgIG9iamVjdCwgYW5kIHNob3VsZCByZXR1cm4gdGhlIHRleHQgdGhhdCBzaG91bGQgbWFrZSB0aGUgcmVwbGFjZW1lbnQuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY29udGV4dE9iaj13aW5kb3ddIFRoZSBjb250ZXh0IG9iamVjdCAoXCJzY29wZVwiKSB0byBydW5cblx0ICogICB0aGUgYHJlcGxhY2VGbmAgaW4uXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdHJlcGxhY2UgOiBmdW5jdGlvbiggdGV4dCwgcmVwbGFjZUZuLCBjb250ZXh0T2JqICkge1xuXHRcdHZhciBtZSA9IHRoaXM7ICAvLyBmb3IgY2xvc3VyZVxuXG5cdFx0cmV0dXJuIHRleHQucmVwbGFjZSggdGhpcy5tYXRjaGVyUmVnZXgsIGZ1bmN0aW9uKCBtYXRjaFN0ci8qLCAkMSwgJDIsICQzLCAkNCwgJDUsICQ2LCAkNywgJDgsICQ5LCAkMTAsICQxMSwgJDEyLCAkMTMsICQxNCwgJDE1Ki8gKSB7XG5cdFx0XHR2YXIgbWF0Y2hEZXNjT2JqID0gbWUucHJvY2Vzc0NhbmRpZGF0ZU1hdGNoLmFwcGx5KCBtZSwgYXJndW1lbnRzICk7ICAvLyBcIm1hdGNoIGRlc2NyaXB0aW9uXCIgb2JqZWN0XG5cblx0XHRcdC8vIFJldHVybiBvdXQgd2l0aCBubyBjaGFuZ2VzIGZvciBtYXRjaCB0eXBlcyB0aGF0IGFyZSBkaXNhYmxlZCAodXJsLFxuXHRcdFx0Ly8gZW1haWwsIHBob25lLCBldGMuKSwgb3IgZm9yIG1hdGNoZXMgdGhhdCBhcmUgaW52YWxpZCAoZmFsc2Vcblx0XHRcdC8vIHBvc2l0aXZlcyBmcm9tIHRoZSBtYXRjaGVyUmVnZXgsIHdoaWNoIGNhbid0IHVzZSBsb29rLWJlaGluZHNcblx0XHRcdC8vIHNpbmNlIHRoZXkgYXJlIHVuYXZhaWxhYmxlIGluIEpTKS5cblx0XHRcdGlmKCAhbWF0Y2hEZXNjT2JqICkge1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2hTdHI7XG5cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdC8vIEdlbmVyYXRlIHJlcGxhY2VtZW50IHRleHQgZm9yIHRoZSBtYXRjaCBmcm9tIHRoZSBgcmVwbGFjZUZuYFxuXHRcdFx0XHR2YXIgcmVwbGFjZVN0ciA9IHJlcGxhY2VGbi5jYWxsKCBjb250ZXh0T2JqLCBtYXRjaERlc2NPYmoubWF0Y2ggKTtcblx0XHRcdFx0cmV0dXJuIG1hdGNoRGVzY09iai5wcmVmaXhTdHIgKyByZXBsYWNlU3RyICsgbWF0Y2hEZXNjT2JqLnN1ZmZpeFN0cjtcblx0XHRcdH1cblx0XHR9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUHJvY2Vzc2VzIGEgY2FuZGlkYXRlIG1hdGNoIGZyb20gdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fS5cblx0ICpcblx0ICogTm90IGFsbCBtYXRjaGVzIGZvdW5kIGJ5IHRoZSByZWdleCBhcmUgYWN0dWFsIFVSTC9FbWFpbC9QaG9uZS9Ud2l0dGVyL0hhc2h0YWdcblx0ICogbWF0Y2hlcywgYXMgZGV0ZXJtaW5lZCBieSB0aGUge0BsaW5rICNtYXRjaFZhbGlkYXRvcn0uIEluIHRoaXMgY2FzZSwgdGhlXG5cdCAqIG1ldGhvZCByZXR1cm5zIGBudWxsYC4gT3RoZXJ3aXNlLCBhIHZhbGlkIE9iamVjdCB3aXRoIGBwcmVmaXhTdHJgLFxuXHQgKiBgbWF0Y2hgLCBhbmQgYHN1ZmZpeFN0cmAgaXMgcmV0dXJuZWQuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBtYXRjaFN0ciBUaGUgZnVsbCBtYXRjaCB0aGF0IHdhcyBmb3VuZCBieSB0aGVcblx0ICogICB7QGxpbmsgI21hdGNoZXJSZWdleH0uXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVyTWF0Y2ggVGhlIG1hdGNoZWQgdGV4dCBvZiBhIFR3aXR0ZXIgaGFuZGxlLCBpZiB0aGVcblx0ICogICBtYXRjaCBpcyBhIFR3aXR0ZXIgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXIgVGhlIHdoaXRlc3BhY2UgY2hhclxuXHQgKiAgIGJlZm9yZSB0aGUgQCBzaWduIGluIGEgVHdpdHRlciBoYW5kbGUgbWF0Y2guIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugb2Zcblx0ICogICBubyBsb29rYmVoaW5kcyBpbiBKUyByZWdleGVzLCBhbmQgaXMgbmVlZCB0byByZS1pbmNsdWRlIHRoZSBjaGFyYWN0ZXJcblx0ICogICBmb3IgdGhlIGFuY2hvciB0YWcgcmVwbGFjZW1lbnQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0d2l0dGVySGFuZGxlIFRoZSBhY3R1YWwgVHdpdHRlciB1c2VyIChpLmUgdGhlIHdvcmQgYWZ0ZXJcblx0ICogICB0aGUgQCBzaWduIGluIGEgVHdpdHRlciBtYXRjaCkuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBlbWFpbEFkZHJlc3NNYXRjaCBUaGUgbWF0Y2hlZCBlbWFpbCBhZGRyZXNzIGZvciBhbiBlbWFpbFxuXHQgKiAgIGFkZHJlc3MgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwgc3RyaW5nIGZvciBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHNjaGVtZVVybE1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIHByb3RvY29sXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBtYXRjaCBzb21ldGhpbmcgbGlrZVxuXHQgKiAgICdodHRwOi8vbG9jYWxob3N0Jywgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lXG5cdCAqICAgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB3d3dNYXRjaCBUaGUgbWF0Y2hlZCBzdHJpbmcgb2YgYSAnd3d3LictcHJlZml4ZWQgVVJMIHRoYXRcblx0ICogICB3YXMgbWF0Y2hlZC4gVGhpcyBpcyBvbmx5IG1hdGNoZWQgaWYgdGhlICd3d3cuJyB0ZXh0IHdhcyBub3QgcHJlZml4ZWRcblx0ICogICBieSBhIHNjaGVtZSAoaS5lLjogbm90IHByZWZpeGVkIGJ5ICdodHRwOi8vJywgJ2Z0cDonLCBldGMuKS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHd3d1Byb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgJy8vJyBmb3IgYSBwcm90b2NvbC1yZWxhdGl2ZVxuXHQgKiAgIG1hdGNoIGZyb20gYSAnd3d3JyB1cmwsIHdpdGggdGhlIGNoYXJhY3RlciB0aGF0IGNvbWVzIGJlZm9yZSB0aGUgJy8vJy5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHRsZE1hdGNoIFRoZSBtYXRjaGVkIHN0cmluZyBvZiBhIGtub3duIFRMRCAodG9wIGxldmVsXG5cdCAqICAgZG9tYWluKSwgd2hlbiBhIHNjaGVtZSBvciAnd3d3LictcHJlZml4ZWQgZG9tYWluIGlzIG5vdCBtYXRjaGVkLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGxkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoIFRoZSAnLy8nIGZvciBhIHByb3RvY29sLXJlbGF0aXZlXG5cdCAqICAgbWF0Y2ggZnJvbSBhIFRMRCAodG9wIGxldmVsIGRvbWFpbikgbWF0Y2gsIHdpdGggdGhlIGNoYXJhY3RlciB0aGF0XG5cdCAqICAgY29tZXMgYmVmb3JlIHRoZSAnLy8nLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcGhvbmVNYXRjaCBUaGUgbWF0Y2hlZCB0ZXh0IG9mIGEgcGhvbmUgbnVtYmVyXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwaG9uZVBsdXNTaWduTWF0Y2ggVGhlICcrJyBzaWduIGluIHRoZSBwaG9uZSBudW1iZXIsIGlmXG5cdCAqICAgaXQgd2FzIHRoZXJlLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaGFzaHRhZ01hdGNoIFRoZSBtYXRjaGVkIHRleHQgb2YgYSBUd2l0dGVyXG5cdCAqICAgSGFzaHRhZywgaWYgdGhlIG1hdGNoIGlzIGEgSGFzaHRhZyBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGhhc2h0YWdQcmVmaXhXaGl0ZXNwYWNlQ2hhciBUaGUgd2hpdGVzcGFjZSBjaGFyXG5cdCAqICAgYmVmb3JlIHRoZSAjIHNpZ24gaW4gYSBIYXNodGFnIG1hdGNoLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIG9mIG5vXG5cdCAqICAgbG9va2JlaGluZHMgaW4gSlMgcmVnZXhlcywgYW5kIGlzIG5lZWQgdG8gcmUtaW5jbHVkZSB0aGUgY2hhcmFjdGVyIGZvclxuXHQgKiAgIHRoZSBhbmNob3IgdGFnIHJlcGxhY2VtZW50LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaGFzaHRhZyBUaGUgYWN0dWFsIEhhc2h0YWcgKGkuZSB0aGUgd29yZFxuXHQgKiAgIGFmdGVyIHRoZSAjIHNpZ24gaW4gYSBIYXNodGFnIG1hdGNoKS5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0fSBBIFwibWF0Y2ggZGVzY3JpcHRpb24gb2JqZWN0XCIuIFRoaXMgd2lsbCBiZSBgbnVsbGAgaWYgdGhlXG5cdCAqICAgbWF0Y2ggd2FzIGludmFsaWQsIG9yIGlmIGEgbWF0Y2ggdHlwZSBpcyBkaXNhYmxlZC4gT3RoZXJ3aXNlLCB0aGlzIHdpbGxcblx0ICogICBiZSBhbiBPYmplY3QgKG1hcCkgd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG5cdCAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJuLnByZWZpeFN0ciBUaGUgY2hhcihzKSB0aGF0IHNob3VsZCBiZSBwcmVwZW5kZWQgdG9cblx0ICogICB0aGUgcmVwbGFjZW1lbnQgc3RyaW5nLiBUaGVzZSBhcmUgY2hhcihzKSB0aGF0IHdlcmUgbmVlZGVkIHRvIGJlXG5cdCAqICAgaW5jbHVkZWQgZnJvbSB0aGUgcmVnZXggbWF0Y2ggdGhhdCB3ZXJlIGlnbm9yZWQgYnkgcHJvY2Vzc2luZyBjb2RlLCBhbmRcblx0ICogICBzaG91bGQgYmUgcmUtaW5zZXJ0ZWQgaW50byB0aGUgcmVwbGFjZW1lbnQgc3RyZWFtLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybi5zdWZmaXhTdHIgVGhlIGNoYXIocykgdGhhdCBzaG91bGQgYmUgYXBwZW5kZWQgdG9cblx0ICogICB0aGUgcmVwbGFjZW1lbnQgc3RyaW5nLiBUaGVzZSBhcmUgY2hhcihzKSB0aGF0IHdlcmUgbmVlZGVkIHRvIGJlXG5cdCAqICAgaW5jbHVkZWQgZnJvbSB0aGUgcmVnZXggbWF0Y2ggdGhhdCB3ZXJlIGlnbm9yZWQgYnkgcHJvY2Vzc2luZyBjb2RlLCBhbmRcblx0ICogICBzaG91bGQgYmUgcmUtaW5zZXJ0ZWQgaW50byB0aGUgcmVwbGFjZW1lbnQgc3RyZWFtLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSByZXR1cm4ubWF0Y2ggVGhlIE1hdGNoIG9iamVjdCB0aGF0XG5cdCAqICAgcmVwcmVzZW50cyB0aGUgbWF0Y2ggdGhhdCB3YXMgZm91bmQuXG5cdCAqL1xuXHRwcm9jZXNzQ2FuZGlkYXRlTWF0Y2ggOiBmdW5jdGlvbihcblx0XHRtYXRjaFN0ciwgdHdpdHRlck1hdGNoLCB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXIsIHR3aXR0ZXJIYW5kbGUsXG5cdFx0ZW1haWxBZGRyZXNzTWF0Y2gsIHVybE1hdGNoLCBzY2hlbWVVcmxNYXRjaCwgd3d3TWF0Y2gsIHd3d1Byb3RvY29sUmVsYXRpdmVNYXRjaCxcblx0XHR0bGRNYXRjaCwgdGxkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoLCBwaG9uZU1hdGNoLCBwaG9uZVBsdXNTaWduTWF0Y2gsIGhhc2h0YWdNYXRjaCxcblx0XHRoYXNodGFnUHJlZml4V2hpdGVzcGFjZUNoYXIsIGhhc2h0YWdcblx0KSB7XG5cdFx0Ly8gTm90ZTogVGhlIGBtYXRjaFN0cmAgdmFyaWFibGUgd2lsIGJlIGZpeGVkIHVwIHRvIHJlbW92ZSBjaGFyYWN0ZXJzIHRoYXQgYXJlIG5vIGxvbmdlciBuZWVkZWQgKHdoaWNoIHdpbGxcblx0XHQvLyBiZSBhZGRlZCB0byBgcHJlZml4U3RyYCBhbmQgYHN1ZmZpeFN0cmApLlxuXG5cdFx0dmFyIHByb3RvY29sUmVsYXRpdmVNYXRjaCA9IHd3d1Byb3RvY29sUmVsYXRpdmVNYXRjaCB8fCB0bGRQcm90b2NvbFJlbGF0aXZlTWF0Y2gsXG5cdFx0ICAgIG1hdGNoLCAgLy8gV2lsbCBiZSBhbiBBdXRvbGlua2VyLm1hdGNoLk1hdGNoIG9iamVjdFxuXG5cdFx0ICAgIHByZWZpeFN0ciA9IFwiXCIsICAvLyBBIHN0cmluZyB0byB1c2UgdG8gcHJlZml4IHRoZSBhbmNob3IgdGFnIHRoYXQgaXMgY3JlYXRlZC4gVGhpcyBpcyBuZWVkZWQgZm9yIHRoZSBUd2l0dGVyIGFuZCBIYXNodGFnIG1hdGNoZXMuXG5cdFx0ICAgIHN1ZmZpeFN0ciA9IFwiXCIsICAvLyBBIHN0cmluZyB0byBzdWZmaXggdGhlIGFuY2hvciB0YWcgdGhhdCBpcyBjcmVhdGVkLiBUaGlzIGlzIHVzZWQgaWYgdGhlcmUgaXMgYSB0cmFpbGluZyBwYXJlbnRoZXNpcyB0aGF0IHNob3VsZCBub3QgYmUgYXV0by1saW5rZWQuXG5cblx0XHQgICAgdXJscyA9IHRoaXMudXJsczsgIC8vIHRoZSAndXJscycgY29uZmlnXG5cblx0XHQvLyBSZXR1cm4gb3V0IHdpdGggYG51bGxgIGZvciBtYXRjaCB0eXBlcyB0aGF0IGFyZSBkaXNhYmxlZCAodXJsLCBlbWFpbCxcblx0XHQvLyB0d2l0dGVyLCBoYXNodGFnKSwgb3IgZm9yIG1hdGNoZXMgdGhhdCBhcmUgaW52YWxpZCAoZmFsc2UgcG9zaXRpdmVzXG5cdFx0Ly8gZnJvbSB0aGUgbWF0Y2hlclJlZ2V4LCB3aGljaCBjYW4ndCB1c2UgbG9vay1iZWhpbmRzIHNpbmNlIHRoZXkgYXJlXG5cdFx0Ly8gdW5hdmFpbGFibGUgaW4gSlMpLlxuXHRcdGlmKFxuXHRcdFx0KCBzY2hlbWVVcmxNYXRjaCAmJiAhdXJscy5zY2hlbWVNYXRjaGVzICkgfHxcblx0XHRcdCggd3d3TWF0Y2ggJiYgIXVybHMud3d3TWF0Y2hlcyApIHx8XG5cdFx0XHQoIHRsZE1hdGNoICYmICF1cmxzLnRsZE1hdGNoZXMgKSB8fFxuXHRcdFx0KCBlbWFpbEFkZHJlc3NNYXRjaCAmJiAhdGhpcy5lbWFpbCApIHx8XG5cdFx0XHQoIHBob25lTWF0Y2ggJiYgIXRoaXMucGhvbmUgKSB8fFxuXHRcdFx0KCB0d2l0dGVyTWF0Y2ggJiYgIXRoaXMudHdpdHRlciApIHx8XG5cdFx0XHQoIGhhc2h0YWdNYXRjaCAmJiAhdGhpcy5oYXNodGFnICkgfHxcblx0XHRcdCF0aGlzLm1hdGNoVmFsaWRhdG9yLmlzVmFsaWRNYXRjaCggdXJsTWF0Y2gsIHNjaGVtZVVybE1hdGNoLCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKVxuXHRcdCkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gSGFuZGxlIGEgY2xvc2luZyBwYXJlbnRoZXNpcyBhdCB0aGUgZW5kIG9mIHRoZSBtYXRjaCwgYW5kIGV4Y2x1ZGUgaXRcblx0XHQvLyBpZiB0aGVyZSBpcyBub3QgYSBtYXRjaGluZyBvcGVuIHBhcmVudGhlc2lzXG5cdFx0Ly8gaW4gdGhlIG1hdGNoIGl0c2VsZi5cblx0XHRpZiggdGhpcy5tYXRjaEhhc1VuYmFsYW5jZWRDbG9zaW5nUGFyZW4oIG1hdGNoU3RyICkgKSB7XG5cdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnN1YnN0ciggMCwgbWF0Y2hTdHIubGVuZ3RoIC0gMSApOyAgLy8gcmVtb3ZlIHRoZSB0cmFpbGluZyBcIilcIlxuXHRcdFx0c3VmZml4U3RyID0gXCIpXCI7ICAvLyB0aGlzIHdpbGwgYmUgYWRkZWQgYWZ0ZXIgdGhlIGdlbmVyYXRlZCA8YT4gdGFnXG5cdFx0fSBlbHNlIHtcblx0XHRcdC8vIEhhbmRsZSBhbiBpbnZhbGlkIGNoYXJhY3RlciBhZnRlciB0aGUgVExEXG5cdFx0XHR2YXIgcG9zID0gdGhpcy5tYXRjaEhhc0ludmFsaWRDaGFyQWZ0ZXJUbGQoIHVybE1hdGNoLCBzY2hlbWVVcmxNYXRjaCApO1xuXHRcdFx0aWYoIHBvcyA+IC0xICkge1xuXHRcdFx0XHRzdWZmaXhTdHIgPSBtYXRjaFN0ci5zdWJzdHIocG9zKTsgIC8vIHRoaXMgd2lsbCBiZSBhZGRlZCBhZnRlciB0aGUgZ2VuZXJhdGVkIDxhPiB0YWdcblx0XHRcdFx0bWF0Y2hTdHIgPSBtYXRjaFN0ci5zdWJzdHIoIDAsIHBvcyApOyAvLyByZW1vdmUgdGhlIHRyYWlsaW5nIGludmFsaWQgY2hhcnNcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiggZW1haWxBZGRyZXNzTWF0Y2ggKSB7XG5cdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLkVtYWlsKCB7IG1hdGNoZWRUZXh0OiBtYXRjaFN0ciwgZW1haWw6IGVtYWlsQWRkcmVzc01hdGNoIH0gKTtcblxuXHRcdH0gZWxzZSBpZiggdHdpdHRlck1hdGNoICkge1xuXHRcdFx0Ly8gZml4IHVwIHRoZSBgbWF0Y2hTdHJgIGlmIHRoZXJlIHdhcyBhIHByZWNlZGluZyB3aGl0ZXNwYWNlIGNoYXIsXG5cdFx0XHQvLyB3aGljaCB3YXMgbmVlZGVkIHRvIGRldGVybWluZSB0aGUgbWF0Y2ggaXRzZWxmIChzaW5jZSB0aGVyZSBhcmVcblx0XHRcdC8vIG5vIGxvb2stYmVoaW5kcyBpbiBKUyByZWdleGVzKVxuXHRcdFx0aWYoIHR3aXR0ZXJIYW5kbGVQcmVmaXhXaGl0ZXNwYWNlQ2hhciApIHtcblx0XHRcdFx0cHJlZml4U3RyID0gdHdpdHRlckhhbmRsZVByZWZpeFdoaXRlc3BhY2VDaGFyO1xuXHRcdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnNsaWNlKCAxICk7ICAvLyByZW1vdmUgdGhlIHByZWZpeGVkIHdoaXRlc3BhY2UgY2hhciBmcm9tIHRoZSBtYXRjaFxuXHRcdFx0fVxuXHRcdFx0bWF0Y2ggPSBuZXcgQXV0b2xpbmtlci5tYXRjaC5Ud2l0dGVyKCB7IG1hdGNoZWRUZXh0OiBtYXRjaFN0ciwgdHdpdHRlckhhbmRsZTogdHdpdHRlckhhbmRsZSB9ICk7XG5cblx0XHR9IGVsc2UgaWYoIHBob25lTWF0Y2ggKSB7XG5cdFx0XHQvLyByZW1vdmUgbm9uLW51bWVyaWMgdmFsdWVzIGZyb20gcGhvbmUgbnVtYmVyIHN0cmluZ1xuXHRcdFx0dmFyIGNsZWFuTnVtYmVyID0gbWF0Y2hTdHIucmVwbGFjZSggL1xcRC9nLCAnJyApO1xuIFx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guUGhvbmUoIHsgbWF0Y2hlZFRleHQ6IG1hdGNoU3RyLCBudW1iZXI6IGNsZWFuTnVtYmVyLCBwbHVzU2lnbjogISFwaG9uZVBsdXNTaWduTWF0Y2ggfSApO1xuXG5cdFx0fSBlbHNlIGlmKCBoYXNodGFnTWF0Y2ggKSB7XG5cdFx0XHQvLyBmaXggdXAgdGhlIGBtYXRjaFN0cmAgaWYgdGhlcmUgd2FzIGEgcHJlY2VkaW5nIHdoaXRlc3BhY2UgY2hhcixcblx0XHRcdC8vIHdoaWNoIHdhcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHRoZSBtYXRjaCBpdHNlbGYgKHNpbmNlIHRoZXJlIGFyZVxuXHRcdFx0Ly8gbm8gbG9vay1iZWhpbmRzIGluIEpTIHJlZ2V4ZXMpXG5cdFx0XHRpZiggaGFzaHRhZ1ByZWZpeFdoaXRlc3BhY2VDaGFyICkge1xuXHRcdFx0XHRwcmVmaXhTdHIgPSBoYXNodGFnUHJlZml4V2hpdGVzcGFjZUNoYXI7XG5cdFx0XHRcdG1hdGNoU3RyID0gbWF0Y2hTdHIuc2xpY2UoIDEgKTsgIC8vIHJlbW92ZSB0aGUgcHJlZml4ZWQgd2hpdGVzcGFjZSBjaGFyIGZyb20gdGhlIG1hdGNoXG5cdFx0XHR9XG5cdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLkhhc2h0YWcoIHsgbWF0Y2hlZFRleHQ6IG1hdGNoU3RyLCBzZXJ2aWNlTmFtZTogdGhpcy5oYXNodGFnLCBoYXNodGFnOiBoYXNodGFnIH0gKTtcblxuXHRcdH0gZWxzZSB7ICAvLyB1cmwgbWF0Y2hcblx0XHRcdC8vIElmIGl0J3MgYSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIG1hdGNoLCByZW1vdmUgdGhlIGNoYXJhY3RlclxuXHRcdFx0Ly8gYmVmb3JlIHRoZSAnLy8nICh3aGljaCB0aGUgbWF0Y2hlclJlZ2V4IG5lZWRlZCB0byBtYXRjaCBkdWUgdG9cblx0XHRcdC8vIHRoZSBsYWNrIG9mIGEgbmVnYXRpdmUgbG9vay1iZWhpbmQgaW4gSmF2YVNjcmlwdCByZWd1bGFyXG5cdFx0XHQvLyBleHByZXNzaW9ucylcblx0XHRcdGlmKCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSB7XG5cdFx0XHRcdHZhciBjaGFyQmVmb3JlTWF0Y2ggPSBwcm90b2NvbFJlbGF0aXZlTWF0Y2gubWF0Y2goIHRoaXMuY2hhckJlZm9yZVByb3RvY29sUmVsTWF0Y2hSZWdleCApWyAxIF0gfHwgXCJcIjtcblxuXHRcdFx0XHRpZiggY2hhckJlZm9yZU1hdGNoICkgeyAgLy8gZml4IHVwIHRoZSBgbWF0Y2hTdHJgIGlmIHRoZXJlIHdhcyBhIHByZWNlZGluZyBjaGFyIGJlZm9yZSBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLCB3aGljaCB3YXMgbmVlZGVkIHRvIGRldGVybWluZSB0aGUgbWF0Y2ggaXRzZWxmIChzaW5jZSB0aGVyZSBhcmUgbm8gbG9vay1iZWhpbmRzIGluIEpTIHJlZ2V4ZXMpXG5cdFx0XHRcdFx0cHJlZml4U3RyID0gY2hhckJlZm9yZU1hdGNoO1xuXHRcdFx0XHRcdG1hdGNoU3RyID0gbWF0Y2hTdHIuc2xpY2UoIDEgKTsgIC8vIHJlbW92ZSB0aGUgcHJlZml4ZWQgY2hhciBmcm9tIHRoZSBtYXRjaFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guVXJsKCB7XG5cdFx0XHRcdG1hdGNoZWRUZXh0IDogbWF0Y2hTdHIsXG5cdFx0XHRcdHVybCA6IG1hdGNoU3RyLFxuXHRcdFx0XHRwcm90b2NvbFVybE1hdGNoIDogISFzY2hlbWVVcmxNYXRjaCxcblx0XHRcdFx0cHJvdG9jb2xSZWxhdGl2ZU1hdGNoIDogISFwcm90b2NvbFJlbGF0aXZlTWF0Y2gsXG5cdFx0XHRcdHN0cmlwUHJlZml4IDogdGhpcy5zdHJpcFByZWZpeFxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB7XG5cdFx0XHRwcmVmaXhTdHIgOiBwcmVmaXhTdHIsXG5cdFx0XHRzdWZmaXhTdHIgOiBzdWZmaXhTdHIsXG5cdFx0XHRtYXRjaCAgICAgOiBtYXRjaFxuXHRcdH07XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIG1hdGNoIGZvdW5kIGhhcyBhbiB1bm1hdGNoZWQgY2xvc2luZyBwYXJlbnRoZXNpcy4gSWYgc28sXG5cdCAqIHRoaXMgcGFyZW50aGVzaXMgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIG1hdGNoIGl0c2VsZiwgYW5kIGFwcGVuZGVkXG5cdCAqIGFmdGVyIHRoZSBnZW5lcmF0ZWQgYW5jaG9yIHRhZyBpbiB7QGxpbmsgI3Byb2Nlc3NDYW5kaWRhdGVNYXRjaH0uXG5cdCAqXG5cdCAqIEEgbWF0Y2ggbWF5IGhhdmUgYW4gZXh0cmEgY2xvc2luZyBwYXJlbnRoZXNpcyBhdCB0aGUgZW5kIG9mIHRoZSBtYXRjaFxuXHQgKiBiZWNhdXNlIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gbXVzdCBpbmNsdWRlIHBhcmVudGhlc2lzIGZvciBVUkxzIHN1Y2ggYXNcblx0ICogXCJ3aWtpcGVkaWEuY29tL3NvbWV0aGluZ18oZGlzYW1iaWd1YXRpb24pXCIsIHdoaWNoIHNob3VsZCBiZSBhdXRvLWxpbmtlZC5cblx0ICpcblx0ICogSG93ZXZlciwgYW4gZXh0cmEgcGFyZW50aGVzaXMgKndpbGwqIGJlIGluY2x1ZGVkIHdoZW4gdGhlIFVSTCBpdHNlbGYgaXNcblx0ICogd3JhcHBlZCBpbiBwYXJlbnRoZXNpcywgc3VjaCBhcyBpbiB0aGUgY2FzZSBvZiBcIih3aWtpcGVkaWEuY29tL3NvbWV0aGluZ18oZGlzYW1iaWd1YXRpb24pKVwiLlxuXHQgKiBJbiB0aGlzIGNhc2UsIHRoZSBsYXN0IGNsb3NpbmcgcGFyZW50aGVzaXMgc2hvdWxkICpub3QqIGJlIHBhcnQgb2YgdGhlXG5cdCAqIFVSTCBpdHNlbGYsIGFuZCB0aGlzIG1ldGhvZCB3aWxsIHJldHVybiBgdHJ1ZWAuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBtYXRjaFN0ciBUaGUgZnVsbCBtYXRjaCBzdHJpbmcgZnJvbSB0aGUge0BsaW5rICNtYXRjaGVyUmVnZXh9LlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlcmUgaXMgYW4gdW5iYWxhbmNlZCBjbG9zaW5nIHBhcmVudGhlc2lzIGF0XG5cdCAqICAgdGhlIGVuZCBvZiB0aGUgYG1hdGNoU3RyYCwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRtYXRjaEhhc1VuYmFsYW5jZWRDbG9zaW5nUGFyZW4gOiBmdW5jdGlvbiggbWF0Y2hTdHIgKSB7XG5cdFx0dmFyIGxhc3RDaGFyID0gbWF0Y2hTdHIuY2hhckF0KCBtYXRjaFN0ci5sZW5ndGggLSAxICk7XG5cblx0XHRpZiggbGFzdENoYXIgPT09ICcpJyApIHtcblx0XHRcdHZhciBvcGVuUGFyZW5zTWF0Y2ggPSBtYXRjaFN0ci5tYXRjaCggL1xcKC9nICksXG5cdFx0XHQgICAgY2xvc2VQYXJlbnNNYXRjaCA9IG1hdGNoU3RyLm1hdGNoKCAvXFwpL2cgKSxcblx0XHRcdCAgICBudW1PcGVuUGFyZW5zID0gKCBvcGVuUGFyZW5zTWF0Y2ggJiYgb3BlblBhcmVuc01hdGNoLmxlbmd0aCApIHx8IDAsXG5cdFx0XHQgICAgbnVtQ2xvc2VQYXJlbnMgPSAoIGNsb3NlUGFyZW5zTWF0Y2ggJiYgY2xvc2VQYXJlbnNNYXRjaC5sZW5ndGggKSB8fCAwO1xuXG5cdFx0XHRpZiggbnVtT3BlblBhcmVucyA8IG51bUNsb3NlUGFyZW5zICkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIGlmIHRoZXJlJ3MgYW4gaW52YWxpZCBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIFRMRCBpbiBhIFVSTC4gVmFsaWRcblx0ICogY2hhcmFjdGVycyBhZnRlciBUTEQgYXJlICc6Lz8jJy4gRXhjbHVkZSBwcm90b2NvbCBtYXRjaGVkIFVSTHMgZnJvbSB0aGlzXG5cdCAqIGNoZWNrLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuXG5cdCAqICAgZW1wdHkgc3RyaW5nIGlmIHRoZSBtYXRjaCBpcyBub3QgYSBVUkwgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFVybE1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIHByb3RvY29sXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBtYXRjaCBzb21ldGhpbmcgbGlrZVxuXHQgKiAgICdodHRwOi8vbG9jYWxob3N0Jywgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lXG5cdCAqICAgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEByZXR1cm4ge051bWJlcn0gdGhlIHBvc2l0aW9uIHdoZXJlIHRoZSBpbnZhbGlkIGNoYXJhY3RlciB3YXMgZm91bmQuIElmXG5cdCAqICAgbm8gc3VjaCBjaGFyYWN0ZXIgd2FzIGZvdW5kLCByZXR1cm5zIC0xXG5cdCAqL1xuXHRtYXRjaEhhc0ludmFsaWRDaGFyQWZ0ZXJUbGQgOiBmdW5jdGlvbiggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2ggKSB7XG5cdFx0aWYgKCAhdXJsTWF0Y2ggKSB7XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXG5cdFx0dmFyIG9mZnNldCA9IDA7XG5cdFx0aWYgKCBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdFx0b2Zmc2V0ID0gdXJsTWF0Y2guaW5kZXhPZignOicpO1xuXHRcdFx0dXJsTWF0Y2ggPSB1cmxNYXRjaC5zbGljZShvZmZzZXQpO1xuXHRcdH1cblxuXHRcdHZhciByZSA9IC9eKCguP1xcL1xcLyk/W0EtWmEtejAtOVxcLlxcLV0qW0EtWmEtejAtOVxcLV1cXC5bQS1aYS16XSspLztcblx0XHR2YXIgcmVzID0gcmUuZXhlYyggdXJsTWF0Y2ggKTtcblx0XHRpZiAoIHJlcyA9PT0gbnVsbCApIHtcblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cblx0XHRvZmZzZXQgKz0gcmVzWzFdLmxlbmd0aDtcblx0XHR1cmxNYXRjaCA9IHVybE1hdGNoLnNsaWNlKHJlc1sxXS5sZW5ndGgpO1xuXHRcdGlmICgvXlteLkEtWmEtejpcXC8/I10vLnRlc3QodXJsTWF0Y2gpKSB7XG5cdFx0XHRyZXR1cm4gb2Zmc2V0O1xuXHRcdH1cblxuXHRcdHJldHVybiAtMTtcblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qanNoaW50IHNjcmlwdHVybDp0cnVlICovXG4vKipcbiAqIEBwcml2YXRlXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogVXNlZCBieSBBdXRvbGlua2VyIHRvIGZpbHRlciBvdXQgZmFsc2UgcG9zaXRpdmVzIGZyb20gdGhlXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlciNtYXRjaGVyUmVnZXh9LlxuICpcbiAqIER1ZSB0byB0aGUgbGltaXRhdGlvbnMgb2YgcmVndWxhciBleHByZXNzaW9ucyAoaW5jbHVkaW5nIHRoZSBtaXNzaW5nIGZlYXR1cmVcbiAqIG9mIGxvb2stYmVoaW5kcyBpbiBKUyByZWd1bGFyIGV4cHJlc3Npb25zKSwgd2UgY2Fubm90IGFsd2F5cyBkZXRlcm1pbmUgdGhlXG4gKiB2YWxpZGl0eSBvZiBhIGdpdmVuIG1hdGNoLiBUaGlzIGNsYXNzIGFwcGxpZXMgYSBiaXQgb2YgYWRkaXRpb25hbCBsb2dpYyB0b1xuICogZmlsdGVyIG91dCBhbnkgZmFsc2UgcG9zaXRpdmVzIHRoYXQgaGF2ZSBiZWVuIG1hdGNoZWQgYnkgdGhlXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlciNtYXRjaGVyUmVnZXh9LlxuICovXG5BdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBpbnZhbGlkUHJvdG9jb2xSZWxNYXRjaFJlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byBjaGVjayBhIHBvdGVudGlhbCBwcm90b2NvbC1yZWxhdGl2ZSBVUkxcblx0ICogbWF0Y2gsIGNvbWluZyBmcm9tIHRoZSB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaFBhcnNlci5NYXRjaFBhcnNlciNtYXRjaGVyUmVnZXh9LlxuXHQgKiBBIHByb3RvY29sLXJlbGF0aXZlIFVSTCBpcywgZm9yIGV4YW1wbGUsIFwiLy95YWhvby5jb21cIlxuXHQgKlxuXHQgKiBUaGlzIHJlZ3VsYXIgZXhwcmVzc2lvbiBjaGVja3MgdG8gc2VlIGlmIHRoZXJlIGlzIGEgd29yZCBjaGFyYWN0ZXIgYmVmb3JlXG5cdCAqIHRoZSAnLy8nIG1hdGNoIGluIG9yZGVyIHRvIGRldGVybWluZSBpZiB3ZSBzaG91bGQgYWN0dWFsbHkgYXV0b2xpbmsgYVxuXHQgKiBwcm90b2NvbC1yZWxhdGl2ZSBVUkwuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVnYXRpdmVcblx0ICogbG9vay1iZWhpbmQgaW4gSmF2YVNjcmlwdCByZWd1bGFyIGV4cHJlc3Npb25zLlxuXHQgKlxuXHQgKiBGb3IgaW5zdGFuY2UsIHdlIHdhbnQgdG8gYXV0b2xpbmsgc29tZXRoaW5nIGxpa2UgXCJHbyB0bzogLy9nb29nbGUuY29tXCIsXG5cdCAqIGJ1dCB3ZSBkb24ndCB3YW50IHRvIGF1dG9saW5rIHNvbWV0aGluZyBsaWtlIFwiYWJjLy9nb29nbGUuY29tXCJcblx0ICovXG5cdGludmFsaWRQcm90b2NvbFJlbE1hdGNoUmVnZXggOiAvXltcXHddXFwvXFwvLyxcblxuXHQvKipcblx0ICogUmVnZXggdG8gdGVzdCBmb3IgYSBmdWxsIHByb3RvY29sLCB3aXRoIHRoZSB0d28gdHJhaWxpbmcgc2xhc2hlcy4gRXg6ICdodHRwOi8vJ1xuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaGFzRnVsbFByb3RvY29sUmVnZXhcblx0ICovXG5cdGhhc0Z1bGxQcm90b2NvbFJlZ2V4IDogL15bQS1aYS16XVstLitBLVphLXowLTldKjpcXC9cXC8vLFxuXG5cdC8qKlxuXHQgKiBSZWdleCB0byBmaW5kIHRoZSBVUkkgc2NoZW1lLCBzdWNoIGFzICdtYWlsdG86Jy5cblx0ICpcblx0ICogVGhpcyBpcyB1c2VkIHRvIGZpbHRlciBvdXQgJ2phdmFzY3JpcHQ6JyBhbmQgJ3Zic2NyaXB0Oicgc2NoZW1lcy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHVyaVNjaGVtZVJlZ2V4XG5cdCAqL1xuXHR1cmlTY2hlbWVSZWdleCA6IC9eW0EtWmEtel1bLS4rQS1aYS16MC05XSo6LyxcblxuXHQvKipcblx0ICogUmVnZXggdG8gZGV0ZXJtaW5lIGlmIGF0IGxlYXN0IG9uZSB3b3JkIGNoYXIgZXhpc3RzIGFmdGVyIHRoZSBwcm90b2NvbCAoaS5lLiBhZnRlciB0aGUgJzonKVxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gaGFzV29yZENoYXJBZnRlclByb3RvY29sUmVnZXhcblx0ICovXG5cdGhhc1dvcmRDaGFyQWZ0ZXJQcm90b2NvbFJlZ2V4IDogLzpbXlxcc10qP1tBLVphLXpdLyxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gbWF0Y2ggZm91bmQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyfVxuXHQgKiBpcyB2YWxpZC4gV2lsbCByZXR1cm4gYGZhbHNlYCBmb3I6XG5cdCAqXG5cdCAqIDEpIFVSTCBtYXRjaGVzIHdoaWNoIGRvIG5vdCBoYXZlIGF0IGxlYXN0IGhhdmUgb25lIHBlcmlvZCAoJy4nKSBpbiB0aGVcblx0ICogICAgZG9tYWluIG5hbWUgKGVmZmVjdGl2ZWx5IHNraXBwaW5nIG92ZXIgbWF0Y2hlcyBsaWtlIFwiYWJjOmRlZlwiKS5cblx0ICogICAgSG93ZXZlciwgVVJMIG1hdGNoZXMgd2l0aCBhIHByb3RvY29sIHdpbGwgYmUgYWxsb3dlZCAoZXg6ICdodHRwOi8vbG9jYWxob3N0Jylcblx0ICogMikgVVJMIG1hdGNoZXMgd2hpY2ggZG8gbm90IGhhdmUgYXQgbGVhc3Qgb25lIHdvcmQgY2hhcmFjdGVyIGluIHRoZVxuXHQgKiAgICBkb21haW4gbmFtZSAoZWZmZWN0aXZlbHkgc2tpcHBpbmcgb3ZlciBtYXRjaGVzIGxpa2UgXCJnaXQ6MS4wXCIpLlxuXHQgKiAzKSBBIHByb3RvY29sLXJlbGF0aXZlIHVybCBtYXRjaCAoYSBVUkwgYmVnaW5uaW5nIHdpdGggJy8vJykgd2hvc2Vcblx0ICogICAgcHJldmlvdXMgY2hhcmFjdGVyIGlzIGEgd29yZCBjaGFyYWN0ZXIgKGVmZmVjdGl2ZWx5IHNraXBwaW5nIG92ZXJcblx0ICogICAgc3RyaW5ncyBsaWtlIFwiYWJjLy9nb29nbGUuY29tXCIpXG5cdCAqXG5cdCAqIE90aGVyd2lzZSwgcmV0dXJucyBgdHJ1ZWAuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwsIGlmIHRoZXJlIHdhcyBvbmUuIFdpbGwgYmUgYW5cblx0ICogICBlbXB0eSBzdHJpbmcgaWYgdGhlIG1hdGNoIGlzIG5vdCBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoIHNvbWV0aGluZyBsaWtlXG5cdCAqICAgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWVcblx0ICogICBoYXMgYXQgbGVhc3Qgb25lICcuJyBpbiBpdC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgcHJvdG9jb2wtcmVsYXRpdmUgc3RyaW5nIGZvciBhXG5cdCAqICAgVVJMIG1hdGNoIChpLmUuICcvLycpLCBwb3NzaWJseSB3aXRoIGEgcHJlY2VkaW5nIGNoYXJhY3RlciAoZXgsIGFcblx0ICogICBzcGFjZSwgc3VjaCBhczogJyAvLycsIG9yIGEgbGV0dGVyLCBzdWNoIGFzOiAnYS8vJykuIFRoZSBtYXRjaCBpc1xuXHQgKiAgIGludmFsaWQgaWYgdGhlcmUgaXMgYSB3b3JkIGNoYXJhY3RlciBwcmVjZWRpbmcgdGhlICcvLycuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgbWF0Y2ggZ2l2ZW4gaXMgdmFsaWQgYW5kIHNob3VsZCBiZVxuXHQgKiAgIHByb2Nlc3NlZCwgb3IgYGZhbHNlYCBpZiB0aGUgbWF0Y2ggaXMgaW52YWxpZCBhbmQvb3Igc2hvdWxkIGp1c3Qgbm90IGJlXG5cdCAqICAgcHJvY2Vzc2VkLlxuXHQgKi9cblx0aXNWYWxpZE1hdGNoIDogZnVuY3Rpb24oIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoLCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSB7XG5cdFx0aWYoXG5cdFx0XHQoIHByb3RvY29sVXJsTWF0Y2ggJiYgIXRoaXMuaXNWYWxpZFVyaVNjaGVtZSggcHJvdG9jb2xVcmxNYXRjaCApICkgfHxcblx0XHRcdHRoaXMudXJsTWF0Y2hEb2VzTm90SGF2ZVByb3RvY29sT3JEb3QoIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkgfHwgICAgICAgLy8gQXQgbGVhc3Qgb25lIHBlcmlvZCAoJy4nKSBtdXN0IGV4aXN0IGluIHRoZSBVUkwgbWF0Y2ggZm9yIHVzIHRvIGNvbnNpZGVyIGl0IGFuIGFjdHVhbCBVUkwsICp1bmxlc3MqIGl0IHdhcyBhIGZ1bGwgcHJvdG9jb2wgbWF0Y2ggKGxpa2UgJ2h0dHA6Ly9sb2NhbGhvc3QnKVxuXHRcdFx0dGhpcy51cmxNYXRjaERvZXNOb3RIYXZlQXRMZWFzdE9uZVdvcmRDaGFyKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHx8ICAvLyBBdCBsZWFzdCBvbmUgbGV0dGVyIGNoYXJhY3RlciBtdXN0IGV4aXN0IGluIHRoZSBkb21haW4gbmFtZSBhZnRlciBhIHByb3RvY29sIG1hdGNoLiBFeDogc2tpcCBvdmVyIHNvbWV0aGluZyBsaWtlIFwiZ2l0OjEuMFwiXG5cdFx0XHR0aGlzLmlzSW52YWxpZFByb3RvY29sUmVsYXRpdmVNYXRjaCggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkgICAgICAgICAgICAgICAgIC8vIEEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2ggd2hpY2ggaGFzIGEgd29yZCBjaGFyYWN0ZXIgaW4gZnJvbnQgb2YgaXQgKHNvIHdlIGNhbiBza2lwIHNvbWV0aGluZyBsaWtlIFwiYWJjLy9nb29nbGUuY29tXCIpXG5cdFx0KSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiB0aGUgVVJJIHNjaGVtZSBpcyBhIHZhbGlkIHNjaGVtZSB0byBiZSBhdXRvbGlua2VkLiBSZXR1cm5zXG5cdCAqIGBmYWxzZWAgaWYgdGhlIHNjaGVtZSBpcyAnamF2YXNjcmlwdDonIG9yICd2YnNjcmlwdDonXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmlTY2hlbWVNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBmdWxsIFVSSSBzY2hlbWVcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJyBvciAnbWFpbHRvOmFAYS5jb20nLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIHNjaGVtZSBpcyBhIHZhbGlkIG9uZSwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRpc1ZhbGlkVXJpU2NoZW1lIDogZnVuY3Rpb24oIHVyaVNjaGVtZU1hdGNoICkge1xuXHRcdHZhciB1cmlTY2hlbWUgPSB1cmlTY2hlbWVNYXRjaC5tYXRjaCggdGhpcy51cmlTY2hlbWVSZWdleCApWyAwIF0udG9Mb3dlckNhc2UoKTtcblxuXHRcdHJldHVybiAoIHVyaVNjaGVtZSAhPT0gJ2phdmFzY3JpcHQ6JyAmJiB1cmlTY2hlbWUgIT09ICd2YnNjcmlwdDonICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIFVSTCBtYXRjaCBkb2VzIG5vdCBoYXZlIGVpdGhlcjpcblx0ICpcblx0ICogYSkgYSBmdWxsIHByb3RvY29sIChpLmUuICdodHRwOi8vJyksIG9yXG5cdCAqIGIpIGF0IGxlYXN0IG9uZSBkb3QgKCcuJykgaW4gdGhlIGRvbWFpbiBuYW1lIChmb3IgYSBub24tZnVsbC1wcm90b2NvbFxuXHQgKiAgICBtYXRjaCkuXG5cdCAqXG5cdCAqIEVpdGhlciBzaXR1YXRpb24gaXMgY29uc2lkZXJlZCBhbiBpbnZhbGlkIFVSTCAoZXg6ICdnaXQ6ZCcgZG9lcyBub3QgaGF2ZVxuXHQgKiBlaXRoZXIgdGhlICc6Ly8nIHBhcnQsIG9yIGF0IGxlYXN0IG9uZSBkb3QgaW4gdGhlIGRvbWFpbiBuYW1lLiBJZiB0aGVcblx0ICogbWF0Y2ggd2FzICdnaXQ6YWJjLmNvbScsIHdlIHdvdWxkIGNvbnNpZGVyIHRoaXMgdmFsaWQuKVxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdXJsTWF0Y2ggVGhlIG1hdGNoZWQgVVJMLCBpZiB0aGVyZSB3YXMgb25lLiBXaWxsIGJlIGFuXG5cdCAqICAgZW1wdHkgc3RyaW5nIGlmIHRoZSBtYXRjaCBpcyBub3QgYSBVUkwgbWF0Y2guXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFVybE1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIHByb3RvY29sXG5cdCAqICAgbWF0Y2guIEV4OiAnaHR0cDovL3lhaG9vLmNvbScuIFRoaXMgaXMgdXNlZCB0byBtYXRjaCBzb21ldGhpbmcgbGlrZVxuXHQgKiAgICdodHRwOi8vbG9jYWxob3N0Jywgd2hlcmUgd2Ugd29uJ3QgZG91YmxlIGNoZWNrIHRoYXQgdGhlIGRvbWFpbiBuYW1lXG5cdCAqICAgaGFzIGF0IGxlYXN0IG9uZSAnLicgaW4gaXQuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgVVJMIG1hdGNoIGRvZXMgbm90IGhhdmUgYSBmdWxsIHByb3RvY29sLFxuXHQgKiAgIG9yIGF0IGxlYXN0IG9uZSBkb3QgKCcuJykgaW4gYSBub24tZnVsbC1wcm90b2NvbCBtYXRjaC5cblx0ICovXG5cdHVybE1hdGNoRG9lc05vdEhhdmVQcm90b2NvbE9yRG90IDogZnVuY3Rpb24oIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdHJldHVybiAoICEhdXJsTWF0Y2ggJiYgKCAhcHJvdG9jb2xVcmxNYXRjaCB8fCAhdGhpcy5oYXNGdWxsUHJvdG9jb2xSZWdleC50ZXN0KCBwcm90b2NvbFVybE1hdGNoICkgKSAmJiB1cmxNYXRjaC5pbmRleE9mKCAnLicgKSA9PT0gLTEgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgVVJMIG1hdGNoIGRvZXMgbm90IGhhdmUgYXQgbGVhc3Qgb25lIHdvcmQgY2hhcmFjdGVyIGFmdGVyXG5cdCAqIHRoZSBwcm90b2NvbCAoaS5lLiBpbiB0aGUgZG9tYWluIG5hbWUpLlxuXHQgKlxuXHQgKiBBdCBsZWFzdCBvbmUgbGV0dGVyIGNoYXJhY3RlciBtdXN0IGV4aXN0IGluIHRoZSBkb21haW4gbmFtZSBhZnRlciBhXG5cdCAqIHByb3RvY29sIG1hdGNoLiBFeDogc2tpcCBvdmVyIHNvbWV0aGluZyBsaWtlIFwiZ2l0OjEuMFwiXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwsIGlmIHRoZXJlIHdhcyBvbmUuIFdpbGwgYmUgYW5cblx0ICogICBlbXB0eSBzdHJpbmcgaWYgdGhlIG1hdGNoIGlzIG5vdCBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIGtub3cgd2hldGhlciBvciBub3Qgd2Vcblx0ICogICBoYXZlIGEgcHJvdG9jb2wgaW4gdGhlIFVSTCBzdHJpbmcsIGluIG9yZGVyIHRvIGNoZWNrIGZvciBhIHdvcmRcblx0ICogICBjaGFyYWN0ZXIgYWZ0ZXIgdGhlIHByb3RvY29sIHNlcGFyYXRvciAoJzonKS5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBVUkwgbWF0Y2ggZG9lcyBub3QgaGF2ZSBhdCBsZWFzdCBvbmUgd29yZFxuXHQgKiAgIGNoYXJhY3RlciBpbiBpdCBhZnRlciB0aGUgcHJvdG9jb2wsIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0dXJsTWF0Y2hEb2VzTm90SGF2ZUF0TGVhc3RPbmVXb3JkQ2hhciA6IGZ1bmN0aW9uKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRpZiggdXJsTWF0Y2ggJiYgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRcdHJldHVybiAhdGhpcy5oYXNXb3JkQ2hhckFmdGVyUHJvdG9jb2xSZWdleC50ZXN0KCB1cmxNYXRjaCApO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCBpcyBhbiBpbnZhbGlkIG9uZS4gVGhpcyBtZXRob2Rcblx0ICogcmV0dXJucyBgdHJ1ZWAgaWYgdGhlcmUgaXMgYSBgcHJvdG9jb2xSZWxhdGl2ZU1hdGNoYCwgYW5kIHRoYXQgbWF0Y2hcblx0ICogY29udGFpbnMgYSB3b3JkIGNoYXJhY3RlciBiZWZvcmUgdGhlICcvLycgKGkuZS4gaXQgbXVzdCBjb250YWluXG5cdCAqIHdoaXRlc3BhY2Ugb3Igbm90aGluZyBiZWZvcmUgdGhlICcvLycgaW4gb3JkZXIgdG8gYmUgY29uc2lkZXJlZCB2YWxpZCkuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggVGhlIHByb3RvY29sLXJlbGF0aXZlIHN0cmluZyBmb3IgYVxuXHQgKiAgIFVSTCBtYXRjaCAoaS5lLiAnLy8nKSwgcG9zc2libHkgd2l0aCBhIHByZWNlZGluZyBjaGFyYWN0ZXIgKGV4LCBhXG5cdCAqICAgc3BhY2UsIHN1Y2ggYXM6ICcgLy8nLCBvciBhIGxldHRlciwgc3VjaCBhczogJ2EvLycpLiBUaGUgbWF0Y2ggaXNcblx0ICogICBpbnZhbGlkIGlmIHRoZXJlIGlzIGEgd29yZCBjaGFyYWN0ZXIgcHJlY2VkaW5nIHRoZSAnLy8nLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgaXQgaXMgYW4gaW52YWxpZCBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCxcblx0ICogICBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdGlzSW52YWxpZFByb3RvY29sUmVsYXRpdmVNYXRjaCA6IGZ1bmN0aW9uKCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSB7XG5cdFx0cmV0dXJuICggISFwcm90b2NvbFJlbGF0aXZlTWF0Y2ggJiYgdGhpcy5pbnZhbGlkUHJvdG9jb2xSZWxNYXRjaFJlZ2V4LnRlc3QoIHByb3RvY29sUmVsYXRpdmVNYXRjaCApICk7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBhYnN0cmFjdFxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqIFxuICogUmVwcmVzZW50cyBhIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmUgQXV0b2xpbmtlZC4gQSBNYXRjaCBvYmplY3QgaXMgd2hhdCBpcyBwcm92aWRlZCBpbiBhIFxuICoge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0sIGFuZCBtYXkgYmUgdXNlZCB0byBxdWVyeSBmb3IgZGV0YWlscyBhYm91dCB0aGUgbWF0Y2guXG4gKiBcbiAqIEZvciBleGFtcGxlOlxuICogXG4gKiAgICAgdmFyIGlucHV0ID0gXCIuLi5cIjsgIC8vIHN0cmluZyB3aXRoIFVSTHMsIEVtYWlsIEFkZHJlc3NlcywgYW5kIFR3aXR0ZXIgSGFuZGxlc1xuICogICAgIFxuICogICAgIHZhciBsaW5rZWRUZXh0ID0gQXV0b2xpbmtlci5saW5rKCBpbnB1dCwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJocmVmID0gXCIsIG1hdGNoLmdldEFuY2hvckhyZWYoKSApO1xuICogICAgICAgICAgICAgY29uc29sZS5sb2coIFwidGV4dCA9IFwiLCBtYXRjaC5nZXRBbmNob3JUZXh0KCkgKTtcbiAqICAgICAgICAgXG4gKiAgICAgICAgICAgICBzd2l0Y2goIG1hdGNoLmdldFR5cGUoKSApIHtcbiAqICAgICAgICAgICAgICAgICBjYXNlICd1cmwnIDogXG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInVybDogXCIsIG1hdGNoLmdldFVybCgpICk7XG4gKiAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgIGNhc2UgJ2VtYWlsJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImVtYWlsOiBcIiwgbWF0Y2guZ2V0RW1haWwoKSApO1xuICogICAgICAgICAgICAgICAgICAgICBcbiAqICAgICAgICAgICAgICAgICBjYXNlICd0d2l0dGVyJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInR3aXR0ZXI6IFwiLCBtYXRjaC5nZXRUd2l0dGVySGFuZGxlKCkgKTtcbiAqICAgICAgICAgICAgIH1cbiAqICAgICAgICAgfVxuICogICAgIH0gKTtcbiAqICAgICBcbiAqIFNlZSB0aGUge0BsaW5rIEF1dG9saW5rZXJ9IGNsYXNzIGZvciBtb3JlIGRldGFpbHMgb24gdXNpbmcgdGhlIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59LlxuICovXG5BdXRvbGlua2VyLm1hdGNoLk1hdGNoID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBtYXRjaGVkVGV4dCAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBUaGUgb3JpZ2luYWwgdGV4dCB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0XG5cdFxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjZmcgVGhlIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcyBmb3IgdGhlIE1hdGNoIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXHR9LFxuXG5cdFxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogQXV0b2xpbmtlci5VdGlsLmFic3RyYWN0TWV0aG9kLFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBvcmlnaW5hbCB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRNYXRjaGVkVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLm1hdGNoZWRUZXh0O1xuXHR9LFxuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IEF1dG9saW5rZXIuVXRpbC5hYnN0cmFjdE1ldGhvZCxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAYWJzdHJhY3Rcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IEF1dG9saW5rZXIuVXRpbC5hYnN0cmFjdE1ldGhvZFxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLkVtYWlsXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKiBcbiAqIFJlcHJlc2VudHMgYSBFbWFpbCBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlIEF1dG9saW5rZWQuXG4gKiBcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLkVtYWlsID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gZW1haWwgKHJlcXVpcmVkKVxuXHQgKiBcblx0ICogVGhlIGVtYWlsIGFkZHJlc3MgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZW1haWwnO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBlbWFpbCBhZGRyZXNzIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRFbWFpbCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmVtYWlsO1xuXHR9LFxuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdtYWlsdG86JyArIHRoaXMuZW1haWw7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmVtYWlsO1xuXHR9XG5cdFxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5IYXNodGFnXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKlxuICogUmVwcmVzZW50cyBhIEhhc2h0YWcgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZVxuICogQXV0b2xpbmtlZC5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guSGFzaHRhZyA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBzZXJ2aWNlTmFtZSAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSBzZXJ2aWNlIHRvIHBvaW50IGhhc2h0YWcgbWF0Y2hlcyB0by4gU2VlIHtAbGluayBBdXRvbGlua2VyI2hhc2h0YWd9XG5cdCAqIGZvciBhdmFpbGFibGUgdmFsdWVzLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBoYXNodGFnIChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIEhhc2h0YWcgdGhhdCB3YXMgbWF0Y2hlZCwgd2l0aG91dCB0aGUgJyMnLlxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdoYXNodGFnJztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBtYXRjaGVkIGhhc2h0YWcuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEhhc2h0YWcgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5oYXNodGFnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNlcnZpY2VOYW1lID0gdGhpcy5zZXJ2aWNlTmFtZSxcblx0XHQgICAgaGFzaHRhZyA9IHRoaXMuaGFzaHRhZztcblxuXHRcdHN3aXRjaCggc2VydmljZU5hbWUgKSB7XG5cdFx0XHRjYXNlICd0d2l0dGVyJyA6XG5cdFx0XHRcdHJldHVybiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9oYXNodGFnLycgKyBoYXNodGFnO1xuXHRcdFx0Y2FzZSAnZmFjZWJvb2snIDpcblx0XHRcdFx0cmV0dXJuICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vaGFzaHRhZy8nICsgaGFzaHRhZztcblx0XHRcdGNhc2UgJ2luc3RhZ3JhbScgOlxuXHRcdFx0XHRyZXR1cm4gJ2h0dHBzOi8vaW5zdGFncmFtLmNvbS9leHBsb3JlL3RhZ3MvJyArIGhhc2h0YWc7XG5cblx0XHRcdGRlZmF1bHQgOiAgLy8gU2hvdWxkbid0IGhhcHBlbiBiZWNhdXNlIEF1dG9saW5rZXIncyBjb25zdHJ1Y3RvciBzaG91bGQgYmxvY2sgYW55IGludmFsaWQgdmFsdWVzLCBidXQganVzdCBpbiBjYXNlLlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoICdVbmtub3duIHNlcnZpY2UgbmFtZSB0byBwb2ludCBoYXNodGFnIHRvOiAnLCBzZXJ2aWNlTmFtZSApO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnIycgKyB0aGlzLmhhc2h0YWc7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLlBob25lXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLm1hdGNoLk1hdGNoXG4gKlxuICogUmVwcmVzZW50cyBhIFBob25lIG51bWJlciBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlXG4gKiBBdXRvbGlua2VkLlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5QaG9uZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBudW1iZXIgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgcGhvbmUgbnVtYmVyIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBwbHVzU2lnbiAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiB0aGUgbWF0Y2hlZCBwaG9uZSBudW1iZXIgc3RhcnRlZCB3aXRoIGEgJysnIHNpZ24uIFdlJ2xsIGluY2x1ZGVcblx0ICogaXQgaW4gdGhlIGB0ZWw6YCBVUkwgaWYgc28sIGFzIHRoaXMgaXMgbmVlZGVkIGZvciBpbnRlcm5hdGlvbmFsIG51bWJlcnMuXG5cdCAqXG5cdCAqIEV4OiAnKzEgKDEyMykgNDU2IDc4NzknXG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3Bob25lJztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBwaG9uZSBudW1iZXIgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0TnVtYmVyOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5udW1iZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3RlbDonICsgKCB0aGlzLnBsdXNTaWduID8gJysnIDogJycgKSArIHRoaXMubnVtYmVyO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMubWF0Y2hlZFRleHQ7XG5cdH1cblxufSApO1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLlR3aXR0ZXJcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqIFxuICogUmVwcmVzZW50cyBhIFR3aXR0ZXIgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZSBBdXRvbGlua2VkLlxuICogXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSkgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5Ud2l0dGVyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXHRcblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gdHdpdHRlckhhbmRsZSAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBUaGUgVHdpdHRlciBoYW5kbGUgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAndHdpdHRlcic7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUd2l0dGVySGFuZGxlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMudHdpdHRlckhhbmRsZTtcblx0fSxcblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnaHR0cHM6Ly90d2l0dGVyLmNvbS8nICsgdGhpcy50d2l0dGVySGFuZGxlO1xuXHR9LFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ0AnICsgdGhpcy50d2l0dGVySGFuZGxlO1xuXHR9XG5cdFxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5VcmxcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqXG4gKiBSZXByZXNlbnRzIGEgVXJsIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmUgQXV0b2xpbmtlZC5cbiAqXG4gKiBTZWUgdGhpcyBjbGFzcydzIHN1cGVyY2xhc3MgKHtAbGluayBBdXRvbGlua2VyLm1hdGNoLk1hdGNofSkgZm9yIG1vcmUgZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5VcmwgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLm1hdGNoLk1hdGNoLCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gdXJsIChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIHVybCB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gcHJvdG9jb2xVcmxNYXRjaCAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiB0aGUgVVJMIGlzIGEgbWF0Y2ggd2hpY2ggYWxyZWFkeSBoYXMgYSBwcm90b2NvbCAoaS5lLiAnaHR0cDovLycpLCBgZmFsc2VgIGlmIHRoZSBtYXRjaCB3YXMgZnJvbSBhICd3d3cnIG9yXG5cdCAqIGtub3duIFRMRCBtYXRjaC5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHByb3RvY29sUmVsYXRpdmVNYXRjaCAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiB0aGUgVVJMIGlzIGEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2guIEEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2ggaXMgYSBVUkwgdGhhdCBzdGFydHMgd2l0aCAnLy8nLFxuXHQgKiBhbmQgd2lsbCBiZSBlaXRoZXIgaHR0cDovLyBvciBodHRwczovLyBiYXNlZCBvbiB0aGUgcHJvdG9jb2wgdGhhdCB0aGUgc2l0ZSBpcyBsb2FkZWQgdW5kZXIuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBzdHJpcFByZWZpeCAocmVxdWlyZWQpXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjc3RyaXBQcmVmaXhcblx0ICovXG5cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHVybFByZWZpeFJlZ2V4XG5cdCAqXG5cdCAqIEEgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcmVtb3ZlIHRoZSAnaHR0cDovLycgb3IgJ2h0dHBzOi8vJyBhbmQvb3IgdGhlICd3d3cuJyBmcm9tIFVSTHMuXG5cdCAqL1xuXHR1cmxQcmVmaXhSZWdleDogL14oaHR0cHM/OlxcL1xcLyk/KHd3d1xcLik/L2ksXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBwcm90b2NvbFJlbGF0aXZlUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHJlbW92ZSB0aGUgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBmcm9tIHRoZSB7QGxpbmsgI3VybH0gc3RyaW5nLCBmb3IgcHVycG9zZXNcblx0ICogb2Yge0BsaW5rICNnZXRBbmNob3JUZXh0fS4gQSBwcm90b2NvbC1yZWxhdGl2ZSBVUkwgaXMsIGZvciBleGFtcGxlLCBcIi8veWFob28uY29tXCJcblx0ICovXG5cdHByb3RvY29sUmVsYXRpdmVSZWdleCA6IC9eXFwvXFwvLyxcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtCb29sZWFufSBwcm90b2NvbFByZXBlbmRlZFxuXHQgKlxuXHQgKiBXaWxsIGJlIHNldCB0byBgdHJ1ZWAgaWYgdGhlICdodHRwOi8vJyBwcm90b2NvbCBoYXMgYmVlbiBwcmVwZW5kZWQgdG8gdGhlIHtAbGluayAjdXJsfSAoYmVjYXVzZSB0aGVcblx0ICoge0BsaW5rICN1cmx9IGRpZCBub3QgaGF2ZSBhIHByb3RvY29sKVxuXHQgKi9cblx0cHJvdG9jb2xQcmVwZW5kZWQgOiBmYWxzZSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICd1cmwnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHVybCB0aGF0IHdhcyBtYXRjaGVkLCBhc3N1bWluZyB0aGUgcHJvdG9jb2wgdG8gYmUgJ2h0dHA6Ly8nIGlmIHRoZSBvcmlnaW5hbFxuXHQgKiBtYXRjaCB3YXMgbWlzc2luZyBhIHByb3RvY29sLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRVcmwgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy51cmw7XG5cblx0XHQvLyBpZiB0aGUgdXJsIHN0cmluZyBkb2Vzbid0IGJlZ2luIHdpdGggYSBwcm90b2NvbCwgYXNzdW1lICdodHRwOi8vJ1xuXHRcdGlmKCAhdGhpcy5wcm90b2NvbFJlbGF0aXZlTWF0Y2ggJiYgIXRoaXMucHJvdG9jb2xVcmxNYXRjaCAmJiAhdGhpcy5wcm90b2NvbFByZXBlbmRlZCApIHtcblx0XHRcdHVybCA9IHRoaXMudXJsID0gJ2h0dHA6Ly8nICsgdXJsO1xuXG5cdFx0XHR0aGlzLnByb3RvY29sUHJlcGVuZGVkID0gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdXJsO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciBocmVmIHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHVybCA9IHRoaXMuZ2V0VXJsKCk7XG5cblx0XHRyZXR1cm4gdXJsLnJlcGxhY2UoIC8mYW1wOy9nLCAnJicgKTsgIC8vIGFueSAmYW1wOydzIGluIHRoZSBVUkwgc2hvdWxkIGJlIGNvbnZlcnRlZCBiYWNrIHRvICcmJyBpZiB0aGV5IHdlcmUgZGlzcGxheWVkIGFzICZhbXA7IGluIHRoZSBzb3VyY2UgaHRtbFxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGFuY2hvclRleHQgPSB0aGlzLmdldE1hdGNoZWRUZXh0KCk7XG5cblx0XHRpZiggdGhpcy5wcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSB7XG5cdFx0XHQvLyBTdHJpcCBvZmYgYW55IHByb3RvY29sLXJlbGF0aXZlICcvLycgZnJvbSB0aGUgYW5jaG9yIHRleHRcblx0XHRcdGFuY2hvclRleHQgPSB0aGlzLnN0cmlwUHJvdG9jb2xSZWxhdGl2ZVByZWZpeCggYW5jaG9yVGV4dCApO1xuXHRcdH1cblx0XHRpZiggdGhpcy5zdHJpcFByZWZpeCApIHtcblx0XHRcdGFuY2hvclRleHQgPSB0aGlzLnN0cmlwVXJsUHJlZml4KCBhbmNob3JUZXh0ICk7XG5cdFx0fVxuXHRcdGFuY2hvclRleHQgPSB0aGlzLnJlbW92ZVRyYWlsaW5nU2xhc2goIGFuY2hvclRleHQgKTsgIC8vIHJlbW92ZSB0cmFpbGluZyBzbGFzaCwgaWYgdGhlcmUgaXMgb25lXG5cblx0XHRyZXR1cm4gYW5jaG9yVGV4dDtcblx0fSxcblxuXG5cdC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cdC8vIFV0aWxpdHkgRnVuY3Rpb25hbGl0eVxuXG5cdC8qKlxuXHQgKiBTdHJpcHMgdGhlIFVSTCBwcmVmaXggKHN1Y2ggYXMgXCJodHRwOi8vXCIgb3IgXCJodHRwczovL1wiKSBmcm9tIHRoZSBnaXZlbiB0ZXh0LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCBvZiB0aGUgYW5jaG9yIHRoYXQgaXMgYmVpbmcgZ2VuZXJhdGVkLCBmb3Igd2hpY2ggdG8gc3RyaXAgb2ZmIHRoZVxuXHQgKiAgIHVybCBwcmVmaXggKHN1Y2ggYXMgc3RyaXBwaW5nIG9mZiBcImh0dHA6Ly9cIilcblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgYGFuY2hvclRleHRgLCB3aXRoIHRoZSBwcmVmaXggc3RyaXBwZWQuXG5cdCAqL1xuXHRzdHJpcFVybFByZWZpeCA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHJldHVybiB0ZXh0LnJlcGxhY2UoIHRoaXMudXJsUHJlZml4UmVnZXgsICcnICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU3RyaXBzIGFueSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIGZyb20gdGhlIGFuY2hvciB0ZXh0LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCBvZiB0aGUgYW5jaG9yIHRoYXQgaXMgYmVpbmcgZ2VuZXJhdGVkLCBmb3Igd2hpY2ggdG8gc3RyaXAgb2ZmIHRoZVxuXHQgKiAgIHByb3RvY29sLXJlbGF0aXZlIHByZWZpeCAoc3VjaCBhcyBzdHJpcHBpbmcgb2ZmIFwiLy9cIilcblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgYGFuY2hvclRleHRgLCB3aXRoIHRoZSBwcm90b2NvbC1yZWxhdGl2ZSBwcmVmaXggc3RyaXBwZWQuXG5cdCAqL1xuXHRzdHJpcFByb3RvY29sUmVsYXRpdmVQcmVmaXggOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHRyZXR1cm4gdGV4dC5yZXBsYWNlKCB0aGlzLnByb3RvY29sUmVsYXRpdmVSZWdleCwgJycgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZW1vdmVzIGFueSB0cmFpbGluZyBzbGFzaCBmcm9tIHRoZSBnaXZlbiBgYW5jaG9yVGV4dGAsIGluIHByZXBhcmF0aW9uIGZvciB0aGUgdGV4dCB0byBiZSBkaXNwbGF5ZWQuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhbmNob3JUZXh0IFRoZSB0ZXh0IG9mIHRoZSBhbmNob3IgdGhhdCBpcyBiZWluZyBnZW5lcmF0ZWQsIGZvciB3aGljaCB0byByZW1vdmUgYW55IHRyYWlsaW5nXG5cdCAqICAgc2xhc2ggKCcvJykgdGhhdCBtYXkgZXhpc3QuXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGBhbmNob3JUZXh0YCwgd2l0aCB0aGUgdHJhaWxpbmcgc2xhc2ggcmVtb3ZlZC5cblx0ICovXG5cdHJlbW92ZVRyYWlsaW5nU2xhc2ggOiBmdW5jdGlvbiggYW5jaG9yVGV4dCApIHtcblx0XHRpZiggYW5jaG9yVGV4dC5jaGFyQXQoIGFuY2hvclRleHQubGVuZ3RoIC0gMSApID09PSAnLycgKSB7XG5cdFx0XHRhbmNob3JUZXh0ID0gYW5jaG9yVGV4dC5zbGljZSggMCwgLTEgKTtcblx0XHR9XG5cdFx0cmV0dXJuIGFuY2hvclRleHQ7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBBIHRydW5jYXRpb24gZmVhdHVyZSB3aGVyZSB0aGUgZWxsaXBzaXMgd2lsbCBiZSBwbGFjZWQgYXQgdGhlIGVuZCBvZiB0aGUgVVJMLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBhbmNob3JUZXh0XG4gKiBAcGFyYW0ge051bWJlcn0gdHJ1bmNhdGVMZW4gVGhlIG1heGltdW0gbGVuZ3RoIG9mIHRoZSB0cnVuY2F0ZWQgb3V0cHV0IFVSTCBzdHJpbmcuXG4gKiBAcGFyYW0ge1N0cmluZ30gZWxsaXBzaXNDaGFycyBUaGUgY2hhcmFjdGVycyB0byBwbGFjZSB3aXRoaW4gdGhlIHVybCwgZS5nLiBcIi4uXCIuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB0cnVuY2F0ZWQgVVJMLlxuICovXG5BdXRvbGlua2VyLnRydW5jYXRlLlRydW5jYXRlRW5kID0gZnVuY3Rpb24oYW5jaG9yVGV4dCwgdHJ1bmNhdGVMZW4sIGVsbGlwc2lzQ2hhcnMpe1xuXHRyZXR1cm4gQXV0b2xpbmtlci5VdGlsLmVsbGlwc2lzKCBhbmNob3JUZXh0LCB0cnVuY2F0ZUxlbiwgZWxsaXBzaXNDaGFycyApO1xufTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBEYXRlOiAyMDE1LTEwLTA1XG4gKiBBdXRob3I6IEthc3BlciBTw7hmcmVuIDxzb2Vmcml0ekBnbWFpbC5jb20+IChodHRwczovL2dpdGh1Yi5jb20va2Fmb3NvKVxuICpcbiAqIEEgdHJ1bmNhdGlvbiBmZWF0dXJlLCB3aGVyZSB0aGUgZWxsaXBzaXMgd2lsbCBiZSBwbGFjZWQgaW4gdGhlIGRlYWQtY2VudGVyIG9mIHRoZSBVUkwuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IHVybCAgICAgICAgICAgICBBIFVSTC5cbiAqIEBwYXJhbSB7TnVtYmVyfSB0cnVuY2F0ZUxlbiAgICAgVGhlIG1heGltdW0gbGVuZ3RoIG9mIHRoZSB0cnVuY2F0ZWQgb3V0cHV0IFVSTCBzdHJpbmcuXG4gKiBAcGFyYW0ge1N0cmluZ30gZWxsaXBzaXNDaGFycyAgIFRoZSBjaGFyYWN0ZXJzIHRvIHBsYWNlIHdpdGhpbiB0aGUgdXJsLCBlLmcuIFwiLi5cIi5cbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHRydW5jYXRlZCBVUkwuXG4gKi9cbkF1dG9saW5rZXIudHJ1bmNhdGUuVHJ1bmNhdGVNaWRkbGUgPSBmdW5jdGlvbih1cmwsIHRydW5jYXRlTGVuLCBlbGxpcHNpc0NoYXJzKXtcbiAgaWYgKHVybC5sZW5ndGggPD0gdHJ1bmNhdGVMZW4pIHtcbiAgICByZXR1cm4gdXJsO1xuICB9XG4gIHZhciBhdmFpbGFibGVMZW5ndGggPSB0cnVuY2F0ZUxlbiAtIGVsbGlwc2lzQ2hhcnMubGVuZ3RoO1xuICB2YXIgZW5kID0gXCJcIjtcbiAgaWYgKGF2YWlsYWJsZUxlbmd0aCA+IDApIHtcbiAgICBlbmQgPSB1cmwuc3Vic3RyKCgtMSkqTWF0aC5mbG9vcihhdmFpbGFibGVMZW5ndGgvMikpO1xuICB9XG4gIHJldHVybiAodXJsLnN1YnN0cigwLCBNYXRoLmNlaWwoYXZhaWxhYmxlTGVuZ3RoLzIpKSArIGVsbGlwc2lzQ2hhcnMgKyBlbmQpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG59O1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIERhdGU6IDIwMTUtMTAtMDVcbiAqIEF1dGhvcjogS2FzcGVyIFPDuGZyZW4gPHNvZWZyaXR6QGdtYWlsLmNvbT4gKGh0dHBzOi8vZ2l0aHViLmNvbS9rYWZvc28pXG4gKlxuICogQSB0cnVuY2F0aW9uIGZlYXR1cmUsIHdoZXJlIHRoZSBlbGxpcHNpcyB3aWxsIGJlIHBsYWNlZCBhdCBhIHNlY3Rpb24gd2l0aGluXG4gKiB0aGUgVVJMIG1ha2luZyBpdCBzdGlsbCBzb21ld2hhdCBodW1hbiByZWFkYWJsZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXHRcdFx0XHRcdFx0IEEgVVJMLlxuICogQHBhcmFtIHtOdW1iZXJ9IHRydW5jYXRlTGVuXHRcdCBUaGUgbWF4aW11bSBsZW5ndGggb2YgdGhlIHRydW5jYXRlZCBvdXRwdXQgVVJMIHN0cmluZy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbGxpcHNpc0NoYXJzXHQgVGhlIGNoYXJhY3RlcnMgdG8gcGxhY2Ugd2l0aGluIHRoZSB1cmwsIGUuZy4gXCIuLlwiLlxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgdHJ1bmNhdGVkIFVSTC5cbiAqL1xuQXV0b2xpbmtlci50cnVuY2F0ZS5UcnVuY2F0ZVNtYXJ0ID0gZnVuY3Rpb24odXJsLCB0cnVuY2F0ZUxlbiwgZWxsaXBzaXNDaGFycyl7XG5cdHZhciBwYXJzZV91cmwgPSBmdW5jdGlvbih1cmwpeyAvLyBGdW5jdGlvbmFsaXR5IGluc3BpcmVkIGJ5IFBIUCBmdW5jdGlvbiBvZiBzYW1lIG5hbWVcblx0XHR2YXIgdXJsT2JqID0ge307XG5cdFx0dmFyIHVybFN1YiA9IHVybDtcblx0XHR2YXIgbWF0Y2ggPSB1cmxTdWIubWF0Y2goL14oW2Etel0rKTpcXC9cXC8vaSk7XG5cdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHR1cmxPYmouc2NoZW1lID0gbWF0Y2hbMV07XG5cdFx0XHR1cmxTdWIgPSB1cmxTdWIuc3Vic3RyKG1hdGNoWzBdLmxlbmd0aCk7XG5cdFx0fVxuXHRcdG1hdGNoID0gdXJsU3ViLm1hdGNoKC9eKC4qPykoPz0oXFw/fCN8XFwvfCQpKS9pKTtcblx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdHVybE9iai5ob3N0ID0gbWF0Y2hbMV07XG5cdFx0XHR1cmxTdWIgPSB1cmxTdWIuc3Vic3RyKG1hdGNoWzBdLmxlbmd0aCk7XG5cdFx0fVxuXHRcdG1hdGNoID0gdXJsU3ViLm1hdGNoKC9eXFwvKC4qPykoPz0oXFw/fCN8JCkpL2kpO1xuXHRcdGlmIChtYXRjaCkge1xuXHRcdFx0dXJsT2JqLnBhdGggPSBtYXRjaFsxXTtcblx0XHRcdHVybFN1YiA9IHVybFN1Yi5zdWJzdHIobWF0Y2hbMF0ubGVuZ3RoKTtcblx0XHR9XG5cdFx0bWF0Y2ggPSB1cmxTdWIubWF0Y2goL15cXD8oLio/KSg/PSgjfCQpKS9pKTtcblx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdHVybE9iai5xdWVyeSA9IG1hdGNoWzFdO1xuXHRcdFx0dXJsU3ViID0gdXJsU3ViLnN1YnN0cihtYXRjaFswXS5sZW5ndGgpO1xuXHRcdH1cblx0XHRtYXRjaCA9IHVybFN1Yi5tYXRjaCgvXiMoLio/KSQvaSk7XG5cdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHR1cmxPYmouZnJhZ21lbnQgPSBtYXRjaFsxXTtcblx0XHRcdC8vdXJsU3ViID0gdXJsU3ViLnN1YnN0cihtYXRjaFswXS5sZW5ndGgpOyAgLS0gbm90IHVzZWQuIFVuY29tbWVudCBpZiBhZGRpbmcgYW5vdGhlciBibG9jay5cblx0XHR9XG5cdFx0cmV0dXJuIHVybE9iajtcblx0fTtcblxuXHR2YXIgYnVpbGRVcmwgPSBmdW5jdGlvbih1cmxPYmope1xuXHRcdHZhciB1cmwgPSBcIlwiO1xuXHRcdGlmICh1cmxPYmouc2NoZW1lICYmIHVybE9iai5ob3N0KSB7XG5cdFx0XHR1cmwgKz0gdXJsT2JqLnNjaGVtZSArIFwiOi8vXCI7XG5cdFx0fVxuXHRcdGlmICh1cmxPYmouaG9zdCkge1xuXHRcdFx0dXJsICs9IHVybE9iai5ob3N0O1xuXHRcdH1cblx0XHRpZiAodXJsT2JqLnBhdGgpIHtcblx0XHRcdHVybCArPSBcIi9cIiArIHVybE9iai5wYXRoO1xuXHRcdH1cblx0XHRpZiAodXJsT2JqLnF1ZXJ5KSB7XG5cdFx0XHR1cmwgKz0gXCI/XCIgKyB1cmxPYmoucXVlcnk7XG5cdFx0fVxuXHRcdGlmICh1cmxPYmouZnJhZ21lbnQpIHtcblx0XHRcdHVybCArPSBcIiNcIiArIHVybE9iai5mcmFnbWVudDtcblx0XHR9XG5cdFx0cmV0dXJuIHVybDtcblx0fTtcblxuXHR2YXIgYnVpbGRTZWdtZW50ID0gZnVuY3Rpb24oc2VnbWVudCwgcmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoKXtcblx0XHR2YXIgcmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoSGFsZiA9IHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aC8gMixcblx0XHRcdFx0c3RhcnRPZmZzZXQgPSBNYXRoLmNlaWwocmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoSGFsZiksXG5cdFx0XHRcdGVuZE9mZnNldCA9ICgtMSkqTWF0aC5mbG9vcihyZW1haW5pbmdBdmFpbGFibGVMZW5ndGhIYWxmKSxcblx0XHRcdFx0ZW5kID0gXCJcIjtcblx0XHRpZiAoZW5kT2Zmc2V0IDwgMCkge1xuXHRcdFx0ZW5kID0gc2VnbWVudC5zdWJzdHIoZW5kT2Zmc2V0KTtcblx0XHR9XG5cdFx0cmV0dXJuIHNlZ21lbnQuc3Vic3RyKDAsIHN0YXJ0T2Zmc2V0KSArIGVsbGlwc2lzQ2hhcnMgKyBlbmQ7XG5cdH07XG5cdGlmICh1cmwubGVuZ3RoIDw9IHRydW5jYXRlTGVuKSB7XG5cdFx0cmV0dXJuIHVybDtcblx0fVxuXHR2YXIgYXZhaWxhYmxlTGVuZ3RoID0gdHJ1bmNhdGVMZW4gLSBlbGxpcHNpc0NoYXJzLmxlbmd0aDtcblx0dmFyIHVybE9iaiA9IHBhcnNlX3VybCh1cmwpO1xuXHQvLyBDbGVhbiB1cCB0aGUgVVJMXG5cdGlmICh1cmxPYmoucXVlcnkpIHtcblx0XHR2YXIgbWF0Y2hRdWVyeSA9IHVybE9iai5xdWVyeS5tYXRjaCgvXiguKj8pKD89KFxcP3xcXCMpKSguKj8pJC9pKTtcblx0XHRpZiAobWF0Y2hRdWVyeSkge1xuXHRcdFx0Ly8gTWFsZm9ybWVkIFVSTDsgdHdvIG9yIG1vcmUgXCI/XCIuIFJlbW92ZWQgYW55IGNvbnRlbnQgYmVoaW5kIHRoZSAybmQuXG5cdFx0XHR1cmxPYmoucXVlcnkgPSB1cmxPYmoucXVlcnkuc3Vic3RyKDAsIG1hdGNoUXVlcnlbMV0ubGVuZ3RoKTtcblx0XHRcdHVybCA9IGJ1aWxkVXJsKHVybE9iaik7XG5cdFx0fVxuXHR9XG5cdGlmICh1cmwubGVuZ3RoIDw9IHRydW5jYXRlTGVuKSB7XG5cdFx0cmV0dXJuIHVybDtcblx0fVxuXHRpZiAodXJsT2JqLmhvc3QpIHtcblx0XHR1cmxPYmouaG9zdCA9IHVybE9iai5ob3N0LnJlcGxhY2UoL153d3dcXC4vLCBcIlwiKTtcblx0XHR1cmwgPSBidWlsZFVybCh1cmxPYmopO1xuXHR9XG5cdGlmICh1cmwubGVuZ3RoIDw9IHRydW5jYXRlTGVuKSB7XG5cdFx0cmV0dXJuIHVybDtcblx0fVxuXHQvLyBQcm9jZXNzIGFuZCBidWlsZCB0aGUgVVJMXG5cdHZhciBzdHIgPSBcIlwiO1xuXHRpZiAodXJsT2JqLmhvc3QpIHtcblx0XHRzdHIgKz0gdXJsT2JqLmhvc3Q7XG5cdH1cblx0aWYgKHN0ci5sZW5ndGggPj0gYXZhaWxhYmxlTGVuZ3RoKSB7XG5cdFx0aWYgKHVybE9iai5ob3N0Lmxlbmd0aCA9PSB0cnVuY2F0ZUxlbikge1xuXHRcdFx0cmV0dXJuICh1cmxPYmouaG9zdC5zdWJzdHIoMCwgKHRydW5jYXRlTGVuIC0gZWxsaXBzaXNDaGFycy5sZW5ndGgpKSArIGVsbGlwc2lzQ2hhcnMpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG5cdFx0fVxuXHRcdHJldHVybiBidWlsZFNlZ21lbnQoc3RyLCBhdmFpbGFibGVMZW5ndGgpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG5cdH1cblx0dmFyIHBhdGhBbmRRdWVyeSA9IFwiXCI7XG5cdGlmICh1cmxPYmoucGF0aCkge1xuXHRcdHBhdGhBbmRRdWVyeSArPSBcIi9cIiArIHVybE9iai5wYXRoO1xuXHR9XG5cdGlmICh1cmxPYmoucXVlcnkpIHtcblx0XHRwYXRoQW5kUXVlcnkgKz0gXCI/XCIgKyB1cmxPYmoucXVlcnk7XG5cdH1cblx0aWYgKHBhdGhBbmRRdWVyeSkge1xuXHRcdGlmICgoc3RyK3BhdGhBbmRRdWVyeSkubGVuZ3RoID49IGF2YWlsYWJsZUxlbmd0aCkge1xuXHRcdFx0aWYgKChzdHIrcGF0aEFuZFF1ZXJ5KS5sZW5ndGggPT0gdHJ1bmNhdGVMZW4pIHtcblx0XHRcdFx0cmV0dXJuIChzdHIgKyBwYXRoQW5kUXVlcnkpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG5cdFx0XHR9XG5cdFx0XHR2YXIgcmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoID0gYXZhaWxhYmxlTGVuZ3RoIC0gc3RyLmxlbmd0aDtcblx0XHRcdHJldHVybiAoc3RyICsgYnVpbGRTZWdtZW50KHBhdGhBbmRRdWVyeSwgcmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoKSkuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0c3RyICs9IHBhdGhBbmRRdWVyeTtcblx0XHR9XG5cdH1cblx0aWYgKHVybE9iai5mcmFnbWVudCkge1xuXHRcdHZhciBmcmFnbWVudCA9IFwiI1wiK3VybE9iai5mcmFnbWVudDtcblx0XHRpZiAoKHN0citmcmFnbWVudCkubGVuZ3RoID49IGF2YWlsYWJsZUxlbmd0aCkge1xuXHRcdFx0aWYgKChzdHIrZnJhZ21lbnQpLmxlbmd0aCA9PSB0cnVuY2F0ZUxlbikge1xuXHRcdFx0XHRyZXR1cm4gKHN0ciArIGZyYWdtZW50KS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xuXHRcdFx0fVxuXHRcdFx0dmFyIHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aDIgPSBhdmFpbGFibGVMZW5ndGggLSBzdHIubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIChzdHIgKyBidWlsZFNlZ21lbnQoZnJhZ21lbnQsIHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aDIpKS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdHIgKz0gZnJhZ21lbnQ7XG5cdFx0fVxuXHR9XG5cdGlmICh1cmxPYmouc2NoZW1lICYmIHVybE9iai5ob3N0KSB7XG5cdFx0dmFyIHNjaGVtZSA9IHVybE9iai5zY2hlbWUgKyBcIjovL1wiO1xuXHRcdGlmICgoc3RyK3NjaGVtZSkubGVuZ3RoIDwgYXZhaWxhYmxlTGVuZ3RoKSB7XG5cdFx0XHRyZXR1cm4gKHNjaGVtZSArIHN0cikuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcblx0XHR9XG5cdH1cblx0aWYgKHN0ci5sZW5ndGggPD0gdHJ1bmNhdGVMZW4pIHtcblx0XHRyZXR1cm4gc3RyO1xuXHR9XG5cdHZhciBlbmQgPSBcIlwiO1xuXHRpZiAoYXZhaWxhYmxlTGVuZ3RoID4gMCkge1xuXHRcdGVuZCA9IHN0ci5zdWJzdHIoKC0xKSpNYXRoLmZsb29yKGF2YWlsYWJsZUxlbmd0aC8yKSk7XG5cdH1cblx0cmV0dXJuIChzdHIuc3Vic3RyKDAsIE1hdGguY2VpbChhdmFpbGFibGVMZW5ndGgvMikpICsgZWxsaXBzaXNDaGFycyArIGVuZCkuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcbn07XG5cbnJldHVybiBBdXRvbGlua2VyO1xuXG59KSk7XG4iLCI7KGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdC8qKlxuXHQgKiBAcHJlc2VydmUgRmFzdENsaWNrOiBwb2x5ZmlsbCB0byByZW1vdmUgY2xpY2sgZGVsYXlzIG9uIGJyb3dzZXJzIHdpdGggdG91Y2ggVUlzLlxuXHQgKlxuXHQgKiBAY29kaW5nc3RhbmRhcmQgZnRsYWJzLWpzdjJcblx0ICogQGNvcHlyaWdodCBUaGUgRmluYW5jaWFsIFRpbWVzIExpbWl0ZWQgW0FsbCBSaWdodHMgUmVzZXJ2ZWRdXG5cdCAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChzZWUgTElDRU5TRS50eHQpXG5cdCAqL1xuXG5cdC8qanNsaW50IGJyb3dzZXI6dHJ1ZSwgbm9kZTp0cnVlKi9cblx0LypnbG9iYWwgZGVmaW5lLCBFdmVudCwgTm9kZSovXG5cblxuXHQvKipcblx0ICogSW5zdGFudGlhdGUgZmFzdC1jbGlja2luZyBsaXN0ZW5lcnMgb24gdGhlIHNwZWNpZmllZCBsYXllci5cblx0ICpcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0ZnVuY3Rpb24gRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0dmFyIG9sZE9uQ2xpY2s7XG5cblx0XHRvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuXHRcdC8qKlxuXHRcdCAqIFdoZXRoZXIgYSBjbGljayBpcyBjdXJyZW50bHkgYmVpbmcgdHJhY2tlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIGJvb2xlYW5cblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGltZXN0YW1wIGZvciB3aGVuIGNsaWNrIHRyYWNraW5nIHN0YXJ0ZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBlbGVtZW50IGJlaW5nIHRyYWNrZWQgZm9yIGEgY2xpY2suXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFdmVudFRhcmdldFxuXHRcdCAqL1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFgtY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFggPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBZLWNvb3JkaW5hdGUgb2YgdG91Y2ggc3RhcnQgZXZlbnQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogSUQgb2YgdGhlIGxhc3QgdG91Y2gsIHJldHJpZXZlZCBmcm9tIFRvdWNoLmlkZW50aWZpZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUb3VjaG1vdmUgYm91bmRhcnksIGJleW9uZCB3aGljaCBhIGNsaWNrIHdpbGwgYmUgY2FuY2VsbGVkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaEJvdW5kYXJ5ID0gb3B0aW9ucy50b3VjaEJvdW5kYXJ5IHx8IDEwO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaGUgRmFzdENsaWNrIGxheWVyLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgRWxlbWVudFxuXHRcdCAqL1xuXHRcdHRoaXMubGF5ZXIgPSBsYXllcjtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtaW5pbXVtIHRpbWUgYmV0d2VlbiB0YXAodG91Y2hzdGFydCBhbmQgdG91Y2hlbmQpIGV2ZW50c1xuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBEZWxheSA9IG9wdGlvbnMudGFwRGVsYXkgfHwgMjAwO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1heGltdW0gdGltZSBmb3IgYSB0YXBcblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudGFwVGltZW91dCA9IG9wdGlvbnMudGFwVGltZW91dCB8fCA3MDA7XG5cblx0XHRpZiAoRmFzdENsaWNrLm5vdE5lZWRlZChsYXllcikpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cblx0XHQvLyBTb21lIG9sZCB2ZXJzaW9ucyBvZiBBbmRyb2lkIGRvbid0IGhhdmUgRnVuY3Rpb24ucHJvdG90eXBlLmJpbmRcblx0XHRmdW5jdGlvbiBiaW5kKG1ldGhvZCwgY29udGV4dCkge1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCkgeyByZXR1cm4gbWV0aG9kLmFwcGx5KGNvbnRleHQsIGFyZ3VtZW50cyk7IH07XG5cdFx0fVxuXG5cblx0XHR2YXIgbWV0aG9kcyA9IFsnb25Nb3VzZScsICdvbkNsaWNrJywgJ29uVG91Y2hTdGFydCcsICdvblRvdWNoTW92ZScsICdvblRvdWNoRW5kJywgJ29uVG91Y2hDYW5jZWwnXTtcblx0XHR2YXIgY29udGV4dCA9IHRoaXM7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGwgPSBtZXRob2RzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHRcdFx0Y29udGV4dFttZXRob2RzW2ldXSA9IGJpbmQoY29udGV4dFttZXRob2RzW2ldXSwgY29udGV4dCk7XG5cdFx0fVxuXG5cdFx0Ly8gU2V0IHVwIGV2ZW50IGhhbmRsZXJzIGFzIHJlcXVpcmVkXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblxuXHRcdC8vIEhhY2sgaXMgcmVxdWlyZWQgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdC8vIHdoaWNoIGlzIGhvdyBGYXN0Q2xpY2sgbm9ybWFsbHkgc3RvcHMgY2xpY2sgZXZlbnRzIGJ1YmJsaW5nIHRvIGNhbGxiYWNrcyByZWdpc3RlcmVkIG9uIHRoZSBGYXN0Q2xpY2tcblx0XHQvLyBsYXllciB3aGVuIHRoZXkgYXJlIGNhbmNlbGxlZC5cblx0XHRpZiAoIUV2ZW50LnByb3RvdHlwZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgcm12ID0gTm9kZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRybXYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBjYWxsYmFjaywgY2FwdHVyZSkge1xuXHRcdFx0XHR2YXIgYWR2ID0gTm9kZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcblx0XHRcdFx0aWYgKHR5cGUgPT09ICdjbGljaycpIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2suaGlqYWNrZWQgfHwgKGNhbGxiYWNrLmhpamFja2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRcdFx0XHRcdGlmICghZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkKSB7XG5cdFx0XHRcdFx0XHRcdGNhbGxiYWNrKGV2ZW50KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KSwgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YWR2LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9XG5cblx0XHQvLyBJZiBhIGhhbmRsZXIgaXMgYWxyZWFkeSBkZWNsYXJlZCBpbiB0aGUgZWxlbWVudCdzIG9uY2xpY2sgYXR0cmlidXRlLCBpdCB3aWxsIGJlIGZpcmVkIGJlZm9yZVxuXHRcdC8vIEZhc3RDbGljaydzIG9uQ2xpY2sgaGFuZGxlci4gRml4IHRoaXMgYnkgcHVsbGluZyBvdXQgdGhlIHVzZXItZGVmaW5lZCBoYW5kbGVyIGZ1bmN0aW9uIGFuZFxuXHRcdC8vIGFkZGluZyBpdCBhcyBsaXN0ZW5lci5cblx0XHRpZiAodHlwZW9mIGxheWVyLm9uY2xpY2sgPT09ICdmdW5jdGlvbicpIHtcblxuXHRcdFx0Ly8gQW5kcm9pZCBicm93c2VyIG9uIGF0IGxlYXN0IDMuMiByZXF1aXJlcyBhIG5ldyByZWZlcmVuY2UgdG8gdGhlIGZ1bmN0aW9uIGluIGxheWVyLm9uY2xpY2tcblx0XHRcdC8vIC0gdGhlIG9sZCBvbmUgd29uJ3Qgd29yayBpZiBwYXNzZWQgdG8gYWRkRXZlbnRMaXN0ZW5lciBkaXJlY3RseS5cblx0XHRcdG9sZE9uQ2xpY2sgPSBsYXllci5vbmNsaWNrO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRvbGRPbkNsaWNrKGV2ZW50KTtcblx0XHRcdH0sIGZhbHNlKTtcblx0XHRcdGxheWVyLm9uY2xpY2sgPSBudWxsO1xuXHRcdH1cblx0fVxuXG5cdC8qKlxuXHQqIFdpbmRvd3MgUGhvbmUgOC4xIGZha2VzIHVzZXIgYWdlbnQgc3RyaW5nIHRvIGxvb2sgbGlrZSBBbmRyb2lkIGFuZCBpUGhvbmUuXG5cdCpcblx0KiBAdHlwZSBib29sZWFuXG5cdCovXG5cdHZhciBkZXZpY2VJc1dpbmRvd3NQaG9uZSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZihcIldpbmRvd3MgUGhvbmVcIikgPj0gMDtcblxuXHQvKipcblx0ICogQW5kcm9pZCByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgPiAwICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TID0gL2lQKGFkfGhvbmV8b2QpLy50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpICYmICFkZXZpY2VJc1dpbmRvd3NQaG9uZTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNCByZXF1aXJlcyBhbiBleGNlcHRpb24gZm9yIHNlbGVjdCBlbGVtZW50cy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzSU9TNCA9IGRldmljZUlzSU9TICYmICgvT1MgNF9cXGQoX1xcZCk/LykudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcblxuXG5cdC8qKlxuXHQgKiBpT1MgNi4wLTcuKiByZXF1aXJlcyB0aGUgdGFyZ2V0IGVsZW1lbnQgdG8gYmUgbWFudWFsbHkgZGVyaXZlZFxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyBbNi03XV9cXGQvKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cdC8qKlxuXHQgKiBCbGFja0JlcnJ5IHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0JsYWNrQmVycnkxMCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQkIxMCcpID4gMDtcblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgbmF0aXZlIGNsaWNrLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCBuZWVkcyBhIG5hdGl2ZSBjbGlja1xuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0NsaWNrID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXG5cdFx0Ly8gRG9uJ3Qgc2VuZCBhIHN5bnRoZXRpYyBjbGljayB0byBkaXNhYmxlZCBpbnB1dHMgKGlzc3VlICM2Milcblx0XHRjYXNlICdidXR0b24nOlxuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0aWYgKHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnaW5wdXQnOlxuXG5cdFx0XHQvLyBGaWxlIGlucHV0cyBuZWVkIHJlYWwgY2xpY2tzIG9uIGlPUyA2IGR1ZSB0byBhIGJyb3dzZXIgYnVnIChpc3N1ZSAjNjgpXG5cdFx0XHRpZiAoKGRldmljZUlzSU9TICYmIHRhcmdldC50eXBlID09PSAnZmlsZScpIHx8IHRhcmdldC5kaXNhYmxlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0YnJlYWs7XG5cdFx0Y2FzZSAnbGFiZWwnOlxuXHRcdGNhc2UgJ2lmcmFtZSc6IC8vIGlPUzggaG9tZXNjcmVlbiBhcHBzIGNhbiBwcmV2ZW50IGV2ZW50cyBidWJibGluZyBpbnRvIGZyYW1lc1xuXHRcdGNhc2UgJ3ZpZGVvJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiAoL1xcYm5lZWRzY2xpY2tcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSB3aGV0aGVyIGEgZ2l2ZW4gZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgY2xpY2sgaW50byBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldCBUYXJnZXQgRE9NIGVsZW1lbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59IFJldHVybnMgdHJ1ZSBpZiB0aGUgZWxlbWVudCByZXF1aXJlcyBhIGNhbGwgdG8gZm9jdXMgdG8gc2ltdWxhdGUgbmF0aXZlIGNsaWNrLlxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5uZWVkc0ZvY3VzID0gZnVuY3Rpb24odGFyZ2V0KSB7XG5cdFx0c3dpdGNoICh0YXJnZXQubm9kZU5hbWUudG9Mb3dlckNhc2UoKSkge1xuXHRcdGNhc2UgJ3RleHRhcmVhJzpcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdGNhc2UgJ3NlbGVjdCc6XG5cdFx0XHRyZXR1cm4gIWRldmljZUlzQW5kcm9pZDtcblx0XHRjYXNlICdpbnB1dCc6XG5cdFx0XHRzd2l0Y2ggKHRhcmdldC50eXBlKSB7XG5cdFx0XHRjYXNlICdidXR0b24nOlxuXHRcdFx0Y2FzZSAnY2hlY2tib3gnOlxuXHRcdFx0Y2FzZSAnZmlsZSc6XG5cdFx0XHRjYXNlICdpbWFnZSc6XG5cdFx0XHRjYXNlICdyYWRpbyc6XG5cdFx0XHRjYXNlICdzdWJtaXQnOlxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdC8vIE5vIHBvaW50IGluIGF0dGVtcHRpbmcgdG8gZm9jdXMgZGlzYWJsZWQgaW5wdXRzXG5cdFx0XHRyZXR1cm4gIXRhcmdldC5kaXNhYmxlZCAmJiAhdGFyZ2V0LnJlYWRPbmx5O1xuXHRcdGRlZmF1bHQ6XG5cdFx0XHRyZXR1cm4gKC9cXGJuZWVkc2ZvY3VzXFxiLykudGVzdCh0YXJnZXQuY2xhc3NOYW1lKTtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogU2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoZSBzcGVjaWZpZWQgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnNlbmRDbGljayA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQsIGV2ZW50KSB7XG5cdFx0dmFyIGNsaWNrRXZlbnQsIHRvdWNoO1xuXG5cdFx0Ly8gT24gc29tZSBBbmRyb2lkIGRldmljZXMgYWN0aXZlRWxlbWVudCBuZWVkcyB0byBiZSBibHVycmVkIG90aGVyd2lzZSB0aGUgc3ludGhldGljIGNsaWNrIHdpbGwgaGF2ZSBubyBlZmZlY3QgKCMyNClcblx0XHRpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAmJiBkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSB0YXJnZXRFbGVtZW50KSB7XG5cdFx0XHRkb2N1bWVudC5hY3RpdmVFbGVtZW50LmJsdXIoKTtcblx0XHR9XG5cblx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0Ly8gU3ludGhlc2lzZSBhIGNsaWNrIGV2ZW50LCB3aXRoIGFuIGV4dHJhIGF0dHJpYnV0ZSBzbyBpdCBjYW4gYmUgdHJhY2tlZFxuXHRcdGNsaWNrRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudHMnKTtcblx0XHRjbGlja0V2ZW50LmluaXRNb3VzZUV2ZW50KHRoaXMuZGV0ZXJtaW5lRXZlbnRUeXBlKHRhcmdldEVsZW1lbnQpLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIHRvdWNoLnNjcmVlblgsIHRvdWNoLnNjcmVlblksIHRvdWNoLmNsaWVudFgsIHRvdWNoLmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLCBudWxsKTtcblx0XHRjbGlja0V2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQgPSB0cnVlO1xuXHRcdHRhcmdldEVsZW1lbnQuZGlzcGF0Y2hFdmVudChjbGlja0V2ZW50KTtcblx0fTtcblxuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRldGVybWluZUV2ZW50VHlwZSA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblxuXHRcdC8vSXNzdWUgIzE1OTogQW5kcm9pZCBDaHJvbWUgU2VsZWN0IEJveCBkb2VzIG5vdCBvcGVuIHdpdGggYSBzeW50aGV0aWMgY2xpY2sgZXZlbnRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkICYmIHRhcmdldEVsZW1lbnQudGFnTmFtZS50b0xvd2VyQ2FzZSgpID09PSAnc2VsZWN0Jykge1xuXHRcdFx0cmV0dXJuICdtb3VzZWRvd24nO1xuXHRcdH1cblxuXHRcdHJldHVybiAnY2xpY2snO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5mb2N1cyA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgbGVuZ3RoO1xuXG5cdFx0Ly8gSXNzdWUgIzE2MDogb24gaU9TIDcsIHNvbWUgaW5wdXQgZWxlbWVudHMgKGUuZy4gZGF0ZSBkYXRldGltZSBtb250aCkgdGhyb3cgYSB2YWd1ZSBUeXBlRXJyb3Igb24gc2V0U2VsZWN0aW9uUmFuZ2UuIFRoZXNlIGVsZW1lbnRzIGRvbid0IGhhdmUgYW4gaW50ZWdlciB2YWx1ZSBmb3IgdGhlIHNlbGVjdGlvblN0YXJ0IGFuZCBzZWxlY3Rpb25FbmQgcHJvcGVydGllcywgYnV0IHVuZm9ydHVuYXRlbHkgdGhhdCBjYW4ndCBiZSB1c2VkIGZvciBkZXRlY3Rpb24gYmVjYXVzZSBhY2Nlc3NpbmcgdGhlIHByb3BlcnRpZXMgYWxzbyB0aHJvd3MgYSBUeXBlRXJyb3IuIEp1c3QgY2hlY2sgdGhlIHR5cGUgaW5zdGVhZC4gRmlsZWQgYXMgQXBwbGUgYnVnICMxNTEyMjcyNC5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0RWxlbWVudC5zZXRTZWxlY3Rpb25SYW5nZSAmJiB0YXJnZXRFbGVtZW50LnR5cGUuaW5kZXhPZignZGF0ZScpICE9PSAwICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ3RpbWUnICYmIHRhcmdldEVsZW1lbnQudHlwZSAhPT0gJ21vbnRoJykge1xuXHRcdFx0bGVuZ3RoID0gdGFyZ2V0RWxlbWVudC52YWx1ZS5sZW5ndGg7XG5cdFx0XHR0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlKGxlbmd0aCwgbGVuZ3RoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mb2N1cygpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIHRoZSBnaXZlbiB0YXJnZXQgZWxlbWVudCBpcyBhIGNoaWxkIG9mIGEgc2Nyb2xsYWJsZSBsYXllciBhbmQgaWYgc28sIHNldCBhIGZsYWcgb24gaXQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0RWxlbWVudFxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS51cGRhdGVTY3JvbGxQYXJlbnQgPSBmdW5jdGlvbih0YXJnZXRFbGVtZW50KSB7XG5cdFx0dmFyIHNjcm9sbFBhcmVudCwgcGFyZW50RWxlbWVudDtcblxuXHRcdHNjcm9sbFBhcmVudCA9IHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXG5cdFx0Ly8gQXR0ZW1wdCB0byBkaXNjb3ZlciB3aGV0aGVyIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgc2Nyb2xsYWJsZSBsYXllci4gUmUtY2hlY2sgaWYgdGhlXG5cdFx0Ly8gdGFyZ2V0IGVsZW1lbnQgd2FzIG1vdmVkIHRvIGFub3RoZXIgcGFyZW50LlxuXHRcdGlmICghc2Nyb2xsUGFyZW50IHx8ICFzY3JvbGxQYXJlbnQuY29udGFpbnModGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdHBhcmVudEVsZW1lbnQgPSB0YXJnZXRFbGVtZW50O1xuXHRcdFx0ZG8ge1xuXHRcdFx0XHRpZiAocGFyZW50RWxlbWVudC5zY3JvbGxIZWlnaHQgPiBwYXJlbnRFbGVtZW50Lm9mZnNldEhlaWdodCkge1xuXHRcdFx0XHRcdHNjcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSBwYXJlbnRFbGVtZW50O1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0cGFyZW50RWxlbWVudCA9IHBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudDtcblx0XHRcdH0gd2hpbGUgKHBhcmVudEVsZW1lbnQpO1xuXHRcdH1cblxuXHRcdC8vIEFsd2F5cyB1cGRhdGUgdGhlIHNjcm9sbCB0b3AgdHJhY2tlciBpZiBwb3NzaWJsZS5cblx0XHRpZiAoc2Nyb2xsUGFyZW50KSB7XG5cdFx0XHRzY3JvbGxQYXJlbnQuZmFzdENsaWNrTGFzdFNjcm9sbFRvcCA9IHNjcm9sbFBhcmVudC5zY3JvbGxUb3A7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR9IHRhcmdldEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8RXZlbnRUYXJnZXR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQgPSBmdW5jdGlvbihldmVudFRhcmdldCkge1xuXG5cdFx0Ly8gT24gc29tZSBvbGRlciBicm93c2VycyAobm90YWJseSBTYWZhcmkgb24gaU9TIDQuMSAtIHNlZSBpc3N1ZSAjNTYpIHRoZSBldmVudCB0YXJnZXQgbWF5IGJlIGEgdGV4dCBub2RlLlxuXHRcdGlmIChldmVudFRhcmdldC5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcblx0XHRcdHJldHVybiBldmVudFRhcmdldC5wYXJlbnROb2RlO1xuXHRcdH1cblxuXHRcdHJldHVybiBldmVudFRhcmdldDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBzdGFydCwgcmVjb3JkIHRoZSBwb3NpdGlvbiBhbmQgc2Nyb2xsIG9mZnNldC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hTdGFydCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRhcmdldEVsZW1lbnQsIHRvdWNoLCBzZWxlY3Rpb247XG5cblx0XHQvLyBJZ25vcmUgbXVsdGlwbGUgdG91Y2hlcywgb3RoZXJ3aXNlIHBpbmNoLXRvLXpvb20gaXMgcHJldmVudGVkIGlmIGJvdGggZmluZ2VycyBhcmUgb24gdGhlIEZhc3RDbGljayBlbGVtZW50IChpc3N1ZSAjMTExKS5cblx0XHRpZiAoZXZlbnQudGFyZ2V0VG91Y2hlcy5sZW5ndGggPiAxKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHR0YXJnZXRFbGVtZW50ID0gdGhpcy5nZXRUYXJnZXRFbGVtZW50RnJvbUV2ZW50VGFyZ2V0KGV2ZW50LnRhcmdldCk7XG5cdFx0dG91Y2ggPSBldmVudC50YXJnZXRUb3VjaGVzWzBdO1xuXG5cdFx0aWYgKGRldmljZUlzSU9TKSB7XG5cblx0XHRcdC8vIE9ubHkgdHJ1c3RlZCBldmVudHMgd2lsbCBkZXNlbGVjdCB0ZXh0IG9uIGlPUyAoaXNzdWUgIzQ5KVxuXHRcdFx0c2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuXHRcdFx0aWYgKHNlbGVjdGlvbi5yYW5nZUNvdW50ICYmICFzZWxlY3Rpb24uaXNDb2xsYXBzZWQpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cblx0XHRcdGlmICghZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdFx0Ly8gV2VpcmQgdGhpbmdzIGhhcHBlbiBvbiBpT1Mgd2hlbiBhbiBhbGVydCBvciBjb25maXJtIGRpYWxvZyBpcyBvcGVuZWQgZnJvbSBhIGNsaWNrIGV2ZW50IGNhbGxiYWNrIChpc3N1ZSAjMjMpOlxuXHRcdFx0XHQvLyB3aGVuIHRoZSB1c2VyIG5leHQgdGFwcyBhbnl3aGVyZSBlbHNlIG9uIHRoZSBwYWdlLCBuZXcgdG91Y2hzdGFydCBhbmQgdG91Y2hlbmQgZXZlbnRzIGFyZSBkaXNwYXRjaGVkXG5cdFx0XHRcdC8vIHdpdGggdGhlIHNhbWUgaWRlbnRpZmllciBhcyB0aGUgdG91Y2ggZXZlbnQgdGhhdCBwcmV2aW91c2x5IHRyaWdnZXJlZCB0aGUgY2xpY2sgdGhhdCB0cmlnZ2VyZWQgdGhlIGFsZXJ0LlxuXHRcdFx0XHQvLyBTYWRseSwgdGhlcmUgaXMgYW4gaXNzdWUgb24gaU9TIDQgdGhhdCBjYXVzZXMgc29tZSBub3JtYWwgdG91Y2ggZXZlbnRzIHRvIGhhdmUgdGhlIHNhbWUgaWRlbnRpZmllciBhcyBhblxuXHRcdFx0XHQvLyBpbW1lZGlhdGVseSBwcmVjZWVkaW5nIHRvdWNoIGV2ZW50IChpc3N1ZSAjNTIpLCBzbyB0aGlzIGZpeCBpcyB1bmF2YWlsYWJsZSBvbiB0aGF0IHBsYXRmb3JtLlxuXHRcdFx0XHQvLyBJc3N1ZSAxMjA6IHRvdWNoLmlkZW50aWZpZXIgaXMgMCB3aGVuIENocm9tZSBkZXYgdG9vbHMgJ0VtdWxhdGUgdG91Y2ggZXZlbnRzJyBpcyBzZXQgd2l0aCBhbiBpT1MgZGV2aWNlIFVBIHN0cmluZyxcblx0XHRcdFx0Ly8gd2hpY2ggY2F1c2VzIGFsbCB0b3VjaCBldmVudHMgdG8gYmUgaWdub3JlZC4gQXMgdGhpcyBibG9jayBvbmx5IGFwcGxpZXMgdG8gaU9TLCBhbmQgaU9TIGlkZW50aWZpZXJzIGFyZSBhbHdheXMgbG9uZyxcblx0XHRcdFx0Ly8gcmFuZG9tIGludGVnZXJzLCBpdCdzIHNhZmUgdG8gdG8gY29udGludWUgaWYgdGhlIGlkZW50aWZpZXIgaXMgMCBoZXJlLlxuXHRcdFx0XHRpZiAodG91Y2guaWRlbnRpZmllciAmJiB0b3VjaC5pZGVudGlmaWVyID09PSB0aGlzLmxhc3RUb3VjaElkZW50aWZpZXIpIHtcblx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IHRvdWNoLmlkZW50aWZpZXI7XG5cblx0XHRcdFx0Ly8gSWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyICh1c2luZyAtd2Via2l0LW92ZXJmbG93LXNjcm9sbGluZzogdG91Y2gpIGFuZDpcblx0XHRcdFx0Ly8gMSkgdGhlIHVzZXIgZG9lcyBhIGZsaW5nIHNjcm9sbCBvbiB0aGUgc2Nyb2xsYWJsZSBsYXllclxuXHRcdFx0XHQvLyAyKSB0aGUgdXNlciBzdG9wcyB0aGUgZmxpbmcgc2Nyb2xsIHdpdGggYW5vdGhlciB0YXBcblx0XHRcdFx0Ly8gdGhlbiB0aGUgZXZlbnQudGFyZ2V0IG9mIHRoZSBsYXN0ICd0b3VjaGVuZCcgZXZlbnQgd2lsbCBiZSB0aGUgZWxlbWVudCB0aGF0IHdhcyB1bmRlciB0aGUgdXNlcidzIGZpbmdlclxuXHRcdFx0XHQvLyB3aGVuIHRoZSBmbGluZyBzY3JvbGwgd2FzIHN0YXJ0ZWQsIGNhdXNpbmcgRmFzdENsaWNrIHRvIHNlbmQgYSBjbGljayBldmVudCB0byB0aGF0IGxheWVyIC0gdW5sZXNzIGEgY2hlY2tcblx0XHRcdFx0Ly8gaXMgbWFkZSB0byBlbnN1cmUgdGhhdCBhIHBhcmVudCBsYXllciB3YXMgbm90IHNjcm9sbGVkIGJlZm9yZSBzZW5kaW5nIGEgc3ludGhldGljIGNsaWNrIChpc3N1ZSAjNDIpLlxuXHRcdFx0XHR0aGlzLnVwZGF0ZVNjcm9sbFBhcmVudCh0YXJnZXRFbGVtZW50KTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSB0cnVlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gZXZlbnQudGltZVN0YW1wO1xuXHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cblx0XHR0aGlzLnRvdWNoU3RhcnRYID0gdG91Y2gucGFnZVg7XG5cdFx0dGhpcy50b3VjaFN0YXJ0WSA9IHRvdWNoLnBhZ2VZO1xuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIEJhc2VkIG9uIGEgdG91Y2htb3ZlIGV2ZW50IG9iamVjdCwgY2hlY2sgd2hldGhlciB0aGUgdG91Y2ggaGFzIG1vdmVkIHBhc3QgYSBib3VuZGFyeSBzaW5jZSBpdCBzdGFydGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUudG91Y2hIYXNNb3ZlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF0sIGJvdW5kYXJ5ID0gdGhpcy50b3VjaEJvdW5kYXJ5O1xuXG5cdFx0aWYgKE1hdGguYWJzKHRvdWNoLnBhZ2VYIC0gdGhpcy50b3VjaFN0YXJ0WCkgPiBib3VuZGFyeSB8fCBNYXRoLmFicyh0b3VjaC5wYWdlWSAtIHRoaXMudG91Y2hTdGFydFkpID4gYm91bmRhcnkpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBVcGRhdGUgdGhlIGxhc3QgcG9zaXRpb24uXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoTW92ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0aWYgKCF0aGlzLnRyYWNraW5nQ2xpY2spIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIElmIHRoZSB0b3VjaCBoYXMgbW92ZWQsIGNhbmNlbCB0aGUgY2xpY2sgdHJhY2tpbmdcblx0XHRpZiAodGhpcy50YXJnZXRFbGVtZW50ICE9PSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KSB8fCB0aGlzLnRvdWNoSGFzTW92ZWQoZXZlbnQpKSB7XG5cdFx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQXR0ZW1wdCB0byBmaW5kIHRoZSBsYWJlbGxlZCBjb250cm9sIGZvciB0aGUgZ2l2ZW4gbGFiZWwgZWxlbWVudC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxIVE1MTGFiZWxFbGVtZW50fSBsYWJlbEVsZW1lbnRcblx0ICogQHJldHVybnMge0VsZW1lbnR8bnVsbH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZmluZENvbnRyb2wgPSBmdW5jdGlvbihsYWJlbEVsZW1lbnQpIHtcblxuXHRcdC8vIEZhc3QgcGF0aCBmb3IgbmV3ZXIgYnJvd3NlcnMgc3VwcG9ydGluZyB0aGUgSFRNTDUgY29udHJvbCBhdHRyaWJ1dGVcblx0XHRpZiAobGFiZWxFbGVtZW50LmNvbnRyb2wgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIGxhYmVsRWxlbWVudC5jb250cm9sO1xuXHRcdH1cblxuXHRcdC8vIEFsbCBicm93c2VycyB1bmRlciB0ZXN0IHRoYXQgc3VwcG9ydCB0b3VjaCBldmVudHMgYWxzbyBzdXBwb3J0IHRoZSBIVE1MNSBodG1sRm9yIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuaHRtbEZvcikge1xuXHRcdFx0cmV0dXJuIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGxhYmVsRWxlbWVudC5odG1sRm9yKTtcblx0XHR9XG5cblx0XHQvLyBJZiBubyBmb3IgYXR0cmlidXRlIGV4aXN0cywgYXR0ZW1wdCB0byByZXRyaWV2ZSB0aGUgZmlyc3QgbGFiZWxsYWJsZSBkZXNjZW5kYW50IGVsZW1lbnRcblx0XHQvLyB0aGUgbGlzdCBvZiB3aGljaCBpcyBkZWZpbmVkIGhlcmU6IGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWw1L2Zvcm1zLmh0bWwjY2F0ZWdvcnktbGFiZWxcblx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJ2J1dHRvbiwgaW5wdXQ6bm90KFt0eXBlPWhpZGRlbl0pLCBrZXlnZW4sIG1ldGVyLCBvdXRwdXQsIHByb2dyZXNzLCBzZWxlY3QsIHRleHRhcmVhJyk7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggZW5kLCBkZXRlcm1pbmUgd2hldGhlciB0byBzZW5kIGEgY2xpY2sgZXZlbnQgYXQgb25jZS5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hFbmQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBmb3JFbGVtZW50LCB0cmFja2luZ0NsaWNrU3RhcnQsIHRhcmdldFRhZ05hbWUsIHNjcm9sbFBhcmVudCwgdG91Y2gsIHRhcmdldEVsZW1lbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQ7XG5cblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCBwaGFudG9tIGNsaWNrcyBvbiBmYXN0IGRvdWJsZS10YXAgKGlzc3VlICMzNilcblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMubGFzdENsaWNrVGltZSkgPCB0aGlzLnRhcERlbGF5KSB7XG5cdFx0XHR0aGlzLmNhbmNlbE5leHRDbGljayA9IHRydWU7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRpZiAoKGV2ZW50LnRpbWVTdGFtcCAtIHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0KSA+IHRoaXMudGFwVGltZW91dCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gUmVzZXQgdG8gcHJldmVudCB3cm9uZyBjbGljayBjYW5jZWwgb24gaW5wdXQgKGlzc3VlICMxNTYpLlxuXHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gZmFsc2U7XG5cblx0XHR0aGlzLmxhc3RDbGlja1RpbWUgPSBldmVudC50aW1lU3RhbXA7XG5cblx0XHR0cmFja2luZ0NsaWNrU3RhcnQgPSB0aGlzLnRyYWNraW5nQ2xpY2tTdGFydDtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2tTdGFydCA9IDA7XG5cblx0XHQvLyBPbiBzb21lIGlPUyBkZXZpY2VzLCB0aGUgdGFyZ2V0RWxlbWVudCBzdXBwbGllZCB3aXRoIHRoZSBldmVudCBpcyBpbnZhbGlkIGlmIHRoZSBsYXllclxuXHRcdC8vIGlzIHBlcmZvcm1pbmcgYSB0cmFuc2l0aW9uIG9yIHNjcm9sbCwgYW5kIGhhcyB0byBiZSByZS1kZXRlY3RlZCBtYW51YWxseS4gTm90ZSB0aGF0XG5cdFx0Ly8gZm9yIHRoaXMgdG8gZnVuY3Rpb24gY29ycmVjdGx5LCBpdCBtdXN0IGJlIGNhbGxlZCAqYWZ0ZXIqIHRoZSBldmVudCB0YXJnZXQgaXMgY2hlY2tlZCFcblx0XHQvLyBTZWUgaXNzdWUgIzU3OyBhbHNvIGZpbGVkIGFzIHJkYXI6Ly8xMzA0ODU4OSAuXG5cdFx0aWYgKGRldmljZUlzSU9TV2l0aEJhZFRhcmdldCkge1xuXHRcdFx0dG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXTtcblxuXHRcdFx0Ly8gSW4gY2VydGFpbiBjYXNlcyBhcmd1bWVudHMgb2YgZWxlbWVudEZyb21Qb2ludCBjYW4gYmUgbmVnYXRpdmUsIHNvIHByZXZlbnQgc2V0dGluZyB0YXJnZXRFbGVtZW50IHRvIG51bGxcblx0XHRcdHRhcmdldEVsZW1lbnQgPSBkb2N1bWVudC5lbGVtZW50RnJvbVBvaW50KHRvdWNoLnBhZ2VYIC0gd2luZG93LnBhZ2VYT2Zmc2V0LCB0b3VjaC5wYWdlWSAtIHdpbmRvdy5wYWdlWU9mZnNldCkgfHwgdGFyZ2V0RWxlbWVudDtcblx0XHRcdHRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50ID0gdGhpcy50YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHR9XG5cblx0XHR0YXJnZXRUYWdOYW1lID0gdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCk7XG5cdFx0aWYgKHRhcmdldFRhZ05hbWUgPT09ICdsYWJlbCcpIHtcblx0XHRcdGZvckVsZW1lbnQgPSB0aGlzLmZpbmRDb250cm9sKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0aWYgKGZvckVsZW1lbnQpIHtcblx0XHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRhcmdldEVsZW1lbnQgPSBmb3JFbGVtZW50O1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAodGhpcy5uZWVkc0ZvY3VzKHRhcmdldEVsZW1lbnQpKSB7XG5cblx0XHRcdC8vIENhc2UgMTogSWYgdGhlIHRvdWNoIHN0YXJ0ZWQgYSB3aGlsZSBhZ28gKGJlc3QgZ3Vlc3MgaXMgMTAwbXMgYmFzZWQgb24gdGVzdHMgZm9yIGlzc3VlICMzNikgdGhlbiBmb2N1cyB3aWxsIGJlIHRyaWdnZXJlZCBhbnl3YXkuIFJldHVybiBlYXJseSBhbmQgdW5zZXQgdGhlIHRhcmdldCBlbGVtZW50IHJlZmVyZW5jZSBzbyB0aGF0IHRoZSBzdWJzZXF1ZW50IGNsaWNrIHdpbGwgYmUgYWxsb3dlZCB0aHJvdWdoLlxuXHRcdFx0Ly8gQ2FzZSAyOiBXaXRob3V0IHRoaXMgZXhjZXB0aW9uIGZvciBpbnB1dCBlbGVtZW50cyB0YXBwZWQgd2hlbiB0aGUgZG9jdW1lbnQgaXMgY29udGFpbmVkIGluIGFuIGlmcmFtZSwgdGhlbiBhbnkgaW5wdXR0ZWQgdGV4dCB3b24ndCBiZSB2aXNpYmxlIGV2ZW4gdGhvdWdoIHRoZSB2YWx1ZSBhdHRyaWJ1dGUgaXMgdXBkYXRlZCBhcyB0aGUgdXNlciB0eXBlcyAoaXNzdWUgIzM3KS5cblx0XHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdHJhY2tpbmdDbGlja1N0YXJ0KSA+IDEwMCB8fCAoZGV2aWNlSXNJT1MgJiYgd2luZG93LnRvcCAhPT0gd2luZG93ICYmIHRhcmdldFRhZ05hbWUgPT09ICdpbnB1dCcpKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0dGhpcy5mb2N1cyh0YXJnZXRFbGVtZW50KTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblxuXHRcdFx0Ly8gU2VsZWN0IGVsZW1lbnRzIG5lZWQgdGhlIGV2ZW50IHRvIGdvIHRocm91Z2ggb24gaU9TIDQsIG90aGVyd2lzZSB0aGUgc2VsZWN0b3IgbWVudSB3b24ndCBvcGVuLlxuXHRcdFx0Ly8gQWxzbyB0aGlzIGJyZWFrcyBvcGVuaW5nIHNlbGVjdHMgd2hlbiBWb2ljZU92ZXIgaXMgYWN0aXZlIG9uIGlPUzYsIGlPUzcgKGFuZCBwb3NzaWJseSBvdGhlcnMpXG5cdFx0XHRpZiAoIWRldmljZUlzSU9TIHx8IHRhcmdldFRhZ05hbWUgIT09ICdzZWxlY3QnKSB7XG5cdFx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MgJiYgIWRldmljZUlzSU9TNCkge1xuXG5cdFx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIGV2ZW50IGlmIHRoZSB0YXJnZXQgZWxlbWVudCBpcyBjb250YWluZWQgd2l0aGluIGEgcGFyZW50IGxheWVyIHRoYXQgd2FzIHNjcm9sbGVkXG5cdFx0XHQvLyBhbmQgdGhpcyB0YXAgaXMgYmVpbmcgdXNlZCB0byBzdG9wIHRoZSBzY3JvbGxpbmcgKHVzdWFsbHkgaW5pdGlhdGVkIGJ5IGEgZmxpbmcgLSBpc3N1ZSAjNDIpLlxuXHRcdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cdFx0XHRpZiAoc2Nyb2xsUGFyZW50ICYmIHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wICE9PSBzY3JvbGxQYXJlbnQuc2Nyb2xsVG9wKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIFByZXZlbnQgdGhlIGFjdHVhbCBjbGljayBmcm9tIGdvaW5nIHRob3VnaCAtIHVubGVzcyB0aGUgdGFyZ2V0IG5vZGUgaXMgbWFya2VkIGFzIHJlcXVpcmluZ1xuXHRcdC8vIHJlYWwgY2xpY2tzIG9yIGlmIGl0IGlzIGluIHRoZSB3aGl0ZWxpc3QgaW4gd2hpY2ggY2FzZSBvbmx5IG5vbi1wcm9ncmFtbWF0aWMgY2xpY2tzIGFyZSBwZXJtaXR0ZWQuXG5cdFx0aWYgKCF0aGlzLm5lZWRzQ2xpY2sodGFyZ2V0RWxlbWVudCkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLnNlbmRDbGljayh0YXJnZXRFbGVtZW50LCBldmVudCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIGNhbmNlbCwgc3RvcCB0cmFja2luZyB0aGUgY2xpY2suXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vblRvdWNoQ2FuY2VsID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgbW91c2UgZXZlbnRzIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbk1vdXNlID0gZnVuY3Rpb24oZXZlbnQpIHtcblxuXHRcdC8vIElmIGEgdGFyZ2V0IGVsZW1lbnQgd2FzIG5ldmVyIHNldCAoYmVjYXVzZSBhIHRvdWNoIGV2ZW50IHdhcyBuZXZlciBmaXJlZCkgYWxsb3cgdGhlIGV2ZW50XG5cdFx0aWYgKCF0aGlzLnRhcmdldEVsZW1lbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmIChldmVudC5mb3J3YXJkZWRUb3VjaEV2ZW50KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcm9ncmFtbWF0aWNhbGx5IGdlbmVyYXRlZCBldmVudHMgdGFyZ2V0aW5nIGEgc3BlY2lmaWMgZWxlbWVudCBzaG91bGQgYmUgcGVybWl0dGVkXG5cdFx0aWYgKCFldmVudC5jYW5jZWxhYmxlKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBEZXJpdmUgYW5kIGNoZWNrIHRoZSB0YXJnZXQgZWxlbWVudCB0byBzZWUgd2hldGhlciB0aGUgbW91c2UgZXZlbnQgbmVlZHMgdG8gYmUgcGVybWl0dGVkO1xuXHRcdC8vIHVubGVzcyBleHBsaWNpdGx5IGVuYWJsZWQsIHByZXZlbnQgbm9uLXRvdWNoIGNsaWNrIGV2ZW50cyBmcm9tIHRyaWdnZXJpbmcgYWN0aW9ucyxcblx0XHQvLyB0byBwcmV2ZW50IGdob3N0L2RvdWJsZWNsaWNrcy5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0aGlzLnRhcmdldEVsZW1lbnQpIHx8IHRoaXMuY2FuY2VsTmV4dENsaWNrKSB7XG5cblx0XHRcdC8vIFByZXZlbnQgYW55IHVzZXItYWRkZWQgbGlzdGVuZXJzIGRlY2xhcmVkIG9uIEZhc3RDbGljayBlbGVtZW50IGZyb20gYmVpbmcgZmlyZWQuXG5cdFx0XHRpZiAoZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKSB7XG5cdFx0XHRcdGV2ZW50LnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdFx0fSBlbHNlIHtcblxuXHRcdFx0XHQvLyBQYXJ0IG9mIHRoZSBoYWNrIGZvciBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgRXZlbnQjc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uIChlLmcuIEFuZHJvaWQgMilcblx0XHRcdFx0ZXZlbnQucHJvcGFnYXRpb25TdG9wcGVkID0gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FuY2VsIHRoZSBldmVudFxuXHRcdFx0ZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIG1vdXNlIGV2ZW50IGlzIHBlcm1pdHRlZCwgcmV0dXJuIHRydWUgZm9yIHRoZSBhY3Rpb24gdG8gZ28gdGhyb3VnaC5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiBhY3R1YWwgY2xpY2tzLCBkZXRlcm1pbmUgd2hldGhlciB0aGlzIGlzIGEgdG91Y2gtZ2VuZXJhdGVkIGNsaWNrLCBhIGNsaWNrIGFjdGlvbiBvY2N1cnJpbmdcblx0ICogbmF0dXJhbGx5IGFmdGVyIGEgZGVsYXkgYWZ0ZXIgYSB0b3VjaCAod2hpY2ggbmVlZHMgdG8gYmUgY2FuY2VsbGVkIHRvIGF2b2lkIGR1cGxpY2F0aW9uKSwgb3Jcblx0ICogYW4gYWN0dWFsIGNsaWNrIHdoaWNoIHNob3VsZCBiZSBwZXJtaXR0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5vbkNsaWNrID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgcGVybWl0dGVkO1xuXG5cdFx0Ly8gSXQncyBwb3NzaWJsZSBmb3IgYW5vdGhlciBGYXN0Q2xpY2stbGlrZSBsaWJyYXJ5IGRlbGl2ZXJlZCB3aXRoIHRoaXJkLXBhcnR5IGNvZGUgdG8gZmlyZSBhIGNsaWNrIGV2ZW50IGJlZm9yZSBGYXN0Q2xpY2sgZG9lcyAoaXNzdWUgIzQ0KS4gSW4gdGhhdCBjYXNlLCBzZXQgdGhlIGNsaWNrLXRyYWNraW5nIGZsYWcgYmFjayB0byBmYWxzZSBhbmQgcmV0dXJuIGVhcmx5LiBUaGlzIHdpbGwgY2F1c2Ugb25Ub3VjaEVuZCB0byByZXR1cm4gZWFybHkuXG5cdFx0aWYgKHRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gVmVyeSBvZGQgYmVoYXZpb3VyIG9uIGlPUyAoaXNzdWUgIzE4KTogaWYgYSBzdWJtaXQgZWxlbWVudCBpcyBwcmVzZW50IGluc2lkZSBhIGZvcm0gYW5kIHRoZSB1c2VyIGhpdHMgZW50ZXIgaW4gdGhlIGlPUyBzaW11bGF0b3Igb3IgY2xpY2tzIHRoZSBHbyBidXR0b24gb24gdGhlIHBvcC11cCBPUyBrZXlib2FyZCB0aGUgYSBraW5kIG9mICdmYWtlJyBjbGljayBldmVudCB3aWxsIGJlIHRyaWdnZXJlZCB3aXRoIHRoZSBzdWJtaXQtdHlwZSBpbnB1dCBlbGVtZW50IGFzIHRoZSB0YXJnZXQuXG5cdFx0aWYgKGV2ZW50LnRhcmdldC50eXBlID09PSAnc3VibWl0JyAmJiBldmVudC5kZXRhaWwgPT09IDApIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHBlcm1pdHRlZCA9IHRoaXMub25Nb3VzZShldmVudCk7XG5cblx0XHQvLyBPbmx5IHVuc2V0IHRhcmdldEVsZW1lbnQgaWYgdGhlIGNsaWNrIGlzIG5vdCBwZXJtaXR0ZWQuIFRoaXMgd2lsbCBlbnN1cmUgdGhhdCB0aGUgY2hlY2sgZm9yICF0YXJnZXRFbGVtZW50IGluIG9uTW91c2UgZmFpbHMgYW5kIHRoZSBicm93c2VyJ3MgY2xpY2sgZG9lc24ndCBnbyB0aHJvdWdoLlxuXHRcdGlmICghcGVybWl0dGVkKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdH1cblxuXHRcdC8vIElmIGNsaWNrcyBhcmUgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiBwZXJtaXR0ZWQ7XG5cdH07XG5cblxuXHQvKipcblx0ICogUmVtb3ZlIGFsbCBGYXN0Q2xpY2sncyBldmVudCBsaXN0ZW5lcnMuXG5cdCAqXG5cdCAqIEByZXR1cm5zIHt2b2lkfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGxheWVyID0gdGhpcy5sYXllcjtcblxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlb3ZlcicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2V1cCcsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0fVxuXG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignY2xpY2snLCB0aGlzLm9uQ2xpY2ssIHRydWUpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLm9uVG91Y2hTdGFydCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIHRoaXMub25Ub3VjaE1vdmUsIGZhbHNlKTtcblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIHRoaXMub25Ub3VjaEVuZCwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoY2FuY2VsJywgdGhpcy5vblRvdWNoQ2FuY2VsLCBmYWxzZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogQ2hlY2sgd2hldGhlciBGYXN0Q2xpY2sgaXMgbmVlZGVkLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICovXG5cdEZhc3RDbGljay5ub3ROZWVkZWQgPSBmdW5jdGlvbihsYXllcikge1xuXHRcdHZhciBtZXRhVmlld3BvcnQ7XG5cdFx0dmFyIGNocm9tZVZlcnNpb247XG5cdFx0dmFyIGJsYWNrYmVycnlWZXJzaW9uO1xuXHRcdHZhciBmaXJlZm94VmVyc2lvbjtcblxuXHRcdC8vIERldmljZXMgdGhhdCBkb24ndCBzdXBwb3J0IHRvdWNoIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gQ2hyb21lIHZlcnNpb24gLSB6ZXJvIGZvciBvdGhlciBicm93c2Vyc1xuXHRcdGNocm9tZVZlcnNpb24gPSArKC9DaHJvbWVcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChjaHJvbWVWZXJzaW9uKSB7XG5cblx0XHRcdGlmIChkZXZpY2VJc0FuZHJvaWQpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyBDaHJvbWUgb24gQW5kcm9pZCB3aXRoIHVzZXItc2NhbGFibGU9XCJub1wiIGRvZXNuJ3QgbmVlZCBGYXN0Q2xpY2sgKGlzc3VlICM4OSlcblx0XHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0LmNvbnRlbnQuaW5kZXhPZigndXNlci1zY2FsYWJsZT1ubycpICE9PSAtMSkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdC8vIENocm9tZSAzMiBhbmQgYWJvdmUgd2l0aCB3aWR0aD1kZXZpY2Utd2lkdGggb3IgbGVzcyBkb24ndCBuZWVkIEZhc3RDbGlja1xuXHRcdFx0XHRcdGlmIChjaHJvbWVWZXJzaW9uID4gMzEgJiYgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0Ly8gQ2hyb21lIGRlc2t0b3AgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzE1KVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKGRldmljZUlzQmxhY2tCZXJyeTEwKSB7XG5cdFx0XHRibGFja2JlcnJ5VmVyc2lvbiA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL1ZlcnNpb25cXC8oWzAtOV0qKVxcLihbMC05XSopLyk7XG5cblx0XHRcdC8vIEJsYWNrQmVycnkgMTAuMysgZG9lcyBub3QgcmVxdWlyZSBGYXN0Y2xpY2sgbGlicmFyeS5cblx0XHRcdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9mdGxhYnMvZmFzdGNsaWNrL2lzc3Vlcy8yNTFcblx0XHRcdGlmIChibGFja2JlcnJ5VmVyc2lvblsxXSA+PSAxMCAmJiBibGFja2JlcnJ5VmVyc2lvblsyXSA+PSAzKSB7XG5cdFx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblxuXHRcdFx0XHRpZiAobWV0YVZpZXdwb3J0KSB7XG5cdFx0XHRcdFx0Ly8gdXNlci1zY2FsYWJsZT1ubyBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gd2lkdGg9ZGV2aWNlLXdpZHRoIChvciBsZXNzIHRoYW4gZGV2aWNlLXdpZHRoKSBlbGltaW5hdGVzIGNsaWNrIGRlbGF5LlxuXHRcdFx0XHRcdGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdC8vIElFMTAgd2l0aCAtbXMtdG91Y2gtYWN0aW9uOiBub25lIG9yIG1hbmlwdWxhdGlvbiwgd2hpY2ggZGlzYWJsZXMgZG91YmxlLXRhcC10by16b29tIChpc3N1ZSAjOTcpXG5cdFx0aWYgKGxheWVyLnN0eWxlLm1zVG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIEZpcmVmb3ggdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0ZmlyZWZveFZlcnNpb24gPSArKC9GaXJlZm94XFwvKFswLTldKykvLmV4ZWMobmF2aWdhdG9yLnVzZXJBZ2VudCkgfHwgWywwXSlbMV07XG5cblx0XHRpZiAoZmlyZWZveFZlcnNpb24gPj0gMjcpIHtcblx0XHRcdC8vIEZpcmVmb3ggMjcrIGRvZXMgbm90IGhhdmUgdGFwIGRlbGF5IGlmIHRoZSBjb250ZW50IGlzIG5vdCB6b29tYWJsZSAtIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkyMjg5NlxuXG5cdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cdFx0XHRpZiAobWV0YVZpZXdwb3J0ICYmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xIHx8IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkpIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMTogcHJlZml4ZWQgLW1zLXRvdWNoLWFjdGlvbiBpcyBubyBsb25nZXIgc3VwcG9ydGVkIGFuZCBpdCdzIHJlY29tZW5kZWQgdG8gdXNlIG5vbi1wcmVmaXhlZCB2ZXJzaW9uXG5cdFx0Ly8gaHR0cDovL21zZG4ubWljcm9zb2Z0LmNvbS9lbi11cy9saWJyYXJ5L3dpbmRvd3MvYXBwcy9IaDc2NzMxMy5hc3B4XG5cdFx0aWYgKGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbm9uZScgfHwgbGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdtYW5pcHVsYXRpb24nKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgZm9yIGNyZWF0aW5nIGEgRmFzdENsaWNrIG9iamVjdFxuXHQgKlxuXHQgKiBAcGFyYW0ge0VsZW1lbnR9IGxheWVyIFRoZSBsYXllciB0byBsaXN0ZW4gb25cblx0ICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zPXt9XSBUaGUgb3B0aW9ucyB0byBvdmVycmlkZSB0aGUgZGVmYXVsdHNcblx0ICovXG5cdEZhc3RDbGljay5hdHRhY2ggPSBmdW5jdGlvbihsYXllciwgb3B0aW9ucykge1xuXHRcdHJldHVybiBuZXcgRmFzdENsaWNrKGxheWVyLCBvcHRpb25zKTtcblx0fTtcblxuXG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09PSAnb2JqZWN0JyAmJiBkZWZpbmUuYW1kKSB7XG5cblx0XHQvLyBBTUQuIFJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBtb2R1bGUuXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIEZhc3RDbGljaztcblx0XHR9KTtcblx0fSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cykge1xuXHRcdG1vZHVsZS5leHBvcnRzID0gRmFzdENsaWNrLmF0dGFjaDtcblx0XHRtb2R1bGUuZXhwb3J0cy5GYXN0Q2xpY2sgPSBGYXN0Q2xpY2s7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fVxufSgpKTtcbiIsIi8qIVxuXG4gaGFuZGxlYmFycyB2My4wLjNcblxuQ29weXJpZ2h0IChDKSAyMDExLTIwMTQgYnkgWWVodWRhIEthdHpcblxuUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxub2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xudG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG5mdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuXG5UaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpblxuYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG5cblRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbklNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG5BVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG5MSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTlxuVEhFIFNPRlRXQVJFLlxuXG5AbGljZW5zZVxuKi9cbihmdW5jdGlvbiB3ZWJwYWNrVW5pdmVyc2FsTW9kdWxlRGVmaW5pdGlvbihyb290LCBmYWN0b3J5KSB7XG5cdGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlID09PSAnb2JqZWN0Jylcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGZhY3RvcnkoKTtcblx0ZWxzZSBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpXG5cdFx0ZGVmaW5lKGZhY3RvcnkpO1xuXHRlbHNlIGlmKHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0Jylcblx0XHRleHBvcnRzW1wiSGFuZGxlYmFyc1wiXSA9IGZhY3RvcnkoKTtcblx0ZWxzZVxuXHRcdHJvb3RbXCJIYW5kbGViYXJzXCJdID0gZmFjdG9yeSgpO1xufSkodGhpcywgZnVuY3Rpb24oKSB7XG5yZXR1cm4gLyoqKioqKi8gKGZ1bmN0aW9uKG1vZHVsZXMpIHsgLy8gd2VicGFja0Jvb3RzdHJhcFxuLyoqKioqKi8gXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4vKioqKioqLyBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbi8qKioqKiovIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbi8qKioqKiovIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4vKioqKioqLyBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4vKioqKioqLyBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4vKioqKioqLyBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuLyoqKioqKi8gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4vKioqKioqLyBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuLyoqKioqKi8gXHRcdFx0ZXhwb3J0czoge30sXG4vKioqKioqLyBcdFx0XHRpZDogbW9kdWxlSWQsXG4vKioqKioqLyBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4vKioqKioqLyBcdFx0fTtcblxuLyoqKioqKi8gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuLyoqKioqKi8gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4vKioqKioqLyBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuLyoqKioqKi8gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4vKioqKioqLyBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbi8qKioqKiovIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4vKioqKioqLyBcdH1cblxuXG4vKioqKioqLyBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4vKioqKioqLyBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuLyoqKioqKi8gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcbi8qKioqKiovIH0pXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqKioqKi8gKFtcbi8qIDAgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpWydkZWZhdWx0J107XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuXHR2YXIgX2ltcG9ydCA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cblx0dmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxuXHQvLyBFYWNoIG9mIHRoZXNlIGF1Z21lbnQgdGhlIEhhbmRsZWJhcnMgb2JqZWN0LiBObyBuZWVkIHRvIHNldHVwIGhlcmUuXG5cdC8vIChUaGlzIGlzIGRvbmUgdG8gZWFzaWx5IHNoYXJlIGNvZGUgYmV0d2VlbiBjb21tb25qcyBhbmQgYnJvd3NlIGVudnMpXG5cblx0dmFyIF9TYWZlU3RyaW5nID0gX193ZWJwYWNrX3JlcXVpcmVfXygyKTtcblxuXHR2YXIgX1NhZmVTdHJpbmcyID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX1NhZmVTdHJpbmcpO1xuXG5cdHZhciBfRXhjZXB0aW9uID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHR2YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxuXHR2YXIgX2ltcG9ydDIgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpO1xuXG5cdHZhciBVdGlscyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQyKTtcblxuXHR2YXIgX2ltcG9ydDMgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDUpO1xuXG5cdHZhciBydW50aW1lID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydDMpO1xuXG5cdHZhciBfbm9Db25mbGljdCA9IF9fd2VicGFja19yZXF1aXJlX18oNik7XG5cblx0dmFyIF9ub0NvbmZsaWN0MiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9ub0NvbmZsaWN0KTtcblxuXHQvLyBGb3IgY29tcGF0aWJpbGl0eSBhbmQgdXNhZ2Ugb3V0c2lkZSBvZiBtb2R1bGUgc3lzdGVtcywgbWFrZSB0aGUgSGFuZGxlYmFycyBvYmplY3QgYSBuYW1lc3BhY2Vcblx0ZnVuY3Rpb24gY3JlYXRlKCkge1xuXHQgIHZhciBoYiA9IG5ldyBiYXNlLkhhbmRsZWJhcnNFbnZpcm9ubWVudCgpO1xuXG5cdCAgVXRpbHMuZXh0ZW5kKGhiLCBiYXNlKTtcblx0ICBoYi5TYWZlU3RyaW5nID0gX1NhZmVTdHJpbmcyWydkZWZhdWx0J107XG5cdCAgaGIuRXhjZXB0aW9uID0gX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXTtcblx0ICBoYi5VdGlscyA9IFV0aWxzO1xuXHQgIGhiLmVzY2FwZUV4cHJlc3Npb24gPSBVdGlscy5lc2NhcGVFeHByZXNzaW9uO1xuXG5cdCAgaGIuVk0gPSBydW50aW1lO1xuXHQgIGhiLnRlbXBsYXRlID0gZnVuY3Rpb24gKHNwZWMpIHtcblx0ICAgIHJldHVybiBydW50aW1lLnRlbXBsYXRlKHNwZWMsIGhiKTtcblx0ICB9O1xuXG5cdCAgcmV0dXJuIGhiO1xuXHR9XG5cblx0dmFyIGluc3QgPSBjcmVhdGUoKTtcblx0aW5zdC5jcmVhdGUgPSBjcmVhdGU7XG5cblx0X25vQ29uZmxpY3QyWydkZWZhdWx0J10oaW5zdCk7XG5cblx0aW5zdFsnZGVmYXVsdCddID0gaW5zdDtcblxuXHRleHBvcnRzWydkZWZhdWx0J10gPSBpbnN0O1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDEgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpWydkZWZhdWx0J107XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0ZXhwb3J0cy5IYW5kbGViYXJzRW52aXJvbm1lbnQgPSBIYW5kbGViYXJzRW52aXJvbm1lbnQ7XG5cdGV4cG9ydHMuY3JlYXRlRnJhbWUgPSBjcmVhdGVGcmFtZTtcblxuXHR2YXIgX2ltcG9ydCA9IF9fd2VicGFja19yZXF1aXJlX18oNCk7XG5cblx0dmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cblx0dmFyIF9FeGNlcHRpb24gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdHZhciBfRXhjZXB0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9FeGNlcHRpb24pO1xuXG5cdHZhciBWRVJTSU9OID0gJzMuMC4xJztcblx0ZXhwb3J0cy5WRVJTSU9OID0gVkVSU0lPTjtcblx0dmFyIENPTVBJTEVSX1JFVklTSU9OID0gNjtcblxuXHRleHBvcnRzLkNPTVBJTEVSX1JFVklTSU9OID0gQ09NUElMRVJfUkVWSVNJT047XG5cdHZhciBSRVZJU0lPTl9DSEFOR0VTID0ge1xuXHQgIDE6ICc8PSAxLjAucmMuMicsIC8vIDEuMC5yYy4yIGlzIGFjdHVhbGx5IHJldjIgYnV0IGRvZXNuJ3QgcmVwb3J0IGl0XG5cdCAgMjogJz09IDEuMC4wLXJjLjMnLFxuXHQgIDM6ICc9PSAxLjAuMC1yYy40Jyxcblx0ICA0OiAnPT0gMS54LngnLFxuXHQgIDU6ICc9PSAyLjAuMC1hbHBoYS54Jyxcblx0ICA2OiAnPj0gMi4wLjAtYmV0YS4xJ1xuXHR9O1xuXG5cdGV4cG9ydHMuUkVWSVNJT05fQ0hBTkdFUyA9IFJFVklTSU9OX0NIQU5HRVM7XG5cdHZhciBpc0FycmF5ID0gVXRpbHMuaXNBcnJheSxcblx0ICAgIGlzRnVuY3Rpb24gPSBVdGlscy5pc0Z1bmN0aW9uLFxuXHQgICAgdG9TdHJpbmcgPSBVdGlscy50b1N0cmluZyxcblx0ICAgIG9iamVjdFR5cGUgPSAnW29iamVjdCBPYmplY3RdJztcblxuXHRmdW5jdGlvbiBIYW5kbGViYXJzRW52aXJvbm1lbnQoaGVscGVycywgcGFydGlhbHMpIHtcblx0ICB0aGlzLmhlbHBlcnMgPSBoZWxwZXJzIHx8IHt9O1xuXHQgIHRoaXMucGFydGlhbHMgPSBwYXJ0aWFscyB8fCB7fTtcblxuXHQgIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnModGhpcyk7XG5cdH1cblxuXHRIYW5kbGViYXJzRW52aXJvbm1lbnQucHJvdG90eXBlID0ge1xuXHQgIGNvbnN0cnVjdG9yOiBIYW5kbGViYXJzRW52aXJvbm1lbnQsXG5cblx0ICBsb2dnZXI6IGxvZ2dlcixcblx0ICBsb2c6IGxvZyxcblxuXHQgIHJlZ2lzdGVySGVscGVyOiBmdW5jdGlvbiByZWdpc3RlckhlbHBlcihuYW1lLCBmbikge1xuXHQgICAgaWYgKHRvU3RyaW5nLmNhbGwobmFtZSkgPT09IG9iamVjdFR5cGUpIHtcblx0ICAgICAgaWYgKGZuKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ0FyZyBub3Qgc3VwcG9ydGVkIHdpdGggbXVsdGlwbGUgaGVscGVycycpO1xuXHQgICAgICB9XG5cdCAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmhlbHBlcnMsIG5hbWUpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgdGhpcy5oZWxwZXJzW25hbWVdID0gZm47XG5cdCAgICB9XG5cdCAgfSxcblx0ICB1bnJlZ2lzdGVySGVscGVyOiBmdW5jdGlvbiB1bnJlZ2lzdGVySGVscGVyKG5hbWUpIHtcblx0ICAgIGRlbGV0ZSB0aGlzLmhlbHBlcnNbbmFtZV07XG5cdCAgfSxcblxuXHQgIHJlZ2lzdGVyUGFydGlhbDogZnVuY3Rpb24gcmVnaXN0ZXJQYXJ0aWFsKG5hbWUsIHBhcnRpYWwpIHtcblx0ICAgIGlmICh0b1N0cmluZy5jYWxsKG5hbWUpID09PSBvYmplY3RUeXBlKSB7XG5cdCAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLnBhcnRpYWxzLCBuYW1lKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIGlmICh0eXBlb2YgcGFydGlhbCA9PT0gJ3VuZGVmaW5lZCcpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnQXR0ZW1wdGluZyB0byByZWdpc3RlciBhIHBhcnRpYWwgYXMgdW5kZWZpbmVkJyk7XG5cdCAgICAgIH1cblx0ICAgICAgdGhpcy5wYXJ0aWFsc1tuYW1lXSA9IHBhcnRpYWw7XG5cdCAgICB9XG5cdCAgfSxcblx0ICB1bnJlZ2lzdGVyUGFydGlhbDogZnVuY3Rpb24gdW5yZWdpc3RlclBhcnRpYWwobmFtZSkge1xuXHQgICAgZGVsZXRlIHRoaXMucGFydGlhbHNbbmFtZV07XG5cdCAgfVxuXHR9O1xuXG5cdGZ1bmN0aW9uIHJlZ2lzdGVyRGVmYXVsdEhlbHBlcnMoaW5zdGFuY2UpIHtcblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaGVscGVyTWlzc2luZycsIGZ1bmN0aW9uICgpIHtcblx0ICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG5cdCAgICAgIC8vIEEgbWlzc2luZyBmaWVsZCBpbiBhIHt7Zm9vfX0gY29uc3R1Y3QuXG5cdCAgICAgIHJldHVybiB1bmRlZmluZWQ7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAvLyBTb21lb25lIGlzIGFjdHVhbGx5IHRyeWluZyB0byBjYWxsIHNvbWV0aGluZywgYmxvdyB1cC5cblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ01pc3NpbmcgaGVscGVyOiBcIicgKyBhcmd1bWVudHNbYXJndW1lbnRzLmxlbmd0aCAtIDFdLm5hbWUgKyAnXCInKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdibG9ja0hlbHBlck1pc3NpbmcnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuXHQgICAgdmFyIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG5cdCAgICAgICAgZm4gPSBvcHRpb25zLmZuO1xuXG5cdCAgICBpZiAoY29udGV4dCA9PT0gdHJ1ZSkge1xuXHQgICAgICByZXR1cm4gZm4odGhpcyk7XG5cdCAgICB9IGVsc2UgaWYgKGNvbnRleHQgPT09IGZhbHNlIHx8IGNvbnRleHQgPT0gbnVsbCkge1xuXHQgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcblx0ICAgIH0gZWxzZSBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuXHQgICAgICBpZiAoY29udGV4dC5sZW5ndGggPiAwKSB7XG5cdCAgICAgICAgaWYgKG9wdGlvbnMuaWRzKSB7XG5cdCAgICAgICAgICBvcHRpb25zLmlkcyA9IFtvcHRpb25zLm5hbWVdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzLmVhY2goY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgICAgIH0gZWxzZSB7XG5cdCAgICAgICAgcmV0dXJuIGludmVyc2UodGhpcyk7XG5cdCAgICAgIH1cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIGlmIChvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5pZHMpIHtcblx0ICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG5cdCAgICAgICAgZGF0YS5jb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5uYW1lKTtcblx0ICAgICAgICBvcHRpb25zID0geyBkYXRhOiBkYXRhIH07XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gZm4oY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignZWFjaCcsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG5cdCAgICBpZiAoIW9wdGlvbnMpIHtcblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ011c3QgcGFzcyBpdGVyYXRvciB0byAjZWFjaCcpO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgZm4gPSBvcHRpb25zLmZuLFxuXHQgICAgICAgIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG5cdCAgICAgICAgaSA9IDAsXG5cdCAgICAgICAgcmV0ID0gJycsXG5cdCAgICAgICAgZGF0YSA9IHVuZGVmaW5lZCxcblx0ICAgICAgICBjb250ZXh0UGF0aCA9IHVuZGVmaW5lZDtcblxuXHQgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuXHQgICAgICBjb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5pZHNbMF0pICsgJy4nO1xuXHQgICAgfVxuXG5cdCAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkge1xuXHQgICAgICBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpO1xuXHQgICAgfVxuXG5cdCAgICBpZiAob3B0aW9ucy5kYXRhKSB7XG5cdCAgICAgIGRhdGEgPSBjcmVhdGVGcmFtZShvcHRpb25zLmRhdGEpO1xuXHQgICAgfVxuXG5cdCAgICBmdW5jdGlvbiBleGVjSXRlcmF0aW9uKGZpZWxkLCBpbmRleCwgbGFzdCkge1xuXHQgICAgICBpZiAoZGF0YSkge1xuXHQgICAgICAgIGRhdGEua2V5ID0gZmllbGQ7XG5cdCAgICAgICAgZGF0YS5pbmRleCA9IGluZGV4O1xuXHQgICAgICAgIGRhdGEuZmlyc3QgPSBpbmRleCA9PT0gMDtcblx0ICAgICAgICBkYXRhLmxhc3QgPSAhIWxhc3Q7XG5cblx0ICAgICAgICBpZiAoY29udGV4dFBhdGgpIHtcblx0ICAgICAgICAgIGRhdGEuY29udGV4dFBhdGggPSBjb250ZXh0UGF0aCArIGZpZWxkO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIHJldCA9IHJldCArIGZuKGNvbnRleHRbZmllbGRdLCB7XG5cdCAgICAgICAgZGF0YTogZGF0YSxcblx0ICAgICAgICBibG9ja1BhcmFtczogVXRpbHMuYmxvY2tQYXJhbXMoW2NvbnRleHRbZmllbGRdLCBmaWVsZF0sIFtjb250ZXh0UGF0aCArIGZpZWxkLCBudWxsXSlcblx0ICAgICAgfSk7XG5cdCAgICB9XG5cblx0ICAgIGlmIChjb250ZXh0ICYmIHR5cGVvZiBjb250ZXh0ID09PSAnb2JqZWN0Jykge1xuXHQgICAgICBpZiAoaXNBcnJheShjb250ZXh0KSkge1xuXHQgICAgICAgIGZvciAodmFyIGogPSBjb250ZXh0Lmxlbmd0aDsgaSA8IGo7IGkrKykge1xuXHQgICAgICAgICAgZXhlY0l0ZXJhdGlvbihpLCBpLCBpID09PSBjb250ZXh0Lmxlbmd0aCAtIDEpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICB2YXIgcHJpb3JLZXkgPSB1bmRlZmluZWQ7XG5cblx0ICAgICAgICBmb3IgKHZhciBrZXkgaW4gY29udGV4dCkge1xuXHQgICAgICAgICAgaWYgKGNvbnRleHQuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuXHQgICAgICAgICAgICAvLyBXZSdyZSBydW5uaW5nIHRoZSBpdGVyYXRpb25zIG9uZSBzdGVwIG91dCBvZiBzeW5jIHNvIHdlIGNhbiBkZXRlY3Rcblx0ICAgICAgICAgICAgLy8gdGhlIGxhc3QgaXRlcmF0aW9uIHdpdGhvdXQgaGF2ZSB0byBzY2FuIHRoZSBvYmplY3QgdHdpY2UgYW5kIGNyZWF0ZVxuXHQgICAgICAgICAgICAvLyBhbiBpdGVybWVkaWF0ZSBrZXlzIGFycmF5LlxuXHQgICAgICAgICAgICBpZiAocHJpb3JLZXkpIHtcblx0ICAgICAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSk7XG5cdCAgICAgICAgICAgIH1cblx0ICAgICAgICAgICAgcHJpb3JLZXkgPSBrZXk7XG5cdCAgICAgICAgICAgIGkrKztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9XG5cdCAgICAgICAgaWYgKHByaW9yS2V5KSB7XG5cdCAgICAgICAgICBleGVjSXRlcmF0aW9uKHByaW9yS2V5LCBpIC0gMSwgdHJ1ZSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIGlmIChpID09PSAwKSB7XG5cdCAgICAgIHJldCA9IGludmVyc2UodGhpcyk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiByZXQ7XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignaWYnLCBmdW5jdGlvbiAoY29uZGl0aW9uYWwsIG9wdGlvbnMpIHtcblx0ICAgIGlmIChpc0Z1bmN0aW9uKGNvbmRpdGlvbmFsKSkge1xuXHQgICAgICBjb25kaXRpb25hbCA9IGNvbmRpdGlvbmFsLmNhbGwodGhpcyk7XG5cdCAgICB9XG5cblx0ICAgIC8vIERlZmF1bHQgYmVoYXZpb3IgaXMgdG8gcmVuZGVyIHRoZSBwb3NpdGl2ZSBwYXRoIGlmIHRoZSB2YWx1ZSBpcyB0cnV0aHkgYW5kIG5vdCBlbXB0eS5cblx0ICAgIC8vIFRoZSBgaW5jbHVkZVplcm9gIG9wdGlvbiBtYXkgYmUgc2V0IHRvIHRyZWF0IHRoZSBjb25kdGlvbmFsIGFzIHB1cmVseSBub3QgZW1wdHkgYmFzZWQgb24gdGhlXG5cdCAgICAvLyBiZWhhdmlvciBvZiBpc0VtcHR5LiBFZmZlY3RpdmVseSB0aGlzIGRldGVybWluZXMgaWYgMCBpcyBoYW5kbGVkIGJ5IHRoZSBwb3NpdGl2ZSBwYXRoIG9yIG5lZ2F0aXZlLlxuXHQgICAgaWYgKCFvcHRpb25zLmhhc2guaW5jbHVkZVplcm8gJiYgIWNvbmRpdGlvbmFsIHx8IFV0aWxzLmlzRW1wdHkoY29uZGl0aW9uYWwpKSB7XG5cdCAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCd1bmxlc3MnLCBmdW5jdGlvbiAoY29uZGl0aW9uYWwsIG9wdGlvbnMpIHtcblx0ICAgIHJldHVybiBpbnN0YW5jZS5oZWxwZXJzWydpZiddLmNhbGwodGhpcywgY29uZGl0aW9uYWwsIHsgZm46IG9wdGlvbnMuaW52ZXJzZSwgaW52ZXJzZTogb3B0aW9ucy5mbiwgaGFzaDogb3B0aW9ucy5oYXNoIH0pO1xuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3dpdGgnLCBmdW5jdGlvbiAoY29udGV4dCwgb3B0aW9ucykge1xuXHQgICAgaWYgKGlzRnVuY3Rpb24oY29udGV4dCkpIHtcblx0ICAgICAgY29udGV4dCA9IGNvbnRleHQuY2FsbCh0aGlzKTtcblx0ICAgIH1cblxuXHQgICAgdmFyIGZuID0gb3B0aW9ucy5mbjtcblxuXHQgICAgaWYgKCFVdGlscy5pc0VtcHR5KGNvbnRleHQpKSB7XG5cdCAgICAgIGlmIChvcHRpb25zLmRhdGEgJiYgb3B0aW9ucy5pZHMpIHtcblx0ICAgICAgICB2YXIgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG5cdCAgICAgICAgZGF0YS5jb250ZXh0UGF0aCA9IFV0aWxzLmFwcGVuZENvbnRleHRQYXRoKG9wdGlvbnMuZGF0YS5jb250ZXh0UGF0aCwgb3B0aW9ucy5pZHNbMF0pO1xuXHQgICAgICAgIG9wdGlvbnMgPSB7IGRhdGE6IGRhdGEgfTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBmbihjb250ZXh0LCBvcHRpb25zKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG5cdCAgICB9XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9nJywgZnVuY3Rpb24gKG1lc3NhZ2UsIG9wdGlvbnMpIHtcblx0ICAgIHZhciBsZXZlbCA9IG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmRhdGEubGV2ZWwgIT0gbnVsbCA/IHBhcnNlSW50KG9wdGlvbnMuZGF0YS5sZXZlbCwgMTApIDogMTtcblx0ICAgIGluc3RhbmNlLmxvZyhsZXZlbCwgbWVzc2FnZSk7XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignbG9va3VwJywgZnVuY3Rpb24gKG9iaiwgZmllbGQpIHtcblx0ICAgIHJldHVybiBvYmogJiYgb2JqW2ZpZWxkXTtcblx0ICB9KTtcblx0fVxuXG5cdHZhciBsb2dnZXIgPSB7XG5cdCAgbWV0aG9kTWFwOiB7IDA6ICdkZWJ1ZycsIDE6ICdpbmZvJywgMjogJ3dhcm4nLCAzOiAnZXJyb3InIH0sXG5cblx0ICAvLyBTdGF0ZSBlbnVtXG5cdCAgREVCVUc6IDAsXG5cdCAgSU5GTzogMSxcblx0ICBXQVJOOiAyLFxuXHQgIEVSUk9SOiAzLFxuXHQgIGxldmVsOiAxLFxuXG5cdCAgLy8gQ2FuIGJlIG92ZXJyaWRkZW4gaW4gdGhlIGhvc3QgZW52aXJvbm1lbnRcblx0ICBsb2c6IGZ1bmN0aW9uIGxvZyhsZXZlbCwgbWVzc2FnZSkge1xuXHQgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiBsb2dnZXIubGV2ZWwgPD0gbGV2ZWwpIHtcblx0ICAgICAgdmFyIG1ldGhvZCA9IGxvZ2dlci5tZXRob2RNYXBbbGV2ZWxdO1xuXHQgICAgICAoY29uc29sZVttZXRob2RdIHx8IGNvbnNvbGUubG9nKS5jYWxsKGNvbnNvbGUsIG1lc3NhZ2UpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWNvbnNvbGVcblx0ICAgIH1cblx0ICB9XG5cdH07XG5cblx0ZXhwb3J0cy5sb2dnZXIgPSBsb2dnZXI7XG5cdHZhciBsb2cgPSBsb2dnZXIubG9nO1xuXG5cdGV4cG9ydHMubG9nID0gbG9nO1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZUZyYW1lKG9iamVjdCkge1xuXHQgIHZhciBmcmFtZSA9IFV0aWxzLmV4dGVuZCh7fSwgb2JqZWN0KTtcblx0ICBmcmFtZS5fcGFyZW50ID0gb2JqZWN0O1xuXHQgIHJldHVybiBmcmFtZTtcblx0fVxuXG5cdC8qIFthcmdzLCBdb3B0aW9ucyAqL1xuXG4vKioqLyB9LFxuLyogMiAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdC8vIEJ1aWxkIG91dCBvdXIgYmFzaWMgU2FmZVN0cmluZyB0eXBlXG5cdGZ1bmN0aW9uIFNhZmVTdHJpbmcoc3RyaW5nKSB7XG5cdCAgdGhpcy5zdHJpbmcgPSBzdHJpbmc7XG5cdH1cblxuXHRTYWZlU3RyaW5nLnByb3RvdHlwZS50b1N0cmluZyA9IFNhZmVTdHJpbmcucHJvdG90eXBlLnRvSFRNTCA9IGZ1bmN0aW9uICgpIHtcblx0ICByZXR1cm4gJycgKyB0aGlzLnN0cmluZztcblx0fTtcblxuXHRleHBvcnRzWydkZWZhdWx0J10gPSBTYWZlU3RyaW5nO1xuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblxuLyoqKi8gfSxcbi8qIDMgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5cdHZhciBlcnJvclByb3BzID0gWydkZXNjcmlwdGlvbicsICdmaWxlTmFtZScsICdsaW5lTnVtYmVyJywgJ21lc3NhZ2UnLCAnbmFtZScsICdudW1iZXInLCAnc3RhY2snXTtcblxuXHRmdW5jdGlvbiBFeGNlcHRpb24obWVzc2FnZSwgbm9kZSkge1xuXHQgIHZhciBsb2MgPSBub2RlICYmIG5vZGUubG9jLFxuXHQgICAgICBsaW5lID0gdW5kZWZpbmVkLFxuXHQgICAgICBjb2x1bW4gPSB1bmRlZmluZWQ7XG5cdCAgaWYgKGxvYykge1xuXHQgICAgbGluZSA9IGxvYy5zdGFydC5saW5lO1xuXHQgICAgY29sdW1uID0gbG9jLnN0YXJ0LmNvbHVtbjtcblxuXHQgICAgbWVzc2FnZSArPSAnIC0gJyArIGxpbmUgKyAnOicgKyBjb2x1bW47XG5cdCAgfVxuXG5cdCAgdmFyIHRtcCA9IEVycm9yLnByb3RvdHlwZS5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuXG5cdCAgLy8gVW5mb3J0dW5hdGVseSBlcnJvcnMgYXJlIG5vdCBlbnVtZXJhYmxlIGluIENocm9tZSAoYXQgbGVhc3QpLCBzbyBgZm9yIHByb3AgaW4gdG1wYCBkb2Vzbid0IHdvcmsuXG5cdCAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgZXJyb3JQcm9wcy5sZW5ndGg7IGlkeCsrKSB7XG5cdCAgICB0aGlzW2Vycm9yUHJvcHNbaWR4XV0gPSB0bXBbZXJyb3JQcm9wc1tpZHhdXTtcblx0ICB9XG5cblx0ICBpZiAoRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UpIHtcblx0ICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIEV4Y2VwdGlvbik7XG5cdCAgfVxuXG5cdCAgaWYgKGxvYykge1xuXHQgICAgdGhpcy5saW5lTnVtYmVyID0gbGluZTtcblx0ICAgIHRoaXMuY29sdW1uID0gY29sdW1uO1xuXHQgIH1cblx0fVxuXG5cdEV4Y2VwdGlvbi5wcm90b3R5cGUgPSBuZXcgRXJyb3IoKTtcblxuXHRleHBvcnRzWydkZWZhdWx0J10gPSBFeGNlcHRpb247XG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vKioqLyB9LFxuLyogNCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdGV4cG9ydHMuZXh0ZW5kID0gZXh0ZW5kO1xuXG5cdC8vIE9sZGVyIElFIHZlcnNpb25zIGRvIG5vdCBkaXJlY3RseSBzdXBwb3J0IGluZGV4T2Ygc28gd2UgbXVzdCBpbXBsZW1lbnQgb3VyIG93biwgc2FkbHkuXG5cdGV4cG9ydHMuaW5kZXhPZiA9IGluZGV4T2Y7XG5cdGV4cG9ydHMuZXNjYXBlRXhwcmVzc2lvbiA9IGVzY2FwZUV4cHJlc3Npb247XG5cdGV4cG9ydHMuaXNFbXB0eSA9IGlzRW1wdHk7XG5cdGV4cG9ydHMuYmxvY2tQYXJhbXMgPSBibG9ja1BhcmFtcztcblx0ZXhwb3J0cy5hcHBlbmRDb250ZXh0UGF0aCA9IGFwcGVuZENvbnRleHRQYXRoO1xuXHR2YXIgZXNjYXBlID0ge1xuXHQgICcmJzogJyZhbXA7Jyxcblx0ICAnPCc6ICcmbHQ7Jyxcblx0ICAnPic6ICcmZ3Q7Jyxcblx0ICAnXCInOiAnJnF1b3Q7Jyxcblx0ICAnXFwnJzogJyYjeDI3OycsXG5cdCAgJ2AnOiAnJiN4NjA7J1xuXHR9O1xuXG5cdHZhciBiYWRDaGFycyA9IC9bJjw+XCInYF0vZyxcblx0ICAgIHBvc3NpYmxlID0gL1smPD5cIidgXS87XG5cblx0ZnVuY3Rpb24gZXNjYXBlQ2hhcihjaHIpIHtcblx0ICByZXR1cm4gZXNjYXBlW2Nocl07XG5cdH1cblxuXHRmdW5jdGlvbiBleHRlbmQob2JqIC8qICwgLi4uc291cmNlICovKSB7XG5cdCAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0ICAgIGZvciAodmFyIGtleSBpbiBhcmd1bWVudHNbaV0pIHtcblx0ICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChhcmd1bWVudHNbaV0sIGtleSkpIHtcblx0ICAgICAgICBvYmpba2V5XSA9IGFyZ3VtZW50c1tpXVtrZXldO1xuXHQgICAgICB9XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgcmV0dXJuIG9iajtcblx0fVxuXG5cdHZhciB0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cblx0ZXhwb3J0cy50b1N0cmluZyA9IHRvU3RyaW5nO1xuXHQvLyBTb3VyY2VkIGZyb20gbG9kYXNoXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9iZXN0aWVqcy9sb2Rhc2gvYmxvYi9tYXN0ZXIvTElDRU5TRS50eHRcblx0Lyplc2xpbnQtZGlzYWJsZSBmdW5jLXN0eWxlLCBuby12YXIgKi9cblx0dmFyIGlzRnVuY3Rpb24gPSBmdW5jdGlvbiBpc0Z1bmN0aW9uKHZhbHVlKSB7XG5cdCAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJztcblx0fTtcblx0Ly8gZmFsbGJhY2sgZm9yIG9sZGVyIHZlcnNpb25zIG9mIENocm9tZSBhbmQgU2FmYXJpXG5cdC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5cdGlmIChpc0Z1bmN0aW9uKC94LykpIHtcblx0ICBleHBvcnRzLmlzRnVuY3Rpb24gPSBpc0Z1bmN0aW9uID0gZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nICYmIHRvU3RyaW5nLmNhbGwodmFsdWUpID09PSAnW29iamVjdCBGdW5jdGlvbl0nO1xuXHQgIH07XG5cdH1cblx0dmFyIGlzRnVuY3Rpb247XG5cdGV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb247XG5cdC8qZXNsaW50LWVuYWJsZSBmdW5jLXN0eWxlLCBuby12YXIgKi9cblxuXHQvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXHR2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyB0b1N0cmluZy5jYWxsKHZhbHVlKSA9PT0gJ1tvYmplY3QgQXJyYXldJyA6IGZhbHNlO1xuXHR9O2V4cG9ydHMuaXNBcnJheSA9IGlzQXJyYXk7XG5cblx0ZnVuY3Rpb24gaW5kZXhPZihhcnJheSwgdmFsdWUpIHtcblx0ICBmb3IgKHZhciBpID0gMCwgbGVuID0gYXJyYXkubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcblx0ICAgIGlmIChhcnJheVtpXSA9PT0gdmFsdWUpIHtcblx0ICAgICAgcmV0dXJuIGk7XG5cdCAgICB9XG5cdCAgfVxuXHQgIHJldHVybiAtMTtcblx0fVxuXG5cdGZ1bmN0aW9uIGVzY2FwZUV4cHJlc3Npb24oc3RyaW5nKSB7XG5cdCAgaWYgKHR5cGVvZiBzdHJpbmcgIT09ICdzdHJpbmcnKSB7XG5cdCAgICAvLyBkb24ndCBlc2NhcGUgU2FmZVN0cmluZ3MsIHNpbmNlIHRoZXkncmUgYWxyZWFkeSBzYWZlXG5cdCAgICBpZiAoc3RyaW5nICYmIHN0cmluZy50b0hUTUwpIHtcblx0ICAgICAgcmV0dXJuIHN0cmluZy50b0hUTUwoKTtcblx0ICAgIH0gZWxzZSBpZiAoc3RyaW5nID09IG51bGwpIHtcblx0ICAgICAgcmV0dXJuICcnO1xuXHQgICAgfSBlbHNlIGlmICghc3RyaW5nKSB7XG5cdCAgICAgIHJldHVybiBzdHJpbmcgKyAnJztcblx0ICAgIH1cblxuXHQgICAgLy8gRm9yY2UgYSBzdHJpbmcgY29udmVyc2lvbiBhcyB0aGlzIHdpbGwgYmUgZG9uZSBieSB0aGUgYXBwZW5kIHJlZ2FyZGxlc3MgYW5kXG5cdCAgICAvLyB0aGUgcmVnZXggdGVzdCB3aWxsIGRvIHRoaXMgdHJhbnNwYXJlbnRseSBiZWhpbmQgdGhlIHNjZW5lcywgY2F1c2luZyBpc3N1ZXMgaWZcblx0ICAgIC8vIGFuIG9iamVjdCdzIHRvIHN0cmluZyBoYXMgZXNjYXBlZCBjaGFyYWN0ZXJzIGluIGl0LlxuXHQgICAgc3RyaW5nID0gJycgKyBzdHJpbmc7XG5cdCAgfVxuXG5cdCAgaWYgKCFwb3NzaWJsZS50ZXN0KHN0cmluZykpIHtcblx0ICAgIHJldHVybiBzdHJpbmc7XG5cdCAgfVxuXHQgIHJldHVybiBzdHJpbmcucmVwbGFjZShiYWRDaGFycywgZXNjYXBlQ2hhcik7XG5cdH1cblxuXHRmdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG5cdCAgaWYgKCF2YWx1ZSAmJiB2YWx1ZSAhPT0gMCkge1xuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfSBlbHNlIGlmIChpc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiB0cnVlO1xuXHQgIH0gZWxzZSB7XG5cdCAgICByZXR1cm4gZmFsc2U7XG5cdCAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gYmxvY2tQYXJhbXMocGFyYW1zLCBpZHMpIHtcblx0ICBwYXJhbXMucGF0aCA9IGlkcztcblx0ICByZXR1cm4gcGFyYW1zO1xuXHR9XG5cblx0ZnVuY3Rpb24gYXBwZW5kQ29udGV4dFBhdGgoY29udGV4dFBhdGgsIGlkKSB7XG5cdCAgcmV0dXJuIChjb250ZXh0UGF0aCA/IGNvbnRleHRQYXRoICsgJy4nIDogJycpICsgaWQ7XG5cdH1cblxuLyoqKi8gfSxcbi8qIDUgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDcpWydkZWZhdWx0J107XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0ZXhwb3J0cy5jaGVja1JldmlzaW9uID0gY2hlY2tSZXZpc2lvbjtcblxuXHQvLyBUT0RPOiBSZW1vdmUgdGhpcyBsaW5lIGFuZCBicmVhayB1cCBjb21waWxlUGFydGlhbFxuXG5cdGV4cG9ydHMudGVtcGxhdGUgPSB0ZW1wbGF0ZTtcblx0ZXhwb3J0cy53cmFwUHJvZ3JhbSA9IHdyYXBQcm9ncmFtO1xuXHRleHBvcnRzLnJlc29sdmVQYXJ0aWFsID0gcmVzb2x2ZVBhcnRpYWw7XG5cdGV4cG9ydHMuaW52b2tlUGFydGlhbCA9IGludm9rZVBhcnRpYWw7XG5cdGV4cG9ydHMubm9vcCA9IG5vb3A7XG5cblx0dmFyIF9pbXBvcnQgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDQpO1xuXG5cdHZhciBVdGlscyA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG5cdHZhciBfRXhjZXB0aW9uID0gX193ZWJwYWNrX3JlcXVpcmVfXygzKTtcblxuXHR2YXIgX0V4Y2VwdGlvbjIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfRXhjZXB0aW9uKTtcblxuXHR2YXIgX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDEpO1xuXG5cdGZ1bmN0aW9uIGNoZWNrUmV2aXNpb24oY29tcGlsZXJJbmZvKSB7XG5cdCAgdmFyIGNvbXBpbGVyUmV2aXNpb24gPSBjb21waWxlckluZm8gJiYgY29tcGlsZXJJbmZvWzBdIHx8IDEsXG5cdCAgICAgIGN1cnJlbnRSZXZpc2lvbiA9IF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lLkNPTVBJTEVSX1JFVklTSU9OO1xuXG5cdCAgaWYgKGNvbXBpbGVyUmV2aXNpb24gIT09IGN1cnJlbnRSZXZpc2lvbikge1xuXHQgICAgaWYgKGNvbXBpbGVyUmV2aXNpb24gPCBjdXJyZW50UmV2aXNpb24pIHtcblx0ICAgICAgdmFyIHJ1bnRpbWVWZXJzaW9ucyA9IF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lLlJFVklTSU9OX0NIQU5HRVNbY3VycmVudFJldmlzaW9uXSxcblx0ICAgICAgICAgIGNvbXBpbGVyVmVyc2lvbnMgPSBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZS5SRVZJU0lPTl9DSEFOR0VTW2NvbXBpbGVyUmV2aXNpb25dO1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVGVtcGxhdGUgd2FzIHByZWNvbXBpbGVkIHdpdGggYW4gb2xkZXIgdmVyc2lvbiBvZiBIYW5kbGViYXJzIHRoYW4gdGhlIGN1cnJlbnQgcnVudGltZS4gJyArICdQbGVhc2UgdXBkYXRlIHlvdXIgcHJlY29tcGlsZXIgdG8gYSBuZXdlciB2ZXJzaW9uICgnICsgcnVudGltZVZlcnNpb25zICsgJykgb3IgZG93bmdyYWRlIHlvdXIgcnVudGltZSB0byBhbiBvbGRlciB2ZXJzaW9uICgnICsgY29tcGlsZXJWZXJzaW9ucyArICcpLicpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgLy8gVXNlIHRoZSBlbWJlZGRlZCB2ZXJzaW9uIGluZm8gc2luY2UgdGhlIHJ1bnRpbWUgZG9lc24ndCBrbm93IGFib3V0IHRoaXMgcmV2aXNpb24geWV0XG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhIG5ld2VyIHZlcnNpb24gb2YgSGFuZGxlYmFycyB0aGFuIHRoZSBjdXJyZW50IHJ1bnRpbWUuICcgKyAnUGxlYXNlIHVwZGF0ZSB5b3VyIHJ1bnRpbWUgdG8gYSBuZXdlciB2ZXJzaW9uICgnICsgY29tcGlsZXJJbmZvWzFdICsgJykuJyk7XG5cdCAgICB9XG5cdCAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gdGVtcGxhdGUodGVtcGxhdGVTcGVjLCBlbnYpIHtcblx0ICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXHQgIGlmICghZW52KSB7XG5cdCAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnTm8gZW52aXJvbm1lbnQgcGFzc2VkIHRvIHRlbXBsYXRlJyk7XG5cdCAgfVxuXHQgIGlmICghdGVtcGxhdGVTcGVjIHx8ICF0ZW1wbGF0ZVNwZWMubWFpbikge1xuXHQgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1Vua25vd24gdGVtcGxhdGUgb2JqZWN0OiAnICsgdHlwZW9mIHRlbXBsYXRlU3BlYyk7XG5cdCAgfVxuXG5cdCAgLy8gTm90ZTogVXNpbmcgZW52LlZNIHJlZmVyZW5jZXMgcmF0aGVyIHRoYW4gbG9jYWwgdmFyIHJlZmVyZW5jZXMgdGhyb3VnaG91dCB0aGlzIHNlY3Rpb24gdG8gYWxsb3dcblx0ICAvLyBmb3IgZXh0ZXJuYWwgdXNlcnMgdG8gb3ZlcnJpZGUgdGhlc2UgYXMgcHN1ZWRvLXN1cHBvcnRlZCBBUElzLlxuXHQgIGVudi5WTS5jaGVja1JldmlzaW9uKHRlbXBsYXRlU3BlYy5jb21waWxlcik7XG5cblx0ICBmdW5jdGlvbiBpbnZva2VQYXJ0aWFsV3JhcHBlcihwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG5cdCAgICBpZiAob3B0aW9ucy5oYXNoKSB7XG5cdCAgICAgIGNvbnRleHQgPSBVdGlscy5leHRlbmQoe30sIGNvbnRleHQsIG9wdGlvbnMuaGFzaCk7XG5cdCAgICB9XG5cblx0ICAgIHBhcnRpYWwgPSBlbnYuVk0ucmVzb2x2ZVBhcnRpYWwuY2FsbCh0aGlzLCBwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKTtcblx0ICAgIHZhciByZXN1bHQgPSBlbnYuVk0uaW52b2tlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuXG5cdCAgICBpZiAocmVzdWx0ID09IG51bGwgJiYgZW52LmNvbXBpbGUpIHtcblx0ICAgICAgb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdID0gZW52LmNvbXBpbGUocGFydGlhbCwgdGVtcGxhdGVTcGVjLmNvbXBpbGVyT3B0aW9ucywgZW52KTtcblx0ICAgICAgcmVzdWx0ID0gb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgICAgfVxuXHQgICAgaWYgKHJlc3VsdCAhPSBudWxsKSB7XG5cdCAgICAgIGlmIChvcHRpb25zLmluZGVudCkge1xuXHQgICAgICAgIHZhciBsaW5lcyA9IHJlc3VsdC5zcGxpdCgnXFxuJyk7XG5cdCAgICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBsaW5lcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcblx0ICAgICAgICAgIGlmICghbGluZXNbaV0gJiYgaSArIDEgPT09IGwpIHtcblx0ICAgICAgICAgICAgYnJlYWs7XG5cdCAgICAgICAgICB9XG5cblx0ICAgICAgICAgIGxpbmVzW2ldID0gb3B0aW9ucy5pbmRlbnQgKyBsaW5lc1tpXTtcblx0ICAgICAgICB9XG5cdCAgICAgICAgcmVzdWx0ID0gbGluZXMuam9pbignXFxuJyk7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHJlc3VsdDtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgY29tcGlsZWQgd2hlbiBydW5uaW5nIGluIHJ1bnRpbWUtb25seSBtb2RlJyk7XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgLy8gSnVzdCBhZGQgd2F0ZXJcblx0ICB2YXIgY29udGFpbmVyID0ge1xuXHQgICAgc3RyaWN0OiBmdW5jdGlvbiBzdHJpY3Qob2JqLCBuYW1lKSB7XG5cdCAgICAgIGlmICghKG5hbWUgaW4gb2JqKSkge1xuXHQgICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdcIicgKyBuYW1lICsgJ1wiIG5vdCBkZWZpbmVkIGluICcgKyBvYmopO1xuXHQgICAgICB9XG5cdCAgICAgIHJldHVybiBvYmpbbmFtZV07XG5cdCAgICB9LFxuXHQgICAgbG9va3VwOiBmdW5jdGlvbiBsb29rdXAoZGVwdGhzLCBuYW1lKSB7XG5cdCAgICAgIHZhciBsZW4gPSBkZXB0aHMubGVuZ3RoO1xuXHQgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdCAgICAgICAgaWYgKGRlcHRoc1tpXSAmJiBkZXB0aHNbaV1bbmFtZV0gIT0gbnVsbCkge1xuXHQgICAgICAgICAgcmV0dXJuIGRlcHRoc1tpXVtuYW1lXTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH0sXG5cdCAgICBsYW1iZGE6IGZ1bmN0aW9uIGxhbWJkYShjdXJyZW50LCBjb250ZXh0KSB7XG5cdCAgICAgIHJldHVybiB0eXBlb2YgY3VycmVudCA9PT0gJ2Z1bmN0aW9uJyA/IGN1cnJlbnQuY2FsbChjb250ZXh0KSA6IGN1cnJlbnQ7XG5cdCAgICB9LFxuXG5cdCAgICBlc2NhcGVFeHByZXNzaW9uOiBVdGlscy5lc2NhcGVFeHByZXNzaW9uLFxuXHQgICAgaW52b2tlUGFydGlhbDogaW52b2tlUGFydGlhbFdyYXBwZXIsXG5cblx0ICAgIGZuOiBmdW5jdGlvbiBmbihpKSB7XG5cdCAgICAgIHJldHVybiB0ZW1wbGF0ZVNwZWNbaV07XG5cdCAgICB9LFxuXG5cdCAgICBwcm9ncmFtczogW10sXG5cdCAgICBwcm9ncmFtOiBmdW5jdGlvbiBwcm9ncmFtKGksIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcblx0ICAgICAgdmFyIHByb2dyYW1XcmFwcGVyID0gdGhpcy5wcm9ncmFtc1tpXSxcblx0ICAgICAgICAgIGZuID0gdGhpcy5mbihpKTtcblx0ICAgICAgaWYgKGRhdGEgfHwgZGVwdGhzIHx8IGJsb2NrUGFyYW1zIHx8IGRlY2xhcmVkQmxvY2tQYXJhbXMpIHtcblx0ICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHdyYXBQcm9ncmFtKHRoaXMsIGksIGZuLCBkYXRhLCBkZWNsYXJlZEJsb2NrUGFyYW1zLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcblx0ICAgICAgfSBlbHNlIGlmICghcHJvZ3JhbVdyYXBwZXIpIHtcblx0ICAgICAgICBwcm9ncmFtV3JhcHBlciA9IHRoaXMucHJvZ3JhbXNbaV0gPSB3cmFwUHJvZ3JhbSh0aGlzLCBpLCBmbik7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHByb2dyYW1XcmFwcGVyO1xuXHQgICAgfSxcblxuXHQgICAgZGF0YTogZnVuY3Rpb24gZGF0YSh2YWx1ZSwgZGVwdGgpIHtcblx0ICAgICAgd2hpbGUgKHZhbHVlICYmIGRlcHRoLS0pIHtcblx0ICAgICAgICB2YWx1ZSA9IHZhbHVlLl9wYXJlbnQ7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIHZhbHVlO1xuXHQgICAgfSxcblx0ICAgIG1lcmdlOiBmdW5jdGlvbiBtZXJnZShwYXJhbSwgY29tbW9uKSB7XG5cdCAgICAgIHZhciBvYmogPSBwYXJhbSB8fCBjb21tb247XG5cblx0ICAgICAgaWYgKHBhcmFtICYmIGNvbW1vbiAmJiBwYXJhbSAhPT0gY29tbW9uKSB7XG5cdCAgICAgICAgb2JqID0gVXRpbHMuZXh0ZW5kKHt9LCBjb21tb24sIHBhcmFtKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBvYmo7XG5cdCAgICB9LFxuXG5cdCAgICBub29wOiBlbnYuVk0ubm9vcCxcblx0ICAgIGNvbXBpbGVySW5mbzogdGVtcGxhdGVTcGVjLmNvbXBpbGVyXG5cdCAgfTtcblxuXHQgIGZ1bmN0aW9uIHJldChjb250ZXh0KSB7XG5cdCAgICB2YXIgb3B0aW9ucyA9IGFyZ3VtZW50c1sxXSA9PT0gdW5kZWZpbmVkID8ge30gOiBhcmd1bWVudHNbMV07XG5cblx0ICAgIHZhciBkYXRhID0gb3B0aW9ucy5kYXRhO1xuXG5cdCAgICByZXQuX3NldHVwKG9wdGlvbnMpO1xuXHQgICAgaWYgKCFvcHRpb25zLnBhcnRpYWwgJiYgdGVtcGxhdGVTcGVjLnVzZURhdGEpIHtcblx0ICAgICAgZGF0YSA9IGluaXREYXRhKGNvbnRleHQsIGRhdGEpO1xuXHQgICAgfVxuXHQgICAgdmFyIGRlcHRocyA9IHVuZGVmaW5lZCxcblx0ICAgICAgICBibG9ja1BhcmFtcyA9IHRlbXBsYXRlU3BlYy51c2VCbG9ja1BhcmFtcyA/IFtdIDogdW5kZWZpbmVkO1xuXHQgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VEZXB0aHMpIHtcblx0ICAgICAgZGVwdGhzID0gb3B0aW9ucy5kZXB0aHMgPyBbY29udGV4dF0uY29uY2F0KG9wdGlvbnMuZGVwdGhzKSA6IFtjb250ZXh0XTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHRlbXBsYXRlU3BlYy5tYWluLmNhbGwoY29udGFpbmVyLCBjb250ZXh0LCBjb250YWluZXIuaGVscGVycywgY29udGFpbmVyLnBhcnRpYWxzLCBkYXRhLCBibG9ja1BhcmFtcywgZGVwdGhzKTtcblx0ICB9XG5cdCAgcmV0LmlzVG9wID0gdHJ1ZTtcblxuXHQgIHJldC5fc2V0dXAgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuXHQgICAgaWYgKCFvcHRpb25zLnBhcnRpYWwpIHtcblx0ICAgICAgY29udGFpbmVyLmhlbHBlcnMgPSBjb250YWluZXIubWVyZ2Uob3B0aW9ucy5oZWxwZXJzLCBlbnYuaGVscGVycyk7XG5cblx0ICAgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VQYXJ0aWFsKSB7XG5cdCAgICAgICAgY29udGFpbmVyLnBhcnRpYWxzID0gY29udGFpbmVyLm1lcmdlKG9wdGlvbnMucGFydGlhbHMsIGVudi5wYXJ0aWFscyk7XG5cdCAgICAgIH1cblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIGNvbnRhaW5lci5oZWxwZXJzID0gb3B0aW9ucy5oZWxwZXJzO1xuXHQgICAgICBjb250YWluZXIucGFydGlhbHMgPSBvcHRpb25zLnBhcnRpYWxzO1xuXHQgICAgfVxuXHQgIH07XG5cblx0ICByZXQuX2NoaWxkID0gZnVuY3Rpb24gKGksIGRhdGEsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcblx0ICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlQmxvY2tQYXJhbXMgJiYgIWJsb2NrUGFyYW1zKSB7XG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdtdXN0IHBhc3MgYmxvY2sgcGFyYW1zJyk7XG5cdCAgICB9XG5cdCAgICBpZiAodGVtcGxhdGVTcGVjLnVzZURlcHRocyAmJiAhZGVwdGhzKSB7XG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdtdXN0IHBhc3MgcGFyZW50IGRlcHRocycpO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gd3JhcFByb2dyYW0oY29udGFpbmVyLCBpLCB0ZW1wbGF0ZVNwZWNbaV0sIGRhdGEsIDAsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuXHQgIH07XG5cdCAgcmV0dXJuIHJldDtcblx0fVxuXG5cdGZ1bmN0aW9uIHdyYXBQcm9ncmFtKGNvbnRhaW5lciwgaSwgZm4sIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpIHtcblx0ICBmdW5jdGlvbiBwcm9nKGNvbnRleHQpIHtcblx0ICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1sxXTtcblxuXHQgICAgcmV0dXJuIGZuLmNhbGwoY29udGFpbmVyLCBjb250ZXh0LCBjb250YWluZXIuaGVscGVycywgY29udGFpbmVyLnBhcnRpYWxzLCBvcHRpb25zLmRhdGEgfHwgZGF0YSwgYmxvY2tQYXJhbXMgJiYgW29wdGlvbnMuYmxvY2tQYXJhbXNdLmNvbmNhdChibG9ja1BhcmFtcyksIGRlcHRocyAmJiBbY29udGV4dF0uY29uY2F0KGRlcHRocykpO1xuXHQgIH1cblx0ICBwcm9nLnByb2dyYW0gPSBpO1xuXHQgIHByb2cuZGVwdGggPSBkZXB0aHMgPyBkZXB0aHMubGVuZ3RoIDogMDtcblx0ICBwcm9nLmJsb2NrUGFyYW1zID0gZGVjbGFyZWRCbG9ja1BhcmFtcyB8fCAwO1xuXHQgIHJldHVybiBwcm9nO1xuXHR9XG5cblx0ZnVuY3Rpb24gcmVzb2x2ZVBhcnRpYWwocGFydGlhbCwgY29udGV4dCwgb3B0aW9ucykge1xuXHQgIGlmICghcGFydGlhbCkge1xuXHQgICAgcGFydGlhbCA9IG9wdGlvbnMucGFydGlhbHNbb3B0aW9ucy5uYW1lXTtcblx0ICB9IGVsc2UgaWYgKCFwYXJ0aWFsLmNhbGwgJiYgIW9wdGlvbnMubmFtZSkge1xuXHQgICAgLy8gVGhpcyBpcyBhIGR5bmFtaWMgcGFydGlhbCB0aGF0IHJldHVybmVkIGEgc3RyaW5nXG5cdCAgICBvcHRpb25zLm5hbWUgPSBwYXJ0aWFsO1xuXHQgICAgcGFydGlhbCA9IG9wdGlvbnMucGFydGlhbHNbcGFydGlhbF07XG5cdCAgfVxuXHQgIHJldHVybiBwYXJ0aWFsO1xuXHR9XG5cblx0ZnVuY3Rpb24gaW52b2tlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG5cdCAgb3B0aW9ucy5wYXJ0aWFsID0gdHJ1ZTtcblxuXHQgIGlmIChwYXJ0aWFsID09PSB1bmRlZmluZWQpIHtcblx0ICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUaGUgcGFydGlhbCAnICsgb3B0aW9ucy5uYW1lICsgJyBjb3VsZCBub3QgYmUgZm91bmQnKTtcblx0ICB9IGVsc2UgaWYgKHBhcnRpYWwgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuXHQgICAgcmV0dXJuIHBhcnRpYWwoY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgfVxuXHR9XG5cblx0ZnVuY3Rpb24gbm9vcCgpIHtcblx0ICByZXR1cm4gJyc7XG5cdH1cblxuXHRmdW5jdGlvbiBpbml0RGF0YShjb250ZXh0LCBkYXRhKSB7XG5cdCAgaWYgKCFkYXRhIHx8ICEoJ3Jvb3QnIGluIGRhdGEpKSB7XG5cdCAgICBkYXRhID0gZGF0YSA/IF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lLmNyZWF0ZUZyYW1lKGRhdGEpIDoge307XG5cdCAgICBkYXRhLnJvb3QgPSBjb250ZXh0O1xuXHQgIH1cblx0ICByZXR1cm4gZGF0YTtcblx0fVxuXG4vKioqLyB9LFxuLyogNiAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovKGZ1bmN0aW9uKGdsb2JhbCkgeyd1c2Ugc3RyaWN0JztcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHQvKmdsb2JhbCB3aW5kb3cgKi9cblxuXHRleHBvcnRzWydkZWZhdWx0J10gPSBmdW5jdGlvbiAoSGFuZGxlYmFycykge1xuXHQgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5cdCAgdmFyIHJvb3QgPSB0eXBlb2YgZ2xvYmFsICE9PSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHdpbmRvdyxcblx0ICAgICAgJEhhbmRsZWJhcnMgPSByb290LkhhbmRsZWJhcnM7XG5cdCAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblx0ICBIYW5kbGViYXJzLm5vQ29uZmxpY3QgPSBmdW5jdGlvbiAoKSB7XG5cdCAgICBpZiAocm9vdC5IYW5kbGViYXJzID09PSBIYW5kbGViYXJzKSB7XG5cdCAgICAgIHJvb3QuSGFuZGxlYmFycyA9ICRIYW5kbGViYXJzO1xuXHQgICAgfVxuXHQgIH07XG5cdH07XG5cblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cdC8qIFdFQlBBQ0sgVkFSIElOSkVDVElPTiAqL30uY2FsbChleHBvcnRzLCAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KCkpKSlcblxuLyoqKi8gfSxcbi8qIDcgKi9cbi8qKiovIGZ1bmN0aW9uKG1vZHVsZSwgZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXykge1xuXG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdGV4cG9ydHNbXCJkZWZhdWx0XCJdID0gZnVuY3Rpb24gKG9iaikge1xuXHQgIHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7XG5cdCAgICBcImRlZmF1bHRcIjogb2JqXG5cdCAgfTtcblx0fTtcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG4vKioqLyB9XG4vKioqKioqLyBdKVxufSk7XG47IiwibW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChhcnIpID09ICdbb2JqZWN0IEFycmF5XSc7XG59O1xuIiwiICAvKiBnbG9iYWxzIHJlcXVpcmUsIG1vZHVsZSAqL1xuXG4gICd1c2Ugc3RyaWN0JztcblxuICAvKipcbiAgICogTW9kdWxlIGRlcGVuZGVuY2llcy5cbiAgICovXG5cbiAgdmFyIHBhdGh0b1JlZ2V4cCA9IHJlcXVpcmUoJ3BhdGgtdG8tcmVnZXhwJyk7XG5cbiAgLyoqXG4gICAqIE1vZHVsZSBleHBvcnRzLlxuICAgKi9cblxuICBtb2R1bGUuZXhwb3J0cyA9IHBhZ2U7XG5cbiAgLyoqXG4gICAqIERldGVjdCBjbGljayBldmVudFxuICAgKi9cbiAgdmFyIGNsaWNrRXZlbnQgPSAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBkb2N1bWVudCkgJiYgZG9jdW1lbnQub250b3VjaHN0YXJ0ID8gJ3RvdWNoc3RhcnQnIDogJ2NsaWNrJztcblxuICAvKipcbiAgICogVG8gd29yayBwcm9wZXJseSB3aXRoIHRoZSBVUkxcbiAgICogaGlzdG9yeS5sb2NhdGlvbiBnZW5lcmF0ZWQgcG9seWZpbGwgaW4gaHR0cHM6Ly9naXRodWIuY29tL2Rldm90ZS9IVE1MNS1IaXN0b3J5LUFQSVxuICAgKi9cblxuICB2YXIgbG9jYXRpb24gPSAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiB3aW5kb3cpICYmICh3aW5kb3cuaGlzdG9yeS5sb2NhdGlvbiB8fCB3aW5kb3cubG9jYXRpb24pO1xuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGluaXRpYWwgZGlzcGF0Y2guXG4gICAqL1xuXG4gIHZhciBkaXNwYXRjaCA9IHRydWU7XG5cblxuICAvKipcbiAgICogRGVjb2RlIFVSTCBjb21wb25lbnRzIChxdWVyeSBzdHJpbmcsIHBhdGhuYW1lLCBoYXNoKS5cbiAgICogQWNjb21tb2RhdGVzIGJvdGggcmVndWxhciBwZXJjZW50IGVuY29kaW5nIGFuZCB4LXd3dy1mb3JtLXVybGVuY29kZWQgZm9ybWF0LlxuICAgKi9cbiAgdmFyIGRlY29kZVVSTENvbXBvbmVudHMgPSB0cnVlO1xuXG4gIC8qKlxuICAgKiBCYXNlIHBhdGguXG4gICAqL1xuXG4gIHZhciBiYXNlID0gJyc7XG5cbiAgLyoqXG4gICAqIFJ1bm5pbmcgZmxhZy5cbiAgICovXG5cbiAgdmFyIHJ1bm5pbmc7XG5cbiAgLyoqXG4gICAqIEhhc2hCYW5nIG9wdGlvblxuICAgKi9cblxuICB2YXIgaGFzaGJhbmcgPSBmYWxzZTtcblxuICAvKipcbiAgICogUHJldmlvdXMgY29udGV4dCwgZm9yIGNhcHR1cmluZ1xuICAgKiBwYWdlIGV4aXQgZXZlbnRzLlxuICAgKi9cblxuICB2YXIgcHJldkNvbnRleHQ7XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGBwYXRoYCB3aXRoIGNhbGxiYWNrIGBmbigpYCxcbiAgICogb3Igcm91dGUgYHBhdGhgLCBvciByZWRpcmVjdGlvbixcbiAgICogb3IgYHBhZ2Uuc3RhcnQoKWAuXG4gICAqXG4gICAqICAgcGFnZShmbik7XG4gICAqICAgcGFnZSgnKicsIGZuKTtcbiAgICogICBwYWdlKCcvdXNlci86aWQnLCBsb2FkLCB1c2VyKTtcbiAgICogICBwYWdlKCcvdXNlci8nICsgdXNlci5pZCwgeyBzb21lOiAndGhpbmcnIH0pO1xuICAgKiAgIHBhZ2UoJy91c2VyLycgKyB1c2VyLmlkKTtcbiAgICogICBwYWdlKCcvZnJvbScsICcvdG8nKVxuICAgKiAgIHBhZ2UoKTtcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd8RnVuY3Rpb259IHBhdGhcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm4uLi5cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gcGFnZShwYXRoLCBmbikge1xuICAgIC8vIDxjYWxsYmFjaz5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIHBhdGgpIHtcbiAgICAgIHJldHVybiBwYWdlKCcqJywgcGF0aCk7XG4gICAgfVxuXG4gICAgLy8gcm91dGUgPHBhdGg+IHRvIDxjYWxsYmFjayAuLi4+XG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmbikge1xuICAgICAgdmFyIHJvdXRlID0gbmV3IFJvdXRlKHBhdGgpO1xuICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgcGFnZS5jYWxsYmFja3MucHVzaChyb3V0ZS5taWRkbGV3YXJlKGFyZ3VtZW50c1tpXSkpO1xuICAgICAgfVxuICAgICAgLy8gc2hvdyA8cGF0aD4gd2l0aCBbc3RhdGVdXG4gICAgfSBlbHNlIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIHBhdGgpIHtcbiAgICAgIHBhZ2VbJ3N0cmluZycgPT09IHR5cGVvZiBmbiA/ICdyZWRpcmVjdCcgOiAnc2hvdyddKHBhdGgsIGZuKTtcbiAgICAgIC8vIHN0YXJ0IFtvcHRpb25zXVxuICAgIH0gZWxzZSB7XG4gICAgICBwYWdlLnN0YXJ0KHBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxsYmFjayBmdW5jdGlvbnMuXG4gICAqL1xuXG4gIHBhZ2UuY2FsbGJhY2tzID0gW107XG4gIHBhZ2UuZXhpdHMgPSBbXTtcblxuICAvKipcbiAgICogQ3VycmVudCBwYXRoIGJlaW5nIHByb2Nlc3NlZFxuICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgKi9cbiAgcGFnZS5jdXJyZW50ID0gJyc7XG5cbiAgLyoqXG4gICAqIE51bWJlciBvZiBwYWdlcyBuYXZpZ2F0ZWQgdG8uXG4gICAqIEB0eXBlIHtudW1iZXJ9XG4gICAqXG4gICAqICAgICBwYWdlLmxlbiA9PSAwO1xuICAgKiAgICAgcGFnZSgnL2xvZ2luJyk7XG4gICAqICAgICBwYWdlLmxlbiA9PSAxO1xuICAgKi9cblxuICBwYWdlLmxlbiA9IDA7XG5cbiAgLyoqXG4gICAqIEdldCBvciBzZXQgYmFzZXBhdGggdG8gYHBhdGhgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLmJhc2UgPSBmdW5jdGlvbihwYXRoKSB7XG4gICAgaWYgKDAgPT09IGFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiBiYXNlO1xuICAgIGJhc2UgPSBwYXRoO1xuICB9O1xuXG4gIC8qKlxuICAgKiBCaW5kIHdpdGggdGhlIGdpdmVuIGBvcHRpb25zYC5cbiAgICpcbiAgICogT3B0aW9uczpcbiAgICpcbiAgICogICAgLSBgY2xpY2tgIGJpbmQgdG8gY2xpY2sgZXZlbnRzIFt0cnVlXVxuICAgKiAgICAtIGBwb3BzdGF0ZWAgYmluZCB0byBwb3BzdGF0ZSBbdHJ1ZV1cbiAgICogICAgLSBgZGlzcGF0Y2hgIHBlcmZvcm0gaW5pdGlhbCBkaXNwYXRjaCBbdHJ1ZV1cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zdGFydCA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICBpZiAocnVubmluZykgcmV0dXJuO1xuICAgIHJ1bm5pbmcgPSB0cnVlO1xuICAgIGlmIChmYWxzZSA9PT0gb3B0aW9ucy5kaXNwYXRjaCkgZGlzcGF0Y2ggPSBmYWxzZTtcbiAgICBpZiAoZmFsc2UgPT09IG9wdGlvbnMuZGVjb2RlVVJMQ29tcG9uZW50cykgZGVjb2RlVVJMQ29tcG9uZW50cyA9IGZhbHNlO1xuICAgIGlmIChmYWxzZSAhPT0gb3B0aW9ucy5wb3BzdGF0ZSkgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgb25wb3BzdGF0ZSwgZmFsc2UpO1xuICAgIGlmIChmYWxzZSAhPT0gb3B0aW9ucy5jbGljaykge1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihjbGlja0V2ZW50LCBvbmNsaWNrLCBmYWxzZSk7XG4gICAgfVxuICAgIGlmICh0cnVlID09PSBvcHRpb25zLmhhc2hiYW5nKSBoYXNoYmFuZyA9IHRydWU7XG4gICAgaWYgKCFkaXNwYXRjaCkgcmV0dXJuO1xuICAgIHZhciB1cmwgPSAoaGFzaGJhbmcgJiYgfmxvY2F0aW9uLmhhc2guaW5kZXhPZignIyEnKSkgPyBsb2NhdGlvbi5oYXNoLnN1YnN0cigyKSArIGxvY2F0aW9uLnNlYXJjaCA6IGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uc2VhcmNoICsgbG9jYXRpb24uaGFzaDtcbiAgICBwYWdlLnJlcGxhY2UodXJsLCBudWxsLCB0cnVlLCBkaXNwYXRjaCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFVuYmluZCBjbGljayBhbmQgcG9wc3RhdGUgZXZlbnQgaGFuZGxlcnMuXG4gICAqXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc3RvcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICghcnVubmluZykgcmV0dXJuO1xuICAgIHBhZ2UuY3VycmVudCA9ICcnO1xuICAgIHBhZ2UubGVuID0gMDtcbiAgICBydW5uaW5nID0gZmFsc2U7XG4gICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihjbGlja0V2ZW50LCBvbmNsaWNrLCBmYWxzZSk7XG4gICAgd2luZG93LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvcHN0YXRlJywgb25wb3BzdGF0ZSwgZmFsc2UpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTaG93IGBwYXRoYCB3aXRoIG9wdGlvbmFsIGBzdGF0ZWAgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQHBhcmFtIHtCb29sZWFufSBkaXNwYXRjaFxuICAgKiBAcmV0dXJuIHtDb250ZXh0fVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnNob3cgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSwgZGlzcGF0Y2gsIHB1c2gpIHtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUpO1xuICAgIHBhZ2UuY3VycmVudCA9IGN0eC5wYXRoO1xuICAgIGlmIChmYWxzZSAhPT0gZGlzcGF0Y2gpIHBhZ2UuZGlzcGF0Y2goY3R4KTtcbiAgICBpZiAoZmFsc2UgIT09IGN0eC5oYW5kbGVkICYmIGZhbHNlICE9PSBwdXNoKSBjdHgucHVzaFN0YXRlKCk7XG4gICAgcmV0dXJuIGN0eDtcbiAgfTtcblxuICAvKipcbiAgICogR29lcyBiYWNrIGluIHRoZSBoaXN0b3J5XG4gICAqIEJhY2sgc2hvdWxkIGFsd2F5cyBsZXQgdGhlIGN1cnJlbnQgcm91dGUgcHVzaCBzdGF0ZSBhbmQgdGhlbiBnbyBiYWNrLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCAtIGZhbGxiYWNrIHBhdGggdG8gZ28gYmFjayBpZiBubyBtb3JlIGhpc3RvcnkgZXhpc3RzLCBpZiB1bmRlZmluZWQgZGVmYXVsdHMgdG8gcGFnZS5iYXNlXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBbc3RhdGVdXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2UuYmFjayA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlKSB7XG4gICAgaWYgKHBhZ2UubGVuID4gMCkge1xuICAgICAgLy8gdGhpcyBtYXkgbmVlZCBtb3JlIHRlc3RpbmcgdG8gc2VlIGlmIGFsbCBicm93c2Vyc1xuICAgICAgLy8gd2FpdCBmb3IgdGhlIG5leHQgdGljayB0byBnbyBiYWNrIGluIGhpc3RvcnlcbiAgICAgIGhpc3RvcnkuYmFjaygpO1xuICAgICAgcGFnZS5sZW4tLTtcbiAgICB9IGVsc2UgaWYgKHBhdGgpIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhwYXRoLCBzdGF0ZSk7XG4gICAgICB9KTtcbiAgICB9ZWxzZXtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhZ2Uuc2hvdyhiYXNlLCBzdGF0ZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogUmVnaXN0ZXIgcm91dGUgdG8gcmVkaXJlY3QgZnJvbSBvbmUgcGF0aCB0byBvdGhlclxuICAgKiBvciBqdXN0IHJlZGlyZWN0IHRvIGFub3RoZXIgcm91dGVcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IGZyb20gLSBpZiBwYXJhbSAndG8nIGlzIHVuZGVmaW5lZCByZWRpcmVjdHMgdG8gJ2Zyb20nXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBbdG9dXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBwYWdlLnJlZGlyZWN0ID0gZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgICAvLyBEZWZpbmUgcm91dGUgZnJvbSBhIHBhdGggdG8gYW5vdGhlclxuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGZyb20gJiYgJ3N0cmluZycgPT09IHR5cGVvZiB0bykge1xuICAgICAgcGFnZShmcm9tLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcGFnZS5yZXBsYWNlKHRvKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBXYWl0IGZvciB0aGUgcHVzaCBzdGF0ZSBhbmQgcmVwbGFjZSBpdCB3aXRoIGFub3RoZXJcbiAgICBpZiAoJ3N0cmluZycgPT09IHR5cGVvZiBmcm9tICYmICd1bmRlZmluZWQnID09PSB0eXBlb2YgdG8pIHtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHBhZ2UucmVwbGFjZShmcm9tKTtcbiAgICAgIH0sIDApO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogUmVwbGFjZSBgcGF0aGAgd2l0aCBvcHRpb25hbCBgc3RhdGVgIG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEByZXR1cm4ge0NvbnRleHR9XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG5cbiAgcGFnZS5yZXBsYWNlID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUsIGluaXQsIGRpc3BhdGNoKSB7XG4gICAgdmFyIGN0eCA9IG5ldyBDb250ZXh0KHBhdGgsIHN0YXRlKTtcbiAgICBwYWdlLmN1cnJlbnQgPSBjdHgucGF0aDtcbiAgICBjdHguaW5pdCA9IGluaXQ7XG4gICAgY3R4LnNhdmUoKTsgLy8gc2F2ZSBiZWZvcmUgZGlzcGF0Y2hpbmcsIHdoaWNoIG1heSByZWRpcmVjdFxuICAgIGlmIChmYWxzZSAhPT0gZGlzcGF0Y2gpIHBhZ2UuZGlzcGF0Y2goY3R4KTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBEaXNwYXRjaCB0aGUgZ2l2ZW4gYGN0eGAuXG4gICAqXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjdHhcbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIHBhZ2UuZGlzcGF0Y2ggPSBmdW5jdGlvbihjdHgpIHtcbiAgICB2YXIgcHJldiA9IHByZXZDb250ZXh0LFxuICAgICAgaSA9IDAsXG4gICAgICBqID0gMDtcblxuICAgIHByZXZDb250ZXh0ID0gY3R4O1xuXG4gICAgZnVuY3Rpb24gbmV4dEV4aXQoKSB7XG4gICAgICB2YXIgZm4gPSBwYWdlLmV4aXRzW2orK107XG4gICAgICBpZiAoIWZuKSByZXR1cm4gbmV4dEVudGVyKCk7XG4gICAgICBmbihwcmV2LCBuZXh0RXhpdCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbmV4dEVudGVyKCkge1xuICAgICAgdmFyIGZuID0gcGFnZS5jYWxsYmFja3NbaSsrXTtcblxuICAgICAgaWYgKGN0eC5wYXRoICE9PSBwYWdlLmN1cnJlbnQpIHtcbiAgICAgICAgY3R4LmhhbmRsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFmbikgcmV0dXJuIHVuaGFuZGxlZChjdHgpO1xuICAgICAgZm4oY3R4LCBuZXh0RW50ZXIpO1xuICAgIH1cblxuICAgIGlmIChwcmV2KSB7XG4gICAgICBuZXh0RXhpdCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXh0RW50ZXIoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFVuaGFuZGxlZCBgY3R4YC4gV2hlbiBpdCdzIG5vdCB0aGUgaW5pdGlhbFxuICAgKiBwb3BzdGF0ZSB0aGVuIHJlZGlyZWN0LiBJZiB5b3Ugd2lzaCB0byBoYW5kbGVcbiAgICogNDA0cyBvbiB5b3VyIG93biB1c2UgYHBhZ2UoJyonLCBjYWxsYmFjaylgLlxuICAgKlxuICAgKiBAcGFyYW0ge0NvbnRleHR9IGN0eFxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgZnVuY3Rpb24gdW5oYW5kbGVkKGN0eCkge1xuICAgIGlmIChjdHguaGFuZGxlZCkgcmV0dXJuO1xuICAgIHZhciBjdXJyZW50O1xuXG4gICAgaWYgKGhhc2hiYW5nKSB7XG4gICAgICBjdXJyZW50ID0gYmFzZSArIGxvY2F0aW9uLmhhc2gucmVwbGFjZSgnIyEnLCAnJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGN1cnJlbnQgPSBsb2NhdGlvbi5wYXRobmFtZSArIGxvY2F0aW9uLnNlYXJjaDtcbiAgICB9XG5cbiAgICBpZiAoY3VycmVudCA9PT0gY3R4LmNhbm9uaWNhbFBhdGgpIHJldHVybjtcbiAgICBwYWdlLnN0b3AoKTtcbiAgICBjdHguaGFuZGxlZCA9IGZhbHNlO1xuICAgIGxvY2F0aW9uLmhyZWYgPSBjdHguY2Fub25pY2FsUGF0aDtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhbiBleGl0IHJvdXRlIG9uIGBwYXRoYCB3aXRoXG4gICAqIGNhbGxiYWNrIGBmbigpYCwgd2hpY2ggd2lsbCBiZSBjYWxsZWRcbiAgICogb24gdGhlIHByZXZpb3VzIGNvbnRleHQgd2hlbiBhIG5ld1xuICAgKiBwYWdlIGlzIHZpc2l0ZWQuXG4gICAqL1xuICBwYWdlLmV4aXQgPSBmdW5jdGlvbihwYXRoLCBmbikge1xuICAgIGlmICh0eXBlb2YgcGF0aCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIHBhZ2UuZXhpdCgnKicsIHBhdGgpO1xuICAgIH1cblxuICAgIHZhciByb3V0ZSA9IG5ldyBSb3V0ZShwYXRoKTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgcGFnZS5leGl0cy5wdXNoKHJvdXRlLm1pZGRsZXdhcmUoYXJndW1lbnRzW2ldKSk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmUgVVJMIGVuY29kaW5nIGZyb20gdGhlIGdpdmVuIGBzdHJgLlxuICAgKiBBY2NvbW1vZGF0ZXMgd2hpdGVzcGFjZSBpbiBib3RoIHgtd3d3LWZvcm0tdXJsZW5jb2RlZFxuICAgKiBhbmQgcmVndWxhciBwZXJjZW50LWVuY29kZWQgZm9ybS5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJ9IFVSTCBjb21wb25lbnQgdG8gZGVjb2RlXG4gICAqL1xuICBmdW5jdGlvbiBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHZhbCkge1xuICAgIGlmICh0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykgeyByZXR1cm4gdmFsOyB9XG4gICAgcmV0dXJuIGRlY29kZVVSTENvbXBvbmVudHMgPyBkZWNvZGVVUklDb21wb25lbnQodmFsLnJlcGxhY2UoL1xcKy9nLCAnICcpKSA6IHZhbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGEgbmV3IFwicmVxdWVzdFwiIGBDb250ZXh0YFxuICAgKiB3aXRoIHRoZSBnaXZlbiBgcGF0aGAgYW5kIG9wdGlvbmFsIGluaXRpYWwgYHN0YXRlYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHN0YXRlXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIGZ1bmN0aW9uIENvbnRleHQocGF0aCwgc3RhdGUpIHtcbiAgICBpZiAoJy8nID09PSBwYXRoWzBdICYmIDAgIT09IHBhdGguaW5kZXhPZihiYXNlKSkgcGF0aCA9IGJhc2UgKyAoaGFzaGJhbmcgPyAnIyEnIDogJycpICsgcGF0aDtcbiAgICB2YXIgaSA9IHBhdGguaW5kZXhPZignPycpO1xuXG4gICAgdGhpcy5jYW5vbmljYWxQYXRoID0gcGF0aDtcbiAgICB0aGlzLnBhdGggPSBwYXRoLnJlcGxhY2UoYmFzZSwgJycpIHx8ICcvJztcbiAgICBpZiAoaGFzaGJhbmcpIHRoaXMucGF0aCA9IHRoaXMucGF0aC5yZXBsYWNlKCcjIScsICcnKSB8fCAnLyc7XG5cbiAgICB0aGlzLnRpdGxlID0gZG9jdW1lbnQudGl0bGU7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlIHx8IHt9O1xuICAgIHRoaXMuc3RhdGUucGF0aCA9IHBhdGg7XG4gICAgdGhpcy5xdWVyeXN0cmluZyA9IH5pID8gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudChwYXRoLnNsaWNlKGkgKyAxKSkgOiAnJztcbiAgICB0aGlzLnBhdGhuYW1lID0gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudCh+aSA/IHBhdGguc2xpY2UoMCwgaSkgOiBwYXRoKTtcbiAgICB0aGlzLnBhcmFtcyA9IHt9O1xuXG4gICAgLy8gZnJhZ21lbnRcbiAgICB0aGlzLmhhc2ggPSAnJztcbiAgICBpZiAoIWhhc2hiYW5nKSB7XG4gICAgICBpZiAoIX50aGlzLnBhdGguaW5kZXhPZignIycpKSByZXR1cm47XG4gICAgICB2YXIgcGFydHMgPSB0aGlzLnBhdGguc3BsaXQoJyMnKTtcbiAgICAgIHRoaXMucGF0aCA9IHBhcnRzWzBdO1xuICAgICAgdGhpcy5oYXNoID0gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudChwYXJ0c1sxXSkgfHwgJyc7XG4gICAgICB0aGlzLnF1ZXJ5c3RyaW5nID0gdGhpcy5xdWVyeXN0cmluZy5zcGxpdCgnIycpWzBdO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvc2UgYENvbnRleHRgLlxuICAgKi9cblxuICBwYWdlLkNvbnRleHQgPSBDb250ZXh0O1xuXG4gIC8qKlxuICAgKiBQdXNoIHN0YXRlLlxuICAgKlxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgQ29udGV4dC5wcm90b3R5cGUucHVzaFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gICAgcGFnZS5sZW4rKztcbiAgICBoaXN0b3J5LnB1c2hTdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnRpdGxlLCBoYXNoYmFuZyAmJiB0aGlzLnBhdGggIT09ICcvJyA/ICcjIScgKyB0aGlzLnBhdGggOiB0aGlzLmNhbm9uaWNhbFBhdGgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTYXZlIHRoZSBjb250ZXh0IHN0YXRlLlxuICAgKlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBDb250ZXh0LnByb3RvdHlwZS5zYXZlID0gZnVuY3Rpb24oKSB7XG4gICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUodGhpcy5zdGF0ZSwgdGhpcy50aXRsZSwgaGFzaGJhbmcgJiYgdGhpcy5wYXRoICE9PSAnLycgPyAnIyEnICsgdGhpcy5wYXRoIDogdGhpcy5jYW5vbmljYWxQYXRoKTtcbiAgfTtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZSBgUm91dGVgIHdpdGggdGhlIGdpdmVuIEhUVFAgYHBhdGhgLFxuICAgKiBhbmQgYW4gYXJyYXkgb2YgYGNhbGxiYWNrc2AgYW5kIGBvcHRpb25zYC5cbiAgICpcbiAgICogT3B0aW9uczpcbiAgICpcbiAgICogICAtIGBzZW5zaXRpdmVgICAgIGVuYWJsZSBjYXNlLXNlbnNpdGl2ZSByb3V0ZXNcbiAgICogICAtIGBzdHJpY3RgICAgICAgIGVuYWJsZSBzdHJpY3QgbWF0Y2hpbmcgZm9yIHRyYWlsaW5nIHNsYXNoZXNcbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMuXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiBSb3V0ZShwYXRoLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgdGhpcy5wYXRoID0gKHBhdGggPT09ICcqJykgPyAnKC4qKScgOiBwYXRoO1xuICAgIHRoaXMubWV0aG9kID0gJ0dFVCc7XG4gICAgdGhpcy5yZWdleHAgPSBwYXRodG9SZWdleHAodGhpcy5wYXRoLFxuICAgICAgdGhpcy5rZXlzID0gW10sXG4gICAgICBvcHRpb25zLnNlbnNpdGl2ZSxcbiAgICAgIG9wdGlvbnMuc3RyaWN0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFeHBvc2UgYFJvdXRlYC5cbiAgICovXG5cbiAgcGFnZS5Sb3V0ZSA9IFJvdXRlO1xuXG4gIC8qKlxuICAgKiBSZXR1cm4gcm91dGUgbWlkZGxld2FyZSB3aXRoXG4gICAqIHRoZSBnaXZlbiBjYWxsYmFjayBgZm4oKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXG4gICAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBSb3V0ZS5wcm90b3R5cGUubWlkZGxld2FyZSA9IGZ1bmN0aW9uKGZuKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHJldHVybiBmdW5jdGlvbihjdHgsIG5leHQpIHtcbiAgICAgIGlmIChzZWxmLm1hdGNoKGN0eC5wYXRoLCBjdHgucGFyYW1zKSkgcmV0dXJuIGZuKGN0eCwgbmV4dCk7XG4gICAgICBuZXh0KCk7XG4gICAgfTtcbiAgfTtcblxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhpcyByb3V0ZSBtYXRjaGVzIGBwYXRoYCwgaWYgc29cbiAgICogcG9wdWxhdGUgYHBhcmFtc2AuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXNcbiAgICogQHJldHVybiB7Qm9vbGVhbn1cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5tYXRjaCA9IGZ1bmN0aW9uKHBhdGgsIHBhcmFtcykge1xuICAgIHZhciBrZXlzID0gdGhpcy5rZXlzLFxuICAgICAgcXNJbmRleCA9IHBhdGguaW5kZXhPZignPycpLFxuICAgICAgcGF0aG5hbWUgPSB+cXNJbmRleCA/IHBhdGguc2xpY2UoMCwgcXNJbmRleCkgOiBwYXRoLFxuICAgICAgbSA9IHRoaXMucmVnZXhwLmV4ZWMoZGVjb2RlVVJJQ29tcG9uZW50KHBhdGhuYW1lKSk7XG5cbiAgICBpZiAoIW0pIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAxLCBsZW4gPSBtLmxlbmd0aDsgaSA8IGxlbjsgKytpKSB7XG4gICAgICB2YXIga2V5ID0ga2V5c1tpIC0gMV07XG4gICAgICB2YXIgdmFsID0gZGVjb2RlVVJMRW5jb2RlZFVSSUNvbXBvbmVudChtW2ldKTtcbiAgICAgIGlmICh2YWwgIT09IHVuZGVmaW5lZCB8fCAhKGhhc093blByb3BlcnR5LmNhbGwocGFyYW1zLCBrZXkubmFtZSkpKSB7XG4gICAgICAgIHBhcmFtc1trZXkubmFtZV0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cblxuICAvKipcbiAgICogSGFuZGxlIFwicG9wdWxhdGVcIiBldmVudHMuXG4gICAqL1xuXG4gIHZhciBvbnBvcHN0YXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbG9hZGVkID0gZmFsc2U7XG4gICAgaWYgKCd1bmRlZmluZWQnID09PSB0eXBlb2Ygd2luZG93KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChkb2N1bWVudC5yZWFkeVN0YXRlID09PSAnY29tcGxldGUnKSB7XG4gICAgICBsb2FkZWQgPSB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignbG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgICAgIH0sIDApO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBmdW5jdGlvbiBvbnBvcHN0YXRlKGUpIHtcbiAgICAgIGlmICghbG9hZGVkKSByZXR1cm47XG4gICAgICBpZiAoZS5zdGF0ZSkge1xuICAgICAgICB2YXIgcGF0aCA9IGUuc3RhdGUucGF0aDtcbiAgICAgICAgcGFnZS5yZXBsYWNlKHBhdGgsIGUuc3RhdGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFnZS5zaG93KGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uaGFzaCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGZhbHNlKTtcbiAgICAgIH1cbiAgICB9O1xuICB9KSgpO1xuICAvKipcbiAgICogSGFuZGxlIFwiY2xpY2tcIiBldmVudHMuXG4gICAqL1xuXG4gIGZ1bmN0aW9uIG9uY2xpY2soZSkge1xuXG4gICAgaWYgKDEgIT09IHdoaWNoKGUpKSByZXR1cm47XG5cbiAgICBpZiAoZS5tZXRhS2V5IHx8IGUuY3RybEtleSB8fCBlLnNoaWZ0S2V5KSByZXR1cm47XG4gICAgaWYgKGUuZGVmYXVsdFByZXZlbnRlZCkgcmV0dXJuO1xuXG5cblxuICAgIC8vIGVuc3VyZSBsaW5rXG4gICAgdmFyIGVsID0gZS50YXJnZXQ7XG4gICAgd2hpbGUgKGVsICYmICdBJyAhPT0gZWwubm9kZU5hbWUpIGVsID0gZWwucGFyZW50Tm9kZTtcbiAgICBpZiAoIWVsIHx8ICdBJyAhPT0gZWwubm9kZU5hbWUpIHJldHVybjtcblxuXG5cbiAgICAvLyBJZ25vcmUgaWYgdGFnIGhhc1xuICAgIC8vIDEuIFwiZG93bmxvYWRcIiBhdHRyaWJ1dGVcbiAgICAvLyAyLiByZWw9XCJleHRlcm5hbFwiIGF0dHJpYnV0ZVxuICAgIGlmIChlbC5oYXNBdHRyaWJ1dGUoJ2Rvd25sb2FkJykgfHwgZWwuZ2V0QXR0cmlidXRlKCdyZWwnKSA9PT0gJ2V4dGVybmFsJykgcmV0dXJuO1xuXG4gICAgLy8gZW5zdXJlIG5vbi1oYXNoIGZvciB0aGUgc2FtZSBwYXRoXG4gICAgdmFyIGxpbmsgPSBlbC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICBpZiAoIWhhc2hiYW5nICYmIGVsLnBhdGhuYW1lID09PSBsb2NhdGlvbi5wYXRobmFtZSAmJiAoZWwuaGFzaCB8fCAnIycgPT09IGxpbmspKSByZXR1cm47XG5cblxuXG4gICAgLy8gQ2hlY2sgZm9yIG1haWx0bzogaW4gdGhlIGhyZWZcbiAgICBpZiAobGluayAmJiBsaW5rLmluZGV4T2YoJ21haWx0bzonKSA+IC0xKSByZXR1cm47XG5cbiAgICAvLyBjaGVjayB0YXJnZXRcbiAgICBpZiAoZWwudGFyZ2V0KSByZXR1cm47XG5cbiAgICAvLyB4LW9yaWdpblxuICAgIGlmICghc2FtZU9yaWdpbihlbC5ocmVmKSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIHJlYnVpbGQgcGF0aFxuICAgIHZhciBwYXRoID0gZWwucGF0aG5hbWUgKyBlbC5zZWFyY2ggKyAoZWwuaGFzaCB8fCAnJyk7XG5cbiAgICAvLyBzdHJpcCBsZWFkaW5nIFwiL1tkcml2ZSBsZXR0ZXJdOlwiIG9uIE5XLmpzIG9uIFdpbmRvd3NcbiAgICBpZiAodHlwZW9mIHByb2Nlc3MgIT09ICd1bmRlZmluZWQnICYmIHBhdGgubWF0Y2goL15cXC9bYS16QS1aXTpcXC8vKSkge1xuICAgICAgcGF0aCA9IHBhdGgucmVwbGFjZSgvXlxcL1thLXpBLVpdOlxcLy8sICcvJyk7XG4gICAgfVxuXG4gICAgLy8gc2FtZSBwYWdlXG4gICAgdmFyIG9yaWcgPSBwYXRoO1xuXG4gICAgaWYgKHBhdGguaW5kZXhPZihiYXNlKSA9PT0gMCkge1xuICAgICAgcGF0aCA9IHBhdGguc3Vic3RyKGJhc2UubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBpZiAoaGFzaGJhbmcpIHBhdGggPSBwYXRoLnJlcGxhY2UoJyMhJywgJycpO1xuXG4gICAgaWYgKGJhc2UgJiYgb3JpZyA9PT0gcGF0aCkgcmV0dXJuO1xuXG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHBhZ2Uuc2hvdyhvcmlnKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFdmVudCBidXR0b24uXG4gICAqL1xuXG4gIGZ1bmN0aW9uIHdoaWNoKGUpIHtcbiAgICBlID0gZSB8fCB3aW5kb3cuZXZlbnQ7XG4gICAgcmV0dXJuIG51bGwgPT09IGUud2hpY2ggPyBlLmJ1dHRvbiA6IGUud2hpY2g7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgYGhyZWZgIGlzIHRoZSBzYW1lIG9yaWdpbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gc2FtZU9yaWdpbihocmVmKSB7XG4gICAgdmFyIG9yaWdpbiA9IGxvY2F0aW9uLnByb3RvY29sICsgJy8vJyArIGxvY2F0aW9uLmhvc3RuYW1lO1xuICAgIGlmIChsb2NhdGlvbi5wb3J0KSBvcmlnaW4gKz0gJzonICsgbG9jYXRpb24ucG9ydDtcbiAgICByZXR1cm4gKGhyZWYgJiYgKDAgPT09IGhyZWYuaW5kZXhPZihvcmlnaW4pKSk7XG4gIH1cblxuICBwYWdlLnNhbWVPcmlnaW4gPSBzYW1lT3JpZ2luO1xuIiwidmFyIGlzYXJyYXkgPSByZXF1aXJlKCdpc2FycmF5JylcblxuLyoqXG4gKiBFeHBvc2UgYHBhdGhUb1JlZ2V4cGAuXG4gKi9cbm1vZHVsZS5leHBvcnRzID0gcGF0aFRvUmVnZXhwXG5tb2R1bGUuZXhwb3J0cy5wYXJzZSA9IHBhcnNlXG5tb2R1bGUuZXhwb3J0cy5jb21waWxlID0gY29tcGlsZVxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9GdW5jdGlvbiA9IHRva2Vuc1RvRnVuY3Rpb25cbm1vZHVsZS5leHBvcnRzLnRva2Vuc1RvUmVnRXhwID0gdG9rZW5zVG9SZWdFeHBcblxuLyoqXG4gKiBUaGUgbWFpbiBwYXRoIG1hdGNoaW5nIHJlZ2V4cCB1dGlsaXR5LlxuICpcbiAqIEB0eXBlIHtSZWdFeHB9XG4gKi9cbnZhciBQQVRIX1JFR0VYUCA9IG5ldyBSZWdFeHAoW1xuICAvLyBNYXRjaCBlc2NhcGVkIGNoYXJhY3RlcnMgdGhhdCB3b3VsZCBvdGhlcndpc2UgYXBwZWFyIGluIGZ1dHVyZSBtYXRjaGVzLlxuICAvLyBUaGlzIGFsbG93cyB0aGUgdXNlciB0byBlc2NhcGUgc3BlY2lhbCBjaGFyYWN0ZXJzIHRoYXQgd29uJ3QgdHJhbnNmb3JtLlxuICAnKFxcXFxcXFxcLiknLFxuICAvLyBNYXRjaCBFeHByZXNzLXN0eWxlIHBhcmFtZXRlcnMgYW5kIHVuLW5hbWVkIHBhcmFtZXRlcnMgd2l0aCBhIHByZWZpeFxuICAvLyBhbmQgb3B0aW9uYWwgc3VmZml4ZXMuIE1hdGNoZXMgYXBwZWFyIGFzOlxuICAvL1xuICAvLyBcIi86dGVzdChcXFxcZCspP1wiID0+IFtcIi9cIiwgXCJ0ZXN0XCIsIFwiXFxkK1wiLCB1bmRlZmluZWQsIFwiP1wiLCB1bmRlZmluZWRdXG4gIC8vIFwiL3JvdXRlKFxcXFxkKylcIiAgPT4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiXFxkK1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZF1cbiAgLy8gXCIvKlwiICAgICAgICAgICAgPT4gW1wiL1wiLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIFwiKlwiXVxuICAnKFtcXFxcLy5dKT8oPzooPzpcXFxcOihcXFxcdyspKD86XFxcXCgoKD86XFxcXFxcXFwufFteKCldKSspXFxcXCkpP3xcXFxcKCgoPzpcXFxcXFxcXC58W14oKV0pKylcXFxcKSkoWysqP10pP3woXFxcXCopKSdcbl0uam9pbignfCcpLCAnZycpXG5cbi8qKlxuICogUGFyc2UgYSBzdHJpbmcgZm9yIHRoZSByYXcgdG9rZW5zLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtBcnJheX1cbiAqL1xuZnVuY3Rpb24gcGFyc2UgKHN0cikge1xuICB2YXIgdG9rZW5zID0gW11cbiAgdmFyIGtleSA9IDBcbiAgdmFyIGluZGV4ID0gMFxuICB2YXIgcGF0aCA9ICcnXG4gIHZhciByZXNcblxuICB3aGlsZSAoKHJlcyA9IFBBVEhfUkVHRVhQLmV4ZWMoc3RyKSkgIT0gbnVsbCkge1xuICAgIHZhciBtID0gcmVzWzBdXG4gICAgdmFyIGVzY2FwZWQgPSByZXNbMV1cbiAgICB2YXIgb2Zmc2V0ID0gcmVzLmluZGV4XG4gICAgcGF0aCArPSBzdHIuc2xpY2UoaW5kZXgsIG9mZnNldClcbiAgICBpbmRleCA9IG9mZnNldCArIG0ubGVuZ3RoXG5cbiAgICAvLyBJZ25vcmUgYWxyZWFkeSBlc2NhcGVkIHNlcXVlbmNlcy5cbiAgICBpZiAoZXNjYXBlZCkge1xuICAgICAgcGF0aCArPSBlc2NhcGVkWzFdXG4gICAgICBjb250aW51ZVxuICAgIH1cblxuICAgIC8vIFB1c2ggdGhlIGN1cnJlbnQgcGF0aCBvbnRvIHRoZSB0b2tlbnMuXG4gICAgaWYgKHBhdGgpIHtcbiAgICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gICAgICBwYXRoID0gJydcbiAgICB9XG5cbiAgICB2YXIgcHJlZml4ID0gcmVzWzJdXG4gICAgdmFyIG5hbWUgPSByZXNbM11cbiAgICB2YXIgY2FwdHVyZSA9IHJlc1s0XVxuICAgIHZhciBncm91cCA9IHJlc1s1XVxuICAgIHZhciBzdWZmaXggPSByZXNbNl1cbiAgICB2YXIgYXN0ZXJpc2sgPSByZXNbN11cblxuICAgIHZhciByZXBlYXQgPSBzdWZmaXggPT09ICcrJyB8fCBzdWZmaXggPT09ICcqJ1xuICAgIHZhciBvcHRpb25hbCA9IHN1ZmZpeCA9PT0gJz8nIHx8IHN1ZmZpeCA9PT0gJyonXG4gICAgdmFyIGRlbGltaXRlciA9IHByZWZpeCB8fCAnLydcbiAgICB2YXIgcGF0dGVybiA9IGNhcHR1cmUgfHwgZ3JvdXAgfHwgKGFzdGVyaXNrID8gJy4qJyA6ICdbXicgKyBkZWxpbWl0ZXIgKyAnXSs/JylcblxuICAgIHRva2Vucy5wdXNoKHtcbiAgICAgIG5hbWU6IG5hbWUgfHwga2V5KyssXG4gICAgICBwcmVmaXg6IHByZWZpeCB8fCAnJyxcbiAgICAgIGRlbGltaXRlcjogZGVsaW1pdGVyLFxuICAgICAgb3B0aW9uYWw6IG9wdGlvbmFsLFxuICAgICAgcmVwZWF0OiByZXBlYXQsXG4gICAgICBwYXR0ZXJuOiBlc2NhcGVHcm91cChwYXR0ZXJuKVxuICAgIH0pXG4gIH1cblxuICAvLyBNYXRjaCBhbnkgY2hhcmFjdGVycyBzdGlsbCByZW1haW5pbmcuXG4gIGlmIChpbmRleCA8IHN0ci5sZW5ndGgpIHtcbiAgICBwYXRoICs9IHN0ci5zdWJzdHIoaW5kZXgpXG4gIH1cblxuICAvLyBJZiB0aGUgcGF0aCBleGlzdHMsIHB1c2ggaXQgb250byB0aGUgZW5kLlxuICBpZiAocGF0aCkge1xuICAgIHRva2Vucy5wdXNoKHBhdGgpXG4gIH1cblxuICByZXR1cm4gdG9rZW5zXG59XG5cbi8qKlxuICogQ29tcGlsZSBhIHN0cmluZyB0byBhIHRlbXBsYXRlIGZ1bmN0aW9uIGZvciB0aGUgcGF0aC5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9ICAgc3RyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cbiAqL1xuZnVuY3Rpb24gY29tcGlsZSAoc3RyKSB7XG4gIHJldHVybiB0b2tlbnNUb0Z1bmN0aW9uKHBhcnNlKHN0cikpXG59XG5cbi8qKlxuICogRXhwb3NlIGEgbWV0aG9kIGZvciB0cmFuc2Zvcm1pbmcgdG9rZW5zIGludG8gdGhlIHBhdGggZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvRnVuY3Rpb24gKHRva2Vucykge1xuICAvLyBDb21waWxlIGFsbCB0aGUgdG9rZW5zIGludG8gcmVnZXhwcy5cbiAgdmFyIG1hdGNoZXMgPSBuZXcgQXJyYXkodG9rZW5zLmxlbmd0aClcblxuICAvLyBDb21waWxlIGFsbCB0aGUgcGF0dGVybnMgYmVmb3JlIGNvbXBpbGF0aW9uLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldID09PSAnb2JqZWN0Jykge1xuICAgICAgbWF0Y2hlc1tpXSA9IG5ldyBSZWdFeHAoJ14nICsgdG9rZW5zW2ldLnBhdHRlcm4gKyAnJCcpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uIChvYmopIHtcbiAgICB2YXIgcGF0aCA9ICcnXG4gICAgdmFyIGRhdGEgPSBvYmogfHwge31cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cblxuICAgICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgcGF0aCArPSB0b2tlblxuXG4gICAgICAgIGNvbnRpbnVlXG4gICAgICB9XG5cbiAgICAgIHZhciB2YWx1ZSA9IGRhdGFbdG9rZW4ubmFtZV1cbiAgICAgIHZhciBzZWdtZW50XG5cbiAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBiZSBkZWZpbmVkJylcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoaXNhcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgaWYgKCF0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCByZXBlYXQsIGJ1dCByZWNlaXZlZCBcIicgKyB2YWx1ZSArICdcIicpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodmFsdWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG5vdCBiZSBlbXB0eScpXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB2YWx1ZS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIHNlZ21lbnQgPSBlbmNvZGVVUklDb21wb25lbnQodmFsdWVbal0pXG5cbiAgICAgICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgYWxsIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbWF0Y2ggXCInICsgdG9rZW4ucGF0dGVybiArICdcIiwgYnV0IHJlY2VpdmVkIFwiJyArIHNlZ21lbnQgKyAnXCInKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHBhdGggKz0gKGogPT09IDAgPyB0b2tlbi5wcmVmaXggOiB0b2tlbi5kZWxpbWl0ZXIpICsgc2VnbWVudFxuICAgICAgICB9XG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgc2VnbWVudCA9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSlcblxuICAgICAgaWYgKCFtYXRjaGVzW2ldLnRlc3Qoc2VnbWVudCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBtYXRjaCBcIicgKyB0b2tlbi5wYXR0ZXJuICsgJ1wiLCBidXQgcmVjZWl2ZWQgXCInICsgc2VnbWVudCArICdcIicpXG4gICAgICB9XG5cbiAgICAgIHBhdGggKz0gdG9rZW4ucHJlZml4ICsgc2VnbWVudFxuICAgIH1cblxuICAgIHJldHVybiBwYXRoXG4gIH1cbn1cblxuLyoqXG4gKiBFc2NhcGUgYSByZWd1bGFyIGV4cHJlc3Npb24gc3RyaW5nLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gc3RyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZyAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFsuKyo/PV4hOiR7fSgpW1xcXXxcXC9dKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBFc2NhcGUgdGhlIGNhcHR1cmluZyBncm91cCBieSBlc2NhcGluZyBzcGVjaWFsIGNoYXJhY3RlcnMgYW5kIG1lYW5pbmcuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBncm91cFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBlc2NhcGVHcm91cCAoZ3JvdXApIHtcbiAgcmV0dXJuIGdyb3VwLnJlcGxhY2UoLyhbPSE6JFxcLygpXSkvZywgJ1xcXFwkMScpXG59XG5cbi8qKlxuICogQXR0YWNoIHRoZSBrZXlzIGFzIGEgcHJvcGVydHkgb2YgdGhlIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHtSZWdFeHB9IHJlXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gYXR0YWNoS2V5cyAocmUsIGtleXMpIHtcbiAgcmUua2V5cyA9IGtleXNcbiAgcmV0dXJuIHJlXG59XG5cbi8qKlxuICogR2V0IHRoZSBmbGFncyBmb3IgYSByZWdleHAgZnJvbSB0aGUgb3B0aW9ucy5cbiAqXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZmxhZ3MgKG9wdGlvbnMpIHtcbiAgcmV0dXJuIG9wdGlvbnMuc2Vuc2l0aXZlID8gJycgOiAnaSdcbn1cblxuLyoqXG4gKiBQdWxsIG91dCBrZXlzIGZyb20gYSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7UmVnRXhwfSBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gcmVnZXhwVG9SZWdleHAgKHBhdGgsIGtleXMpIHtcbiAgLy8gVXNlIGEgbmVnYXRpdmUgbG9va2FoZWFkIHRvIG1hdGNoIG9ubHkgY2FwdHVyaW5nIGdyb3Vwcy5cbiAgdmFyIGdyb3VwcyA9IHBhdGguc291cmNlLm1hdGNoKC9cXCgoPyFcXD8pL2cpXG5cbiAgaWYgKGdyb3Vwcykge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZ3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBrZXlzLnB1c2goe1xuICAgICAgICBuYW1lOiBpLFxuICAgICAgICBwcmVmaXg6IG51bGwsXG4gICAgICAgIGRlbGltaXRlcjogbnVsbCxcbiAgICAgICAgb3B0aW9uYWw6IGZhbHNlLFxuICAgICAgICByZXBlYXQ6IGZhbHNlLFxuICAgICAgICBwYXR0ZXJuOiBudWxsXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHBhdGgsIGtleXMpXG59XG5cbi8qKlxuICogVHJhbnNmb3JtIGFuIGFycmF5IGludG8gYSByZWdleHAuXG4gKlxuICogQHBhcmFtICB7QXJyYXl9ICBwYXRoXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBhcnJheVRvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciBwYXJ0cyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXRoLmxlbmd0aDsgaSsrKSB7XG4gICAgcGFydHMucHVzaChwYXRoVG9SZWdleHAocGF0aFtpXSwga2V5cywgb3B0aW9ucykuc291cmNlKVxuICB9XG5cbiAgdmFyIHJlZ2V4cCA9IG5ldyBSZWdFeHAoJyg/OicgKyBwYXJ0cy5qb2luKCd8JykgKyAnKScsIGZsYWdzKG9wdGlvbnMpKVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlZ2V4cCwga2V5cylcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBwYXRoIHJlZ2V4cCBmcm9tIHN0cmluZyBpbnB1dC5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHN0cmluZ1RvUmVnZXhwIChwYXRoLCBrZXlzLCBvcHRpb25zKSB7XG4gIHZhciB0b2tlbnMgPSBwYXJzZShwYXRoKVxuICB2YXIgcmUgPSB0b2tlbnNUb1JlZ0V4cCh0b2tlbnMsIG9wdGlvbnMpXG5cbiAgLy8gQXR0YWNoIGtleXMgYmFjayB0byB0aGUgcmVnZXhwLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIGlmICh0eXBlb2YgdG9rZW5zW2ldICE9PSAnc3RyaW5nJykge1xuICAgICAga2V5cy5wdXNoKHRva2Vuc1tpXSlcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0YWNoS2V5cyhyZSwga2V5cylcbn1cblxuLyoqXG4gKiBFeHBvc2UgYSBmdW5jdGlvbiBmb3IgdGFraW5nIHRva2VucyBhbmQgcmV0dXJuaW5nIGEgUmVnRXhwLlxuICpcbiAqIEBwYXJhbSAge0FycmF5fSAgdG9rZW5zXG4gKiBAcGFyYW0gIHtBcnJheX0gIGtleXNcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiB0b2tlbnNUb1JlZ0V4cCAodG9rZW5zLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgdmFyIHN0cmljdCA9IG9wdGlvbnMuc3RyaWN0XG4gIHZhciBlbmQgPSBvcHRpb25zLmVuZCAhPT0gZmFsc2VcbiAgdmFyIHJvdXRlID0gJydcbiAgdmFyIGxhc3RUb2tlbiA9IHRva2Vuc1t0b2tlbnMubGVuZ3RoIC0gMV1cbiAgdmFyIGVuZHNXaXRoU2xhc2ggPSB0eXBlb2YgbGFzdFRva2VuID09PSAnc3RyaW5nJyAmJiAvXFwvJC8udGVzdChsYXN0VG9rZW4pXG5cbiAgLy8gSXRlcmF0ZSBvdmVyIHRoZSB0b2tlbnMgYW5kIGNyZWF0ZSBvdXIgcmVnZXhwIHN0cmluZy5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgdG9rZW4gPSB0b2tlbnNbaV1cblxuICAgIGlmICh0eXBlb2YgdG9rZW4gPT09ICdzdHJpbmcnKSB7XG4gICAgICByb3V0ZSArPSBlc2NhcGVTdHJpbmcodG9rZW4pXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBwcmVmaXggPSBlc2NhcGVTdHJpbmcodG9rZW4ucHJlZml4KVxuICAgICAgdmFyIGNhcHR1cmUgPSB0b2tlbi5wYXR0ZXJuXG5cbiAgICAgIGlmICh0b2tlbi5yZXBlYXQpIHtcbiAgICAgICAgY2FwdHVyZSArPSAnKD86JyArIHByZWZpeCArIGNhcHR1cmUgKyAnKSonXG4gICAgICB9XG5cbiAgICAgIGlmICh0b2tlbi5vcHRpb25hbCkge1xuICAgICAgICBpZiAocHJlZml4KSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoPzonICsgcHJlZml4ICsgJygnICsgY2FwdHVyZSArICcpKT8nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY2FwdHVyZSA9ICcoJyArIGNhcHR1cmUgKyAnKT8nXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhcHR1cmUgPSBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJyknXG4gICAgICB9XG5cbiAgICAgIHJvdXRlICs9IGNhcHR1cmVcbiAgICB9XG4gIH1cblxuICAvLyBJbiBub24tc3RyaWN0IG1vZGUgd2UgYWxsb3cgYSBzbGFzaCBhdCB0aGUgZW5kIG9mIG1hdGNoLiBJZiB0aGUgcGF0aCB0b1xuICAvLyBtYXRjaCBhbHJlYWR5IGVuZHMgd2l0aCBhIHNsYXNoLCB3ZSByZW1vdmUgaXQgZm9yIGNvbnNpc3RlbmN5LiBUaGUgc2xhc2hcbiAgLy8gaXMgdmFsaWQgYXQgdGhlIGVuZCBvZiBhIHBhdGggbWF0Y2gsIG5vdCBpbiB0aGUgbWlkZGxlLiBUaGlzIGlzIGltcG9ydGFudFxuICAvLyBpbiBub24tZW5kaW5nIG1vZGUsIHdoZXJlIFwiL3Rlc3QvXCIgc2hvdWxkbid0IG1hdGNoIFwiL3Rlc3QvL3JvdXRlXCIuXG4gIGlmICghc3RyaWN0KSB7XG4gICAgcm91dGUgPSAoZW5kc1dpdGhTbGFzaCA/IHJvdXRlLnNsaWNlKDAsIC0yKSA6IHJvdXRlKSArICcoPzpcXFxcLyg/PSQpKT8nXG4gIH1cblxuICBpZiAoZW5kKSB7XG4gICAgcm91dGUgKz0gJyQnXG4gIH0gZWxzZSB7XG4gICAgLy8gSW4gbm9uLWVuZGluZyBtb2RlLCB3ZSBuZWVkIHRoZSBjYXB0dXJpbmcgZ3JvdXBzIHRvIG1hdGNoIGFzIG11Y2ggYXNcbiAgICAvLyBwb3NzaWJsZSBieSB1c2luZyBhIHBvc2l0aXZlIGxvb2thaGVhZCB0byB0aGUgZW5kIG9yIG5leHQgcGF0aCBzZWdtZW50LlxuICAgIHJvdXRlICs9IHN0cmljdCAmJiBlbmRzV2l0aFNsYXNoID8gJycgOiAnKD89XFxcXC98JCknXG4gIH1cblxuICByZXR1cm4gbmV3IFJlZ0V4cCgnXicgKyByb3V0ZSwgZmxhZ3Mob3B0aW9ucykpXG59XG5cbi8qKlxuICogTm9ybWFsaXplIHRoZSBnaXZlbiBwYXRoIHN0cmluZywgcmV0dXJuaW5nIGEgcmVndWxhciBleHByZXNzaW9uLlxuICpcbiAqIEFuIGVtcHR5IGFycmF5IGNhbiBiZSBwYXNzZWQgaW4gZm9yIHRoZSBrZXlzLCB3aGljaCB3aWxsIGhvbGQgdGhlXG4gKiBwbGFjZWhvbGRlciBrZXkgZGVzY3JpcHRpb25zLiBGb3IgZXhhbXBsZSwgdXNpbmcgYC91c2VyLzppZGAsIGBrZXlzYCB3aWxsXG4gKiBjb250YWluIGBbeyBuYW1lOiAnaWQnLCBkZWxpbWl0ZXI6ICcvJywgb3B0aW9uYWw6IGZhbHNlLCByZXBlYXQ6IGZhbHNlIH1dYC5cbiAqXG4gKiBAcGFyYW0gIHsoU3RyaW5nfFJlZ0V4cHxBcnJheSl9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAgICAgICAgICAgICAgICAgW2tleXNdXG4gKiBAcGFyYW0gIHtPYmplY3R9ICAgICAgICAgICAgICAgIFtvcHRpb25zXVxuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBwYXRoVG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAga2V5cyA9IGtleXMgfHwgW11cblxuICBpZiAoIWlzYXJyYXkoa2V5cykpIHtcbiAgICBvcHRpb25zID0ga2V5c1xuICAgIGtleXMgPSBbXVxuICB9IGVsc2UgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHt9XG4gIH1cblxuICBpZiAocGF0aCBpbnN0YW5jZW9mIFJlZ0V4cCkge1xuICAgIHJldHVybiByZWdleHBUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxuICB9XG5cbiAgaWYgKGlzYXJyYXkocGF0aCkpIHtcbiAgICByZXR1cm4gYXJyYXlUb1JlZ2V4cChwYXRoLCBrZXlzLCBvcHRpb25zKVxuICB9XG5cbiAgcmV0dXJuIHN0cmluZ1RvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG59XG4iLCIoZnVuY3Rpb24oKSB7XG4gICd1c2Ugc3RyaWN0JztcblxuICBpZiAoc2VsZi5mZXRjaCkge1xuICAgIHJldHVyblxuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgaWYgKHR5cGVvZiBuYW1lICE9PSAnc3RyaW5nJykge1xuICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKVxuICAgIH1cbiAgICBpZiAoL1teYS16MC05XFwtIyQlJicqKy5cXF5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0ludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lJylcbiAgICB9XG4gICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKVxuICB9XG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJykge1xuICAgICAgdmFsdWUgPSBTdHJpbmcodmFsdWUpXG4gICAgfVxuICAgIHJldHVybiB2YWx1ZVxuICB9XG5cbiAgZnVuY3Rpb24gSGVhZGVycyhoZWFkZXJzKSB7XG4gICAgdGhpcy5tYXAgPSB7fVxuXG4gICAgaWYgKGhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpXG4gICAgICB9LCB0aGlzKVxuXG4gICAgfSBlbHNlIGlmIChoZWFkZXJzKSB7XG4gICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICBuYW1lID0gbm9ybWFsaXplTmFtZShuYW1lKVxuICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gICAgdmFyIGxpc3QgPSB0aGlzLm1hcFtuYW1lXVxuICAgIGlmICghbGlzdCkge1xuICAgICAgbGlzdCA9IFtdXG4gICAgICB0aGlzLm1hcFtuYW1lXSA9IGxpc3RcbiAgICB9XG4gICAgbGlzdC5wdXNoKHZhbHVlKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciB2YWx1ZXMgPSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICAgIHJldHVybiB2YWx1ZXMgPyB2YWx1ZXNbMF0gOiBudWxsXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXRBbGwgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldIHx8IFtdXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gW25vcm1hbGl6ZVZhbHVlKHZhbHVlKV1cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbihjYWxsYmFjaywgdGhpc0FyZykge1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMubWFwKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIHRoaXMubWFwW25hbWVdLmZvckVhY2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB2YWx1ZSwgbmFtZSwgdGhpcylcbiAgICAgIH0sIHRoaXMpXG4gICAgfSwgdGhpcylcbiAgfVxuXG4gIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpKVxuICAgIH1cbiAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZVxuICB9XG5cbiAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KVxuICAgICAgfVxuICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcilcbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKVxuICAgIHJldHVybiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEJsb2JBc1RleHQoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc1RleHQoYmxvYilcbiAgICByZXR1cm4gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgfVxuXG4gIHZhciBzdXBwb3J0ID0ge1xuICAgIGJsb2I6ICdGaWxlUmVhZGVyJyBpbiBzZWxmICYmICdCbG9iJyBpbiBzZWxmICYmIChmdW5jdGlvbigpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSkoKSxcbiAgICBmb3JtRGF0YTogJ0Zvcm1EYXRhJyBpbiBzZWxmLFxuICAgIGFycmF5QnVmZmVyOiAnQXJyYXlCdWZmZXInIGluIHNlbGZcbiAgfVxuXG4gIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgdGhpcy5ib2R5VXNlZCA9IGZhbHNlXG5cblxuICAgIHRoaXMuX2luaXRCb2R5ID0gZnVuY3Rpb24oYm9keSkge1xuICAgICAgdGhpcy5fYm9keUluaXQgPSBib2R5XG4gICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmJsb2IgJiYgQmxvYi5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5mb3JtRGF0YSAmJiBGb3JtRGF0YS5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKCFib2R5KSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gJydcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBBcnJheUJ1ZmZlci5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihib2R5KSkge1xuICAgICAgICAvLyBPbmx5IHN1cHBvcnQgQXJyYXlCdWZmZXJzIGZvciBQT1NUIG1ldGhvZC5cbiAgICAgICAgLy8gUmVjZWl2aW5nIEFycmF5QnVmZmVycyBoYXBwZW5zIHZpYSBCbG9icywgaW5zdGVhZC5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcigndW5zdXBwb3J0ZWQgQm9keUluaXQgdHlwZScpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuYmxvYikge1xuICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QmxvYilcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYicpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSlcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcilcbiAgICAgIH1cblxuICAgICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0JylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICByZXR1cm4gcmVqZWN0ZWQgPyByZWplY3RlZCA6IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dClcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5mb3JtRGF0YSkge1xuICAgICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihkZWNvZGUpXG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzXG4gIH1cblxuICAvLyBIVFRQIG1ldGhvZHMgd2hvc2UgY2FwaXRhbGl6YXRpb24gc2hvdWxkIGJlIG5vcm1hbGl6ZWRcbiAgdmFyIG1ldGhvZHMgPSBbJ0RFTEVURScsICdHRVQnLCAnSEVBRCcsICdPUFRJT05TJywgJ1BPU1QnLCAnUFVUJ11cblxuICBmdW5jdGlvbiBub3JtYWxpemVNZXRob2QobWV0aG9kKSB7XG4gICAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKVxuICAgIHJldHVybiAobWV0aG9kcy5pbmRleE9mKHVwY2FzZWQpID4gLTEpID8gdXBjYXNlZCA6IG1ldGhvZFxuICB9XG5cbiAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHlcbiAgICBpZiAoUmVxdWVzdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihpbnB1dCkpIHtcbiAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKVxuICAgICAgfVxuICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmxcbiAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBpbnB1dC5jcmVkZW50aWFsc1xuICAgICAgaWYgKCFvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMoaW5wdXQuaGVhZGVycylcbiAgICAgIH1cbiAgICAgIHRoaXMubWV0aG9kID0gaW5wdXQubWV0aG9kXG4gICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlXG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdFxuICAgICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWVcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy51cmwgPSBpbnB1dFxuICAgIH1cblxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgJ29taXQnXG4gICAgaWYgKG9wdGlvbnMuaGVhZGVycyB8fCAhdGhpcy5oZWFkZXJzKSB7XG4gICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gICAgfVxuICAgIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kKG9wdGlvbnMubWV0aG9kIHx8IHRoaXMubWV0aG9kIHx8ICdHRVQnKVxuICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbFxuICAgIHRoaXMucmVmZXJyZXIgPSBudWxsXG5cbiAgICBpZiAoKHRoaXMubWV0aG9kID09PSAnR0VUJyB8fCB0aGlzLm1ldGhvZCA9PT0gJ0hFQUQnKSAmJiBib2R5KSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCb2R5IG5vdCBhbGxvd2VkIGZvciBHRVQgb3IgSEVBRCByZXF1ZXN0cycpXG4gICAgfVxuICAgIHRoaXMuX2luaXRCb2R5KGJvZHkpXG4gIH1cblxuICBSZXF1ZXN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzKVxuICB9XG5cbiAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpXG4gICAgYm9keS50cmltKCkuc3BsaXQoJyYnKS5mb3JFYWNoKGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgICBpZiAoYnl0ZXMpIHtcbiAgICAgICAgdmFyIHNwbGl0ID0gYnl0ZXMuc3BsaXQoJz0nKVxuICAgICAgICB2YXIgbmFtZSA9IHNwbGl0LnNoaWZ0KCkucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgdmFyIHZhbHVlID0gc3BsaXQuam9pbignPScpLnJlcGxhY2UoL1xcKy9nLCAnICcpXG4gICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSlcbiAgICAgIH1cbiAgICB9KVxuICAgIHJldHVybiBmb3JtXG4gIH1cblxuICBmdW5jdGlvbiBoZWFkZXJzKHhocikge1xuICAgIHZhciBoZWFkID0gbmV3IEhlYWRlcnMoKVxuICAgIHZhciBwYWlycyA9IHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKS50cmltKCkuc3BsaXQoJ1xcbicpXG4gICAgcGFpcnMuZm9yRWFjaChmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgIHZhciBzcGxpdCA9IGhlYWRlci50cmltKCkuc3BsaXQoJzonKVxuICAgICAgdmFyIGtleSA9IHNwbGl0LnNoaWZ0KCkudHJpbSgpXG4gICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc6JykudHJpbSgpXG4gICAgICBoZWFkLmFwcGVuZChrZXksIHZhbHVlKVxuICAgIH0pXG4gICAgcmV0dXJuIGhlYWRcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSlcblxuICBmdW5jdGlvbiBSZXNwb25zZShib2R5SW5pdCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHt9XG4gICAgfVxuXG4gICAgdGhpcy5faW5pdEJvZHkoYm9keUluaXQpXG4gICAgdGhpcy50eXBlID0gJ2RlZmF1bHQnXG4gICAgdGhpcy5zdGF0dXMgPSBvcHRpb25zLnN0YXR1c1xuICAgIHRoaXMub2sgPSB0aGlzLnN0YXR1cyA+PSAyMDAgJiYgdGhpcy5zdGF0dXMgPCAzMDBcbiAgICB0aGlzLnN0YXR1c1RleHQgPSBvcHRpb25zLnN0YXR1c1RleHRcbiAgICB0aGlzLmhlYWRlcnMgPSBvcHRpb25zLmhlYWRlcnMgaW5zdGFuY2VvZiBIZWFkZXJzID8gb3B0aW9ucy5oZWFkZXJzIDogbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmwgfHwgJydcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpXG5cbiAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgc3RhdHVzOiB0aGlzLnN0YXR1cyxcbiAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICB1cmw6IHRoaXMudXJsXG4gICAgfSlcbiAgfVxuXG4gIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSlcbiAgICByZXNwb25zZS50eXBlID0gJ2Vycm9yJ1xuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdXG5cbiAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbiAgfVxuXG4gIHNlbGYuSGVhZGVycyA9IEhlYWRlcnM7XG4gIHNlbGYuUmVxdWVzdCA9IFJlcXVlc3Q7XG4gIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVxdWVzdFxuICAgICAgaWYgKFJlcXVlc3QucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoaW5wdXQpICYmICFpbml0KSB7XG4gICAgICAgIHJlcXVlc3QgPSBpbnB1dFxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KVxuICAgICAgfVxuXG4gICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KClcblxuICAgICAgZnVuY3Rpb24gcmVzcG9uc2VVUkwoKSB7XG4gICAgICAgIGlmICgncmVzcG9uc2VVUkwnIGluIHhocikge1xuICAgICAgICAgIHJldHVybiB4aHIucmVzcG9uc2VVUkxcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEF2b2lkIHNlY3VyaXR5IHdhcm5pbmdzIG9uIGdldFJlc3BvbnNlSGVhZGVyIHdoZW4gbm90IGFsbG93ZWQgYnkgQ09SU1xuICAgICAgICBpZiAoL15YLVJlcXVlc3QtVVJMOi9tLnRlc3QoeGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpKSkge1xuICAgICAgICAgIHJldHVybiB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtUmVxdWVzdC1VUkwnKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzdGF0dXMgPSAoeGhyLnN0YXR1cyA9PT0gMTIyMykgPyAyMDQgOiB4aHIuc3RhdHVzXG4gICAgICAgIGlmIChzdGF0dXMgPCAxMDAgfHwgc3RhdHVzID4gNTk5KSB7XG4gICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHtcbiAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBoZWFkZXJzKHhociksXG4gICAgICAgICAgdXJsOiByZXNwb25zZVVSTCgpXG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJvZHkgPSAncmVzcG9uc2UnIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgIHJlc29sdmUobmV3IFJlc3BvbnNlKGJvZHksIG9wdGlvbnMpKVxuICAgICAgfVxuXG4gICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgfVxuXG4gICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpXG5cbiAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJ1xuICAgICAgfVxuXG4gICAgICByZXF1ZXN0LmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSlcbiAgICAgIH0pXG5cbiAgICAgIHhoci5zZW5kKHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcmVxdWVzdC5fYm9keUluaXQpXG4gICAgfSlcbiAgfVxuICBzZWxmLmZldGNoLnBvbHlmaWxsID0gdHJ1ZVxufSkoKTtcbiIsImNvbnN0IFByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi9wcmVmZXJlbmNlcycpO1xuXG5jb25zdCBKb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvSm90Jyk7XG5cbmNsYXNzIEdyb3VwUHJlZmVyZW5jZXMgZXh0ZW5kcyBQcmVmZXJlbmNlcyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLl9vcmRlciA9IHRoaXMuZ2V0T3JkZXIoKTtcbiAgfVxuXG4gIGdldE9yZGVyKCkge1xuICAgIGxldCBvcmRlciA9IHRoaXMuZ2V0SXRlbSgnb3JkZXInKTtcblxuICAgIGlmICghb3JkZXIgfHwgIW9yZGVyLnR5cGUgfHwgIW9yZGVyLmRpcmVjdGlvbikge1xuICAgICAgb3JkZXIgPSB7XG4gICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5fb3JkZXIgPSBvcmRlcjtcblxuICAgIHJldHVybiBvcmRlcjtcbiAgfVxuXG4gIHNldE9yZGVyKHR5cGUsIGRpcmVjdGlvbikge1xuICAgIHRoaXMuX29yZGVyLnR5cGUgPSB0eXBlO1xuICAgIHRoaXMuX29yZGVyLmRpcmVjdGlvbiA9IGRpcmVjdGlvbjtcblxuICAgIHRoaXMuc2V0SXRlbSgnb3JkZXInLCB0aGlzLl9vcmRlcik7XG4gIH1cblxuICBvcmRlcihqb3RzKSB7XG4gICAgcmV0dXJuIEpvdC5vcmRlcihqb3RzLCB0aGlzLl9vcmRlci50eXBlLCB0aGlzLl9vcmRlci5kaXJlY3Rpb24pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gR3JvdXBQcmVmZXJlbmNlcztcbiIsImNvbnN0IFByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi9wcmVmZXJlbmNlcycpO1xuXG5jb25zdCBHcm91cCA9IHJlcXVpcmUoJy4uL21vZGVscy9ncm91cCcpO1xuXG5jbGFzcyBHcm91cHNQcmVmZXJlbmNlcyBleHRlbmRzIFByZWZlcmVuY2VzIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX29yZGVyID0gdGhpcy5nZXRPcmRlcigpO1xuICB9XG5cbiAgZ2V0T3JkZXIoKSB7XG4gICAgbGV0IG9yZGVyID0gdGhpcy5nZXRJdGVtKCdvcmRlcicpO1xuXG4gICAgaWYgKCFvcmRlciB8fCAhb3JkZXIudHlwZSB8fCAhb3JkZXIuZGlyZWN0aW9uKSB7XG4gICAgICBvcmRlciA9IHtcbiAgICAgICAgdHlwZTogJ2RhdGUnLFxuICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLl9vcmRlciA9IG9yZGVyO1xuXG4gICAgcmV0dXJuIG9yZGVyO1xuICB9XG5cbiAgc2V0T3JkZXIodHlwZSwgZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fb3JkZXIudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5fb3JkZXIuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgdGhpcy5zZXRJdGVtKCdvcmRlcicsIHRoaXMuX29yZGVyKTtcbiAgfVxuXG4gIG9yZGVyKGdyb3Vwcykge1xuICAgIHJldHVybiBHcm91cC5vcmRlcihncm91cHMsIHRoaXMuX29yZGVyLnR5cGUsIHRoaXMuX29yZGVyLmRpcmVjdGlvbik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cHNQcmVmZXJlbmNlcztcbiIsImNvbnN0IFByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi9wcmVmZXJlbmNlcycpO1xuXG5jb25zdCBKb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvSm90Jyk7XG5cbmNsYXNzIEpvdHNQcmVmZXJlbmNlcyBleHRlbmRzIFByZWZlcmVuY2VzIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX29yZGVyID0gdGhpcy5nZXRPcmRlcigpO1xuICB9XG5cbiAgZ2V0T3JkZXIoKSB7XG4gICAgbGV0IG9yZGVyID0gdGhpcy5nZXRJdGVtKCdvcmRlcicpO1xuXG4gICAgaWYgKCFvcmRlciB8fCAhb3JkZXIudHlwZSB8fCAhb3JkZXIuZGlyZWN0aW9uKSB7XG4gICAgICBvcmRlciA9IHtcbiAgICAgICAgdHlwZTogJ2RhdGUnLFxuICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLl9vcmRlciA9IG9yZGVyO1xuXG4gICAgcmV0dXJuIG9yZGVyO1xuICB9XG5cbiAgc2V0T3JkZXIodHlwZSwgZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fb3JkZXIudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5fb3JkZXIuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgdGhpcy5zZXRJdGVtKCdvcmRlcicsIHRoaXMuX29yZGVyKTtcbiAgfVxuXG4gIG9yZGVyKGpvdHMpIHtcbiAgICByZXR1cm4gSm90Lm9yZGVyKGpvdHMsIHRoaXMuX29yZGVyLnR5cGUsIHRoaXMuX29yZGVyLmRpcmVjdGlvbik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3RzUHJlZmVyZW5jZXM7XG4iLCJjbGFzcyBQcmVmZXJlbmNlcyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGlmIChsb2NhbFN0b3JhZ2UpIHtcbiAgICAgIHRoaXMuX3N0b3JhZ2UgPSBsb2NhbFN0b3JhZ2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX3N0b3JhZ2UgPSB7XG4gICAgICAgIGZpZWxkczoge30sXG5cbiAgICAgICAgZ2V0SXRlbTogZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgIHJldHVybiB0aGlzLmZpZWxkc1tuYW1lXTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZXRJdGVtOiBmdW5jdGlvbihuYW1lLCBpdGVtKSB7XG4gICAgICAgICAgdGhpcy5maWVsZHNbbmFtZV0gPSBpdGVtO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX2tleSA9IHRoaXMuY29uc3RydWN0b3IubmFtZS50b0xvd2VyQ2FzZSgpO1xuICB9XG5cbiAgZ2V0SXRlbShuYW1lKSB7XG4gICAgbGV0IHByZWZzID0gdGhpcy5fc3RvcmFnZS5nZXRJdGVtKHRoaXMuX2tleSk7XG5cbiAgICBpZiAocHJlZnMpIHtcbiAgICAgIHByZWZzID0gSlNPTi5wYXJzZShwcmVmcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHByZWZzID0ge307XG4gICAgfVxuXG4gICAgcmV0dXJuIHByZWZzLm5hbWU7XG4gIH1cblxuICBzZXRJdGVtKG5hbWUsIGl0ZW0pIHtcbiAgICBsZXQgcHJlZnMgPSB0aGlzLl9zdG9yYWdlLmdldEl0ZW0odGhpcy5fa2V5KTtcblxuICAgIGlmIChwcmVmcykge1xuICAgICAgcHJlZnMgPSBKU09OLnBhcnNlKHByZWZzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZnMgPSB7fTtcbiAgICB9XG5cbiAgICBwcmVmcy5uYW1lID0gaXRlbTtcblxuICAgIHRoaXMuX3N0b3JhZ2Uuc2V0SXRlbSh0aGlzLl9rZXksIEpTT04uc3RyaW5naWZ5KHByZWZzKSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQcmVmZXJlbmNlcztcbiIsImlmICh3aW5kb3cub3BlcmFtaW5pKSB7XG4gIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZCgnb3BlcmFtaW5pJyk7XG59XG5cbi8vIGN1dHRpbmcgdGhlIG9sJyBtdXN0YXJkIGxpa2UgYSBwcm9cbmlmICgndmlzaWJpbGl0eVN0YXRlJyBpbiBkb2N1bWVudCAmJiAhd2luZG93Lm9wZXJhbWluaSkge1xuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuY2xhc3NMaXN0LnJlbW92ZSgnbm9qcycpO1xuICBpZiAobmF2aWdhdG9yLnNlcnZpY2VXb3JrZXIpIHtcbiAgICBuYXZpZ2F0b3Iuc2VydmljZVdvcmtlci5yZWdpc3RlcignL3NlcnZpY2V3b3JrZXIuanMnLCB7XG4gICAgICBzY29wZTogJy8nLFxuICAgIH0pLnRoZW4ocmVnID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdTVyByZWdpc3RlciBzdWNjZXNzJywgcmVnKTtcbiAgICB9LCBlcnIgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1NXIHJlZ2lzdGVyIGZhaWwnLCBlcnIpO1xuICAgIH0pO1xuICB9XG5cbiAgaWYgKCF3aW5kb3cuZmV0Y2gpIHtcbiAgICByZXF1aXJlKCd3aGF0d2ctZmV0Y2gnKTtcbiAgfVxuXG4gIGZldGNoKCcvYXV0aC91c2VyJywge1xuICAgIGNyZWRlbnRpYWxzOiAnc2FtZS1vcmlnaW4nLFxuICB9KS50aGVuKHJlc3BvbnNlID0+IHtcbiAgICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xuICB9KS50aGVuKGpzb24gPT4ge1xuICAgIEpvdEFwcC51c2VyID0ganNvbjtcblxuICAgIGlmIChKb3RBcHAudXNlciAhPT0gZmFsc2UpIHtcbiAgICAgIGlmIChKb3RBcHAudXNlci5jcmVkZW50aWFscykge1xuICAgICAgICByZXF1aXJlKCcuLi8uLi9kYi9kYicpKHtcbiAgICAgICAgICBwcm90b2NvbDogSm90QXBwLnNlcnZlci5wcm90b2NvbCxcbiAgICAgICAgICBkb21haW46IEpvdEFwcC5zZXJ2ZXIuZG9tYWluLFxuICAgICAgICAgIHVzZXJuYW1lOiBKb3RBcHAudXNlci5jcmVkZW50aWFscy5rZXksXG4gICAgICAgICAgcGFzc3dvcmQ6IEpvdEFwcC51c2VyLmNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgICAgIGRiTmFtZTogJ2pvdC0nICsgSm90QXBwLnVzZXIuX2lkLFxuICAgICAgICB9KTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2pvdC11c2VyJywgSlNPTi5zdHJpbmdpZnkoSm90QXBwLnVzZXIpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGxvY2FsVXNlciA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCdqb3QtdXNlcicpO1xuXG4gICAgICAgIGlmIChsb2NhbFVzZXIpIHtcbiAgICAgICAgICBKb3RBcHAudXNlciA9IEpTT04ucGFyc2UobG9jYWxVc2VyKTtcbiAgICAgICAgICBpZiAoSm90QXBwLnVzZXIpIHtcbiAgICAgICAgICAgIHJlcXVpcmUoJy4uLy4uL2RiL2RiJykoe1xuICAgICAgICAgICAgICBwcm90b2NvbDogSm90QXBwLnNlcnZlci5wcm90b2NvbCxcbiAgICAgICAgICAgICAgZG9tYWluOiBKb3RBcHAuc2VydmVyLmRvbWFpbixcbiAgICAgICAgICAgICAgdXNlcm5hbWU6IEpvdEFwcC51c2VyLmNyZWRlbnRpYWxzLmtleSxcbiAgICAgICAgICAgICAgcGFzc3dvcmQ6IEpvdEFwcC51c2VyLmNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgICAgICAgICBkYk5hbWU6ICdqb3QtJyArIEpvdEFwcC51c2VyLl9pZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXF1aXJlKCcuLi8uLi9kYi9kYicpKHtcbiAgICAgICAgICAgICAgZGJOYW1lOiAnam90LWxvY2FsJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXF1aXJlKCcuLi8uLi9kYi9kYicpKHtcbiAgICAgICAgICAgIGRiTmFtZTogJ2pvdC1sb2NhbCcsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ2pvdC11c2VyJywgSlNPTi5zdHJpbmdpZnkoZmFsc2UpKTtcbiAgICAgIHJlcXVpcmUoJy4uLy4uL2RiL2RiJykoe1xuICAgICAgICBkYk5hbWU6ICdqb3QtbG9jYWwnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYXR0YWNoRmFzdENsaWNrID0gcmVxdWlyZSgnZmFzdGNsaWNrJyk7XG5cbiAgICBjb25zdCBWaWV3Q29udGFpbmVyID0gcmVxdWlyZSgnLi4vLi4vdmlld3Mvdmlldy1jb250YWluZXInKTtcblxuICAgIGNvbnN0IHJvdXRlciA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcnMvcGF0aCcpO1xuXG4gICAgY29uc3QgUm91dGVzSG9tZSA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcy9jbGllbnQvaG9tZScpO1xuICAgIGNvbnN0IFJvdXRlc0F1dGggPSByZXF1aXJlKCcuLi8uLi9yb3V0ZXMvY2xpZW50L2F1dGgnKTtcbiAgICBjb25zdCBSb3V0ZXNKb3QgPSByZXF1aXJlKCcuLi8uLi9yb3V0ZXMvY2xpZW50L2pvdCcpO1xuICAgIGNvbnN0IFJvdXRlc0dyb3VwID0gcmVxdWlyZSgnLi4vLi4vcm91dGVzL2NsaWVudC9ncm91cCcpO1xuXG4gICAgY29uc3QgVGl0bGVCYXJWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvdGl0bGViYXInKTtcbiAgICBjb25zdCBOb3RpZmljYXRpb25NYW5hZ2VyVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL25vdGlmaWNhdGlvbi1tYW5hZ2VyJyk7XG5cbiAgICBjb25zdCBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGFuZGxlYmFycy9kaXN0L2hhbmRsZWJhcnMucnVudGltZScpO1xuICAgIGNvbnN0IGhlbHBlcnMgPSByZXF1aXJlKCcuLi8uLi90ZW1wbGF0ZXMvaGVscGVycycpO1xuXG4gICAgYXR0YWNoRmFzdENsaWNrKGRvY3VtZW50LmJvZHkpO1xuXG4gICAgZm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmtleXMoSm90QXBwLnRlbXBsYXRlcykpIHtcbiAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKGtleSwgSGFuZGxlYmFycy50ZW1wbGF0ZShKb3RBcHAudGVtcGxhdGVzW2tleV0pKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGhlbHBlciBpbiBoZWxwZXJzKSB7XG4gICAgICBpZiAoaGVscGVycy5oYXNPd25Qcm9wZXJ0eShoZWxwZXIpKSB7XG4gICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoaGVscGVyLCBoZWxwZXJzW2hlbHBlcl0pO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGNvbnRhaW5lck1haW4gPSBuZXcgVmlld0NvbnRhaW5lcigndmlldycsIHtcbiAgICAgIGhvbWU6IEpvdEFwcC50ZW1wbGF0ZXMuaG9tZSxcbiAgICAgIGdyb3VwOiBKb3RBcHAudGVtcGxhdGVzLmdyb3VwLFxuICAgICAgZ3JvdXBzOiBKb3RBcHAudGVtcGxhdGVzLmdyb3VwcyxcbiAgICAgIGpvdHM6IEpvdEFwcC50ZW1wbGF0ZXMuam90cyxcbiAgICAgIGxvYWRpbmc6IEpvdEFwcC50ZW1wbGF0ZXMubG9hZGluZyxcbiAgICAgIGxvYWRpbmdncm91cHM6IEpvdEFwcC50ZW1wbGF0ZXMubG9hZGluZ2dyb3VwcyxcbiAgICAgIGltcG9ydDogSm90QXBwLnRlbXBsYXRlcy5pbXBvcnQsXG4gICAgfSwge1xuICAgICAgJ2dyb3VwLWxpc3QnOiBKb3RBcHAudGVtcGxhdGVzWydncm91cC1saXN0J10sXG4gICAgICAnam90LWxpc3QnOiBKb3RBcHAudGVtcGxhdGVzWydqb3QtbGlzdCddLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgcm91dGVzSG9tZSA9IG5ldyBSb3V0ZXNIb21lKHJvdXRlciwgJy8nLCBjb250YWluZXJNYWluKTtcbiAgICBjb25zdCByb3V0ZXNBdXRoID0gbmV3IFJvdXRlc0F1dGgocm91dGVyLCAnL2F1dGgnLCBjb250YWluZXJNYWluKTtcbiAgICBjb25zdCByb3V0ZXNKb3QgPSBuZXcgUm91dGVzSm90KHJvdXRlciwgJy9qb3QnLCBjb250YWluZXJNYWluKTtcbiAgICBjb25zdCByb3V0ZXNHcm91cCA9IG5ldyBSb3V0ZXNHcm91cChyb3V0ZXIsICcvZ3JvdXAnLCBjb250YWluZXJNYWluKTtcblxuICAgIHJvdXRlc0hvbWUucmVnaXN0ZXJSb3V0ZXMoKTtcbiAgICByb3V0ZXNBdXRoLnJlZ2lzdGVyUm91dGVzKCk7XG4gICAgcm91dGVzSm90LnJlZ2lzdGVyUm91dGVzKCk7XG4gICAgcm91dGVzR3JvdXAucmVnaXN0ZXJSb3V0ZXMoKTtcblxuICAgIGNvbnN0IGNvbnRhaW5lckhlYWRlciA9IG5ldyBWaWV3Q29udGFpbmVyKCdoZWFkZXInLCB7XG4gICAgICB0aXRsZWJhcjogSm90QXBwLnRlbXBsYXRlcy50aXRsZWJhcixcbiAgICB9LCB7XG4gICAgICAndGl0bGViYXItdGl0bGUnOiBKb3RBcHAudGVtcGxhdGVzWyd0aXRsZWJhci10aXRsZSddLFxuICAgICAgJ3RpdGxlYmFyLXRhYnMnOiBKb3RBcHAudGVtcGxhdGVzWyd0aXRsZWJhci10YWJzJ10sXG4gICAgICAnbGlzdC1vcmRlcic6IEpvdEFwcC50ZW1wbGF0ZXNbJ2xpc3Qtb3JkZXInXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IHRpdGxlQmFyID0gbmV3IFRpdGxlQmFyVmlldyhjb250YWluZXJIZWFkZXIpO1xuXG4gICAgdGl0bGVCYXIucmVuZGVyKGZhbHNlLCB7XG4gICAgICB1c2VyOiBKb3RBcHAudXNlcixcbiAgICB9KTtcblxuICAgIGNvbnN0IGNvbnRhaW5lck5vdGlmaWNhdGlvbnMgPSBuZXcgVmlld0NvbnRhaW5lcignbm90aWZpY2F0aW9ucycsIHtcbiAgICAgIG5vdGlmaWNhdGlvbnM6IEpvdEFwcC50ZW1wbGF0ZXMubm90aWZpY2F0aW9ucyxcbiAgICB9LCB7XG4gICAgICBub3RpZmljYXRpb246IEpvdEFwcC50ZW1wbGF0ZXMubm90aWZpY2F0aW9uLFxuICAgIH0pO1xuXG4gICAgY29uc3Qgbm90aWZpY2F0aW9uTWFuYWdlciA9IG5ldyBOb3RpZmljYXRpb25NYW5hZ2VyVmlldyhjb250YWluZXJOb3RpZmljYXRpb25zKTtcblxuICAgIG5vdGlmaWNhdGlvbk1hbmFnZXIucmVuZGVyKHRydWUpO1xuXG4gICAgcm91dGVyLmFjdGl2YXRlKCk7XG4gIH0pLmNhdGNoKGV4ID0+IHtcbiAgICBjb25zb2xlLmxvZygnc29tZXRoaW5nIHdlbnQgd3Jvbmcgd2l0aCBhdXRoL3VzZXInLCBleCk7XG4gIH0pO1xufVxuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBwYWdlID0gcmVxdWlyZSgncGFnZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcblxuICByZXR1cm4ge1xuICAgIGFjdGl2YXRlOiBmdW5jdGlvbigpIHtcbiAgICAgIHBhZ2UoKTtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbihwYXRoLCBjYWxsYmFjaykge1xuICAgICAgcGFnZShwYXRoLCBjYWxsYmFjayk7XG4gICAgfSxcblxuICAgIGdvOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICBwYWdlKHBhdGgpO1xuICAgIH0sXG5cbiAgICBiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh3aW5kb3cuaGlzdG9yeS5sZW5ndGgpIHtcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFnZSgnLycpO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICBzdG9wOiBmdW5jdGlvbihwYXRoKSB7XG4gICAgICBwYWdlLnN0b3AoKTtcbiAgICAgIGlmIChwYXRoKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbiA9IHBhdGg7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG59KSgpO1xuIiwiY29uc3QgUm91dGVzID0gcmVxdWlyZSgnLi9yb3V0ZXMnKTtcblxuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi9tb2RlbHMvZ3JvdXAnKTtcblxuY2xhc3MgQXV0aFJvdXRlcyBleHRlbmRzIFJvdXRlcyB7XG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4ID0gJycpIHtcbiAgICBzdXBlcihyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLl9yb3V0ZXMuYXV0aEdvb2dsZSA9IHtcbiAgICAgIF9wYXRoOiAnL2dvb2dsZScsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9LFxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuY2FsbGJhY2tHb29nbGUgPSB7XG4gICAgICBfcGF0aDogJy9nb29nbGUvY2FsbGJhY2snLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgdGhpcy5fcm91dGVzLmltcG9ydCA9IHtcbiAgICAgIF9wYXRoOiAnL2ltcG9ydCcsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLmltcG9ydEZyb21Mb2NhbCgpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy51c2VyID0ge1xuICAgICAgX3BhdGg6ICcvdXNlcicsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9LFxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuc2lnbm91dCA9IHtcbiAgICAgIF9wYXRoOiAnL3NpZ25vdXQnLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246ICgpID0+IHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSxcbiAgICB9O1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0aFJvdXRlcztcbiIsImNvbnN0IEF1dGhSb3V0ZXMgPSByZXF1aXJlKCcuLi9hdXRoJyk7XG5jb25zdCBJbXBvcnRWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvaW1wb3J0Jyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uLy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIEF1dGhSb3V0ZXIge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCwgdmlld0NvbnRhaW5lcikge1xuICAgIHRoaXMuX2RiID0gcmVxdWlyZSgnLi4vLi4vZGIvZGInKSgpO1xuXG4gICAgdGhpcy5fcm91dGVyID0gcm91dGVyO1xuICAgIHRoaXMucm91dGVzID0gbmV3IEF1dGhSb3V0ZXMocm91dGVyLCBwcmVmaXgpO1xuXG4gICAgdGhpcy5pbXBvcnRWaWV3ID0gbmV3IEltcG9ydFZpZXcodmlld0NvbnRhaW5lcik7XG4gIH1cblxuICByZWdpc3RlclJvdXRlcygpIHtcbiAgICB0aGlzLnJvdXRlcy5yZWdpc3RlclJvdXRlKCdzaWdub3V0JywgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhcmFtczoge30sXG5cbiAgICAgICAgICByZXNvbHZlOiAoKSA9PiB7XG4gICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnam90LXVzZXInLCBmYWxzZSk7XG4gICAgICAgICAgICB0aGlzLl9kYi5kZXN0cm95KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIHRoaXMuX3JvdXRlci5zdG9wKGN0eC5jYW5vbmljYWxQYXRoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZWplY3Q6IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ2ltcG9ydCcsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHt9LFxuXG4gICAgICAgICAgcHJlQWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgncm91dGVDaGFuZ2VkJywge1xuICAgICAgICAgICAgICBuYW1lOiAnSm90JyxcbiAgICAgICAgICAgICAgb3JkZXI6IFtdLFxuICAgICAgICAgICAgICB0YWJzOiBbe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgbGluazogJy8nLFxuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdKb3RzJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2pvdCcsXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0xpc3RzJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2dyb3VwJyxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVzb2x2ZTogKGdyb3VwcykgPT4ge1xuICAgICAgICAgICAgdGhpcy5pbXBvcnRWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBncm91cHMsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVqZWN0OiAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBdXRoUm91dGVyO1xuIiwiY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vLi4vbW9kZWxzL2pvdCcpO1xuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi8uLi9tb2RlbHMvZ3JvdXAnKTtcbmNvbnN0IEdyb3VwUm91dGVzID0gcmVxdWlyZSgnLi4vZ3JvdXAnKTtcbmNvbnN0IEdyb3Vwc1ZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy9ncm91cHMnKTtcbmNvbnN0IEdyb3VwVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2dyb3VwJyk7XG5jb25zdCBMb2FkaW5nR3JvdXBzVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2xvYWRpbmdncm91cHMnKTtcblxuY29uc3QgR3JvdXBzUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi8uLi9wcmVmZXJlbmNlcy9ncm91cHMnKTtcbmNvbnN0IEdyb3VwUHJlZmVyZW5jZSA9IHJlcXVpcmUoJy4uLy4uL3ByZWZlcmVuY2VzL2dyb3VwJyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uLy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIEdyb3VwQ2xpZW50Um91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXgsIHZpZXdDb250YWluZXIpIHtcbiAgICB0aGlzLnJvdXRlcyA9IG5ldyBHcm91cFJvdXRlcyhyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLmdyb3Vwc1ZpZXcgPSBuZXcgR3JvdXBzVmlldyh2aWV3Q29udGFpbmVyKTtcbiAgICB0aGlzLmdyb3VwVmlldyA9IG5ldyBHcm91cFZpZXcodmlld0NvbnRhaW5lcik7XG4gICAgdGhpcy5sb2FkaW5nR3JvdXBzVmlldyA9IG5ldyBMb2FkaW5nR3JvdXBzVmlldyh2aWV3Q29udGFpbmVyKTtcblxuICAgIHRoaXMuX2dyb3Vwc1ByZWZlcmVuY2VzID0gbmV3IEdyb3Vwc1ByZWZlcmVuY2VzKCk7XG4gICAgdGhpcy5fZ3JvdXBQcmVmZXJlbmNlcyA9IG5ldyBHcm91cFByZWZlcmVuY2UoKTtcbiAgfVxuXG4gIHJlZ2lzdGVyUm91dGVzKCkge1xuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ2FsbCcsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgICBjb25zdCBwYWdlID0ge1xuICAgICAgICAgIG5hbWU6ICdKb3QnXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3Qgb3JkZXJpbmcgPSB7XG4gICAgICAgICAgb3JkZXJzOiBbe1xuICAgICAgICAgICAgbmFtZTogJ0FscGhhJyxcbiAgICAgICAgICAgIHR5cGU6ICdhbHBoYScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdhc2MnXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbmFtZTogJ0RhdGUnLFxuICAgICAgICAgICAgdHlwZTogJ2RhdGUnLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRhYnMgPSBbe1xuICAgICAgICAgIHRpdGxlOiAnSG9tZScsXG4gICAgICAgICAgbGluazogJy8nXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0aXRsZTogJ0pvdHMnLFxuICAgICAgICAgIGxpbms6ICcvam90J1xuICAgICAgICB9LCB7XG4gICAgICAgICAgdGl0bGU6ICdMaXN0cycsXG4gICAgICAgICAgbGluazogJy9ncm91cCcsXG4gICAgICAgICAgY3VycmVudDogdHJ1ZVxuICAgICAgICB9XTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgb3JkZXJUeXBlOiB0aGlzLl9ncm91cHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLnR5cGUsXG4gICAgICAgICAgICBvcmRlckRpcmVjdGlvbjogdGhpcy5fZ3JvdXBzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS5kaXJlY3Rpb25cbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcHJlQWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgncm91dGVDaGFuZ2VkJywge1xuICAgICAgICAgICAgICBuYW1lOiBwYWdlLm5hbWUsXG4gICAgICAgICAgICAgIG9yZGVyaW5nLFxuICAgICAgICAgICAgICBjdXJyZW50T3JkZXJpbmc6IHRoaXMuX2dyb3Vwc1ByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgICAgdGFic1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMubG9hZGluZ0dyb3Vwc1ZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGl0ZW1zOiBbMCwgMCwgMCwgMCwgMCwgMCwgMF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZXNvbHZlOiAoZ3JvdXBzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmdyb3Vwc1ZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGNvbG91cnM6IEdyb3VwLmdldENvbG91cnMoKSxcbiAgICAgICAgICAgICAgZ3JvdXBzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVqZWN0OiAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ3ZpZXcnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9yZGVyaW5nID0ge1xuICAgICAgICAgIG9yZGVyczogW3tcbiAgICAgICAgICAgIG5hbWU6ICdBbHBoYScsXG4gICAgICAgICAgICB0eXBlOiAnYWxwaGEnLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnYXNjJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdEYXRlJyxcbiAgICAgICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbmFtZTogJ1ByaW9yaXR5JyxcbiAgICAgICAgICAgIHR5cGU6ICdwcmlvcml0eScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIGlkOiBjdHgucGFyYW1zLmlkLFxuICAgICAgICAgICAgZG9uZTogY3R4LnBhcmFtcy5zdGF0dXMgPT09ICdkb25lJyxcbiAgICAgICAgICAgIG9yZGVyVHlwZTogdGhpcy5fZ3JvdXBQcmVmZXJlbmNlcy5nZXRPcmRlcigpLnR5cGUsXG4gICAgICAgICAgICBvcmRlckRpcmVjdGlvbjogdGhpcy5fZ3JvdXBQcmVmZXJlbmNlcy5nZXRPcmRlcigpLmRpcmVjdGlvbixcblxuICAgICAgICAgICAgcG9zdExvYWRHcm91cDogKGdyb3VwKSA9PiB7XG5cbiAgICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3JvdXRlQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBncm91cC5maWVsZHMubmFtZSxcbiAgICAgICAgICAgICAgICBvcmRlcmluZyxcbiAgICAgICAgICAgICAgICBjdXJyZW50T3JkZXJpbmc6IHRoaXMuX2dyb3VwUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgICAgIHRhYnM6IFt7XG4gICAgICAgICAgICAgICAgICBsaW5rOiAnL2dyb3VwLycgKyBncm91cC5pZCxcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAndW5kb25lJyxcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnQ6IGN0eC5wYXJhbXMuc3RhdHVzICE9PSAnZG9uZSdcbiAgICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgICBsaW5rOiAnL2dyb3VwLycgKyBncm91cC5pZCArICcvZG9uZScsXG4gICAgICAgICAgICAgICAgICB0aXRsZTogJ2RvbmUnLFxuICAgICAgICAgICAgICAgICAgY3VycmVudDogY3R4LnBhcmFtcy5zdGF0dXMgPT09ICdkb25lJ1xuICAgICAgICAgICAgICAgIH1dLFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChncm91cCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXVlcnlPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIGN0eC5xdWVyeXN0cmluZy5zcGxpdCgnJicpLmZvckVhY2goYml0ID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgdmFscyA9IGJpdC5zcGxpdCgnPScpO1xuICAgICAgICAgICAgICBxdWVyeU9iamVjdFt2YWxzWzBdXSA9IHZhbHNbMV07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5ncm91cFZpZXcuc2V0U2hvd0RvbmUoY3R4LnBhcmFtcy5zdGF0dXMgPT09ICdkb25lJyk7XG4gICAgICAgICAgICB0aGlzLmdyb3VwVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgZG9uZTogY3R4LnBhcmFtcy5zdGF0dXMgPT09ICdkb25lJyxcbiAgICAgICAgICAgICAgZ3JvdXAsXG4gICAgICAgICAgICAgIGVkaXRJRDogcXVlcnlPYmplY3QuZWRpdCxcbiAgICAgICAgICAgICAgcHJpb3JpdGllczogSm90LmdldFByaW9yaXRpZXMoKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZWplY3Q6IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwQ2xpZW50Um91dGVzO1xuIiwiY29uc3QgSG9tZVJvdXRlcyA9IHJlcXVpcmUoJy4uL2hvbWUnKTtcbmNvbnN0IEhvbWVWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvaG9tZScpO1xuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgSG9tZVJvdXRlciB7XG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4LCB2aWV3Q29udGFpbmVyKSB7XG4gICAgdGhpcy5yb3V0ZXMgPSBuZXcgSG9tZVJvdXRlcyhyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLmhvbWVWaWV3ID0gbmV3IEhvbWVWaWV3KHZpZXdDb250YWluZXIpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgnaG9tZScsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXJhbXM6IHt9LFxuXG4gICAgICAgICAgcHJlQWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgncm91dGVDaGFuZ2VkJywge1xuICAgICAgICAgICAgICBuYW1lOiAnSm90JyxcbiAgICAgICAgICAgICAgb3JkZXI6IFtdLFxuICAgICAgICAgICAgICB0YWJzOiBbe1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSG9tZScsXG4gICAgICAgICAgICAgICAgbGluazogJy8nLFxuICAgICAgICAgICAgICAgIGN1cnJlbnQ6IHRydWVcbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnSm90cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9qb3QnXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0xpc3RzJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnL2dyb3VwJ1xuICAgICAgICAgICAgICB9XVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuaG9tZVZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGxvYWRpbmc6IHRydWVcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZXNvbHZlOiBzdGF0cyA9PiB7XG4gICAgICAgICAgICB0aGlzLmhvbWVWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBzdGF0c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIb21lUm91dGVyO1xuIiwiY29uc3QgSm90Um91dGVzID0gcmVxdWlyZSgnLi4vam90Jyk7XG5jb25zdCBKb3RzVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2pvdHMnKTtcbmNvbnN0IExvYWRpbmdWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvbG9hZGluZycpO1xuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY29uc3QgSm90c1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vLi4vcHJlZmVyZW5jZXMvam90cycpO1xuXG5jbGFzcyBKb3RDbGllbnRSb3V0ZXMge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCwgdmlld0NvbnRhaW5lcikge1xuICAgIHRoaXMucm91dGVzID0gbmV3IEpvdFJvdXRlcyhyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLmpvdHNWaWV3ID0gbmV3IEpvdHNWaWV3KHZpZXdDb250YWluZXIpO1xuICAgIHRoaXMubG9hZGluZ1ZpZXcgPSBuZXcgTG9hZGluZ1ZpZXcodmlld0NvbnRhaW5lcik7XG5cbiAgICB0aGlzLl9qb3RzUHJlZmVyZW5jZXMgPSBuZXcgSm90c1ByZWZlcmVuY2VzKCk7XG4gIH1cblxuICByZWdpc3RlclJvdXRlcygpIHtcblxuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ2FsbCcsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3QgcGFnZSA9IHtcbiAgICAgICAgICBuYW1lOiAnSm90J1xuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IG9yZGVyaW5nID0ge1xuICAgICAgICAgIG9yZGVyczogW3tcbiAgICAgICAgICAgIG5hbWU6ICdBbHBoYScsXG4gICAgICAgICAgICB0eXBlOiAnYWxwaGEnLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnYXNjJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdEYXRlJyxcbiAgICAgICAgICAgIHR5cGU6ICdkYXRlJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbmFtZTogJ1ByaW9yaXR5JyxcbiAgICAgICAgICAgIHR5cGU6ICdwcmlvcml0eScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGFicyA9IFt7XG4gICAgICAgICAgdGl0bGU6ICdIb21lJyxcbiAgICAgICAgICBsaW5rOiAnLydcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRpdGxlOiAnSm90cycsXG4gICAgICAgICAgbGluazogJy9qb3QnLFxuICAgICAgICAgIGN1cnJlbnQ6IHRydWVcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRpdGxlOiAnTGlzdHMnLFxuICAgICAgICAgIGxpbms6ICcvZ3JvdXAnXG4gICAgICAgIH1dO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBvcmRlclR5cGU6IHRoaXMuX2pvdHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLnR5cGUsXG4gICAgICAgICAgICBvcmRlckRpcmVjdGlvbjogdGhpcy5fam90c1ByZWZlcmVuY2VzLmdldE9yZGVyKCkuZGlyZWN0aW9uXG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHByZUFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3JvdXRlQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgICAgbmFtZTogcGFnZS5uYW1lLFxuICAgICAgICAgICAgICBvcmRlcmluZyxcbiAgICAgICAgICAgICAgY3VycmVudE9yZGVyaW5nOiB0aGlzLl9qb3RzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgICB0YWJzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5sb2FkaW5nVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgaXRlbXM6IFswLCAwLCAwLCAwLCAwLCAwLCAwXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChqb3RzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmpvdHNWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBqb3RzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVqZWN0OiAoZXJyKSA9PiB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoZXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvdENsaWVudFJvdXRlcztcbiIsImNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNsYXNzIEdyb3VwUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBHcm91cC5sb2FkQWxsKHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy52aWV3ID0ge1xuICAgICAgX3BhdGg6ICcvOmlkLzpzdGF0dXM/JyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQsIHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbikudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgaWYgKHBhcmFtcy5wb3N0TG9hZEdyb3VwKSB7XG4gICAgICAgICAgICBwYXJhbXMucG9zdExvYWRHcm91cChncm91cCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXAuX2pvdHMgPSBncm91cC5nZXRKb3RzKHBhcmFtcy5kb25lKTtcbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBHcm91cCh7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBuYW1lOiBwYXJhbXMubmFtZSxcbiAgICAgICAgICAgIGNvbG91cjogcGFyYW1zLmNvbG91clxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLnJlbW92ZShwYXJhbXMuaWQpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy51cGRhdGUgPSB7XG4gICAgICBfcGF0aDogJy86aWQnLFxuICAgICAgX21ldGhvZDogWydwb3N0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICBpZiAocGFyYW1zLmFjdGlvbiAhPT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgZ3JvdXAuZmllbGRzID0gcGFyYW1zLmZpZWxkcztcblxuICAgICAgICAgICAgcmV0dXJuIGdyb3VwLnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUm91dGVzID0gcmVxdWlyZSgnLi9yb3V0ZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL2pvdCcpO1xuXG5jbGFzcyBIb21lUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5ob21lID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBKb3QuZ2V0UGVyY2VudGFnZURvbmUoKS50aGVuKHN0YXRzID0+IHtcbiAgICAgICAgICBjb25zdCBzZWdtZW50cyA9IHtcbiAgICAgICAgICAgIG9uZTogOTAsXG4gICAgICAgICAgICB0d286IDkwLFxuICAgICAgICAgICAgdGhyZWU6IDkwLFxuICAgICAgICAgICAgZm91cjogOTBcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gMjUpIHtcbiAgICAgICAgICAgIHNlZ21lbnRzLm9uZSA9IDkwIC0gKHN0YXRzLnBlcmNlbnQgLyAyNSkgKiA5MDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VnbWVudHMub25lID0gMDtcblxuICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNTApIHtcbiAgICAgICAgICAgICAgc2VnbWVudHMudHdvID0gOTAgLSAoKHN0YXRzLnBlcmNlbnQgLSAyNSkgLyAyNSkgKiA5MDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlZ21lbnRzLnR3byA9IDA7XG5cbiAgICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNzUpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy50aHJlZSA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNTApIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMudGhyZWUgPSAwO1xuXG4gICAgICAgICAgICAgICAgc2VnbWVudHMuZm91ciA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNzUpIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzdGF0cy5zZWdtZW50cyA9IHNlZ21lbnRzO1xuXG4gICAgICAgICAgaWYgKHN0YXRzLm51bUdyb3VwcyA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHBsdXJhbCA9IHN0YXRzLm51bUdyb3VwcyA9PT0gMSA/ICcnIDogJ3MnO1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9IGAke3N0YXRzLnBlcmNlbnR9JSBkb25lIGluICR7c3RhdHMubnVtR3JvdXBzfSBsaXN0JHtwbHVyYWx9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9ICdObyBsaXN0cy4gQWRkIG9uZSBub3cnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBzdGF0cztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWVSb3V0ZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcblxuY2xhc3MgSm90Um91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBKb3QubG9hZEFsbCh0cnVlLCBwYXJhbXMub3JkZXJUeXBlLCBwYXJhbXMub3JkZXJEaXJlY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBKb3Qoe1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgY29udGVudDogcGFyYW1zLmNvbnRlbnQsXG4gICAgICAgICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHBhcmFtcy5wcmlvcml0eVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5yZW1vdmUocGFyYW1zLmlkKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMudXBkYXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5sb2FkKHBhcmFtcy5pZCkudGhlbihqb3QgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEZpZWxkcyA9IGpvdC5maWVsZHM7XG5cbiAgICAgICAgICAgIGpvdC5maWVsZHMgPSBwYXJhbXMuZmllbGRzO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcy5maWVsZHMuZG9uZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgam90LmZpZWxkcy5kb25lID0gY3VycmVudEZpZWxkcy5kb25lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gam90LnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3RSb3V0ZXM7XG4iLCJjbGFzcyBSb3V0ZXMge1xuXG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4ID0gJycpIHtcbiAgICB0aGlzLl9yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5fcHJlZml4ID0gcHJlZml4O1xuXG4gICAgdGhpcy5fcm91dGVzID0ge307XG4gIH1cblxuICByZWdpc3RlclJvdXRlKG5hbWUsIGNvbmZpZykge1xuICAgIGNvbnN0IHJvdXRlID0gdGhpcy5fcm91dGVzW25hbWVdO1xuICAgIHJvdXRlLl9tZXRob2QuZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgdGhpcy5fcm91dGVyW21ldGhvZF0odGhpcy5fcHJlZml4ICsgcm91dGUuX3BhdGgsICguLi5wYXJhbXMpID0+IHtcbiAgICAgICAgY29uZmlnKC4uLnBhcmFtcykudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQucHJlQWN0aW9uKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5wcmVBY3Rpb24oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJvdXRlLl9hY3Rpb24ocmVzdWx0LnBhcmFtcylcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdC5yZXNvbHZlKTtcbiAgICAgICAgICB9KS5jYXRjaChyZXN1bHQucmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgQXV0b2xpbmtlciA9IHJlcXVpcmUoJ2F1dG9saW5rZXInKTtcblxuY29uc3QgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMvZGlzdC9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcblxuZnVuY3Rpb24gaWZFcXVhbChjb25kaXRpb25hbCwgZXF1YWxUbywgb3B0aW9ucykge1xuICBpZiAoY29uZGl0aW9uYWwgPT09IGVxdWFsVG8pIHtcbiAgICByZXR1cm4gb3B0aW9ucy5mbih0aGlzKTtcbiAgfVxuXG4gIHJldHVybiBvcHRpb25zLmludmVyc2UodGhpcyk7XG59XG5cbmZ1bmN0aW9uIGlmTm90RXF1YWwoY29uZGl0aW9uYWwsIGVxdWFsVG8sIG9wdGlvbnMpIHtcbiAgaWYgKGNvbmRpdGlvbmFsICE9PSBlcXVhbFRvKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpZkluKGVsZW0sIGFyciwgb3B0aW9ucykge1xuICBpZiAoYXJyLmluZGV4T2YoZWxlbSkgPiAtMSkge1xuICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbn1cblxuZnVuY3Rpb24gYXV0b0xpbmsoZWxlbSwgb3B0aW9ucykge1xuICBjb25zdCB1cmwgPSBBdXRvbGlua2VyLmxpbmsoSGFuZGxlYmFycy5lc2NhcGVFeHByZXNzaW9uKGVsZW0pKTtcblxuICByZXR1cm4gbmV3IEhhbmRsZWJhcnMuU2FmZVN0cmluZyh1cmwpO1xufVxuXG5leHBvcnRzLmlmRXF1YWwgPSBpZkVxdWFsO1xuZXhwb3J0cy5pZk5vdEVxdWFsID0gaWZOb3RFcXVhbDtcbmV4cG9ydHMuaWZJbiA9IGlmSW47XG5leHBvcnRzLmF1dG9MaW5rID0gYXV0b0xpbms7XG4iLCJjbGFzcyBEYXRlVXRpbHMge1xuXG4gIHN0YXRpYyBnZXREYXlzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnU3VuJyxcbiAgICAgICdNb24nLFxuICAgICAgJ1R1ZScsXG4gICAgICAnV2VkJyxcbiAgICAgICdUaHUnLFxuICAgICAgJ0ZyaScsXG4gICAgICAnU2F0J1xuICAgIF07XG4gIH1cblxuICBzdGF0aWMgZ2V0TW9udGhzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnSmFuJyxcbiAgICAgICdGZWInLFxuICAgICAgJ01hcicsXG4gICAgICAnQXByJyxcbiAgICAgICdNYXknLFxuICAgICAgJ0p1bicsXG4gICAgICAnSnVsJyxcbiAgICAgICdBdWcnLFxuICAgICAgJ1NlcCcsXG4gICAgICAnT2N0JyxcbiAgICAgICdOb3YnLFxuICAgICAgJ0RlYydcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGZvcm1hdChkYXRlKSB7XG4gICAgY29uc3QgZGF5ID0gZGF0ZS5nZXREYXkoKTtcbiAgICBjb25zdCBkYXlOdW0gPSBkYXRlLmdldERhdGUoKTtcbiAgICBjb25zdCBtb250aE51bSA9IGRhdGUuZ2V0TW9udGgoKTtcbiAgICBjb25zdCBtaW51dGVzID0gdGhpcy5fcGFkKGRhdGUuZ2V0TWludXRlcygpLCAyKTtcbiAgICBjb25zdCBob3VycyA9IHRoaXMuX3BhZChkYXRlLmdldEhvdXJzKCksIDIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZ2V0RGF5cygpW2RheV0gKyAnICcgKyBkYXlOdW0gKyAnICcgKyB0aGlzLmdldE1vbnRocygpW21vbnRoTnVtXSArICcgJyArIGhvdXJzICsgJzonICsgbWludXRlcztcbiAgfVxuXG4gIHN0YXRpYyBfcGFkKG51bSwgc2l6ZSkge1xuICAgIGNvbnN0IHMgPSAnMDAwMDAwMDAwJyArIG51bTtcbiAgICByZXR1cm4gcy5zdWJzdHIocy5sZW5ndGggLSBzaXplKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGVVdGlscztcbiIsImNsYXNzIFB1YlN1YiB7XG4gIC8vYmFzZWQgb24gcHVic3ViIGltcGxlbWVudGF0aW9uIGF0IGh0dHA6Ly9hZGR5b3NtYW5pLmNvbS9yZXNvdXJjZXMvZXNzZW50aWFsanNkZXNpZ25wYXR0ZXJucy9ib29rLyNvYnNlcnZlcnBhdHRlcm5qYXZhc2NyaXB0XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gU3RvcmFnZSBmb3IgdG9waWNzIHRoYXQgY2FuIGJlIGJyb2FkY2FzdFxuICAgIC8vIG9yIGxpc3RlbmVkIHRvXG4gICAgdGhpcy5fdG9waWNzID0ge307XG5cbiAgICAvLyBBbiB0b3BpYyBpZGVudGlmaWVyXG4gICAgdGhpcy5fc3ViVWlkID0gLTE7XG4gIH1cblxuICAvLyBQdWJsaXNoIG9yIGJyb2FkY2FzdCBldmVudHMgb2YgaW50ZXJlc3RcbiAgLy8gd2l0aCBhIHNwZWNpZmljIHRvcGljIG5hbWUgYW5kIGFyZ3VtZW50c1xuICAvLyBzdWNoIGFzIHRoZSBkYXRhIHRvIHBhc3MgYWxvbmdcbiAgcHVibGlzaCh0b3BpYywgYXJncykge1xuICAgIGlmICghdGhpcy5fdG9waWNzW3RvcGljXSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHZhciBzdWJzY3JpYmVycyA9IHRoaXMuX3RvcGljc1t0b3BpY107XG4gICAgdmFyIGxlbiA9IHN1YnNjcmliZXJzID8gc3Vic2NyaWJlcnMubGVuZ3RoIDogMDtcblxuICAgIHdoaWxlIChsZW4tLSkge1xuICAgICAgc3Vic2NyaWJlcnNbbGVuXS5mdW5jKHRvcGljLCBhcmdzKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIFN1YnNjcmliZSB0byBldmVudHMgb2YgaW50ZXJlc3RcbiAgLy8gd2l0aCBhIHNwZWNpZmljIHRvcGljIG5hbWUgYW5kIGFcbiAgLy8gY2FsbGJhY2sgZnVuY3Rpb24sIHRvIGJlIGV4ZWN1dGVkXG4gIC8vIHdoZW4gdGhlIHRvcGljL2V2ZW50IGlzIG9ic2VydmVkXG4gIHN1YnNjcmliZSh0b3BpYywgZnVuYykge1xuICAgIGlmICghdGhpcy5fdG9waWNzW3RvcGljXSkge1xuICAgICAgdGhpcy5fdG9waWNzW3RvcGljXSA9IFtdO1xuICAgIH1cblxuICAgIHZhciB0b2tlbiA9ICgrK3RoaXMuX3N1YlVpZCkudG9TdHJpbmcoKTtcbiAgICB0aGlzLl90b3BpY3NbdG9waWNdLnB1c2goe1xuICAgICAgdG9rZW46IHRva2VuLFxuICAgICAgZnVuYzogZnVuY1xuICAgIH0pO1xuXG4gICAgcmV0dXJuIHRva2VuO1xuICB9XG5cbiAgLy8gVW5zdWJzY3JpYmUgZnJvbSBhIHNwZWNpZmljXG4gIC8vIHRvcGljLCBiYXNlZCBvbiBhIHRva2VuaXplZCByZWZlcmVuY2VcbiAgLy8gdG8gdGhlIHN1YnNjcmlwdGlvblxuICB1bnN1YnNjcmliZSh0b2tlbikge1xuICAgIGZvciAodmFyIG0gaW4gdGhpcy5fdG9waWNzKSB7XG4gICAgICBpZiAodGhpcy5fdG9waWNzW21dKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gdGhpcy5fdG9waWNzW21dLmxlbmd0aDsgaSA8IGo7IGkrKykge1xuICAgICAgICAgIGlmICh0aGlzLl90b3BpY3NbbV1baV0udG9rZW4gPT09IHRva2VuKSB7XG4gICAgICAgICAgICB0aGlzLl90b3BpY3NbbV0uc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHRva2VuO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gbmV3IFB1YlN1YigpO1xuIiwiY2xhc3MgVG91Y2gge1xuICBjb25zdHJ1Y3RvcihlbGVtZW50KSB7XG4gICAgdGhpcy5fZWxlbWVudCA9IGVsZW1lbnQgfHwgbnVsbDtcblxuICAgIHRoaXMuX3hEb3duID0gbnVsbDtcbiAgICB0aGlzLl95RG93biA9IG51bGw7XG5cbiAgICB0aGlzLl9yZWdpc3RlcmVkID0ge1xuICAgICAgbGVmdDogW10sXG4gICAgICByaWdodDogW10sXG4gICAgICB1cDogW10sXG4gICAgICBkb3duOiBbXVxuICAgIH07XG5cbiAgICB0aGlzLmhhbmRsZVRvdWNoU3RhcnQgPSB0aGlzLmhhbmRsZVRvdWNoU3RhcnQuYmluZCh0aGlzKTtcbiAgICB0aGlzLmhhbmRsZVRvdWNoTW92ZSA9IHRoaXMuaGFuZGxlVG91Y2hNb3ZlLmJpbmQodGhpcyk7XG4gIH1cblxuICBzZXRFbGVtZW50KGVsZW1lbnQpIHtcbiAgICB0aGlzLmRlc3Ryb3koKTtcblxuICAgIHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50O1xuXG4gICAgdGhpcy5fZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5oYW5kbGVUb3VjaFN0YXJ0LCBmYWxzZSk7XG4gICAgdGhpcy5fZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLmhhbmRsZVRvdWNoTW92ZSwgZmFsc2UpO1xuICB9XG5cbiAgcmVnaXN0ZXIoZGlyZWN0aW9uLCBmbikge1xuICAgIHRoaXMuX3JlZ2lzdGVyZWRbZGlyZWN0aW9uXS5wdXNoKGZuKTtcbiAgfVxuXG4gIGhhbmRsZVRvdWNoU3RhcnQoZXZ0KSB7XG4gICAgdGhpcy5feERvd24gPSBldnQudG91Y2hlc1swXS5jbGllbnRYO1xuICAgIHRoaXMuX3lEb3duID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WTtcbiAgfVxuXG4gIGhhbmRsZVRvdWNoTW92ZShldnQpIHtcbiAgICBpZiAoICEgdGhpcy5feERvd24gfHwgISB0aGlzLl95RG93biApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciB4VXAgPSBldnQudG91Y2hlc1swXS5jbGllbnRYO1xuICAgIHZhciB5VXAgPSBldnQudG91Y2hlc1swXS5jbGllbnRZO1xuXG4gICAgdmFyIHhEaWZmID0gdGhpcy5feERvd24gLSB4VXA7XG4gICAgdmFyIHlEaWZmID0gdGhpcy5feURvd24gLSB5VXA7XG5cbiAgICBpZiAoIE1hdGguYWJzKCB4RGlmZiApID4gTWF0aC5hYnMoIHlEaWZmICkgKSB7XG4gICAgICAgIGlmICggeERpZmYgPiAwICkge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJlZC5sZWZ0LmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlcmVkLnJpZ2h0LmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIHlEaWZmID4gMCApIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWQudXAuZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWQuZG93bi5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5feERvd24gPSBudWxsO1xuICAgIHRoaXMuX3lEb3duID0gbnVsbDtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgaWYgKHRoaXMuX2VsZW1lbnQpIHtcbiAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuaGFuZGxlVG91Y2hTdGFydCwgZmFsc2UpO1xuICAgICAgdGhpcy5fZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLmhhbmRsZVRvdWNoTW92ZSwgZmFsc2UpO1xuICAgIH1cblxuICAgIHRoaXMuX2VsZW1lbnQgPSBudWxsO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVG91Y2g7XG4iLCJjb25zdCBXaWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpO1xuXG5jbGFzcyBDb2xvdXJTZWxlY3RvciBleHRlbmRzIFdpZGdldCB7XG4gIGluaXRFdmVudHMoZWwpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICBjb25zdCB3aWRnZXRzID0gZWwucXVlcnlTZWxlY3RvckFsbCgnLnBhcnRpYWwtY29sb3VyLXNlbGVjdG9yJyk7XG4gICAgZm9yIChsZXQgd2lkZ2V0IG9mIHdpZGdldHMpIHtcbiAgICAgIGNvbnN0IG9wdGlvbnMgPSB3aWRnZXQucXVlcnlTZWxlY3RvckFsbCgnLmNvbG91ci1zZWxlY3Rvcl9fY29sb3VyJyk7XG4gICAgICBjb25zdCBzZWxlY3QgPSB3aWRnZXQucXVlcnlTZWxlY3Rvcignc2VsZWN0Jyk7XG5cbiAgICAgIGZvciAobGV0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKG9wdGlvbnMpO1xuICAgICAgICAgIG9wdGlvbi5jbGFzc0xpc3QuYWRkKCdjb2xvdXItc2VsZWN0b3JfX2NvbG91ci0tY3VycmVudCcpO1xuICAgICAgICAgIHNlbGVjdC52YWx1ZSA9IG9wdGlvbi5kYXRhc2V0LnZhbHVlO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB1bnNlbGVjdEFsbChvcHRpb25zKSB7XG4gICAgZm9yIChsZXQgb3B0aW9uIG9mIG9wdGlvbnMpIHtcbiAgICAgIG9wdGlvbi5jbGFzc0xpc3QucmVtb3ZlKCdjb2xvdXItc2VsZWN0b3JfX2NvbG91ci0tY3VycmVudCcpO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IENvbG91clNlbGVjdG9yO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNvbnN0IEdyb3VwUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi9wcmVmZXJlbmNlcy9ncm91cCcpO1xuXG5jb25zdCBDb2xvdXJTZWxlY3RvcldpZGdldCA9IHJlcXVpcmUoJy4vY29sb3VyLXNlbGVjdG9yJyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIFZpZXdHcm91cCBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICBzdXBlcihjb250YWluZXIpO1xuXG4gICAgdGhpcy5yZWdpc3RlcldpZGdldChDb2xvdXJTZWxlY3RvcldpZGdldCk7XG5cbiAgICB0aGlzLl9zaG93RG9uZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5fcHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBQcmVmZXJlbmNlcygpO1xuICB9XG5cbiAgc2V0U2hvd0RvbmUoZG9uZSkge1xuICAgIHRoaXMuX3Nob3dEb25lID0gZG9uZTtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3VwZGF0ZScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MuY2hhbmdlcyAmJiBhcmdzLmNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIEdyb3VwLmxvYWQocGFyYW1zLmdyb3VwLmlkKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2pvdC1saXN0Jywge1xuICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ29yZGVyQ2hhbmdlZCcsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgdGhpcy5fcHJlZmVyZW5jZXMuc2V0T3JkZXIoYXJncy50eXBlLCBhcmdzLmRpcmVjdGlvbik7XG5cbiAgICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMubGFzdFBhcmFtcztcbiAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCBwYXJhbXMpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuX2FkZERvY3VtZW50TGlzdGVuZXIoJ3Vuc2VsZWN0QWxsJywgJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2pvdC1saXN0JzpcbiAgICAgICAgcGFyYW1zLmpvdHMgPSBwYXJhbXMuZ3JvdXAuZ2V0Sm90cyh0aGlzLl9zaG93RG9uZSk7XG4gICAgICAgIHBhcmFtcy5qb3RzID0gdGhpcy5fcHJlZmVyZW5jZXMub3JkZXIocGFyYW1zLmpvdHMpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBlbCA9IHN1cGVyLnJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKTtcblxuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgY2FzZSAnam90LWxpc3QnOlxuICAgICAgICB0aGlzLmluaXRFZGl0KCk7XG4gICAgICAgIHRoaXMuaW5pdERlbGV0ZUZvcm1zKCk7XG4gICAgICAgIHRoaXMuaW5pdFVwZGF0ZUZvcm1zKCk7XG4gICAgICAgIHRoaXMuaW5pdFdpZGdldHMoZWwpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBpbml0RXZlbnRzKCkge1xuICAgIHN1cGVyLmluaXRFdmVudHMoKTtcblxuICAgIHRoaXMuaW5pdEFkZEZvcm0oKTtcbiAgICB0aGlzLmluaXRFZGl0KCk7XG4gICAgdGhpcy5pbml0RGVsZXRlRm9ybXMoKTtcbiAgICB0aGlzLmluaXRVcGRhdGVGb3JtcygpO1xuICB9XG5cbiAgaW5pdEFkZEZvcm0oKSB7XG4gICAgY29uc3QgZm9ybSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5mb3JtLWpvdC1hZGQnKTtcbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IGNvbnRlbnRGaWVsZCA9IGZvcm0uZWxlbWVudHMuY29udGVudDtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBjb250ZW50RmllbGQudmFsdWU7XG5cbiAgICAgIGNvbnN0IGdyb3VwRmllbGQgPSBmb3JtLmVsZW1lbnRzLmdyb3VwO1xuICAgICAgY29uc3QgZ3JvdXAgPSBncm91cEZpZWxkLnZhbHVlO1xuXG4gICAgICBjb25zdCBwcmlvcml0eSA9IGZvcm0uZWxlbWVudHMucHJpb3JpdHkudmFsdWU7XG5cbiAgICAgIG5ldyBKb3Qoe1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgIGdyb3VwLFxuICAgICAgICAgIHByaW9yaXR5XG4gICAgICAgIH1cbiAgICAgIH0pLnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29udGVudEZpZWxkLnZhbHVlID0gJyc7XG4gICAgICAgIC8vY29udGVudEZpZWxkLmZvY3VzKCk7XG4gICAgICAgIGNvbnRlbnRGaWVsZC5ibHVyKCk7XG4gICAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0b1Nob3cgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy5zaG93LW9uLWZvY3VzJyk7XG5cbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICB0b1Nob3cuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgIH0pO1xuICB9XG5cbiAgaW5pdEVkaXQoKSB7XG4gICAgY29uc3QgbGlua3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuam90c19fam90X19lZGl0Jyk7XG4gICAgZm9yIChsZXQgbGluayBvZiBsaW5rcykge1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvL3N0b3AgZG9jdW1lbnQgbGlzdGVuZXIgZnJvbSByZW1vdmluZyAnZWRpdCcgY2xhc3NcblxuICAgICAgICBjb25zdCBpZCA9IGxpbmsuZGF0YXNldC5pZDtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5qb3RzX19qb3QtJyArIGlkKTtcblxuICAgICAgICBpZiAoIWl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0JykpIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG5cbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXQnKTtcblxuICAgICAgICAgIC8vY29uc3QgY29udGVudEZpZWxkID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0tam90LXVwZGF0ZS0nICsgaWQpLmVsZW1lbnRzLmNvbnRlbnQ7XG4gICAgICAgICAgLy9jb250ZW50RmllbGQuZm9jdXMoKTtcbiAgICAgICAgICAvL2NvbnRlbnRGaWVsZC52YWx1ZSA9IGNvbnRlbnRGaWVsZC52YWx1ZTsgLy9mb3JjZXMgY3Vyc29yIHRvIGdvIHRvIGVuZCBvZiB0ZXh0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB1bnNlbGVjdEFsbCgpIHtcbiAgICAvL1RPRE86IGhhdmUgY2xhc3MgbWVtYmVyIHRvIGhvbGQgcmVmZXJlbmNlIHRvIGNvbW1vbiBlbGVtZW50L2VsZW1lbnQgZ3JvdXBzIHRvIGF2b2lkIHJlcXVlcnlpbmdcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5qb3RzX19qb3QnKTtcbiAgICBmb3IgKGxldCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaG93cyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zaG93LW9uLWZvY3VzJyk7XG4gICAgZm9yIChsZXQgc2hvdyBvZiBzaG93cykge1xuICAgICAgc2hvdy5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgaW5pdERlbGV0ZUZvcm1zKCkge1xuICAgIGNvbnN0IGZvcm1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmZvcm0tam90LWRlbGV0ZScpO1xuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IGlkID0gZm9ybS5kYXRhc2V0LmlkO1xuICAgICAgICBjb25zdCBncm91cCA9IGZvcm0uZGF0YXNldC5ncm91cElkO1xuXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuam90c19fam90LScgKyBpZCk7XG4gICAgICAgIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcblxuICAgICAgICBKb3QubG9hZChpZCkudGhlbihqb3QgPT4ge1xuICAgICAgICAgIEpvdC5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdub3RpZnknLCB7XG4gICAgICAgICAgICAgIHRpdGxlOiAnSm90IGRlbGV0ZWQnLFxuICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndW5kbycsXG4gICAgICAgICAgICAgICAgZm46ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgam90LnJldiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGpvdC5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdyb3VwLmxvYWQoZ3JvdXApLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtc2c6ICdKb3QgdW5kZWxldGVkJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGluaXRVcGRhdGVGb3JtcygpIHtcbiAgICBjb25zdCBmb3JtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mb3JtLWpvdC11cGRhdGUnKTtcblxuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGNvbnN0IGRvbmVCdXR0b24gPSBmb3JtLmVsZW1lbnRzLmRvbmU7XG4gICAgICBjb25zdCB1bmRvbmVCdXR0b24gPSBmb3JtLmVsZW1lbnRzLnVuZG9uZTtcblxuICAgICAgaWYgKGRvbmVCdXR0b24pIHtcbiAgICAgICAgZG9uZUJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICBmb3JtLmVsZW1lbnRzWydkb25lLXN0YXR1cyddLnZhbHVlID0gJ2RvbmUnO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHVuZG9uZUJ1dHRvbikge1xuICAgICAgICB1bmRvbmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgZm9ybS5lbGVtZW50c1snZG9uZS1zdGF0dXMnXS52YWx1ZSA9ICd1bmRvbmUnO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvL3N0b3AgZG9jdW1lbnQgbGlzdGVuZXIgZnJvbSByZW1vdmluZyAnZWRpdCcgY2xhc3NcbiAgICAgIH0pO1xuXG4gICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjb25zdCBpZCA9IGZvcm0uZGF0YXNldC5pZDtcblxuICAgICAgICBjb25zdCBjb250ZW50ID0gZm9ybS5lbGVtZW50cy5jb250ZW50LnZhbHVlO1xuICAgICAgICBjb25zdCBncm91cCA9IGZvcm0uZWxlbWVudHMuZ3JvdXAudmFsdWU7XG4gICAgICAgIGNvbnN0IGRvbmVTdGF0dXMgPSBmb3JtLmVsZW1lbnRzWydkb25lLXN0YXR1cyddLnZhbHVlO1xuICAgICAgICBjb25zdCBwcmlvcml0eSA9IGZvcm0uZWxlbWVudHMucHJpb3JpdHkudmFsdWU7XG5cbiAgICAgICAgSm90LmxvYWQoaWQpLnRoZW4oam90ID0+IHtcblxuICAgICAgICAgIGNvbnN0IGN1cnJlbnRGaWVsZHMgPSBqb3QuZmllbGRzO1xuXG4gICAgICAgICAgam90LmZpZWxkcyA9IHtcbiAgICAgICAgICAgIGNvbnRlbnQsXG4gICAgICAgICAgICBncm91cCxcbiAgICAgICAgICAgIHByaW9yaXR5XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChkb25lU3RhdHVzID09PSAnZG9uZScpIHtcbiAgICAgICAgICAgIGpvdC5maWVsZHMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIGlmIChkb25lU3RhdHVzID09PSAndW5kb25lJykge1xuICAgICAgICAgICAgam90LmZpZWxkcy5kb25lID0gZmFsc2U7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGpvdC5maWVsZHMuZG9uZSA9IGN1cnJlbnRGaWVsZHMuZG9uZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBqb3Quc2F2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZChncm91cCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgZ3JvdXBcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3R3JvdXA7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuLi9tb2RlbHMvZ3JvdXAnKTtcblxuY29uc3QgR3JvdXBzUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuLi9wcmVmZXJlbmNlcy9ncm91cHMnKTtcblxuY29uc3QgQ29sb3VyU2VsZWN0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2NvbG91ci1zZWxlY3RvcicpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3R3JvdXBzIGV4dGVuZHMgVmlldyB7XG5cbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJXaWRnZXQoQ29sb3VyU2VsZWN0b3JXaWRnZXQpO1xuXG4gICAgdGhpcy5fcHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBzUHJlZmVyZW5jZXMoKTtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3VwZGF0ZScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MuY2hhbmdlcyAmJiBhcmdzLmNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgZ3JvdXBzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdvcmRlckNoYW5nZWQnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuX3ByZWZlcmVuY2VzLnNldE9yZGVyKGFyZ3MudHlwZSwgYXJncy5kaXJlY3Rpb24pO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmxhc3RQYXJhbXM7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2dyb3VwLWxpc3QnLCBwYXJhbXMpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuX2FkZERvY3VtZW50TGlzdGVuZXIoJ3Vuc2VsZWN0QWxsJywgJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpIHtcbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2dyb3VwLWxpc3QnOlxuICAgICAgICBwYXJhbXMuZ3JvdXBzID0gdGhpcy5fcHJlZmVyZW5jZXMub3JkZXIocGFyYW1zLmdyb3Vwcyk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGNvbnN0IGVsID0gc3VwZXIucmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpO1xuXG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdncm91cC1saXN0JzpcbiAgICAgICAgdGhpcy5pbml0RWRpdCgpO1xuICAgICAgICB0aGlzLmluaXREZWxldGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRVcGRhdGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRXaWRnZXRzKGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRBZGRGb3JtKCk7XG4gICAgdGhpcy5pbml0RWRpdCgpO1xuICAgIHRoaXMuaW5pdERlbGV0ZUZvcm1zKCk7XG4gICAgdGhpcy5pbml0VXBkYXRlRm9ybXMoKTtcbiAgfVxuXG4gIGluaXRBZGRGb3JtKCkge1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuZm9ybS1ncm91cC1hZGQnKTtcbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgIGNvbnN0IG5hbWVGaWVsZCA9IGZvcm0uZWxlbWVudHMubmFtZTtcbiAgICAgIGNvbnN0IG5hbWUgPSBuYW1lRmllbGQudmFsdWU7XG5cbiAgICAgIGNvbnN0IGNvbG91ciA9IGZvcm0uZWxlbWVudHMuY29sb3VyLnZhbHVlO1xuXG4gICAgICBuZXcgR3JvdXAoe1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBuYW1lLFxuICAgICAgICAgIGNvbG91cixcbiAgICAgICAgfSxcbiAgICAgIH0pLnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgbmFtZUZpZWxkLnZhbHVlID0gJyc7XG4gICAgICAgIC8vbmFtZUZpZWxkLmZvY3VzKCk7XG4gICAgICAgIG5hbWVGaWVsZC5ibHVyKCk7XG4gICAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgICAgR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2dyb3VwLWxpc3QnLCB7XG4gICAgICAgICAgICBncm91cHNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHRvU2hvdyA9IGZvcm0ucXVlcnlTZWxlY3RvcignLnNob3ctb24tZm9jdXMnKTtcblxuICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgIHRvU2hvdy5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgfSk7XG4gIH1cblxuICBpbml0RWRpdCgpIHtcbiAgICBjb25zdCBlZGl0TGlua3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuZ3JvdXBzX19ncm91cF9fZWRpdCcpO1xuICAgIGZvciAobGV0IGxpbmsgb2YgZWRpdExpbmtzKSB7XG4gICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgIC8vc3RvcCBkb2N1bWVudCBsaXN0ZW5lciBmcm9tIHJlbW92aW5nICdlZGl0JyBjbGFzc1xuXG4gICAgICAgIGNvbnN0IGlkID0gbGluay5kYXRhc2V0LmlkO1xuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmdyb3Vwc19fZ3JvdXAtJyArIGlkKTtcblxuICAgICAgICBpZiAoIWl0ZW0uY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0JykpIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG5cbiAgICAgICAgICBpdGVtLmNsYXNzTGlzdC5hZGQoJ2VkaXQnKTtcblxuICAgICAgICAgIC8vY29uc3QgbmFtZUZpZWxkID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0tZ3JvdXAtdXBkYXRlLScgKyBpZCkuZWxlbWVudHMubmFtZTtcbiAgICAgICAgICAvL25hbWVGaWVsZC5mb2N1cygpO1xuICAgICAgICAgIC8vbmFtZUZpZWxkLnZhbHVlID0gbmFtZUZpZWxkLnZhbHVlOyAvL2ZvcmNlcyBjdXJzb3IgdG8gZ28gdG8gZW5kIG9mIHRleHRcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHVuc2VsZWN0QWxsKCkge1xuICAgIC8vVE9ETzogaGF2ZSBjbGFzcyBtZW1iZXIgdG8gaG9sZCByZWZlcmVuY2UgdG8gY29tbW9uIGVsZW1lbnQvZWxlbWVudCBncm91cHMgdG8gYXZvaWQgcmVxdWVyeWluZ1xuICAgIGNvbnN0IGl0ZW1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmdyb3Vwc19fZ3JvdXAnKTtcbiAgICBmb3IgKGxldCBpdGVtIG9mIGl0ZW1zKSB7XG4gICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoJ2VkaXQnKTtcbiAgICB9XG5cbiAgICBjb25zdCBzaG93cyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5zaG93LW9uLWZvY3VzJyk7XG4gICAgZm9yIChsZXQgc2hvdyBvZiBzaG93cykge1xuICAgICAgc2hvdy5jbGFzc0xpc3QucmVtb3ZlKCdzaG93Jyk7XG4gICAgfVxuICB9XG5cbiAgaW5pdERlbGV0ZUZvcm1zKCkge1xuICAgIGNvbnN0IGZvcm1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmZvcm0tZ3JvdXAtZGVsZXRlJyk7XG4gICAgZm9yIChsZXQgZm9ybSBvZiBmb3Jtcykge1xuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLmRhdGFzZXQuaWQ7XG5cbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5ncm91cHNfX2dyb3VwLScgKyBpZCk7XG4gICAgICAgIGl0ZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChpdGVtKTtcblxuICAgICAgICBHcm91cC5sb2FkKGlkKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgICBHcm91cC5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ25vdGlmeScsIHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdMaXN0IGRlbGV0ZWQnLFxuICAgICAgICAgICAgICBhY3Rpb246IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAndW5kbycsXG4gICAgICAgICAgICAgICAgZm46ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAucmV2ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXAuc2F2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZG9jcyA9IGdyb3VwLmpvdHMubWFwKGpvdCA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBfcmV2OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBfaWQ6IGpvdC5pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0ZUFkZGVkOiBqb3QuX2RhdGVBZGRlZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBqb3QuZmllbGRzXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBqb3QucmV2ID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBqb3Q7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICBjb25zdCBkYiA9IHJlcXVpcmUoJy4uL2RiL2RiJykoKTtcbiAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGIuYnVsa0RvY3MoZG9jcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gR3JvdXAubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIG1zZzogJ0xpc3QgdW5kZWxldGVkJ1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbml0VXBkYXRlRm9ybXMoKSB7XG4gICAgY29uc3QgZm9ybXMgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuZm9ybS1ncm91cC11cGRhdGUnKTtcblxuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyAgLy9zdG9wIGRvY3VtZW50IGxpc3RlbmVyIGZyb20gcmVtb3ZpbmcgJ2VkaXQnIGNsYXNzXG4gICAgICB9KTtcblxuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLmRhdGFzZXQuaWQ7XG5cbiAgICAgICAgY29uc3QgbmFtZSA9IGZvcm0uZWxlbWVudHMubmFtZS52YWx1ZTtcbiAgICAgICAgY29uc3QgY29sb3VyID0gZm9ybS5lbGVtZW50cy5jb2xvdXIudmFsdWU7XG5cbiAgICAgICAgR3JvdXAubG9hZChpZCkudGhlbihncm91cCA9PiB7XG5cbiAgICAgICAgICBncm91cC5maWVsZHMgPSB7XG4gICAgICAgICAgICBuYW1lLFxuICAgICAgICAgICAgY29sb3VyXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGdyb3VwLnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnZ3JvdXAtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICBncm91cHNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdHcm91cHM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY2xhc3MgVmlld0hvbWUgZXh0ZW5kcyBWaWV3IHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdIb21lO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNvbnN0IHJvdXRlciA9IHJlcXVpcmUoJy4uL3JvdXRlcnMvcGF0aCcpO1xuXG5jbGFzcyBWaWV3SW1wb3J0IGV4dGVuZHMgVmlldyB7XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRJbXBvcnRGb3JtKCk7XG4gIH1cblxuICBpbml0SW1wb3J0Rm9ybSgpIHtcbiAgICBjb25zdCBmb3JtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0taW1wb3J0Jyk7XG5cbiAgICBpZiAoZm9ybSkge1xuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgR3JvdXAuaW1wb3J0RnJvbUxvY2FsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgIGNvbnN0IGdyb3VwUHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAgIGdyb3Vwcy5mb3JFYWNoKGdyb3VwID0+IHtcbiAgICAgICAgICAgIGdyb3VwUHJvbWlzZXMucHVzaCgobmV3R3JvdXBzKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBHcm91cC5pbnNlcnQoe1xuICAgICAgICAgICAgICAgIGZpZWxkczogZ3JvdXAuZmllbGRzLFxuICAgICAgICAgICAgICAgIGRhdGVBZGRlZDogZ3JvdXAuX2RhdGVBZGRlZFxuICAgICAgICAgICAgICB9KS50aGVuKG5ld0dyb3VwID0+IHtcbiAgICAgICAgICAgICAgICBuZXdHcm91cHMucHVzaChuZXdHcm91cCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ld0dyb3VwcztcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxldCBncm91cFByb21pc2VDaGFpbiA9IFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgICAgICAgZ3JvdXBQcm9taXNlcy5mb3JFYWNoKGdyb3VwUHJvbWlzZSA9PiB7XG4gICAgICAgICAgICBncm91cFByb21pc2VDaGFpbiA9IGdyb3VwUHJvbWlzZUNoYWluLnRoZW4oZ3JvdXBQcm9taXNlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBncm91cFByb21pc2VDaGFpbi50aGVuKG5ld0dyb3VwcyA9PiB7XG4gICAgICAgICAgICBjb25zdCBqb3RQcm9taXNlcyA9IFtdO1xuXG4gICAgICAgICAgICBncm91cHMuZm9yRWFjaCgoZ3JvdXAsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgIGdyb3VwLmpvdHMuZm9yRWFjaChqb3QgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IG5ld0ZpZWxkcyA9IGpvdC5maWVsZHM7XG4gICAgICAgICAgICAgICAgbmV3RmllbGRzLmdyb3VwID0gbmV3R3JvdXBzW2luZGV4XS5pZDtcbiAgICAgICAgICAgICAgICBqb3RQcm9taXNlcy5wdXNoKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBKb3QuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGRzOiBuZXdGaWVsZHMsXG4gICAgICAgICAgICAgICAgICAgIGRhdGVBZGRlZDogam90Ll9kYXRlQWRkZWRcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICBsZXQgam90UHJvbWlzZUNoYWluID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICBqb3RQcm9taXNlcy5mb3JFYWNoKGpvdFByb21pc2UgPT4ge1xuICAgICAgICAgICAgICBqb3RQcm9taXNlQ2hhaW4gPSBqb3RQcm9taXNlQ2hhaW4udGhlbihqb3RQcm9taXNlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gam90UHJvbWlzZUNoYWluO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLnJlbW92ZUZyb21Mb2NhbCgpO1xuICAgICAgICB9KVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ25vdGlmeScsIHtcbiAgICAgICAgICAgIHRpdGxlOiAnSm90cyBpbXBvcnRlZCdcbiAgICAgICAgICB9KTtcbiAgICAgICAgICByb3V0ZXIuZ28oJy9ncm91cCcpO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdJbXBvcnQ7XG4iLCJjb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcblxuY29uc3QgSm90c1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vcHJlZmVyZW5jZXMvam90cycpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3Sm90cyBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICBzdXBlcihjb250YWluZXIpO1xuXG4gICAgdGhpcy5fcHJlZmVyZW5jZXMgPSBuZXcgSm90c1ByZWZlcmVuY2VzKCk7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHBhcmFtcy5qb3RzID0gdGhpcy5fcHJlZmVyZW5jZXMub3JkZXIocGFyYW1zLmpvdHMpO1xuXG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3VwZGF0ZScsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgaWYgKGFyZ3MuY2hhbmdlcyAmJiBhcmdzLmNoYW5nZXMubGVuZ3RoKSB7XG4gICAgICAgIEpvdC5sb2FkQWxsKCkudGhlbihqb3RzID0+IHtcbiAgICAgICAgICB0aGlzLnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgam90c1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goUHViU3ViLnN1YnNjcmliZSgnb3JkZXJDaGFuZ2VkJywgKHRvcGljLCBhcmdzKSA9PiB7XG4gICAgICB0aGlzLl9wcmVmZXJlbmNlcy5zZXRPcmRlcihhcmdzLnR5cGUsIGFyZ3MuZGlyZWN0aW9uKTtcblxuICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5sYXN0UGFyYW1zO1xuICAgICAgdGhpcy5yZW5kZXIoZmFsc2UsIHBhcmFtcyk7XG4gICAgfSkpO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3Sm90cztcbiIsImNvbnN0IFdpZGdldCA9IHJlcXVpcmUoJy4vd2lkZ2V0Jyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIExpc3RPcmRlciBleHRlbmRzIFdpZGdldCB7XG4gIGluaXRFdmVudHMoZWwpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICBsZXQgd2lkZ2V0cztcbiAgICBpZiAoZWwuY2xhc3NMaXN0LmNvbnRhaW5zKCdwYXJ0aWFsLWxpc3Qtb3JkZXInKSkge1xuICAgICAgd2lkZ2V0cyA9IFtlbF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpZGdldHMgPSBlbC5xdWVyeVNlbGVjdG9yQWxsKCcucGFydGlhbC1saXN0LW9yZGVyJyk7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgd2lkZ2V0IG9mIHdpZGdldHMpIHtcbiAgICAgIGNvbnN0IGxpbmtzID0gd2lkZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJ2EnKTtcblxuICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxpbmtzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBjb25zdCBsaW5rID0gbGlua3NbaW5kZXhdO1xuICAgICAgICBjb25zdCBuZXh0TGluayA9IGxpbmtzWyhpbmRleCArIDEpICUgbGlua3MubGVuZ3RoXTtcblxuICAgICAgICBsaW5rLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgICBQdWJTdWIucHVibGlzaCgnb3JkZXJDaGFuZ2VkJywge1xuICAgICAgICAgICAgdHlwZTogbmV4dExpbmsuZGF0YXNldC50eXBlLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiBuZXh0TGluay5kYXRhc2V0LmRpcmVjdGlvblxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgbGluay5jbGFzc0xpc3QucmVtb3ZlKCdjdXJyZW50Jyk7XG4gICAgICAgICAgbmV4dExpbmsuY2xhc3NMaXN0LmFkZCgnY3VycmVudCcpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExpc3RPcmRlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jbGFzcyBWaWV3TG9hZGluZyBleHRlbmRzIFZpZXcge1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0xvYWRpbmc7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IExvYWRpbmdWaWV3ID0gcmVxdWlyZSgnLi9sb2FkaW5nLmpzJyk7XG5cbmNsYXNzIFZpZXdMb2FkaW5nR3JvdXBzIGV4dGVuZHMgTG9hZGluZ1ZpZXcge1xuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0xvYWRpbmdHcm91cHM7XG4iLCJjb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIE5vdGlmaWNhdGlvbk1hbmFnZXJWaWV3IGV4dGVuZHMgVmlldyB7XG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNvbnRhaW5lcik7XG5cbiAgICB0aGlzLl90aW1lciA9IG51bGw7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHN1cGVyLnJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdub3RpZnknLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuc2hvd05vdGlmaWNhdGlvbihhcmdzKTtcbiAgICB9KSk7XG4gIH1cblxuICBzaG93Tm90aWZpY2F0aW9uKHtcbiAgICB0aXRsZSA9IGZhbHNlLFxuICAgIGJvZHkgPSBmYWxzZSxcbiAgICBhY3Rpb24gPSBmYWxzZSxcbiAgICBkdXJhdGlvbiA9IDUwMDBcbiAgfSkge1xuXG4gICAgdmFyIGZuID0gKCkgPT4ge1xuICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdub3RpZmljYXRpb24nLCB7XG4gICAgICAgIHRpdGxlLFxuICAgICAgICBhY3Rpb25OYW1lOiBhY3Rpb24gPyBhY3Rpb24ubmFtZSA6IGZhbHNlXG4gICAgICB9KTtcblxuICAgICAgaWYgKGFjdGlvbiAmJiBhY3Rpb24uZm4pIHtcbiAgICAgICAgY29uc3QgYWN0aW9uUHJpbWFyeSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhcl9fYWN0aW9uLS1wcmltYXJ5Jyk7XG4gICAgICAgIGlmIChhY3Rpb25QcmltYXJ5KSB7XG4gICAgICAgICAgYWN0aW9uUHJpbWFyeS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcblxuICAgICAgICAgICAgaWYgKHRoaXMuX3RpbWVyKSB7XG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLl90aW1lcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGFjdGlvbi5mbigpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICBpZiAoYWN0aW9uLm1zZykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2hvd05vdGlmaWNhdGlvbih7XG4gICAgICAgICAgICAgICAgICB0aXRsZTogYWN0aW9uLm1zZ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhci1jb250YWluZXInKS5jbGFzc0xpc3QucmVtb3ZlKCdoYXMtbm90aWZpY2F0aW9uJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhci1jb250YWluZXInKS5jbGFzc0xpc3QuYWRkKCdoYXMtbm90aWZpY2F0aW9uJyk7XG5cbiAgICAgIGlmICh0aGlzLl90aW1lcikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLl90aW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXItY29udGFpbmVyJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLW5vdGlmaWNhdGlvbicpO1xuICAgICAgfSwgZHVyYXRpb24pO1xuICAgIH07XG5cbiAgICBpZiAodGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLXNuYWNrYmFyLWNvbnRhaW5lcicpLmNsYXNzTGlzdC5jb250YWlucygnaGFzLW5vdGlmaWNhdGlvbicpKSB7XG4gICAgICB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXItY29udGFpbmVyJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLW5vdGlmaWNhdGlvbicpO1xuICAgICAgc2V0VGltZW91dChmbiwgMzAwKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZm4oKTtcbiAgICB9XG5cbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gTm90aWZpY2F0aW9uTWFuYWdlclZpZXc7XG4iLCJjb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IExpc3RPcmRlciA9IHJlcXVpcmUoJy4vbGlzdC1vcmRlcicpO1xuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY29uc3QgVG91Y2ggPSByZXF1aXJlKCcuLi91dGlsaXR5L3RvdWNoJyk7XG5cbmNsYXNzIFZpZXdUaXRsZUJhciBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICBzdXBlcihjb250YWluZXIpO1xuXG4gICAgdGhpcy5yZWdpc3RlcldpZGdldChMaXN0T3JkZXIpO1xuXG4gICAgdGhpcy5fdG91Y2hIYW5kbGVyID0gbmV3IFRvdWNoKCk7XG4gICAgdGhpcy5fdG91Y2hIYW5kbGVyLnJlZ2lzdGVyKCdsZWZ0JywgKHRoaXMuX2Nsb3NlTmF2KS5iaW5kKHRoaXMpKTtcbiAgICB0aGlzLl90b3VjaEhhbmRsZXIucmVnaXN0ZXIoJ3JpZ2h0JywgKHRoaXMuX29wZW5OYXYpLmJpbmQodGhpcykpO1xuICB9XG5cbiAgcmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpIHtcbiAgICBzdXBlci5yZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcyk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goUHViU3ViLnN1YnNjcmliZSgncm91dGVDaGFuZ2VkJywgKHRvcGljLCBhcmdzKSA9PiB7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ3RpdGxlYmFyLXRpdGxlJywgYXJncyk7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ3RpdGxlYmFyLXRhYnMnLCBhcmdzKTtcblxuICAgICAgdGhpcy51cGRhdGVTb3J0aW5nKGFyZ3MpO1xuICAgIH0pKTtcblxuICAgIHRoaXMuX3RvdWNoSGFuZGxlci5zZXRFbGVtZW50KHRoaXMuX2VsKTtcbiAgfVxuXG4gIHJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKSB7XG4gICAgY29uc3QgZWwgPSBzdXBlci5yZW5kZXJQYXJ0aWFsKG5hbWUsIHBhcmFtcyk7XG5cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2xpc3Qtb3JkZXInOlxuICAgICAgICB0aGlzLmluaXRXaWRnZXRzKGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLl9uYXYgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCduYXYnKTtcbiAgICB0aGlzLl9uYXZPdmVybGF5ID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLW5hdi1vdmVybGF5Jyk7XG4gICAgdGhpcy5fYnRuTWVudU9wZW4gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtYnRuLW1lbnUnKTtcbiAgICB0aGlzLl9idG5NZW51Q2xvc2UgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtYnRuLW1lbnUuY2xvc2UnKTtcbiAgICB0aGlzLl9saW5rcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5tZC1uYXYtYm9keSBhJyk7XG5cbiAgICB0aGlzLl9idG5NZW51T3Blbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLl9vcGVuTmF2KCk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9idG5NZW51Q2xvc2UuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5fY2xvc2VOYXYoKTtcbiAgICB9KTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5fbGlua3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXMuX2xpbmtzW2ldLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5fY2xvc2VOYXYoKSk7XG4gICAgfVxuICB9XG5cbiAgY2xlYW51cCgpIHtcbiAgICBzdXBlci5jbGVhbnVwKCk7XG5cbiAgICB0aGlzLl90b3VjaEhhbmRsZXIuZGVzdHJveSgpO1xuICB9XG5cbiAgX29wZW5OYXYoKSB7XG4gICAgdGhpcy5fbmF2LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICB0aGlzLl9uYXZPdmVybGF5LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgfVxuXG4gIF9jbG9zZU5hdigpIHtcbiAgICB0aGlzLl9uYXYuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIHRoaXMuX25hdk92ZXJsYXkuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICB9XG5cbiAgdXBkYXRlU29ydGluZyhhcmdzKSB7XG4gICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdsaXN0LW9yZGVyJywgYXJncyk7XG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdUaXRsZUJhcjtcbiIsImNsYXNzIFZpZXdDb250YWluZXIge1xuICBjb25zdHJ1Y3RvcihlbElELCB0ZW1wbGF0ZXMsIHBhcnRpYWxzKSB7XG4gICAgdGhpcy5fZWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChlbElEKTtcblxuICAgIHRoaXMuX3RlbXBsYXRlcyA9IHRlbXBsYXRlcztcbiAgICB0aGlzLl9wYXJ0aWFscyA9IHBhcnRpYWxzO1xuXG4gICAgdGhpcy5fY3VycmVudFZpZXcgPSBudWxsO1xuICB9XG5cbiAgdXBkYXRlKHZpZXcsIGh0bWwpIHtcbiAgICBpZiAodGhpcy5fY3VycmVudFZpZXcpIHtcbiAgICAgIHRoaXMuX2N1cnJlbnRWaWV3LmNsZWFudXAoKTtcbiAgICB9XG5cbiAgICB0aGlzLl9jdXJyZW50VmlldyA9IHZpZXc7XG4gICAgdGhpcy5fZWwuaW5uZXJIVE1MID0gaHRtbDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdDb250YWluZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYW5kbGViYXJzL2Rpc3QvaGFuZGxlYmFycy5ydW50aW1lJyk7XG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3IHtcbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgdGhpcy5fY29udGFpbmVyID0gY29udGFpbmVyO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzID0ge307XG4gICAgdGhpcy5fd2lkZ2V0cyA9IFtdO1xuXG4gICAgdGhpcy5fbGFzdFBhcmFtcyA9IG51bGw7XG4gIH1cblxuICAvL3RpZHkgdGhpcyB1cD9cbiAgZ2V0IF9lbCgpIHtcbiAgICByZXR1cm4gdGhpcy5fY29udGFpbmVyLl9lbDtcbiAgfVxuXG4gIGdldCBsYXN0UGFyYW1zKCkge1xuICAgIHJldHVybiB0aGlzLl9sYXN0UGFyYW1zO1xuICB9XG5cbiAgcmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpIHtcbiAgICB0aGlzLmNsZWFudXAoKTtcblxuICAgIGlmICghcHJlUmVuZGVyZWQpIHtcbiAgICAgIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGUodGhpcy5fY29udGFpbmVyLl90ZW1wbGF0ZXNbdGhpcy5fZ2V0VGVtcGxhdGUoKV0pO1xuICAgICAgdGhpcy5fY29udGFpbmVyLnVwZGF0ZSh0aGlzLCB0ZW1wbGF0ZShwYXJhbXMpKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRFdmVudHMoKTtcblxuICAgIHRoaXMuX2xhc3RQYXJhbXMgPSBwYXJhbXM7XG4gIH1cblxuICByZW5kZXJQYXJ0aWFsKG5hbWUsIHBhcmFtcykge1xuICAgIGNvbnNvbGUubG9nKCdyZW5kZXIgcGFydGlhbCcsIG5hbWUpO1xuXG4gICAgdmFyIHRlbXBsYXRlID0gSGFuZGxlYmFycy50ZW1wbGF0ZSh0aGlzLl9jb250YWluZXIuX3BhcnRpYWxzW25hbWVdKTtcbiAgICBjb25zdCB2aWV3ID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLnBhcnRpYWwtJyArIG5hbWUpO1xuICAgIHZpZXcub3V0ZXJIVE1MID0gdGVtcGxhdGUocGFyYW1zKTtcblxuICAgIHRoaXMuX2xhc3RQYXJhbXMgPSBwYXJhbXM7XG5cbiAgICByZXR1cm4gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLnBhcnRpYWwtJyArIG5hbWUpO1xuICB9XG5cbiAgX2dldFRlbXBsYXRlKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLm5hbWUudG9Mb3dlckNhc2UoKS5zdWJzdHJpbmcoNCk7XG4gIH1cblxuICBfYWRkRG9jdW1lbnRMaXN0ZW5lcihuYW1lLCB0eXBlLCBmbikge1xuICAgIGlmICghdGhpcy5fZG9jdW1lbnRMaXN0ZW5lcnNbbmFtZV0pIHtcbiAgICAgIHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzW25hbWVdID0ge1xuICAgICAgICB0eXBlLFxuICAgICAgICBmbjogZm4uYmluZCh0aGlzKVxuICAgICAgfTtcbiAgICB9XG5cbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKHR5cGUsIHRoaXMuX2RvY3VtZW50TGlzdGVuZXJzW25hbWVdLmZuKTtcbiAgfVxuXG4gIGNsZWFudXAoKSB7XG4gICAgLy9jb25zb2xlLmxvZygndmlldyBjbGVhdXAnLCB0aGlzKTtcblxuICAgIGZvciAobGV0IHN1YiBvZiB0aGlzLl9zdWJzY3JpcHRpb25zKSB7XG4gICAgICBQdWJTdWIudW5zdWJzY3JpYmUoc3ViKTtcbiAgICB9XG5cbiAgICBmb3IgKGxldCBsbmFtZSBpbiB0aGlzLl9kb2N1bWVudExpc3RlbmVycykge1xuICAgICAgY29uc3QgbGlzdGVuZXIgPSB0aGlzLl9kb2N1bWVudExpc3RlbmVyc1tsbmFtZV07XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGxpc3RlbmVyLnR5cGUsIGxpc3RlbmVyLmZuKTtcbiAgICB9XG5cbiAgICB0aGlzLmNsZWFudXBXaWRnZXRzKCk7XG4gIH1cblxuICBpbml0RXZlbnRzKCkge1xuICAgIHRoaXMuaW5pdFdpZGdldHModGhpcy5fZWwpO1xuICB9XG5cbiAgcmVnaXN0ZXJXaWRnZXQoV2lkZ2V0KSB7XG4gICAgdGhpcy5fd2lkZ2V0cy5wdXNoKG5ldyBXaWRnZXQoKSk7XG4gIH1cblxuICBpbml0V2lkZ2V0cyhlbCkge1xuICAgIHRoaXMuX3dpZGdldHMuZm9yRWFjaCh3aWRnZXQgPT4ge1xuICAgICAgd2lkZ2V0LmluaXRFdmVudHMoZWwpO1xuICAgIH0pO1xuICB9XG5cbiAgY2xlYW51cFdpZGdldHMoKSB7XG4gICAgdGhpcy5fd2lkZ2V0cy5mb3JFYWNoKHdpZGdldCA9PiB7XG4gICAgICB3aWRnZXQuY2xlYW51cCgpO1xuICAgIH0pO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3O1xuIiwiY2xhc3MgV2lkZ2V0IHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgfVxuXG4gIGluaXRFdmVudHMoKSB7XG5cbiAgfVxuXG4gIGNsZWFudXAoKSB7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBXaWRnZXQ7XG4iLCIiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiJdfQ==
