import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DonationNotesDialog } from './donation-notes';
import { DonationNotesDialogData } from './donation-notes.model';

@Component({
  selector: 'app-donation-notes-test-page',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatDialogModule],
  template: `
    <div class="test-page-container">
      <mat-card class="test-card">
        <mat-card-header>
          <mat-card-title>Donation Notes - Test Page</mat-card-title>
          <mat-card-subtitle>MLT-11059: DRWNOTES Functionality</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <p class="info-text">
            <strong>Note:</strong> This component is integrated with the backend API.
            Ensure the API server is running for live data.
          </p>

          <div class="button-group">
            <h3>Test Scenarios:</h3>

            <div class="scenario">
              <h4>1. By Unit ID + Collection Date</h4>
              <button mat-raised-button color="primary" (click)="openDialog('scenario1')">
                Open Right Panel - Scenario 1
              </button>
              <p class="description">Unit: W123411201111, Date: 2011-05-21 — access based on logged-in user's UNOTE/DNOTE permissions</p>
            </div>

            <div class="scenario">
              <h4>2. By Transaction ID</h4>
              <button mat-raised-button color="primary" (click)="openDialog('scenario2')">
                Open Right Panel - Scenario 2
              </button>
              <p class="description">Transaction: TR02858935 — same donation loaded via transaction ID</p>
            </div>

            <div class="scenario">
              <h4>3. By Unit ID (View-Only Context)</h4>
              <button mat-raised-button color="primary" (click)="openDialog('scenario3')">
                Open Right Panel - Scenario 3
              </button>
              <p class="description">Unit: W123411201111, no collection date — edit/delete disabled (no mutation context)</p>
            </div>

            <div class="scenario">
              <h4>4. Invalid Unit (Error Handling)</h4>
              <button mat-raised-button color="accent" (click)="openDialog('scenario4')">
                Open Right Panel - Scenario 4
              </button>
              <p class="description">Unit: NONEXISTENT — tests error handling for invalid data</p>
            </div>
          </div>

          <div class="features">
            <h3>Component Features:</h3>
            <ul>
              <li>✅ Right-side panel drawer with blurred background</li>
              <li>✅ View existing donation notes with metadata (date, entered by, name)</li>
              <li>✅ Add new notes with validation (max 240 characters)</li>
              <li>✅ Edit existing notes inline</li>
              <li>✅ Delete notes with confirmation</li>
              <li>✅ Access level control (UNOTE for add/update, DNOTE for delete)</li>
              <li>✅ Warning banner for limited access</li>
              <li>✅ Error handling with error banner</li>
              <li>✅ Loading states with spinner</li>
              <li>✅ Empty state when no notes found</li>
              <li>✅ Keyboard navigation and accessibility</li>
            </ul>
          </div>

          <div class="mock-data-info">
            <h3>Access Rights Info:</h3>
            <ul>
              <li>Access (add/edit/delete) is determined by the <strong>logged-in user's</strong> UNOTE/DNOTE permissions from the API</li>
              <li><strong>UNOTE permission:</strong> Allows adding and editing notes</li>
              <li><strong>DNOTE permission:</strong> Allows deleting notes</li>
              <li>If the user has neither, the panel is <strong>view-only</strong> with a warning banner</li>
            </ul>
          </div>

          <div class="qa-guide">
            <h3>QA Testing Guide:</h3>

            <div class="qa-scenario">
              <h4>Scenario 1 — By Unit ID + Collection Date</h4>
              <p><strong>Input:</strong> Unit ID = W123411201111, Collection Date = 2011-05-21, Chapter = 52</p>
              <p><strong>Purpose:</strong> Tests the primary lookup path with full mutation context.</p>
              <p><strong>Expected behavior:</strong></p>
              <ul>
                <li>Panel opens on the right side with blurred backdrop</li>
                <li>Header shows Unit ID and Draw Date</li>
                <li>Notes load from the API with loading spinner</li>
                <li>Each note shows: user name, note text</li>
                <li>Notes header row shows: Date, Entered By, Name of the first note</li>
                <li>If user has <strong>UNOTE</strong>: ADD button visible, EDIT button enabled on each note</li>
                <li>If user has <strong>DNOTE</strong>: DELETE button enabled on each note</li>
                <li>If user lacks UNOTE/DNOTE: warning banner shown, buttons disabled</li>
                <li><strong>ADD flow:</strong> Click ADD → form appears → type note (max 240 chars) → SAVE (disabled until text entered) → note added to list</li>
                <li><strong>EDIT flow:</strong> Click EDIT → textarea replaces note text → SAVE disabled until text changed → modify text → SAVE → note updated</li>
                <li><strong>DELETE flow:</strong> Click DELETE → confirmation dialog ("Are you sure?") → YES deletes, NO cancels</li>
                <li><strong>Validation:</strong> Max 240 characters — error shown instantly while typing (no need to blur or click save)</li>
                <li>CLOSE button or X icon closes the panel</li>
              </ul>
            </div>

            <div class="qa-scenario">
              <h4>Scenario 2 — By Transaction ID</h4>
              <p><strong>Input:</strong> Transaction ID = TR02858935, Chapter = 52 (no Unit ID or Collection Date)</p>
              <p><strong>Purpose:</strong> Tests alternate lookup path using transaction ID instead of unit ID.</p>
              <p><strong>Expected behavior:</strong></p>
              <ul>
                <li>Same panel layout as Scenario 1</li>
                <li>API resolves the transaction ID to the corresponding donation</li>
                <li>Notes and access rights load the same way</li>
                <li>Header shows the resolved Unit/Deferral ID (may be blank if transaction-only)</li>
                <li><strong>ADD, EDIT, and DELETE are all disabled/hidden</strong> because no collection date was provided (no mutation context — API requires unitId + collDate for all mutations)</li>
              </ul>
            </div>

            <div class="qa-scenario">
              <h4>Scenario 3 — View-Only Context (No Collection Date)</h4>
              <p><strong>Input:</strong> Unit ID = W123411201111, Chapter = 52 (no Collection Date)</p>
              <p><strong>Purpose:</strong> Tests the read-only path when collection date is missing — simulates opening notes from a context where mutation is not allowed.</p>
              <p><strong>Expected behavior:</strong></p>
              <ul>
                <li>Notes load successfully and display in the panel</li>
                <li>Header shows Unit ID but Draw Date is blank</li>
                <li><strong>ADD, EDIT, and DELETE buttons are all disabled/hidden</strong> regardless of user permissions (no mutation context without collection date)</li>
                <li>All mutations require both Unit ID and Collection Date — the API URL needs both parameters</li>
                <li>Warning banner may show depending on API access response</li>
                <li>This scenario verifies the component gracefully handles partial input</li>
              </ul>
            </div>

            <div class="qa-scenario">
              <h4>Scenario 4 — Invalid Unit (Error Handling)</h4>
              <p><strong>Input:</strong> Unit ID = NONEXISTENT, Collection Date = 2026-01-01, Chapter = 52</p>
              <p><strong>Purpose:</strong> Tests error handling when the API returns an error for invalid data.</p>
              <p><strong>Expected behavior:</strong></p>
              <ul>
                <li>Loading spinner shows briefly while API call is made</li>
                <li>API returns an error response</li>
                <li>Red error banner appears with error code and message from the API</li>
                <li>Error banner has a close (X) button to dismiss</li>
                <li>No notes displayed — empty state or error state shown</li>
                <li>Panel remains open and functional (CLOSE button works)</li>
              </ul>
            </div>

            <div class="qa-scenario">
              <h4>General Checks (All Scenarios)</h4>
              <ul>
                <li><strong>Save button state:</strong> Disabled until text is actually modified (pristine/dirty check)</li>
                <li><strong>Character limit:</strong> Error appears instantly at 240+ characters while typing — does NOT wait for blur or save click</li>
                <li><strong>Concurrent operations:</strong> All action buttons disabled while a save/delete is in progress (spinner shown on active button)</li>
                <li><strong>Panel position:</strong> Opens on the right side, top aligned with header (64px from top)</li>
                <li><strong>Backdrop:</strong> Blurred background behind the panel</li>
                <li><strong>Keyboard:</strong> Tab navigation works, Escape does not close (disableClose is false, but no ESC handler)</li>
              </ul>
            </div>
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

    .qa-guide {
      margin: 24px 0;
      padding: 16px;
      background-color: #e3f2fd;
      border-radius: 8px;
    }

    .qa-guide > h3 {
      margin-top: 0;
      color: #1565c0;
    }

    .qa-scenario {
      margin-bottom: 20px;
      padding: 16px;
      background-color: #fff;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .qa-scenario h4 {
      margin-top: 0;
      margin-bottom: 8px;
      color: #1565c0;
    }

    .qa-scenario p {
      margin: 4px 0;
      font-size: 14px;
    }

    .qa-scenario ul {
      margin: 8px 0;
      padding-left: 24px;
    }

    .qa-scenario li {
      margin-bottom: 6px;
      font-size: 14px;
    }
  `]
})
export class DonationNotesTestPage {
  private readonly dialog = inject(MatDialog);

  openDialog(scenario: string): void {
    let dialogData: DonationNotesDialogData;

    switch (scenario) {
      case 'scenario1':
        dialogData = {
          unitId: 'W123411201111',
          collectionDate: '2011-05-21',
          chapterId: '52',
        };
        break;

      case 'scenario2':
        dialogData = {
          transactionId: 'TR02858935',
          chapterId: '52',
        };
        break;

      case 'scenario3':
        dialogData = {
          unitId: 'W123411201111',
          chapterId: '52',
        };
        break;

      case 'scenario4':
        dialogData = {
          unitId: 'NONEXISTENT',
          collectionDate: '2026-01-01',
          chapterId: '52',
        };
        break;

      default:
        dialogData = {
          unitId: 'W123411201111',
          collectionDate: '2011-05-21',
          chapterId: '52',
        };
    }

    const dialogRef = this.dialog.open(DonationNotesDialog, {
      width: '900px',
      height: 'calc(100vh - 64px)',
      maxWidth: '100vw',
      maxHeight: 'calc(100vh - 64px)',
      panelClass: 'code-dialog-panel-right',
      position: { right: '0', top: '64px' },
      hasBackdrop: true,
      backdropClass: 'code-dialog-backdrop',
      data: dialogData,
      disableClose: false
    });

    dialogRef.afterClosed().subscribe();
  }
}
