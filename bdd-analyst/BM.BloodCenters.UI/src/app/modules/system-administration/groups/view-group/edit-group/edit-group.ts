import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { GroupService } from '../../services/group.service';
import { Group } from '../../models/group.model';
@Component({
  selector: 'app-edit-group',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    FormsModule
  ],
  templateUrl: './edit-group.html',
  styleUrl: './edit-group.scss'
})
export class EditGroupComponent {
  // Group being edited
  public group = signal<Group>({
    applId: '',
    groupId: '',
    description: '',
    userCount: 0
  });

  private originalDescription = '';

  public isChanged = computed(() => this.group().description !== this.originalDescription);
  public isSubmitting = signal<boolean>(false);

  constructor(
    private dialogRef: MatDialogRef<EditGroupComponent>,
    private groupService: GroupService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA) public data: { group: Group }
  ) {
    // Initialize with the passed group data
    if (data && data.group) {
      this.group.set({
        ...data.group
      });
      this.originalDescription = data.group.description;
    }
  }

  /**
   * Handle description input changes
   * @param event Input event
   */
  public handleDescriptionChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.group.update(current => ({
      ...current,
      description: value
    }));
  }

  /**
   * Save the group changes
   */
  public confirmChanges(): void {
    console.log('Confirm button clicked');
    const updatedGroup = this.group();
    console.log('Updating group:', updatedGroup);

    this.isSubmitting.set(true);

    this.groupService.updateGroup(updatedGroup).subscribe({
      next: (response) => {
        console.log('Group updated successfully:', response);
        this.isSubmitting.set(false);
        this.snackBar.open(`"${updatedGroup.description}" successfully updated`, 'DISMISS', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['content-snackbar']
        });
        this.dialogRef.close({ updated: true, group: response });
      },
      error: (error) => {
        console.error('Error updating group:', error);
        this.isSubmitting.set(false);
        this.snackBar.open('Failed to update group. Please try again.', 'DISMISS', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['content-snackbar']
        });
      }
    });
  }

  /**
   * Cancel editing and close the dialog
   */
  public cancelChanges(): void {
    this.dialogRef.close();
  }
}
