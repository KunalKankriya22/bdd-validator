import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SponsorContactModel, SponsorContactDetailModel, ContactNoteModel } from '../../../recruitment-administration/maintain-sponsor-contacts/models/maintain-sponsor-contacts.model';

@Component({
  selector: 'app-view-contact-notes',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './view-contact-notes.html',
  styleUrls: ['./view-contact-notes.scss']
})
export class ViewContactNotesComponent implements OnInit, OnChanges {
  @Input() data: SponsorContactModel | null = null;
  @Input() detailData: SponsorContactDetailModel | null = null;
  @Input() isLoading = false;
  @Output() closePanel = new EventEmitter<void>();

  notes: ContactNoteModel[] = [];

  ngOnInit(): void {
    this.updateNotes();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['detailData']) {
      this.updateNotes();
    }
  }

  private updateNotes(): void {
    // Use detailData if available - same approach as maintain-sponsor-contacts
    if (this.detailData) {
      this.notes = this.detailData.notes || [];
    } else {
      this.notes = [];
    }
  }

  onClose(): void {
    this.closePanel.emit();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    // For single name, use first two letters
    const singleName = parts[0];
    if (singleName.length >= 2) {
      return (singleName.charAt(0) + singleName.charAt(1)).toUpperCase();
    }
    return singleName.charAt(0).toUpperCase();
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '-';
    const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(date.getDate()).padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  }
}
