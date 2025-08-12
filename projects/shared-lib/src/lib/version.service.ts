import { Injectable } from '@angular/core';


interface PackageInfo {
  version: string;
}
@Injectable({
  providedIn: 'root'
})
export class VersionService {
  getVersion(packageInfo: PackageInfo): string {
    return packageInfo.version;
  }
}