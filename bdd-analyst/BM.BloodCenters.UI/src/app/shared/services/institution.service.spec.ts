import { TestBed } from '@angular/core/testing';
import { InstitutionService } from './institution.service';

describe('InstitutionService', () => {
  let service: InstitutionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InstitutionService],
    });

    service = TestBed.inject(InstitutionService);
  });

  describe('getInstitution', () => {
    it('should return the first institution', (done) => {
      service.getInstitution().subscribe({
        next: (inst) => {
          expect(inst.id).toBe('INST01');
          expect(inst.description).toBe('Main Institution');
          done();
        },
      });
    });
  });

  describe('updateInstitution', () => {
    it('should return true on update', (done) => {
      service.updateInstitution({ id: 'INST01', description: 'Updated' }).subscribe({
        next: (result) => {
          expect(result).toBeTrue();
          done();
        },
      });
    });
  });

  describe('isChapterIdApproved', () => {
    it('should return true for an approved chapter ID', (done) => {
      service.isChapterIdApproved('CH1').subscribe({
        next: (result) => {
          expect(result).toBeTrue();
          done();
        },
      });
    });

    it('should return false for an unapproved chapter ID', (done) => {
      service.isChapterIdApproved('UNKNOWN').subscribe({
        next: (result) => {
          expect(result).toBeFalse();
          done();
        },
      });
    });
  });
});
