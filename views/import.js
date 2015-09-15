'use strict';

const View = require('./view');

const Jot = require('../models/jot');

class ViewImport extends View {

  initEvents() {
    super.initEvents();

    this.initImportForm();
  }

  initImportForm() {
    const db = require('../db/db')();

    const form = this._el.querySelector('.form-import');
    form.addEventListener('submit', event => {
      event.preventDefault();

      Jot.importFromLocal();
    });
  }
}

module.exports = ViewImport;
