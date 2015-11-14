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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL1VzZXJzL2NocmlzLy5udm0vdmVyc2lvbnMvbm9kZS92NS4wLjAvbGliL25vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiZGIvZGIuanMiLCJtb2RlbHMvSm90LmpzIiwibW9kZWxzL2dyb3VwLmpzIiwibW9kZWxzL2pvdC5qcyIsIm1vZGVscy9tb2RlbC5qcyIsIm5vZGVfbW9kdWxlcy9hdXRvbGlua2VyL2Rpc3QvQXV0b2xpbmtlci5qcyIsIm5vZGVfbW9kdWxlcy9mYXN0Y2xpY2svbGliL2Zhc3RjbGljay5qcyIsIm5vZGVfbW9kdWxlcy9oYW5kbGViYXJzL2Rpc3QvaGFuZGxlYmFycy5ydW50aW1lLmpzIiwibm9kZV9tb2R1bGVzL2lzYXJyYXkvaW5kZXguanMiLCJub2RlX21vZHVsZXMvcGFnZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wYWdlL25vZGVfbW9kdWxlcy9wYXRoLXRvLXJlZ2V4cC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy93aGF0d2ctZmV0Y2gvZmV0Y2guanMiLCJwcmVmZXJlbmNlcy9ncm91cC5qcyIsInByZWZlcmVuY2VzL2dyb3Vwcy5qcyIsInByZWZlcmVuY2VzL2pvdHMuanMiLCJwcmVmZXJlbmNlcy9wcmVmZXJlbmNlcy5qcyIsInB1YmxpYy9qcy9hcHAuanMiLCJyb3V0ZXJzL3BhdGguanMiLCJyb3V0ZXMvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvYXV0aC5qcyIsInJvdXRlcy9jbGllbnQvZ3JvdXAuanMiLCJyb3V0ZXMvY2xpZW50L2hvbWUuanMiLCJyb3V0ZXMvY2xpZW50L2pvdC5qcyIsInJvdXRlcy9ncm91cC5qcyIsInJvdXRlcy9ob21lLmpzIiwicm91dGVzL2pvdC5qcyIsInJvdXRlcy9yb3V0ZXMuanMiLCJ0ZW1wbGF0ZXMvaGVscGVycy5qcyIsInV0aWxpdHkvZGF0ZS5qcyIsInV0aWxpdHkvcHVic3ViLmpzIiwidXRpbGl0eS90b3VjaC5qcyIsInZpZXdzL2NvbG91ci1zZWxlY3Rvci5qcyIsInZpZXdzL2dyb3VwLmpzIiwidmlld3MvZ3JvdXBzLmpzIiwidmlld3MvaG9tZS5qcyIsInZpZXdzL2ltcG9ydC5qcyIsInZpZXdzL2pvdHMuanMiLCJ2aWV3cy9saXN0LW9yZGVyLmpzIiwidmlld3MvbG9hZGluZy5qcyIsInZpZXdzL2xvYWRpbmdncm91cHMuanMiLCJ2aWV3cy9ub3RpZmljYXRpb24tbWFuYWdlci5qcyIsInZpZXdzL3RpdGxlYmFyLmpzIiwidmlld3Mvdmlldy1jb250YWluZXIuanMiLCJ2aWV3cy92aWV3LmpzIiwidmlld3Mvd2lkZ2V0LmpzIiwiLi4vLi4vLi4vLi4vVXNlcnMvY2hyaXMvLm52bS92ZXJzaW9ucy9ub2RlL3Y1LjAuMC9saWIvbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L2xpYi9fZW1wdHkuanMiLCIuLi8uLi8uLi8uLi9Vc2Vycy9jaHJpcy8ubnZtL3ZlcnNpb25zL25vZGUvdjUuMC4wL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBLFlBQVksQ0FBQzs7Ozs7O0FBRWIsSUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLG1CQUFtQixDQUFDLENBQUM7O0lBRXRDLEVBQUU7QUFDTixXQURJLEVBQUUsR0FDUTswQkFEVixFQUFFOztBQUVKLFFBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0dBQ2pCOztlQUpHLEVBQUU7O3lCQVVELE9BQU8sRUFBRTs7O0FBRVosYUFBTyxHQUFHLE9BQU8sSUFBSTtBQUNuQixnQkFBUSxFQUFFLElBQUk7QUFDZCxjQUFNLEVBQUUsSUFBSTtBQUNaLFlBQUksRUFBRSxJQUFJO0FBQ1YsZ0JBQVEsRUFBRSxJQUFJO0FBQ2QsZ0JBQVEsRUFBRSxJ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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbG5HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3owQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoM0JBO0FBQ0E7QUFDQTtBQUNBOzs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDM21CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0WUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgREIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9yZW1vdGVDb3VjaCA9IG51bGw7XG4gICAgdGhpcy5fZGIgPSBudWxsO1xuICB9XG5cbiAgZ2V0IGRiKCkge1xuICAgIHJldHVybiB0aGlzLl9kYjtcbiAgfVxuXG4gIGluaXQob3B0aW9ucykge1xuXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge1xuICAgICAgcHJvdG9jb2w6IG51bGwsXG4gICAgICBkb21haW46IG51bGwsXG4gICAgICBwb3J0OiBudWxsLFxuICAgICAgdXNlcm5hbWU6IG51bGwsXG4gICAgICBwYXNzd29yZDogbnVsbCxcbiAgICAgIGRiTmFtZTogbnVsbFxuICAgIH07XG5cbiAgICBpZiAob3B0aW9ucy5kb21haW4pIHtcbiAgICAgIHRoaXMuX3JlbW90ZUNvdWNoID0gb3B0aW9ucy5wcm90b2NvbCArICc6Ly8nO1xuXG4gICAgICBpZiAob3B0aW9ucy51c2VybmFtZSkge1xuICAgICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSBvcHRpb25zLnVzZXJuYW1lO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy5wYXNzd29yZCkge1xuICAgICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSAnOicgKyBvcHRpb25zLnBhc3N3b3JkO1xuICAgICAgfVxuXG4gICAgICBpZiAob3B0aW9ucy51c2VybmFtZSB8fCBvcHRpb25zLnBhc3N3b3JkKSB7XG4gICAgICAgIHRoaXMuX3JlbW90ZUNvdWNoICs9ICdAJztcbiAgICAgIH1cblxuICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gb3B0aW9ucy5kb21haW47XG5cbiAgICAgIGlmIChvcHRpb25zLnBvcnQpIHtcbiAgICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggKz0gJzonICsgb3B0aW9ucy5wb3J0O1xuICAgICAgfVxuXG4gICAgICB0aGlzLl9yZW1vdGVDb3VjaCArPSAnLycgKyBvcHRpb25zLmRiTmFtZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fcmVtb3RlQ291Y2ggPSBudWxsO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YgUG91Y2hEQiAhPT0gJ3VuZGVmaW5lZCcpIHsgLy9icm93c2VyXG4gICAgICBQb3VjaERCLmRlYnVnLmRpc2FibGUoKTtcbiAgICAgIHRoaXMuX2RiID0gbmV3IFBvdWNoREIob3B0aW9ucy5kYk5hbWUsIHtcbiAgICAgICAgYXV0b19jb21wYWN0aW9uOiB0cnVlXG4gICAgICB9KTtcblxuICAgICAgaWYgKHRoaXMuX3JlbW90ZUNvdWNoKSB7XG5cbiAgICAgICAgY29uc3Qgb3B0cyA9IHtsaXZlOiB0cnVlLCByZXRyeTogdHJ1ZX07XG5cbiAgICAgICAgdGhpcy5fZGIucmVwbGljYXRlLnRvKHRoaXMuX3JlbW90ZUNvdWNoLCBvcHRzKS5vbignY2hhbmdlJywgaW5mbyA9PiB7XG4gICAgICAgICAgY29uc29sZS5sb2coJ2Jyb3dzZXIgcmVwbGljYXRlIHRvIGNoYW5nZScpO1xuICAgICAgICB9KS5vbigncGF1c2VkJywgKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBwYXVzZWQnKTtcbiAgICAgICAgfSkub24oJ2FjdGl2ZScsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gYWN0aXZlJyk7XG4gICAgICAgIH0pLm9uKCdkZW5pZWQnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgdG8gZGVuaWVkJywgaW5mbyk7XG4gICAgICAgIH0pLm9uKCdjb21wbGV0ZScsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBjb21wbGV0ZScpO1xuICAgICAgICB9KS5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSB0byBlcnJvcicsIGVycik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxldCBjaGFuZ2VzID0gW107XG5cbiAgICAgICAgdGhpcy5fZGIucmVwbGljYXRlLmZyb20odGhpcy5fcmVtb3RlQ291Y2gsIG9wdHMpLm9uKCdjaGFuZ2UnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBjaGFuZ2UnLCBpbmZvKTtcbiAgICAgICAgICBjaGFuZ2VzID0gY2hhbmdlcy5jb25jYXQoaW5mby5kb2NzKTtcbiAgICAgICAgfSkub24oJ3BhdXNlZCcsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBwYXVzZWQnKTtcblxuICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCd1cGRhdGUnLCB7XG4gICAgICAgICAgICBjaGFuZ2VzXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBjaGFuZ2VzID0gW107XG5cbiAgICAgICAgfSkub24oJ2FjdGl2ZScsICgpID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBhY3RpdmUnKTtcbiAgICAgICAgfSkub24oJ2RlbmllZCcsIGluZm8gPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIGRlbmllZCcsIGluZm8pO1xuICAgICAgICB9KS5vbignY29tcGxldGUnLCBpbmZvID0+IHtcbiAgICAgICAgICBjb25zb2xlLmxvZygnYnJvd3NlciByZXBsaWNhdGUgZnJvbSBjb21wbGV0ZScsIGluZm8pO1xuICAgICAgICB9KS5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdicm93c2VyIHJlcGxpY2F0ZSBmcm9tIGVycm9yJywgZXJyKTtcbiAgICAgICAgfSk7XG5cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGRkb2MgPSB7XG4gICAgICAgICAgX2lkOiAnX2Rlc2lnbi9pbmRleCcsXG4gICAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgIGdyb3VwOiB7XG4gICAgICAgICAgICAgIG1hcDogKGRvYyA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGRvYy5maWVsZHMuZ3JvdXApIHtcbiAgICAgICAgICAgICAgICAgIGVtaXQoZG9jLmZpZWxkcy5ncm91cCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KS50b1N0cmluZygpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHRoaXMuX2RiLnB1dChkZG9jKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAvLyBraWNrIG9mZiBhbiBpbml0aWFsIGJ1aWxkLCByZXR1cm4gaW1tZWRpYXRlbHlcbiAgICAgICAgICByZXR1cm4gdGhpcy5fZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge3N0YWxlOiAndXBkYXRlX2FmdGVyJ30pO1xuICAgICAgICB9KS5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgLy9jb25mbGljdCBvY2N1cmVkLCBpLmUuIGRkb2MgYWxyZWFkeSBleGlzdGVkXG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IFBvdWNoREIgPSByZXF1aXJlKCdwb3VjaGRiJyk7XG4gICAgICBQb3VjaERCLmRlYnVnLmRpc2FibGUoKTtcblxuICAgICAgdGhpcy5fZGIgPSBuZXcgUG91Y2hEQih0aGlzLl9yZW1vdGVDb3VjaCk7XG4gICAgfVxuICB9XG59XG5cbmNvbnN0IGRicyA9IHtcbiAgJ21haW4nOiBuZXcgREIoKVxufTtcbmxldCBjdXJyZW50REIgPSAnbWFpbic7XG5cbm1vZHVsZS5leHBvcnRzID0gKG9wdGlvbnMsIGlkPWZhbHNlKSA9PiB7XG4gIGlmIChpZCAhPT0gZmFsc2UpIHtcbiAgICBjdXJyZW50REIgPSBpZDtcbiAgfVxuXG4gIGlmIChvcHRpb25zKSB7XG4gICAgaWYgKCFkYnNbY3VycmVudERCXSkge1xuICAgICAgZGJzW2N1cnJlbnREQl0gPSBuZXcgREIoKTtcbiAgICB9XG5cbiAgICBkYnNbY3VycmVudERCXS5pbml0KG9wdGlvbnMpO1xuICB9XG5cbiAgcmV0dXJuIGRic1tjdXJyZW50REJdLmRiO1xufTtcbiIsImNvbnN0IE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xuXG5jbGFzcyBKb3QgZXh0ZW5kcyBNb2RlbCB7XG5cbiAgY29uc3RydWN0b3IobWVtYmVycykge1xuICAgIHN1cGVyKG1lbWJlcnMsIFtcbiAgICAgICdjb250ZW50JyxcbiAgICAgICdncm91cCcsXG4gICAgICAnZG9uZScsXG4gICAgICAncHJpb3JpdHknXG4gICAgXSk7XG5cbiAgICB0aGlzLl9ncm91cCA9IG51bGw7XG4gIH1cblxuICBzdGF0aWMgZ2V0UHJpb3JpdGllcygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJzInLFxuICAgICAgJzEnLFxuICAgICAgJzAnXG4gICAgXTtcbiAgfVxuXG4gIGdldCBwcmlvcml0aWVzKCkge1xuICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLmdldFByaW9yaXRpZXMoKTtcbiAgfVxuXG4gIGdldCBncm91cCgpIHtcbiAgICByZXR1cm4gdGhpcy5fZ3JvdXA7XG4gIH1cblxuICBnZXQgZ3JvdXBOYW1lKCkge1xuICAgIGlmICh0aGlzLl9ncm91cCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2dyb3VwLmZpZWxkcy5uYW1lO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJy0nO1xuICAgIH1cbiAgfVxuXG4gIGlzRG9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5maWVsZHMuZG9uZTtcbiAgfVxuXG4gIGxvYWRHcm91cCgpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgcmV0dXJuIEdyb3VwLmxvYWQodGhpcy5maWVsZHMuZ3JvdXAsIGZhbHNlKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgdGhpcy5fZ3JvdXAgPSBncm91cDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBnZXRQZXJjZW50YWdlRG9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5sb2FkQWxsKGZhbHNlKS50aGVuKGpvdHMgPT4ge1xuICAgICAgbGV0IG51bURvbmUgPSBqb3RzLnJlZHVjZSgocHJldlZhbCwgam90KSA9PiB7XG4gICAgICAgIGlmIChqb3QuaXNEb25lKCkpIHtcbiAgICAgICAgICByZXR1cm4gcHJldlZhbCArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHByZXZWYWw7XG4gICAgICAgIH1cbiAgICAgIH0sIDApO1xuXG4gICAgICByZXR1cm4ge1xuICAgICAgICBwZXJjZW50OiBwYXJzZUludCgobnVtRG9uZSAvIGpvdHMubGVuZ3RoKSAqIDEwMCwgMTApXG4gICAgICB9O1xuICAgIH0pXG5cbiAgICAudGhlbihzdGF0cyA9PiB7XG4gICAgICBjb25zdCBHcm91cCA9IHJlcXVpcmUoJy4vZ3JvdXAnKTtcblxuICAgICAgcmV0dXJuIEdyb3VwLmxvYWRBbGwoZmFsc2UpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgc3RhdHMubnVtR3JvdXBzID0gZ3JvdXBzLmxlbmd0aDtcblxuICAgICAgICByZXR1cm4gc3RhdHM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkKGlkLCBsb2FkR3JvdXAgPSB0cnVlKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWQoaWQpLnRoZW4oam90ID0+IHtcbiAgICAgIGlmIChsb2FkR3JvdXApIHtcbiAgICAgICAgcmV0dXJuIGpvdC5sb2FkR3JvdXAoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gam90O1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBqb3Q7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEFsbChsb2FkR3JvdXBzID0gdHJ1ZSwgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBzdXBlci5sb2FkQWxsKCkudGhlbihqb3RzID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICBpZiAobG9hZEdyb3Vwcykge1xuICAgICAgICBwcm9taXNlcy5wdXNoKEdyb3VwLmxvYWRGb3JKb3RzKGpvdHMpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoam90cywgb3JkZXIsIGRpcmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBvcmRlcihqb3RzLCBzb3J0T3JkZXIgPSAnYWxwaGEnLCBzb3J0RGlyZWN0aW9uID0gJ2FzYycpIHtcblxuICAgIHN3aXRjaCAoc29ydE9yZGVyKSB7XG4gICAgICBjYXNlICdkYXRlJzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA+IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA8IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2FscGhhJzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSA+IGIuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSA8IGIuZmllbGRzLmNvbnRlbnQudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3ByaW9yaXR5JzpcbiAgICAgICAgam90cy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuZmllbGRzLnByaW9yaXR5ID4gYi5maWVsZHMucHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChhLmZpZWxkcy5wcmlvcml0eSA8IGIuZmllbGRzLnByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChzb3J0RGlyZWN0aW9uID09PSAnZGVzYycpIHtcbiAgICAgIGpvdHMucmV2ZXJzZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHVuZG9uZUpvdHMgPSBbXTtcbiAgICBjb25zdCBkb25lSm90cyA9IFtdO1xuXG4gICAgam90cy5mb3JFYWNoKGpvdCA9PiB7XG4gICAgICBpZiAoam90LmlzRG9uZSgpKSB7XG4gICAgICAgIGRvbmVKb3RzLnB1c2goam90KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHVuZG9uZUpvdHMucHVzaChqb3QpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVuZG9uZUpvdHMuY29uY2F0KGRvbmVKb3RzKTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkRm9yR3JvdXAoZ3JvdXBJZCwgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge1xuICAgICAgICBkZXNjZW5kaW5nOiB0cnVlLFxuICAgICAgICBrZXk6IGdyb3VwSWQsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBqb3RzID0gW107XG5cbiAgICAgICAgcmVzdWx0LnJvd3MuZm9yRWFjaChyb3cgPT4ge1xuICAgICAgICAgIGpvdHMucHVzaChuZXcgdGhpcyhyb3cuZG9jKSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLm9yZGVyKGpvdHMsIG9yZGVyLCBkaXJlY3Rpb24pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZEZvckdyb3Vwcyhncm91cHMsIG9yZGVyID0gJ2FscGhhJywgZGlyZWN0aW9uID0gJ2FzYycpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGdyb3VwSWRzID0gZ3JvdXBzLm1hcChncm91cCA9PiBncm91cC5pZCk7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLnF1ZXJ5KCdpbmRleC9ncm91cCcsIHtcbiAgICAgICAga2V5czogZ3JvdXBJZHMsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBncm91cEpvdHMgPSB7fTtcblxuICAgICAgICBncm91cElkcy5mb3JFYWNoKGdyb3VwSWQgPT4ge1xuICAgICAgICAgIGdyb3VwSm90c1tncm91cElkXSA9IFtdO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgZ3JvdXBKb3RzW3Jvdy5kb2MuZmllbGRzLmdyb3VwXS5wdXNoKG5ldyB0aGlzKHJvdy5kb2MpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZ3JvdXBzLmZvckVhY2goZ3JvdXAgPT4ge1xuICAgICAgICAgIGdyb3VwLl9qb3RzID0gZ3JvdXBKb3RzW2dyb3VwLmlkXTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvdDtcbiIsImNvbnN0IE1vZGVsID0gcmVxdWlyZSgnLi9tb2RlbCcpO1xuY29uc3QgSm90ID0gcmVxdWlyZSgnLi9qb3QnKTtcblxuY2xhc3MgR3JvdXAgZXh0ZW5kcyBNb2RlbCB7XG5cbiAgY29uc3RydWN0b3IobWVtYmVycykge1xuICAgIHN1cGVyKG1lbWJlcnMsIFtcbiAgICAgICduYW1lJyxcbiAgICAgICdjb2xvdXInXG4gICAgXSk7XG5cbiAgICB0aGlzLl9qb3RzID0gW107XG4gIH1cblxuICBzdGF0aWMgZ2V0Q29sb3VycygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ2JsdWUnLFxuICAgICAgJ3JlZCcsXG4gICAgICAndGVhbCcsXG4gICAgICAneWVsbG93JyxcbiAgICAgICdvcmFuZ2UnLFxuICAgICAgJ2Jyb3duJ1xuICAgIF07XG4gIH1cblxuICBnZXQgY29sb3VycygpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRDb2xvdXJzKCk7XG4gIH1cblxuICBnZXQgam90cygpIHtcbiAgICByZXR1cm4gdGhpcy5fam90cztcbiAgfVxuXG4gIHNldCBqb3RzKGpvdHMpIHtcbiAgICB0aGlzLl9qb3RzID0gam90cztcbiAgfVxuXG4gIGdldEpvdHMoZG9uZSA9IG51bGwpIHtcbiAgICBpZiAoZG9uZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuam90cztcbiAgICB9IGVsc2UgaWYgKGRvbmUpIHtcbiAgICAgIHJldHVybiB0aGlzLmpvdHMuZmlsdGVyKGpvdCA9PiAhIWpvdC5maWVsZHMuZG9uZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmpvdHMuZmlsdGVyKGpvdCA9PiAham90LmZpZWxkcy5kb25lKTtcbiAgICB9XG4gIH1cblxuICBnZXQgam90Q291bnQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2pvdHMubGVuZ3RoO1xuICB9XG5cbiAgZ2V0IGpvdERvbmVDb3VudCgpIHtcbiAgICByZXR1cm4gdGhpcy5fam90cy5maWx0ZXIoam90ID0+ICEham90LmZpZWxkcy5kb25lKS5sZW5ndGg7XG4gIH1cblxuICBsb2FkSm90cyhvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIEpvdC5sb2FkRm9yR3JvdXAodGhpcy5pZCwgb3JkZXIsIGRpcmVjdGlvbikudGhlbihqb3RzID0+IHtcbiAgICAgIHRoaXMuX2pvdHMgPSBqb3RzO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZChpZCwgbG9hZEpvdHMgPSB0cnVlLCBqb3RPcmRlciA9ICdhbHBoYScsIGpvdERpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWQoaWQpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgaWYgKGxvYWRKb3RzKSB7XG4gICAgICAgIHJldHVybiBncm91cC5sb2FkSm90cyhqb3RPcmRlciwgam90RGlyZWN0aW9uKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGdyb3VwO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRBbGwobG9hZEpvdHMgPSB0cnVlLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuXG4gICAgICBpZiAobG9hZEpvdHMpIHtcbiAgICAgICAgcHJvbWlzZXMucHVzaChKb3QubG9hZEZvckdyb3Vwcyhncm91cHMpKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKCgpID0+IHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoZ3JvdXBzLCBvcmRlciwgZGlyZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWRGb3JKb3RzKGpvdHMpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIGNvbnN0IGdyb3VwSWRzID0gam90cy5tYXAoam90ID0+IGpvdC5maWVsZHMuZ3JvdXApO1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5hbGxEb2NzKHtcbiAgICAgICAgZGVzY2VuZGluZzogdHJ1ZSxcbiAgICAgICAga2V5czogZ3JvdXBJZHMsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBqb3RHcm91cHMgPSB7fTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgam90R3JvdXBzW3Jvdy5kb2MuX2lkXSA9IG5ldyB0aGlzKHJvdy5kb2MpO1xuICAgICAgICB9KTtcblxuICAgICAgICBqb3RzLmZvckVhY2goam90ID0+IHtcbiAgICAgICAgICBqb3QuX2dyb3VwID0gam90R3JvdXBzW2pvdC5maWVsZHMuZ3JvdXBdO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG9yZGVyKGdyb3Vwcywgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuXG4gICAgc3dpdGNoIChvcmRlcikge1xuICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgIGdyb3Vwcy5zb3J0KChhLCBiKSA9PiB7XG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA+IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuX2RhdGVBZGRlZCA8IGIuX2RhdGVBZGRlZCkge1xuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9KTtcblxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2FscGhhJzpcbiAgICAgICAgZ3JvdXBzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpID4gYi5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpIDwgYi5maWVsZHMubmFtZS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGlmIChkaXJlY3Rpb24gPT09ICdkZXNjJykge1xuICAgICAgZ3JvdXBzLnJldmVyc2UoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ3JvdXBzO1xuICB9XG5cbiAgc3RhdGljIHJlbW92ZShpZCkge1xuICAgIHJldHVybiBzdXBlci5yZW1vdmUoaWQpLnRoZW4oKCkgPT4ge1xuXG4gICAgICByZXR1cm4gSm90LmxvYWRGb3JHcm91cChpZCkudGhlbihqb3RzID0+IHtcbiAgICAgICAgY29uc3QgZG9jcyA9IGpvdHMubWFwKGpvdCA9PiB7XG4gICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIF9pZDogam90LmlkLFxuICAgICAgICAgICAgX3Jldjogam90LnJldixcbiAgICAgICAgICAgIF9kZWxldGVkOiB0cnVlXG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuYnVsa0RvY3MoZG9jcykudGhlbigoKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgaW1wb3J0RnJvbUxvY2FsKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgUG91Y2hEQiA9PT0gJ3VuZGVmaW5lZCcpIHsgLy9zZXJ2ZXJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICAvL2xvYWQgbG9jYWwgZGJcbiAgICAgIHJlcXVpcmUoJy4uL2RiL2RiJykoe1xuICAgICAgICBkYk5hbWU6ICdqb3QtbG9jYWwnXG4gICAgICB9LCAnbG9jYWwnKTtcblxuICAgICAgcmV0dXJuIHRoaXMubG9hZEFsbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgLy9yZXN0b3JlIG1haW4gZGJcbiAgICAgICAgcmVxdWlyZSgnLi4vZGIvZGInKShudWxsLCAnbWFpbicpO1xuXG4gICAgICAgIHJldHVybiBncm91cHM7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyByZW1vdmVGcm9tTG9jYWwoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBQb3VjaERCID09PSAndW5kZWZpbmVkJykgeyAvL3NlcnZlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIC8vbG9hZCBsb2NhbCBkYlxuICAgICAgcmVxdWlyZSgnLi4vZGIvZGInKSh7XG4gICAgICAgIGRiTmFtZTogJ2pvdC1sb2NhbCdcbiAgICAgIH0sICdsb2NhbCcpO1xuXG4gICAgICByZXR1cm4gdGhpcy5sb2FkQWxsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICBjb25zdCBwcm9taXNlcyA9IFtdO1xuICAgICAgICBncm91cHMuZm9yRWFjaChncm91cCA9PiB7XG4gICAgICAgICAgcHJvbWlzZXMucHVzaChHcm91cC5yZW1vdmUoZ3JvdXAuaWQpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgICAgIH0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAvL3Jlc3RvcmUgbWFpbiBkYlxuICAgICAgICByZXF1aXJlKCcuLi9kYi9kYicpKG51bGwsICdtYWluJyk7XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xuIiwiY29uc3QgTW9kZWwgPSByZXF1aXJlKCcuL21vZGVsJyk7XG5cbmNsYXNzIEpvdCBleHRlbmRzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihtZW1iZXJzKSB7XG4gICAgc3VwZXIobWVtYmVycywgW1xuICAgICAgJ2NvbnRlbnQnLFxuICAgICAgJ2dyb3VwJyxcbiAgICAgICdkb25lJyxcbiAgICAgICdwcmlvcml0eSdcbiAgICBdKTtcblxuICAgIHRoaXMuX2dyb3VwID0gbnVsbDtcbiAgfVxuXG4gIHN0YXRpYyBnZXRQcmlvcml0aWVzKCkge1xuICAgIHJldHVybiBbXG4gICAgICAnMicsXG4gICAgICAnMScsXG4gICAgICAnMCdcbiAgICBdO1xuICB9XG5cbiAgZ2V0IHByaW9yaXRpZXMoKSB7XG4gICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZ2V0UHJpb3JpdGllcygpO1xuICB9XG5cbiAgZ2V0IGdyb3VwKCkge1xuICAgIHJldHVybiB0aGlzLl9ncm91cDtcbiAgfVxuXG4gIGdldCBncm91cE5hbWUoKSB7XG4gICAgaWYgKHRoaXMuX2dyb3VwKSB7XG4gICAgICByZXR1cm4gdGhpcy5fZ3JvdXAuZmllbGRzLm5hbWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnLSc7XG4gICAgfVxuICB9XG5cbiAgaXNEb25lKCkge1xuICAgIHJldHVybiB0aGlzLmZpZWxkcy5kb25lO1xuICB9XG5cbiAgbG9hZEdyb3VwKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICByZXR1cm4gR3JvdXAubG9hZCh0aGlzLmZpZWxkcy5ncm91cCwgZmFsc2UpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICB0aGlzLl9ncm91cCA9IGdyb3VwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGdldFBlcmNlbnRhZ2VEb25lKCkge1xuICAgIHJldHVybiB0aGlzLmxvYWRBbGwoZmFsc2UpLnRoZW4oam90cyA9PiB7XG4gICAgICBsZXQgbnVtRG9uZSA9IGpvdHMucmVkdWNlKChwcmV2VmFsLCBqb3QpID0+IHtcbiAgICAgICAgaWYgKGpvdC5pc0RvbmUoKSkge1xuICAgICAgICAgIHJldHVybiBwcmV2VmFsICsgMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gcHJldlZhbDtcbiAgICAgICAgfVxuICAgICAgfSwgMCk7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHBlcmNlbnQ6IHBhcnNlSW50KChudW1Eb25lIC8gam90cy5sZW5ndGgpICogMTAwLCAxMClcbiAgICAgIH07XG4gICAgfSlcblxuICAgIC50aGVuKHN0YXRzID0+IHtcbiAgICAgIGNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi9ncm91cCcpO1xuXG4gICAgICByZXR1cm4gR3JvdXAubG9hZEFsbChmYWxzZSkudGhlbihncm91cHMgPT4ge1xuICAgICAgICBzdGF0cy5udW1Hcm91cHMgPSBncm91cHMubGVuZ3RoO1xuXG4gICAgICAgIHJldHVybiBzdGF0cztcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGxvYWQoaWQsIGxvYWRHcm91cCA9IHRydWUpIHtcbiAgICByZXR1cm4gc3VwZXIubG9hZChpZCkudGhlbihqb3QgPT4ge1xuICAgICAgaWYgKGxvYWRHcm91cCkge1xuICAgICAgICByZXR1cm4gam90LmxvYWRHcm91cCgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBqb3Q7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGpvdDtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkQWxsKGxvYWRHcm91cHMgPSB0cnVlLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIHN1cGVyLmxvYWRBbGwoKS50aGVuKGpvdHMgPT4ge1xuICAgICAgY29uc3QgR3JvdXAgPSByZXF1aXJlKCcuL2dyb3VwJyk7XG5cbiAgICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICAgIGlmIChsb2FkR3JvdXBzKSB7XG4gICAgICAgIHByb21pc2VzLnB1c2goR3JvdXAubG9hZEZvckpvdHMoam90cykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5vcmRlcihqb3RzLCBvcmRlciwgZGlyZWN0aW9uKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIG9yZGVyKGpvdHMsIHNvcnRPcmRlciA9ICdhbHBoYScsIHNvcnREaXJlY3Rpb24gPSAnYXNjJykge1xuXG4gICAgc3dpdGNoIChzb3J0T3JkZXIpIHtcbiAgICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkID4gYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5fZGF0ZUFkZGVkIDwgYi5fZGF0ZUFkZGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYWxwaGEnOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpID4gYi5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoYS5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpIDwgYi5maWVsZHMuY29udGVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gLTE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAncHJpb3JpdHknOlxuICAgICAgICBqb3RzLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICBpZiAoYS5maWVsZHMucHJpb3JpdHkgPiBiLmZpZWxkcy5wcmlvcml0eSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGEuZmllbGRzLnByaW9yaXR5IDwgYi5maWVsZHMucHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHNvcnREaXJlY3Rpb24gPT09ICdkZXNjJykge1xuICAgICAgam90cy5yZXZlcnNlKCk7XG4gICAgfVxuXG4gICAgY29uc3QgdW5kb25lSm90cyA9IFtdO1xuICAgIGNvbnN0IGRvbmVKb3RzID0gW107XG5cbiAgICBqb3RzLmZvckVhY2goam90ID0+IHtcbiAgICAgIGlmIChqb3QuaXNEb25lKCkpIHtcbiAgICAgICAgZG9uZUpvdHMucHVzaChqb3QpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdW5kb25lSm90cy5wdXNoKGpvdCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICByZXR1cm4gdW5kb25lSm90cy5jb25jYXQoZG9uZUpvdHMpO1xuICB9XG5cbiAgc3RhdGljIGxvYWRGb3JHcm91cChncm91cElkLCBvcmRlciA9ICdhbHBoYScsIGRpcmVjdGlvbiA9ICdhc2MnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICByZXR1cm4gdGhpcy5kYi5xdWVyeSgnaW5kZXgvZ3JvdXAnLCB7XG4gICAgICAgIGRlc2NlbmRpbmc6IHRydWUsXG4gICAgICAgIGtleTogZ3JvdXBJZCxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IGpvdHMgPSBbXTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgam90cy5wdXNoKG5ldyB0aGlzKHJvdy5kb2MpKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMub3JkZXIoam90cywgb3JkZXIsIGRpcmVjdGlvbik7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkRm9yR3JvdXBzKGdyb3Vwcywgb3JkZXIgPSAnYWxwaGEnLCBkaXJlY3Rpb24gPSAnYXNjJykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgY29uc3QgZ3JvdXBJZHMgPSBncm91cHMubWFwKGdyb3VwID0+IGdyb3VwLmlkKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIucXVlcnkoJ2luZGV4L2dyb3VwJywge1xuICAgICAgICBrZXlzOiBncm91cElkcyxcbiAgICAgICAgaW5jbHVkZV9kb2NzOiB0cnVlXG4gICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgIGNvbnN0IGdyb3VwSm90cyA9IHt9O1xuXG4gICAgICAgIGdyb3VwSWRzLmZvckVhY2goZ3JvdXBJZCA9PiB7XG4gICAgICAgICAgZ3JvdXBKb3RzW2dyb3VwSWRdID0gW107XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJlc3VsdC5yb3dzLmZvckVhY2gocm93ID0+IHtcbiAgICAgICAgICBncm91cEpvdHNbcm93LmRvYy5maWVsZHMuZ3JvdXBdLnB1c2gobmV3IHRoaXMocm93LmRvYykpO1xuICAgICAgICB9KTtcblxuICAgICAgICBncm91cHMuZm9yRWFjaChncm91cCA9PiB7XG4gICAgICAgICAgZ3JvdXAuX2pvdHMgPSBncm91cEpvdHNbZ3JvdXAuaWRdO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSm90O1xuIiwiY29uc3QgRGF0ZVV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9kYXRlJyk7XG5cbmNsYXNzIE1vZGVsIHtcblxuICBjb25zdHJ1Y3RvcihtZW1iZXJzLCBhbGxvd2VkRmllbGRzKSB7XG4gICAgdGhpcy5faWQgPSBtZW1iZXJzLl9pZCB8fCBudWxsO1xuICAgIHRoaXMuX3JldiA9IG1lbWJlcnMuX3JldiB8fCBudWxsO1xuXG4gICAgdGhpcy5fZGF0ZUFkZGVkID0gbWVtYmVycy5kYXRlQWRkZWQgfHwgbnVsbDtcblxuICAgIHRoaXMuX2ZpZWxkcyA9IG1lbWJlcnMuZmllbGRzIHx8IHt9O1xuXG4gICAgdGhpcy5fYWxsb3dlZEZpZWxkcyA9IGFsbG93ZWRGaWVsZHM7XG4gIH1cblxuICBzdGF0aWMgZ2V0IGRiKCkge1xuICAgIHJldHVybiByZXF1aXJlKCcuLi9kYi9kYicpKCk7XG4gIH1cblxuICBzdGF0aWMgZ2V0UmVmTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gIH1cblxuICBnZXQgcmVmTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5nZXRSZWZOYW1lKCk7XG4gIH1cblxuICBnZXQgaWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2lkO1xuICB9XG5cbiAgc2V0IGlkKGlkKSB7XG4gICAgdGhpcy5faWQgPSBpZDtcblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgZ2V0IHJldigpIHtcbiAgICByZXR1cm4gdGhpcy5fcmV2O1xuICB9XG5cbiAgc2V0IHJldihyZXYpIHtcbiAgICB0aGlzLl9yZXYgPSByZXY7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCBkYXRlQWRkZWQoKSB7XG4gICAgaWYgKHRoaXMuX2RhdGVBZGRlZCkge1xuICAgICAgcmV0dXJuIERhdGVVdGlscy5mb3JtYXQobmV3IERhdGUodGhpcy5fZGF0ZUFkZGVkKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAnJztcbiAgICB9XG4gIH1cblxuICBzZXQgZGF0ZUFkZGVkKGRhdGUpIHtcbiAgICB0aGlzLl9kYXRlQWRkZWQgPSBkYXRlO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXQgZmllbGRzKGZpZWxkcykge1xuICAgIHRoaXMuX2ZpZWxkcyA9IHt9O1xuXG4gICAgZm9yIChsZXQgZmllbGROYW1lIGluIGZpZWxkcykge1xuICAgICAgaWYgKHRoaXMuX2FsbG93ZWRGaWVsZHMuaW5kZXhPZihmaWVsZE5hbWUpID4gLTEpIHtcbiAgICAgICAgdGhpcy5fZmllbGRzW2ZpZWxkTmFtZV0gPSBmaWVsZHNbZmllbGROYW1lXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldCBmaWVsZHMoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2ZpZWxkcztcbiAgfVxuXG4gIGlzTmV3KCkge1xuICAgIHJldHVybiAhdGhpcy5pZDtcbiAgfVxuXG4gIGdldFNsdWcoKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKCF0aGlzLmlzTmV3KCkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmlkKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBzbHVnID0gdGhpcy5yZWZOYW1lICsgJy0nO1xuXG4gICAgICAgIGNvbnN0IHBhZGRpbmcgPSA1OyAvL3RoZSBsZW5ndGggb2YgdGhlIG51bWJlciwgZS5nLiAnNScgd2lsbCBzdGFydCBhdCAwMDAwMCwgMDAwMDEsIGV0Yy5cblxuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5kYi5hbGxEb2NzKHtcbiAgICAgICAgICBzdGFydGtleTogc2x1ZyArICdcXHVmZmZmJyxcbiAgICAgICAgICBlbmRrZXk6IHNsdWcsXG4gICAgICAgICAgZGVzY2VuZGluZzogdHJ1ZSxcbiAgICAgICAgICBsaW1pdDogMVxuICAgICAgICB9KS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgaWYgKHJlc3VsdC5yb3dzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGxhc3REb2MgPSByZXN1bHQucm93c1tyZXN1bHQucm93cy5sZW5ndGggLSAxXTtcbiAgICAgICAgICAgIGNvbnN0IGxhc3ROdW0gPSBwYXJzZUludChsYXN0RG9jLmlkLnN1YnN0cmluZyhzbHVnLmxlbmd0aCksIDEwKTtcblxuICAgICAgICAgICAgcmV0dXJuIHNsdWcgKyAoJzAnLnJlcGVhdChwYWRkaW5nKSArIChsYXN0TnVtICsgMSkpLnNsaWNlKC1wYWRkaW5nKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHNsdWcgKyAnMCcucmVwZWF0KHBhZGRpbmcpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBzYXZlKCkge1xuICAgIHJldHVybiB0aGlzLmdldFNsdWcoKS50aGVuKHNsdWcgPT4ge1xuICAgICAgY29uc3QgcGFyYW1zID0ge1xuICAgICAgICBfaWQ6IHNsdWcsXG4gICAgICAgIGRhdGVBZGRlZDogdGhpcy5fZGF0ZUFkZGVkLFxuICAgICAgICBmaWVsZHM6IHRoaXMuZmllbGRzXG4gICAgICB9O1xuXG4gICAgICBpZiAoIXRoaXMuaXNOZXcoKSkge1xuICAgICAgICBwYXJhbXMuX3JldiA9IHRoaXMucmV2O1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5pc05ldygpICYmICF0aGlzLl9kYXRlQWRkZWQpIHtcbiAgICAgICAgcGFyYW1zLmRhdGVBZGRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY29uc3RydWN0b3IuZGIucHV0KHBhcmFtcykudGhlbihyZXNwb25zZSA9PiB7XG4gICAgICAgIGlmIChyZXNwb25zZS5vaykge1xuICAgICAgICAgIHRoaXMuaWQgPSByZXNwb25zZS5pZDtcbiAgICAgICAgICB0aGlzLnJldiA9IHJlc3BvbnNlLnJldjtcblxuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyBsb2FkQWxsKCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgcmV0dXJuIHRoaXMuZGIuYWxsRG9jcyh7XG4gICAgICAgIGVuZGtleTogdGhpcy5nZXRSZWZOYW1lKCkgKyAnLScsXG4gICAgICAgIHN0YXJ0a2V5OiB0aGlzLmdldFJlZk5hbWUoKSArICctXFx1ZmZmZicsXG4gICAgICAgIGluY2x1ZGVfZG9jczogdHJ1ZSxcbiAgICAgICAgZGVzY2VuZGluZzogdHJ1ZVxuICAgICAgfSkudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICBjb25zdCBtb2RlbHMgPSBbXTtcblxuICAgICAgICByZXN1bHQucm93cy5mb3JFYWNoKHJvdyA9PiB7XG4gICAgICAgICAgbW9kZWxzLnB1c2gobmV3IHRoaXMocm93LmRvYykpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbW9kZWxzO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBzdGF0aWMgbG9hZChpZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgaWQgIT09ICd1bmRlZmluZWQnKSB7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZGIuZ2V0KGlkKS50aGVuKGRvYyA9PiB7XG4gICAgICAgICAgcmV0dXJuIG5ldyB0aGlzKGRvYyk7XG4gICAgICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIHN0YXRpYyByZW1vdmUoaWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG5cbiAgICAgIHJldHVybiB0aGlzLmRiLmdldChpZCkudGhlbihkb2MgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5kYi5yZW1vdmUoZG9jKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgc3RhdGljIGluc2VydChtZW1iZXJzKSB7XG4gICAgY29uc3QgbW9kZWwgPSBuZXcgdGhpcyhtZW1iZXJzKTtcbiAgICByZXR1cm4gbW9kZWwuc2F2ZSgpO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWw7XG4iLCIoZnVuY3Rpb24gKHJvb3QsIGZhY3RvcnkpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZSB1bmxlc3MgYW1kTW9kdWxlSWQgaXMgc2V0XG4gICAgZGVmaW5lKFtdLCBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gKHJvb3RbJ0F1dG9saW5rZXInXSA9IGZhY3RvcnkoKSk7XG4gICAgfSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKSB7XG4gICAgLy8gTm9kZS4gRG9lcyBub3Qgd29yayB3aXRoIHN0cmljdCBDb21tb25KUywgYnV0XG4gICAgLy8gb25seSBDb21tb25KUy1saWtlIGVudmlyb25tZW50cyB0aGF0IHN1cHBvcnQgbW9kdWxlLmV4cG9ydHMsXG4gICAgLy8gbGlrZSBOb2RlLlxuICAgIG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuICB9IGVsc2Uge1xuICAgIHJvb3RbJ0F1dG9saW5rZXInXSA9IGZhY3RvcnkoKTtcbiAgfVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7XG5cbi8qIVxuICogQXV0b2xpbmtlci5qc1xuICogMC4yMi4wXG4gKlxuICogQ29weXJpZ2h0KGMpIDIwMTUgR3JlZ29yeSBKYWNvYnMgPGdyZWdAZ3JlZy1qYWNvYnMuY29tPlxuICogTUlUXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2dyZWdqYWNvYnMvQXV0b2xpbmtlci5qc1xuICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBVdGlsaXR5IGNsYXNzIHVzZWQgdG8gcHJvY2VzcyBhIGdpdmVuIHN0cmluZyBvZiB0ZXh0LCBhbmQgd3JhcCB0aGUgbWF0Y2hlcyBpblxuICogdGhlIGFwcHJvcHJpYXRlIGFuY2hvciAoJmx0O2EmZ3Q7KSB0YWdzIHRvIHR1cm4gdGhlbSBpbnRvIGxpbmtzLlxuICpcbiAqIEFueSBvZiB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIG1heSBiZSBwcm92aWRlZCBpbiBhbiBPYmplY3QgKG1hcCkgcHJvdmlkZWRcbiAqIHRvIHRoZSBBdXRvbGlua2VyIGNvbnN0cnVjdG9yLCB3aGljaCB3aWxsIGNvbmZpZ3VyZSBob3cgdGhlIHtAbGluayAjbGluayBsaW5rKCl9XG4gKiBtZXRob2Qgd2lsbCBwcm9jZXNzIHRoZSBsaW5rcy5cbiAqXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgICAgdmFyIGF1dG9saW5rZXIgPSBuZXcgQXV0b2xpbmtlcigge1xuICogICAgICAgICBuZXdXaW5kb3cgOiBmYWxzZSxcbiAqICAgICAgICAgdHJ1bmNhdGUgIDogMzBcbiAqICAgICB9ICk7XG4gKlxuICogICAgIHZhciBodG1sID0gYXV0b2xpbmtlci5saW5rKCBcIkpvZSB3ZW50IHRvIHd3dy55YWhvby5jb21cIiApO1xuICogICAgIC8vIHByb2R1Y2VzOiAnSm9lIHdlbnQgdG8gPGEgaHJlZj1cImh0dHA6Ly93d3cueWFob28uY29tXCI+eWFob28uY29tPC9hPidcbiAqXG4gKlxuICogVGhlIHtAbGluayAjc3RhdGljLWxpbmsgc3RhdGljIGxpbmsoKX0gbWV0aG9kIG1heSBhbHNvIGJlIHVzZWQgdG8gaW5saW5lIG9wdGlvbnMgaW50byBhIHNpbmdsZSBjYWxsLCB3aGljaCBtYXlcbiAqIGJlIG1vcmUgY29udmVuaWVudCBmb3Igb25lLW9mZiB1c2VzLiBGb3IgZXhhbXBsZTpcbiAqXG4gKiAgICAgdmFyIGh0bWwgPSBBdXRvbGlua2VyLmxpbmsoIFwiSm9lIHdlbnQgdG8gd3d3LnlhaG9vLmNvbVwiLCB7XG4gKiAgICAgICAgIG5ld1dpbmRvdyA6IGZhbHNlLFxuICogICAgICAgICB0cnVuY2F0ZSAgOiAzMFxuICogICAgIH0gKTtcbiAqICAgICAvLyBwcm9kdWNlczogJ0pvZSB3ZW50IHRvIDxhIGhyZWY9XCJodHRwOi8vd3d3LnlhaG9vLmNvbVwiPnlhaG9vLmNvbTwvYT4nXG4gKlxuICpcbiAqICMjIEN1c3RvbSBSZXBsYWNlbWVudHMgb2YgTGlua3NcbiAqXG4gKiBJZiB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGRvIG5vdCBwcm92aWRlIGVub3VnaCBmbGV4aWJpbGl0eSwgYSB7QGxpbmsgI3JlcGxhY2VGbn1cbiAqIG1heSBiZSBwcm92aWRlZCB0byBmdWxseSBjdXN0b21pemUgdGhlIG91dHB1dCBvZiBBdXRvbGlua2VyLiBUaGlzIGZ1bmN0aW9uIGlzXG4gKiBjYWxsZWQgb25jZSBmb3IgZWFjaCBVUkwvRW1haWwvUGhvbmUjL1R3aXR0ZXIgSGFuZGxlL0hhc2h0YWcgbWF0Y2ggdGhhdCBpc1xuICogZW5jb3VudGVyZWQuXG4gKlxuICogRm9yIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciBpbnB1dCA9IFwiLi4uXCI7ICAvLyBzdHJpbmcgd2l0aCBVUkxzLCBFbWFpbCBBZGRyZXNzZXMsIFBob25lICNzLCBUd2l0dGVyIEhhbmRsZXMsIGFuZCBIYXNodGFnc1xuICpcbiAqICAgICB2YXIgbGlua2VkVGV4dCA9IEF1dG9saW5rZXIubGluayggaW5wdXQsIHtcbiAqICAgICAgICAgcmVwbGFjZUZuIDogZnVuY3Rpb24oIGF1dG9saW5rZXIsIG1hdGNoICkge1xuICogICAgICAgICAgICAgY29uc29sZS5sb2coIFwiaHJlZiA9IFwiLCBtYXRjaC5nZXRBbmNob3JIcmVmKCkgKTtcbiAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInRleHQgPSBcIiwgbWF0Y2guZ2V0QW5jaG9yVGV4dCgpICk7XG4gKlxuICogICAgICAgICAgICAgc3dpdGNoKCBtYXRjaC5nZXRUeXBlKCkgKSB7XG4gKiAgICAgICAgICAgICAgICAgY2FzZSAndXJsJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcInVybDogXCIsIG1hdGNoLmdldFVybCgpICk7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICBpZiggbWF0Y2guZ2V0VXJsKCkuaW5kZXhPZiggJ215c2l0ZS5jb20nICkgPT09IC0xICkge1xuICogICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRhZyA9IGF1dG9saW5rZXIuZ2V0VGFnQnVpbGRlcigpLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiBgQXV0b2xpbmtlci5IdG1sVGFnYCBpbnN0YW5jZSwgd2hpY2ggcHJvdmlkZXMgbXV0YXRvciBtZXRob2RzIGZvciBlYXN5IGNoYW5nZXNcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHRhZy5zZXRBdHRyKCAncmVsJywgJ25vZm9sbG93JyApO1xuICogICAgICAgICAgICAgICAgICAgICAgICAgdGFnLmFkZENsYXNzKCAnZXh0ZXJuYWwtbGluaycgKTtcbiAqXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGFnO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlOyAgLy8gbGV0IEF1dG9saW5rZXIgcGVyZm9ybSBpdHMgbm9ybWFsIGFuY2hvciB0YWcgcmVwbGFjZW1lbnRcbiAqICAgICAgICAgICAgICAgICAgICAgfVxuICpcbiAqICAgICAgICAgICAgICAgICBjYXNlICdlbWFpbCcgOlxuICogICAgICAgICAgICAgICAgICAgICB2YXIgZW1haWwgPSBtYXRjaC5nZXRFbWFpbCgpO1xuICogICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJlbWFpbDogXCIsIGVtYWlsICk7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICBpZiggZW1haWwgPT09IFwibXlAb3duLmFkZHJlc3NcIiApIHtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTsgIC8vIGRvbid0IGF1dG8tbGluayB0aGlzIHBhcnRpY3VsYXIgZW1haWwgYWRkcmVzczsgbGVhdmUgYXMtaXNcbiAqICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAqICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjsgIC8vIG5vIHJldHVybiB2YWx1ZSB3aWxsIGhhdmUgQXV0b2xpbmtlciBwZXJmb3JtIGl0cyBub3JtYWwgYW5jaG9yIHRhZyByZXBsYWNlbWVudCAoc2FtZSBhcyByZXR1cm5pbmcgYHRydWVgKVxuICogICAgICAgICAgICAgICAgICAgICB9XG4gKlxuICogICAgICAgICAgICAgICAgIGNhc2UgJ3Bob25lJyA6XG4gKiAgICAgICAgICAgICAgICAgICAgIHZhciBwaG9uZU51bWJlciA9IG1hdGNoLmdldFBob25lTnVtYmVyKCk7XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBwaG9uZU51bWJlciApO1xuICpcbiAqICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8YSBocmVmPVwiaHR0cDovL25ld3BsYWNlLnRvLmxpbmsucGhvbmUubnVtYmVycy50by9cIj4nICsgcGhvbmVOdW1iZXIgKyAnPC9hPic7XG4gKlxuICogICAgICAgICAgICAgICAgIGNhc2UgJ3R3aXR0ZXInIDpcbiAqICAgICAgICAgICAgICAgICAgICAgdmFyIHR3aXR0ZXJIYW5kbGUgPSBtYXRjaC5nZXRUd2l0dGVySGFuZGxlKCk7XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCB0d2l0dGVySGFuZGxlICk7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vbmV3cGxhY2UudG8ubGluay50d2l0dGVyLmhhbmRsZXMudG8vXCI+JyArIHR3aXR0ZXJIYW5kbGUgKyAnPC9hPic7XG4gKlxuICogICAgICAgICAgICAgICAgIGNhc2UgJ2hhc2h0YWcnIDpcbiAqICAgICAgICAgICAgICAgICAgICAgdmFyIGhhc2h0YWcgPSBtYXRjaC5nZXRIYXNodGFnKCk7XG4gKiAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBoYXNodGFnICk7XG4gKlxuICogICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxhIGhyZWY9XCJodHRwOi8vbmV3cGxhY2UudG8ubGluay5oYXNodGFnLmhhbmRsZXMudG8vXCI+JyArIGhhc2h0YWcgKyAnPC9hPic7XG4gKiAgICAgICAgICAgICB9XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKlxuICpcbiAqIFRoZSBmdW5jdGlvbiBtYXkgcmV0dXJuIHRoZSBmb2xsb3dpbmcgdmFsdWVzOlxuICpcbiAqIC0gYHRydWVgIChCb29sZWFuKTogQWxsb3cgQXV0b2xpbmtlciB0byByZXBsYWNlIHRoZSBtYXRjaCBhcyBpdCBub3JtYWxseSB3b3VsZC5cbiAqIC0gYGZhbHNlYCAoQm9vbGVhbik6IERvIG5vdCByZXBsYWNlIHRoZSBjdXJyZW50IG1hdGNoIGF0IGFsbCAtIGxlYXZlIGFzLWlzLlxuICogLSBBbnkgU3RyaW5nOiBJZiBhIHN0cmluZyBpcyByZXR1cm5lZCBmcm9tIHRoZSBmdW5jdGlvbiwgdGhlIHN0cmluZyB3aWxsIGJlIHVzZWQgZGlyZWN0bHkgYXMgdGhlIHJlcGxhY2VtZW50IEhUTUwgZm9yXG4gKiAgIHRoZSBtYXRjaC5cbiAqIC0gQW4ge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZ30gaW5zdGFuY2UsIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGJ1aWxkL21vZGlmeSBhbiBIVE1MIHRhZyBiZWZvcmUgd3JpdGluZyBvdXQgaXRzIEhUTUwgdGV4dC5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQXV0b2xpbmtlciBpbnN0YW5jZSwgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cbiAqL1xudmFyIEF1dG9saW5rZXIgPSBmdW5jdGlvbiggY2ZnICkge1xuXHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTsgIC8vIGFzc2lnbiB0aGUgcHJvcGVydGllcyBvZiBgY2ZnYCBvbnRvIHRoZSBBdXRvbGlua2VyIGluc3RhbmNlLiBQcm90b3R5cGUgcHJvcGVydGllcyB3aWxsIGJlIHVzZWQgZm9yIG1pc3NpbmcgY29uZmlncy5cblxuXHQvLyBWYWxpZGF0ZSB0aGUgdmFsdWUgb2YgdGhlIGBoYXNodGFnYCBjZmcuXG5cdHZhciBoYXNodGFnID0gdGhpcy5oYXNodGFnO1xuXHRpZiggaGFzaHRhZyAhPT0gZmFsc2UgJiYgaGFzaHRhZyAhPT0gJ3R3aXR0ZXInICYmIGhhc2h0YWcgIT09ICdmYWNlYm9vaycgJiYgaGFzaHRhZyAhPT0gJ2luc3RhZ3JhbScgKSB7XG5cdFx0dGhyb3cgbmV3IEVycm9yKCBcImludmFsaWQgYGhhc2h0YWdgIGNmZyAtIHNlZSBkb2NzXCIgKTtcblx0fVxuXG5cdC8vIE5vcm1hbGl6ZSB0aGUgY29uZmlnc1xuXHR0aGlzLnVybHMgICAgID0gdGhpcy5ub3JtYWxpemVVcmxzQ2ZnKCB0aGlzLnVybHMgKTtcblx0dGhpcy50cnVuY2F0ZSA9IHRoaXMubm9ybWFsaXplVHJ1bmNhdGVDZmcoIHRoaXMudHJ1bmNhdGUgKTtcbn07XG5cbkF1dG9saW5rZXIucHJvdG90eXBlID0ge1xuXHRjb25zdHJ1Y3RvciA6IEF1dG9saW5rZXIsICAvLyBmaXggY29uc3RydWN0b3IgcHJvcGVydHlcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbi9PYmplY3R9IHVybHNcblx0ICpcblx0ICogYHRydWVgIGlmIFVSTHMgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbGlua2VkLCBgZmFsc2VgIGlmIHRoZXkgc2hvdWxkIG5vdFxuXHQgKiBiZS5cblx0ICpcblx0ICogVGhpcyBvcHRpb24gYWxzbyBhY2NlcHRzIGFuIE9iamVjdCBmb3JtIHdpdGggMyBwcm9wZXJ0aWVzLCB0byBhbGxvdyBmb3Jcblx0ICogbW9yZSBjdXN0b21pemF0aW9uIG9mIHdoYXQgZXhhY3RseSBnZXRzIGxpbmtlZC4gQWxsIGRlZmF1bHQgdG8gYHRydWVgOlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IHNjaGVtZU1hdGNoZXMgYHRydWVgIHRvIG1hdGNoIFVSTHMgZm91bmQgcHJlZml4ZWQgd2l0aCBhXG5cdCAqICAgc2NoZW1lLCBpLmUuIGBodHRwOi8vZ29vZ2xlLmNvbWAsIG9yIGBvdGhlcitzY2hlbWU6Ly9nb29nbGUuY29tYCxcblx0ICogICBgZmFsc2VgIHRvIHByZXZlbnQgdGhlc2UgdHlwZXMgb2YgbWF0Y2hlcy5cblx0ICogQHBhcmFtIHtCb29sZWFufSB3d3dNYXRjaGVzIGB0cnVlYCB0byBtYXRjaCB1cmxzIGZvdW5kIHByZWZpeGVkIHdpdGhcblx0ICogICBgJ3d3dy4nYCwgaS5lLiBgd3d3Lmdvb2dsZS5jb21gLiBgZmFsc2VgIHRvIHByZXZlbnQgdGhlc2UgdHlwZXMgb2Zcblx0ICogICBtYXRjaGVzLiBOb3RlIHRoYXQgaWYgdGhlIFVSTCBoYWQgYSBwcmVmaXhlZCBzY2hlbWUsIGFuZFxuXHQgKiAgIGBzY2hlbWVNYXRjaGVzYCBpcyB0cnVlLCBpdCB3aWxsIHN0aWxsIGJlIGxpbmtlZC5cblx0ICogQHBhcmFtIHtCb29sZWFufSB0bGRNYXRjaGVzIGB0cnVlYCB0byBtYXRjaCBVUkxzIHdpdGgga25vd24gdG9wIGxldmVsXG5cdCAqICAgZG9tYWlucyAoLmNvbSwgLm5ldCwgZXRjLikgdGhhdCBhcmUgbm90IHByZWZpeGVkIHdpdGggYSBzY2hlbWUgb3Jcblx0ICogICBgJ3d3dy4nYC4gVGhpcyBvcHRpb24gYXR0ZW1wdHMgdG8gbWF0Y2ggYW55dGhpbmcgdGhhdCBsb29rcyBsaWtlIGEgVVJMXG5cdCAqICAgaW4gdGhlIGdpdmVuIHRleHQuIEV4OiBgZ29vZ2xlLmNvbWAsIGBhc2RmLm9yZy8/cGFnZT0xYCwgZXRjLiBgZmFsc2VgXG5cdCAqICAgdG8gcHJldmVudCB0aGVzZSB0eXBlcyBvZiBtYXRjaGVzLlxuXHQgKi9cblx0dXJscyA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IGVtYWlsXG5cdCAqXG5cdCAqIGB0cnVlYCBpZiBlbWFpbCBhZGRyZXNzZXMgc2hvdWxkIGJlIGF1dG9tYXRpY2FsbHkgbGlua2VkLCBgZmFsc2VgIGlmIHRoZXlcblx0ICogc2hvdWxkIG5vdCBiZS5cblx0ICovXG5cdGVtYWlsIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gdHdpdHRlclxuXHQgKlxuXHQgKiBgdHJ1ZWAgaWYgVHdpdHRlciBoYW5kbGVzIChcIkBleGFtcGxlXCIpIHNob3VsZCBiZSBhdXRvbWF0aWNhbGx5IGxpbmtlZCxcblx0ICogYGZhbHNlYCBpZiB0aGV5IHNob3VsZCBub3QgYmUuXG5cdCAqL1xuXHR0d2l0dGVyIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gcGhvbmVcblx0ICpcblx0ICogYHRydWVgIGlmIFBob25lIG51bWJlcnMgKFwiKDU1NSk1NTUtNTU1NVwiKSBzaG91bGQgYmUgYXV0b21hdGljYWxseSBsaW5rZWQsXG5cdCAqIGBmYWxzZWAgaWYgdGhleSBzaG91bGQgbm90IGJlLlxuXHQgKi9cblx0cGhvbmU6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW4vU3RyaW5nfSBoYXNodGFnXG5cdCAqXG5cdCAqIEEgc3RyaW5nIGZvciB0aGUgc2VydmljZSBuYW1lIHRvIGhhdmUgaGFzaHRhZ3MgKGV4OiBcIiNteUhhc2h0YWdcIilcblx0ICogYXV0by1saW5rZWQgdG8uIFRoZSBjdXJyZW50bHktc3VwcG9ydGVkIHZhbHVlcyBhcmU6XG5cdCAqXG5cdCAqIC0gJ3R3aXR0ZXInXG5cdCAqIC0gJ2ZhY2Vib29rJ1xuXHQgKiAtICdpbnN0YWdyYW0nXG5cdCAqXG5cdCAqIFBhc3MgYGZhbHNlYCB0byBza2lwIGF1dG8tbGlua2luZyBvZiBoYXNodGFncy5cblx0ICovXG5cdGhhc2h0YWcgOiBmYWxzZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gbmV3V2luZG93XG5cdCAqXG5cdCAqIGB0cnVlYCBpZiB0aGUgbGlua3Mgc2hvdWxkIG9wZW4gaW4gYSBuZXcgd2luZG93LCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdG5ld1dpbmRvdyA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHN0cmlwUHJlZml4XG5cdCAqXG5cdCAqIGB0cnVlYCBpZiAnaHR0cDovLycgb3IgJ2h0dHBzOi8vJyBhbmQvb3IgdGhlICd3d3cuJyBzaG91bGQgYmUgc3RyaXBwZWRcblx0ICogZnJvbSB0aGUgYmVnaW5uaW5nIG9mIFVSTCBsaW5rcycgdGV4dCwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHRzdHJpcFByZWZpeCA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge051bWJlci9PYmplY3R9IHRydW5jYXRlXG5cdCAqXG5cdCAqICMjIE51bWJlciBGb3JtXG5cdCAqXG5cdCAqIEEgbnVtYmVyIGZvciBob3cgbWFueSBjaGFyYWN0ZXJzIG1hdGNoZWQgdGV4dCBzaG91bGQgYmUgdHJ1bmNhdGVkIHRvXG5cdCAqIGluc2lkZSB0aGUgdGV4dCBvZiBhIGxpbmsuIElmIHRoZSBtYXRjaGVkIHRleHQgaXMgb3ZlciB0aGlzIG51bWJlciBvZlxuXHQgKiBjaGFyYWN0ZXJzLCBpdCB3aWxsIGJlIHRydW5jYXRlZCB0byB0aGlzIGxlbmd0aCBieSBhZGRpbmcgYSB0d28gcGVyaW9kXG5cdCAqIGVsbGlwc2lzICgnLi4nKSB0byB0aGUgZW5kIG9mIHRoZSBzdHJpbmcuXG5cdCAqXG5cdCAqIEZvciBleGFtcGxlOiBBIHVybCBsaWtlICdodHRwOi8vd3d3LnlhaG9vLmNvbS9zb21lL2xvbmcvcGF0aC90by9hL2ZpbGUnXG5cdCAqIHRydW5jYXRlZCB0byAyNSBjaGFyYWN0ZXJzIG1pZ2h0IGxvb2sgc29tZXRoaW5nIGxpa2UgdGhpczpcblx0ICogJ3lhaG9vLmNvbS9zb21lL2xvbmcvcGF0Li4nXG5cdCAqXG5cdCAqIEV4YW1wbGUgVXNhZ2U6XG5cdCAqXG5cdCAqICAgICB0cnVuY2F0ZTogMjVcblx0ICpcblx0ICpcblx0ICogIyMgT2JqZWN0IEZvcm1cblx0ICpcblx0ICogQW4gT2JqZWN0IG1heSBhbHNvIGJlIHByb3ZpZGVkIHdpdGggdHdvIHByb3BlcnRpZXM6IGBsZW5ndGhgIChOdW1iZXIpIGFuZFxuXHQgKiBgbG9jYXRpb25gIChTdHJpbmcpLiBgbG9jYXRpb25gIG1heSBiZSBvbmUgb2YgdGhlIGZvbGxvd2luZzogJ2VuZCdcblx0ICogKGRlZmF1bHQpLCAnbWlkZGxlJywgb3IgJ3NtYXJ0Jy5cblx0ICpcblx0ICogRXhhbXBsZSBVc2FnZTpcblx0ICpcblx0ICogICAgIHRydW5jYXRlOiB7IGxlbmd0aDogMjUsIGxvY2F0aW9uOiAnbWlkZGxlJyB9XG5cdCAqXG5cdCAqIEBjZmcge051bWJlcn0gdHJ1bmNhdGUubGVuZ3RoIEhvdyBtYW55IGNoYXJhY3RlcnMgdG8gYWxsb3cgYmVmb3JlXG5cdCAqICAgdHJ1bmNhdGlvbiB3aWxsIG9jY3VyLlxuXHQgKiBAY2ZnIHtcImVuZFwiL1wibWlkZGxlXCIvXCJzbWFydFwifSBbdHJ1bmNhdGUubG9jYXRpb249XCJlbmRcIl1cblx0ICpcblx0ICogLSAnZW5kJyAoZGVmYXVsdCk6IHdpbGwgdHJ1bmNhdGUgdXAgdG8gdGhlIG51bWJlciBvZiBjaGFyYWN0ZXJzLCBhbmQgdGhlblxuXHQgKiAgIGFkZCBhbiBlbGxpcHNpcyBhdCB0aGUgZW5kLiBFeDogJ3lhaG9vLmNvbS9zb21lL2xvbmcvcGF0Li4nXG5cdCAqIC0gJ21pZGRsZSc6IHdpbGwgdHJ1bmNhdGUgYW5kIGFkZCB0aGUgZWxsaXBzaXMgaW4gdGhlIG1pZGRsZS4gRXg6XG5cdCAqICAgJ3lhaG9vLmNvbS9zLi50aC90by9hL2ZpbGUnXG5cdCAqIC0gJ3NtYXJ0JzogZm9yIFVSTHMgd2hlcmUgdGhlIGFsZ29yaXRobSBhdHRlbXB0cyB0byBzdHJpcCBvdXQgdW5uZWNlc3Nhcnlcblx0ICogICBwYXJ0cyBmaXJzdCAoc3VjaCBhcyB0aGUgJ3d3dy4nLCB0aGVuIFVSTCBzY2hlbWUsIGhhc2gsIGV0Yy4pLFxuXHQgKiAgIGF0dGVtcHRpbmcgdG8gbWFrZSB0aGUgVVJMIGh1bWFuLXJlYWRhYmxlIGJlZm9yZSBsb29raW5nIGZvciBhIGdvb2Rcblx0ICogICBwb2ludCB0byBpbnNlcnQgdGhlIGVsbGlwc2lzIGlmIGl0IGlzIHN0aWxsIHRvbyBsb25nLiBFeDpcblx0ICogICAneWFob28uY29tL3NvbWUuLnRvL2EvZmlsZScuIEZvciBtb3JlIGRldGFpbHMsIHNlZVxuXHQgKiAgIHtAbGluayBBdXRvbGlua2VyLnRydW5jYXRlLlRydW5jYXRlU21hcnR9LlxuXHQgKi9cblx0dHJ1bmNhdGUgOiB1bmRlZmluZWQsXG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gY2xhc3NOYW1lXG5cdCAqXG5cdCAqIEEgQ1NTIGNsYXNzIG5hbWUgdG8gYWRkIHRvIHRoZSBnZW5lcmF0ZWQgbGlua3MuIFRoaXMgY2xhc3Mgd2lsbCBiZSBhZGRlZCB0byBhbGwgbGlua3MsIGFzIHdlbGwgYXMgdGhpcyBjbGFzc1xuXHQgKiBwbHVzIG1hdGNoIHN1ZmZpeGVzIGZvciBzdHlsaW5nIHVybC9lbWFpbC9waG9uZS90d2l0dGVyL2hhc2h0YWcgbGlua3MgZGlmZmVyZW50bHkuXG5cdCAqXG5cdCAqIEZvciBleGFtcGxlLCBpZiB0aGlzIGNvbmZpZyBpcyBwcm92aWRlZCBhcyBcIm15TGlua1wiLCB0aGVuOlxuXHQgKlxuXHQgKiAtIFVSTCBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstdXJsXCJcblx0ICogLSBFbWFpbCBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstZW1haWxcIiwgYW5kXG5cdCAqIC0gVHdpdHRlciBsaW5rcyB3aWxsIGhhdmUgdGhlIENTUyBjbGFzc2VzOiBcIm15TGluayBteUxpbmstdHdpdHRlclwiXG5cdCAqIC0gUGhvbmUgbGlua3Mgd2lsbCBoYXZlIHRoZSBDU1MgY2xhc3NlczogXCJteUxpbmsgbXlMaW5rLXBob25lXCJcblx0ICogLSBIYXNodGFnIGxpbmtzIHdpbGwgaGF2ZSB0aGUgQ1NTIGNsYXNzZXM6IFwibXlMaW5rIG15TGluay1oYXNodGFnXCJcblx0ICovXG5cdGNsYXNzTmFtZSA6IFwiXCIsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Z1bmN0aW9ufSByZXBsYWNlRm5cblx0ICpcblx0ICogQSBmdW5jdGlvbiB0byBpbmRpdmlkdWFsbHkgcHJvY2VzcyBlYWNoIG1hdGNoIGZvdW5kIGluIHRoZSBpbnB1dCBzdHJpbmcuXG5cdCAqXG5cdCAqIFNlZSB0aGUgY2xhc3MncyBkZXNjcmlwdGlvbiBmb3IgdXNhZ2UuXG5cdCAqXG5cdCAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdpdGggdGhlIGZvbGxvd2luZyBwYXJhbWV0ZXJzOlxuXHQgKlxuXHQgKiBAY2ZnIHtBdXRvbGlua2VyfSByZXBsYWNlRm4uYXV0b2xpbmtlciBUaGUgQXV0b2xpbmtlciBpbnN0YW5jZSwgd2hpY2ggbWF5IGJlIHVzZWQgdG8gcmV0cmlldmUgY2hpbGQgb2JqZWN0cyBmcm9tIChzdWNoXG5cdCAqICAgYXMgdGhlIGluc3RhbmNlJ3Mge0BsaW5rICNnZXRUYWdCdWlsZGVyIHRhZyBidWlsZGVyfSkuXG5cdCAqIEBjZmcge0F1dG9saW5rZXIubWF0Y2guTWF0Y2h9IHJlcGxhY2VGbi5tYXRjaCBUaGUgTWF0Y2ggaW5zdGFuY2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlXG5cdCAqICAgbWF0Y2ggdGhhdCB0aGUgYHJlcGxhY2VGbmAgaXMgY3VycmVudGx5IHByb2Nlc3NpbmcuIFNlZSB7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0gc3ViY2xhc3NlcyBmb3IgZGV0YWlscy5cblx0ICovXG5cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0gaHRtbFBhcnNlclxuXHQgKlxuXHQgKiBUaGUgSHRtbFBhcnNlciBpbnN0YW5jZSB1c2VkIHRvIHNraXAgb3ZlciBIVE1MIHRhZ3MsIHdoaWxlIGZpbmRpbmcgdGV4dCBub2RlcyB0byBwcm9jZXNzLiBUaGlzIGlzIGxhemlseSBpbnN0YW50aWF0ZWRcblx0ICogaW4gdGhlIHtAbGluayAjZ2V0SHRtbFBhcnNlcn0gbWV0aG9kLlxuXHQgKi9cblx0aHRtbFBhcnNlciA6IHVuZGVmaW5lZCxcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyfSBtYXRjaFBhcnNlclxuXHQgKlxuXHQgKiBUaGUgTWF0Y2hQYXJzZXIgaW5zdGFuY2UgdXNlZCB0byBmaW5kIG1hdGNoZXMgaW4gdGhlIHRleHQgbm9kZXMgb2YgYW4gaW5wdXQgc3RyaW5nIHBhc3NlZCB0b1xuXHQgKiB7QGxpbmsgI2xpbmt9LiBUaGlzIGlzIGxhemlseSBpbnN0YW50aWF0ZWQgaW4gdGhlIHtAbGluayAjZ2V0TWF0Y2hQYXJzZXJ9IG1ldGhvZC5cblx0ICovXG5cdG1hdGNoUGFyc2VyIDogdW5kZWZpbmVkLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0F1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlcn0gdGFnQnVpbGRlclxuXHQgKlxuXHQgKiBUaGUgQW5jaG9yVGFnQnVpbGRlciBpbnN0YW5jZSB1c2VkIHRvIGJ1aWxkIG1hdGNoIHJlcGxhY2VtZW50IGFuY2hvciB0YWdzLiBOb3RlOiB0aGlzIGlzIGxhemlseSBpbnN0YW50aWF0ZWRcblx0ICogaW4gdGhlIHtAbGluayAjZ2V0VGFnQnVpbGRlcn0gbWV0aG9kLlxuXHQgKi9cblx0dGFnQnVpbGRlciA6IHVuZGVmaW5lZCxcblxuXG5cdC8qKlxuXHQgKiBOb3JtYWxpemVzIHRoZSB7QGxpbmsgI3VybHN9IGNvbmZpZyBpbnRvIGFuIE9iamVjdCB3aXRoIDMgcHJvcGVydGllczpcblx0ICogYHNjaGVtZU1hdGNoZXNgLCBgd3d3TWF0Y2hlc2AsIGFuZCBgdGxkTWF0Y2hlc2AsIGFsbCBCb29sZWFucy5cblx0ICpcblx0ICogU2VlIHtAbGluayAjdXJsc30gY29uZmlnIGZvciBkZXRhaWxzLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge0Jvb2xlYW4vT2JqZWN0fSB1cmxzXG5cdCAqIEByZXR1cm4ge09iamVjdH1cblx0ICovXG5cdG5vcm1hbGl6ZVVybHNDZmcgOiBmdW5jdGlvbiggdXJscyApIHtcblx0XHRpZiggdHlwZW9mIHVybHMgPT09ICdib29sZWFuJyApIHtcblx0XHRcdHJldHVybiB7IHNjaGVtZU1hdGNoZXM6IHVybHMsIHd3d01hdGNoZXM6IHVybHMsIHRsZE1hdGNoZXM6IHVybHMgfTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIEF1dG9saW5rZXIuVXRpbC5kZWZhdWx0cyggdXJscyB8fCB7fSwgeyBzY2hlbWVNYXRjaGVzOiB0cnVlLCB3d3dNYXRjaGVzOiB0cnVlLCB0bGRNYXRjaGVzOiB0cnVlIH0gKTtcblx0XHR9XG5cdH0sXG5cblxuXHQvKipcblx0ICogTm9ybWFsaXplcyB0aGUge0BsaW5rICN0cnVuY2F0ZX0gY29uZmlnIGludG8gYW4gT2JqZWN0IHdpdGggMiBwcm9wZXJ0aWVzOlxuXHQgKiBgbGVuZ3RoYCAoTnVtYmVyKSwgYW5kIGBsb2NhdGlvbmAgKFN0cmluZykuXG5cdCAqXG5cdCAqIFNlZSB7QGxpbmsgI3RydW5jYXRlfSBjb25maWcgZm9yIGRldGFpbHMuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7TnVtYmVyL09iamVjdH0gdHJ1bmNhdGVcblx0ICogQHJldHVybiB7T2JqZWN0fVxuXHQgKi9cblx0bm9ybWFsaXplVHJ1bmNhdGVDZmcgOiBmdW5jdGlvbiggdHJ1bmNhdGUgKSB7XG5cdFx0aWYoIHR5cGVvZiB0cnVuY2F0ZSA9PT0gJ251bWJlcicgKSB7XG5cdFx0XHRyZXR1cm4geyBsZW5ndGg6IHRydW5jYXRlLCBsb2NhdGlvbjogJ2VuZCcgfTtcblxuXHRcdH0gZWxzZSB7ICAvLyBvYmplY3QsIG9yIHVuZGVmaW5lZC9udWxsXG5cdFx0XHRyZXR1cm4gQXV0b2xpbmtlci5VdGlsLmRlZmF1bHRzKCB0cnVuY2F0ZSB8fCB7fSwge1xuXHRcdFx0XHRsZW5ndGggICA6IE51bWJlci5QT1NJVElWRV9JTkZJTklUWSxcblx0XHRcdFx0bG9jYXRpb24gOiAnZW5kJ1xuXHRcdFx0fSApO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBBdXRvbWF0aWNhbGx5IGxpbmtzIFVSTHMsIEVtYWlsIGFkZHJlc3NlcywgUGhvbmUgbnVtYmVycywgVHdpdHRlclxuXHQgKiBoYW5kbGVzLCBhbmQgSGFzaHRhZ3MgZm91bmQgaW4gdGhlIGdpdmVuIGNodW5rIG9mIEhUTUwuIERvZXMgbm90IGxpbmtcblx0ICogVVJMcyBmb3VuZCB3aXRoaW4gSFRNTCB0YWdzLlxuXHQgKlxuXHQgKiBGb3IgaW5zdGFuY2UsIGlmIGdpdmVuIHRoZSB0ZXh0OiBgWW91IHNob3VsZCBnbyB0byBodHRwOi8vd3d3LnlhaG9vLmNvbWAsXG5cdCAqIHRoZW4gdGhlIHJlc3VsdCB3aWxsIGJlIGBZb3Ugc2hvdWxkIGdvIHRvXG5cdCAqICZsdDthIGhyZWY9XCJodHRwOi8vd3d3LnlhaG9vLmNvbVwiJmd0O2h0dHA6Ly93d3cueWFob28uY29tJmx0Oy9hJmd0O2Bcblx0ICpcblx0ICogVGhpcyBtZXRob2QgZmluZHMgdGhlIHRleHQgYXJvdW5kIGFueSBIVE1MIGVsZW1lbnRzIGluIHRoZSBpbnB1dFxuXHQgKiBgdGV4dE9ySHRtbGAsIHdoaWNoIHdpbGwgYmUgdGhlIHRleHQgdGhhdCBpcyBwcm9jZXNzZWQuIEFueSBvcmlnaW5hbCBIVE1MXG5cdCAqIGVsZW1lbnRzIHdpbGwgYmUgbGVmdCBhcy1pcywgYXMgd2VsbCBhcyB0aGUgdGV4dCB0aGF0IGlzIGFscmVhZHkgd3JhcHBlZFxuXHQgKiBpbiBhbmNob3IgKCZsdDthJmd0OykgdGFncy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHRPckh0bWwgVGhlIEhUTUwgb3IgdGV4dCB0byBhdXRvbGluayBtYXRjaGVzIHdpdGhpblxuXHQgKiAgIChkZXBlbmRpbmcgb24gaWYgdGhlIHtAbGluayAjdXJsc30sIHtAbGluayAjZW1haWx9LCB7QGxpbmsgI3Bob25lfSxcblx0ICogICB7QGxpbmsgI3R3aXR0ZXJ9LCBhbmQge0BsaW5rICNoYXNodGFnfSBvcHRpb25zIGFyZSBlbmFibGVkKS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgSFRNTCwgd2l0aCBtYXRjaGVzIGF1dG9tYXRpY2FsbHkgbGlua2VkLlxuXHQgKi9cblx0bGluayA6IGZ1bmN0aW9uKCB0ZXh0T3JIdG1sICkge1xuXHRcdGlmKCAhdGV4dE9ySHRtbCApIHsgcmV0dXJuIFwiXCI7IH0gIC8vIGhhbmRsZSBgbnVsbGAgYW5kIGB1bmRlZmluZWRgXG5cblx0XHR2YXIgaHRtbFBhcnNlciA9IHRoaXMuZ2V0SHRtbFBhcnNlcigpLFxuXHRcdCAgICBodG1sTm9kZXMgPSBodG1sUGFyc2VyLnBhcnNlKCB0ZXh0T3JIdG1sICksXG5cdFx0ICAgIGFuY2hvclRhZ1N0YWNrQ291bnQgPSAwLCAgLy8gdXNlZCB0byBvbmx5IHByb2Nlc3MgdGV4dCBhcm91bmQgYW5jaG9yIHRhZ3MsIGFuZCBhbnkgaW5uZXIgdGV4dC9odG1sIHRoZXkgbWF5IGhhdmVcblx0XHQgICAgcmVzdWx0SHRtbCA9IFtdO1xuXG5cdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGh0bWxOb2Rlcy5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdHZhciBub2RlID0gaHRtbE5vZGVzWyBpIF0sXG5cdFx0XHQgICAgbm9kZVR5cGUgPSBub2RlLmdldFR5cGUoKSxcblx0XHRcdCAgICBub2RlVGV4dCA9IG5vZGUuZ2V0VGV4dCgpO1xuXG5cdFx0XHRpZiggbm9kZVR5cGUgPT09ICdlbGVtZW50JyApIHtcblx0XHRcdFx0Ly8gUHJvY2VzcyBIVE1MIG5vZGVzIGluIHRoZSBpbnB1dCBgdGV4dE9ySHRtbGBcblx0XHRcdFx0aWYoIG5vZGUuZ2V0VGFnTmFtZSgpID09PSAnYScgKSB7XG5cdFx0XHRcdFx0aWYoICFub2RlLmlzQ2xvc2luZygpICkgeyAgLy8gaXQncyB0aGUgc3RhcnQgPGE+IHRhZ1xuXHRcdFx0XHRcdFx0YW5jaG9yVGFnU3RhY2tDb3VudCsrO1xuXHRcdFx0XHRcdH0gZWxzZSB7ICAgLy8gaXQncyB0aGUgZW5kIDwvYT4gdGFnXG5cdFx0XHRcdFx0XHRhbmNob3JUYWdTdGFja0NvdW50ID0gTWF0aC5tYXgoIGFuY2hvclRhZ1N0YWNrQ291bnQgLSAxLCAwICk7ICAvLyBhdHRlbXB0IHRvIGhhbmRsZSBleHRyYW5lb3VzIDwvYT4gdGFncyBieSBtYWtpbmcgc3VyZSB0aGUgc3RhY2sgY291bnQgbmV2ZXIgZ29lcyBiZWxvdyAwXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHRcdHJlc3VsdEh0bWwucHVzaCggbm9kZVRleHQgKTsgIC8vIG5vdyBhZGQgdGhlIHRleHQgb2YgdGhlIHRhZyBpdHNlbGYgdmVyYmF0aW1cblxuXHRcdFx0fSBlbHNlIGlmKCBub2RlVHlwZSA9PT0gJ2VudGl0eScgfHwgbm9kZVR5cGUgPT09ICdjb21tZW50JyApIHtcblx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBub2RlVGV4dCApOyAgLy8gYXBwZW5kIEhUTUwgZW50aXR5IG5vZGVzIChzdWNoIGFzICcmbmJzcDsnKSBvciBIVE1MIGNvbW1lbnRzIChzdWNoIGFzICc8IS0tIENvbW1lbnQgLS0+JykgdmVyYmF0aW1cblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gUHJvY2VzcyB0ZXh0IG5vZGVzIGluIHRoZSBpbnB1dCBgdGV4dE9ySHRtbGBcblx0XHRcdFx0aWYoIGFuY2hvclRhZ1N0YWNrQ291bnQgPT09IDAgKSB7XG5cdFx0XHRcdFx0Ly8gSWYgd2UncmUgbm90IHdpdGhpbiBhbiA8YT4gdGFnLCBwcm9jZXNzIHRoZSB0ZXh0IG5vZGUgdG8gbGlua2lmeVxuXHRcdFx0XHRcdHZhciBsaW5raWZpZWRTdHIgPSB0aGlzLmxpbmtpZnlTdHIoIG5vZGVUZXh0ICk7XG5cdFx0XHRcdFx0cmVzdWx0SHRtbC5wdXNoKCBsaW5raWZpZWRTdHIgKTtcblxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdC8vIGB0ZXh0YCBpcyB3aXRoaW4gYW4gPGE+IHRhZywgc2ltcGx5IGFwcGVuZCB0aGUgdGV4dCAtIHdlIGRvIG5vdCB3YW50IHRvIGF1dG9saW5rIGFueXRoaW5nXG5cdFx0XHRcdFx0Ly8gYWxyZWFkeSB3aXRoaW4gYW4gPGE+Li4uPC9hPiB0YWdcblx0XHRcdFx0XHRyZXN1bHRIdG1sLnB1c2goIG5vZGVUZXh0ICk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gcmVzdWx0SHRtbC5qb2luKCBcIlwiICk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFByb2Nlc3MgdGhlIHRleHQgdGhhdCBsaWVzIGluIGJldHdlZW4gSFRNTCB0YWdzLCBwZXJmb3JtaW5nIHRoZSBhbmNob3Jcblx0ICogdGFnIHJlcGxhY2VtZW50cyBmb3IgdGhlIG1hdGNoZXMsIGFuZCByZXR1cm5zIHRoZSBzdHJpbmcgd2l0aCB0aGVcblx0ICogcmVwbGFjZW1lbnRzIG1hZGUuXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGRvZXMgdGhlIGFjdHVhbCB3cmFwcGluZyBvZiBtYXRjaGVzIHdpdGggYW5jaG9yIHRhZ3MuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyBvZiB0ZXh0IHRvIGF1dG8tbGluay5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgdGV4dCB3aXRoIGFuY2hvciB0YWdzIGF1dG8tZmlsbGVkLlxuXHQgKi9cblx0bGlua2lmeVN0ciA6IGZ1bmN0aW9uKCBzdHIgKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0TWF0Y2hQYXJzZXIoKS5yZXBsYWNlKCBzdHIsIHRoaXMuY3JlYXRlTWF0Y2hSZXR1cm5WYWwsIHRoaXMgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSByZXR1cm4gc3RyaW5nIHZhbHVlIGZvciBhIGdpdmVuIG1hdGNoIGluIHRoZSBpbnB1dCBzdHJpbmcsXG5cdCAqIGZvciB0aGUge0BsaW5rICNsaW5raWZ5U3RyfSBtZXRob2QuXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGhhbmRsZXMgdGhlIHtAbGluayAjcmVwbGFjZUZufSwgaWYgb25lIHdhcyBwcm92aWRlZC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtBdXRvbGlua2VyLm1hdGNoLk1hdGNofSBtYXRjaCBUaGUgTWF0Y2ggb2JqZWN0IHRoYXQgcmVwcmVzZW50cyB0aGUgbWF0Y2guXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHN0cmluZyB0aGF0IHRoZSBgbWF0Y2hgIHNob3VsZCBiZSByZXBsYWNlZCB3aXRoLiBUaGlzIGlzIHVzdWFsbHkgdGhlIGFuY2hvciB0YWcgc3RyaW5nLCBidXRcblx0ICogICBtYXkgYmUgdGhlIGBtYXRjaFN0cmAgaXRzZWxmIGlmIHRoZSBtYXRjaCBpcyBub3QgdG8gYmUgcmVwbGFjZWQuXG5cdCAqL1xuXHRjcmVhdGVNYXRjaFJldHVyblZhbCA6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHQvLyBIYW5kbGUgYSBjdXN0b20gYHJlcGxhY2VGbmAgYmVpbmcgcHJvdmlkZWRcblx0XHR2YXIgcmVwbGFjZUZuUmVzdWx0O1xuXHRcdGlmKCB0aGlzLnJlcGxhY2VGbiApIHtcblx0XHRcdHJlcGxhY2VGblJlc3VsdCA9IHRoaXMucmVwbGFjZUZuLmNhbGwoIHRoaXMsIHRoaXMsIG1hdGNoICk7ICAvLyBBdXRvbGlua2VyIGluc3RhbmNlIGlzIHRoZSBjb250ZXh0LCBhbmQgdGhlIGZpcnN0IGFyZ1xuXHRcdH1cblxuXHRcdGlmKCB0eXBlb2YgcmVwbGFjZUZuUmVzdWx0ID09PSAnc3RyaW5nJyApIHtcblx0XHRcdHJldHVybiByZXBsYWNlRm5SZXN1bHQ7ICAvLyBgcmVwbGFjZUZuYCByZXR1cm5lZCBhIHN0cmluZywgdXNlIHRoYXRcblxuXHRcdH0gZWxzZSBpZiggcmVwbGFjZUZuUmVzdWx0ID09PSBmYWxzZSApIHtcblx0XHRcdHJldHVybiBtYXRjaC5nZXRNYXRjaGVkVGV4dCgpOyAgLy8gbm8gcmVwbGFjZW1lbnQgZm9yIHRoZSBtYXRjaFxuXG5cdFx0fSBlbHNlIGlmKCByZXBsYWNlRm5SZXN1bHQgaW5zdGFuY2VvZiBBdXRvbGlua2VyLkh0bWxUYWcgKSB7XG5cdFx0XHRyZXR1cm4gcmVwbGFjZUZuUmVzdWx0LnRvQW5jaG9yU3RyaW5nKCk7XG5cblx0XHR9IGVsc2UgeyAgLy8gcmVwbGFjZUZuUmVzdWx0ID09PSB0cnVlLCBvciBuby91bmtub3duIHJldHVybiB2YWx1ZSBmcm9tIGZ1bmN0aW9uXG5cdFx0XHQvLyBQZXJmb3JtIEF1dG9saW5rZXIncyBkZWZhdWx0IGFuY2hvciB0YWcgZ2VuZXJhdGlvblxuXHRcdFx0dmFyIHRhZ0J1aWxkZXIgPSB0aGlzLmdldFRhZ0J1aWxkZXIoKSxcblx0XHRcdCAgICBhbmNob3JUYWcgPSB0YWdCdWlsZGVyLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiBBdXRvbGlua2VyLkh0bWxUYWcgaW5zdGFuY2VcblxuXHRcdFx0cmV0dXJuIGFuY2hvclRhZy50b0FuY2hvclN0cmluZygpO1xuXHRcdH1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBMYXppbHkgaW5zdGFudGlhdGVzIGFuZCByZXR1cm5zIHRoZSB7QGxpbmsgI2h0bWxQYXJzZXJ9IGluc3RhbmNlIGZvciB0aGlzIEF1dG9saW5rZXIgaW5zdGFuY2UuXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9XG5cdCAqL1xuXHRnZXRIdG1sUGFyc2VyIDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGh0bWxQYXJzZXIgPSB0aGlzLmh0bWxQYXJzZXI7XG5cblx0XHRpZiggIWh0bWxQYXJzZXIgKSB7XG5cdFx0XHRodG1sUGFyc2VyID0gdGhpcy5odG1sUGFyc2VyID0gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sUGFyc2VyKCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGh0bWxQYXJzZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogTGF6aWx5IGluc3RhbnRpYXRlcyBhbmQgcmV0dXJucyB0aGUge0BsaW5rICNtYXRjaFBhcnNlcn0gaW5zdGFuY2UgZm9yIHRoaXMgQXV0b2xpbmtlciBpbnN0YW5jZS5cblx0ICpcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyfVxuXHQgKi9cblx0Z2V0TWF0Y2hQYXJzZXIgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWF0Y2hQYXJzZXIgPSB0aGlzLm1hdGNoUGFyc2VyO1xuXG5cdFx0aWYoICFtYXRjaFBhcnNlciApIHtcblx0XHRcdG1hdGNoUGFyc2VyID0gdGhpcy5tYXRjaFBhcnNlciA9IG5ldyBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyKCB7XG5cdFx0XHRcdHVybHMgICAgICAgIDogdGhpcy51cmxzLFxuXHRcdFx0XHRlbWFpbCAgICAgICA6IHRoaXMuZW1haWwsXG5cdFx0XHRcdHR3aXR0ZXIgICAgIDogdGhpcy50d2l0dGVyLFxuXHRcdFx0XHRwaG9uZSAgICAgICA6IHRoaXMucGhvbmUsXG5cdFx0XHRcdGhhc2h0YWcgICAgIDogdGhpcy5oYXNodGFnLFxuXHRcdFx0XHRzdHJpcFByZWZpeCA6IHRoaXMuc3RyaXBQcmVmaXhcblx0XHRcdH0gKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbWF0Y2hQYXJzZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUge0BsaW5rICN0YWdCdWlsZGVyfSBpbnN0YW5jZSBmb3IgdGhpcyBBdXRvbGlua2VyIGluc3RhbmNlLCBsYXppbHkgaW5zdGFudGlhdGluZyBpdFxuXHQgKiBpZiBpdCBkb2VzIG5vdCB5ZXQgZXhpc3QuXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIG1heSBiZSB1c2VkIGluIGEge0BsaW5rICNyZXBsYWNlRm59IHRvIGdlbmVyYXRlIHRoZSB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnIEh0bWxUYWd9IGluc3RhbmNlIHRoYXRcblx0ICogQXV0b2xpbmtlciB3b3VsZCBub3JtYWxseSBnZW5lcmF0ZSwgYW5kIHRoZW4gYWxsb3cgZm9yIG1vZGlmaWNhdGlvbnMgYmVmb3JlIHJldHVybmluZyBpdC4gRm9yIGV4YW1wbGU6XG5cdCAqXG5cdCAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJUZXN0IGdvb2dsZS5jb21cIiwge1xuXHQgKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcblx0ICogICAgICAgICAgICAgdmFyIHRhZyA9IGF1dG9saW5rZXIuZ2V0VGFnQnVpbGRlcigpLmJ1aWxkKCBtYXRjaCApOyAgLy8gcmV0dXJucyBhbiB7QGxpbmsgQXV0b2xpbmtlci5IdG1sVGFnfSBpbnN0YW5jZVxuXHQgKiAgICAgICAgICAgICB0YWcuc2V0QXR0ciggJ3JlbCcsICdub2ZvbGxvdycgKTtcblx0ICpcblx0ICogICAgICAgICAgICAgcmV0dXJuIHRhZztcblx0ICogICAgICAgICB9XG5cdCAqICAgICB9ICk7XG5cdCAqXG5cdCAqICAgICAvLyBnZW5lcmF0ZWQgaHRtbDpcblx0ICogICAgIC8vICAgVGVzdCA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub2ZvbGxvd1wiPmdvb2dsZS5jb208L2E+XG5cdCAqXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlcn1cblx0ICovXG5cdGdldFRhZ0J1aWxkZXIgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdGFnQnVpbGRlciA9IHRoaXMudGFnQnVpbGRlcjtcblxuXHRcdGlmKCAhdGFnQnVpbGRlciApIHtcblx0XHRcdHRhZ0J1aWxkZXIgPSB0aGlzLnRhZ0J1aWxkZXIgPSBuZXcgQXV0b2xpbmtlci5BbmNob3JUYWdCdWlsZGVyKCB7XG5cdFx0XHRcdG5ld1dpbmRvdyAgIDogdGhpcy5uZXdXaW5kb3csXG5cdFx0XHRcdHRydW5jYXRlICAgIDogdGhpcy50cnVuY2F0ZSxcblx0XHRcdFx0Y2xhc3NOYW1lICAgOiB0aGlzLmNsYXNzTmFtZVxuXHRcdFx0fSApO1xuXHRcdH1cblxuXHRcdHJldHVybiB0YWdCdWlsZGVyO1xuXHR9XG5cbn07XG5cblxuLyoqXG4gKiBBdXRvbWF0aWNhbGx5IGxpbmtzIFVSTHMsIEVtYWlsIGFkZHJlc3NlcywgUGhvbmUgTnVtYmVycywgVHdpdHRlciBoYW5kbGVzLFxuICogYW5kIEhhc2h0YWdzIGZvdW5kIGluIHRoZSBnaXZlbiBjaHVuayBvZiBIVE1MLiBEb2VzIG5vdCBsaW5rIFVSTHMgZm91bmRcbiAqIHdpdGhpbiBIVE1MIHRhZ3MuXG4gKlxuICogRm9yIGluc3RhbmNlLCBpZiBnaXZlbiB0aGUgdGV4dDogYFlvdSBzaG91bGQgZ28gdG8gaHR0cDovL3d3dy55YWhvby5jb21gLFxuICogdGhlbiB0aGUgcmVzdWx0IHdpbGwgYmUgYFlvdSBzaG91bGQgZ28gdG8gJmx0O2EgaHJlZj1cImh0dHA6Ly93d3cueWFob28uY29tXCImZ3Q7aHR0cDovL3d3dy55YWhvby5jb20mbHQ7L2EmZ3Q7YFxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogICAgIHZhciBsaW5rZWRUZXh0ID0gQXV0b2xpbmtlci5saW5rKCBcIkdvIHRvIGdvb2dsZS5jb21cIiwgeyBuZXdXaW5kb3c6IGZhbHNlIH0gKTtcbiAqICAgICAvLyBQcm9kdWNlczogXCJHbyB0byA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIj5nb29nbGUuY29tPC9hPlwiXG4gKlxuICogQHN0YXRpY1xuICogQHBhcmFtIHtTdHJpbmd9IHRleHRPckh0bWwgVGhlIEhUTUwgb3IgdGV4dCB0byBmaW5kIG1hdGNoZXMgd2l0aGluIChkZXBlbmRpbmdcbiAqICAgb24gaWYgdGhlIHtAbGluayAjdXJsc30sIHtAbGluayAjZW1haWx9LCB7QGxpbmsgI3Bob25lfSwge0BsaW5rICN0d2l0dGVyfSxcbiAqICAgYW5kIHtAbGluayAjaGFzaHRhZ30gb3B0aW9ucyBhcmUgZW5hYmxlZCkuXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIEFueSBvZiB0aGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQXV0b2xpbmtlclxuICogICBjbGFzcywgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS4gU2VlIHRoZSBjbGFzcyBkZXNjcmlwdGlvbiBmb3IgYW5cbiAqICAgZXhhbXBsZSBjYWxsLlxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgSFRNTCB0ZXh0LCB3aXRoIG1hdGNoZXMgYXV0b21hdGljYWxseSBsaW5rZWQuXG4gKi9cbkF1dG9saW5rZXIubGluayA9IGZ1bmN0aW9uKCB0ZXh0T3JIdG1sLCBvcHRpb25zICkge1xuXHR2YXIgYXV0b2xpbmtlciA9IG5ldyBBdXRvbGlua2VyKCBvcHRpb25zICk7XG5cdHJldHVybiBhdXRvbGlua2VyLmxpbmsoIHRleHRPckh0bWwgKTtcbn07XG5cblxuLy8gQXV0b2xpbmtlciBOYW1lc3BhY2VzXG5BdXRvbGlua2VyLm1hdGNoID0ge307XG5BdXRvbGlua2VyLmh0bWxQYXJzZXIgPSB7fTtcbkF1dG9saW5rZXIubWF0Y2hQYXJzZXIgPSB7fTtcbkF1dG9saW5rZXIudHJ1bmNhdGUgPSB7fTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLypqc2hpbnQgZXFudWxsOnRydWUsIGJvc3M6dHJ1ZSAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5VdGlsXG4gKiBAc2luZ2xldG9uXG4gKlxuICogQSBmZXcgdXRpbGl0eSBtZXRob2RzIGZvciBBdXRvbGlua2VyLlxuICovXG5BdXRvbGlua2VyLlV0aWwgPSB7XG5cblx0LyoqXG5cdCAqIEBwcm9wZXJ0eSB7RnVuY3Rpb259IGFic3RyYWN0TWV0aG9kXG5cdCAqXG5cdCAqIEEgZnVuY3Rpb24gb2JqZWN0IHdoaWNoIHJlcHJlc2VudHMgYW4gYWJzdHJhY3QgbWV0aG9kLlxuXHQgKi9cblx0YWJzdHJhY3RNZXRob2QgOiBmdW5jdGlvbigpIHsgdGhyb3cgXCJhYnN0cmFjdFwiOyB9LFxuXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSB0cmltUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIHRyaW0gdGhlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2Vcblx0ICogZnJvbSBhIHN0cmluZy5cblx0ICovXG5cdHRyaW1SZWdleCA6IC9eW1xcc1xcdUZFRkZcXHhBMF0rfFtcXHNcXHVGRUZGXFx4QTBdKyQvZyxcblxuXG5cdC8qKlxuXHQgKiBBc3NpZ25zIChzaGFsbG93IGNvcGllcykgdGhlIHByb3BlcnRpZXMgb2YgYHNyY2Agb250byBgZGVzdGAuXG5cdCAqXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBkZXN0IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBzcmMgVGhlIHNvdXJjZSBvYmplY3QuXG5cdCAqIEByZXR1cm4ge09iamVjdH0gVGhlIGRlc3RpbmF0aW9uIG9iamVjdCAoYGRlc3RgKVxuXHQgKi9cblx0YXNzaWduIDogZnVuY3Rpb24oIGRlc3QsIHNyYyApIHtcblx0XHRmb3IoIHZhciBwcm9wIGluIHNyYyApIHtcblx0XHRcdGlmKCBzcmMuaGFzT3duUHJvcGVydHkoIHByb3AgKSApIHtcblx0XHRcdFx0ZGVzdFsgcHJvcCBdID0gc3JjWyBwcm9wIF07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRlc3Q7XG5cdH0sXG5cblxuXHQvKipcblx0ICogQXNzaWducyAoc2hhbGxvdyBjb3BpZXMpIHRoZSBwcm9wZXJ0aWVzIG9mIGBzcmNgIG9udG8gYGRlc3RgLCBpZiB0aGVcblx0ICogY29ycmVzcG9uZGluZyBwcm9wZXJ0eSBvbiBgZGVzdGAgPT09IGB1bmRlZmluZWRgLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdH0gZGVzdCBUaGUgZGVzdGluYXRpb24gb2JqZWN0LlxuXHQgKiBAcGFyYW0ge09iamVjdH0gc3JjIFRoZSBzb3VyY2Ugb2JqZWN0LlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IFRoZSBkZXN0aW5hdGlvbiBvYmplY3QgKGBkZXN0YClcblx0ICovXG5cdGRlZmF1bHRzIDogZnVuY3Rpb24oIGRlc3QsIHNyYyApIHtcblx0XHRmb3IoIHZhciBwcm9wIGluIHNyYyApIHtcblx0XHRcdGlmKCBzcmMuaGFzT3duUHJvcGVydHkoIHByb3AgKSAmJiBkZXN0WyBwcm9wIF0gPT09IHVuZGVmaW5lZCApIHtcblx0XHRcdFx0ZGVzdFsgcHJvcCBdID0gc3JjWyBwcm9wIF07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGRlc3Q7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRXh0ZW5kcyBgc3VwZXJjbGFzc2AgdG8gY3JlYXRlIGEgbmV3IHN1YmNsYXNzLCBhZGRpbmcgdGhlIGBwcm90b1Byb3BzYCB0byB0aGUgbmV3IHN1YmNsYXNzJ3MgcHJvdG90eXBlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0Z1bmN0aW9ufSBzdXBlcmNsYXNzIFRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbiBmb3IgdGhlIHN1cGVyY2xhc3MuXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBwcm90b1Byb3BzIFRoZSBtZXRob2RzL3Byb3BlcnRpZXMgdG8gYWRkIHRvIHRoZSBzdWJjbGFzcydzIHByb3RvdHlwZS4gVGhpcyBtYXkgY29udGFpbiB0aGVcblx0ICogICBzcGVjaWFsIHByb3BlcnR5IGBjb25zdHJ1Y3RvcmAsIHdoaWNoIHdpbGwgYmUgdXNlZCBhcyB0aGUgbmV3IHN1YmNsYXNzJ3MgY29uc3RydWN0b3IgZnVuY3Rpb24uXG5cdCAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUaGUgbmV3IHN1YmNsYXNzIGZ1bmN0aW9uLlxuXHQgKi9cblx0ZXh0ZW5kIDogZnVuY3Rpb24oIHN1cGVyY2xhc3MsIHByb3RvUHJvcHMgKSB7XG5cdFx0dmFyIHN1cGVyY2xhc3NQcm90byA9IHN1cGVyY2xhc3MucHJvdG90eXBlO1xuXG5cdFx0dmFyIEYgPSBmdW5jdGlvbigpIHt9O1xuXHRcdEYucHJvdG90eXBlID0gc3VwZXJjbGFzc1Byb3RvO1xuXG5cdFx0dmFyIHN1YmNsYXNzO1xuXHRcdGlmKCBwcm90b1Byb3BzLmhhc093blByb3BlcnR5KCAnY29uc3RydWN0b3InICkgKSB7XG5cdFx0XHRzdWJjbGFzcyA9IHByb3RvUHJvcHMuY29uc3RydWN0b3I7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN1YmNsYXNzID0gZnVuY3Rpb24oKSB7IHN1cGVyY2xhc3NQcm90by5jb25zdHJ1Y3Rvci5hcHBseSggdGhpcywgYXJndW1lbnRzICk7IH07XG5cdFx0fVxuXG5cdFx0dmFyIHN1YmNsYXNzUHJvdG8gPSBzdWJjbGFzcy5wcm90b3R5cGUgPSBuZXcgRigpOyAgLy8gc2V0IHVwIHByb3RvdHlwZSBjaGFpblxuXHRcdHN1YmNsYXNzUHJvdG8uY29uc3RydWN0b3IgPSBzdWJjbGFzczsgIC8vIGZpeCBjb25zdHJ1Y3RvciBwcm9wZXJ0eVxuXHRcdHN1YmNsYXNzUHJvdG8uc3VwZXJjbGFzcyA9IHN1cGVyY2xhc3NQcm90bztcblxuXHRcdGRlbGV0ZSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yOyAgLy8gZG9uJ3QgcmUtYXNzaWduIGNvbnN0cnVjdG9yIHByb3BlcnR5IHRvIHRoZSBwcm90b3R5cGUsIHNpbmNlIGEgbmV3IGZ1bmN0aW9uIG1heSBoYXZlIGJlZW4gY3JlYXRlZCAoYHN1YmNsYXNzYCksIHdoaWNoIGlzIG5vdyBhbHJlYWR5IHRoZXJlXG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggc3ViY2xhc3NQcm90bywgcHJvdG9Qcm9wcyApO1xuXG5cdFx0cmV0dXJuIHN1YmNsYXNzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFRydW5jYXRlcyB0aGUgYHN0cmAgYXQgYGxlbiAtIGVsbGlwc2lzQ2hhcnMubGVuZ3RoYCwgYW5kIGFkZHMgdGhlIGBlbGxpcHNpc0NoYXJzYCB0byB0aGVcblx0ICogZW5kIG9mIHRoZSBzdHJpbmcgKGJ5IGRlZmF1bHQsIHR3byBwZXJpb2RzOiAnLi4nKS4gSWYgdGhlIGBzdHJgIGxlbmd0aCBkb2VzIG5vdCBleGNlZWRcblx0ICogYGxlbmAsIHRoZSBzdHJpbmcgd2lsbCBiZSByZXR1cm5lZCB1bmNoYW5nZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgVGhlIHN0cmluZyB0byB0cnVuY2F0ZSBhbmQgYWRkIGFuIGVsbGlwc2lzIHRvLlxuXHQgKiBAcGFyYW0ge051bWJlcn0gdHJ1bmNhdGVMZW4gVGhlIGxlbmd0aCB0byB0cnVuY2F0ZSB0aGUgc3RyaW5nIGF0LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gW2VsbGlwc2lzQ2hhcnM9Li5dIFRoZSBlbGxpcHNpcyBjaGFyYWN0ZXIocykgdG8gYWRkIHRvIHRoZSBlbmQgb2YgYHN0cmBcblx0ICogICB3aGVuIHRydW5jYXRlZC4gRGVmYXVsdHMgdG8gJy4uJ1xuXHQgKi9cblx0ZWxsaXBzaXMgOiBmdW5jdGlvbiggc3RyLCB0cnVuY2F0ZUxlbiwgZWxsaXBzaXNDaGFycyApIHtcblx0XHRpZiggc3RyLmxlbmd0aCA+IHRydW5jYXRlTGVuICkge1xuXHRcdFx0ZWxsaXBzaXNDaGFycyA9ICggZWxsaXBzaXNDaGFycyA9PSBudWxsICkgPyAnLi4nIDogZWxsaXBzaXNDaGFycztcblx0XHRcdHN0ciA9IHN0ci5zdWJzdHJpbmcoIDAsIHRydW5jYXRlTGVuIC0gZWxsaXBzaXNDaGFycy5sZW5ndGggKSArIGVsbGlwc2lzQ2hhcnM7XG5cdFx0fVxuXHRcdHJldHVybiBzdHI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU3VwcG9ydHMgYEFycmF5LnByb3RvdHlwZS5pbmRleE9mKClgIGZ1bmN0aW9uYWxpdHkgZm9yIG9sZCBJRSAoSUU4IGFuZCBiZWxvdykuXG5cdCAqXG5cdCAqIEBwYXJhbSB7QXJyYXl9IGFyciBUaGUgYXJyYXkgdG8gZmluZCBhbiBlbGVtZW50IG9mLlxuXHQgKiBAcGFyYW0geyp9IGVsZW1lbnQgVGhlIGVsZW1lbnQgdG8gZmluZCBpbiB0aGUgYXJyYXksIGFuZCByZXR1cm4gdGhlIGluZGV4IG9mLlxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBpbmRleCBvZiB0aGUgYGVsZW1lbnRgLCBvciAtMSBpZiBpdCB3YXMgbm90IGZvdW5kLlxuXHQgKi9cblx0aW5kZXhPZiA6IGZ1bmN0aW9uKCBhcnIsIGVsZW1lbnQgKSB7XG5cdFx0aWYoIEFycmF5LnByb3RvdHlwZS5pbmRleE9mICkge1xuXHRcdFx0cmV0dXJuIGFyci5pbmRleE9mKCBlbGVtZW50ICk7XG5cblx0XHR9IGVsc2Uge1xuXHRcdFx0Zm9yKCB2YXIgaSA9IDAsIGxlbiA9IGFyci5sZW5ndGg7IGkgPCBsZW47IGkrKyApIHtcblx0XHRcdFx0aWYoIGFyclsgaSBdID09PSBlbGVtZW50ICkgcmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0fVxuXHR9LFxuXG5cblxuXHQvKipcblx0ICogUGVyZm9ybXMgdGhlIGZ1bmN0aW9uYWxpdHkgb2Ygd2hhdCBtb2Rlcm4gYnJvd3NlcnMgZG8gd2hlbiBgU3RyaW5nLnByb3RvdHlwZS5zcGxpdCgpYCBpcyBjYWxsZWRcblx0ICogd2l0aCBhIHJlZ3VsYXIgZXhwcmVzc2lvbiB0aGF0IGNvbnRhaW5zIGNhcHR1cmluZyBwYXJlbnRoZXNpcy5cblx0ICpcblx0ICogRm9yIGV4YW1wbGU6XG5cdCAqXG5cdCAqICAgICAvLyBNb2Rlcm4gYnJvd3NlcnM6XG5cdCAqICAgICBcImEsYixjXCIuc3BsaXQoIC8oLCkvICk7ICAvLyAtLT4gWyAnYScsICcsJywgJ2InLCAnLCcsICdjJyBdXG5cdCAqXG5cdCAqICAgICAvLyBPbGQgSUUgKGluY2x1ZGluZyBJRTgpOlxuXHQgKiAgICAgXCJhLGIsY1wiLnNwbGl0KCAvKCwpLyApOyAgLy8gLS0+IFsgJ2EnLCAnYicsICdjJyBdXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGVtdWxhdGVzIHRoZSBmdW5jdGlvbmFsaXR5IG9mIG1vZGVybiBicm93c2VycyBmb3IgdGhlIG9sZCBJRSBjYXNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc3RyIFRoZSBzdHJpbmcgdG8gc3BsaXQuXG5cdCAqIEBwYXJhbSB7UmVnRXhwfSBzcGxpdFJlZ2V4IFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdG8gc3BsaXQgdGhlIGlucHV0IGBzdHJgIG9uLiBUaGUgc3BsaXR0aW5nXG5cdCAqICAgY2hhcmFjdGVyKHMpIHdpbGwgYmUgc3BsaWNlZCBpbnRvIHRoZSBhcnJheSwgYXMgaW4gdGhlIFwibW9kZXJuIGJyb3dzZXJzXCIgZXhhbXBsZSBpbiB0aGVcblx0ICogICBkZXNjcmlwdGlvbiBvZiB0aGlzIG1ldGhvZC5cblx0ICogICBOb3RlICMxOiB0aGUgc3VwcGxpZWQgcmVndWxhciBleHByZXNzaW9uICoqbXVzdCoqIGhhdmUgdGhlICdnJyBmbGFnIHNwZWNpZmllZC5cblx0ICogICBOb3RlICMyOiBmb3Igc2ltcGxpY2l0eSdzIHNha2UsIHRoZSByZWd1bGFyIGV4cHJlc3Npb24gZG9lcyBub3QgbmVlZFxuXHQgKiAgIHRvIGNvbnRhaW4gY2FwdHVyaW5nIHBhcmVudGhlc2lzIC0gaXQgd2lsbCBiZSBhc3N1bWVkIHRoYXQgYW55IG1hdGNoIGhhcyB0aGVtLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmdbXX0gVGhlIHNwbGl0IGFycmF5IG9mIHN0cmluZ3MsIHdpdGggdGhlIHNwbGl0dGluZyBjaGFyYWN0ZXIocykgaW5jbHVkZWQuXG5cdCAqL1xuXHRzcGxpdEFuZENhcHR1cmUgOiBmdW5jdGlvbiggc3RyLCBzcGxpdFJlZ2V4ICkge1xuXHRcdGlmKCAhc3BsaXRSZWdleC5nbG9iYWwgKSB0aHJvdyBuZXcgRXJyb3IoIFwiYHNwbGl0UmVnZXhgIG11c3QgaGF2ZSB0aGUgJ2cnIGZsYWcgc2V0XCIgKTtcblxuXHRcdHZhciByZXN1bHQgPSBbXSxcblx0XHQgICAgbGFzdElkeCA9IDAsXG5cdFx0ICAgIG1hdGNoO1xuXG5cdFx0d2hpbGUoIG1hdGNoID0gc3BsaXRSZWdleC5leGVjKCBzdHIgKSApIHtcblx0XHRcdHJlc3VsdC5wdXNoKCBzdHIuc3Vic3RyaW5nKCBsYXN0SWR4LCBtYXRjaC5pbmRleCApICk7XG5cdFx0XHRyZXN1bHQucHVzaCggbWF0Y2hbIDAgXSApOyAgLy8gcHVzaCB0aGUgc3BsaXR0aW5nIGNoYXIocylcblxuXHRcdFx0bGFzdElkeCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbIDAgXS5sZW5ndGg7XG5cdFx0fVxuXHRcdHJlc3VsdC5wdXNoKCBzdHIuc3Vic3RyaW5nKCBsYXN0SWR4ICkgKTtcblxuXHRcdHJldHVybiByZXN1bHQ7XG5cdH0sXG5cblxuXHQvKipcblx0ICogVHJpbXMgdGhlIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHdoaXRlc3BhY2UgZnJvbSBhIHN0cmluZy5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHN0ciBUaGUgc3RyaW5nIHRvIHRyaW0uXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdHRyaW0gOiBmdW5jdGlvbiggc3RyICkge1xuXHRcdHJldHVybiBzdHIucmVwbGFjZSggdGhpcy50cmltUmVnZXgsICcnICk7XG5cdH1cblxufTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qanNoaW50IGJvc3M6dHJ1ZSAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5IdG1sVGFnXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBSZXByZXNlbnRzIGFuIEhUTUwgdGFnLCB3aGljaCBjYW4gYmUgdXNlZCB0byBlYXNpbHkgYnVpbGQvbW9kaWZ5IEhUTUwgdGFncyBwcm9ncmFtbWF0aWNhbGx5LlxuICpcbiAqIEF1dG9saW5rZXIgdXNlcyB0aGlzIGFic3RyYWN0aW9uIHRvIGNyZWF0ZSBIVE1MIHRhZ3MsIGFuZCB0aGVuIHdyaXRlIHRoZW0gb3V0IGFzIHN0cmluZ3MuIFlvdSBtYXkgYWxzbyB1c2VcbiAqIHRoaXMgY2xhc3MgaW4geW91ciBjb2RlLCBlc3BlY2lhbGx5IHdpdGhpbiBhIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59LlxuICpcbiAqICMjIEV4YW1wbGVzXG4gKlxuICogRXhhbXBsZSBpbnN0YW50aWF0aW9uOlxuICpcbiAqICAgICB2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuICogICAgICAgICB0YWdOYW1lIDogJ2EnLFxuICogICAgICAgICBhdHRycyAgIDogeyAnaHJlZic6ICdodHRwOi8vZ29vZ2xlLmNvbScsICdjbGFzcyc6ICdleHRlcm5hbC1saW5rJyB9LFxuICogICAgICAgICBpbm5lckh0bWwgOiAnR29vZ2xlJ1xuICogICAgIH0gKTtcbiAqXG4gKiAgICAgdGFnLnRvQW5jaG9yU3RyaW5nKCk7ICAvLyA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiBjbGFzcz1cImV4dGVybmFsLWxpbmtcIj5Hb29nbGU8L2E+XG4gKlxuICogICAgIC8vIEluZGl2aWR1YWwgYWNjZXNzb3IgbWV0aG9kc1xuICogICAgIHRhZy5nZXRUYWdOYW1lKCk7ICAgICAgICAgICAgICAgICAvLyAnYSdcbiAqICAgICB0YWcuZ2V0QXR0ciggJ2hyZWYnICk7ICAgICAgICAgICAgLy8gJ2h0dHA6Ly9nb29nbGUuY29tJ1xuICogICAgIHRhZy5oYXNDbGFzcyggJ2V4dGVybmFsLWxpbmsnICk7ICAvLyB0cnVlXG4gKlxuICpcbiAqIFVzaW5nIG11dGF0b3IgbWV0aG9kcyAod2hpY2ggbWF5IGJlIHVzZWQgaW4gY29tYmluYXRpb24gd2l0aCBpbnN0YW50aWF0aW9uIGNvbmZpZyBwcm9wZXJ0aWVzKTpcbiAqXG4gKiAgICAgdmFyIHRhZyA9IG5ldyBBdXRvbGlua2VyLkh0bWxUYWcoKTtcbiAqICAgICB0YWcuc2V0VGFnTmFtZSggJ2EnICk7XG4gKiAgICAgdGFnLnNldEF0dHIoICdocmVmJywgJ2h0dHA6Ly9nb29nbGUuY29tJyApO1xuICogICAgIHRhZy5hZGRDbGFzcyggJ2V4dGVybmFsLWxpbmsnICk7XG4gKiAgICAgdGFnLnNldElubmVySHRtbCggJ0dvb2dsZScgKTtcbiAqXG4gKiAgICAgdGFnLmdldFRhZ05hbWUoKTsgICAgICAgICAgICAgICAgIC8vICdhJ1xuICogICAgIHRhZy5nZXRBdHRyKCAnaHJlZicgKTsgICAgICAgICAgICAvLyAnaHR0cDovL2dvb2dsZS5jb20nXG4gKiAgICAgdGFnLmhhc0NsYXNzKCAnZXh0ZXJuYWwtbGluaycgKTsgIC8vIHRydWVcbiAqXG4gKiAgICAgdGFnLnRvQW5jaG9yU3RyaW5nKCk7ICAvLyA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiBjbGFzcz1cImV4dGVybmFsLWxpbmtcIj5Hb29nbGU8L2E+XG4gKlxuICpcbiAqICMjIEV4YW1wbGUgdXNlIHdpdGhpbiBhIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59XG4gKlxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4ge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZ30gaW5zdGFuY2UsIGNvbmZpZ3VyZWQgd2l0aCB0aGUgTWF0Y2gncyBocmVmIGFuZCBhbmNob3IgdGV4dFxuICogICAgICAgICAgICAgdGFnLnNldEF0dHIoICdyZWwnLCAnbm9mb2xsb3cnICk7XG4gKlxuICogICAgICAgICAgICAgcmV0dXJuIHRhZztcbiAqICAgICAgICAgfVxuICogICAgIH0gKTtcbiAqXG4gKiAgICAgLy8gZ2VuZXJhdGVkIGh0bWw6XG4gKiAgICAgLy8gICBUZXN0IDxhIGhyZWY9XCJodHRwOi8vZ29vZ2xlLmNvbVwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vZm9sbG93XCI+Z29vZ2xlLmNvbTwvYT5cbiAqXG4gKlxuICogIyMgRXhhbXBsZSB1c2Ugd2l0aCBhIG5ldyB0YWcgZm9yIHRoZSByZXBsYWNlbWVudFxuICpcbiAqICAgICB2YXIgaHRtbCA9IEF1dG9saW5rZXIubGluayggXCJUZXN0IGdvb2dsZS5jb21cIiwge1xuICogICAgICAgICByZXBsYWNlRm4gOiBmdW5jdGlvbiggYXV0b2xpbmtlciwgbWF0Y2ggKSB7XG4gKiAgICAgICAgICAgICB2YXIgdGFnID0gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuICogICAgICAgICAgICAgICAgIHRhZ05hbWUgOiAnYnV0dG9uJyxcbiAqICAgICAgICAgICAgICAgICBhdHRycyAgIDogeyAndGl0bGUnOiAnTG9hZCBVUkw6ICcgKyBtYXRjaC5nZXRBbmNob3JIcmVmKCkgfSxcbiAqICAgICAgICAgICAgICAgICBpbm5lckh0bWwgOiAnTG9hZCBVUkw6ICcgKyBtYXRjaC5nZXRBbmNob3JUZXh0KClcbiAqICAgICAgICAgICAgIH0gKTtcbiAqXG4gKiAgICAgICAgICAgICByZXR1cm4gdGFnO1xuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICpcbiAqICAgICAvLyBnZW5lcmF0ZWQgaHRtbDpcbiAqICAgICAvLyAgIFRlc3QgPGJ1dHRvbiB0aXRsZT1cIkxvYWQgVVJMOiBodHRwOi8vZ29vZ2xlLmNvbVwiPkxvYWQgVVJMOiBnb29nbGUuY29tPC9idXR0b24+XG4gKi9cbkF1dG9saW5rZXIuSHRtbFRhZyA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHRhZ05hbWVcblx0ICpcblx0ICogVGhlIHRhZyBuYW1lLiBFeDogJ2EnLCAnYnV0dG9uJywgZXRjLlxuXHQgKlxuXHQgKiBOb3QgcmVxdWlyZWQgYXQgaW5zdGFudGlhdGlvbiB0aW1lLCBidXQgc2hvdWxkIGJlIHNldCB1c2luZyB7QGxpbmsgI3NldFRhZ05hbWV9IGJlZm9yZSB7QGxpbmsgI3RvQW5jaG9yU3RyaW5nfVxuXHQgKiBpcyBleGVjdXRlZC5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge09iamVjdC48U3RyaW5nLCBTdHJpbmc+fSBhdHRyc1xuXHQgKlxuXHQgKiBBbiBrZXkvdmFsdWUgT2JqZWN0IChtYXApIG9mIGF0dHJpYnV0ZXMgdG8gY3JlYXRlIHRoZSB0YWcgd2l0aC4gVGhlIGtleXMgYXJlIHRoZSBhdHRyaWJ1dGUgbmFtZXMsIGFuZCB0aGVcblx0ICogdmFsdWVzIGFyZSB0aGUgYXR0cmlidXRlIHZhbHVlcy5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge1N0cmluZ30gaW5uZXJIdG1sXG5cdCAqXG5cdCAqIFRoZSBpbm5lciBIVE1MIGZvciB0aGUgdGFnLlxuXHQgKlxuXHQgKiBOb3RlIHRoZSBjYW1lbCBjYXNlIG5hbWUgb24gYGlubmVySHRtbGAuIEFjcm9ueW1zIGFyZSBjYW1lbENhc2VkIGluIHRoaXMgdXRpbGl0eSAoc3VjaCBhcyBub3QgdG8gcnVuIGludG8gdGhlIGFjcm9ueW1cblx0ICogbmFtaW5nIGluY29uc2lzdGVuY3kgdGhhdCB0aGUgRE9NIGRldmVsb3BlcnMgY3JlYXRlZCB3aXRoIGBYTUxIdHRwUmVxdWVzdGApLiBZb3UgbWF5IGFsdGVybmF0aXZlbHkgdXNlIHtAbGluayAjaW5uZXJIVE1MfVxuXHQgKiBpZiB5b3UgcHJlZmVyLCBidXQgdGhpcyBvbmUgaXMgcmVjb21tZW5kZWQuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGlubmVySFRNTFxuXHQgKlxuXHQgKiBBbGlhcyBvZiB7QGxpbmsgI2lubmVySHRtbH0sIGFjY2VwdGVkIGZvciBjb25zaXN0ZW5jeSB3aXRoIHRoZSBicm93c2VyIERPTSBhcGksIGJ1dCBwcmVmZXIgdGhlIGNhbWVsQ2FzZWQgdmVyc2lvblxuXHQgKiBmb3IgYWNyb255bSBuYW1lcy5cblx0ICovXG5cblxuXHQvKipcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gd2hpdGVzcGFjZVJlZ2V4XG5cdCAqXG5cdCAqIFJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIG1hdGNoIHdoaXRlc3BhY2UgaW4gYSBzdHJpbmcgb2YgQ1NTIGNsYXNzZXMuXG5cdCAqL1xuXHR3aGl0ZXNwYWNlUmVnZXggOiAvXFxzKy8sXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGlzIGNsYXNzLCBpbiBhbiBPYmplY3QgKG1hcClcblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblxuXHRcdHRoaXMuaW5uZXJIdG1sID0gdGhpcy5pbm5lckh0bWwgfHwgdGhpcy5pbm5lckhUTUw7ICAvLyBhY2NlcHQgZWl0aGVyIHRoZSBjYW1lbENhc2VkIGZvcm0gb3IgdGhlIGZ1bGx5IGNhcGl0YWxpemVkIGFjcm9ueW1cblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTZXRzIHRoZSB0YWcgbmFtZSB0aGF0IHdpbGwgYmUgdXNlZCB0byBnZW5lcmF0ZSB0aGUgdGFnIHdpdGguXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0YWdOYW1lXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuSHRtbFRhZ30gVGhpcyBIdG1sVGFnIGluc3RhbmNlLCBzbyB0aGF0IG1ldGhvZCBjYWxscyBtYXkgYmUgY2hhaW5lZC5cblx0ICovXG5cdHNldFRhZ05hbWUgOiBmdW5jdGlvbiggdGFnTmFtZSApIHtcblx0XHR0aGlzLnRhZ05hbWUgPSB0YWdOYW1lO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHJpZXZlcyB0aGUgdGFnIG5hbWUuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFRhZ05hbWUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy50YWdOYW1lIHx8IFwiXCI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyBhbiBhdHRyaWJ1dGUgb24gdGhlIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhdHRyTmFtZSBUaGUgYXR0cmlidXRlIG5hbWUgdG8gc2V0LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYXR0clZhbHVlIFRoZSBhdHRyaWJ1dGUgdmFsdWUgdG8gc2V0LlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRzZXRBdHRyIDogZnVuY3Rpb24oIGF0dHJOYW1lLCBhdHRyVmFsdWUgKSB7XG5cdFx0dmFyIHRhZ0F0dHJzID0gdGhpcy5nZXRBdHRycygpO1xuXHRcdHRhZ0F0dHJzWyBhdHRyTmFtZSBdID0gYXR0clZhbHVlO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0cmlldmVzIGFuIGF0dHJpYnV0ZSBmcm9tIHRoZSBIdG1sVGFnLiBJZiB0aGUgYXR0cmlidXRlIGRvZXMgbm90IGV4aXN0LCByZXR1cm5zIGB1bmRlZmluZWRgLlxuXHQgKlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYXR0ck5hbWUgVGhlIGF0dHJpYnV0ZSBuYW1lIHRvIHJldHJpZXZlLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBhdHRyaWJ1dGUncyB2YWx1ZSwgb3IgYHVuZGVmaW5lZGAgaWYgaXQgZG9lcyBub3QgZXhpc3Qgb24gdGhlIEh0bWxUYWcuXG5cdCAqL1xuXHRnZXRBdHRyIDogZnVuY3Rpb24oIGF0dHJOYW1lICkge1xuXHRcdHJldHVybiB0aGlzLmdldEF0dHJzKClbIGF0dHJOYW1lIF07XG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyBvbmUgb3IgbW9yZSBhdHRyaWJ1dGVzIG9uIHRoZSBIdG1sVGFnLlxuXHQgKlxuXHQgKiBAcGFyYW0ge09iamVjdC48U3RyaW5nLCBTdHJpbmc+fSBhdHRycyBBIGtleS92YWx1ZSBPYmplY3QgKG1hcCkgb2YgdGhlIGF0dHJpYnV0ZXMgdG8gc2V0LlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRzZXRBdHRycyA6IGZ1bmN0aW9uKCBhdHRycyApIHtcblx0XHR2YXIgdGFnQXR0cnMgPSB0aGlzLmdldEF0dHJzKCk7XG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGFnQXR0cnMsIGF0dHJzICk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXRyaWV2ZXMgdGhlIGF0dHJpYnV0ZXMgT2JqZWN0IChtYXApIGZvciB0aGUgSHRtbFRhZy5cblx0ICpcblx0ICogQHJldHVybiB7T2JqZWN0LjxTdHJpbmcsIFN0cmluZz59IEEga2V5L3ZhbHVlIG9iamVjdCBvZiB0aGUgYXR0cmlidXRlcyBmb3IgdGhlIEh0bWxUYWcuXG5cdCAqL1xuXHRnZXRBdHRycyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmF0dHJzIHx8ICggdGhpcy5hdHRycyA9IHt9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyB0aGUgcHJvdmlkZWQgYGNzc0NsYXNzYCwgb3ZlcndyaXRpbmcgYW55IGN1cnJlbnQgQ1NTIGNsYXNzZXMgb24gdGhlIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzcyBPbmUgb3IgbW9yZSBzcGFjZS1zZXBhcmF0ZWQgQ1NTIGNsYXNzZXMgdG8gc2V0IChvdmVyd3JpdGUpLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRzZXRDbGFzcyA6IGZ1bmN0aW9uKCBjc3NDbGFzcyApIHtcblx0XHRyZXR1cm4gdGhpcy5zZXRBdHRyKCAnY2xhc3MnLCBjc3NDbGFzcyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBhZGQgb25lIG9yIG1vcmUgQ1NTIGNsYXNzZXMgdG8gdGhlIEh0bWxUYWcuIFdpbGwgbm90IGFkZCBkdXBsaWNhdGUgQ1NTIGNsYXNzZXMuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzcyBPbmUgb3IgbW9yZSBzcGFjZS1zZXBhcmF0ZWQgQ1NTIGNsYXNzZXMgdG8gYWRkLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRhZGRDbGFzcyA6IGZ1bmN0aW9uKCBjc3NDbGFzcyApIHtcblx0XHR2YXIgY2xhc3NBdHRyID0gdGhpcy5nZXRDbGFzcygpLFxuXHRcdCAgICB3aGl0ZXNwYWNlUmVnZXggPSB0aGlzLndoaXRlc3BhY2VSZWdleCxcblx0XHQgICAgaW5kZXhPZiA9IEF1dG9saW5rZXIuVXRpbC5pbmRleE9mLCAgLy8gdG8gc3VwcG9ydCBJRTggYW5kIGJlbG93XG5cdFx0ICAgIGNsYXNzZXMgPSAoICFjbGFzc0F0dHIgKSA/IFtdIDogY2xhc3NBdHRyLnNwbGl0KCB3aGl0ZXNwYWNlUmVnZXggKSxcblx0XHQgICAgbmV3Q2xhc3NlcyA9IGNzc0NsYXNzLnNwbGl0KCB3aGl0ZXNwYWNlUmVnZXggKSxcblx0XHQgICAgbmV3Q2xhc3M7XG5cblx0XHR3aGlsZSggbmV3Q2xhc3MgPSBuZXdDbGFzc2VzLnNoaWZ0KCkgKSB7XG5cdFx0XHRpZiggaW5kZXhPZiggY2xhc3NlcywgbmV3Q2xhc3MgKSA9PT0gLTEgKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaCggbmV3Q2xhc3MgKTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHR0aGlzLmdldEF0dHJzKClbICdjbGFzcycgXSA9IGNsYXNzZXMuam9pbiggXCIgXCIgKTtcblx0XHRyZXR1cm4gdGhpcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDb252ZW5pZW5jZSBtZXRob2QgdG8gcmVtb3ZlIG9uZSBvciBtb3JlIENTUyBjbGFzc2VzIGZyb20gdGhlIEh0bWxUYWcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzcyBPbmUgb3IgbW9yZSBzcGFjZS1zZXBhcmF0ZWQgQ1NTIGNsYXNzZXMgdG8gcmVtb3ZlLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLkh0bWxUYWd9IFRoaXMgSHRtbFRhZyBpbnN0YW5jZSwgc28gdGhhdCBtZXRob2QgY2FsbHMgbWF5IGJlIGNoYWluZWQuXG5cdCAqL1xuXHRyZW1vdmVDbGFzcyA6IGZ1bmN0aW9uKCBjc3NDbGFzcyApIHtcblx0XHR2YXIgY2xhc3NBdHRyID0gdGhpcy5nZXRDbGFzcygpLFxuXHRcdCAgICB3aGl0ZXNwYWNlUmVnZXggPSB0aGlzLndoaXRlc3BhY2VSZWdleCxcblx0XHQgICAgaW5kZXhPZiA9IEF1dG9saW5rZXIuVXRpbC5pbmRleE9mLCAgLy8gdG8gc3VwcG9ydCBJRTggYW5kIGJlbG93XG5cdFx0ICAgIGNsYXNzZXMgPSAoICFjbGFzc0F0dHIgKSA/IFtdIDogY2xhc3NBdHRyLnNwbGl0KCB3aGl0ZXNwYWNlUmVnZXggKSxcblx0XHQgICAgcmVtb3ZlQ2xhc3NlcyA9IGNzc0NsYXNzLnNwbGl0KCB3aGl0ZXNwYWNlUmVnZXggKSxcblx0XHQgICAgcmVtb3ZlQ2xhc3M7XG5cblx0XHR3aGlsZSggY2xhc3Nlcy5sZW5ndGggJiYgKCByZW1vdmVDbGFzcyA9IHJlbW92ZUNsYXNzZXMuc2hpZnQoKSApICkge1xuXHRcdFx0dmFyIGlkeCA9IGluZGV4T2YoIGNsYXNzZXMsIHJlbW92ZUNsYXNzICk7XG5cdFx0XHRpZiggaWR4ICE9PSAtMSApIHtcblx0XHRcdFx0Y2xhc3Nlcy5zcGxpY2UoIGlkeCwgMSApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMuZ2V0QXR0cnMoKVsgJ2NsYXNzJyBdID0gY2xhc3Nlcy5qb2luKCBcIiBcIiApO1xuXHRcdHJldHVybiB0aGlzO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENvbnZlbmllbmNlIG1ldGhvZCB0byByZXRyaWV2ZSB0aGUgQ1NTIGNsYXNzKGVzKSBmb3IgdGhlIEh0bWxUYWcsIHdoaWNoIHdpbGwgZWFjaCBiZSBzZXBhcmF0ZWQgYnkgc3BhY2VzIHdoZW5cblx0ICogdGhlcmUgYXJlIG11bHRpcGxlLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRDbGFzcyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmdldEF0dHJzKClbICdjbGFzcycgXSB8fCBcIlwiO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENvbnZlbmllbmNlIG1ldGhvZCB0byBjaGVjayBpZiB0aGUgdGFnIGhhcyBhIENTUyBjbGFzcyBvciBub3QuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjc3NDbGFzcyBUaGUgQ1NTIGNsYXNzIHRvIGNoZWNrIGZvci5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBIdG1sVGFnIGhhcyB0aGUgQ1NTIGNsYXNzLCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdGhhc0NsYXNzIDogZnVuY3Rpb24oIGNzc0NsYXNzICkge1xuXHRcdHJldHVybiAoICcgJyArIHRoaXMuZ2V0Q2xhc3MoKSArICcgJyApLmluZGV4T2YoICcgJyArIGNzc0NsYXNzICsgJyAnICkgIT09IC0xO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGlubmVyIEhUTUwgZm9yIHRoZSB0YWcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIFRoZSBpbm5lciBIVE1MIHRvIHNldC5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGlzIEh0bWxUYWcgaW5zdGFuY2UsIHNvIHRoYXQgbWV0aG9kIGNhbGxzIG1heSBiZSBjaGFpbmVkLlxuXHQgKi9cblx0c2V0SW5uZXJIdG1sIDogZnVuY3Rpb24oIGh0bWwgKSB7XG5cdFx0dGhpcy5pbm5lckh0bWwgPSBodG1sO1xuXG5cdFx0cmV0dXJuIHRoaXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSBpbm5lciBIVE1MIGZvciB0aGUgdGFnLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRJbm5lckh0bWwgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5pbm5lckh0bWwgfHwgXCJcIjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBPdmVycmlkZSBvZiBzdXBlcmNsYXNzIG1ldGhvZCB1c2VkIHRvIGdlbmVyYXRlIHRoZSBIVE1MIHN0cmluZyBmb3IgdGhlIHRhZy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0dG9BbmNob3JTdHJpbmcgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdGFnTmFtZSA9IHRoaXMuZ2V0VGFnTmFtZSgpLFxuXHRcdCAgICBhdHRyc1N0ciA9IHRoaXMuYnVpbGRBdHRyc1N0cigpO1xuXG5cdFx0YXR0cnNTdHIgPSAoIGF0dHJzU3RyICkgPyAnICcgKyBhdHRyc1N0ciA6ICcnOyAgLy8gcHJlcGVuZCBhIHNwYWNlIGlmIHRoZXJlIGFyZSBhY3R1YWxseSBhdHRyaWJ1dGVzXG5cblx0XHRyZXR1cm4gWyAnPCcsIHRhZ05hbWUsIGF0dHJzU3RyLCAnPicsIHRoaXMuZ2V0SW5uZXJIdG1sKCksICc8LycsIHRhZ05hbWUsICc+JyBdLmpvaW4oIFwiXCIgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTdXBwb3J0IG1ldGhvZCBmb3Ige0BsaW5rICN0b0FuY2hvclN0cmluZ30sIHJldHVybnMgdGhlIHN0cmluZyBzcGFjZS1zZXBhcmF0ZWQga2V5PVwidmFsdWVcIiBwYWlycywgdXNlZCB0byBwb3B1bGF0ZVxuXHQgKiB0aGUgc3RyaW5naWZpZWQgSHRtbFRhZy5cblx0ICpcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IEV4YW1wbGUgcmV0dXJuOiBgYXR0cjE9XCJ2YWx1ZTFcIiBhdHRyMj1cInZhbHVlMlwiYFxuXHQgKi9cblx0YnVpbGRBdHRyc1N0ciA6IGZ1bmN0aW9uKCkge1xuXHRcdGlmKCAhdGhpcy5hdHRycyApIHJldHVybiBcIlwiOyAgLy8gbm8gYGF0dHJzYCBPYmplY3QgKG1hcCkgaGFzIGJlZW4gc2V0LCByZXR1cm4gZW1wdHkgc3RyaW5nXG5cblx0XHR2YXIgYXR0cnMgPSB0aGlzLmdldEF0dHJzKCksXG5cdFx0ICAgIGF0dHJzQXJyID0gW107XG5cblx0XHRmb3IoIHZhciBwcm9wIGluIGF0dHJzICkge1xuXHRcdFx0aWYoIGF0dHJzLmhhc093blByb3BlcnR5KCBwcm9wICkgKSB7XG5cdFx0XHRcdGF0dHJzQXJyLnB1c2goIHByb3AgKyAnPVwiJyArIGF0dHJzWyBwcm9wIF0gKyAnXCInICk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiBhdHRyc0Fyci5qb2luKCBcIiBcIiApO1xuXHR9XG5cbn0gKTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLypqc2hpbnQgc3ViOnRydWUgKi9cbi8qKlxuICogQHByb3RlY3RlZFxuICogQGNsYXNzIEF1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogQnVpbGRzIGFuY2hvciAoJmx0O2EmZ3Q7KSB0YWdzIGZvciB0aGUgQXV0b2xpbmtlciB1dGlsaXR5IHdoZW4gYSBtYXRjaCBpcyBmb3VuZC5cbiAqXG4gKiBOb3JtYWxseSB0aGlzIGNsYXNzIGlzIGluc3RhbnRpYXRlZCwgY29uZmlndXJlZCwgYW5kIHVzZWQgaW50ZXJuYWxseSBieSBhblxuICoge0BsaW5rIEF1dG9saW5rZXJ9IGluc3RhbmNlLCBidXQgbWF5IGFjdHVhbGx5IGJlIHJldHJpZXZlZCBpbiBhIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59XG4gKiB0byBjcmVhdGUge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZyBIdG1sVGFnfSBpbnN0YW5jZXMgd2hpY2ggbWF5IGJlIG1vZGlmaWVkXG4gKiBiZWZvcmUgcmV0dXJuaW5nIGZyb20gdGhlIHtAbGluayBBdXRvbGlua2VyI3JlcGxhY2VGbiByZXBsYWNlRm59LiBGb3JcbiAqIGV4YW1wbGU6XG4gKlxuICogICAgIHZhciBodG1sID0gQXV0b2xpbmtlci5saW5rKCBcIlRlc3QgZ29vZ2xlLmNvbVwiLCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIHZhciB0YWcgPSBhdXRvbGlua2VyLmdldFRhZ0J1aWxkZXIoKS5idWlsZCggbWF0Y2ggKTsgIC8vIHJldHVybnMgYW4ge0BsaW5rIEF1dG9saW5rZXIuSHRtbFRhZ30gaW5zdGFuY2VcbiAqICAgICAgICAgICAgIHRhZy5zZXRBdHRyKCAncmVsJywgJ25vZm9sbG93JyApO1xuICpcbiAqICAgICAgICAgICAgIHJldHVybiB0YWc7XG4gKiAgICAgICAgIH1cbiAqICAgICB9ICk7XG4gKlxuICogICAgIC8vIGdlbmVyYXRlZCBodG1sOlxuICogICAgIC8vICAgVGVzdCA8YSBocmVmPVwiaHR0cDovL2dvb2dsZS5jb21cIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub2ZvbGxvd1wiPmdvb2dsZS5jb208L2E+XG4gKi9cbkF1dG9saW5rZXIuQW5jaG9yVGFnQnVpbGRlciA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIE9iamVjdCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBuZXdXaW5kb3dcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNuZXdXaW5kb3dcblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge09iamVjdH0gdHJ1bmNhdGVcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciN0cnVuY2F0ZVxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBjbGFzc05hbWVcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNjbGFzc05hbWVcblx0ICovXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbY2ZnXSBUaGUgY29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQW5jaG9yVGFnQnVpbGRlciBpbnN0YW5jZSwgc3BlY2lmaWVkIGluIGFuIE9iamVjdCAobWFwKS5cblx0ICovXG5cdGNvbnN0cnVjdG9yIDogZnVuY3Rpb24oIGNmZyApIHtcblx0XHRBdXRvbGlua2VyLlV0aWwuYXNzaWduKCB0aGlzLCBjZmcgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgdGhlIGFjdHVhbCBhbmNob3IgKCZsdDthJmd0OykgdGFnIHRvIHVzZSBpbiBwbGFjZSBvZiB0aGVcblx0ICogbWF0Y2hlZCB0ZXh0LCB2aWEgaXRzIGBtYXRjaGAgb2JqZWN0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0F1dG9saW5rZXIubWF0Y2guTWF0Y2h9IG1hdGNoIFRoZSBNYXRjaCBpbnN0YW5jZSB0byBnZW5lcmF0ZSBhblxuXHQgKiAgIGFuY2hvciB0YWcgZnJvbS5cblx0ICogQHJldHVybiB7QXV0b2xpbmtlci5IdG1sVGFnfSBUaGUgSHRtbFRhZyBpbnN0YW5jZSBmb3IgdGhlIGFuY2hvciB0YWcuXG5cdCAqL1xuXHRidWlsZCA6IGZ1bmN0aW9uKCBtYXRjaCApIHtcblx0XHRyZXR1cm4gbmV3IEF1dG9saW5rZXIuSHRtbFRhZygge1xuXHRcdFx0dGFnTmFtZSAgIDogJ2EnLFxuXHRcdFx0YXR0cnMgICAgIDogdGhpcy5jcmVhdGVBdHRycyggbWF0Y2guZ2V0VHlwZSgpLCBtYXRjaC5nZXRBbmNob3JIcmVmKCkgKSxcblx0XHRcdGlubmVySHRtbCA6IHRoaXMucHJvY2Vzc0FuY2hvclRleHQoIG1hdGNoLmdldEFuY2hvclRleHQoKSApXG5cdFx0fSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgdGhlIE9iamVjdCAobWFwKSBvZiB0aGUgSFRNTCBhdHRyaWJ1dGVzIGZvciB0aGUgYW5jaG9yICgmbHQ7YSZndDspXG5cdCAqICAgdGFnIGJlaW5nIGdlbmVyYXRlZC5cblx0ICpcblx0ICogQHByb3RlY3RlZFxuXHQgKiBAcGFyYW0ge1widXJsXCIvXCJlbWFpbFwiL1wicGhvbmVcIi9cInR3aXR0ZXJcIi9cImhhc2h0YWdcIn0gbWF0Y2hUeXBlIFRoZSB0eXBlIG9mXG5cdCAqICAgbWF0Y2ggdGhhdCBhbiBhbmNob3IgdGFnIGlzIGJlaW5nIGdlbmVyYXRlZCBmb3IuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBhbmNob3JIcmVmIFRoZSBocmVmIGZvciB0aGUgYW5jaG9yIHRhZy5cblx0ICogQHJldHVybiB7T2JqZWN0fSBBIGtleS92YWx1ZSBPYmplY3QgKG1hcCkgb2YgdGhlIGFuY2hvciB0YWcncyBhdHRyaWJ1dGVzLlxuXHQgKi9cblx0Y3JlYXRlQXR0cnMgOiBmdW5jdGlvbiggbWF0Y2hUeXBlLCBhbmNob3JIcmVmICkge1xuXHRcdHZhciBhdHRycyA9IHtcblx0XHRcdCdocmVmJyA6IGFuY2hvckhyZWYgIC8vIHdlJ2xsIGFsd2F5cyBoYXZlIHRoZSBgaHJlZmAgYXR0cmlidXRlXG5cdFx0fTtcblxuXHRcdHZhciBjc3NDbGFzcyA9IHRoaXMuY3JlYXRlQ3NzQ2xhc3MoIG1hdGNoVHlwZSApO1xuXHRcdGlmKCBjc3NDbGFzcyApIHtcblx0XHRcdGF0dHJzWyAnY2xhc3MnIF0gPSBjc3NDbGFzcztcblx0XHR9XG5cdFx0aWYoIHRoaXMubmV3V2luZG93ICkge1xuXHRcdFx0YXR0cnNbICd0YXJnZXQnIF0gPSBcIl9ibGFua1wiO1xuXHRcdH1cblxuXHRcdHJldHVybiBhdHRycztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoZSBDU1MgY2xhc3MgdGhhdCB3aWxsIGJlIHVzZWQgZm9yIGEgZ2l2ZW4gYW5jaG9yIHRhZywgYmFzZWQgb25cblx0ICogdGhlIGBtYXRjaFR5cGVgIGFuZCB0aGUge0BsaW5rICNjbGFzc05hbWV9IGNvbmZpZy5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtcInVybFwiL1wiZW1haWxcIi9cInBob25lXCIvXCJ0d2l0dGVyXCIvXCJoYXNodGFnXCJ9IG1hdGNoVHlwZSBUaGUgdHlwZSBvZlxuXHQgKiAgIG1hdGNoIHRoYXQgYW4gYW5jaG9yIHRhZyBpcyBiZWluZyBnZW5lcmF0ZWQgZm9yLlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBDU1MgY2xhc3Mgc3RyaW5nIGZvciB0aGUgbGluay4gRXhhbXBsZSByZXR1cm46XG5cdCAqICAgXCJteUxpbmsgbXlMaW5rLXVybFwiLiBJZiBubyB7QGxpbmsgI2NsYXNzTmFtZX0gd2FzIGNvbmZpZ3VyZWQsIHJldHVybnNcblx0ICogICBhbiBlbXB0eSBzdHJpbmcuXG5cdCAqL1xuXHRjcmVhdGVDc3NDbGFzcyA6IGZ1bmN0aW9uKCBtYXRjaFR5cGUgKSB7XG5cdFx0dmFyIGNsYXNzTmFtZSA9IHRoaXMuY2xhc3NOYW1lO1xuXG5cdFx0aWYoICFjbGFzc05hbWUgKVxuXHRcdFx0cmV0dXJuIFwiXCI7XG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZSArIFwiIFwiICsgY2xhc3NOYW1lICsgXCItXCIgKyBtYXRjaFR5cGU7ICAvLyBleDogXCJteUxpbmsgbXlMaW5rLXVybFwiLCBcIm15TGluayBteUxpbmstZW1haWxcIiwgXCJteUxpbmsgbXlMaW5rLXBob25lXCIsIFwibXlMaW5rIG15TGluay10d2l0dGVyXCIsIG9yIFwibXlMaW5rIG15TGluay1oYXNodGFnXCJcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBQcm9jZXNzZXMgdGhlIGBhbmNob3JUZXh0YCBieSB0cnVuY2F0aW5nIHRoZSB0ZXh0IGFjY29yZGluZyB0byB0aGVcblx0ICoge0BsaW5rICN0cnVuY2F0ZX0gY29uZmlnLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYW5jaG9yVGV4dCBUaGUgYW5jaG9yIHRhZydzIHRleHQgKGkuZS4gd2hhdCB3aWxsIGJlXG5cdCAqICAgZGlzcGxheWVkKS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgcHJvY2Vzc2VkIGBhbmNob3JUZXh0YC5cblx0ICovXG5cdHByb2Nlc3NBbmNob3JUZXh0IDogZnVuY3Rpb24oIGFuY2hvclRleHQgKSB7XG5cdFx0YW5jaG9yVGV4dCA9IHRoaXMuZG9UcnVuY2F0ZSggYW5jaG9yVGV4dCApO1xuXG5cdFx0cmV0dXJuIGFuY2hvclRleHQ7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUGVyZm9ybXMgdGhlIHRydW5jYXRpb24gb2YgdGhlIGBhbmNob3JUZXh0YCBiYXNlZCBvbiB0aGUge0BsaW5rICN0cnVuY2F0ZX1cblx0ICogb3B0aW9uLiBJZiB0aGUgYGFuY2hvclRleHRgIGlzIGxvbmdlciB0aGFuIHRoZSBsZW5ndGggc3BlY2lmaWVkIGJ5IHRoZVxuXHQgKiB7QGxpbmsgI3RydW5jYXRlfSBvcHRpb24sIHRoZSB0cnVuY2F0aW9uIGlzIHBlcmZvcm1lZCBiYXNlZCBvbiB0aGVcblx0ICogYGxvY2F0aW9uYCBwcm9wZXJ0eS4gU2VlIHtAbGluayAjdHJ1bmNhdGV9IGZvciBkZXRhaWxzLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gYW5jaG9yVGV4dCBUaGUgYW5jaG9yIHRhZydzIHRleHQgKGkuZS4gd2hhdCB3aWxsIGJlXG5cdCAqICAgZGlzcGxheWVkKS5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgdHJ1bmNhdGVkIGFuY2hvciB0ZXh0LlxuXHQgKi9cblx0ZG9UcnVuY2F0ZSA6IGZ1bmN0aW9uKCBhbmNob3JUZXh0ICkge1xuXHRcdHZhciB0cnVuY2F0ZSA9IHRoaXMudHJ1bmNhdGU7XG5cdFx0aWYoICF0cnVuY2F0ZSApIHJldHVybiBhbmNob3JUZXh0O1xuXG5cdFx0dmFyIHRydW5jYXRlTGVuZ3RoID0gdHJ1bmNhdGUubGVuZ3RoLFxuXHRcdFx0dHJ1bmNhdGVMb2NhdGlvbiA9IHRydW5jYXRlLmxvY2F0aW9uO1xuXG5cdFx0aWYoIHRydW5jYXRlTG9jYXRpb24gPT09ICdzbWFydCcgKSB7XG5cdFx0XHRyZXR1cm4gQXV0b2xpbmtlci50cnVuY2F0ZS5UcnVuY2F0ZVNtYXJ0KCBhbmNob3JUZXh0LCB0cnVuY2F0ZUxlbmd0aCwgJy4uJyApO1xuXG5cdFx0fSBlbHNlIGlmKCB0cnVuY2F0ZUxvY2F0aW9uID09PSAnbWlkZGxlJyApIHtcblx0XHRcdHJldHVybiBBdXRvbGlua2VyLnRydW5jYXRlLlRydW5jYXRlTWlkZGxlKCBhbmNob3JUZXh0LCB0cnVuY2F0ZUxlbmd0aCwgJy4uJyApO1xuXG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBBdXRvbGlua2VyLnRydW5jYXRlLlRydW5jYXRlRW5kKCBhbmNob3JUZXh0LCB0cnVuY2F0ZUxlbmd0aCwgJy4uJyApO1xuXHRcdH1cblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQHByaXZhdGVcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlclxuICogQGV4dGVuZHMgT2JqZWN0XG4gKlxuICogQW4gSFRNTCBwYXJzZXIgaW1wbGVtZW50YXRpb24gd2hpY2ggc2ltcGx5IHdhbGtzIGFuIEhUTUwgc3RyaW5nIGFuZCByZXR1cm5zIGFuIGFycmF5IG9mXG4gKiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlIEh0bWxOb2Rlc30gdGhhdCByZXByZXNlbnQgdGhlIGJhc2ljIEhUTUwgc3RydWN0dXJlIG9mIHRoZSBpbnB1dCBzdHJpbmcuXG4gKlxuICogQXV0b2xpbmtlciB1c2VzIHRoaXMgdG8gb25seSBsaW5rIFVSTHMvZW1haWxzL1R3aXR0ZXIgaGFuZGxlcyB3aXRoaW4gdGV4dCBub2RlcywgZWZmZWN0aXZlbHkgaWdub3JpbmcgLyBcIndhbGtpbmdcbiAqIGFyb3VuZFwiIEhUTUwgdGFncy5cbiAqL1xuQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXIgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGh0bWxSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcHVsbCBvdXQgSFRNTCB0YWdzIGZyb20gYSBzdHJpbmcuIEhhbmRsZXMgbmFtZXNwYWNlZCBIVE1MIHRhZ3MgYW5kXG5cdCAqIGF0dHJpYnV0ZSBuYW1lcywgYXMgc3BlY2lmaWVkIGJ5IGh0dHA6Ly93d3cudzMub3JnL1RSL2h0bWwtbWFya3VwL3N5bnRheC5odG1sLlxuXHQgKlxuXHQgKiBDYXB0dXJpbmcgZ3JvdXBzOlxuXHQgKlxuXHQgKiAxLiBUaGUgXCIhRE9DVFlQRVwiIHRhZyBuYW1lLCBpZiBhIHRhZyBpcyBhICZsdDshRE9DVFlQRSZndDsgdGFnLlxuXHQgKiAyLiBJZiBpdCBpcyBhbiBlbmQgdGFnLCB0aGlzIGdyb3VwIHdpbGwgaGF2ZSB0aGUgJy8nLlxuXHQgKiAzLiBJZiBpdCBpcyBhIGNvbW1lbnQgdGFnLCB0aGlzIGdyb3VwIHdpbGwgaG9sZCB0aGUgY29tbWVudCB0ZXh0IChpLmUuXG5cdCAqICAgIHRoZSB0ZXh0IGluc2lkZSB0aGUgYCZsdDshLS1gIGFuZCBgLS0mZ3Q7YC5cblx0ICogNC4gVGhlIHRhZyBuYW1lIGZvciBhbGwgdGFncyAob3RoZXIgdGhhbiB0aGUgJmx0OyFET0NUWVBFJmd0OyB0YWcpXG5cdCAqL1xuXHRodG1sUmVnZXggOiAoZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGNvbW1lbnRUYWdSZWdleCA9IC8hLS0oW1xcc1xcU10rPyktLS8sXG5cdFx0ICAgIHRhZ05hbWVSZWdleCA9IC9bMC05YS16QS1aXVswLTlhLXpBLVo6XSovLFxuXHRcdCAgICBhdHRyTmFtZVJlZ2V4ID0gL1teXFxzXFwwXCInPlxcLz1cXHgwMS1cXHgxRlxceDdGXSsvLCAgIC8vIHRoZSB1bmljb2RlIHJhbmdlIGFjY291bnRzIGZvciBleGNsdWRpbmcgY29udHJvbCBjaGFycywgYW5kIHRoZSBkZWxldGUgY2hhclxuXHRcdCAgICBhdHRyVmFsdWVSZWdleCA9IC8oPzpcIlteXCJdKj9cInwnW14nXSo/J3xbXidcIj08PmBcXHNdKykvLCAvLyBkb3VibGUgcXVvdGVkLCBzaW5nbGUgcXVvdGVkLCBvciB1bnF1b3RlZCBhdHRyaWJ1dGUgdmFsdWVzXG5cdFx0ICAgIG5hbWVFcXVhbHNWYWx1ZVJlZ2V4ID0gYXR0ck5hbWVSZWdleC5zb3VyY2UgKyAnKD86XFxcXHMqPVxcXFxzKicgKyBhdHRyVmFsdWVSZWdleC5zb3VyY2UgKyAnKT8nOyAgLy8gb3B0aW9uYWwgJz1bdmFsdWVdJ1xuXG5cdFx0cmV0dXJuIG5ldyBSZWdFeHAoIFtcblx0XHRcdC8vIGZvciA8IURPQ1RZUEU+IHRhZy4gRXg6IDwhRE9DVFlQRSBodG1sIFBVQkxJQyBcIi0vL1czQy8vRFREIFhIVE1MIDEuMCBTdHJpY3QvL0VOXCIgXCJodHRwOi8vd3d3LnczLm9yZy9UUi94aHRtbDEvRFREL3hodG1sMS1zdHJpY3QuZHRkXCI+KVxuXHRcdFx0Jyg/OicsXG5cdFx0XHRcdCc8KCFET0NUWVBFKScsICAvLyAqKiogQ2FwdHVyaW5nIEdyb3VwIDEgLSBJZiBpdCdzIGEgZG9jdHlwZSB0YWdcblxuXHRcdFx0XHRcdC8vIFplcm8gb3IgbW9yZSBhdHRyaWJ1dGVzIGZvbGxvd2luZyB0aGUgdGFnIG5hbWVcblx0XHRcdFx0XHQnKD86Jyxcblx0XHRcdFx0XHRcdCdcXFxccysnLCAgLy8gb25lIG9yIG1vcmUgd2hpdGVzcGFjZSBjaGFycyBiZWZvcmUgYW4gYXR0cmlidXRlXG5cblx0XHRcdFx0XHRcdC8vIEVpdGhlcjpcblx0XHRcdFx0XHRcdC8vIEEuIGF0dHI9XCJ2YWx1ZVwiLCBvclxuXHRcdFx0XHRcdFx0Ly8gQi4gXCJ2YWx1ZVwiIGFsb25lIChUbyBjb3ZlciBleGFtcGxlIGRvY3R5cGUgdGFnOiA8IURPQ1RZUEUgaHRtbCBQVUJMSUMgXCItLy9XM0MvL0RURCBYSFRNTCAxLjAgU3RyaWN0Ly9FTlwiIFwiaHR0cDovL3d3dy53My5vcmcvVFIveGh0bWwxL0RURC94aHRtbDEtc3RyaWN0LmR0ZFwiPilcblx0XHRcdFx0XHRcdCcoPzonLCBuYW1lRXF1YWxzVmFsdWVSZWdleCwgJ3wnLCBhdHRyVmFsdWVSZWdleC5zb3VyY2UgKyAnKScsXG5cdFx0XHRcdFx0JykqJyxcblx0XHRcdFx0Jz4nLFxuXHRcdFx0JyknLFxuXG5cdFx0XHQnfCcsXG5cblx0XHRcdC8vIEFsbCBvdGhlciBIVE1MIHRhZ3MgKGkuZS4gdGFncyB0aGF0IGFyZSBub3QgPCFET0NUWVBFPilcblx0XHRcdCcoPzonLFxuXHRcdFx0XHQnPCgvKT8nLCAgLy8gQmVnaW5uaW5nIG9mIGEgdGFnIG9yIGNvbW1lbnQuIEVpdGhlciAnPCcgZm9yIGEgc3RhcnQgdGFnLCBvciAnPC8nIGZvciBhbiBlbmQgdGFnLlxuXHRcdFx0XHQgICAgICAgICAgLy8gKioqIENhcHR1cmluZyBHcm91cCAyOiBUaGUgc2xhc2ggb3IgYW4gZW1wdHkgc3RyaW5nLiBTbGFzaCAoJy8nKSBmb3IgZW5kIHRhZywgZW1wdHkgc3RyaW5nIGZvciBzdGFydCBvciBzZWxmLWNsb3NpbmcgdGFnLlxuXG5cdFx0XHRcdFx0Jyg/OicsXG5cdFx0XHRcdFx0XHRjb21tZW50VGFnUmVnZXguc291cmNlLCAgLy8gKioqIENhcHR1cmluZyBHcm91cCAzIC0gQSBDb21tZW50IFRhZydzIFRleHRcblxuXHRcdFx0XHRcdFx0J3wnLFxuXG5cdFx0XHRcdFx0XHQnKD86JyxcblxuXHRcdFx0XHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIEdyb3VwIDQgLSBUaGUgdGFnIG5hbWVcblx0XHRcdFx0XHRcdFx0JygnICsgdGFnTmFtZVJlZ2V4LnNvdXJjZSArICcpJyxcblxuXHRcdFx0XHRcdFx0XHQvLyBaZXJvIG9yIG1vcmUgYXR0cmlidXRlcyBmb2xsb3dpbmcgdGhlIHRhZyBuYW1lXG5cdFx0XHRcdFx0XHRcdCcoPzonLFxuXHRcdFx0XHRcdFx0XHRcdCdcXFxccysnLCAgICAgICAgICAgICAgICAvLyBvbmUgb3IgbW9yZSB3aGl0ZXNwYWNlIGNoYXJzIGJlZm9yZSBhbiBhdHRyaWJ1dGVcblx0XHRcdFx0XHRcdFx0XHRuYW1lRXF1YWxzVmFsdWVSZWdleCwgIC8vIGF0dHI9XCJ2YWx1ZVwiICh3aXRoIG9wdGlvbmFsID1cInZhbHVlXCIgcGFydClcblx0XHRcdFx0XHRcdFx0JykqJyxcblxuXHRcdFx0XHRcdFx0XHQnXFxcXHMqLz8nLCAgLy8gYW55IHRyYWlsaW5nIHNwYWNlcyBhbmQgb3B0aW9uYWwgJy8nIGJlZm9yZSB0aGUgY2xvc2luZyAnPidcblxuXHRcdFx0XHRcdFx0JyknLFxuXHRcdFx0XHRcdCcpJyxcblx0XHRcdFx0Jz4nLFxuXHRcdFx0JyknXG5cdFx0XS5qb2luKCBcIlwiICksICdnaScgKTtcblx0fSApKCksXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBodG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHRoYXQgbWF0Y2hlcyBjb21tb24gSFRNTCBjaGFyYWN0ZXIgZW50aXRpZXMuXG5cdCAqXG5cdCAqIElnbm9yaW5nICZhbXA7IGFzIGl0IGNvdWxkIGJlIHBhcnQgb2YgYSBxdWVyeSBzdHJpbmcgLS0gaGFuZGxpbmcgaXQgc2VwYXJhdGVseS5cblx0ICovXG5cdGh0bWxDaGFyYWN0ZXJFbnRpdGllc1JlZ2V4OiAvKCZuYnNwO3wmIzE2MDt8Jmx0O3wmIzYwO3wmZ3Q7fCYjNjI7fCZxdW90O3wmIzM0O3wmIzM5OykvZ2ksXG5cblxuXHQvKipcblx0ICogUGFyc2VzIGFuIEhUTUwgc3RyaW5nIGFuZCByZXR1cm5zIGEgc2ltcGxlIGFycmF5IG9mIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUgSHRtbE5vZGVzfVxuXHQgKiB0byByZXByZXNlbnQgdGhlIEhUTUwgc3RydWN0dXJlIG9mIHRoZSBpbnB1dCBzdHJpbmcuXG5cdCAqXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBodG1sIFRoZSBIVE1MIHRvIHBhcnNlLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVbXX1cblx0ICovXG5cdHBhcnNlIDogZnVuY3Rpb24oIGh0bWwgKSB7XG5cdFx0dmFyIGh0bWxSZWdleCA9IHRoaXMuaHRtbFJlZ2V4LFxuXHRcdCAgICBjdXJyZW50UmVzdWx0LFxuXHRcdCAgICBsYXN0SW5kZXggPSAwLFxuXHRcdCAgICB0ZXh0QW5kRW50aXR5Tm9kZXMsXG5cdFx0ICAgIG5vZGVzID0gW107ICAvLyB3aWxsIGJlIHRoZSByZXN1bHQgb2YgdGhlIG1ldGhvZFxuXG5cdFx0d2hpbGUoICggY3VycmVudFJlc3VsdCA9IGh0bWxSZWdleC5leGVjKCBodG1sICkgKSAhPT0gbnVsbCApIHtcblx0XHRcdHZhciB0YWdUZXh0ID0gY3VycmVudFJlc3VsdFsgMCBdLFxuXHRcdFx0ICAgIGNvbW1lbnRUZXh0ID0gY3VycmVudFJlc3VsdFsgMyBdLCAvLyBpZiB3ZSd2ZSBtYXRjaGVkIGEgY29tbWVudFxuXHRcdFx0ICAgIHRhZ05hbWUgPSBjdXJyZW50UmVzdWx0WyAxIF0gfHwgY3VycmVudFJlc3VsdFsgNCBdLCAgLy8gVGhlIDwhRE9DVFlQRT4gdGFnIChleDogXCIhRE9DVFlQRVwiKSwgb3IgYW5vdGhlciB0YWcgKGV4OiBcImFcIiBvciBcImltZ1wiKVxuXHRcdFx0ICAgIGlzQ2xvc2luZ1RhZyA9ICEhY3VycmVudFJlc3VsdFsgMiBdLFxuXHRcdFx0ICAgIGluQmV0d2VlblRhZ3NUZXh0ID0gaHRtbC5zdWJzdHJpbmcoIGxhc3RJbmRleCwgY3VycmVudFJlc3VsdC5pbmRleCApO1xuXG5cdFx0XHQvLyBQdXNoIFRleHROb2RlcyBhbmQgRW50aXR5Tm9kZXMgZm9yIGFueSB0ZXh0IGZvdW5kIGJldHdlZW4gdGFnc1xuXHRcdFx0aWYoIGluQmV0d2VlblRhZ3NUZXh0ICkge1xuXHRcdFx0XHR0ZXh0QW5kRW50aXR5Tm9kZXMgPSB0aGlzLnBhcnNlVGV4dEFuZEVudGl0eU5vZGVzKCBpbkJldHdlZW5UYWdzVGV4dCApO1xuXHRcdFx0XHRub2Rlcy5wdXNoLmFwcGx5KCBub2RlcywgdGV4dEFuZEVudGl0eU5vZGVzICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIFB1c2ggdGhlIENvbW1lbnROb2RlIG9yIEVsZW1lbnROb2RlXG5cdFx0XHRpZiggY29tbWVudFRleHQgKSB7XG5cdFx0XHRcdG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlQ29tbWVudE5vZGUoIHRhZ1RleHQsIGNvbW1lbnRUZXh0ICkgKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlRWxlbWVudE5vZGUoIHRhZ1RleHQsIHRhZ05hbWUsIGlzQ2xvc2luZ1RhZyApICk7XG5cdFx0XHR9XG5cblx0XHRcdGxhc3RJbmRleCA9IGN1cnJlbnRSZXN1bHQuaW5kZXggKyB0YWdUZXh0Lmxlbmd0aDtcblx0XHR9XG5cblx0XHQvLyBQcm9jZXNzIGFueSByZW1haW5pbmcgdGV4dCBhZnRlciB0aGUgbGFzdCBIVE1MIGVsZW1lbnQuIFdpbGwgcHJvY2VzcyBhbGwgb2YgdGhlIHRleHQgaWYgdGhlcmUgd2VyZSBubyBIVE1MIGVsZW1lbnRzLlxuXHRcdGlmKCBsYXN0SW5kZXggPCBodG1sLmxlbmd0aCApIHtcblx0XHRcdHZhciB0ZXh0ID0gaHRtbC5zdWJzdHJpbmcoIGxhc3RJbmRleCApO1xuXG5cdFx0XHQvLyBQdXNoIFRleHROb2RlcyBhbmQgRW50aXR5Tm9kZXMgZm9yIGFueSB0ZXh0IGZvdW5kIGJldHdlZW4gdGFnc1xuXHRcdFx0aWYoIHRleHQgKSB7XG5cdFx0XHRcdHRleHRBbmRFbnRpdHlOb2RlcyA9IHRoaXMucGFyc2VUZXh0QW5kRW50aXR5Tm9kZXMoIHRleHQgKTtcblx0XHRcdFx0bm9kZXMucHVzaC5hcHBseSggbm9kZXMsIHRleHRBbmRFbnRpdHlOb2RlcyApO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBub2Rlcztcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBQYXJzZXMgdGV4dCBhbmQgSFRNTCBlbnRpdHkgbm9kZXMgZnJvbSBhIGdpdmVuIHN0cmluZy4gVGhlIGlucHV0IHN0cmluZ1xuXHQgKiBzaG91bGQgbm90IGhhdmUgYW55IEhUTUwgdGFncyAoZWxlbWVudHMpIHdpdGhpbiBpdC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gcGFyc2UuXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVtdfSBBbiBhcnJheSBvZiBIdG1sTm9kZXMgdG9cblx0ICogICByZXByZXNlbnQgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgVGV4dE5vZGVzfSBhbmRcblx0ICogICB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVudGl0eU5vZGUgRW50aXR5Tm9kZXN9IGZvdW5kLlxuXHQgKi9cblx0cGFyc2VUZXh0QW5kRW50aXR5Tm9kZXMgOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHR2YXIgbm9kZXMgPSBbXSxcblx0XHQgICAgdGV4dEFuZEVudGl0eVRva2VucyA9IEF1dG9saW5rZXIuVXRpbC5zcGxpdEFuZENhcHR1cmUoIHRleHQsIHRoaXMuaHRtbENoYXJhY3RlckVudGl0aWVzUmVnZXggKTsgIC8vIHNwbGl0IGF0IEhUTUwgZW50aXRpZXMsIGJ1dCBpbmNsdWRlIHRoZSBIVE1MIGVudGl0aWVzIGluIHRoZSByZXN1bHRzIGFycmF5XG5cblx0XHQvLyBFdmVyeSBldmVuIG51bWJlcmVkIHRva2VuIGlzIGEgVGV4dE5vZGUsIGFuZCBldmVyeSBvZGQgbnVtYmVyZWQgdG9rZW4gaXMgYW4gRW50aXR5Tm9kZVxuXHRcdC8vIEZvciBleGFtcGxlOiBhbiBpbnB1dCBgdGV4dGAgb2YgXCJUZXN0ICZxdW90O3RoaXMmcXVvdDsgdG9kYXlcIiB3b3VsZCB0dXJuIGludG8gdGhlXG5cdFx0Ly8gICBgdGV4dEFuZEVudGl0eVRva2Vuc2A6IFsgJ1Rlc3QgJywgJyZxdW90OycsICd0aGlzJywgJyZxdW90OycsICcgdG9kYXknIF1cblx0XHRmb3IoIHZhciBpID0gMCwgbGVuID0gdGV4dEFuZEVudGl0eVRva2Vucy5sZW5ndGg7IGkgPCBsZW47IGkgKz0gMiApIHtcblx0XHRcdHZhciB0ZXh0VG9rZW4gPSB0ZXh0QW5kRW50aXR5VG9rZW5zWyBpIF0sXG5cdFx0XHQgICAgZW50aXR5VG9rZW4gPSB0ZXh0QW5kRW50aXR5VG9rZW5zWyBpICsgMSBdO1xuXG5cdFx0XHRpZiggdGV4dFRva2VuICkgbm9kZXMucHVzaCggdGhpcy5jcmVhdGVUZXh0Tm9kZSggdGV4dFRva2VuICkgKTtcblx0XHRcdGlmKCBlbnRpdHlUb2tlbiApIG5vZGVzLnB1c2goIHRoaXMuY3JlYXRlRW50aXR5Tm9kZSggZW50aXR5VG9rZW4gKSApO1xuXHRcdH1cblx0XHRyZXR1cm4gbm9kZXM7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGUgQ29tbWVudE5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnVGV4dCBUaGUgZnVsbCB0ZXh0IG9mIHRoZSB0YWcgKGNvbW1lbnQpIHRoYXQgd2FzXG5cdCAqICAgbWF0Y2hlZCwgaW5jbHVkaW5nIGl0cyAmbHQ7IS0tIGFuZCAtLSZndDsuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBjb21tZW50IFRoZSBmdWxsIHRleHQgb2YgdGhlIGNvbW1lbnQgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cdGNyZWF0ZUNvbW1lbnROb2RlIDogZnVuY3Rpb24oIHRhZ1RleHQsIGNvbW1lbnRUZXh0ICkge1xuXHRcdHJldHVybiBuZXcgQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlKCB7XG5cdFx0XHR0ZXh0OiB0YWdUZXh0LFxuXHRcdFx0Y29tbWVudDogQXV0b2xpbmtlci5VdGlsLnRyaW0oIGNvbW1lbnRUZXh0IClcblx0XHR9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgRWxlbWVudE5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnVGV4dCBUaGUgZnVsbCB0ZXh0IG9mIHRoZSB0YWcgKGVsZW1lbnQpIHRoYXQgd2FzXG5cdCAqICAgbWF0Y2hlZCwgaW5jbHVkaW5nIGl0cyBhdHRyaWJ1dGVzLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgdGFnLiBFeDogQW4gJmx0O2ltZyZndDsgdGFnIHdvdWxkXG5cdCAqICAgYmUgcGFzc2VkIHRvIHRoaXMgbWV0aG9kIGFzIFwiaW1nXCIuXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNDbG9zaW5nVGFnIGB0cnVlYCBpZiBpdCdzIGEgY2xvc2luZyB0YWcsIGZhbHNlXG5cdCAqICAgb3RoZXJ3aXNlLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGV9XG5cdCAqL1xuXHRjcmVhdGVFbGVtZW50Tm9kZSA6IGZ1bmN0aW9uKCB0YWdUZXh0LCB0YWdOYW1lLCBpc0Nsb3NpbmdUYWcgKSB7XG5cdFx0cmV0dXJuIG5ldyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUoIHtcblx0XHRcdHRleHQgICAgOiB0YWdUZXh0LFxuXHRcdFx0dGFnTmFtZSA6IHRhZ05hbWUudG9Mb3dlckNhc2UoKSxcblx0XHRcdGNsb3NpbmcgOiBpc0Nsb3NpbmdUYWdcblx0XHR9ICk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRmFjdG9yeSBtZXRob2QgdG8gY3JlYXRlIGEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlIEVudGl0eU5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0aGF0IHdhcyBtYXRjaGVkIGZvciB0aGUgSFRNTCBlbnRpdHkgKHN1Y2hcblx0ICogICBhcyAnJmFtcDtuYnNwOycpLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZX1cblx0ICovXG5cdGNyZWF0ZUVudGl0eU5vZGUgOiBmdW5jdGlvbiggdGV4dCApIHtcblx0XHRyZXR1cm4gbmV3IEF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlKCB7IHRleHQ6IHRleHQgfSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIEZhY3RvcnkgbWV0aG9kIHRvIGNyZWF0ZSBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGUgVGV4dE5vZGV9LlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGV4dCBUaGUgdGV4dCB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKiBAcmV0dXJuIHtBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGV9XG5cdCAqL1xuXHRjcmVhdGVUZXh0Tm9kZSA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHJldHVybiBuZXcgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlKCB7IHRleHQ6IHRleHQgfSApO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGFic3RyYWN0XG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhbiBIVE1MIG5vZGUgZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nLiBBbiBIVE1MIG5vZGUgaXMgb25lIG9mIHRoZVxuICogZm9sbG93aW5nOlxuICpcbiAqIDEuIEFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgRWxlbWVudE5vZGV9LCB3aGljaCByZXByZXNlbnRzXG4gKiAgICBIVE1MIHRhZ3MuXG4gKiAyLiBBIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuQ29tbWVudE5vZGUgQ29tbWVudE5vZGV9LCB3aGljaCByZXByZXNlbnRzXG4gKiAgICBIVE1MIGNvbW1lbnRzLlxuICogMy4gQSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLlRleHROb2RlIFRleHROb2RlfSwgd2hpY2ggcmVwcmVzZW50cyB0ZXh0XG4gKiAgICBvdXRzaWRlIG9yIHdpdGhpbiBIVE1MIHRhZ3MuXG4gKiA0LiBBIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2RlfSwgd2hpY2ggcmVwcmVzZW50c1xuICogICAgb25lIG9mIHRoZSBrbm93biBIVE1MIGVudGl0aWVzIHRoYXQgQXV0b2xpbmtlciBsb29rcyBmb3IuIFRoaXMgaW5jbHVkZXNcbiAqICAgIGNvbW1vbiBvbmVzIHN1Y2ggYXMgJmFtcDtxdW90OyBhbmQgJmFtcDtuYnNwO1xuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0ZXh0IChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIG9yaWdpbmFsIHRleHQgdGhhdCB3YXMgbWF0Y2hlZCBmb3IgdGhlIEh0bWxOb2RlLlxuXHQgKlxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGFuIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgRWxlbWVudE5vZGV9LFxuXHQgKiAgIHRoaXMgd2lsbCBiZSB0aGUgdGFnJ3MgdGV4dC5cblx0ICogLSBJbiB0aGUgY2FzZSBvZiBhbiB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkNvbW1lbnROb2RlIENvbW1lbnROb2RlfSxcblx0ICogICB0aGlzIHdpbGwgYmUgdGhlIGNvbW1lbnQncyB0ZXh0LlxuXHQgKiAtIEluIHRoZSBjYXNlIG9mIGEge0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSBUZXh0Tm9kZX0sIHRoaXNcblx0ICogICB3aWxsIGJlIHRoZSB0ZXh0IGl0c2VsZi5cblx0ICogLSBJbiB0aGUgY2FzZSBvZiBhIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZSBFbnRpdHlOb2RlfSxcblx0ICogICB0aGlzIHdpbGwgYmUgdGhlIHRleHQgb2YgdGhlIEhUTUwgZW50aXR5LlxuXHQgKi9cblx0dGV4dCA6IFwiXCIsXG5cblxuXHQvKipcblx0ICogQGNvbnN0cnVjdG9yXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBjZmcgVGhlIGNvbmZpZ3VyYXRpb24gcHJvcGVydGllcyBmb3IgdGhlIE1hdGNoIGluc3RhbmNlLFxuXHQgKiBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQGFic3RyYWN0XG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBBdXRvbGlua2VyLlV0aWwuYWJzdHJhY3RNZXRob2QsXG5cblxuXHQvKipcblx0ICogUmV0cmlldmVzIHRoZSB7QGxpbmsgI3RleHR9IGZvciB0aGUgSHRtbE5vZGUuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy50ZXh0O1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhbiBIVE1MIGNvbW1lbnQgbm9kZSB0aGF0IGhhcyBiZWVuIHBhcnNlZCBieSB0aGVcbiAqIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5Db21tZW50Tm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGNvbW1lbnQgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgdGV4dCBpbnNpZGUgdGhlIGNvbW1lbnQgdGFnLiBUaGlzIHRleHQgaXMgc3RyaXBwZWQgb2YgYW55IGxlYWRpbmcgb3Jcblx0ICogdHJhaWxpbmcgd2hpdGVzcGFjZS5cblx0ICovXG5cdGNvbW1lbnQgOiAnJyxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2NvbW1lbnQnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGNvbW1lbnQgaW5zaWRlIHRoZSBjb21tZW50IHRhZy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0Q29tbWVudCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmNvbW1lbnQ7XG5cdH1cblxufSApO1xuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLyoqXG4gKiBAY2xhc3MgQXV0b2xpbmtlci5odG1sUGFyc2VyLkVsZW1lbnROb2RlXG4gKiBAZXh0ZW5kcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGVcbiAqXG4gKiBSZXByZXNlbnRzIGFuIEhUTUwgZWxlbWVudCBub2RlIHRoYXQgaGFzIGJlZW4gcGFyc2VkIGJ5IHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9LlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZX0pIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLmh0bWxQYXJzZXIuRWxlbWVudE5vZGUgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbE5vZGUsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0YWdOYW1lIChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIG5hbWUgb2YgdGhlIHRhZyB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0dGFnTmFtZSA6ICcnLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBjbG9zaW5nIChyZXF1aXJlZClcblx0ICpcblx0ICogYHRydWVgIGlmIHRoZSBlbGVtZW50ICh0YWcpIGlzIGEgY2xvc2luZyB0YWcsIGBmYWxzZWAgaWYgaXRzIGFuIG9wZW5pbmdcblx0ICogdGFnLlxuXHQgKi9cblx0Y2xvc2luZyA6IGZhbHNlLFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZWxlbWVudCc7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgSFRNTCBlbGVtZW50J3MgKHRhZydzKSBuYW1lLiBFeDogZm9yIGFuICZsdDtpbWcmZ3Q7IHRhZyxcblx0ICogcmV0dXJucyBcImltZ1wiLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUYWdOYW1lIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMudGFnTmFtZTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIHRoZSBIVE1MIGVsZW1lbnQgKHRhZykgaXMgYSBjbG9zaW5nIHRhZy4gRXg6ICZsdDtkaXYmZ3Q7XG5cdCAqIHJldHVybnMgYGZhbHNlYCwgd2hpbGUgJmx0Oy9kaXYmZ3Q7IHJldHVybnMgYHRydWVgLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufVxuXHQgKi9cblx0aXNDbG9zaW5nIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuY2xvc2luZztcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuRW50aXR5Tm9kZVxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlXG4gKlxuICogUmVwcmVzZW50cyBhIGtub3duIEhUTUwgZW50aXR5IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKiBFeDogJyZhbXA7bmJzcDsnLCBvciAnJmFtcCMxNjA7JyAod2hpY2ggd2lsbCBiZSByZXRyaWV2YWJsZSBmcm9tIHRoZSB7QGxpbmsgI2dldFRleHR9XG4gKiBtZXRob2QuXG4gKlxuICogTm90ZSB0aGF0IHRoaXMgY2xhc3Mgd2lsbCBvbmx5IGJlIHJldHVybmVkIGZyb20gdGhlIEh0bWxQYXJzZXIgZm9yIHRoZSBzZXQgb2ZcbiAqIGNoZWNrZWQgSFRNTCBlbnRpdHkgbm9kZXMgIGRlZmluZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlciNodG1sQ2hhcmFjdGVyRW50aXRpZXNSZWdleH0uXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5FbnRpdHlOb2RlID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlLCB7XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2Ygbm9kZSB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnZW50aXR5Jztcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLmh0bWxQYXJzZXIuVGV4dE5vZGVcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZVxuICpcbiAqIFJlcHJlc2VudHMgYSB0ZXh0IG5vZGUgdGhhdCBoYXMgYmVlbiBwYXJzZWQgYnkgdGhlIHtAbGluayBBdXRvbGlua2VyLmh0bWxQYXJzZXIuSHRtbFBhcnNlcn0uXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxOb2RlfSkgZm9yIG1vcmVcbiAqIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIuaHRtbFBhcnNlci5UZXh0Tm9kZSA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIuaHRtbFBhcnNlci5IdG1sTm9kZSwge1xuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG5vZGUgdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3RleHQnO1xuXHR9XG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQHByaXZhdGVcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBVc2VkIGJ5IEF1dG9saW5rZXIgdG8gcGFyc2UgcG90ZW50aWFsIG1hdGNoZXMsIGdpdmVuIGFuIGlucHV0IHN0cmluZyBvZiB0ZXh0LlxuICpcbiAqIFRoZSBNYXRjaFBhcnNlciBpcyBmZWQgYSBub24tSFRNTCBzdHJpbmcgaW4gb3JkZXIgdG8gc2VhcmNoIGZvciBtYXRjaGVzLlxuICogQXV0b2xpbmtlciBmaXJzdCB1c2VzIHRoZSB7QGxpbmsgQXV0b2xpbmtlci5odG1sUGFyc2VyLkh0bWxQYXJzZXJ9IHRvIFwid2Fsa1xuICogYXJvdW5kXCIgSFRNTCB0YWdzLCBhbmQgdGhlbiB0aGUgdGV4dCBhcm91bmQgdGhlIEhUTUwgdGFncyBpcyBwYXNzZWQgaW50byB0aGVcbiAqIE1hdGNoUGFyc2VyIGluIG9yZGVyIHRvIGZpbmQgdGhlIGFjdHVhbCBtYXRjaGVzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggT2JqZWN0LCB7XG5cblx0LyoqXG5cdCAqIEBjZmcge09iamVjdH0gdXJsc1xuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI3VybHNcblx0ICovXG5cdHVybHMgOiB0cnVlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBlbWFpbFxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI2VtYWlsXG5cdCAqL1xuXHRlbWFpbCA6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHR3aXR0ZXJcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciN0d2l0dGVyXG5cdCAqL1xuXHR0d2l0dGVyIDogdHJ1ZSxcblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gcGhvbmVcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNwaG9uZVxuXHQgKi9cblx0cGhvbmU6IHRydWUsXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW4vU3RyaW5nfSBoYXNodGFnXG5cdCAqIEBpbmhlcml0ZG9jIEF1dG9saW5rZXIjaGFzaHRhZ1xuXHQgKi9cblx0aGFzaHRhZyA6IGZhbHNlLFxuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBzdHJpcFByZWZpeFxuXHQgKiBAaW5oZXJpdGRvYyBBdXRvbGlua2VyI3N0cmlwUHJlZml4XG5cdCAqL1xuXHRzdHJpcFByZWZpeCA6IHRydWUsXG5cblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IG1hdGNoZXJSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHRoYXQgbWF0Y2hlcyBVUkxzLCBlbWFpbCBhZGRyZXNzZXMsIHBob25lICNzLFxuXHQgKiBUd2l0dGVyIGhhbmRsZXMsIGFuZCBIYXNodGFncy5cblx0ICpcblx0ICogVGhpcyByZWd1bGFyIGV4cHJlc3Npb24gaGFzIHRoZSBmb2xsb3dpbmcgY2FwdHVyaW5nIGdyb3Vwczpcblx0ICpcblx0ICogMS4gIEdyb3VwIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlcmUgaXMgYSBUd2l0dGVyIGhhbmRsZSBtYXRjaFxuXHQgKiAgICAgKGkuZS4gXFxAc29tZVR3aXR0ZXJVc2VyKS4gU2ltcGx5IGNoZWNrIGZvciBpdHMgZXhpc3RlbmNlIHRvIGRldGVybWluZVxuXHQgKiAgICAgaWYgdGhlcmUgaXMgYSBUd2l0dGVyIGhhbmRsZSBtYXRjaC4gVGhlIG5leHQgY291cGxlIG9mIGNhcHR1cmluZ1xuXHQgKiAgICAgZ3JvdXBzIGdpdmUgaW5mb3JtYXRpb24gYWJvdXQgdGhlIFR3aXR0ZXIgaGFuZGxlIG1hdGNoLlxuXHQgKiAyLiAgVGhlIHdoaXRlc3BhY2UgY2hhcmFjdGVyIGJlZm9yZSB0aGUgXFxAc2lnbiBpbiBhIFR3aXR0ZXIgaGFuZGxlLiBUaGlzXG5cdCAqICAgICBpcyBuZWVkZWQgYmVjYXVzZSB0aGVyZSBhcmUgbm8gbG9va2JlaGluZHMgaW4gSlMgcmVndWxhciBleHByZXNzaW9ucyxcblx0ICogICAgIGFuZCBjYW4gYmUgdXNlZCB0byByZWNvbnN0cnVjdCB0aGUgb3JpZ2luYWwgc3RyaW5nIGluIGEgcmVwbGFjZSgpLlxuXHQgKiAzLiAgVGhlIFR3aXR0ZXIgaGFuZGxlIGl0c2VsZiBpbiBhIFR3aXR0ZXIgbWF0Y2guIElmIHRoZSBtYXRjaCBpc1xuXHQgKiAgICAgJ0Bzb21lVHdpdHRlclVzZXInLCB0aGUgaGFuZGxlIGlzICdzb21lVHdpdHRlclVzZXInLlxuXHQgKiA0LiAgR3JvdXAgdGhhdCBtYXRjaGVzIGFuIGVtYWlsIGFkZHJlc3MuIFVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZSBtYXRjaFxuXHQgKiAgICAgaXMgYW4gZW1haWwgYWRkcmVzcywgYXMgd2VsbCBhcyBob2xkaW5nIHRoZSBmdWxsIGFkZHJlc3MuIEV4OlxuXHQgKiAgICAgJ21lQG15LmNvbSdcblx0ICogNS4gIEdyb3VwIHRoYXQgbWF0Y2hlcyBhIFVSTCBpbiB0aGUgaW5wdXQgdGV4dC4gRXg6ICdodHRwOi8vZ29vZ2xlLmNvbScsXG5cdCAqICAgICAnd3d3Lmdvb2dsZS5jb20nLCBvciBqdXN0ICdnb29nbGUuY29tJy4gVGhpcyBhbHNvIGluY2x1ZGVzIGEgcGF0aCxcblx0ICogICAgIHVybCBwYXJhbWV0ZXJzLCBvciBoYXNoIGFuY2hvcnMuIEV4OiBnb29nbGUuY29tL3BhdGgvdG8vZmlsZT9xMT0xJnEyPTIjbXlBbmNob3Jcblx0ICogNi4gIEdyb3VwIHRoYXQgbWF0Y2hlcyBhIHByb3RvY29sIFVSTCAoaS5lLiAnaHR0cDovL2dvb2dsZS5jb20nKS4gVGhpcyBpc1xuXHQgKiAgICAgdXNlZCB0byBtYXRjaCBwcm90b2NvbCBVUkxzIHdpdGgganVzdCBhIHNpbmdsZSB3b3JkLCBsaWtlICdodHRwOi8vbG9jYWxob3N0Jyxcblx0ICogICAgIHdoZXJlIHdlIHdvbid0IGRvdWJsZSBjaGVjayB0aGF0IHRoZSBkb21haW4gbmFtZSBoYXMgYXQgbGVhc3Qgb25lICcuJ1xuXHQgKiAgICAgaW4gaXQuXG5cdCAqIDcuICBHcm91cCB0aGF0IG1hdGNoZXMgYSAnd3d3LicgcHJlZml4ZWQgVVJMLiBUaGlzIGlzIG9ubHkgbWF0Y2hlZCBpZiB0aGVcblx0ICogICAgICd3d3cuJyB0ZXh0IHdhcyBub3QgcHJlZml4ZWQgYnkgYSBzY2hlbWUgKGkuZS46IG5vdCBwcmVmaXhlZCBieVxuXHQgKiAgICAgJ2h0dHA6Ly8nLCAnZnRwOicsIGV0Yy4pXG5cdCAqIDguICBBIHByb3RvY29sLXJlbGF0aXZlICgnLy8nKSBtYXRjaCBmb3IgdGhlIGNhc2Ugb2YgYSAnd3d3LicgcHJlZml4ZWRcblx0ICogICAgIFVSTC4gV2lsbCBiZSBhbiBlbXB0eSBzdHJpbmcgaWYgaXQgaXMgbm90IGEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2guXG5cdCAqICAgICBXZSBuZWVkIHRvIGtub3cgdGhlIGNoYXJhY3RlciBiZWZvcmUgdGhlICcvLycgaW4gb3JkZXIgdG8gZGV0ZXJtaW5lXG5cdCAqICAgICBpZiBpdCBpcyBhIHZhbGlkIG1hdGNoIG9yIHRoZSAvLyB3YXMgaW4gYSBzdHJpbmcgd2UgZG9uJ3Qgd2FudCB0b1xuXHQgKiAgICAgYXV0by1saW5rLlxuXHQgKiA5LiAgR3JvdXAgdGhhdCBtYXRjaGVzIGEga25vd24gVExEICh0b3AgbGV2ZWwgZG9tYWluKSwgd2hlbiBhIHNjaGVtZVxuXHQgKiAgICAgb3IgJ3d3dy4nLXByZWZpeGVkIGRvbWFpbiBpcyBub3QgbWF0Y2hlZC5cblx0ICogMTAuICBBIHByb3RvY29sLXJlbGF0aXZlICgnLy8nKSBtYXRjaCBmb3IgdGhlIGNhc2Ugb2YgYSBrbm93biBUTEQgcHJlZml4ZWRcblx0ICogICAgIFVSTC4gV2lsbCBiZSBhbiBlbXB0eSBzdHJpbmcgaWYgaXQgaXMgbm90IGEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2guXG5cdCAqICAgICBTZWUgIzYgZm9yIG1vcmUgaW5mby5cblx0ICogMTEuIEdyb3VwIHRoYXQgaXMgdXNlZCB0byBkZXRlcm1pbmUgaWYgdGhlcmUgaXMgYSBwaG9uZSBudW1iZXIgbWF0Y2guXG5cdCAqIDEyLiBJZiB0aGVyZSBpcyBhIHBob25lIG51bWJlciBtYXRjaCwgYW5kIGEgJysnIHNpZ24gd2FzIGluY2x1ZGVkIHdpdGhcblx0ICogICAgIHRoZSBwaG9uZSBudW1iZXIsIHRoaXMgZ3JvdXAgd2lsbCBiZSBwb3B1bGF0ZWQgd2l0aCB0aGUgJysnIHNpZ24uXG5cdCAqIDEzLiBHcm91cCB0aGF0IGlzIHVzZWQgdG8gZGV0ZXJtaW5lIGlmIHRoZXJlIGlzIGEgSGFzaHRhZyBtYXRjaFxuXHQgKiAgICAgKGkuZS4gXFwjc29tZUhhc2h0YWcpLiBTaW1wbHkgY2hlY2sgZm9yIGl0cyBleGlzdGVuY2UgdG8gZGV0ZXJtaW5lIGlmXG5cdCAqICAgICB0aGVyZSBpcyBhIEhhc2h0YWcgbWF0Y2guIFRoZSBuZXh0IGNvdXBsZSBvZiBjYXB0dXJpbmcgZ3JvdXBzIGdpdmVcblx0ICogICAgIGluZm9ybWF0aW9uIGFib3V0IHRoZSBIYXNodGFnIG1hdGNoLlxuXHQgKiAxNC4gVGhlIHdoaXRlc3BhY2UgY2hhcmFjdGVyIGJlZm9yZSB0aGUgI3NpZ24gaW4gYSBIYXNodGFnIGhhbmRsZS4gVGhpc1xuXHQgKiAgICAgaXMgbmVlZGVkIGJlY2F1c2UgdGhlcmUgYXJlIG5vIGxvb2stYmVoaW5kcyBpbiBKUyByZWd1bGFyXG5cdCAqICAgICBleHByZXNzaW9ucywgYW5kIGNhbiBiZSB1c2VkIHRvIHJlY29uc3RydWN0IHRoZSBvcmlnaW5hbCBzdHJpbmcgaW4gYVxuXHQgKiAgICAgcmVwbGFjZSgpLlxuXHQgKiAxNS4gVGhlIEhhc2h0YWcgaXRzZWxmIGluIGEgSGFzaHRhZyBtYXRjaC4gSWYgdGhlIG1hdGNoIGlzXG5cdCAqICAgICAnI3NvbWVIYXNodGFnJywgdGhlIGhhc2h0YWcgaXMgJ3NvbWVIYXNodGFnJy5cblx0ICovXG5cdG1hdGNoZXJSZWdleCA6IChmdW5jdGlvbigpIHtcblx0XHR2YXIgdHdpdHRlclJlZ2V4ID0gLyhefFteXFx3XSlAKFxcd3sxLDE1fSkvLCAgICAgICAgICAgICAgLy8gRm9yIG1hdGNoaW5nIGEgdHdpdHRlciBoYW5kbGUuIEV4OiBAZ3JlZ29yeV9qYWNvYnNcblxuXHRcdCAgICBoYXNodGFnUmVnZXggPSAvKF58W15cXHddKSMoXFx3ezEsMTM5fSkvLCAgICAgICAgICAgICAgLy8gRm9yIG1hdGNoaW5nIGEgSGFzaHRhZy4gRXg6ICNnYW1lc1xuXG5cdFx0ICAgIGVtYWlsUmVnZXggPSAvKD86W1xcLTs6Jj1cXCtcXCQsXFx3XFwuXStAKS8sICAgICAgICAgICAgIC8vIHNvbWV0aGluZ0AgZm9yIGVtYWlsIGFkZHJlc3NlcyAoYS5rLmEuIGxvY2FsLXBhcnQpXG5cdFx0ICAgIHBob25lUmVnZXggPSAvKD86KFxcKyk/XFxkezEsM31bLVxcMDQwLl0pP1xcKD9cXGR7M31cXCk/Wy1cXDA0MC5dP1xcZHszfVstXFwwNDAuXVxcZHs0fS8sICAvLyBleDogKDEyMykgNDU2LTc4OTAsIDEyMyA0NTYgNzg5MCwgMTIzLTQ1Ni03ODkwLCBldGMuXG5cdFx0ICAgIHByb3RvY29sUmVnZXggPSAvKD86W0EtWmEtel1bLS4rQS1aYS16MC05XSo6KD8hW0EtWmEtel1bLS4rQS1aYS16MC05XSo6XFwvXFwvKSg/IVxcZCtcXC8/KSg/OlxcL1xcLyk/KS8sICAvLyBtYXRjaCBwcm90b2NvbCwgYWxsb3cgaW4gZm9ybWF0IFwiaHR0cDovL1wiIG9yIFwibWFpbHRvOlwiLiBIb3dldmVyLCBkbyBub3QgbWF0Y2ggdGhlIGZpcnN0IHBhcnQgb2Ygc29tZXRoaW5nIGxpa2UgJ2xpbms6aHR0cDovL3d3dy5nb29nbGUuY29tJyAoaS5lLiBkb24ndCBtYXRjaCBcImxpbms6XCIpLiBBbHNvLCBtYWtlIHN1cmUgd2UgZG9uJ3QgaW50ZXJwcmV0ICdnb29nbGUuY29tOjgwMDAnIGFzIGlmICdnb29nbGUuY29tJyB3YXMgYSBwcm90b2NvbCBoZXJlIChpLmUuIGlnbm9yZSBhIHRyYWlsaW5nIHBvcnQgbnVtYmVyIGluIHRoaXMgcmVnZXgpXG5cdFx0ICAgIHd3d1JlZ2V4ID0gLyg/Ond3d1xcLikvLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RhcnRpbmcgd2l0aCAnd3d3Lidcblx0XHQgICAgZG9tYWluTmFtZVJlZ2V4ID0gL1tBLVphLXowLTlcXC5cXC1dKltBLVphLXowLTlcXC1dLywgIC8vIGFueXRoaW5nIGxvb2tpbmcgYXQgYWxsIGxpa2UgYSBkb21haW4sIG5vbi11bmljb2RlIGRvbWFpbnMsIG5vdCBlbmRpbmcgaW4gYSBwZXJpb2Rcblx0XHQgICAgdGxkUmVnZXggPSAvXFwuKD86aW50ZXJuYXRpb25hbHxjb25zdHJ1Y3Rpb258Y29udHJhY3RvcnN8ZW50ZXJwcmlzZXN8cGhvdG9ncmFwaHl8cHJvZHVjdGlvbnN8Zm91bmRhdGlvbnxpbW1vYmlsaWVufGluZHVzdHJpZXN8bWFuYWdlbWVudHxwcm9wZXJ0aWVzfHRlY2hub2xvZ3l8Y2hyaXN0bWFzfGNvbW11bml0eXxkaXJlY3Rvcnl8ZWR1Y2F0aW9ufGVxdWlwbWVudHxpbnN0aXR1dGV8bWFya2V0aW5nfHNvbHV0aW9uc3x2YWNhdGlvbnN8YmFyZ2FpbnN8Ym91dGlxdWV8YnVpbGRlcnN8Y2F0ZXJpbmd8Y2xlYW5pbmd8Y2xvdGhpbmd8Y29tcHV0ZXJ8ZGVtb2NyYXR8ZGlhbW9uZHN8Z3JhcGhpY3N8aG9sZGluZ3N8bGlnaHRpbmd8cGFydG5lcnN8cGx1bWJpbmd8c3VwcGxpZXN8dHJhaW5pbmd8dmVudHVyZXN8YWNhZGVteXxjYXJlZXJzfGNvbXBhbnl8Y3J1aXNlc3xkb21haW5zfGV4cG9zZWR8ZmxpZ2h0c3xmbG9yaXN0fGdhbGxlcnl8Z3VpdGFyc3xob2xpZGF5fGtpdGNoZW58bmV1c3Rhcnxva2luYXdhfHJlY2lwZXN8cmVudGFsc3xyZXZpZXdzfHNoaWtzaGF8c2luZ2xlc3xzdXBwb3J0fHN5c3RlbXN8YWdlbmN5fGJlcmxpbnxjYW1lcmF8Y2VudGVyfGNvZmZlZXxjb25kb3N8ZGF0aW5nfGVzdGF0ZXxldmVudHN8ZXhwZXJ0fGZ1dGJvbHxrYXVmZW58bHV4dXJ5fG1haXNvbnxtb25hc2h8bXVzZXVtfG5hZ295YXxwaG90b3N8cmVwYWlyfHJlcG9ydHxzb2NpYWx8c3VwcGx5fHRhdHRvb3x0aWVuZGF8dHJhdmVsfHZpYWplc3x2aWxsYXN8dmlzaW9ufHZvdGluZ3x2b3lhZ2V8YWN0b3J8YnVpbGR8Y2FyZHN8Y2hlYXB8Y29kZXN8ZGFuY2V8ZW1haWx8Z2xhc3N8aG91c2V8bWFuZ298bmluamF8cGFydHN8cGhvdG98cHJlc3N8c2hvZXN8c29sYXJ8dG9kYXl8dG9reW98dG9vbHN8d2F0Y2h8d29ya3N8YWVyb3xhcnBhfGFzaWF8YmVzdHxiaWtlfGJsdWV8YnV6enxjYW1wfGNsdWJ8Y29vbHxjb29wfGZhcm18ZmlzaHxnaWZ0fGd1cnV8aW5mb3xqb2JzfGtpd2l8a3JlZHxsYW5kfGxpbW98bGlua3xtZW51fG1vYml8bW9kYXxuYW1lfHBpY3N8cGlua3xwb3N0fHFwb258cmljaHxydWhyfHNleHl8dGlwc3x2b3RlfHZvdG98d2FuZ3x3aWVufHdpa2l8em9uZXxiYXJ8YmlkfGJpenxjYWJ8Y2F0fGNlb3xjb218ZWR1fGdvdnxpbnR8a2ltfG1pbHxuZXR8b25sfG9yZ3xwcm98cHVifHJlZHx0ZWx8dW5vfHdlZHx4eHh8eHl6fGFjfGFkfGFlfGFmfGFnfGFpfGFsfGFtfGFufGFvfGFxfGFyfGFzfGF0fGF1fGF3fGF4fGF6fGJhfGJifGJkfGJlfGJmfGJnfGJofGJpfGJqfGJtfGJufGJvfGJyfGJzfGJ0fGJ2fGJ3fGJ5fGJ6fGNhfGNjfGNkfGNmfGNnfGNofGNpfGNrfGNsfGNtfGNufGNvfGNyfGN1fGN2fGN3fGN4fGN5fGN6fGRlfGRqfGRrfGRtfGRvfGR6fGVjfGVlfGVnfGVyfGVzfGV0fGV1fGZpfGZqfGZrfGZtfGZvfGZyfGdhfGdifGdkfGdlfGdmfGdnfGdofGdpfGdsfGdtfGdufGdwfGdxfGdyfGdzfGd0fGd1fGd3fGd5fGhrfGhtfGhufGhyfGh0fGh1fGlkfGllfGlsfGltfGlufGlvfGlxfGlyfGlzfGl0fGplfGptfGpvfGpwfGtlfGtnfGtofGtpfGttfGtufGtwfGtyfGt3fGt5fGt6fGxhfGxifGxjfGxpfGxrfGxyfGxzfGx0fGx1fGx2fGx5fG1hfG1jfG1kfG1lfG1nfG1ofG1rfG1sfG1tfG1ufG1vfG1wfG1xfG1yfG1zfG10fG11fG12fG13fG14fG15fG16fG5hfG5jfG5lfG5mfG5nfG5pfG5sfG5vfG5wfG5yfG51fG56fG9tfHBhfHBlfHBmfHBnfHBofHBrfHBsfHBtfHBufHByfHBzfHB0fHB3fHB5fHFhfHJlfHJvfHJzfHJ1fHJ3fHNhfHNifHNjfHNkfHNlfHNnfHNofHNpfHNqfHNrfHNsfHNtfHNufHNvfHNyfHN0fHN1fHN2fHN4fHN5fHN6fHRjfHRkfHRmfHRnfHRofHRqfHRrfHRsfHRtfHRufHRvfHRwfHRyfHR0fHR2fHR3fHR6fHVhfHVnfHVrfHVzfHV5fHV6fHZhfHZjfHZlfHZnfHZpfHZufHZ1fHdmfHdzfHllfHl0fHphfHptfHp3KVxcYi8sICAgLy8gbWF0Y2ggb3VyIGtub3duIHRvcCBsZXZlbCBkb21haW5zIChUTERzKVxuXG5cdFx0ICAgIC8vIEFsbG93IG9wdGlvbmFsIHBhdGgsIHF1ZXJ5IHN0cmluZywgYW5kIGhhc2ggYW5jaG9yLCBub3QgZW5kaW5nIGluIHRoZSBmb2xsb3dpbmcgY2hhcmFjdGVyczogXCI/ITosLjtcIlxuXHRcdCAgICAvLyBodHRwOi8vYmxvZy5jb2Rpbmdob3Jyb3IuY29tL3RoZS1wcm9ibGVtLXdpdGgtdXJscy9cblx0XHQgICAgdXJsU3VmZml4UmVnZXggPSAvW1xcLUEtWmEtejAtOSsmQCNcXC8lPX5fKCl8JyQqXFxbXFxdPyE6LC47XSpbXFwtQS1aYS16MC05KyZAI1xcLyU9fl8oKXwnJCpcXFtcXF1dLztcblxuXHRcdHJldHVybiBuZXcgUmVnRXhwKCBbXG5cdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxLCB3aGljaCBjYW4gYmUgdXNlZCB0byBjaGVjayBmb3IgYSB0d2l0dGVyIGhhbmRsZSBtYXRjaC4gVXNlIGdyb3VwICQzIGZvciB0aGUgYWN0dWFsIHR3aXR0ZXIgaGFuZGxlIHRob3VnaC4gJDIgbWF5IGJlIHVzZWQgdG8gcmVjb25zdHJ1Y3QgdGhlIG9yaWdpbmFsIHN0cmluZyBpbiBhIHJlcGxhY2UoKVxuXHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQyLCB3aGljaCBtYXRjaGVzIHRoZSB3aGl0ZXNwYWNlIGNoYXJhY3RlciBiZWZvcmUgdGhlICdAJyBzaWduIChuZWVkZWQgYmVjYXVzZSBvZiBubyBsb29rYmVoaW5kcyksIGFuZFxuXHRcdFx0XHQvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQzLCB3aGljaCBtYXRjaGVzIHRoZSBhY3R1YWwgdHdpdHRlciBoYW5kbGVcblx0XHRcdFx0dHdpdHRlclJlZ2V4LnNvdXJjZSxcblx0XHRcdCcpJyxcblxuXHRcdFx0J3wnLFxuXG5cdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ0LCB3aGljaCBpcyB1c2VkIHRvIGRldGVybWluZSBhbiBlbWFpbCBtYXRjaFxuXHRcdFx0XHRlbWFpbFJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0ZG9tYWluTmFtZVJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0dGxkUmVnZXguc291cmNlLFxuXHRcdFx0JyknLFxuXG5cdFx0XHQnfCcsXG5cblx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDUsIHdoaWNoIGlzIHVzZWQgdG8gbWF0Y2ggYSBVUkxcblx0XHRcdFx0Jyg/OicsIC8vIHBhcmVucyB0byBjb3ZlciBtYXRjaCBmb3IgcHJvdG9jb2wgKG9wdGlvbmFsKSwgYW5kIGRvbWFpblxuXHRcdFx0XHRcdCcoJywgIC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDYsIGZvciBhIHNjaGVtZS1wcmVmaXhlZCB1cmwgKGV4OiBodHRwOi8vZ29vZ2xlLmNvbSlcblx0XHRcdFx0XHRcdHByb3RvY29sUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdFx0ZG9tYWluTmFtZVJlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHQnKScsXG5cblx0XHRcdFx0XHQnfCcsXG5cblx0XHRcdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ3LCBmb3IgYSAnd3d3LicgcHJlZml4ZWQgdXJsIChleDogd3d3Lmdvb2dsZS5jb20pXG5cdFx0XHRcdFx0XHQnKC4/Ly8pPycsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQ4IGZvciBhbiBvcHRpb25hbCBwcm90b2NvbC1yZWxhdGl2ZSBVUkwuIE11c3QgYmUgYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nIG9yIHN0YXJ0IHdpdGggYSBub24td29yZCBjaGFyYWN0ZXJcblx0XHRcdFx0XHRcdHd3d1JlZ2V4LnNvdXJjZSxcblx0XHRcdFx0XHRcdGRvbWFpbk5hbWVSZWdleC5zb3VyY2UsXG5cdFx0XHRcdFx0JyknLFxuXG5cdFx0XHRcdFx0J3wnLFxuXG5cdFx0XHRcdFx0JygnLCAgLy8gKioqIENhcHR1cmluZyBncm91cCAkOSwgZm9yIGtub3duIGEgVExEIHVybCAoZXg6IGdvb2dsZS5jb20pXG5cdFx0XHRcdFx0XHQnKC4/Ly8pPycsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxMCBmb3IgYW4gb3B0aW9uYWwgcHJvdG9jb2wtcmVsYXRpdmUgVVJMLiBNdXN0IGJlIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIHN0cmluZyBvciBzdGFydCB3aXRoIGEgbm9uLXdvcmQgY2hhcmFjdGVyXG5cdFx0XHRcdFx0XHRkb21haW5OYW1lUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdFx0dGxkUmVnZXguc291cmNlLFxuXHRcdFx0XHRcdCcpJyxcblx0XHRcdFx0JyknLFxuXG5cdFx0XHRcdCcoPzonICsgdXJsU3VmZml4UmVnZXguc291cmNlICsgJyk/JywgIC8vIG1hdGNoIGZvciBwYXRoLCBxdWVyeSBzdHJpbmcsIGFuZC9vciBoYXNoIGFuY2hvciAtIG9wdGlvbmFsXG5cdFx0XHQnKScsXG5cblx0XHRcdCd8JyxcblxuXHRcdFx0Ly8gdGhpcyBzZXR1cCBkb2VzIG5vdCBzY2FsZSB3ZWxsIGZvciBvcGVuIGV4dGVuc2lvbiA6KCBOZWVkIHRvIHJldGhpbmsgZGVzaWduIG9mIGF1dG9saW5rZXIuLi5cblx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDExLCB3aGljaCBtYXRjaGVzIGEgKFVTQSBmb3Igbm93KSBwaG9uZSBudW1iZXIsIGFuZFxuXHRcdFx0Ly8gKioqIENhcHR1cmluZyBncm91cCAkMTIsIHdoaWNoIG1hdGNoZXMgdGhlICcrJyBzaWduIGZvciBpbnRlcm5hdGlvbmFsIG51bWJlcnMsIGlmIGl0IGV4aXN0c1xuXHRcdFx0JygnLFxuXHRcdFx0XHRwaG9uZVJlZ2V4LnNvdXJjZSxcblx0XHRcdCcpJyxcblxuXHRcdFx0J3wnLFxuXG5cdFx0XHQnKCcsICAvLyAqKiogQ2FwdHVyaW5nIGdyb3VwICQxMywgd2hpY2ggY2FuIGJlIHVzZWQgdG8gY2hlY2sgZm9yIGEgSGFzaHRhZyBtYXRjaC4gVXNlIGdyb3VwICQxMiBmb3IgdGhlIGFjdHVhbCBIYXNodGFnIHRob3VnaC4gJDExIG1heSBiZSB1c2VkIHRvIHJlY29uc3RydWN0IHRoZSBvcmlnaW5hbCBzdHJpbmcgaW4gYSByZXBsYWNlKClcblx0XHRcdFx0Ly8gKioqIENhcHR1cmluZyBncm91cCAkMTQsIHdoaWNoIG1hdGNoZXMgdGhlIHdoaXRlc3BhY2UgY2hhcmFjdGVyIGJlZm9yZSB0aGUgJyMnIHNpZ24gKG5lZWRlZCBiZWNhdXNlIG9mIG5vIGxvb2tiZWhpbmRzKSwgYW5kXG5cdFx0XHRcdC8vICoqKiBDYXB0dXJpbmcgZ3JvdXAgJDE1LCB3aGljaCBtYXRjaGVzIHRoZSBhY3R1YWwgSGFzaHRhZ1xuXHRcdFx0XHRoYXNodGFnUmVnZXguc291cmNlLFxuXHRcdFx0JyknXG5cdFx0XS5qb2luKCBcIlwiICksICdnaScgKTtcblx0fSApKCksXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBjaGFyQmVmb3JlUHJvdG9jb2xSZWxNYXRjaFJlZ2V4XG5cdCAqXG5cdCAqIFRoZSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byByZXRyaWV2ZSB0aGUgY2hhcmFjdGVyIGJlZm9yZSBhXG5cdCAqIHByb3RvY29sLXJlbGF0aXZlIFVSTCBtYXRjaC5cblx0ICpcblx0ICogVGhpcyBpcyB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHtAbGluayAjbWF0Y2hlclJlZ2V4fSwgd2hpY2ggbmVlZHNcblx0ICogdG8gZ3JhYiB0aGUgY2hhcmFjdGVyIGJlZm9yZSBhIHByb3RvY29sLXJlbGF0aXZlICcvLycgZHVlIHRvIHRoZSBsYWNrIG9mXG5cdCAqIGEgbmVnYXRpdmUgbG9vay1iZWhpbmQgaW4gSmF2YVNjcmlwdCByZWd1bGFyIGV4cHJlc3Npb25zLiBUaGUgY2hhcmFjdGVyXG5cdCAqIGJlZm9yZSB0aGUgbWF0Y2ggaXMgc3RyaXBwZWQgZnJvbSB0aGUgVVJMLlxuXHQgKi9cblx0Y2hhckJlZm9yZVByb3RvY29sUmVsTWF0Y2hSZWdleCA6IC9eKC4pP1xcL1xcLy8sXG5cblx0LyoqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7QXV0b2xpbmtlci5NYXRjaFZhbGlkYXRvcn0gbWF0Y2hWYWxpZGF0b3Jcblx0ICpcblx0ICogVGhlIE1hdGNoVmFsaWRhdG9yIG9iamVjdCwgdXNlZCB0byBmaWx0ZXIgb3V0IGFueSBmYWxzZSBwb3NpdGl2ZXMgZnJvbVxuXHQgKiB0aGUge0BsaW5rICNtYXRjaGVyUmVnZXh9LiBTZWUge0BsaW5rIEF1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3J9IGZvciBkZXRhaWxzLlxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtPYmplY3R9IFtjZmddIFRoZSBjb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBBbmNob3JUYWdCdWlsZGVyXG5cdCAqIGluc3RhbmNlLCBzcGVjaWZpZWQgaW4gYW4gT2JqZWN0IChtYXApLlxuXHQgKi9cblx0Y29uc3RydWN0b3IgOiBmdW5jdGlvbiggY2ZnICkge1xuXHRcdEF1dG9saW5rZXIuVXRpbC5hc3NpZ24oIHRoaXMsIGNmZyApO1xuXG5cdFx0dGhpcy5tYXRjaFZhbGlkYXRvciA9IG5ldyBBdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yKCk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUGFyc2VzIHRoZSBpbnB1dCBgdGV4dGAgdG8gc2VhcmNoIGZvciBtYXRjaGVzLCBhbmQgY2FsbHMgdGhlIGByZXBsYWNlRm5gXG5cdCAqIHRvIGFsbG93IHJlcGxhY2VtZW50cyBvZiB0aGUgbWF0Y2hlcy4gUmV0dXJucyB0aGUgYHRleHRgIHdpdGggbWF0Y2hlc1xuXHQgKiByZXBsYWNlZC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHRleHQgVGhlIHRleHQgdG8gc2VhcmNoIGFuZCByZXBhY2UgbWF0Y2hlcyBpbi5cblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gcmVwbGFjZUZuIFRoZSBpdGVyYXRvciBmdW5jdGlvbiB0byBoYW5kbGUgdGhlXG5cdCAqICAgcmVwbGFjZW1lbnRzLiBUaGUgZnVuY3Rpb24gdGFrZXMgYSBzaW5nbGUgYXJndW1lbnQsIGEge0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9XG5cdCAqICAgb2JqZWN0LCBhbmQgc2hvdWxkIHJldHVybiB0aGUgdGV4dCB0aGF0IHNob3VsZCBtYWtlIHRoZSByZXBsYWNlbWVudC5cblx0ICogQHBhcmFtIHtPYmplY3R9IFtjb250ZXh0T2JqPXdpbmRvd10gVGhlIGNvbnRleHQgb2JqZWN0IChcInNjb3BlXCIpIHRvIHJ1blxuXHQgKiAgIHRoZSBgcmVwbGFjZUZuYCBpbi5cblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0cmVwbGFjZSA6IGZ1bmN0aW9uKCB0ZXh0LCByZXBsYWNlRm4sIGNvbnRleHRPYmogKSB7XG5cdFx0dmFyIG1lID0gdGhpczsgIC8vIGZvciBjbG9zdXJlXG5cblx0XHRyZXR1cm4gdGV4dC5yZXBsYWNlKCB0aGlzLm1hdGNoZXJSZWdleCwgZnVuY3Rpb24oIG1hdGNoU3RyLyosICQxLCAkMiwgJDMsICQ0LCAkNSwgJDYsICQ3LCAkOCwgJDksICQxMCwgJDExLCAkMTIsICQxMywgJDE0LCAkMTUqLyApIHtcblx0XHRcdHZhciBtYXRjaERlc2NPYmogPSBtZS5wcm9jZXNzQ2FuZGlkYXRlTWF0Y2guYXBwbHkoIG1lLCBhcmd1bWVudHMgKTsgIC8vIFwibWF0Y2ggZGVzY3JpcHRpb25cIiBvYmplY3RcblxuXHRcdFx0Ly8gUmV0dXJuIG91dCB3aXRoIG5vIGNoYW5nZXMgZm9yIG1hdGNoIHR5cGVzIHRoYXQgYXJlIGRpc2FibGVkICh1cmwsXG5cdFx0XHQvLyBlbWFpbCwgcGhvbmUsIGV0Yy4pLCBvciBmb3IgbWF0Y2hlcyB0aGF0IGFyZSBpbnZhbGlkIChmYWxzZVxuXHRcdFx0Ly8gcG9zaXRpdmVzIGZyb20gdGhlIG1hdGNoZXJSZWdleCwgd2hpY2ggY2FuJ3QgdXNlIGxvb2stYmVoaW5kc1xuXHRcdFx0Ly8gc2luY2UgdGhleSBhcmUgdW5hdmFpbGFibGUgaW4gSlMpLlxuXHRcdFx0aWYoICFtYXRjaERlc2NPYmogKSB7XG5cdFx0XHRcdHJldHVybiBtYXRjaFN0cjtcblxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0Ly8gR2VuZXJhdGUgcmVwbGFjZW1lbnQgdGV4dCBmb3IgdGhlIG1hdGNoIGZyb20gdGhlIGByZXBsYWNlRm5gXG5cdFx0XHRcdHZhciByZXBsYWNlU3RyID0gcmVwbGFjZUZuLmNhbGwoIGNvbnRleHRPYmosIG1hdGNoRGVzY09iai5tYXRjaCApO1xuXHRcdFx0XHRyZXR1cm4gbWF0Y2hEZXNjT2JqLnByZWZpeFN0ciArIHJlcGxhY2VTdHIgKyBtYXRjaERlc2NPYmouc3VmZml4U3RyO1xuXHRcdFx0fVxuXHRcdH0gKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBQcm9jZXNzZXMgYSBjYW5kaWRhdGUgbWF0Y2ggZnJvbSB0aGUge0BsaW5rICNtYXRjaGVyUmVnZXh9LlxuXHQgKlxuXHQgKiBOb3QgYWxsIG1hdGNoZXMgZm91bmQgYnkgdGhlIHJlZ2V4IGFyZSBhY3R1YWwgVVJML0VtYWlsL1Bob25lL1R3aXR0ZXIvSGFzaHRhZ1xuXHQgKiBtYXRjaGVzLCBhcyBkZXRlcm1pbmVkIGJ5IHRoZSB7QGxpbmsgI21hdGNoVmFsaWRhdG9yfS4gSW4gdGhpcyBjYXNlLCB0aGVcblx0ICogbWV0aG9kIHJldHVybnMgYG51bGxgLiBPdGhlcndpc2UsIGEgdmFsaWQgT2JqZWN0IHdpdGggYHByZWZpeFN0cmAsXG5cdCAqIGBtYXRjaGAsIGFuZCBgc3VmZml4U3RyYCBpcyByZXR1cm5lZC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IG1hdGNoU3RyIFRoZSBmdWxsIG1hdGNoIHRoYXQgd2FzIGZvdW5kIGJ5IHRoZVxuXHQgKiAgIHtAbGluayAjbWF0Y2hlclJlZ2V4fS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHR3aXR0ZXJNYXRjaCBUaGUgbWF0Y2hlZCB0ZXh0IG9mIGEgVHdpdHRlciBoYW5kbGUsIGlmIHRoZVxuXHQgKiAgIG1hdGNoIGlzIGEgVHdpdHRlciBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHR3aXR0ZXJIYW5kbGVQcmVmaXhXaGl0ZXNwYWNlQ2hhciBUaGUgd2hpdGVzcGFjZSBjaGFyXG5cdCAqICAgYmVmb3JlIHRoZSBAIHNpZ24gaW4gYSBUd2l0dGVyIGhhbmRsZSBtYXRjaC4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSBvZlxuXHQgKiAgIG5vIGxvb2tiZWhpbmRzIGluIEpTIHJlZ2V4ZXMsIGFuZCBpcyBuZWVkIHRvIHJlLWluY2x1ZGUgdGhlIGNoYXJhY3RlclxuXHQgKiAgIGZvciB0aGUgYW5jaG9yIHRhZyByZXBsYWNlbWVudC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHR3aXR0ZXJIYW5kbGUgVGhlIGFjdHVhbCBUd2l0dGVyIHVzZXIgKGkuZSB0aGUgd29yZCBhZnRlclxuXHQgKiAgIHRoZSBAIHNpZ24gaW4gYSBUd2l0dGVyIG1hdGNoKS5cblx0ICogQHBhcmFtIHtTdHJpbmd9IGVtYWlsQWRkcmVzc01hdGNoIFRoZSBtYXRjaGVkIGVtYWlsIGFkZHJlc3MgZm9yIGFuIGVtYWlsXG5cdCAqICAgYWRkcmVzcyBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHVybE1hdGNoIFRoZSBtYXRjaGVkIFVSTCBzdHJpbmcgZm9yIGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gc2NoZW1lVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoIHNvbWV0aGluZyBsaWtlXG5cdCAqICAgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWVcblx0ICogICBoYXMgYXQgbGVhc3Qgb25lICcuJyBpbiBpdC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHd3d01hdGNoIFRoZSBtYXRjaGVkIHN0cmluZyBvZiBhICd3d3cuJy1wcmVmaXhlZCBVUkwgdGhhdFxuXHQgKiAgIHdhcyBtYXRjaGVkLiBUaGlzIGlzIG9ubHkgbWF0Y2hlZCBpZiB0aGUgJ3d3dy4nIHRleHQgd2FzIG5vdCBwcmVmaXhlZFxuXHQgKiAgIGJ5IGEgc2NoZW1lIChpLmUuOiBub3QgcHJlZml4ZWQgYnkgJ2h0dHA6Ly8nLCAnZnRwOicsIGV0Yy4pLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gd3d3UHJvdG9jb2xSZWxhdGl2ZU1hdGNoIFRoZSAnLy8nIGZvciBhIHByb3RvY29sLXJlbGF0aXZlXG5cdCAqICAgbWF0Y2ggZnJvbSBhICd3d3cnIHVybCwgd2l0aCB0aGUgY2hhcmFjdGVyIHRoYXQgY29tZXMgYmVmb3JlIHRoZSAnLy8nLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gdGxkTWF0Y2ggVGhlIG1hdGNoZWQgc3RyaW5nIG9mIGEga25vd24gVExEICh0b3AgbGV2ZWxcblx0ICogICBkb21haW4pLCB3aGVuIGEgc2NoZW1lIG9yICd3d3cuJy1wcmVmaXhlZCBkb21haW4gaXMgbm90IG1hdGNoZWQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0bGRQcm90b2NvbFJlbGF0aXZlTWF0Y2ggVGhlICcvLycgZm9yIGEgcHJvdG9jb2wtcmVsYXRpdmVcblx0ICogICBtYXRjaCBmcm9tIGEgVExEICh0b3AgbGV2ZWwgZG9tYWluKSBtYXRjaCwgd2l0aCB0aGUgY2hhcmFjdGVyIHRoYXRcblx0ICogICBjb21lcyBiZWZvcmUgdGhlICcvLycuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBwaG9uZU1hdGNoIFRoZSBtYXRjaGVkIHRleHQgb2YgYSBwaG9uZSBudW1iZXJcblx0ICogQHBhcmFtIHtTdHJpbmd9IHBob25lUGx1c1NpZ25NYXRjaCBUaGUgJysnIHNpZ24gaW4gdGhlIHBob25lIG51bWJlciwgaWZcblx0ICogICBpdCB3YXMgdGhlcmUuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBoYXNodGFnTWF0Y2ggVGhlIG1hdGNoZWQgdGV4dCBvZiBhIFR3aXR0ZXJcblx0ICogICBIYXNodGFnLCBpZiB0aGUgbWF0Y2ggaXMgYSBIYXNodGFnIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gaGFzaHRhZ1ByZWZpeFdoaXRlc3BhY2VDaGFyIFRoZSB3aGl0ZXNwYWNlIGNoYXJcblx0ICogICBiZWZvcmUgdGhlICMgc2lnbiBpbiBhIEhhc2h0YWcgbWF0Y2guIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugb2Ygbm9cblx0ICogICBsb29rYmVoaW5kcyBpbiBKUyByZWdleGVzLCBhbmQgaXMgbmVlZCB0byByZS1pbmNsdWRlIHRoZSBjaGFyYWN0ZXIgZm9yXG5cdCAqICAgdGhlIGFuY2hvciB0YWcgcmVwbGFjZW1lbnQuXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBoYXNodGFnIFRoZSBhY3R1YWwgSGFzaHRhZyAoaS5lIHRoZSB3b3JkXG5cdCAqICAgYWZ0ZXIgdGhlICMgc2lnbiBpbiBhIEhhc2h0YWcgbWF0Y2gpLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtPYmplY3R9IEEgXCJtYXRjaCBkZXNjcmlwdGlvbiBvYmplY3RcIi4gVGhpcyB3aWxsIGJlIGBudWxsYCBpZiB0aGVcblx0ICogICBtYXRjaCB3YXMgaW52YWxpZCwgb3IgaWYgYSBtYXRjaCB0eXBlIGlzIGRpc2FibGVkLiBPdGhlcndpc2UsIHRoaXMgd2lsbFxuXHQgKiAgIGJlIGFuIE9iamVjdCAobWFwKSB3aXRoIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcblx0ICogQHJldHVybiB7U3RyaW5nfSByZXR1cm4ucHJlZml4U3RyIFRoZSBjaGFyKHMpIHRoYXQgc2hvdWxkIGJlIHByZXBlbmRlZCB0b1xuXHQgKiAgIHRoZSByZXBsYWNlbWVudCBzdHJpbmcuIFRoZXNlIGFyZSBjaGFyKHMpIHRoYXQgd2VyZSBuZWVkZWQgdG8gYmVcblx0ICogICBpbmNsdWRlZCBmcm9tIHRoZSByZWdleCBtYXRjaCB0aGF0IHdlcmUgaWdub3JlZCBieSBwcm9jZXNzaW5nIGNvZGUsIGFuZFxuXHQgKiAgIHNob3VsZCBiZSByZS1pbnNlcnRlZCBpbnRvIHRoZSByZXBsYWNlbWVudCBzdHJlYW0uXG5cdCAqIEByZXR1cm4ge1N0cmluZ30gcmV0dXJuLnN1ZmZpeFN0ciBUaGUgY2hhcihzKSB0aGF0IHNob3VsZCBiZSBhcHBlbmRlZCB0b1xuXHQgKiAgIHRoZSByZXBsYWNlbWVudCBzdHJpbmcuIFRoZXNlIGFyZSBjaGFyKHMpIHRoYXQgd2VyZSBuZWVkZWQgdG8gYmVcblx0ICogICBpbmNsdWRlZCBmcm9tIHRoZSByZWdleCBtYXRjaCB0aGF0IHdlcmUgaWdub3JlZCBieSBwcm9jZXNzaW5nIGNvZGUsIGFuZFxuXHQgKiAgIHNob3VsZCBiZSByZS1pbnNlcnRlZCBpbnRvIHRoZSByZXBsYWNlbWVudCBzdHJlYW0uXG5cdCAqIEByZXR1cm4ge0F1dG9saW5rZXIubWF0Y2guTWF0Y2h9IHJldHVybi5tYXRjaCBUaGUgTWF0Y2ggb2JqZWN0IHRoYXRcblx0ICogICByZXByZXNlbnRzIHRoZSBtYXRjaCB0aGF0IHdhcyBmb3VuZC5cblx0ICovXG5cdHByb2Nlc3NDYW5kaWRhdGVNYXRjaCA6IGZ1bmN0aW9uKFxuXHRcdG1hdGNoU3RyLCB0d2l0dGVyTWF0Y2gsIHR3aXR0ZXJIYW5kbGVQcmVmaXhXaGl0ZXNwYWNlQ2hhciwgdHdpdHRlckhhbmRsZSxcblx0XHRlbWFpbEFkZHJlc3NNYXRjaCwgdXJsTWF0Y2gsIHNjaGVtZVVybE1hdGNoLCB3d3dNYXRjaCwgd3d3UHJvdG9jb2xSZWxhdGl2ZU1hdGNoLFxuXHRcdHRsZE1hdGNoLCB0bGRQcm90b2NvbFJlbGF0aXZlTWF0Y2gsIHBob25lTWF0Y2gsIHBob25lUGx1c1NpZ25NYXRjaCwgaGFzaHRhZ01hdGNoLFxuXHRcdGhhc2h0YWdQcmVmaXhXaGl0ZXNwYWNlQ2hhciwgaGFzaHRhZ1xuXHQpIHtcblx0XHQvLyBOb3RlOiBUaGUgYG1hdGNoU3RyYCB2YXJpYWJsZSB3aWwgYmUgZml4ZWQgdXAgdG8gcmVtb3ZlIGNoYXJhY3RlcnMgdGhhdCBhcmUgbm8gbG9uZ2VyIG5lZWRlZCAod2hpY2ggd2lsbFxuXHRcdC8vIGJlIGFkZGVkIHRvIGBwcmVmaXhTdHJgIGFuZCBgc3VmZml4U3RyYCkuXG5cblx0XHR2YXIgcHJvdG9jb2xSZWxhdGl2ZU1hdGNoID0gd3d3UHJvdG9jb2xSZWxhdGl2ZU1hdGNoIHx8IHRsZFByb3RvY29sUmVsYXRpdmVNYXRjaCxcblx0XHQgICAgbWF0Y2gsICAvLyBXaWxsIGJlIGFuIEF1dG9saW5rZXIubWF0Y2guTWF0Y2ggb2JqZWN0XG5cblx0XHQgICAgcHJlZml4U3RyID0gXCJcIiwgIC8vIEEgc3RyaW5nIHRvIHVzZSB0byBwcmVmaXggdGhlIGFuY2hvciB0YWcgdGhhdCBpcyBjcmVhdGVkLiBUaGlzIGlzIG5lZWRlZCBmb3IgdGhlIFR3aXR0ZXIgYW5kIEhhc2h0YWcgbWF0Y2hlcy5cblx0XHQgICAgc3VmZml4U3RyID0gXCJcIiwgIC8vIEEgc3RyaW5nIHRvIHN1ZmZpeCB0aGUgYW5jaG9yIHRhZyB0aGF0IGlzIGNyZWF0ZWQuIFRoaXMgaXMgdXNlZCBpZiB0aGVyZSBpcyBhIHRyYWlsaW5nIHBhcmVudGhlc2lzIHRoYXQgc2hvdWxkIG5vdCBiZSBhdXRvLWxpbmtlZC5cblxuXHRcdCAgICB1cmxzID0gdGhpcy51cmxzOyAgLy8gdGhlICd1cmxzJyBjb25maWdcblxuXHRcdC8vIFJldHVybiBvdXQgd2l0aCBgbnVsbGAgZm9yIG1hdGNoIHR5cGVzIHRoYXQgYXJlIGRpc2FibGVkICh1cmwsIGVtYWlsLFxuXHRcdC8vIHR3aXR0ZXIsIGhhc2h0YWcpLCBvciBmb3IgbWF0Y2hlcyB0aGF0IGFyZSBpbnZhbGlkIChmYWxzZSBwb3NpdGl2ZXNcblx0XHQvLyBmcm9tIHRoZSBtYXRjaGVyUmVnZXgsIHdoaWNoIGNhbid0IHVzZSBsb29rLWJlaGluZHMgc2luY2UgdGhleSBhcmVcblx0XHQvLyB1bmF2YWlsYWJsZSBpbiBKUykuXG5cdFx0aWYoXG5cdFx0XHQoIHNjaGVtZVVybE1hdGNoICYmICF1cmxzLnNjaGVtZU1hdGNoZXMgKSB8fFxuXHRcdFx0KCB3d3dNYXRjaCAmJiAhdXJscy53d3dNYXRjaGVzICkgfHxcblx0XHRcdCggdGxkTWF0Y2ggJiYgIXVybHMudGxkTWF0Y2hlcyApIHx8XG5cdFx0XHQoIGVtYWlsQWRkcmVzc01hdGNoICYmICF0aGlzLmVtYWlsICkgfHxcblx0XHRcdCggcGhvbmVNYXRjaCAmJiAhdGhpcy5waG9uZSApIHx8XG5cdFx0XHQoIHR3aXR0ZXJNYXRjaCAmJiAhdGhpcy50d2l0dGVyICkgfHxcblx0XHRcdCggaGFzaHRhZ01hdGNoICYmICF0aGlzLmhhc2h0YWcgKSB8fFxuXHRcdFx0IXRoaXMubWF0Y2hWYWxpZGF0b3IuaXNWYWxpZE1hdGNoKCB1cmxNYXRjaCwgc2NoZW1lVXJsTWF0Y2gsIHByb3RvY29sUmVsYXRpdmVNYXRjaCApXG5cdFx0KSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cblx0XHQvLyBIYW5kbGUgYSBjbG9zaW5nIHBhcmVudGhlc2lzIGF0IHRoZSBlbmQgb2YgdGhlIG1hdGNoLCBhbmQgZXhjbHVkZSBpdFxuXHRcdC8vIGlmIHRoZXJlIGlzIG5vdCBhIG1hdGNoaW5nIG9wZW4gcGFyZW50aGVzaXNcblx0XHQvLyBpbiB0aGUgbWF0Y2ggaXRzZWxmLlxuXHRcdGlmKCB0aGlzLm1hdGNoSGFzVW5iYWxhbmNlZENsb3NpbmdQYXJlbiggbWF0Y2hTdHIgKSApIHtcblx0XHRcdG1hdGNoU3RyID0gbWF0Y2hTdHIuc3Vic3RyKCAwLCBtYXRjaFN0ci5sZW5ndGggLSAxICk7ICAvLyByZW1vdmUgdGhlIHRyYWlsaW5nIFwiKVwiXG5cdFx0XHRzdWZmaXhTdHIgPSBcIilcIjsgIC8vIHRoaXMgd2lsbCBiZSBhZGRlZCBhZnRlciB0aGUgZ2VuZXJhdGVkIDxhPiB0YWdcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gSGFuZGxlIGFuIGludmFsaWQgY2hhcmFjdGVyIGFmdGVyIHRoZSBUTERcblx0XHRcdHZhciBwb3MgPSB0aGlzLm1hdGNoSGFzSW52YWxpZENoYXJBZnRlclRsZCggdXJsTWF0Y2gsIHNjaGVtZVVybE1hdGNoICk7XG5cdFx0XHRpZiggcG9zID4gLTEgKSB7XG5cdFx0XHRcdHN1ZmZpeFN0ciA9IG1hdGNoU3RyLnN1YnN0cihwb3MpOyAgLy8gdGhpcyB3aWxsIGJlIGFkZGVkIGFmdGVyIHRoZSBnZW5lcmF0ZWQgPGE+IHRhZ1xuXHRcdFx0XHRtYXRjaFN0ciA9IG1hdGNoU3RyLnN1YnN0ciggMCwgcG9zICk7IC8vIHJlbW92ZSB0aGUgdHJhaWxpbmcgaW52YWxpZCBjaGFyc1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGlmKCBlbWFpbEFkZHJlc3NNYXRjaCApIHtcblx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guRW1haWwoIHsgbWF0Y2hlZFRleHQ6IG1hdGNoU3RyLCBlbWFpbDogZW1haWxBZGRyZXNzTWF0Y2ggfSApO1xuXG5cdFx0fSBlbHNlIGlmKCB0d2l0dGVyTWF0Y2ggKSB7XG5cdFx0XHQvLyBmaXggdXAgdGhlIGBtYXRjaFN0cmAgaWYgdGhlcmUgd2FzIGEgcHJlY2VkaW5nIHdoaXRlc3BhY2UgY2hhcixcblx0XHRcdC8vIHdoaWNoIHdhcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHRoZSBtYXRjaCBpdHNlbGYgKHNpbmNlIHRoZXJlIGFyZVxuXHRcdFx0Ly8gbm8gbG9vay1iZWhpbmRzIGluIEpTIHJlZ2V4ZXMpXG5cdFx0XHRpZiggdHdpdHRlckhhbmRsZVByZWZpeFdoaXRlc3BhY2VDaGFyICkge1xuXHRcdFx0XHRwcmVmaXhTdHIgPSB0d2l0dGVySGFuZGxlUHJlZml4V2hpdGVzcGFjZUNoYXI7XG5cdFx0XHRcdG1hdGNoU3RyID0gbWF0Y2hTdHIuc2xpY2UoIDEgKTsgIC8vIHJlbW92ZSB0aGUgcHJlZml4ZWQgd2hpdGVzcGFjZSBjaGFyIGZyb20gdGhlIG1hdGNoXG5cdFx0XHR9XG5cdFx0XHRtYXRjaCA9IG5ldyBBdXRvbGlua2VyLm1hdGNoLlR3aXR0ZXIoIHsgbWF0Y2hlZFRleHQ6IG1hdGNoU3RyLCB0d2l0dGVySGFuZGxlOiB0d2l0dGVySGFuZGxlIH0gKTtcblxuXHRcdH0gZWxzZSBpZiggcGhvbmVNYXRjaCApIHtcblx0XHRcdC8vIHJlbW92ZSBub24tbnVtZXJpYyB2YWx1ZXMgZnJvbSBwaG9uZSBudW1iZXIgc3RyaW5nXG5cdFx0XHR2YXIgY2xlYW5OdW1iZXIgPSBtYXRjaFN0ci5yZXBsYWNlKCAvXFxEL2csICcnICk7XG4gXHRcdFx0bWF0Y2ggPSBuZXcgQXV0b2xpbmtlci5tYXRjaC5QaG9uZSggeyBtYXRjaGVkVGV4dDogbWF0Y2hTdHIsIG51bWJlcjogY2xlYW5OdW1iZXIsIHBsdXNTaWduOiAhIXBob25lUGx1c1NpZ25NYXRjaCB9ICk7XG5cblx0XHR9IGVsc2UgaWYoIGhhc2h0YWdNYXRjaCApIHtcblx0XHRcdC8vIGZpeCB1cCB0aGUgYG1hdGNoU3RyYCBpZiB0aGVyZSB3YXMgYSBwcmVjZWRpbmcgd2hpdGVzcGFjZSBjaGFyLFxuXHRcdFx0Ly8gd2hpY2ggd2FzIG5lZWRlZCB0byBkZXRlcm1pbmUgdGhlIG1hdGNoIGl0c2VsZiAoc2luY2UgdGhlcmUgYXJlXG5cdFx0XHQvLyBubyBsb29rLWJlaGluZHMgaW4gSlMgcmVnZXhlcylcblx0XHRcdGlmKCBoYXNodGFnUHJlZml4V2hpdGVzcGFjZUNoYXIgKSB7XG5cdFx0XHRcdHByZWZpeFN0ciA9IGhhc2h0YWdQcmVmaXhXaGl0ZXNwYWNlQ2hhcjtcblx0XHRcdFx0bWF0Y2hTdHIgPSBtYXRjaFN0ci5zbGljZSggMSApOyAgLy8gcmVtb3ZlIHRoZSBwcmVmaXhlZCB3aGl0ZXNwYWNlIGNoYXIgZnJvbSB0aGUgbWF0Y2hcblx0XHRcdH1cblx0XHRcdG1hdGNoID0gbmV3IEF1dG9saW5rZXIubWF0Y2guSGFzaHRhZyggeyBtYXRjaGVkVGV4dDogbWF0Y2hTdHIsIHNlcnZpY2VOYW1lOiB0aGlzLmhhc2h0YWcsIGhhc2h0YWc6IGhhc2h0YWcgfSApO1xuXG5cdFx0fSBlbHNlIHsgIC8vIHVybCBtYXRjaFxuXHRcdFx0Ly8gSWYgaXQncyBhIHByb3RvY29sLXJlbGF0aXZlICcvLycgbWF0Y2gsIHJlbW92ZSB0aGUgY2hhcmFjdGVyXG5cdFx0XHQvLyBiZWZvcmUgdGhlICcvLycgKHdoaWNoIHRoZSBtYXRjaGVyUmVnZXggbmVlZGVkIHRvIG1hdGNoIGR1ZSB0b1xuXHRcdFx0Ly8gdGhlIGxhY2sgb2YgYSBuZWdhdGl2ZSBsb29rLWJlaGluZCBpbiBKYXZhU2NyaXB0IHJlZ3VsYXJcblx0XHRcdC8vIGV4cHJlc3Npb25zKVxuXHRcdFx0aWYoIHByb3RvY29sUmVsYXRpdmVNYXRjaCApIHtcblx0XHRcdFx0dmFyIGNoYXJCZWZvcmVNYXRjaCA9IHByb3RvY29sUmVsYXRpdmVNYXRjaC5tYXRjaCggdGhpcy5jaGFyQmVmb3JlUHJvdG9jb2xSZWxNYXRjaFJlZ2V4IClbIDEgXSB8fCBcIlwiO1xuXG5cdFx0XHRcdGlmKCBjaGFyQmVmb3JlTWF0Y2ggKSB7ICAvLyBmaXggdXAgdGhlIGBtYXRjaFN0cmAgaWYgdGhlcmUgd2FzIGEgcHJlY2VkaW5nIGNoYXIgYmVmb3JlIGEgcHJvdG9jb2wtcmVsYXRpdmUgbWF0Y2gsIHdoaWNoIHdhcyBuZWVkZWQgdG8gZGV0ZXJtaW5lIHRoZSBtYXRjaCBpdHNlbGYgKHNpbmNlIHRoZXJlIGFyZSBubyBsb29rLWJlaGluZHMgaW4gSlMgcmVnZXhlcylcblx0XHRcdFx0XHRwcmVmaXhTdHIgPSBjaGFyQmVmb3JlTWF0Y2g7XG5cdFx0XHRcdFx0bWF0Y2hTdHIgPSBtYXRjaFN0ci5zbGljZSggMSApOyAgLy8gcmVtb3ZlIHRoZSBwcmVmaXhlZCBjaGFyIGZyb20gdGhlIG1hdGNoXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0bWF0Y2ggPSBuZXcgQXV0b2xpbmtlci5tYXRjaC5VcmwoIHtcblx0XHRcdFx0bWF0Y2hlZFRleHQgOiBtYXRjaFN0cixcblx0XHRcdFx0dXJsIDogbWF0Y2hTdHIsXG5cdFx0XHRcdHByb3RvY29sVXJsTWF0Y2ggOiAhIXNjaGVtZVVybE1hdGNoLFxuXHRcdFx0XHRwcm90b2NvbFJlbGF0aXZlTWF0Y2ggOiAhIXByb3RvY29sUmVsYXRpdmVNYXRjaCxcblx0XHRcdFx0c3RyaXBQcmVmaXggOiB0aGlzLnN0cmlwUHJlZml4XG5cdFx0XHR9ICk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHtcblx0XHRcdHByZWZpeFN0ciA6IHByZWZpeFN0cixcblx0XHRcdHN1ZmZpeFN0ciA6IHN1ZmZpeFN0cixcblx0XHRcdG1hdGNoICAgICA6IG1hdGNoXG5cdFx0fTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgbWF0Y2ggZm91bmQgaGFzIGFuIHVubWF0Y2hlZCBjbG9zaW5nIHBhcmVudGhlc2lzLiBJZiBzbyxcblx0ICogdGhpcyBwYXJlbnRoZXNpcyB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgbWF0Y2ggaXRzZWxmLCBhbmQgYXBwZW5kZWRcblx0ICogYWZ0ZXIgdGhlIGdlbmVyYXRlZCBhbmNob3IgdGFnIGluIHtAbGluayAjcHJvY2Vzc0NhbmRpZGF0ZU1hdGNofS5cblx0ICpcblx0ICogQSBtYXRjaCBtYXkgaGF2ZSBhbiBleHRyYSBjbG9zaW5nIHBhcmVudGhlc2lzIGF0IHRoZSBlbmQgb2YgdGhlIG1hdGNoXG5cdCAqIGJlY2F1c2UgdGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiBtdXN0IGluY2x1ZGUgcGFyZW50aGVzaXMgZm9yIFVSTHMgc3VjaCBhc1xuXHQgKiBcIndpa2lwZWRpYS5jb20vc29tZXRoaW5nXyhkaXNhbWJpZ3VhdGlvbilcIiwgd2hpY2ggc2hvdWxkIGJlIGF1dG8tbGlua2VkLlxuXHQgKlxuXHQgKiBIb3dldmVyLCBhbiBleHRyYSBwYXJlbnRoZXNpcyAqd2lsbCogYmUgaW5jbHVkZWQgd2hlbiB0aGUgVVJMIGl0c2VsZiBpc1xuXHQgKiB3cmFwcGVkIGluIHBhcmVudGhlc2lzLCBzdWNoIGFzIGluIHRoZSBjYXNlIG9mIFwiKHdpa2lwZWRpYS5jb20vc29tZXRoaW5nXyhkaXNhbWJpZ3VhdGlvbikpXCIuXG5cdCAqIEluIHRoaXMgY2FzZSwgdGhlIGxhc3QgY2xvc2luZyBwYXJlbnRoZXNpcyBzaG91bGQgKm5vdCogYmUgcGFydCBvZiB0aGVcblx0ICogVVJMIGl0c2VsZiwgYW5kIHRoaXMgbWV0aG9kIHdpbGwgcmV0dXJuIGB0cnVlYC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IG1hdGNoU3RyIFRoZSBmdWxsIG1hdGNoIHN0cmluZyBmcm9tIHRoZSB7QGxpbmsgI21hdGNoZXJSZWdleH0uXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGVyZSBpcyBhbiB1bmJhbGFuY2VkIGNsb3NpbmcgcGFyZW50aGVzaXMgYXRcblx0ICogICB0aGUgZW5kIG9mIHRoZSBgbWF0Y2hTdHJgLCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdG1hdGNoSGFzVW5iYWxhbmNlZENsb3NpbmdQYXJlbiA6IGZ1bmN0aW9uKCBtYXRjaFN0ciApIHtcblx0XHR2YXIgbGFzdENoYXIgPSBtYXRjaFN0ci5jaGFyQXQoIG1hdGNoU3RyLmxlbmd0aCAtIDEgKTtcblxuXHRcdGlmKCBsYXN0Q2hhciA9PT0gJyknICkge1xuXHRcdFx0dmFyIG9wZW5QYXJlbnNNYXRjaCA9IG1hdGNoU3RyLm1hdGNoKCAvXFwoL2cgKSxcblx0XHRcdCAgICBjbG9zZVBhcmVuc01hdGNoID0gbWF0Y2hTdHIubWF0Y2goIC9cXCkvZyApLFxuXHRcdFx0ICAgIG51bU9wZW5QYXJlbnMgPSAoIG9wZW5QYXJlbnNNYXRjaCAmJiBvcGVuUGFyZW5zTWF0Y2gubGVuZ3RoICkgfHwgMCxcblx0XHRcdCAgICBudW1DbG9zZVBhcmVucyA9ICggY2xvc2VQYXJlbnNNYXRjaCAmJiBjbG9zZVBhcmVuc01hdGNoLmxlbmd0aCApIHx8IDA7XG5cblx0XHRcdGlmKCBudW1PcGVuUGFyZW5zIDwgbnVtQ2xvc2VQYXJlbnMgKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgaWYgdGhlcmUncyBhbiBpbnZhbGlkIGNoYXJhY3RlciBhZnRlciB0aGUgVExEIGluIGEgVVJMLiBWYWxpZFxuXHQgKiBjaGFyYWN0ZXJzIGFmdGVyIFRMRCBhcmUgJzovPyMnLiBFeGNsdWRlIHByb3RvY29sIG1hdGNoZWQgVVJMcyBmcm9tIHRoaXNcblx0ICogY2hlY2suXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwsIGlmIHRoZXJlIHdhcyBvbmUuIFdpbGwgYmUgYW5cblx0ICogICBlbXB0eSBzdHJpbmcgaWYgdGhlIG1hdGNoIGlzIG5vdCBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoIHNvbWV0aGluZyBsaWtlXG5cdCAqICAgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWVcblx0ICogICBoYXMgYXQgbGVhc3Qgb25lICcuJyBpbiBpdC5cblx0ICogQHJldHVybiB7TnVtYmVyfSB0aGUgcG9zaXRpb24gd2hlcmUgdGhlIGludmFsaWQgY2hhcmFjdGVyIHdhcyBmb3VuZC4gSWZcblx0ICogICBubyBzdWNoIGNoYXJhY3RlciB3YXMgZm91bmQsIHJldHVybnMgLTFcblx0ICovXG5cdG1hdGNoSGFzSW52YWxpZENoYXJBZnRlclRsZCA6IGZ1bmN0aW9uKCB1cmxNYXRjaCwgcHJvdG9jb2xVcmxNYXRjaCApIHtcblx0XHRpZiAoICF1cmxNYXRjaCApIHtcblx0XHRcdHJldHVybiAtMTtcblx0XHR9XG5cblx0XHR2YXIgb2Zmc2V0ID0gMDtcblx0XHRpZiAoIHByb3RvY29sVXJsTWF0Y2ggKSB7XG5cdFx0XHRvZmZzZXQgPSB1cmxNYXRjaC5pbmRleE9mKCc6Jyk7XG5cdFx0XHR1cmxNYXRjaCA9IHVybE1hdGNoLnNsaWNlKG9mZnNldCk7XG5cdFx0fVxuXG5cdFx0dmFyIHJlID0gL14oKC4/XFwvXFwvKT9bQS1aYS16MC05XFwuXFwtXSpbQS1aYS16MC05XFwtXVxcLltBLVphLXpdKykvO1xuXHRcdHZhciByZXMgPSByZS5leGVjKCB1cmxNYXRjaCApO1xuXHRcdGlmICggcmVzID09PSBudWxsICkge1xuXHRcdFx0cmV0dXJuIC0xO1xuXHRcdH1cblxuXHRcdG9mZnNldCArPSByZXNbMV0ubGVuZ3RoO1xuXHRcdHVybE1hdGNoID0gdXJsTWF0Y2guc2xpY2UocmVzWzFdLmxlbmd0aCk7XG5cdFx0aWYgKC9eW14uQS1aYS16OlxcLz8jXS8udGVzdCh1cmxNYXRjaCkpIHtcblx0XHRcdHJldHVybiBvZmZzZXQ7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cbn0gKTtcblxuLypnbG9iYWwgQXV0b2xpbmtlciAqL1xuLypqc2hpbnQgc2NyaXB0dXJsOnRydWUgKi9cbi8qKlxuICogQHByaXZhdGVcbiAqIEBjbGFzcyBBdXRvbGlua2VyLk1hdGNoVmFsaWRhdG9yXG4gKiBAZXh0ZW5kcyBPYmplY3RcbiAqXG4gKiBVc2VkIGJ5IEF1dG9saW5rZXIgdG8gZmlsdGVyIG91dCBmYWxzZSBwb3NpdGl2ZXMgZnJvbSB0aGVcbiAqIHtAbGluayBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyI21hdGNoZXJSZWdleH0uXG4gKlxuICogRHVlIHRvIHRoZSBsaW1pdGF0aW9ucyBvZiByZWd1bGFyIGV4cHJlc3Npb25zIChpbmNsdWRpbmcgdGhlIG1pc3NpbmcgZmVhdHVyZVxuICogb2YgbG9vay1iZWhpbmRzIGluIEpTIHJlZ3VsYXIgZXhwcmVzc2lvbnMpLCB3ZSBjYW5ub3QgYWx3YXlzIGRldGVybWluZSB0aGVcbiAqIHZhbGlkaXR5IG9mIGEgZ2l2ZW4gbWF0Y2guIFRoaXMgY2xhc3MgYXBwbGllcyBhIGJpdCBvZiBhZGRpdGlvbmFsIGxvZ2ljIHRvXG4gKiBmaWx0ZXIgb3V0IGFueSBmYWxzZSBwb3NpdGl2ZXMgdGhhdCBoYXZlIGJlZW4gbWF0Y2hlZCBieSB0aGVcbiAqIHtAbGluayBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyI21hdGNoZXJSZWdleH0uXG4gKi9cbkF1dG9saW5rZXIuTWF0Y2hWYWxpZGF0b3IgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IGludmFsaWRQcm90b2NvbFJlbE1hdGNoUmVnZXhcblx0ICpcblx0ICogVGhlIHJlZ3VsYXIgZXhwcmVzc2lvbiB1c2VkIHRvIGNoZWNrIGEgcG90ZW50aWFsIHByb3RvY29sLXJlbGF0aXZlIFVSTFxuXHQgKiBtYXRjaCwgY29taW5nIGZyb20gdGhlIHtAbGluayBBdXRvbGlua2VyLm1hdGNoUGFyc2VyLk1hdGNoUGFyc2VyI21hdGNoZXJSZWdleH0uXG5cdCAqIEEgcHJvdG9jb2wtcmVsYXRpdmUgVVJMIGlzLCBmb3IgZXhhbXBsZSwgXCIvL3lhaG9vLmNvbVwiXG5cdCAqXG5cdCAqIFRoaXMgcmVndWxhciBleHByZXNzaW9uIGNoZWNrcyB0byBzZWUgaWYgdGhlcmUgaXMgYSB3b3JkIGNoYXJhY3RlciBiZWZvcmVcblx0ICogdGhlICcvLycgbWF0Y2ggaW4gb3JkZXIgdG8gZGV0ZXJtaW5lIGlmIHdlIHNob3VsZCBhY3R1YWxseSBhdXRvbGluayBhXG5cdCAqIHByb3RvY29sLXJlbGF0aXZlIFVSTC4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWdhdGl2ZVxuXHQgKiBsb29rLWJlaGluZCBpbiBKYXZhU2NyaXB0IHJlZ3VsYXIgZXhwcmVzc2lvbnMuXG5cdCAqXG5cdCAqIEZvciBpbnN0YW5jZSwgd2Ugd2FudCB0byBhdXRvbGluayBzb21ldGhpbmcgbGlrZSBcIkdvIHRvOiAvL2dvb2dsZS5jb21cIixcblx0ICogYnV0IHdlIGRvbid0IHdhbnQgdG8gYXV0b2xpbmsgc29tZXRoaW5nIGxpa2UgXCJhYmMvL2dvb2dsZS5jb21cIlxuXHQgKi9cblx0aW52YWxpZFByb3RvY29sUmVsTWF0Y2hSZWdleCA6IC9eW1xcd11cXC9cXC8vLFxuXG5cdC8qKlxuXHQgKiBSZWdleCB0byB0ZXN0IGZvciBhIGZ1bGwgcHJvdG9jb2wsIHdpdGggdGhlIHR3byB0cmFpbGluZyBzbGFzaGVzLiBFeDogJ2h0dHA6Ly8nXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBoYXNGdWxsUHJvdG9jb2xSZWdleFxuXHQgKi9cblx0aGFzRnVsbFByb3RvY29sUmVnZXggOiAvXltBLVphLXpdWy0uK0EtWmEtejAtOV0qOlxcL1xcLy8sXG5cblx0LyoqXG5cdCAqIFJlZ2V4IHRvIGZpbmQgdGhlIFVSSSBzY2hlbWUsIHN1Y2ggYXMgJ21haWx0bzonLlxuXHQgKlxuXHQgKiBUaGlzIGlzIHVzZWQgdG8gZmlsdGVyIG91dCAnamF2YXNjcmlwdDonIGFuZCAndmJzY3JpcHQ6JyBzY2hlbWVzLlxuXHQgKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gdXJpU2NoZW1lUmVnZXhcblx0ICovXG5cdHVyaVNjaGVtZVJlZ2V4IDogL15bQS1aYS16XVstLitBLVphLXowLTldKjovLFxuXG5cdC8qKlxuXHQgKiBSZWdleCB0byBkZXRlcm1pbmUgaWYgYXQgbGVhc3Qgb25lIHdvcmQgY2hhciBleGlzdHMgYWZ0ZXIgdGhlIHByb3RvY29sIChpLmUuIGFmdGVyIHRoZSAnOicpXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwcm9wZXJ0eSB7UmVnRXhwfSBoYXNXb3JkQ2hhckFmdGVyUHJvdG9jb2xSZWdleFxuXHQgKi9cblx0aGFzV29yZENoYXJBZnRlclByb3RvY29sUmVnZXggOiAvOlteXFxzXSo/W0EtWmEtel0vLFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgYSBnaXZlbiBtYXRjaCBmb3VuZCBieSB0aGUge0BsaW5rIEF1dG9saW5rZXIubWF0Y2hQYXJzZXIuTWF0Y2hQYXJzZXJ9XG5cdCAqIGlzIHZhbGlkLiBXaWxsIHJldHVybiBgZmFsc2VgIGZvcjpcblx0ICpcblx0ICogMSkgVVJMIG1hdGNoZXMgd2hpY2ggZG8gbm90IGhhdmUgYXQgbGVhc3QgaGF2ZSBvbmUgcGVyaW9kICgnLicpIGluIHRoZVxuXHQgKiAgICBkb21haW4gbmFtZSAoZWZmZWN0aXZlbHkgc2tpcHBpbmcgb3ZlciBtYXRjaGVzIGxpa2UgXCJhYmM6ZGVmXCIpLlxuXHQgKiAgICBIb3dldmVyLCBVUkwgbWF0Y2hlcyB3aXRoIGEgcHJvdG9jb2wgd2lsbCBiZSBhbGxvd2VkIChleDogJ2h0dHA6Ly9sb2NhbGhvc3QnKVxuXHQgKiAyKSBVUkwgbWF0Y2hlcyB3aGljaCBkbyBub3QgaGF2ZSBhdCBsZWFzdCBvbmUgd29yZCBjaGFyYWN0ZXIgaW4gdGhlXG5cdCAqICAgIGRvbWFpbiBuYW1lIChlZmZlY3RpdmVseSBza2lwcGluZyBvdmVyIG1hdGNoZXMgbGlrZSBcImdpdDoxLjBcIikuXG5cdCAqIDMpIEEgcHJvdG9jb2wtcmVsYXRpdmUgdXJsIG1hdGNoIChhIFVSTCBiZWdpbm5pbmcgd2l0aCAnLy8nKSB3aG9zZVxuXHQgKiAgICBwcmV2aW91cyBjaGFyYWN0ZXIgaXMgYSB3b3JkIGNoYXJhY3RlciAoZWZmZWN0aXZlbHkgc2tpcHBpbmcgb3ZlclxuXHQgKiAgICBzdHJpbmdzIGxpa2UgXCJhYmMvL2dvb2dsZS5jb21cIilcblx0ICpcblx0ICogT3RoZXJ3aXNlLCByZXR1cm5zIGB0cnVlYC5cblx0ICpcblx0ICogQHBhcmFtIHtTdHJpbmd9IHVybE1hdGNoIFRoZSBtYXRjaGVkIFVSTCwgaWYgdGhlcmUgd2FzIG9uZS4gV2lsbCBiZSBhblxuXHQgKiAgIGVtcHR5IHN0cmluZyBpZiB0aGUgbWF0Y2ggaXMgbm90IGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbFxuXHQgKiAgIG1hdGNoLiBFeDogJ2h0dHA6Ly95YWhvby5jb20nLiBUaGlzIGlzIHVzZWQgdG8gbWF0Y2ggc29tZXRoaW5nIGxpa2Vcblx0ICogICAnaHR0cDovL2xvY2FsaG9zdCcsIHdoZXJlIHdlIHdvbid0IGRvdWJsZSBjaGVjayB0aGF0IHRoZSBkb21haW4gbmFtZVxuXHQgKiAgIGhhcyBhdCBsZWFzdCBvbmUgJy4nIGluIGl0LlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xSZWxhdGl2ZU1hdGNoIFRoZSBwcm90b2NvbC1yZWxhdGl2ZSBzdHJpbmcgZm9yIGFcblx0ICogICBVUkwgbWF0Y2ggKGkuZS4gJy8vJyksIHBvc3NpYmx5IHdpdGggYSBwcmVjZWRpbmcgY2hhcmFjdGVyIChleCwgYVxuXHQgKiAgIHNwYWNlLCBzdWNoIGFzOiAnIC8vJywgb3IgYSBsZXR0ZXIsIHN1Y2ggYXM6ICdhLy8nKS4gVGhlIG1hdGNoIGlzXG5cdCAqICAgaW52YWxpZCBpZiB0aGVyZSBpcyBhIHdvcmQgY2hhcmFjdGVyIHByZWNlZGluZyB0aGUgJy8vJy5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBtYXRjaCBnaXZlbiBpcyB2YWxpZCBhbmQgc2hvdWxkIGJlXG5cdCAqICAgcHJvY2Vzc2VkLCBvciBgZmFsc2VgIGlmIHRoZSBtYXRjaCBpcyBpbnZhbGlkIGFuZC9vciBzaG91bGQganVzdCBub3QgYmVcblx0ICogICBwcm9jZXNzZWQuXG5cdCAqL1xuXHRpc1ZhbGlkTWF0Y2ggOiBmdW5jdGlvbiggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2gsIHByb3RvY29sUmVsYXRpdmVNYXRjaCApIHtcblx0XHRpZihcblx0XHRcdCggcHJvdG9jb2xVcmxNYXRjaCAmJiAhdGhpcy5pc1ZhbGlkVXJpU2NoZW1lKCBwcm90b2NvbFVybE1hdGNoICkgKSB8fFxuXHRcdFx0dGhpcy51cmxNYXRjaERvZXNOb3RIYXZlUHJvdG9jb2xPckRvdCggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2ggKSB8fCAgICAgICAvLyBBdCBsZWFzdCBvbmUgcGVyaW9kICgnLicpIG11c3QgZXhpc3QgaW4gdGhlIFVSTCBtYXRjaCBmb3IgdXMgdG8gY29uc2lkZXIgaXQgYW4gYWN0dWFsIFVSTCwgKnVubGVzcyogaXQgd2FzIGEgZnVsbCBwcm90b2NvbCBtYXRjaCAobGlrZSAnaHR0cDovL2xvY2FsaG9zdCcpXG5cdFx0XHR0aGlzLnVybE1hdGNoRG9lc05vdEhhdmVBdExlYXN0T25lV29yZENoYXIoIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkgfHwgIC8vIEF0IGxlYXN0IG9uZSBsZXR0ZXIgY2hhcmFjdGVyIG11c3QgZXhpc3QgaW4gdGhlIGRvbWFpbiBuYW1lIGFmdGVyIGEgcHJvdG9jb2wgbWF0Y2guIEV4OiBza2lwIG92ZXIgc29tZXRoaW5nIGxpa2UgXCJnaXQ6MS4wXCJcblx0XHRcdHRoaXMuaXNJbnZhbGlkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoKCBwcm90b2NvbFJlbGF0aXZlTWF0Y2ggKSAgICAgICAgICAgICAgICAgLy8gQSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCB3aGljaCBoYXMgYSB3b3JkIGNoYXJhY3RlciBpbiBmcm9udCBvZiBpdCAoc28gd2UgY2FuIHNraXAgc29tZXRoaW5nIGxpa2UgXCJhYmMvL2dvb2dsZS5jb21cIilcblx0XHQpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIHRoZSBVUkkgc2NoZW1lIGlzIGEgdmFsaWQgc2NoZW1lIHRvIGJlIGF1dG9saW5rZWQuIFJldHVybnNcblx0ICogYGZhbHNlYCBpZiB0aGUgc2NoZW1lIGlzICdqYXZhc2NyaXB0Oicgb3IgJ3Zic2NyaXB0Oidcblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHVyaVNjaGVtZU1hdGNoIFRoZSBtYXRjaCBVUkwgc3RyaW5nIGZvciBhIGZ1bGwgVVJJIHNjaGVtZVxuXHQgKiAgIG1hdGNoLiBFeDogJ2h0dHA6Ly95YWhvby5jb20nIG9yICdtYWlsdG86YUBhLmNvbScuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiB0aGUgc2NoZW1lIGlzIGEgdmFsaWQgb25lLCBgZmFsc2VgIG90aGVyd2lzZS5cblx0ICovXG5cdGlzVmFsaWRVcmlTY2hlbWUgOiBmdW5jdGlvbiggdXJpU2NoZW1lTWF0Y2ggKSB7XG5cdFx0dmFyIHVyaVNjaGVtZSA9IHVyaVNjaGVtZU1hdGNoLm1hdGNoKCB0aGlzLnVyaVNjaGVtZVJlZ2V4IClbIDAgXS50b0xvd2VyQ2FzZSgpO1xuXG5cdFx0cmV0dXJuICggdXJpU2NoZW1lICE9PSAnamF2YXNjcmlwdDonICYmIHVyaVNjaGVtZSAhPT0gJ3Zic2NyaXB0OicgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmVzIGlmIGEgVVJMIG1hdGNoIGRvZXMgbm90IGhhdmUgZWl0aGVyOlxuXHQgKlxuXHQgKiBhKSBhIGZ1bGwgcHJvdG9jb2wgKGkuZS4gJ2h0dHA6Ly8nKSwgb3Jcblx0ICogYikgYXQgbGVhc3Qgb25lIGRvdCAoJy4nKSBpbiB0aGUgZG9tYWluIG5hbWUgKGZvciBhIG5vbi1mdWxsLXByb3RvY29sXG5cdCAqICAgIG1hdGNoKS5cblx0ICpcblx0ICogRWl0aGVyIHNpdHVhdGlvbiBpcyBjb25zaWRlcmVkIGFuIGludmFsaWQgVVJMIChleDogJ2dpdDpkJyBkb2VzIG5vdCBoYXZlXG5cdCAqIGVpdGhlciB0aGUgJzovLycgcGFydCwgb3IgYXQgbGVhc3Qgb25lIGRvdCBpbiB0aGUgZG9tYWluIG5hbWUuIElmIHRoZVxuXHQgKiBtYXRjaCB3YXMgJ2dpdDphYmMuY29tJywgd2Ugd291bGQgY29uc2lkZXIgdGhpcyB2YWxpZC4pXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB1cmxNYXRjaCBUaGUgbWF0Y2hlZCBVUkwsIGlmIHRoZXJlIHdhcyBvbmUuIFdpbGwgYmUgYW5cblx0ICogICBlbXB0eSBzdHJpbmcgaWYgdGhlIG1hdGNoIGlzIG5vdCBhIFVSTCBtYXRjaC5cblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sVXJsTWF0Y2ggVGhlIG1hdGNoIFVSTCBzdHJpbmcgZm9yIGEgcHJvdG9jb2xcblx0ICogICBtYXRjaC4gRXg6ICdodHRwOi8veWFob28uY29tJy4gVGhpcyBpcyB1c2VkIHRvIG1hdGNoIHNvbWV0aGluZyBsaWtlXG5cdCAqICAgJ2h0dHA6Ly9sb2NhbGhvc3QnLCB3aGVyZSB3ZSB3b24ndCBkb3VibGUgY2hlY2sgdGhhdCB0aGUgZG9tYWluIG5hbWVcblx0ICogICBoYXMgYXQgbGVhc3Qgb25lICcuJyBpbiBpdC5cblx0ICogQHJldHVybiB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBVUkwgbWF0Y2ggZG9lcyBub3QgaGF2ZSBhIGZ1bGwgcHJvdG9jb2wsXG5cdCAqICAgb3IgYXQgbGVhc3Qgb25lIGRvdCAoJy4nKSBpbiBhIG5vbi1mdWxsLXByb3RvY29sIG1hdGNoLlxuXHQgKi9cblx0dXJsTWF0Y2hEb2VzTm90SGF2ZVByb3RvY29sT3JEb3QgOiBmdW5jdGlvbiggdXJsTWF0Y2gsIHByb3RvY29sVXJsTWF0Y2ggKSB7XG5cdFx0cmV0dXJuICggISF1cmxNYXRjaCAmJiAoICFwcm90b2NvbFVybE1hdGNoIHx8ICF0aGlzLmhhc0Z1bGxQcm90b2NvbFJlZ2V4LnRlc3QoIHByb3RvY29sVXJsTWF0Y2ggKSApICYmIHVybE1hdGNoLmluZGV4T2YoICcuJyApID09PSAtMSApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIERldGVybWluZXMgaWYgYSBVUkwgbWF0Y2ggZG9lcyBub3QgaGF2ZSBhdCBsZWFzdCBvbmUgd29yZCBjaGFyYWN0ZXIgYWZ0ZXJcblx0ICogdGhlIHByb3RvY29sIChpLmUuIGluIHRoZSBkb21haW4gbmFtZSkuXG5cdCAqXG5cdCAqIEF0IGxlYXN0IG9uZSBsZXR0ZXIgY2hhcmFjdGVyIG11c3QgZXhpc3QgaW4gdGhlIGRvbWFpbiBuYW1lIGFmdGVyIGFcblx0ICogcHJvdG9jb2wgbWF0Y2guIEV4OiBza2lwIG92ZXIgc29tZXRoaW5nIGxpa2UgXCJnaXQ6MS4wXCJcblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHVybE1hdGNoIFRoZSBtYXRjaGVkIFVSTCwgaWYgdGhlcmUgd2FzIG9uZS4gV2lsbCBiZSBhblxuXHQgKiAgIGVtcHR5IHN0cmluZyBpZiB0aGUgbWF0Y2ggaXMgbm90IGEgVVJMIG1hdGNoLlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gcHJvdG9jb2xVcmxNYXRjaCBUaGUgbWF0Y2ggVVJMIHN0cmluZyBmb3IgYSBwcm90b2NvbFxuXHQgKiAgIG1hdGNoLiBFeDogJ2h0dHA6Ly95YWhvby5jb20nLiBUaGlzIGlzIHVzZWQgdG8ga25vdyB3aGV0aGVyIG9yIG5vdCB3ZVxuXHQgKiAgIGhhdmUgYSBwcm90b2NvbCBpbiB0aGUgVVJMIHN0cmluZywgaW4gb3JkZXIgdG8gY2hlY2sgZm9yIGEgd29yZFxuXHQgKiAgIGNoYXJhY3RlciBhZnRlciB0aGUgcHJvdG9jb2wgc2VwYXJhdG9yICgnOicpLlxuXHQgKiBAcmV0dXJuIHtCb29sZWFufSBgdHJ1ZWAgaWYgdGhlIFVSTCBtYXRjaCBkb2VzIG5vdCBoYXZlIGF0IGxlYXN0IG9uZSB3b3JkXG5cdCAqICAgY2hhcmFjdGVyIGluIGl0IGFmdGVyIHRoZSBwcm90b2NvbCwgYGZhbHNlYCBvdGhlcndpc2UuXG5cdCAqL1xuXHR1cmxNYXRjaERvZXNOb3RIYXZlQXRMZWFzdE9uZVdvcmRDaGFyIDogZnVuY3Rpb24oIHVybE1hdGNoLCBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdGlmKCB1cmxNYXRjaCAmJiBwcm90b2NvbFVybE1hdGNoICkge1xuXHRcdFx0cmV0dXJuICF0aGlzLmhhc1dvcmRDaGFyQWZ0ZXJQcm90b2NvbFJlZ2V4LnRlc3QoIHVybE1hdGNoICk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lcyBpZiBhIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoIGlzIGFuIGludmFsaWQgb25lLiBUaGlzIG1ldGhvZFxuXHQgKiByZXR1cm5zIGB0cnVlYCBpZiB0aGVyZSBpcyBhIGBwcm90b2NvbFJlbGF0aXZlTWF0Y2hgLCBhbmQgdGhhdCBtYXRjaFxuXHQgKiBjb250YWlucyBhIHdvcmQgY2hhcmFjdGVyIGJlZm9yZSB0aGUgJy8vJyAoaS5lLiBpdCBtdXN0IGNvbnRhaW5cblx0ICogd2hpdGVzcGFjZSBvciBub3RoaW5nIGJlZm9yZSB0aGUgJy8vJyBpbiBvcmRlciB0byBiZSBjb25zaWRlcmVkIHZhbGlkKS5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IHByb3RvY29sUmVsYXRpdmVNYXRjaCBUaGUgcHJvdG9jb2wtcmVsYXRpdmUgc3RyaW5nIGZvciBhXG5cdCAqICAgVVJMIG1hdGNoIChpLmUuICcvLycpLCBwb3NzaWJseSB3aXRoIGEgcHJlY2VkaW5nIGNoYXJhY3RlciAoZXgsIGFcblx0ICogICBzcGFjZSwgc3VjaCBhczogJyAvLycsIG9yIGEgbGV0dGVyLCBzdWNoIGFzOiAnYS8vJykuIFRoZSBtYXRjaCBpc1xuXHQgKiAgIGludmFsaWQgaWYgdGhlcmUgaXMgYSB3b3JkIGNoYXJhY3RlciBwcmVjZWRpbmcgdGhlICcvLycuXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBpdCBpcyBhbiBpbnZhbGlkIHByb3RvY29sLXJlbGF0aXZlIG1hdGNoLFxuXHQgKiAgIGBmYWxzZWAgb3RoZXJ3aXNlLlxuXHQgKi9cblx0aXNJbnZhbGlkUHJvdG9jb2xSZWxhdGl2ZU1hdGNoIDogZnVuY3Rpb24oIHByb3RvY29sUmVsYXRpdmVNYXRjaCApIHtcblx0XHRyZXR1cm4gKCAhIXByb3RvY29sUmVsYXRpdmVNYXRjaCAmJiB0aGlzLmludmFsaWRQcm90b2NvbFJlbE1hdGNoUmVnZXgudGVzdCggcHJvdG9jb2xSZWxhdGl2ZU1hdGNoICkgKTtcblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGFic3RyYWN0XG4gKiBAY2xhc3MgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICogXG4gKiBSZXByZXNlbnRzIGEgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZSBBdXRvbGlua2VkLiBBIE1hdGNoIG9iamVjdCBpcyB3aGF0IGlzIHByb3ZpZGVkIGluIGEgXG4gKiB7QGxpbmsgQXV0b2xpbmtlciNyZXBsYWNlRm4gcmVwbGFjZUZufSwgYW5kIG1heSBiZSB1c2VkIHRvIHF1ZXJ5IGZvciBkZXRhaWxzIGFib3V0IHRoZSBtYXRjaC5cbiAqIFxuICogRm9yIGV4YW1wbGU6XG4gKiBcbiAqICAgICB2YXIgaW5wdXQgPSBcIi4uLlwiOyAgLy8gc3RyaW5nIHdpdGggVVJMcywgRW1haWwgQWRkcmVzc2VzLCBhbmQgVHdpdHRlciBIYW5kbGVzXG4gKiAgICAgXG4gKiAgICAgdmFyIGxpbmtlZFRleHQgPSBBdXRvbGlua2VyLmxpbmsoIGlucHV0LCB7XG4gKiAgICAgICAgIHJlcGxhY2VGbiA6IGZ1bmN0aW9uKCBhdXRvbGlua2VyLCBtYXRjaCApIHtcbiAqICAgICAgICAgICAgIGNvbnNvbGUubG9nKCBcImhyZWYgPSBcIiwgbWF0Y2guZ2V0QW5jaG9ySHJlZigpICk7XG4gKiAgICAgICAgICAgICBjb25zb2xlLmxvZyggXCJ0ZXh0ID0gXCIsIG1hdGNoLmdldEFuY2hvclRleHQoKSApO1xuICogICAgICAgICBcbiAqICAgICAgICAgICAgIHN3aXRjaCggbWF0Y2guZ2V0VHlwZSgpICkge1xuICogICAgICAgICAgICAgICAgIGNhc2UgJ3VybCcgOiBcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwidXJsOiBcIiwgbWF0Y2guZ2V0VXJsKCkgKTtcbiAqICAgICAgICAgICAgICAgICAgICAgXG4gKiAgICAgICAgICAgICAgICAgY2FzZSAnZW1haWwnIDpcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwiZW1haWw6IFwiLCBtYXRjaC5nZXRFbWFpbCgpICk7XG4gKiAgICAgICAgICAgICAgICAgICAgIFxuICogICAgICAgICAgICAgICAgIGNhc2UgJ3R3aXR0ZXInIDpcbiAqICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coIFwidHdpdHRlcjogXCIsIG1hdGNoLmdldFR3aXR0ZXJIYW5kbGUoKSApO1xuICogICAgICAgICAgICAgfVxuICogICAgICAgICB9XG4gKiAgICAgfSApO1xuICogICAgIFxuICogU2VlIHRoZSB7QGxpbmsgQXV0b2xpbmtlcn0gY2xhc3MgZm9yIG1vcmUgZGV0YWlscyBvbiB1c2luZyB0aGUge0BsaW5rIEF1dG9saW5rZXIjcmVwbGFjZUZuIHJlcGxhY2VGbn0uXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guTWF0Y2ggPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBPYmplY3QsIHtcblx0XG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IG1hdGNoZWRUZXh0IChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSBvcmlnaW5hbCB0ZXh0IHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXHRcblx0XG5cdC8qKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtPYmplY3R9IGNmZyBUaGUgY29uZmlndXJhdGlvbiBwcm9wZXJ0aWVzIGZvciB0aGUgTWF0Y2ggaW5zdGFuY2UsIHNwZWNpZmllZCBpbiBhbiBPYmplY3QgKG1hcCkuXG5cdCAqL1xuXHRjb25zdHJ1Y3RvciA6IGZ1bmN0aW9uKCBjZmcgKSB7XG5cdFx0QXV0b2xpbmtlci5VdGlsLmFzc2lnbiggdGhpcywgY2ZnICk7XG5cdH0sXG5cblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIGEgc3RyaW5nIG5hbWUgZm9yIHRoZSB0eXBlIG9mIG1hdGNoIHRoYXQgdGhpcyBjbGFzcyByZXByZXNlbnRzLlxuXHQgKiBcblx0ICogQGFic3RyYWN0XG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBBdXRvbGlua2VyLlV0aWwuYWJzdHJhY3RNZXRob2QsXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIG9yaWdpbmFsIHRleHQgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldE1hdGNoZWRUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMubWF0Y2hlZFRleHQ7XG5cdH0sXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogQXV0b2xpbmtlci5VdGlsLmFic3RyYWN0TWV0aG9kLFxuXHRcblx0XG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgdGV4dCB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEBhYnN0cmFjdFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogQXV0b2xpbmtlci5VdGlsLmFic3RyYWN0TWV0aG9kXG5cbn0gKTtcbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guRW1haWxcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqIFxuICogUmVwcmVzZW50cyBhIEVtYWlsIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmUgQXV0b2xpbmtlZC5cbiAqIFxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0pIGZvciBtb3JlIGRldGFpbHMuXG4gKi9cbkF1dG9saW5rZXIubWF0Y2guRW1haWwgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLm1hdGNoLk1hdGNoLCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSBlbWFpbCAocmVxdWlyZWQpXG5cdCAqIFxuXHQgKiBUaGUgZW1haWwgYWRkcmVzcyB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdlbWFpbCc7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGVtYWlsIGFkZHJlc3MgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEVtYWlsIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZW1haWw7XG5cdH0sXG5cdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ21haWx0bzonICsgdGhpcy5lbWFpbDtcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuZW1haWw7XG5cdH1cblx0XG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLkhhc2h0YWdcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqXG4gKiBSZXByZXNlbnRzIGEgSGFzaHRhZyBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlXG4gKiBBdXRvbGlua2VkLlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZVxuICogZGV0YWlscy5cbiAqL1xuQXV0b2xpbmtlci5tYXRjaC5IYXNodGFnID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IHNlcnZpY2VOYW1lIChyZXF1aXJlZClcblx0ICpcblx0ICogVGhlIHNlcnZpY2UgdG8gcG9pbnQgaGFzaHRhZyBtYXRjaGVzIHRvLiBTZWUge0BsaW5rIEF1dG9saW5rZXIjaGFzaHRhZ31cblx0ICogZm9yIGF2YWlsYWJsZSB2YWx1ZXMuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IGhhc2h0YWcgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgSGFzaHRhZyB0aGF0IHdhcyBtYXRjaGVkLCB3aXRob3V0IHRoZSAnIycuXG5cdCAqL1xuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ2hhc2h0YWcnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIG1hdGNoZWQgaGFzaHRhZy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0SGFzaHRhZyA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLmhhc2h0YWc7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgc2VydmljZU5hbWUgPSB0aGlzLnNlcnZpY2VOYW1lLFxuXHRcdCAgICBoYXNodGFnID0gdGhpcy5oYXNodGFnO1xuXG5cdFx0c3dpdGNoKCBzZXJ2aWNlTmFtZSApIHtcblx0XHRcdGNhc2UgJ3R3aXR0ZXInIDpcblx0XHRcdFx0cmV0dXJuICdodHRwczovL3R3aXR0ZXIuY29tL2hhc2h0YWcvJyArIGhhc2h0YWc7XG5cdFx0XHRjYXNlICdmYWNlYm9vaycgOlxuXHRcdFx0XHRyZXR1cm4gJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9oYXNodGFnLycgKyBoYXNodGFnO1xuXHRcdFx0Y2FzZSAnaW5zdGFncmFtJyA6XG5cdFx0XHRcdHJldHVybiAnaHR0cHM6Ly9pbnN0YWdyYW0uY29tL2V4cGxvcmUvdGFncy8nICsgaGFzaHRhZztcblxuXHRcdFx0ZGVmYXVsdCA6ICAvLyBTaG91bGRuJ3QgaGFwcGVuIGJlY2F1c2UgQXV0b2xpbmtlcidzIGNvbnN0cnVjdG9yIHNob3VsZCBibG9jayBhbnkgaW52YWxpZCB2YWx1ZXMsIGJ1dCBqdXN0IGluIGNhc2UuXG5cdFx0XHRcdHRocm93IG5ldyBFcnJvciggJ1Vua25vd24gc2VydmljZSBuYW1lIHRvIHBvaW50IGhhc2h0YWcgdG86ICcsIHNlcnZpY2VOYW1lICk7XG5cdFx0fVxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JUZXh0IDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICcjJyArIHRoaXMuaGFzaHRhZztcblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guUGhvbmVcbiAqIEBleHRlbmRzIEF1dG9saW5rZXIubWF0Y2guTWF0Y2hcbiAqXG4gKiBSZXByZXNlbnRzIGEgUGhvbmUgbnVtYmVyIG1hdGNoIGZvdW5kIGluIGFuIGlucHV0IHN0cmluZyB3aGljaCBzaG91bGQgYmVcbiAqIEF1dG9saW5rZWQuXG4gKlxuICogU2VlIHRoaXMgY2xhc3MncyBzdXBlcmNsYXNzICh7QGxpbmsgQXV0b2xpbmtlci5tYXRjaC5NYXRjaH0pIGZvciBtb3JlXG4gKiBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLlBob25lID0gQXV0b2xpbmtlci5VdGlsLmV4dGVuZCggQXV0b2xpbmtlci5tYXRjaC5NYXRjaCwge1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtTdHJpbmd9IG51bWJlciAocmVxdWlyZWQpXG5cdCAqXG5cdCAqIFRoZSBwaG9uZSBudW1iZXIgdGhhdCB3YXMgbWF0Y2hlZC5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHBsdXNTaWduIChyZXF1aXJlZClcblx0ICpcblx0ICogYHRydWVgIGlmIHRoZSBtYXRjaGVkIHBob25lIG51bWJlciBzdGFydGVkIHdpdGggYSAnKycgc2lnbi4gV2UnbGwgaW5jbHVkZVxuXHQgKiBpdCBpbiB0aGUgYHRlbDpgIFVSTCBpZiBzbywgYXMgdGhpcyBpcyBuZWVkZWQgZm9yIGludGVybmF0aW9uYWwgbnVtYmVycy5cblx0ICpcblx0ICogRXg6ICcrMSAoMTIzKSA0NTYgNzg3OSdcblx0ICovXG5cblxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0VHlwZSA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAncGhvbmUnO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHBob25lIG51bWJlciB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKlxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXROdW1iZXI6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiB0aGlzLm51bWJlcjtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBhbmNob3IgaHJlZiB0aGF0IHNob3VsZCBiZSBnZW5lcmF0ZWQgZm9yIHRoZSBtYXRjaC5cblx0ICpcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9ySHJlZiA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAndGVsOicgKyAoIHRoaXMucGx1c1NpZ24gPyAnKycgOiAnJyApICsgdGhpcy5udW1iZXI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy5tYXRjaGVkVGV4dDtcblx0fVxuXG59ICk7XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogQGNsYXNzIEF1dG9saW5rZXIubWF0Y2guVHdpdHRlclxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICogXG4gKiBSZXByZXNlbnRzIGEgVHdpdHRlciBtYXRjaCBmb3VuZCBpbiBhbiBpbnB1dCBzdHJpbmcgd2hpY2ggc2hvdWxkIGJlIEF1dG9saW5rZWQuXG4gKiBcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLlR3aXR0ZXIgPSBBdXRvbGlua2VyLlV0aWwuZXh0ZW5kKCBBdXRvbGlua2VyLm1hdGNoLk1hdGNoLCB7XG5cdFxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB0d2l0dGVySGFuZGxlIChyZXF1aXJlZClcblx0ICogXG5cdCAqIFRoZSBUd2l0dGVyIGhhbmRsZSB0aGF0IHdhcyBtYXRjaGVkLlxuXHQgKi9cblx0XG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRUeXBlIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICd0d2l0dGVyJztcblx0fSxcblx0XG5cdFxuXHQvKipcblx0ICogUmV0dXJucyBhIHN0cmluZyBuYW1lIGZvciB0aGUgdHlwZSBvZiBtYXRjaCB0aGF0IHRoaXMgY2xhc3MgcmVwcmVzZW50cy5cblx0ICogXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR3aXR0ZXJIYW5kbGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gdGhpcy50d2l0dGVySGFuZGxlO1xuXHR9LFxuXHRcblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqIFxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9XG5cdCAqL1xuXHRnZXRBbmNob3JIcmVmIDogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuICdodHRwczovL3R3aXR0ZXIuY29tLycgKyB0aGlzLnR3aXR0ZXJIYW5kbGU7XG5cdH0sXG5cdFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGFuY2hvciB0ZXh0IHRoYXQgc2hvdWxkIGJlIGdlbmVyYXRlZCBmb3IgdGhlIG1hdGNoLlxuXHQgKiBcblx0ICogQHJldHVybiB7U3RyaW5nfVxuXHQgKi9cblx0Z2V0QW5jaG9yVGV4dCA6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiAnQCcgKyB0aGlzLnR3aXR0ZXJIYW5kbGU7XG5cdH1cblx0XG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEBjbGFzcyBBdXRvbGlua2VyLm1hdGNoLlVybFxuICogQGV4dGVuZHMgQXV0b2xpbmtlci5tYXRjaC5NYXRjaFxuICpcbiAqIFJlcHJlc2VudHMgYSBVcmwgbWF0Y2ggZm91bmQgaW4gYW4gaW5wdXQgc3RyaW5nIHdoaWNoIHNob3VsZCBiZSBBdXRvbGlua2VkLlxuICpcbiAqIFNlZSB0aGlzIGNsYXNzJ3Mgc3VwZXJjbGFzcyAoe0BsaW5rIEF1dG9saW5rZXIubWF0Y2guTWF0Y2h9KSBmb3IgbW9yZSBkZXRhaWxzLlxuICovXG5BdXRvbGlua2VyLm1hdGNoLlVybCA9IEF1dG9saW5rZXIuVXRpbC5leHRlbmQoIEF1dG9saW5rZXIubWF0Y2guTWF0Y2gsIHtcblxuXHQvKipcblx0ICogQGNmZyB7U3RyaW5nfSB1cmwgKHJlcXVpcmVkKVxuXHQgKlxuXHQgKiBUaGUgdXJsIHRoYXQgd2FzIG1hdGNoZWQuXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAY2ZnIHtCb29sZWFufSBwcm90b2NvbFVybE1hdGNoIChyZXF1aXJlZClcblx0ICpcblx0ICogYHRydWVgIGlmIHRoZSBVUkwgaXMgYSBtYXRjaCB3aGljaCBhbHJlYWR5IGhhcyBhIHByb3RvY29sIChpLmUuICdodHRwOi8vJyksIGBmYWxzZWAgaWYgdGhlIG1hdGNoIHdhcyBmcm9tIGEgJ3d3dycgb3Jcblx0ICoga25vd24gVExEIG1hdGNoLlxuXHQgKi9cblxuXHQvKipcblx0ICogQGNmZyB7Qm9vbGVhbn0gcHJvdG9jb2xSZWxhdGl2ZU1hdGNoIChyZXF1aXJlZClcblx0ICpcblx0ICogYHRydWVgIGlmIHRoZSBVUkwgaXMgYSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaC4gQSBwcm90b2NvbC1yZWxhdGl2ZSBtYXRjaCBpcyBhIFVSTCB0aGF0IHN0YXJ0cyB3aXRoICcvLycsXG5cdCAqIGFuZCB3aWxsIGJlIGVpdGhlciBodHRwOi8vIG9yIGh0dHBzOi8vIGJhc2VkIG9uIHRoZSBwcm90b2NvbCB0aGF0IHRoZSBzaXRlIGlzIGxvYWRlZCB1bmRlci5cblx0ICovXG5cblx0LyoqXG5cdCAqIEBjZmcge0Jvb2xlYW59IHN0cmlwUHJlZml4IChyZXF1aXJlZClcblx0ICogQGluaGVyaXRkb2MgQXV0b2xpbmtlciNzdHJpcFByZWZpeFxuXHQgKi9cblxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge1JlZ0V4cH0gdXJsUHJlZml4UmVnZXhcblx0ICpcblx0ICogQSByZWd1bGFyIGV4cHJlc3Npb24gdXNlZCB0byByZW1vdmUgdGhlICdodHRwOi8vJyBvciAnaHR0cHM6Ly8nIGFuZC9vciB0aGUgJ3d3dy4nIGZyb20gVVJMcy5cblx0ICovXG5cdHVybFByZWZpeFJlZ2V4OiAvXihodHRwcz86XFwvXFwvKT8od3d3XFwuKT8vaSxcblxuXHQvKipcblx0ICogQHByaXZhdGVcblx0ICogQHByb3BlcnR5IHtSZWdFeHB9IHByb3RvY29sUmVsYXRpdmVSZWdleFxuXHQgKlxuXHQgKiBUaGUgcmVndWxhciBleHByZXNzaW9uIHVzZWQgdG8gcmVtb3ZlIHRoZSBwcm90b2NvbC1yZWxhdGl2ZSAnLy8nIGZyb20gdGhlIHtAbGluayAjdXJsfSBzdHJpbmcsIGZvciBwdXJwb3Nlc1xuXHQgKiBvZiB7QGxpbmsgI2dldEFuY2hvclRleHR9LiBBIHByb3RvY29sLXJlbGF0aXZlIFVSTCBpcywgZm9yIGV4YW1wbGUsIFwiLy95YWhvby5jb21cIlxuXHQgKi9cblx0cHJvdG9jb2xSZWxhdGl2ZVJlZ2V4IDogL15cXC9cXC8vLFxuXG5cdC8qKlxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcHJvcGVydHkge0Jvb2xlYW59IHByb3RvY29sUHJlcGVuZGVkXG5cdCAqXG5cdCAqIFdpbGwgYmUgc2V0IHRvIGB0cnVlYCBpZiB0aGUgJ2h0dHA6Ly8nIHByb3RvY29sIGhhcyBiZWVuIHByZXBlbmRlZCB0byB0aGUge0BsaW5rICN1cmx9IChiZWNhdXNlIHRoZVxuXHQgKiB7QGxpbmsgI3VybH0gZGlkIG5vdCBoYXZlIGEgcHJvdG9jb2wpXG5cdCAqL1xuXHRwcm90b2NvbFByZXBlbmRlZCA6IGZhbHNlLFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgYSBzdHJpbmcgbmFtZSBmb3IgdGhlIHR5cGUgb2YgbWF0Y2ggdGhhdCB0aGlzIGNsYXNzIHJlcHJlc2VudHMuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFR5cGUgOiBmdW5jdGlvbigpIHtcblx0XHRyZXR1cm4gJ3VybCc7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgdXJsIHRoYXQgd2FzIG1hdGNoZWQsIGFzc3VtaW5nIHRoZSBwcm90b2NvbCB0byBiZSAnaHR0cDovLycgaWYgdGhlIG9yaWdpbmFsXG5cdCAqIG1hdGNoIHdhcyBtaXNzaW5nIGEgcHJvdG9jb2wuXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldFVybCA6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB1cmwgPSB0aGlzLnVybDtcblxuXHRcdC8vIGlmIHRoZSB1cmwgc3RyaW5nIGRvZXNuJ3QgYmVnaW4gd2l0aCBhIHByb3RvY29sLCBhc3N1bWUgJ2h0dHA6Ly8nXG5cdFx0aWYoICF0aGlzLnByb3RvY29sUmVsYXRpdmVNYXRjaCAmJiAhdGhpcy5wcm90b2NvbFVybE1hdGNoICYmICF0aGlzLnByb3RvY29sUHJlcGVuZGVkICkge1xuXHRcdFx0dXJsID0gdGhpcy51cmwgPSAnaHR0cDovLycgKyB1cmw7XG5cblx0XHRcdHRoaXMucHJvdG9jb2xQcmVwZW5kZWQgPSB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiB1cmw7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIGhyZWYgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvckhyZWYgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgdXJsID0gdGhpcy5nZXRVcmwoKTtcblxuXHRcdHJldHVybiB1cmwucmVwbGFjZSggLyZhbXA7L2csICcmJyApOyAgLy8gYW55ICZhbXA7J3MgaW4gdGhlIFVSTCBzaG91bGQgYmUgY29udmVydGVkIGJhY2sgdG8gJyYnIGlmIHRoZXkgd2VyZSBkaXNwbGF5ZWQgYXMgJmFtcDsgaW4gdGhlIHNvdXJjZSBodG1sXG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgYW5jaG9yIHRleHQgdGhhdCBzaG91bGQgYmUgZ2VuZXJhdGVkIGZvciB0aGUgbWF0Y2guXG5cdCAqXG5cdCAqIEByZXR1cm4ge1N0cmluZ31cblx0ICovXG5cdGdldEFuY2hvclRleHQgOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgYW5jaG9yVGV4dCA9IHRoaXMuZ2V0TWF0Y2hlZFRleHQoKTtcblxuXHRcdGlmKCB0aGlzLnByb3RvY29sUmVsYXRpdmVNYXRjaCApIHtcblx0XHRcdC8vIFN0cmlwIG9mZiBhbnkgcHJvdG9jb2wtcmVsYXRpdmUgJy8vJyBmcm9tIHRoZSBhbmNob3IgdGV4dFxuXHRcdFx0YW5jaG9yVGV4dCA9IHRoaXMuc3RyaXBQcm90b2NvbFJlbGF0aXZlUHJlZml4KCBhbmNob3JUZXh0ICk7XG5cdFx0fVxuXHRcdGlmKCB0aGlzLnN0cmlwUHJlZml4ICkge1xuXHRcdFx0YW5jaG9yVGV4dCA9IHRoaXMuc3RyaXBVcmxQcmVmaXgoIGFuY2hvclRleHQgKTtcblx0XHR9XG5cdFx0YW5jaG9yVGV4dCA9IHRoaXMucmVtb3ZlVHJhaWxpbmdTbGFzaCggYW5jaG9yVGV4dCApOyAgLy8gcmVtb3ZlIHRyYWlsaW5nIHNsYXNoLCBpZiB0aGVyZSBpcyBvbmVcblxuXHRcdHJldHVybiBhbmNob3JUZXh0O1xuXHR9LFxuXG5cblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblx0Ly8gVXRpbGl0eSBGdW5jdGlvbmFsaXR5XG5cblx0LyoqXG5cdCAqIFN0cmlwcyB0aGUgVVJMIHByZWZpeCAoc3VjaCBhcyBcImh0dHA6Ly9cIiBvciBcImh0dHBzOi8vXCIpIGZyb20gdGhlIGdpdmVuIHRleHQuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBhbmNob3IgdGhhdCBpcyBiZWluZyBnZW5lcmF0ZWQsIGZvciB3aGljaCB0byBzdHJpcCBvZmYgdGhlXG5cdCAqICAgdXJsIHByZWZpeCAoc3VjaCBhcyBzdHJpcHBpbmcgb2ZmIFwiaHR0cDovL1wiKVxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBgYW5jaG9yVGV4dGAsIHdpdGggdGhlIHByZWZpeCBzdHJpcHBlZC5cblx0ICovXG5cdHN0cmlwVXJsUHJlZml4IDogZnVuY3Rpb24oIHRleHQgKSB7XG5cdFx0cmV0dXJuIHRleHQucmVwbGFjZSggdGhpcy51cmxQcmVmaXhSZWdleCwgJycgKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBTdHJpcHMgYW55IHByb3RvY29sLXJlbGF0aXZlICcvLycgZnJvbSB0aGUgYW5jaG9yIHRleHQuXG5cdCAqXG5cdCAqIEBwcml2YXRlXG5cdCAqIEBwYXJhbSB7U3RyaW5nfSB0ZXh0IFRoZSB0ZXh0IG9mIHRoZSBhbmNob3IgdGhhdCBpcyBiZWluZyBnZW5lcmF0ZWQsIGZvciB3aGljaCB0byBzdHJpcCBvZmYgdGhlXG5cdCAqICAgcHJvdG9jb2wtcmVsYXRpdmUgcHJlZml4IChzdWNoIGFzIHN0cmlwcGluZyBvZmYgXCIvL1wiKVxuXHQgKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSBgYW5jaG9yVGV4dGAsIHdpdGggdGhlIHByb3RvY29sLXJlbGF0aXZlIHByZWZpeCBzdHJpcHBlZC5cblx0ICovXG5cdHN0cmlwUHJvdG9jb2xSZWxhdGl2ZVByZWZpeCA6IGZ1bmN0aW9uKCB0ZXh0ICkge1xuXHRcdHJldHVybiB0ZXh0LnJlcGxhY2UoIHRoaXMucHJvdG9jb2xSZWxhdGl2ZVJlZ2V4LCAnJyApO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJlbW92ZXMgYW55IHRyYWlsaW5nIHNsYXNoIGZyb20gdGhlIGdpdmVuIGBhbmNob3JUZXh0YCwgaW4gcHJlcGFyYXRpb24gZm9yIHRoZSB0ZXh0IHRvIGJlIGRpc3BsYXllZC5cblx0ICpcblx0ICogQHByaXZhdGVcblx0ICogQHBhcmFtIHtTdHJpbmd9IGFuY2hvclRleHQgVGhlIHRleHQgb2YgdGhlIGFuY2hvciB0aGF0IGlzIGJlaW5nIGdlbmVyYXRlZCwgZm9yIHdoaWNoIHRvIHJlbW92ZSBhbnkgdHJhaWxpbmdcblx0ICogICBzbGFzaCAoJy8nKSB0aGF0IG1heSBleGlzdC5cblx0ICogQHJldHVybiB7U3RyaW5nfSBUaGUgYGFuY2hvclRleHRgLCB3aXRoIHRoZSB0cmFpbGluZyBzbGFzaCByZW1vdmVkLlxuXHQgKi9cblx0cmVtb3ZlVHJhaWxpbmdTbGFzaCA6IGZ1bmN0aW9uKCBhbmNob3JUZXh0ICkge1xuXHRcdGlmKCBhbmNob3JUZXh0LmNoYXJBdCggYW5jaG9yVGV4dC5sZW5ndGggLSAxICkgPT09ICcvJyApIHtcblx0XHRcdGFuY2hvclRleHQgPSBhbmNob3JUZXh0LnNsaWNlKCAwLCAtMSApO1xuXHRcdH1cblx0XHRyZXR1cm4gYW5jaG9yVGV4dDtcblx0fVxuXG59ICk7XG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIEEgdHJ1bmNhdGlvbiBmZWF0dXJlIHdoZXJlIHRoZSBlbGxpcHNpcyB3aWxsIGJlIHBsYWNlZCBhdCB0aGUgZW5kIG9mIHRoZSBVUkwuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGFuY2hvclRleHRcbiAqIEBwYXJhbSB7TnVtYmVyfSB0cnVuY2F0ZUxlbiBUaGUgbWF4aW11bSBsZW5ndGggb2YgdGhlIHRydW5jYXRlZCBvdXRwdXQgVVJMIHN0cmluZy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbGxpcHNpc0NoYXJzIFRoZSBjaGFyYWN0ZXJzIHRvIHBsYWNlIHdpdGhpbiB0aGUgdXJsLCBlLmcuIFwiLi5cIi5cbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIHRydW5jYXRlZCBVUkwuXG4gKi9cbkF1dG9saW5rZXIudHJ1bmNhdGUuVHJ1bmNhdGVFbmQgPSBmdW5jdGlvbihhbmNob3JUZXh0LCB0cnVuY2F0ZUxlbiwgZWxsaXBzaXNDaGFycyl7XG5cdHJldHVybiBBdXRvbGlua2VyLlV0aWwuZWxsaXBzaXMoIGFuY2hvclRleHQsIHRydW5jYXRlTGVuLCBlbGxpcHNpc0NoYXJzICk7XG59O1xuXG4vKmdsb2JhbCBBdXRvbGlua2VyICovXG4vKipcbiAqIERhdGU6IDIwMTUtMTAtMDVcbiAqIEF1dGhvcjogS2FzcGVyIFPDuGZyZW4gPHNvZWZyaXR6QGdtYWlsLmNvbT4gKGh0dHBzOi8vZ2l0aHViLmNvbS9rYWZvc28pXG4gKlxuICogQSB0cnVuY2F0aW9uIGZlYXR1cmUsIHdoZXJlIHRoZSBlbGxpcHNpcyB3aWxsIGJlIHBsYWNlZCBpbiB0aGUgZGVhZC1jZW50ZXIgb2YgdGhlIFVSTC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsICAgICAgICAgICAgIEEgVVJMLlxuICogQHBhcmFtIHtOdW1iZXJ9IHRydW5jYXRlTGVuICAgICBUaGUgbWF4aW11bSBsZW5ndGggb2YgdGhlIHRydW5jYXRlZCBvdXRwdXQgVVJMIHN0cmluZy5cbiAqIEBwYXJhbSB7U3RyaW5nfSBlbGxpcHNpc0NoYXJzICAgVGhlIGNoYXJhY3RlcnMgdG8gcGxhY2Ugd2l0aGluIHRoZSB1cmwsIGUuZy4gXCIuLlwiLlxuICogQHJldHVybiB7U3RyaW5nfSBUaGUgdHJ1bmNhdGVkIFVSTC5cbiAqL1xuQXV0b2xpbmtlci50cnVuY2F0ZS5UcnVuY2F0ZU1pZGRsZSA9IGZ1bmN0aW9uKHVybCwgdHJ1bmNhdGVMZW4sIGVsbGlwc2lzQ2hhcnMpe1xuICBpZiAodXJsLmxlbmd0aCA8PSB0cnVuY2F0ZUxlbikge1xuICAgIHJldHVybiB1cmw7XG4gIH1cbiAgdmFyIGF2YWlsYWJsZUxlbmd0aCA9IHRydW5jYXRlTGVuIC0gZWxsaXBzaXNDaGFycy5sZW5ndGg7XG4gIHZhciBlbmQgPSBcIlwiO1xuICBpZiAoYXZhaWxhYmxlTGVuZ3RoID4gMCkge1xuICAgIGVuZCA9IHVybC5zdWJzdHIoKC0xKSpNYXRoLmZsb29yKGF2YWlsYWJsZUxlbmd0aC8yKSk7XG4gIH1cbiAgcmV0dXJuICh1cmwuc3Vic3RyKDAsIE1hdGguY2VpbChhdmFpbGFibGVMZW5ndGgvMikpICsgZWxsaXBzaXNDaGFycyArIGVuZCkuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcbn07XG5cbi8qZ2xvYmFsIEF1dG9saW5rZXIgKi9cbi8qKlxuICogRGF0ZTogMjAxNS0xMC0wNVxuICogQXV0aG9yOiBLYXNwZXIgU8O4ZnJlbiA8c29lZnJpdHpAZ21haWwuY29tPiAoaHR0cHM6Ly9naXRodWIuY29tL2thZm9zbylcbiAqXG4gKiBBIHRydW5jYXRpb24gZmVhdHVyZSwgd2hlcmUgdGhlIGVsbGlwc2lzIHdpbGwgYmUgcGxhY2VkIGF0IGEgc2VjdGlvbiB3aXRoaW5cbiAqIHRoZSBVUkwgbWFraW5nIGl0IHN0aWxsIHNvbWV3aGF0IGh1bWFuIHJlYWRhYmxlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmxcdFx0XHRcdFx0XHQgQSBVUkwuXG4gKiBAcGFyYW0ge051bWJlcn0gdHJ1bmNhdGVMZW5cdFx0IFRoZSBtYXhpbXVtIGxlbmd0aCBvZiB0aGUgdHJ1bmNhdGVkIG91dHB1dCBVUkwgc3RyaW5nLlxuICogQHBhcmFtIHtTdHJpbmd9IGVsbGlwc2lzQ2hhcnNcdCBUaGUgY2hhcmFjdGVycyB0byBwbGFjZSB3aXRoaW4gdGhlIHVybCwgZS5nLiBcIi4uXCIuXG4gKiBAcmV0dXJuIHtTdHJpbmd9IFRoZSB0cnVuY2F0ZWQgVVJMLlxuICovXG5BdXRvbGlua2VyLnRydW5jYXRlLlRydW5jYXRlU21hcnQgPSBmdW5jdGlvbih1cmwsIHRydW5jYXRlTGVuLCBlbGxpcHNpc0NoYXJzKXtcblx0dmFyIHBhcnNlX3VybCA9IGZ1bmN0aW9uKHVybCl7IC8vIEZ1bmN0aW9uYWxpdHkgaW5zcGlyZWQgYnkgUEhQIGZ1bmN0aW9uIG9mIHNhbWUgbmFtZVxuXHRcdHZhciB1cmxPYmogPSB7fTtcblx0XHR2YXIgdXJsU3ViID0gdXJsO1xuXHRcdHZhciBtYXRjaCA9IHVybFN1Yi5tYXRjaCgvXihbYS16XSspOlxcL1xcLy9pKTtcblx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdHVybE9iai5zY2hlbWUgPSBtYXRjaFsxXTtcblx0XHRcdHVybFN1YiA9IHVybFN1Yi5zdWJzdHIobWF0Y2hbMF0ubGVuZ3RoKTtcblx0XHR9XG5cdFx0bWF0Y2ggPSB1cmxTdWIubWF0Y2goL14oLio/KSg/PShcXD98I3xcXC98JCkpL2kpO1xuXHRcdGlmIChtYXRjaCkge1xuXHRcdFx0dXJsT2JqLmhvc3QgPSBtYXRjaFsxXTtcblx0XHRcdHVybFN1YiA9IHVybFN1Yi5zdWJzdHIobWF0Y2hbMF0ubGVuZ3RoKTtcblx0XHR9XG5cdFx0bWF0Y2ggPSB1cmxTdWIubWF0Y2goL15cXC8oLio/KSg/PShcXD98I3wkKSkvaSk7XG5cdFx0aWYgKG1hdGNoKSB7XG5cdFx0XHR1cmxPYmoucGF0aCA9IG1hdGNoWzFdO1xuXHRcdFx0dXJsU3ViID0gdXJsU3ViLnN1YnN0cihtYXRjaFswXS5sZW5ndGgpO1xuXHRcdH1cblx0XHRtYXRjaCA9IHVybFN1Yi5tYXRjaCgvXlxcPyguKj8pKD89KCN8JCkpL2kpO1xuXHRcdGlmIChtYXRjaCkge1xuXHRcdFx0dXJsT2JqLnF1ZXJ5ID0gbWF0Y2hbMV07XG5cdFx0XHR1cmxTdWIgPSB1cmxTdWIuc3Vic3RyKG1hdGNoWzBdLmxlbmd0aCk7XG5cdFx0fVxuXHRcdG1hdGNoID0gdXJsU3ViLm1hdGNoKC9eIyguKj8pJC9pKTtcblx0XHRpZiAobWF0Y2gpIHtcblx0XHRcdHVybE9iai5mcmFnbWVudCA9IG1hdGNoWzFdO1xuXHRcdFx0Ly91cmxTdWIgPSB1cmxTdWIuc3Vic3RyKG1hdGNoWzBdLmxlbmd0aCk7ICAtLSBub3QgdXNlZC4gVW5jb21tZW50IGlmIGFkZGluZyBhbm90aGVyIGJsb2NrLlxuXHRcdH1cblx0XHRyZXR1cm4gdXJsT2JqO1xuXHR9O1xuXG5cdHZhciBidWlsZFVybCA9IGZ1bmN0aW9uKHVybE9iail7XG5cdFx0dmFyIHVybCA9IFwiXCI7XG5cdFx0aWYgKHVybE9iai5zY2hlbWUgJiYgdXJsT2JqLmhvc3QpIHtcblx0XHRcdHVybCArPSB1cmxPYmouc2NoZW1lICsgXCI6Ly9cIjtcblx0XHR9XG5cdFx0aWYgKHVybE9iai5ob3N0KSB7XG5cdFx0XHR1cmwgKz0gdXJsT2JqLmhvc3Q7XG5cdFx0fVxuXHRcdGlmICh1cmxPYmoucGF0aCkge1xuXHRcdFx0dXJsICs9IFwiL1wiICsgdXJsT2JqLnBhdGg7XG5cdFx0fVxuXHRcdGlmICh1cmxPYmoucXVlcnkpIHtcblx0XHRcdHVybCArPSBcIj9cIiArIHVybE9iai5xdWVyeTtcblx0XHR9XG5cdFx0aWYgKHVybE9iai5mcmFnbWVudCkge1xuXHRcdFx0dXJsICs9IFwiI1wiICsgdXJsT2JqLmZyYWdtZW50O1xuXHRcdH1cblx0XHRyZXR1cm4gdXJsO1xuXHR9O1xuXG5cdHZhciBidWlsZFNlZ21lbnQgPSBmdW5jdGlvbihzZWdtZW50LCByZW1haW5pbmdBdmFpbGFibGVMZW5ndGgpe1xuXHRcdHZhciByZW1haW5pbmdBdmFpbGFibGVMZW5ndGhIYWxmID0gcmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoLyAyLFxuXHRcdFx0XHRzdGFydE9mZnNldCA9IE1hdGguY2VpbChyZW1haW5pbmdBdmFpbGFibGVMZW5ndGhIYWxmKSxcblx0XHRcdFx0ZW5kT2Zmc2V0ID0gKC0xKSpNYXRoLmZsb29yKHJlbWFpbmluZ0F2YWlsYWJsZUxlbmd0aEhhbGYpLFxuXHRcdFx0XHRlbmQgPSBcIlwiO1xuXHRcdGlmIChlbmRPZmZzZXQgPCAwKSB7XG5cdFx0XHRlbmQgPSBzZWdtZW50LnN1YnN0cihlbmRPZmZzZXQpO1xuXHRcdH1cblx0XHRyZXR1cm4gc2VnbWVudC5zdWJzdHIoMCwgc3RhcnRPZmZzZXQpICsgZWxsaXBzaXNDaGFycyArIGVuZDtcblx0fTtcblx0aWYgKHVybC5sZW5ndGggPD0gdHJ1bmNhdGVMZW4pIHtcblx0XHRyZXR1cm4gdXJsO1xuXHR9XG5cdHZhciBhdmFpbGFibGVMZW5ndGggPSB0cnVuY2F0ZUxlbiAtIGVsbGlwc2lzQ2hhcnMubGVuZ3RoO1xuXHR2YXIgdXJsT2JqID0gcGFyc2VfdXJsKHVybCk7XG5cdC8vIENsZWFuIHVwIHRoZSBVUkxcblx0aWYgKHVybE9iai5xdWVyeSkge1xuXHRcdHZhciBtYXRjaFF1ZXJ5ID0gdXJsT2JqLnF1ZXJ5Lm1hdGNoKC9eKC4qPykoPz0oXFw/fFxcIykpKC4qPykkL2kpO1xuXHRcdGlmIChtYXRjaFF1ZXJ5KSB7XG5cdFx0XHQvLyBNYWxmb3JtZWQgVVJMOyB0d28gb3IgbW9yZSBcIj9cIi4gUmVtb3ZlZCBhbnkgY29udGVudCBiZWhpbmQgdGhlIDJuZC5cblx0XHRcdHVybE9iai5xdWVyeSA9IHVybE9iai5xdWVyeS5zdWJzdHIoMCwgbWF0Y2hRdWVyeVsxXS5sZW5ndGgpO1xuXHRcdFx0dXJsID0gYnVpbGRVcmwodXJsT2JqKTtcblx0XHR9XG5cdH1cblx0aWYgKHVybC5sZW5ndGggPD0gdHJ1bmNhdGVMZW4pIHtcblx0XHRyZXR1cm4gdXJsO1xuXHR9XG5cdGlmICh1cmxPYmouaG9zdCkge1xuXHRcdHVybE9iai5ob3N0ID0gdXJsT2JqLmhvc3QucmVwbGFjZSgvXnd3d1xcLi8sIFwiXCIpO1xuXHRcdHVybCA9IGJ1aWxkVXJsKHVybE9iaik7XG5cdH1cblx0aWYgKHVybC5sZW5ndGggPD0gdHJ1bmNhdGVMZW4pIHtcblx0XHRyZXR1cm4gdXJsO1xuXHR9XG5cdC8vIFByb2Nlc3MgYW5kIGJ1aWxkIHRoZSBVUkxcblx0dmFyIHN0ciA9IFwiXCI7XG5cdGlmICh1cmxPYmouaG9zdCkge1xuXHRcdHN0ciArPSB1cmxPYmouaG9zdDtcblx0fVxuXHRpZiAoc3RyLmxlbmd0aCA+PSBhdmFpbGFibGVMZW5ndGgpIHtcblx0XHRpZiAodXJsT2JqLmhvc3QubGVuZ3RoID09IHRydW5jYXRlTGVuKSB7XG5cdFx0XHRyZXR1cm4gKHVybE9iai5ob3N0LnN1YnN0cigwLCAodHJ1bmNhdGVMZW4gLSBlbGxpcHNpc0NoYXJzLmxlbmd0aCkpICsgZWxsaXBzaXNDaGFycykuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcblx0XHR9XG5cdFx0cmV0dXJuIGJ1aWxkU2VnbWVudChzdHIsIGF2YWlsYWJsZUxlbmd0aCkuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcblx0fVxuXHR2YXIgcGF0aEFuZFF1ZXJ5ID0gXCJcIjtcblx0aWYgKHVybE9iai5wYXRoKSB7XG5cdFx0cGF0aEFuZFF1ZXJ5ICs9IFwiL1wiICsgdXJsT2JqLnBhdGg7XG5cdH1cblx0aWYgKHVybE9iai5xdWVyeSkge1xuXHRcdHBhdGhBbmRRdWVyeSArPSBcIj9cIiArIHVybE9iai5xdWVyeTtcblx0fVxuXHRpZiAocGF0aEFuZFF1ZXJ5KSB7XG5cdFx0aWYgKChzdHIrcGF0aEFuZFF1ZXJ5KS5sZW5ndGggPj0gYXZhaWxhYmxlTGVuZ3RoKSB7XG5cdFx0XHRpZiAoKHN0citwYXRoQW5kUXVlcnkpLmxlbmd0aCA9PSB0cnVuY2F0ZUxlbikge1xuXHRcdFx0XHRyZXR1cm4gKHN0ciArIHBhdGhBbmRRdWVyeSkuc3Vic3RyKDAsIHRydW5jYXRlTGVuKTtcblx0XHRcdH1cblx0XHRcdHZhciByZW1haW5pbmdBdmFpbGFibGVMZW5ndGggPSBhdmFpbGFibGVMZW5ndGggLSBzdHIubGVuZ3RoO1xuXHRcdFx0cmV0dXJuIChzdHIgKyBidWlsZFNlZ21lbnQocGF0aEFuZFF1ZXJ5LCByZW1haW5pbmdBdmFpbGFibGVMZW5ndGgpKS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRzdHIgKz0gcGF0aEFuZFF1ZXJ5O1xuXHRcdH1cblx0fVxuXHRpZiAodXJsT2JqLmZyYWdtZW50KSB7XG5cdFx0dmFyIGZyYWdtZW50ID0gXCIjXCIrdXJsT2JqLmZyYWdtZW50O1xuXHRcdGlmICgoc3RyK2ZyYWdtZW50KS5sZW5ndGggPj0gYXZhaWxhYmxlTGVuZ3RoKSB7XG5cdFx0XHRpZiAoKHN0citmcmFnbWVudCkubGVuZ3RoID09IHRydW5jYXRlTGVuKSB7XG5cdFx0XHRcdHJldHVybiAoc3RyICsgZnJhZ21lbnQpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG5cdFx0XHR9XG5cdFx0XHR2YXIgcmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoMiA9IGF2YWlsYWJsZUxlbmd0aCAtIHN0ci5sZW5ndGg7XG5cdFx0XHRyZXR1cm4gKHN0ciArIGJ1aWxkU2VnbWVudChmcmFnbWVudCwgcmVtYWluaW5nQXZhaWxhYmxlTGVuZ3RoMikpLnN1YnN0cigwLCB0cnVuY2F0ZUxlbik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHN0ciArPSBmcmFnbWVudDtcblx0XHR9XG5cdH1cblx0aWYgKHVybE9iai5zY2hlbWUgJiYgdXJsT2JqLmhvc3QpIHtcblx0XHR2YXIgc2NoZW1lID0gdXJsT2JqLnNjaGVtZSArIFwiOi8vXCI7XG5cdFx0aWYgKChzdHIrc2NoZW1lKS5sZW5ndGggPCBhdmFpbGFibGVMZW5ndGgpIHtcblx0XHRcdHJldHVybiAoc2NoZW1lICsgc3RyKS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xuXHRcdH1cblx0fVxuXHRpZiAoc3RyLmxlbmd0aCA8PSB0cnVuY2F0ZUxlbikge1xuXHRcdHJldHVybiBzdHI7XG5cdH1cblx0dmFyIGVuZCA9IFwiXCI7XG5cdGlmIChhdmFpbGFibGVMZW5ndGggPiAwKSB7XG5cdFx0ZW5kID0gc3RyLnN1YnN0cigoLTEpKk1hdGguZmxvb3IoYXZhaWxhYmxlTGVuZ3RoLzIpKTtcblx0fVxuXHRyZXR1cm4gKHN0ci5zdWJzdHIoMCwgTWF0aC5jZWlsKGF2YWlsYWJsZUxlbmd0aC8yKSkgKyBlbGxpcHNpc0NoYXJzICsgZW5kKS5zdWJzdHIoMCwgdHJ1bmNhdGVMZW4pO1xufTtcblxucmV0dXJuIEF1dG9saW5rZXI7XG5cbn0pKTtcbiIsIjsoZnVuY3Rpb24gKCkge1xuXHQndXNlIHN0cmljdCc7XG5cblx0LyoqXG5cdCAqIEBwcmVzZXJ2ZSBGYXN0Q2xpY2s6IHBvbHlmaWxsIHRvIHJlbW92ZSBjbGljayBkZWxheXMgb24gYnJvd3NlcnMgd2l0aCB0b3VjaCBVSXMuXG5cdCAqXG5cdCAqIEBjb2RpbmdzdGFuZGFyZCBmdGxhYnMtanN2MlxuXHQgKiBAY29weXJpZ2h0IFRoZSBGaW5hbmNpYWwgVGltZXMgTGltaXRlZCBbQWxsIFJpZ2h0cyBSZXNlcnZlZF1cblx0ICogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKHNlZSBMSUNFTlNFLnR4dClcblx0ICovXG5cblx0Lypqc2xpbnQgYnJvd3Nlcjp0cnVlLCBub2RlOnRydWUqL1xuXHQvKmdsb2JhbCBkZWZpbmUsIEV2ZW50LCBOb2RlKi9cblxuXG5cdC8qKlxuXHQgKiBJbnN0YW50aWF0ZSBmYXN0LWNsaWNraW5nIGxpc3RlbmVycyBvbiB0aGUgc3BlY2lmaWVkIGxheWVyLlxuXHQgKlxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtIHtFbGVtZW50fSBsYXllciBUaGUgbGF5ZXIgdG8gbGlzdGVuIG9uXG5cdCAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucz17fV0gVGhlIG9wdGlvbnMgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHRzXG5cdCAqL1xuXHRmdW5jdGlvbiBGYXN0Q2xpY2sobGF5ZXIsIG9wdGlvbnMpIHtcblx0XHR2YXIgb2xkT25DbGljaztcblxuXHRcdG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG5cdFx0LyoqXG5cdFx0ICogV2hldGhlciBhIGNsaWNrIGlzIGN1cnJlbnRseSBiZWluZyB0cmFja2VkLlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgYm9vbGVhblxuXHRcdCAqL1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXG5cblx0XHQvKipcblx0XHQgKiBUaW1lc3RhbXAgZm9yIHdoZW4gY2xpY2sgdHJhY2tpbmcgc3RhcnRlZC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gMDtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGVsZW1lbnQgYmVpbmcgdHJhY2tlZCBmb3IgYSBjbGljay5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIEV2ZW50VGFyZ2V0XG5cdFx0ICovXG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblxuXG5cdFx0LyoqXG5cdFx0ICogWC1jb29yZGluYXRlIG9mIHRvdWNoIHN0YXJ0IGV2ZW50LlxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50b3VjaFN0YXJ0WCA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFktY29vcmRpbmF0ZSBvZiB0b3VjaCBzdGFydCBldmVudC5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMudG91Y2hTdGFydFkgPSAwO1xuXG5cblx0XHQvKipcblx0XHQgKiBJRCBvZiB0aGUgbGFzdCB0b3VjaCwgcmV0cmlldmVkIGZyb20gVG91Y2guaWRlbnRpZmllci5cblx0XHQgKlxuXHRcdCAqIEB0eXBlIG51bWJlclxuXHRcdCAqL1xuXHRcdHRoaXMubGFzdFRvdWNoSWRlbnRpZmllciA9IDA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRvdWNobW92ZSBib3VuZGFyeSwgYmV5b25kIHdoaWNoIGEgY2xpY2sgd2lsbCBiZSBjYW5jZWxsZWQuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRvdWNoQm91bmRhcnkgPSBvcHRpb25zLnRvdWNoQm91bmRhcnkgfHwgMTA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBGYXN0Q2xpY2sgbGF5ZXIuXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBFbGVtZW50XG5cdFx0ICovXG5cdFx0dGhpcy5sYXllciA9IGxheWVyO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIG1pbmltdW0gdGltZSBiZXR3ZWVuIHRhcCh0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCkgZXZlbnRzXG5cdFx0ICpcblx0XHQgKiBAdHlwZSBudW1iZXJcblx0XHQgKi9cblx0XHR0aGlzLnRhcERlbGF5ID0gb3B0aW9ucy50YXBEZWxheSB8fCAyMDA7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgbWF4aW11bSB0aW1lIGZvciBhIHRhcFxuXHRcdCAqXG5cdFx0ICogQHR5cGUgbnVtYmVyXG5cdFx0ICovXG5cdFx0dGhpcy50YXBUaW1lb3V0ID0gb3B0aW9ucy50YXBUaW1lb3V0IHx8IDcwMDtcblxuXHRcdGlmIChGYXN0Q2xpY2subm90TmVlZGVkKGxheWVyKSkge1xuXHRcdFx0cmV0dXJuO1xuXHRcdH1cblxuXHRcdC8vIFNvbWUgb2xkIHZlcnNpb25zIG9mIEFuZHJvaWQgZG9uJ3QgaGF2ZSBGdW5jdGlvbi5wcm90b3R5cGUuYmluZFxuXHRcdGZ1bmN0aW9uIGJpbmQobWV0aG9kLCBjb250ZXh0KSB7XG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7IHJldHVybiBtZXRob2QuYXBwbHkoY29udGV4dCwgYXJndW1lbnRzKTsgfTtcblx0XHR9XG5cblxuXHRcdHZhciBtZXRob2RzID0gWydvbk1vdXNlJywgJ29uQ2xpY2snLCAnb25Ub3VjaFN0YXJ0JywgJ29uVG91Y2hNb3ZlJywgJ29uVG91Y2hFbmQnLCAnb25Ub3VjaENhbmNlbCddO1xuXHRcdHZhciBjb250ZXh0ID0gdGhpcztcblx0XHRmb3IgKHZhciBpID0gMCwgbCA9IG1ldGhvZHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG5cdFx0XHRjb250ZXh0W21ldGhvZHNbaV1dID0gYmluZChjb250ZXh0W21ldGhvZHNbaV1dLCBjb250ZXh0KTtcblx0XHR9XG5cblx0XHQvLyBTZXQgdXAgZXZlbnQgaGFuZGxlcnMgYXMgcmVxdWlyZWRcblx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW92ZXInLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNldXAnLCB0aGlzLm9uTW91c2UsIHRydWUpO1xuXHRcdH1cblxuXHRcdGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgdGhpcy5vbkNsaWNrLCB0cnVlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0JywgdGhpcy5vblRvdWNoU3RhcnQsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaG1vdmUnLCB0aGlzLm9uVG91Y2hNb3ZlLCBmYWxzZSk7XG5cdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCB0aGlzLm9uVG91Y2hFbmQsIGZhbHNlKTtcblx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGNhbmNlbCcsIHRoaXMub25Ub3VjaENhbmNlbCwgZmFsc2UpO1xuXG5cdFx0Ly8gSGFjayBpcyByZXF1aXJlZCBmb3IgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IEV2ZW50I3N0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiAoZS5nLiBBbmRyb2lkIDIpXG5cdFx0Ly8gd2hpY2ggaXMgaG93IEZhc3RDbGljayBub3JtYWxseSBzdG9wcyBjbGljayBldmVudHMgYnViYmxpbmcgdG8gY2FsbGJhY2tzIHJlZ2lzdGVyZWQgb24gdGhlIEZhc3RDbGlja1xuXHRcdC8vIGxheWVyIHdoZW4gdGhleSBhcmUgY2FuY2VsbGVkLlxuXHRcdGlmICghRXZlbnQucHJvdG90eXBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbikge1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKSB7XG5cdFx0XHRcdHZhciBybXYgPSBOb2RlLnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyO1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gJ2NsaWNrJykge1xuXHRcdFx0XHRcdHJtdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjay5oaWphY2tlZCB8fCBjYWxsYmFjaywgY2FwdHVyZSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cm12LmNhbGwobGF5ZXIsIHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblxuXHRcdFx0bGF5ZXIuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGNhbGxiYWNrLCBjYXB0dXJlKSB7XG5cdFx0XHRcdHZhciBhZHYgPSBOb2RlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuXHRcdFx0XHRpZiAodHlwZSA9PT0gJ2NsaWNrJykge1xuXHRcdFx0XHRcdGFkdi5jYWxsKGxheWVyLCB0eXBlLCBjYWxsYmFjay5oaWphY2tlZCB8fCAoY2FsbGJhY2suaGlqYWNrZWQgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdFx0XHRcdFx0aWYgKCFldmVudC5wcm9wYWdhdGlvblN0b3BwZWQpIHtcblx0XHRcdFx0XHRcdFx0Y2FsbGJhY2soZXZlbnQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pLCBjYXB0dXJlKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRhZHYuY2FsbChsYXllciwgdHlwZSwgY2FsbGJhY2ssIGNhcHR1cmUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH1cblxuXHRcdC8vIElmIGEgaGFuZGxlciBpcyBhbHJlYWR5IGRlY2xhcmVkIGluIHRoZSBlbGVtZW50J3Mgb25jbGljayBhdHRyaWJ1dGUsIGl0IHdpbGwgYmUgZmlyZWQgYmVmb3JlXG5cdFx0Ly8gRmFzdENsaWNrJ3Mgb25DbGljayBoYW5kbGVyLiBGaXggdGhpcyBieSBwdWxsaW5nIG91dCB0aGUgdXNlci1kZWZpbmVkIGhhbmRsZXIgZnVuY3Rpb24gYW5kXG5cdFx0Ly8gYWRkaW5nIGl0IGFzIGxpc3RlbmVyLlxuXHRcdGlmICh0eXBlb2YgbGF5ZXIub25jbGljayA9PT0gJ2Z1bmN0aW9uJykge1xuXG5cdFx0XHQvLyBBbmRyb2lkIGJyb3dzZXIgb24gYXQgbGVhc3QgMy4yIHJlcXVpcmVzIGEgbmV3IHJlZmVyZW5jZSB0byB0aGUgZnVuY3Rpb24gaW4gbGF5ZXIub25jbGlja1xuXHRcdFx0Ly8gLSB0aGUgb2xkIG9uZSB3b24ndCB3b3JrIGlmIHBhc3NlZCB0byBhZGRFdmVudExpc3RlbmVyIGRpcmVjdGx5LlxuXHRcdFx0b2xkT25DbGljayA9IGxheWVyLm9uY2xpY2s7XG5cdFx0XHRsYXllci5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0XHRcdG9sZE9uQ2xpY2soZXZlbnQpO1xuXHRcdFx0fSwgZmFsc2UpO1xuXHRcdFx0bGF5ZXIub25jbGljayA9IG51bGw7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCogV2luZG93cyBQaG9uZSA4LjEgZmFrZXMgdXNlciBhZ2VudCBzdHJpbmcgdG8gbG9vayBsaWtlIEFuZHJvaWQgYW5kIGlQaG9uZS5cblx0KlxuXHQqIEB0eXBlIGJvb2xlYW5cblx0Ki9cblx0dmFyIGRldmljZUlzV2luZG93c1Bob25lID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKFwiV2luZG93cyBQaG9uZVwiKSA+PSAwO1xuXG5cdC8qKlxuXHQgKiBBbmRyb2lkIHJlcXVpcmVzIGV4Y2VwdGlvbnMuXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0FuZHJvaWQgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSA+IDAgJiYgIWRldmljZUlzV2luZG93c1Bob25lO1xuXG5cblx0LyoqXG5cdCAqIGlPUyByZXF1aXJlcyBleGNlcHRpb25zLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1MgPSAvaVAoYWR8aG9uZXxvZCkvLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkgJiYgIWRldmljZUlzV2luZG93c1Bob25lO1xuXG5cblx0LyoqXG5cdCAqIGlPUyA0IHJlcXVpcmVzIGFuIGV4Y2VwdGlvbiBmb3Igc2VsZWN0IGVsZW1lbnRzLlxuXHQgKlxuXHQgKiBAdHlwZSBib29sZWFuXG5cdCAqL1xuXHR2YXIgZGV2aWNlSXNJT1M0ID0gZGV2aWNlSXNJT1MgJiYgKC9PUyA0X1xcZChfXFxkKT8vKS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpO1xuXG5cblx0LyoqXG5cdCAqIGlPUyA2LjAtNy4qIHJlcXVpcmVzIHRoZSB0YXJnZXQgZWxlbWVudCB0byBiZSBtYW51YWxseSBkZXJpdmVkXG5cdCAqXG5cdCAqIEB0eXBlIGJvb2xlYW5cblx0ICovXG5cdHZhciBkZXZpY2VJc0lPU1dpdGhCYWRUYXJnZXQgPSBkZXZpY2VJc0lPUyAmJiAoL09TIFs2LTddX1xcZC8pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XG5cblx0LyoqXG5cdCAqIEJsYWNrQmVycnkgcmVxdWlyZXMgZXhjZXB0aW9ucy5cblx0ICpcblx0ICogQHR5cGUgYm9vbGVhblxuXHQgKi9cblx0dmFyIGRldmljZUlzQmxhY2tCZXJyeTEwID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdCQjEwJykgPiAwO1xuXG5cdC8qKlxuXHQgKiBEZXRlcm1pbmUgd2hldGhlciBhIGdpdmVuIGVsZW1lbnQgcmVxdWlyZXMgYSBuYXRpdmUgY2xpY2suXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0IFRhcmdldCBET00gZWxlbWVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IG5lZWRzIGEgbmF0aXZlIGNsaWNrXG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm5lZWRzQ2xpY2sgPSBmdW5jdGlvbih0YXJnZXQpIHtcblx0XHRzd2l0Y2ggKHRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cblx0XHQvLyBEb24ndCBzZW5kIGEgc3ludGhldGljIGNsaWNrIHRvIGRpc2FibGVkIGlucHV0cyAoaXNzdWUgIzYyKVxuXHRcdGNhc2UgJ2J1dHRvbic6XG5cdFx0Y2FzZSAnc2VsZWN0Jzpcblx0XHRjYXNlICd0ZXh0YXJlYSc6XG5cdFx0XHRpZiAodGFyZ2V0LmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdpbnB1dCc6XG5cblx0XHRcdC8vIEZpbGUgaW5wdXRzIG5lZWQgcmVhbCBjbGlja3Mgb24gaU9TIDYgZHVlIHRvIGEgYnJvd3NlciBidWcgKGlzc3VlICM2OClcblx0XHRcdGlmICgoZGV2aWNlSXNJT1MgJiYgdGFyZ2V0LnR5cGUgPT09ICdmaWxlJykgfHwgdGFyZ2V0LmRpc2FibGVkKSB7XG5cdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHRicmVhaztcblx0XHRjYXNlICdsYWJlbCc6XG5cdFx0Y2FzZSAnaWZyYW1lJzogLy8gaU9TOCBob21lc2NyZWVuIGFwcHMgY2FuIHByZXZlbnQgZXZlbnRzIGJ1YmJsaW5nIGludG8gZnJhbWVzXG5cdFx0Y2FzZSAndmlkZW8nOlxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICgvXFxibmVlZHNjbGlja1xcYi8pLnRlc3QodGFyZ2V0LmNsYXNzTmFtZSk7XG5cdH07XG5cblxuXHQvKipcblx0ICogRGV0ZXJtaW5lIHdoZXRoZXIgYSBnaXZlbiBlbGVtZW50IHJlcXVpcmVzIGEgY2FsbCB0byBmb2N1cyB0byBzaW11bGF0ZSBjbGljayBpbnRvIGVsZW1lbnQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RWxlbWVudH0gdGFyZ2V0IFRhcmdldCBET00gZWxlbWVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyB0cnVlIGlmIHRoZSBlbGVtZW50IHJlcXVpcmVzIGEgY2FsbCB0byBmb2N1cyB0byBzaW11bGF0ZSBuYXRpdmUgY2xpY2suXG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm5lZWRzRm9jdXMgPSBmdW5jdGlvbih0YXJnZXQpIHtcblx0XHRzd2l0Y2ggKHRhcmdldC5ub2RlTmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cdFx0Y2FzZSAndGV4dGFyZWEnOlxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0Y2FzZSAnc2VsZWN0Jzpcblx0XHRcdHJldHVybiAhZGV2aWNlSXNBbmRyb2lkO1xuXHRcdGNhc2UgJ2lucHV0Jzpcblx0XHRcdHN3aXRjaCAodGFyZ2V0LnR5cGUpIHtcblx0XHRcdGNhc2UgJ2J1dHRvbic6XG5cdFx0XHRjYXNlICdjaGVja2JveCc6XG5cdFx0XHRjYXNlICdmaWxlJzpcblx0XHRcdGNhc2UgJ2ltYWdlJzpcblx0XHRcdGNhc2UgJ3JhZGlvJzpcblx0XHRcdGNhc2UgJ3N1Ym1pdCc6XG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gTm8gcG9pbnQgaW4gYXR0ZW1wdGluZyB0byBmb2N1cyBkaXNhYmxlZCBpbnB1dHNcblx0XHRcdHJldHVybiAhdGFyZ2V0LmRpc2FibGVkICYmICF0YXJnZXQucmVhZE9ubHk7XG5cdFx0ZGVmYXVsdDpcblx0XHRcdHJldHVybiAoL1xcYm5lZWRzZm9jdXNcXGIvKS50ZXN0KHRhcmdldC5jbGFzc05hbWUpO1xuXHRcdH1cblx0fTtcblxuXG5cdC8qKlxuXHQgKiBTZW5kIGEgY2xpY2sgZXZlbnQgdG8gdGhlIHNwZWNpZmllZCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEVsZW1lbnR9IHRhcmdldEVsZW1lbnRcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuc2VuZENsaWNrID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCwgZXZlbnQpIHtcblx0XHR2YXIgY2xpY2tFdmVudCwgdG91Y2g7XG5cblx0XHQvLyBPbiBzb21lIEFuZHJvaWQgZGV2aWNlcyBhY3RpdmVFbGVtZW50IG5lZWRzIHRvIGJlIGJsdXJyZWQgb3RoZXJ3aXNlIHRoZSBzeW50aGV0aWMgY2xpY2sgd2lsbCBoYXZlIG5vIGVmZmVjdCAoIzI0KVxuXHRcdGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICYmIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQgIT09IHRhcmdldEVsZW1lbnQpIHtcblx0XHRcdGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQuYmx1cigpO1xuXHRcdH1cblxuXHRcdHRvdWNoID0gZXZlbnQuY2hhbmdlZFRvdWNoZXNbMF07XG5cblx0XHQvLyBTeW50aGVzaXNlIGEgY2xpY2sgZXZlbnQsIHdpdGggYW4gZXh0cmEgYXR0cmlidXRlIHNvIGl0IGNhbiBiZSB0cmFja2VkXG5cdFx0Y2xpY2tFdmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpO1xuXHRcdGNsaWNrRXZlbnQuaW5pdE1vdXNlRXZlbnQodGhpcy5kZXRlcm1pbmVFdmVudFR5cGUodGFyZ2V0RWxlbWVudCksIHRydWUsIHRydWUsIHdpbmRvdywgMSwgdG91Y2guc2NyZWVuWCwgdG91Y2guc2NyZWVuWSwgdG91Y2guY2xpZW50WCwgdG91Y2guY2xpZW50WSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIDAsIG51bGwpO1xuXHRcdGNsaWNrRXZlbnQuZm9yd2FyZGVkVG91Y2hFdmVudCA9IHRydWU7XG5cdFx0dGFyZ2V0RWxlbWVudC5kaXNwYXRjaEV2ZW50KGNsaWNrRXZlbnQpO1xuXHR9O1xuXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZGV0ZXJtaW5lRXZlbnRUeXBlID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXG5cdFx0Ly9Jc3N1ZSAjMTU5OiBBbmRyb2lkIENocm9tZSBTZWxlY3QgQm94IGRvZXMgbm90IG9wZW4gd2l0aCBhIHN5bnRoZXRpYyBjbGljayBldmVudFxuXHRcdGlmIChkZXZpY2VJc0FuZHJvaWQgJiYgdGFyZ2V0RWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdzZWxlY3QnKSB7XG5cdFx0XHRyZXR1cm4gJ21vdXNlZG93bic7XG5cdFx0fVxuXG5cdFx0cmV0dXJuICdjbGljayc7XG5cdH07XG5cblxuXHQvKipcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmZvY3VzID0gZnVuY3Rpb24odGFyZ2V0RWxlbWVudCkge1xuXHRcdHZhciBsZW5ndGg7XG5cblx0XHQvLyBJc3N1ZSAjMTYwOiBvbiBpT1MgNywgc29tZSBpbnB1dCBlbGVtZW50cyAoZS5nLiBkYXRlIGRhdGV0aW1lIG1vbnRoKSB0aHJvdyBhIHZhZ3VlIFR5cGVFcnJvciBvbiBzZXRTZWxlY3Rpb25SYW5nZS4gVGhlc2UgZWxlbWVudHMgZG9uJ3QgaGF2ZSBhbiBpbnRlZ2VyIHZhbHVlIGZvciB0aGUgc2VsZWN0aW9uU3RhcnQgYW5kIHNlbGVjdGlvbkVuZCBwcm9wZXJ0aWVzLCBidXQgdW5mb3J0dW5hdGVseSB0aGF0IGNhbid0IGJlIHVzZWQgZm9yIGRldGVjdGlvbiBiZWNhdXNlIGFjY2Vzc2luZyB0aGUgcHJvcGVydGllcyBhbHNvIHRocm93cyBhIFR5cGVFcnJvci4gSnVzdCBjaGVjayB0aGUgdHlwZSBpbnN0ZWFkLiBGaWxlZCBhcyBBcHBsZSBidWcgIzE1MTIyNzI0LlxuXHRcdGlmIChkZXZpY2VJc0lPUyAmJiB0YXJnZXRFbGVtZW50LnNldFNlbGVjdGlvblJhbmdlICYmIHRhcmdldEVsZW1lbnQudHlwZS5pbmRleE9mKCdkYXRlJykgIT09IDAgJiYgdGFyZ2V0RWxlbWVudC50eXBlICE9PSAndGltZScgJiYgdGFyZ2V0RWxlbWVudC50eXBlICE9PSAnbW9udGgnKSB7XG5cdFx0XHRsZW5ndGggPSB0YXJnZXRFbGVtZW50LnZhbHVlLmxlbmd0aDtcblx0XHRcdHRhcmdldEVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2UobGVuZ3RoLCBsZW5ndGgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0YXJnZXRFbGVtZW50LmZvY3VzKCk7XG5cdFx0fVxuXHR9O1xuXG5cblx0LyoqXG5cdCAqIENoZWNrIHdoZXRoZXIgdGhlIGdpdmVuIHRhcmdldCBlbGVtZW50IGlzIGEgY2hpbGQgb2YgYSBzY3JvbGxhYmxlIGxheWVyIGFuZCBpZiBzbywgc2V0IGEgZmxhZyBvbiBpdC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldHxFbGVtZW50fSB0YXJnZXRFbGVtZW50XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLnVwZGF0ZVNjcm9sbFBhcmVudCA9IGZ1bmN0aW9uKHRhcmdldEVsZW1lbnQpIHtcblx0XHR2YXIgc2Nyb2xsUGFyZW50LCBwYXJlbnRFbGVtZW50O1xuXG5cdFx0c2Nyb2xsUGFyZW50ID0gdGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQ7XG5cblx0XHQvLyBBdHRlbXB0IHRvIGRpc2NvdmVyIHdoZXRoZXIgdGhlIHRhcmdldCBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gYSBzY3JvbGxhYmxlIGxheWVyLiBSZS1jaGVjayBpZiB0aGVcblx0XHQvLyB0YXJnZXQgZWxlbWVudCB3YXMgbW92ZWQgdG8gYW5vdGhlciBwYXJlbnQuXG5cdFx0aWYgKCFzY3JvbGxQYXJlbnQgfHwgIXNjcm9sbFBhcmVudC5jb250YWlucyh0YXJnZXRFbGVtZW50KSkge1xuXHRcdFx0cGFyZW50RWxlbWVudCA9IHRhcmdldEVsZW1lbnQ7XG5cdFx0XHRkbyB7XG5cdFx0XHRcdGlmIChwYXJlbnRFbGVtZW50LnNjcm9sbEhlaWdodCA+IHBhcmVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0KSB7XG5cdFx0XHRcdFx0c2Nyb2xsUGFyZW50ID0gcGFyZW50RWxlbWVudDtcblx0XHRcdFx0XHR0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudCA9IHBhcmVudEVsZW1lbnQ7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRwYXJlbnRFbGVtZW50ID0gcGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuXHRcdFx0fSB3aGlsZSAocGFyZW50RWxlbWVudCk7XG5cdFx0fVxuXG5cdFx0Ly8gQWx3YXlzIHVwZGF0ZSB0aGUgc2Nyb2xsIHRvcCB0cmFja2VyIGlmIHBvc3NpYmxlLlxuXHRcdGlmIChzY3JvbGxQYXJlbnQpIHtcblx0XHRcdHNjcm9sbFBhcmVudC5mYXN0Q2xpY2tMYXN0U2Nyb2xsVG9wID0gc2Nyb2xsUGFyZW50LnNjcm9sbFRvcDtcblx0XHR9XG5cdH07XG5cblxuXHQvKipcblx0ICogQHBhcmFtIHtFdmVudFRhcmdldH0gdGFyZ2V0RWxlbWVudFxuXHQgKiBAcmV0dXJucyB7RWxlbWVudHxFdmVudFRhcmdldH1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldCA9IGZ1bmN0aW9uKGV2ZW50VGFyZ2V0KSB7XG5cblx0XHQvLyBPbiBzb21lIG9sZGVyIGJyb3dzZXJzIChub3RhYmx5IFNhZmFyaSBvbiBpT1MgNC4xIC0gc2VlIGlzc3VlICM1NikgdGhlIGV2ZW50IHRhcmdldCBtYXkgYmUgYSB0ZXh0IG5vZGUuXG5cdFx0aWYgKGV2ZW50VGFyZ2V0Lm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuXHRcdFx0cmV0dXJuIGV2ZW50VGFyZ2V0LnBhcmVudE5vZGU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGV2ZW50VGFyZ2V0O1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIHRvdWNoIHN0YXJ0LCByZWNvcmQgdGhlIHBvc2l0aW9uIGFuZCBzY3JvbGwgb2Zmc2V0LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaFN0YXJ0ID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgdGFyZ2V0RWxlbWVudCwgdG91Y2gsIHNlbGVjdGlvbjtcblxuXHRcdC8vIElnbm9yZSBtdWx0aXBsZSB0b3VjaGVzLCBvdGhlcndpc2UgcGluY2gtdG8tem9vbSBpcyBwcmV2ZW50ZWQgaWYgYm90aCBmaW5nZXJzIGFyZSBvbiB0aGUgRmFzdENsaWNrIGVsZW1lbnQgKGlzc3VlICMxMTEpLlxuXHRcdGlmIChldmVudC50YXJnZXRUb3VjaGVzLmxlbmd0aCA+IDEpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHRhcmdldEVsZW1lbnQgPSB0aGlzLmdldFRhcmdldEVsZW1lbnRGcm9tRXZlbnRUYXJnZXQoZXZlbnQudGFyZ2V0KTtcblx0XHR0b3VjaCA9IGV2ZW50LnRhcmdldFRvdWNoZXNbMF07XG5cblx0XHRpZiAoZGV2aWNlSXNJT1MpIHtcblxuXHRcdFx0Ly8gT25seSB0cnVzdGVkIGV2ZW50cyB3aWxsIGRlc2VsZWN0IHRleHQgb24gaU9TIChpc3N1ZSAjNDkpXG5cdFx0XHRzZWxlY3Rpb24gPSB3aW5kb3cuZ2V0U2VsZWN0aW9uKCk7XG5cdFx0XHRpZiAoc2VsZWN0aW9uLnJhbmdlQ291bnQgJiYgIXNlbGVjdGlvbi5pc0NvbGxhcHNlZCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblxuXHRcdFx0aWYgKCFkZXZpY2VJc0lPUzQpIHtcblxuXHRcdFx0XHQvLyBXZWlyZCB0aGluZ3MgaGFwcGVuIG9uIGlPUyB3aGVuIGFuIGFsZXJ0IG9yIGNvbmZpcm0gZGlhbG9nIGlzIG9wZW5lZCBmcm9tIGEgY2xpY2sgZXZlbnQgY2FsbGJhY2sgKGlzc3VlICMyMyk6XG5cdFx0XHRcdC8vIHdoZW4gdGhlIHVzZXIgbmV4dCB0YXBzIGFueXdoZXJlIGVsc2Ugb24gdGhlIHBhZ2UsIG5ldyB0b3VjaHN0YXJ0IGFuZCB0b3VjaGVuZCBldmVudHMgYXJlIGRpc3BhdGNoZWRcblx0XHRcdFx0Ly8gd2l0aCB0aGUgc2FtZSBpZGVudGlmaWVyIGFzIHRoZSB0b3VjaCBldmVudCB0aGF0IHByZXZpb3VzbHkgdHJpZ2dlcmVkIHRoZSBjbGljayB0aGF0IHRyaWdnZXJlZCB0aGUgYWxlcnQuXG5cdFx0XHRcdC8vIFNhZGx5LCB0aGVyZSBpcyBhbiBpc3N1ZSBvbiBpT1MgNCB0aGF0IGNhdXNlcyBzb21lIG5vcm1hbCB0b3VjaCBldmVudHMgdG8gaGF2ZSB0aGUgc2FtZSBpZGVudGlmaWVyIGFzIGFuXG5cdFx0XHRcdC8vIGltbWVkaWF0ZWx5IHByZWNlZWRpbmcgdG91Y2ggZXZlbnQgKGlzc3VlICM1MiksIHNvIHRoaXMgZml4IGlzIHVuYXZhaWxhYmxlIG9uIHRoYXQgcGxhdGZvcm0uXG5cdFx0XHRcdC8vIElzc3VlIDEyMDogdG91Y2guaWRlbnRpZmllciBpcyAwIHdoZW4gQ2hyb21lIGRldiB0b29scyAnRW11bGF0ZSB0b3VjaCBldmVudHMnIGlzIHNldCB3aXRoIGFuIGlPUyBkZXZpY2UgVUEgc3RyaW5nLFxuXHRcdFx0XHQvLyB3aGljaCBjYXVzZXMgYWxsIHRvdWNoIGV2ZW50cyB0byBiZSBpZ25vcmVkLiBBcyB0aGlzIGJsb2NrIG9ubHkgYXBwbGllcyB0byBpT1MsIGFuZCBpT1MgaWRlbnRpZmllcnMgYXJlIGFsd2F5cyBsb25nLFxuXHRcdFx0XHQvLyByYW5kb20gaW50ZWdlcnMsIGl0J3Mgc2FmZSB0byB0byBjb250aW51ZSBpZiB0aGUgaWRlbnRpZmllciBpcyAwIGhlcmUuXG5cdFx0XHRcdGlmICh0b3VjaC5pZGVudGlmaWVyICYmIHRvdWNoLmlkZW50aWZpZXIgPT09IHRoaXMubGFzdFRvdWNoSWRlbnRpZmllcikge1xuXHRcdFx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGhpcy5sYXN0VG91Y2hJZGVudGlmaWVyID0gdG91Y2guaWRlbnRpZmllcjtcblxuXHRcdFx0XHQvLyBJZiB0aGUgdGFyZ2V0IGVsZW1lbnQgaXMgYSBjaGlsZCBvZiBhIHNjcm9sbGFibGUgbGF5ZXIgKHVzaW5nIC13ZWJraXQtb3ZlcmZsb3ctc2Nyb2xsaW5nOiB0b3VjaCkgYW5kOlxuXHRcdFx0XHQvLyAxKSB0aGUgdXNlciBkb2VzIGEgZmxpbmcgc2Nyb2xsIG9uIHRoZSBzY3JvbGxhYmxlIGxheWVyXG5cdFx0XHRcdC8vIDIpIHRoZSB1c2VyIHN0b3BzIHRoZSBmbGluZyBzY3JvbGwgd2l0aCBhbm90aGVyIHRhcFxuXHRcdFx0XHQvLyB0aGVuIHRoZSBldmVudC50YXJnZXQgb2YgdGhlIGxhc3QgJ3RvdWNoZW5kJyBldmVudCB3aWxsIGJlIHRoZSBlbGVtZW50IHRoYXQgd2FzIHVuZGVyIHRoZSB1c2VyJ3MgZmluZ2VyXG5cdFx0XHRcdC8vIHdoZW4gdGhlIGZsaW5nIHNjcm9sbCB3YXMgc3RhcnRlZCwgY2F1c2luZyBGYXN0Q2xpY2sgdG8gc2VuZCBhIGNsaWNrIGV2ZW50IHRvIHRoYXQgbGF5ZXIgLSB1bmxlc3MgYSBjaGVja1xuXHRcdFx0XHQvLyBpcyBtYWRlIHRvIGVuc3VyZSB0aGF0IGEgcGFyZW50IGxheWVyIHdhcyBub3Qgc2Nyb2xsZWQgYmVmb3JlIHNlbmRpbmcgYSBzeW50aGV0aWMgY2xpY2sgKGlzc3VlICM0MikuXG5cdFx0XHRcdHRoaXMudXBkYXRlU2Nyb2xsUGFyZW50KHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IHRydWU7XG5cdFx0dGhpcy50cmFja2luZ0NsaWNrU3RhcnQgPSBldmVudC50aW1lU3RhbXA7XG5cdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gdGFyZ2V0RWxlbWVudDtcblxuXHRcdHRoaXMudG91Y2hTdGFydFggPSB0b3VjaC5wYWdlWDtcblx0XHR0aGlzLnRvdWNoU3RhcnRZID0gdG91Y2gucGFnZVk7XG5cblx0XHQvLyBQcmV2ZW50IHBoYW50b20gY2xpY2tzIG9uIGZhc3QgZG91YmxlLXRhcCAoaXNzdWUgIzM2KVxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy5sYXN0Q2xpY2tUaW1lKSA8IHRoaXMudGFwRGVsYXkpIHtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH07XG5cblxuXHQvKipcblx0ICogQmFzZWQgb24gYSB0b3VjaG1vdmUgZXZlbnQgb2JqZWN0LCBjaGVjayB3aGV0aGVyIHRoZSB0b3VjaCBoYXMgbW92ZWQgcGFzdCBhIGJvdW5kYXJ5IHNpbmNlIGl0IHN0YXJ0ZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50XG5cdCAqIEByZXR1cm5zIHtib29sZWFufVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS50b3VjaEhhc01vdmVkID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHR2YXIgdG91Y2ggPSBldmVudC5jaGFuZ2VkVG91Y2hlc1swXSwgYm91bmRhcnkgPSB0aGlzLnRvdWNoQm91bmRhcnk7XG5cblx0XHRpZiAoTWF0aC5hYnModG91Y2gucGFnZVggLSB0aGlzLnRvdWNoU3RhcnRYKSA+IGJvdW5kYXJ5IHx8IE1hdGguYWJzKHRvdWNoLnBhZ2VZIC0gdGhpcy50b3VjaFN0YXJ0WSkgPiBib3VuZGFyeSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIFVwZGF0ZSB0aGUgbGFzdCBwb3NpdGlvbi5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hNb3ZlID0gZnVuY3Rpb24oZXZlbnQpIHtcblx0XHRpZiAoIXRoaXMudHJhY2tpbmdDbGljaykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgdGhlIHRvdWNoIGhhcyBtb3ZlZCwgY2FuY2VsIHRoZSBjbGljayB0cmFja2luZ1xuXHRcdGlmICh0aGlzLnRhcmdldEVsZW1lbnQgIT09IHRoaXMuZ2V0VGFyZ2V0RWxlbWVudEZyb21FdmVudFRhcmdldChldmVudC50YXJnZXQpIHx8IHRoaXMudG91Y2hIYXNNb3ZlZChldmVudCkpIHtcblx0XHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBBdHRlbXB0IHRvIGZpbmQgdGhlIGxhYmVsbGVkIGNvbnRyb2wgZm9yIHRoZSBnaXZlbiBsYWJlbCBlbGVtZW50LlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEhUTUxMYWJlbEVsZW1lbnR9IGxhYmVsRWxlbWVudFxuXHQgKiBAcmV0dXJucyB7RWxlbWVudHxudWxsfVxuXHQgKi9cblx0RmFzdENsaWNrLnByb3RvdHlwZS5maW5kQ29udHJvbCA9IGZ1bmN0aW9uKGxhYmVsRWxlbWVudCkge1xuXG5cdFx0Ly8gRmFzdCBwYXRoIGZvciBuZXdlciBicm93c2VycyBzdXBwb3J0aW5nIHRoZSBIVE1MNSBjb250cm9sIGF0dHJpYnV0ZVxuXHRcdGlmIChsYWJlbEVsZW1lbnQuY29udHJvbCAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRyZXR1cm4gbGFiZWxFbGVtZW50LmNvbnRyb2w7XG5cdFx0fVxuXG5cdFx0Ly8gQWxsIGJyb3dzZXJzIHVuZGVyIHRlc3QgdGhhdCBzdXBwb3J0IHRvdWNoIGV2ZW50cyBhbHNvIHN1cHBvcnQgdGhlIEhUTUw1IGh0bWxGb3IgYXR0cmlidXRlXG5cdFx0aWYgKGxhYmVsRWxlbWVudC5odG1sRm9yKSB7XG5cdFx0XHRyZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQobGFiZWxFbGVtZW50Lmh0bWxGb3IpO1xuXHRcdH1cblxuXHRcdC8vIElmIG5vIGZvciBhdHRyaWJ1dGUgZXhpc3RzLCBhdHRlbXB0IHRvIHJldHJpZXZlIHRoZSBmaXJzdCBsYWJlbGxhYmxlIGRlc2NlbmRhbnQgZWxlbWVudFxuXHRcdC8vIHRoZSBsaXN0IG9mIHdoaWNoIGlzIGRlZmluZWQgaGVyZTogaHR0cDovL3d3dy53My5vcmcvVFIvaHRtbDUvZm9ybXMuaHRtbCNjYXRlZ29yeS1sYWJlbFxuXHRcdHJldHVybiBsYWJlbEVsZW1lbnQucXVlcnlTZWxlY3RvcignYnV0dG9uLCBpbnB1dDpub3QoW3R5cGU9aGlkZGVuXSksIGtleWdlbiwgbWV0ZXIsIG91dHB1dCwgcHJvZ3Jlc3MsIHNlbGVjdCwgdGV4dGFyZWEnKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBPbiB0b3VjaCBlbmQsIGRldGVybWluZSB3aGV0aGVyIHRvIHNlbmQgYSBjbGljayBldmVudCBhdCBvbmNlLlxuXHQgKlxuXHQgKiBAcGFyYW0ge0V2ZW50fSBldmVudFxuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbn1cblx0ICovXG5cdEZhc3RDbGljay5wcm90b3R5cGUub25Ub3VjaEVuZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG5cdFx0dmFyIGZvckVsZW1lbnQsIHRyYWNraW5nQ2xpY2tTdGFydCwgdGFyZ2V0VGFnTmFtZSwgc2Nyb2xsUGFyZW50LCB0b3VjaCwgdGFyZ2V0RWxlbWVudCA9IHRoaXMudGFyZ2V0RWxlbWVudDtcblxuXHRcdGlmICghdGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBQcmV2ZW50IHBoYW50b20gY2xpY2tzIG9uIGZhc3QgZG91YmxlLXRhcCAoaXNzdWUgIzM2KVxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy5sYXN0Q2xpY2tUaW1lKSA8IHRoaXMudGFwRGVsYXkpIHtcblx0XHRcdHRoaXMuY2FuY2VsTmV4dENsaWNrID0gdHJ1ZTtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICgoZXZlbnQudGltZVN0YW1wIC0gdGhpcy50cmFja2luZ0NsaWNrU3RhcnQpID4gdGhpcy50YXBUaW1lb3V0KSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBSZXNldCB0byBwcmV2ZW50IHdyb25nIGNsaWNrIGNhbmNlbCBvbiBpbnB1dCAoaXNzdWUgIzE1NikuXG5cdFx0dGhpcy5jYW5jZWxOZXh0Q2xpY2sgPSBmYWxzZTtcblxuXHRcdHRoaXMubGFzdENsaWNrVGltZSA9IGV2ZW50LnRpbWVTdGFtcDtcblxuXHRcdHRyYWNraW5nQ2xpY2tTdGFydCA9IHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0O1xuXHRcdHRoaXMudHJhY2tpbmdDbGljayA9IGZhbHNlO1xuXHRcdHRoaXMudHJhY2tpbmdDbGlja1N0YXJ0ID0gMDtcblxuXHRcdC8vIE9uIHNvbWUgaU9TIGRldmljZXMsIHRoZSB0YXJnZXRFbGVtZW50IHN1cHBsaWVkIHdpdGggdGhlIGV2ZW50IGlzIGludmFsaWQgaWYgdGhlIGxheWVyXG5cdFx0Ly8gaXMgcGVyZm9ybWluZyBhIHRyYW5zaXRpb24gb3Igc2Nyb2xsLCBhbmQgaGFzIHRvIGJlIHJlLWRldGVjdGVkIG1hbnVhbGx5LiBOb3RlIHRoYXRcblx0XHQvLyBmb3IgdGhpcyB0byBmdW5jdGlvbiBjb3JyZWN0bHksIGl0IG11c3QgYmUgY2FsbGVkICphZnRlciogdGhlIGV2ZW50IHRhcmdldCBpcyBjaGVja2VkIVxuXHRcdC8vIFNlZSBpc3N1ZSAjNTc7IGFsc28gZmlsZWQgYXMgcmRhcjovLzEzMDQ4NTg5IC5cblx0XHRpZiAoZGV2aWNlSXNJT1NXaXRoQmFkVGFyZ2V0KSB7XG5cdFx0XHR0b3VjaCA9IGV2ZW50LmNoYW5nZWRUb3VjaGVzWzBdO1xuXG5cdFx0XHQvLyBJbiBjZXJ0YWluIGNhc2VzIGFyZ3VtZW50cyBvZiBlbGVtZW50RnJvbVBvaW50IGNhbiBiZSBuZWdhdGl2ZSwgc28gcHJldmVudCBzZXR0aW5nIHRhcmdldEVsZW1lbnQgdG8gbnVsbFxuXHRcdFx0dGFyZ2V0RWxlbWVudCA9IGRvY3VtZW50LmVsZW1lbnRGcm9tUG9pbnQodG91Y2gucGFnZVggLSB3aW5kb3cucGFnZVhPZmZzZXQsIHRvdWNoLnBhZ2VZIC0gd2luZG93LnBhZ2VZT2Zmc2V0KSB8fCB0YXJnZXRFbGVtZW50O1xuXHRcdFx0dGFyZ2V0RWxlbWVudC5mYXN0Q2xpY2tTY3JvbGxQYXJlbnQgPSB0aGlzLnRhcmdldEVsZW1lbnQuZmFzdENsaWNrU2Nyb2xsUGFyZW50O1xuXHRcdH1cblxuXHRcdHRhcmdldFRhZ05hbWUgPSB0YXJnZXRFbGVtZW50LnRhZ05hbWUudG9Mb3dlckNhc2UoKTtcblx0XHRpZiAodGFyZ2V0VGFnTmFtZSA9PT0gJ2xhYmVsJykge1xuXHRcdFx0Zm9yRWxlbWVudCA9IHRoaXMuZmluZENvbnRyb2wodGFyZ2V0RWxlbWVudCk7XG5cdFx0XHRpZiAoZm9yRWxlbWVudCkge1xuXHRcdFx0XHR0aGlzLmZvY3VzKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0XHRpZiAoZGV2aWNlSXNBbmRyb2lkKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0dGFyZ2V0RWxlbWVudCA9IGZvckVsZW1lbnQ7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmICh0aGlzLm5lZWRzRm9jdXModGFyZ2V0RWxlbWVudCkpIHtcblxuXHRcdFx0Ly8gQ2FzZSAxOiBJZiB0aGUgdG91Y2ggc3RhcnRlZCBhIHdoaWxlIGFnbyAoYmVzdCBndWVzcyBpcyAxMDBtcyBiYXNlZCBvbiB0ZXN0cyBmb3IgaXNzdWUgIzM2KSB0aGVuIGZvY3VzIHdpbGwgYmUgdHJpZ2dlcmVkIGFueXdheS4gUmV0dXJuIGVhcmx5IGFuZCB1bnNldCB0aGUgdGFyZ2V0IGVsZW1lbnQgcmVmZXJlbmNlIHNvIHRoYXQgdGhlIHN1YnNlcXVlbnQgY2xpY2sgd2lsbCBiZSBhbGxvd2VkIHRocm91Z2guXG5cdFx0XHQvLyBDYXNlIDI6IFdpdGhvdXQgdGhpcyBleGNlcHRpb24gZm9yIGlucHV0IGVsZW1lbnRzIHRhcHBlZCB3aGVuIHRoZSBkb2N1bWVudCBpcyBjb250YWluZWQgaW4gYW4gaWZyYW1lLCB0aGVuIGFueSBpbnB1dHRlZCB0ZXh0IHdvbid0IGJlIHZpc2libGUgZXZlbiB0aG91Z2ggdGhlIHZhbHVlIGF0dHJpYnV0ZSBpcyB1cGRhdGVkIGFzIHRoZSB1c2VyIHR5cGVzIChpc3N1ZSAjMzcpLlxuXHRcdFx0aWYgKChldmVudC50aW1lU3RhbXAgLSB0cmFja2luZ0NsaWNrU3RhcnQpID4gMTAwIHx8IChkZXZpY2VJc0lPUyAmJiB3aW5kb3cudG9wICE9PSB3aW5kb3cgJiYgdGFyZ2V0VGFnTmFtZSA9PT0gJ2lucHV0JykpIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLmZvY3VzKHRhcmdldEVsZW1lbnQpO1xuXHRcdFx0dGhpcy5zZW5kQ2xpY2sodGFyZ2V0RWxlbWVudCwgZXZlbnQpO1xuXG5cdFx0XHQvLyBTZWxlY3QgZWxlbWVudHMgbmVlZCB0aGUgZXZlbnQgdG8gZ28gdGhyb3VnaCBvbiBpT1MgNCwgb3RoZXJ3aXNlIHRoZSBzZWxlY3RvciBtZW51IHdvbid0IG9wZW4uXG5cdFx0XHQvLyBBbHNvIHRoaXMgYnJlYWtzIG9wZW5pbmcgc2VsZWN0cyB3aGVuIFZvaWNlT3ZlciBpcyBhY3RpdmUgb24gaU9TNiwgaU9TNyAoYW5kIHBvc3NpYmx5IG90aGVycylcblx0XHRcdGlmICghZGV2aWNlSXNJT1MgfHwgdGFyZ2V0VGFnTmFtZSAhPT0gJ3NlbGVjdCcpIHtcblx0XHRcdFx0dGhpcy50YXJnZXRFbGVtZW50ID0gbnVsbDtcblx0XHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdGlmIChkZXZpY2VJc0lPUyAmJiAhZGV2aWNlSXNJT1M0KSB7XG5cblx0XHRcdC8vIERvbid0IHNlbmQgYSBzeW50aGV0aWMgY2xpY2sgZXZlbnQgaWYgdGhlIHRhcmdldCBlbGVtZW50IGlzIGNvbnRhaW5lZCB3aXRoaW4gYSBwYXJlbnQgbGF5ZXIgdGhhdCB3YXMgc2Nyb2xsZWRcblx0XHRcdC8vIGFuZCB0aGlzIHRhcCBpcyBiZWluZyB1c2VkIHRvIHN0b3AgdGhlIHNjcm9sbGluZyAodXN1YWxseSBpbml0aWF0ZWQgYnkgYSBmbGluZyAtIGlzc3VlICM0MikuXG5cdFx0XHRzY3JvbGxQYXJlbnQgPSB0YXJnZXRFbGVtZW50LmZhc3RDbGlja1Njcm9sbFBhcmVudDtcblx0XHRcdGlmIChzY3JvbGxQYXJlbnQgJiYgc2Nyb2xsUGFyZW50LmZhc3RDbGlja0xhc3RTY3JvbGxUb3AgIT09IHNjcm9sbFBhcmVudC5zY3JvbGxUb3ApIHtcblx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gUHJldmVudCB0aGUgYWN0dWFsIGNsaWNrIGZyb20gZ29pbmcgdGhvdWdoIC0gdW5sZXNzIHRoZSB0YXJnZXQgbm9kZSBpcyBtYXJrZWQgYXMgcmVxdWlyaW5nXG5cdFx0Ly8gcmVhbCBjbGlja3Mgb3IgaWYgaXQgaXMgaW4gdGhlIHdoaXRlbGlzdCBpbiB3aGljaCBjYXNlIG9ubHkgbm9uLXByb2dyYW1tYXRpYyBjbGlja3MgYXJlIHBlcm1pdHRlZC5cblx0XHRpZiAoIXRoaXMubmVlZHNDbGljayh0YXJnZXRFbGVtZW50KSkge1xuXHRcdFx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0XHRcdHRoaXMuc2VuZENsaWNrKHRhcmdldEVsZW1lbnQsIGV2ZW50KTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH07XG5cblxuXHQvKipcblx0ICogT24gdG91Y2ggY2FuY2VsLCBzdG9wIHRyYWNraW5nIHRoZSBjbGljay5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uVG91Y2hDYW5jZWwgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnRyYWNraW5nQ2xpY2sgPSBmYWxzZTtcblx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIERldGVybWluZSBtb3VzZSBldmVudHMgd2hpY2ggc2hvdWxkIGJlIHBlcm1pdHRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uTW91c2UgPSBmdW5jdGlvbihldmVudCkge1xuXG5cdFx0Ly8gSWYgYSB0YXJnZXQgZWxlbWVudCB3YXMgbmV2ZXIgc2V0IChiZWNhdXNlIGEgdG91Y2ggZXZlbnQgd2FzIG5ldmVyIGZpcmVkKSBhbGxvdyB0aGUgZXZlbnRcblx0XHRpZiAoIXRoaXMudGFyZ2V0RWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0aWYgKGV2ZW50LmZvcndhcmRlZFRvdWNoRXZlbnQpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIFByb2dyYW1tYXRpY2FsbHkgZ2VuZXJhdGVkIGV2ZW50cyB0YXJnZXRpbmcgYSBzcGVjaWZpYyBlbGVtZW50IHNob3VsZCBiZSBwZXJtaXR0ZWRcblx0XHRpZiAoIWV2ZW50LmNhbmNlbGFibGUpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdC8vIERlcml2ZSBhbmQgY2hlY2sgdGhlIHRhcmdldCBlbGVtZW50IHRvIHNlZSB3aGV0aGVyIHRoZSBtb3VzZSBldmVudCBuZWVkcyB0byBiZSBwZXJtaXR0ZWQ7XG5cdFx0Ly8gdW5sZXNzIGV4cGxpY2l0bHkgZW5hYmxlZCwgcHJldmVudCBub24tdG91Y2ggY2xpY2sgZXZlbnRzIGZyb20gdHJpZ2dlcmluZyBhY3Rpb25zLFxuXHRcdC8vIHRvIHByZXZlbnQgZ2hvc3QvZG91YmxlY2xpY2tzLlxuXHRcdGlmICghdGhpcy5uZWVkc0NsaWNrKHRoaXMudGFyZ2V0RWxlbWVudCkgfHwgdGhpcy5jYW5jZWxOZXh0Q2xpY2spIHtcblxuXHRcdFx0Ly8gUHJldmVudCBhbnkgdXNlci1hZGRlZCBsaXN0ZW5lcnMgZGVjbGFyZWQgb24gRmFzdENsaWNrIGVsZW1lbnQgZnJvbSBiZWluZyBmaXJlZC5cblx0XHRcdGlmIChldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24pIHtcblx0XHRcdFx0ZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0XHR9IGVsc2Uge1xuXG5cdFx0XHRcdC8vIFBhcnQgb2YgdGhlIGhhY2sgZm9yIGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBFdmVudCNzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKGUuZy4gQW5kcm9pZCAyKVxuXHRcdFx0XHRldmVudC5wcm9wYWdhdGlvblN0b3BwZWQgPSB0cnVlO1xuXHRcdFx0fVxuXG5cdFx0XHQvLyBDYW5jZWwgdGhlIGV2ZW50XG5cdFx0XHRldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHRcdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHQvLyBJZiB0aGUgbW91c2UgZXZlbnQgaXMgcGVybWl0dGVkLCByZXR1cm4gdHJ1ZSBmb3IgdGhlIGFjdGlvbiB0byBnbyB0aHJvdWdoLlxuXHRcdHJldHVybiB0cnVlO1xuXHR9O1xuXG5cblx0LyoqXG5cdCAqIE9uIGFjdHVhbCBjbGlja3MsIGRldGVybWluZSB3aGV0aGVyIHRoaXMgaXMgYSB0b3VjaC1nZW5lcmF0ZWQgY2xpY2ssIGEgY2xpY2sgYWN0aW9uIG9jY3VycmluZ1xuXHQgKiBuYXR1cmFsbHkgYWZ0ZXIgYSBkZWxheSBhZnRlciBhIHRvdWNoICh3aGljaCBuZWVkcyB0byBiZSBjYW5jZWxsZWQgdG8gYXZvaWQgZHVwbGljYXRpb24pLCBvclxuXHQgKiBhbiBhY3R1YWwgY2xpY2sgd2hpY2ggc2hvdWxkIGJlIHBlcm1pdHRlZC5cblx0ICpcblx0ICogQHBhcmFtIHtFdmVudH0gZXZlbnRcblx0ICogQHJldHVybnMge2Jvb2xlYW59XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLm9uQ2xpY2sgPSBmdW5jdGlvbihldmVudCkge1xuXHRcdHZhciBwZXJtaXR0ZWQ7XG5cblx0XHQvLyBJdCdzIHBvc3NpYmxlIGZvciBhbm90aGVyIEZhc3RDbGljay1saWtlIGxpYnJhcnkgZGVsaXZlcmVkIHdpdGggdGhpcmQtcGFydHkgY29kZSB0byBmaXJlIGEgY2xpY2sgZXZlbnQgYmVmb3JlIEZhc3RDbGljayBkb2VzIChpc3N1ZSAjNDQpLiBJbiB0aGF0IGNhc2UsIHNldCB0aGUgY2xpY2stdHJhY2tpbmcgZmxhZyBiYWNrIHRvIGZhbHNlIGFuZCByZXR1cm4gZWFybHkuIFRoaXMgd2lsbCBjYXVzZSBvblRvdWNoRW5kIHRvIHJldHVybiBlYXJseS5cblx0XHRpZiAodGhpcy50cmFja2luZ0NsaWNrKSB7XG5cdFx0XHR0aGlzLnRhcmdldEVsZW1lbnQgPSBudWxsO1xuXHRcdFx0dGhpcy50cmFja2luZ0NsaWNrID0gZmFsc2U7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBWZXJ5IG9kZCBiZWhhdmlvdXIgb24gaU9TIChpc3N1ZSAjMTgpOiBpZiBhIHN1Ym1pdCBlbGVtZW50IGlzIHByZXNlbnQgaW5zaWRlIGEgZm9ybSBhbmQgdGhlIHVzZXIgaGl0cyBlbnRlciBpbiB0aGUgaU9TIHNpbXVsYXRvciBvciBjbGlja3MgdGhlIEdvIGJ1dHRvbiBvbiB0aGUgcG9wLXVwIE9TIGtleWJvYXJkIHRoZSBhIGtpbmQgb2YgJ2Zha2UnIGNsaWNrIGV2ZW50IHdpbGwgYmUgdHJpZ2dlcmVkIHdpdGggdGhlIHN1Ym1pdC10eXBlIGlucHV0IGVsZW1lbnQgYXMgdGhlIHRhcmdldC5cblx0XHRpZiAoZXZlbnQudGFyZ2V0LnR5cGUgPT09ICdzdWJtaXQnICYmIGV2ZW50LmRldGFpbCA9PT0gMCkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0cGVybWl0dGVkID0gdGhpcy5vbk1vdXNlKGV2ZW50KTtcblxuXHRcdC8vIE9ubHkgdW5zZXQgdGFyZ2V0RWxlbWVudCBpZiB0aGUgY2xpY2sgaXMgbm90IHBlcm1pdHRlZC4gVGhpcyB3aWxsIGVuc3VyZSB0aGF0IHRoZSBjaGVjayBmb3IgIXRhcmdldEVsZW1lbnQgaW4gb25Nb3VzZSBmYWlscyBhbmQgdGhlIGJyb3dzZXIncyBjbGljayBkb2Vzbid0IGdvIHRocm91Z2guXG5cdFx0aWYgKCFwZXJtaXR0ZWQpIHtcblx0XHRcdHRoaXMudGFyZ2V0RWxlbWVudCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0Ly8gSWYgY2xpY2tzIGFyZSBwZXJtaXR0ZWQsIHJldHVybiB0cnVlIGZvciB0aGUgYWN0aW9uIHRvIGdvIHRocm91Z2guXG5cdFx0cmV0dXJuIHBlcm1pdHRlZDtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBSZW1vdmUgYWxsIEZhc3RDbGljaydzIGV2ZW50IGxpc3RlbmVycy5cblx0ICpcblx0ICogQHJldHVybnMge3ZvaWR9XG5cdCAqL1xuXHRGYXN0Q2xpY2sucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbGF5ZXIgPSB0aGlzLmxheWVyO1xuXG5cdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW91c2VvdmVyJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZG93bicsIHRoaXMub25Nb3VzZSwgdHJ1ZSk7XG5cdFx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgdGhpcy5vbk1vdXNlLCB0cnVlKTtcblx0XHR9XG5cblx0XHRsYXllci5yZW1vdmVFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMub25DbGljaywgdHJ1ZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMub25Ub3VjaFN0YXJ0LCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5vblRvdWNoTW92ZSwgZmFsc2UpO1xuXHRcdGxheWVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoZW5kJywgdGhpcy5vblRvdWNoRW5kLCBmYWxzZSk7XG5cdFx0bGF5ZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hjYW5jZWwnLCB0aGlzLm9uVG91Y2hDYW5jZWwsIGZhbHNlKTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBDaGVjayB3aGV0aGVyIEZhc3RDbGljayBpcyBuZWVkZWQuXG5cdCAqXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKi9cblx0RmFzdENsaWNrLm5vdE5lZWRlZCA9IGZ1bmN0aW9uKGxheWVyKSB7XG5cdFx0dmFyIG1ldGFWaWV3cG9ydDtcblx0XHR2YXIgY2hyb21lVmVyc2lvbjtcblx0XHR2YXIgYmxhY2tiZXJyeVZlcnNpb247XG5cdFx0dmFyIGZpcmVmb3hWZXJzaW9uO1xuXG5cdFx0Ly8gRGV2aWNlcyB0aGF0IGRvbid0IHN1cHBvcnQgdG91Y2ggZG9uJ3QgbmVlZCBGYXN0Q2xpY2tcblx0XHRpZiAodHlwZW9mIHdpbmRvdy5vbnRvdWNoc3RhcnQgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9XG5cblx0XHQvLyBDaHJvbWUgdmVyc2lvbiAtIHplcm8gZm9yIG90aGVyIGJyb3dzZXJzXG5cdFx0Y2hyb21lVmVyc2lvbiA9ICsoL0Nocm9tZVxcLyhbMC05XSspLy5leGVjKG5hdmlnYXRvci51c2VyQWdlbnQpIHx8IFssMF0pWzFdO1xuXG5cdFx0aWYgKGNocm9tZVZlcnNpb24pIHtcblxuXHRcdFx0aWYgKGRldmljZUlzQW5kcm9pZCkge1xuXHRcdFx0XHRtZXRhVmlld3BvcnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtZXRhW25hbWU9dmlld3BvcnRdJyk7XG5cblx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydCkge1xuXHRcdFx0XHRcdC8vIENocm9tZSBvbiBBbmRyb2lkIHdpdGggdXNlci1zY2FsYWJsZT1cIm5vXCIgZG9lc24ndCBuZWVkIEZhc3RDbGljayAoaXNzdWUgIzg5KVxuXHRcdFx0XHRcdGlmIChtZXRhVmlld3BvcnQuY29udGVudC5pbmRleE9mKCd1c2VyLXNjYWxhYmxlPW5vJykgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Ly8gQ2hyb21lIDMyIGFuZCBhYm92ZSB3aXRoIHdpZHRoPWRldmljZS13aWR0aCBvciBsZXNzIGRvbid0IG5lZWQgRmFzdENsaWNrXG5cdFx0XHRcdFx0aWYgKGNocm9tZVZlcnNpb24gPiAzMSAmJiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2Nyb2xsV2lkdGggPD0gd2luZG93Lm91dGVyV2lkdGgpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXG5cdFx0XHQvLyBDaHJvbWUgZGVza3RvcCBkb2Vzbid0IG5lZWQgRmFzdENsaWNrIChpc3N1ZSAjMTUpXG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRpZiAoZGV2aWNlSXNCbGFja0JlcnJ5MTApIHtcblx0XHRcdGJsYWNrYmVycnlWZXJzaW9uID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvVmVyc2lvblxcLyhbMC05XSopXFwuKFswLTldKikvKTtcblxuXHRcdFx0Ly8gQmxhY2tCZXJyeSAxMC4zKyBkb2VzIG5vdCByZXF1aXJlIEZhc3RjbGljayBsaWJyYXJ5LlxuXHRcdFx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2Z0bGFicy9mYXN0Y2xpY2svaXNzdWVzLzI1MVxuXHRcdFx0aWYgKGJsYWNrYmVycnlWZXJzaW9uWzFdID49IDEwICYmIGJsYWNrYmVycnlWZXJzaW9uWzJdID49IDMpIHtcblx0XHRcdFx0bWV0YVZpZXdwb3J0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignbWV0YVtuYW1lPXZpZXdwb3J0XScpO1xuXG5cdFx0XHRcdGlmIChtZXRhVmlld3BvcnQpIHtcblx0XHRcdFx0XHQvLyB1c2VyLXNjYWxhYmxlPW5vIGVsaW1pbmF0ZXMgY2xpY2sgZGVsYXkuXG5cdFx0XHRcdFx0aWYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEpIHtcblx0XHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvLyB3aWR0aD1kZXZpY2Utd2lkdGggKG9yIGxlc3MgdGhhbiBkZXZpY2Utd2lkdGgpIGVsaW1pbmF0ZXMgY2xpY2sgZGVsYXkuXG5cdFx0XHRcdFx0aWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zY3JvbGxXaWR0aCA8PSB3aW5kb3cub3V0ZXJXaWR0aCkge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Ly8gSUUxMCB3aXRoIC1tcy10b3VjaC1hY3Rpb246IG5vbmUgb3IgbWFuaXB1bGF0aW9uLCB3aGljaCBkaXNhYmxlcyBkb3VibGUtdGFwLXRvLXpvb20gKGlzc3VlICM5Nylcblx0XHRpZiAobGF5ZXIuc3R5bGUubXNUb3VjaEFjdGlvbiA9PT0gJ25vbmUnIHx8IGxheWVyLnN0eWxlLnRvdWNoQWN0aW9uID09PSAnbWFuaXB1bGF0aW9uJykge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gRmlyZWZveCB2ZXJzaW9uIC0gemVybyBmb3Igb3RoZXIgYnJvd3NlcnNcblx0XHRmaXJlZm94VmVyc2lvbiA9ICsoL0ZpcmVmb3hcXC8oWzAtOV0rKS8uZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KSB8fCBbLDBdKVsxXTtcblxuXHRcdGlmIChmaXJlZm94VmVyc2lvbiA+PSAyNykge1xuXHRcdFx0Ly8gRmlyZWZveCAyNysgZG9lcyBub3QgaGF2ZSB0YXAgZGVsYXkgaWYgdGhlIGNvbnRlbnQgaXMgbm90IHpvb21hYmxlIC0gaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9OTIyODk2XG5cblx0XHRcdG1ldGFWaWV3cG9ydCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21ldGFbbmFtZT12aWV3cG9ydF0nKTtcblx0XHRcdGlmIChtZXRhVmlld3BvcnQgJiYgKG1ldGFWaWV3cG9ydC5jb250ZW50LmluZGV4T2YoJ3VzZXItc2NhbGFibGU9bm8nKSAhPT0gLTEgfHwgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnNjcm9sbFdpZHRoIDw9IHdpbmRvdy5vdXRlcldpZHRoKSkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvLyBJRTExOiBwcmVmaXhlZCAtbXMtdG91Y2gtYWN0aW9uIGlzIG5vIGxvbmdlciBzdXBwb3J0ZWQgYW5kIGl0J3MgcmVjb21lbmRlZCB0byB1c2Ugbm9uLXByZWZpeGVkIHZlcnNpb25cblx0XHQvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvd2luZG93cy9hcHBzL0hoNzY3MzEzLmFzcHhcblx0XHRpZiAobGF5ZXIuc3R5bGUudG91Y2hBY3Rpb24gPT09ICdub25lJyB8fCBsYXllci5zdHlsZS50b3VjaEFjdGlvbiA9PT0gJ21hbmlwdWxhdGlvbicpIHtcblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH1cblxuXHRcdHJldHVybiBmYWxzZTtcblx0fTtcblxuXG5cdC8qKlxuXHQgKiBGYWN0b3J5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYSBGYXN0Q2xpY2sgb2JqZWN0XG5cdCAqXG5cdCAqIEBwYXJhbSB7RWxlbWVudH0gbGF5ZXIgVGhlIGxheWVyIHRvIGxpc3RlbiBvblxuXHQgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnM9e31dIFRoZSBvcHRpb25zIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0c1xuXHQgKi9cblx0RmFzdENsaWNrLmF0dGFjaCA9IGZ1bmN0aW9uKGxheWVyLCBvcHRpb25zKSB7XG5cdFx0cmV0dXJuIG5ldyBGYXN0Q2xpY2sobGF5ZXIsIG9wdGlvbnMpO1xuXHR9O1xuXG5cblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcblxuXHRcdC8vIEFNRC4gUmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIG1vZHVsZS5cblx0XHRkZWZpbmUoZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gRmFzdENsaWNrO1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBGYXN0Q2xpY2suYXR0YWNoO1xuXHRcdG1vZHVsZS5leHBvcnRzLkZhc3RDbGljayA9IEZhc3RDbGljaztcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cuRmFzdENsaWNrID0gRmFzdENsaWNrO1xuXHR9XG59KCkpO1xuIiwiLyohXG5cbiBoYW5kbGViYXJzIHYzLjAuM1xuXG5Db3B5cmlnaHQgKEMpIDIwMTEtMjAxNCBieSBZZWh1ZGEgS2F0elxuXG5QZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG5vZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG5pbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG50byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG5jb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbmZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG5hbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG5GSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbkFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbkxJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG5PVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOXG5USEUgU09GVFdBUkUuXG5cbkBsaWNlbnNlXG4qL1xuKGZ1bmN0aW9uIHdlYnBhY2tVbml2ZXJzYWxNb2R1bGVEZWZpbml0aW9uKHJvb3QsIGZhY3RvcnkpIHtcblx0aWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKVxuXHRcdG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpO1xuXHRlbHNlIGlmKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcblx0XHRkZWZpbmUoZmFjdG9yeSk7XG5cdGVsc2UgaWYodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnKVxuXHRcdGV4cG9ydHNbXCJIYW5kbGViYXJzXCJdID0gZmFjdG9yeSgpO1xuXHRlbHNlXG5cdFx0cm9vdFtcIkhhbmRsZWJhcnNcIl0gPSBmYWN0b3J5KCk7XG59KSh0aGlzLCBmdW5jdGlvbigpIHtcbnJldHVybiAvKioqKioqLyAoZnVuY3Rpb24obW9kdWxlcykgeyAvLyB3ZWJwYWNrQm9vdHN0cmFwXG4vKioqKioqLyBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbi8qKioqKiovIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuLyoqKioqKi8gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuLyoqKioqKi8gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbi8qKioqKiovIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbi8qKioqKiovIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbi8qKioqKiovIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4vKioqKioqLyBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbi8qKioqKiovIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4vKioqKioqLyBcdFx0XHRleHBvcnRzOiB7fSxcbi8qKioqKiovIFx0XHRcdGlkOiBtb2R1bGVJZCxcbi8qKioqKiovIFx0XHRcdGxvYWRlZDogZmFsc2Vcbi8qKioqKiovIFx0XHR9O1xuXG4vKioqKioqLyBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4vKioqKioqLyBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbi8qKioqKiovIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4vKioqKioqLyBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbi8qKioqKiovIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuLyoqKioqKi8gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbi8qKioqKiovIFx0fVxuXG5cbi8qKioqKiovIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbi8qKioqKiovIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuLyoqKioqKi8gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuLyoqKioqKi8gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4vKioqKioqLyBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4vKioqKioqLyBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbi8qKioqKiovIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4vKioqKioqLyBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuLyoqKioqKi8gfSlcbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKioqKioqLyAoW1xuLyogMCAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IF9fd2VicGFja19yZXF1aXJlX18oNylbJ2RlZmF1bHQnXTtcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXG5cdHZhciBfaW1wb3J0ID0gX193ZWJwYWNrX3JlcXVpcmVfXygxKTtcblxuXHR2YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9pbXBvcnQpO1xuXG5cdC8vIEVhY2ggb2YgdGhlc2UgYXVnbWVudCB0aGUgSGFuZGxlYmFycyBvYmplY3QuIE5vIG5lZWQgdG8gc2V0dXAgaGVyZS5cblx0Ly8gKFRoaXMgaXMgZG9uZSB0byBlYXNpbHkgc2hhcmUgY29kZSBiZXR3ZWVuIGNvbW1vbmpzIGFuZCBicm93c2UgZW52cylcblxuXHR2YXIgX1NhZmVTdHJpbmcgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDIpO1xuXG5cdHZhciBfU2FmZVN0cmluZzIgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfU2FmZVN0cmluZyk7XG5cblx0dmFyIF9FeGNlcHRpb24gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdHZhciBfRXhjZXB0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9FeGNlcHRpb24pO1xuXG5cdHZhciBfaW1wb3J0MiA9IF9fd2VicGFja19yZXF1aXJlX18oNCk7XG5cblx0dmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydDIpO1xuXG5cdHZhciBfaW1wb3J0MyA9IF9fd2VicGFja19yZXF1aXJlX18oNSk7XG5cblx0dmFyIHJ1bnRpbWUgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0Myk7XG5cblx0dmFyIF9ub0NvbmZsaWN0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyg2KTtcblxuXHR2YXIgX25vQ29uZmxpY3QyID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX25vQ29uZmxpY3QpO1xuXG5cdC8vIEZvciBjb21wYXRpYmlsaXR5IGFuZCB1c2FnZSBvdXRzaWRlIG9mIG1vZHVsZSBzeXN0ZW1zLCBtYWtlIHRoZSBIYW5kbGViYXJzIG9iamVjdCBhIG5hbWVzcGFjZVxuXHRmdW5jdGlvbiBjcmVhdGUoKSB7XG5cdCAgdmFyIGhiID0gbmV3IGJhc2UuSGFuZGxlYmFyc0Vudmlyb25tZW50KCk7XG5cblx0ICBVdGlscy5leHRlbmQoaGIsIGJhc2UpO1xuXHQgIGhiLlNhZmVTdHJpbmcgPSBfU2FmZVN0cmluZzJbJ2RlZmF1bHQnXTtcblx0ICBoYi5FeGNlcHRpb24gPSBfRXhjZXB0aW9uMlsnZGVmYXVsdCddO1xuXHQgIGhiLlV0aWxzID0gVXRpbHM7XG5cdCAgaGIuZXNjYXBlRXhwcmVzc2lvbiA9IFV0aWxzLmVzY2FwZUV4cHJlc3Npb247XG5cblx0ICBoYi5WTSA9IHJ1bnRpbWU7XG5cdCAgaGIudGVtcGxhdGUgPSBmdW5jdGlvbiAoc3BlYykge1xuXHQgICAgcmV0dXJuIHJ1bnRpbWUudGVtcGxhdGUoc3BlYywgaGIpO1xuXHQgIH07XG5cblx0ICByZXR1cm4gaGI7XG5cdH1cblxuXHR2YXIgaW5zdCA9IGNyZWF0ZSgpO1xuXHRpbnN0LmNyZWF0ZSA9IGNyZWF0ZTtcblxuXHRfbm9Db25mbGljdDJbJ2RlZmF1bHQnXShpbnN0KTtcblxuXHRpbnN0WydkZWZhdWx0J10gPSBpbnN0O1xuXG5cdGV4cG9ydHNbJ2RlZmF1bHQnXSA9IGluc3Q7XG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vKioqLyB9LFxuLyogMSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IF9fd2VicGFja19yZXF1aXJlX18oNylbJ2RlZmF1bHQnXTtcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHRleHBvcnRzLkhhbmRsZWJhcnNFbnZpcm9ubWVudCA9IEhhbmRsZWJhcnNFbnZpcm9ubWVudDtcblx0ZXhwb3J0cy5jcmVhdGVGcmFtZSA9IGNyZWF0ZUZyYW1lO1xuXG5cdHZhciBfaW1wb3J0ID0gX193ZWJwYWNrX3JlcXVpcmVfXyg0KTtcblxuXHR2YXIgVXRpbHMgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfaW1wb3J0KTtcblxuXHR2YXIgX0V4Y2VwdGlvbiA9IF9fd2VicGFja19yZXF1aXJlX18oMyk7XG5cblx0dmFyIF9FeGNlcHRpb24yID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX0V4Y2VwdGlvbik7XG5cblx0dmFyIFZFUlNJT04gPSAnMy4wLjEnO1xuXHRleHBvcnRzLlZFUlNJT04gPSBWRVJTSU9OO1xuXHR2YXIgQ09NUElMRVJfUkVWSVNJT04gPSA2O1xuXG5cdGV4cG9ydHMuQ09NUElMRVJfUkVWSVNJT04gPSBDT01QSUxFUl9SRVZJU0lPTjtcblx0dmFyIFJFVklTSU9OX0NIQU5HRVMgPSB7XG5cdCAgMTogJzw9IDEuMC5yYy4yJywgLy8gMS4wLnJjLjIgaXMgYWN0dWFsbHkgcmV2MiBidXQgZG9lc24ndCByZXBvcnQgaXRcblx0ICAyOiAnPT0gMS4wLjAtcmMuMycsXG5cdCAgMzogJz09IDEuMC4wLXJjLjQnLFxuXHQgIDQ6ICc9PSAxLngueCcsXG5cdCAgNTogJz09IDIuMC4wLWFscGhhLngnLFxuXHQgIDY6ICc+PSAyLjAuMC1iZXRhLjEnXG5cdH07XG5cblx0ZXhwb3J0cy5SRVZJU0lPTl9DSEFOR0VTID0gUkVWSVNJT05fQ0hBTkdFUztcblx0dmFyIGlzQXJyYXkgPSBVdGlscy5pc0FycmF5LFxuXHQgICAgaXNGdW5jdGlvbiA9IFV0aWxzLmlzRnVuY3Rpb24sXG5cdCAgICB0b1N0cmluZyA9IFV0aWxzLnRvU3RyaW5nLFxuXHQgICAgb2JqZWN0VHlwZSA9ICdbb2JqZWN0IE9iamVjdF0nO1xuXG5cdGZ1bmN0aW9uIEhhbmRsZWJhcnNFbnZpcm9ubWVudChoZWxwZXJzLCBwYXJ0aWFscykge1xuXHQgIHRoaXMuaGVscGVycyA9IGhlbHBlcnMgfHwge307XG5cdCAgdGhpcy5wYXJ0aWFscyA9IHBhcnRpYWxzIHx8IHt9O1xuXG5cdCAgcmVnaXN0ZXJEZWZhdWx0SGVscGVycyh0aGlzKTtcblx0fVxuXG5cdEhhbmRsZWJhcnNFbnZpcm9ubWVudC5wcm90b3R5cGUgPSB7XG5cdCAgY29uc3RydWN0b3I6IEhhbmRsZWJhcnNFbnZpcm9ubWVudCxcblxuXHQgIGxvZ2dlcjogbG9nZ2VyLFxuXHQgIGxvZzogbG9nLFxuXG5cdCAgcmVnaXN0ZXJIZWxwZXI6IGZ1bmN0aW9uIHJlZ2lzdGVySGVscGVyKG5hbWUsIGZuKSB7XG5cdCAgICBpZiAodG9TdHJpbmcuY2FsbChuYW1lKSA9PT0gb2JqZWN0VHlwZSkge1xuXHQgICAgICBpZiAoZm4pIHtcblx0ICAgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnQXJnIG5vdCBzdXBwb3J0ZWQgd2l0aCBtdWx0aXBsZSBoZWxwZXJzJyk7XG5cdCAgICAgIH1cblx0ICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMuaGVscGVycywgbmFtZSk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICB0aGlzLmhlbHBlcnNbbmFtZV0gPSBmbjtcblx0ICAgIH1cblx0ICB9LFxuXHQgIHVucmVnaXN0ZXJIZWxwZXI6IGZ1bmN0aW9uIHVucmVnaXN0ZXJIZWxwZXIobmFtZSkge1xuXHQgICAgZGVsZXRlIHRoaXMuaGVscGVyc1tuYW1lXTtcblx0ICB9LFxuXG5cdCAgcmVnaXN0ZXJQYXJ0aWFsOiBmdW5jdGlvbiByZWdpc3RlclBhcnRpYWwobmFtZSwgcGFydGlhbCkge1xuXHQgICAgaWYgKHRvU3RyaW5nLmNhbGwobmFtZSkgPT09IG9iamVjdFR5cGUpIHtcblx0ICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMucGFydGlhbHMsIG5hbWUpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgaWYgKHR5cGVvZiBwYXJ0aWFsID09PSAndW5kZWZpbmVkJykge1xuXHQgICAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdBdHRlbXB0aW5nIHRvIHJlZ2lzdGVyIGEgcGFydGlhbCBhcyB1bmRlZmluZWQnKTtcblx0ICAgICAgfVxuXHQgICAgICB0aGlzLnBhcnRpYWxzW25hbWVdID0gcGFydGlhbDtcblx0ICAgIH1cblx0ICB9LFxuXHQgIHVucmVnaXN0ZXJQYXJ0aWFsOiBmdW5jdGlvbiB1bnJlZ2lzdGVyUGFydGlhbChuYW1lKSB7XG5cdCAgICBkZWxldGUgdGhpcy5wYXJ0aWFsc1tuYW1lXTtcblx0ICB9XG5cdH07XG5cblx0ZnVuY3Rpb24gcmVnaXN0ZXJEZWZhdWx0SGVscGVycyhpbnN0YW5jZSkge1xuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdoZWxwZXJNaXNzaW5nJywgZnVuY3Rpb24gKCkge1xuXHQgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcblx0ICAgICAgLy8gQSBtaXNzaW5nIGZpZWxkIGluIGEge3tmb299fSBjb25zdHVjdC5cblx0ICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIC8vIFNvbWVvbmUgaXMgYWN0dWFsbHkgdHJ5aW5nIHRvIGNhbGwgc29tZXRoaW5nLCBibG93IHVwLlxuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnTWlzc2luZyBoZWxwZXI6IFwiJyArIGFyZ3VtZW50c1thcmd1bWVudHMubGVuZ3RoIC0gMV0ubmFtZSArICdcIicpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ2Jsb2NrSGVscGVyTWlzc2luZycsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG5cdCAgICB2YXIgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZSxcblx0ICAgICAgICBmbiA9IG9wdGlvbnMuZm47XG5cblx0ICAgIGlmIChjb250ZXh0ID09PSB0cnVlKSB7XG5cdCAgICAgIHJldHVybiBmbih0aGlzKTtcblx0ICAgIH0gZWxzZSBpZiAoY29udGV4dCA9PT0gZmFsc2UgfHwgY29udGV4dCA9PSBudWxsKSB7XG5cdCAgICAgIHJldHVybiBpbnZlcnNlKHRoaXMpO1xuXHQgICAgfSBlbHNlIGlmIChpc0FycmF5KGNvbnRleHQpKSB7XG5cdCAgICAgIGlmIChjb250ZXh0Lmxlbmd0aCA+IDApIHtcblx0ICAgICAgICBpZiAob3B0aW9ucy5pZHMpIHtcblx0ICAgICAgICAgIG9wdGlvbnMuaWRzID0gW29wdGlvbnMubmFtZV07XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnMuZWFjaChjb250ZXh0LCBvcHRpb25zKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gaW52ZXJzZSh0aGlzKTtcblx0ICAgICAgfVxuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuXHQgICAgICAgIHZhciBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcblx0ICAgICAgICBkYXRhLmNvbnRleHRQYXRoID0gVXRpbHMuYXBwZW5kQ29udGV4dFBhdGgob3B0aW9ucy5kYXRhLmNvbnRleHRQYXRoLCBvcHRpb25zLm5hbWUpO1xuXHQgICAgICAgIG9wdGlvbnMgPSB7IGRhdGE6IGRhdGEgfTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBmbihjb250ZXh0LCBvcHRpb25zKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdlYWNoJywgZnVuY3Rpb24gKGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICAgIGlmICghb3B0aW9ucykge1xuXHQgICAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnTXVzdCBwYXNzIGl0ZXJhdG9yIHRvICNlYWNoJyk7XG5cdCAgICB9XG5cblx0ICAgIHZhciBmbiA9IG9wdGlvbnMuZm4sXG5cdCAgICAgICAgaW52ZXJzZSA9IG9wdGlvbnMuaW52ZXJzZSxcblx0ICAgICAgICBpID0gMCxcblx0ICAgICAgICByZXQgPSAnJyxcblx0ICAgICAgICBkYXRhID0gdW5kZWZpbmVkLFxuXHQgICAgICAgIGNvbnRleHRQYXRoID0gdW5kZWZpbmVkO1xuXG5cdCAgICBpZiAob3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuaWRzKSB7XG5cdCAgICAgIGNvbnRleHRQYXRoID0gVXRpbHMuYXBwZW5kQ29udGV4dFBhdGgob3B0aW9ucy5kYXRhLmNvbnRleHRQYXRoLCBvcHRpb25zLmlkc1swXSkgKyAnLic7XG5cdCAgICB9XG5cblx0ICAgIGlmIChpc0Z1bmN0aW9uKGNvbnRleHQpKSB7XG5cdCAgICAgIGNvbnRleHQgPSBjb250ZXh0LmNhbGwodGhpcyk7XG5cdCAgICB9XG5cblx0ICAgIGlmIChvcHRpb25zLmRhdGEpIHtcblx0ICAgICAgZGF0YSA9IGNyZWF0ZUZyYW1lKG9wdGlvbnMuZGF0YSk7XG5cdCAgICB9XG5cblx0ICAgIGZ1bmN0aW9uIGV4ZWNJdGVyYXRpb24oZmllbGQsIGluZGV4LCBsYXN0KSB7XG5cdCAgICAgIGlmIChkYXRhKSB7XG5cdCAgICAgICAgZGF0YS5rZXkgPSBmaWVsZDtcblx0ICAgICAgICBkYXRhLmluZGV4ID0gaW5kZXg7XG5cdCAgICAgICAgZGF0YS5maXJzdCA9IGluZGV4ID09PSAwO1xuXHQgICAgICAgIGRhdGEubGFzdCA9ICEhbGFzdDtcblxuXHQgICAgICAgIGlmIChjb250ZXh0UGF0aCkge1xuXHQgICAgICAgICAgZGF0YS5jb250ZXh0UGF0aCA9IGNvbnRleHRQYXRoICsgZmllbGQ7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgcmV0ID0gcmV0ICsgZm4oY29udGV4dFtmaWVsZF0sIHtcblx0ICAgICAgICBkYXRhOiBkYXRhLFxuXHQgICAgICAgIGJsb2NrUGFyYW1zOiBVdGlscy5ibG9ja1BhcmFtcyhbY29udGV4dFtmaWVsZF0sIGZpZWxkXSwgW2NvbnRleHRQYXRoICsgZmllbGQsIG51bGxdKVxuXHQgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgaWYgKGNvbnRleHQgJiYgdHlwZW9mIGNvbnRleHQgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgIGlmIChpc0FycmF5KGNvbnRleHQpKSB7XG5cdCAgICAgICAgZm9yICh2YXIgaiA9IGNvbnRleHQubGVuZ3RoOyBpIDwgajsgaSsrKSB7XG5cdCAgICAgICAgICBleGVjSXRlcmF0aW9uKGksIGksIGkgPT09IGNvbnRleHQubGVuZ3RoIC0gMSk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIHZhciBwcmlvcktleSA9IHVuZGVmaW5lZDtcblxuXHQgICAgICAgIGZvciAodmFyIGtleSBpbiBjb250ZXh0KSB7XG5cdCAgICAgICAgICBpZiAoY29udGV4dC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdCAgICAgICAgICAgIC8vIFdlJ3JlIHJ1bm5pbmcgdGhlIGl0ZXJhdGlvbnMgb25lIHN0ZXAgb3V0IG9mIHN5bmMgc28gd2UgY2FuIGRldGVjdFxuXHQgICAgICAgICAgICAvLyB0aGUgbGFzdCBpdGVyYXRpb24gd2l0aG91dCBoYXZlIHRvIHNjYW4gdGhlIG9iamVjdCB0d2ljZSBhbmQgY3JlYXRlXG5cdCAgICAgICAgICAgIC8vIGFuIGl0ZXJtZWRpYXRlIGtleXMgYXJyYXkuXG5cdCAgICAgICAgICAgIGlmIChwcmlvcktleSkge1xuXHQgICAgICAgICAgICAgIGV4ZWNJdGVyYXRpb24ocHJpb3JLZXksIGkgLSAxKTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgICBwcmlvcktleSA9IGtleTtcblx0ICAgICAgICAgICAgaSsrO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgICBpZiAocHJpb3JLZXkpIHtcblx0ICAgICAgICAgIGV4ZWNJdGVyYXRpb24ocHJpb3JLZXksIGkgLSAxLCB0cnVlKTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgaWYgKGkgPT09IDApIHtcblx0ICAgICAgcmV0ID0gaW52ZXJzZSh0aGlzKTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIHJldDtcblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdpZicsIGZ1bmN0aW9uIChjb25kaXRpb25hbCwgb3B0aW9ucykge1xuXHQgICAgaWYgKGlzRnVuY3Rpb24oY29uZGl0aW9uYWwpKSB7XG5cdCAgICAgIGNvbmRpdGlvbmFsID0gY29uZGl0aW9uYWwuY2FsbCh0aGlzKTtcblx0ICAgIH1cblxuXHQgICAgLy8gRGVmYXVsdCBiZWhhdmlvciBpcyB0byByZW5kZXIgdGhlIHBvc2l0aXZlIHBhdGggaWYgdGhlIHZhbHVlIGlzIHRydXRoeSBhbmQgbm90IGVtcHR5LlxuXHQgICAgLy8gVGhlIGBpbmNsdWRlWmVyb2Agb3B0aW9uIG1heSBiZSBzZXQgdG8gdHJlYXQgdGhlIGNvbmR0aW9uYWwgYXMgcHVyZWx5IG5vdCBlbXB0eSBiYXNlZCBvbiB0aGVcblx0ICAgIC8vIGJlaGF2aW9yIG9mIGlzRW1wdHkuIEVmZmVjdGl2ZWx5IHRoaXMgZGV0ZXJtaW5lcyBpZiAwIGlzIGhhbmRsZWQgYnkgdGhlIHBvc2l0aXZlIHBhdGggb3IgbmVnYXRpdmUuXG5cdCAgICBpZiAoIW9wdGlvbnMuaGFzaC5pbmNsdWRlWmVybyAmJiAhY29uZGl0aW9uYWwgfHwgVXRpbHMuaXNFbXB0eShjb25kaXRpb25hbCkpIHtcblx0ICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcblx0ICAgIH0gZWxzZSB7XG5cdCAgICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuXHQgICAgfVxuXHQgIH0pO1xuXG5cdCAgaW5zdGFuY2UucmVnaXN0ZXJIZWxwZXIoJ3VubGVzcycsIGZ1bmN0aW9uIChjb25kaXRpb25hbCwgb3B0aW9ucykge1xuXHQgICAgcmV0dXJuIGluc3RhbmNlLmhlbHBlcnNbJ2lmJ10uY2FsbCh0aGlzLCBjb25kaXRpb25hbCwgeyBmbjogb3B0aW9ucy5pbnZlcnNlLCBpbnZlcnNlOiBvcHRpb25zLmZuLCBoYXNoOiBvcHRpb25zLmhhc2ggfSk7XG5cdCAgfSk7XG5cblx0ICBpbnN0YW5jZS5yZWdpc3RlckhlbHBlcignd2l0aCcsIGZ1bmN0aW9uIChjb250ZXh0LCBvcHRpb25zKSB7XG5cdCAgICBpZiAoaXNGdW5jdGlvbihjb250ZXh0KSkge1xuXHQgICAgICBjb250ZXh0ID0gY29udGV4dC5jYWxsKHRoaXMpO1xuXHQgICAgfVxuXG5cdCAgICB2YXIgZm4gPSBvcHRpb25zLmZuO1xuXG5cdCAgICBpZiAoIVV0aWxzLmlzRW1wdHkoY29udGV4dCkpIHtcblx0ICAgICAgaWYgKG9wdGlvbnMuZGF0YSAmJiBvcHRpb25zLmlkcykge1xuXHQgICAgICAgIHZhciBkYXRhID0gY3JlYXRlRnJhbWUob3B0aW9ucy5kYXRhKTtcblx0ICAgICAgICBkYXRhLmNvbnRleHRQYXRoID0gVXRpbHMuYXBwZW5kQ29udGV4dFBhdGgob3B0aW9ucy5kYXRhLmNvbnRleHRQYXRoLCBvcHRpb25zLmlkc1swXSk7XG5cdCAgICAgICAgb3B0aW9ucyA9IHsgZGF0YTogZGF0YSB9O1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIGZuKGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcblx0ICAgIH1cblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdsb2cnLCBmdW5jdGlvbiAobWVzc2FnZSwgb3B0aW9ucykge1xuXHQgICAgdmFyIGxldmVsID0gb3B0aW9ucy5kYXRhICYmIG9wdGlvbnMuZGF0YS5sZXZlbCAhPSBudWxsID8gcGFyc2VJbnQob3B0aW9ucy5kYXRhLmxldmVsLCAxMCkgOiAxO1xuXHQgICAgaW5zdGFuY2UubG9nKGxldmVsLCBtZXNzYWdlKTtcblx0ICB9KTtcblxuXHQgIGluc3RhbmNlLnJlZ2lzdGVySGVscGVyKCdsb29rdXAnLCBmdW5jdGlvbiAob2JqLCBmaWVsZCkge1xuXHQgICAgcmV0dXJuIG9iaiAmJiBvYmpbZmllbGRdO1xuXHQgIH0pO1xuXHR9XG5cblx0dmFyIGxvZ2dlciA9IHtcblx0ICBtZXRob2RNYXA6IHsgMDogJ2RlYnVnJywgMTogJ2luZm8nLCAyOiAnd2FybicsIDM6ICdlcnJvcicgfSxcblxuXHQgIC8vIFN0YXRlIGVudW1cblx0ICBERUJVRzogMCxcblx0ICBJTkZPOiAxLFxuXHQgIFdBUk46IDIsXG5cdCAgRVJST1I6IDMsXG5cdCAgbGV2ZWw6IDEsXG5cblx0ICAvLyBDYW4gYmUgb3ZlcnJpZGRlbiBpbiB0aGUgaG9zdCBlbnZpcm9ubWVudFxuXHQgIGxvZzogZnVuY3Rpb24gbG9nKGxldmVsLCBtZXNzYWdlKSB7XG5cdCAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmIGxvZ2dlci5sZXZlbCA8PSBsZXZlbCkge1xuXHQgICAgICB2YXIgbWV0aG9kID0gbG9nZ2VyLm1ldGhvZE1hcFtsZXZlbF07XG5cdCAgICAgIChjb25zb2xlW21ldGhvZF0gfHwgY29uc29sZS5sb2cpLmNhbGwoY29uc29sZSwgbWVzc2FnZSk7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tY29uc29sZVxuXHQgICAgfVxuXHQgIH1cblx0fTtcblxuXHRleHBvcnRzLmxvZ2dlciA9IGxvZ2dlcjtcblx0dmFyIGxvZyA9IGxvZ2dlci5sb2c7XG5cblx0ZXhwb3J0cy5sb2cgPSBsb2c7XG5cblx0ZnVuY3Rpb24gY3JlYXRlRnJhbWUob2JqZWN0KSB7XG5cdCAgdmFyIGZyYW1lID0gVXRpbHMuZXh0ZW5kKHt9LCBvYmplY3QpO1xuXHQgIGZyYW1lLl9wYXJlbnQgPSBvYmplY3Q7XG5cdCAgcmV0dXJuIGZyYW1lO1xuXHR9XG5cblx0LyogW2FyZ3MsIF1vcHRpb25zICovXG5cbi8qKiovIH0sXG4vKiAyICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0Ly8gQnVpbGQgb3V0IG91ciBiYXNpYyBTYWZlU3RyaW5nIHR5cGVcblx0ZnVuY3Rpb24gU2FmZVN0cmluZyhzdHJpbmcpIHtcblx0ICB0aGlzLnN0cmluZyA9IHN0cmluZztcblx0fVxuXG5cdFNhZmVTdHJpbmcucHJvdG90eXBlLnRvU3RyaW5nID0gU2FmZVN0cmluZy5wcm90b3R5cGUudG9IVE1MID0gZnVuY3Rpb24gKCkge1xuXHQgIHJldHVybiAnJyArIHRoaXMuc3RyaW5nO1xuXHR9O1xuXG5cdGV4cG9ydHNbJ2RlZmF1bHQnXSA9IFNhZmVTdHJpbmc7XG5cdG1vZHVsZS5leHBvcnRzID0gZXhwb3J0c1snZGVmYXVsdCddO1xuXG4vKioqLyB9LFxuLyogMyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cblx0dmFyIGVycm9yUHJvcHMgPSBbJ2Rlc2NyaXB0aW9uJywgJ2ZpbGVOYW1lJywgJ2xpbmVOdW1iZXInLCAnbWVzc2FnZScsICduYW1lJywgJ251bWJlcicsICdzdGFjayddO1xuXG5cdGZ1bmN0aW9uIEV4Y2VwdGlvbihtZXNzYWdlLCBub2RlKSB7XG5cdCAgdmFyIGxvYyA9IG5vZGUgJiYgbm9kZS5sb2MsXG5cdCAgICAgIGxpbmUgPSB1bmRlZmluZWQsXG5cdCAgICAgIGNvbHVtbiA9IHVuZGVmaW5lZDtcblx0ICBpZiAobG9jKSB7XG5cdCAgICBsaW5lID0gbG9jLnN0YXJ0LmxpbmU7XG5cdCAgICBjb2x1bW4gPSBsb2Muc3RhcnQuY29sdW1uO1xuXG5cdCAgICBtZXNzYWdlICs9ICcgLSAnICsgbGluZSArICc6JyArIGNvbHVtbjtcblx0ICB9XG5cblx0ICB2YXIgdG1wID0gRXJyb3IucHJvdG90eXBlLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgbWVzc2FnZSk7XG5cblx0ICAvLyBVbmZvcnR1bmF0ZWx5IGVycm9ycyBhcmUgbm90IGVudW1lcmFibGUgaW4gQ2hyb21lIChhdCBsZWFzdCksIHNvIGBmb3IgcHJvcCBpbiB0bXBgIGRvZXNuJ3Qgd29yay5cblx0ICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCBlcnJvclByb3BzLmxlbmd0aDsgaWR4KyspIHtcblx0ICAgIHRoaXNbZXJyb3JQcm9wc1tpZHhdXSA9IHRtcFtlcnJvclByb3BzW2lkeF1dO1xuXHQgIH1cblxuXHQgIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHQgICAgRXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgRXhjZXB0aW9uKTtcblx0ICB9XG5cblx0ICBpZiAobG9jKSB7XG5cdCAgICB0aGlzLmxpbmVOdW1iZXIgPSBsaW5lO1xuXHQgICAgdGhpcy5jb2x1bW4gPSBjb2x1bW47XG5cdCAgfVxuXHR9XG5cblx0RXhjZXB0aW9uLnByb3RvdHlwZSA9IG5ldyBFcnJvcigpO1xuXG5cdGV4cG9ydHNbJ2RlZmF1bHQnXSA9IEV4Y2VwdGlvbjtcblx0bW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzWydkZWZhdWx0J107XG5cbi8qKiovIH0sXG4vKiA0ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQndXNlIHN0cmljdCc7XG5cblx0ZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblx0ZXhwb3J0cy5leHRlbmQgPSBleHRlbmQ7XG5cblx0Ly8gT2xkZXIgSUUgdmVyc2lvbnMgZG8gbm90IGRpcmVjdGx5IHN1cHBvcnQgaW5kZXhPZiBzbyB3ZSBtdXN0IGltcGxlbWVudCBvdXIgb3duLCBzYWRseS5cblx0ZXhwb3J0cy5pbmRleE9mID0gaW5kZXhPZjtcblx0ZXhwb3J0cy5lc2NhcGVFeHByZXNzaW9uID0gZXNjYXBlRXhwcmVzc2lvbjtcblx0ZXhwb3J0cy5pc0VtcHR5ID0gaXNFbXB0eTtcblx0ZXhwb3J0cy5ibG9ja1BhcmFtcyA9IGJsb2NrUGFyYW1zO1xuXHRleHBvcnRzLmFwcGVuZENvbnRleHRQYXRoID0gYXBwZW5kQ29udGV4dFBhdGg7XG5cdHZhciBlc2NhcGUgPSB7XG5cdCAgJyYnOiAnJmFtcDsnLFxuXHQgICc8JzogJyZsdDsnLFxuXHQgICc+JzogJyZndDsnLFxuXHQgICdcIic6ICcmcXVvdDsnLFxuXHQgICdcXCcnOiAnJiN4Mjc7Jyxcblx0ICAnYCc6ICcmI3g2MDsnXG5cdH07XG5cblx0dmFyIGJhZENoYXJzID0gL1smPD5cIidgXS9nLFxuXHQgICAgcG9zc2libGUgPSAvWyY8PlwiJ2BdLztcblxuXHRmdW5jdGlvbiBlc2NhcGVDaGFyKGNocikge1xuXHQgIHJldHVybiBlc2NhcGVbY2hyXTtcblx0fVxuXG5cdGZ1bmN0aW9uIGV4dGVuZChvYmogLyogLCAuLi5zb3VyY2UgKi8pIHtcblx0ICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuXHQgICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50c1tpXSkge1xuXHQgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKGFyZ3VtZW50c1tpXSwga2V5KSkge1xuXHQgICAgICAgIG9ialtrZXldID0gYXJndW1lbnRzW2ldW2tleV07XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICB9XG5cblx0ICByZXR1cm4gb2JqO1xuXHR9XG5cblx0dmFyIHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuXHRleHBvcnRzLnRvU3RyaW5nID0gdG9TdHJpbmc7XG5cdC8vIFNvdXJjZWQgZnJvbSBsb2Rhc2hcblx0Ly8gaHR0cHM6Ly9naXRodWIuY29tL2Jlc3RpZWpzL2xvZGFzaC9ibG9iL21hc3Rlci9MSUNFTlNFLnR4dFxuXHQvKmVzbGludC1kaXNhYmxlIGZ1bmMtc3R5bGUsIG5vLXZhciAqL1xuXHR2YXIgaXNGdW5jdGlvbiA9IGZ1bmN0aW9uIGlzRnVuY3Rpb24odmFsdWUpIHtcblx0ICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nO1xuXHR9O1xuXHQvLyBmYWxsYmFjayBmb3Igb2xkZXIgdmVyc2lvbnMgb2YgQ2hyb21lIGFuZCBTYWZhcmlcblx0LyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblx0aWYgKGlzRnVuY3Rpb24oL3gvKSkge1xuXHQgIGV4cG9ydHMuaXNGdW5jdGlvbiA9IGlzRnVuY3Rpb24gPSBmdW5jdGlvbiAodmFsdWUpIHtcblx0ICAgIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicgJiYgdG9TdHJpbmcuY2FsbCh2YWx1ZSkgPT09ICdbb2JqZWN0IEZ1bmN0aW9uXSc7XG5cdCAgfTtcblx0fVxuXHR2YXIgaXNGdW5jdGlvbjtcblx0ZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblx0Lyplc2xpbnQtZW5hYmxlIGZ1bmMtc3R5bGUsIG5vLXZhciAqL1xuXG5cdC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5cdHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAodmFsdWUpIHtcblx0ICByZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyA/IHRvU3RyaW5nLmNhbGwodmFsdWUpID09PSAnW29iamVjdCBBcnJheV0nIDogZmFsc2U7XG5cdH07ZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuXHRmdW5jdGlvbiBpbmRleE9mKGFycmF5LCB2YWx1ZSkge1xuXHQgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuXHQgICAgaWYgKGFycmF5W2ldID09PSB2YWx1ZSkge1xuXHQgICAgICByZXR1cm4gaTtcblx0ICAgIH1cblx0ICB9XG5cdCAgcmV0dXJuIC0xO1xuXHR9XG5cblx0ZnVuY3Rpb24gZXNjYXBlRXhwcmVzc2lvbihzdHJpbmcpIHtcblx0ICBpZiAodHlwZW9mIHN0cmluZyAhPT0gJ3N0cmluZycpIHtcblx0ICAgIC8vIGRvbid0IGVzY2FwZSBTYWZlU3RyaW5ncywgc2luY2UgdGhleSdyZSBhbHJlYWR5IHNhZmVcblx0ICAgIGlmIChzdHJpbmcgJiYgc3RyaW5nLnRvSFRNTCkge1xuXHQgICAgICByZXR1cm4gc3RyaW5nLnRvSFRNTCgpO1xuXHQgICAgfSBlbHNlIGlmIChzdHJpbmcgPT0gbnVsbCkge1xuXHQgICAgICByZXR1cm4gJyc7XG5cdCAgICB9IGVsc2UgaWYgKCFzdHJpbmcpIHtcblx0ICAgICAgcmV0dXJuIHN0cmluZyArICcnO1xuXHQgICAgfVxuXG5cdCAgICAvLyBGb3JjZSBhIHN0cmluZyBjb252ZXJzaW9uIGFzIHRoaXMgd2lsbCBiZSBkb25lIGJ5IHRoZSBhcHBlbmQgcmVnYXJkbGVzcyBhbmRcblx0ICAgIC8vIHRoZSByZWdleCB0ZXN0IHdpbGwgZG8gdGhpcyB0cmFuc3BhcmVudGx5IGJlaGluZCB0aGUgc2NlbmVzLCBjYXVzaW5nIGlzc3VlcyBpZlxuXHQgICAgLy8gYW4gb2JqZWN0J3MgdG8gc3RyaW5nIGhhcyBlc2NhcGVkIGNoYXJhY3RlcnMgaW4gaXQuXG5cdCAgICBzdHJpbmcgPSAnJyArIHN0cmluZztcblx0ICB9XG5cblx0ICBpZiAoIXBvc3NpYmxlLnRlc3Qoc3RyaW5nKSkge1xuXHQgICAgcmV0dXJuIHN0cmluZztcblx0ICB9XG5cdCAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKGJhZENoYXJzLCBlc2NhcGVDaGFyKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGlzRW1wdHkodmFsdWUpIHtcblx0ICBpZiAoIXZhbHVlICYmIHZhbHVlICE9PSAwKSB7XG5cdCAgICByZXR1cm4gdHJ1ZTtcblx0ICB9IGVsc2UgaWYgKGlzQXJyYXkodmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfSBlbHNlIHtcblx0ICAgIHJldHVybiBmYWxzZTtcblx0ICB9XG5cdH1cblxuXHRmdW5jdGlvbiBibG9ja1BhcmFtcyhwYXJhbXMsIGlkcykge1xuXHQgIHBhcmFtcy5wYXRoID0gaWRzO1xuXHQgIHJldHVybiBwYXJhbXM7XG5cdH1cblxuXHRmdW5jdGlvbiBhcHBlbmRDb250ZXh0UGF0aChjb250ZXh0UGF0aCwgaWQpIHtcblx0ICByZXR1cm4gKGNvbnRleHRQYXRoID8gY29udGV4dFBhdGggKyAnLicgOiAnJykgKyBpZDtcblx0fVxuXG4vKioqLyB9LFxuLyogNSAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZCA9IF9fd2VicGFja19yZXF1aXJlX18oNylbJ2RlZmF1bHQnXTtcblxuXHRleHBvcnRzLl9fZXNNb2R1bGUgPSB0cnVlO1xuXHRleHBvcnRzLmNoZWNrUmV2aXNpb24gPSBjaGVja1JldmlzaW9uO1xuXG5cdC8vIFRPRE86IFJlbW92ZSB0aGlzIGxpbmUgYW5kIGJyZWFrIHVwIGNvbXBpbGVQYXJ0aWFsXG5cblx0ZXhwb3J0cy50ZW1wbGF0ZSA9IHRlbXBsYXRlO1xuXHRleHBvcnRzLndyYXBQcm9ncmFtID0gd3JhcFByb2dyYW07XG5cdGV4cG9ydHMucmVzb2x2ZVBhcnRpYWwgPSByZXNvbHZlUGFydGlhbDtcblx0ZXhwb3J0cy5pbnZva2VQYXJ0aWFsID0gaW52b2tlUGFydGlhbDtcblx0ZXhwb3J0cy5ub29wID0gbm9vcDtcblxuXHR2YXIgX2ltcG9ydCA9IF9fd2VicGFja19yZXF1aXJlX18oNCk7XG5cblx0dmFyIFV0aWxzID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2ltcG9ydCk7XG5cblx0dmFyIF9FeGNlcHRpb24gPSBfX3dlYnBhY2tfcmVxdWlyZV9fKDMpO1xuXG5cdHZhciBfRXhjZXB0aW9uMiA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9FeGNlcHRpb24pO1xuXG5cdHZhciBfQ09NUElMRVJfUkVWSVNJT04kUkVWSVNJT05fQ0hBTkdFUyRjcmVhdGVGcmFtZSA9IF9fd2VicGFja19yZXF1aXJlX18oMSk7XG5cblx0ZnVuY3Rpb24gY2hlY2tSZXZpc2lvbihjb21waWxlckluZm8pIHtcblx0ICB2YXIgY29tcGlsZXJSZXZpc2lvbiA9IGNvbXBpbGVySW5mbyAmJiBjb21waWxlckluZm9bMF0gfHwgMSxcblx0ICAgICAgY3VycmVudFJldmlzaW9uID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuQ09NUElMRVJfUkVWSVNJT047XG5cblx0ICBpZiAoY29tcGlsZXJSZXZpc2lvbiAhPT0gY3VycmVudFJldmlzaW9uKSB7XG5cdCAgICBpZiAoY29tcGlsZXJSZXZpc2lvbiA8IGN1cnJlbnRSZXZpc2lvbikge1xuXHQgICAgICB2YXIgcnVudGltZVZlcnNpb25zID0gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuUkVWSVNJT05fQ0hBTkdFU1tjdXJyZW50UmV2aXNpb25dLFxuXHQgICAgICAgICAgY29tcGlsZXJWZXJzaW9ucyA9IF9DT01QSUxFUl9SRVZJU0lPTiRSRVZJU0lPTl9DSEFOR0VTJGNyZWF0ZUZyYW1lLlJFVklTSU9OX0NIQU5HRVNbY29tcGlsZXJSZXZpc2lvbl07XG5cdCAgICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdUZW1wbGF0ZSB3YXMgcHJlY29tcGlsZWQgd2l0aCBhbiBvbGRlciB2ZXJzaW9uIG9mIEhhbmRsZWJhcnMgdGhhbiB0aGUgY3VycmVudCBydW50aW1lLiAnICsgJ1BsZWFzZSB1cGRhdGUgeW91ciBwcmVjb21waWxlciB0byBhIG5ld2VyIHZlcnNpb24gKCcgKyBydW50aW1lVmVyc2lvbnMgKyAnKSBvciBkb3duZ3JhZGUgeW91ciBydW50aW1lIHRvIGFuIG9sZGVyIHZlcnNpb24gKCcgKyBjb21waWxlclZlcnNpb25zICsgJykuJyk7XG5cdCAgICB9IGVsc2Uge1xuXHQgICAgICAvLyBVc2UgdGhlIGVtYmVkZGVkIHZlcnNpb24gaW5mbyBzaW5jZSB0aGUgcnVudGltZSBkb2Vzbid0IGtub3cgYWJvdXQgdGhpcyByZXZpc2lvbiB5ZXRcblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RlbXBsYXRlIHdhcyBwcmVjb21waWxlZCB3aXRoIGEgbmV3ZXIgdmVyc2lvbiBvZiBIYW5kbGViYXJzIHRoYW4gdGhlIGN1cnJlbnQgcnVudGltZS4gJyArICdQbGVhc2UgdXBkYXRlIHlvdXIgcnVudGltZSB0byBhIG5ld2VyIHZlcnNpb24gKCcgKyBjb21waWxlckluZm9bMV0gKyAnKS4nKTtcblx0ICAgIH1cblx0ICB9XG5cdH1cblxuXHRmdW5jdGlvbiB0ZW1wbGF0ZSh0ZW1wbGF0ZVNwZWMsIGVudikge1xuXHQgIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5cdCAgaWYgKCFlbnYpIHtcblx0ICAgIHRocm93IG5ldyBfRXhjZXB0aW9uMlsnZGVmYXVsdCddKCdObyBlbnZpcm9ubWVudCBwYXNzZWQgdG8gdGVtcGxhdGUnKTtcblx0ICB9XG5cdCAgaWYgKCF0ZW1wbGF0ZVNwZWMgfHwgIXRlbXBsYXRlU3BlYy5tYWluKSB7XG5cdCAgICB0aHJvdyBuZXcgX0V4Y2VwdGlvbjJbJ2RlZmF1bHQnXSgnVW5rbm93biB0ZW1wbGF0ZSBvYmplY3Q6ICcgKyB0eXBlb2YgdGVtcGxhdGVTcGVjKTtcblx0ICB9XG5cblx0ICAvLyBOb3RlOiBVc2luZyBlbnYuVk0gcmVmZXJlbmNlcyByYXRoZXIgdGhhbiBsb2NhbCB2YXIgcmVmZXJlbmNlcyB0aHJvdWdob3V0IHRoaXMgc2VjdGlvbiB0byBhbGxvd1xuXHQgIC8vIGZvciBleHRlcm5hbCB1c2VycyB0byBvdmVycmlkZSB0aGVzZSBhcyBwc3VlZG8tc3VwcG9ydGVkIEFQSXMuXG5cdCAgZW52LlZNLmNoZWNrUmV2aXNpb24odGVtcGxhdGVTcGVjLmNvbXBpbGVyKTtcblxuXHQgIGZ1bmN0aW9uIGludm9rZVBhcnRpYWxXcmFwcGVyKHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICAgIGlmIChvcHRpb25zLmhhc2gpIHtcblx0ICAgICAgY29udGV4dCA9IFV0aWxzLmV4dGVuZCh7fSwgY29udGV4dCwgb3B0aW9ucy5oYXNoKTtcblx0ICAgIH1cblxuXHQgICAgcGFydGlhbCA9IGVudi5WTS5yZXNvbHZlUGFydGlhbC5jYWxsKHRoaXMsIHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpO1xuXHQgICAgdmFyIHJlc3VsdCA9IGVudi5WTS5pbnZva2VQYXJ0aWFsLmNhbGwodGhpcywgcGFydGlhbCwgY29udGV4dCwgb3B0aW9ucyk7XG5cblx0ICAgIGlmIChyZXN1bHQgPT0gbnVsbCAmJiBlbnYuY29tcGlsZSkge1xuXHQgICAgICBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV0gPSBlbnYuY29tcGlsZShwYXJ0aWFsLCB0ZW1wbGF0ZVNwZWMuY29tcGlsZXJPcHRpb25zLCBlbnYpO1xuXHQgICAgICByZXN1bHQgPSBvcHRpb25zLnBhcnRpYWxzW29wdGlvbnMubmFtZV0oY29udGV4dCwgb3B0aW9ucyk7XG5cdCAgICB9XG5cdCAgICBpZiAocmVzdWx0ICE9IG51bGwpIHtcblx0ICAgICAgaWYgKG9wdGlvbnMuaW5kZW50KSB7XG5cdCAgICAgICAgdmFyIGxpbmVzID0gcmVzdWx0LnNwbGl0KCdcXG4nKTtcblx0ICAgICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGxpbmVzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHQgICAgICAgICAgaWYgKCFsaW5lc1tpXSAmJiBpICsgMSA9PT0gbCkge1xuXHQgICAgICAgICAgICBicmVhaztcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgbGluZXNbaV0gPSBvcHRpb25zLmluZGVudCArIGxpbmVzW2ldO1xuXHQgICAgICAgIH1cblx0ICAgICAgICByZXN1bHQgPSBsaW5lcy5qb2luKCdcXG4nKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gcmVzdWx0O1xuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RoZSBwYXJ0aWFsICcgKyBvcHRpb25zLm5hbWUgKyAnIGNvdWxkIG5vdCBiZSBjb21waWxlZCB3aGVuIHJ1bm5pbmcgaW4gcnVudGltZS1vbmx5IG1vZGUnKTtcblx0ICAgIH1cblx0ICB9XG5cblx0ICAvLyBKdXN0IGFkZCB3YXRlclxuXHQgIHZhciBjb250YWluZXIgPSB7XG5cdCAgICBzdHJpY3Q6IGZ1bmN0aW9uIHN0cmljdChvYmosIG5hbWUpIHtcblx0ICAgICAgaWYgKCEobmFtZSBpbiBvYmopKSB7XG5cdCAgICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1wiJyArIG5hbWUgKyAnXCIgbm90IGRlZmluZWQgaW4gJyArIG9iaik7XG5cdCAgICAgIH1cblx0ICAgICAgcmV0dXJuIG9ialtuYW1lXTtcblx0ICAgIH0sXG5cdCAgICBsb29rdXA6IGZ1bmN0aW9uIGxvb2t1cChkZXB0aHMsIG5hbWUpIHtcblx0ICAgICAgdmFyIGxlbiA9IGRlcHRocy5sZW5ndGg7XG5cdCAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0ICAgICAgICBpZiAoZGVwdGhzW2ldICYmIGRlcHRoc1tpXVtuYW1lXSAhPSBudWxsKSB7XG5cdCAgICAgICAgICByZXR1cm4gZGVwdGhzW2ldW25hbWVdO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXHQgICAgfSxcblx0ICAgIGxhbWJkYTogZnVuY3Rpb24gbGFtYmRhKGN1cnJlbnQsIGNvbnRleHQpIHtcblx0ICAgICAgcmV0dXJuIHR5cGVvZiBjdXJyZW50ID09PSAnZnVuY3Rpb24nID8gY3VycmVudC5jYWxsKGNvbnRleHQpIDogY3VycmVudDtcblx0ICAgIH0sXG5cblx0ICAgIGVzY2FwZUV4cHJlc3Npb246IFV0aWxzLmVzY2FwZUV4cHJlc3Npb24sXG5cdCAgICBpbnZva2VQYXJ0aWFsOiBpbnZva2VQYXJ0aWFsV3JhcHBlcixcblxuXHQgICAgZm46IGZ1bmN0aW9uIGZuKGkpIHtcblx0ICAgICAgcmV0dXJuIHRlbXBsYXRlU3BlY1tpXTtcblx0ICAgIH0sXG5cblx0ICAgIHByb2dyYW1zOiBbXSxcblx0ICAgIHByb2dyYW06IGZ1bmN0aW9uIHByb2dyYW0oaSwgZGF0YSwgZGVjbGFyZWRCbG9ja1BhcmFtcywgYmxvY2tQYXJhbXMsIGRlcHRocykge1xuXHQgICAgICB2YXIgcHJvZ3JhbVdyYXBwZXIgPSB0aGlzLnByb2dyYW1zW2ldLFxuXHQgICAgICAgICAgZm4gPSB0aGlzLmZuKGkpO1xuXHQgICAgICBpZiAoZGF0YSB8fCBkZXB0aHMgfHwgYmxvY2tQYXJhbXMgfHwgZGVjbGFyZWRCbG9ja1BhcmFtcykge1xuXHQgICAgICAgIHByb2dyYW1XcmFwcGVyID0gd3JhcFByb2dyYW0odGhpcywgaSwgZm4sIGRhdGEsIGRlY2xhcmVkQmxvY2tQYXJhbXMsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuXHQgICAgICB9IGVsc2UgaWYgKCFwcm9ncmFtV3JhcHBlcikge1xuXHQgICAgICAgIHByb2dyYW1XcmFwcGVyID0gdGhpcy5wcm9ncmFtc1tpXSA9IHdyYXBQcm9ncmFtKHRoaXMsIGksIGZuKTtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gcHJvZ3JhbVdyYXBwZXI7XG5cdCAgICB9LFxuXG5cdCAgICBkYXRhOiBmdW5jdGlvbiBkYXRhKHZhbHVlLCBkZXB0aCkge1xuXHQgICAgICB3aGlsZSAodmFsdWUgJiYgZGVwdGgtLSkge1xuXHQgICAgICAgIHZhbHVlID0gdmFsdWUuX3BhcmVudDtcblx0ICAgICAgfVxuXHQgICAgICByZXR1cm4gdmFsdWU7XG5cdCAgICB9LFxuXHQgICAgbWVyZ2U6IGZ1bmN0aW9uIG1lcmdlKHBhcmFtLCBjb21tb24pIHtcblx0ICAgICAgdmFyIG9iaiA9IHBhcmFtIHx8IGNvbW1vbjtcblxuXHQgICAgICBpZiAocGFyYW0gJiYgY29tbW9uICYmIHBhcmFtICE9PSBjb21tb24pIHtcblx0ICAgICAgICBvYmogPSBVdGlscy5leHRlbmQoe30sIGNvbW1vbiwgcGFyYW0pO1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIG9iajtcblx0ICAgIH0sXG5cblx0ICAgIG5vb3A6IGVudi5WTS5ub29wLFxuXHQgICAgY29tcGlsZXJJbmZvOiB0ZW1wbGF0ZVNwZWMuY29tcGlsZXJcblx0ICB9O1xuXG5cdCAgZnVuY3Rpb24gcmV0KGNvbnRleHQpIHtcblx0ICAgIHZhciBvcHRpb25zID0gYXJndW1lbnRzWzFdID09PSB1bmRlZmluZWQgPyB7fSA6IGFyZ3VtZW50c1sxXTtcblxuXHQgICAgdmFyIGRhdGEgPSBvcHRpb25zLmRhdGE7XG5cblx0ICAgIHJldC5fc2V0dXAob3B0aW9ucyk7XG5cdCAgICBpZiAoIW9wdGlvbnMucGFydGlhbCAmJiB0ZW1wbGF0ZVNwZWMudXNlRGF0YSkge1xuXHQgICAgICBkYXRhID0gaW5pdERhdGEoY29udGV4dCwgZGF0YSk7XG5cdCAgICB9XG5cdCAgICB2YXIgZGVwdGhzID0gdW5kZWZpbmVkLFxuXHQgICAgICAgIGJsb2NrUGFyYW1zID0gdGVtcGxhdGVTcGVjLnVzZUJsb2NrUGFyYW1zID8gW10gOiB1bmRlZmluZWQ7XG5cdCAgICBpZiAodGVtcGxhdGVTcGVjLnVzZURlcHRocykge1xuXHQgICAgICBkZXB0aHMgPSBvcHRpb25zLmRlcHRocyA/IFtjb250ZXh0XS5jb25jYXQob3B0aW9ucy5kZXB0aHMpIDogW2NvbnRleHRdO1xuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdGVtcGxhdGVTcGVjLm1haW4uY2FsbChjb250YWluZXIsIGNvbnRleHQsIGNvbnRhaW5lci5oZWxwZXJzLCBjb250YWluZXIucGFydGlhbHMsIGRhdGEsIGJsb2NrUGFyYW1zLCBkZXB0aHMpO1xuXHQgIH1cblx0ICByZXQuaXNUb3AgPSB0cnVlO1xuXG5cdCAgcmV0Ll9zZXR1cCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG5cdCAgICBpZiAoIW9wdGlvbnMucGFydGlhbCkge1xuXHQgICAgICBjb250YWluZXIuaGVscGVycyA9IGNvbnRhaW5lci5tZXJnZShvcHRpb25zLmhlbHBlcnMsIGVudi5oZWxwZXJzKTtcblxuXHQgICAgICBpZiAodGVtcGxhdGVTcGVjLnVzZVBhcnRpYWwpIHtcblx0ICAgICAgICBjb250YWluZXIucGFydGlhbHMgPSBjb250YWluZXIubWVyZ2Uob3B0aW9ucy5wYXJ0aWFscywgZW52LnBhcnRpYWxzKTtcblx0ICAgICAgfVxuXHQgICAgfSBlbHNlIHtcblx0ICAgICAgY29udGFpbmVyLmhlbHBlcnMgPSBvcHRpb25zLmhlbHBlcnM7XG5cdCAgICAgIGNvbnRhaW5lci5wYXJ0aWFscyA9IG9wdGlvbnMucGFydGlhbHM7XG5cdCAgICB9XG5cdCAgfTtcblxuXHQgIHJldC5fY2hpbGQgPSBmdW5jdGlvbiAoaSwgZGF0YSwgYmxvY2tQYXJhbXMsIGRlcHRocykge1xuXHQgICAgaWYgKHRlbXBsYXRlU3BlYy51c2VCbG9ja1BhcmFtcyAmJiAhYmxvY2tQYXJhbXMpIHtcblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ211c3QgcGFzcyBibG9jayBwYXJhbXMnKTtcblx0ICAgIH1cblx0ICAgIGlmICh0ZW1wbGF0ZVNwZWMudXNlRGVwdGhzICYmICFkZXB0aHMpIHtcblx0ICAgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ211c3QgcGFzcyBwYXJlbnQgZGVwdGhzJyk7XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiB3cmFwUHJvZ3JhbShjb250YWluZXIsIGksIHRlbXBsYXRlU3BlY1tpXSwgZGF0YSwgMCwgYmxvY2tQYXJhbXMsIGRlcHRocyk7XG5cdCAgfTtcblx0ICByZXR1cm4gcmV0O1xuXHR9XG5cblx0ZnVuY3Rpb24gd3JhcFByb2dyYW0oY29udGFpbmVyLCBpLCBmbiwgZGF0YSwgZGVjbGFyZWRCbG9ja1BhcmFtcywgYmxvY2tQYXJhbXMsIGRlcHRocykge1xuXHQgIGZ1bmN0aW9uIHByb2coY29udGV4dCkge1xuXHQgICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHNbMV0gPT09IHVuZGVmaW5lZCA/IHt9IDogYXJndW1lbnRzWzFdO1xuXG5cdCAgICByZXR1cm4gZm4uY2FsbChjb250YWluZXIsIGNvbnRleHQsIGNvbnRhaW5lci5oZWxwZXJzLCBjb250YWluZXIucGFydGlhbHMsIG9wdGlvbnMuZGF0YSB8fCBkYXRhLCBibG9ja1BhcmFtcyAmJiBbb3B0aW9ucy5ibG9ja1BhcmFtc10uY29uY2F0KGJsb2NrUGFyYW1zKSwgZGVwdGhzICYmIFtjb250ZXh0XS5jb25jYXQoZGVwdGhzKSk7XG5cdCAgfVxuXHQgIHByb2cucHJvZ3JhbSA9IGk7XG5cdCAgcHJvZy5kZXB0aCA9IGRlcHRocyA/IGRlcHRocy5sZW5ndGggOiAwO1xuXHQgIHByb2cuYmxvY2tQYXJhbXMgPSBkZWNsYXJlZEJsb2NrUGFyYW1zIHx8IDA7XG5cdCAgcmV0dXJuIHByb2c7XG5cdH1cblxuXHRmdW5jdGlvbiByZXNvbHZlUGFydGlhbChwYXJ0aWFsLCBjb250ZXh0LCBvcHRpb25zKSB7XG5cdCAgaWYgKCFwYXJ0aWFsKSB7XG5cdCAgICBwYXJ0aWFsID0gb3B0aW9ucy5wYXJ0aWFsc1tvcHRpb25zLm5hbWVdO1xuXHQgIH0gZWxzZSBpZiAoIXBhcnRpYWwuY2FsbCAmJiAhb3B0aW9ucy5uYW1lKSB7XG5cdCAgICAvLyBUaGlzIGlzIGEgZHluYW1pYyBwYXJ0aWFsIHRoYXQgcmV0dXJuZWQgYSBzdHJpbmdcblx0ICAgIG9wdGlvbnMubmFtZSA9IHBhcnRpYWw7XG5cdCAgICBwYXJ0aWFsID0gb3B0aW9ucy5wYXJ0aWFsc1twYXJ0aWFsXTtcblx0ICB9XG5cdCAgcmV0dXJuIHBhcnRpYWw7XG5cdH1cblxuXHRmdW5jdGlvbiBpbnZva2VQYXJ0aWFsKHBhcnRpYWwsIGNvbnRleHQsIG9wdGlvbnMpIHtcblx0ICBvcHRpb25zLnBhcnRpYWwgPSB0cnVlO1xuXG5cdCAgaWYgKHBhcnRpYWwgPT09IHVuZGVmaW5lZCkge1xuXHQgICAgdGhyb3cgbmV3IF9FeGNlcHRpb24yWydkZWZhdWx0J10oJ1RoZSBwYXJ0aWFsICcgKyBvcHRpb25zLm5hbWUgKyAnIGNvdWxkIG5vdCBiZSBmb3VuZCcpO1xuXHQgIH0gZWxzZSBpZiAocGFydGlhbCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG5cdCAgICByZXR1cm4gcGFydGlhbChjb250ZXh0LCBvcHRpb25zKTtcblx0ICB9XG5cdH1cblxuXHRmdW5jdGlvbiBub29wKCkge1xuXHQgIHJldHVybiAnJztcblx0fVxuXG5cdGZ1bmN0aW9uIGluaXREYXRhKGNvbnRleHQsIGRhdGEpIHtcblx0ICBpZiAoIWRhdGEgfHwgISgncm9vdCcgaW4gZGF0YSkpIHtcblx0ICAgIGRhdGEgPSBkYXRhID8gX0NPTVBJTEVSX1JFVklTSU9OJFJFVklTSU9OX0NIQU5HRVMkY3JlYXRlRnJhbWUuY3JlYXRlRnJhbWUoZGF0YSkgOiB7fTtcblx0ICAgIGRhdGEucm9vdCA9IGNvbnRleHQ7XG5cdCAgfVxuXHQgIHJldHVybiBkYXRhO1xuXHR9XG5cbi8qKiovIH0sXG4vKiA2ICovXG4vKioqLyBmdW5jdGlvbihtb2R1bGUsIGV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pIHtcblxuXHQvKiBXRUJQQUNLIFZBUiBJTkpFQ1RJT04gKi8oZnVuY3Rpb24oZ2xvYmFsKSB7J3VzZSBzdHJpY3QnO1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cdC8qZ2xvYmFsIHdpbmRvdyAqL1xuXG5cdGV4cG9ydHNbJ2RlZmF1bHQnXSA9IGZ1bmN0aW9uIChIYW5kbGViYXJzKSB7XG5cdCAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cblx0ICB2YXIgcm9vdCA9IHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnID8gZ2xvYmFsIDogd2luZG93LFxuXHQgICAgICAkSGFuZGxlYmFycyA9IHJvb3QuSGFuZGxlYmFycztcblx0ICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuXHQgIEhhbmRsZWJhcnMubm9Db25mbGljdCA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIGlmIChyb290LkhhbmRsZWJhcnMgPT09IEhhbmRsZWJhcnMpIHtcblx0ICAgICAgcm9vdC5IYW5kbGViYXJzID0gJEhhbmRsZWJhcnM7XG5cdCAgICB9XG5cdCAgfTtcblx0fTtcblxuXHRtb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHNbJ2RlZmF1bHQnXTtcblx0LyogV0VCUEFDSyBWQVIgSU5KRUNUSU9OICovfS5jYWxsKGV4cG9ydHMsIChmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXM7IH0oKSkpKVxuXG4vKioqLyB9LFxuLyogNyAqL1xuLyoqKi8gZnVuY3Rpb24obW9kdWxlLCBleHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKSB7XG5cblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0ZXhwb3J0c1tcImRlZmF1bHRcIl0gPSBmdW5jdGlvbiAob2JqKSB7XG5cdCAgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHtcblx0ICAgIFwiZGVmYXVsdFwiOiBvYmpcblx0ICB9O1xuXHR9O1xuXG5cdGV4cG9ydHMuX19lc01vZHVsZSA9IHRydWU7XG5cbi8qKiovIH1cbi8qKioqKiovIF0pXG59KTtcbjsiLCJtb2R1bGUuZXhwb3J0cyA9IEFycmF5LmlzQXJyYXkgfHwgZnVuY3Rpb24gKGFycikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG4iLCIgIC8qIGdsb2JhbHMgcmVxdWlyZSwgbW9kdWxlICovXG5cbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxuICAgKi9cblxuICB2YXIgcGF0aHRvUmVnZXhwID0gcmVxdWlyZSgncGF0aC10by1yZWdleHAnKTtcblxuICAvKipcbiAgICogTW9kdWxlIGV4cG9ydHMuXG4gICAqL1xuXG4gIG1vZHVsZS5leHBvcnRzID0gcGFnZTtcblxuICAvKipcbiAgICogRGV0ZWN0IGNsaWNrIGV2ZW50XG4gICAqL1xuICB2YXIgY2xpY2tFdmVudCA9ICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIGRvY3VtZW50KSAmJiBkb2N1bWVudC5vbnRvdWNoc3RhcnQgPyAndG91Y2hzdGFydCcgOiAnY2xpY2snO1xuXG4gIC8qKlxuICAgKiBUbyB3b3JrIHByb3Blcmx5IHdpdGggdGhlIFVSTFxuICAgKiBoaXN0b3J5LmxvY2F0aW9uIGdlbmVyYXRlZCBwb2x5ZmlsbCBpbiBodHRwczovL2dpdGh1Yi5jb20vZGV2b3RlL0hUTUw1LUhpc3RvcnktQVBJXG4gICAqL1xuXG4gIHZhciBsb2NhdGlvbiA9ICgndW5kZWZpbmVkJyAhPT0gdHlwZW9mIHdpbmRvdykgJiYgKHdpbmRvdy5oaXN0b3J5LmxvY2F0aW9uIHx8IHdpbmRvdy5sb2NhdGlvbik7XG5cbiAgLyoqXG4gICAqIFBlcmZvcm0gaW5pdGlhbCBkaXNwYXRjaC5cbiAgICovXG5cbiAgdmFyIGRpc3BhdGNoID0gdHJ1ZTtcblxuXG4gIC8qKlxuICAgKiBEZWNvZGUgVVJMIGNvbXBvbmVudHMgKHF1ZXJ5IHN0cmluZywgcGF0aG5hbWUsIGhhc2gpLlxuICAgKiBBY2NvbW1vZGF0ZXMgYm90aCByZWd1bGFyIHBlcmNlbnQgZW5jb2RpbmcgYW5kIHgtd3d3LWZvcm0tdXJsZW5jb2RlZCBmb3JtYXQuXG4gICAqL1xuICB2YXIgZGVjb2RlVVJMQ29tcG9uZW50cyA9IHRydWU7XG5cbiAgLyoqXG4gICAqIEJhc2UgcGF0aC5cbiAgICovXG5cbiAgdmFyIGJhc2UgPSAnJztcblxuICAvKipcbiAgICogUnVubmluZyBmbGFnLlxuICAgKi9cblxuICB2YXIgcnVubmluZztcblxuICAvKipcbiAgICogSGFzaEJhbmcgb3B0aW9uXG4gICAqL1xuXG4gIHZhciBoYXNoYmFuZyA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBQcmV2aW91cyBjb250ZXh0LCBmb3IgY2FwdHVyaW5nXG4gICAqIHBhZ2UgZXhpdCBldmVudHMuXG4gICAqL1xuXG4gIHZhciBwcmV2Q29udGV4dDtcblxuICAvKipcbiAgICogUmVnaXN0ZXIgYHBhdGhgIHdpdGggY2FsbGJhY2sgYGZuKClgLFxuICAgKiBvciByb3V0ZSBgcGF0aGAsIG9yIHJlZGlyZWN0aW9uLFxuICAgKiBvciBgcGFnZS5zdGFydCgpYC5cbiAgICpcbiAgICogICBwYWdlKGZuKTtcbiAgICogICBwYWdlKCcqJywgZm4pO1xuICAgKiAgIHBhZ2UoJy91c2VyLzppZCcsIGxvYWQsIHVzZXIpO1xuICAgKiAgIHBhZ2UoJy91c2VyLycgKyB1c2VyLmlkLCB7IHNvbWU6ICd0aGluZycgfSk7XG4gICAqICAgcGFnZSgnL3VzZXIvJyArIHVzZXIuaWQpO1xuICAgKiAgIHBhZ2UoJy9mcm9tJywgJy90bycpXG4gICAqICAgcGFnZSgpO1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ3xGdW5jdGlvbn0gcGF0aFxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBmbi4uLlxuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBmdW5jdGlvbiBwYWdlKHBhdGgsIGZuKSB7XG4gICAgLy8gPGNhbGxiYWNrPlxuICAgIGlmICgnZnVuY3Rpb24nID09PSB0eXBlb2YgcGF0aCkge1xuICAgICAgcmV0dXJuIHBhZ2UoJyonLCBwYXRoKTtcbiAgICB9XG5cbiAgICAvLyByb3V0ZSA8cGF0aD4gdG8gPGNhbGxiYWNrIC4uLj5cbiAgICBpZiAoJ2Z1bmN0aW9uJyA9PT0gdHlwZW9mIGZuKSB7XG4gICAgICB2YXIgcm91dGUgPSBuZXcgUm91dGUocGF0aCk7XG4gICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7ICsraSkge1xuICAgICAgICBwYWdlLmNhbGxiYWNrcy5wdXNoKHJvdXRlLm1pZGRsZXdhcmUoYXJndW1lbnRzW2ldKSk7XG4gICAgICB9XG4gICAgICAvLyBzaG93IDxwYXRoPiB3aXRoIFtzdGF0ZV1cbiAgICB9IGVsc2UgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgcGF0aCkge1xuICAgICAgcGFnZVsnc3RyaW5nJyA9PT0gdHlwZW9mIGZuID8gJ3JlZGlyZWN0JyA6ICdzaG93J10ocGF0aCwgZm4pO1xuICAgICAgLy8gc3RhcnQgW29wdGlvbnNdXG4gICAgfSBlbHNlIHtcbiAgICAgIHBhZ2Uuc3RhcnQocGF0aCk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENhbGxiYWNrIGZ1bmN0aW9ucy5cbiAgICovXG5cbiAgcGFnZS5jYWxsYmFja3MgPSBbXTtcbiAgcGFnZS5leGl0cyA9IFtdO1xuXG4gIC8qKlxuICAgKiBDdXJyZW50IHBhdGggYmVpbmcgcHJvY2Vzc2VkXG4gICAqIEB0eXBlIHtTdHJpbmd9XG4gICAqL1xuICBwYWdlLmN1cnJlbnQgPSAnJztcblxuICAvKipcbiAgICogTnVtYmVyIG9mIHBhZ2VzIG5hdmlnYXRlZCB0by5cbiAgICogQHR5cGUge251bWJlcn1cbiAgICpcbiAgICogICAgIHBhZ2UubGVuID09IDA7XG4gICAqICAgICBwYWdlKCcvbG9naW4nKTtcbiAgICogICAgIHBhZ2UubGVuID09IDE7XG4gICAqL1xuXG4gIHBhZ2UubGVuID0gMDtcblxuICAvKipcbiAgICogR2V0IG9yIHNldCBiYXNlcGF0aCB0byBgcGF0aGAuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2UuYmFzZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICBpZiAoMCA9PT0gYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIGJhc2U7XG4gICAgYmFzZSA9IHBhdGg7XG4gIH07XG5cbiAgLyoqXG4gICAqIEJpbmQgd2l0aCB0aGUgZ2l2ZW4gYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgICAtIGBjbGlja2AgYmluZCB0byBjbGljayBldmVudHMgW3RydWVdXG4gICAqICAgIC0gYHBvcHN0YXRlYCBiaW5kIHRvIHBvcHN0YXRlIFt0cnVlXVxuICAgKiAgICAtIGBkaXNwYXRjaGAgcGVyZm9ybSBpbml0aWFsIGRpc3BhdGNoIFt0cnVlXVxuICAgKlxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xuICAgKiBAYXBpIHB1YmxpY1xuICAgKi9cblxuICBwYWdlLnN0YXJ0ID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgIGlmIChydW5uaW5nKSByZXR1cm47XG4gICAgcnVubmluZyA9IHRydWU7XG4gICAgaWYgKGZhbHNlID09PSBvcHRpb25zLmRpc3BhdGNoKSBkaXNwYXRjaCA9IGZhbHNlO1xuICAgIGlmIChmYWxzZSA9PT0gb3B0aW9ucy5kZWNvZGVVUkxDb21wb25lbnRzKSBkZWNvZGVVUkxDb21wb25lbnRzID0gZmFsc2U7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLnBvcHN0YXRlKSB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBvbnBvcHN0YXRlLCBmYWxzZSk7XG4gICAgaWYgKGZhbHNlICE9PSBvcHRpb25zLmNsaWNrKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGNsaWNrRXZlbnQsIG9uY2xpY2ssIGZhbHNlKTtcbiAgICB9XG4gICAgaWYgKHRydWUgPT09IG9wdGlvbnMuaGFzaGJhbmcpIGhhc2hiYW5nID0gdHJ1ZTtcbiAgICBpZiAoIWRpc3BhdGNoKSByZXR1cm47XG4gICAgdmFyIHVybCA9IChoYXNoYmFuZyAmJiB+bG9jYXRpb24uaGFzaC5pbmRleE9mKCcjIScpKSA/IGxvY2F0aW9uLmhhc2guc3Vic3RyKDIpICsgbG9jYXRpb24uc2VhcmNoIDogbG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5zZWFyY2ggKyBsb2NhdGlvbi5oYXNoO1xuICAgIHBhZ2UucmVwbGFjZSh1cmwsIG51bGwsIHRydWUsIGRpc3BhdGNoKTtcbiAgfTtcblxuICAvKipcbiAgICogVW5iaW5kIGNsaWNrIGFuZCBwb3BzdGF0ZSBldmVudCBoYW5kbGVycy5cbiAgICpcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5zdG9wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCFydW5uaW5nKSByZXR1cm47XG4gICAgcGFnZS5jdXJyZW50ID0gJyc7XG4gICAgcGFnZS5sZW4gPSAwO1xuICAgIHJ1bm5pbmcgPSBmYWxzZTtcbiAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGNsaWNrRXZlbnQsIG9uY2xpY2ssIGZhbHNlKTtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9wc3RhdGUnLCBvbnBvcHN0YXRlLCBmYWxzZSk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNob3cgYHBhdGhgIHdpdGggb3B0aW9uYWwgYHN0YXRlYCBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZVxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGRpc3BhdGNoXG4gICAqIEByZXR1cm4ge0NvbnRleHR9XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIHBhZ2Uuc2hvdyA9IGZ1bmN0aW9uKHBhdGgsIHN0YXRlLCBkaXNwYXRjaCwgcHVzaCkge1xuICAgIHZhciBjdHggPSBuZXcgQ29udGV4dChwYXRoLCBzdGF0ZSk7XG4gICAgcGFnZS5jdXJyZW50ID0gY3R4LnBhdGg7XG4gICAgaWYgKGZhbHNlICE9PSBkaXNwYXRjaCkgcGFnZS5kaXNwYXRjaChjdHgpO1xuICAgIGlmIChmYWxzZSAhPT0gY3R4LmhhbmRsZWQgJiYgZmFsc2UgIT09IHB1c2gpIGN0eC5wdXNoU3RhdGUoKTtcbiAgICByZXR1cm4gY3R4O1xuICB9O1xuXG4gIC8qKlxuICAgKiBHb2VzIGJhY2sgaW4gdGhlIGhpc3RvcnlcbiAgICogQmFjayBzaG91bGQgYWx3YXlzIGxldCB0aGUgY3VycmVudCByb3V0ZSBwdXNoIHN0YXRlIGFuZCB0aGVuIGdvIGJhY2suXG4gICAqXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gZmFsbGJhY2sgcGF0aCB0byBnbyBiYWNrIGlmIG5vIG1vcmUgaGlzdG9yeSBleGlzdHMsIGlmIHVuZGVmaW5lZCBkZWZhdWx0cyB0byBwYWdlLmJhc2VcbiAgICogQHBhcmFtIHtPYmplY3R9IFtzdGF0ZV1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgcGFnZS5iYWNrID0gZnVuY3Rpb24ocGF0aCwgc3RhdGUpIHtcbiAgICBpZiAocGFnZS5sZW4gPiAwKSB7XG4gICAgICAvLyB0aGlzIG1heSBuZWVkIG1vcmUgdGVzdGluZyB0byBzZWUgaWYgYWxsIGJyb3dzZXJzXG4gICAgICAvLyB3YWl0IGZvciB0aGUgbmV4dCB0aWNrIHRvIGdvIGJhY2sgaW4gaGlzdG9yeVxuICAgICAgaGlzdG9yeS5iYWNrKCk7XG4gICAgICBwYWdlLmxlbi0tO1xuICAgIH0gZWxzZSBpZiAocGF0aCkge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5zaG93KHBhdGgsIHN0YXRlKTtcbiAgICAgIH0pO1xuICAgIH1lbHNle1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5zaG93KGJhc2UsIHN0YXRlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBSZWdpc3RlciByb3V0ZSB0byByZWRpcmVjdCBmcm9tIG9uZSBwYXRoIHRvIG90aGVyXG4gICAqIG9yIGp1c3QgcmVkaXJlY3QgdG8gYW5vdGhlciByb3V0ZVxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gZnJvbSAtIGlmIHBhcmFtICd0bycgaXMgdW5kZWZpbmVkIHJlZGlyZWN0cyB0byAnZnJvbSdcbiAgICogQHBhcmFtIHtTdHJpbmd9IFt0b11cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHBhZ2UucmVkaXJlY3QgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICAgIC8vIERlZmluZSByb3V0ZSBmcm9tIGEgcGF0aCB0byBhbm90aGVyXG4gICAgaWYgKCdzdHJpbmcnID09PSB0eXBlb2YgZnJvbSAmJiAnc3RyaW5nJyA9PT0gdHlwZW9mIHRvKSB7XG4gICAgICBwYWdlKGZyb20sIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICBwYWdlLnJlcGxhY2UodG8pO1xuICAgICAgICB9LCAwKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIFdhaXQgZm9yIHRoZSBwdXNoIHN0YXRlIGFuZCByZXBsYWNlIGl0IHdpdGggYW5vdGhlclxuICAgIGlmICgnc3RyaW5nJyA9PT0gdHlwZW9mIGZyb20gJiYgJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB0bykge1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgcGFnZS5yZXBsYWNlKGZyb20pO1xuICAgICAgfSwgMCk7XG4gICAgfVxuICB9O1xuXG4gIC8qKlxuICAgKiBSZXBsYWNlIGBwYXRoYCB3aXRoIG9wdGlvbmFsIGBzdGF0ZWAgb2JqZWN0LlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQHJldHVybiB7Q29udGV4dH1cbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cblxuICBwYWdlLnJlcGxhY2UgPSBmdW5jdGlvbihwYXRoLCBzdGF0ZSwgaW5pdCwgZGlzcGF0Y2gpIHtcbiAgICB2YXIgY3R4ID0gbmV3IENvbnRleHQocGF0aCwgc3RhdGUpO1xuICAgIHBhZ2UuY3VycmVudCA9IGN0eC5wYXRoO1xuICAgIGN0eC5pbml0ID0gaW5pdDtcbiAgICBjdHguc2F2ZSgpOyAvLyBzYXZlIGJlZm9yZSBkaXNwYXRjaGluZywgd2hpY2ggbWF5IHJlZGlyZWN0XG4gICAgaWYgKGZhbHNlICE9PSBkaXNwYXRjaCkgcGFnZS5kaXNwYXRjaChjdHgpO1xuICAgIHJldHVybiBjdHg7XG4gIH07XG5cbiAgLyoqXG4gICAqIERpc3BhdGNoIHRoZSBnaXZlbiBgY3R4YC5cbiAgICpcbiAgICogQHBhcmFtIHtPYmplY3R9IGN0eFxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgcGFnZS5kaXNwYXRjaCA9IGZ1bmN0aW9uKGN0eCkge1xuICAgIHZhciBwcmV2ID0gcHJldkNvbnRleHQsXG4gICAgICBpID0gMCxcbiAgICAgIGogPSAwO1xuXG4gICAgcHJldkNvbnRleHQgPSBjdHg7XG5cbiAgICBmdW5jdGlvbiBuZXh0RXhpdCgpIHtcbiAgICAgIHZhciBmbiA9IHBhZ2UuZXhpdHNbaisrXTtcbiAgICAgIGlmICghZm4pIHJldHVybiBuZXh0RW50ZXIoKTtcbiAgICAgIGZuKHByZXYsIG5leHRFeGl0KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBuZXh0RW50ZXIoKSB7XG4gICAgICB2YXIgZm4gPSBwYWdlLmNhbGxiYWNrc1tpKytdO1xuXG4gICAgICBpZiAoY3R4LnBhdGggIT09IHBhZ2UuY3VycmVudCkge1xuICAgICAgICBjdHguaGFuZGxlZCA9IGZhbHNlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoIWZuKSByZXR1cm4gdW5oYW5kbGVkKGN0eCk7XG4gICAgICBmbihjdHgsIG5leHRFbnRlcik7XG4gICAgfVxuXG4gICAgaWYgKHByZXYpIHtcbiAgICAgIG5leHRFeGl0KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5leHRFbnRlcigpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogVW5oYW5kbGVkIGBjdHhgLiBXaGVuIGl0J3Mgbm90IHRoZSBpbml0aWFsXG4gICAqIHBvcHN0YXRlIHRoZW4gcmVkaXJlY3QuIElmIHlvdSB3aXNoIHRvIGhhbmRsZVxuICAgKiA0MDRzIG9uIHlvdXIgb3duIHVzZSBgcGFnZSgnKicsIGNhbGxiYWNrKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7Q29udGV4dH0gY3R4XG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBmdW5jdGlvbiB1bmhhbmRsZWQoY3R4KSB7XG4gICAgaWYgKGN0eC5oYW5kbGVkKSByZXR1cm47XG4gICAgdmFyIGN1cnJlbnQ7XG5cbiAgICBpZiAoaGFzaGJhbmcpIHtcbiAgICAgIGN1cnJlbnQgPSBiYXNlICsgbG9jYXRpb24uaGFzaC5yZXBsYWNlKCcjIScsICcnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY3VycmVudCA9IGxvY2F0aW9uLnBhdGhuYW1lICsgbG9jYXRpb24uc2VhcmNoO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50ID09PSBjdHguY2Fub25pY2FsUGF0aCkgcmV0dXJuO1xuICAgIHBhZ2Uuc3RvcCgpO1xuICAgIGN0eC5oYW5kbGVkID0gZmFsc2U7XG4gICAgbG9jYXRpb24uaHJlZiA9IGN0eC5jYW5vbmljYWxQYXRoO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGFuIGV4aXQgcm91dGUgb24gYHBhdGhgIHdpdGhcbiAgICogY2FsbGJhY2sgYGZuKClgLCB3aGljaCB3aWxsIGJlIGNhbGxlZFxuICAgKiBvbiB0aGUgcHJldmlvdXMgY29udGV4dCB3aGVuIGEgbmV3XG4gICAqIHBhZ2UgaXMgdmlzaXRlZC5cbiAgICovXG4gIHBhZ2UuZXhpdCA9IGZ1bmN0aW9uKHBhdGgsIGZuKSB7XG4gICAgaWYgKHR5cGVvZiBwYXRoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICByZXR1cm4gcGFnZS5leGl0KCcqJywgcGF0aCk7XG4gICAgfVxuXG4gICAgdmFyIHJvdXRlID0gbmV3IFJvdXRlKHBhdGgpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBwYWdlLmV4aXRzLnB1c2gocm91dGUubWlkZGxld2FyZShhcmd1bWVudHNbaV0pKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBVUkwgZW5jb2RpbmcgZnJvbSB0aGUgZ2l2ZW4gYHN0cmAuXG4gICAqIEFjY29tbW9kYXRlcyB3aGl0ZXNwYWNlIGluIGJvdGggeC13d3ctZm9ybS11cmxlbmNvZGVkXG4gICAqIGFuZCByZWd1bGFyIHBlcmNlbnQtZW5jb2RlZCBmb3JtLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cn0gVVJMIGNvbXBvbmVudCB0byBkZWNvZGVcbiAgICovXG4gIGZ1bmN0aW9uIGRlY29kZVVSTEVuY29kZWRVUklDb21wb25lbnQodmFsKSB7XG4gICAgaWYgKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7IHJldHVybiB2YWw7IH1cbiAgICByZXR1cm4gZGVjb2RlVVJMQ29tcG9uZW50cyA/IGRlY29kZVVSSUNvbXBvbmVudCh2YWwucmVwbGFjZSgvXFwrL2csICcgJykpIDogdmFsO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYWxpemUgYSBuZXcgXCJyZXF1ZXN0XCIgYENvbnRleHRgXG4gICAqIHdpdGggdGhlIGdpdmVuIGBwYXRoYCBhbmQgb3B0aW9uYWwgaW5pdGlhbCBgc3RhdGVgLlxuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gc3RhdGVcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG5cbiAgZnVuY3Rpb24gQ29udGV4dChwYXRoLCBzdGF0ZSkge1xuICAgIGlmICgnLycgPT09IHBhdGhbMF0gJiYgMCAhPT0gcGF0aC5pbmRleE9mKGJhc2UpKSBwYXRoID0gYmFzZSArIChoYXNoYmFuZyA/ICcjIScgOiAnJykgKyBwYXRoO1xuICAgIHZhciBpID0gcGF0aC5pbmRleE9mKCc/Jyk7XG5cbiAgICB0aGlzLmNhbm9uaWNhbFBhdGggPSBwYXRoO1xuICAgIHRoaXMucGF0aCA9IHBhdGgucmVwbGFjZShiYXNlLCAnJykgfHwgJy8nO1xuICAgIGlmIChoYXNoYmFuZykgdGhpcy5wYXRoID0gdGhpcy5wYXRoLnJlcGxhY2UoJyMhJywgJycpIHx8ICcvJztcblxuICAgIHRoaXMudGl0bGUgPSBkb2N1bWVudC50aXRsZTtcbiAgICB0aGlzLnN0YXRlID0gc3RhdGUgfHwge307XG4gICAgdGhpcy5zdGF0ZS5wYXRoID0gcGF0aDtcbiAgICB0aGlzLnF1ZXJ5c3RyaW5nID0gfmkgPyBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhdGguc2xpY2UoaSArIDEpKSA6ICcnO1xuICAgIHRoaXMucGF0aG5hbWUgPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KH5pID8gcGF0aC5zbGljZSgwLCBpKSA6IHBhdGgpO1xuICAgIHRoaXMucGFyYW1zID0ge307XG5cbiAgICAvLyBmcmFnbWVudFxuICAgIHRoaXMuaGFzaCA9ICcnO1xuICAgIGlmICghaGFzaGJhbmcpIHtcbiAgICAgIGlmICghfnRoaXMucGF0aC5pbmRleE9mKCcjJykpIHJldHVybjtcbiAgICAgIHZhciBwYXJ0cyA9IHRoaXMucGF0aC5zcGxpdCgnIycpO1xuICAgICAgdGhpcy5wYXRoID0gcGFydHNbMF07XG4gICAgICB0aGlzLmhhc2ggPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KHBhcnRzWzFdKSB8fCAnJztcbiAgICAgIHRoaXMucXVlcnlzdHJpbmcgPSB0aGlzLnF1ZXJ5c3RyaW5nLnNwbGl0KCcjJylbMF07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBgQ29udGV4dGAuXG4gICAqL1xuXG4gIHBhZ2UuQ29udGV4dCA9IENvbnRleHQ7XG5cbiAgLyoqXG4gICAqIFB1c2ggc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHJpdmF0ZVxuICAgKi9cblxuICBDb250ZXh0LnByb3RvdHlwZS5wdXNoU3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgICBwYWdlLmxlbisrO1xuICAgIGhpc3RvcnkucHVzaFN0YXRlKHRoaXMuc3RhdGUsIHRoaXMudGl0bGUsIGhhc2hiYW5nICYmIHRoaXMucGF0aCAhPT0gJy8nID8gJyMhJyArIHRoaXMucGF0aCA6IHRoaXMuY2Fub25pY2FsUGF0aCk7XG4gIH07XG5cbiAgLyoqXG4gICAqIFNhdmUgdGhlIGNvbnRleHQgc3RhdGUuXG4gICAqXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIENvbnRleHQucHJvdG90eXBlLnNhdmUgPSBmdW5jdGlvbigpIHtcbiAgICBoaXN0b3J5LnJlcGxhY2VTdGF0ZSh0aGlzLnN0YXRlLCB0aGlzLnRpdGxlLCBoYXNoYmFuZyAmJiB0aGlzLnBhdGggIT09ICcvJyA/ICcjIScgKyB0aGlzLnBhdGggOiB0aGlzLmNhbm9uaWNhbFBhdGgpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBJbml0aWFsaXplIGBSb3V0ZWAgd2l0aCB0aGUgZ2l2ZW4gSFRUUCBgcGF0aGAsXG4gICAqIGFuZCBhbiBhcnJheSBvZiBgY2FsbGJhY2tzYCBhbmQgYG9wdGlvbnNgLlxuICAgKlxuICAgKiBPcHRpb25zOlxuICAgKlxuICAgKiAgIC0gYHNlbnNpdGl2ZWAgICAgZW5hYmxlIGNhc2Utc2Vuc2l0aXZlIHJvdXRlc1xuICAgKiAgIC0gYHN0cmljdGAgICAgICAgZW5hYmxlIHN0cmljdCBtYXRjaGluZyBmb3IgdHJhaWxpbmcgc2xhc2hlc1xuICAgKlxuICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aFxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucy5cbiAgICogQGFwaSBwcml2YXRlXG4gICAqL1xuXG4gIGZ1bmN0aW9uIFJvdXRlKHBhdGgsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICB0aGlzLnBhdGggPSAocGF0aCA9PT0gJyonKSA/ICcoLiopJyA6IHBhdGg7XG4gICAgdGhpcy5tZXRob2QgPSAnR0VUJztcbiAgICB0aGlzLnJlZ2V4cCA9IHBhdGh0b1JlZ2V4cCh0aGlzLnBhdGgsXG4gICAgICB0aGlzLmtleXMgPSBbXSxcbiAgICAgIG9wdGlvbnMuc2Vuc2l0aXZlLFxuICAgICAgb3B0aW9ucy5zdHJpY3QpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4cG9zZSBgUm91dGVgLlxuICAgKi9cblxuICBwYWdlLlJvdXRlID0gUm91dGU7XG5cbiAgLyoqXG4gICAqIFJldHVybiByb3V0ZSBtaWRkbGV3YXJlIHdpdGhcbiAgICogdGhlIGdpdmVuIGNhbGxiYWNrIGBmbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAgICogQHJldHVybiB7RnVuY3Rpb259XG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuXG4gIFJvdXRlLnByb3RvdHlwZS5taWRkbGV3YXJlID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGN0eCwgbmV4dCkge1xuICAgICAgaWYgKHNlbGYubWF0Y2goY3R4LnBhdGgsIGN0eC5wYXJhbXMpKSByZXR1cm4gZm4oY3R4LCBuZXh0KTtcbiAgICAgIG5leHQoKTtcbiAgICB9O1xuICB9O1xuXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGlzIHJvdXRlIG1hdGNoZXMgYHBhdGhgLCBpZiBzb1xuICAgKiBwb3B1bGF0ZSBgcGFyYW1zYC5cbiAgICpcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBhdGhcbiAgICogQHBhcmFtIHtPYmplY3R9IHBhcmFtc1xuICAgKiBAcmV0dXJuIHtCb29sZWFufVxuICAgKiBAYXBpIHByaXZhdGVcbiAgICovXG5cbiAgUm91dGUucHJvdG90eXBlLm1hdGNoID0gZnVuY3Rpb24ocGF0aCwgcGFyYW1zKSB7XG4gICAgdmFyIGtleXMgPSB0aGlzLmtleXMsXG4gICAgICBxc0luZGV4ID0gcGF0aC5pbmRleE9mKCc/JyksXG4gICAgICBwYXRobmFtZSA9IH5xc0luZGV4ID8gcGF0aC5zbGljZSgwLCBxc0luZGV4KSA6IHBhdGgsXG4gICAgICBtID0gdGhpcy5yZWdleHAuZXhlYyhkZWNvZGVVUklDb21wb25lbnQocGF0aG5hbWUpKTtcblxuICAgIGlmICghbSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDEsIGxlbiA9IG0ubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcbiAgICAgIHZhciBrZXkgPSBrZXlzW2kgLSAxXTtcbiAgICAgIHZhciB2YWwgPSBkZWNvZGVVUkxFbmNvZGVkVVJJQ29tcG9uZW50KG1baV0pO1xuICAgICAgaWYgKHZhbCAhPT0gdW5kZWZpbmVkIHx8ICEoaGFzT3duUHJvcGVydHkuY2FsbChwYXJhbXMsIGtleS5uYW1lKSkpIHtcbiAgICAgICAgcGFyYW1zW2tleS5uYW1lXSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBIYW5kbGUgXCJwb3B1bGF0ZVwiIGV2ZW50cy5cbiAgICovXG5cbiAgdmFyIG9ucG9wc3RhdGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBsb2FkZWQgPSBmYWxzZTtcbiAgICBpZiAoJ3VuZGVmaW5lZCcgPT09IHR5cGVvZiB3aW5kb3cpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdjb21wbGV0ZScpIHtcbiAgICAgIGxvYWRlZCA9IHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdsb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgfSwgMCk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG9ucG9wc3RhdGUoZSkge1xuICAgICAgaWYgKCFsb2FkZWQpIHJldHVybjtcbiAgICAgIGlmIChlLnN0YXRlKSB7XG4gICAgICAgIHZhciBwYXRoID0gZS5zdGF0ZS5wYXRoO1xuICAgICAgICBwYWdlLnJlcGxhY2UocGF0aCwgZS5zdGF0ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlLnNob3cobG9jYXRpb24ucGF0aG5hbWUgKyBsb2NhdGlvbi5oYXNoLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgZmFsc2UpO1xuICAgICAgfVxuICAgIH07XG4gIH0pKCk7XG4gIC8qKlxuICAgKiBIYW5kbGUgXCJjbGlja1wiIGV2ZW50cy5cbiAgICovXG5cbiAgZnVuY3Rpb24gb25jbGljayhlKSB7XG5cbiAgICBpZiAoMSAhPT0gd2hpY2goZSkpIHJldHVybjtcblxuICAgIGlmIChlLm1ldGFLZXkgfHwgZS5jdHJsS2V5IHx8IGUuc2hpZnRLZXkpIHJldHVybjtcbiAgICBpZiAoZS5kZWZhdWx0UHJldmVudGVkKSByZXR1cm47XG5cblxuXG4gICAgLy8gZW5zdXJlIGxpbmtcbiAgICB2YXIgZWwgPSBlLnRhcmdldDtcbiAgICB3aGlsZSAoZWwgJiYgJ0EnICE9PSBlbC5ub2RlTmFtZSkgZWwgPSBlbC5wYXJlbnROb2RlO1xuICAgIGlmICghZWwgfHwgJ0EnICE9PSBlbC5ub2RlTmFtZSkgcmV0dXJuO1xuXG5cblxuICAgIC8vIElnbm9yZSBpZiB0YWcgaGFzXG4gICAgLy8gMS4gXCJkb3dubG9hZFwiIGF0dHJpYnV0ZVxuICAgIC8vIDIuIHJlbD1cImV4dGVybmFsXCIgYXR0cmlidXRlXG4gICAgaWYgKGVsLmhhc0F0dHJpYnV0ZSgnZG93bmxvYWQnKSB8fCBlbC5nZXRBdHRyaWJ1dGUoJ3JlbCcpID09PSAnZXh0ZXJuYWwnKSByZXR1cm47XG5cbiAgICAvLyBlbnN1cmUgbm9uLWhhc2ggZm9yIHRoZSBzYW1lIHBhdGhcbiAgICB2YXIgbGluayA9IGVsLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgIGlmICghaGFzaGJhbmcgJiYgZWwucGF0aG5hbWUgPT09IGxvY2F0aW9uLnBhdGhuYW1lICYmIChlbC5oYXNoIHx8ICcjJyA9PT0gbGluaykpIHJldHVybjtcblxuXG5cbiAgICAvLyBDaGVjayBmb3IgbWFpbHRvOiBpbiB0aGUgaHJlZlxuICAgIGlmIChsaW5rICYmIGxpbmsuaW5kZXhPZignbWFpbHRvOicpID4gLTEpIHJldHVybjtcblxuICAgIC8vIGNoZWNrIHRhcmdldFxuICAgIGlmIChlbC50YXJnZXQpIHJldHVybjtcblxuICAgIC8vIHgtb3JpZ2luXG4gICAgaWYgKCFzYW1lT3JpZ2luKGVsLmhyZWYpKSByZXR1cm47XG5cblxuXG4gICAgLy8gcmVidWlsZCBwYXRoXG4gICAgdmFyIHBhdGggPSBlbC5wYXRobmFtZSArIGVsLnNlYXJjaCArIChlbC5oYXNoIHx8ICcnKTtcblxuICAgIC8vIHN0cmlwIGxlYWRpbmcgXCIvW2RyaXZlIGxldHRlcl06XCIgb24gTlcuanMgb24gV2luZG93c1xuICAgIGlmICh0eXBlb2YgcHJvY2VzcyAhPT0gJ3VuZGVmaW5lZCcgJiYgcGF0aC5tYXRjaCgvXlxcL1thLXpBLVpdOlxcLy8pKSB7XG4gICAgICBwYXRoID0gcGF0aC5yZXBsYWNlKC9eXFwvW2EtekEtWl06XFwvLywgJy8nKTtcbiAgICB9XG5cbiAgICAvLyBzYW1lIHBhZ2VcbiAgICB2YXIgb3JpZyA9IHBhdGg7XG5cbiAgICBpZiAocGF0aC5pbmRleE9mKGJhc2UpID09PSAwKSB7XG4gICAgICBwYXRoID0gcGF0aC5zdWJzdHIoYmFzZS5sZW5ndGgpO1xuICAgIH1cblxuICAgIGlmIChoYXNoYmFuZykgcGF0aCA9IHBhdGgucmVwbGFjZSgnIyEnLCAnJyk7XG5cbiAgICBpZiAoYmFzZSAmJiBvcmlnID09PSBwYXRoKSByZXR1cm47XG5cbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgcGFnZS5zaG93KG9yaWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIEV2ZW50IGJ1dHRvbi5cbiAgICovXG5cbiAgZnVuY3Rpb24gd2hpY2goZSkge1xuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudDtcbiAgICByZXR1cm4gbnVsbCA9PT0gZS53aGljaCA/IGUuYnV0dG9uIDogZS53aGljaDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayBpZiBgaHJlZmAgaXMgdGhlIHNhbWUgb3JpZ2luLlxuICAgKi9cblxuICBmdW5jdGlvbiBzYW1lT3JpZ2luKGhyZWYpIHtcbiAgICB2YXIgb3JpZ2luID0gbG9jYXRpb24ucHJvdG9jb2wgKyAnLy8nICsgbG9jYXRpb24uaG9zdG5hbWU7XG4gICAgaWYgKGxvY2F0aW9uLnBvcnQpIG9yaWdpbiArPSAnOicgKyBsb2NhdGlvbi5wb3J0O1xuICAgIHJldHVybiAoaHJlZiAmJiAoMCA9PT0gaHJlZi5pbmRleE9mKG9yaWdpbikpKTtcbiAgfVxuXG4gIHBhZ2Uuc2FtZU9yaWdpbiA9IHNhbWVPcmlnaW47XG4iLCJ2YXIgaXNhcnJheSA9IHJlcXVpcmUoJ2lzYXJyYXknKVxuXG4vKipcbiAqIEV4cG9zZSBgcGF0aFRvUmVnZXhwYC5cbiAqL1xubW9kdWxlLmV4cG9ydHMgPSBwYXRoVG9SZWdleHBcbm1vZHVsZS5leHBvcnRzLnBhcnNlID0gcGFyc2Vcbm1vZHVsZS5leHBvcnRzLmNvbXBpbGUgPSBjb21waWxlXG5tb2R1bGUuZXhwb3J0cy50b2tlbnNUb0Z1bmN0aW9uID0gdG9rZW5zVG9GdW5jdGlvblxubW9kdWxlLmV4cG9ydHMudG9rZW5zVG9SZWdFeHAgPSB0b2tlbnNUb1JlZ0V4cFxuXG4vKipcbiAqIFRoZSBtYWluIHBhdGggbWF0Y2hpbmcgcmVnZXhwIHV0aWxpdHkuXG4gKlxuICogQHR5cGUge1JlZ0V4cH1cbiAqL1xudmFyIFBBVEhfUkVHRVhQID0gbmV3IFJlZ0V4cChbXG4gIC8vIE1hdGNoIGVzY2FwZWQgY2hhcmFjdGVycyB0aGF0IHdvdWxkIG90aGVyd2lzZSBhcHBlYXIgaW4gZnV0dXJlIG1hdGNoZXMuXG4gIC8vIFRoaXMgYWxsb3dzIHRoZSB1c2VyIHRvIGVzY2FwZSBzcGVjaWFsIGNoYXJhY3RlcnMgdGhhdCB3b24ndCB0cmFuc2Zvcm0uXG4gICcoXFxcXFxcXFwuKScsXG4gIC8vIE1hdGNoIEV4cHJlc3Mtc3R5bGUgcGFyYW1ldGVycyBhbmQgdW4tbmFtZWQgcGFyYW1ldGVycyB3aXRoIGEgcHJlZml4XG4gIC8vIGFuZCBvcHRpb25hbCBzdWZmaXhlcy4gTWF0Y2hlcyBhcHBlYXIgYXM6XG4gIC8vXG4gIC8vIFwiLzp0ZXN0KFxcXFxkKyk/XCIgPT4gW1wiL1wiLCBcInRlc3RcIiwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgXCI/XCIsIHVuZGVmaW5lZF1cbiAgLy8gXCIvcm91dGUoXFxcXGQrKVwiICA9PiBbdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCJcXGQrXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkXVxuICAvLyBcIi8qXCIgICAgICAgICAgICA9PiBbXCIvXCIsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLCB1bmRlZmluZWQsIHVuZGVmaW5lZCwgXCIqXCJdXG4gICcoW1xcXFwvLl0pPyg/Oig/OlxcXFw6KFxcXFx3KykoPzpcXFxcKCgoPzpcXFxcXFxcXC58W14oKV0pKylcXFxcKSk/fFxcXFwoKCg/OlxcXFxcXFxcLnxbXigpXSkrKVxcXFwpKShbKyo/XSk/fChcXFxcKikpJ1xuXS5qb2luKCd8JyksICdnJylcblxuLyoqXG4gKiBQYXJzZSBhIHN0cmluZyBmb3IgdGhlIHJhdyB0b2tlbnMuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge0FycmF5fVxuICovXG5mdW5jdGlvbiBwYXJzZSAoc3RyKSB7XG4gIHZhciB0b2tlbnMgPSBbXVxuICB2YXIga2V5ID0gMFxuICB2YXIgaW5kZXggPSAwXG4gIHZhciBwYXRoID0gJydcbiAgdmFyIHJlc1xuXG4gIHdoaWxlICgocmVzID0gUEFUSF9SRUdFWFAuZXhlYyhzdHIpKSAhPSBudWxsKSB7XG4gICAgdmFyIG0gPSByZXNbMF1cbiAgICB2YXIgZXNjYXBlZCA9IHJlc1sxXVxuICAgIHZhciBvZmZzZXQgPSByZXMuaW5kZXhcbiAgICBwYXRoICs9IHN0ci5zbGljZShpbmRleCwgb2Zmc2V0KVxuICAgIGluZGV4ID0gb2Zmc2V0ICsgbS5sZW5ndGhcblxuICAgIC8vIElnbm9yZSBhbHJlYWR5IGVzY2FwZWQgc2VxdWVuY2VzLlxuICAgIGlmIChlc2NhcGVkKSB7XG4gICAgICBwYXRoICs9IGVzY2FwZWRbMV1cbiAgICAgIGNvbnRpbnVlXG4gICAgfVxuXG4gICAgLy8gUHVzaCB0aGUgY3VycmVudCBwYXRoIG9udG8gdGhlIHRva2Vucy5cbiAgICBpZiAocGF0aCkge1xuICAgICAgdG9rZW5zLnB1c2gocGF0aClcbiAgICAgIHBhdGggPSAnJ1xuICAgIH1cblxuICAgIHZhciBwcmVmaXggPSByZXNbMl1cbiAgICB2YXIgbmFtZSA9IHJlc1szXVxuICAgIHZhciBjYXB0dXJlID0gcmVzWzRdXG4gICAgdmFyIGdyb3VwID0gcmVzWzVdXG4gICAgdmFyIHN1ZmZpeCA9IHJlc1s2XVxuICAgIHZhciBhc3RlcmlzayA9IHJlc1s3XVxuXG4gICAgdmFyIHJlcGVhdCA9IHN1ZmZpeCA9PT0gJysnIHx8IHN1ZmZpeCA9PT0gJyonXG4gICAgdmFyIG9wdGlvbmFsID0gc3VmZml4ID09PSAnPycgfHwgc3VmZml4ID09PSAnKidcbiAgICB2YXIgZGVsaW1pdGVyID0gcHJlZml4IHx8ICcvJ1xuICAgIHZhciBwYXR0ZXJuID0gY2FwdHVyZSB8fCBncm91cCB8fCAoYXN0ZXJpc2sgPyAnLionIDogJ1teJyArIGRlbGltaXRlciArICddKz8nKVxuXG4gICAgdG9rZW5zLnB1c2goe1xuICAgICAgbmFtZTogbmFtZSB8fCBrZXkrKyxcbiAgICAgIHByZWZpeDogcHJlZml4IHx8ICcnLFxuICAgICAgZGVsaW1pdGVyOiBkZWxpbWl0ZXIsXG4gICAgICBvcHRpb25hbDogb3B0aW9uYWwsXG4gICAgICByZXBlYXQ6IHJlcGVhdCxcbiAgICAgIHBhdHRlcm46IGVzY2FwZUdyb3VwKHBhdHRlcm4pXG4gICAgfSlcbiAgfVxuXG4gIC8vIE1hdGNoIGFueSBjaGFyYWN0ZXJzIHN0aWxsIHJlbWFpbmluZy5cbiAgaWYgKGluZGV4IDwgc3RyLmxlbmd0aCkge1xuICAgIHBhdGggKz0gc3RyLnN1YnN0cihpbmRleClcbiAgfVxuXG4gIC8vIElmIHRoZSBwYXRoIGV4aXN0cywgcHVzaCBpdCBvbnRvIHRoZSBlbmQuXG4gIGlmIChwYXRoKSB7XG4gICAgdG9rZW5zLnB1c2gocGF0aClcbiAgfVxuXG4gIHJldHVybiB0b2tlbnNcbn1cblxuLyoqXG4gKiBDb21waWxlIGEgc3RyaW5nIHRvIGEgdGVtcGxhdGUgZnVuY3Rpb24gZm9yIHRoZSBwYXRoLlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gICBzdHJcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufVxuICovXG5mdW5jdGlvbiBjb21waWxlIChzdHIpIHtcbiAgcmV0dXJuIHRva2Vuc1RvRnVuY3Rpb24ocGFyc2Uoc3RyKSlcbn1cblxuLyoqXG4gKiBFeHBvc2UgYSBtZXRob2QgZm9yIHRyYW5zZm9ybWluZyB0b2tlbnMgaW50byB0aGUgcGF0aCBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gdG9rZW5zVG9GdW5jdGlvbiAodG9rZW5zKSB7XG4gIC8vIENvbXBpbGUgYWxsIHRoZSB0b2tlbnMgaW50byByZWdleHBzLlxuICB2YXIgbWF0Y2hlcyA9IG5ldyBBcnJheSh0b2tlbnMubGVuZ3RoKVxuXG4gIC8vIENvbXBpbGUgYWxsIHRoZSBwYXR0ZXJucyBiZWZvcmUgY29tcGlsYXRpb24uXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbnNbaV0gPT09ICdvYmplY3QnKSB7XG4gICAgICBtYXRjaGVzW2ldID0gbmV3IFJlZ0V4cCgnXicgKyB0b2tlbnNbaV0ucGF0dGVybiArICckJylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZnVuY3Rpb24gKG9iaikge1xuICAgIHZhciBwYXRoID0gJydcbiAgICB2YXIgZGF0YSA9IG9iaiB8fCB7fVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgICAgICBwYXRoICs9IHRva2VuXG5cbiAgICAgICAgY29udGludWVcbiAgICAgIH1cblxuICAgICAgdmFyIHZhbHVlID0gZGF0YVt0b2tlbi5uYW1lXVxuICAgICAgdmFyIHNlZ21lbnRcblxuICAgICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgICAgY29udGludWVcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIGJlIGRlZmluZWQnKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChpc2FycmF5KHZhbHVlKSkge1xuICAgICAgICBpZiAoIXRva2VuLnJlcGVhdCkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IHJlcGVhdCwgYnV0IHJlY2VpdmVkIFwiJyArIHZhbHVlICsgJ1wiJylcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBpZiAodG9rZW4ub3B0aW9uYWwpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFwiJyArIHRva2VuLm5hbWUgKyAnXCIgdG8gbm90IGJlIGVtcHR5JylcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHZhbHVlLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgc2VnbWVudCA9IGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZVtqXSlcblxuICAgICAgICAgIGlmICghbWF0Y2hlc1tpXS50ZXN0KHNlZ21lbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBhbGwgXCInICsgdG9rZW4ubmFtZSArICdcIiB0byBtYXRjaCBcIicgKyB0b2tlbi5wYXR0ZXJuICsgJ1wiLCBidXQgcmVjZWl2ZWQgXCInICsgc2VnbWVudCArICdcIicpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcGF0aCArPSAoaiA9PT0gMCA/IHRva2VuLnByZWZpeCA6IHRva2VuLmRlbGltaXRlcikgKyBzZWdtZW50XG4gICAgICAgIH1cblxuICAgICAgICBjb250aW51ZVxuICAgICAgfVxuXG4gICAgICBzZWdtZW50ID0gZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKVxuXG4gICAgICBpZiAoIW1hdGNoZXNbaV0udGVzdChzZWdtZW50KSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdFeHBlY3RlZCBcIicgKyB0b2tlbi5uYW1lICsgJ1wiIHRvIG1hdGNoIFwiJyArIHRva2VuLnBhdHRlcm4gKyAnXCIsIGJ1dCByZWNlaXZlZCBcIicgKyBzZWdtZW50ICsgJ1wiJylcbiAgICAgIH1cblxuICAgICAgcGF0aCArPSB0b2tlbi5wcmVmaXggKyBzZWdtZW50XG4gICAgfVxuXG4gICAgcmV0dXJuIHBhdGhcbiAgfVxufVxuXG4vKipcbiAqIEVzY2FwZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtICB7U3RyaW5nfSBzdHJcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZnVuY3Rpb24gZXNjYXBlU3RyaW5nIChzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oWy4rKj89XiE6JHt9KClbXFxdfFxcL10pL2csICdcXFxcJDEnKVxufVxuXG4vKipcbiAqIEVzY2FwZSB0aGUgY2FwdHVyaW5nIGdyb3VwIGJ5IGVzY2FwaW5nIHNwZWNpYWwgY2hhcmFjdGVycyBhbmQgbWVhbmluZy5cbiAqXG4gKiBAcGFyYW0gIHtTdHJpbmd9IGdyb3VwXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIGVzY2FwZUdyb3VwIChncm91cCkge1xuICByZXR1cm4gZ3JvdXAucmVwbGFjZSgvKFs9ITokXFwvKCldKS9nLCAnXFxcXCQxJylcbn1cblxuLyoqXG4gKiBBdHRhY2ggdGhlIGtleXMgYXMgYSBwcm9wZXJ0eSBvZiB0aGUgcmVnZXhwLlxuICpcbiAqIEBwYXJhbSAge1JlZ0V4cH0gcmVcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiBhdHRhY2hLZXlzIChyZSwga2V5cykge1xuICByZS5rZXlzID0ga2V5c1xuICByZXR1cm4gcmVcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGZsYWdzIGZvciBhIHJlZ2V4cCBmcm9tIHRoZSBvcHRpb25zLlxuICpcbiAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9uc1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5mdW5jdGlvbiBmbGFncyAob3B0aW9ucykge1xuICByZXR1cm4gb3B0aW9ucy5zZW5zaXRpdmUgPyAnJyA6ICdpJ1xufVxuXG4vKipcbiAqIFB1bGwgb3V0IGtleXMgZnJvbSBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHtSZWdFeHB9IHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHJldHVybiB7UmVnRXhwfVxuICovXG5mdW5jdGlvbiByZWdleHBUb1JlZ2V4cCAocGF0aCwga2V5cykge1xuICAvLyBVc2UgYSBuZWdhdGl2ZSBsb29rYWhlYWQgdG8gbWF0Y2ggb25seSBjYXB0dXJpbmcgZ3JvdXBzLlxuICB2YXIgZ3JvdXBzID0gcGF0aC5zb3VyY2UubWF0Y2goL1xcKCg/IVxcPykvZylcblxuICBpZiAoZ3JvdXBzKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBncm91cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGtleXMucHVzaCh7XG4gICAgICAgIG5hbWU6IGksXG4gICAgICAgIHByZWZpeDogbnVsbCxcbiAgICAgICAgZGVsaW1pdGVyOiBudWxsLFxuICAgICAgICBvcHRpb25hbDogZmFsc2UsXG4gICAgICAgIHJlcGVhdDogZmFsc2UsXG4gICAgICAgIHBhdHRlcm46IG51bGxcbiAgICAgIH0pXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocGF0aCwga2V5cylcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYW4gYXJyYXkgaW50byBhIHJlZ2V4cC5cbiAqXG4gKiBAcGFyYW0gIHtBcnJheX0gIHBhdGhcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIGFycmF5VG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAgdmFyIHBhcnRzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHBhdGgubGVuZ3RoOyBpKyspIHtcbiAgICBwYXJ0cy5wdXNoKHBhdGhUb1JlZ2V4cChwYXRoW2ldLCBrZXlzLCBvcHRpb25zKS5zb3VyY2UpXG4gIH1cblxuICB2YXIgcmVnZXhwID0gbmV3IFJlZ0V4cCgnKD86JyArIHBhcnRzLmpvaW4oJ3wnKSArICcpJywgZmxhZ3Mob3B0aW9ucykpXG5cbiAgcmV0dXJuIGF0dGFjaEtleXMocmVnZXhwLCBrZXlzKVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIHBhdGggcmVnZXhwIGZyb20gc3RyaW5nIGlucHV0LlxuICpcbiAqIEBwYXJhbSAge1N0cmluZ30gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICBrZXlzXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcbiAqIEByZXR1cm4ge1JlZ0V4cH1cbiAqL1xuZnVuY3Rpb24gc3RyaW5nVG9SZWdleHAgKHBhdGgsIGtleXMsIG9wdGlvbnMpIHtcbiAgdmFyIHRva2VucyA9IHBhcnNlKHBhdGgpXG4gIHZhciByZSA9IHRva2Vuc1RvUmVnRXhwKHRva2Vucywgb3B0aW9ucylcblxuICAvLyBBdHRhY2gga2V5cyBiYWNrIHRvIHRoZSByZWdleHAuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdG9rZW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKHR5cGVvZiB0b2tlbnNbaV0gIT09ICdzdHJpbmcnKSB7XG4gICAgICBrZXlzLnB1c2godG9rZW5zW2ldKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRhY2hLZXlzKHJlLCBrZXlzKVxufVxuXG4vKipcbiAqIEV4cG9zZSBhIGZ1bmN0aW9uIGZvciB0YWtpbmcgdG9rZW5zIGFuZCByZXR1cm5pbmcgYSBSZWdFeHAuXG4gKlxuICogQHBhcmFtICB7QXJyYXl9ICB0b2tlbnNcbiAqIEBwYXJhbSAge0FycmF5fSAga2V5c1xuICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHRva2Vuc1RvUmVnRXhwICh0b2tlbnMsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cblxuICB2YXIgc3RyaWN0ID0gb3B0aW9ucy5zdHJpY3RcbiAgdmFyIGVuZCA9IG9wdGlvbnMuZW5kICE9PSBmYWxzZVxuICB2YXIgcm91dGUgPSAnJ1xuICB2YXIgbGFzdFRva2VuID0gdG9rZW5zW3Rva2Vucy5sZW5ndGggLSAxXVxuICB2YXIgZW5kc1dpdGhTbGFzaCA9IHR5cGVvZiBsYXN0VG9rZW4gPT09ICdzdHJpbmcnICYmIC9cXC8kLy50ZXN0KGxhc3RUb2tlbilcblxuICAvLyBJdGVyYXRlIG92ZXIgdGhlIHRva2VucyBhbmQgY3JlYXRlIG91ciByZWdleHAgc3RyaW5nLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRva2Vucy5sZW5ndGg7IGkrKykge1xuICAgIHZhciB0b2tlbiA9IHRva2Vuc1tpXVxuXG4gICAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHJvdXRlICs9IGVzY2FwZVN0cmluZyh0b2tlbilcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHByZWZpeCA9IGVzY2FwZVN0cmluZyh0b2tlbi5wcmVmaXgpXG4gICAgICB2YXIgY2FwdHVyZSA9IHRva2VuLnBhdHRlcm5cblxuICAgICAgaWYgKHRva2VuLnJlcGVhdCkge1xuICAgICAgICBjYXB0dXJlICs9ICcoPzonICsgcHJlZml4ICsgY2FwdHVyZSArICcpKidcbiAgICAgIH1cblxuICAgICAgaWYgKHRva2VuLm9wdGlvbmFsKSB7XG4gICAgICAgIGlmIChwcmVmaXgpIHtcbiAgICAgICAgICBjYXB0dXJlID0gJyg/OicgKyBwcmVmaXggKyAnKCcgKyBjYXB0dXJlICsgJykpPydcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYXB0dXJlID0gJygnICsgY2FwdHVyZSArICcpPydcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY2FwdHVyZSA9IHByZWZpeCArICcoJyArIGNhcHR1cmUgKyAnKSdcbiAgICAgIH1cblxuICAgICAgcm91dGUgKz0gY2FwdHVyZVxuICAgIH1cbiAgfVxuXG4gIC8vIEluIG5vbi1zdHJpY3QgbW9kZSB3ZSBhbGxvdyBhIHNsYXNoIGF0IHRoZSBlbmQgb2YgbWF0Y2guIElmIHRoZSBwYXRoIHRvXG4gIC8vIG1hdGNoIGFscmVhZHkgZW5kcyB3aXRoIGEgc2xhc2gsIHdlIHJlbW92ZSBpdCBmb3IgY29uc2lzdGVuY3kuIFRoZSBzbGFzaFxuICAvLyBpcyB2YWxpZCBhdCB0aGUgZW5kIG9mIGEgcGF0aCBtYXRjaCwgbm90IGluIHRoZSBtaWRkbGUuIFRoaXMgaXMgaW1wb3J0YW50XG4gIC8vIGluIG5vbi1lbmRpbmcgbW9kZSwgd2hlcmUgXCIvdGVzdC9cIiBzaG91bGRuJ3QgbWF0Y2ggXCIvdGVzdC8vcm91dGVcIi5cbiAgaWYgKCFzdHJpY3QpIHtcbiAgICByb3V0ZSA9IChlbmRzV2l0aFNsYXNoID8gcm91dGUuc2xpY2UoMCwgLTIpIDogcm91dGUpICsgJyg/OlxcXFwvKD89JCkpPydcbiAgfVxuXG4gIGlmIChlbmQpIHtcbiAgICByb3V0ZSArPSAnJCdcbiAgfSBlbHNlIHtcbiAgICAvLyBJbiBub24tZW5kaW5nIG1vZGUsIHdlIG5lZWQgdGhlIGNhcHR1cmluZyBncm91cHMgdG8gbWF0Y2ggYXMgbXVjaCBhc1xuICAgIC8vIHBvc3NpYmxlIGJ5IHVzaW5nIGEgcG9zaXRpdmUgbG9va2FoZWFkIHRvIHRoZSBlbmQgb3IgbmV4dCBwYXRoIHNlZ21lbnQuXG4gICAgcm91dGUgKz0gc3RyaWN0ICYmIGVuZHNXaXRoU2xhc2ggPyAnJyA6ICcoPz1cXFxcL3wkKSdcbiAgfVxuXG4gIHJldHVybiBuZXcgUmVnRXhwKCdeJyArIHJvdXRlLCBmbGFncyhvcHRpb25zKSlcbn1cblxuLyoqXG4gKiBOb3JtYWxpemUgdGhlIGdpdmVuIHBhdGggc3RyaW5nLCByZXR1cm5pbmcgYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogQW4gZW1wdHkgYXJyYXkgY2FuIGJlIHBhc3NlZCBpbiBmb3IgdGhlIGtleXMsIHdoaWNoIHdpbGwgaG9sZCB0aGVcbiAqIHBsYWNlaG9sZGVyIGtleSBkZXNjcmlwdGlvbnMuIEZvciBleGFtcGxlLCB1c2luZyBgL3VzZXIvOmlkYCwgYGtleXNgIHdpbGxcbiAqIGNvbnRhaW4gYFt7IG5hbWU6ICdpZCcsIGRlbGltaXRlcjogJy8nLCBvcHRpb25hbDogZmFsc2UsIHJlcGVhdDogZmFsc2UgfV1gLlxuICpcbiAqIEBwYXJhbSAgeyhTdHJpbmd8UmVnRXhwfEFycmF5KX0gcGF0aFxuICogQHBhcmFtICB7QXJyYXl9ICAgICAgICAgICAgICAgICBba2V5c11cbiAqIEBwYXJhbSAge09iamVjdH0gICAgICAgICAgICAgICAgW29wdGlvbnNdXG4gKiBAcmV0dXJuIHtSZWdFeHB9XG4gKi9cbmZ1bmN0aW9uIHBhdGhUb1JlZ2V4cCAocGF0aCwga2V5cywgb3B0aW9ucykge1xuICBrZXlzID0ga2V5cyB8fCBbXVxuXG4gIGlmICghaXNhcnJheShrZXlzKSkge1xuICAgIG9wdGlvbnMgPSBrZXlzXG4gICAga2V5cyA9IFtdXG4gIH0gZWxzZSBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge31cbiAgfVxuXG4gIGlmIChwYXRoIGluc3RhbmNlb2YgUmVnRXhwKSB7XG4gICAgcmV0dXJuIHJlZ2V4cFRvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG4gIH1cblxuICBpZiAoaXNhcnJheShwYXRoKSkge1xuICAgIHJldHVybiBhcnJheVRvUmVnZXhwKHBhdGgsIGtleXMsIG9wdGlvbnMpXG4gIH1cblxuICByZXR1cm4gc3RyaW5nVG9SZWdleHAocGF0aCwga2V5cywgb3B0aW9ucylcbn1cbiIsIihmdW5jdGlvbigpIHtcbiAgJ3VzZSBzdHJpY3QnO1xuXG4gIGlmIChzZWxmLmZldGNoKSB7XG4gICAgcmV0dXJuXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICBpZiAodHlwZW9mIG5hbWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICBuYW1lID0gU3RyaW5nKG5hbWUpXG4gICAgfVxuICAgIGlmICgvW15hLXowLTlcXC0jJCUmJyorLlxcXl9gfH5dL2kudGVzdChuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWUnKVxuICAgIH1cbiAgICByZXR1cm4gbmFtZS50b0xvd2VyQ2FzZSgpXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVWYWx1ZSh2YWx1ZSkge1xuICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKSB7XG4gICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSlcbiAgICB9XG4gICAgcmV0dXJuIHZhbHVlXG4gIH1cblxuICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICB0aGlzLm1hcCA9IHt9XG5cbiAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSlcbiAgICAgIH0sIHRoaXMpXG5cbiAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCBoZWFkZXJzW25hbWVdKVxuICAgICAgfSwgdGhpcylcbiAgICB9XG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpXG4gICAgdmFsdWUgPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSlcbiAgICB2YXIgbGlzdCA9IHRoaXMubWFwW25hbWVdXG4gICAgaWYgKCFsaXN0KSB7XG4gICAgICBsaXN0ID0gW11cbiAgICAgIHRoaXMubWFwW25hbWVdID0gbGlzdFxuICAgIH1cbiAgICBsaXN0LnB1c2godmFsdWUpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZVsnZGVsZXRlJ10gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgZGVsZXRlIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgdmFyIHZhbHVlcyA9IHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldXG4gICAgcmV0dXJuIHZhbHVlcyA/IHZhbHVlc1swXSA6IG51bGxcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmdldEFsbCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gfHwgW11cbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gdGhpcy5tYXAuaGFzT3duUHJvcGVydHkobm9ybWFsaXplTmFtZShuYW1lKSlcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBbbm9ybWFsaXplVmFsdWUodmFsdWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGhpcy5tYXApLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgdGhpcy5tYXBbbmFtZV0uZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICBjYWxsYmFjay5jYWxsKHRoaXNBcmcsIHZhbHVlLCBuYW1lLCB0aGlzKVxuICAgICAgfSwgdGhpcylcbiAgICB9LCB0aGlzKVxuICB9XG5cbiAgZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICAgIGlmIChib2R5LmJvZHlVc2VkKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJykpXG4gICAgfVxuICAgIGJvZHkuYm9keVVzZWQgPSB0cnVlXG4gIH1cblxuICBmdW5jdGlvbiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXNvbHZlKHJlYWRlci5yZXN1bHQpXG4gICAgICB9XG4gICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QocmVhZGVyLmVycm9yKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzQXJyYXlCdWZmZXIoYmxvYikge1xuICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpXG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpXG4gICAgcmV0dXJuIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKVxuICAgIHJldHVybiBmaWxlUmVhZGVyUmVhZHkocmVhZGVyKVxuICB9XG5cbiAgdmFyIHN1cHBvcnQgPSB7XG4gICAgYmxvYjogJ0ZpbGVSZWFkZXInIGluIHNlbGYgJiYgJ0Jsb2InIGluIHNlbGYgJiYgKGZ1bmN0aW9uKCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3IEJsb2IoKTtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgIH1cbiAgICB9KSgpLFxuICAgIGZvcm1EYXRhOiAnRm9ybURhdGEnIGluIHNlbGYsXG4gICAgYXJyYXlCdWZmZXI6ICdBcnJheUJ1ZmZlcicgaW4gc2VsZlxuICB9XG5cbiAgZnVuY3Rpb24gQm9keSgpIHtcbiAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2VcblxuXG4gICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHlcbiAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlCbG9iID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmZvcm1EYXRhICYmIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoIWJvZHkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSAnJ1xuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyICYmIEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIC8vIE9ubHkgc3VwcG9ydCBBcnJheUJ1ZmZlcnMgZm9yIFBPU1QgbWV0aG9kLlxuICAgICAgICAvLyBSZWNlaXZpbmcgQXJyYXlCdWZmZXJzIGhhcHBlbnMgdmlhIEJsb2JzLCBpbnN0ZWFkLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnN1cHBvcnRlZCBCb2R5SW5pdCB0eXBlJylcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKVxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyBibG9iJylcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG5ldyBCbG9iKFt0aGlzLl9ib2R5VGV4dF0pKVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnRleHQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcylcbiAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHJlamVjdGVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIHRleHQnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpXG4gICAgICAgIHJldHVybiByZWplY3RlZCA/IHJlamVjdGVkIDogUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKGRlY29kZSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRleHQoKS50aGVuKEpTT04ucGFyc2UpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxuXG4gIC8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxuICB2YXIgbWV0aG9kcyA9IFsnREVMRVRFJywgJ0dFVCcsICdIRUFEJywgJ09QVElPTlMnLCAnUE9TVCcsICdQVVQnXVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpXG4gICAgcmV0dXJuIChtZXRob2RzLmluZGV4T2YodXBjYXNlZCkgPiAtMSkgPyB1cGNhc2VkIDogbWV0aG9kXG4gIH1cblxuICBmdW5jdGlvbiBSZXF1ZXN0KGlucHV0LCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keVxuICAgIGlmIChSZXF1ZXN0LnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGlucHV0KSkge1xuICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FscmVhZHkgcmVhZCcpXG4gICAgICB9XG4gICAgICB0aGlzLnVybCA9IGlucHV0LnVybFxuICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzXG4gICAgICBpZiAoIW9wdGlvbnMuaGVhZGVycykge1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKVxuICAgICAgfVxuICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2RcbiAgICAgIHRoaXMubW9kZSA9IGlucHV0Lm1vZGVcbiAgICAgIGlmICghYm9keSkge1xuICAgICAgICBib2R5ID0gaW5wdXQuX2JvZHlJbml0XG4gICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnVybCA9IGlucHV0XG4gICAgfVxuXG4gICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCAnb21pdCdcbiAgICBpZiAob3B0aW9ucy5oZWFkZXJzIHx8ICF0aGlzLmhlYWRlcnMpIHtcbiAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycylcbiAgICB9XG4gICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgJ0dFVCcpXG4gICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCBudWxsXG4gICAgdGhpcy5yZWZlcnJlciA9IG51bGxcblxuICAgIGlmICgodGhpcy5tZXRob2QgPT09ICdHRVQnIHx8IHRoaXMubWV0aG9kID09PSAnSEVBRCcpICYmIGJvZHkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0JvZHkgbm90IGFsbG93ZWQgZm9yIEdFVCBvciBIRUFEIHJlcXVlc3RzJylcbiAgICB9XG4gICAgdGhpcy5faW5pdEJvZHkoYm9keSlcbiAgfVxuXG4gIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMpXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICAgIHZhciBmb3JtID0gbmV3IEZvcm1EYXRhKClcbiAgICBib2R5LnRyaW0oKS5zcGxpdCgnJicpLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgIGlmIChieXRlcykge1xuICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpXG4gICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGZ1bmN0aW9uIGhlYWRlcnMoeGhyKSB7XG4gICAgdmFyIGhlYWQgPSBuZXcgSGVhZGVycygpXG4gICAgdmFyIHBhaXJzID0geGhyLmdldEFsbFJlc3BvbnNlSGVhZGVycygpLnRyaW0oKS5zcGxpdCgnXFxuJylcbiAgICBwYWlycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgdmFyIHNwbGl0ID0gaGVhZGVyLnRyaW0oKS5zcGxpdCgnOicpXG4gICAgICB2YXIga2V5ID0gc3BsaXQuc2hpZnQoKS50cmltKClcbiAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oJzonKS50cmltKClcbiAgICAgIGhlYWQuYXBwZW5kKGtleSwgdmFsdWUpXG4gICAgfSlcbiAgICByZXR1cm4gaGVhZFxuICB9XG5cbiAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKVxuXG4gIGZ1bmN0aW9uIFJlc3BvbnNlKGJvZHlJbml0LCBvcHRpb25zKSB7XG4gICAgaWYgKCFvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0ge31cbiAgICB9XG5cbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdClcbiAgICB0aGlzLnR5cGUgPSAnZGVmYXVsdCdcbiAgICB0aGlzLnN0YXR1cyA9IG9wdGlvbnMuc3RhdHVzXG4gICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMFxuICAgIHRoaXMuc3RhdHVzVGV4dCA9IG9wdGlvbnMuc3RhdHVzVGV4dFxuICAgIHRoaXMuaGVhZGVycyA9IG9wdGlvbnMuaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMgPyBvcHRpb25zLmhlYWRlcnMgOiBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCAnJ1xuICB9XG5cbiAgQm9keS5jYWxsKFJlc3BvbnNlLnByb3RvdHlwZSlcblxuICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKHRoaXMuX2JvZHlJbml0LCB7XG4gICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgaGVhZGVyczogbmV3IEhlYWRlcnModGhpcy5oZWFkZXJzKSxcbiAgICAgIHVybDogdGhpcy51cmxcbiAgICB9KVxuICB9XG5cbiAgUmVzcG9uc2UuZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogMCwgc3RhdHVzVGV4dDogJyd9KVxuICAgIHJlc3BvbnNlLnR5cGUgPSAnZXJyb3InXG4gICAgcmV0dXJuIHJlc3BvbnNlXG4gIH1cblxuICB2YXIgcmVkaXJlY3RTdGF0dXNlcyA9IFszMDEsIDMwMiwgMzAzLCAzMDcsIDMwOF1cblxuICBSZXNwb25zZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKHVybCwgc3RhdHVzKSB7XG4gICAgaWYgKHJlZGlyZWN0U3RhdHVzZXMuaW5kZXhPZihzdGF0dXMpID09PSAtMSkge1xuICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoJ0ludmFsaWQgc3RhdHVzIGNvZGUnKVxuICAgIH1cblxuICAgIHJldHVybiBuZXcgUmVzcG9uc2UobnVsbCwge3N0YXR1czogc3RhdHVzLCBoZWFkZXJzOiB7bG9jYXRpb246IHVybH19KVxuICB9XG5cbiAgc2VsZi5IZWFkZXJzID0gSGVhZGVycztcbiAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4gIHNlbGYuZmV0Y2ggPSBmdW5jdGlvbihpbnB1dCwgaW5pdCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIHZhciByZXF1ZXN0XG4gICAgICBpZiAoUmVxdWVzdC5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihpbnB1dCkgJiYgIWluaXQpIHtcbiAgICAgICAgcmVxdWVzdCA9IGlucHV0XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpXG4gICAgICB9XG5cbiAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKVxuXG4gICAgICBmdW5jdGlvbiByZXNwb25zZVVSTCgpIHtcbiAgICAgICAgaWYgKCdyZXNwb25zZVVSTCcgaW4geGhyKSB7XG4gICAgICAgICAgcmV0dXJuIHhoci5yZXNwb25zZVVSTFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXZvaWQgc2VjdXJpdHkgd2FybmluZ3Mgb24gZ2V0UmVzcG9uc2VIZWFkZXIgd2hlbiBub3QgYWxsb3dlZCBieSBDT1JTXG4gICAgICAgIGlmICgvXlgtUmVxdWVzdC1VUkw6L20udGVzdCh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpKSB7XG4gICAgICAgICAgcmV0dXJuIHhoci5nZXRSZXNwb25zZUhlYWRlcignWC1SZXF1ZXN0LVVSTCcpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHN0YXR1cyA9ICh4aHIuc3RhdHVzID09PSAxMjIzKSA/IDIwNCA6IHhoci5zdGF0dXNcbiAgICAgICAgaWYgKHN0YXR1cyA8IDEwMCB8fCBzdGF0dXMgPiA1OTkpIHtcbiAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0ge1xuICAgICAgICAgIHN0YXR1czogc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IGhlYWRlcnMoeGhyKSxcbiAgICAgICAgICB1cmw6IHJlc3BvbnNlVVJMKClcbiAgICAgICAgfVxuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChuZXcgVHlwZUVycm9yKCdOZXR3b3JrIHJlcXVlc3QgZmFpbGVkJykpXG4gICAgICB9XG5cbiAgICAgIHhoci5vcGVuKHJlcXVlc3QubWV0aG9kLCByZXF1ZXN0LnVybCwgdHJ1ZSlcblxuICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09ICdpbmNsdWRlJykge1xuICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZVxuICAgICAgfVxuXG4gICAgICBpZiAoJ3Jlc3BvbnNlVHlwZScgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2Jsb2InXG4gICAgICB9XG5cbiAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKVxuICAgICAgfSlcblxuICAgICAgeGhyLnNlbmQodHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSAndW5kZWZpbmVkJyA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdClcbiAgICB9KVxuICB9XG4gIHNlbGYuZmV0Y2gucG9seWZpbGwgPSB0cnVlXG59KSgpO1xuIiwiY29uc3QgUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuL3ByZWZlcmVuY2VzJyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9Kb3QnKTtcblxuY2xhc3MgR3JvdXBQcmVmZXJlbmNlcyBleHRlbmRzIFByZWZlcmVuY2VzIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuX29yZGVyID0gdGhpcy5nZXRPcmRlcigpO1xuICB9XG5cbiAgZ2V0T3JkZXIoKSB7XG4gICAgbGV0IG9yZGVyID0gdGhpcy5nZXRJdGVtKCdvcmRlcicpO1xuXG4gICAgaWYgKCFvcmRlciB8fCAhb3JkZXIudHlwZSB8fCAhb3JkZXIuZGlyZWN0aW9uKSB7XG4gICAgICBvcmRlciA9IHtcbiAgICAgICAgdHlwZTogJ2RhdGUnLFxuICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgfTtcbiAgICB9XG5cbiAgICB0aGlzLl9vcmRlciA9IG9yZGVyO1xuXG4gICAgcmV0dXJuIG9yZGVyO1xuICB9XG5cbiAgc2V0T3JkZXIodHlwZSwgZGlyZWN0aW9uKSB7XG4gICAgdGhpcy5fb3JkZXIudHlwZSA9IHR5cGU7XG4gICAgdGhpcy5fb3JkZXIuZGlyZWN0aW9uID0gZGlyZWN0aW9uO1xuXG4gICAgdGhpcy5zZXRJdGVtKCdvcmRlcicsIHRoaXMuX29yZGVyKTtcbiAgfVxuXG4gIG9yZGVyKGpvdHMpIHtcbiAgICByZXR1cm4gSm90Lm9yZGVyKGpvdHMsIHRoaXMuX29yZGVyLnR5cGUsIHRoaXMuX29yZGVyLmRpcmVjdGlvbik7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cFByZWZlcmVuY2VzO1xuIiwiY29uc3QgUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuL3ByZWZlcmVuY2VzJyk7XG5cbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNsYXNzIEdyb3Vwc1ByZWZlcmVuY2VzIGV4dGVuZHMgUHJlZmVyZW5jZXMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fb3JkZXIgPSB0aGlzLmdldE9yZGVyKCk7XG4gIH1cblxuICBnZXRPcmRlcigpIHtcbiAgICBsZXQgb3JkZXIgPSB0aGlzLmdldEl0ZW0oJ29yZGVyJyk7XG5cbiAgICBpZiAoIW9yZGVyIHx8ICFvcmRlci50eXBlIHx8ICFvcmRlci5kaXJlY3Rpb24pIHtcbiAgICAgIG9yZGVyID0ge1xuICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX29yZGVyID0gb3JkZXI7XG5cbiAgICByZXR1cm4gb3JkZXI7XG4gIH1cblxuICBzZXRPcmRlcih0eXBlLCBkaXJlY3Rpb24pIHtcbiAgICB0aGlzLl9vcmRlci50eXBlID0gdHlwZTtcbiAgICB0aGlzLl9vcmRlci5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICB0aGlzLnNldEl0ZW0oJ29yZGVyJywgdGhpcy5fb3JkZXIpO1xuICB9XG5cbiAgb3JkZXIoZ3JvdXBzKSB7XG4gICAgcmV0dXJuIEdyb3VwLm9yZGVyKGdyb3VwcywgdGhpcy5fb3JkZXIudHlwZSwgdGhpcy5fb3JkZXIuZGlyZWN0aW9uKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3Vwc1ByZWZlcmVuY2VzO1xuIiwiY29uc3QgUHJlZmVyZW5jZXMgPSByZXF1aXJlKCcuL3ByZWZlcmVuY2VzJyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9Kb3QnKTtcblxuY2xhc3MgSm90c1ByZWZlcmVuY2VzIGV4dGVuZHMgUHJlZmVyZW5jZXMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuXG4gICAgdGhpcy5fb3JkZXIgPSB0aGlzLmdldE9yZGVyKCk7XG4gIH1cblxuICBnZXRPcmRlcigpIHtcbiAgICBsZXQgb3JkZXIgPSB0aGlzLmdldEl0ZW0oJ29yZGVyJyk7XG5cbiAgICBpZiAoIW9yZGVyIHx8ICFvcmRlci50eXBlIHx8ICFvcmRlci5kaXJlY3Rpb24pIHtcbiAgICAgIG9yZGVyID0ge1xuICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICB9O1xuICAgIH1cblxuICAgIHRoaXMuX29yZGVyID0gb3JkZXI7XG5cbiAgICByZXR1cm4gb3JkZXI7XG4gIH1cblxuICBzZXRPcmRlcih0eXBlLCBkaXJlY3Rpb24pIHtcbiAgICB0aGlzLl9vcmRlci50eXBlID0gdHlwZTtcbiAgICB0aGlzLl9vcmRlci5kaXJlY3Rpb24gPSBkaXJlY3Rpb247XG5cbiAgICB0aGlzLnNldEl0ZW0oJ29yZGVyJywgdGhpcy5fb3JkZXIpO1xuICB9XG5cbiAgb3JkZXIoam90cykge1xuICAgIHJldHVybiBKb3Qub3JkZXIoam90cywgdGhpcy5fb3JkZXIudHlwZSwgdGhpcy5fb3JkZXIuZGlyZWN0aW9uKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEpvdHNQcmVmZXJlbmNlcztcbiIsImNsYXNzIFByZWZlcmVuY2VzIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKGxvY2FsU3RvcmFnZSkge1xuICAgICAgdGhpcy5fc3RvcmFnZSA9IGxvY2FsU3RvcmFnZTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5fc3RvcmFnZSA9IHtcbiAgICAgICAgZmllbGRzOiB7fSxcblxuICAgICAgICBnZXRJdGVtOiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuZmllbGRzW25hbWVdO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNldEl0ZW06IGZ1bmN0aW9uKG5hbWUsIGl0ZW0pIHtcbiAgICAgICAgICB0aGlzLmZpZWxkc1tuYW1lXSA9IGl0ZW07XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuXG4gICAgdGhpcy5fa2V5ID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLnRvTG93ZXJDYXNlKCk7XG4gIH1cblxuICBnZXRJdGVtKG5hbWUpIHtcbiAgICBsZXQgcHJlZnMgPSB0aGlzLl9zdG9yYWdlLmdldEl0ZW0odGhpcy5fa2V5KTtcblxuICAgIGlmIChwcmVmcykge1xuICAgICAgcHJlZnMgPSBKU09OLnBhcnNlKHByZWZzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcHJlZnMgPSB7fTtcbiAgICB9XG5cbiAgICByZXR1cm4gcHJlZnMubmFtZTtcbiAgfVxuXG4gIHNldEl0ZW0obmFtZSwgaXRlbSkge1xuICAgIGxldCBwcmVmcyA9IHRoaXMuX3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLl9rZXkpO1xuXG4gICAgaWYgKHByZWZzKSB7XG4gICAgICBwcmVmcyA9IEpTT04ucGFyc2UocHJlZnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmcyA9IHt9O1xuICAgIH1cblxuICAgIHByZWZzLm5hbWUgPSBpdGVtO1xuXG4gICAgdGhpcy5fc3RvcmFnZS5zZXRJdGVtKHRoaXMuX2tleSwgSlNPTi5zdHJpbmdpZnkocHJlZnMpKTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFByZWZlcmVuY2VzO1xuIiwiaWYgKHdpbmRvdy5vcGVyYW1pbmkpIHtcbiAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKCdvcGVyYW1pbmknKTtcbn1cblxuLy8gY3V0dGluZyB0aGUgb2wnIG11c3RhcmQgbGlrZSBhIHByb1xuaWYgKCd2aXNpYmlsaXR5U3RhdGUnIGluIGRvY3VtZW50KSB7XG4gIGlmIChuYXZpZ2F0b3Iuc2VydmljZVdvcmtlcikge1xuICAgIG5hdmlnYXRvci5zZXJ2aWNlV29ya2VyLnJlZ2lzdGVyKCcvc2VydmljZXdvcmtlci5qcycsIHtcbiAgICAgIHNjb3BlOiAnLycsXG4gICAgfSkudGhlbihyZWcgPT4ge1xuICAgICAgY29uc29sZS5sb2coJ1NXIHJlZ2lzdGVyIHN1Y2Nlc3MnLCByZWcpO1xuICAgIH0sIGVyciA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnU1cgcmVnaXN0ZXIgZmFpbCcsIGVycik7XG4gICAgfSk7XG4gIH1cblxuICBpZiAoIXdpbmRvdy5mZXRjaCkge1xuICAgIHJlcXVpcmUoJ3doYXR3Zy1mZXRjaCcpO1xuICB9XG5cbiAgZmV0Y2goJy9hdXRoL3VzZXInLCB7XG4gICAgY3JlZGVudGlhbHM6ICdzYW1lLW9yaWdpbicsXG4gIH0pLnRoZW4ocmVzcG9uc2UgPT4ge1xuICAgIHJldHVybiByZXNwb25zZS5qc29uKCk7XG4gIH0pLnRoZW4oanNvbiA9PiB7XG4gICAgSm90QXBwLnVzZXIgPSBqc29uO1xuXG4gICAgaWYgKEpvdEFwcC51c2VyICE9PSBmYWxzZSkge1xuICAgICAgaWYgKEpvdEFwcC51c2VyLmNyZWRlbnRpYWxzKSB7XG4gICAgICAgIHJlcXVpcmUoJy4uLy4uL2RiL2RiJykoe1xuICAgICAgICAgIHByb3RvY29sOiBKb3RBcHAuc2VydmVyLnByb3RvY29sLFxuICAgICAgICAgIGRvbWFpbjogSm90QXBwLnNlcnZlci5kb21haW4sXG4gICAgICAgICAgdXNlcm5hbWU6IEpvdEFwcC51c2VyLmNyZWRlbnRpYWxzLmtleSxcbiAgICAgICAgICBwYXNzd29yZDogSm90QXBwLnVzZXIuY3JlZGVudGlhbHMucGFzc3dvcmQsXG4gICAgICAgICAgZGJOYW1lOiAnam90LScgKyBKb3RBcHAudXNlci5faWQsXG4gICAgICAgIH0pO1xuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnam90LXVzZXInLCBKU09OLnN0cmluZ2lmeShKb3RBcHAudXNlcikpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbG9jYWxVc2VyID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ2pvdC11c2VyJyk7XG5cbiAgICAgICAgaWYgKGxvY2FsVXNlcikge1xuICAgICAgICAgIEpvdEFwcC51c2VyID0gSlNPTi5wYXJzZShsb2NhbFVzZXIpO1xuICAgICAgICAgIGlmIChKb3RBcHAudXNlcikge1xuICAgICAgICAgICAgcmVxdWlyZSgnLi4vLi4vZGIvZGInKSh7XG4gICAgICAgICAgICAgIHByb3RvY29sOiBKb3RBcHAuc2VydmVyLnByb3RvY29sLFxuICAgICAgICAgICAgICBkb21haW46IEpvdEFwcC5zZXJ2ZXIuZG9tYWluLFxuICAgICAgICAgICAgICB1c2VybmFtZTogSm90QXBwLnVzZXIuY3JlZGVudGlhbHMua2V5LFxuICAgICAgICAgICAgICBwYXNzd29yZDogSm90QXBwLnVzZXIuY3JlZGVudGlhbHMucGFzc3dvcmQsXG4gICAgICAgICAgICAgIGRiTmFtZTogJ2pvdC0nICsgSm90QXBwLnVzZXIuX2lkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlcXVpcmUoJy4uLy4uL2RiL2RiJykoe1xuICAgICAgICAgICAgICBkYk5hbWU6ICdqb3QtbG9jYWwnLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlcXVpcmUoJy4uLy4uL2RiL2RiJykoe1xuICAgICAgICAgICAgZGJOYW1lOiAnam90LWxvY2FsJyxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgnam90LXVzZXInLCBKU09OLnN0cmluZ2lmeShmYWxzZSkpO1xuICAgICAgcmVxdWlyZSgnLi4vLi4vZGIvZGInKSh7XG4gICAgICAgIGRiTmFtZTogJ2pvdC1sb2NhbCcsXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBjb25zdCBhdHRhY2hGYXN0Q2xpY2sgPSByZXF1aXJlKCdmYXN0Y2xpY2snKTtcblxuICAgIGNvbnN0IFZpZXdDb250YWluZXIgPSByZXF1aXJlKCcuLi8uLi92aWV3cy92aWV3LWNvbnRhaW5lcicpO1xuXG4gICAgY29uc3Qgcm91dGVyID0gcmVxdWlyZSgnLi4vLi4vcm91dGVycy9wYXRoJyk7XG5cbiAgICBjb25zdCBSb3V0ZXNIb21lID0gcmVxdWlyZSgnLi4vLi4vcm91dGVzL2NsaWVudC9ob21lJyk7XG4gICAgY29uc3QgUm91dGVzQXV0aCA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcy9jbGllbnQvYXV0aCcpO1xuICAgIGNvbnN0IFJvdXRlc0pvdCA9IHJlcXVpcmUoJy4uLy4uL3JvdXRlcy9jbGllbnQvam90Jyk7XG4gICAgY29uc3QgUm91dGVzR3JvdXAgPSByZXF1aXJlKCcuLi8uLi9yb3V0ZXMvY2xpZW50L2dyb3VwJyk7XG5cbiAgICBjb25zdCBUaXRsZUJhclZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy90aXRsZWJhcicpO1xuICAgIGNvbnN0IE5vdGlmaWNhdGlvbk1hbmFnZXJWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3Mvbm90aWZpY2F0aW9uLW1hbmFnZXInKTtcblxuICAgIGNvbnN0IEhhbmRsZWJhcnMgPSByZXF1aXJlKCdoYW5kbGViYXJzL2Rpc3QvaGFuZGxlYmFycy5ydW50aW1lJyk7XG4gICAgY29uc3QgaGVscGVycyA9IHJlcXVpcmUoJy4uLy4uL3RlbXBsYXRlcy9oZWxwZXJzJyk7XG5cbiAgICBhdHRhY2hGYXN0Q2xpY2soZG9jdW1lbnQuYm9keSk7XG5cbiAgICBmb3IgKGNvbnN0IGtleSBvZiBPYmplY3Qua2V5cyhKb3RBcHAudGVtcGxhdGVzKSkge1xuICAgICAgSGFuZGxlYmFycy5yZWdpc3RlclBhcnRpYWwoa2V5LCBIYW5kbGViYXJzLnRlbXBsYXRlKEpvdEFwcC50ZW1wbGF0ZXNba2V5XSkpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgaGVscGVyIGluIGhlbHBlcnMpIHtcbiAgICAgIGlmIChoZWxwZXJzLmhhc093blByb3BlcnR5KGhlbHBlcikpIHtcbiAgICAgICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcihoZWxwZXIsIGhlbHBlcnNbaGVscGVyXSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgY29udGFpbmVyTWFpbiA9IG5ldyBWaWV3Q29udGFpbmVyKCd2aWV3Jywge1xuICAgICAgaG9tZTogSm90QXBwLnRlbXBsYXRlcy5ob21lLFxuICAgICAgZ3JvdXA6IEpvdEFwcC50ZW1wbGF0ZXMuZ3JvdXAsXG4gICAgICBncm91cHM6IEpvdEFwcC50ZW1wbGF0ZXMuZ3JvdXBzLFxuICAgICAgam90czogSm90QXBwLnRlbXBsYXRlcy5qb3RzLFxuICAgICAgbG9hZGluZzogSm90QXBwLnRlbXBsYXRlcy5sb2FkaW5nLFxuICAgICAgbG9hZGluZ2dyb3VwczogSm90QXBwLnRlbXBsYXRlcy5sb2FkaW5nZ3JvdXBzLFxuICAgICAgaW1wb3J0OiBKb3RBcHAudGVtcGxhdGVzLmltcG9ydCxcbiAgICB9LCB7XG4gICAgICAnZ3JvdXAtbGlzdCc6IEpvdEFwcC50ZW1wbGF0ZXNbJ2dyb3VwLWxpc3QnXSxcbiAgICAgICdqb3QtbGlzdCc6IEpvdEFwcC50ZW1wbGF0ZXNbJ2pvdC1saXN0J10sXG4gICAgfSk7XG5cbiAgICBjb25zdCByb3V0ZXNIb21lID0gbmV3IFJvdXRlc0hvbWUocm91dGVyLCAnLycsIGNvbnRhaW5lck1haW4pO1xuICAgIGNvbnN0IHJvdXRlc0F1dGggPSBuZXcgUm91dGVzQXV0aChyb3V0ZXIsICcvYXV0aCcsIGNvbnRhaW5lck1haW4pO1xuICAgIGNvbnN0IHJvdXRlc0pvdCA9IG5ldyBSb3V0ZXNKb3Qocm91dGVyLCAnL2pvdCcsIGNvbnRhaW5lck1haW4pO1xuICAgIGNvbnN0IHJvdXRlc0dyb3VwID0gbmV3IFJvdXRlc0dyb3VwKHJvdXRlciwgJy9ncm91cCcsIGNvbnRhaW5lck1haW4pO1xuXG4gICAgcm91dGVzSG9tZS5yZWdpc3RlclJvdXRlcygpO1xuICAgIHJvdXRlc0F1dGgucmVnaXN0ZXJSb3V0ZXMoKTtcbiAgICByb3V0ZXNKb3QucmVnaXN0ZXJSb3V0ZXMoKTtcbiAgICByb3V0ZXNHcm91cC5yZWdpc3RlclJvdXRlcygpO1xuXG4gICAgY29uc3QgY29udGFpbmVySGVhZGVyID0gbmV3IFZpZXdDb250YWluZXIoJ2hlYWRlcicsIHtcbiAgICAgIHRpdGxlYmFyOiBKb3RBcHAudGVtcGxhdGVzLnRpdGxlYmFyLFxuICAgIH0sIHtcbiAgICAgICd0aXRsZWJhci10aXRsZSc6IEpvdEFwcC50ZW1wbGF0ZXNbJ3RpdGxlYmFyLXRpdGxlJ10sXG4gICAgICAndGl0bGViYXItdGFicyc6IEpvdEFwcC50ZW1wbGF0ZXNbJ3RpdGxlYmFyLXRhYnMnXSxcbiAgICAgICdsaXN0LW9yZGVyJzogSm90QXBwLnRlbXBsYXRlc1snbGlzdC1vcmRlciddLFxuICAgIH0pO1xuXG4gICAgY29uc3QgdGl0bGVCYXIgPSBuZXcgVGl0bGVCYXJWaWV3KGNvbnRhaW5lckhlYWRlcik7XG5cbiAgICB0aXRsZUJhci5yZW5kZXIoZmFsc2UsIHtcbiAgICAgIHVzZXI6IEpvdEFwcC51c2VyLFxuICAgIH0pO1xuXG4gICAgY29uc3QgY29udGFpbmVyTm90aWZpY2F0aW9ucyA9IG5ldyBWaWV3Q29udGFpbmVyKCdub3RpZmljYXRpb25zJywge1xuICAgICAgbm90aWZpY2F0aW9uczogSm90QXBwLnRlbXBsYXRlcy5ub3RpZmljYXRpb25zLFxuICAgIH0sIHtcbiAgICAgIG5vdGlmaWNhdGlvbjogSm90QXBwLnRlbXBsYXRlcy5ub3RpZmljYXRpb24sXG4gICAgfSk7XG5cbiAgICBjb25zdCBub3RpZmljYXRpb25NYW5hZ2VyID0gbmV3IE5vdGlmaWNhdGlvbk1hbmFnZXJWaWV3KGNvbnRhaW5lck5vdGlmaWNhdGlvbnMpO1xuXG4gICAgbm90aWZpY2F0aW9uTWFuYWdlci5yZW5kZXIodHJ1ZSk7XG5cbiAgICByb3V0ZXIuYWN0aXZhdGUoKTtcbiAgfSkuY2F0Y2goZXggPT4ge1xuICAgIGNvbnNvbGUubG9nKCdzb21ldGhpbmcgd2VudCB3cm9uZyB3aXRoIGF1dGgvdXNlcicsIGV4KTtcbiAgfSk7XG59XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IHBhZ2UgPSByZXF1aXJlKCdwYWdlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uKCkge1xuXG4gIHJldHVybiB7XG4gICAgYWN0aXZhdGU6IGZ1bmN0aW9uKCkge1xuICAgICAgcGFnZSgpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uKHBhdGgsIGNhbGxiYWNrKSB7XG4gICAgICBwYWdlKHBhdGgsIGNhbGxiYWNrKTtcbiAgICB9LFxuXG4gICAgZ286IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgIHBhZ2UocGF0aCk7XG4gICAgfSxcblxuICAgIGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHdpbmRvdy5oaXN0b3J5Lmxlbmd0aCkge1xuICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwYWdlKCcvJyk7XG4gICAgICB9XG4gICAgfSxcblxuICAgIHN0b3A6IGZ1bmN0aW9uKHBhdGgpIHtcbiAgICAgIHBhZ2Uuc3RvcCgpO1xuICAgICAgaWYgKHBhdGgpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uID0gcGF0aDtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbn0pKCk7XG4iLCJjb25zdCBSb3V0ZXMgPSByZXF1aXJlKCcuL3JvdXRlcycpO1xuXG5jb25zdCBHcm91cCA9IHJlcXVpcmUoJy4uL21vZGVscy9ncm91cCcpO1xuXG5jbGFzcyBBdXRoUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hdXRoR29vZ2xlID0ge1xuICAgICAgX3BhdGg6ICcvZ29vZ2xlJyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy5jYWxsYmFja0dvb2dsZSA9IHtcbiAgICAgIF9wYXRoOiAnL2dvb2dsZS9jYWxsYmFjaycsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9LFxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuaW1wb3J0ID0ge1xuICAgICAgX3BhdGg6ICcvaW1wb3J0JyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICByZXR1cm4gR3JvdXAuaW1wb3J0RnJvbUxvY2FsKCk7XG4gICAgICAgIH0pO1xuICAgICAgfSxcbiAgICB9O1xuXG4gICAgdGhpcy5fcm91dGVzLnVzZXIgPSB7XG4gICAgICBfcGF0aDogJy91c2VyJyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy5zaWdub3V0ID0ge1xuICAgICAgX3BhdGg6ICcvc2lnbm91dCcsXG4gICAgICBfbWV0aG9kOiBbJ2dldCddLFxuICAgICAgX2FjdGlvbjogKCkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9LFxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBBdXRoUm91dGVzO1xuIiwiY29uc3QgQXV0aFJvdXRlcyA9IHJlcXVpcmUoJy4uL2F1dGgnKTtcbmNvbnN0IEltcG9ydFZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy9pbXBvcnQnKTtcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgQXV0aFJvdXRlciB7XG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4LCB2aWV3Q29udGFpbmVyKSB7XG4gICAgdGhpcy5fZGIgPSByZXF1aXJlKCcuLi8uLi9kYi9kYicpKCk7XG5cbiAgICB0aGlzLl9yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5yb3V0ZXMgPSBuZXcgQXV0aFJvdXRlcyhyb3V0ZXIsIHByZWZpeCk7XG5cbiAgICB0aGlzLmltcG9ydFZpZXcgPSBuZXcgSW1wb3J0Vmlldyh2aWV3Q29udGFpbmVyKTtcbiAgfVxuXG4gIHJlZ2lzdGVyUm91dGVzKCkge1xuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ3NpZ25vdXQnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7fSxcblxuICAgICAgICAgIHJlc29sdmU6ICgpID0+IHtcbiAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCdqb3QtdXNlcicsIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuX2RiLmRlc3Ryb3koKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5fcm91dGVyLnN0b3AoY3R4LmNhbm9uaWNhbFBhdGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgnaW1wb3J0JywgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhcmFtczoge30sXG5cbiAgICAgICAgICBwcmVBY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdyb3V0ZUNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgIG5hbWU6ICdKb3QnLFxuICAgICAgICAgICAgICBvcmRlcjogW10sXG4gICAgICAgICAgICAgIHRhYnM6IFt7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdIb21lJyxcbiAgICAgICAgICAgICAgICBsaW5rOiAnLycsXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0pvdHMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvam90JyxcbiAgICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICAgIHRpdGxlOiAnTGlzdHMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvZ3JvdXAnLFxuICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZXNvbHZlOiAoZ3JvdXBzKSA9PiB7XG4gICAgICAgICAgICB0aGlzLmltcG9ydFZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGdyb3VwcyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZWplY3Q6IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEF1dGhSb3V0ZXI7XG4iLCJjb25zdCBKb3QgPSByZXF1aXJlKCcuLi8uLi9tb2RlbHMvam90Jyk7XG5jb25zdCBHcm91cCA9IHJlcXVpcmUoJy4uLy4uL21vZGVscy9ncm91cCcpO1xuY29uc3QgR3JvdXBSb3V0ZXMgPSByZXF1aXJlKCcuLi9ncm91cCcpO1xuY29uc3QgR3JvdXBzVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2dyb3VwcycpO1xuY29uc3QgR3JvdXBWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvZ3JvdXAnKTtcbmNvbnN0IExvYWRpbmdHcm91cHNWaWV3ID0gcmVxdWlyZSgnLi4vLi4vdmlld3MvbG9hZGluZ2dyb3VwcycpO1xuXG5jb25zdCBHcm91cHNQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4uLy4uL3ByZWZlcmVuY2VzL2dyb3VwcycpO1xuY29uc3QgR3JvdXBQcmVmZXJlbmNlID0gcmVxdWlyZSgnLi4vLi4vcHJlZmVyZW5jZXMvZ3JvdXAnKTtcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgR3JvdXBDbGllbnRSb3V0ZXMge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCwgdmlld0NvbnRhaW5lcikge1xuICAgIHRoaXMucm91dGVzID0gbmV3IEdyb3VwUm91dGVzKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuZ3JvdXBzVmlldyA9IG5ldyBHcm91cHNWaWV3KHZpZXdDb250YWluZXIpO1xuICAgIHRoaXMuZ3JvdXBWaWV3ID0gbmV3IEdyb3VwVmlldyh2aWV3Q29udGFpbmVyKTtcbiAgICB0aGlzLmxvYWRpbmdHcm91cHNWaWV3ID0gbmV3IExvYWRpbmdHcm91cHNWaWV3KHZpZXdDb250YWluZXIpO1xuXG4gICAgdGhpcy5fZ3JvdXBzUHJlZmVyZW5jZXMgPSBuZXcgR3JvdXBzUHJlZmVyZW5jZXMoKTtcbiAgICB0aGlzLl9ncm91cFByZWZlcmVuY2VzID0gbmV3IEdyb3VwUHJlZmVyZW5jZSgpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgnYWxsJywgKGN0eCwgbmV4dCkgPT4ge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpLnRoZW4oKCkgPT4ge1xuXG4gICAgICAgIGNvbnN0IHBhZ2UgPSB7XG4gICAgICAgICAgbmFtZTogJ0pvdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvcmRlcmluZyA9IHtcbiAgICAgICAgICBvcmRlcnM6IFt7XG4gICAgICAgICAgICBuYW1lOiAnQWxwaGEnLFxuICAgICAgICAgICAgdHlwZTogJ2FscGhhJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2FzYydcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnRGF0ZScsXG4gICAgICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH1dXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgdGFicyA9IFt7XG4gICAgICAgICAgdGl0bGU6ICdIb21lJyxcbiAgICAgICAgICBsaW5rOiAnLydcbiAgICAgICAgfSwge1xuICAgICAgICAgIHRpdGxlOiAnSm90cycsXG4gICAgICAgICAgbGluazogJy9qb3QnXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0aXRsZTogJ0xpc3RzJyxcbiAgICAgICAgICBsaW5rOiAnL2dyb3VwJyxcbiAgICAgICAgICBjdXJyZW50OiB0cnVlXG4gICAgICAgIH1dO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBvcmRlclR5cGU6IHRoaXMuX2dyb3Vwc1ByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgIG9yZGVyRGlyZWN0aW9uOiB0aGlzLl9ncm91cHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLmRpcmVjdGlvblxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBwcmVBY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdyb3V0ZUNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgIG5hbWU6IHBhZ2UubmFtZSxcbiAgICAgICAgICAgICAgb3JkZXJpbmcsXG4gICAgICAgICAgICAgIGN1cnJlbnRPcmRlcmluZzogdGhpcy5fZ3JvdXBzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgICB0YWJzXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5sb2FkaW5nR3JvdXBzVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgaXRlbXM6IFswLCAwLCAwLCAwLCAwLCAwLCAwXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChncm91cHMpID0+IHtcbiAgICAgICAgICAgIHRoaXMuZ3JvdXBzVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgY29sb3VyczogR3JvdXAuZ2V0Q29sb3VycygpLFxuICAgICAgICAgICAgICBncm91cHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZWplY3Q6IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgdGhpcy5yb3V0ZXMucmVnaXN0ZXJSb3V0ZSgndmlldycsIChjdHgsIG5leHQpID0+IHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgY29uc3Qgb3JkZXJpbmcgPSB7XG4gICAgICAgICAgb3JkZXJzOiBbe1xuICAgICAgICAgICAgbmFtZTogJ0FscGhhJyxcbiAgICAgICAgICAgIHR5cGU6ICdhbHBoYScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdhc2MnXG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgbmFtZTogJ0RhdGUnLFxuICAgICAgICAgICAgdHlwZTogJ2RhdGUnLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnUHJpb3JpdHknLFxuICAgICAgICAgICAgdHlwZTogJ3ByaW9yaXR5JyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgICAgfV1cbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgaWQ6IGN0eC5wYXJhbXMuaWQsXG4gICAgICAgICAgICBkb25lOiBjdHgucGFyYW1zLnN0YXR1cyA9PT0gJ2RvbmUnLFxuICAgICAgICAgICAgb3JkZXJUeXBlOiB0aGlzLl9ncm91cFByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgIG9yZGVyRGlyZWN0aW9uOiB0aGlzLl9ncm91cFByZWZlcmVuY2VzLmdldE9yZGVyKCkuZGlyZWN0aW9uLFxuXG4gICAgICAgICAgICBwb3N0TG9hZEdyb3VwOiAoZ3JvdXApID0+IHtcblxuICAgICAgICAgICAgICBQdWJTdWIucHVibGlzaCgncm91dGVDaGFuZ2VkJywge1xuICAgICAgICAgICAgICAgIG5hbWU6IGdyb3VwLmZpZWxkcy5uYW1lLFxuICAgICAgICAgICAgICAgIG9yZGVyaW5nLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRPcmRlcmluZzogdGhpcy5fZ3JvdXBQcmVmZXJlbmNlcy5nZXRPcmRlcigpLnR5cGUsXG4gICAgICAgICAgICAgICAgdGFiczogW3tcbiAgICAgICAgICAgICAgICAgIGxpbms6ICcvZ3JvdXAvJyArIGdyb3VwLmlkLFxuICAgICAgICAgICAgICAgICAgdGl0bGU6ICd1bmRvbmUnLFxuICAgICAgICAgICAgICAgICAgY3VycmVudDogY3R4LnBhcmFtcy5zdGF0dXMgIT09ICdkb25lJ1xuICAgICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAgIGxpbms6ICcvZ3JvdXAvJyArIGdyb3VwLmlkICsgJy9kb25lJyxcbiAgICAgICAgICAgICAgICAgIHRpdGxlOiAnZG9uZScsXG4gICAgICAgICAgICAgICAgICBjdXJyZW50OiBjdHgucGFyYW1zLnN0YXR1cyA9PT0gJ2RvbmUnXG4gICAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlc29sdmU6IChncm91cCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgcXVlcnlPYmplY3QgPSB7fTtcbiAgICAgICAgICAgIGN0eC5xdWVyeXN0cmluZy5zcGxpdCgnJicpLmZvckVhY2goYml0ID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgdmFscyA9IGJpdC5zcGxpdCgnPScpO1xuICAgICAgICAgICAgICBxdWVyeU9iamVjdFt2YWxzWzBdXSA9IHZhbHNbMV07XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdGhpcy5ncm91cFZpZXcuc2V0U2hvd0RvbmUoY3R4LnBhcmFtcy5zdGF0dXMgPT09ICdkb25lJyk7XG4gICAgICAgICAgICB0aGlzLmdyb3VwVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgZ3JvdXAsXG4gICAgICAgICAgICAgIGVkaXRJRDogcXVlcnlPYmplY3QuZWRpdCxcbiAgICAgICAgICAgICAgcHJpb3JpdGllczogSm90LmdldFByaW9yaXRpZXMoKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cENsaWVudFJvdXRlcztcbiIsImNvbnN0IEhvbWVSb3V0ZXMgPSByZXF1aXJlKCcuLi9ob21lJyk7XG5jb25zdCBIb21lVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2hvbWUnKTtcbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uLy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNsYXNzIEhvbWVSb3V0ZXIge1xuICBjb25zdHJ1Y3Rvcihyb3V0ZXIsIHByZWZpeCwgdmlld0NvbnRhaW5lcikge1xuICAgIHRoaXMucm91dGVzID0gbmV3IEhvbWVSb3V0ZXMocm91dGVyLCBwcmVmaXgpO1xuXG4gICAgdGhpcy5ob21lVmlldyA9IG5ldyBIb21lVmlldyh2aWV3Q29udGFpbmVyKTtcbiAgfVxuXG4gIHJlZ2lzdGVyUm91dGVzKCkge1xuICAgIHRoaXMucm91dGVzLnJlZ2lzdGVyUm91dGUoJ2hvbWUnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcGFyYW1zOiB7fSxcblxuICAgICAgICAgIHByZUFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ3JvdXRlQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgICAgbmFtZTogJ0pvdCcsXG4gICAgICAgICAgICAgIG9yZGVyOiBbXSxcbiAgICAgICAgICAgICAgdGFiczogW3tcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0hvbWUnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvJyxcbiAgICAgICAgICAgICAgICBjdXJyZW50OiB0cnVlXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0aXRsZTogJ0pvdHMnLFxuICAgICAgICAgICAgICAgIGxpbms6ICcvam90J1xuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgdGl0bGU6ICdMaXN0cycsXG4gICAgICAgICAgICAgICAgbGluazogJy9ncm91cCdcbiAgICAgICAgICAgICAgfV1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmhvbWVWaWV3LnJlbmRlcihmYWxzZSwge1xuICAgICAgICAgICAgICBsb2FkaW5nOiB0cnVlXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LFxuXG4gICAgICAgICAgcmVzb2x2ZTogc3RhdHMgPT4ge1xuICAgICAgICAgICAgdGhpcy5ob21lVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgc3RhdHNcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZWplY3Q6IChlcnIpID0+IHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihlcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSG9tZVJvdXRlcjtcbiIsImNvbnN0IEpvdFJvdXRlcyA9IHJlcXVpcmUoJy4uL2pvdCcpO1xuY29uc3QgSm90c1ZpZXcgPSByZXF1aXJlKCcuLi8uLi92aWV3cy9qb3RzJyk7XG5jb25zdCBMb2FkaW5nVmlldyA9IHJlcXVpcmUoJy4uLy4uL3ZpZXdzL2xvYWRpbmcnKTtcbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uLy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNvbnN0IEpvdHNQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4uLy4uL3ByZWZlcmVuY2VzL2pvdHMnKTtcblxuY2xhc3MgSm90Q2xpZW50Um91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXgsIHZpZXdDb250YWluZXIpIHtcbiAgICB0aGlzLnJvdXRlcyA9IG5ldyBKb3RSb3V0ZXMocm91dGVyLCBwcmVmaXgpO1xuXG4gICAgdGhpcy5qb3RzVmlldyA9IG5ldyBKb3RzVmlldyh2aWV3Q29udGFpbmVyKTtcbiAgICB0aGlzLmxvYWRpbmdWaWV3ID0gbmV3IExvYWRpbmdWaWV3KHZpZXdDb250YWluZXIpO1xuXG4gICAgdGhpcy5fam90c1ByZWZlcmVuY2VzID0gbmV3IEpvdHNQcmVmZXJlbmNlcygpO1xuICB9XG5cbiAgcmVnaXN0ZXJSb3V0ZXMoKSB7XG5cbiAgICB0aGlzLnJvdXRlcy5yZWdpc3RlclJvdXRlKCdhbGwnLCAoY3R4LCBuZXh0KSA9PiB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnN0IHBhZ2UgPSB7XG4gICAgICAgICAgbmFtZTogJ0pvdCdcbiAgICAgICAgfTtcblxuICAgICAgICBjb25zdCBvcmRlcmluZyA9IHtcbiAgICAgICAgICBvcmRlcnM6IFt7XG4gICAgICAgICAgICBuYW1lOiAnQWxwaGEnLFxuICAgICAgICAgICAgdHlwZTogJ2FscGhhJyxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2FzYydcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBuYW1lOiAnRGF0ZScsXG4gICAgICAgICAgICB0eXBlOiAnZGF0ZScsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdkZXNjJ1xuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIG5hbWU6ICdQcmlvcml0eScsXG4gICAgICAgICAgICB0eXBlOiAncHJpb3JpdHknLFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgICB9XVxuICAgICAgICB9O1xuXG4gICAgICAgIGNvbnN0IHRhYnMgPSBbe1xuICAgICAgICAgIHRpdGxlOiAnSG9tZScsXG4gICAgICAgICAgbGluazogJy8nXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0aXRsZTogJ0pvdHMnLFxuICAgICAgICAgIGxpbms6ICcvam90JyxcbiAgICAgICAgICBjdXJyZW50OiB0cnVlXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0aXRsZTogJ0xpc3RzJyxcbiAgICAgICAgICBsaW5rOiAnL2dyb3VwJ1xuICAgICAgICB9XTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgb3JkZXJUeXBlOiB0aGlzLl9qb3RzUHJlZmVyZW5jZXMuZ2V0T3JkZXIoKS50eXBlLFxuICAgICAgICAgICAgb3JkZXJEaXJlY3Rpb246IHRoaXMuX2pvdHNQcmVmZXJlbmNlcy5nZXRPcmRlcigpLmRpcmVjdGlvblxuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBwcmVBY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdyb3V0ZUNoYW5nZWQnLCB7XG4gICAgICAgICAgICAgIG5hbWU6IHBhZ2UubmFtZSxcbiAgICAgICAgICAgICAgb3JkZXJpbmcsXG4gICAgICAgICAgICAgIGN1cnJlbnRPcmRlcmluZzogdGhpcy5fam90c1ByZWZlcmVuY2VzLmdldE9yZGVyKCkudHlwZSxcbiAgICAgICAgICAgICAgdGFic1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHRoaXMubG9hZGluZ1ZpZXcucmVuZGVyKGZhbHNlLCB7XG4gICAgICAgICAgICAgIGl0ZW1zOiBbMCwgMCwgMCwgMCwgMCwgMCwgMF1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICByZXNvbHZlOiAoam90cykgPT4ge1xuICAgICAgICAgICAgdGhpcy5qb3RzVmlldy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgICAgam90c1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHJlamVjdDogKGVycikgPT4ge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3RDbGllbnRSb3V0ZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNsYXNzIEdyb3VwUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBHcm91cC5sb2FkQWxsKHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy52aWV3ID0ge1xuICAgICAgX3BhdGg6ICcvOmlkLzpzdGF0dXM/JyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQsIHRydWUsIHBhcmFtcy5vcmRlclR5cGUsIHBhcmFtcy5vcmRlckRpcmVjdGlvbikudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgaWYgKHBhcmFtcy5wb3N0TG9hZEdyb3VwKSB7XG4gICAgICAgICAgICBwYXJhbXMucG9zdExvYWRHcm91cChncm91cCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgZ3JvdXAuX2pvdHMgPSBncm91cC5nZXRKb3RzKHBhcmFtcy5kb25lKTtcbiAgICAgICAgICByZXR1cm4gZ3JvdXA7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBHcm91cCh7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBuYW1lOiBwYXJhbXMubmFtZSxcbiAgICAgICAgICAgIGNvbG91cjogcGFyYW1zLmNvbG91clxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEdyb3VwLnJlbW92ZShwYXJhbXMuaWQpLnRoZW4ocmVzdWx0ID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcblxuICAgIHRoaXMuX3JvdXRlcy51cGRhdGUgPSB7XG4gICAgICBfcGF0aDogJy86aWQnLFxuICAgICAgX21ldGhvZDogWydwb3N0J10sXG4gICAgICBfYWN0aW9uOiBwYXJhbXMgPT4ge1xuICAgICAgICBpZiAocGFyYW1zLmFjdGlvbiAhPT0gJ3VwZGF0ZScpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gR3JvdXAubG9hZChwYXJhbXMuaWQpLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgZ3JvdXAuZmllbGRzID0gcGFyYW1zLmZpZWxkcztcblxuICAgICAgICAgICAgcmV0dXJuIGdyb3VwLnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgUm91dGVzID0gcmVxdWlyZSgnLi9yb3V0ZXMnKTtcblxuY29uc3QgSm90ID0gcmVxdWlyZSgnLi4vbW9kZWxzL2pvdCcpO1xuXG5jbGFzcyBIb21lUm91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5ob21lID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsnZ2V0J10sXG4gICAgICBfYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBKb3QuZ2V0UGVyY2VudGFnZURvbmUoKS50aGVuKHN0YXRzID0+IHtcbiAgICAgICAgICBjb25zdCBzZWdtZW50cyA9IHtcbiAgICAgICAgICAgIG9uZTogOTAsXG4gICAgICAgICAgICB0d286IDkwLFxuICAgICAgICAgICAgdGhyZWU6IDkwLFxuICAgICAgICAgICAgZm91cjogOTBcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gMjUpIHtcbiAgICAgICAgICAgIHNlZ21lbnRzLm9uZSA9IDkwIC0gKHN0YXRzLnBlcmNlbnQgLyAyNSkgKiA5MDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VnbWVudHMub25lID0gMDtcblxuICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNTApIHtcbiAgICAgICAgICAgICAgc2VnbWVudHMudHdvID0gOTAgLSAoKHN0YXRzLnBlcmNlbnQgLSAyNSkgLyAyNSkgKiA5MDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHNlZ21lbnRzLnR3byA9IDA7XG5cbiAgICAgICAgICAgICAgaWYgKHN0YXRzLnBlcmNlbnQgPD0gNzUpIHtcbiAgICAgICAgICAgICAgICBzZWdtZW50cy50aHJlZSA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNTApIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VnbWVudHMudGhyZWUgPSAwO1xuXG4gICAgICAgICAgICAgICAgc2VnbWVudHMuZm91ciA9IDkwIC0gKChzdGF0cy5wZXJjZW50IC0gNzUpIC8gMjUpICogOTA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzdGF0cy5zZWdtZW50cyA9IHNlZ21lbnRzO1xuXG4gICAgICAgICAgaWYgKHN0YXRzLm51bUdyb3VwcyA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IHBsdXJhbCA9IHN0YXRzLm51bUdyb3VwcyA9PT0gMSA/ICcnIDogJ3MnO1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9IGAke3N0YXRzLnBlcmNlbnR9JSBkb25lIGluICR7c3RhdHMubnVtR3JvdXBzfSBsaXN0JHtwbHVyYWx9YDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3RhdHMubWVzc2FnZSA9ICdObyBsaXN0cy4gQWRkIG9uZSBub3cnO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiBzdGF0cztcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhvbWVSb3V0ZXM7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFJvdXRlcyA9IHJlcXVpcmUoJy4vcm91dGVzJyk7XG5cbmNvbnN0IEpvdCA9IHJlcXVpcmUoJy4uL21vZGVscy9qb3QnKTtcblxuY2xhc3MgSm90Um91dGVzIGV4dGVuZHMgUm91dGVzIHtcbiAgY29uc3RydWN0b3Iocm91dGVyLCBwcmVmaXggPSAnJykge1xuICAgIHN1cGVyKHJvdXRlciwgcHJlZml4KTtcblxuICAgIHRoaXMuX3JvdXRlcy5hbGwgPSB7XG4gICAgICBfcGF0aDogJy8nLFxuICAgICAgX21ldGhvZDogWydnZXQnXSxcbiAgICAgIF9hY3Rpb246IHBhcmFtcyA9PiB7XG4gICAgICAgIHJldHVybiBKb3QubG9hZEFsbCh0cnVlLCBwYXJhbXMub3JkZXJUeXBlLCBwYXJhbXMub3JkZXJEaXJlY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuYWRkID0ge1xuICAgICAgX3BhdGg6ICcvJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgcmV0dXJuIG5ldyBKb3Qoe1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgY29udGVudDogcGFyYW1zLmNvbnRlbnQsXG4gICAgICAgICAgICBncm91cDogcGFyYW1zLmdyb3VwLFxuICAgICAgICAgICAgcHJpb3JpdHk6IHBhcmFtcy5wcmlvcml0eVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuc2F2ZSgpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMuZGVsZXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICdkZWxldGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICAvL3dpbGwgY2FzY2FkZSBkb3duIHRvIHVwZGF0ZSBldGMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5yZW1vdmUocGFyYW1zLmlkKS50aGVuKHJlc3VsdCA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG5cbiAgICB0aGlzLl9yb3V0ZXMudXBkYXRlID0ge1xuICAgICAgX3BhdGg6ICcvOmlkJyxcbiAgICAgIF9tZXRob2Q6IFsncG9zdCddLFxuICAgICAgX2FjdGlvbjogcGFyYW1zID0+IHtcbiAgICAgICAgaWYgKHBhcmFtcy5hY3Rpb24gIT09ICd1cGRhdGUnKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEpvdC5sb2FkKHBhcmFtcy5pZCkudGhlbihqb3QgPT4ge1xuICAgICAgICAgICAgY29uc3QgY3VycmVudEZpZWxkcyA9IGpvdC5maWVsZHM7XG5cbiAgICAgICAgICAgIGpvdC5maWVsZHMgPSBwYXJhbXMuZmllbGRzO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcy5maWVsZHMuZG9uZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgam90LmZpZWxkcy5kb25lID0gY3VycmVudEZpZWxkcy5kb25lO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gam90LnNhdmUoKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKb3RSb3V0ZXM7XG4iLCJjbGFzcyBSb3V0ZXMge1xuXG4gIGNvbnN0cnVjdG9yKHJvdXRlciwgcHJlZml4ID0gJycpIHtcbiAgICB0aGlzLl9yb3V0ZXIgPSByb3V0ZXI7XG4gICAgdGhpcy5fcHJlZml4ID0gcHJlZml4O1xuXG4gICAgdGhpcy5fcm91dGVzID0ge307XG4gIH1cblxuICByZWdpc3RlclJvdXRlKG5hbWUsIGNvbmZpZykge1xuICAgIGNvbnN0IHJvdXRlID0gdGhpcy5fcm91dGVzW25hbWVdO1xuICAgIHJvdXRlLl9tZXRob2QuZm9yRWFjaChtZXRob2QgPT4ge1xuICAgICAgdGhpcy5fcm91dGVyW21ldGhvZF0odGhpcy5fcHJlZml4ICsgcm91dGUuX3BhdGgsICguLi5wYXJhbXMpID0+IHtcbiAgICAgICAgY29uZmlnKC4uLnBhcmFtcykudGhlbihyZXN1bHQgPT4ge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQucHJlQWN0aW9uKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5wcmVBY3Rpb24oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJvdXRlLl9hY3Rpb24ocmVzdWx0LnBhcmFtcylcbiAgICAgICAgICAgIC50aGVuKHJlc3VsdC5yZXNvbHZlKTtcbiAgICAgICAgICB9KS5jYXRjaChyZXN1bHQucmVqZWN0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJvdXRlcztcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgQXV0b2xpbmtlciA9IHJlcXVpcmUoJ2F1dG9saW5rZXInKTtcblxuY29uc3QgSGFuZGxlYmFycyA9IHJlcXVpcmUoJ2hhbmRsZWJhcnMvZGlzdC9oYW5kbGViYXJzLnJ1bnRpbWUnKTtcblxuZXhwb3J0cy5pZkVxdWFsID0gaWZFcXVhbDtcbmV4cG9ydHMuaWZJbiA9IGlmSW47XG5leHBvcnRzLmF1dG9MaW5rID0gYXV0b0xpbms7XG5cbmZ1bmN0aW9uIGlmRXF1YWwoY29uZGl0aW9uYWwsIGVxdWFsVG8sIG9wdGlvbnMpIHtcbiAgaWYgKGNvbmRpdGlvbmFsID09PSBlcXVhbFRvKSB7XG4gICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xufVxuXG5mdW5jdGlvbiBpZkluKGVsZW0sIGFyciwgb3B0aW9ucykge1xuICBpZiAoYXJyLmluZGV4T2YoZWxlbSkgPiAtMSkge1xuICAgIHJldHVybiBvcHRpb25zLmZuKHRoaXMpO1xuICB9XG5cbiAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZSh0aGlzKTtcbn1cblxuZnVuY3Rpb24gYXV0b0xpbmsoZWxlbSwgb3B0aW9ucykge1xuICBjb25zdCB1cmwgPSBBdXRvbGlua2VyLmxpbmsoSGFuZGxlYmFycy5lc2NhcGVFeHByZXNzaW9uKGVsZW0pKTtcblxuICByZXR1cm4gbmV3IEhhbmRsZWJhcnMuU2FmZVN0cmluZyh1cmwpO1xufVxuIiwiY2xhc3MgRGF0ZVV0aWxzIHtcblxuICBzdGF0aWMgZ2V0RGF5cygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ1N1bicsXG4gICAgICAnTW9uJyxcbiAgICAgICdUdWUnLFxuICAgICAgJ1dlZCcsXG4gICAgICAnVGh1JyxcbiAgICAgICdGcmknLFxuICAgICAgJ1NhdCdcbiAgICBdO1xuICB9XG5cbiAgc3RhdGljIGdldE1vbnRocygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ0phbicsXG4gICAgICAnRmViJyxcbiAgICAgICdNYXInLFxuICAgICAgJ0FwcicsXG4gICAgICAnTWF5JyxcbiAgICAgICdKdW4nLFxuICAgICAgJ0p1bCcsXG4gICAgICAnQXVnJyxcbiAgICAgICdTZXAnLFxuICAgICAgJ09jdCcsXG4gICAgICAnTm92JyxcbiAgICAgICdEZWMnXG4gICAgXTtcbiAgfVxuXG4gIHN0YXRpYyBmb3JtYXQoZGF0ZSkge1xuICAgIGNvbnN0IGRheSA9IGRhdGUuZ2V0RGF5KCk7XG4gICAgY29uc3QgZGF5TnVtID0gZGF0ZS5nZXREYXRlKCk7XG4gICAgY29uc3QgbW9udGhOdW0gPSBkYXRlLmdldE1vbnRoKCk7XG4gICAgY29uc3QgbWludXRlcyA9IHRoaXMuX3BhZChkYXRlLmdldE1pbnV0ZXMoKSwgMik7XG4gICAgY29uc3QgaG91cnMgPSB0aGlzLl9wYWQoZGF0ZS5nZXRIb3VycygpLCAyKTtcblxuICAgIHJldHVybiB0aGlzLmdldERheXMoKVtkYXldICsgJyAnICsgZGF5TnVtICsgJyAnICsgdGhpcy5nZXRNb250aHMoKVttb250aE51bV0gKyAnICcgKyBob3VycyArICc6JyArIG1pbnV0ZXM7XG4gIH1cblxuICBzdGF0aWMgX3BhZChudW0sIHNpemUpIHtcbiAgICBjb25zdCBzID0gJzAwMDAwMDAwMCcgKyBudW07XG4gICAgcmV0dXJuIHMuc3Vic3RyKHMubGVuZ3RoIC0gc2l6ZSk7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBEYXRlVXRpbHM7XG4iLCJjbGFzcyBQdWJTdWIge1xuICAvL2Jhc2VkIG9uIHB1YnN1YiBpbXBsZW1lbnRhdGlvbiBhdCBodHRwOi8vYWRkeW9zbWFuaS5jb20vcmVzb3VyY2VzL2Vzc2VudGlhbGpzZGVzaWducGF0dGVybnMvYm9vay8jb2JzZXJ2ZXJwYXR0ZXJuamF2YXNjcmlwdFxuXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIFN0b3JhZ2UgZm9yIHRvcGljcyB0aGF0IGNhbiBiZSBicm9hZGNhc3RcbiAgICAvLyBvciBsaXN0ZW5lZCB0b1xuICAgIHRoaXMuX3RvcGljcyA9IHt9O1xuXG4gICAgLy8gQW4gdG9waWMgaWRlbnRpZmllclxuICAgIHRoaXMuX3N1YlVpZCA9IC0xO1xuICB9XG5cbiAgLy8gUHVibGlzaCBvciBicm9hZGNhc3QgZXZlbnRzIG9mIGludGVyZXN0XG4gIC8vIHdpdGggYSBzcGVjaWZpYyB0b3BpYyBuYW1lIGFuZCBhcmd1bWVudHNcbiAgLy8gc3VjaCBhcyB0aGUgZGF0YSB0byBwYXNzIGFsb25nXG4gIHB1Ymxpc2godG9waWMsIGFyZ3MpIHtcbiAgICBpZiAoIXRoaXMuX3RvcGljc1t0b3BpY10pIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICB2YXIgc3Vic2NyaWJlcnMgPSB0aGlzLl90b3BpY3NbdG9waWNdO1xuICAgIHZhciBsZW4gPSBzdWJzY3JpYmVycyA/IHN1YnNjcmliZXJzLmxlbmd0aCA6IDA7XG5cbiAgICB3aGlsZSAobGVuLS0pIHtcbiAgICAgIHN1YnNjcmliZXJzW2xlbl0uZnVuYyh0b3BpYywgYXJncyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBTdWJzY3JpYmUgdG8gZXZlbnRzIG9mIGludGVyZXN0XG4gIC8vIHdpdGggYSBzcGVjaWZpYyB0b3BpYyBuYW1lIGFuZCBhXG4gIC8vIGNhbGxiYWNrIGZ1bmN0aW9uLCB0byBiZSBleGVjdXRlZFxuICAvLyB3aGVuIHRoZSB0b3BpYy9ldmVudCBpcyBvYnNlcnZlZFxuICBzdWJzY3JpYmUodG9waWMsIGZ1bmMpIHtcbiAgICBpZiAoIXRoaXMuX3RvcGljc1t0b3BpY10pIHtcbiAgICAgIHRoaXMuX3RvcGljc1t0b3BpY10gPSBbXTtcbiAgICB9XG5cbiAgICB2YXIgdG9rZW4gPSAoKyt0aGlzLl9zdWJVaWQpLnRvU3RyaW5nKCk7XG4gICAgdGhpcy5fdG9waWNzW3RvcGljXS5wdXNoKHtcbiAgICAgIHRva2VuOiB0b2tlbixcbiAgICAgIGZ1bmM6IGZ1bmNcbiAgICB9KTtcblxuICAgIHJldHVybiB0b2tlbjtcbiAgfVxuXG4gIC8vIFVuc3Vic2NyaWJlIGZyb20gYSBzcGVjaWZpY1xuICAvLyB0b3BpYywgYmFzZWQgb24gYSB0b2tlbml6ZWQgcmVmZXJlbmNlXG4gIC8vIHRvIHRoZSBzdWJzY3JpcHRpb25cbiAgdW5zdWJzY3JpYmUodG9rZW4pIHtcbiAgICBmb3IgKHZhciBtIGluIHRoaXMuX3RvcGljcykge1xuICAgICAgaWYgKHRoaXMuX3RvcGljc1ttXSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IHRoaXMuX3RvcGljc1ttXS5sZW5ndGg7IGkgPCBqOyBpKyspIHtcbiAgICAgICAgICBpZiAodGhpcy5fdG9waWNzW21dW2ldLnRva2VuID09PSB0b2tlbikge1xuICAgICAgICAgICAgdGhpcy5fdG9waWNzW21dLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIHJldHVybiB0b2tlbjtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IG5ldyBQdWJTdWIoKTtcbiIsImNsYXNzIFRvdWNoIHtcbiAgY29uc3RydWN0b3IoZWxlbWVudCkge1xuICAgIHRoaXMuX2VsZW1lbnQgPSBlbGVtZW50IHx8IG51bGw7XG5cbiAgICB0aGlzLl94RG93biA9IG51bGw7XG4gICAgdGhpcy5feURvd24gPSBudWxsO1xuXG4gICAgdGhpcy5fcmVnaXN0ZXJlZCA9IHtcbiAgICAgIGxlZnQ6IFtdLFxuICAgICAgcmlnaHQ6IFtdLFxuICAgICAgdXA6IFtdLFxuICAgICAgZG93bjogW11cbiAgICB9O1xuXG4gICAgdGhpcy5oYW5kbGVUb3VjaFN0YXJ0ID0gdGhpcy5oYW5kbGVUb3VjaFN0YXJ0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5oYW5kbGVUb3VjaE1vdmUgPSB0aGlzLmhhbmRsZVRvdWNoTW92ZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgc2V0RWxlbWVudChlbGVtZW50KSB7XG4gICAgdGhpcy5kZXN0cm95KCk7XG5cbiAgICB0aGlzLl9lbGVtZW50ID0gZWxlbWVudDtcblxuICAgIHRoaXMuX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIHRoaXMuaGFuZGxlVG91Y2hTdGFydCwgZmFsc2UpO1xuICAgIHRoaXMuX2VsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5oYW5kbGVUb3VjaE1vdmUsIGZhbHNlKTtcbiAgfVxuXG4gIHJlZ2lzdGVyKGRpcmVjdGlvbiwgZm4pIHtcbiAgICB0aGlzLl9yZWdpc3RlcmVkW2RpcmVjdGlvbl0ucHVzaChmbik7XG4gIH1cblxuICBoYW5kbGVUb3VjaFN0YXJ0KGV2dCkge1xuICAgIHRoaXMuX3hEb3duID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICB0aGlzLl95RG93biA9IGV2dC50b3VjaGVzWzBdLmNsaWVudFk7XG4gIH1cblxuICBoYW5kbGVUb3VjaE1vdmUoZXZ0KSB7XG4gICAgaWYgKCAhIHRoaXMuX3hEb3duIHx8ICEgdGhpcy5feURvd24gKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgeFVwID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WDtcbiAgICB2YXIgeVVwID0gZXZ0LnRvdWNoZXNbMF0uY2xpZW50WTtcblxuICAgIHZhciB4RGlmZiA9IHRoaXMuX3hEb3duIC0geFVwO1xuICAgIHZhciB5RGlmZiA9IHRoaXMuX3lEb3duIC0geVVwO1xuXG4gICAgaWYgKCBNYXRoLmFicyggeERpZmYgKSA+IE1hdGguYWJzKCB5RGlmZiApICkge1xuICAgICAgICBpZiAoIHhEaWZmID4gMCApIHtcbiAgICAgICAgICAgIHRoaXMuX3JlZ2lzdGVyZWQubGVmdC5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5fcmVnaXN0ZXJlZC5yaWdodC5mb3JFYWNoKGZuID0+IGZuKCkpO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCB5RGlmZiA+IDAgKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlcmVkLnVwLmZvckVhY2goZm4gPT4gZm4oKSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9yZWdpc3RlcmVkLmRvd24uZm9yRWFjaChmbiA9PiBmbigpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuX3hEb3duID0gbnVsbDtcbiAgICB0aGlzLl95RG93biA9IG51bGw7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIGlmICh0aGlzLl9lbGVtZW50KSB7XG4gICAgICB0aGlzLl9lbGVtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCB0aGlzLmhhbmRsZVRvdWNoU3RhcnQsIGZhbHNlKTtcbiAgICAgIHRoaXMuX2VsZW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2htb3ZlJywgdGhpcy5oYW5kbGVUb3VjaE1vdmUsIGZhbHNlKTtcbiAgICB9XG5cbiAgICB0aGlzLl9lbGVtZW50ID0gbnVsbDtcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRvdWNoO1xuIiwiY29uc3QgV2lkZ2V0ID0gcmVxdWlyZSgnLi93aWRnZXQnKTtcblxuY2xhc3MgQ29sb3VyU2VsZWN0b3IgZXh0ZW5kcyBXaWRnZXQge1xuICBpbml0RXZlbnRzKGVsKSB7XG4gICAgc3VwZXIuaW5pdEV2ZW50cygpO1xuXG4gICAgY29uc3Qgd2lkZ2V0cyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5wYXJ0aWFsLWNvbG91ci1zZWxlY3RvcicpO1xuICAgIGZvciAobGV0IHdpZGdldCBvZiB3aWRnZXRzKSB7XG4gICAgICBjb25zdCBvcHRpb25zID0gd2lkZ2V0LnF1ZXJ5U2VsZWN0b3JBbGwoJy5jb2xvdXItc2VsZWN0b3JfX2NvbG91cicpO1xuICAgICAgY29uc3Qgc2VsZWN0ID0gd2lkZ2V0LnF1ZXJ5U2VsZWN0b3IoJ3NlbGVjdCcpO1xuXG4gICAgICBmb3IgKGxldCBvcHRpb24gb2Ygb3B0aW9ucykge1xuICAgICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbChvcHRpb25zKTtcbiAgICAgICAgICBvcHRpb24uY2xhc3NMaXN0LmFkZCgnY29sb3VyLXNlbGVjdG9yX19jb2xvdXItLWN1cnJlbnQnKTtcbiAgICAgICAgICBzZWxlY3QudmFsdWUgPSBvcHRpb24uZGF0YXNldC52YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdW5zZWxlY3RBbGwob3B0aW9ucykge1xuICAgIGZvciAobGV0IG9wdGlvbiBvZiBvcHRpb25zKSB7XG4gICAgICBvcHRpb24uY2xhc3NMaXN0LnJlbW92ZSgnY29sb3VyLXNlbGVjdG9yX19jb2xvdXItLWN1cnJlbnQnKTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBDb2xvdXJTZWxlY3RvcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jb25zdCBKb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvam90Jyk7XG5jb25zdCBHcm91cCA9IHJlcXVpcmUoJy4uL21vZGVscy9ncm91cCcpO1xuXG5jb25zdCBHcm91cFByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vcHJlZmVyZW5jZXMvZ3JvdXAnKTtcblxuY29uc3QgQ29sb3VyU2VsZWN0b3JXaWRnZXQgPSByZXF1aXJlKCcuL2NvbG91ci1zZWxlY3RvcicpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBWaWV3R3JvdXAgZXh0ZW5kcyBWaWV3IHtcbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJXaWRnZXQoQ29sb3VyU2VsZWN0b3JXaWRnZXQpO1xuXG4gICAgdGhpcy5fc2hvd0RvbmUgPSBmYWxzZTtcblxuICAgIHRoaXMuX3ByZWZlcmVuY2VzID0gbmV3IEdyb3VwUHJlZmVyZW5jZXMoKTtcbiAgfVxuXG4gIHNldFNob3dEb25lKGRvbmUpIHtcbiAgICB0aGlzLl9zaG93RG9uZSA9IGRvbmU7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHN1cGVyLnJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCd1cGRhdGUnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIGlmIChhcmdzLmNoYW5nZXMgJiYgYXJncy5jaGFuZ2VzLmxlbmd0aCkge1xuICAgICAgICBHcm91cC5sb2FkKHBhcmFtcy5ncm91cC5pZCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdqb3QtbGlzdCcsIHtcbiAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCdvcmRlckNoYW5nZWQnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIHRoaXMuX3ByZWZlcmVuY2VzLnNldE9yZGVyKGFyZ3MudHlwZSwgYXJncy5kaXJlY3Rpb24pO1xuXG4gICAgICBjb25zdCBwYXJhbXMgPSB0aGlzLmxhc3RQYXJhbXM7XG4gICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2pvdC1saXN0JywgcGFyYW1zKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLl9hZGREb2N1bWVudExpc3RlbmVyKCd1bnNlbGVjdEFsbCcsICdjbGljaycsICgpID0+IHtcbiAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKSB7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdqb3QtbGlzdCc6XG4gICAgICAgIHBhcmFtcy5qb3RzID0gcGFyYW1zLmdyb3VwLmdldEpvdHModGhpcy5fc2hvd0RvbmUpO1xuICAgICAgICBwYXJhbXMuam90cyA9IHRoaXMuX3ByZWZlcmVuY2VzLm9yZGVyKHBhcmFtcy5qb3RzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29uc3QgZWwgPSBzdXBlci5yZW5kZXJQYXJ0aWFsKG5hbWUsIHBhcmFtcyk7XG5cbiAgICBzd2l0Y2ggKG5hbWUpIHtcbiAgICAgIGNhc2UgJ2pvdC1saXN0JzpcbiAgICAgICAgdGhpcy5pbml0RWRpdCgpO1xuICAgICAgICB0aGlzLmluaXREZWxldGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRVcGRhdGVGb3JtcygpO1xuICAgICAgICB0aGlzLmluaXRXaWRnZXRzKGVsKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICBzdXBlci5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLmluaXRBZGRGb3JtKCk7XG4gICAgdGhpcy5pbml0RWRpdCgpO1xuICAgIHRoaXMuaW5pdERlbGV0ZUZvcm1zKCk7XG4gICAgdGhpcy5pbml0VXBkYXRlRm9ybXMoKTtcbiAgfVxuXG4gIGluaXRBZGRGb3JtKCkge1xuICAgIGNvbnN0IGZvcm0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuZm9ybS1qb3QtYWRkJyk7XG4gICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBjb25zdCBjb250ZW50RmllbGQgPSBmb3JtLmVsZW1lbnRzLmNvbnRlbnQ7XG4gICAgICBjb25zdCBjb250ZW50ID0gY29udGVudEZpZWxkLnZhbHVlO1xuXG4gICAgICBjb25zdCBncm91cEZpZWxkID0gZm9ybS5lbGVtZW50cy5ncm91cDtcbiAgICAgIGNvbnN0IGdyb3VwID0gZ3JvdXBGaWVsZC52YWx1ZTtcblxuICAgICAgY29uc3QgcHJpb3JpdHkgPSBmb3JtLmVsZW1lbnRzLnByaW9yaXR5LnZhbHVlO1xuXG4gICAgICBuZXcgSm90KHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgY29udGVudCxcbiAgICAgICAgICBncm91cCxcbiAgICAgICAgICBwcmlvcml0eVxuICAgICAgICB9XG4gICAgICB9KS5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIGNvbnRlbnRGaWVsZC52YWx1ZSA9ICcnO1xuICAgICAgICAvL2NvbnRlbnRGaWVsZC5mb2N1cygpO1xuICAgICAgICBjb250ZW50RmllbGQuYmx1cigpO1xuICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICAgIEdyb3VwLmxvYWQoZ3JvdXApLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICBncm91cFxuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgY29uc3QgdG9TaG93ID0gZm9ybS5xdWVyeVNlbGVjdG9yKCcuc2hvdy1vbi1mb2N1cycpO1xuXG4gICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgICAgdG9TaG93LmNsYXNzTGlzdC5hZGQoJ3Nob3cnKTtcbiAgICB9KTtcbiAgfVxuXG4gIGluaXRFZGl0KCkge1xuICAgIGNvbnN0IGxpbmtzID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmpvdHNfX2pvdF9fZWRpdCcpO1xuICAgIGZvciAobGV0IGxpbmsgb2YgbGlua3MpIHtcbiAgICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyAgLy9zdG9wIGRvY3VtZW50IGxpc3RlbmVyIGZyb20gcmVtb3ZpbmcgJ2VkaXQnIGNsYXNzXG5cbiAgICAgICAgY29uc3QgaWQgPSBsaW5rLmRhdGFzZXQuaWQ7XG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuam90c19fam90LScgKyBpZCk7XG5cbiAgICAgICAgaWYgKCFpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZWRpdCcpKSB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuXG4gICAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0Jyk7XG5cbiAgICAgICAgICAvL2NvbnN0IGNvbnRlbnRGaWVsZCA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5mb3JtLWpvdC11cGRhdGUtJyArIGlkKS5lbGVtZW50cy5jb250ZW50O1xuICAgICAgICAgIC8vY29udGVudEZpZWxkLmZvY3VzKCk7XG4gICAgICAgICAgLy9jb250ZW50RmllbGQudmFsdWUgPSBjb250ZW50RmllbGQudmFsdWU7IC8vZm9yY2VzIGN1cnNvciB0byBnbyB0byBlbmQgb2YgdGV4dFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdW5zZWxlY3RBbGwoKSB7XG4gICAgLy9UT0RPOiBoYXZlIGNsYXNzIG1lbWJlciB0byBob2xkIHJlZmVyZW5jZSB0byBjb21tb24gZWxlbWVudC9lbGVtZW50IGdyb3VwcyB0byBhdm9pZCByZXF1ZXJ5aW5nXG4gICAgY29uc3QgaXRlbXMgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuam90c19fam90Jyk7XG4gICAgZm9yIChsZXQgaXRlbSBvZiBpdGVtcykge1xuICAgICAgaXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hvd3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuc2hvdy1vbi1mb2N1cycpO1xuICAgIGZvciAobGV0IHNob3cgb2Ygc2hvd3MpIHtcbiAgICAgIHNob3cuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIH1cbiAgfVxuXG4gIGluaXREZWxldGVGb3JtcygpIHtcbiAgICBjb25zdCBmb3JtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mb3JtLWpvdC1kZWxldGUnKTtcbiAgICBmb3IgKGxldCBmb3JtIG9mIGZvcm1zKSB7XG4gICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICBjb25zdCBpZCA9IGZvcm0uZGF0YXNldC5pZDtcbiAgICAgICAgY29uc3QgZ3JvdXAgPSBmb3JtLmRhdGFzZXQuZ3JvdXBJZDtcblxuICAgICAgICBjb25zdCBpdGVtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmpvdHNfX2pvdC0nICsgaWQpO1xuICAgICAgICBpdGVtLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaXRlbSk7XG5cbiAgICAgICAgSm90LmxvYWQoaWQpLnRoZW4oam90ID0+IHtcbiAgICAgICAgICBKb3QucmVtb3ZlKGlkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIEdyb3VwLmxvYWQoZ3JvdXApLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2pvdC1saXN0Jywge1xuICAgICAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBQdWJTdWIucHVibGlzaCgnbm90aWZ5Jywge1xuICAgICAgICAgICAgICB0aXRsZTogJ0pvdCBkZWxldGVkJyxcbiAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3VuZG8nLFxuICAgICAgICAgICAgICAgIGZuOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGpvdC5yZXYgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBqb3Quc2F2ZSgpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBHcm91cC5sb2FkKGdyb3VwKS50aGVuKGdyb3VwID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnam90LWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgbXNnOiAnSm90IHVuZGVsZXRlZCdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbml0VXBkYXRlRm9ybXMoKSB7XG4gICAgY29uc3QgZm9ybXMgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuZm9ybS1qb3QtdXBkYXRlJyk7XG5cbiAgICBmb3IgKGxldCBmb3JtIG9mIGZvcm1zKSB7XG4gICAgICBjb25zdCBkb25lQnV0dG9uID0gZm9ybS5lbGVtZW50cy5kb25lO1xuICAgICAgY29uc3QgdW5kb25lQnV0dG9uID0gZm9ybS5lbGVtZW50cy51bmRvbmU7XG5cbiAgICAgIGlmIChkb25lQnV0dG9uKSB7XG4gICAgICAgIGRvbmVCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgZm9ybS5lbGVtZW50c1snZG9uZS1zdGF0dXMnXS52YWx1ZSA9ICdkb25lJztcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICh1bmRvbmVCdXR0b24pIHtcbiAgICAgICAgdW5kb25lQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICAgIGZvcm0uZWxlbWVudHNbJ2RvbmUtc3RhdHVzJ10udmFsdWUgPSAndW5kb25lJztcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpOyAgLy9zdG9wIGRvY3VtZW50IGxpc3RlbmVyIGZyb20gcmVtb3ZpbmcgJ2VkaXQnIGNsYXNzXG4gICAgICB9KTtcblxuICAgICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgY29uc3QgaWQgPSBmb3JtLmRhdGFzZXQuaWQ7XG5cbiAgICAgICAgY29uc3QgY29udGVudCA9IGZvcm0uZWxlbWVudHMuY29udGVudC52YWx1ZTtcbiAgICAgICAgY29uc3QgZ3JvdXAgPSBmb3JtLmVsZW1lbnRzLmdyb3VwLnZhbHVlO1xuICAgICAgICBjb25zdCBkb25lU3RhdHVzID0gZm9ybS5lbGVtZW50c1snZG9uZS1zdGF0dXMnXS52YWx1ZTtcbiAgICAgICAgY29uc3QgcHJpb3JpdHkgPSBmb3JtLmVsZW1lbnRzLnByaW9yaXR5LnZhbHVlO1xuXG4gICAgICAgIEpvdC5sb2FkKGlkKS50aGVuKGpvdCA9PiB7XG5cbiAgICAgICAgICBjb25zdCBjdXJyZW50RmllbGRzID0gam90LmZpZWxkcztcblxuICAgICAgICAgIGpvdC5maWVsZHMgPSB7XG4gICAgICAgICAgICBjb250ZW50LFxuICAgICAgICAgICAgZ3JvdXAsXG4gICAgICAgICAgICBwcmlvcml0eVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoZG9uZVN0YXR1cyA9PT0gJ2RvbmUnKSB7XG4gICAgICAgICAgICBqb3QuZmllbGRzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZG9uZVN0YXR1cyA9PT0gJ3VuZG9uZScpIHtcbiAgICAgICAgICAgIGpvdC5maWVsZHMuZG9uZSA9IGZhbHNlO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBqb3QuZmllbGRzLmRvbmUgPSBjdXJyZW50RmllbGRzLmRvbmU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgam90LnNhdmUoKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIEdyb3VwLmxvYWQoZ3JvdXApLnRoZW4oZ3JvdXAgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2pvdC1saXN0Jywge1xuICAgICAgICAgICAgICAgIGdyb3VwXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0dyb3VwO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNvbnN0IEdyb3VwID0gcmVxdWlyZSgnLi4vbW9kZWxzL2dyb3VwJyk7XG5cbmNvbnN0IEdyb3Vwc1ByZWZlcmVuY2VzID0gcmVxdWlyZSgnLi4vcHJlZmVyZW5jZXMvZ3JvdXBzJyk7XG5cbmNvbnN0IENvbG91clNlbGVjdG9yV2lkZ2V0ID0gcmVxdWlyZSgnLi9jb2xvdXItc2VsZWN0b3InKTtcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgVmlld0dyb3VwcyBleHRlbmRzIFZpZXcge1xuXG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lcikge1xuICAgIHN1cGVyKGNvbnRhaW5lcik7XG5cbiAgICB0aGlzLnJlZ2lzdGVyV2lkZ2V0KENvbG91clNlbGVjdG9yV2lkZ2V0KTtcblxuICAgIHRoaXMuX3ByZWZlcmVuY2VzID0gbmV3IEdyb3Vwc1ByZWZlcmVuY2VzKCk7XG4gIH1cblxuICByZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcykge1xuICAgIHN1cGVyLnJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCd1cGRhdGUnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIGlmIChhcmdzLmNoYW5nZXMgJiYgYXJncy5jaGFuZ2VzLmxlbmd0aCkge1xuICAgICAgICBHcm91cC5sb2FkQWxsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnZ3JvdXAtbGlzdCcsIHtcbiAgICAgICAgICAgIGdyb3Vwc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9KSk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goUHViU3ViLnN1YnNjcmliZSgnb3JkZXJDaGFuZ2VkJywgKHRvcGljLCBhcmdzKSA9PiB7XG4gICAgICB0aGlzLl9wcmVmZXJlbmNlcy5zZXRPcmRlcihhcmdzLnR5cGUsIGFyZ3MuZGlyZWN0aW9uKTtcblxuICAgICAgY29uc3QgcGFyYW1zID0gdGhpcy5sYXN0UGFyYW1zO1xuICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0JywgcGFyYW1zKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLl9hZGREb2N1bWVudExpc3RlbmVyKCd1bnNlbGVjdEFsbCcsICdjbGljaycsICgpID0+IHtcbiAgICAgIHRoaXMudW5zZWxlY3RBbGwoKTtcbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKSB7XG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdncm91cC1saXN0JzpcbiAgICAgICAgcGFyYW1zLmdyb3VwcyA9IHRoaXMuX3ByZWZlcmVuY2VzLm9yZGVyKHBhcmFtcy5ncm91cHMpO1xuICAgICAgICBicmVhaztcbiAgICB9XG5cbiAgICBjb25zdCBlbCA9IHN1cGVyLnJlbmRlclBhcnRpYWwobmFtZSwgcGFyYW1zKTtcblxuICAgIHN3aXRjaCAobmFtZSkge1xuICAgICAgY2FzZSAnZ3JvdXAtbGlzdCc6XG4gICAgICAgIHRoaXMuaW5pdEVkaXQoKTtcbiAgICAgICAgdGhpcy5pbml0RGVsZXRlRm9ybXMoKTtcbiAgICAgICAgdGhpcy5pbml0VXBkYXRlRm9ybXMoKTtcbiAgICAgICAgdGhpcy5pbml0V2lkZ2V0cyhlbCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGluaXRFdmVudHMoKSB7XG4gICAgc3VwZXIuaW5pdEV2ZW50cygpO1xuXG4gICAgdGhpcy5pbml0QWRkRm9ybSgpO1xuICAgIHRoaXMuaW5pdEVkaXQoKTtcbiAgICB0aGlzLmluaXREZWxldGVGb3JtcygpO1xuICAgIHRoaXMuaW5pdFVwZGF0ZUZvcm1zKCk7XG4gIH1cblxuICBpbml0QWRkRm9ybSgpIHtcbiAgICBjb25zdCBmb3JtID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLmZvcm0tZ3JvdXAtYWRkJyk7XG4gICAgZm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICBjb25zdCBuYW1lRmllbGQgPSBmb3JtLmVsZW1lbnRzLm5hbWU7XG4gICAgICBjb25zdCBuYW1lID0gbmFtZUZpZWxkLnZhbHVlO1xuXG4gICAgICBjb25zdCBjb2xvdXIgPSBmb3JtLmVsZW1lbnRzLmNvbG91ci52YWx1ZTtcblxuICAgICAgbmV3IEdyb3VwKHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgbmFtZSxcbiAgICAgICAgICBjb2xvdXIsXG4gICAgICAgIH0sXG4gICAgICB9KS5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgIG5hbWVGaWVsZC52YWx1ZSA9ICcnO1xuICAgICAgICAvL25hbWVGaWVsZC5mb2N1cygpO1xuICAgICAgICBuYW1lRmllbGQuYmx1cigpO1xuICAgICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCdncm91cC1saXN0Jywge1xuICAgICAgICAgICAgZ3JvdXBzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb25zdCB0b1Nob3cgPSBmb3JtLnF1ZXJ5U2VsZWN0b3IoJy5zaG93LW9uLWZvY3VzJyk7XG5cbiAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICB0aGlzLnVuc2VsZWN0QWxsKCk7XG4gICAgICB0b1Nob3cuY2xhc3NMaXN0LmFkZCgnc2hvdycpO1xuICAgIH0pO1xuICB9XG5cbiAgaW5pdEVkaXQoKSB7XG4gICAgY29uc3QgZWRpdExpbmtzID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmdyb3Vwc19fZ3JvdXBfX2VkaXQnKTtcbiAgICBmb3IgKGxldCBsaW5rIG9mIGVkaXRMaW5rcykge1xuICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7ICAvL3N0b3AgZG9jdW1lbnQgbGlzdGVuZXIgZnJvbSByZW1vdmluZyAnZWRpdCcgY2xhc3NcblxuICAgICAgICBjb25zdCBpZCA9IGxpbmsuZGF0YXNldC5pZDtcbiAgICAgICAgY29uc3QgaXRlbSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5ncm91cHNfX2dyb3VwLScgKyBpZCk7XG5cbiAgICAgICAgaWYgKCFpdGVtLmNsYXNzTGlzdC5jb250YWlucygnZWRpdCcpKSB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuXG4gICAgICAgICAgaXRlbS5jbGFzc0xpc3QuYWRkKCdlZGl0Jyk7XG5cbiAgICAgICAgICAvL2NvbnN0IG5hbWVGaWVsZCA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5mb3JtLWdyb3VwLXVwZGF0ZS0nICsgaWQpLmVsZW1lbnRzLm5hbWU7XG4gICAgICAgICAgLy9uYW1lRmllbGQuZm9jdXMoKTtcbiAgICAgICAgICAvL25hbWVGaWVsZC52YWx1ZSA9IG5hbWVGaWVsZC52YWx1ZTsgLy9mb3JjZXMgY3Vyc29yIHRvIGdvIHRvIGVuZCBvZiB0ZXh0XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51bnNlbGVjdEFsbCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICB1bnNlbGVjdEFsbCgpIHtcbiAgICAvL1RPRE86IGhhdmUgY2xhc3MgbWVtYmVyIHRvIGhvbGQgcmVmZXJlbmNlIHRvIGNvbW1vbiBlbGVtZW50L2VsZW1lbnQgZ3JvdXBzIHRvIGF2b2lkIHJlcXVlcnlpbmdcbiAgICBjb25zdCBpdGVtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5ncm91cHNfX2dyb3VwJyk7XG4gICAgZm9yIChsZXQgaXRlbSBvZiBpdGVtcykge1xuICAgICAgaXRlbS5jbGFzc0xpc3QucmVtb3ZlKCdlZGl0Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2hvd3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcuc2hvdy1vbi1mb2N1cycpO1xuICAgIGZvciAobGV0IHNob3cgb2Ygc2hvd3MpIHtcbiAgICAgIHNob3cuY2xhc3NMaXN0LnJlbW92ZSgnc2hvdycpO1xuICAgIH1cbiAgfVxuXG4gIGluaXREZWxldGVGb3JtcygpIHtcbiAgICBjb25zdCBmb3JtcyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3JBbGwoJy5mb3JtLWdyb3VwLWRlbGV0ZScpO1xuICAgIGZvciAobGV0IGZvcm0gb2YgZm9ybXMpIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IGlkID0gZm9ybS5kYXRhc2V0LmlkO1xuXG4gICAgICAgIGNvbnN0IGl0ZW0gPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcuZ3JvdXBzX19ncm91cC0nICsgaWQpO1xuICAgICAgICBpdGVtLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoaXRlbSk7XG5cbiAgICAgICAgR3JvdXAubG9hZChpZCkudGhlbihncm91cCA9PiB7XG4gICAgICAgICAgR3JvdXAucmVtb3ZlKGlkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnZ3JvdXAtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICBncm91cHNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdub3RpZnknLCB7XG4gICAgICAgICAgICAgIHRpdGxlOiAnTGlzdCBkZWxldGVkJyxcbiAgICAgICAgICAgICAgYWN0aW9uOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ3VuZG8nLFxuICAgICAgICAgICAgICAgIGZuOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnJldiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGdyb3VwLnNhdmUoKS50aGVuKCgpID0+IHtcblxuICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGRvY3MgPSBncm91cC5qb3RzLm1hcChqb3QgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgX3JldjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgX2lkOiBqb3QuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGVBZGRlZDogam90Ll9kYXRlQWRkZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkczogam90LmZpZWxkc1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgam90LnJldiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gam90O1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgY29uc3QgZGIgPSByZXF1aXJlKCcuLi9kYi9kYicpKCk7XG4gICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRiLmJ1bGtEb2NzKGRvY3MpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEdyb3VwLmxvYWRBbGwoKS50aGVuKGdyb3VwcyA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnZ3JvdXAtbGlzdCcsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBtc2c6ICdMaXN0IHVuZGVsZXRlZCdcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgaW5pdFVwZGF0ZUZvcm1zKCkge1xuICAgIGNvbnN0IGZvcm1zID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvckFsbCgnLmZvcm0tZ3JvdXAtdXBkYXRlJyk7XG5cbiAgICBmb3IgKGxldCBmb3JtIG9mIGZvcm1zKSB7XG4gICAgICBmb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTsgIC8vc3RvcCBkb2N1bWVudCBsaXN0ZW5lciBmcm9tIHJlbW92aW5nICdlZGl0JyBjbGFzc1xuICAgICAgfSk7XG5cbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIGNvbnN0IGlkID0gZm9ybS5kYXRhc2V0LmlkO1xuXG4gICAgICAgIGNvbnN0IG5hbWUgPSBmb3JtLmVsZW1lbnRzLm5hbWUudmFsdWU7XG4gICAgICAgIGNvbnN0IGNvbG91ciA9IGZvcm0uZWxlbWVudHMuY29sb3VyLnZhbHVlO1xuXG4gICAgICAgIEdyb3VwLmxvYWQoaWQpLnRoZW4oZ3JvdXAgPT4ge1xuXG4gICAgICAgICAgZ3JvdXAuZmllbGRzID0ge1xuICAgICAgICAgICAgbmFtZSxcbiAgICAgICAgICAgIGNvbG91clxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBncm91cC5zYXZlKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBHcm91cC5sb2FkQWxsKCkudGhlbihncm91cHMgPT4ge1xuICAgICAgICAgICAgICB0aGlzLnJlbmRlclBhcnRpYWwoJ2dyb3VwLWxpc3QnLCB7XG4gICAgICAgICAgICAgICAgZ3JvdXBzXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3R3JvdXBzO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBWaWV3ID0gcmVxdWlyZSgnLi92aWV3Jyk7XG5cbmNsYXNzIFZpZXdIb21lIGV4dGVuZHMgVmlldyB7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3SG9tZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jb25zdCBKb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvam90Jyk7XG5jb25zdCBHcm91cCA9IHJlcXVpcmUoJy4uL21vZGVscy9ncm91cCcpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jb25zdCByb3V0ZXIgPSByZXF1aXJlKCcuLi9yb3V0ZXJzL3BhdGgnKTtcblxuY2xhc3MgVmlld0ltcG9ydCBleHRlbmRzIFZpZXcge1xuXG4gIGluaXRFdmVudHMoKSB7XG4gICAgc3VwZXIuaW5pdEV2ZW50cygpO1xuXG4gICAgdGhpcy5pbml0SW1wb3J0Rm9ybSgpO1xuICB9XG5cbiAgaW5pdEltcG9ydEZvcm0oKSB7XG4gICAgY29uc3QgZm9ybSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5mb3JtLWltcG9ydCcpO1xuXG4gICAgaWYgKGZvcm0pIHtcbiAgICAgIGZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZXZlbnQgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIEdyb3VwLmltcG9ydEZyb21Mb2NhbCgpLnRoZW4oZ3JvdXBzID0+IHtcbiAgICAgICAgICBjb25zdCBncm91cFByb21pc2VzID0gW107XG5cbiAgICAgICAgICBncm91cHMuZm9yRWFjaChncm91cCA9PiB7XG4gICAgICAgICAgICBncm91cFByb21pc2VzLnB1c2goKG5ld0dyb3VwcykgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gR3JvdXAuaW5zZXJ0KHtcbiAgICAgICAgICAgICAgICBmaWVsZHM6IGdyb3VwLmZpZWxkcyxcbiAgICAgICAgICAgICAgICBkYXRlQWRkZWQ6IGdyb3VwLl9kYXRlQWRkZWRcbiAgICAgICAgICAgICAgfSkudGhlbihuZXdHcm91cCA9PiB7XG4gICAgICAgICAgICAgICAgbmV3R3JvdXBzLnB1c2gobmV3R3JvdXApO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXdHcm91cHM7XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBsZXQgZ3JvdXBQcm9taXNlQ2hhaW4gPSBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgICAgICAgIGdyb3VwUHJvbWlzZXMuZm9yRWFjaChncm91cFByb21pc2UgPT4ge1xuICAgICAgICAgICAgZ3JvdXBQcm9taXNlQ2hhaW4gPSBncm91cFByb21pc2VDaGFpbi50aGVuKGdyb3VwUHJvbWlzZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gZ3JvdXBQcm9taXNlQ2hhaW4udGhlbihuZXdHcm91cHMgPT4ge1xuICAgICAgICAgICAgY29uc3Qgam90UHJvbWlzZXMgPSBbXTtcblxuICAgICAgICAgICAgZ3JvdXBzLmZvckVhY2goKGdyb3VwLCBpbmRleCkgPT4ge1xuICAgICAgICAgICAgICBncm91cC5qb3RzLmZvckVhY2goam90ID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBuZXdGaWVsZHMgPSBqb3QuZmllbGRzO1xuICAgICAgICAgICAgICAgIG5ld0ZpZWxkcy5ncm91cCA9IG5ld0dyb3Vwc1tpbmRleF0uaWQ7XG4gICAgICAgICAgICAgICAgam90UHJvbWlzZXMucHVzaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gSm90Lmluc2VydCh7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkczogbmV3RmllbGRzLFxuICAgICAgICAgICAgICAgICAgICBkYXRlQWRkZWQ6IGpvdC5fZGF0ZUFkZGVkXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgbGV0IGpvdFByb21pc2VDaGFpbiA9IFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgam90UHJvbWlzZXMuZm9yRWFjaChqb3RQcm9taXNlID0+IHtcbiAgICAgICAgICAgICAgam90UHJvbWlzZUNoYWluID0gam90UHJvbWlzZUNoYWluLnRoZW4oam90UHJvbWlzZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIGpvdFByb21pc2VDaGFpbjtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIHJldHVybiBHcm91cC5yZW1vdmVGcm9tTG9jYWwoKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIFB1YlN1Yi5wdWJsaXNoKCdub3RpZnknLCB7XG4gICAgICAgICAgICB0aXRsZTogJ0pvdHMgaW1wb3J0ZWQnXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgcm91dGVyLmdvKCcvZ3JvdXAnKTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3SW1wb3J0O1xuIiwiY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jb25zdCBKb3QgPSByZXF1aXJlKCcuLi9tb2RlbHMvam90Jyk7XG5cbmNvbnN0IEpvdHNQcmVmZXJlbmNlcyA9IHJlcXVpcmUoJy4uL3ByZWZlcmVuY2VzL2pvdHMnKTtcblxuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgVmlld0pvdHMgZXh0ZW5kcyBWaWV3IHtcbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMuX3ByZWZlcmVuY2VzID0gbmV3IEpvdHNQcmVmZXJlbmNlcygpO1xuICB9XG5cbiAgcmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpIHtcbiAgICBwYXJhbXMuam90cyA9IHRoaXMuX3ByZWZlcmVuY2VzLm9yZGVyKHBhcmFtcy5qb3RzKTtcblxuICAgIHN1cGVyLnJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKTtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMucHVzaChQdWJTdWIuc3Vic2NyaWJlKCd1cGRhdGUnLCAodG9waWMsIGFyZ3MpID0+IHtcbiAgICAgIGlmIChhcmdzLmNoYW5nZXMgJiYgYXJncy5jaGFuZ2VzLmxlbmd0aCkge1xuICAgICAgICBKb3QubG9hZEFsbCgpLnRoZW4oam90cyA9PiB7XG4gICAgICAgICAgdGhpcy5yZW5kZXIoZmFsc2UsIHtcbiAgICAgICAgICAgIGpvdHNcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSkpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ29yZGVyQ2hhbmdlZCcsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgdGhpcy5fcHJlZmVyZW5jZXMuc2V0T3JkZXIoYXJncy50eXBlLCBhcmdzLmRpcmVjdGlvbik7XG5cbiAgICAgIGNvbnN0IHBhcmFtcyA9IHRoaXMubGFzdFBhcmFtcztcbiAgICAgIHRoaXMucmVuZGVyKGZhbHNlLCBwYXJhbXMpO1xuICAgIH0pKTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld0pvdHM7XG4iLCJjb25zdCBXaWRnZXQgPSByZXF1aXJlKCcuL3dpZGdldCcpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBMaXN0T3JkZXIgZXh0ZW5kcyBXaWRnZXQge1xuICBpbml0RXZlbnRzKGVsKSB7XG4gICAgc3VwZXIuaW5pdEV2ZW50cygpO1xuXG4gICAgbGV0IHdpZGdldHM7XG4gICAgaWYgKGVsLmNsYXNzTGlzdC5jb250YWlucygncGFydGlhbC1saXN0LW9yZGVyJykpIHtcbiAgICAgIHdpZGdldHMgPSBbZWxdO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aWRnZXRzID0gZWwucXVlcnlTZWxlY3RvckFsbCgnLnBhcnRpYWwtbGlzdC1vcmRlcicpO1xuICAgIH1cblxuICAgIGZvciAobGV0IHdpZGdldCBvZiB3aWRnZXRzKSB7XG4gICAgICBjb25zdCBsaW5rcyA9IHdpZGdldC5xdWVyeVNlbGVjdG9yQWxsKCdhJyk7XG5cbiAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBsaW5rcy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgY29uc3QgbGluayA9IGxpbmtzW2luZGV4XTtcbiAgICAgICAgY29uc3QgbmV4dExpbmsgPSBsaW5rc1soaW5kZXggKyAxKSAlIGxpbmtzLmxlbmd0aF07XG5cbiAgICAgICAgbGluay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGV2ZW50ID0+IHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgUHViU3ViLnB1Ymxpc2goJ29yZGVyQ2hhbmdlZCcsIHtcbiAgICAgICAgICAgIHR5cGU6IG5leHRMaW5rLmRhdGFzZXQudHlwZSxcbiAgICAgICAgICAgIGRpcmVjdGlvbjogbmV4dExpbmsuZGF0YXNldC5kaXJlY3Rpb25cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGxpbmsuY2xhc3NMaXN0LnJlbW92ZSgnY3VycmVudCcpO1xuICAgICAgICAgIG5leHRMaW5rLmNsYXNzTGlzdC5hZGQoJ2N1cnJlbnQnKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMaXN0T3JkZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbmNvbnN0IFZpZXcgPSByZXF1aXJlKCcuL3ZpZXcnKTtcblxuY2xhc3MgVmlld0xvYWRpbmcgZXh0ZW5kcyBWaWV3IHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdMb2FkaW5nO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBMb2FkaW5nVmlldyA9IHJlcXVpcmUoJy4vbG9hZGluZy5qcycpO1xuXG5jbGFzcyBWaWV3TG9hZGluZ0dyb3VwcyBleHRlbmRzIExvYWRpbmdWaWV3IHtcblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdMb2FkaW5nR3JvdXBzO1xuIiwiY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jb25zdCBQdWJTdWIgPSByZXF1aXJlKCcuLi91dGlsaXR5L3B1YnN1YicpO1xuXG5jbGFzcyBOb3RpZmljYXRpb25NYW5hZ2VyVmlldyBleHRlbmRzIFZpZXcge1xuICBjb25zdHJ1Y3Rvcihjb250YWluZXIpIHtcbiAgICBzdXBlcihjb250YWluZXIpO1xuXG4gICAgdGhpcy5fdGltZXIgPSBudWxsO1xuICB9XG5cbiAgcmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpIHtcbiAgICBzdXBlci5yZW5kZXIocHJlUmVuZGVyZWQsIHBhcmFtcyk7XG5cbiAgICB0aGlzLl9zdWJzY3JpcHRpb25zLnB1c2goUHViU3ViLnN1YnNjcmliZSgnbm90aWZ5JywgKHRvcGljLCBhcmdzKSA9PiB7XG4gICAgICB0aGlzLnNob3dOb3RpZmljYXRpb24oYXJncyk7XG4gICAgfSkpO1xuICB9XG5cbiAgc2hvd05vdGlmaWNhdGlvbih7XG4gICAgdGl0bGUgPSBmYWxzZSxcbiAgICBib2R5ID0gZmFsc2UsXG4gICAgYWN0aW9uID0gZmFsc2UsXG4gICAgZHVyYXRpb24gPSA1MDAwXG4gIH0pIHtcblxuICAgIHZhciBmbiA9ICgpID0+IHtcbiAgICAgIHRoaXMucmVuZGVyUGFydGlhbCgnbm90aWZpY2F0aW9uJywge1xuICAgICAgICB0aXRsZSxcbiAgICAgICAgYWN0aW9uTmFtZTogYWN0aW9uID8gYWN0aW9uLm5hbWUgOiBmYWxzZVxuICAgICAgfSk7XG5cbiAgICAgIGlmIChhY3Rpb24gJiYgYWN0aW9uLmZuKSB7XG4gICAgICAgIGNvbnN0IGFjdGlvblByaW1hcnkgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXJfX2FjdGlvbi0tcHJpbWFyeScpO1xuICAgICAgICBpZiAoYWN0aW9uUHJpbWFyeSkge1xuICAgICAgICAgIGFjdGlvblByaW1hcnkuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl90aW1lcikge1xuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5fdGltZXIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBhY3Rpb24uZm4oKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgaWYgKGFjdGlvbi5tc2cpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dOb3RpZmljYXRpb24oe1xuICAgICAgICAgICAgICAgICAgdGl0bGU6IGFjdGlvbi5tc2dcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXItY29udGFpbmVyJykuY2xhc3NMaXN0LnJlbW92ZSgnaGFzLW5vdGlmaWNhdGlvbicpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yKCcubWQtc25hY2tiYXItY29udGFpbmVyJykuY2xhc3NMaXN0LmFkZCgnaGFzLW5vdGlmaWNhdGlvbicpO1xuXG4gICAgICBpZiAodGhpcy5fdGltZXIpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuX3RpbWVyKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5fdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLXNuYWNrYmFyLWNvbnRhaW5lcicpLmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1ub3RpZmljYXRpb24nKTtcbiAgICAgIH0sIGR1cmF0aW9uKTtcbiAgICB9O1xuXG4gICAgaWYgKHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1zbmFja2Jhci1jb250YWluZXInKS5jbGFzc0xpc3QuY29udGFpbnMoJ2hhcy1ub3RpZmljYXRpb24nKSkge1xuICAgICAgdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLXNuYWNrYmFyLWNvbnRhaW5lcicpLmNsYXNzTGlzdC5yZW1vdmUoJ2hhcy1ub3RpZmljYXRpb24nKTtcbiAgICAgIHNldFRpbWVvdXQoZm4sIDMwMCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGZuKCk7XG4gICAgfVxuXG4gIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE5vdGlmaWNhdGlvbk1hbmFnZXJWaWV3O1xuIiwiY29uc3QgVmlldyA9IHJlcXVpcmUoJy4vdmlldycpO1xuXG5jb25zdCBMaXN0T3JkZXIgPSByZXF1aXJlKCcuL2xpc3Qtb3JkZXInKTtcbmNvbnN0IFB1YlN1YiA9IHJlcXVpcmUoJy4uL3V0aWxpdHkvcHVic3ViJyk7XG5cbmNvbnN0IFRvdWNoID0gcmVxdWlyZSgnLi4vdXRpbGl0eS90b3VjaCcpO1xuXG5jbGFzcyBWaWV3VGl0bGVCYXIgZXh0ZW5kcyBWaWV3IHtcbiAgY29uc3RydWN0b3IoY29udGFpbmVyKSB7XG4gICAgc3VwZXIoY29udGFpbmVyKTtcblxuICAgIHRoaXMucmVnaXN0ZXJXaWRnZXQoTGlzdE9yZGVyKTtcblxuICAgIHRoaXMuX3RvdWNoSGFuZGxlciA9IG5ldyBUb3VjaCgpO1xuICAgIHRoaXMuX3RvdWNoSGFuZGxlci5yZWdpc3RlcignbGVmdCcsICh0aGlzLl9jbG9zZU5hdikuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fdG91Y2hIYW5kbGVyLnJlZ2lzdGVyKCdyaWdodCcsICh0aGlzLl9vcGVuTmF2KS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgc3VwZXIucmVuZGVyKHByZVJlbmRlcmVkLCBwYXJhbXMpO1xuXG4gICAgdGhpcy5fc3Vic2NyaXB0aW9ucy5wdXNoKFB1YlN1Yi5zdWJzY3JpYmUoJ3JvdXRlQ2hhbmdlZCcsICh0b3BpYywgYXJncykgPT4ge1xuICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCd0aXRsZWJhci10aXRsZScsIGFyZ3MpO1xuICAgICAgdGhpcy5yZW5kZXJQYXJ0aWFsKCd0aXRsZWJhci10YWJzJywgYXJncyk7XG5cbiAgICAgIHRoaXMudXBkYXRlU29ydGluZyhhcmdzKTtcbiAgICB9KSk7XG5cbiAgICB0aGlzLl90b3VjaEhhbmRsZXIuc2V0RWxlbWVudCh0aGlzLl9lbCk7XG4gIH1cblxuICByZW5kZXJQYXJ0aWFsKG5hbWUsIHBhcmFtcykge1xuICAgIGNvbnN0IGVsID0gc3VwZXIucmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpO1xuXG4gICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICBjYXNlICdsaXN0LW9yZGVyJzpcbiAgICAgICAgdGhpcy5pbml0V2lkZ2V0cyhlbCk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGluaXRFdmVudHMoKSB7XG4gICAgc3VwZXIuaW5pdEV2ZW50cygpO1xuXG4gICAgdGhpcy5fbmF2ID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignbmF2Jyk7XG4gICAgdGhpcy5fbmF2T3ZlcmxheSA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5tZC1uYXYtb3ZlcmxheScpO1xuICAgIHRoaXMuX2J0bk1lbnVPcGVuID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLWJ0bi1tZW51Jyk7XG4gICAgdGhpcy5fYnRuTWVudUNsb3NlID0gdGhpcy5fZWwucXVlcnlTZWxlY3RvcignLm1kLWJ0bi1tZW51LmNsb3NlJyk7XG4gICAgdGhpcy5fbGlua3MgPSB0aGlzLl9lbC5xdWVyeVNlbGVjdG9yQWxsKCcubWQtbmF2LWJvZHkgYScpO1xuXG4gICAgdGhpcy5fYnRuTWVudU9wZW4uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBldmVudCA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5fb3Blbk5hdigpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5fYnRuTWVudUNsb3NlLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZXZlbnQgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuX2Nsb3NlTmF2KCk7XG4gICAgfSk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuX2xpbmtzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzLl9saW5rc1tpXS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHRoaXMuX2Nsb3NlTmF2KCkpO1xuICAgIH1cbiAgfVxuXG4gIGNsZWFudXAoKSB7XG4gICAgc3VwZXIuY2xlYW51cCgpO1xuXG4gICAgdGhpcy5fdG91Y2hIYW5kbGVyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIF9vcGVuTmF2KCkge1xuICAgIHRoaXMuX25hdi5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gICAgdGhpcy5fbmF2T3ZlcmxheS5jbGFzc0xpc3QuYWRkKCdzaG93Jyk7XG4gIH1cblxuICBfY2xvc2VOYXYoKSB7XG4gICAgdGhpcy5fbmF2LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgICB0aGlzLl9uYXZPdmVybGF5LmNsYXNzTGlzdC5yZW1vdmUoJ3Nob3cnKTtcbiAgfVxuXG4gIHVwZGF0ZVNvcnRpbmcoYXJncykge1xuICAgIHRoaXMucmVuZGVyUGFydGlhbCgnbGlzdC1vcmRlcicsIGFyZ3MpO1xuICB9XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3VGl0bGVCYXI7XG4iLCJjbGFzcyBWaWV3Q29udGFpbmVyIHtcbiAgY29uc3RydWN0b3IoZWxJRCwgdGVtcGxhdGVzLCBwYXJ0aWFscykge1xuICAgIHRoaXMuX2VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxJRCk7XG5cbiAgICB0aGlzLl90ZW1wbGF0ZXMgPSB0ZW1wbGF0ZXM7XG4gICAgdGhpcy5fcGFydGlhbHMgPSBwYXJ0aWFscztcblxuICAgIHRoaXMuX2N1cnJlbnRWaWV3ID0gbnVsbDtcbiAgfVxuXG4gIHVwZGF0ZSh2aWV3LCBodG1sKSB7XG4gICAgaWYgKHRoaXMuX2N1cnJlbnRWaWV3KSB7XG4gICAgICB0aGlzLl9jdXJyZW50Vmlldy5jbGVhbnVwKCk7XG4gICAgfVxuXG4gICAgdGhpcy5fY3VycmVudFZpZXcgPSB2aWV3O1xuICAgIHRoaXMuX2VsLmlubmVySFRNTCA9IGh0bWw7XG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3Q29udGFpbmVyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5jb25zdCBIYW5kbGViYXJzID0gcmVxdWlyZSgnaGFuZGxlYmFycy9kaXN0L2hhbmRsZWJhcnMucnVudGltZScpO1xuY29uc3QgUHViU3ViID0gcmVxdWlyZSgnLi4vdXRpbGl0eS9wdWJzdWInKTtcblxuY2xhc3MgVmlldyB7XG4gIGNvbnN0cnVjdG9yKGNvbnRhaW5lcikge1xuICAgIHRoaXMuX2NvbnRhaW5lciA9IGNvbnRhaW5lcjtcblxuICAgIHRoaXMuX3N1YnNjcmlwdGlvbnMgPSBbXTtcbiAgICB0aGlzLl9kb2N1bWVudExpc3RlbmVycyA9IHt9O1xuICAgIHRoaXMuX3dpZGdldHMgPSBbXTtcblxuICAgIHRoaXMuX2xhc3RQYXJhbXMgPSBudWxsO1xuICB9XG5cbiAgLy90aWR5IHRoaXMgdXA/XG4gIGdldCBfZWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2NvbnRhaW5lci5fZWw7XG4gIH1cblxuICBnZXQgbGFzdFBhcmFtcygpIHtcbiAgICByZXR1cm4gdGhpcy5fbGFzdFBhcmFtcztcbiAgfVxuXG4gIHJlbmRlcihwcmVSZW5kZXJlZCwgcGFyYW1zKSB7XG4gICAgdGhpcy5jbGVhbnVwKCk7XG5cbiAgICBpZiAoIXByZVJlbmRlcmVkKSB7XG4gICAgICB2YXIgdGVtcGxhdGUgPSBIYW5kbGViYXJzLnRlbXBsYXRlKHRoaXMuX2NvbnRhaW5lci5fdGVtcGxhdGVzW3RoaXMuX2dldFRlbXBsYXRlKCldKTtcbiAgICAgIHRoaXMuX2NvbnRhaW5lci51cGRhdGUodGhpcywgdGVtcGxhdGUocGFyYW1zKSk7XG4gICAgfVxuXG4gICAgdGhpcy5pbml0RXZlbnRzKCk7XG5cbiAgICB0aGlzLl9sYXN0UGFyYW1zID0gcGFyYW1zO1xuICB9XG5cbiAgcmVuZGVyUGFydGlhbChuYW1lLCBwYXJhbXMpIHtcbiAgICBjb25zb2xlLmxvZygncmVuZGVyIHBhcnRpYWwnLCBuYW1lKTtcblxuICAgIHZhciB0ZW1wbGF0ZSA9IEhhbmRsZWJhcnMudGVtcGxhdGUodGhpcy5fY29udGFpbmVyLl9wYXJ0aWFsc1tuYW1lXSk7XG4gICAgY29uc3QgdmlldyA9IHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5wYXJ0aWFsLScgKyBuYW1lKTtcbiAgICB2aWV3Lm91dGVySFRNTCA9IHRlbXBsYXRlKHBhcmFtcyk7XG5cbiAgICB0aGlzLl9sYXN0UGFyYW1zID0gcGFyYW1zO1xuXG4gICAgcmV0dXJuIHRoaXMuX2VsLnF1ZXJ5U2VsZWN0b3IoJy5wYXJ0aWFsLScgKyBuYW1lKTtcbiAgfVxuXG4gIF9nZXRUZW1wbGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLnRvTG93ZXJDYXNlKCkuc3Vic3RyaW5nKDQpO1xuICB9XG5cbiAgX2FkZERvY3VtZW50TGlzdGVuZXIobmFtZSwgdHlwZSwgZm4pIHtcbiAgICBpZiAoIXRoaXMuX2RvY3VtZW50TGlzdGVuZXJzW25hbWVdKSB7XG4gICAgICB0aGlzLl9kb2N1bWVudExpc3RlbmVyc1tuYW1lXSA9IHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgZm46IGZuLmJpbmQodGhpcylcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCB0aGlzLl9kb2N1bWVudExpc3RlbmVyc1tuYW1lXS5mbik7XG4gIH1cblxuICBjbGVhbnVwKCkge1xuICAgIC8vY29uc29sZS5sb2coJ3ZpZXcgY2xlYXVwJywgdGhpcyk7XG5cbiAgICBmb3IgKGxldCBzdWIgb2YgdGhpcy5fc3Vic2NyaXB0aW9ucykge1xuICAgICAgUHViU3ViLnVuc3Vic2NyaWJlKHN1Yik7XG4gICAgfVxuXG4gICAgZm9yIChsZXQgbG5hbWUgaW4gdGhpcy5fZG9jdW1lbnRMaXN0ZW5lcnMpIHtcbiAgICAgIGNvbnN0IGxpc3RlbmVyID0gdGhpcy5fZG9jdW1lbnRMaXN0ZW5lcnNbbG5hbWVdO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihsaXN0ZW5lci50eXBlLCBsaXN0ZW5lci5mbik7XG4gICAgfVxuXG4gICAgdGhpcy5jbGVhbnVwV2lkZ2V0cygpO1xuICB9XG5cbiAgaW5pdEV2ZW50cygpIHtcbiAgICB0aGlzLmluaXRXaWRnZXRzKHRoaXMuX2VsKTtcbiAgfVxuXG4gIHJlZ2lzdGVyV2lkZ2V0KFdpZGdldCkge1xuICAgIHRoaXMuX3dpZGdldHMucHVzaChuZXcgV2lkZ2V0KCkpO1xuICB9XG5cbiAgaW5pdFdpZGdldHMoZWwpIHtcbiAgICB0aGlzLl93aWRnZXRzLmZvckVhY2god2lkZ2V0ID0+IHtcbiAgICAgIHdpZGdldC5pbml0RXZlbnRzKGVsKTtcbiAgICB9KTtcbiAgfVxuXG4gIGNsZWFudXBXaWRnZXRzKCkge1xuICAgIHRoaXMuX3dpZGdldHMuZm9yRWFjaCh3aWRnZXQgPT4ge1xuICAgICAgd2lkZ2V0LmNsZWFudXAoKTtcbiAgICB9KTtcbiAgfVxuXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlldztcbiIsImNsYXNzIFdpZGdldCB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gIH1cblxuICBpbml0RXZlbnRzKCkge1xuXG4gIH1cblxuICBjbGVhbnVwKCkge1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gV2lkZ2V0O1xuIiwiIiwiLy8gc2hpbSBmb3IgdXNpbmcgcHJvY2VzcyBpbiBicm93c2VyXG5cbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHNldFRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHNldFRpbWVvdXQoZHJhaW5RdWV1ZSwgMCk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iXX0=
