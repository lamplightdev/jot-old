'use strict';

const View = require('./view');

const Group = require('../models/group');

const ColourSelectorWidget = require('./colour-selector');

const PubSub = require('../utility/pubsub');

class ViewGroups extends View {

  constructor(container) {
    super(container);

    this.registerWidget(ColourSelectorWidget);
  }

  render(preRendered, params) {
    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('update', (topic, args) => {
      if (args.changes && args.changes.length) {
        Group.loadAll().then(groups => {
          this.renderPartial('group-list', {
            groups
          });
        });
      }
    }));

    this._subscriptions.push(PubSub.subscribe('orderChanged', (topic, args) => {
      const params = this.lastParams;
      params.groups = Group.order(params.groups, args.type, args.direction);
      this.renderPartial('group-list', params);
    }));

    this._addDocumentListener('unselectAll', 'click', () => {
      this.unselectAll();
    });
  }

  renderPartial(name, params) {
    const el = super.renderPartial(name, params);

    switch (name) {
      case 'group-list':
        this.initEdit();
        this.initDeleteForms();
        this.initUpdateForms();
        this.initWidgets(el);
        break;
    }
  }

  initEvents() {
    super.initEvents();

    this.initAddForm();
    this.initEdit();
    this.initDeleteForms();
    this.initUpdateForms();
  }

  initAddForm() {
    const form = this._el.querySelector('.form-group-add');
    form.addEventListener('submit', event => {
      event.preventDefault();

      const nameField = form.elements.name;
      const name = nameField.value;

      const colour = form.elements.colour.value;

      new Group({
        fields: {
          name,
          colour
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

    const toShow = form.querySelector('.show-on-focus');

    form.addEventListener('click', event => {
      event.stopPropagation();
      this.unselectAll();
      toShow.classList.add('show');
    });
  }

  initEdit() {
    const editLinks = this._el.querySelectorAll('.groups__group__edit');
    for (let link of editLinks) {
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();  //stop document listener from removing 'edit' class

        const id = link.dataset.id;
        const item = this._el.querySelector('.groups__group-' + id);

        if (!item.classList.contains('edit')) {
          this.unselectAll();

          item.classList.add('edit');

          //const nameField = this._el.querySelector('.form-group-update-' + id).elements.name;
          //nameField.focus();
          //nameField.value = nameField.value; //forces cursor to go to end of text
        } else {
          this.unselectAll();
        }
      });
    }
  }

  unselectAll() {
    //TODO: have class member to hold reference to common element/element groups to avoid requerying
    const items = this._el.querySelectorAll('.groups__group');
    for (let item of items) {
      item.classList.remove('edit');
    }

    const shows = this._el.querySelectorAll('.show-on-focus');
    for (let show of shows) {
      show.classList.remove('show');
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
        const colour = form.elements.colour.value;

        Group.load(id).then(group => {

          group.fields = {
            name,
            colour
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
