import { Component, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SendLetterDialog } from './send-letter-dialog';
import { SendLetterDialogData, SendLetterResult } from './send-letter-dialog.model';

@Component({
  selector: 'app-send-letter-test',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, PageHeaderWithBreadcrumb, SendLetterDialog],
  template: `
    <div class="send-letter-test-page">
      <app-page-header-with-breadcrumb [config]="headerConfig" />

      <div class="content-container">
        <mat-card class="form-card">
          <mat-card-content>
            <div class="section-header">
              <h2 class="section-title">Send Letter Test</h2>
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
                  (click)="openPanel()"
                  [disabled]="!donorId"
                  class="open-btn"
                >
                  OPEN SEND LETTER POPUP
                </button>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>

    @if (showPanel) {
      <div class="panel-backdrop"></div>
    }
    @if (showPanel && panelData) {
      <app-send-letter-dialog
        [data]="panelData"
        (closePanel)="onPanelClose($event)">
      </app-send-letter-dialog>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .send-letter-test-page {
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

    .panel-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      animation: fadeIn 0.28s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `],
})
export class SendLetterTestComponent {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: '',
    subtitle: '',
  };

  donorId = 'DN00014473';
  showPanel = false;
  panelData: SendLetterDialogData | null = null;

  constructor(private pageHeaderService: PageHeaderService) {
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  openPanel(): void {
    this.panelData = { donorIds: [this.donorId] };
    this.showPanel = true;
  }

  onPanelClose(result: SendLetterResult): void {
    this.showPanel = false;
    this.panelData = null;
  }
}
