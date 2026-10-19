DECLARE
   CURSOR CUR_L is
      SELECT location_id, chapter_id, location_type, location_name, 
             address_id, travel_time, travel_distance, open_time,
             close_time, fda_license_date, site_manager, rotation_flag,
             staff_facility, zone_name, conv_location_id,
             nvl(effective_date,sysdate-16) e_date, term_date, rownum
        FROM mw_LOCATIONS
      ORDER BY chapter_id, location_id;
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
   t_address_id     VARCHAR2(10);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '4315C';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
   SELECT to_char(sysdate,'MM-DD-YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_location');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
---    STEP 1: Check that required fields are not null, else log the record
---
   FOR currec IN cur_l LOOP
      b_rec_status := TRUE;
      IF (currec.location_id is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' location_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.location_name is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' location_name is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.location_type is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' location_type is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.e_date is null) THEN
          dbms_output.put_line('MW_LOCATION'||' '||
                               currec.rownum||' e_date is null');
          b_rec_status := FALSE;
      END IF;
------------------------------------------------------------------
---
---    Check that validation fields have valid values
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM valid_master_codes
             WHERE code_type = 'LOCTY'
               AND code = currec.location_type;
         EXCEPTION
            WHEN others THEN
               i_count1 := 0;
         END;
         IF (i_count1 = 0) THEN
            dbms_output.put_line('MW_LOCATION'||' '||
                                 currec.rownum||' Invalid location Type');
            b_rec_status := FALSE;
         END IF;
      END IF;
---
---    Insert record in table donors
---
      IF (b_rec_status = TRUE) THEN
         t_address_id := rtrim(ltrim(to_char(i_rec_count,'999999')));
         BEGIN
            INSERT into  LOCATIONS
               (location_id, chapter_id, location_type, location_name,
                address_id, travel_time, travel_distance, conv_location_id,
                open_time, close_time, fda_license_date, site_manager,
                eff_date, term_date, rotation_flag, staff_facility, zone,
                program_id, insert_date, insert_user)
             VALUES
               (currec.location_id, currec.chapter_id,
                currec.location_type, currec.location_name, t_address_id,
                currec.travel_time, currec.travel_distance,
                currec.conv_location_id, currec.open_time, 
                currec.close_time,  currec.fda_license_date,
                currec.site_manager, currec.e_date, currec.term_date,
                currec.rotation_flag, currec.staff_facility, currec.zone_name,
                v_program_id, sysdate, v_insert_user);
---
---    Commit Processing
---
            i_rec_count := i_rec_count + 1;
            i_recs_succ := i_recs_succ + 1;
            b_recs_commited := FALSE;
            IF (mod(i_rec_count, i_commit_recs) = 0) THEN
               b_recs_commited := TRUE;
               commit;
            END IF;
         EXCEPTION
             WHEN OTHERS THEN
                 dbms_output.put_line('Error Occured in Step 4!'||
                            ' Oracle Error Code : '||to_char(sqlcode));
         END;
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
---
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Locations : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Locations : Stopped!');
   END IF;
---
   SELECT to_char(sysdate,'MM-DD-YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
   dbms_output.put_line('No. of records converted    : '||
                         to_char(i_recs_succ));
   dbms_output.put_line('No. of records not converted : '||
                         to_char(i_recs_fail));
   dbms_output.put_line('Script End Time : '||v_date_time);
   commit;
END; 
/
