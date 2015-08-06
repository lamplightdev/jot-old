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
    const minutes = date.getMinutes();
    const hours = date.getHours();

    return this.getDays()[day] + ' ' + dayNum + ' ' + this.getMonths()[monthNum] + ' ' + hours + ':' + minutes;
  }
}

module.exports = DateUtils;
