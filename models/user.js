const DB = require('../db/db');

const Jot = require('./jot');

class User {
  constructor(options = false) {
    this._db = false;

    if (options) {
      this._db = new DB();
      this._db.init({
        protocol: 'https', // process.env.JOT_CLOUDANT_HOST_PROTOCOL,
        domain: 'lamplightdev.cloudant.com', // process.env.JOT_CLOUDANT_HOST_NAME,
        username: options.credentials.key,
        password: options.credentials.password,
        dbName: 'jot-' + options._id,
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
