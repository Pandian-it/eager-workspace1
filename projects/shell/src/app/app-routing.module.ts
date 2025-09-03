import { NgModule, Injector } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/module-federation';
import { ManifestService } from './manifest.service';

// Create a global reference to the injector
let appInjector: Injector;

const routes: Routes = [
  {
    path: 'cart',
    loadChildren: () => {
      const manifestService = appInjector.get(ManifestService);
      
      // For localhost, use direct URLs
      if (window.location.hostname === 'localhost') {
        return loadRemoteModule({
          type: 'module',
          remoteEntry: 'http://localhost:4201/remoteEntry.js',
          exposedModule: './Module'
        }).then(m => m.MfeModule);
      } else {
        // For production, use manifest
        return manifestService.loadManifest().then(() =>
          loadRemoteModule({
            type: 'module',
            remoteEntry: manifestService.getRemoteUrl('cart'),
            exposedModule: './Module'
          }).then(m => m.MfeModule)
        );
      }
    }
  },
  {
    path: 'checkout',
    loadChildren: () => {
      const manifestService = appInjector.get(ManifestService);
      
      if (window.location.hostname === 'localhost') {
        return loadRemoteModule({
          type: 'module',
          remoteEntry: 'http://localhost:4202/remoteEntry.js',
          exposedModule: './Module'
        }).then(m => m.MfeModule);
      } else {
        return manifestService.loadManifest().then(() =>
          loadRemoteModule({
            type: 'module',
            remoteEntry: manifestService.getRemoteUrl('checkout'),
            exposedModule: './Module'
          }).then(m => m.MfeModule)
        );
      }
    }
  },
  {
    path: 'orders',
    loadChildren: () => {
      const manifestService = appInjector.get(ManifestService);
      
      if (window.location.hostname === 'localhost') {
        return loadRemoteModule({
          type: 'module',
          remoteEntry: 'http://localhost:4203/remoteEntry.js',
          exposedModule: './Module'
        }).then(m => m.MfeModule);
      } else {
        return manifestService.loadManifest().then(() =>
          loadRemoteModule({
            type: 'module',
            remoteEntry: manifestService.getRemoteUrl('orders'),
            exposedModule: './Module'
          }).then(m => m.MfeModule)
        );
      }
    }
  },
  {
    path: '',
    redirectTo: '/cart',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/cart'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { 
    enableTracing: false 
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { 
  constructor(private injector: Injector) {
    appInjector = injector;
  }
}
