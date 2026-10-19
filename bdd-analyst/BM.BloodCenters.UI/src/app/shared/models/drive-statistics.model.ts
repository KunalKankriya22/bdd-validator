export interface DriveStatisticsData {
  driveId: string;
  chapterId: string;
}

export interface DriveStatisticsHeader {
  driveId: string;
  chapterId: string;
  totalDonations: number;
  driveDate: string;
  driveType: string;
  typeDescription: string;
  sponsorId: string;
  sponsorName: string;
  projectedShow: number | null;
  projectedDraw: number | null;
  projectedDeferralRate: number | null;
  actualDraw: number;
  actualDeferral: number;
  deferralRate: number | null;
}

export interface DonationRow {
  donationType: string;
  procedureCode: string;
  count: number;
}

export interface VenipunctureRow {
  venipunctureCode: string;
  description: string;
  count: number;
}

export interface DeferralRow {
  deferralCode: string;
  origin: string;
  description: string | null;
  numberOfDeferrals: number;
}

export interface UnitDetailRow {
  unitId: string;
  donationType: string;
  procedureCode: string;
  attrib01: string | null;
  attrib02: string | null;
  attrib03: string | null;
  attrib04: string | null;
  attrib05: string | null;
  attrib06: string | null;
  attrib07: string | null;
  attrib08: string | null;
}

export interface DonorRow {
  donorId: string;
  lastName: string;
  firstName: string;
  sex: string;
}

export interface DriveStatisticsItem {
  header: DriveStatisticsHeader;
  donations: DonationRow[];
  venipuncture: VenipunctureRow[];
  deferrals: {
    allogenic: DeferralRow[];
    autologousTherapeutic: DeferralRow[];
  };
  unitDetails: UnitDetailRow[];
  donorsList: DonorRow[];
}

export interface DriveStatisticsResponse {
  success: boolean;
  message: string;
  statusCode: number;
  item: DriveStatisticsItem;
}
