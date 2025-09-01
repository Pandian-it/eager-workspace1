import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface ManifestConfig {
  [key: string]: string | {
    version: string;
    release: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ManifestService {
  private manifest: ManifestConfig | null = null;
  private readonly localManifestUrl = 'mfe.manifest.json';
  private readonly deploymentManifestUrl = 'deployment-manifest.json';

  constructor(private http: HttpClient) {}

  async loadManifest(): Promise<void> {
    if (!this.manifest) {
      const isLocalhost = window.location.hostname === 'localhost';
      
      let manifestUrl: string;
      if (isLocalhost) {
        manifestUrl = this.localManifestUrl;
      } else {
        // Derive CloudFront URL from current domain
        const currentOrigin = window.location.origin;
        manifestUrl = `${currentOrigin}/${this.deploymentManifestUrl}`;
      }
      
      this.manifest = await firstValueFrom(this.http.get<ManifestConfig>(manifestUrl));
    }
  }

  getRemoteUrl(appName: string): string {
    if (!this.manifest) {
      throw new Error('Manifest not loaded');
    }
    
    const appConfig = this.manifest[appName];
    if (!appConfig) {
      throw new Error(`App '${appName}' not found in manifest`);
    }
    
    if (window.location.hostname === 'localhost') {
      // For localhost, mfe.manifest.json contains direct URLs
      return appConfig as string;
    } else {
      // For production, deployment-manifest.json contains version objects
      const deploymentConfig = appConfig as { version: string; release: string };
      const currentOrigin = window.location.origin;
      return `${currentOrigin}/apps/${appName}/${deploymentConfig.version}/remoteEntry.json`;
    }
  } 
}