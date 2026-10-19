DECLARE
   CURSOR cur_dc is
      SELECT donor_id, chapter_id,antigen_test_id,antigen_result,
      user_id,record_date,rownum
        FROM mw_donor_antigen where (antigen_test_id like 'CMV%' or
                                     antigen_test_id like 'CHG%' or
                                     antigen_test_id like 'TRA%' )
      ORDER BY donor_id;
---
   i_count          number;
   i_count1         number;
   i_rec_count      number;
   i_recs_succ      number;
   i_recs_fail      number;
   b_recs_commited  boolean;
   b_run_status     boolean;
   v_date_time      varchar2(20);
   b_rec_status     boolean;
   v_program_id     VARCHAR2(8);
   i_commit_recs    number;
   v_insert_user    VARCHAR2(6);
   i_audit_key      number;
   t_donor_id       VARCHAR2(10);
   t_note_id        VARCHAR2(10);
   t_note_seq       number;
   t_new_note_id   varchar2(10);
   szComCode     varchar2(5);
   cCount number:=0;
   nCount   NUMBER:=0;
   p_cmv_res varchar2(10);
   Icount   number:=0;
   cmvinter   varchar2(5);

BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '417CMV';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
   t_new_note_id    :=null;
---
---    Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') 
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_donor_comments_hold');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_dc LOOP
      b_rec_status := TRUE;
      t_new_note_id    :=null;

---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.donor_id is null) THEN
          dbms_output.put_line('MW_DONOR_CMV'||' '||
                               currec.rownum||' DONOR_ID is null');
          b_rec_status := FALSE;
      END IF;
---

---   STEP 2: 
---
   IF (b_rec_status = TRUE) THEN
---
---   Verify that donor is in DONORS table.
---
         BEGIN
            i_count := 0;
            SELECT count(*)
              INTO i_count
              FROM donors
             WHERE donor_id = currec.donor_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END; 
---
         IF (i_count1 = 0) THEN
            dbms_output.put_line('MW_DONOR_CMV'||' '||
                                 currec.rownum||' DONOR not present');
            b_rec_status := FALSE;
         END IF;
     END IF;
---
   IF (b_rec_status = TRUE) THEN

     If currec.antigen_test_id like 'CMV%' then 

       p_cmv_res:=currec.antigen_test_id; --||substr(currec.antigen_result,1,1);
       select nvl(count(*),0) into nCount from donor_interdictions where
       donor_id=currec.donor_id and inter_code=p_cmv_res and inter_type='INFOR';
       If nCount = 0 then 
         BEGIN
           INSERT into donor_interdictions(
              DONOR_ID            , 
              CHAPTER_ID         ,
              INTER_CODE       ,
              EFF_DATE       ,
              INTER_TYPE      ,     
              TRANSACTION_ID   ,    
              NOTIFICATION_STATUS,  
              NOTE_ID             , 
              RELEASE_USER         ,
              RELEASE_DATE         ,
              UNIT_ID              ,
              UPM_DISPOSITION      ,
              LAST_MODIFIED_DATE   ,
              ORIGINATED_FROM      ,
              REASON_CODE          ,
              GROUP_ID             ,
              LETTER_SEQ_NO        ,
              GROUP_MODE           ,
              TERM_DATE            ,
              TERM_REASON          ,
              PROGRAM_ID           ,
              INSERT_DATE          ,
              INSERT_USER          ,
              AUDIT_KEY      )
            VALUES(currec.donor_id,'ALL',
                     currec.antigen_test_id,
                     nvl(currec.record_date,sysdate -1),'INFOR','CON0000000',
                   null,null,null,null,null,null,null,null,null,null,null,null,
                   null,null,v_program_id,
                   nvl(currec.record_date,sysdate),
                   nvl(currec.user_id,'DONSYS'),
                   audit_seq.nextval);

              select count(distinct inter_code) into Icount
              from donor_interdictions where
              donor_id=currec.donor_id and substr(inter_code,1,3)='CMV' and
              program_id=v_program_id;
      
             if Icount >1 then 
                update donor_interdictions set term_date=sysdate where
                donor_id=currec.donor_id and substr(inter_code,1,3)='CMV' and
                program_id=v_program_id and inter_code='CMVN';
             end if;


---  
---   Commit Processing
---
            i_rec_count := i_rec_count + 1;
            i_recs_succ := i_recs_succ + 1;
            b_recs_commited := FALSE;
            IF (i_rec_count mod i_commit_recs = 0) THEN
               COMMIT;
               b_recs_commited := TRUE;
               i_rec_count :=0;
            END IF;
         EXCEPTION
            WHEN OTHERS THEN
                 dbms_output.put_line(currec.donor_id||' '||
                                      currec.antigen_test_id||
                            ' Oracle Error Code : '||sqlerrm);
         END; -- step 4
     End IF;  -- for nCount check
   else  -- for non cmv tests
      -- select nvl(count(*),0) into nCount from donor_interdictions where
      -- donor_id=currec.donor_id and inter_code=currec.antigen_test_id
       --and inter_type='INFOR';
       --If nCount = 0 then
           INSERT into donor_interdictions(
              DONOR_ID            , 
              CHAPTER_ID         ,
              INTER_CODE       ,
              EFF_DATE       ,
              INTER_TYPE      ,     
              TRANSACTION_ID   ,    
              NOTIFICATION_STATUS,  
              NOTE_ID             , 
              RELEASE_USER         ,
              RELEASE_DATE         ,
              UNIT_ID              ,
              UPM_DISPOSITION      ,
              LAST_MODIFIED_DATE   ,
              ORIGINATED_FROM      ,
              REASON_CODE          ,
              GROUP_ID             ,
              LETTER_SEQ_NO        ,
              GROUP_MODE           ,
              TERM_DATE            ,
              TERM_REASON          ,
              PROGRAM_ID           ,
              INSERT_DATE          ,
              INSERT_USER          ,
              AUDIT_KEY      )
            VALUES(currec.donor_id,'ALL',
                     currec.antigen_test_id,
                     nvl(currec.record_date,sysdate -1),'INFOR','CON0000000',
                   null,null,null,null,null,null,null,null,null,null,null,null,
                   null,null,v_program_id,
                   nvl(currec.record_date,sysdate),
                   nvl(currec.user_id,'DONSYS'),
                   audit_seq.nextval);

       --End If; 
   end if;  -- for non cmv

   ELSE
         i_recs_fail := i_recs_fail + 1;
   END IF;
   END LOOP;
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
      dbms_output.put_line('Conversion for Creating CMV : Done!!');
   ELSE
      dbms_output.put_line('Conversion for CREATING CMV : Stopped!');
   END IF;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
   dbms_output.put_line('No. of records converted    : '||
                         to_char(i_recs_succ));
   dbms_output.put_line('No. of records not converted : '||
                         to_char(i_recs_fail));
   dbms_output.put_line('Script End Time : '||v_date_time);
END; 
/
