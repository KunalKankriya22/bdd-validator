/**
 * Form configuration and validation rules
 */
import { Validators } from '@angular/forms';

export const USER_FORM_CONFIG = {
  userId: ['', Validators.required],
  firstName: ['', Validators.required],
  lastName: ['', Validators.required],
  nameInitials: [''],
  userClass: [''],
  email: ['', [Validators.required, Validators.email]],
  staffNumber: [''],
  adUserId: [''],
  labCode: [''],
  labDescription: [''],
  qcUserId: [''],
  printerId: [''],
  printerDescription: [''],
  effectiveDate: ['', Validators.required],
  terminationDate: [''],
  assignedWarehouse: ['', Validators.required],
  groupCode: ['', Validators.required],
  groupName: ['', Validators.required],
  accessLevel: ['', Validators.required]
};

export const CHAPTER_FORM_CONFIG = {
  chapterId: ['', Validators.required],
  effectiveDate: ['', Validators.required],
  terminationDate: ['']
};

export const REQUIRED_FIELDS = [
  'userId',
  'firstName',
  'lastName',
  'email',
  'effectiveDate',
  'assignedWarehouse',
  'groupCode',
  'groupName',
  'accessLevel'
];

export const DATE_FIELDS = [
  'effectiveDate',
  'terminationDate'
];