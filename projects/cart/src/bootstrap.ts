import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { MfeModule } from './app/mfe.module';
  
  platformBrowserDynamic().bootstrapModule(MfeModule, {
    ngZoneEventCoalescing: true
  })
    .catch(err => console.error(err));
  