const PubSub = require('../utility/pubsub');
const PouchDB = require('pouchdb');

class DB {
  constructor() {
    this._remoteCouch = null;
    this._db = null;
  }

  get db() {
    return this._db;
  }

  init(passedOptions) {
    const options = passedOptions || {
      protocol: null,
      domain: null,
      port: null,
      username: null,
      password: null,
      dbName: null,
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

    if (typeof window !== 'undefined') { // browser
      PouchDB.debug.disable();
      this._db = new PouchDB(options.dbName, {
        auto_compaction: true,
      });

      if (this._remoteCouch) {
        const opts = {}; // {live: true, retry: true};

        this._db.replicate.to(this._remoteCouch, opts).on('change', info => {
          console.log('browser replicate to change');
        }).on('paused', () => {
          console.log('browser replicate to paused');
        }).on('active', () => {
          console.log('browser replicate to active');
        }).on('denied', info => {
          console.log('browser replicate to denied', info);
        }).on('complete', info => {
          console.log('browser replicate to complete');
        }).on('error', err => {
          console.log('browser replicate to error', err);
        });

        let changes = [];

        this._db.replicate.from(this._remoteCouch, opts).on('change', info => {
          console.log('browser replicate from change', info);
          changes = changes.concat(info.docs);
        }).on('paused', () => {
          console.log('browser replicate from paused');

          PubSub.publish('update', {
            changes,
          });

          changes = [];
        }).on('active', () => {
          console.log('browser replicate from active');
        }).on('denied', info => {
          console.log('browser replicate from denied', info);
        }).on('complete', info => {
          console.log('browser replicate from complete', info);
        }).on('error', err => {
          console.log('browser replicate from error', err);
        });
      } else {
        const ddoc = {
          _id: '_design/index',
          views: {
            group: {
              map: (doc => {
                if (doc.fields.group) {
                  emit(doc.fields.group);
                }
              }).toString(),
            },
          },
        };

        this._db.put(ddoc).then(() => {
          // kick off an initial build, return immediately
          return this._db.query('index/group', {stale: 'update_after'});
        }).catch(err => {
            // conflict occured, i.e. ddoc already existed
        });
      }
    } else {
      PouchDB.debug.disable();

      this._db = new PouchDB(this._remoteCouch);
    }
  }
}

module.exports = DB;
/*
const dbs = {
  'main': new DB(),
};
let currentDB = 'main';

module.exports = (options, id = false) => {
  console.log(dbs, options, id, currentDB);
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
*/
