import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { routes } from './app-routing.module';
import { AppComponent } from './app.component';
import { RouterModule, Routes } from '@angular/router';
import { SharedComponentsModule } from './shared-components.module';
import { SharedMessagebusModule } from 'shared-messagebus';
import { StoreRequestHandlerService } from './services/store-request-handler.service';
import { CheckoutSummaryComponent } from './components/checkout-summary.component';

@NgModule({
  declarations: [
    CheckoutSummaryComponent
  ],
  imports: [
    RouterModule.forRoot(routes),
    BrowserModule,
    CommonModule,
    SharedComponentsModule,
    SharedMessagebusModule
  ],
  providers: [
    StoreRequestHandlerService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }