'use strict';

const MainView = require('./main');

const Handlebars = require('handlebars/dist/handlebars.runtime');

const Jot = require('../models/jot');

const PubSub = require('../utility/pubsub');

class ViewNotes extends MainView {
  constructor(template) {
    super(template);

    PubSub.subscribe('update', (topic, args) => {
      console.log(args);

      if (args.changes && args.changes.length) {
        Jot.loadAll().then(jots => {
          this.renderPartial('jots', false, {
            jots
          });
        });
      }
    });
  }

  render(preRendered, params) {
    console.log('render');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates.notes);
      const view = document.getElementById('view');
      view.innerHTML = template(params);

      const contentField = this._el.querySelector('#form-note-add').elements.content;
      contentField.focus();
    }

    this.initEvents();
  }

  renderPartial(name, preRendered, params) {
    console.log('render partial');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates.jots);
      const view = this._el.querySelector('.jots');
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
    const form = this._el.querySelector('#form-note-add');
    form.addEventListener('submit', event => {
      event.preventDefault();

      const contentField = form.elements.content;
      const content = contentField.value;

      new Jot({
        fields: {
          content
        }
      }).save().then(() => {
        contentField.value = '';
        Jot.loadAll().then(jots => {
          this.renderPartial('jots', false, {
            jots
          });
        });
      });
    });

    form.elements.content.addEventListener('focus', () => {
      this.unselectAllNotes();
    });
  }

  initEdit() {
    const links = this._el.querySelectorAll('.jots__jot__item');
    for (let link of links) {
      link.addEventListener('click', event => {
        event.preventDefault();

        this.unselectAllNotes();

        link.parentNode.classList.add('edit');

        const contentField = link.parentNode.querySelector('.form-note-update').elements.content;
        contentField.focus();
        contentField.value = contentField.value; //forces cursor to go to end of text
      });
    }

    const cancels = this._el.querySelectorAll('.edit-cancel');
    for (let cancel of cancels) {
      cancel.addEventListener('click', event => {
        event.preventDefault();

        cancel.parentNode.classList.remove('edit');
      });
    }
  }

  unselectAllNotes() {
    //TODO: have class member to hold reference to common element/element groups to avoid requerying
    const links = this._el.querySelectorAll('.jots__jot__item');
    for (let link of links) {
      link.parentNode.classList.remove('edit');
    }
  }

  initDeleteForms() {
    const forms = this._el.querySelectorAll('.form-note-delete');
    for (let form of forms) {
      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.id;

        Jot.remove(id).then(() => {
          Jot.loadAll().then(jots => {
            this.renderPartial('jots', false, {
              jots
            });
          });
        });
      });
    }
  }

  initUpdateForms() {
    const forms = this._el.querySelectorAll('.form-note-update');

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

      form.addEventListener('submit', event => {
        event.preventDefault();

        const id = form.dataset.id;

        const content = form.elements.content.value;
        const doneStatus = form.elements['done-status'].value;

        Jot.load(id).then(jot => {

          const currentFields = jot.fields;

          jot.fields = {
            content
          };

          if (doneStatus === 'done') {
            jot.fields.done = true;
          } else if (doneStatus === 'undone') {
            jot.fields.done = false;
          } else {
            jot.fields.done = currentFields.done;
          }

          jot.save().then(() => {
            Jot.loadAll().then(jots => {
              this.renderPartial('jots', false, {
                jots
              });
            });
          });
        });
      });
    }
  }

}

module.exports = ViewNotes;
