class DateUtils {

  static getDays() {
    return [
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat'
    ];
  }

  static getMonths() {
    return [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
  }

  static format(date) {
    const day = date.getDay();
    const dayNum = date.getDate();
    const monthNum = date.getMonth();
    const minutes = this._pad(date.getMinutes(), 2);
    const hours = this._pad(date.getHours(), 2);

    return this.getDays()[day] + ' ' + dayNum + ' ' + this.getMonths()[monthNum] + ' ' + hours + ':' + minutes;
  }

  static _pad(num, size) {
    const s = '000000000' + num;
    return s.substr(s.length - size);
  }
}

module.exports = DateUtils;
