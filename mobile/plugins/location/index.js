const { withAndroidLocationTracking } = require('./android');
const { withIOSLocationTracking } = require('./ios');

const withNativeLocation = (config) => {
  config = withAndroidLocationTracking(config);
  
  config = withIOSLocationTracking(config);
  
  return config;
};

module.exports = withNativeLocation;

