DECLARE
   CURSOR cur_mer is
    select  NEW_DONOR_ID, CHAPTER_ID, OLD_DONOR_ID, OLD_GENDER  ,
      to_date(OLD_DATE_OF_BIRTH,'MM-DD-YYYY') OLD_DOB, OLD_LAST_NAME ,
      OLD_SSN, OLD_FIRST_NAME,
      OLD_MIDDLE_NAME, S_SALUTATION, OLD_BLOOD_TYPE ,S_ETHNIC_GROUP,          
      rownum FROM mw_merged_donors where
      new_donor_id is not null;
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
   v_count          NUMBER:=0;
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '419C';
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
   dbms_output.put_line('Script Name : MW_MERGED_DONORS');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_mer LOOP
      b_rec_status := TRUE;
---
        ---
         select nvl(count(*),0) into v_count from donors where
         donor_id =currec.new_donor_id;

        if v_count = 0 then 
            b_rec_status:=FALSE;
            dbms_output.put_line( currec.new_donor_id||'- Invalid Donor ID'||
                                  ' '||currec.new_donor_id);
        end if;

---   STEP 4: Insert record in the merged donors table
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO Merged_donors 
               (
                 PRIMARY_DONOR_ID,
                 CHAPTER_ID,
                 SECONDARY_DONOR_ID,
                 S_GENDER,           
                 S_DATE_OF_BIRTH,    
                 S_LAST_NAME,
                 S_SSN,
                 S_FIRST_NAME,
                 S_MIDDLE_NAME,
                 S_SALUTATION,
                 S_BLOOD_TYPE,
                 S_ETHNIC_GROUP,
                 PROGRAM_ID, 
                 INSERT_DATE,
                 INSERT_USER)
        VALUES( currec.new_donor_id,'ALL',currec.old_donor_id,
                currec.old_gender,currec.OLD_DOB,
                currec.old_last_name,currec.old_ssn,
                currec.old_first_name,currec.old_middle_name,
                currec.S_SALUTATION,currec.old_blood_type,
                currec.S_ETHNIC_GROUP,'419C',sysdate,'DONSYS');
        
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
                 dbms_output.put_line(currec.rownum||' '||currec.new_donor_id||
                            ' : '||sqlerrm);
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
      dbms_output.put_line('Conversion for Merged Donors: Done!!');
   ELSE
      dbms_output.put_line('Conversion for Merged Donors : Stopped!');
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
