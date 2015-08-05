const Widget = require('./widget');

class ColourSelector extends Widget {
  initEvents(el) {
    super.initEvents();

    const widgets = el.querySelectorAll('.partial-colour-selector');
    for (let widget of widgets) {
      const options = widget.querySelectorAll('.colour-selector__colour');
      const select = widget.querySelector('select');

      for (let option of options) {
        option.addEventListener('click', () => {
          this.unselectAll(options);
          option.classList.add('colour-selector__colour--current');
          select.value = option.dataset.value;
        });
      }
    }
  }

  unselectAll(options) {
    for (let option of options) {
      option.classList.remove('colour-selector__colour--current');
    }
  }
}

module.exports = ColourSelector;
