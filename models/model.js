const DateUtils = require('../utility/date');

class Model {

  constructor(members, allowedFields) {
    this._id = members._id || null;
    this._rev = members._rev || null;

    this._dateAdded = members.dateAdded || null;

    this._fields = members.fields || {};

    this._allowedFields = allowedFields;
  }

  static get db() {
    return require('../db/db')();
  }

  static getRefName() {
    return this.name.toLowerCase();
  }

  get refName() {
    return this.constructor.getRefName();
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

  get dateAdded() {
    if (this._dateAdded) {
      return DateUtils.format(new Date(this._dateAdded));
    } else {
      return '';
    }
  }

  set dateAdded(date) {
    this._dateAdded = date;

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
    return Promise.resolve().then(() => {
      if (!this.isNew()) {
        return Promise.resolve(this.id);
      } else {
        let slug = this.refName + '-';

        const padding = 5; //the length of the number, e.g. '5' will start at 00000, 00001, etc.

        return this.constructor.db.allDocs({
          startkey: slug + '\uffff',
          endkey: slug,
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
    });
  }

  save() {
    return this.getSlug().then(slug => {
      const params = {
        _id: slug,
        dateAdded: this._dateAdded,
        fields: this.fields
      };

      if (!this.isNew()) {
        params._rev = this.rev;
      }

      if (this.isNew() && !this._dateAdded) {
        params.dateAdded = new Date().toISOString();
      }

      return this.constructor.db.put(params).then(response => {
        if (response.ok) {
          this.id = response.id;
          this.rev = response.rev;

          return this;
        } else {
          return false;
        }
      });

    });
  }

  static loadAll() {
    return Promise.resolve().then(() => {

      return this.db.allDocs({
        endkey: this.getRefName() + '-',
        startkey: this.getRefName() + '-\uffff',
        include_docs: true,
        descending: true
      }).then(result => {
        const models = [];

        result.rows.forEach(row => {
          models.push(new this(row.doc));
        });

        return models;
      });
    });
  }

  static load(id) {
    return Promise.resolve().then(() => {
      if (typeof id !== 'undefined') {

        return this.db.get(id).then(doc => {
          return new this(doc);
        }).catch(err => {
          return false;
        });
      } else {
        return false;
      }
    });
  }

  static remove(id) {
    return Promise.resolve().then(() => {

      return this.db.get(id).then(doc => {
        return this.db.remove(doc);
      });
    });
  }

  static insert(members) {
    const model = new this(members);
    return model.save();
  }
}

module.exports = Model;
