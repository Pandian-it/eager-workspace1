import { Component } from '@angular/core';
import { VersionService } from '@shared-lib';
import { StoreRequestHandlerService } from './services/store-request-handler.service';
import * as packageInfo from '../../package.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'checkout';
  version = '';

  constructor(
    private versionService: VersionService,
    private storeRequestHandler: StoreRequestHandlerService
  ) {
    ///console.log('packageInfo', packageInfo);
        this.version = this.versionService.getVersion(packageInfo);
   }
}
