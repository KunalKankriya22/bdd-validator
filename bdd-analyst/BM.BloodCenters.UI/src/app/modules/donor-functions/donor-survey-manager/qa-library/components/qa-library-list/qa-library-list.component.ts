import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Question } from '../../models/qa-library.models';

@Component({
  selector: 'app-qa-library-list',
  standalone: true,
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './qa-library-list.component.html',
  styleUrls: ['./qa-library-list.component.scss']
})
export class QaLibraryListComponent {
  @Input() questions: Question[] = [];
  @Input() selectedQuestionCode: string | null = null;
  @Input() noResultsFromSearch: boolean = false;
  @Output() questionSelected = new EventEmitter<Question>();
  @Output() addNew = new EventEmitter<void>();

  // Response Type to SVG path mapping
  private readonly RESPONSE_TYPE_ICONS: { [key: string]: string } = {
    'Single': '/assets/images/donor survey manager/radio-on.svg',
    'Multiple': '/assets/images/donor survey manager/checked.svg',
    'Comment': '/assets/images/donor survey manager/Comment.svg',
    'Ranking': '/assets/images/donor survey manager/Ranking.svg'
  };

  // Gender to SVG path mapping
  private readonly GENDER_ICONS: { [key: string]: string } = {
    'MALE': '/assets/images/People/Male.svg',
    'FEMALE': '/assets/images/People/Female.svg',
    'ALL': '/assets/images/People/All.svg'
  };

  onSelectQuestion(question: Question): void {
    this.questionSelected.emit(question);
  }

  onAddNew(): void {
    this.addNew.emit();
  }

  isSelected(question: Question): boolean {
    return question.questionCode === this.selectedQuestionCode;
  }

  getResponseTypeIcon(responseType: string): string {
    return this.RESPONSE_TYPE_ICONS[responseType] || '';
  }

  getGenderIcon(sex: string): string {
    return this.GENDER_ICONS[sex] || '';
  }
}
