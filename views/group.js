const View = require('./view');

const Jot = require('../models/jot');
const Group = require('../models/group');

const GroupPreferences = require('../preferences/group');

const ColourSelectorWidget = require('./colour-selector');

const PubSub = require('../utility/pubsub');

class ViewGroup extends View {
  constructor(container) {
    super(container);

    this.registerWidget(ColourSelectorWidget);

    this._showDone = false;

    this._preferences = new GroupPreferences();
  }

  setShowDone(done) {
    this._showDone = done;
  }

  render(preRendered, params) {
    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('update', (topic, args) => {
      if (args.changes && args.changes.length) {
        Group.load(params.user, params.group.id).then(group => {
          this.renderPartial('jot-list', {
            group,
            user: params.user,
          });
        });
      }
    }));

    this._subscriptions.push(PubSub.subscribe('orderChanged', (topic, args) => {
      this._preferences.setOrder(args.type, args.direction);
      this.renderPartial('jot-list', this.lastParams);
    }));

    this._addDocumentListener('unselectAll', 'click', () => {
      this.unselectAll();
    });
  }

  renderPartial(name, params) {
    switch (name) {
    case 'jot-list':
      params.jots = params.group.getJots(this._showDone);
      params.jots = this._preferences.order(params.jots);
      break;
    default:
      break;
    }

    const el = super.renderPartial(name, params);

    switch (name) {
    case 'jot-list':
      this.initEdit();
      this.initDeleteForms(params.user);
      this.initUpdateForms(params.user);
      this.initAutolinks();
      this.initWidgets(el);
      break;
    default:
      break;
    }
  }

  initEvents(params) {
    super.initEvents();

    this.initAddForm(params.user);
    this.initEdit();
    this.initDeleteForms(params.user);
    this.initUpdateForms(params.user);
    this.initAutolinks();
  }

  initAddForm(user) {
    const form = this._el.querySelector('.form-jot-add');
    if (form) {
      form.addEventListener('submit', event => {
        event.preventDefault();

        const contentField = form.elements.content;
        const content = contentField.value;

        const groupField = form.elements.group;
        const group = groupField.value;

        const priority = form.elements.priority.value;

        new Jot({
          fields: {
            content,
            group,
            priority,
          },
        }).save(user).then(() => {
          contentField.value = '';
          contentField.blur();
          this.unselectAll();
          Group.load(user, group).then(updatedGroup => {
            this.renderPartial('jot-list', {
              group: updatedGroup,
              user,
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
  }

  initEdit() {
    const links = this._el.querySelectorAll('.jots__jot__edit');
    for (let i = 0; i < links.length; i++) {
      links[i].addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();  // stop document listener from removing 'edit' class

        const id = links[i].dataset.id;
        const item = this._el.querySelector('.jots__jot-' + id);

        if (!item.classList.contains('edit')) {
          this.unselectAll();

          item.classList.add('edit');
        } else {
          this.unselectAll();
        }
      });
    }
  }

  unselectAll() {
    // TODO: have class member to hold reference to common element/element groups to avoid requerying
    const items = this._el.querySelectorAll('.jots__jot');
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('edit');
    }

    const shows = this._el.querySelectorAll('.show-on-focus');
    for (let i = 0; i < shows.length; i++) {
      shows[i].classList.remove('show');
    }
  }

  initDeleteForms(user) {
    const forms = this._el.querySelectorAll('.form-jot-delete');
    for (let i = 0; i < forms.length; i++) {
      forms[i].addEventListener('submit', event => {
        event.preventDefault();

        const id = forms[i].dataset.id;
        const group = forms[i].dataset.groupId;

        const item = this._el.querySelector('.jots__jot-' + id);
        item.parentNode.removeChild(item);

        Jot.load(user, id).then(jot => {
          Jot.remove(user, id).then(() => {
            Group.load(user, group).then(updatedGroup => {
              this.renderPartial('jot-list', {
                group: updatedGroup,
                user,
              });
            });
          }).then(() => {
            PubSub.publish('notify', {
              title: 'Jot deleted',
              action: {
                name: 'undo',
                fn: () => {
                  return Promise.resolve().then(() => {
                    jot.rev = null;
                    jot.save(user).then(() => {
                      return Group.load(user, group).then(updatedGroup => {
                        this.renderPartial('jot-list', {
                          group: updatedGroup,
                          user,
                        });
                        return true;
                      });
                    });
                  });
                },
                msg: 'Jot undeleted',
              },
            });
          });
        });
      });
    }
  }

  initUpdateForms(user) {
    const forms = this._el.querySelectorAll('.form-jot-update');

    for (let i = 0; i < forms.length; i++) {
      const doneButton = forms[i].elements.done;
      const undoneButton = forms[i].elements.undone;

      if (doneButton) {
        doneButton.addEventListener('click', () => {
          forms[i].elements['done-status'].value = 'done';
        });
      }

      if (undoneButton) {
        undoneButton.addEventListener('click', () => {
          forms[i].elements['done-status'].value = 'undone';
        });
      }

      forms[i].addEventListener('click', event => {
        event.stopPropagation();  // stop document listener from removing 'edit' class
      });

      forms[i].addEventListener('submit', event => {
        event.preventDefault();

        const id = forms[i].dataset.id;

        const content = forms[i].elements.content.value;
        const group = forms[i].elements.group.value;
        const doneStatus = forms[i].elements['done-status'].value;
        const priority = forms[i].elements.priority.value;

        Jot.load(user, id).then(jot => {
          const currentFields = jot.fields;

          jot.fields = {
            content,
            group,
            priority,
          };

          if (doneStatus === 'done') {
            jot.fields.done = true;
          } else if (doneStatus === 'undone') {
            jot.fields.done = false;
          } else {
            jot.fields.done = currentFields.done;
          }

          jot.save(user).then(() => {
            Group.load(user, group).then(updatedGroup => {
              this.renderPartial('jot-list', {
                group: updatedGroup,
                user,
              });
            });
          });
        });
      });
    }
  }

  initAutolinks() {
    const spanLinks = this._el.querySelectorAll('.autolinker');

    for (let i = 0; i < spanLinks.length; i++) {
      spanLinks[i].addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        window.open(spanLinks[i].dataset.href, spanLinks[i].dataset.target);
      });
    }
  }
}

module.exports = ViewGroup;
