import { NgModule, Injector } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ManifestService } from './manifest.service';

// Create a global reference to the injector
let appInjector: Injector;

const routes: Routes = [
  {
    path: 'cart',
    loadChildren: () => {
      const manifestService = appInjector.get(ManifestService);
      return manifestService.loadRemoteModule('cart');
    }
  },
  {
    path: 'checkout',
    loadChildren: () => {
      const manifestService = appInjector.get(ManifestService);
      return manifestService.loadRemoteModule('checkout');
    }
  },
  {
    path: 'orders',
    loadChildren: () => {
      const manifestService = appInjector.get(ManifestService);
      return manifestService.loadRemoteModule('orders');
    }
  },
  {
    path: '',
    redirectTo: '/',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/'
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
