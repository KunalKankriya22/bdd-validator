DECLARE
   CURSOR get_res IS
      SELECT * from mw_test_results
      ORDER BY coll_date;

nRecords NUMBER:=0;
nsaveCount NUMBER:=0;
BEGIN
dbms_output.enable(1000000);
   FOR a1 IN get_res LOOP
      nSaveCount:=nSaveCount+1;
       insert into mw_test_result_temp
       (DONOR_ID,    
        CHAPTER_ID,  
        UNIT_ID,     
        COLL_DATE,   
        TEST_TYPE,   
        TEST_ID,     
        TEST_RESULT, 
        USER_ID,     
        RECORD_DATE)   
   VALUES (a1.donor_id,a1.chapter_id,a1.unit_id,a1.test_type,
           a1.test_id, a1.test_result,a1.user_id,
           a1.record_date);
       nRecords:=nRecords+1;
       If nRecords>=500 then --0000 then 
         exit;
       else
          if nSaveCount>=200 then 
             commit;
             nSaveCount:=0;
          end if;
       End If;
     delete from mw_test_results where current of get_res;
  END LOOP;
  commit;
END;
/
