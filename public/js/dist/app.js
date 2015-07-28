"use strict";var _get=function get(_x11,_x12,_x13){var _again=true;_function: while(_again) {var object=_x11,property=_x12,receiver=_x13;desc = parent = getter = undefined;_again = false;if(object === null)object = Function.prototype;var desc=Object.getOwnPropertyDescriptor(object,property);if(desc === undefined){var parent=Object.getPrototypeOf(object);if(parent === null){return undefined;}else {_x11 = parent;_x12 = property;_x13 = receiver;_again = true;continue _function;}}else if("value" in desc){return desc.value;}else {var getter=desc.get;if(getter === undefined){return undefined;}return getter.call(receiver);}}};var _createClass=(function(){function defineProperties(target,props){for(var i=0;i < props.length;i++) {var descriptor=props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if("value" in descriptor)descriptor.writable = true;Object.defineProperty(target,descriptor.key,descriptor);}}return function(Constructor,protoProps,staticProps){if(protoProps)defineProperties(Constructor.prototype,protoProps);if(staticProps)defineProperties(Constructor,staticProps);return Constructor;};})();function _inherits(subClass,superClass){if(typeof superClass !== "function" && superClass !== null){throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);}subClass.prototype = Object.create(superClass && superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)subClass.__proto__ = superClass;}function _classCallCheck(instance,Constructor){if(!(instance instanceof Constructor)){throw new TypeError("Cannot call a class as a function");}}(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require == "function" && require;if(!u && a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '" + o + "'");throw (f.code = "MODULE_NOT_FOUND",f);}var l=n[o] = {exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e);},l,l.exports,e,t,n,r);}return n[o].exports;}var i=typeof require == "function" && require;for(var o=0;o < r.length;o++) s(r[o]);return s;})({1:[function(require,module,exports){'use strict';var PubSub=require('../utility/pubsub');var DB=(function(){function DB(){_classCallCheck(this,DB);this._remoteCouch = null;this._db = null;}_createClass(DB,[{key:"init",value:function init(options){var _this=this;options = options || {protocol:null,domain:null,port:null,username:null,password:null,dbName:null};this._remoteCouch = options.protocol + '://';if(options.username){this._remoteCouch += options.username;}if(options.password){this._remoteCouch += ':' + options.password;}if(options.username || options.password){this._remoteCouch += '@';}this._remoteCouch += options.domain;if(options.port){this._remoteCouch += ':' + options.port;}this._remoteCouch += '/' + options.dbName;if(typeof PouchDB !== 'undefined'){(function(){ //browser
PouchDB.debug.disable();_this._db = new PouchDB(options.dbName,{auto_compaction:true});var opts={live:true,retry:true};_this._db.replicate.to(_this._remoteCouch,opts).on('change',function(info){console.log('browser replicate to change');}).on('paused',function(){console.log('browser replicate to paused');}).on('active',function(){console.log('browser replicate to active');}).on('denied',function(info){console.log('browser replicate to denied',info);}).on('complete',function(info){console.log('browser replicate to complete');}).on('error',function(err){console.log('browser replicate to error',err);});var changes=[];_this._db.replicate.from(_this._remoteCouch,opts).on('change',function(info){console.log('browser replicate from change',info);changes = changes.concat(info.docs);}).on('paused',function(){console.log('browser replicate from paused');PubSub.publish('update',{changes:changes});changes = [];}).on('active',function(){console.log('browser replicate from active');}).on('denied',function(info){console.log('browser replicate from denied',info);}).on('complete',function(info){console.log('browser replicate from complete',info);}).on('error',function(err){console.log('browser replicate from error',err);});})();}else {var _PouchDB=require('pouchdb'); //PouchDB.plugin(require('pouchdb-find'));
_PouchDB.debug.disable();this._db = new _PouchDB(this._remoteCouch);}}},{key:"db",get:function get(){return this._db;}}]);return DB;})();var db=new DB();module.exports = function(options){if(options){db.init(options);return db.db;}else {return db.db;}};},{"../utility/pubsub":24,"pouchdb":6}],2:[function(require,module,exports){var Model=require('./model');var Jot=require('./jot');var Group=(function(_Model){_inherits(Group,_Model);function Group(members){_classCallCheck(this,Group);_get(Object.getPrototypeOf(Group.prototype),"constructor",this).call(this,members,['name']);this.getJots();}_createClass(Group,[{key:"getJots",value:function getJots(){return Jot.getForGroup(this.id);}}]);return Group;})(Model);module.exports = Group;},{"./jot":3,"./model":4}],3:[function(require,module,exports){var Model=require('./model');var Jot=(function(_Model2){_inherits(Jot,_Model2);function Jot(members){_classCallCheck(this,Jot);_get(Object.getPrototypeOf(Jot.prototype),"constructor",this).call(this,members,['content','group','done']);}_createClass(Jot,null,[{key:"loadAll",value:function loadAll(){return _get(Object.getPrototypeOf(Jot),"loadAll",this).call(this).then(function(jots){var undoneJots=[];var doneJots=[];jots.forEach(function(jot){if(jot.isDone()){doneJots.push(jot);}else {undoneJots.push(jot);}});return undoneJots.concat(doneJots);});}},{key:"getForGroup",value:function getForGroup(groupId){var _this2=this;var db=require('../db/db')();var ddoc={_id:'_design/index',views:{group:{map:(function(doc){if(doc.fields.group){emit(doc.fields.group);}}).toString()}}};db.put(ddoc)["catch"](function(err){if(err.status !== 409){throw err;}}).then(function(){return db.query('index/group',{endkey:_this2.getRefName() + '-',startkey:_this2.getRefName() + "-￿",descending:true,key:groupId,include_docs:true});}).then(function(result){console.log('fetch: ',result);});}}]);return Jot;})(Model);module.exports = Jot;},{"../db/db":1,"./model":4}],4:[function(require,module,exports){var Model=(function(){function Model(members,allowedFields){_classCallCheck(this,Model);this._db = require('../db/db')();this._id = members._id || null;this._rev = members._rev || null;this._fields = members.fields || {};this._allowedFields = allowedFields;}_createClass(Model,[{key:"isNew",value:function isNew(){return !this.id;}},{key:"isDone",value:function isDone(){return this.fields.done;}},{key:"getSlug",value:function getSlug(){var _this3=this;if(!this.isNew()){return Promise.resolve(this.id);}else {var _ret2=(function(){var slug=_this3.refName + '-';var padding=5; //the length of the number, e.g. '5' will start at 00000, 00001, etc.
return {v:_this3._db.allDocs({startkey:slug + "￿",endKey:slug,descending:true,limit:1}).then(function(result){if(result.rows.length > 0){var lastDoc=result.rows[result.rows.length - 1];var lastNum=parseInt(lastDoc.id.substring(slug.length),10);return slug + ('0'.repeat(padding) + (lastNum + 1)).slice(-padding);}else {return slug + '0'.repeat(padding);}})};})();if(typeof _ret2 === "object")return _ret2.v;}}},{key:"save",value:function save(){var _this4=this;return this.getSlug().then(function(slug){var params={_id:slug,fields:_this4.fields};if(!_this4.isNew()){params._rev = _this4.rev;}return _this4._db.put(params).then(function(response){if(response.ok){_this4.id = response.id;_this4.rev = response.rev;return true;}else {return false;}});});}},{key:"refName",get:function get(){return this.constructor.getRefName();}},{key:"id",get:function get(){return this._id;},set:function set(id){this._id = id;return this;}},{key:"rev",get:function get(){return this._rev;},set:function set(rev){this._rev = rev;return this;}},{key:"fields",set:function set(fields){this._fields = {};for(var fieldName in fields) {if(this._allowedFields.indexOf(fieldName) > -1){this._fields[fieldName] = fields[fieldName];}}return this;},get:function get(){return this._fields;}}],[{key:"getRefName",value:function getRefName(){return this.name.toLowerCase();}},{key:"loadAll",value:function loadAll(){var _this5=this;var db=require('../db/db')();return db.allDocs({endkey:this.getRefName() + '-',startkey:this.getRefName() + "-￿",include_docs:true,descending:true}).then(function(result){var models=[];result.rows.forEach(function(row){models.push(new _this5(row.doc));});return models;});}},{key:"load",value:function load(id){var _this6=this;var db=require('../db/db')();return db.get(id).then(function(doc){return new _this6(doc);});}},{key:"remove",value:function remove(id){var db=require('../db/db')();return db.get(id).then(function(doc){return db.remove(doc);});}}]);return Model;})();module.exports = Model;},{"../db/db":1}],5:[function(require,module,exports){(function(root,factory){if(typeof define === 'function' && define.amd){ // AMD. Register as an anonymous module unless amdModuleId is set
define([],function(){return root['Autolinker'] = factory();});}else if(typeof exports === 'object'){ // Node. Does not work with strict CommonJS, but
// only CommonJS-like environments that support module.exports,
// like Node.
module.exports = factory();}else {root['Autolinker'] = factory();}})(this,function(){ /*!
 * Autolinker.js
 * 0.18.1
 *
 * Copyright(c) 2015 Gregory Jacobs <greg@greg-jacobs.com>
 * MIT Licensed. http://www.opensource.org/licenses/mit-license.php
 *
 * https://github.com/gregjacobs/Autolinker.js
 */ /**
 * @class Autolinker
 * @extends Object
 *
 * Utility class used to process a given string of text, and wrap the matches in
 * the appropriate anchor (&lt;a&gt;) tags to turn them into links.
 *
 * Any of the configuration options may be provided in an Object (map) provided
 * to the Autolinker constructor, which will configure how the {@link #link link()}
 * method will process the links.
 *
 * For example:
 *
 *     var autolinker = new Autolinker( {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *
 *     var html = autolinker.link( "Joe went to www.yahoo.com" );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 *
 *
 * The {@link #static-link static link()} method may also be used to inline options into a single call, which may
 * be more convenient for one-off uses. For example:
 *
 *     var html = Autolinker.link( "Joe went to www.yahoo.com", {
 *         newWindow : false,
 *         truncate  : 30
 *     } );
 *     // produces: 'Joe went to <a href="http://www.yahoo.com">yahoo.com</a>'
 *
 *
 * ## Custom Replacements of Links
 *
 * If the configuration options do not provide enough flexibility, a {@link #replaceFn}
 * may be provided to fully customize the output of Autolinker. This function is
 * called once for each URL/Email/Phone#/Twitter Handle/Hashtag match that is
 * encountered.
 *
 * For example:
 *
 *     var input = "...";  // string with URLs, Email Addresses, Phone #s, Twitter Handles, and Hashtags
 *
 *     var linkedText = Autolinker.link( input, {
 *         replaceFn : function( autolinker, match ) {
 *             console.log( "href = ", match.getAnchorHref() );
 *             console.log( "text = ", match.getAnchorText() );
 *
 *             switch( match.getType() ) {
 *                 case 'url' :
 *                     console.log( "url: ", match.getUrl() );
 *
 *                     if( match.getUrl().indexOf( 'mysite.com' ) === -1 ) {
 *                         var tag = autolinker.getTagBuilder().build( match );  // returns an `Autolinker.HtmlTag` instance, which provides mutator methods for easy changes
 *                         tag.setAttr( 'rel', 'nofollow' );
 *                         tag.addClass( 'external-link' );
 *
 *                         return tag;
 *
 *                     } else {
 *                         return true;  // let Autolinker perform its normal anchor tag replacement
 *                     }
 *
 *                 case 'email' :
 *                     var email = match.getEmail();
 *                     console.log( "email: ", email );
 *
 *                     if( email === "my@own.address" ) {
 *                         return false;  // don't auto-link this particular email address; leave as-is
 *                     } else {
 *                         return;  // no return value will have Autolinker perform its normal anchor tag replacement (same as returning `true`)
 *                     }
 *
 *                 case 'phone' :
 *                     var phoneNumber = match.getPhoneNumber();
 *                     console.log( phoneNumber );
 *
 *                     return '<a href="http://newplace.to.link.phone.numbers.to/">' + phoneNumber + '</a>';
 *
 *                 case 'twitter' :
 *                     var twitterHandle = match.getTwitterHandle();
 *                     console.log( twitterHandle );
 *
 *                     return '<a href="http://newplace.to.link.twitter.handles.to/">' + twitterHandle + '</a>';
 *
 *                 case 'hashtag' :
 *                     var hashtag = match.getHashtag();
 *                     console.log( hashtag );
 *
 *                     return '<a href="http://newplace.to.link.hashtag.handles.to/">' + hashtag + '</a>';
 *             }
 *         }
 *     } );
 *
 *
 * The function may return the following values:
 *
 * - `true` (Boolean): Allow Autolinker to replace the match as it normally would.
 * - `false` (Boolean): Do not replace the current match at all - leave as-is.
 * - Any String: If a string is returned from the function, the string will be used directly as the replacement HTML for
 *   the match.
 * - An {@link Autolinker.HtmlTag} instance, which can be used to build/modify an HTML tag before writing out its HTML text.
 *
 * @constructor
 * @param {Object} [config] The configuration options for the Autolinker instance, specified in an Object (map).
 */var Autolinker=function Autolinker(cfg){Autolinker.Util.assign(this,cfg); // assign the properties of `cfg` onto the Autolinker instance. Prototype properties will be used for missing configs.
// Validate the value of the `hashtag` cfg.
var hashtag=this.hashtag;if(hashtag !== false && hashtag !== 'twitter' && hashtag !== 'facebook'){throw new Error("invalid `hashtag` cfg - see docs");}};Autolinker.prototype = {constructor:Autolinker, // fix constructor property
/**
	 * @cfg {Boolean} urls
	 *
	 * `true` if miscellaneous URLs should be automatically linked, `false` if they should not be.
	 */urls:true, /**
	 * @cfg {Boolean} email
	 *
	 * `true` if email addresses should be automatically linked, `false` if they should not be.
	 */email:true, /**
	 * @cfg {Boolean} twitter
	 *
	 * `true` if Twitter handles ("@example") should be automatically linked, `false` if they should not be.
	 */twitter:true, /**
	 * @cfg {Boolean} phone
	 *
	 * `true` if Phone numbers ("(555)555-5555") should be automatically linked, `false` if they should not be.
	 */phone:true, /**
	 * @cfg {Boolean/String} hashtag
	 *
	 * A string for the service name to have hashtags (ex: "#myHashtag")
	 * auto-linked to. The currently-supported values are:
	 *
	 * - 'twitter'
	 * - 'facebook'
	 *
	 * Pass `false` to skip auto-linking of hashtags.
	 */hashtag:false, /**
	 * @cfg {Boolean} newWindow
	 *
	 * `true` if the links should open in a new window, `false` otherwise.
	 */newWindow:true, /**
	 * @cfg {Boolean} stripPrefix
	 *
	 * `true` if 'http://' or 'https://' and/or the 'www.' should be stripped
	 * from the beginning of URL links' text, `false` otherwise.
	 */stripPrefix:true, /**
	 * @cfg {Number} truncate
	 *
	 * A number for how many characters long matched text should be truncated to inside the text of
	 * a link. If the matched text is over this number of characters, it will be truncated to this length by
	 * adding a two period ellipsis ('..') to the end of the string.
	 *
	 * For example: A url like 'http://www.yahoo.com/some/long/path/to/a/file' truncated to 25 characters might look
	 * something like this: 'yahoo.com/some/long/pat..'
	 */truncate:undefined, /**
	 * @cfg {String} className
	 *
	 * A CSS class name to add to the generated links. This class will be added to all links, as well as this class
	 * plus match suffixes for styling url/email/phone/twitter/hashtag links differently.
	 *
	 * For example, if this config is provided as "myLink", then:
	 *
	 * - URL links will have the CSS classes: "myLink myLink-url"
	 * - Email links will have the CSS classes: "myLink myLink-email", and
	 * - Twitter links will have the CSS classes: "myLink myLink-twitter"
	 * - Phone links will have the CSS classes: "myLink myLink-phone"
	 * - Hashtag links will have the CSS classes: "myLink myLink-hashtag"
	 */className:"", /**
	 * @cfg {Function} replaceFn
	 *
	 * A function to individually process each match found in the input string.
	 *
	 * See the class's description for usage.
	 *
	 * This function is called with the following parameters:
	 *
	 * @cfg {Autolinker} replaceFn.autolinker The Autolinker instance, which may be used to retrieve child objects from (such
	 *   as the instance's {@link #getTagBuilder tag builder}).
	 * @cfg {Autolinker.match.Match} replaceFn.match The Match instance which can be used to retrieve information about the
	 *   match that the `replaceFn` is currently processing. See {@link Autolinker.match.Match} subclasses for details.
	 */ /**
	 * @private
	 * @property {Autolinker.htmlParser.HtmlParser} htmlParser
	 *
	 * The HtmlParser instance used to skip over HTML tags, while finding text nodes to process. This is lazily instantiated
	 * in the {@link #getHtmlParser} method.
	 */htmlParser:undefined, /**
	 * @private
	 * @property {Autolinker.matchParser.MatchParser} matchParser
	 *
	 * The MatchParser instance used to find matches in the text nodes of an input string passed to
	 * {@link #link}. This is lazily instantiated in the {@link #getMatchParser} method.
	 */matchParser:undefined, /**
	 * @private
	 * @property {Autolinker.AnchorTagBuilder} tagBuilder
	 *
	 * The AnchorTagBuilder instance used to build match replacement anchor tags. Note: this is lazily instantiated
	 * in the {@link #getTagBuilder} method.
	 */tagBuilder:undefined, /**
	 * Automatically links URLs, Email addresses, Phone numbers, Twitter
	 * handles, and Hashtags found in the given chunk of HTML. Does not link
	 * URLs found within HTML tags.
	 *
	 * For instance, if given the text: `You should go to http://www.yahoo.com`,
	 * then the result will be `You should go to
	 * &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
	 *
	 * This method finds the text around any HTML elements in the input
	 * `textOrHtml`, which will be the text that is processed. Any original HTML
	 * elements will be left as-is, as well as the text that is already wrapped
	 * in anchor (&lt;a&gt;) tags.
	 *
	 * @param {String} textOrHtml The HTML or text to autolink matches within
	 *   (depending on if the {@link #urls}, {@link #email}, {@link #phone},
	 *   {@link #twitter}, and {@link #hashtag} options are enabled).
	 * @return {String} The HTML, with matches automatically linked.
	 */link:function link(textOrHtml){if(!textOrHtml){return "";} // handle `null` and `undefined`
var htmlParser=this.getHtmlParser(),htmlNodes=htmlParser.parse(textOrHtml),anchorTagStackCount=0, // used to only process text around anchor tags, and any inner text/html they may have
resultHtml=[];for(var i=0,len=htmlNodes.length;i < len;i++) {var node=htmlNodes[i],nodeType=node.getType(),nodeText=node.getText();if(nodeType === 'element'){ // Process HTML nodes in the input `textOrHtml`
if(node.getTagName() === 'a'){if(!node.isClosing()){ // it's the start <a> tag
anchorTagStackCount++;}else { // it's the end </a> tag
anchorTagStackCount = Math.max(anchorTagStackCount - 1,0); // attempt to handle extraneous </a> tags by making sure the stack count never goes below 0
}}resultHtml.push(nodeText); // now add the text of the tag itself verbatim
}else if(nodeType === 'entity' || nodeType === 'comment'){resultHtml.push(nodeText); // append HTML entity nodes (such as '&nbsp;') or HTML comments (such as '<!-- Comment -->') verbatim
}else { // Process text nodes in the input `textOrHtml`
if(anchorTagStackCount === 0){ // If we're not within an <a> tag, process the text node to linkify
var linkifiedStr=this.linkifyStr(nodeText);resultHtml.push(linkifiedStr);}else { // `text` is within an <a> tag, simply append the text - we do not want to autolink anything
// already within an <a>...</a> tag
resultHtml.push(nodeText);}}}return resultHtml.join("");}, /**
	 * Process the text that lies in between HTML tags, performing the anchor
	 * tag replacements for the matches, and returns the string with the
	 * replacements made.
	 *
	 * This method does the actual wrapping of matches with anchor tags.
	 *
	 * @private
	 * @param {String} str The string of text to auto-link.
	 * @return {String} The text with anchor tags auto-filled.
	 */linkifyStr:function linkifyStr(str){return this.getMatchParser().replace(str,this.createMatchReturnVal,this);}, /**
	 * Creates the return string value for a given match in the input string,
	 * for the {@link #linkifyStr} method.
	 *
	 * This method handles the {@link #replaceFn}, if one was provided.
	 *
	 * @private
	 * @param {Autolinker.match.Match} match The Match object that represents the match.
	 * @return {String} The string that the `match` should be replaced with. This is usually the anchor tag string, but
	 *   may be the `matchStr` itself if the match is not to be replaced.
	 */createMatchReturnVal:function createMatchReturnVal(match){ // Handle a custom `replaceFn` being provided
var replaceFnResult;if(this.replaceFn){replaceFnResult = this.replaceFn.call(this,this,match); // Autolinker instance is the context, and the first arg
}if(typeof replaceFnResult === 'string'){return replaceFnResult; // `replaceFn` returned a string, use that
}else if(replaceFnResult === false){return match.getMatchedText(); // no replacement for the match
}else if(replaceFnResult instanceof Autolinker.HtmlTag){return replaceFnResult.toAnchorString();}else { // replaceFnResult === true, or no/unknown return value from function
// Perform Autolinker's default anchor tag generation
var tagBuilder=this.getTagBuilder(),anchorTag=tagBuilder.build(match); // returns an Autolinker.HtmlTag instance
return anchorTag.toAnchorString();}}, /**
	 * Lazily instantiates and returns the {@link #htmlParser} instance for this Autolinker instance.
	 *
	 * @protected
	 * @return {Autolinker.htmlParser.HtmlParser}
	 */getHtmlParser:function getHtmlParser(){var htmlParser=this.htmlParser;if(!htmlParser){htmlParser = this.htmlParser = new Autolinker.htmlParser.HtmlParser();}return htmlParser;}, /**
	 * Lazily instantiates and returns the {@link #matchParser} instance for this Autolinker instance.
	 *
	 * @protected
	 * @return {Autolinker.matchParser.MatchParser}
	 */getMatchParser:function getMatchParser(){var matchParser=this.matchParser;if(!matchParser){matchParser = this.matchParser = new Autolinker.matchParser.MatchParser({urls:this.urls,email:this.email,twitter:this.twitter,phone:this.phone,hashtag:this.hashtag,stripPrefix:this.stripPrefix});}return matchParser;}, /**
	 * Returns the {@link #tagBuilder} instance for this Autolinker instance, lazily instantiating it
	 * if it does not yet exist.
	 *
	 * This method may be used in a {@link #replaceFn} to generate the {@link Autolinker.HtmlTag HtmlTag} instance that
	 * Autolinker would normally generate, and then allow for modifications before returning it. For example:
	 *
	 *     var html = Autolinker.link( "Test google.com", {
	 *         replaceFn : function( autolinker, match ) {
	 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance
	 *             tag.setAttr( 'rel', 'nofollow' );
	 *
	 *             return tag;
	 *         }
	 *     } );
	 *
	 *     // generated html:
	 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
	 *
	 * @return {Autolinker.AnchorTagBuilder}
	 */getTagBuilder:function getTagBuilder(){var tagBuilder=this.tagBuilder;if(!tagBuilder){tagBuilder = this.tagBuilder = new Autolinker.AnchorTagBuilder({newWindow:this.newWindow,truncate:this.truncate,className:this.className});}return tagBuilder;}}; /**
 * Automatically links URLs, Email addresses, Phone Numbers, Twitter handles,
 * and Hashtags found in the given chunk of HTML. Does not link URLs found
 * within HTML tags.
 *
 * For instance, if given the text: `You should go to http://www.yahoo.com`,
 * then the result will be `You should go to &lt;a href="http://www.yahoo.com"&gt;http://www.yahoo.com&lt;/a&gt;`
 *
 * Example:
 *
 *     var linkedText = Autolinker.link( "Go to google.com", { newWindow: false } );
 *     // Produces: "Go to <a href="http://google.com">google.com</a>"
 *
 * @static
 * @param {String} textOrHtml The HTML or text to find matches within (depending
 *   on if the {@link #urls}, {@link #email}, {@link #phone}, {@link #twitter},
 *   and {@link #hashtag} options are enabled).
 * @param {Object} [options] Any of the configuration options for the Autolinker
 *   class, specified in an Object (map). See the class description for an
 *   example call.
 * @return {String} The HTML text, with matches automatically linked.
 */Autolinker.link = function(textOrHtml,options){var autolinker=new Autolinker(options);return autolinker.link(textOrHtml);}; // Autolinker Namespaces
Autolinker.match = {};Autolinker.htmlParser = {};Autolinker.matchParser = {}; /*global Autolinker */ /*jshint eqnull:true, boss:true */ /**
 * @class Autolinker.Util
 * @singleton
 *
 * A few utility methods for Autolinker.
 */Autolinker.Util = { /**
	 * @property {Function} abstractMethod
	 *
	 * A function object which represents an abstract method.
	 */abstractMethod:function abstractMethod(){throw "abstract";}, /**
	 * @private
	 * @property {RegExp} trimRegex
	 *
	 * The regular expression used to trim the leading and trailing whitespace
	 * from a string.
	 */trimRegex:/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, /**
	 * Assigns (shallow copies) the properties of `src` onto `dest`.
	 *
	 * @param {Object} dest The destination object.
	 * @param {Object} src The source object.
	 * @return {Object} The destination object (`dest`)
	 */assign:function assign(dest,src){for(var prop in src) {if(src.hasOwnProperty(prop)){dest[prop] = src[prop];}}return dest;}, /**
	 * Extends `superclass` to create a new subclass, adding the `protoProps` to the new subclass's prototype.
	 *
	 * @param {Function} superclass The constructor function for the superclass.
	 * @param {Object} protoProps The methods/properties to add to the subclass's prototype. This may contain the
	 *   special property `constructor`, which will be used as the new subclass's constructor function.
	 * @return {Function} The new subclass function.
	 */extend:function extend(superclass,protoProps){var superclassProto=superclass.prototype;var F=function F(){};F.prototype = superclassProto;var subclass;if(protoProps.hasOwnProperty('constructor')){subclass = protoProps.constructor;}else {subclass = function(){superclassProto.constructor.apply(this,arguments);};}var subclassProto=subclass.prototype = new F(); // set up prototype chain
subclassProto.constructor = subclass; // fix constructor property
subclassProto.superclass = superclassProto;delete protoProps.constructor; // don't re-assign constructor property to the prototype, since a new function may have been created (`subclass`), which is now already there
Autolinker.Util.assign(subclassProto,protoProps);return subclass;}, /**
	 * Truncates the `str` at `len - ellipsisChars.length`, and adds the `ellipsisChars` to the
	 * end of the string (by default, two periods: '..'). If the `str` length does not exceed
	 * `len`, the string will be returned unchanged.
	 *
	 * @param {String} str The string to truncate and add an ellipsis to.
	 * @param {Number} truncateLen The length to truncate the string at.
	 * @param {String} [ellipsisChars=..] The ellipsis character(s) to add to the end of `str`
	 *   when truncated. Defaults to '..'
	 */ellipsis:function ellipsis(str,truncateLen,ellipsisChars){if(str.length > truncateLen){ellipsisChars = ellipsisChars == null?'..':ellipsisChars;str = str.substring(0,truncateLen - ellipsisChars.length) + ellipsisChars;}return str;}, /**
	 * Supports `Array.prototype.indexOf()` functionality for old IE (IE8 and below).
	 *
	 * @param {Array} arr The array to find an element of.
	 * @param {*} element The element to find in the array, and return the index of.
	 * @return {Number} The index of the `element`, or -1 if it was not found.
	 */indexOf:function indexOf(arr,element){if(Array.prototype.indexOf){return arr.indexOf(element);}else {for(var i=0,len=arr.length;i < len;i++) {if(arr[i] === element)return i;}return -1;}}, /**
	 * Performs the functionality of what modern browsers do when `String.prototype.split()` is called
	 * with a regular expression that contains capturing parenthesis.
	 *
	 * For example:
	 *
	 *     // Modern browsers:
	 *     "a,b,c".split( /(,)/ );  // --> [ 'a', ',', 'b', ',', 'c' ]
	 *
	 *     // Old IE (including IE8):
	 *     "a,b,c".split( /(,)/ );  // --> [ 'a', 'b', 'c' ]
	 *
	 * This method emulates the functionality of modern browsers for the old IE case.
	 *
	 * @param {String} str The string to split.
	 * @param {RegExp} splitRegex The regular expression to split the input `str` on. The splitting
	 *   character(s) will be spliced into the array, as in the "modern browsers" example in the
	 *   description of this method.
	 *   Note #1: the supplied regular expression **must** have the 'g' flag specified.
	 *   Note #2: for simplicity's sake, the regular expression does not need
	 *   to contain capturing parenthesis - it will be assumed that any match has them.
	 * @return {String[]} The split array of strings, with the splitting character(s) included.
	 */splitAndCapture:function splitAndCapture(str,splitRegex){if(!splitRegex.global)throw new Error("`splitRegex` must have the 'g' flag set");var result=[],lastIdx=0,match;while(match = splitRegex.exec(str)) {result.push(str.substring(lastIdx,match.index));result.push(match[0]); // push the splitting char(s)
lastIdx = match.index + match[0].length;}result.push(str.substring(lastIdx));return result;}, /**
	 * Trims the leading and trailing whitespace from a string.
	 *
	 * @param {String} str The string to trim.
	 * @return {String}
	 */trim:function trim(str){return str.replace(this.trimRegex,'');}}; /*global Autolinker */ /*jshint boss:true */ /**
 * @class Autolinker.HtmlTag
 * @extends Object
 *
 * Represents an HTML tag, which can be used to easily build/modify HTML tags programmatically.
 *
 * Autolinker uses this abstraction to create HTML tags, and then write them out as strings. You may also use
 * this class in your code, especially within a {@link Autolinker#replaceFn replaceFn}.
 *
 * ## Examples
 *
 * Example instantiation:
 *
 *     var tag = new Autolinker.HtmlTag( {
 *         tagName : 'a',
 *         attrs   : { 'href': 'http://google.com', 'class': 'external-link' },
 *         innerHtml : 'Google'
 *     } );
 *
 *     tag.toAnchorString();  // <a href="http://google.com" class="external-link">Google</a>
 *
 *     // Individual accessor methods
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 *
 *
 * Using mutator methods (which may be used in combination with instantiation config properties):
 *
 *     var tag = new Autolinker.HtmlTag();
 *     tag.setTagName( 'a' );
 *     tag.setAttr( 'href', 'http://google.com' );
 *     tag.addClass( 'external-link' );
 *     tag.setInnerHtml( 'Google' );
 *
 *     tag.getTagName();                 // 'a'
 *     tag.getAttr( 'href' );            // 'http://google.com'
 *     tag.hasClass( 'external-link' );  // true
 *
 *     tag.toAnchorString();  // <a href="http://google.com" class="external-link">Google</a>
 *
 *
 * ## Example use within a {@link Autolinker#replaceFn replaceFn}
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance, configured with the Match's href and anchor text
 *             tag.setAttr( 'rel', 'nofollow' );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 *
 *
 * ## Example use with a new tag for the replacement
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = new Autolinker.HtmlTag( {
 *                 tagName : 'button',
 *                 attrs   : { 'title': 'Load URL: ' + match.getAnchorHref() },
 *                 innerHtml : 'Load URL: ' + match.getAnchorText()
 *             } );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <button title="Load URL: http://google.com">Load URL: google.com</button>
 */Autolinker.HtmlTag = Autolinker.Util.extend(Object,{ /**
	 * @cfg {String} tagName
	 *
	 * The tag name. Ex: 'a', 'button', etc.
	 *
	 * Not required at instantiation time, but should be set using {@link #setTagName} before {@link #toAnchorString}
	 * is executed.
	 */ /**
	 * @cfg {Object.<String, String>} attrs
	 *
	 * An key/value Object (map) of attributes to create the tag with. The keys are the attribute names, and the
	 * values are the attribute values.
	 */ /**
	 * @cfg {String} innerHtml
	 *
	 * The inner HTML for the tag.
	 *
	 * Note the camel case name on `innerHtml`. Acronyms are camelCased in this utility (such as not to run into the acronym
	 * naming inconsistency that the DOM developers created with `XMLHttpRequest`). You may alternatively use {@link #innerHTML}
	 * if you prefer, but this one is recommended.
	 */ /**
	 * @cfg {String} innerHTML
	 *
	 * Alias of {@link #innerHtml}, accepted for consistency with the browser DOM api, but prefer the camelCased version
	 * for acronym names.
	 */ /**
	 * @protected
	 * @property {RegExp} whitespaceRegex
	 *
	 * Regular expression used to match whitespace in a string of CSS classes.
	 */whitespaceRegex:/\s+/, /**
	 * @constructor
	 * @param {Object} [cfg] The configuration properties for this class, in an Object (map)
	 */constructor:function constructor(cfg){Autolinker.Util.assign(this,cfg);this.innerHtml = this.innerHtml || this.innerHTML; // accept either the camelCased form or the fully capitalized acronym
}, /**
	 * Sets the tag name that will be used to generate the tag with.
	 *
	 * @param {String} tagName
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */setTagName:function setTagName(tagName){this.tagName = tagName;return this;}, /**
	 * Retrieves the tag name.
	 *
	 * @return {String}
	 */getTagName:function getTagName(){return this.tagName || "";}, /**
	 * Sets an attribute on the HtmlTag.
	 *
	 * @param {String} attrName The attribute name to set.
	 * @param {String} attrValue The attribute value to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */setAttr:function setAttr(attrName,attrValue){var tagAttrs=this.getAttrs();tagAttrs[attrName] = attrValue;return this;}, /**
	 * Retrieves an attribute from the HtmlTag. If the attribute does not exist, returns `undefined`.
	 *
	 * @param {String} name The attribute name to retrieve.
	 * @return {String} The attribute's value, or `undefined` if it does not exist on the HtmlTag.
	 */getAttr:function getAttr(attrName){return this.getAttrs()[attrName];}, /**
	 * Sets one or more attributes on the HtmlTag.
	 *
	 * @param {Object.<String, String>} attrs A key/value Object (map) of the attributes to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */setAttrs:function setAttrs(attrs){var tagAttrs=this.getAttrs();Autolinker.Util.assign(tagAttrs,attrs);return this;}, /**
	 * Retrieves the attributes Object (map) for the HtmlTag.
	 *
	 * @return {Object.<String, String>} A key/value object of the attributes for the HtmlTag.
	 */getAttrs:function getAttrs(){return this.attrs || (this.attrs = {});}, /**
	 * Sets the provided `cssClass`, overwriting any current CSS classes on the HtmlTag.
	 *
	 * @param {String} cssClass One or more space-separated CSS classes to set (overwrite).
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */setClass:function setClass(cssClass){return this.setAttr('class',cssClass);}, /**
	 * Convenience method to add one or more CSS classes to the HtmlTag. Will not add duplicate CSS classes.
	 *
	 * @param {String} cssClass One or more space-separated CSS classes to add.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */addClass:function addClass(cssClass){var classAttr=this.getClass(),whitespaceRegex=this.whitespaceRegex,indexOf=Autolinker.Util.indexOf, // to support IE8 and below
classes=!classAttr?[]:classAttr.split(whitespaceRegex),newClasses=cssClass.split(whitespaceRegex),newClass;while(newClass = newClasses.shift()) {if(indexOf(classes,newClass) === -1){classes.push(newClass);}}this.getAttrs()['class'] = classes.join(" ");return this;}, /**
	 * Convenience method to remove one or more CSS classes from the HtmlTag.
	 *
	 * @param {String} cssClass One or more space-separated CSS classes to remove.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */removeClass:function removeClass(cssClass){var classAttr=this.getClass(),whitespaceRegex=this.whitespaceRegex,indexOf=Autolinker.Util.indexOf, // to support IE8 and below
classes=!classAttr?[]:classAttr.split(whitespaceRegex),removeClasses=cssClass.split(whitespaceRegex),removeClass;while(classes.length && (removeClass = removeClasses.shift())) {var idx=indexOf(classes,removeClass);if(idx !== -1){classes.splice(idx,1);}}this.getAttrs()['class'] = classes.join(" ");return this;}, /**
	 * Convenience method to retrieve the CSS class(es) for the HtmlTag, which will each be separated by spaces when
	 * there are multiple.
	 *
	 * @return {String}
	 */getClass:function getClass(){return this.getAttrs()['class'] || "";}, /**
	 * Convenience method to check if the tag has a CSS class or not.
	 *
	 * @param {String} cssClass The CSS class to check for.
	 * @return {Boolean} `true` if the HtmlTag has the CSS class, `false` otherwise.
	 */hasClass:function hasClass(cssClass){return (' ' + this.getClass() + ' ').indexOf(' ' + cssClass + ' ') !== -1;}, /**
	 * Sets the inner HTML for the tag.
	 *
	 * @param {String} html The inner HTML to set.
	 * @return {Autolinker.HtmlTag} This HtmlTag instance, so that method calls may be chained.
	 */setInnerHtml:function setInnerHtml(html){this.innerHtml = html;return this;}, /**
	 * Retrieves the inner HTML for the tag.
	 *
	 * @return {String}
	 */getInnerHtml:function getInnerHtml(){return this.innerHtml || "";}, /**
	 * Override of superclass method used to generate the HTML string for the tag.
	 *
	 * @return {String}
	 */toAnchorString:function toAnchorString(){var tagName=this.getTagName(),attrsStr=this.buildAttrsStr();attrsStr = attrsStr?' ' + attrsStr:''; // prepend a space if there are actually attributes
return ['<',tagName,attrsStr,'>',this.getInnerHtml(),'</',tagName,'>'].join("");}, /**
	 * Support method for {@link #toAnchorString}, returns the string space-separated key="value" pairs, used to populate
	 * the stringified HtmlTag.
	 *
	 * @protected
	 * @return {String} Example return: `attr1="value1" attr2="value2"`
	 */buildAttrsStr:function buildAttrsStr(){if(!this.attrs)return ""; // no `attrs` Object (map) has been set, return empty string
var attrs=this.getAttrs(),attrsArr=[];for(var prop in attrs) {if(attrs.hasOwnProperty(prop)){attrsArr.push(prop + '="' + attrs[prop] + '"');}}return attrsArr.join(" ");}}); /*global Autolinker */ /*jshint sub:true */ /**
 * @protected
 * @class Autolinker.AnchorTagBuilder
 * @extends Object
 *
 * Builds anchor (&lt;a&gt;) tags for the Autolinker utility when a match is found.
 *
 * Normally this class is instantiated, configured, and used internally by an {@link Autolinker} instance, but may
 * actually be retrieved in a {@link Autolinker#replaceFn replaceFn} to create {@link Autolinker.HtmlTag HtmlTag} instances
 * which may be modified before returning from the {@link Autolinker#replaceFn replaceFn}. For example:
 *
 *     var html = Autolinker.link( "Test google.com", {
 *         replaceFn : function( autolinker, match ) {
 *             var tag = autolinker.getTagBuilder().build( match );  // returns an {@link Autolinker.HtmlTag} instance
 *             tag.setAttr( 'rel', 'nofollow' );
 *
 *             return tag;
 *         }
 *     } );
 *
 *     // generated html:
 *     //   Test <a href="http://google.com" target="_blank" rel="nofollow">google.com</a>
 */Autolinker.AnchorTagBuilder = Autolinker.Util.extend(Object,{ /**
	 * @cfg {Boolean} newWindow
	 * @inheritdoc Autolinker#newWindow
	 */ /**
	 * @cfg {Number} truncate
	 * @inheritdoc Autolinker#truncate
	 */ /**
	 * @cfg {String} className
	 * @inheritdoc Autolinker#className
	 */ /**
	 * @constructor
	 * @param {Object} [cfg] The configuration options for the AnchorTagBuilder instance, specified in an Object (map).
	 */constructor:function constructor(cfg){Autolinker.Util.assign(this,cfg);}, /**
	 * Generates the actual anchor (&lt;a&gt;) tag to use in place of the
	 * matched text, via its `match` object.
	 *
	 * @param {Autolinker.match.Match} match The Match instance to generate an
	 *   anchor tag from.
	 * @return {Autolinker.HtmlTag} The HtmlTag instance for the anchor tag.
	 */build:function build(match){var tag=new Autolinker.HtmlTag({tagName:'a',attrs:this.createAttrs(match.getType(),match.getAnchorHref()),innerHtml:this.processAnchorText(match.getAnchorText())});return tag;}, /**
	 * Creates the Object (map) of the HTML attributes for the anchor (&lt;a&gt;)
	 *   tag being generated.
	 *
	 * @protected
	 * @param {"url"/"email"/"phone"/"twitter"/"hashtag"} matchType The type of
	 *   match that an anchor tag is being generated for.
	 * @param {String} href The href for the anchor tag.
	 * @return {Object} A key/value Object (map) of the anchor tag's attributes.
	 */createAttrs:function createAttrs(matchType,anchorHref){var attrs={'href':anchorHref // we'll always have the `href` attribute
};var cssClass=this.createCssClass(matchType);if(cssClass){attrs['class'] = cssClass;}if(this.newWindow){attrs['target'] = "_blank";}return attrs;}, /**
	 * Creates the CSS class that will be used for a given anchor tag, based on
	 * the `matchType` and the {@link #className} config.
	 *
	 * @private
	 * @param {"url"/"email"/"phone"/"twitter"/"hashtag"} matchType The type of
	 *   match that an anchor tag is being generated for.
	 * @return {String} The CSS class string for the link. Example return:
	 *   "myLink myLink-url". If no {@link #className} was configured, returns
	 *   an empty string.
	 */createCssClass:function createCssClass(matchType){var className=this.className;if(!className)return "";else return className + " " + className + "-" + matchType; // ex: "myLink myLink-url", "myLink myLink-email", "myLink myLink-phone", "myLink myLink-twitter", or "myLink myLink-hashtag"
}, /**
	 * Processes the `anchorText` by truncating the text according to the
	 * {@link #truncate} config.
	 *
	 * @private
	 * @param {String} anchorText The anchor tag's text (i.e. what will be
	 *   displayed).
	 * @return {String} The processed `anchorText`.
	 */processAnchorText:function processAnchorText(anchorText){anchorText = this.doTruncate(anchorText);return anchorText;}, /**
	 * Performs the truncation of the `anchorText`, if the `anchorText` is
	 * longer than the {@link #truncate} option. Truncates the text to 2
	 * characters fewer than the {@link #truncate} option, and adds ".." to the
	 * end.
	 *
	 * @private
	 * @param {String} text The anchor tag's text (i.e. what will be displayed).
	 * @return {String} The truncated anchor text.
	 */doTruncate:function doTruncate(anchorText){return Autolinker.Util.ellipsis(anchorText,this.truncate || Number.POSITIVE_INFINITY);}}); /*global Autolinker */ /**
 * @private
 * @class Autolinker.htmlParser.HtmlParser
 * @extends Object
 *
 * An HTML parser implementation which simply walks an HTML string and returns an array of
 * {@link Autolinker.htmlParser.HtmlNode HtmlNodes} that represent the basic HTML structure of the input string.
 *
 * Autolinker uses this to only link URLs/emails/Twitter handles within text nodes, effectively ignoring / "walking
 * around" HTML tags.
 */Autolinker.htmlParser.HtmlParser = Autolinker.Util.extend(Object,{ /**
	 * @private
	 * @property {RegExp} htmlRegex
	 *
	 * The regular expression used to pull out HTML tags from a string. Handles namespaced HTML tags and
	 * attribute names, as specified by http://www.w3.org/TR/html-markup/syntax.html.
	 *
	 * Capturing groups:
	 *
	 * 1. The "!DOCTYPE" tag name, if a tag is a &lt;!DOCTYPE&gt; tag.
	 * 2. If it is an end tag, this group will have the '/'.
	 * 3. If it is a comment tag, this group will hold the comment text (i.e.
	 *    the text inside the `&lt;!--` and `--&gt;`.
	 * 4. The tag name for all tags (other than the &lt;!DOCTYPE&gt; tag)
	 */htmlRegex:(function(){var commentTagRegex=/!--([\s\S]+?)--/,tagNameRegex=/[0-9a-zA-Z][0-9a-zA-Z:]*/,attrNameRegex=/[^\s\0"'>\/=\x01-\x1F\x7F]+/, // the unicode range accounts for excluding control chars, and the delete char
attrValueRegex=/(?:"[^"]*?"|'[^']*?'|[^'"=<>`\s]+)/, // double quoted, single quoted, or unquoted attribute values
nameEqualsValueRegex=attrNameRegex.source + '(?:\\s*=\\s*' + attrValueRegex.source + ')?'; // optional '=[value]'
return new RegExp([ // for <!DOCTYPE> tag. Ex: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">)
'(?:','<(!DOCTYPE)', // *** Capturing Group 1 - If it's a doctype tag
// Zero or more attributes following the tag name
'(?:','\\s+', // one or more whitespace chars before an attribute
// Either:
// A. attr="value", or
// B. "value" alone (To cover example doctype tag: <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">)
'(?:',nameEqualsValueRegex,'|',attrValueRegex.source + ')',')*','>',')','|', // All other HTML tags (i.e. tags that are not <!DOCTYPE>)
'(?:','<(/)?', // Beginning of a tag or comment. Either '<' for a start tag, or '</' for an end tag.
// *** Capturing Group 2: The slash or an empty string. Slash ('/') for end tag, empty string for start or self-closing tag.
'(?:',commentTagRegex.source, // *** Capturing Group 3 - A Comment Tag's Text
'|','(?:', // *** Capturing Group 4 - The tag name
'(' + tagNameRegex.source + ')', // Zero or more attributes following the tag name
'(?:','\\s+', // one or more whitespace chars before an attribute
nameEqualsValueRegex, // attr="value" (with optional ="value" part)
')*','\\s*/?', // any trailing spaces and optional '/' before the closing '>'
')',')','>',')'].join(""),'gi');})(), /**
	 * @private
	 * @property {RegExp} htmlCharacterEntitiesRegex
	 *
	 * The regular expression that matches common HTML character entities.
	 *
	 * Ignoring &amp; as it could be part of a query string -- handling it separately.
	 */htmlCharacterEntitiesRegex:/(&nbsp;|&#160;|&lt;|&#60;|&gt;|&#62;|&quot;|&#34;|&#39;)/gi, /**
	 * Parses an HTML string and returns a simple array of {@link Autolinker.htmlParser.HtmlNode HtmlNodes}
	 * to represent the HTML structure of the input string.
	 *
	 * @param {String} html The HTML to parse.
	 * @return {Autolinker.htmlParser.HtmlNode[]}
	 */parse:function parse(html){var htmlRegex=this.htmlRegex,currentResult,lastIndex=0,textAndEntityNodes,nodes=[]; // will be the result of the method
while((currentResult = htmlRegex.exec(html)) !== null) {var tagText=currentResult[0],commentText=currentResult[3], // if we've matched a comment
tagName=currentResult[1] || currentResult[4], // The <!DOCTYPE> tag (ex: "!DOCTYPE"), or another tag (ex: "a" or "img")
isClosingTag=!!currentResult[2],inBetweenTagsText=html.substring(lastIndex,currentResult.index); // Push TextNodes and EntityNodes for any text found between tags
if(inBetweenTagsText){textAndEntityNodes = this.parseTextAndEntityNodes(inBetweenTagsText);nodes.push.apply(nodes,textAndEntityNodes);} // Push the CommentNode or ElementNode
if(commentText){nodes.push(this.createCommentNode(tagText,commentText));}else {nodes.push(this.createElementNode(tagText,tagName,isClosingTag));}lastIndex = currentResult.index + tagText.length;} // Process any remaining text after the last HTML element. Will process all of the text if there were no HTML elements.
if(lastIndex < html.length){var text=html.substring(lastIndex); // Push TextNodes and EntityNodes for any text found between tags
if(text){textAndEntityNodes = this.parseTextAndEntityNodes(text);nodes.push.apply(nodes,textAndEntityNodes);}}return nodes;}, /**
	 * Parses text and HTML entity nodes from a given string. The input string
	 * should not have any HTML tags (elements) within it.
	 *
	 * @private
	 * @param {String} text The text to parse.
	 * @return {Autolinker.htmlParser.HtmlNode[]} An array of HtmlNodes to
	 *   represent the {@link Autolinker.htmlParser.TextNode TextNodes} and
	 *   {@link Autolinker.htmlParser.EntityNode EntityNodes} found.
	 */parseTextAndEntityNodes:function parseTextAndEntityNodes(text){var nodes=[],textAndEntityTokens=Autolinker.Util.splitAndCapture(text,this.htmlCharacterEntitiesRegex); // split at HTML entities, but include the HTML entities in the results array
// Every even numbered token is a TextNode, and every odd numbered token is an EntityNode
// For example: an input `text` of "Test &quot;this&quot; today" would turn into the
//   `textAndEntityTokens`: [ 'Test ', '&quot;', 'this', '&quot;', ' today' ]
for(var i=0,len=textAndEntityTokens.length;i < len;i += 2) {var textToken=textAndEntityTokens[i],entityToken=textAndEntityTokens[i + 1];if(textToken)nodes.push(this.createTextNode(textToken));if(entityToken)nodes.push(this.createEntityNode(entityToken));}return nodes;}, /**
	 * Factory method to create an {@link Autolinker.htmlParser.CommentNode CommentNode}.
	 *
	 * @private
	 * @param {String} tagText The full text of the tag (comment) that was
	 *   matched, including its &lt;!-- and --&gt;.
	 * @param {String} comment The full text of the comment that was matched.
	 */createCommentNode:function createCommentNode(tagText,commentText){return new Autolinker.htmlParser.CommentNode({text:tagText,comment:Autolinker.Util.trim(commentText)});}, /**
	 * Factory method to create an {@link Autolinker.htmlParser.ElementNode ElementNode}.
	 *
	 * @private
	 * @param {String} tagText The full text of the tag (element) that was
	 *   matched, including its attributes.
	 * @param {String} tagName The name of the tag. Ex: An &lt;img&gt; tag would
	 *   be passed to this method as "img".
	 * @param {Boolean} isClosingTag `true` if it's a closing tag, false
	 *   otherwise.
	 * @return {Autolinker.htmlParser.ElementNode}
	 */createElementNode:function createElementNode(tagText,tagName,isClosingTag){return new Autolinker.htmlParser.ElementNode({text:tagText,tagName:tagName.toLowerCase(),closing:isClosingTag});}, /**
	 * Factory method to create a {@link Autolinker.htmlParser.EntityNode EntityNode}.
	 *
	 * @private
	 * @param {String} text The text that was matched for the HTML entity (such
	 *   as '&amp;nbsp;').
	 * @return {Autolinker.htmlParser.EntityNode}
	 */createEntityNode:function createEntityNode(text){return new Autolinker.htmlParser.EntityNode({text:text});}, /**
	 * Factory method to create a {@link Autolinker.htmlParser.TextNode TextNode}.
	 *
	 * @private
	 * @param {String} text The text that was matched.
	 * @return {Autolinker.htmlParser.TextNode}
	 */createTextNode:function createTextNode(text){return new Autolinker.htmlParser.TextNode({text:text});}}); /*global Autolinker */ /**
 * @abstract
 * @class Autolinker.htmlParser.HtmlNode
 *
 * Represents an HTML node found in an input string. An HTML node is one of the
 * following:
 *
 * 1. An {@link Autolinker.htmlParser.ElementNode ElementNode}, which represents
 *    HTML tags.
 * 2. A {@link Autolinker.htmlParser.CommentNode CommentNode}, which represents
 *    HTML comments.
 * 3. A {@link Autolinker.htmlParser.TextNode TextNode}, which represents text
 *    outside or within HTML tags.
 * 4. A {@link Autolinker.htmlParser.EntityNode EntityNode}, which represents
 *    one of the known HTML entities that Autolinker looks for. This includes
 *    common ones such as &amp;quot; and &amp;nbsp;
 */Autolinker.htmlParser.HtmlNode = Autolinker.Util.extend(Object,{ /**
	 * @cfg {String} text (required)
	 *
	 * The original text that was matched for the HtmlNode.
	 *
	 * - In the case of an {@link Autolinker.htmlParser.ElementNode ElementNode},
	 *   this will be the tag's text.
	 * - In the case of an {@link Autolinker.htmlParser.CommentNode CommentNode},
	 *   this will be the comment's text.
	 * - In the case of a {@link Autolinker.htmlParser.TextNode TextNode}, this
	 *   will be the text itself.
	 * - In the case of a {@link Autolinker.htmlParser.EntityNode EntityNode},
	 *   this will be the text of the HTML entity.
	 */text:"", /**
	 * @constructor
	 * @param {Object} cfg The configuration properties for the Match instance,
	 * specified in an Object (map).
	 */constructor:function constructor(cfg){Autolinker.Util.assign(this,cfg);}, /**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @abstract
	 * @return {String}
	 */getType:Autolinker.Util.abstractMethod, /**
	 * Retrieves the {@link #text} for the HtmlNode.
	 *
	 * @return {String}
	 */getText:function getText(){return this.text;}}); /*global Autolinker */ /**
 * @class Autolinker.htmlParser.CommentNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents an HTML comment node that has been parsed by the
 * {@link Autolinker.htmlParser.HtmlParser}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */Autolinker.htmlParser.CommentNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode,{ /**
	 * @cfg {String} comment (required)
	 *
	 * The text inside the comment tag. This text is stripped of any leading or
	 * trailing whitespace.
	 */comment:'', /**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */getType:function getType(){return 'comment';}, /**
	 * Returns the comment inside the comment tag.
	 *
	 * @return {String}
	 */getComment:function getComment(){return this.comment;}}); /*global Autolinker */ /**
 * @class Autolinker.htmlParser.ElementNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents an HTML element node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */Autolinker.htmlParser.ElementNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode,{ /**
	 * @cfg {String} tagName (required)
	 *
	 * The name of the tag that was matched.
	 */tagName:'', /**
	 * @cfg {Boolean} closing (required)
	 *
	 * `true` if the element (tag) is a closing tag, `false` if its an opening
	 * tag.
	 */closing:false, /**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */getType:function getType(){return 'element';}, /**
	 * Returns the HTML element's (tag's) name. Ex: for an &lt;img&gt; tag,
	 * returns "img".
	 *
	 * @return {String}
	 */getTagName:function getTagName(){return this.tagName;}, /**
	 * Determines if the HTML element (tag) is a closing tag. Ex: &lt;div&gt;
	 * returns `false`, while &lt;/div&gt; returns `true`.
	 *
	 * @return {Boolean}
	 */isClosing:function isClosing(){return this.closing;}}); /*global Autolinker */ /**
 * @class Autolinker.htmlParser.EntityNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents a known HTML entity node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 * Ex: '&amp;nbsp;', or '&amp#160;' (which will be retrievable from the {@link #getText}
 * method.
 *
 * Note that this class will only be returned from the HtmlParser for the set of
 * checked HTML entity nodes  defined by the {@link Autolinker.htmlParser.HtmlParser#htmlCharacterEntitiesRegex}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */Autolinker.htmlParser.EntityNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode,{ /**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */getType:function getType(){return 'entity';}}); /*global Autolinker */ /**
 * @class Autolinker.htmlParser.TextNode
 * @extends Autolinker.htmlParser.HtmlNode
 *
 * Represents a text node that has been parsed by the {@link Autolinker.htmlParser.HtmlParser}.
 *
 * See this class's superclass ({@link Autolinker.htmlParser.HtmlNode}) for more
 * details.
 */Autolinker.htmlParser.TextNode = Autolinker.Util.extend(Autolinker.htmlParser.HtmlNode,{ /**
	 * Returns a string name for the type of node that this class represents.
	 *
	 * @return {String}
	 */getType:function getType(){return 'text';}}); /*global Autolinker */ /**
 * @private
 * @class Autolinker.matchParser.MatchParser
 * @extends Object
 *
 * Used by Autolinker to parse potential matches, given an input string of text.
 *
 * The MatchParser is fed a non-HTML string in order to search for matches.
 * Autolinker first uses the {@link Autolinker.htmlParser.HtmlParser} to "walk
 * around" HTML tags, and then the text around the HTML tags is passed into the
 * MatchParser in order to find the actual matches.
 */Autolinker.matchParser.MatchParser = Autolinker.Util.extend(Object,{ /**
	 * @cfg {Boolean} urls
	 * @inheritdoc Autolinker#urls
	 */urls:true, /**
	 * @cfg {Boolean} email
	 * @inheritdoc Autolinker#email
	 */email:true, /**
	 * @cfg {Boolean} twitter
	 * @inheritdoc Autolinker#twitter
	 */twitter:true, /**
	 * @cfg {Boolean} phone
	 * @inheritdoc Autolinker#phone
	 */phone:true, /**
	 * @cfg {Boolean/String} hashtag
	 * @inheritdoc Autolinker#hashtag
	 */hashtag:false, /**
	 * @cfg {Boolean} stripPrefix
	 * @inheritdoc Autolinker#stripPrefix
	 */stripPrefix:true, /**
	 * @private
	 * @property {RegExp} matcherRegex
	 *
	 * The regular expression that matches URLs, email addresses, phone #s,
	 * Twitter handles, and Hashtags.
	 *
	 * This regular expression has the following capturing groups:
	 *
	 * 1.  Group that is used to determine if there is a Twitter handle match
	 *     (i.e. \@someTwitterUser). Simply check for its existence to determine
	 *     if there is a Twitter handle match. The next couple of capturing
	 *     groups give information about the Twitter handle match.
	 * 2.  The whitespace character before the \@sign in a Twitter handle. This
	 *     is needed because there are no lookbehinds in JS regular expressions,
	 *     and can be used to reconstruct the original string in a replace().
	 * 3.  The Twitter handle itself in a Twitter match. If the match is
	 *     '@someTwitterUser', the handle is 'someTwitterUser'.
	 * 4.  Group that matches an email address. Used to determine if the match
	 *     is an email address, as well as holding the full address. Ex:
	 *     'me@my.com'
	 * 5.  Group that matches a URL in the input text. Ex: 'http://google.com',
	 *     'www.google.com', or just 'google.com'. This also includes a path,
	 *     url parameters, or hash anchors. Ex: google.com/path/to/file?q1=1&q2=2#myAnchor
	 * 6.  Group that matches a protocol URL (i.e. 'http://google.com'). This is
	 *     used to match protocol URLs with just a single word, like 'http://localhost',
	 *     where we won't double check that the domain name has at least one '.'
	 *     in it.
	 * 7.  A protocol-relative ('//') match for the case of a 'www.' prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     We need to know the character before the '//' in order to determine
	 *     if it is a valid match or the // was in a string we don't want to
	 *     auto-link.
	 * 8.  A protocol-relative ('//') match for the case of a known TLD prefixed
	 *     URL. Will be an empty string if it is not a protocol-relative match.
	 *     See #6 for more info.
	 * 9.  Group that is used to determine if there is a phone number match. The
	 *     next 3 groups give segments of the phone number.
	 * 10. Group that is used to determine if there is a Hashtag match
	 *     (i.e. \#someHashtag). Simply check for its existence to determine if
	 *     there is a Hashtag match. The next couple of capturing groups give
	 *     information about the Hashtag match.
	 * 11. The whitespace character before the #sign in a Hashtag handle. This
	 *     is needed because there are no look-behinds in JS regular
	 *     expressions, and can be used to reconstruct the original string in a
	 *     replace().
	 * 12. The Hashtag itself in a Hashtag match. If the match is
	 *     '#someHashtag', the hashtag is 'someHashtag'.
	 */matcherRegex:(function(){var twitterRegex=/(^|[^\w])@(\w{1,15})/, // For matching a twitter handle. Ex: @gregory_jacobs
hashtagRegex=/(^|[^\w])#(\w{1,139})/, // For matching a Hashtag. Ex: #games
emailRegex=/(?:[\-;:&=\+\$,\w\.]+@)/, // something@ for email addresses (a.k.a. local-part)
phoneRegex=/(?:\+?\d{1,3}[-\s.])?\(?\d{3}\)?[-\s.]?\d{3}[-\s.]\d{4}/, // ex: (123) 456-7890, 123 456 7890, 123-456-7890, etc.
protocolRegex=/(?:[A-Za-z][-.+A-Za-z0-9]+:(?![A-Za-z][-.+A-Za-z0-9]+:\/\/)(?!\d+\/?)(?:\/\/)?)/, // match protocol, allow in format "http://" or "mailto:". However, do not match the first part of something like 'link:http://www.google.com' (i.e. don't match "link:"). Also, make sure we don't interpret 'google.com:8000' as if 'google.com' was a protocol here (i.e. ignore a trailing port number in this regex)
wwwRegex=/(?:www\.)/, // starting with 'www.'
domainNameRegex=/[A-Za-z0-9\.\-]*[A-Za-z0-9\-]/, // anything looking at all like a domain, non-unicode domains, not ending in a period
tldRegex=/\.(?:international|construction|contractors|enterprises|photography|productions|foundation|immobilien|industries|management|properties|technology|christmas|community|directory|education|equipment|institute|marketing|solutions|vacations|bargains|boutique|builders|catering|cleaning|clothing|computer|democrat|diamonds|graphics|holdings|lighting|partners|plumbing|supplies|training|ventures|academy|careers|company|cruises|domains|exposed|flights|florist|gallery|guitars|holiday|kitchen|neustar|okinawa|recipes|rentals|reviews|shiksha|singles|support|systems|agency|berlin|camera|center|coffee|condos|dating|estate|events|expert|futbol|kaufen|luxury|maison|monash|museum|nagoya|photos|repair|report|social|supply|tattoo|tienda|travel|viajes|villas|vision|voting|voyage|actor|build|cards|cheap|codes|dance|email|glass|house|mango|ninja|parts|photo|shoes|solar|today|tokyo|tools|watch|works|aero|arpa|asia|best|bike|blue|buzz|camp|club|cool|coop|farm|fish|gift|guru|info|jobs|kiwi|kred|land|limo|link|menu|mobi|moda|name|pics|pink|post|qpon|rich|ruhr|sexy|tips|vote|voto|wang|wien|wiki|zone|bar|bid|biz|cab|cat|ceo|com|edu|gov|int|kim|mil|net|onl|org|pro|pub|red|tel|uno|wed|xxx|xyz|ac|ad|ae|af|ag|ai|al|am|an|ao|aq|ar|as|at|au|aw|ax|az|ba|bb|bd|be|bf|bg|bh|bi|bj|bm|bn|bo|br|bs|bt|bv|bw|by|bz|ca|cc|cd|cf|cg|ch|ci|ck|cl|cm|cn|co|cr|cu|cv|cw|cx|cy|cz|de|dj|dk|dm|do|dz|ec|ee|eg|er|es|et|eu|fi|fj|fk|fm|fo|fr|ga|gb|gd|ge|gf|gg|gh|gi|gl|gm|gn|gp|gq|gr|gs|gt|gu|gw|gy|hk|hm|hn|hr|ht|hu|id|ie|il|im|in|io|iq|ir|is|it|je|jm|jo|jp|ke|kg|kh|ki|km|kn|kp|kr|kw|ky|kz|la|lb|lc|li|lk|lr|ls|lt|lu|lv|ly|ma|mc|md|me|mg|mh|mk|ml|mm|mn|mo|mp|mq|mr|ms|mt|mu|mv|mw|mx|my|mz|na|nc|ne|nf|ng|ni|nl|no|np|nr|nu|nz|om|pa|pe|pf|pg|ph|pk|pl|pm|pn|pr|ps|pt|pw|py|qa|re|ro|rs|ru|rw|sa|sb|sc|sd|se|sg|sh|si|sj|sk|sl|sm|sn|so|sr|st|su|sv|sx|sy|sz|tc|td|tf|tg|th|tj|tk|tl|tm|tn|to|tp|tr|tt|tv|tw|tz|ua|ug|uk|us|uy|uz|va|vc|ve|vg|vi|vn|vu|wf|ws|ye|yt|za|zm|zw)\b/, // match our known top level domains (TLDs)
// Allow optional path, query string, and hash anchor, not ending in the following characters: "?!:,.;"
// http://blog.codinghorror.com/the-problem-with-urls/
urlSuffixRegex=/[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]?!:,.;]*[\-A-Za-z0-9+&@#\/%=~_()|'$*\[\]]/;return new RegExp(['(', // *** Capturing group $1, which can be used to check for a twitter handle match. Use group $3 for the actual twitter handle though. $2 may be used to reconstruct the original string in a replace()
// *** Capturing group $2, which matches the whitespace character before the '@' sign (needed because of no lookbehinds), and
// *** Capturing group $3, which matches the actual twitter handle
twitterRegex.source,')','|','(', // *** Capturing group $4, which is used to determine an email match
emailRegex.source,domainNameRegex.source,tldRegex.source,')','|','(', // *** Capturing group $5, which is used to match a URL
'(?:', // parens to cover match for protocol (optional), and domain
'(', // *** Capturing group $6, for a protocol-prefixed url (ex: http://google.com)
protocolRegex.source,domainNameRegex.source,')','|','(?:', // non-capturing paren for a 'www.' prefixed url (ex: www.google.com)
'(.?//)?', // *** Capturing group $7 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
wwwRegex.source,domainNameRegex.source,')','|','(?:', // non-capturing paren for known a TLD url (ex: google.com)
'(.?//)?', // *** Capturing group $8 for an optional protocol-relative URL. Must be at the beginning of the string or start with a non-word character
domainNameRegex.source,tldRegex.source,')',')','(?:' + urlSuffixRegex.source + ')?', // match for path, query string, and/or hash anchor - optional
')','|', // this setup does not scale well for open extension :( Need to rethink design of autolinker...
// ***  Capturing group $9, which matches a (USA for now) phone number
'(',phoneRegex.source,')','|','(', // *** Capturing group $10, which can be used to check for a Hashtag match. Use group $12 for the actual Hashtag though. $11 may be used to reconstruct the original string in a replace()
// *** Capturing group $11, which matches the whitespace character before the '#' sign (needed because of no lookbehinds), and
// *** Capturing group $12, which matches the actual Hashtag
hashtagRegex.source,')'].join(""),'gi');})(), /**
	 * @private
	 * @property {RegExp} charBeforeProtocolRelMatchRegex
	 *
	 * The regular expression used to retrieve the character before a
	 * protocol-relative URL match.
	 *
	 * This is used in conjunction with the {@link #matcherRegex}, which needs
	 * to grab the character before a protocol-relative '//' due to the lack of
	 * a negative look-behind in JavaScript regular expressions. The character
	 * before the match is stripped from the URL.
	 */charBeforeProtocolRelMatchRegex:/^(.)?\/\//, /**
	 * @private
	 * @property {Autolinker.MatchValidator} matchValidator
	 *
	 * The MatchValidator object, used to filter out any false positives from
	 * the {@link #matcherRegex}. See {@link Autolinker.MatchValidator} for details.
	 */ /**
	 * @constructor
	 * @param {Object} [cfg] The configuration options for the AnchorTagBuilder
	 * instance, specified in an Object (map).
	 */constructor:function constructor(cfg){Autolinker.Util.assign(this,cfg);this.matchValidator = new Autolinker.MatchValidator();}, /**
	 * Parses the input `text` to search for matches, and calls the `replaceFn`
	 * to allow replacements of the matches. Returns the `text` with matches
	 * replaced.
	 *
	 * @param {String} text The text to search and repace matches in.
	 * @param {Function} replaceFn The iterator function to handle the
	 *   replacements. The function takes a single argument, a {@link Autolinker.match.Match}
	 *   object, and should return the text that should make the replacement.
	 * @param {Object} [contextObj=window] The context object ("scope") to run
	 *   the `replaceFn` in.
	 * @return {String}
	 */replace:function replace(text,replaceFn,contextObj){var me=this; // for closure
return text.replace(this.matcherRegex,function(matchStr,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12){var matchDescObj=me.processCandidateMatch(matchStr,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12); // "match description" object
// Return out with no changes for match types that are disabled (url,
// email, phone, etc.), or for matches that are invalid (false
// positives from the matcherRegex, which can't use look-behinds
// since they are unavailable in JS).
if(!matchDescObj){return matchStr;}else { // Generate replacement text for the match from the `replaceFn`
var replaceStr=replaceFn.call(contextObj,matchDescObj.match);return matchDescObj.prefixStr + replaceStr + matchDescObj.suffixStr;}});}, /**
	 * Processes a candidate match from the {@link #matcherRegex}.
	 *
	 * Not all matches found by the regex are actual URL/Email/Phone/Twitter/Hashtag
	 * matches, as determined by the {@link #matchValidator}. In this case, the
	 * method returns `null`. Otherwise, a valid Object with `prefixStr`,
	 * `match`, and `suffixStr` is returned.
	 *
	 * @private
	 * @param {String} matchStr The full match that was found by the
	 *   {@link #matcherRegex}.
	 * @param {String} twitterMatch The matched text of a Twitter handle, if the
	 *   match is a Twitter match.
	 * @param {String} twitterHandlePrefixWhitespaceChar The whitespace char
	 *   before the @ sign in a Twitter handle match. This is needed because of
	 *   no lookbehinds in JS regexes, and is need to re-include the character
	 *   for the anchor tag replacement.
	 * @param {String} twitterHandle The actual Twitter user (i.e the word after
	 *   the @ sign in a Twitter match).
	 * @param {String} emailAddressMatch The matched email address for an email
	 *   address match.
	 * @param {String} urlMatch The matched URL string for a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @param {String} wwwProtocolRelativeMatch The '//' for a protocol-relative
	 *   match from a 'www' url, with the character that comes before the '//'.
	 * @param {String} tldProtocolRelativeMatch The '//' for a protocol-relative
	 *   match from a TLD (top level domain) match, with the character that
	 *   comes before the '//'.
	 * @param {String} phoneMatch The matched text of a phone number
	 * @param {String} hashtagMatch The matched text of a Twitter
	 *   Hashtag, if the match is a Hashtag match.
	 * @param {String} hashtagPrefixWhitespaceChar The whitespace char
	 *   before the # sign in a Hashtag match. This is needed because of no
	 *   lookbehinds in JS regexes, and is need to re-include the character for
	 *   the anchor tag replacement.
	 * @param {String} hashtag The actual Hashtag (i.e the word
	 *   after the # sign in a Hashtag match).
	 *
	 * @return {Object} A "match description object". This will be `null` if the
	 *   match was invalid, or if a match type is disabled. Otherwise, this will
	 *   be an Object (map) with the following properties:
	 * @return {String} return.prefixStr The char(s) that should be prepended to
	 *   the replacement string. These are char(s) that were needed to be
	 *   included from the regex match that were ignored by processing code, and
	 *   should be re-inserted into the replacement stream.
	 * @return {String} return.suffixStr The char(s) that should be appended to
	 *   the replacement string. These are char(s) that were needed to be
	 *   included from the regex match that were ignored by processing code, and
	 *   should be re-inserted into the replacement stream.
	 * @return {Autolinker.match.Match} return.match The Match object that
	 *   represents the match that was found.
	 */processCandidateMatch:function processCandidateMatch(matchStr,twitterMatch,twitterHandlePrefixWhitespaceChar,twitterHandle,emailAddressMatch,urlMatch,protocolUrlMatch,wwwProtocolRelativeMatch,tldProtocolRelativeMatch,phoneMatch,hashtagMatch,hashtagPrefixWhitespaceChar,hashtag){ // Note: The `matchStr` variable wil be fixed up to remove characters that are no longer needed (which will
// be added to `prefixStr` and `suffixStr`).
var protocolRelativeMatch=wwwProtocolRelativeMatch || tldProtocolRelativeMatch,match, // Will be an Autolinker.match.Match object
prefixStr="", // A string to use to prefix the anchor tag that is created. This is needed for the Twitter and Hashtag matches.
suffixStr=""; // A string to suffix the anchor tag that is created. This is used if there is a trailing parenthesis that should not be auto-linked.
// Return out with `null` for match types that are disabled (url, email,
// twitter, hashtag), or for matches that are invalid (false positives
// from the matcherRegex, which can't use look-behinds since they are
// unavailable in JS).
if(urlMatch && !this.urls || emailAddressMatch && !this.email || phoneMatch && !this.phone || twitterMatch && !this.twitter || hashtagMatch && !this.hashtag || !this.matchValidator.isValidMatch(urlMatch,protocolUrlMatch,protocolRelativeMatch)){return null;} // Handle a closing parenthesis at the end of the match, and exclude it
// if there is not a matching open parenthesis
// in the match itself.
if(this.matchHasUnbalancedClosingParen(matchStr)){matchStr = matchStr.substr(0,matchStr.length - 1); // remove the trailing ")"
suffixStr = ")"; // this will be added after the generated <a> tag
}else { // Handle an invalid character after the TLD
var pos=this.matchHasInvalidCharAfterTld(urlMatch,protocolUrlMatch);if(pos > -1){suffixStr = matchStr.substr(pos); // this will be added after the generated <a> tag
matchStr = matchStr.substr(0,pos); // remove the trailing invalid chars
}}if(emailAddressMatch){match = new Autolinker.match.Email({matchedText:matchStr,email:emailAddressMatch});}else if(twitterMatch){ // fix up the `matchStr` if there was a preceding whitespace char,
// which was needed to determine the match itself (since there are
// no look-behinds in JS regexes)
if(twitterHandlePrefixWhitespaceChar){prefixStr = twitterHandlePrefixWhitespaceChar;matchStr = matchStr.slice(1); // remove the prefixed whitespace char from the match
}match = new Autolinker.match.Twitter({matchedText:matchStr,twitterHandle:twitterHandle});}else if(phoneMatch){ // remove non-numeric values from phone number string
var cleanNumber=matchStr.replace(/\D/g,'');match = new Autolinker.match.Phone({matchedText:matchStr,number:cleanNumber});}else if(hashtagMatch){ // fix up the `matchStr` if there was a preceding whitespace char,
// which was needed to determine the match itself (since there are
// no look-behinds in JS regexes)
if(hashtagPrefixWhitespaceChar){prefixStr = hashtagPrefixWhitespaceChar;matchStr = matchStr.slice(1); // remove the prefixed whitespace char from the match
}match = new Autolinker.match.Hashtag({matchedText:matchStr,serviceName:this.hashtag,hashtag:hashtag});}else { // url match
// If it's a protocol-relative '//' match, remove the character
// before the '//' (which the matcherRegex needed to match due to
// the lack of a negative look-behind in JavaScript regular
// expressions)
if(protocolRelativeMatch){var charBeforeMatch=protocolRelativeMatch.match(this.charBeforeProtocolRelMatchRegex)[1] || "";if(charBeforeMatch){ // fix up the `matchStr` if there was a preceding char before a protocol-relative match, which was needed to determine the match itself (since there are no look-behinds in JS regexes)
prefixStr = charBeforeMatch;matchStr = matchStr.slice(1); // remove the prefixed char from the match
}}match = new Autolinker.match.Url({matchedText:matchStr,url:matchStr,protocolUrlMatch:!!protocolUrlMatch,protocolRelativeMatch:!!protocolRelativeMatch,stripPrefix:this.stripPrefix});}return {prefixStr:prefixStr,suffixStr:suffixStr,match:match};}, /**
	 * Determines if a match found has an unmatched closing parenthesis. If so,
	 * this parenthesis will be removed from the match itself, and appended
	 * after the generated anchor tag in {@link #processCandidateMatch}.
	 *
	 * A match may have an extra closing parenthesis at the end of the match
	 * because the regular expression must include parenthesis for URLs such as
	 * "wikipedia.com/something_(disambiguation)", which should be auto-linked.
	 *
	 * However, an extra parenthesis *will* be included when the URL itself is
	 * wrapped in parenthesis, such as in the case of "(wikipedia.com/something_(disambiguation))".
	 * In this case, the last closing parenthesis should *not* be part of the
	 * URL itself, and this method will return `true`.
	 *
	 * @private
	 * @param {String} matchStr The full match string from the {@link #matcherRegex}.
	 * @return {Boolean} `true` if there is an unbalanced closing parenthesis at
	 *   the end of the `matchStr`, `false` otherwise.
	 */matchHasUnbalancedClosingParen:function matchHasUnbalancedClosingParen(matchStr){var lastChar=matchStr.charAt(matchStr.length - 1);if(lastChar === ')'){var openParensMatch=matchStr.match(/\(/g),closeParensMatch=matchStr.match(/\)/g),numOpenParens=openParensMatch && openParensMatch.length || 0,numCloseParens=closeParensMatch && closeParensMatch.length || 0;if(numOpenParens < numCloseParens){return true;}}return false;}, /**
	 * Determine if there's an invalid character after the TLD in a URL. Valid
	 * characters after TLD are ':/?#'. Exclude protocol matched URLs from this
	 * check.
	 *
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @return {Number} the position where the invalid character was found. If
	 *   no such character was found, returns -1
	 */matchHasInvalidCharAfterTld:function matchHasInvalidCharAfterTld(urlMatch,protocolUrlMatch){if(!urlMatch){return -1;}var offset=0;if(protocolUrlMatch){offset = urlMatch.indexOf(':');urlMatch = urlMatch.slice(offset);}var re=/^((.?\/\/)?[A-Za-z0-9\.\-]*[A-Za-z0-9\-]\.[A-Za-z]+)/;var res=re.exec(urlMatch);if(res === null){return -1;}offset += res[1].length;urlMatch = urlMatch.slice(res[1].length);if(/^[^.A-Za-z:\/?#]/.test(urlMatch)){return offset;}return -1;}}); /*global Autolinker */ /*jshint scripturl:true */ /**
 * @private
 * @class Autolinker.MatchValidator
 * @extends Object
 *
 * Used by Autolinker to filter out false positives from the
 * {@link Autolinker.matchParser.MatchParser#matcherRegex}.
 *
 * Due to the limitations of regular expressions (including the missing feature
 * of look-behinds in JS regular expressions), we cannot always determine the
 * validity of a given match. This class applies a bit of additional logic to
 * filter out any false positives that have been matched by the
 * {@link Autolinker.matchParser.MatchParser#matcherRegex}.
 */Autolinker.MatchValidator = Autolinker.Util.extend(Object,{ /**
	 * @private
	 * @property {RegExp} invalidProtocolRelMatchRegex
	 *
	 * The regular expression used to check a potential protocol-relative URL
	 * match, coming from the {@link Autolinker.matchParser.MatchParser#matcherRegex}.
	 * A protocol-relative URL is, for example, "//yahoo.com"
	 *
	 * This regular expression checks to see if there is a word character before
	 * the '//' match in order to determine if we should actually autolink a
	 * protocol-relative URL. This is needed because there is no negative
	 * look-behind in JavaScript regular expressions.
	 *
	 * For instance, we want to autolink something like "Go to: //google.com",
	 * but we don't want to autolink something like "abc//google.com"
	 */invalidProtocolRelMatchRegex:/^[\w]\/\//, /**
	 * Regex to test for a full protocol, with the two trailing slashes. Ex: 'http://'
	 *
	 * @private
	 * @property {RegExp} hasFullProtocolRegex
	 */hasFullProtocolRegex:/^[A-Za-z][-.+A-Za-z0-9]+:\/\//, /**
	 * Regex to find the URI scheme, such as 'mailto:'.
	 *
	 * This is used to filter out 'javascript:' and 'vbscript:' schemes.
	 *
	 * @private
	 * @property {RegExp} uriSchemeRegex
	 */uriSchemeRegex:/^[A-Za-z][-.+A-Za-z0-9]+:/, /**
	 * Regex to determine if at least one word char exists after the protocol (i.e. after the ':')
	 *
	 * @private
	 * @property {RegExp} hasWordCharAfterProtocolRegex
	 */hasWordCharAfterProtocolRegex:/:[^\s]*?[A-Za-z]/, /**
	 * Determines if a given match found by the {@link Autolinker.matchParser.MatchParser}
	 * is valid. Will return `false` for:
	 *
	 * 1) URL matches which do not have at least have one period ('.') in the
	 *    domain name (effectively skipping over matches like "abc:def").
	 *    However, URL matches with a protocol will be allowed (ex: 'http://localhost')
	 * 2) URL matches which do not have at least one word character in the
	 *    domain name (effectively skipping over matches like "git:1.0").
	 * 3) A protocol-relative url match (a URL beginning with '//') whose
	 *    previous character is a word character (effectively skipping over
	 *    strings like "abc//google.com")
	 *
	 * Otherwise, returns `true`.
	 *
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @param {String} protocolRelativeMatch The protocol-relative string for a
	 *   URL match (i.e. '//'), possibly with a preceding character (ex, a
	 *   space, such as: ' //', or a letter, such as: 'a//'). The match is
	 *   invalid if there is a word character preceding the '//'.
	 * @return {Boolean} `true` if the match given is valid and should be
	 *   processed, or `false` if the match is invalid and/or should just not be
	 *   processed.
	 */isValidMatch:function isValidMatch(urlMatch,protocolUrlMatch,protocolRelativeMatch){if(protocolUrlMatch && !this.isValidUriScheme(protocolUrlMatch) || this.urlMatchDoesNotHaveProtocolOrDot(urlMatch,protocolUrlMatch) ||  // At least one period ('.') must exist in the URL match for us to consider it an actual URL, *unless* it was a full protocol match (like 'http://localhost')
this.urlMatchDoesNotHaveAtLeastOneWordChar(urlMatch,protocolUrlMatch) ||  // At least one letter character must exist in the domain name after a protocol match. Ex: skip over something like "git:1.0"
this.isInvalidProtocolRelativeMatch(protocolRelativeMatch) // A protocol-relative match which has a word character in front of it (so we can skip something like "abc//google.com")
){return false;}return true;}, /**
	 * Determines if the URI scheme is a valid scheme to be autolinked. Returns
	 * `false` if the scheme is 'javascript:' or 'vbscript:'
	 *
	 * @private
	 * @param {String} uriSchemeMatch The match URL string for a full URI scheme
	 *   match. Ex: 'http://yahoo.com' or 'mailto:a@a.com'.
	 * @return {Boolean} `true` if the scheme is a valid one, `false` otherwise.
	 */isValidUriScheme:function isValidUriScheme(uriSchemeMatch){var uriScheme=uriSchemeMatch.match(this.uriSchemeRegex)[0].toLowerCase();return uriScheme !== 'javascript:' && uriScheme !== 'vbscript:';}, /**
	 * Determines if a URL match does not have either:
	 *
	 * a) a full protocol (i.e. 'http://'), or
	 * b) at least one dot ('.') in the domain name (for a non-full-protocol
	 *    match).
	 *
	 * Either situation is considered an invalid URL (ex: 'git:d' does not have
	 * either the '://' part, or at least one dot in the domain name. If the
	 * match was 'git:abc.com', we would consider this valid.)
	 *
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to match something like
	 *   'http://localhost', where we won't double check that the domain name
	 *   has at least one '.' in it.
	 * @return {Boolean} `true` if the URL match does not have a full protocol,
	 *   or at least one dot ('.') in a non-full-protocol match.
	 */urlMatchDoesNotHaveProtocolOrDot:function urlMatchDoesNotHaveProtocolOrDot(urlMatch,protocolUrlMatch){return !!urlMatch && (!protocolUrlMatch || !this.hasFullProtocolRegex.test(protocolUrlMatch)) && urlMatch.indexOf('.') === -1;}, /**
	 * Determines if a URL match does not have at least one word character after
	 * the protocol (i.e. in the domain name).
	 *
	 * At least one letter character must exist in the domain name after a
	 * protocol match. Ex: skip over something like "git:1.0"
	 *
	 * @private
	 * @param {String} urlMatch The matched URL, if there was one. Will be an
	 *   empty string if the match is not a URL match.
	 * @param {String} protocolUrlMatch The match URL string for a protocol
	 *   match. Ex: 'http://yahoo.com'. This is used to know whether or not we
	 *   have a protocol in the URL string, in order to check for a word
	 *   character after the protocol separator (':').
	 * @return {Boolean} `true` if the URL match does not have at least one word
	 *   character in it after the protocol, `false` otherwise.
	 */urlMatchDoesNotHaveAtLeastOneWordChar:function urlMatchDoesNotHaveAtLeastOneWordChar(urlMatch,protocolUrlMatch){if(urlMatch && protocolUrlMatch){return !this.hasWordCharAfterProtocolRegex.test(urlMatch);}else {return false;}}, /**
	 * Determines if a protocol-relative match is an invalid one. This method
	 * returns `true` if there is a `protocolRelativeMatch`, and that match
	 * contains a word character before the '//' (i.e. it must contain
	 * whitespace or nothing before the '//' in order to be considered valid).
	 *
	 * @private
	 * @param {String} protocolRelativeMatch The protocol-relative string for a
	 *   URL match (i.e. '//'), possibly with a preceding character (ex, a
	 *   space, such as: ' //', or a letter, such as: 'a//'). The match is
	 *   invalid if there is a word character preceding the '//'.
	 * @return {Boolean} `true` if it is an invalid protocol-relative match,
	 *   `false` otherwise.
	 */isInvalidProtocolRelativeMatch:function isInvalidProtocolRelativeMatch(protocolRelativeMatch){return !!protocolRelativeMatch && this.invalidProtocolRelMatchRegex.test(protocolRelativeMatch);}}); /*global Autolinker */ /**
 * @abstract
 * @class Autolinker.match.Match
 * 
 * Represents a match found in an input string which should be Autolinked. A Match object is what is provided in a 
 * {@link Autolinker#replaceFn replaceFn}, and may be used to query for details about the match.
 * 
 * For example:
 * 
 *     var input = "...";  // string with URLs, Email Addresses, and Twitter Handles
 *     
 *     var linkedText = Autolinker.link( input, {
 *         replaceFn : function( autolinker, match ) {
 *             console.log( "href = ", match.getAnchorHref() );
 *             console.log( "text = ", match.getAnchorText() );
 *         
 *             switch( match.getType() ) {
 *                 case 'url' : 
 *                     console.log( "url: ", match.getUrl() );
 *                     
 *                 case 'email' :
 *                     console.log( "email: ", match.getEmail() );
 *                     
 *                 case 'twitter' :
 *                     console.log( "twitter: ", match.getTwitterHandle() );
 *             }
 *         }
 *     } );
 *     
 * See the {@link Autolinker} class for more details on using the {@link Autolinker#replaceFn replaceFn}.
 */Autolinker.match.Match = Autolinker.Util.extend(Object,{ /**
	 * @cfg {String} matchedText (required)
	 * 
	 * The original text that was matched.
	 */ /**
	 * @constructor
	 * @param {Object} cfg The configuration properties for the Match instance, specified in an Object (map).
	 */constructor:function constructor(cfg){Autolinker.Util.assign(this,cfg);}, /**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @abstract
	 * @return {String}
	 */getType:Autolinker.Util.abstractMethod, /**
	 * Returns the original text that was matched.
	 * 
	 * @return {String}
	 */getMatchedText:function getMatchedText(){return this.matchedText;}, /**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @abstract
	 * @return {String}
	 */getAnchorHref:Autolinker.Util.abstractMethod, /**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @abstract
	 * @return {String}
	 */getAnchorText:Autolinker.Util.abstractMethod}); /*global Autolinker */ /**
 * @class Autolinker.match.Email
 * @extends Autolinker.match.Match
 * 
 * Represents a Email match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */Autolinker.match.Email = Autolinker.Util.extend(Autolinker.match.Match,{ /**
	 * @cfg {String} email (required)
	 * 
	 * The email address that was matched.
	 */ /**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */getType:function getType(){return 'email';}, /**
	 * Returns the email address that was matched.
	 * 
	 * @return {String}
	 */getEmail:function getEmail(){return this.email;}, /**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */getAnchorHref:function getAnchorHref(){return 'mailto:' + this.email;}, /**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */getAnchorText:function getAnchorText(){return this.email;}}); /*global Autolinker */ /**
 * @class Autolinker.match.Hashtag
 * @extends Autolinker.match.Match
 *
 * Represents a Hashtag match found in an input string which should be
 * Autolinked.
 *
 * See this class's superclass ({@link Autolinker.match.Match}) for more
 * details.
 */Autolinker.match.Hashtag = Autolinker.Util.extend(Autolinker.match.Match,{ /**
	 * @cfg {String} serviceName (required)
	 *
	 * The service to point hashtag matches to. See {@link Autolinker#hashtag}
	 * for available values.
	 */ /**
	 * @cfg {String} hashtag (required)
	 *
	 * The Hashtag that was matched, without the '#'.
	 */ /**
	 * Returns the type of match that this class represents.
	 *
	 * @return {String}
	 */getType:function getType(){return 'hashtag';}, /**
	 * Returns the matched hashtag.
	 *
	 * @return {String}
	 */getHashtag:function getHashtag(){return this.hashtag;}, /**
	 * Returns the anchor href that should be generated for the match.
	 *
	 * @return {String}
	 */getAnchorHref:function getAnchorHref(){var serviceName=this.serviceName,hashtag=this.hashtag;switch(serviceName){case 'twitter':return 'https://twitter.com/hashtag/' + hashtag;case 'facebook':return 'https://www.facebook.com/hashtag/' + hashtag;default: // Shouldn't happen because Autolinker's constructor should block any invalid values, but just in case.
throw new Error('Unknown service name to point hashtag to: ',serviceName);}}, /**
	 * Returns the anchor text that should be generated for the match.
	 *
	 * @return {String}
	 */getAnchorText:function getAnchorText(){return '#' + this.hashtag;}}); /*global Autolinker */ /**
 * @class Autolinker.match.Phone
 * @extends Autolinker.match.Match
 *
 * Represents a Phone number match found in an input string which should be
 * Autolinked.
 *
 * See this class's superclass ({@link Autolinker.match.Match}) for more
 * details.
 */Autolinker.match.Phone = Autolinker.Util.extend(Autolinker.match.Match,{ /**
	 * @cfg {String} number (required)
	 *
	 * The phone number that was matched.
	 */ /**
	 * Returns a string name for the type of match that this class represents.
	 *
	 * @return {String}
	 */getType:function getType(){return 'phone';}, /**
	 * Returns the phone number that was matched.
	 *
	 * @return {String}
	 */getNumber:function getNumber(){return this.number;}, /**
	 * Returns the anchor href that should be generated for the match.
	 *
	 * @return {String}
	 */getAnchorHref:function getAnchorHref(){return 'tel:' + this.number;}, /**
	 * Returns the anchor text that should be generated for the match.
	 *
	 * @return {String}
	 */getAnchorText:function getAnchorText(){return this.matchedText;}}); /*global Autolinker */ /**
 * @class Autolinker.match.Twitter
 * @extends Autolinker.match.Match
 * 
 * Represents a Twitter match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */Autolinker.match.Twitter = Autolinker.Util.extend(Autolinker.match.Match,{ /**
	 * @cfg {String} twitterHandle (required)
	 * 
	 * The Twitter handle that was matched.
	 */ /**
	 * Returns the type of match that this class represents.
	 * 
	 * @return {String}
	 */getType:function getType(){return 'twitter';}, /**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */getTwitterHandle:function getTwitterHandle(){return this.twitterHandle;}, /**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */getAnchorHref:function getAnchorHref(){return 'https://twitter.com/' + this.twitterHandle;}, /**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */getAnchorText:function getAnchorText(){return '@' + this.twitterHandle;}}); /*global Autolinker */ /**
 * @class Autolinker.match.Url
 * @extends Autolinker.match.Match
 * 
 * Represents a Url match found in an input string which should be Autolinked.
 * 
 * See this class's superclass ({@link Autolinker.match.Match}) for more details.
 */Autolinker.match.Url = Autolinker.Util.extend(Autolinker.match.Match,{ /**
	 * @cfg {String} url (required)
	 * 
	 * The url that was matched.
	 */ /**
	 * @cfg {Boolean} protocolUrlMatch (required)
	 * 
	 * `true` if the URL is a match which already has a protocol (i.e. 'http://'), `false` if the match was from a 'www' or
	 * known TLD match.
	 */ /**
	 * @cfg {Boolean} protocolRelativeMatch (required)
	 * 
	 * `true` if the URL is a protocol-relative match. A protocol-relative match is a URL that starts with '//',
	 * and will be either http:// or https:// based on the protocol that the site is loaded under.
	 */ /**
	 * @cfg {Boolean} stripPrefix (required)
	 * @inheritdoc Autolinker#stripPrefix
	 */ /**
	 * @private
	 * @property {RegExp} urlPrefixRegex
	 * 
	 * A regular expression used to remove the 'http://' or 'https://' and/or the 'www.' from URLs.
	 */urlPrefixRegex:/^(https?:\/\/)?(www\.)?/i, /**
	 * @private
	 * @property {RegExp} protocolRelativeRegex
	 * 
	 * The regular expression used to remove the protocol-relative '//' from the {@link #url} string, for purposes
	 * of {@link #getAnchorText}. A protocol-relative URL is, for example, "//yahoo.com"
	 */protocolRelativeRegex:/^\/\//, /**
	 * @private
	 * @property {Boolean} protocolPrepended
	 * 
	 * Will be set to `true` if the 'http://' protocol has been prepended to the {@link #url} (because the
	 * {@link #url} did not have a protocol)
	 */protocolPrepended:false, /**
	 * Returns a string name for the type of match that this class represents.
	 * 
	 * @return {String}
	 */getType:function getType(){return 'url';}, /**
	 * Returns the url that was matched, assuming the protocol to be 'http://' if the original
	 * match was missing a protocol.
	 * 
	 * @return {String}
	 */getUrl:function getUrl(){var url=this.url; // if the url string doesn't begin with a protocol, assume 'http://'
if(!this.protocolRelativeMatch && !this.protocolUrlMatch && !this.protocolPrepended){url = this.url = 'http://' + url;this.protocolPrepended = true;}return url;}, /**
	 * Returns the anchor href that should be generated for the match.
	 * 
	 * @return {String}
	 */getAnchorHref:function getAnchorHref(){var url=this.getUrl();return url.replace(/&amp;/g,'&'); // any &amp;'s in the URL should be converted back to '&' if they were displayed as &amp; in the source html 
}, /**
	 * Returns the anchor text that should be generated for the match.
	 * 
	 * @return {String}
	 */getAnchorText:function getAnchorText(){var anchorText=this.getUrl();if(this.protocolRelativeMatch){ // Strip off any protocol-relative '//' from the anchor text
anchorText = this.stripProtocolRelativePrefix(anchorText);}if(this.stripPrefix){anchorText = this.stripUrlPrefix(anchorText);}anchorText = this.removeTrailingSlash(anchorText); // remove trailing slash, if there is one
return anchorText;}, // ---------------------------------------
// Utility Functionality
/**
	 * Strips the URL prefix (such as "http://" or "https://") from the given text.
	 * 
	 * @private
	 * @param {String} text The text of the anchor that is being generated, for which to strip off the
	 *   url prefix (such as stripping off "http://")
	 * @return {String} The `anchorText`, with the prefix stripped.
	 */stripUrlPrefix:function stripUrlPrefix(text){return text.replace(this.urlPrefixRegex,'');}, /**
	 * Strips any protocol-relative '//' from the anchor text.
	 * 
	 * @private
	 * @param {String} text The text of the anchor that is being generated, for which to strip off the
	 *   protocol-relative prefix (such as stripping off "//")
	 * @return {String} The `anchorText`, with the protocol-relative prefix stripped.
	 */stripProtocolRelativePrefix:function stripProtocolRelativePrefix(text){return text.replace(this.protocolRelativeRegex,'');}, /**
	 * Removes any trailing slash from the given `anchorText`, in preparation for the text to be displayed.
	 * 
	 * @private
	 * @param {String} anchorText The text of the anchor that is being generated, for which to remove any trailing
	 *   slash ('/') that may exist.
	 * @return {String} The `anchorText`, with the trailing slash removed.
	 */removeTrailingSlash:function removeTrailingSlash(anchorText){if(anchorText.charAt(anchorText.length - 1) === '/'){anchorText = anchorText.slice(0,-1);}return anchorText;}});return Autolinker;});},{}],6:[function(require,module,exports){},{}],7:[function(require,module,exports){ // shim for using process in browser
var process=module.exports = {};var queue=[];var draining=false;var currentQueue;var queueIndex=-1;function cleanUpNextTick(){draining = false;if(currentQueue.length){queue = currentQueue.concat(queue);}else {queueIndex = -1;}if(queue.length){drainQueue();}}function drainQueue(){if(draining){return;}var timeout=setTimeout(cleanUpNextTick);draining = true;var len=queue.length;while(len) {currentQueue = queue;queue = [];while(++queueIndex < len) {currentQueue[queueIndex].run();}queueIndex = -1;len = queue.length;}currentQueue = null;draining = false;clearTimeout(timeout);}process.nextTick = function(fun){var args=new Array(arguments.length - 1);if(arguments.length > 1){for(var i=1;i < arguments.length;i++) {args[i - 1] = arguments[i];}}queue.push(new Item(fun,args));if(queue.length === 1 && !draining){setTimeout(drainQueue,0);}}; // v8 likes predictible objects
function Item(fun,array){this.fun = fun;this.array = array;}Item.prototype.run = function(){this.fun.apply(null,this.array);};process.title = 'browser';process.browser = true;process.env = {};process.argv = [];process.version = ''; // empty string to avoid regexp issues
process.versions = {};function noop(){}process.on = noop;process.addListener = noop;process.once = noop;process.off = noop;process.removeListener = noop;process.removeAllListeners = noop;process.emit = noop;process.binding = function(name){throw new Error('process.binding is not supported');}; // TODO(shtylman)
process.cwd = function(){return '/';};process.chdir = function(dir){throw new Error('process.chdir is not supported');};process.umask = function(){return 0;};},{}],8:[function(require,module,exports){ /*!

 handlebars v3.0.3

Copyright (C) 2011-2014 by Yehuda Katz

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

@license
*/(function webpackUniversalModuleDefinition(root,factory){if(typeof exports === 'object' && typeof module === 'object')module.exports = factory();else if(typeof define === 'function' && define.amd)define(factory);else if(typeof exports === 'object')exports["Handlebars"] = factory();else root["Handlebars"] = factory();})(this,function(){return (function(modules){ // webpackBootstrap
/******/ // The module cache
/******/var installedModules={}; /******/ // The require function
/******/function __webpack_require__(moduleId){ /******/ // Check if module is in cache
/******/if(installedModules[moduleId]) /******/return installedModules[moduleId].exports; /******/ // Create a new module (and put it into the cache)
/******/var module=installedModules[moduleId] = { /******/exports:{}, /******/id:moduleId, /******/loaded:false /******/}; /******/ // Execute the module function
/******/modules[moduleId].call(module.exports,module,module.exports,__webpack_require__); /******/ // Flag the module as loaded
/******/module.loaded = true; /******/ // Return the exports of the module
/******/return module.exports; /******/} /******/ // expose the modules object (__webpack_modules__)
/******/__webpack_require__.m = modules; /******/ // expose the module cache
/******/__webpack_require__.c = installedModules; /******/ // __webpack_public_path__
/******/__webpack_require__.p = ""; /******/ // Load entry module and return exports
/******/return __webpack_require__(0); /******/})([function(module,exports,__webpack_require__){'use strict';var _interopRequireWildcard=__webpack_require__(7)['default'];exports.__esModule = true;var _import=__webpack_require__(1);var base=_interopRequireWildcard(_import); // Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)
var _SafeString=__webpack_require__(2);var _SafeString2=_interopRequireWildcard(_SafeString);var _Exception=__webpack_require__(3);var _Exception2=_interopRequireWildcard(_Exception);var _import2=__webpack_require__(4);var Utils=_interopRequireWildcard(_import2);var _import3=__webpack_require__(5);var runtime=_interopRequireWildcard(_import3);var _noConflict=__webpack_require__(6);var _noConflict2=_interopRequireWildcard(_noConflict); // For compatibility and usage outside of module systems, make the Handlebars object a namespace
function create(){var hb=new base.HandlebarsEnvironment();Utils.extend(hb,base);hb.SafeString = _SafeString2['default'];hb.Exception = _Exception2['default'];hb.Utils = Utils;hb.escapeExpression = Utils.escapeExpression;hb.VM = runtime;hb.template = function(spec){return runtime.template(spec,hb);};return hb;}var inst=create();inst.create = create;_noConflict2['default'](inst);inst['default'] = inst;exports['default'] = inst;module.exports = exports['default']; /***/},function(module,exports,__webpack_require__){'use strict';var _interopRequireWildcard=__webpack_require__(7)['default'];exports.__esModule = true;exports.HandlebarsEnvironment = HandlebarsEnvironment;exports.createFrame = createFrame;var _import=__webpack_require__(4);var Utils=_interopRequireWildcard(_import);var _Exception=__webpack_require__(3);var _Exception2=_interopRequireWildcard(_Exception);var VERSION='3.0.1';exports.VERSION = VERSION;var COMPILER_REVISION=6;exports.COMPILER_REVISION = COMPILER_REVISION;var REVISION_CHANGES={1:'<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
2:'== 1.0.0-rc.3',3:'== 1.0.0-rc.4',4:'== 1.x.x',5:'== 2.0.0-alpha.x',6:'>= 2.0.0-beta.1'};exports.REVISION_CHANGES = REVISION_CHANGES;var isArray=Utils.isArray,isFunction=Utils.isFunction,toString=Utils.toString,objectType='[object Object]';function HandlebarsEnvironment(helpers,partials){this.helpers = helpers || {};this.partials = partials || {};registerDefaultHelpers(this);}HandlebarsEnvironment.prototype = {constructor:HandlebarsEnvironment,logger:logger,log:log,registerHelper:function registerHelper(name,fn){if(toString.call(name) === objectType){if(fn){throw new _Exception2['default']('Arg not supported with multiple helpers');}Utils.extend(this.helpers,name);}else {this.helpers[name] = fn;}},unregisterHelper:function unregisterHelper(name){delete this.helpers[name];},registerPartial:function registerPartial(name,partial){if(toString.call(name) === objectType){Utils.extend(this.partials,name);}else {if(typeof partial === 'undefined'){throw new _Exception2['default']('Attempting to register a partial as undefined');}this.partials[name] = partial;}},unregisterPartial:function unregisterPartial(name){delete this.partials[name];}};function registerDefaultHelpers(instance){instance.registerHelper('helperMissing',function(){if(arguments.length === 1){ // A missing field in a {{foo}} constuct.
return undefined;}else { // Someone is actually trying to call something, blow up.
throw new _Exception2['default']('Missing helper: "' + arguments[arguments.length - 1].name + '"');}});instance.registerHelper('blockHelperMissing',function(context,options){var inverse=options.inverse,fn=options.fn;if(context === true){return fn(this);}else if(context === false || context == null){return inverse(this);}else if(isArray(context)){if(context.length > 0){if(options.ids){options.ids = [options.name];}return instance.helpers.each(context,options);}else {return inverse(this);}}else {if(options.data && options.ids){var data=createFrame(options.data);data.contextPath = Utils.appendContextPath(options.data.contextPath,options.name);options = {data:data};}return fn(context,options);}});instance.registerHelper('each',function(context,options){if(!options){throw new _Exception2['default']('Must pass iterator to #each');}var fn=options.fn,inverse=options.inverse,i=0,ret='',data=undefined,contextPath=undefined;if(options.data && options.ids){contextPath = Utils.appendContextPath(options.data.contextPath,options.ids[0]) + '.';}if(isFunction(context)){context = context.call(this);}if(options.data){data = createFrame(options.data);}function execIteration(field,index,last){if(data){data.key = field;data.index = index;data.first = index === 0;data.last = !!last;if(contextPath){data.contextPath = contextPath + field;}}ret = ret + fn(context[field],{data:data,blockParams:Utils.blockParams([context[field],field],[contextPath + field,null])});}if(context && typeof context === 'object'){if(isArray(context)){for(var j=context.length;i < j;i++) {execIteration(i,i,i === context.length - 1);}}else {var priorKey=undefined;for(var key in context) {if(context.hasOwnProperty(key)){ // We're running the iterations one step out of sync so we can detect
// the last iteration without have to scan the object twice and create
// an itermediate keys array.
if(priorKey){execIteration(priorKey,i - 1);}priorKey = key;i++;}}if(priorKey){execIteration(priorKey,i - 1,true);}}}if(i === 0){ret = inverse(this);}return ret;});instance.registerHelper('if',function(conditional,options){if(isFunction(conditional)){conditional = conditional.call(this);} // Default behavior is to render the positive path if the value is truthy and not empty.
// The `includeZero` option may be set to treat the condtional as purely not empty based on the
// behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
if(!options.hash.includeZero && !conditional || Utils.isEmpty(conditional)){return options.inverse(this);}else {return options.fn(this);}});instance.registerHelper('unless',function(conditional,options){return instance.helpers['if'].call(this,conditional,{fn:options.inverse,inverse:options.fn,hash:options.hash});});instance.registerHelper('with',function(context,options){if(isFunction(context)){context = context.call(this);}var fn=options.fn;if(!Utils.isEmpty(context)){if(options.data && options.ids){var data=createFrame(options.data);data.contextPath = Utils.appendContextPath(options.data.contextPath,options.ids[0]);options = {data:data};}return fn(context,options);}else {return options.inverse(this);}});instance.registerHelper('log',function(message,options){var level=options.data && options.data.level != null?parseInt(options.data.level,10):1;instance.log(level,message);});instance.registerHelper('lookup',function(obj,field){return obj && obj[field];});}var logger={methodMap:{0:'debug',1:'info',2:'warn',3:'error'}, // State enum
DEBUG:0,INFO:1,WARN:2,ERROR:3,level:1, // Can be overridden in the host environment
log:function log(level,message){if(typeof console !== 'undefined' && logger.level <= level){var method=logger.methodMap[level];(console[method] || console.log).call(console,message); // eslint-disable-line no-console
}}};exports.logger = logger;var log=logger.log;exports.log = log;function createFrame(object){var frame=Utils.extend({},object);frame._parent = object;return frame;} /* [args, ]options */ /***/},function(module,exports,__webpack_require__){'use strict';exports.__esModule = true; // Build out our basic SafeString type
function SafeString(string){this.string = string;}SafeString.prototype.toString = SafeString.prototype.toHTML = function(){return '' + this.string;};exports['default'] = SafeString;module.exports = exports['default']; /***/},function(module,exports,__webpack_require__){'use strict';exports.__esModule = true;var errorProps=['description','fileName','lineNumber','message','name','number','stack'];function Exception(message,node){var loc=node && node.loc,line=undefined,column=undefined;if(loc){line = loc.start.line;column = loc.start.column;message += ' - ' + line + ':' + column;}var tmp=Error.prototype.constructor.call(this,message); // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
for(var idx=0;idx < errorProps.length;idx++) {this[errorProps[idx]] = tmp[errorProps[idx]];}if(Error.captureStackTrace){Error.captureStackTrace(this,Exception);}if(loc){this.lineNumber = line;this.column = column;}}Exception.prototype = new Error();exports['default'] = Exception;module.exports = exports['default']; /***/},function(module,exports,__webpack_require__){'use strict';exports.__esModule = true;exports.extend = extend; // Older IE versions do not directly support indexOf so we must implement our own, sadly.
exports.indexOf = indexOf;exports.escapeExpression = escapeExpression;exports.isEmpty = isEmpty;exports.blockParams = blockParams;exports.appendContextPath = appendContextPath;var escape={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#x27;','`':'&#x60;'};var badChars=/[&<>"'`]/g,possible=/[&<>"'`]/;function escapeChar(chr){return escape[chr];}function extend(obj /* , ...source */){for(var i=1;i < arguments.length;i++) {for(var key in arguments[i]) {if(Object.prototype.hasOwnProperty.call(arguments[i],key)){obj[key] = arguments[i][key];}}}return obj;}var toString=Object.prototype.toString;exports.toString = toString; // Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/*eslint-disable func-style, no-var */var isFunction=function isFunction(value){return typeof value === 'function';}; // fallback for older versions of Chrome and Safari
/* istanbul ignore next */if(isFunction(/x/)){exports.isFunction = isFunction = function(value){return typeof value === 'function' && toString.call(value) === '[object Function]';};}var isFunction;exports.isFunction = isFunction; /*eslint-enable func-style, no-var */ /* istanbul ignore next */var isArray=Array.isArray || function(value){return value && typeof value === 'object'?toString.call(value) === '[object Array]':false;};exports.isArray = isArray;function indexOf(array,value){for(var i=0,len=array.length;i < len;i++) {if(array[i] === value){return i;}}return -1;}function escapeExpression(string){if(typeof string !== 'string'){ // don't escape SafeStrings, since they're already safe
if(string && string.toHTML){return string.toHTML();}else if(string == null){return '';}else if(!string){return string + '';} // Force a string conversion as this will be done by the append regardless and
// the regex test will do this transparently behind the scenes, causing issues if
// an object's to string has escaped characters in it.
string = '' + string;}if(!possible.test(string)){return string;}return string.replace(badChars,escapeChar);}function isEmpty(value){if(!value && value !== 0){return true;}else if(isArray(value) && value.length === 0){return true;}else {return false;}}function blockParams(params,ids){params.path = ids;return params;}function appendContextPath(contextPath,id){return (contextPath?contextPath + '.':'') + id;} /***/},function(module,exports,__webpack_require__){'use strict';var _interopRequireWildcard=__webpack_require__(7)['default'];exports.__esModule = true;exports.checkRevision = checkRevision; // TODO: Remove this line and break up compilePartial
exports.template = template;exports.wrapProgram = wrapProgram;exports.resolvePartial = resolvePartial;exports.invokePartial = invokePartial;exports.noop = noop;var _import=__webpack_require__(4);var Utils=_interopRequireWildcard(_import);var _Exception=__webpack_require__(3);var _Exception2=_interopRequireWildcard(_Exception);var _COMPILER_REVISION$REVISION_CHANGES$createFrame=__webpack_require__(1);function checkRevision(compilerInfo){var compilerRevision=compilerInfo && compilerInfo[0] || 1,currentRevision=_COMPILER_REVISION$REVISION_CHANGES$createFrame.COMPILER_REVISION;if(compilerRevision !== currentRevision){if(compilerRevision < currentRevision){var runtimeVersions=_COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[currentRevision],compilerVersions=_COMPILER_REVISION$REVISION_CHANGES$createFrame.REVISION_CHANGES[compilerRevision];throw new _Exception2['default']('Template was precompiled with an older version of Handlebars than the current runtime. ' + 'Please update your precompiler to a newer version (' + runtimeVersions + ') or downgrade your runtime to an older version (' + compilerVersions + ').');}else { // Use the embedded version info since the runtime doesn't know about this revision yet
throw new _Exception2['default']('Template was precompiled with a newer version of Handlebars than the current runtime. ' + 'Please update your runtime to a newer version (' + compilerInfo[1] + ').');}}}function template(templateSpec,env){ /* istanbul ignore next */if(!env){throw new _Exception2['default']('No environment passed to template');}if(!templateSpec || !templateSpec.main){throw new _Exception2['default']('Unknown template object: ' + typeof templateSpec);} // Note: Using env.VM references rather than local var references throughout this section to allow
// for external users to override these as psuedo-supported APIs.
env.VM.checkRevision(templateSpec.compiler);function invokePartialWrapper(partial,context,options){if(options.hash){context = Utils.extend({},context,options.hash);}partial = env.VM.resolvePartial.call(this,partial,context,options);var result=env.VM.invokePartial.call(this,partial,context,options);if(result == null && env.compile){options.partials[options.name] = env.compile(partial,templateSpec.compilerOptions,env);result = options.partials[options.name](context,options);}if(result != null){if(options.indent){var lines=result.split('\n');for(var i=0,l=lines.length;i < l;i++) {if(!lines[i] && i + 1 === l){break;}lines[i] = options.indent + lines[i];}result = lines.join('\n');}return result;}else {throw new _Exception2['default']('The partial ' + options.name + ' could not be compiled when running in runtime-only mode');}} // Just add water
var container={strict:function strict(obj,name){if(!(name in obj)){throw new _Exception2['default']('"' + name + '" not defined in ' + obj);}return obj[name];},lookup:function lookup(depths,name){var len=depths.length;for(var i=0;i < len;i++) {if(depths[i] && depths[i][name] != null){return depths[i][name];}}},lambda:function lambda(current,context){return typeof current === 'function'?current.call(context):current;},escapeExpression:Utils.escapeExpression,invokePartial:invokePartialWrapper,fn:function fn(i){return templateSpec[i];},programs:[],program:function program(i,data,declaredBlockParams,blockParams,depths){var programWrapper=this.programs[i],fn=this.fn(i);if(data || depths || blockParams || declaredBlockParams){programWrapper = wrapProgram(this,i,fn,data,declaredBlockParams,blockParams,depths);}else if(!programWrapper){programWrapper = this.programs[i] = wrapProgram(this,i,fn);}return programWrapper;},data:function data(value,depth){while(value && depth--) {value = value._parent;}return value;},merge:function merge(param,common){var obj=param || common;if(param && common && param !== common){obj = Utils.extend({},common,param);}return obj;},noop:env.VM.noop,compilerInfo:templateSpec.compiler};function ret(context){var options=arguments[1] === undefined?{}:arguments[1];var data=options.data;ret._setup(options);if(!options.partial && templateSpec.useData){data = initData(context,data);}var depths=undefined,blockParams=templateSpec.useBlockParams?[]:undefined;if(templateSpec.useDepths){depths = options.depths?[context].concat(options.depths):[context];}return templateSpec.main.call(container,context,container.helpers,container.partials,data,blockParams,depths);}ret.isTop = true;ret._setup = function(options){if(!options.partial){container.helpers = container.merge(options.helpers,env.helpers);if(templateSpec.usePartial){container.partials = container.merge(options.partials,env.partials);}}else {container.helpers = options.helpers;container.partials = options.partials;}};ret._child = function(i,data,blockParams,depths){if(templateSpec.useBlockParams && !blockParams){throw new _Exception2['default']('must pass block params');}if(templateSpec.useDepths && !depths){throw new _Exception2['default']('must pass parent depths');}return wrapProgram(container,i,templateSpec[i],data,0,blockParams,depths);};return ret;}function wrapProgram(container,i,fn,data,declaredBlockParams,blockParams,depths){function prog(context){var options=arguments[1] === undefined?{}:arguments[1];return fn.call(container,context,container.helpers,container.partials,options.data || data,blockParams && [options.blockParams].concat(blockParams),depths && [context].concat(depths));}prog.program = i;prog.depth = depths?depths.length:0;prog.blockParams = declaredBlockParams || 0;return prog;}function resolvePartial(partial,context,options){if(!partial){partial = options.partials[options.name];}else if(!partial.call && !options.name){ // This is a dynamic partial that returned a string
options.name = partial;partial = options.partials[partial];}return partial;}function invokePartial(partial,context,options){options.partial = true;if(partial === undefined){throw new _Exception2['default']('The partial ' + options.name + ' could not be found');}else if(partial instanceof Function){return partial(context,options);}}function noop(){return '';}function initData(context,data){if(!data || !('root' in data)){data = data?_COMPILER_REVISION$REVISION_CHANGES$createFrame.createFrame(data):{};data.root = context;}return data;} /***/},function(module,exports,__webpack_require__){(function(global){'use strict';exports.__esModule = true; /*global window */exports['default'] = function(Handlebars){ /* istanbul ignore next */var root=typeof global !== 'undefined'?global:window,$Handlebars=root.Handlebars; /* istanbul ignore next */Handlebars.noConflict = function(){if(root.Handlebars === Handlebars){root.Handlebars = $Handlebars;}};};module.exports = exports['default']; /* WEBPACK VAR INJECTION */}).call(exports,(function(){return this;})()); /***/},function(module,exports,__webpack_require__){"use strict";exports["default"] = function(obj){return obj && obj.__esModule?obj:{"default":obj};};exports.__esModule = true; /***/} /******/]);});;},{}],9:[function(require,module,exports){(function(process){ /* globals require, module */'use strict'; /**
   * Module dependencies.
   */var pathtoRegexp=require('path-to-regexp'); /**
   * Module exports.
   */module.exports = page; /**
   * Detect click event
   */var clickEvent='undefined' !== typeof document && document.ontouchstart?'touchstart':'click'; /**
   * To work properly with the URL
   * history.location generated polyfill in https://github.com/devote/HTML5-History-API
   */var location='undefined' !== typeof window && (window.history.location || window.location); /**
   * Perform initial dispatch.
   */var dispatch=true; /**
   * Decode URL components (query string, pathname, hash).
   * Accommodates both regular percent encoding and x-www-form-urlencoded format.
   */var decodeURLComponents=true; /**
   * Base path.
   */var base=''; /**
   * Running flag.
   */var running; /**
   * HashBang option
   */var hashbang=false; /**
   * Previous context, for capturing
   * page exit events.
   */var prevContext; /**
   * Register `path` with callback `fn()`,
   * or route `path`, or redirection,
   * or `page.start()`.
   *
   *   page(fn);
   *   page('*', fn);
   *   page('/user/:id', load, user);
   *   page('/user/' + user.id, { some: 'thing' });
   *   page('/user/' + user.id);
   *   page('/from', '/to')
   *   page();
   *
   * @param {String|Function} path
   * @param {Function} fn...
   * @api public
   */function page(_x14,_x15){var _arguments2=arguments;var _again2=true;_function2: while(_again2) {var path=_x14,fn=_x15;route = i = undefined;_again2 = false; // <callback>
if('function' === typeof path){_x14 = '*';_x15 = path;_again2 = true;continue _function2;} // route <path> to <callback ...>
if('function' === typeof fn){var route=new Route(path);for(var i=1;i < _arguments2.length;++i) {page.callbacks.push(route.middleware(_arguments2[i]));} // show <path> with [state]
}else if('string' === typeof path){page['string' === typeof fn?'redirect':'show'](path,fn); // start [options]
}else {page.start(path);}}} /**
   * Callback functions.
   */page.callbacks = [];page.exits = []; /**
   * Current path being processed
   * @type {String}
   */page.current = ''; /**
   * Number of pages navigated to.
   * @type {number}
   *
   *     page.len == 0;
   *     page('/login');
   *     page.len == 1;
   */page.len = 0; /**
   * Get or set basepath to `path`.
   *
   * @param {String} path
   * @api public
   */page.base = function(path){if(0 === arguments.length)return base;base = path;}; /**
   * Bind with the given `options`.
   *
   * Options:
   *
   *    - `click` bind to click events [true]
   *    - `popstate` bind to popstate [true]
   *    - `dispatch` perform initial dispatch [true]
   *
   * @param {Object} options
   * @api public
   */page.start = function(options){options = options || {};if(running)return;running = true;if(false === options.dispatch)dispatch = false;if(false === options.decodeURLComponents)decodeURLComponents = false;if(false !== options.popstate)window.addEventListener('popstate',onpopstate,false);if(false !== options.click){document.addEventListener(clickEvent,onclick,false);}if(true === options.hashbang)hashbang = true;if(!dispatch)return;var url=hashbang && ~location.hash.indexOf('#!')?location.hash.substr(2) + location.search:location.pathname + location.search + location.hash;page.replace(url,null,true,dispatch);}; /**
   * Unbind click and popstate event handlers.
   *
   * @api public
   */page.stop = function(){if(!running)return;page.current = '';page.len = 0;running = false;document.removeEventListener(clickEvent,onclick,false);window.removeEventListener('popstate',onpopstate,false);}; /**
   * Show `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @param {Boolean} dispatch
   * @return {Context}
   * @api public
   */page.show = function(path,state,dispatch,push){var ctx=new Context(path,state);page.current = ctx.path;if(false !== dispatch)page.dispatch(ctx);if(false !== ctx.handled && false !== push)ctx.pushState();return ctx;}; /**
   * Goes back in the history
   * Back should always let the current route push state and then go back.
   *
   * @param {String} path - fallback path to go back if no more history exists, if undefined defaults to page.base
   * @param {Object} [state]
   * @api public
   */page.back = function(path,state){if(page.len > 0){ // this may need more testing to see if all browsers
// wait for the next tick to go back in history
history.back();page.len--;}else if(path){setTimeout(function(){page.show(path,state);});}else {setTimeout(function(){page.show(base,state);});}}; /**
   * Register route to redirect from one path to other
   * or just redirect to another route
   *
   * @param {String} from - if param 'to' is undefined redirects to 'from'
   * @param {String} [to]
   * @api public
   */page.redirect = function(from,to){ // Define route from a path to another
if('string' === typeof from && 'string' === typeof to){page(from,function(e){setTimeout(function(){page.replace(to);},0);});} // Wait for the push state and replace it with another
if('string' === typeof from && 'undefined' === typeof to){setTimeout(function(){page.replace(from);},0);}}; /**
   * Replace `path` with optional `state` object.
   *
   * @param {String} path
   * @param {Object} state
   * @return {Context}
   * @api public
   */page.replace = function(path,state,init,dispatch){var ctx=new Context(path,state);page.current = ctx.path;ctx.init = init;ctx.save(); // save before dispatching, which may redirect
if(false !== dispatch)page.dispatch(ctx);return ctx;}; /**
   * Dispatch the given `ctx`.
   *
   * @param {Object} ctx
   * @api private
   */page.dispatch = function(ctx){var prev=prevContext,i=0,j=0;prevContext = ctx;function nextExit(){var fn=page.exits[j++];if(!fn)return nextEnter();fn(prev,nextExit);}function nextEnter(){var fn=page.callbacks[i++];if(ctx.path !== page.current){ctx.handled = false;return;}if(!fn)return unhandled(ctx);fn(ctx,nextEnter);}if(prev){nextExit();}else {nextEnter();}}; /**
   * Unhandled `ctx`. When it's not the initial
   * popstate then redirect. If you wish to handle
   * 404s on your own use `page('*', callback)`.
   *
   * @param {Context} ctx
   * @api private
   */function unhandled(ctx){if(ctx.handled)return;var current;if(hashbang){current = base + location.hash.replace('#!','');}else {current = location.pathname + location.search;}if(current === ctx.canonicalPath)return;page.stop();ctx.handled = false;location.href = ctx.canonicalPath;} /**
   * Register an exit route on `path` with
   * callback `fn()`, which will be called
   * on the previous context when a new
   * page is visited.
   */page.exit = function(path,fn){if(typeof path === 'function'){return page.exit('*',path);}var route=new Route(path);for(var i=1;i < arguments.length;++i) {page.exits.push(route.middleware(arguments[i]));}}; /**
   * Remove URL encoding from the given `str`.
   * Accommodates whitespace in both x-www-form-urlencoded
   * and regular percent-encoded form.
   *
   * @param {str} URL component to decode
   */function decodeURLEncodedURIComponent(val){if(typeof val !== 'string'){return val;}return decodeURLComponents?decodeURIComponent(val.replace(/\+/g,' ')):val;} /**
   * Initialize a new "request" `Context`
   * with the given `path` and optional initial `state`.
   *
   * @param {String} path
   * @param {Object} state
   * @api public
   */function Context(path,state){if('/' === path[0] && 0 !== path.indexOf(base))path = base + (hashbang?'#!':'') + path;var i=path.indexOf('?');this.canonicalPath = path;this.path = path.replace(base,'') || '/';if(hashbang)this.path = this.path.replace('#!','') || '/';this.title = document.title;this.state = state || {};this.state.path = path;this.querystring = ~i?decodeURLEncodedURIComponent(path.slice(i + 1)):'';this.pathname = decodeURLEncodedURIComponent(~i?path.slice(0,i):path);this.params = {}; // fragment
this.hash = '';if(!hashbang){if(! ~this.path.indexOf('#'))return;var parts=this.path.split('#');this.path = parts[0];this.hash = decodeURLEncodedURIComponent(parts[1]) || '';this.querystring = this.querystring.split('#')[0];}} /**
   * Expose `Context`.
   */page.Context = Context; /**
   * Push state.
   *
   * @api private
   */Context.prototype.pushState = function(){page.len++;history.pushState(this.state,this.title,hashbang && this.path !== '/'?'#!' + this.path:this.canonicalPath);}; /**
   * Save the context state.
   *
   * @api public
   */Context.prototype.save = function(){history.replaceState(this.state,this.title,hashbang && this.path !== '/'?'#!' + this.path:this.canonicalPath);}; /**
   * Initialize `Route` with the given HTTP `path`,
   * and an array of `callbacks` and `options`.
   *
   * Options:
   *
   *   - `sensitive`    enable case-sensitive routes
   *   - `strict`       enable strict matching for trailing slashes
   *
   * @param {String} path
   * @param {Object} options.
   * @api private
   */function Route(path,options){options = options || {};this.path = path === '*'?'(.*)':path;this.method = 'GET';this.regexp = pathtoRegexp(this.path,this.keys = [],options.sensitive,options.strict);} /**
   * Expose `Route`.
   */page.Route = Route; /**
   * Return route middleware with
   * the given callback `fn()`.
   *
   * @param {Function} fn
   * @return {Function}
   * @api public
   */Route.prototype.middleware = function(fn){var self=this;return function(ctx,next){if(self.match(ctx.path,ctx.params))return fn(ctx,next);next();};}; /**
   * Check if this route matches `path`, if so
   * populate `params`.
   *
   * @param {String} path
   * @param {Object} params
   * @return {Boolean}
   * @api private
   */Route.prototype.match = function(path,params){var keys=this.keys,qsIndex=path.indexOf('?'),pathname=~qsIndex?path.slice(0,qsIndex):path,m=this.regexp.exec(decodeURIComponent(pathname));if(!m)return false;for(var i=1,len=m.length;i < len;++i) {var key=keys[i - 1];var val=decodeURLEncodedURIComponent(m[i]);if(val !== undefined || !hasOwnProperty.call(params,key.name)){params[key.name] = val;}}return true;}; /**
   * Handle "populate" events.
   */var onpopstate=(function(){var loaded=false;if('undefined' === typeof window){return;}if(document.readyState === 'complete'){loaded = true;}else {window.addEventListener('load',function(){setTimeout(function(){loaded = true;},0);});}return function onpopstate(e){if(!loaded)return;if(e.state){var path=e.state.path;page.replace(path,e.state);}else {page.show(location.pathname + location.hash,undefined,undefined,false);}};})(); /**
   * Handle "click" events.
   */function onclick(e){if(1 !== which(e))return;if(e.metaKey || e.ctrlKey || e.shiftKey)return;if(e.defaultPrevented)return; // ensure link
var el=e.target;while(el && 'A' !== el.nodeName) el = el.parentNode;if(!el || 'A' !== el.nodeName)return; // Ignore if tag has
// 1. "download" attribute
// 2. rel="external" attribute
if(el.hasAttribute('download') || el.getAttribute('rel') === 'external')return; // ensure non-hash for the same path
var link=el.getAttribute('href');if(!hashbang && el.pathname === location.pathname && (el.hash || '#' === link))return; // Check for mailto: in the href
if(link && link.indexOf('mailto:') > -1)return; // check target
if(el.target)return; // x-origin
if(!sameOrigin(el.href))return; // rebuild path
var path=el.pathname + el.search + (el.hash || ''); // strip leading "/[drive letter]:" on NW.js on Windows
if(typeof process !== 'undefined' && path.match(/^\/[a-zA-Z]:\//)){path = path.replace(/^\/[a-zA-Z]:\//,'/');} // same page
var orig=path;if(path.indexOf(base) === 0){path = path.substr(base.length);}if(hashbang)path = path.replace('#!','');if(base && orig === path)return;e.preventDefault();page.show(orig);} /**
   * Event button.
   */function which(e){e = e || window.event;return null === e.which?e.button:e.which;} /**
   * Check if `href` is the same origin.
   */function sameOrigin(href){var origin=location.protocol + '//' + location.hostname;if(location.port)origin += ':' + location.port;return href && 0 === href.indexOf(origin);}page.sameOrigin = sameOrigin;}).call(this,require('_process'));},{"_process":7,"path-to-regexp":10}],10:[function(require,module,exports){var isArray=require('isarray'); /**
 * Expose `pathToRegexp`.
 */module.exports = pathToRegexp; /**
 * The main path matching regexp utility.
 *
 * @type {RegExp}
 */var PATH_REGEXP=new RegExp([ // Match escaped characters that would otherwise appear in future matches.
// This allows the user to escape special characters that won't transform.
'(\\\\.)', // Match Express-style parameters and un-named parameters with a prefix
// and optional suffixes. Matches appear as:
//
// "/:test(\\d+)?" => ["/", "test", "\d+", undefined, "?"]
// "/route(\\d+)" => [undefined, undefined, undefined, "\d+", undefined]
'([\\/.])?(?:\\:(\\w+)(?:\\(((?:\\\\.|[^)])*)\\))?|\\(((?:\\\\.|[^)])*)\\))([+*?])?', // Match regexp special characters that are always escaped.
'([.+*?=^!:${}()[\\]|\\/])'].join('|'),'g'); /**
 * Escape the capturing group by escaping special characters and meaning.
 *
 * @param  {String} group
 * @return {String}
 */function escapeGroup(group){return group.replace(/([=!:$\/()])/g,'\\$1');} /**
 * Attach the keys as a property of the regexp.
 *
 * @param  {RegExp} re
 * @param  {Array}  keys
 * @return {RegExp}
 */function attachKeys(re,keys){re.keys = keys;return re;} /**
 * Get the flags for a regexp from the options.
 *
 * @param  {Object} options
 * @return {String}
 */function flags(options){return options.sensitive?'':'i';} /**
 * Pull out keys from a regexp.
 *
 * @param  {RegExp} path
 * @param  {Array}  keys
 * @return {RegExp}
 */function regexpToRegexp(path,keys){ // Use a negative lookahead to match only capturing groups.
var groups=path.source.match(/\((?!\?)/g);if(groups){for(var i=0;i < groups.length;i++) {keys.push({name:i,delimiter:null,optional:false,repeat:false});}}return attachKeys(path,keys);} /**
 * Transform an array into a regexp.
 *
 * @param  {Array}  path
 * @param  {Array}  keys
 * @param  {Object} options
 * @return {RegExp}
 */function arrayToRegexp(path,keys,options){var parts=[];for(var i=0;i < path.length;i++) {parts.push(pathToRegexp(path[i],keys,options).source);}var regexp=new RegExp('(?:' + parts.join('|') + ')',flags(options));return attachKeys(regexp,keys);} /**
 * Replace the specific tags with regexp strings.
 *
 * @param  {String} path
 * @param  {Array}  keys
 * @return {String}
 */function replacePath(path,keys){var index=0;function replace(_,escaped,prefix,key,capture,group,suffix,escape){if(escaped){return escaped;}if(escape){return '\\' + escape;}var repeat=suffix === '+' || suffix === '*';var optional=suffix === '?' || suffix === '*';keys.push({name:key || index++,delimiter:prefix || '/',optional:optional,repeat:repeat});prefix = prefix?'\\' + prefix:'';capture = escapeGroup(capture || group || '[^' + (prefix || '\\/') + ']+?');if(repeat){capture = capture + '(?:' + prefix + capture + ')*';}if(optional){return '(?:' + prefix + '(' + capture + '))?';} // Basic parameter support.
return prefix + '(' + capture + ')';}return path.replace(PATH_REGEXP,replace);} /**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 *
 * @param  {(String|RegExp|Array)} path
 * @param  {Array}                 [keys]
 * @param  {Object}                [options]
 * @return {RegExp}
 */function pathToRegexp(path,keys,options){keys = keys || [];if(!isArray(keys)){options = keys;keys = [];}else if(!options){options = {};}if(path instanceof RegExp){return regexpToRegexp(path,keys,options);}if(isArray(path)){return arrayToRegexp(path,keys,options);}var strict=options.strict;var end=options.end !== false;var route=replacePath(path,keys);var endsWithSlash=path.charAt(path.length - 1) === '/'; // In non-strict mode we allow a slash at the end of match. If the path to
// match already ends with a slash, we remove it for consistency. The slash
// is valid at the end of a path match, not in the middle. This is important
// in non-ending mode, where "/test/" shouldn't match "/test//route".
if(!strict){route = (endsWithSlash?route.slice(0,-2):route) + '(?:\\/(?=$))?';}if(end){route += '$';}else { // In non-ending mode, we need the capturing groups to match as much as
// possible by using a positive lookahead to the end or next path segment.
route += strict && endsWithSlash?'':'(?=\\/|$)';}return attachKeys(new RegExp('^' + route,flags(options)),keys);}},{"isarray":11}],11:[function(require,module,exports){module.exports = Array.isArray || function(arr){return Object.prototype.toString.call(arr) == '[object Array]';};},{}],12:[function(require,module,exports){'use strict';require('../../db/db')({protocol:JotApp.server.protocol,domain:JotApp.server.domain,username:JotApp.user.credentials.key,password:JotApp.user.credentials.password,dbName:'jot-' + JotApp.user._id});var router=require('../../routers/path');var RoutesHome=require('../../routes/client/home');var RoutesAuth=require('../../routes/client/auth');var RoutesJot=require('../../routes/client/jot');var RoutesGroup=require('../../routes/client/group');var TitleBarView=require('../../views/titlebar');var Handlebars=require('handlebars/dist/handlebars.runtime');var helpers=require('../../templates/helpers');var _iteratorNormalCompletion=true;var _didIteratorError=false;var _iteratorError=undefined;try{for(var _iterator=Object.keys(JotApp.templates)[Symbol.iterator](),_step;!(_iteratorNormalCompletion = (_step = _iterator.next()).done);_iteratorNormalCompletion = true) {var key=_step.value;Handlebars.registerPartial(key,Handlebars.template(JotApp.templates[key]));}}catch(err) {_didIteratorError = true;_iteratorError = err;}finally {try{if(!_iteratorNormalCompletion && _iterator["return"]){_iterator["return"]();}}finally {if(_didIteratorError){throw _iteratorError;}}}for(var helper in helpers) {Handlebars.registerHelper(helper,helpers[helper]);}var routesHome=new RoutesHome(router,'/');var routesAuth=new RoutesAuth(router,'/auth');var routesJot=new RoutesJot(router,'/jot',{item:JotApp.templates.jot,itemadd:JotApp.templates['note-add'],items:JotApp.templates.jots});var routesGroup=new RoutesGroup(router,'/group',{item:JotApp.templates.group,itemadd:JotApp.templates['note-add'],items:JotApp.templates.groups});routesHome.registerRoutes();routesAuth.registerRoutes();routesJot.registerRoutes();routesGroup.registerRoutes();var titleBar=new TitleBarView(JotApp.templates.titlebar,{'titlebar-title':JotApp.templates['titlebar-title']},document.getElementById('header'));titleBar.render(true);router.activate();},{"../../db/db":1,"../../routers/path":13,"../../routes/client/auth":15,"../../routes/client/group":16,"../../routes/client/home":17,"../../routes/client/jot":18,"../../templates/helpers":23,"../../views/titlebar":30,"handlebars/dist/handlebars.runtime":8}],13:[function(require,module,exports){'use strict';var page=require('page');module.exports = (function(){return {activate:function activate(){page();},get:function get(path,callback){page(path,callback);},go:function go(path){page(path);},back:function back(){if(window.history.length){window.history.back();}else {page('/');}},stop:function stop(path){page.stop();if(path){window.location = path;}}};})();},{"page":9}],14:[function(require,module,exports){'use strict';var Routes=require('./routes');var AuthRoutes=(function(_Routes){_inherits(AuthRoutes,_Routes);function AuthRoutes(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,AuthRoutes);_get(Object.getPrototypeOf(AuthRoutes.prototype),"constructor",this).call(this,router,prefix);this._routes.authGoogle = {_path:'/google',_method:['get'],_action:function _action(){return Promise.resolve();}};this._routes.callbackGoogle = {_path:'/google/callback',_method:['get'],_action:function _action(){return Promise.resolve();}};this._routes.signout = {_path:'/signout',_method:['get'],_action:function _action(){return Promise.resolve();}};}return AuthRoutes;})(Routes);module.exports = AuthRoutes;},{"./routes":22}],15:[function(require,module,exports){var AuthRoutes=require('../auth');var AuthRouter=(function(){function AuthRouter(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,AuthRouter);this._db = require('../../db/db')();this._router = router;this.routes = new AuthRoutes(router,prefix);}_createClass(AuthRouter,[{key:"registerRoutes",value:function registerRoutes(){var _this7=this;this.routes.registerRoute('signout',function(ctx,next){return Promise.resolve().then(function(){return {params:{},resolve:function resolve(){_this7._db.destroy().then(function(){_this7._router.stop(ctx.canonicalPath);});},reject:function reject(err){throw new Error(err);}};});});}}]);return AuthRouter;})();module.exports = AuthRouter;},{"../../db/db":1,"../auth":14}],16:[function(require,module,exports){var GroupRoutes=require('../group');var GroupsView=require('../../views/groups');var PubSub=require('../../utility/pubsub');var Group=require('../../models/group');var GroupClientRoutes=(function(){function GroupClientRoutes(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,GroupClientRoutes);this.routes = new GroupRoutes(router,prefix);this.groupsView = new GroupsView();}_createClass(GroupClientRoutes,[{key:"registerRoutes",value:function registerRoutes(){var _this8=this;this.routes.registerRoute('all',function(ctx,next){return Group.loadAll().then(function(groups){return {params:{},resolve:function resolve(events){_this8.groupsView.render(false,{groups:groups});PubSub.publish('routeChanged',{name:'Groups'});},reject:function reject(err){throw new Error(err);}};});});}}]);return GroupClientRoutes;})();module.exports = GroupClientRoutes;},{"../../models/group":2,"../../utility/pubsub":24,"../../views/groups":26,"../group":19}],17:[function(require,module,exports){var HomeRoutes=require('../home');var HomeView=require('../../views/home');var PubSub=require('../../utility/pubsub');var HomeRouter=(function(){function HomeRouter(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,HomeRouter);this.routes = new HomeRoutes(router,prefix);this.homeView = new HomeView();}_createClass(HomeRouter,[{key:"registerRoutes",value:function registerRoutes(){var _this9=this;this.routes.registerRoute('home',function(ctx,next){return Promise.resolve().then(function(){return {params:{},resolve:function resolve(events){_this9.homeView.render(false,{});PubSub.publish('routeChanged',{name:'Home'});},reject:function reject(err){throw new Error(err);}};});});}}]);return HomeRouter;})();module.exports = HomeRouter;},{"../../utility/pubsub":24,"../../views/home":27,"../home":20}],18:[function(require,module,exports){var JotRoutes=require('../jot');var JotsView=require('../../views/jots');var PubSub=require('../../utility/pubsub');var Jot=require('../../models/jot');var JotClientRoutes=(function(){function JotClientRoutes(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,JotClientRoutes);this.routes = new JotRoutes(router,prefix);this.jotsView = new JotsView();}_createClass(JotClientRoutes,[{key:"registerRoutes",value:function registerRoutes(){var _this10=this;this.routes.registerRoute('all',function(ctx,next){return Jot.loadAll().then(function(jots){return {params:{},resolve:function resolve(events){_this10.jotsView.render(false,{jots:jots});PubSub.publish('routeChanged',{name:'Jots'});},reject:function reject(err){throw new Error(err);}};});});}}]);return JotClientRoutes;})();module.exports = JotClientRoutes;},{"../../models/jot":3,"../../utility/pubsub":24,"../../views/jots":28,"../jot":21}],19:[function(require,module,exports){'use strict';var Routes=require('./routes');var Group=require('../models/group');var GroupRoutes=(function(_Routes2){_inherits(GroupRoutes,_Routes2);function GroupRoutes(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,GroupRoutes);_get(Object.getPrototypeOf(GroupRoutes.prototype),"constructor",this).call(this,router,prefix);this._routes.all = {_path:'/',_method:['get'],_action:function _action(){return Promise.resolve();}};this._routes.add = {_path:'/',_method:['post'],_action:function _action(params){return new Group({fields:{name:params.name}}).save();}};this._routes["delete"] = {_path:'/:id',_method:['post'],_action:function _action(params){if(params.action !== 'delete'){return Promise.reject(); //will cascade down to update etc.
}else {return Group.remove(params.id).then(function(result){return true;});}}};this._routes.update = {_path:'/:id',_method:['post'],_action:function _action(params){if(params.action !== 'update'){return Promise.reject();}else {return Group.load(params.id).then(function(group){group.fields = params.fields;return group.save();});}}};}return GroupRoutes;})(Routes);module.exports = GroupRoutes;},{"../models/group":2,"./routes":22}],20:[function(require,module,exports){'use strict';var Routes=require('./routes');var HomeRoutes=(function(_Routes3){_inherits(HomeRoutes,_Routes3);function HomeRoutes(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,HomeRoutes);_get(Object.getPrototypeOf(HomeRoutes.prototype),"constructor",this).call(this,router,prefix);this._routes.home = {_path:'/',_method:['get'],_action:function _action(){return Promise.resolve();}};}return HomeRoutes;})(Routes);module.exports = HomeRoutes;},{"./routes":22}],21:[function(require,module,exports){'use strict';var Routes=require('./routes');var Jot=require('../models/jot');var JotRoutes=(function(_Routes4){_inherits(JotRoutes,_Routes4);function JotRoutes(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,JotRoutes);_get(Object.getPrototypeOf(JotRoutes.prototype),"constructor",this).call(this,router,prefix);this._routes.all = {_path:'/',_method:['get'],_action:function _action(){return Promise.resolve();}};this._routes.add = {_path:'/',_method:['post'],_action:function _action(params){return new Jot({fields:{content:params.content,group:params.group}}).save();}};this._routes["delete"] = {_path:'/:id',_method:['post'],_action:function _action(params){if(params.action !== 'delete'){return Promise.reject(); //will cascade down to update etc.
}else {return Jot.remove(params.id).then(function(result){return true;});}}};this._routes.update = {_path:'/:id',_method:['post'],_action:function _action(params){if(params.action !== 'update'){return Promise.reject();}else {return Jot.load(params.id).then(function(jot){var currentFields=jot.fields;jot.fields = params.fields;if(typeof params.fields.done === 'undefined'){jot.fields.done = currentFields.done;}return jot.save();});}}};}return JotRoutes;})(Routes);module.exports = JotRoutes;},{"../models/jot":3,"./routes":22}],22:[function(require,module,exports){var Routes=(function(){function Routes(router){var prefix=arguments.length <= 1 || arguments[1] === undefined?'':arguments[1];_classCallCheck(this,Routes);this._router = router;this._prefix = prefix;this._routes = {};}_createClass(Routes,[{key:"registerRoute",value:function registerRoute(name,config){var _this11=this;var route=this._routes[name];route._method.forEach(function(method){_this11._router[method](_this11._prefix + route._path,function(){config.apply(undefined,arguments).then(function(result){return route._action(result.params).then(result.resolve)["catch"](result.reject);});});});}}]);return Routes;})();module.exports = Routes;},{}],23:[function(require,module,exports){'use strict';var Autolinker=require('autolinker');var Handlebars=require('handlebars/dist/handlebars.runtime');exports.ifEqual = ifEqual;exports.ifIn = ifIn;exports.autoLink = autoLink;function ifEqual(conditional,equalTo,options){if(conditional === equalTo){return options.fn(this);}return options.inverse(this);}function ifIn(elem,arr,options){if(arr.indexOf(elem) > -1){return options.fn(this);}return options.inverse(this);}function autoLink(elem,options){var url=Autolinker.link(Handlebars.escapeExpression(elem));return new Handlebars.SafeString(url);}},{"autolinker":5,"handlebars/dist/handlebars.runtime":8}],24:[function(require,module,exports){var PubSub=(function(){ //based on pubsub implementation at http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript
function PubSub(){_classCallCheck(this,PubSub); // Storage for topics that can be broadcast
// or listened to
this._topics = {}; // An topic identifier
this._subUid = -1;} // Publish or broadcast events of interest
// with a specific topic name and arguments
// such as the data to pass along
_createClass(PubSub,[{key:"publish",value:function publish(topic,args){if(!this._topics[topic]){return false;}var subscribers=this._topics[topic];var len=subscribers?subscribers.length:0;while(len--) {subscribers[len].func(topic,args);}return this;} // Subscribe to events of interest
// with a specific topic name and a
// callback function, to be executed
// when the topic/event is observed
},{key:"subscribe",value:function subscribe(topic,func){if(!this._topics[topic]){this._topics[topic] = [];}var token=(++this._subUid).toString();this._topics[topic].push({token:token,func:func});return token;} // Unsubscribe from a specific
// topic, based on a tokenized reference
// to the subscription
},{key:"unsubscribe",value:function unsubscribe(token){for(var m in this._topics) {if(this._topics[m]){for(var i=0,j=this._topics[m].length;i < j;i++) {if(this._topics[m][i].token === token){this._topics[m].splice(i,1);return token;}}}}return this;}}]);return PubSub;})();module.exports = new PubSub();},{}],25:[function(require,module,exports){var View=require('./view');var ActionBar=(function(_View){_inherits(ActionBar,_View);function ActionBar(){_classCallCheck(this,ActionBar);_get(Object.getPrototypeOf(ActionBar.prototype),"constructor",this).apply(this,arguments);}_createClass(ActionBar,[{key:"initEvents",value:function initEvents(){var _this12=this;_get(Object.getPrototypeOf(ActionBar.prototype),"initEvents",this).call(this);this._nav = this._el.querySelector('nav');this._navOverlay = this._el.querySelector('.md-nav-overlay');this._btnMenuOpen = this._el.querySelector('.md-btn-menu');this._btnMenuClose = this._el.querySelector('.md-btn-menu.close');this._links = this._el.querySelectorAll('.md-nav-body a');this._btnMenuOpen.addEventListener('click',function(event){event.preventDefault();_this12.openNav();});this._btnMenuClose.addEventListener('click',function(event){event.preventDefault();_this12.closeNav();});for(var _i=0;_i < this._links.length;_i++) {this._links[_i].addEventListener('click',function(){return _this12.closeNav();});}}},{key:"openNav",value:function openNav(){this._nav.classList.add('show');this._navOverlay.classList.add('show');}},{key:"closeNav",value:function closeNav(){this._nav.classList.remove('show');this._navOverlay.classList.remove('show');}}]);return ActionBar;})(View);module.exports = ActionBar;},{"./view":31}],26:[function(require,module,exports){'use strict';var MainView=require('./main');var Handlebars=require('handlebars/dist/handlebars.runtime');var Group=require('../models/group');var PubSub=require('../utility/pubsub');var ViewGroups=(function(_MainView){_inherits(ViewGroups,_MainView);function ViewGroups(template){var _this13=this;_classCallCheck(this,ViewGroups);_get(Object.getPrototypeOf(ViewGroups.prototype),"constructor",this).call(this,template);PubSub.subscribe('update',function(topic,args){console.log(args);if(args.changes && args.changes.length){Group.loadAll().then(function(groups){_this13.renderPartial('groups',false,{groups:groups});});}});}_createClass(ViewGroups,[{key:"render",value:function render(preRendered,params){console.log('render');if(!preRendered){var template=Handlebars.template(JotApp.templates.groups);var view=document.getElementById('view');view.innerHTML = template(params);var nameField=this._el.querySelector('#form-group-add').elements.name;nameField.focus();}this.initEvents();}},{key:"renderPartial",value:function renderPartial(name,preRendered,params){console.log('render partial');if(!preRendered){var template=Handlebars.template(JotApp.templates['group-list']);var view=this._el.querySelector('.group-list');view.outerHTML = template(params);this.initEdit();this.initDeleteForms();this.initUpdateForms();}}},{key:"initEvents",value:function initEvents(){this.initAddForm();this.initEdit();this.initDeleteForms();this.initUpdateForms();}},{key:"initAddForm",value:function initAddForm(){var _this14=this;var form=this._el.querySelector('#form-group-add');form.addEventListener('submit',function(event){event.preventDefault();var nameField=form.elements.name;var name=nameField.value;new Group({fields:{name:name}}).save().then(function(){nameField.value = '';Group.loadAll().then(function(groups){_this14.renderPartial('groups',false,{groups:groups});});});});}},{key:"initEdit",value:function initEdit(){var _this15=this;var links=this._el.querySelectorAll('.groups__group__edit');var _iteratorNormalCompletion2=true;var _didIteratorError2=false;var _iteratorError2=undefined;try{var _loop=function(){var link=_step2.value;link.addEventListener('click',function(event){event.preventDefault();event.stopPropagation(); //stop document listener from removing 'edit' class
_this15.unselectAllGroups();link.parentNode.classList.add('edit');var nameField=link.parentNode.querySelector('.form-group-update').elements.name;nameField.focus();nameField.value = nameField.value; //forces cursor to go to end of text
});};for(var _iterator2=links[Symbol.iterator](),_step2;!(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done);_iteratorNormalCompletion2 = true) {_loop();}}catch(err) {_didIteratorError2 = true;_iteratorError2 = err;}finally {try{if(!_iteratorNormalCompletion2 && _iterator2["return"]){_iterator2["return"]();}}finally {if(_didIteratorError2){throw _iteratorError2;}}}var cancels=this._el.querySelectorAll('.edit-cancel');var _iteratorNormalCompletion3=true;var _didIteratorError3=false;var _iteratorError3=undefined;try{for(var _iterator3=cancels[Symbol.iterator](),_step3;!(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done);_iteratorNormalCompletion3 = true) {var cancel=_step3.value;cancel.addEventListener('click',function(event){event.preventDefault(); //cancel.parentNode.classList.remove('edit');
//above will be handled by document listener below
});}}catch(err) {_didIteratorError3 = true;_iteratorError3 = err;}finally {try{if(!_iteratorNormalCompletion3 && _iterator3["return"]){_iterator3["return"]();}}finally {if(_didIteratorError3){throw _iteratorError3;}}}document.addEventListener('click',function(event){_this15.unselectAllGroups();});}},{key:"unselectAllGroups",value:function unselectAllGroups(){ //TODO: have class member to hold reference to common element/element groups to avoid requerying
var links=this._el.querySelectorAll('.groups__group__item');var _iteratorNormalCompletion4=true;var _didIteratorError4=false;var _iteratorError4=undefined;try{for(var _iterator4=links[Symbol.iterator](),_step4;!(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done);_iteratorNormalCompletion4 = true) {var link=_step4.value;link.parentNode.classList.remove('edit');}}catch(err) {_didIteratorError4 = true;_iteratorError4 = err;}finally {try{if(!_iteratorNormalCompletion4 && _iterator4["return"]){_iterator4["return"]();}}finally {if(_didIteratorError4){throw _iteratorError4;}}}}},{key:"initDeleteForms",value:function initDeleteForms(){var _this16=this;var forms=this._el.querySelectorAll('.form-group-delete');var _iteratorNormalCompletion5=true;var _didIteratorError5=false;var _iteratorError5=undefined;try{var _loop2=function(){var form=_step5.value;form.addEventListener('submit',function(event){event.preventDefault();var id=form.dataset.id;Group.remove(id).then(function(){Group.loadAll().then(function(groups){_this16.renderPartial('groups',false,{groups:groups});});});});};for(var _iterator5=forms[Symbol.iterator](),_step5;!(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done);_iteratorNormalCompletion5 = true) {_loop2();}}catch(err) {_didIteratorError5 = true;_iteratorError5 = err;}finally {try{if(!_iteratorNormalCompletion5 && _iterator5["return"]){_iterator5["return"]();}}finally {if(_didIteratorError5){throw _iteratorError5;}}}}},{key:"initUpdateForms",value:function initUpdateForms(){var _this17=this;var forms=this._el.querySelectorAll('.form-group-update');var _iteratorNormalCompletion6=true;var _didIteratorError6=false;var _iteratorError6=undefined;try{var _loop3=function(){var form=_step6.value;form.addEventListener('click',function(event){event.stopPropagation(); //stop document listener from removing 'edit' class
});form.addEventListener('submit',function(event){event.preventDefault();var id=form.dataset.id;var name=form.elements.name.value;Group.load(id).then(function(group){group.fields = {name:name};group.save().then(function(){Group.loadAll().then(function(groups){_this17.renderPartial('groups',false,{groups:groups});});});});});};for(var _iterator6=forms[Symbol.iterator](),_step6;!(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done);_iteratorNormalCompletion6 = true) {_loop3();}}catch(err) {_didIteratorError6 = true;_iteratorError6 = err;}finally {try{if(!_iteratorNormalCompletion6 && _iterator6["return"]){_iterator6["return"]();}}finally {if(_didIteratorError6){throw _iteratorError6;}}}}}]);return ViewGroups;})(MainView);module.exports = ViewGroups;},{"../models/group":2,"../utility/pubsub":24,"./main":29,"handlebars/dist/handlebars.runtime":8}],27:[function(require,module,exports){'use strict';var MainView=require('./main');var Handlebars=require('handlebars/dist/handlebars.runtime');var ViewHome=(function(_MainView2){_inherits(ViewHome,_MainView2);function ViewHome(){_classCallCheck(this,ViewHome);_get(Object.getPrototypeOf(ViewHome.prototype),"constructor",this).apply(this,arguments);}_createClass(ViewHome,[{key:"render",value:function render(preRendered,params){console.log('render');if(!preRendered){var template=Handlebars.template(JotApp.templates.home);var view=document.getElementById('view');view.innerHTML = template(params);}this.initEvents();}},{key:"initEvents",value:function initEvents(){}}]);return ViewHome;})(MainView);module.exports = ViewHome;},{"./main":29,"handlebars/dist/handlebars.runtime":8}],28:[function(require,module,exports){'use strict';var MainView=require('./main');var Handlebars=require('handlebars/dist/handlebars.runtime');var Jot=require('../models/jot');var PubSub=require('../utility/pubsub');var ViewJots=(function(_MainView3){_inherits(ViewJots,_MainView3);function ViewJots(template){var _this18=this;_classCallCheck(this,ViewJots);_get(Object.getPrototypeOf(ViewJots.prototype),"constructor",this).call(this,template);PubSub.subscribe('update',function(topic,args){console.log(args);if(args.changes && args.changes.length){Jot.loadAll().then(function(jots){_this18.renderPartial('jots',false,{jots:jots});});}});}_createClass(ViewJots,[{key:"render",value:function render(preRendered,params){console.log('render');if(!preRendered){var template=Handlebars.template(JotApp.templates.jots);var view=document.getElementById('view');view.innerHTML = template(params);var contentField=this._el.querySelector('#form-jot-add').elements.content;contentField.focus();}this.initEvents();}},{key:"renderPartial",value:function renderPartial(name,preRendered,params){console.log('render partial');if(!preRendered){var template=Handlebars.template(JotApp.templates['jot-list']);var view=this._el.querySelector('.jot-list');view.outerHTML = template(params);this.initEdit();this.initDeleteForms();this.initUpdateForms();}}},{key:"initEvents",value:function initEvents(){this.initAddForm();this.initEdit();this.initDeleteForms();this.initUpdateForms();}},{key:"initAddForm",value:function initAddForm(){var _this19=this;var form=this._el.querySelector('#form-jot-add');form.addEventListener('submit',function(event){event.preventDefault();var contentField=form.elements.content;var content=contentField.value;var groupField=form.elements.group;var group=groupField.value;new Jot({fields:{content:content,group:group}}).save().then(function(){contentField.value = '';groupField.value = '';Jot.loadAll().then(function(jots){_this19.renderPartial('jots',false,{jots:jots});});});});}},{key:"initEdit",value:function initEdit(){var _this20=this;var links=this._el.querySelectorAll('.jots__jot__edit');var _iteratorNormalCompletion7=true;var _didIteratorError7=false;var _iteratorError7=undefined;try{var _loop4=function(){var link=_step7.value;link.addEventListener('click',function(event){event.preventDefault();event.stopPropagation(); //stop document listener from removing 'edit' class
_this20.unselectAllJots();link.parentNode.classList.add('edit');var contentField=link.parentNode.querySelector('.form-jot-update').elements.content;contentField.focus();contentField.value = contentField.value; //forces cursor to go to end of text
});};for(var _iterator7=links[Symbol.iterator](),_step7;!(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done);_iteratorNormalCompletion7 = true) {_loop4();}}catch(err) {_didIteratorError7 = true;_iteratorError7 = err;}finally {try{if(!_iteratorNormalCompletion7 && _iterator7["return"]){_iterator7["return"]();}}finally {if(_didIteratorError7){throw _iteratorError7;}}}var cancels=this._el.querySelectorAll('.edit-cancel');var _iteratorNormalCompletion8=true;var _didIteratorError8=false;var _iteratorError8=undefined;try{for(var _iterator8=cancels[Symbol.iterator](),_step8;!(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done);_iteratorNormalCompletion8 = true) {var cancel=_step8.value;cancel.addEventListener('click',function(event){event.preventDefault(); //cancel.parentNode.classList.remove('edit');
//above will be handled by document listener below
});}}catch(err) {_didIteratorError8 = true;_iteratorError8 = err;}finally {try{if(!_iteratorNormalCompletion8 && _iterator8["return"]){_iterator8["return"]();}}finally {if(_didIteratorError8){throw _iteratorError8;}}}document.addEventListener('click',function(event){_this20.unselectAllJots();});}},{key:"unselectAllJots",value:function unselectAllJots(){ //TODO: have class member to hold reference to common element/element groups to avoid requerying
var links=this._el.querySelectorAll('.jots__jot__item');var _iteratorNormalCompletion9=true;var _didIteratorError9=false;var _iteratorError9=undefined;try{for(var _iterator9=links[Symbol.iterator](),_step9;!(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done);_iteratorNormalCompletion9 = true) {var link=_step9.value;link.parentNode.classList.remove('edit');}}catch(err) {_didIteratorError9 = true;_iteratorError9 = err;}finally {try{if(!_iteratorNormalCompletion9 && _iterator9["return"]){_iterator9["return"]();}}finally {if(_didIteratorError9){throw _iteratorError9;}}}}},{key:"initDeleteForms",value:function initDeleteForms(){var _this21=this;var forms=this._el.querySelectorAll('.form-jot-delete');var _iteratorNormalCompletion10=true;var _didIteratorError10=false;var _iteratorError10=undefined;try{var _loop5=function(){var form=_step10.value;form.addEventListener('submit',function(event){event.preventDefault();var id=form.dataset.id;Jot.remove(id).then(function(){Jot.loadAll().then(function(jots){_this21.renderPartial('jots',false,{jots:jots});});});});};for(var _iterator10=forms[Symbol.iterator](),_step10;!(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done);_iteratorNormalCompletion10 = true) {_loop5();}}catch(err) {_didIteratorError10 = true;_iteratorError10 = err;}finally {try{if(!_iteratorNormalCompletion10 && _iterator10["return"]){_iterator10["return"]();}}finally {if(_didIteratorError10){throw _iteratorError10;}}}}},{key:"initUpdateForms",value:function initUpdateForms(){var _this22=this;var forms=this._el.querySelectorAll('.form-jot-update');var _iteratorNormalCompletion11=true;var _didIteratorError11=false;var _iteratorError11=undefined;try{var _loop6=function(){var form=_step11.value;var doneButton=form.elements.done;var undoneButton=form.elements.undone;if(doneButton){doneButton.addEventListener('click',function(){form.elements['done-status'].value = 'done';});}if(undoneButton){undoneButton.addEventListener('click',function(){form.elements['done-status'].value = 'undone';});}form.addEventListener('click',function(event){event.stopPropagation(); //stop document listener from removing 'edit' class
});form.addEventListener('submit',function(event){event.preventDefault();var id=form.dataset.id;var content=form.elements.content.value;var group=form.elements.group.value;var doneStatus=form.elements['done-status'].value;Jot.load(id).then(function(jot){var currentFields=jot.fields;jot.fields = {content:content,group:group};if(doneStatus === 'done'){jot.fields.done = true;}else if(doneStatus === 'undone'){jot.fields.done = false;}else {jot.fields.done = currentFields.done;}jot.save().then(function(){Jot.loadAll().then(function(jots){_this22.renderPartial('jots',false,{jots:jots});});});});});};for(var _iterator11=forms[Symbol.iterator](),_step11;!(_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done);_iteratorNormalCompletion11 = true) {_loop6();}}catch(err) {_didIteratorError11 = true;_iteratorError11 = err;}finally {try{if(!_iteratorNormalCompletion11 && _iterator11["return"]){_iterator11["return"]();}}finally {if(_didIteratorError11){throw _iteratorError11;}}}}}]);return ViewJots;})(MainView);module.exports = ViewJots;},{"../models/jot":3,"../utility/pubsub":24,"./main":29,"handlebars/dist/handlebars.runtime":8}],29:[function(require,module,exports){var View=require('./view');var MainView=(function(_View2){_inherits(MainView,_View2);function MainView(template){_classCallCheck(this,MainView);_get(Object.getPrototypeOf(MainView.prototype),"constructor",this).call(this,template,document.getElementById('view'));}return MainView;})(View);module.exports = MainView;},{"./view":31}],30:[function(require,module,exports){var View=require('./view');var Handlebars=require('handlebars/dist/handlebars.runtime');var ActionBar=require('./actionbar');var PubSub=require('../utility/pubsub');var TitleBarView=(function(_View3){_inherits(TitleBarView,_View3);function TitleBarView(template,partials,el){var _this23=this;_classCallCheck(this,TitleBarView);_get(Object.getPrototypeOf(TitleBarView.prototype),"constructor",this).call(this,template,el);this._partials = partials;this._user = null;this.registerWidget(ActionBar,partials['titlebar-title']);PubSub.subscribe('routeChanged',function(topic,args){return _this23.updateName(args.name);});}_createClass(TitleBarView,[{key:"setUser",value:function setUser(user){this._user = user;}},{key:"updateName",value:function updateName(name){this._name = name;this.renderPartial('titlebar-title','titlebar-title');}},{key:"renderPartial",value:function renderPartial(partialId,partialName){var part=this._el.querySelector('#' + partialId);var template=Handlebars.template(this._partials[partialName]);part.outerHTML = template({name:this._name});this.initWidgets();}},{key:"render",value:function render(preRendered){_get(Object.getPrototypeOf(TitleBarView.prototype),"render",this).call(this,preRendered,{user:this._user,name:this._name});}}]);return TitleBarView;})(View);module.exports = TitleBarView;},{"../utility/pubsub":24,"./actionbar":25,"./view":31,"handlebars/dist/handlebars.runtime":8}],31:[function(require,module,exports){'use strict';var Handlebars=require('handlebars/dist/handlebars.runtime');var View=(function(){function View(template){var el=arguments.length <= 1 || arguments[1] === undefined?{}:arguments[1];_classCallCheck(this,View);this._template = template;this._el = el;this._widgets = [];}_createClass(View,[{key:"render",value:function render(preRendered,params){if(!preRendered){var template=Handlebars.template(this._template);this._el.innerHTML = template(params);}this.initEvents();}},{key:"initEvents",value:function initEvents(){this.initWidgets();}},{key:"registerWidget",value:function registerWidget(Widget,template){this._widgets.push(new Widget(template,this._el));return this._widgets.length - 1;}},{key:"unregisterWidget",value:function unregisterWidget(widgetIndex){this._widgets.splice(widgetIndex,1);}},{key:"initWidgets",value:function initWidgets(){this._widgets.forEach(function(widget){widget.initEvents();});}}]);return View;})();module.exports = View;},{"handlebars/dist/handlebars.runtime":8}]},{},[12]); /******/ /************************************************************************/ /******/ /* 0 */ /***/ /* 1 */ /***/ /* 2 */ /***/ /* 3 */ /***/ /* 4 */ /***/ /* 5 */ /***/ /* 6 */ /***/ /* WEBPACK VAR INJECTION */ /* 7 */ /***/
//# sourceMappingURL=app.js.map