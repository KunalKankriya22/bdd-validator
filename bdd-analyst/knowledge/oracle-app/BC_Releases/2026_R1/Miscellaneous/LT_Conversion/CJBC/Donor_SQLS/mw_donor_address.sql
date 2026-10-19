DECLARE
   CURSOR cur_dai is
      SELECT donor_id, chapter_id, address_type, street_name, suite_number,
             ltrim(rtrim(upper(replace(city,',')))) city, 
             ltrim(rtrim(upper(state))) state,
             rtrim(ltrim(substr(zip_code,1,5))) zip_code, 
             usps_id, day_area_code, day_phone_num, 
             home_area_code, home_phone_num, rownum
        FROM mw_donor_address
      ORDER BY chapter_id, donor_id, address_type;
---
   temp_usps_id     number(6);
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
---
---    Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') 
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_donor_address_information');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_dai LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.donor_id is null) THEN
          dbms_output.put_line('MW_DONOR_ADDRESS_INFORMATION'||' '||
                               currec.rownum||' DONOR_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_DONOR_ADDRESS_INFORMATION'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.address_type is null) THEN
          dbms_output.put_line('MW_DONOR_ADDRESS_INFORMATION'||' '||
                               currec.rownum||' ADDRESS_TYPE is null');
          b_rec_status := FALSE;
      END IF;
---
---   STEP 2: 
---
      IF (b_rec_status = TRUE) THEN
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
            dbms_output.put_line('MW_DONOR_ADDRESS_INFORMATION'||' '||
                                 currec.rownum||' DONOR not present');
            b_rec_status := FALSE;
         END IF;
---
---  Verify that donor_address is NOT in DONOR_ADDRESSES table.
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM donor_addresses
             WHERE donor_id = currec.donor_id
               AND chapter_id = currec.chapter_id
               AND address_type = 'RES';
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END; 
---
         IF (i_count1 > 0) THEN
            dbms_output.put_line('MW_DONOR_ADDRESS_INFORMATION'||' '||
                                 currec.rownum||' Duplicate address record');
            b_rec_status := FALSE;
         END IF;
      END IF;
---
---   IF USPS provided then validate.  If not then find USPS ID using following
---
---      find for city, state, and zip code 
---      find for city and zip code
---      find for state and zip code
---      find for zip code alone
---      find for city state alone
---      assign null
      i_count := 0;
      IF (currec.usps_id is not null) THEN
         BEGIN
            i_count := 0;
            temp_usps_id := currec.usps_id;
            SELECT nvl(count(*),0)
              INTO i_count
              FROM valid_city_state
             WHERE usps_id = currec.usps_id;
         EXCEPTION
            WHEN others THEN
               i_count := 0;
               temp_usps_id := null;
         END;
      END IF;
---
    IF (i_count = 0) THEN
         BEGIN
            SELECT nvl(min(usps_id),0)
              INTO temp_usps_id
              FROM valid_city_state
             WHERE city = currec.city
               AND state = currec.state
               AND zip = currec.zip_code;
         EXCEPTION
            WHEN others THEN
                 temp_usps_id:=0;
         END;
         
         IF temp_usps_id = 0 then
              BEGIN
                  SELECT nvl(min(usps_id),0) INTO temp_usps_id
                   FROM valid_city_state
                   WHERE city = currec.city
                   AND zip = currec.zip_code;
               EXCEPTION
                  WHEN others THEN
                       temp_usps_id:=0;
              END;
       END IF;
       IF temp_usps_id = 0 then
          BEGIN
               SELECT nvl(min(usps_id),0) INTO temp_usps_id
                FROM valid_city_state
                WHERE state = currec.state
                AND zip = currec.zip_code;
           EXCEPTION
               WHEN others THEN
                    temp_usps_id:=0;
           END;
      END IF;

      IF temp_usps_id = 0 then
         BEGIN
            SELECT nvl(min(usps_id),0) INTO temp_usps_id
            FROM valid_city_state
            WHERE zip = currec.zip_code;
         EXCEPTION
             WHEN others THEN
                  temp_usps_id:=0;
         END;
     END IF;

     IF temp_usps_id = 0 then
         BEGIN
              SELECT nvl(min(usps_id),0) INTO temp_usps_id
              FROM valid_city_state
              WHERE city = currec.city
              AND state = currec.state;
          EXCEPTION
            WHEN others THEN
                  temp_usps_id := 0; --'00000';
         END;
    END IF;

END IF;

---
---   STEP 4: Insert record in table  donor_addresses
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO donor_addresses 
               (donor_id, chapter_id , address_type, street_name,
                suite_apt ,d_area_code, d_phone_no, h_area_code, h_phone_no,
                usps_id,  program_id, insert_date, insert_user, audit_key)
            VALUES
               (currec.donor_id, currec.chapter_id, 'RES',
                currec.street_name, currec.suite_number, currec.day_area_code,
                currec.day_phone_num, currec.home_area_code, 
                currec.home_phone_num, nvl(temp_usps_id,81), v_program_id, 
                sysdate, v_insert_user, audit_seq.nextval);
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
        dbms_output.put_line('Conversion for Donor Address Info : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Donor Address Info : Stopped!');
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
