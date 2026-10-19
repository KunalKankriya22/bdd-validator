update mw_test_results set test_id='ABORH' where test_id='TYPE';
commit;
update mw_test_results set test_result='28' where test_result='ABNG';
update mw_test_results set test_result='84' where test_result='ABPS';
update mw_test_results set test_result='06' where test_result='ANEG';
update mw_test_results set test_result='62' where test_result='APOS';
commit;
update mw_test_results set test_result='17' where test_result='BNEG';
update mw_test_results set test_result='73' where test_result='BPOS';
update mw_test_results set test_result='95' where test_result='ONEG';
update mw_test_results set test_result='51' where test_result='OPOS';
update mw_test_results set test_result=null where 
test_result in ('UNT','RC');
--update mw_test_results set test_result='P' where test_result='POS';
--update mw_test_results set test_result='N' where test_result='NEG';
commit;

