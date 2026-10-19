Update MW_TEST_RESULTS Set TEST_RESULT= null where test_result= 'ND'
 and test_id in ('110.2000','100.0250','100.0300');
Update MW_TEST_RESULTS Set TEST_RESULT='NT' where test_result='ND';
Update MW_TEST_RESULTS Set TEST_RESULT='N' where test_result='NEGAT';
Update MW_TEST_RESULTS Set TEST_RESULT='P' where test_result='POSIT';
Update MW_TEST_RESULTS Set TEST_RESULT='R' where
 test_id in ('300.0750','300.0700');
