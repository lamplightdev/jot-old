'use strict';

const MainView = require('./main');

const Handlebars = require('handlebars/dist/handlebars.runtime');

const Jot = require('../models/jot');
const Group = require('../models/group');

class ViewGroup extends MainView {
  render(preRendered, params) {
    console.log('render');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates.group);
      const view = document.getElementById('view');
      view.innerHTML = template(params);
    }

    this.initEvents();
  }

  initEvents() {
    this.initAddForm();
  }

  renderPartial(name, preRendered, params) {
    console.log('render partial');

    if (!preRendered) {
      var template = Handlebars.template(JotApp.templates['jot-list']);
      const view = this._el.querySelector('.jot-list');
      view.outerHTML = template(params);
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
        Group.load(group).then(group => {
          this.renderPartial('jots', false, {
            jots: group.jots
          });
        });
      });
    });
  }
}

module.exports = ViewGroup;
