const View = require('./view');
const Handlebars = require('handlebars/dist/handlebars.runtime');
const ActionBar = require('./actionbar');
const PubSub = require('../utility/pubsub');

class TitleBarView extends View {

  constructor(template, partials, el) {
    super(template, el);
    this._partials = partials;

    this._user = null;

    this.registerWidget(ActionBar, partials['titlebar-title']);

    PubSub.subscribe('routeChanged', (topic, args) => this.updateName(args.name));
  }

  setUser(user) {
    this._user = user;
  }

  updateName(name) {
    this._name = name;
    this.renderPartial('titlebar-title', 'titlebar-title');
  }

  renderPartial(partialId, partialName) {
    const part = this._el.querySelector('#' + partialId);

    var template = Handlebars.template(this._partials[partialName]);
    part.outerHTML = template({
      name: this._name
    });

    this.initWidgets();
  }

  render(preRendered) {
    super.render(preRendered, {
      user: this._user,
      name: this._name
    });
  }

}

module.exports = TitleBarView;
