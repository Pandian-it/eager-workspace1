import { Component } from '@angular/core';
import { VersionService } from '@shared-lib';
import * as packageInfo from '../../package.json';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  version = '';
  num = 0;
  constructor(private versionService: VersionService) {
        this.version = this.versionService.getVersion(packageInfo);
   }
  ngOnInit(): void {
    //// Code here runs when the component is initialized
   /* console.log('before Shared Library Data:', this.sharedLibService.num);
    this.sharedLibService.num++;
    this.num = this.sharedLibService.num;
    console.log('after Shared Library Data:', this.sharedLibService.num);
    this. getData();
    */

  }
  getData() {
   /// this.sharedLibService.calc2(5,6); // Accessing the shared library service
    //return this.sharedLibService.cal();
  }
}
