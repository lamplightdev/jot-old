class Preferences {
  constructor() {
    if (localStorage) {
      this._storage = localStorage;
    } else {
      this._storage = {
        fields: {},

        getItem: function(name) {
          return this.fields[name];
        },

        setItem: function(name, item) {
          this.fields[name] = item;
        }
      };
    }

    this._key = this.constructor.name.toLowerCase();
  }

  getItem(name) {
    let prefs = this._storage.getItem(this._key);

    if (prefs) {
      prefs = JSON.parse(prefs);
    } else {
      prefs = {};
    }

    return prefs.name;
  }

  setItem(name, item) {
    let prefs = this._storage.getItem(this._key);

    if (prefs) {
      prefs = JSON.parse(prefs);
    } else {
      prefs = {};
    }

    prefs.name = item;

    this._storage.setItem(this._key, JSON.stringify(prefs));
  }
}

module.exports = Preferences;
