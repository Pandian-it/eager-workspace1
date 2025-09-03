const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({

  name: 'orders',

  exposes: {
    './Module': './projects/orders/src/app/mfe.module.ts',
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
  },

});
