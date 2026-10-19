DECLARE
   CURSOR CUR_SA is
      SELECT sponsor_id,address_id, chapter_id, street_name, suite_number, 
             rtrim(ltrim(city)) city, rtrim(ltrim(state)) state,
             rtrim(ltrim(substr(zip_code,1,5))) zip_code, 
             usps_id, day_area_code, day_phone_num, home_area_code,
             home_phone_num, pager, effective_date, term_date, mapsco,  
             contact_id, address_type, email_address, rownum
        FROM mw_SPONSOR_ADDRESSES
WHERE address_type = 'SPON'
      ORDER BY chapter_id, address_id;
---
   t_usps_id        number;
   t_address_id     varchar2(10);
   t_sponsor_id     varchar2(10);
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
   v_program_id     := '4312C';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_sponsor_address');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in CUR_SA LOOP
      t_usps_id        := null;
      t_address_id     := null;
      t_sponsor_id     := null;
      b_rec_status := TRUE;
---
      IF (currec.address_id is null) THEN
          dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                               currec.rownum||' ADDRESS_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.address_type is null) THEN
          dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                               currec.rownum||' address_type is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.street_name is null) THEN
          dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                               currec.rownum||' street_name is null');
          b_rec_status := FALSE;
      END IF;
---
---    Verify referencial integrety
---
      IF (b_rec_status = TRUE) THEN
         IF (currec.address_type not in ('SPON','CONT')) THEN
             dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                                currec.rownum||' address_type not defined');
                b_rec_status := FALSE;
         END IF;
---
---  Verify that SPONSOR is in SPONSORS table.
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM sponsors
             WHERE sponsor_id = currec.sponsor_id
               AND chapter_id = currec.chapter_id;
            t_sponsor_id := currec.sponsor_id;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 = 0) THEN
             dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                                  currec.rownum||' SPONSOR not present');
             b_rec_status := FALSE;
         END IF;
---
         t_address_id     := null;
         IF (currec.address_type = 'CONT') THEN
---
---   Get address_id from sponsor contact record.
---
            BEGIN
               SELECT address_id 
                 INTO t_address_id
                 FROM sponsor_contacts
                WHERE sponsor_contacts.sponsor_id = t_sponsor_id
                  AND sponsor_contacts.contact_type = 'DC'
                  AND not exists
                     (SELECT 'X'
                        FROM addresses
                       WHERE addresses.address_id = sponsor_contacts.address_id)
                  AND rownum < 2;
            EXCEPTION
               WHEN no_data_found THEN
                   dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                               currec.rownum||' No contact address ID fetched');
                   b_rec_status := FALSE;
               WHEN others THEN
                   dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                            currec.rownum||' error during fetch of SC addr ID');
                   b_rec_status := FALSE;
            END;
         ELSE
---
---   Get address_id from sponsor record.
---
            BEGIN
               SELECT address_id 
                 INTO t_address_id
                 FROM sponsors
                WHERE sponsors.sponsor_id = t_sponsor_id;
            EXCEPTION
               WHEN no_data_found THEN
                   dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                               currec.rownum||' No sponsor address ID fetched');
                   b_rec_status := FALSE;
               WHEN others THEN
                   dbms_output.put_line('MW_SPONSOR_ADDRESS'||' '||
                           currec.rownum||' error during fetch of Spon addr ID');
                   b_rec_status := FALSE;
            END;
         END IF;
---
---  Verify that address record does not exist in address table.
---
         IF (t_address_id is not null) THEN
            BEGIN
               i_count1 := 0;
               SELECT count(*)
                 INTO i_count1
                 FROM addresses
                WHERE addresses.address_id = t_address_id
                  AND addresses.chapter_id = currec.chapter_id;
            EXCEPTION
               WHEN others THEN
                  i_count1 := '0';
            END;
---
            IF (i_count1 > 0) THEN
                dbms_output.put_line('MW_SPONSOR_ADDRESSES'||' '||
                                     currec.rownum||' Address already present');
                b_rec_status := FALSE;
            END IF;
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
      IF (b_rec_status = TRUE) THEN
         i_count := 0;
         IF (currec.usps_id is not null) THEN
            BEGIN
               i_count := 0;
               t_usps_id := currec.usps_id;
               SELECT count(*)
                 INTO i_count
                 FROM valid_city_state
                WHERE usps_id = currec.usps_id;
            EXCEPTION
               WHEN others THEN
                  i_count := 0;
                  t_usps_id := null;
            END;
         END IF;
---
         IF (i_count = 0) THEN
            BEGIN
               SELECT usps_id
                 INTO t_usps_id
                 FROM valid_city_state
                WHERE city = currec.city
                  AND state = currec.state
                  AND zip = currec.zip_code;
            EXCEPTION
               WHEN others THEN
                  BEGIN
                     SELECT usps_id
                       INTO t_usps_id
                       FROM valid_city_state
                      WHERE city = currec.city
                        AND zip = currec.zip_code
                        AND rownum < 2;
                  dbms_output.put_line ('NOTE: '||t_sponsor_id||' '||
                                        'Cant resolve USPS. Assign '||
                                        to_char(t_usps_id,'999999')||
                                        ' based upon city, zip only');
                  EXCEPTION
                     WHEN others THEN
                        BEGIN
                           SELECT usps_id
                             INTO t_usps_id
                             FROM valid_city_state
                            WHERE state = currec.state
                              AND zip = currec.zip_code
                              AND rownum < 2;
                  dbms_output.put_line ('NOTE: '||t_sponsor_id||' '||
                                        'Cant resolve USPS. Assign '||
                                        to_char(t_usps_id,'999999')||
                                        ' based upon state, zip only');
                        EXCEPTION
                           WHEN others THEN
                              BEGIN
                                 SELECT usps_id
                                   INTO t_usps_id
                                   FROM valid_city_state
                                  WHERE zip = currec.zip_code
                                    AND rownum < 2;
                  dbms_output.put_line ('NOTE: '||t_sponsor_id||' '||
                                        'Cant resolve USPS. Assign '||
                                        to_char(t_usps_id,'999999')||
                                        ' based upon zip only');
                              EXCEPTION
                                 WHEN others THEN
                                    BEGIN
                                       SELECT usps_id
                                         INTO t_usps_id
                                         FROM valid_city_state
                                        WHERE city = currec.city
                                         AND state = currec.state
                                         AND rownum < 2;
                  dbms_output.put_line ('NOTE: '||t_sponsor_id||' '||
                                        'Cant resolve USPS. Assign '||
                                        to_char(t_usps_id,'999999')||
                                        ' based upon city, state only');
                                    EXCEPTION
                                       WHEN others THEN
                                          t_usps_id := 0;
       dbms_output.put_line('MW_SPONSOR_ADDRESSES'||' '||
                  currec.rownum||' could not resolve usps ID set to unknown');
                                    END;
                              END;
                        END;
                  END;
            END;
         END IF;
      END IF;
---
---   Insert record in addresses table.
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO addresses
               (address_id, chapter_id, street_name, usps_id, h_phone_no,
                e_mail, mapsco, suite_apt, d_area_code, d_phone_no, h_area_code,
                pager, eff_date,term_date, program_id, insert_date, insert_user)
             VALUES
               (t_address_id, currec.chapter_id, currec.street_name,
                t_usps_id, currec.home_phone_num, currec.email_address,
                currec.mapsco, currec.suite_number,
                currec.day_area_code,currec.day_phone_num,currec.home_area_code,
                currec.pager, currec.effective_date, currec.term_date,
                v_program_id, sysdate, v_insert_user );
         EXCEPTION
             WHEN OTHERS THEN
                 dbms_output.put_line('Error Occured during insert!'||
                            ' Oracle Error Code : '||to_char(sqlcode));
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
   COMMIT;
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Sponsor addresses : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Sponsor addresses : Stopped!');
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
