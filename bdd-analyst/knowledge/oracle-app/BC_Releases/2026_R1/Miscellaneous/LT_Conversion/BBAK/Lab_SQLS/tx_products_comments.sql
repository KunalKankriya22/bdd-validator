DECLARE
   CURSOR cur_dc is
      SELECT unit_id, product_code, coll_date, chapter_id, comments, rowid
        FROM convert_product_comments
      ORDER BY unit_id, product_code;
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
   t_note_id        number(6);
   t_note_seq       number;
   nCount           number:=0;
   p_prod_code      varchar2(8);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := 'RUN56';
   i_commit_recs    := 500;
   v_insert_user    := 'SBCSYS';
   i_audit_key      := 0;
---
---    Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') 
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_dc LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.unit_id is null) THEN
          dbms_output.put_line('CONVERT_COMM'||' '||
                               currec.unit_id||' UNIT_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('CONVERT_COMM'||' '||
                               currec.unit_id||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.comments is null) THEN
          dbms_output.put_line('CONVERT_COMM'||' '||
                               currec.unit_id||' COMMENTS is null');
          b_rec_status := FALSE;
      END IF;
---
---   STEP 2: 
---
      IF (b_rec_status = TRUE) THEN
---
---   Verify if the component is valid.
---

        -- get the correct LT product code
        Begin 
          select product_code into p_prod_code from valid_products
          where short_name=currec.product_code and 
          unit_scheme=decode(length(currec.unit_id),13,'I','C');
        Exception when no_data_found then 
          p_prod_code:=currec.product_code;
        End;
       

         BEGIN
            i_count := 0;
            SELECT count(*)
              INTO i_count
              FROM components
             WHERE unit_id = currec.unit_id
             product_code=p_prod_code
               --AND coll_date = currec.coll_date
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END; 
---
         IF (i_count1 = 0) THEN
            dbms_output.put_line('CONVERT_COMM'||' '||
                                 currec.unit_id||' Product not present');
            b_rec_status := FALSE;
         END IF;
      END IF;
      IF (b_rec_status = TRUE) THEN
---
---   Verify that component has a note ID
---
         BEGIN
            t_note_id := null;
            SELECT note_id
              INTO t_note_id
              FROM components 
             WHERE unit_id = currec.unit_id
              and component_id=p_prod_code
               --ND coll_date = currec.coll_date
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
            null; 
         ELSE
            t_note_seq := 0;
            t_note_id := null;
            BEGIN
               SELECT NOTEBOOK_SEQ.nextval
                 INTO t_note_id
                 FROM DUAL;
            EXCEPTION
               WHEN others THEN
                  dbms_output.put_line('CONVERT_COMM'||' '||
                               currec.unit_id||' Could not generate note id');
                  b_rec_status := FALSE;
            END;
            IF (b_rec_status = TRUE) THEN
               UPDATE components 
                  SET note_id = t_note_id
                WHERE unit_id = currec.unit_id
                    product_code=p_prod_code
                  --AND coll_date = currec.coll_date
                  AND chapter_id = currec.chapter_id;
            END IF;
         END IF;
---
      END IF;
---
---   STEP 4: Insert record in table note_books
---
      IF (b_rec_status = TRUE) THEN
        BEGIN
         select nvl(count(*),0) into nCount from note_books where
         note_id=t_note_id;

         if nCount > 0 then 
           update note_books set 
             note= substr(note||': '||currec.comments,1,240)
               where note_id=t_note_id;
         else
            INSERT INTO note_books 
            VALUES
               (t_note_id, currec.comments);
         end if;

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
                 dbms_output.put_line(currec.rowid||' '||t_note_id||
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
      dbms_output.put_line('Conversion for Unit comments : Done!!');
   ELSE
      dbms_output.put_line('Conversion for Unit Comments comments : Stopped!');
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
