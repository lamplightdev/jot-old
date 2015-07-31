class ViewContainer {
  constructor(elID, templates, partials) {
    this._el = document.getElementById(elID);

    this._templates = templates;
    this._partials = partials;

    this._currentView = null;
  }

  update(view, html) {
    if (this._currentView) {
      this._currentView.cleanup();
    }

    this._currentView = view;
    this._el.innerHTML = html;
  }
}

module.exports = ViewContainer;
