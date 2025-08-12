import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SharedLibService {
 num:number = 0;
 value: number=0;
  constructor() { }
  getData() {
    return 'Shared Library Data';
  }

  calc2(a:number, b:number) {
    this.value =  a + b;
    
  }
}
