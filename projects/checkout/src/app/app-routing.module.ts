
import { Routes } from '@angular/router';
import { AppComponent } from './app.component';

/*
const routes: Routes = [];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
*/
export const routes: Routes = [
  {
    path: '',
    children: [
 
      {
        path: '', pathMatch: 'full', component: AppComponent
        
      }
    ]
  }
];
