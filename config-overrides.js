const { compose } = require('react-app-rewired');
const rewireMobx = require('react-app-rewire-mobx');

module.exports = function override(config, env) {
  const rewires = compose(rewireMobx);
  config = rewires(config, env);

  return config;
};
