

 // import('./bootstrap').catch(err => console.error(err));
 import { initFederation } from '@angular-architects/native-federation';
 import { MfeModule } from './app/mfe.module';
initFederation()
  .catch((err) => console.error(err))
  .then((_) => import('./bootstrap'))
  .catch((err) => console.error(err));
  export { MfeModule };