'use strict';

const Handlebars = require('handlebars/dist/handlebars.runtime');

exports.ifEqual = ifEqual;
exports.ifIn = ifIn;
exports.autoLink = autoLink;

function ifEqual(conditional, equalTo, options) {
  if (conditional === equalTo) {
    return options.fn(this);
  }

  return options.inverse(this);
}

function ifIn(elem, arr, options) {
  if (arr.indexOf(elem) > -1) {
    return options.fn(this);
  }

  return options.inverse(this);
}

function autoLink(elem, options) {
  const url = Handlebars.escapeExpression(elem).autoLink();

  return new Handlebars.SafeString(url);
}
