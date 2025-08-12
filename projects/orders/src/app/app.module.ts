import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { routes } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedComponentsModule } from './shared-components.module';

@NgModule({
  declarations: [],
  imports: [
  RouterModule.forRoot(routes),
  BrowserModule,
  SharedComponentsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
