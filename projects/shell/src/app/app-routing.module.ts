/*import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';

const routes: Routes = [
  {
    path: 'mfe1',
    loadChildren: () =>
      loadRemoteModule({
        remoteName: 'mfe1',
        exposedModule: './Module',
        remoteEntry: 'http://localhost:4202/remoteEntry.json'
      }).then(m => m.MfeModule),
  },
  {
    path: 'mfe2',
    loadChildren: () =>
      loadRemoteModule({
        remoteName: 'mfe2',
        exposedModule: './Module',
        remoteEntry: 'http://localhost:4204/remoteEntry.json'
      }).then(m => m.MfeModule),
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
*/

import { NgModule } from '@angular/core';
import { RouterModule, Routes, Router } from '@angular/router';
import { loadRemoteModule } from '@angular-architects/native-federation';
import { ManifestService } from './manifest.service';

export const getRoutes = (manifestService: ManifestService): Routes => [
  {
    path: 'orders',
    loadChildren: async () => {
      const remoteUrl = manifestService.getRemoteUrl('orders');
    ///  console.log('Loading MFE1 from:', remoteUrl);
      const module = await loadRemoteModule({
        remoteName: 'orders',
        exposedModule: './Module',
        remoteEntry: remoteUrl
      });
      return module.MfeModule;
    }
  },
  {
    path: 'cart',
    loadChildren: async () => {
      const remoteUrl = manifestService.getRemoteUrl('cart');
      const module = await loadRemoteModule({
        remoteName: 'cart',
        exposedModule: './Module',
        remoteEntry: remoteUrl
      });
      return module.MfeModule;
    }
  },
  {
    path: 'checkout',
    loadChildren: async () => {
      const remoteUrl = manifestService.getRemoteUrl('checkout');
      const module = await loadRemoteModule({
        remoteName: 'checkout',
        exposedModule: './Module',
        remoteEntry: remoteUrl
      });
      return module.MfeModule;
    }
  }
];

@NgModule({
  imports: [RouterModule.forRoot([])],
  exports: [RouterModule]
})
export class AppRoutingModule {
  constructor(private manifestService: ManifestService,  private router: Router) {
    this.initializeRoutes();
  }

  private async initializeRoutes() {
    await this.manifestService.loadManifest();
    const routes = getRoutes(this.manifestService);
    console.log('Routes initialized:', routes);
   // const router = RouterModule.forRoot(routes);
    this.router.resetConfig(routes);

  }
}
