DECLARE
---
   CURSOR CUR_DI is
      SELECT donor_id, chapter_id, inter_code, effective_date, term_date,
      rownum FROM MW_DONOR_INTERDICTIONS inter
         where inter_code is not null and
         inter_code in ('02','03','04', '05', '06', '07','08', '10', 
                        '11', '13', '16', '24','25','34','98','99')
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
   szInter          varchar2(5);
BEGIN
   dbms_output.enable(1000000);
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
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
      IF currec.inter_code in ('03', '04','05', '06', '10','11','13','16',
                                 '24','34') then
         if currec.term_date is null then 
             szInter:=currec.inter_code||'PD';
         else
            szInter:=currec.inter_code||'TD';
         end if;
      ELSIF currec.inter_code='02' then 
           szInter:='HDT';
      ELSIF currec.inter_code in ('07','08') then
           szInter:=currec.inter_code||'PD';
      ELSIF currec.inter_code ='25' then
           if currec.term_date is not null then 
              szInter:='HDT';
           else
              szInter:='25PD';
           end if;
      ELSIF currec.inter_code in ('98','99') then 
          if currec.term_date is not null then 
              szInter:='HDT';
          else
              szInter:='HDI';
          end if;
      END IF;

       update mw_donor_interdictions set inter_code=szInter where
       donor_id=currec.donor_id and inter_code=currec.inter_code and
       effective_date=currec.effective_date;

       commit;
   END LOOP;
END;

