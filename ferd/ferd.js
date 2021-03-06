/**
 * Requirements
 */
var extend = require('extend');
var Promise = require('bluebird');
var request = require('request');
var qs = require('querystring');
var WebSocket = require('ws');

var MessageHandler = require('./messageHandler');

/**
 * Ferd() sets up ferd!
 */
var Ferd = function(config) {
  this.sessions = {};
  this.token = config.apiKey;
  this.messageHandler = new MessageHandler(config.ferd_modules);
  this.login();
};

/**
 * login() logs Ferd in
 *
 * @return {}
 */
Ferd.prototype.login = function() {
  this._api('rtm.start')
    .then(function(data) {
      this.url = data.url;
      this.self = data.self;
      this.team = data.team;
      this.users = data.users;
      this.sessions = {};
      this.connect();
    }.bind(this));
};

/**
 * connect() Opens up a connection to the web socket, and handles all types
 * of events.
 *
 * @return {}
 */
Ferd.prototype.connect = function() {
  this.ws = new WebSocket(this.url);
  this.ws.on('message', function(data, flags) {
    this.onMessage(data);
  }.bind(this));
  this.ws.on('close', function() {
  }.bind(this));
};

Ferd.prototype.disconnect = function() {
  this.ws.close();
};

Ferd.prototype.setToken = function(token) {
  this.token = token;
};

/**
 * onMessage()
 *
 * @param  {String}
 * @return {}
 */
Ferd.prototype.onMessage = function (data) {
  var message = {};
  var handler;
  data = this.parse(data);

  // intercepting presence events
  if (data.type === 'presence_change') {
    data.ferd = { 
      agent : 'ferd',
      module : 'presence',
      text: data.presence
    };
  }

  // intercepting direct sessions
  if (data.user && data.channel && data.type === 'message') {
    var targetModule = this.sessions[data.user + '-' + data.channel] || null;    
    if (targetModule !== null) {
      data.ferd = data.ferd || {};
      data.ferd.agent = 'ferd';
      data.ferd.module = targetModule;
      data.ferd.text = data.text;
    }
  }

  if (data.ferd && 
      data.ferd.agent === 'ferd' && 
      data.ferd.module) {
    handler = this.messageHandler.getHandler(data.ferd.module);
    if (handler) {
      message = handler(data, this);
    }
  }
};

/**
 * parse() parses data to JSON and appends ferd metadata
 * @param  {String} data
 * @return {Object}
 */
Ferd.prototype.parse = function(data) {
  data = JSON.parse(data);
  var re = /^(ferd)\s(\S*)\s*(.*)/;
  var m = re.exec(data.text);
  if (m !== null) {
    if (m.index === re.lastIndex) {
      re.lastIndex++;
    }
  }
  if (m !== null) {
    data.ferd = {};
    data.ferd.agent = m[1];
    data.ferd.module = m[2];
    data.ferd.text = m[3];
  }
  return data;
};

/**
 * sendMessage() Sends a message to the general channel
 * @param {Object}
 * @return {}
 */
Ferd.prototype.sendMessage = function(params) {
  return this._api('chat.postMessage', params)
    .then(function(data) {
      // console.log(data);
    })
    .catch(function(err) {
      console.log('error');
    });
};

/**
 * openSession() Adds a listener to allow delegation 
 * to bypass 'ferd' keyword
 *
 * @param  {String}
 * @param  {String}
 * @return {Object}
 */
Ferd.prototype.openSession = function (user, channel, module) {
  this.sessions[user + '-' + channel] = module;
};

/**
 * openSession() Adds a listener to allow delegation 
 * to bypass 'ferd' keyword
 *
 * @param  {String}
 * @return {Object}
 */
Ferd.prototype.closeSession = function (user, channel) {
  this.sessions[user + '-' + channel] = null;
};

/**
 * _api() A wrapper function for making calls to the Slack API
 *
 * @param  {String}
 * @param  {Object}
 * @return {Object}
 */
Ferd.prototype._api = function(methodName, params) {
  params = params || {};
  params = extend(params, {token: this.token});

  var path = methodName + '?' + qs.stringify(params);
  var data = { url: 'https://slack.com/api/' + path };

  return new Promise(function(resolve, reject) {
    request.get(data, function(err, request, body) {
      if (err) {
        reject(err);
        return false;
      } else {
        body = JSON.parse(body);
        resolve(body);
      }
    });
  });
};

/**
 * Thin wrapper for MessageHandler.addHandler method
 * @param {String} handlerName
 */
Ferd.prototype.addHandler = function(handlerName) {
  return this.messageHandler.addHandler(handlerName);
};

/**
 * Thin wrapper for MessageHandler.removeHandler method
 * @param {String} handlerName
 */
Ferd.prototype.removeHandler = function(handlerName) {
  return this.messageHandler.removeHandler(handlerName);
};

/**
 * Thin wrapper for MessageHandler.getHandlers method
 * @return {Array} All handlers
 */
Ferd.prototype.getHandlers = function() {
  return this.messageHandler.getHandlers();
};

module.exports = Ferd;
