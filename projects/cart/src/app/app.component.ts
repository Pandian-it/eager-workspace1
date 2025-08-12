import { Component } from '@angular/core';
///import { RouterOutlet } from '@angular/router';
import { VersionService } from '@shared-lib';
import * as packageInfo from '../../package.json';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Cart Items';
  version: string;

  constructor(private versionService: VersionService) {
    this.version = this.versionService.getVersion(packageInfo);
  }
}
