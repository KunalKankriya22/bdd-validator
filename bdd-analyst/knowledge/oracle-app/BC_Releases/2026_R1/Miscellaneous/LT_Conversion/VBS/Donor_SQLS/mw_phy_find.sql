DECLARE
   CURSOR cur_dc is
      SELECT unit_id, coll_date, chapter_id, phy_code, phy_value,repeat_value,
      rownum,user_id,record_date FROM mw_phy_findings where
      phy_code is not null and phy_value is not null
      ORDER BY unit_id, coll_date;
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
   szUnit_id        varchar2(15);
   ltUnit_id        varchar2(15);
   v_count          NUMBER:=0;
   szTrans_id      varchar2(10); 
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '428C';
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
   dbms_output.put_line('Script Name : MW_PHY_FIND');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_dc LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.unit_id is null) THEN
          dbms_output.put_line(currec.rownum||' UNIT_ID is null');
          b_rec_status := FALSE;
      ELSE
        szUnit_id:=currec.unit_id;
      END IF;
---
      IF (currec.coll_date is null) THEN
          dbms_output.put_line( currec.rownum||' COLL_DATE is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line( currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---

---
---   STEP 2: 
---
      IF (b_rec_status = TRUE) THEN
---
---   Verify that unit is in DONATIONS table.
---
         BEGIN
            i_count := 0;
            SELECT transaction_id into szTrans_id
              FROM donations
             WHERE unit_id = szUnit_id
               AND coll_date = currec.coll_date
               AND chapter_id = currec.chapter_id;
         EXCEPTION
            WHEN no_data_found then
               i_count1 := '0';
         END; 
---    
        --check if the unit is in the translation table
         If i_count1=0 then 
           begin
               select new_unit into ltUnit_id from mw_unit_trans
               where old_unit=szUnit_id;
               szUnit_id:=ltUnit_id;

               select transaction_id into szTrans_id from 
               donations where unit_id=szUnit_id;

           exception 
             when others then 
                 dbms_output.put_line( currec.unit_id||' DONATION not present');
                 b_rec_status := FALSE;
           end;
         End If;

      END IF;
      IF (b_rec_status = TRUE) THEN
        ---
         select nvl(count(*),0) into v_count from valid_physical_rules where
         physical_code=currec.phy_code and sysdate
         between eff_date and nvl(term_date,sysdate+1); 

        if v_count = 0 then 
            b_rec_status:=FALSE;
            dbms_output.put_line( currec.unit_id||' Invalid Physical code'||
                                  ' '||currec.phy_code);
        end if;

      END IF;
---
---   STEP 4: Insert record in table physical findings
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
            INSERT INTO physical_findings 
               (
               TRANSACTION_ID,CHAPTER_ID,PHYSICAL_CODE,        
               PHYSICAL_VALUE,INTER_CODE,PROGRAM_ID,           
               INSERT_DATE,INSERT_USER,AUDIT_KEY,            
               SORT_SEQUENCE,COMMENTS,PHYSICAL_VALUE_REPEAT)
            VALUES
               (szTrans_id, currec.chapter_id,currec.phy_code,
               currec.phy_value,null,v_program_id,
                currec.record_date,currec.user_id,audit_seq.nextval,
               null,null,currec.repeat_value);
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
                 dbms_output.put_line(currec.rownum||' '||currec.unit_id||
                            ' Error Occurred in Step 4!'||
                            ' Oracle Error Code : '||to_char(sqlcode));
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
---
   IF (b_run_status = TRUE) THEN
      dbms_output.put_line('Conversion for Donor Physical : Done!!');
   ELSE
      dbms_output.put_line('Conversion for Donor Physical : Stopped!');
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
