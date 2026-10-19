import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { VersionService } from '@shared/services/version.service';

/**
 * Version Information Dialog Component
 * Displays the BloodCenter application release version
 */
@Component({
  selector: 'app-version-info-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './version-info-dialog.component.html',
  styleUrls: ['./version-info-dialog.component.scss']
})
export class VersionInfoDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<VersionInfoDialogComponent>);
  private readonly versionService = inject(VersionService);

  releaseVersion = 'Loading...';
  isLoading = true;

  ngOnInit(): void {
    this.versionService.getVersionInfo().subscribe({
      next: (info) => {
        this.releaseVersion = info.releaseVersion || info.uiVersion || 'Unknown';
        this.isLoading = false;
      },
      error: () => {
        this.releaseVersion = 'Unknown';
        this.isLoading = false;
      }
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
