const View = require('./view');

const PubSub = require('../utility/pubsub');

class NotificationManagerView extends View {
  constructor(container) {
    super(container);

    this._timer = null;

    PubSub.subscribe('notify', (topic, args) => this.showSyncNotification(args));
  }

  render(preRendered, params) {
    super.render(preRendered, params);

    this._subscriptions.push(PubSub.subscribe('notify', (topic, args) => {
      this.showSyncNotification(args);
    }));
  }

  showSyncNotification({
    title = false,
    body = false,
    action = false,
    duration = 5000
  }) {

    this.renderPartial('notification', {
      title,
      actionName: action ? action.name : false
    });

    if (action && action.fn) {
      const actionPrimary = this._el.querySelector('.md-snackbar__action--primary');
      if (actionPrimary) {
        actionPrimary.addEventListener('click', ev => {

          if (this._timer) {
            clearTimeout(this._timer);
          }

          action.fn().then(result => {
            this._el.querySelector('.md-snackbar-container').classList.remove('has-notification');
          });
        });
      }
    }

    this._el.querySelector('.md-snackbar-container').classList.add('has-notification');

    if (this._timer) {
      clearTimeout(this._timer);
    }

    this._timer = setTimeout(() => {
      this._el.querySelector('.md-snackbar-container').classList.remove('has-notification');
    }, duration);

  }

}

module.exports = NotificationManagerView;
