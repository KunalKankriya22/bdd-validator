DECLARE
  CURSOR CUR_RDI is
   SELECT a.batch_id b_id,a.donor_id DN_ID,d.first_name FN,last_name LN,
    d.date_of_birth DOB,d.gender GID,d.ssn social from
    mw_dup_donors a, donors d
   where d.donor_id=a.donor_id 
   ORDER BY to_number(a.batch_id),2,3;
---
   i_batch_id       number;
   i_count1         number;
   i_rec_count      number;
   i_recs_succ      number;
   i_recs_fail      number;
   b_recs_commited  boolean;
   n_total           number:=0;
   v_date_time     varchar2(52);
BEGIN
   dbms_output.enable(6000000);
   i_rec_count      := 0;
   i_recs_succ      := 0;
   i_recs_fail      := 0;
   i_batch_id       :=0;
---
---    Get Script start time
---
---
   FOR r_temp in CUR_RDI LOOP
      n_total:=0;
      if i_batch_id!=r_temp.b_id then
         dbms_output.put_line('------------------------------------'||
                              '----------------------------------');
      end if;

      dbms_output.put_line(r_temp.b_id||'   '||r_temp.dn_id||'  '||
                           r_temp.FN||'  '||r_temp.LN||' '||
                           r_temp.GID||'  '||'  '||r_temp.DOB||'  '||
                           r_temp.social);
    i_batch_id:=r_temp.b_id; 
   END LOOP;        
END; 
/
