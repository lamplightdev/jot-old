const Widget = require('./widget');

const PubSub = require('../utility/pubsub');

class ListOrder extends Widget {
  initEvents(el) {
    super.initEvents();

    let widgets;
    if (el.classList.contains('partial-list-order')) {
      widgets = [el];
    } else {
      widgets = el.querySelectorAll('.partial-list-order');
    }

    for (let widget of widgets) {
      const links = widget.querySelectorAll('a');

      for (let link of links) {
        link.addEventListener('click', event => {
          event.preventDefault();

          const oldDirection = link.dataset.direction;
          const newDirection = oldDirection === 'asc' ? 'desc' : 'asc';

          PubSub.publish('orderChanged', {
            type: link.dataset.type,
            direction: newDirection
          });

          link.dataset.direction = newDirection;
        });
      }
    }
  }

}

module.exports = ListOrder;
