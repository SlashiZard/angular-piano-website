import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MathService {
  // ----------------------------------------------------------------------------------
  // Math Functions
  // ----------------------------------------------------------------------------------

  /* Returns True if n is (a whole number and) a power of two. */
  public power_of_2(n: number) {
    return (n - Math.floor(n) === 0) && (n && (n & (n - 1)) === 0);
  }

  constructor() { }
}
