import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  log(message: string, data?: any): void {
    console.log(message, data);
  }

  error(message: string, error?: any): void {
    console.error(message, error);
  }

  warn(message: string, data?: any): void {
    console.warn(message, data);
  }

  debug(message: string, data?: any): void {
    if (!this.isProduction()) {
      console.debug(message, data);
    }
  }

  private isProduction(): boolean {
    return false;
  }
}
