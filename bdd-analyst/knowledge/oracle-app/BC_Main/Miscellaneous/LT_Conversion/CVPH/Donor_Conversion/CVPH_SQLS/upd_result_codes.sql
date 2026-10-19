Update MW_TEST_RESULTS Set TEST_RESULT= 'POS' where test_result in
('MPOS','POS','POS1','POS2','POS3','POSW','PLS1','PLS2','PLS3','PLS4');
Update MW_TEST_RESULTS Set TEST_RESULT='R' where test_result in
('REAC','WR');
Update MW_TEST_RESULTS Set TEST_RESULT='P' where test_result in 
('P1+','P2+','P3+','P4+');
Update MW_TEST_RESULTS Set TEST_RESULT='U' where test_result in
('I','ICLR','IND','INDT','QUES');
Update MW_TEST_RESULTS Set TEST_RESULT='NT' where test_result in 
('ND','QNS','TNT','NT');

