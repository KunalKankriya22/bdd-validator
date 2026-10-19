UPDATE donor_interdictions set term_date=eff_date+365 where inter_code
in ('EARP','GLOB','HHEX','MALR','MHT','RABIE','TAT','TXN','VDHX','HDT')
/
update donor_interdictions set term_date=eff_date+183 where 
inter_code in ('HBIG');
/
update donor_interdictions set term_date=eff_date+90 where
inter_code in ('CARD');
/
update donor_interdictions set term_date=eff_date+56 where
inter_code in ('F3','HBC','NET','HT8','EARLY');
/
update donor_interdictions set term_date=eff_date+42 where
inter_code in ('PREG');
/
update donor_interdictions set term_date=eff_date+30 where
inter_code in ('RETA');
/
update donor_interdictions set term_date=eff_date+28 where
inter_code in ('SARS');
/
update donor_interdictions set term_date=eff_date+3 where
inter_code in ('DENT1','DENT2','DENT');
/
update donor_interdictions set term_date=eff_date+2 where
inter_code in ('PLCTH');
/
update donor_interdictions set term_date=eff_date+1 where
inter_code in ('SENIR','BPHLD','COLD','EXP','ALT1','DEFG1','ELBP',
'HGBHD','PLHLD','HRSLO','IRHB','ILL',
'IMM','LOWBP','DNWLK','RMDD','RXTMP','MEH','STSN',
'SURG','TEMPH','VEIN','WGHLD','BP4','YOUTH');
/
update donor_interdictions set term_date=eff_date where inter_code
in ('ANTIB','ALT3','MED','NOVEN');
/
COMMIT;

