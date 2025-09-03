const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'shell',

  remotes: {
    "cart": "http://localhost:4201/remoteEntry.js", 
    "checkout": "http://localhost:4202/remoteEntry.js", 
    "orders": "http://localhost:4203/remoteEntry.js", 
  },

  shared: {
    ...shareAll({ 
      singleton: true, 
      strictVersion: true, 
      requiredVersion: 'auto' 
    }),
    
    // Explicitly share the custom shared libraries
    '@shared-lib': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
      eager: true  // Load immediately in shell to ensure it's available for MFEs
    },
    
    '@shared-ui': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
      eager: true  // Load immediately in shell to ensure it's available for MFEs
    },
  },

});
