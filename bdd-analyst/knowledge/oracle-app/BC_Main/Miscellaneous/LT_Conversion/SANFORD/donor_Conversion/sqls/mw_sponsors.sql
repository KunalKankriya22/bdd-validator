DECLARE
   CURSOR cur_s IS
     SELECT sponsor_id, chapter_id, name, territory_id, category,
          status, line_of_business, employee_base, parent_sponsor,
           sponsor_rating,
            def_location_id, conv_sponsor_id, 
            nvl(effective_date,sysdate-15) e_date, term_date, rownum
            FROM mw_sponsors
      ORDER BY chapter_id, sponsor_id;
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
   v_ter_id         VARCHAR2(10);
   v_cat            VARCHAR2(10);
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
---
      IF (currec.sponsor_id is null) THEN
          dbms_output.put_line('MW_SPONSOR'||' '||
                               currec.rownum||' sponsor_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_SPONSOR'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.name is null) THEN
          dbms_output.put_line('MW_SPONSOR'||' '||
                               currec.rownum||' name is null');
          b_rec_status := FALSE;
      END IF;
---
---   Verify that sponsor ID is in correct format.
---
      IF (b_rec_status = TRUE) THEN
         IF ((substr(currec.sponsor_id,1,4) != 'SPON') OR
             (length(currec.sponsor_id) !=10)) THEN
             dbms_output.put_line('MW_SPONSOR'||' '||
                                  currec.rownum||' Sponsor ID invalid format');
         END IF;
---
---  Verify that Sponsor does not already exist by sponsor ID and chapter ID
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM sponsors
             WHERE sponsor_id = currec.sponsor_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 > 0) THEN
             dbms_output.put_line('MW_SPONSORS '|| currec.rownum||':'||
              currec.sponsor_id||' Duplicate Sponsor ID defined');
             b_rec_status := FALSE;
         END IF;
---
---   Verify that location is already defined
---
/*
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM locations
             WHERE location_id = currec.def_location_id
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := 0;
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_SPONSORS '||
                                  currec.rownum||' Location not defined');
             b_rec_status := FALSE;
         END IF;
---
*/

---   Verify that territory is already defined
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM valid_territories
             WHERE territory_id = currec.territory_id
               AND chapter_id = currec.chapter_id;
          v_ter_id:=currec.territory_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := 0;
         END;
---
         IF (i_count1 = 0) THEN
          v_ter_id:='TERRY00001';
         END IF;
---
---   Verify that sponsor category has been defined
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM valid_master_codes
             WHERE code_type = 'SPCAT'
               AND code = currec.category;
              v_cat:=currec.category;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             v_cat:='1000';
         END IF;
---
---   Verify that sponsor status is defined, if provided
---
         IF (currec.status is not null) THEN
            BEGIN
               i_count1 := 0;
               SELECT count(*)
                 INTO i_count1
                 FROM valid_master_codes
                WHERE code_type = 'PATST'
                  AND code = currec.status;
            EXCEPTION
               WHEN others THEN
                  i_count1 := '0';
            END;
---
            IF (i_count1 = 0) THEN
                dbms_output.put_line('MW_SPONSORS '||
                                   currec.rownum||' Sponsor status not defined');
                b_rec_status := FALSE;
            END IF;
         END IF;
---
---   Verify that line of business is defined, if provided
---
         IF (currec.line_of_business is not null) THEN
            BEGIN
               i_count1 := 0;
               SELECT count(*)
                 INTO i_count1
                 FROM valid_master_codes
                WHERE code_type = 'LOB'
                  AND code = currec.line_of_business;
            EXCEPTION
               WHEN others THEN
                  i_count1 := '0';
            END;
---
            IF (i_count1 = 0) THEN
                dbms_output.put_line('MW_SPONSORS '||
                                 currec.rownum||' line of business not defined');
                b_rec_status := FALSE;
            END IF;
         END IF;
---
---   Verify that sponsor rating is defined, if provided
---
         IF (currec.sponsor_rating is not null) THEN
            BEGIN
               i_count1 := 0;
               SELECT count(*)
                 INTO i_count1
                 FROM valid_master_codes
                WHERE code_type = 'SPRAT'
                  AND code = currec.sponsor_rating;
            EXCEPTION
               WHEN others THEN
                  i_count1 := '0';
            END;
---
            IF (i_count1 = 0) THEN
                dbms_output.put_line('MW_SPONSORS '||
                                  currec.rownum||' sponsor rating not defined');
                b_rec_status := FALSE;
            END IF;
         END IF;
      END IF;
---
---    generate next address_id
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            SELECT address_sequence.nextval
              INTO t_address_id
              FROM dual;
         EXCEPTION
            WHEN others THEN
               b_rec_status := FALSE;
         END;
      END IF;
---
---    Insert record in sponsors table
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO sponsors
              (sponsor_id, chapter_id, name, address_id, territory_id, category,
               status, lob, employee_base, parent_sponsor_id, sponsor_rating,
               default_location_id, conv_sponsor_id, eff_date, term_date,
               program_id, insert_date, insert_user, audit_key)
            VALUES
              (currec.sponsor_id, currec.chapter_id, currec.name, t_address_id,
               v_ter_id, v_cat, currec.status, 
               currec.line_of_business, currec.employee_base,
               currec.parent_sponsor, currec.sponsor_rating,
               currec.def_location_id, currec.conv_sponsor_id,
               currec.e_date, currec.term_date,
               v_program_id, sysdate, v_insert_user, audit_seq.nextval);
         EXCEPTION
             WHEN OTHERS THEN
                 dbms_output.put_line('Insert Error on: '||currec.rownum||
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
        dbms_output.put_line('Conversion for Sponsors : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Sponsors : Stopped!');
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
