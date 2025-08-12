import { Component, OnInit  } from '@angular/core';
import { VersionService } from '@shared-lib';
import * as packageInfo from '../../package.json';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  version: string;
 // constructor(sharedLibService: SharedLibService) {
   // constructor() {
    constructor(private versionService: VersionService) {
    // You can use the shared library service here if needed
    // For example, you can access a property or method from the service
   // this.title = sharedLibService.num; // Assuming num is a property in SharedLibService
   /// console.log('Shared Library Data:', this.title);
     this.version = this.versionService.getVersion(packageInfo);
  }
  ngOnInit(): void {
    // Code here runs when the component is initialized
  /*  this.sharedLibService.num++;
    this.title = this.sharedLibService.num;
    console.log('Shared Library Data:', this.sharedLibService.num); */
  }
  
  // This is the title of the shell app, it can be used in the header or any other place

}
