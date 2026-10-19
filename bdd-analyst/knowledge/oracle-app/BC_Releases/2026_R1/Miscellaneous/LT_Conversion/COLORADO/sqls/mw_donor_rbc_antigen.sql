DECLARE
   CURSOR CUR_DA is
      SELECT DONOR_ID, CHAPTER_ID, ANTIGEN_TYPE, ANTIGEN_TEST_ID,
             decode(ANTIGEN_RESULT,'POS','P',
                                   'NEG','N',
                                   '+','P',
                                   '-','N',antigen_result) ant_res,
             nvl(user_id,'DONSYS') user_id,record_date, rownum
        FROM mw_donor_antigen
       WHERE antigen_test_id not like 'CMV%' ---and antigen_type='R'
      ORDER BY donor_id, antigen_type, antigen_test_id;
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
   pl_ant_test_id   VARCHAR2(10);

BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '417';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
---    Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
   dbms_output.put_line('Script Name : cs_donor_antigen_info');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR r_temp_rec in CUR_DA LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Verify that all required fields have non-null values.
---
      BEGIN
         IF (r_temp_rec.donor_id is null) THEN
             dbms_output.put_line('MW_DONOR_ANTIGEN_INFO'||' '||
                                  r_temp_rec.rownum||' DONOR_ID is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.chapter_id is null) THEN
             dbms_output.put_line('MW_DONOR_ANTIGEN_INFO'||' '||
                                  r_temp_rec.rownum||' CHAPTER_ID is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.antigen_type is null) THEN
             dbms_output.put_line('MW_DONOR_ANTIGEN_INFO'||' '||
                                  r_temp_rec.rownum||' antigen_type is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.antigen_test_id is null) THEN
             dbms_output.put_line('MW_DONOR_ANTIGEN_INFO'||' '||
                                  r_temp_rec.rownum||' test_id is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.ant_res is null) THEN
             dbms_output.put_line(r_temp_rec.antigen_test_id||' '||
                                  r_temp_rec.donor_id||' result is null');
             b_rec_status := FALSE;
         END IF;
---
      EXCEPTION
         WHEN OTHERS THEN
              dbms_output.put_line('Error Occured in Step 1!'||
                                   ' Oracle Error Code : '||to_char(sqlcode));
              b_rec_status := FALSE;
      END; -- step 1
---
---   STEP 3: Verify that validation fields have valid values
---
      IF (b_rec_status = TRUE) THEN
---
---    Verify Antigen Type
---
    /*     IF (r_temp_rec.antigen_type not in ('H','R')) THEN
            dbms_output.put_line('MW_DONOR_ANTIGEN_INFO'||' '||
                                 r_temp_rec.rownum||' invalid TYPE');
                b_rec_status := FALSE;
         END IF;
    */
---
--- Check result if RBC antigen
---
         IF ((r_temp_rec.antigen_test_id is not null) AND
            (r_temp_rec.antigen_type = 'R')) THEN
            BEGIN
               pl_ant_test_id:=r_temp_rec.antigen_test_id;
               i_count1 := 0;
               SELECT test_id into pl_ant_test_id
                 FROM valid_tests_don
                WHERE test_id = r_temp_rec.antigen_test_id;
                  --AND sysdate between eff_date and nvl(term_date, sysdate+1);
               i_count1:=1;
            EXCEPTION
               when no_data_found then 
                 Begin 
                  select lt_test_id into pl_ant_test_id from 
                  x_testing where 
                  rtrim(bbcs_test_id)=rtrim(r_temp_rec.antigen_test_id);
                   i_count1:=1;
                 Exception when others then 
                   i_count1:=0;
                 End;
               WHEN others THEN
                  i_count1 := 0;
            END;
            IF (i_count1 = 0) THEN
                dbms_output.put_line('Invalid antigen Test-'||pl_ant_test_id);
                b_rec_status := FALSE;
            END IF;
         END IF;
      END IF;
---
---   Verify that donor exists in the Donor file.
---
      BEGIN
         t_donor_id := null;
         SELECT donor_id
           INTO t_donor_id
           FROM DONORS
          WHERE donors.donor_id = r_temp_rec.donor_id;
      EXCEPTION
         WHEN no_data_found THEN
            t_donor_id := null;
         WHEN others THEN
            dbms_output.put_line('Error occured during duplicate check!'||
                       ' Oracle Error : ' ||sqlerrm);
            b_rec_status := FALSE;
            t_donor_id := null;
      END;
---
      IF (t_donor_id is null) THEN
                dbms_output.put_line('No donor record. '||' '||
                             r_temp_rec.donor_id||' No insert.');
                b_rec_status := FALSE;
      END IF;
---
---    Insert record in appropriate donor antigen table
---
      IF (b_rec_status = TRUE) THEN
       BEGIN
---
---     Verify that record does not already exist in the Donor_rbc_antigen table
---
            BEGIN
               t_donor_id := 'EMPTY';
               SELECT donor_id
                 INTO t_donor_id
                 FROM donor_rbc_antigens
                WHERE donor_rbc_antigens.donor_id = r_temp_rec.donor_id
                  AND donor_rbc_antigens.chapter_id = r_temp_rec.chapter_id
                  AND donor_rbc_antigens.test_id = pl_ant_test_id;
            EXCEPTION
               WHEN no_data_found THEN
                  t_donor_id := 'EMPTY';
               WHEN others THEN
                  t_donor_id := 'EMPTY';
            END;
            IF (nvl(t_donor_id,'1') = 'EMPTY') THEN
               INSERT INTO donor_rbc_antigens
                   (donor_id, chapter_id, test_id, result_code,
                    program_id, insert_user, insert_date)
                VALUES
                   (r_temp_rec.donor_id, r_temp_rec.chapter_id, 
                    pl_ant_test_id,
                    r_temp_rec.ant_res,
                    v_program_id,
                    r_temp_rec.user_id,
                    r_temp_rec.record_date);
            ELSE
             --   dbms_output.put_line('Antigen already exists. '||' '||
               --              r_temp_rec.rownum||' No insert.');
                b_rec_status := FALSE;
            END IF;
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
                            '  Error : '||sqlerrm);
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Required Donor Info : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Required Donor Info : Stopped!');
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
/
