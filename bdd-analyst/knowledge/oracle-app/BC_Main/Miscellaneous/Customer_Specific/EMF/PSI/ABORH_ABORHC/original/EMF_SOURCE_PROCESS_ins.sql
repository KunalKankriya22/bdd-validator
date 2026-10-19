INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',1,'CONTRACT_PROD_TYPE','','','','','SELECT COUNT(1)
  FROM components c, units u
 WHERE c.unit_id = u.unit_id
   AND c.coll_date = u.coll_date
   AND c.chapter_id = u.chapter_id
   AND c.unit_id = :P_UNIT_ID
   AND c.coll_date = :P_COLL_DATE
   AND c.chapter_id = :P_CHAPTER_ID
   AND c.product_code = :P_PRODUCT_CODE
   AND u.contract_id IN ( SELECT REGEXP_SUBSTR(''MCGIM0023,MCGIM0022'',''[^,]+'', 1, LEVEL) FROM DUAL
                  CONNECT BY REGEXP_SUBSTR(''MCGIM0023,MCGIM0022'', ''[^,]+'', 1, LEVEL) IS NOT NULL) 
   AND SUBSTR(c.product_code, 1, 5) IN
       (SELECT vp.product_code
          FROM valid_products vp
         WHERE vp.inv_product_type IN ( SELECT REGEXP_SUBSTR(''RBC,WB'',''[^,]+'', 1, LEVEL) FROM DUAL
                  CONNECT BY REGEXP_SUBSTR(''RBC,WB'', ''[^,]+'', 1, LEVEL) IS NOT NULL))
','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',1.01,'','units','contract_id','IN','MCGIM0023,MCGIM0022','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',1.02,'','valid_products','inv_product_type','IN','RBC,WB','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',2,'DONOR_ABORH_MATCH','','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  IN ( SELECT blood_type
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)
','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',2.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',3,'HIST_ABORH_MATCH','','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  = ALL ( SELECT ut2.result_status_1
             FROM utrs ut2
            WHERE ut2.unit_id =:P_UNIT_ID
              AND ut2.coll_date = :P_COLL_DATE
              AND ut2.test_id = ''ABORH''
              AND ut2.cancel_flag IS NULL
              AND ut2.result_status_1 IS NOT NULL
          )
','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',3.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',4,'DONOR_ABORH_MISMATCH','','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  NOT IN ( SELECT blood_type
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)
','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',4.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',5,'HIST_ABORH_MISMATCH','','','','','  SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  != ANY ( SELECT ut2.result_status_1
             FROM utrs ut2
            WHERE ut2.unit_id =:P_UNIT_ID
              AND ut2.coll_date = :P_COLL_DATE
              AND ut2.test_id = ''ABORH''
              AND ut2.cancel_flag IS NULL
              AND ut2.result_status_1 IS NOT NULL
          )
','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORH','',5.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'ACA001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',1,'CONTRACT_PROD_TYPE','','','','','SELECT COUNT(1)
  FROM components c, units u
 WHERE c.unit_id = u.unit_id
   AND c.coll_date = u.coll_date
   AND c.chapter_id = u.chapter_id
   AND c.unit_id = :P_UNIT_ID
   AND c.coll_date = :P_COLL_DATE
   AND c.chapter_id = :P_CHAPTER_ID
   AND c.product_code = :P_PRODUCT_CODE
   AND u.contract_id IN ( SELECT REGEXP_SUBSTR(''MCGIM0001,MCGIM0002,MCGIM0003,MCGIM0004,MCGIM0005,MCGIM0006,MCGIM0007,MCGIM0008,MCGIM0009,MCGIM0010,MCGIM0011,MCGIM0012,MCGIM0013,MCGIM0014,MCGIM0015,MCGIM0016,MCGIM0017,MCGIM0018,MCGIM0019,MCGIM0020,TRAIM0001,TRAIM0002,TRAIM0003,TRAIM0004,TRAIM0005,TRAIM0006,TRAIM0007,TRAIM0008,TRAIM0009,TRAIM0010,TRAIM0011,TRAIM0012,TRAIM0013,TRAIM0014,TRAIM0015,TRAIM0016,TRAIM0017,TRAIM0018,TRAIM0019,TRAIM0020,TRAIM0021,MCGIM0021'',''[^,]+'', 1, LEVEL) FROM DUAL
                  CONNECT BY REGEXP_SUBSTR(''MCGIM0001,MCGIM0002,MCGIM0003,MCGIM0004,MCGIM0005,MCGIM0006,MCGIM0007,MCGIM0008,MCGIM0009,MCGIM0010,MCGIM0011,MCGIM0012,MCGIM0013,MCGIM0014,MCGIM0015,MCGIM0016,MCGIM0017,MCGIM0018,MCGIM0019,MCGIM0020,TRAIM0001,TRAIM0002,TRAIM0003,TRAIM0004,TRAIM0005,TRAIM0006,TRAIM0007,TRAIM0008,TRAIM0009,TRAIM0010,TRAIM0011,TRAIM0012,TRAIM0013,TRAIM0014,TRAIM0015,TRAIM0016,TRAIM0017,TRAIM0018,TRAIM0019,TRAIM0020,TRAIM0021,MCGIM0021'', ''[^,]+'', 1, LEVEL) IS NOT NULL) 
   AND SUBSTR(c.product_code, 1, 5) IN
       (SELECT vp.product_code
          FROM valid_products vp
         WHERE vp.inv_product_type IN ( SELECT REGEXP_SUBSTR(''RBC,WB'',''[^,]+'', 1, LEVEL) FROM DUAL
                  CONNECT BY REGEXP_SUBSTR(''RBC,WB'', ''[^,]+'', 1, LEVEL) IS NOT NULL))','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',1.01,'','units','contract_id','IN','MCGIM0001,MCGIM0002,MCGIM0003,MCGIM0004,MCGIM0005,MCGIM0006,MCGIM0007,MCGIM0008,MCGIM0009,MCGIM0010,MCGIM0011,MCGIM0012,MCGIM0013,MCGIM0014,MCGIM0015,MCGIM0016,MCGIM0017,MCGIM0018,MCGIM0019,MCGIM0020,TRAIM0001,TRAIM0002,TRAIM0003,TRAIM0004,TRAIM0005,TRAIM0006,TRAIM0007,TRAIM0008,TRAIM0009,TRAIM0010,TRAIM0011,TRAIM0012,TRAIM0013,TRAIM0014,TRAIM0015,TRAIM0016,TRAIM0017,TRAIM0018,TRAIM0019,TRAIM0020,TRAIM0021,MCGIM0021','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',1.02,'','valid_products','inv_product_type','IN','RBC,WB','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',2,'DONOR_ABORH_MATCH','','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  IN ( SELECT blood_type
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'Y','');


INSERT INTO EMF_SOURCE_PROCESS
VALUES('ABORHC','',2.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',3,'HIST_ABORH_MATCH','','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  = ALL ( SELECT ut2.result_status_1
             FROM utrs ut2
            WHERE ut2.unit_id =:P_UNIT_ID
              AND ut2.coll_date = :P_COLL_DATE
              AND ut2.test_id = ''ABORH''
              AND ut2.cancel_flag IS NULL
              AND ut2.result_status_1 IS NOT NULL
          )','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',3.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',4,'DONOR_ABORH_MISMATCH','','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1
  NOT IN ( SELECT NVL(blood_type,''X'')
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'Y','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',4.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',5.01,'','utrs','test_id','EQ','RETYP','','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'','');

INSERT INTO EMF_SOURCE_PROCESS
VALUES(
'ABORHC','',5,'HIST_ABORH_MISMATCH','','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id = ''RETYP''
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  != ANY ( SELECT ut2.result_status_1
             FROM utrs ut2
            WHERE ut2.unit_id =:P_UNIT_ID
              AND ut2.coll_date = :P_COLL_DATE
              AND ut2.test_id = ''ABORH''
              AND ut2.cancel_flag IS NULL
              AND ut2.result_status_1 IS NOT NULL
          )','VEMFPROC',TO_DATE('05-APR-23 00:00:00', 'DD-MON-YY HH24:MI:SS'),'HJK001',null,'Y','');


COMMIT;