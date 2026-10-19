DECLARE
---
   CURSOR CUR_DI is
      SELECT donor_id, chapter_id, inter_code, effective_date, term_date,
      user_id,event_date, 
      rownum FROM MW_DONOR_INTERDICTIONS inter
       WHERE 
          inter_code is not null and inter_code in ('HBC','STS','HTLV')
          and term_date='01-JAN-1900'
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
   p_new_inter       varchar2(5);
   i_audit_key      number;
   t_donor_id       VARCHAR2(10);
   v_inter_type     varchar2(5);
   v_inter_code     varchar2(5);
   dup_count        NUMBER:=0;
   dup_inter         number:=0;
   pl_donor_id      varchar2(10);

BEGIN
   dbms_output.enable(1000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
   v_program_id     := '414C-U';
   i_commit_recs    := 500;
   v_insert_user    := 'DONSYS';
   i_audit_key      := 0;
   v_inter_type     := null;
---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') into v_date_time
     FROM dual;
---
   dbms_output.put_line('Script Name : Upgrade donor_interdiction');
   dbms_output.put_line('Script Start Time : '||v_date_time);
---
   FOR currec in cur_di LOOP
      b_rec_status := TRUE;

      If currec.inter_code='HBC' then
         p_new_inter:='HBC2';
      Elsif currec.inter_code='STS' then 
         p_new_inter:='STS2';
      Elsif currec.inter_code='HTLV' then 
         p_new_inter:='HTV2';
      End If;

---
---    Check inter_code
---
      v_inter_type := null;
      BEGIN
         SELECT inter_type,inter_code
           INTO v_inter_type,v_inter_code
           FROM valid_interdictions
          WHERE old_inter = p_new_inter and
          rownum=1; --sysdate between eff_date and nvl(term_date,sysdate+1);
      EXCEPTION
        WHEN no_data_found then 
           Begin
              SELECT inter_type,inter_code
                INTO v_inter_type,v_inter_code
                FROM valid_interdictions
                WHERE inter_code = p_new_inter and
                rownum=1; 
           Exception
               when no_data_found then
                  begin                 
                      select lt_inter into v_inter_code from x_inter where
                      bbcs_inter= p_new_inter and rownum=1;
         
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

           select nvl(count(*),0) into dup_count from donor_interdictions
           where donor_id=pl_donor_id and
            trunc(eff_date)=trunc(currec.effective_date) and 
            inter_code=v_inter_code and
             trunc(insert_date)=trunc(currec.event_date) and
             insert_user=currec.user_id;

           if dup_count=0 then
            INSERT into donor_interdictions
               (donor_id,chapter_id,inter_code,eff_date,
                inter_type,term_date, program_id, insert_date, 
                insert_user, audit_key)
            VALUES 
               (currec.donor_id, currec.chapter_id, v_inter_code,
                currec.effective_date, v_inter_type, null,
                v_program_id, nvl(trunc(currec.event_date),trunc(sysdate)),
                nvl(currec.user_id,'DONSYS'), audit_seq.nextval);
           else 
             dup_inter:=dup_inter+1;
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

