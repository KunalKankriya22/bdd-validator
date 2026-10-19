/**
 * Shared Models Barrel Export
 * Simplifies imports from shared models directory
 */

export * from './lookup.model';
export * from './header.model';
export * from './international-address.model';
export * from './alternate-demographics.model';
export * from './collection-statistics.model';
export * from './contact.model';
export * from './deferral-entry-details.model';
export * from './donation-entry-details.model';
export * from './drive-statistics.model';
// Re-export notification-log interfaces explicitly to avoid DonorInfo conflict with donation-entry-details
export type {
  DonorCommunication,
  LookupItem,
  StaffItem,
  AddDropdownValues,
  LetterDetails,
  NotificationLogApiResponse,
  CreateCommunicationRequest
} from './notification-log.interface';
export * from './site-collection-statistics.model';
