const { compose } = require('react-app-rewired');
const rewireMobx = require('react-app-rewire-mobx');

module.exports = function override(config, env) {
  const rewires = compose(rewireMobx);
  config = rewires(config, env);

  // Don't minify ethereumjs-util
  // TODO Remove this once https://github.com/ethereumjs/ethereumjs-util/pull/116 is merged
  config.plugins.splice(3, 1); // Remove the UglifyJsPlugin

  return config;
};
