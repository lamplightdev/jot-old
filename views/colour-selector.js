const Widget = require('./widget');

class ColourSelector extends Widget {
  initEvents(el) {
    super.initEvents();

    const widgets = el.querySelectorAll('.partial-colour-selector');
    for (let i = 0; i < widgets.length; i++) {
      const options = widgets[i].querySelectorAll('.colour-selector__colour');
      const select = widgets[i].querySelector('select');

      for (let j = 0; j < options.length; j++) {
        options[j].addEventListener('click', () => {
          this.unselectAll(options);
          options[j].classList.add('colour-selector__colour--current');
          select.value = options[j].dataset.value;
        });
      }
    }
  }

  unselectAll(options) {
    for (let i = 0; i < options.length; i++) {
      options[i].classList.remove('colour-selector__colour--current');
    }
  }
}

module.exports = ColourSelector;
