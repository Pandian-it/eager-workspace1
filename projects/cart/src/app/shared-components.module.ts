import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppComponent } from './app.component';
import { RouterModule } from '@angular/router';

@NgModule({
    declarations: [AppComponent],
    exports: [AppComponent],
    imports: [CommonModule, RouterModule]
  })
  export class SharedComponentsModule {}
  