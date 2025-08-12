const { withNativeFederation, shareAll, share } = require('@angular-architects/native-federation/config');
///const mf = require("@angular-architects/module-federation/webpack");
const path = require('path');


///const sharedMapping =  new mf.SharedMappings();

/*sharedMapping.register(
  path.join(__dirname, '../../tsconfig.json'), 
  ['shared-lib']
); */


module.exports = withNativeFederation({

  name: 'orders',

  exposes: {
    './Module': './projects/orders/src/app/mfe.module.ts',
  },
///shared:{},
  shared: {
   ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  ///  ...sharedMapping.getDescriptors()
  }, 
sharedMappings: ['@shared-lib']

});
