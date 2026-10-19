DECLARE
---
   CURSOR CUR_DI is
      SELECT donor_id, chapter_id, inter_code, 
      eff_date, term_date,com_type,comments, 
      rownum FROM MW_DONOR_INTER_COMMENTS inter
       WHERE EXISTS
             (SELECT 'x'
                FROM donors
               WHERE donors.donor_id = inter.donor_id)
      ORDER BY chapter_id, donor_id, inter_code;
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
   v_inter_type     varchar2(5);
   t_note_id        number;
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '416C';
   i_commit_recs    := 100;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
   v_inter_type     := null;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_donor_interdiction');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_di LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.donor_id is null) THEN
         dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                              currec.rownum||' DONOR_ID is null');
         b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.inter_code is null) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                               currec.rownum||' INTER_CODE is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.eff_date is null) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                               currec.rownum||' EFFECTIVE_DATE is null');
          b_rec_status := FALSE;
      END IF;
---
---  Verify that donor is in DONORS table.
---
      BEGIN
         i_count1 := 0;
         SELECT count(*)
           INTO i_count1
           FROM donors
          WHERE donor_id = currec.donor_id
            AND chapter_id = currec.chapter_id;
      EXCEPTION
         WHEN others THEN
            i_count1 := '0';
      END;
---
      IF (i_count1 = 0) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTION'||' '||
                               currec.rownum||' DONOR not present');
          b_rec_status := FALSE;
      END IF;
---
---
--- Create the note id

            t_note_id := null;
            BEGIN
               SELECT note_sequence.nextval
                 INTO t_note_id
                 FROM DUAL;
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line(currec.rownum|| 
                                ' Could not generate note id');
                  b_rec_status := FALSE;
            END;

---   Insert interdiction record.
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT into donor_interdictions
               (donor_id,chapter_id,inter_code,eff_date,
                inter_type,term_date, program_id, insert_date, 
                insert_user, audit_key)
            VALUES 
               (currec.donor_id, currec.chapter_id, 'CNHLD',
                currec.eff_date, 'HOLDS', currec.term_date,
                v_program_id, sysdate, v_insert_user, i_audit_key);

--- Insert into central notes
               INSERT INTO central_notes
               (note_id, chapter_id , note_sequence, note,
                program_id, insert_date, insert_user)
            VALUES
               (t_note_id, currec.chapter_id, 1, currec.comments,
                v_program_id, sysdate, v_insert_user);
---
---    Commit Processing
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
                 dbms_output.put_line('Error Occured in Step 4!'||
                            ' Oracle Error Code : '||to_char(sqlcode));
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Donor Interdictions : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Donor Interdictions : Stopped!');
   END IF;
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
    dbms_output.put_line('No. of records converted    : '||
                          to_char(i_recs_succ));
    dbms_output.put_line('No. of records not converted : '||
                          to_char(i_recs_fail));
    dbms_output.put_line('Script End Time : '||v_date_time);
END; 

