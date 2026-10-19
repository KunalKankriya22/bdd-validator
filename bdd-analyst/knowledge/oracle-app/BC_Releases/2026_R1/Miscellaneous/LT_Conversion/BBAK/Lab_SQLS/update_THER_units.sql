DECLARE
 CURSOR CUR_LEN6 is
    SELECT unit_id,coll_date,chapter_id, rownum FROM donations where
          donation_type='TH';

ltUnit_id   VARCHAR2(15);
t_machine  VARCHAR2(2);
commit_count NUMBER:=0;

BEGIN

   FOR currec in CUR_LEN6 LOOP
       update components set reject_reason_code='THER' where
       unit_id=currec.unit_id; 

        /* insert into unit_interdictions (UNIT_ID,       
                                        COLL_DATE,     
                                        CHAPTER_ID,    
                                        INTER_CODE,    
                                        INSERT_DATS,   
                                        INTER_USER_ID, 
                                        SOURCE_TEST_ID,
                                        AUDIT_KEY,     
                                        PROGRAM_ID)
              values (currec.unit_id,currec.coll_date,'WAD','THER',
                      sysdate,'CONV','CONV',audit_seq.nextval,'CONV');    
         */


          If commit_count >=100 then 
            commit;
            null;
            commit_count:=0;
          End If;
       commit_count:=commit_count+1;
   END LOOP;

   commit;
   commit_count:=0;
END;
/
