const { withInfoPlist, withEntitlementsPlist, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');
const { createLocationModule } = require('./LocationModule');
const { createLocationModuleBridge } = require('./LocationModuleBridge');

const withIOSLocationTracking = (config) => {
  config = withInfoPlist(config, (config) => {
    config.modResults.NSLocationWhenInUseUsageDescription = 
      'Este app precisa da sua localização para compartilhar com sua família.';
    config.modResults.NSLocationAlwaysUsageDescription = 
      'Este app precisa da sua localização em segundo plano para mantê-lo conectado com sua família.';
    config.modResults.NSLocationAlwaysAndWhenInUseUsageDescription = 
      'Este app precisa da sua localização para compartilhar com sua família.';
    
    if (!config.modResults.UIBackgroundModes) {
      config.modResults.UIBackgroundModes = [];
    }
    
    if (!config.modResults.UIBackgroundModes.includes('location')) {
      config.modResults.UIBackgroundModes.push('location');
    }
    
    if (!config.modResults.UIBackgroundModes.includes('remote-notification')) {
      config.modResults.UIBackgroundModes.push('remote-notification');
    }
    
    if (!config.modResults.UIBackgroundModes.includes('fetch')) {
      config.modResults.UIBackgroundModes.push('fetch');
    }

    return config;
  });

  config = withEntitlementsPlist(config, (config) => {
    if (!config.modResults['com.apple.security.application-groups']) {
      config.modResults['com.apple.security.application-groups'] = [];
    }
  
    const appGroups = config.modResults['com.apple.security.application-groups'];
  
    if (!appGroups.includes('group.com.atacte.mobile')) {
      appGroups.push('group.com.atacte.mobile');
    }

    return config;
  });

  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const atacteDir = path.join(iosProjectRoot, 'Atacte');
      
      if (!fs.existsSync(atacteDir)) {
        fs.mkdirSync(atacteDir, { recursive: true });
      }

      const locationModulePath = path.join(atacteDir, 'LocationModule.swift');
      fs.writeFileSync(locationModulePath, createLocationModule(), 'utf8');

      const locationBridgePath = path.join(atacteDir, 'LocationModule.m');
      fs.writeFileSync(locationBridgePath, createLocationModuleBridge(), 'utf8');

      return config;
    },
  ]);

  return config;
};

module.exports = { withIOSLocationTracking };

