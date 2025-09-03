const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'checkout',

  exposes: {
    './Module': './projects/checkout/src/app/mfe.module.ts',
  },

  shared: {
    ...shareAll({ 
      singleton: true, 
      strictVersion: true, 
      requiredVersion: 'auto' 
    }),
    
    // Explicitly share the custom shared library
    '@shared-lib': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
      eager: false  // Only load if needed, prefer from shell if available
    },
    
    // Also share @shared-ui since checkout uses it
    '@shared-ui': {
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
      eager: false
    },
  },

});
