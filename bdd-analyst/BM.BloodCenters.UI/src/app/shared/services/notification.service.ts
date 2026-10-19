import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

export interface Notification {
  type: NotificationType;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationSubject = new Subject<Notification>();
  public notification$ = this.notificationSubject.asObservable();

  showSuccess(message: string, duration: number = 3000): void {
    this.show({
      type: NotificationType.SUCCESS,
      message,
      duration
    });
  }

  showError(message: string, duration: number = 5000): void {
    this.show({
      type: NotificationType.ERROR,
      message,
      duration
    });
  }

  showWarning(message: string, duration: number = 4000): void {
    this.show({
      type: NotificationType.WARNING,
      message,
      duration
    });
  }

  showInfo(message: string, duration: number = 3000): void {
    this.show({
      type: NotificationType.INFO,
      message,
      duration
    });
  }

  private show(notification: Notification): void {
    this.notificationSubject.next(notification);
  }
}
