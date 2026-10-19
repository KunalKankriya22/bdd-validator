DECLARE
   CURSOR cur_dc is
      SELECT donor_id, chapter_id, comments, seq, rownum
        FROM mw_donor_comments where comments is not null
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
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '415C';
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
      IF (currec.seq is null) THEN
          dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                               currec.rownum||' SEQ is null');
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
            dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                                 currec.rownum||' DONOR not present');
            b_rec_status := FALSE;
         END IF;
      END IF;
      IF (b_rec_status = TRUE) THEN
---
---   Verify that Donor has a note ID
---
         BEGIN
            t_note_id := null;
            SELECT note_id
              INTO t_note_id
              FROM donors
             WHERE donor_id = currec.donor_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               t_note_id := null;
         END; 
      END IF;
---
      IF (b_rec_status = TRUE) THEN
---
---   IF Note ID is present, get maximum sequence no from central_notes
---
         IF (t_note_id is not null) THEN
            BEGIN
               t_note_seq := 0;
               SELECT nvl(MAX(note_sequence),0)
                 INTO t_note_seq
                 FROM central_notes
                WHERE note_id = t_note_id
                  AND chapter_id = currec.chapter_id;
            EXCEPTION
               WHEN others THEN
                  t_note_seq := 0;
            END;

            If t_note_seq = 0 then  
                b_rec_status := FALSE;
                  dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                                 currec.rownum||' '||t_note_id||
                                 ' Could not generate note seq');
            End If;
 
         ELSE   --(note id is null for the donor)
            t_note_seq := 0;
            t_note_id := null;
            BEGIN
               SELECT note_sequence.nextval
                 INTO t_new_note_id
                 FROM DUAL;
                 t_note_id:=t_new_note_id;
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line('MW_DONOR_COMMENTS'||' '||
                                 currec.rownum||' Could not generate note id');
                  b_rec_status := FALSE;
            END;
         END IF;
---
      END IF;
---
---   STEP 4: Insert record in table central_notes
---
      IF (b_rec_status = TRUE) THEN
         
         --Update the donors table with the new note id if no note id
         If t_new_note_id is not null then  
            UPDATE donors set note_id=t_note_id where donor_id=currec.donor_id; 
         End If;

         t_note_seq := t_note_seq + 1;
         BEGIN
            INSERT INTO central_notes 
               (note_id, chapter_id , note_sequence, note,
                program_id, insert_date, insert_user)
            VALUES
               (t_note_id, currec.chapter_id, t_note_seq,
                currec.comments, v_program_id, sysdate, v_insert_user);
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
