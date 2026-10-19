UPDATE MW_DONATIONS set donation_type='AL' , procedure_code='WB' where
procedure_code='802';

UPDATE MW_DONATIONS set donation_type='DI' , procedure_code='WB' where
procedure_code='803';

UPDATE MW_DONATIONS set donation_type='TH' , procedure_code='WB' where
 procedure_code='005';

UPDATE MW_DONATIONS set donation_type='AU' , procedure_code='WB' where
 procedure_code='012';

UPDATE MW_DONATIONS set donation_type='TH' , procedure_code='WB' where
 procedure_code='805';

UPDATE MW_DONATIONS set donation_type='AL' , procedure_code='WB' where
procedure_code='004';

UPDATE MW_DONATIONS set donation_type='TH' , procedure_code='AP' where
 procedure_code='008';

UPDATE MW_DONATIONS set donation_type='AU' , procedure_code='WB' where
 procedure_code='812';

UPDATE MW_DONATIONS set donation_type='TH' , procedure_code='WB' where
 procedure_code ='010';

UPDATE MW_DONATIONS set donation_type='AU' , procedure_code='AP' where
 procedure_code='013';

UPDATE MW_DONATIONS set donation_type='AU' , procedure_code='WB' where
 procedure_code='806';

UPDATE MW_DONATIONS set donation_type='AL' , procedure_code='WB' where
 procedure_code='002';

UPDATE MW_DONATIONS set donation_type='AU' , procedure_code='WB' where
 procedure_code='006';

UPDATE MW_DONATIONS set donation_type='SM' , procedure_code='WB' where
 procedure_code='011';

UPDATE MW_DONATIONS set donation_type='AL' , procedure_code='AP' where
 procedure_code='001';

UPDATE MW_DONATIONS set donation_type='DI' , procedure_code='AP' where
 procedure_code ='009';

UPDATE MW_DONATIONS set donation_type='AL' , procedure_code='PP' where
 procedure_code='007';

UPDATE MW_DONATIONS set donation_type='DI' , procedure_code='WB' where
 procedure_code='003';

UPDATE MW_DONATIONS set donation_type='DI' , procedure_code='WB' where
 procedure_code='098';

update mw_donations set donation_type='99' , procedure_code='99' where
donation_type in ('ER','CB','Z1','PD','TD','Z3','DT','Z2','DP');

update mw_donations set donation_type='99' , procedure_code='99' where
procedure_code='999';

delete from mw_donations where procedure_code in ('016','017');

