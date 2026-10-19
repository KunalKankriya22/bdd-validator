import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';

export interface ViewDirectionData {
  locationId: string;
  locationName: string;
  directions: string;
}

@Component({
  selector: 'app-view-direction',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './view-direction.html',
  styleUrls: ['./view-direction.scss']
})
export class ViewDirectionComponent implements OnInit, OnDestroy {
  @Input() locationId: string = '';
  @Input() locationName: string = '';
  @Input() directions: string = '';

  @Output() closePanel = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  constructor(
    @Optional() @Inject(MAT_DIALOG_DATA) public data: ViewDirectionData | null,
    @Optional() public dialogRef: MatDialogRef<ViewDirectionComponent> | null
  ) {
    // If data is passed via dialog, use it
    if (data) {
      this.locationId = data.locationId;
      this.locationName = data.locationName;
      this.directions = data.directions;
    }
  }

  ngOnInit(): void {
    // Component initialized
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onClose(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.closePanel.emit();
    }
  }
}
