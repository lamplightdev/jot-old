'use strict';

const PubSub = require('../utility/pubsub');

class DB {
  constructor() {
    this._remoteCouch = null;
    this._db = null;
  }

  get db() {
    return this._db;
  }

  init(options) {

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

    if (typeof PouchDB !== 'undefined') { //browser
      PouchDB.debug.disable();
      this._db = new PouchDB(options.dbName, {
        auto_compaction: true
      });

      const opts = {live: true, retry: true};

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
          changes
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
      const PouchDB = require('pouchdb');
      //PouchDB.plugin(require('pouchdb-find'));
      PouchDB.debug.disable();

      this._db = new PouchDB(this._remoteCouch);
    }
  }

}

const db = new DB();

module.exports = (options) => {
  if (options) {

    db.init(options);
    return db.db;

  } else {
    return db.db;
  }
};