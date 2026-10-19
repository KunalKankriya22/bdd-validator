import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new Subject<boolean>();
  public loading$ = this.loadingSubject.asObservable();
  private activeRequests = 0;

  setLoading(isLoading: boolean, requestUrl?: string): void {
    if (isLoading) {
      this.activeRequests++;
    } else {
      this.activeRequests--;
    }

    if (this.activeRequests <= 0) {
      this.activeRequests = 0;
      this.loadingSubject.next(false);
    } else {
      this.loadingSubject.next(true);
    }
  }

  isLoading() {
    return this.loading$;
  }
}
