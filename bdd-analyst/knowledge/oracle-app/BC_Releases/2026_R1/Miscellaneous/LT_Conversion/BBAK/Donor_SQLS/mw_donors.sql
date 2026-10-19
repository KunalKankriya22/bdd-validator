DECLARE
  CURSOR CUR_RDI is
   SELECT donor_id, chapter_id, last_name, first_name, middle_name, name_suffix,
          name_prefix, ssn, date_of_birth, nvl(gender,'F') donor_sex, 
   decode(rtrim(ltrim(blood_type)),'OPOS','51','APOS','62','BPOS','73',
                                 'ABPS','84','ONEG','95','ANEG','06',
                                 'BNEG','17','ABNG','28','UNK','00',
         rtrim(ltrim(blood_type))) blood_type,
          ethnic_group, total_donations, total_credits, claimed_credits,
         old_donor_id,user_id,record_date, rownum
     FROM mw_donors
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
   mname_only      varchar2(75);
   fname_only     varchar2(75);
   suffix_only   varchar2(50);
   firstname_end   number:=0;
   szFirst_middle varchar2(100);
  cnt_value       number:=0;
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := 'CONVERT';
   i_commit_recs    := 100;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
---
---    Get Script start time
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') 
     INTO v_date_time
     FROM dual;
   dbms_output.put_line('Script Name : cs_required_donor_information');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR r_temp_rec in CUR_RDI LOOP
      b_rec_status := TRUE;
      mname_only:=null;
      fname_only:=null;
      suffix_only:=null;
      firstname_end:=0;
      szFirst_middle:=null;
---
---   STEP 1: Verify that all required fields have non-null values.
---
      BEGIN
         IF (r_temp_rec.donor_id is null) THEN
             dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                                  r_temp_rec.rownum||' DONOR_ID is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.chapter_id is null) THEN
             dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                                  r_temp_rec.rownum||' CHAPTER_ID is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.last_name is null) THEN
             dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                                  r_temp_rec.rownum||' LAST_NAME is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.first_name is null) THEN
             dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                                  r_temp_rec.rownum||' FIRST_NAME is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.date_of_birth is null) THEN
             dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                                  r_temp_rec.rownum||' DOB is null');
             b_rec_status := FALSE;
         END IF;
---
         IF (r_temp_rec.donor_sex is null) THEN
             dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                                  r_temp_rec.rownum||' GENDER is null');
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
---   STEP 2: Check Donor Id
---
      IF (b_rec_status = TRUE) THEN
         IF ((substr(r_temp_rec.donor_id,1,2) != 'DN') OR 
            (length(r_temp_rec.donor_id) !=10)) THEN
            dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                         r_temp_rec.rownum||' Invalid format for DONOR_ID');
            b_rec_status := FALSE;
         END IF;
      END IF;
---
---   STEP 3: Verify that validation fields have valid values
---
      IF (b_rec_status = TRUE) THEN
---
---    Verify Blood Type
---
         IF (r_temp_rec.blood_type is not null) THEN
            BEGIN
               i_count1 := 0;
               SELECT count(*) 
                 INTO i_count1
                 FROM valid_master_codes
                WHERE code_type = 'ABO'
                  AND code = r_temp_rec.blood_type
                  AND sysdate between eff_Date and nvl(term_date, sysdate+1);
              EXCEPTION
                 WHEN others THEN
                     i_count1 := 0;
            END;
            IF (i_count1 = 0) THEN
                dbms_output.put_line('MW_REQUIRED_DONOR_INFORMATION'||' '||
                             r_temp_rec.rownum||' invalid BLOOD_TYPE');
                b_rec_status := FALSE;
            END IF;
         END IF;
---
--- Check Ethnic Group
---
         IF (r_temp_rec.ethnic_group is not null) THEN
            BEGIN
               i_count1 := 0;
               SELECT count(*)
                 INTO i_count1
                 FROM valid_master_codes
                WHERE code_type = 'ETHGP'
                  AND code = r_temp_rec.ethnic_group
                  AND sysdate between eff_date and nvl(term_date, sysdate+1);
            EXCEPTION
               WHEN others THEN
                  i_count1 := 0;
            END;
            IF (i_count1 = 0) THEN
                dbms_output.put_line('mw_REQUIRED_DONOR_INFORMATION'||' '||
                             r_temp_rec.rownum||' invalid ETHNIC_GROUP');
                b_rec_status := FALSE;
            END IF;
         END IF;
      END IF;
---
---   Check Duplicate Donor ID
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
                       ' Oracle Error Code : '||to_char(sqlcode));
            b_rec_status := FALSE;
            t_donor_id := null;
      END;
---
      IF (t_donor_id is not null) THEN
                dbms_output.put_line('Duplicate donor ID detected.'||' '||
                             r_temp_rec.rownum||' No insert.');
                b_rec_status := FALSE;
      END IF;
---
---    Insert record in donors table  
---
      IF (b_rec_status = TRUE) THEN
        If r_temp_rec.middle_name is null then 
            --moving second part of first name to  iddle name-----
            szFirst_middle:=r_temp_rec.first_name;
            firstname_end:=Length(szFirst_middle);         
            For i in 1.. length(szFirst_middle) loop
                cnt_value:=i;
                 If substr(szFirst_middle,i,1)=' ' then 
                    firstname_end:=i-1;
                    exit;      
                 End If;
            End Loop;
            fname_only:=substr(szFirst_middle,1,firstname_end);
            If Length(szFirst_middle) > firstname_end then
               mname_only:=substr(szFirst_middle,cnt_value+1);
               mname_only:=LTrim(RTrim(mname_only));
            End If;
            If substr(Ltrim(Rtrim(mname_only)),1,2) in
                           ('II','JR','Jr','SR','Sr','DR')
              then
               suffix_only:=substr(mname_only,1,2);
               mname_only:=null;
            End If;
            If mname_only is not null then
               mname_only:=LTrim(RTrim(mname_only));
               If substr(mname_only, -1) ='.' then
                   mname_only:=substr(mname_only,1,length(mname_only)-1);
               End If;    
            End If;
       Else
           fname_only:=r_temp_rec.first_name;
           mname_only:=r_temp_rec.middle_name;    
      End If; 
           
        ---------------------Moving over----------------------
         BEGIN 
            INSERT INTO donors
               (DONOR_ID, CHAPTER_ID, LAST_NAME, FIRST_NAME, MIDDLE_NAME, 
               LAST_NAME_SUFFIX, SALUTATION, SSN, DATE_OF_BIRTH, GENDER,
               SOUNDEX_KEY,BLOOD_TYPE, ETHNIC_GROUP, LIFE_DONATIONS,
               LIFE_CREDIT, CLAIMED_DONATION, PREVIOS_DONOR_ID, PROGRAM_ID, 
               INSERT_DATE, INSERT_USER, AUDIT_KEY)
            VALUES
              (r_temp_rec.DONOR_ID, r_temp_rec.CHAPTER_ID, r_temp_rec.LAST_NAME,
               fname_only,mname_only, 
               nvl(r_temp_rec.NAME_SUFFIX, suffix_only),r_temp_rec.NAME_PREFIX,
               decode(r_temp_rec.ssn,null,null, to_number(translate
                  (r_temp_rec.ssn,'0123456789- ','0123456789'))),
               r_temp_rec.DATE_OF_BIRTH, r_temp_rec.donor_sex,
               soundex(r_temp_rec.LAST_NAME), r_temp_rec.BLOOD_TYPE,
               r_temp_rec.ETHNIC_GROUP,
               r_temp_rec.TOTAL_DONATIONS, r_temp_rec.TOTAL_CREDITS,
               r_temp_rec.CLAIMED_CREDITS, r_temp_rec.OLD_DONOR_ID,
               v_program_id, r_temp_rec.record_date,r_temp_rec.user_id,
               audit_seq.nextval);
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
