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

    for (let i = 0; i < widgets.length; i++) {
      const links = widgets[i].querySelectorAll('a');

      for (let index = 0; index < links.length; index++) {
        const link = links[index];
        const nextLink = links[(index + 1) % links.length];

        link.addEventListener('click', event => {
          event.preventDefault();

          PubSub.publish('orderChanged', {
            type: nextLink.dataset.type,
            direction: nextLink.dataset.direction,
          });

          link.classList.remove('current');
          nextLink.classList.add('current');
        });
      }
    }
  }

}

module.exports = ListOrder;
