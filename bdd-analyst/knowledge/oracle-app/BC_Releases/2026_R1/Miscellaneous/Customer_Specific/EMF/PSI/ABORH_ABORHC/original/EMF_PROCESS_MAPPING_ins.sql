INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'CONTRACT_PROD_TYPE','','','','SELECT COUNT(1)
  FROM components c, units u
 WHERE c.unit_id = u.unit_id
   AND c.coll_date = u.coll_date
   AND c.chapter_id = u.chapter_id
   AND c.unit_id = :P_UNIT_ID
   AND c.coll_date = :P_COLL_DATE
   AND c.chapter_id = :P_CHAPTER_ID
   AND c.product_code = :P_PRODUCT_CODE
   AND u.contract_id :P_OPER_CONTRACT_ID :P_VALUE_CONTRACT_ID 
   AND SUBSTR(c.product_code, 1, 5) IN
       (SELECT vp.product_code
          FROM valid_products vp
         WHERE vp.inv_product_type :P_OPER_INV_PRODUCT_TYPE :P_VALUE_INV_PRODUCT_TYPE)
','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'ACA001 : P',null,'ABORH');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'HIST_ABORH_MATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
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
','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'ACA001 : P',null,'ABORH');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'DONOR_ABORH_MATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  IN ( SELECT blood_type
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)
','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'ACA001 : P',null,'ABORH');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'DONOR_ABORH_MISMATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  NOT IN ( SELECT blood_type
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)
','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'ACA001 : P',null,'ABORH');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'HIST_ABORH_MISMATCH','','','','  SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
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
','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'ACA001 : P',null,'ABORH');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'COMPARE_RETYP_ABO_MATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  = ALL ( SELECT ut2.result_status_1
             FROM utrs ut2
            WHERE ut2.unit_id =:P_UNIT_ID
              AND ut2.coll_date = :P_COLL_DATE
              AND ut2.test_id = ''RETYP''
              AND ut2.cancel_flag IS NULL
              AND ut2.result_status_1 IS NOT NULL
          )','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'HJK001 : P',null,'ABORHC');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'COMPARE_RETYP_ABO_MISMATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  != ANY ( SELECT ut2.result_status_1
             FROM utrs ut2
            WHERE ut2.unit_id =:P_UNIT_ID
              AND ut2.coll_date = :P_COLL_DATE
              AND ut2.test_id = ''RETYP''
              AND ut2.cancel_flag IS NULL
              AND ut2.result_status_1 IS NOT NULL','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'HJK001 : P',null,'ABORHC');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(
'CONTRACT_PROD_TYPE','','','','SELECT COUNT(1)
  FROM components c, units u
 WHERE c.unit_id = u.unit_id
   AND c.coll_date = u.coll_date
   AND c.chapter_id = u.chapter_id
   AND c.unit_id = :P_UNIT_ID
   AND c.coll_date = :P_COLL_DATE
   AND c.chapter_id = :P_CHAPTER_ID
   AND c.product_code = :P_PRODUCT_CODE
   AND u.contract_id :P_OPER_CONTRACT_ID :P_VALUE_CONTRACT_ID 
   AND SUBSTR(c.product_code, 1, 5) IN
       (SELECT vp.product_code
          FROM valid_products vp
         WHERE vp.inv_product_type :P_OPER_INV_PRODUCT_TYPE :P_VALUE_INV_PRODUCT_TYPE)','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'HJK001 : P',null,'ABORHC');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(         
'DONOR_ABORH_MATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1 
  IN ( SELECT blood_type
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'HJK001 : P',null,'ABORHC');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(          
'DONOR_ABORH_MISMATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
  AND ut.result_status_1 IS NOT NULL
  AND ut.cancel_flag IS NULL
  AND ut.result_status_1
  NOT IN ( SELECT NVL(blood_type,''X'')
         FROM donors d, donations dn
        WHERE d.donor_id = dn.donor_id
          AND dn.unit_id = :P_UNIT_ID)','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'HJK001 : P',null,'ABORHC');


INSERT INTO EMF_PROCESS_MAPPING
VALUES(          
'HIST_ABORH_MATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
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
          )','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'HJK001 : P',null,'ABORHC');

INSERT INTO EMF_PROCESS_MAPPING
VALUES(          
'HIST_ABORH_MISMATCH','','','','SELECT COUNT(1)
 FROM utrs ut
WHERE ut.unit_id = :P_UNIT_ID
  AND ut.chapter_id = :P_CHAPTER_ID
  AND ut.coll_date = :P_COLL_DATE
  AND ut.test_id :P_OPER_TEST_ID :P_VALUE_TEST_ID
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
          )','VDIEMCFG',TO_DATE('04052023', 'MMDDYYYY'),'HJK001 : P',null,'ABORHC');


COMMIT;