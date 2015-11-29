class BrowserUtils {
  static detectOperaMini(ua) {
    return ua.indexOf('Opera Mini') > -1;
  }
}

module.exports = BrowserUtils;
