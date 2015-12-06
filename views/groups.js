const View = require('./view');

const Group = require('../models/group');

const GroupsPreferences = require('../preferences/groups');

const ColourSelectorWidget = require('./colour-selector');

const PubSub = require('../utility/pubsub');

class ViewGroups extends View {

  constructor(container) {
    super(container);

    this.registerWidget(ColourSelectorWidget);

    this._preferences = new GroupsPreferences();
  }

  render(preRendered, params) {
    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('update', (topic, args) => {
      if (args.changes && args.changes.length) {
        Group.loadAll().then(groups => {
          this.renderPartial('group-list', {
            groups,
          });
        });
      }
    }));

    this._subscriptions.push(PubSub.subscribe('orderChanged', (topic, args) => {
      this._preferences.setOrder(args.type, args.direction);

      this.renderPartial('group-list', this.lastParams);
    }));

    this._addDocumentListener('unselectAll', 'click', () => {
      this.unselectAll();
    });
  }

  renderPartial(name, params) {
    switch (name) {
    case 'group-list':
      params.groups = this._preferences.order(params.groups);
      break;
    default:
      break;
    }

    const el = super.renderPartial(name, params);

    switch (name) {
    case 'group-list':
      this.initEdit();
      this.initDeleteForms();
      this.initUpdateForms();
      this.initWidgets(el);
      break;
    default:
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
          colour,
        },
      }).save().then(() => {
        nameField.value = '';
        // nameField.focus();
        nameField.blur();
        this.unselectAll();
        Group.loadAll().then(groups => {
          this.renderPartial('group-list', {
            groups,
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
    for (let i = 0; i < editLinks.length; i++) {
      editLinks[i].addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();  // stop document listener from removing 'edit' class

        const id = editLinks[i].dataset.id;
        const item = this._el.querySelector('.groups__group-' + id);

        if (!item.classList.contains('edit')) {
          this.unselectAll();

          item.classList.add('edit');

          // const nameField = this._el.querySelector('.form-group-update-' + id).elements.name;
          // nameField.focus();
          // nameField.value = nameField.value; //forces cursor to go to end of text
        } else {
          this.unselectAll();
        }
      });
    }
  }

  unselectAll() {
    // TODO: have class member to hold reference to common element/element groups to avoid requerying
    const items = this._el.querySelectorAll('.groups__group');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('edit');
    }

    const shows = this._el.querySelectorAll('.show-on-focus');
    for (let i = 0; i < shows.length; i++) {
      shows[i].classList.remove('show');
    }
  }

  initDeleteForms() {
    const forms = this._el.querySelectorAll('.form-group-delete');
    for (let i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', event => {
        event.preventDefault();

        const id = forms[i].dataset.id;

        const item = this._el.querySelector('.groups__group-' + id);
        item.parentNode.removeChild(item);

        Group.load(id).then(group => {
          Group.remove(id).then(() => {
            Group.loadAll().then(groups => {
              this.renderPartial('group-list', {
                groups,
              });
            });
          }).then(() => {
            PubSub.publish('notify', {
              title: 'List deleted',
              action: {
                name: 'undo',
                fn: () => {
                  return Promise.resolve().then(() => {
                    group.rev = null;
                    group.save().then(() => {
                      const docs = group.jots.map(jot => {
                        return {
                          _rev: null,
                          _id: jot.id,
                          dateAdded: jot._dateAdded,
                          fields: jot.fields,
                        };
                      });

                      const db = require('../db/db')();
                      return db.bulkDocs(docs).then(() => {
                        return Group.loadAll().then(groups => {
                          this.renderPartial('group-list', {
                            groups,
                          });
                          return true;
                        });
                      });
                    });
                  });
                },
                msg: 'List undeleted',
              },
            });
          });
        });
      });
    }
  }

  initUpdateForms() {
    const forms = this._el.querySelectorAll('.form-group-update');

    for (let i = 0; i < forms.length; i++) {
      forms[i].addEventListener('click', event => {
        event.stopPropagation();  // stop document listener from removing 'edit' class
      });

      forms[i].addEventListener('submit', event => {
        event.preventDefault();

        const id = forms[i].dataset.id;

        const name = forms[i].elements.name.value;
        const colour = forms[i].elements.colour.value;

        Group.load(id).then(group => {
          group.fields = {
            name,
            colour,
          };

          group.save().then(() => {
            Group.loadAll().then(groups => {
              this.renderPartial('group-list', {
                groups,
              });
            });
          });
        });
      });
    }
  }

}

module.exports = ViewGroups;
