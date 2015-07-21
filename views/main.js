const View = require('./view');

class MainView extends View {
  constructor(template) {
    super(template, document.getElementById('view'));
  }
}

module.exports = MainView;
