import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface ManifestConfig {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class ManifestService {
  private manifest: ManifestConfig | null = null;
  //private readonly manifestUrl = 'https://your-cloudfront-domain.com/federation.manifest.json';
  private readonly cloudFrontUrl = 'https://your-cloudfront-domain.com/federation.manifest.json';
  private readonly localManifestUrl = 'mfe.manifest.json';
  private readonly mfeCloudFrontUrl = 'https://your-cloudfront-domain.com/';

  constructor(private http: HttpClient) {}

  async loadManifest(): Promise<void> {
    if (!this.manifest) {
      //this.manifest = await firstValueFrom(this.http.get<ManifestConfig>(this.manifestUrl));
      const isLocalhost = window.location.hostname === 'localhost';
      const manifestUrl = isLocalhost ? this.localManifestUrl : this.cloudFrontUrl;
      this.manifest = await firstValueFrom(this.http.get<ManifestConfig>(manifestUrl));

    }
  }

  getRemoteUrl(appName: string): string {
    if (!this.manifest) {
      throw new Error('Manifest not loaded');
    }
    if (window.location.hostname === 'localhost') {
        return this.manifest[appName];
    } else {
        return this.mfeCloudFrontUrl + appName +'/' + this.manifest[appName] + '/remoteEntry.json';
    }
   /* const remoteUrl = this.manifest[appName];
    if (!remoteUrl) {
      throw new Error(`Remote entry for ${appName} not found in manifest`);
    }
    return remoteUrl; */
  }
}