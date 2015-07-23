'use strict';

const cloudant = require('cloudant');

class CloudantClient {

  constructor() {
    this._cloudant = null;
    this._usersDB = null;
  }

  init(account, password) {
    this._cloudant = cloudant({
      account,
      password
    });

    this._usersDB = this.cloudant.use('jot-users');
  }

  get cloudant() {
    return this._cloudant;
  }

  formatID(service, id) {
    return service + '-' + id;
  }

  getUser(service, id) {
    const promise = new Promise((resolve, reject) => {

      this._usersDB.get(this.formatID(service, id), (err, body) => {
        if (err) {
          console.log(err);
          resolve(false);
        } else {
          resolve(body);
        }
      });
    });

    return promise;
  }

  createUser(service, id, email, name) {
    return this.insertUser(service, id, email, name).then((userDoc) => {
      return this.createUserDB(userDoc).then((userDoc) => {
        return userDoc;
      });
    });
  }

  insertUser(service, id, email, name) {
    const promise = new Promise((resolve, reject) => {

      const userParams = {
        _id: this.formatID(service, id),
        service,
        serviceId: id,
        email,
        name
      };

      this.getUser(service, id).then(userDoc => {
        if (userDoc) {
          Object.assign(userParams, userDoc);
        }

        this._usersDB.insert(userParams, (err, body) => {
          if (err) {
            reject(new Error(err));
          } else {
            userParams._id = body.id;
            userParams._rev = body.rev;
            resolve(userParams);
          }
        });
      }).catch(reject);

    });

    return promise;
  }

  createUserDB(userDoc) {
    const promise = new Promise((resolve, reject) => {

      this.cloudant.db.create('jot-' + userDoc._id, (err, body) => {
        if (err) {  //database already created
          resolve(userDoc);
        } else {

          const results = {
            credentials: null,
            userDoc: userDoc
          };

          this.createAPICredentials()

          .then(credentials => {
            results.credentials = credentials;
            return this.assignAPICredentialsToDB(results.userDoc, results.credentials.key);
          })

          .then(() => {
            return this.assignAPICredentialsToUser(results.userDoc, results.credentials);
          })

          .then(userDoc => {
            results.userDoc = userDoc;
            resolve(results.userDoc);
          })

          .catch(reject);

        }

      });

    });

    return promise;
  }

  createAPICredentials() {
    const promise = new Promise((resolve, reject) => {

      this.cloudant.generate_api_key((err, api) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(api);
        }
      });

    });

    return promise;
  }

  assignAPICredentialsToDB(userDoc, key) {
    const promise = new Promise((resolve, reject) => {

      const dbName = 'jot-' + userDoc._id;
      const security = {
        [key]: ['_reader', '_writer']
      };

      const userDB = this.cloudant.db.use(dbName);
      userDB.set_security(security, (err, result) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve();
        }
      });

    });

    return promise;
  }

  assignAPICredentialsToUser(userDoc, credentials) {
    const promise = new Promise((resolve, reject) => {

      userDoc.credentials = credentials;

      this._usersDB.insert(userDoc, (err, body) => {
        if (err) {
          reject(new Error(err));
        } else {
          resolve(userDoc);
        }
      });

    });

    return promise;
  }
}

const cloudantClient = new CloudantClient();

module.exports = (account, password) => {
  if (account) {
    cloudantClient.init(account, password);
  }

  return cloudantClient;
};
