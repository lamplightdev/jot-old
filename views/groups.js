'use strict';

const View = require('./view');

const Group = require('../models/group');

const PubSub = require('../utility/pubsub');

class ViewGroups extends View {
  constructor(container) {
    super(container);

    PubSub.subscribe('update', (topic, args) => {
      if (args.changes && args.changes.length) {
        Group.loadAll().then(groups => {
          this.renderPartial('group-list', {
            groups
          });
        });
      }
    });

    this._documentListeners = {};
  }

  render(preRendered, params) {
    super.render(preRendered, params);

    let nameField;
    if (params.editID) {
      nameField = this._el.querySelector('.form-jot-update-' + params.editID).elements.name;
    } else {
      nameField = this._el.querySelector('#form-group-add').elements.name;
    }

    //nameField.focus();
    //nameField.value = nameField.value;
  }

  renderPartial(name, params) {
    super.renderPartial(name, params);

    switch (name) {
      case 'group-list':
        this.initEdit();
        this.initDeleteForms();
        this.initUpdateForms();
        break;
    }
  }

  initEvents() {
    this.initAddForm();

    this.initEdit();
    this.initDeleteForms();
    this.initUpdateForms();
  }

  _addDocumentListener(name, type, fn) {
    if (!this._documentListeners[name]) {
      this._documentListeners[name] = {
        type,
        fn: fn.bind(this)
      };
    }

    document.addEventListener(type, this._documentListeners[name].fn);
  }

  cleanup() {
    super.cleanup();

    for (let lname in this._documentListeners) {
      const listener = this._documentListeners[lname];
      document.removeEventListener(listener.type, listener.fn);
    }
  }

  initAddForm() {
    const form = this._el.querySelector('#form-group-add');
    form.addEventListener('submit', event => {
      event.preventDefault();

      const nameField = form.elements.name;
      const name = nameField.value;

      new Group({
        fields: {
          name
        }
      }).save().then(() => {
        nameField.value = '';
        nameField.focus();
        Group.loadAll().then(groups => {
          this.renderPartial('group-list', {
            groups
          });
        });
      });
    });
  }

  initEdit() {
    const links = this._el.querySelectorAll('.groups__group__edit');
    for (let link of links) {
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();  //stop document listener from removing 'edit' class

        this.unselectAll();

        link.parentNode.parentNode.classList.add('edit');

        const nameField = link.parentNode.parentNode.querySelector('.form-group-update').elements.name;
        nameField.focus();
        nameField.value = nameField.value; //forces cursor to go to end of text
      });
    }

    const cancels = this._el.querySelectorAll('.edit-cancel');
    for (let cancel of cancels) {
      cancel.addEventListener('click', event => {
        event.preventDefault();

        //cancel.parentNode.classList.remove('edit');
        //above will be handled by document listener below
      });
    }

    this._addDocumentListener('unselectAll', 'click', () => {
      this.unselectAll();
    });
  }

  unselectAll() {
    //TODO: have class member to hold reference to common element/element groups to avoid requerying
    const links = this._el.querySelectorAll('.groups__group__item');
    for (let link of links) {
      link.parentNode.classList.remove('edit');
    }
  }

  initDeleteForms() {
    const forms = this._el.querySelectorAll('.form-group-delete');
    for (let form of forms) {
      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.id;

        const item = this._el.querySelector('.groups__group-' + id);
        //item.parentNode.parentNode.removeChild(item);

        Group.remove(id).then(() => {
          Group.loadAll().then(groups => {
            this.renderPartial('group-list', {
              groups
            });
          });
        });
      });
    }
  }

  initUpdateForms() {
    const forms = this._el.querySelectorAll('.form-group-update');

    for (let form of forms) {
      form.addEventListener('click', event => {
        event.stopPropagation();  //stop document listener from removing 'edit' class
      });

      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.id;

        const name = form.elements.name.value;

        Group.load(id).then(group => {

          group.fields = {
            name
          };

          group.save().then(() => {
            Group.loadAll().then(groups => {
              this.renderPartial('group-list', {
                groups
              });
            });
          });
        });
      });
    }
  }

}

module.exports = ViewGroups;
