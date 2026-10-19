DECLARE
---
   CURSOR CUR_DI is
      SELECT donor_id, chapter_id, inter_code, effective_date, term_date,
      user_id,event_date, 
      rownum FROM MW_DONOR_INTERDICTIONS inter
       WHERE 
            --EXISTS
            -- (SELECT 'x'
            ---    FROM donors
            --   WHERE donors.donor_id = inter.donor_id) AND
          inter_code is not null
       ORDER BY chapter_id, donor_id, inter_code;
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
   v_inter_type     varchar2(5);
   v_inter_code     varchar2(5);
   dup_count        NUMBER:=0;
   dup_inter         number:=0;
   pl_donor_id      varchar2(10);
   pl_user_id       varchar2(10);
BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '414L';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
   v_inter_type     := null;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : cs_donor_interdiction');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_di LOOP
      b_rec_status := TRUE;
---
---   STEP 1: Check that required fields are not null, else log the record
---
      IF (currec.donor_id is null) THEN
         dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                              currec.rownum||' DONOR_ID is null');
         b_rec_status := FALSE;
      END IF;
---
      IF (currec.chapter_id is null) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                               currec.rownum||' CHAPTER_ID is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.inter_code is null) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                               currec.rownum||' INTER_CODE is null');
          b_rec_status := FALSE;
      END IF;
---
      IF (currec.effective_date is null) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTIONS'||' '||
                               currec.rownum||' EFFECTIVE_DATE is null');
          b_rec_status := FALSE;
      END IF;
---
---  Verify that donor is in DONORS table.
---
      pl_donor_id:=currec.donor_id;

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
          --dbms_output.put_line('MW_DONOR_INTERDICTION'||' '||
          --                     currec.donor_id||' DONOR not present');
          --b_rec_status := FALSE;
         begin
          select b.new_donor_id into pl_donor_id from 
          mw_merged_donors b, donors a
          where b.old_donor_id=currec.donor_id and
          b.new_donor_id=a.donor_id;
         exception 
             when others then 
                dbms_output.put_line('MW_DONOR_INTERDICTION'||' '||
                              currec.donor_id||' DONOR not present');
                b_rec_status:=FALSE;
         end;
      END IF;
---
---  Verify that interdiction, donor_id, effective date commbination
---  does not exist in donor_interdictions table.
---
      BEGIN
         i_count1 := 0;
         SELECT count(*)
           INTO i_count1
           FROM donor_interdictions
          WHERE donor_id = pl_donor_id
            AND chapter_id = currec.chapter_id
            AND inter_code = currec.inter_code
            AND eff_date = currec.effective_date;
      EXCEPTION
         WHEN others THEN
            i_count1 := 0;
      END;
---
      IF (i_count1 > 0) THEN
          --dbms_output.put_line('Donor: '||currec.donor_id||' Inter: '||
          --currec.inter_code||'  Date: '||to_char(currec.effective_date,
          --'mm-dd-yyyy')|| ' Already present');
          -- b_rec_status := FALSE;
          null;
          --dup_inter:=dup_inter+1;
      END IF;
---
---    Check inter_code
---
      v_inter_type := null;
      BEGIN
         SELECT inter_type,inter_code
           INTO v_inter_type,v_inter_code
           FROM valid_interdictions
          WHERE old_inter = currec.inter_code and
          rownum=1; --sysdate between eff_date and nvl(term_date,sysdate+1);
      EXCEPTION
        WHEN no_data_found then 
           Begin
              SELECT inter_type,inter_code
                INTO v_inter_type,v_inter_code
                FROM valid_interdictions
                WHERE inter_code = currec.inter_code and
                rownum=1; 
           Exception
               when no_data_found then
                  begin                 
                      select lt_inter into v_inter_code from x_inter where
                      bbcs_inter= currec.inter_code and rownum=1;
         
                      SELECT inter_type,inter_code
                      INTO v_inter_type,v_inter_code
                      FROM valid_interdictions
                      WHERE inter_code = v_inter_code and
                      rownum=1;
                  exception when others then 
                     v_inter_type:=null;
                  end;
           End;
        WHEN others THEN
         v_inter_type := null;
      END;


      IF (v_inter_type is null) THEN
          dbms_output.put_line('MW_DONOR_INTERDICTION'||' '||
                        currec.inter_code||' '||
                         currec.rownum||' Invalid Interdiction Code');
          b_rec_status := FALSE;
      END IF;
---
---   Insert interdiction record.
---
      IF (b_rec_status = TRUE) THEN
         BEGIN
           dup_count:=0;
           pl_user_id:=currec.user_id;
           if length(pl_user_id) > 6 then
              pl_user_id:='DONSYS';
           end if;

           select nvl(count(*),0) into dup_count from donor_interdictions
           where donor_id=pl_donor_id and
            trunc(eff_date)=trunc(currec.effective_date) and 
            inter_code=v_inter_code and
             trunc(insert_date)=trunc(currec.event_date) and
             NVL(trunc(term_date),trunc(sysdate))=nvl(trunc(currec.term_date),
             trunc(sysdate)) and
             insert_user=pl_user_id;
     

           if dup_count=0 then
            INSERT into donor_interdictions
               (donor_id,chapter_id,inter_code,eff_date,
                inter_type,term_date, program_id, insert_date, 
                insert_user, audit_key)
            VALUES 
               (pl_donor_id, currec.chapter_id, v_inter_code,
                currec.effective_date, v_inter_type,
                DECODE(v_inter_code,'NOPT',null, currec.term_date),
                v_program_id, nvl(trunc(currec.event_date),trunc(sysdate)),
                nvl(pl_user_id,'DONSYS'), audit_seq.nextval);

           else   -- to capture the duplicate records 

             dup_inter:=dup_inter+1;
              INSERT into mw_donor_inter_dups
                 (donor_id,chapter_id,inter_code,eff_date,
                  inter_type,term_date, program_id, insert_date,
                  insert_user, audit_key)
              VALUES
                (pl_donor_id, currec.chapter_id, v_inter_code,
                 currec.effective_date, v_inter_type, currec.term_date,
                 v_program_id, nvl(trunc(currec.event_date),trunc(sysdate)),
                 nvl(pl_user_id,'DONSYS'), audit_seq.nextval);
           end if;

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
                 dbms_output.put_line('Error:'||sqlerrm);
         END; -- step 4
      ELSE
         i_recs_fail := i_recs_fail + 1;
      END IF;
   END LOOP;
   COMMIT;
   IF (b_run_status = TRUE) THEN
        dbms_output.put_line('Conversion for Donor Interdictions : Done!!');
   ELSE
        dbms_output.put_line('Conversion for Donor Interdictions : Stopped!');
   END IF;
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS')
     INTO v_date_time
     FROM dual;
    dbms_output.put_line('No. of records converted    : '||
                          to_char(i_recs_succ));
    dbms_output.put_line('No. of records not converted : '||
                          to_char(i_recs_fail));
    dbms_output.put_line('No. of duplicates : '||
                      to_char(dup_inter));

    dbms_output.put_line('Script End Time : '||v_date_time);
END; 

