export interface ViewInstitution {
  insT_ID: string;
  insT_NAME: string;
  insT_SHORT_NAME: string;
  addresS_ID: number;
  prinT_HDR: string;
  systeM_NAME: string;
  codabaR_UNIT_SCHEME: string;
  taX_ID: string;
  reG_NO: string;
  liC_NO: string;
  contracT_PREFIX: string;
  prograM_ID: string;
  audiT_KEY: number;
  efF_DATE: string;
  lasT_MODIFIED_DATE: string;
  addR_1: string;
  addR_2?: string;
  addR_3?: string;
  city: string;
  statE_CODE: string;
  zip: string;
  country: string;
  phonE_NUMBER: string;
  inT_PHONE_NUMBER?: string;
  faX_NUMBER?: string;
  teleX_NUMBER?: string;
  inT_FLAG: string;
}

export interface ChapterUI {
  chapterId: string;
  chapterName: string;
  effectiveDate: string;
  terminationDate?: string;
  status: 'Active' | 'Inactive';
}