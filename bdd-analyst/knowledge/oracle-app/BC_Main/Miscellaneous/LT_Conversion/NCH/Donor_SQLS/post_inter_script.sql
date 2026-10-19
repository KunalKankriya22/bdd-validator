DECLARE
---
   CURSOR CUR_DI is
      SELECT donor_id, chapter_id, inter_code, eff_date, term_date,
      rownum FROM DONOR_INTERDICTIONS inter
         where inter_code is not null and
         ---donor_id='DN00031723' and
         inter_code like '%TD%' and term_date='26-JUL-2010' 
       ORDER BY donor_id,inter_code,eff_date;
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
   dMinDate         date;
BEGIN
   dbms_output.enable(1000000);
   i_recs_fail      := 0;
   b_recs_commited  := TRUE;
   b_run_status     := TRUE;
---
   FOR currec in cur_di LOOP
      
      --dbms_output.put_line(currec.donor_id);
       select min(coll_date) into dMinDate from donations
       where donor_id=currec.donor_id and
       coll_date > currec.eff_date ; 

       --dbms_output.put_line(to_char(dMinDate));

       if dMinDate is not null then 
         update donor_interdictions set term_date=dMinDate -1 where
         donor_id=currec.donor_id and inter_code=currec.inter_code and
         eff_date=currec.eff_date and term_date='26-JUL-2010';
       end if;
       --commit;

   END LOOP;
END;

