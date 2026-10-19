DECLARE
   CURSOR cur_dem is
      SELECT donor_id, chapter_id, email_address, rowid
        FROM mw_donor_email_address where email_address is not null
      ORDER BY chapter_id, donor_id;
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
---   Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') 
     INTO v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_donor_email_information');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_dem LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.donor_id is null) THEN
         dbms_output.put_line('MW_DONOR_EMAIL'||' '||
                              currec.rowid||' DONOR_ID is null');
         b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
         dbms_output.put_line('MW_DONOR_EMAIL'||' '||
                              currec.rowid||' CHAPTER_ID is null');
         b_rec_status := FALSE;
      END IF;
---
      IF (currec.email_address is null) THEN
         dbms_output.put_line('MW_DONOR_EMAIL'||' '||
                              currec.rowid||' EMAIL_ADDRESS is null');
         b_rec_status := FALSE;
      END IF;
---
---   STEP 2: 
---
      IF (b_rec_status = TRUE) THEN
---
---   Verify that donor is in DONORS table.
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
            dbms_output.put_line('MW_DONOR_EMAIL'||' '||
                                 currec.rowid||' DONOR not present');
            b_rec_status := FALSE;
         END IF;
---
---   Verify that donor_address is in DONOR_ADDRESSES table.
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
         IF (i_count1 = 0) THEN
            dbms_output.put_line('MW_DONOR_EMAIL'||' '||
                                 currec.rowid||' Donor address not present');
            b_rec_status := FALSE;
         END IF;
      END IF;
---
---   STEP 4: Update donor_addresses with email address
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            UPDATE donor_addresses 
               SET email = currec.email_address
             WHERE donor_addresses.donor_id = currec.donor_id
               AND donor_addresses.chapter_id = currec.chapter_id
               AND address_type = 'RES';
---
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
                 dbms_output.put_line('Error Occured in Step 4! '||
                                      'Oracle Error Code : '||to_char(sqlcode));
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
      dbms_output.put_line('Conversion for Donor Email Address: Done!!');
   ELSE
      dbms_output.put_line('Conversion for Donor Email Address: Stopped!');
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
