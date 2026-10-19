/**
 * Report model interfaces
 */

export interface Report {
  id: string;
  title: string;
  subtitle: string;
  reportType: string;
  formType: string;
  batchQueue: string;
  parameters: ReportParameter[];
}

export interface ReportParameter {
  parameterCode: string;
  prompt: string;
  description: string;
  parameterType: 'CHAR' | 'NUMBER' | 'DATE' | 'DATETM' | 'ODATE' | 'LIST';
  isList: boolean;
  isUpper: boolean;
  referenceTable: string;
  referenceColumn: string;
  defaultValue: string;
  listFormName: string;
  selected?: boolean;
}

export interface AtlasBreadcrumbDataSource {
  title: string;
  outlets: {
    primary: string[];
  };
}