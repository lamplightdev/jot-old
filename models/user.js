const DB = require('../db/db');

const Jot = require('./jot');

class User {
  constructor(options = false) {
    this._db = false;

    if (options) {
      this._db = new DB();
      this._db.init({
        protocol: options.protocol,
        domain: options.domain,
        username: options.username,
        password: options.password,
        dbName: options.dbName,
      });
    }
  }

  get db() {
    return this._db.db;
  }

  getPercentageDone() {
    return Jot.getPercentageDone(this);
  }
}

module.exports = User;
