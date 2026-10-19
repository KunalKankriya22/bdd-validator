DECLARE
   CURSOR cur_dc is
      SELECT donor_id, chapter_id, comments, seq,record_date,
      user_id, rownum FROM mw_donor_comments where comments is not null
      ORDER BY chapter_id, donor_id, seq;
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
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := 'CONVERT';
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
   dbms_output.put_line('Script Name : cs_donor_comments');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_dc LOOP
      b_rec_status := TRUE;
      t_new_note_id    :=null;

---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.donor_id is null) THEN
          dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                               currec.rownum||' DONOR_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.comments is null) THEN
          dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                               currec.rownum||' COMMENTS is null');
          b_rec_status := FALSE;
      END IF;
---
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
            dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                                 currec.rownum||' DONOR not present');
            b_rec_status := FALSE;
         END IF;
      END IF;
---
      IF (b_rec_status = TRUE) THEN
        select nvl(count(*),0) into cCount from donor_communications where 
        donor_id=currec.donor_id and program_id='415GC';
        If cCount > 0 then
           szComCode:='CM'||to_char(cCount+1);
        Else
           szComCode:='CM1';
       End If;     
     END IF;
---
---   STEP 4: Insert record in table central_notes
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO donor_communications 
               (
                 DONOR_ID,     
                 CHAPTER_ID   ,
                 COM_CODE     ,
                  COM_DATE     ,
                 COM_TYPE     ,
                 COM_DESC     ,
                 ACTION_CODE  ,
                TARGET_DATE  ,
                ACTION_DATE  ,
                REQUEST_CODE ,
                LETTER_ID    ,
               STAFF_NO     ,
               PROGRAM_ID   ,
               INSERT_USER  ,
              INSERT_DATE ) 
            VALUES
               (currec.donor_id,'WAD',szComCode,sysdate,'CONV',
                 substr(currec.comments,1,2000) ||
                 ' By:'||currec.user_id||'  '||currec.record_date,
                 null,null,null,null,null,null,'415GC',nvl(currec.user_id,
                'DONSYS'), nvl(currec.record_date,sysdate));
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
                 dbms_output.put_line(currec.rownum||' '||t_note_id||
                            ' Error Occurred in Step 4!'||
                            ' Oracle Error Code : '||to_char(sqlcode));
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
      dbms_output.put_line('Conversion for Donor comments : Done!!');
   ELSE
      dbms_output.put_line('Conversion for Donor comments : Stopped!');
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
