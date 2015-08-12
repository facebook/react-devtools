
module.exports = (bridge, agent, hook) => {
  bridge.onCall('relay:check', () => !!hook._relayInternals);
};
