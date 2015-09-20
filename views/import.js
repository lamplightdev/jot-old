'use strict';

const View = require('./view');

const Group = require('../models/group');

class ViewImport extends View {

  initEvents() {
    super.initEvents();

    this.initImportForm();
  }

  initImportForm() {
    const form = this._el.querySelector('.form-import');
    form.addEventListener('submit', event => {
      event.preventDefault();

      Group.importFromLocal().then(groups => {
        console.log(groups);
      });
    });
  }
}

module.exports = ViewImport;
