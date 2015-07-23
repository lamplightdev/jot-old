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

      this.initDeleteForms();
    }
  }

  initEvents() {
    this.initAddForm();
    this.initDeleteForms();
  }

  initAddForm() {
    const addForm = this._el.querySelector('#form-note-add');

    addForm.addEventListener('submit', event => {
      event.preventDefault();

      const contentField = addForm.elements.content;
      const content = contentField.value;

      new Jot({
        fields: {
          content
        }
      }).save().then(() => {
        Jot.loadAll().then(jots => {
          this.renderPartial('jots', false, {
            jots
          });
        });
      });
    });
  }

  initDeleteForms() {
    const deleteForms = this._el.querySelectorAll('.form-note-delete');

    for (let form of deleteForms) {
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
}

module.exports = ViewNotes;
