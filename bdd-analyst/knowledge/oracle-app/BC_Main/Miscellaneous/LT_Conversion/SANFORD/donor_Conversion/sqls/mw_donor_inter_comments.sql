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
   v_inter_code     varchar2(5);
   t_note_id        number;
   v_term_date      date;
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
   dbms_output.put_line('Script Name : donor_inter_comments');
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
          WHERE donor_id = currec.donor_id;
            --AND chapter_id = currec.chapter_id;
      EXCEPTION
         WHEN others THEN
            i_count1 := '0';
      END;
---
      IF (i_count1 = 0) THEN
          dbms_output.put_line('Donor not present:'||currec.donor_id);
          b_rec_status := FALSE;
      END IF;

     v_inter_type := null;
  BEGIN
     SELECT inter_type,inter_code
       INTO v_inter_type,v_inter_code
       FROM valid_interdictions
      WHERE old_inter = currec.inter_code and
      rownum=1;
  EXCEPTION
    WHEN no_data_found then
       Begin
          SELECT inter_type,inter_code
            INTO v_inter_type,v_inter_code
            FROM valid_interdictions
            WHERE inter_code = currec.inter_code and
            rownum=1;

        Exception
            when no_data_found then
               begin
                   select lt_inter into v_inter_code from x_inter where
                   bbcs_inter= currec.inter_code and rownum=1;

                   SELECT inter_type,inter_code
                   INTO v_inter_type,v_inter_code
                   FROM valid_interdictions
                   WHERE inter_code = v_inter_code and
                   rownum=1;
               exception when others then
                  v_inter_type:=null;
               end;
        End;
     WHEN others THEN
      v_inter_type := null;
   END;
     IF (v_inter_type is null) THEN
      dbms_output.put_line('MW_DONOR_INTERDICTION'||' '||
                    currec.inter_code||' '||
                     currec.rownum||' Invalid Interdiction Code');
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

           if currec.term_date> sysdate or currec.term_date is null then 
              v_term_date:=sysdate;
           end if;

         BEGIN
            INSERT into donor_interdictions
               (donor_id,chapter_id,inter_code,eff_date,
                inter_type,term_date, program_id, insert_date, 
                insert_user,note_id, audit_key)
            VALUES 
               (currec.donor_id, 'ALL', v_inter_code,
                currec.eff_date, v_inter_type, 
                v_term_date, v_program_id, sysdate, v_insert_user, t_note_id,
                i_audit_key);

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
                 dbms_output.put_line('Donor :'||currec.donor_id||'Inter='||
                        currec.inter_code||' Oracle Error Code : '||sqlerrm);
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

