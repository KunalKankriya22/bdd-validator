DECLARE
   CURSOR CUR_RDI is
      SELECT unit_id, coll_date, chapter_id, donor_id, secondary_id,
             donation_type, procedure_code, drive_id, location_id,
             sponsor_id, donor_cue, bag_type, credit_count, user_id,
             record_date,rownum
        FROM mw_donations
    where coll_Date >  '30-DEC-1900'
AND NOT exists
(select 'x' from donations
 where deferral_id = mw_donations.unit_id)
      ORDER BY chapter_id, coll_date, unit_id;

   v_transaction_id varchar2(10);
   v_set_id         varchar2(14); 
   v_bag_type       varchar2(5); 
   v_drive_id       varchar2(10);
   t_credit_count   number;
   i_count          number;
   i_count1         number;
   i_rec_count      number;
   i_recs_succ      number;
   i_recs_fail      number;
   tr_id            number:=0;
   b_recs_commited  boolean;
   b_run_status     boolean;
   v_date_time      varchar2(20);
   b_rec_status     boolean;
   v_program_id     VARCHAR2(8);
   i_commit_recs    number;
   v_insert_user    VARCHAR2(6);
   i_audit_key      number;
   t_donor_id       VARCHAR2(10);
   v_err_msg        VARCHAR2(240);
   ltUnit_id        VARCHAR2(15);
   v_sponsor_id     VARCHAR2(10);
   unit_ctr         NUMBER:=9900000;
   nUnit            NUMBER:=0;
BEGIN
   dbms_output.enable(9000000);
   i_rec_count      := 1899000;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '421C';
   i_commit_recs    := 100;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_required_donation_info');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in CUR_RDI LOOP
      b_rec_status := TRUE;
      IF (currec.donor_id is null) THEN
          dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                               currec.rownum||' DONOR_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.unit_id is null) THEN
          dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                               currec.rownum||' unit_id is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.coll_date is null) THEN
          dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                               currec.rownum||' coll_date is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.donation_type is null) THEN
          dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                               currec.rownum||' donation_type is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.procedure_code is null) THEN
          dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                               currec.rownum||' procedure_code is null');
          b_rec_status := FALSE;
      END IF;

  /*
      IF (currec.sponsor_id is null) THEN
          dbms_output.put_line('MW_DONATIONS'||' '||
                               currec.rownum||' Sponsor is null');
          b_rec_status := FALSE;
      END IF;
 */

--------------------------------------------------------------------------------
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
             dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                                  currec.rownum||' DONOR not present');
             b_rec_status := FALSE;
         END IF;
---
     -----
  -- Insert data into units table
       ltUnit_id:=currec.unit_id;
      If Length(ltUnit_id)!=7 and Length(ltUnit_id)!=13 then
          Unit_ctr:=Unit_ctr+1;
          ltUnit_id:=to_Char(unit_ctr);
          insert into mw_unit_trans values (currec.unit_id,ltUnit_id);
      Elsif Length(ltUnit_id) = 7 then
        if  LTrim(ltUnit_id,'0123456789') is not null then
           select nvl(count(*),0) into nUnit from bar_code_prefixes where
           EYE_READ_TRNS=substr(ltUnit_id,1,2);
        
           if nUnit =0 then 
             unit_ctr:=unit_ctr+1;
             ltUnit_id:=to_char(unit_ctr);
             insert into mw_unit_trans values (currec.unit_id,ltUnit_id);
           end if;
        end if;
     Elsif Length(ltUnit_id) = 13 then 
       If ltUnit_id like 'W%' then 
          null;
       Else
         unit_ctr:=unit_ctr+1;
         ltUnit_id:=to_char(unit_ctr);
         insert into mw_unit_trans values (currec.unit_id,ltUnit_id);
       End If;
    End If;

    -------
---  Verify that donation record (unit_id, coll_date, chapter_id)
---  does not exist in donation table.
---
         BEGIN
            i_count1 := 0;
            SELECT count(*)
              INTO i_count1
              FROM donations
             WHERE unit_id = ltUnit_id
               AND chapter_id = currec.chapter_id
               AND coll_date = currec.coll_date;
         EXCEPTION
            WHEN others THEN
               i_count1 := '0';
         END;
---
         IF (i_count1 > 0) THEN
             dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
                                  currec.rownum||' Donation already present');
             b_rec_status := FALSE;
         END IF;
---
---    Check donation_type
---
         i_count := 0;
         BEGIN
            SELECT count(*)
              INTO i_count
              FROM valid_donation_types
             WHERE donation_type = currec.donation_type
               AND sysdate between eff_date and nvl(term_date, sysdate+1);
         EXCEPTION
            WHEN others THEN
            i_count := 0;
         END;
         IF (i_count = 0) THEN
             dbms_output.put_line(currec.rownum||' '||
                       currec.donation_type|| '-Invalid Donation Type');
             b_rec_status := FALSE;
         END IF;
---
---    Check procedure_code
---
         i_count := 0;
         BEGIN
            SELECT count(*)
              INTO i_count
              FROM valid_proc_codes
             WHERE procedure_code = currec.procedure_code
               AND sysdate between eff_date and nvl(term_date, sysdate+1);
         EXCEPTION
            WHEN others THEN
            i_count := 0;
         END;
         IF (i_count = 0) THEN
             dbms_output.put_line(currec.rownum||
                currec.procedure_code||'- Invalid Procedure Code');
             b_rec_status := FALSE;
         END IF;
---
--Check sponsor ID
         i_count:=0;
         IF (currec.sponsor_id is not null) THEN
            v_sponsor_id := null;
            BEGIN
               SELECT count(*)
                 INTO i_count
                 FROM sponsors
                WHERE sponsor_id = currec.sponsor_id
                  AND chapter_id = currec.chapter_id;
            EXCEPTION
               WHEN others THEN
               i_count := 0;
            END;
            IF (i_count = 0) THEN
               dbms_output.put_line(currec.sponsor_id||': Invalid sponsor');
               b_rec_status := FALSE;
            ELSE
                v_sponsor_id := currec.sponsor_id;
            END IF;
      ELSE
         v_sponsor_id:='SPONCONVER';
      END IF;

---
---
---    Check drive_id
---
         IF (currec.drive_id is not null) THEN
            v_drive_id := null;
            BEGIN
               SELECT count(*)
                 INTO i_count
                 FROM drives
                WHERE drives.drive_id = currec.drive_id
                  AND drives.chapter_id = currec.chapter_id
                  AND drives.drive_date = currec.coll_date;
            EXCEPTION
               WHEN others THEN
               i_count := 0;
            END;
            IF (i_count = 0) THEN
---            dbms_output.put_line('MW_REQUIRED_DONATION_INFO'||' '||
---                                  currec.rownum||' Invalid Drive ID');
---            b_rec_status := FALSE;
               v_drive_id := 'DRV8000001';
            ELSE
               v_drive_id := currec.drive_id;
            END IF;
         ELSE
            v_drive_id := 'DRV8000001';
         END IF;
      END IF;
--------------------------------------------------------------------------------
---   Insert record in table donors
      IF (b_rec_status = TRUE) THEN
         BEGIN
            tr_id:=0;
            select trans_seq.nextval into tr_id from dual;
            v_transaction_id := 'TR'||lpad(to_char(tr_id),8,'0');
            v_set_id := 'SET0000001';
---
            INSERT INTO donations
               (transaction_id, set_id, unit_id, coll_date, chapter_id, 
                donor_id, deferral_id, donation_type, procedure_code, 
                drive_id, donor_cue, bag_type, credit_sponsor,
                credit_count, program_id, insert_date, insert_user, audit_key)
            VALUES
               (v_transaction_id, v_set_id, ltUnit_id, currec.coll_date,
                currec.chapter_id, currec.donor_id, 
                substr(currec.secondary_id,1,8),
                currec.donation_type, currec.procedure_code, v_drive_id,
                currec.donor_cue, v_bag_type,v_sponsor_id,0,
                v_program_id, currec.record_date, currec.user_id,
                 audit_seq.nextval);
---
---    Commit Processing
---
            i_rec_count := i_rec_count + 1;
            i_recs_succ := i_recs_succ + 1;
            b_recs_commited := FALSE;
            IF (mod(i_rec_count,i_commit_recs) = 0) THEN
               COMMIT; 
               b_recs_commited := TRUE;
            END IF;
         EXCEPTION
             WHEN OTHERS THEN
                  v_err_msg:=substr(sqlerrm,1,24);
                  dbms_output.put_line('Error in Step 4! '||currec.unit_id||
                            ' '||v_transaction_id||
                            ' Oracle Error Code : '||to_char(sqlcode));
                 insert into log_units values(currec.unit_id,v_err_msg);
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;  
   IF (b_run_status = TRUE) THEN
      dbms_output.put_line('Conversion for Required Donation Info : Done!!');
   ELSE
      dbms_output.put_line('Conversion for Required Donation Info : Stopped!');
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
