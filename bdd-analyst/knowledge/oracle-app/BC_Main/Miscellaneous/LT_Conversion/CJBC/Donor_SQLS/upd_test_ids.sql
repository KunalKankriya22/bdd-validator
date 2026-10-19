update mw_test_results set test_id='HBSAG' where test_id='HBSG';
update mw_test_results set test_id='HIV-1/2' where test_id='HIV';
update mw_test_results set test_id='HTLV-I/II' where test_id='HTLV';
update mw_test_results set test_id='HIV-1/2' where test_id='HIV';
update mw_test_results set test_id='HIV1AG' where test_id='HAG';
update mw_test_results set test_id='ABORH' where test_id='TYPE';
update mw_test_results set test_id='HIV-1/2' where test_id='IV2E';
commit;
update mw_test_results set test_result='28' where test_result='ABNG';
update mw_test_results set test_result='84' where test_result='ABPS';
update mw_test_results set test_result='06' where test_result='ANEG';
update mw_test_results set test_result='62' where test_result='APOS';
update mw_test_results set test_result='17' where test_result='BNEG';
update mw_test_results set test_result='73' where test_result='BPOS';
update mw_test_results set test_result='95' where test_result='ONEG';
update mw_test_results set test_result='51' where test_result='OPOS';
update mw_test_results set test_result=null where 
test_result in ('UNT','RC');
update mw_test_results set test_result='P' where test_result='POS';
update mw_test_results set test_result='N' where test_result='NEG';
delete from mw_test_results where test_id in ('STSR','NATR','HTLR',
'HIVR','RHCV','HIVS','HBSS','HCVS','HBRR','HCRR','IVRR','ANTR',
'CHGR','HBCR','HBSR');
commit;

