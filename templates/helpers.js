'use strict';

const Autolinker = require('autolinker');

const Handlebars = require('handlebars/dist/handlebars.runtime');

function ifEqual(conditional, equalTo, options) {
  if (conditional === equalTo) {
    return options.fn(this);
  }

  return options.inverse(this);
}

function ifNotEqual(conditional, equalTo, options) {
  if (conditional !== equalTo) {
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

function customAutolinkerFn(tagName) {
  return function customAutolinker(autolinker, match) {
    return new Autolinker.HtmlTag({
      tagName: tagName,
      attrs: {
        'data-href': match.getAnchorHref(),
        'data-target': '_blank',
      },
      innerHtml: match.getAnchorText(),
    }).addClass('autolinker');
  };
}

function autoLink(elem, options) {
  const url = Autolinker.link(Handlebars.escapeExpression(elem), {
    replaceFn: customAutolinkerFn('span'),
  });

  return new Handlebars.SafeString(url);
}

exports.ifEqual = ifEqual;
exports.ifNotEqual = ifNotEqual;
exports.ifIn = ifIn;
exports.autoLink = autoLink;
