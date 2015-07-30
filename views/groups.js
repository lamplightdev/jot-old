'use strict';

const MainView = require('./main');

const Handlebars = require('handlebars/dist/handlebars.runtime');

const Group = require('../models/group');

const PubSub = require('../utility/pubsub');

class ViewGroups extends MainView {
  constructor(template) {
    super(template);

    PubSub.subscribe('update', (topic, args) => {
      console.log(args);

      if (args.changes && args.changes.length) {
        Group.loadAll().then(groups => {
          this.renderPartial('groups', false, {
            groups
          });
        });
      }
    });
  }

  render(preRendered, params) {
    console.log('render');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates.groups);
      const view = document.getElementById('view');
      view.innerHTML = template(params);

      let nameField;
      if (params.editID) {
        nameField = this._el.querySelector('.form-jot-update-' + params.editID).elements.name;
      } else {
        nameField = this._el.querySelector('#form-group-add').elements.name;
      }

      nameField.focus();
      nameField.value = nameField.value;
    }

    this.initEvents();
  }

  renderPartial(name, preRendered, params) {
    console.log('render partial');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates['group-list']);
      const view = this._el.querySelector('.group-list');
      view.outerHTML = template(params);

      this.initEdit();
      this.initDeleteForms();
      this.initUpdateForms();
    }
  }

  initEvents() {
    this.initAddForm();

    this.initEdit();
    this.initDeleteForms();
    this.initUpdateForms();
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
          this.renderPartial('groups', false, {
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

        link.parentNode.classList.add('edit');

        const nameField = link.parentNode.querySelector('.form-group-update').elements.name;
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

    document.addEventListener('click', event => {
      this.unselectAll();
    });
  }

  unselectAll() {
    //TODO: have class member to hold reference to common element/element groups to avoid requerying
    const links = this._el.querySelectorAll('.groups__group__item');
    for (let link of links) {
      link.parentNode.classList.remove('edit');
    }

    const nameField = this._el.querySelector('#form-group-add').elements.name;
    nameField.focus();
    nameField.value = nameField.value;
  }

  initDeleteForms() {
    const forms = this._el.querySelectorAll('.form-group-delete');
    for (let form of forms) {
      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.id;

        const item = this._el.querySelector('.groups__group-' + id);
        item.parentNode.removeChild(item);

        Group.remove(id).then(() => {
          Group.loadAll().then(groups => {
            this.renderPartial('groups', false, {
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
              this.renderPartial('groups', false, {
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
