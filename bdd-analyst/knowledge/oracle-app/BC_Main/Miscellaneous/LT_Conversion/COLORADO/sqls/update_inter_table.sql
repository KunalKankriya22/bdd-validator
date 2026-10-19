update donor_interdictions set inter_type='INFOR'
where inter_code in (
'CMV',
'BNSS',
'BTRL',
'DD',
'BDUP',
'RGU',
'BDEA',
'BPHEN',
'BHEA',
'BCOM',
'BDPC',
'UNAVA',
'BCSE',
'BNW',
'BHXN'
);

delete from donor_interdictions where inter_code in 
('BC','BL','BI','BIBMT','BMT');

update donor_interdictions set inter_code='HLAP' where
inter_code='HLAPO';

update donor_interdictions set inter_code='00PH',
inter_type='INFOR'  where inter_code='BFOCU';

update donor_interdictions set inter_code='HLAN' where
inter_code='HLANE';
