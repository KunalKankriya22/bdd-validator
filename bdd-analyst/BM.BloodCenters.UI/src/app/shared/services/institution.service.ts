import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Institution {
  id: string;
  description: string;
  shortName?: string;
  shortNameRequired?: boolean;
}

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  // stubbed list of existing institutions
  private institutions: Institution[] = [
    { id: 'INST01', description: 'Main Institution', shortName: 'MAIN', shortNameRequired: true },
    { id: 'INST02', description: 'Secondary Institution', shortName: 'SEC', shortNameRequired: false }
  ];

  private savedInstitution: Institution | null = null;

  getInstitution(): Observable<Institution> {
    // For stub, return the first institution as selected
    return of(this.institutions[0]);
  }

  updateInstitution(inst: Institution): Observable<boolean> {
    this.savedInstitution = inst;
    return of(true);
  }

  // Check if a chapterId is pre-approved (stub)
  isChapterIdApproved(chapterId: string): Observable<boolean> {
    const approved = ['CH1', 'A01', 'B02']; // stub approved list
    return of(approved.includes(chapterId));
  }
}