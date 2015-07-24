class Jot {

  constructor(members) {
    this._db = require('../db/db')();

    this._id = members._id || null;
    this._rev = members._rev || null;

    this._fields = members.fields || {};

    this._allowedFields = [
      'content',
      'done'
    ];
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;

    return this;
  }

  get rev() {
    return this._rev;
  }

  set rev(rev) {
    this._rev = rev;

    return this;
  }

  set fields(fields) {
    this._fields = {};

    for (let fieldName in fields) {
      if (this._allowedFields.indexOf(fieldName) > -1) {
        this._fields[fieldName] = fields[fieldName];
      }
    }

    return this;
  }

  get fields() {
    return this._fields;
  }

  isNew() {
    return !this.id;
  }

  getSlug() {
    if (!this.isNew()) {
      return Promise.resolve(this.id);
    } else {
      let slug = 'jot-';

      const padding = 5; //the length of the number, e.g. '5' will start at 00000, 00001, etc.

      return this._db.allDocs({
        startkey: slug + '\uffff',
        endKey: slug,
        descending: true,
        limit: 1
      }).then(result => {
        if (result.rows.length > 0) {
          const lastDoc = result.rows[result.rows.length - 1];
          const lastNum = parseInt(lastDoc.id.substring(slug.length), 10);

          return slug + ('0'.repeat(padding) + (lastNum + 1)).slice(-padding);
        } else {
          return slug + '0'.repeat(padding);
        }
      });
    }
  }

  save() {
    return this.getSlug().then(slug => {
      const params = {
        _id: slug,
        fields: this.fields
      };

      if (!this.isNew()) {
        params._rev = this.rev;
      }

      return this._db.put(params).then(response => {
        if (response.ok) {
          this.id = response.id;
          this.rev = response.rev;

          return true;
        } else {
          return false;
        }
      });

    });
  }

  static loadAll() {
    const db = require('../db/db')();

    return db.allDocs({
      include_docs: true,
      descending: true,
      limit: 10
    }).then(result => {
      const jots = [];

      result.rows.forEach(row => {
        jots.push(new this(row.doc));
      });

      return jots;
    });
  }

  static load(id) {
    const db = require('../db/db')();

    return db.get(id).then(doc => {
      console.log(doc);
      return new this(doc);
    });
  }

  static remove(id) {
    const db = require('../db/db')();

    return db.get(id).then(doc => {
      return db.remove(doc);
    });
  }
}

module.exports = Jot;
