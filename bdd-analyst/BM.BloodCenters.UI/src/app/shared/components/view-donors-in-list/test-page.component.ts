import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { ViewDonorsInListDialog } from './view-donors-in-list';

@Component({
  selector: 'app-view-donors-test-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  template: `
    <div class="test-page-container">
      <mat-card class="test-card">
        <mat-card-header>
          <mat-card-title>View Donors in List - Test Page</mat-card-title>
          <mat-card-subtitle>MLT-11062: DEWDONRS Functionality</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p class="info-text">
            <strong>Note:</strong> This component currently uses mock data.
            The backend API is still in development.
          </p>

          <div class="button-group">
            <h3>Test Scenarios:</h3>

            <div class="scenario">
              <h4>1. Open as Right-Side Panel (No Pre-selected List)</h4>
              <button mat-raised-button color="primary" (click)="openBasicDialog()">
                Open Right Panel
              </button>
              <p class="description">Panel slides in from right with blurred background</p>
            </div>

            <div class="scenario">
              <h4>2. Open with pre-selected list (LIST00406)</h4>
              <button mat-raised-button color="primary" (click)="openWithListId('LIST00406')">
                Open with LIST00406
              </button>
              <p class="description">Dialog will auto-load LIST00406 and show mock donors</p>
            </div>

            <div class="scenario">
              <h4>3. Open with pre-selected list (LIST00407)</h4>
              <button mat-raised-button color="primary" (click)="openWithListId('LIST00407')">
                Open with LIST00407
              </button>
              <p class="description">Dialog will auto-load LIST00407 and show mock donors</p>
            </div>

          </div>

          <div class="features">
            <h3>Component Features:</h3>
            <ul>
              <li>✅ List selection dropdown with available list IDs</li>
              <li>✅ List information display (Name, Type, Size, Priority)</li>
              <li>✅ Full eligibility and Donor Override checkboxes (disabled/read-only)</li>
              <li>✅ Sortable table with 8 columns</li>
              <li>✅ Loading state with spinner</li>
              <li>✅ Empty state when no donors found</li>
              <li>✅ Error handling with error banner</li>
              <li>✅ Mock data (8 sample donors)</li>
              <li>✅ Keyboard navigation and accessibility</li>
            </ul>
          </div>

          <div class="mock-data-info">
            <h3>Mock Data:</h3>
            <p>Currently using 3 mock list IDs:</p>
            <ul>
              <li>LIST00406 - Contains 8 donors</li>
              <li>LIST00407 - Contains 8 donors</li>
              <li>LIST00408 - Contains 8 donors</li>
            </ul>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .test-page-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .test-card {
      margin-bottom: 24px;
    }

    .info-text {
      background-color: #fff3cd;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #ffc107;
      margin-bottom: 24px;
    }

    .button-group {
      margin: 24px 0;
    }

    .scenario {
      margin-bottom: 24px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .scenario h4 {
      margin-top: 0;
      margin-bottom: 12px;
      color: #1976d2;
    }

    .scenario button {
      margin-bottom: 8px;
    }

    .scenario .description {
      margin: 8px 0 0 0;
      font-size: 14px;
      color: #666;
      font-style: italic;
    }

    .features, .mock-data-info {
      margin: 24px 0;
      padding: 16px;
      background-color: #e8f5e9;
      border-radius: 8px;
    }

    .features h3, .mock-data-info h3 {
      margin-top: 0;
      color: #2e7d32;
    }

    .features ul, .mock-data-info ul {
      margin: 8px 0;
      padding-left: 24px;
    }

    .features li, .mock-data-info li {
      margin-bottom: 8px;
    }

    h3 {
      margin-top: 24px;
      margin-bottom: 16px;
    }
  `]
})
export class ViewDonorsTestPageComponent {
  private dialog = inject(MatDialog);

  openBasicDialog(): void {
    this.dialog.open(ViewDonorsInListDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop'
    });
  }

  openWithListId(listId: string): void {
    this.dialog.open(ViewDonorsInListDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: { listId }
    });
  }
}
