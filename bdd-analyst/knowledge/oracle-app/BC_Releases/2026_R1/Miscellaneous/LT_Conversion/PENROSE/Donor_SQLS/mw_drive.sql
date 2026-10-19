DECLARE
   CURSOR CUR_RDI is
      SELECT drive_id, chapter_id, recruiter_id, territory_id, location_id,
             conv_drive_id, drive_type, drive_category, drive_status, 
             drive_date, drv_start_time, drv_end_time, cancel_date,
             cancel_user_id, can_reason_code, can_reason, os_ok_flag, 
             drive_facility, rownum
        FROM mw_drives
      ORDER BY chapter_id, drive_id;
---
   d_schedule_start_time date;
   d_actual_start_time date;
   d_schedule_end_time date;
   d_actual_end_time date;
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
   t_loc_id         VARCHAR2(10);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '431C';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_required_drive_information');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec IN cur_rdi LOOP
      b_rec_status := TRUE;
      IF (currec.drive_id is null) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' drive_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.recruiter_id is null) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' recruiter_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.location_id is null) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' location_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.drive_type is null) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' drive_type is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.drive_status is null) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' drive_status is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.drive_date is null) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' drive_date is null');
          b_rec_status := FALSE;
      END IF;
---
---  Verify that drive is not already defined
---
      BEGIN
         i_count1 := 0;
         SELECT count(*)
           INTO i_count1
           FROM drives
          WHERE drive_id = currec.drive_id
            AND chapter_id = currec.chapter_id;
      EXCEPTION
         WHEN others THEN
            i_count1 := '0';
      END;
---
      IF (i_count1 > 0) THEN
          dbms_output.put_line('MW_DRIVE'||' '||
                               currec.rownum||' Drive already defined');
          b_rec_status := FALSE;
      END IF;
---
/*
---    Check RECRUITER
---
      i_count1 := 0;
      BEGIN
         SELECT count(*)
           INTO i_count1
           FROM employees
          WHERE staff_no = currec.recruiter_id;
      EXCEPTION
         WHEN others THEN
            i_count1 := 0;
      END;
      IF (i_count1 = 0) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' Invalid Recruiter Code');
          b_rec_status := FALSE;
      END IF;
---
*/

---    Check TERRITORY
---
      IF (currec.territory_id is not null) THEN
         i_count1 := 0;
         BEGIN
            SELECT count(*)
              INTO i_count1
              FROM valid_territories
             WHERE territory_id = currec.territory_id
               AND sysdate between eff_date and nvl(term_date, sysdate+1);
         EXCEPTION
            WHEN others THEN
               i_count1 := 0;
         END;
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                                  currec.rownum||' Invalid territory Code');
             b_rec_status := FALSE;
         END IF;
      END IF;
---
---    Check LOCATION_ID
---
      i_count1 := 0;
      t_loc_id:=currec.location_id;

      BEGIN
         SELECT count(*)
           INTO i_count1
           FROM locations
          WHERE location_id = currec.location_id
            AND sysdate between eff_date and nvl(term_date, sysdate+1);
      EXCEPTION
         WHEN others THEN
            i_count1 := 0;
      END;
      IF (i_count1 = 0) THEN
          --dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
          --                     currec.rownum||' Invalid Location_ID');
          --b_rec_status := FALSE;
          t_loc_id:='LOCN000001';
      END IF;
---
---    Check DRIVE_TYPE
---
      i_count1 := 0;
      BEGIN
         SELECT count(*)
           INTO i_count1
           FROM valid_master_codes
          WHERE code_type = 'DRVTY'
            AND code = currec.drive_type
            AND sysdate between eff_date and nvl(term_date, sysdate+1);
      EXCEPTION
         WHEN others THEN
            i_count1 := 0;
      END;
      IF (i_count1 = 0) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' Invalid DRIVE_TYPE');
          b_rec_status := FALSE;
      END IF;
---
---    Check DRIVE_CATEGORY
---
      IF (currec.drive_category is not null) THEN
         i_count1 := 0;
         BEGIN
            SELECT count(*)
              INTO i_count1
              FROM valid_master_codes
             WHERE code_type = 'DRCAT'
               AND code = currec.drive_category
               AND sysdate between eff_date and nvl(term_date, sysdate+1);
         EXCEPTION
            WHEN others THEN
               i_count1 := 0;
         END;
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                                  currec.rownum||' Invalid DRIVE_CATEGORY');
             b_rec_status := FALSE;
         END IF;
      END IF;
---
---    Check DRIVE_STATUS
---
      i_count1 := 0;
      BEGIN
         SELECT count(*)
           INTO i_count1
           FROM valid_master_codes
          WHERE code_type = 'DSTAT'
            AND code = currec.drive_status
            AND sysdate between eff_date and nvl(term_date, sysdate+1);
      EXCEPTION
         WHEN others THEN
            i_count1 := 0;
      END;
      IF (i_count1 = 0) THEN
          dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                               currec.rownum||' Invalid DRIVE_STATUS');
          b_rec_status := FALSE;
      END IF;
---
---    Check Cancel Reason Code
---
      IF (currec.can_reason_code is not null) THEN
         i_count1 := 0;
         BEGIN
            SELECT count(*)
              INTO i_count1
              FROM valid_master_codes
             WHERE code_type = 'DCANC'
               AND code = currec.can_reason_code
               AND sysdate between eff_date and nvl(term_date, sysdate+1);
         EXCEPTION
            WHEN others THEN
               i_count1 := 0;
         END;
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_REQUIRED_DRIVE_INFORMATION'||' '||
                                  currec.rownum||' Invalid Cancel Reason Code');
             b_rec_status := FALSE;
         END IF;
      END IF;
---
---    Insert record in table donors
---
      IF (b_rec_status = TRUE) THEN
         IF (currec.drv_start_time is null) THEN
            d_schedule_start_time := currec.drive_date+0.3333;
         ELSE
            d_schedule_start_time := to_date(rtrim(ltrim(to_char(
               currec.drive_date, 'MM-DD-YYYY')))||' '|| rtrim(ltrim(to_char(
               currec.drv_start_time,'HH24:MI'))),'MM-DD-YYYY HH24:MI');
         END IF;
---
         IF (currec.drv_end_time is null) THEN
            d_schedule_end_time := currec.drive_date+0.6667;
         ELSE
            d_schedule_end_time := to_date(rtrim(ltrim(to_char(
               currec.drive_date, 'MM-DD-YYYY')))||' '|| rtrim(ltrim(to_char(
               currec.drv_end_time,'HH24:MI'))),'MM-DD-YYYY HH24:MI');
         END IF;
---
         IF (currec.drive_date >= sysdate) THEN
            d_actual_start_time := NULL;
            d_actual_end_time := NULL;
         ELSE
            d_actual_start_time := d_schedule_start_time;
            d_actual_end_time := d_schedule_end_time;
         END IF;
         BEGIN
            INSERT INTO drives
               (drive_id, chapter_id, drive_date, drive_type,
                schedule_start_time, schedule_end_time, recruiter_id,
                location_id, status, cancel_date, cancel_user, 
                cancel_reason, cancel_reason_code, actual_start_time,
                actual_end_time, drive_category, territory_id, os_ok_flag,
                conv_drive_id, program_id, insert_date, insert_user, audit_key)
            VALUES
               (currec.drive_id, currec.chapter_id, currec.drive_date,
                currec.drive_type, d_schedule_start_time, d_schedule_end_time,
                currec.recruiter_id, t_loc_id, currec.drive_status,
                currec.cancel_date, currec.cancel_user_id, currec.can_reason, 
                currec.can_reason_code, d_actual_start_time, d_actual_end_time,
                currec.drive_category, currec.territory_id, currec.os_ok_flag, 
                currec.conv_drive_id, v_program_id, sysdate, v_insert_user,
                i_audit_key);
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
---
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Required DRIVE Info : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Required DRIVE Info : Stopped!');
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
