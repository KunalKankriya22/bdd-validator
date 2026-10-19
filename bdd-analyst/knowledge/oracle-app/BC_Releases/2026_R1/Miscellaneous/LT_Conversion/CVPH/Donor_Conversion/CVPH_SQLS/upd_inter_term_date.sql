update donor_interdictions set term_date=null where inter_code in
(select LT_INTER from x_inter where bbcs_inter in 
(
'AIDS',
'BABES',
'BLDDI',
'BRR2',
'CHAGA',
'CJD',
'DIABE',
'DRUGI',
'EMPHY',
'GRWTH',
'HEMAC',
'HEPAT',
'HTRR2',
'ITP',
'LEGAC',
'LEUKE',
'LUNG',
'LUPUS',
'MELAN',
'MULTS',
'PERMD',
'POSDN',
'PROST',
'RISKB',
'SARCO',
'T-CJD',
'THERA',
'TRALI')
);

