'use strict';

const View = require('./view');

const Jot = require('../models/jot');
const Group = require('../models/group');

const PubSub = require('../utility/pubsub');

class ViewGroup extends View {
  constructor(container) {
    super(container);

    /* TODO: HOW TO GET CURRENT GROUP?? SHOULD THIS BE IN RENDER
    PubSub.subscribe('update', (topic, args) => {
      if (args.changes && args.changes.length) {
        Group.load(group).then(group => {
          this.renderPartial('jot-list', {
            jots: group.jots
          });
        });
      }
    });
    */

    this._documentListeners = {};
  }

  renderPartial(name, params) {
    super.renderPartial(name, params);

    switch (name) {
      case 'jot-list':
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
    const form = this._el.querySelector('#form-jot-add');
    form.addEventListener('submit', event => {
      event.preventDefault();

      const contentField = form.elements.content;
      const content = contentField.value;

      const groupField = form.elements.group;
      const group = groupField.value;

      new Jot({
        fields: {
          content,
          group
        }
      }).save().then(() => {
        contentField.value = '';
        contentField.focus();
        Group.load(group).then(group => {
          this.renderPartial('jot-list', {
            jots: group.jots
          });
        });
      });
    });
  }

  initEdit() {
    const links = this._el.querySelectorAll('.jots__jot__edit');
    for (let link of links) {
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();  //stop document listener from removing 'edit' class

        const id = link.dataset.id;
        const item = this._el.querySelector('.jots__jot-' + id);

        if (!item.classList.contains('edit')) {
          this.unselectAll();

          item.classList.add('edit');

          const contentField = this._el.querySelector('.form-jot-update-' + id).elements.content;
          contentField.focus();
          contentField.value = contentField.value; //forces cursor to go to end of text
        } else {
          this.unselectAll();
        }
      });
    }

    this._addDocumentListener('unselectAll', 'click', () => {
      this.unselectAll();
    });
  }

  unselectAllListener() {
    this.unselectAll();
  }

  unselectAll() {
    //TODO: have class member to hold reference to common element/element groups to avoid requerying
    const items = this._el.querySelectorAll('.jots__jot');
    for (let item of items) {
      item.classList.remove('edit');
    }
  }

  initDeleteForms() {
    const forms = this._el.querySelectorAll('.form-jot-delete');
    for (let form of forms) {
      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.id;
        const group = form.dataset.groupId;

        const item = this._el.querySelector('.jots__jot-' + id);
        //item.parentNode.parentNode.removeChild(item);

        Jot.remove(id).then(() => {
          Group.load(group).then(group => {
            this.renderPartial('jot-list', {
              jots: group.jots
            });
          });
        });
      });
    }
  }

  initUpdateForms() {
    const forms = this._el.querySelectorAll('.form-jot-update');

    for (let form of forms) {
      const doneButton = form.elements.done;
      const undoneButton = form.elements.undone;

      if (doneButton) {
        doneButton.addEventListener('click', () => {
          form.elements['done-status'].value = 'done';
        });
      }

      if (undoneButton) {
        undoneButton.addEventListener('click', () => {
          form.elements['done-status'].value = 'undone';
        });
      }

      form.addEventListener('click', event => {
        event.stopPropagation();  //stop document listener from removing 'edit' class
      });

      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.id;

        const content = form.elements.content.value;
        const group = form.elements.group.value;
        const doneStatus = form.elements['done-status'].value;

        Jot.load(id).then(jot => {

          const currentFields = jot.fields;

          jot.fields = {
            content,
            group
          };

          if (doneStatus === 'done') {
            jot.fields.done = true;
          } else if (doneStatus === 'undone') {
            jot.fields.done = false;
          } else {
            jot.fields.done = currentFields.done;
          }

          jot.save().then(() => {
            Group.load(group).then(group => {
              this.renderPartial('jot-list', {
                jots: group.jots
              });
            });
          });
        });
      });
    }
  }
}

module.exports = ViewGroup;
