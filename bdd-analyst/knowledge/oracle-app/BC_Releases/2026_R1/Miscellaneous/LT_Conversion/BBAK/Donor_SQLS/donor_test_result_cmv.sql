DECLARE
   CURSOR cur_dc is
      SELECT donor_id, chapter_id,test_id,test_result,rownum
        FROM mw_test_results where test_id='CMV'
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
   szResult       varchar2(10);
   ExistC          NUMBER:=0;
   cCount number:=0;
   cmv_res      varchar2(10);
   current_cmv_res  varchar2(10);
   old_cmv_inter varchar2(10);

   procedure insert_inter(pl_donor_id in varchar2,pl_inter in varchar2) is
   begin
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
            VALUES(pl_donor_id,'WAD',
                     pl_inter,
                     sysdate -1,'INTER','CON0000000',
                   null,null,null,null,null,null,null,null,null,null,null,null,
                   null,null,'427CMV',sysdate,'CMVDON',audit_seq.nextval);
     EXCEPTION when others then
        dbms_output.put_line(pl_donor_id||'  CMV='||pl_inter);
     END;

BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '427CMV';
   i_commit_recs    := 100;
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
       If currec.test_result in ('POS','P','PO','R') then
              szResult:='P';
       Elsif currec.test_result in ('NONRE','NR','N') then
              szResult:='N';
       Else
              dbms_output.put_line('MW_DONOR_CMV'||' '||
                                 currec.rownum||'No CMV result');
            b_rec_status := FALSE;
       End If;
---
   IF (b_rec_status = TRUE) THEN
       current_cmv_res:=LTrim(currec.test_id||szResult);
       select decode(current_cmv_res,'CMVP','LCMP','LCMN') into
       cmv_res from dual;

       Begin
          select inter_code into old_cmv_inter from donor_interdictions
          where substr(inter_code,1,3)='LCM' and inter_type='INTER' and 
          donor_id=currec.donor_id and rownum=1;

          ExistC:=1;
       Exception when no_data_found then 
         ExistC:= 0;
       End;


       If ExistC = 0 then    
          INSERT_INTER(currec.donor_id,cmv_res);
       End if;  --count ExitsC=0

      If ExistC = 1 then
          if cmv_res='LCMP' and old_cmv_inter='LCMN' then
             update donor_interdictions set release_date=sysdate,
             term_date=sysdate where donor_id=currec.donor_id and
             inter_code=old_cmv_inter;
             INSERT_INTER(currec.donor_id,cmv_res);
         end if;
     End if;

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
