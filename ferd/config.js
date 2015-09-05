var helpers = require('../config/helpers');

/**
 * Thin wrapper aroung configuration file. Used in the case config schema changes.
 * @param {JSON} config [description]
 */
var Config = function(config) {
  this.config = config;
};
/**
 * Returns botKey
 * @return {String}
 */
Config.prototype.botKey = function() {
  return this.config.botKey;
};

/**
 * Returns botModules
 * @return {String}
 */
Config.prototype.botModules = function() {
  return this.config.botModules;
};

/**
 * Get a ferd configuration option used to instatiate a new Ferd object
 * @return {Object} {ferd_modules: '', apiKey: ''}
 */
Config.prototype.ferdConfig = function() {
  var config = {};
  config['ferd_modules'] = this.whitelistedBotModules();
  config['apiKey'] = this.botKey();
  return config;
};

/**
 * Helper function that returns whitelisted botList
 * @return {[type]}   [description]
 */
Config.prototype.whitelistedBotModules = function() {
  var botModules = this.botModules();
  var whitelistedBotModueles = helpers.whitelistify(botModules)
  console.log(whitelistedBotModueles);
  return whitelistedBotModueles;
};

module.exports = Config;
