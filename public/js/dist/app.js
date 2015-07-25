"use strict";

var _get = function get(_x9, _x10, _x11) { var _again = true; _function: while (_again) { var object = _x9, property = _x10, receiver = _x11; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x9 = parent; _x10 = property; _x11 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof require == "function" && require;if (!u && a) return a(o, !0);if (i) return i(o, !0);var f = new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND", f);
      }var l = n[o] = { exports: {} };t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];return s(n ? n : e);
      }, l, l.exports, e, t, n, r);
    }return n[o].exports;
  }var i = typeof require == "function" && require;for (var o = 0; o < r.length; o++) s(r[o]);return s;
})({ 1: [function (require, module, exports) {
    'use strict';

    var PubSub = require('../utility/pubsub');

    var DB = (function () {
      function DB() {
        _classCallCheck(this, DB);

        this._remoteCouch = null;
        this._db = null;
      }

      _createClass(DB, [{
        key: "init",
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

          if (typeof PouchDB !== 'undefined') {
            (function () {
              //browser
              PouchDB.debug.disable();
              _this._db = new PouchDB(options.dbName, {
                auto_compaction: true
              });

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
            var _PouchDB = require('pouchdb');
            //PouchDB.plugin(require('pouchdb-find'));
            _PouchDB.debug.disable();

            this._db = new _PouchDB(this._remoteCouch);
          }
        }
      }, {
        key: "db",
        get: function get() {
          return this._db;
        }
      }]);

      return DB;
    })();

    var db = new DB();

    module.exports = function (options) {
      if (options) {

        db.init(options);
        return db.db;
      } else {
        return db.db;
      }
    };
  }, { "../utility/pubsub": 19, "pouchdb": 3 }], 2: [function (require, module, exports) {
    var Jot = (function () {
      function Jot(members) {
        _classCallCheck(this, Jot);

        this._db = require('../db/db')();

        this._id = members._id || null;
        this._rev = members._rev || null;

        this._fields = members.fields || {};

        this._allowedFields = ['content', 'done'];
      }

      _createClass(Jot, [{
        key: "isNew",
        value: function isNew() {
          return !this.id;
        }
      }, {
        key: "isDone",
        value: function isDone() {
          return this.fields.done;
        }
      }, {
        key: "getSlug",
        value: function getSlug() {
          var _this2 = this;

          if (!this.isNew()) {
            return Promise.resolve(this.id);
          } else {
            var _ret2 = (function () {
              var slug = 'jot-';

              var padding = 5; //the length of the number, e.g. '5' will start at 00000, 00001, etc.

              return {
                v: _this2._db.allDocs({
                  startkey: slug + "￿",
                  endKey: slug,
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

            if (typeof _ret2 === "object") return _ret2.v;
          }
        }
      }, {
        key: "save",
        value: function save() {
          var _this3 = this;

          return this.getSlug().then(function (slug) {
            var params = {
              _id: slug,
              fields: _this3.fields
            };

            if (!_this3.isNew()) {
              params._rev = _this3.rev;
            }

            return _this3._db.put(params).then(function (response) {
              if (response.ok) {
                _this3.id = response.id;
                _this3.rev = response.rev;

                return true;
              } else {
                return false;
              }
            });
          });
        }
      }, {
        key: "id",
        get: function get() {
          return this._id;
        },
        set: function set(id) {
          this._id = id;

          return this;
        }
      }, {
        key: "rev",
        get: function get() {
          return this._rev;
        },
        set: function set(rev) {
          this._rev = rev;

          return this;
        }
      }, {
        key: "fields",
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
        key: "loadAll",
        value: function loadAll() {
          var _this4 = this;

          var db = require('../db/db')();

          return db.allDocs({
            include_docs: true,
            descending: true
          }).then(function (result) {
            var undoneJots = [];
            var doneJots = [];

            result.rows.forEach(function (row) {
              var jot = new _this4(row.doc);
              if (jot.isDone()) {
                doneJots.push(jot);
              } else {
                undoneJots.push(jot);
              }
            });

            return undoneJots.concat(doneJots);
          });
        }
      }, {
        key: "load",
        value: function load(id) {
          var _this5 = this;

          var db = require('../db/db')();

          return db.get(id).then(function (doc) {
            console.log(doc);
            return new _this5(doc);
          });
        }
      }, {
        key: "remove",
        value: function remove(id) {
          var db = require('../db/db')();

          return db.get(id).then(function (doc) {
            return db.remove(doc);
          });
        }
      }]);

      return Jot;
    })();

    module.exports = Jot;
  }, { "../db/db": 1 }], 3: [function (require, module, exports) {}, {}], 4: [function (require, module, exports) {
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
      while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
          currentQueue[queueIndex].run();
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

    // TODO(shtylman)
    process.cwd = function () {
      return '/';
    };
    process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
    };
    process.umask = function () {
      return 0;
    };
  }, {}], 5: [function (require, module, exports) {
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
      if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();else if (typeof define === 'function' && define.amd) define(factory);else if (typeof exports === 'object') exports["Handlebars"] = factory();else root["Handlebars"] = factory();
    })(this, function () {
      return (function (modules) {
        // webpackBootstrap
        /******/ // The module cache
        /******/var installedModules = {};

        /******/ // The require function
        /******/function __webpack_require__(moduleId) {

          /******/ // Check if module is in cache
          /******/if (installedModules[moduleId])
            /******/return installedModules[moduleId].exports;

          /******/ // Create a new module (and put it into the cache)
          /******/var module = installedModules[moduleId] = {
            /******/exports: {},
            /******/id: moduleId,
            /******/loaded: false
            /******/ };

          /******/ // Execute the module function
          /******/modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

          /******/ // Flag the module as loaded
          /******/module.loaded = true;

          /******/ // Return the exports of the module
          /******/return module.exports;
          /******/
        }

        /******/ // expose the modules object (__webpack_modules__)
        /******/__webpack_require__.m = modules;

        /******/ // expose the module cache
        /******/__webpack_require__.c = installedModules;

        /******/ // __webpack_public_path__
        /******/__webpack_require__.p = "";

        /******/ // Load entry module and return exports
        /******/return __webpack_require__(0);
        /******/
      })([function (module, exports, __webpack_require__) {

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

        /***/
      }, function (module, exports, __webpack_require__) {

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

        /***/
      }, function (module, exports, __webpack_require__) {

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

        /***/
      }, function (module, exports, __webpack_require__) {

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

        /***/
      }, function (module, exports, __webpack_require__) {

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

        /***/
      }, function (module, exports, __webpack_require__) {

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

        /***/
      }, function (module, exports, __webpack_require__) {
        (function (global) {
          'use strict';

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
          /* WEBPACK VAR INJECTION */
        }).call(exports, (function () {
          return this;
        })());

        /***/
      }, function (module, exports, __webpack_require__) {

        "use strict";

        exports["default"] = function (obj) {
          return obj && obj.__esModule ? obj : {
            "default": obj
          };
        };

        exports.__esModule = true;

        /***/
      }
      /******/]);
    });
    ;
  }, {}], 6: [function (require, module, exports) {
    (function (process) {
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
      var clickEvent = 'undefined' !== typeof document && document.ontouchstart ? 'touchstart' : 'click';

      /**
       * To work properly with the URL
       * history.location generated polyfill in https://github.com/devote/HTML5-History-API
       */

      var location = 'undefined' !== typeof window && (window.history.location || window.location);

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

      function page(_x12, _x13) {
        var _arguments2 = arguments;
        var _again2 = true;

        _function2: while (_again2) {
          var path = _x12,
              fn = _x13;
          route = i = undefined;
          _again2 = false;

          // <callback>
          if ('function' === typeof path) {
            _x12 = '*';
            _x13 = path;
            _again2 = true;
            continue _function2;
          }

          // route <path> to <callback ...>
          if ('function' === typeof fn) {
            var route = new Route(path);
            for (var i = 1; i < _arguments2.length; ++i) {
              page.callbacks.push(route.middleware(_arguments2[i]));
            }
            // show <path> with [state]
          } else if ('string' === typeof path) {
              page['string' === typeof fn ? 'redirect' : 'show'](path, fn);
              // start [options]
            } else {
                page.start(path);
              }
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

      page.base = function (path) {
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

      page.start = function (options) {
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
        var url = hashbang && ~location.hash.indexOf('#!') ? location.hash.substr(2) + location.search : location.pathname + location.search + location.hash;
        page.replace(url, null, true, dispatch);
      };

      /**
       * Unbind click and popstate event handlers.
       *
       * @api public
       */

      page.stop = function () {
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

      page.show = function (path, state, dispatch, push) {
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

      page.back = function (path, state) {
        if (page.len > 0) {
          // this may need more testing to see if all browsers
          // wait for the next tick to go back in history
          history.back();
          page.len--;
        } else if (path) {
          setTimeout(function () {
            page.show(path, state);
          });
        } else {
          setTimeout(function () {
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
      page.redirect = function (from, to) {
        // Define route from a path to another
        if ('string' === typeof from && 'string' === typeof to) {
          page(from, function (e) {
            setTimeout(function () {
              page.replace(to);
            }, 0);
          });
        }

        // Wait for the push state and replace it with another
        if ('string' === typeof from && 'undefined' === typeof to) {
          setTimeout(function () {
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

      page.replace = function (path, state, init, dispatch) {
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

      page.dispatch = function (ctx) {
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
      page.exit = function (path, fn) {
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
        if (typeof val !== 'string') {
          return val;
        }
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
          if (! ~this.path.indexOf('#')) return;
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

      Context.prototype.pushState = function () {
        page.len++;
        history.pushState(this.state, this.title, hashbang && this.path !== '/' ? '#!' + this.path : this.canonicalPath);
      };

      /**
       * Save the context state.
       *
       * @api public
       */

      Context.prototype.save = function () {
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
        this.path = path === '*' ? '(.*)' : path;
        this.method = 'GET';
        this.regexp = pathtoRegexp(this.path, this.keys = [], options.sensitive, options.strict);
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

      Route.prototype.middleware = function (fn) {
        var self = this;
        return function (ctx, next) {
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

      Route.prototype.match = function (path, params) {
        var keys = this.keys,
            qsIndex = path.indexOf('?'),
            pathname = ~qsIndex ? path.slice(0, qsIndex) : path,
            m = this.regexp.exec(decodeURIComponent(pathname));

        if (!m) return false;

        for (var i = 1, len = m.length; i < len; ++i) {
          var key = keys[i - 1];
          var val = decodeURLEncodedURIComponent(m[i]);
          if (val !== undefined || !hasOwnProperty.call(params, key.name)) {
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
          window.addEventListener('load', function () {
            setTimeout(function () {
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
        return href && 0 === href.indexOf(origin);
      }

      page.sameOrigin = sameOrigin;
    }).call(this, require('_process'));
  }, { "_process": 4, "path-to-regexp": 7 }], 7: [function (require, module, exports) {
    var isArray = require('isarray');

    /**
     * Expose `pathToRegexp`.
     */
    module.exports = pathToRegexp;

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
    // "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
    // "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
    '([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?',
    // Match regexp special characters that are always escaped.
    '([.+*?=^!:${}()[\\]|\\/])'].join('|'), 'g');

    /**
     * Escape the capturing group by escaping special characters and meaning.
     *
     * @param  {String} group
     * @return {String}
     */
    function escapeGroup(group) {
      return group.replace(/([=!:$\/()])/g, '\\$1');
    }

    /**
     * Attach the keys as a property of the regexp.
     *
     * @param  {RegExp} re
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function attachKeys(re, keys) {
      re.keys = keys;
      return re;
    }

    /**
     * Get the flags for a regexp from the options.
     *
     * @param  {Object} options
     * @return {String}
     */
    function flags(options) {
      return options.sensitive ? '' : 'i';
    }

    /**
     * Pull out keys from a regexp.
     *
     * @param  {RegExp} path
     * @param  {Array}  keys
     * @return {RegExp}
     */
    function regexpToRegexp(path, keys) {
      // Use a negative lookahead to match only capturing groups.
      var groups = path.source.match(/\((?!\?)/g);

      if (groups) {
        for (var i = 0; i < groups.length; i++) {
          keys.push({
            name: i,
            delimiter: null,
            optional: false,
            repeat: false
          });
        }
      }

      return attachKeys(path, keys);
    }

    /**
     * Transform an array into a regexp.
     *
     * @param  {Array}  path
     * @param  {Array}  keys
     * @param  {Object} options
     * @return {RegExp}
     */
    function arrayToRegexp(path, keys, options) {
      var parts = [];

      for (var i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source);
      }

      var regexp = new RegExp('(?:' + parts.join('|') + ')', flags(options));
      return attachKeys(regexp, keys);
    }

    /**
     * Replace the specific tags with regexp strings.
     *
     * @param  {String} path
     * @param  {Array}  keys
     * @return {String}
     */
    function replacePath(path, keys) {
      var index = 0;

      function replace(_, escaped, prefix, key, capture, group, suffix, escape) {
        if (escaped) {
          return escaped;
        }

        if (escape) {
          return '\\' + escape;
        }

        var repeat = suffix === '+' || suffix === '*';
        var optional = suffix === '?' || suffix === '*';

        keys.push({
          name: key || index++,
          delimiter: prefix || '/',
          optional: optional,
          repeat: repeat
        });

        prefix = prefix ? '\\' + prefix : '';
        capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');

        if (repeat) {
          capture = capture + '(?:' + prefix + capture + ')*';
        }

        if (optional) {
          return '(?:' + prefix + '(' + capture + '))?';
        }

        // Basic parameter support.
        return prefix + '(' + capture + ')';
      }

      return path.replace(PATH_REGEXP, replace);
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
    function pathToRegexp(path, keys, options) {
      keys = keys || [];

      if (!isArray(keys)) {
        options = keys;
        keys = [];
      } else if (!options) {
        options = {};
      }

      if (path instanceof RegExp) {
        return regexpToRegexp(path, keys, options);
      }

      if (isArray(path)) {
        return arrayToRegexp(path, keys, options);
      }

      var strict = options.strict;
      var end = options.end !== false;
      var route = replacePath(path, keys);
      var endsWithSlash = path.charAt(path.length - 1) === '/';

      // In non-strict mode we allow a slash at the end of match. If the path to
      // match already ends with a slash, we remove it for consistency. The slash
      // is valid at the end of a path match, not in the middle. This is important
      // in non-ending mode, where "/test/" shouldn't match "/test//route".
      if (!strict) {
        route = (endsWithSlash ? route.slice(0, -2) : route) + '(?:\\/(?=$))?';
      }

      if (end) {
        route += '$';
      } else {
        // In non-ending mode, we need the capturing groups to match as much as
        // possible by using a positive lookahead to the end or next path segment.
        route += strict && endsWithSlash ? '' : '(?=\\/|$)';
      }

      return attachKeys(new RegExp('^' + route, flags(options)), keys);
    }
  }, { "isarray": 8 }], 8: [function (require, module, exports) {
    module.exports = Array.isArray || function (arr) {
      return Object.prototype.toString.call(arr) == '[object Array]';
    };
  }, {}], 9: [function (require, module, exports) {
    'use strict';

    require('../../db/db')({
      protocol: JotApp.server.protocol,
      domain: JotApp.server.domain,
      username: JotApp.user.credentials.key,
      password: JotApp.user.credentials.password,
      dbName: 'jot-' + JotApp.user._id
    });

    var router = require('../../routers/path');

    var RoutesHome = require('../../routes/client/home');
    var RoutesNotes = require('../../routes/client/notes');
    var RoutesAuth = require('../../routes/client/auth');

    var TitleBarView = require('../../views/titlebar');

    var Handlebars = require('handlebars/dist/handlebars.runtime');
    var helpers = require('../../templates/helpers');

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
        if (!_iteratorNormalCompletion && _iterator["return"]) {
          _iterator["return"]();
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

    var routesHome = new RoutesHome(router, '/');

    var routesAuth = new RoutesAuth(router, '/auth');

    var routesNotes = new RoutesNotes(router, '/notes', {
      item: JotApp.templates.note,
      itemadd: JotApp.templates['note-add'],
      items: JotApp.templates.notes
    });

    routesHome.registerRoutes();
    routesAuth.registerRoutes();
    routesNotes.registerRoutes();

    var titleBar = new TitleBarView(JotApp.templates.titlebar, {
      'titlebar-title': JotApp.templates['titlebar-title']
    }, document.getElementById('header'));

    titleBar.render(true);

    router.activate();
  }, { "../../db/db": 1, "../../routers/path": 10, "../../routes/client/auth": 12, "../../routes/client/home": 13, "../../routes/client/notes": 14, "../../templates/helpers": 18, "../../views/titlebar": 24, "handlebars/dist/handlebars.runtime": 5 }], 10: [function (require, module, exports) {
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
  }, { "page": 6 }], 11: [function (require, module, exports) {
    'use strict';

    var Routes = require('./routes');

    var AuthRoutes = (function (_Routes) {
      _inherits(AuthRoutes, _Routes);

      function AuthRoutes(router) {
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, AuthRoutes);

        _get(Object.getPrototypeOf(AuthRoutes.prototype), "constructor", this).call(this, router, prefix);

        this._routes.authGoogle = {
          _path: '/google',
          _method: ['get'],
          _action: function _action() {
            return Promise.resolve();
          }
        };

        this._routes.callbackGoogle = {
          _path: '/google/callback',
          _method: ['get'],
          _action: function _action() {
            return Promise.resolve();
          }
        };

        this._routes.signout = {
          _path: '/signout',
          _method: ['get'],
          _action: function _action() {
            return Promise.resolve();
          }
        };
      }

      return AuthRoutes;
    })(Routes);

    module.exports = AuthRoutes;
  }, { "./routes": 17 }], 12: [function (require, module, exports) {
    var AuthRoutes = require('../auth');

    var AuthRouter = (function () {
      function AuthRouter(router) {
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, AuthRouter);

        this._db = require('../../db/db')();

        this._router = router;
        this.routes = new AuthRoutes(router, prefix);
      }

      _createClass(AuthRouter, [{
        key: "registerRoutes",
        value: function registerRoutes() {
          var _this6 = this;

          this.routes.registerRoute('signout', function (ctx, next) {
            return Promise.resolve().then(function () {
              return {
                params: {},

                resolve: function resolve() {
                  _this6._db.destroy().then(function () {
                    _this6._router.stop(ctx.canonicalPath);
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
  }, { "../../db/db": 1, "../auth": 11 }], 13: [function (require, module, exports) {
    var HomeRoutes = require('../home');
    var HomeView = require('../../views/home');
    var PubSub = require('../../utility/pubsub');

    var HomeRouter = (function () {
      function HomeRouter(router) {
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, HomeRouter);

        this.routes = new HomeRoutes(router, prefix);

        this.homeView = new HomeView();
      }

      _createClass(HomeRouter, [{
        key: "registerRoutes",
        value: function registerRoutes() {
          var _this7 = this;

          this.routes.registerRoute('home', function (ctx, next) {
            return Promise.resolve().then(function () {
              return {
                params: {},

                resolve: function resolve(events) {
                  _this7.homeView.render(false, {});

                  PubSub.publish('routeChanged', {
                    name: 'Home'
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
  }, { "../../utility/pubsub": 19, "../../views/home": 21, "../home": 15 }], 14: [function (require, module, exports) {
    var NotesRoutes = require('../notes');
    var NotesView = require('../../views/notes');
    var PubSub = require('../../utility/pubsub');

    var Jot = require('../../models/jot');

    var NotesRouter = (function () {
      function NotesRouter(router) {
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, NotesRouter);

        this.routes = new NotesRoutes(router, prefix);

        this.notesView = new NotesView();
      }

      _createClass(NotesRouter, [{
        key: "registerRoutes",
        value: function registerRoutes() {
          var _this8 = this;

          this.routes.registerRoute('all', function (ctx, next) {
            return Jot.loadAll().then(function (jots) {
              return {
                params: {},

                resolve: function resolve(events) {
                  _this8.notesView.render(false, {
                    jots: jots
                  });

                  /*
                  PubSub.publish('routeChanged', {
                    name: 'Home'
                  });
                  */
                },

                reject: function reject(err) {
                  throw new Error(err);
                }
              };
            });
          });
        }
      }]);

      return NotesRouter;
    })();

    module.exports = NotesRouter;
  }, { "../../models/jot": 2, "../../utility/pubsub": 19, "../../views/notes": 23, "../notes": 16 }], 15: [function (require, module, exports) {
    'use strict';

    var Routes = require('./routes');

    var HomeRoutes = (function (_Routes2) {
      _inherits(HomeRoutes, _Routes2);

      function HomeRoutes(router) {
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, HomeRoutes);

        _get(Object.getPrototypeOf(HomeRoutes.prototype), "constructor", this).call(this, router, prefix);

        this._routes.home = {
          _path: '/',
          _method: ['get'],
          _action: function _action() {
            return Promise.resolve();
          }
        };
      }

      return HomeRoutes;
    })(Routes);

    module.exports = HomeRoutes;
  }, { "./routes": 17 }], 16: [function (require, module, exports) {
    'use strict';

    var Routes = require('./routes');

    var Jot = require('../models/jot');

    var NotesRoutes = (function (_Routes3) {
      _inherits(NotesRoutes, _Routes3);

      function NotesRoutes(router) {
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, NotesRoutes);

        _get(Object.getPrototypeOf(NotesRoutes.prototype), "constructor", this).call(this, router, prefix);

        this._routes.all = {
          _path: '/',
          _method: ['get'],
          _action: function _action() {
            return Promise.resolve();
          }
        };

        this._routes.add = {
          _path: '/',
          _method: ['post'],
          _action: function _action(params) {
            return new Jot({
              fields: {
                content: params.content
              }
            }).save();
          }
        };

        this._routes["delete"] = {
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

        this._routes.update = {
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
      }

      return NotesRoutes;
    })(Routes);

    module.exports = NotesRoutes;
  }, { "../models/jot": 2, "./routes": 17 }], 17: [function (require, module, exports) {
    var Routes = (function () {
      function Routes(router) {
        var prefix = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

        _classCallCheck(this, Routes);

        this._router = router;
        this._prefix = prefix;

        this._routes = {};
      }

      _createClass(Routes, [{
        key: "registerRoute",
        value: function registerRoute(name, config) {
          var _this9 = this;

          var route = this._routes[name];
          route._method.forEach(function (method) {
            _this9._router[method](_this9._prefix + route._path, function () {
              config.apply(undefined, arguments).then(function (result) {
                return route._action(result.params).then(result.resolve)["catch"](result.reject);
              });
            });
          });
        }
      }]);

      return Routes;
    })();

    module.exports = Routes;
  }, {}], 18: [function (require, module, exports) {
    'use strict';

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
      var url = Handlebars.escapeExpression(elem).autoLink();

      return new Handlebars.SafeString(url);
    }
  }, { "handlebars/dist/handlebars.runtime": 5 }], 19: [function (require, module, exports) {
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
  }, {}], 20: [function (require, module, exports) {
    var View = require('./view');

    var ActionBar = (function (_View) {
      _inherits(ActionBar, _View);

      function ActionBar() {
        _classCallCheck(this, ActionBar);

        _get(Object.getPrototypeOf(ActionBar.prototype), "constructor", this).apply(this, arguments);
      }

      _createClass(ActionBar, [{
        key: "initEvents",
        value: function initEvents() {
          var _this10 = this;

          _get(Object.getPrototypeOf(ActionBar.prototype), "initEvents", this).call(this);

          this._nav = this._el.querySelector('nav');
          this._navOverlay = this._el.querySelector('.md-nav-overlay');
          this._btnMenuOpen = this._el.querySelector('.md-btn-menu');
          this._btnMenuClose = this._el.querySelector('.md-btn-menu.close');
          this._links = this._el.querySelectorAll('.md-nav-body a');

          this._btnMenuOpen.addEventListener('click', function (event) {
            event.preventDefault();
            _this10.openNav();
          });

          this._btnMenuClose.addEventListener('click', function (event) {
            event.preventDefault();
            _this10.closeNav();
          });

          for (var _i = 0; _i < this._links.length; _i++) {
            this._links[_i].addEventListener('click', function () {
              return _this10.closeNav();
            });
          }
        }
      }, {
        key: "openNav",
        value: function openNav() {
          this._nav.classList.add('show');
          this._navOverlay.classList.add('show');
        }
      }, {
        key: "closeNav",
        value: function closeNav() {
          this._nav.classList.remove('show');
          this._navOverlay.classList.remove('show');
        }
      }]);

      return ActionBar;
    })(View);

    module.exports = ActionBar;
  }, { "./view": 25 }], 21: [function (require, module, exports) {
    'use strict';

    var MainView = require('./main');

    var Handlebars = require('handlebars/dist/handlebars.runtime');

    var ViewHome = (function (_MainView) {
      _inherits(ViewHome, _MainView);

      function ViewHome() {
        _classCallCheck(this, ViewHome);

        _get(Object.getPrototypeOf(ViewHome.prototype), "constructor", this).apply(this, arguments);
      }

      _createClass(ViewHome, [{
        key: "render",
        value: function render(preRendered, params) {
          console.log('render');

          if (!preRendered) {
            var template = Handlebars.template(JotApp.templates.home);
            var view = document.getElementById('view');
            view.innerHTML = template(params);
          }

          this.initEvents();
        }
      }, {
        key: "initEvents",
        value: function initEvents() {}
      }]);

      return ViewHome;
    })(MainView);

    module.exports = ViewHome;
  }, { "./main": 22, "handlebars/dist/handlebars.runtime": 5 }], 22: [function (require, module, exports) {
    var View = require('./view');

    var MainView = (function (_View2) {
      _inherits(MainView, _View2);

      function MainView(template) {
        _classCallCheck(this, MainView);

        _get(Object.getPrototypeOf(MainView.prototype), "constructor", this).call(this, template, document.getElementById('view'));
      }

      return MainView;
    })(View);

    module.exports = MainView;
  }, { "./view": 25 }], 23: [function (require, module, exports) {
    'use strict';

    var MainView = require('./main');

    var Handlebars = require('handlebars/dist/handlebars.runtime');

    var Jot = require('../models/jot');

    var PubSub = require('../utility/pubsub');

    var ViewNotes = (function (_MainView2) {
      _inherits(ViewNotes, _MainView2);

      function ViewNotes(template) {
        var _this11 = this;

        _classCallCheck(this, ViewNotes);

        _get(Object.getPrototypeOf(ViewNotes.prototype), "constructor", this).call(this, template);

        PubSub.subscribe('update', function (topic, args) {
          console.log(args);

          if (args.changes && args.changes.length) {
            Jot.loadAll().then(function (jots) {
              _this11.renderPartial('jots', false, {
                jots: jots
              });
            });
          }
        });
      }

      _createClass(ViewNotes, [{
        key: "render",
        value: function render(preRendered, params) {
          console.log('render');

          if (!preRendered) {
            var template = Handlebars.template(JotApp.templates.notes);
            var view = document.getElementById('view');
            view.innerHTML = template(params);

            var contentField = this._el.querySelector('#form-note-add').elements.content;
            contentField.focus();
          }

          this.initEvents();
        }
      }, {
        key: "renderPartial",
        value: function renderPartial(name, preRendered, params) {
          console.log('render partial');

          if (!preRendered) {
            var template = Handlebars.template(JotApp.templates.jots);
            var view = this._el.querySelector('.jots');
            view.outerHTML = template(params);

            this.initEdit();
            this.initDeleteForms();
            this.initUpdateForms();
          }
        }
      }, {
        key: "initEvents",
        value: function initEvents() {
          this.initAddForm();

          this.initEdit();
          this.initDeleteForms();
          this.initUpdateForms();
        }
      }, {
        key: "initAddForm",
        value: function initAddForm() {
          var _this12 = this;

          var form = this._el.querySelector('#form-note-add');
          form.addEventListener('submit', function (event) {
            event.preventDefault();

            var contentField = form.elements.content;
            var content = contentField.value;

            new Jot({
              fields: {
                content: content
              }
            }).save().then(function () {
              contentField.value = '';
              Jot.loadAll().then(function (jots) {
                _this12.renderPartial('jots', false, {
                  jots: jots
                });
              });
            });
          });

          form.elements.content.addEventListener('focus', function () {
            _this12.unselectAllNotes();
          });
        }
      }, {
        key: "initEdit",
        value: function initEdit() {
          var _this13 = this;

          var links = this._el.querySelectorAll('.jots__jot__item');
          var _iteratorNormalCompletion2 = true;
          var _didIteratorError2 = false;
          var _iteratorError2 = undefined;

          try {
            var _loop = function () {
              var link = _step2.value;

              link.addEventListener('click', function (event) {
                event.preventDefault();

                _this13.unselectAllNotes();

                link.parentNode.classList.add('edit');

                var contentField = link.parentNode.querySelector('.form-note-update').elements.content;
                contentField.focus();
                contentField.value = contentField.value; //forces cursor to go to end of text
              });
            };

            for (var _iterator2 = links[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
              _loop();
            }
          } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
                _iterator2["return"]();
              }
            } finally {
              if (_didIteratorError2) {
                throw _iteratorError2;
              }
            }
          }

          var cancels = this._el.querySelectorAll('.edit-cancel');
          var _iteratorNormalCompletion3 = true;
          var _didIteratorError3 = false;
          var _iteratorError3 = undefined;

          try {
            var _loop2 = function () {
              var cancel = _step3.value;

              cancel.addEventListener('click', function (event) {
                event.preventDefault();

                cancel.parentNode.classList.remove('edit');
              });
            };

            for (var _iterator3 = cancels[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
              _loop2();
            }
          } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
                _iterator3["return"]();
              }
            } finally {
              if (_didIteratorError3) {
                throw _iteratorError3;
              }
            }
          }
        }
      }, {
        key: "unselectAllNotes",
        value: function unselectAllNotes() {
          //TODO: have class member to hold reference to common element/element groups to avoid requerying
          var links = this._el.querySelectorAll('.jots__jot__item');
          var _iteratorNormalCompletion4 = true;
          var _didIteratorError4 = false;
          var _iteratorError4 = undefined;

          try {
            for (var _iterator4 = links[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
              var link = _step4.value;

              link.parentNode.classList.remove('edit');
            }
          } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
                _iterator4["return"]();
              }
            } finally {
              if (_didIteratorError4) {
                throw _iteratorError4;
              }
            }
          }
        }
      }, {
        key: "initDeleteForms",
        value: function initDeleteForms() {
          var _this14 = this;

          var forms = this._el.querySelectorAll('.form-note-delete');
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            var _loop3 = function () {
              var form = _step5.value;

              form.addEventListener('submit', function (event) {
                event.preventDefault();

                var id = form.dataset.id;

                Jot.remove(id).then(function () {
                  Jot.loadAll().then(function (jots) {
                    _this14.renderPartial('jots', false, {
                      jots: jots
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
              if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
                _iterator5["return"]();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
      }, {
        key: "initUpdateForms",
        value: function initUpdateForms() {
          var _this15 = this;

          var forms = this._el.querySelectorAll('.form-note-update');

          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            var _loop4 = function () {
              var form = _step6.value;

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

              form.addEventListener('submit', function (event) {
                event.preventDefault();

                var id = form.dataset.id;

                var content = form.elements.content.value;
                var doneStatus = form.elements['done-status'].value;

                Jot.load(id).then(function (jot) {

                  var currentFields = jot.fields;

                  jot.fields = {
                    content: content
                  };

                  if (doneStatus === 'done') {
                    jot.fields.done = true;
                  } else if (doneStatus === 'undone') {
                    jot.fields.done = false;
                  } else {
                    jot.fields.done = currentFields.done;
                  }

                  jot.save().then(function () {
                    Jot.loadAll().then(function (jots) {
                      _this15.renderPartial('jots', false, {
                        jots: jots
                      });
                    });
                  });
                });
              });
            };

            for (var _iterator6 = forms[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              _loop4();
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6["return"]) {
                _iterator6["return"]();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }
        }
      }]);

      return ViewNotes;
    })(MainView);

    module.exports = ViewNotes;
  }, { "../models/jot": 2, "../utility/pubsub": 19, "./main": 22, "handlebars/dist/handlebars.runtime": 5 }], 24: [function (require, module, exports) {
    var View = require('./view');
    var Handlebars = require('handlebars/dist/handlebars.runtime');
    var ActionBar = require('./actionbar');
    var PubSub = require('../utility/pubsub');

    var TitleBarView = (function (_View3) {
      _inherits(TitleBarView, _View3);

      function TitleBarView(template, partials, el) {
        var _this16 = this;

        _classCallCheck(this, TitleBarView);

        _get(Object.getPrototypeOf(TitleBarView.prototype), "constructor", this).call(this, template, el);
        this._partials = partials;

        this._user = null;

        this.registerWidget(ActionBar, partials['titlebar-title']);

        PubSub.subscribe('routeChanged', function (topic, args) {
          return _this16.updateName(args.name);
        });
      }

      _createClass(TitleBarView, [{
        key: "setUser",
        value: function setUser(user) {
          this._user = user;
        }
      }, {
        key: "updateName",
        value: function updateName(name) {
          this._name = name;
          this.renderPartial('titlebar-title', 'titlebar-title');
        }
      }, {
        key: "renderPartial",
        value: function renderPartial(partialId, partialName) {
          var part = this._el.querySelector('#' + partialId);

          var template = Handlebars.template(this._partials[partialName]);
          part.outerHTML = template({
            name: this._name
          });

          this.initWidgets();
        }
      }, {
        key: "render",
        value: function render(preRendered) {
          _get(Object.getPrototypeOf(TitleBarView.prototype), "render", this).call(this, preRendered, {
            user: this._user,
            name: this._name
          });
        }
      }]);

      return TitleBarView;
    })(View);

    module.exports = TitleBarView;
  }, { "../utility/pubsub": 19, "./actionbar": 20, "./view": 25, "handlebars/dist/handlebars.runtime": 5 }], 25: [function (require, module, exports) {
    'use strict';

    var Handlebars = require('handlebars/dist/handlebars.runtime');

    var View = (function () {
      function View(template) {
        var el = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        _classCallCheck(this, View);

        this._template = template;
        this._el = el;

        this._widgets = [];
      }

      _createClass(View, [{
        key: "render",
        value: function render(preRendered, params) {
          if (!preRendered) {
            var template = Handlebars.template(this._template);
            this._el.innerHTML = template(params);
          }

          this.initEvents();
        }
      }, {
        key: "initEvents",
        value: function initEvents() {
          this.initWidgets();
        }
      }, {
        key: "registerWidget",
        value: function registerWidget(Widget, template) {
          this._widgets.push(new Widget(template, this._el));

          return this._widgets.length - 1;
        }
      }, {
        key: "unregisterWidget",
        value: function unregisterWidget(widgetIndex) {
          this._widgets.splice(widgetIndex, 1);
        }
      }, {
        key: "initWidgets",
        value: function initWidgets() {
          this._widgets.forEach(function (widget) {
            widget.initEvents();
          });
        }
      }]);

      return View;
    })();

    module.exports = View;
  }, { "handlebars/dist/handlebars.runtime": 5 }] }, {}, [9]);
/******/
/************************************************************************/
/******/
/* 0 */
/***/
/* 1 */
/***/
/* 2 */
/***/
/* 3 */
/***/
/* 4 */
/***/
/* 5 */
/***/
/* 6 */
/***/

/* WEBPACK VAR INJECTION */
/* 7 */
/***/
//# sourceMappingURL=app.js.map