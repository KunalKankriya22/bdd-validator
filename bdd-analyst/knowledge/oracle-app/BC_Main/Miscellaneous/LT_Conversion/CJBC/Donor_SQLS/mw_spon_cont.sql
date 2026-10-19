DECLARE
   CURSOR cur_s IS
     SELECT * from mw_sponsor_contacts ;
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
   t_address_id     VARCHAR2(10);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '4311C';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
   t_address_id     := null;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_sponsors');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec IN cur_s LOOP
      b_rec_status := TRUE;
        BEGIN
            SELECT address_id into  t_address_id
              FROM sponsors
             WHERE sponsor_id = currec.sponsor_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_SPONSORS '|| currec.sponsor_id||':'||
              currec.sponsor_id||' Sponsor ID not defined');
             b_rec_status := FALSE;
         END IF;
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO sponsor_contacts
              (sponsor_id, chapter_id, contact_id,contact_type,
              address_id,last_name,first_name,middle_name,salutation,
              title, note_id, eff_date, term_date,
               program_id, insert_date, insert_user)
            VALUES
              (currec.sponsor_id, currec.chapter_id, currec.contact_id,
                currec.contact_type,t_address_id,
               currec.last_name, currec.first_name, currec.middle_name,
               currec.title,null,currec.salutations,
               currec.effective_date,currec.term_date,
               '4313C',sysdate,'CONV');
         EXCEPTION
             WHEN OTHERS THEN
                 dbms_output.put_line('Insert Error on: '||currec.sponsor_id||
                            ' Code : '||to_char(sqlcode));
         END;
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
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
---
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Sponsor Contacts : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Sponsor contacts : Stopped!');
   END IF;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
---
    dbms_output.put_line('No. of records converted    : '||
                          to_char(i_recs_succ));
    dbms_output.put_line('No. of records not converted : '||
                          to_char(i_recs_fail));
    dbms_output.put_line('Script End Time : '||v_date_time);
END; 
/
