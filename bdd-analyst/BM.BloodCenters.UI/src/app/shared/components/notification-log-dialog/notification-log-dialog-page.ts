import { Component, effect, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { Subject, takeUntil } from 'rxjs';
import { NotificationLogDialogComponent } from './notification-log-dialog';

@Component({
  selector: 'app-notification-log-dialog-page',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, PageHeaderWithBreadcrumb],
  template: `
    <div class="notification-log-test-page">
      <app-page-header-with-breadcrumb [config]="headerConfig" />

      <div class="content-container">
        <mat-card class="form-card">
          <mat-card-content>
            <div class="section-header">
              <h2 class="section-title">Notification Log</h2>
            </div>

            <div class="form-content">
              <div class="form-field-wrapper">
                <label class="field-label">Donor ID</label>
                <mat-form-field appearance="fill" class="field-width">
                  <mat-label>Donor ID</mat-label>
                  <input matInput [(ngModel)]="donorId" placeholder="Enter a valid Donor ID" />
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  type="button"
                  (click)="openNotificationLog()"
                  [disabled]="!donorId"
                  class="open-btn"
                >
                  OPEN NOTIFICATION LOG
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .notification-log-test-page {
      background-color: #ECEFF1;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .content-container {
        padding: 16px 16px 0 16px;
        width: 100%;
        box-sizing: border-box;
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }

      .form-card {
        background: #ffffff;
        border-radius: 4px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
        flex: 1;

        mat-card-content {
          padding: 20px 24px;
        }
      }

      .section-header {
        padding-bottom: 12px;
        margin-bottom: 20px;
        border-bottom: 1px solid #e0e0e0;

        .section-title {
          margin: 0;
          font-family: 'Roboto', sans-serif;
          font-size: 18px;
          font-weight: 500;
          color: #1d1b20;
        }
      }

      .form-content {
        .form-field-wrapper {
          margin-bottom: 20px;

          .field-label {
            display: block;
            font-family: 'Roboto', sans-serif;
            font-size: 14px;
            font-weight: 400;
            color: rgba(0, 0, 0, 0.87);
            margin-bottom: 8px;
            line-height: 1.4;
          }

          .field-width {
            width: 300px;
          }
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 24px;
          align-items: center;
          margin-top: 20px;
          max-width: 300px;

          .open-btn {
            background: #228189;
            color: #ffffff;
            font-family: 'Roboto', sans-serif;
            font-weight: 500;
            font-size: 14px;
            letter-spacing: 0;
            line-height: 36px;
            height: 40px;
            padding: 0 24px;
            min-width: 100px;

            &:hover:not([disabled]) {
              background-color: #1a6670;
            }

            &[disabled] {
              background-color: #e4e7e9 !important;
              color: #8d9ba3 !important;
              opacity: 1 !important;
              box-shadow: none !important;
              cursor: not-allowed;
            }
          }
        }
      }
    }
  `],
})
export class NotificationLogDialogPage implements OnInit, OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly pageHeaderService = inject(PageHeaderService);
  private destroy$ = new Subject<void>();

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
  };

  donorId = '';

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        const navigation = this.router.getCurrentNavigation();
        const state = navigation?.extras?.state || window.history.state;
        const breadcrumbs = state?.['fromDonorDetailQuery']
          ? [
              { label: 'Home', link: '/home' },
              { label: 'Donor Detail Query', link: '/donor-functions/donor-profile/donor-detail-query' },
              { label: pageData.title, link: null }
            ]
          : [
              { label: 'Home', link: '/home' },
              { label: pageData.title, link: null }
            ];
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs,
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  ngOnInit(): void {
    // Check for donorId in query params (from quick links)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const donorId = params['donorId'];
        if (donorId) {
          // Auto-populate donorId and open dialog
          this.donorId = donorId;
          this.openNotificationLog();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  openNotificationLog(): void {
    const dialogRef = this.dialog.open(NotificationLogDialogComponent, {
      width: '960px',
      height: 'calc(100vh - 64px)',
      maxWidth: '960px',
      maxHeight: 'calc(100vh - 64px)',
      position: { bottom: '0px', right: '0px' },
      panelClass: 'notification-log-dialog-panel',
      data: { donorId: this.donorId },
      autoFocus: false,
      disableClose: true,
    });

    dialogRef.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        // Dialog closed - stay on this page
      });
  }
}
