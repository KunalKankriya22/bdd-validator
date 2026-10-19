export interface ResponseSummary {
  questionCode: string;
  questionDesc: string;
  responseType: string; // S=Single, M=Multiple, C=Comment, R=Ranking
  gender: string;       // A=All, M=Male, F=Female
  totalRespondents: number;
  answers: ResponseAnswer[];
}

export interface ResponseAnswer {
  answerCode: string;
  answerDesc: string | null;
  responseCount: number;
  rankDistribution?: RankEntry[] | null;
}

export interface RankEntry {
  questionCode: string;
  answerCode: string;
  rankCode: string;
  rankCount: number;
}

export interface ResponseDonor {
  donorId: string;
  donorName: string;
  gender: string | null;
  age: number | null;
}

export interface ResponseComment {
  answerComments: string | null;
}
