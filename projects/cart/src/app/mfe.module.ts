import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routes } from  './app-routing.module'
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedComponentsModule } from './shared-components.module';

@NgModule({
  declarations: [],
  imports: [
  RouterModule.forChild(routes),
  CommonModule,
  SharedComponentsModule
  ],
  providers: [],
  exports: [AppComponent]

})
export class MfeModule { }
