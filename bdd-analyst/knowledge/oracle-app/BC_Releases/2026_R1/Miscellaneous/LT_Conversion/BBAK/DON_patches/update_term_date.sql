DECLARE
---
   CURSOR CUR_DI is
      SELECT donor_id,inter_code,inter_type,eff_date,term_date from 
             donor_interdictions where term_date is null
            and inter_code not in (select inter_code from
            valid_interdictions where period_type='P') and
            inter_code not in ('CMVP','CMVN','LCMN','LCMP');
   
   i_recs           number:=0;
   n_period         NUMBER:=0;
   n_days           NUMBER:=0;
   v_term_days      NUMBER:=0;
   v_date_time   varchar2(20);
   i_rec            NUMBER:=0;

BEGIN
   dbms_output.enable(1000000);

---
   SELECT to_char(sysdate,'MM/DD/YYYY HH24:MI:SS') into v_date_time
     FROM dual;
   
   dbms_output.put_line('Script Start Time : '||v_date_time);
   FOR currec in cur_di LOOP
      
      --get the deferral through date from the interdiction table
       n_period:=0;
       n_days:=0;
      begin
      select period_number,decode(substr(period_type,1,1),'Y',365,
                                             'M',31,
                                             'W',7,
                                             'D',1) into n_period,n_days 
       from valid_interdictions
       where inter_code=currec.inter_code and sysdate between eff_date
       and nvl(term_date,sysdate+1) and rownum = 1;
     
      v_term_days:=n_period * n_days;

       UPDATE donor_interdictions set term_date=eff_date+v_term_days where
       donor_id=currec.donor_id and inter_code=currec.inter_code and
       eff_date=currec.eff_date and term_date is null;
   
      exception when others then 
       null;
      end;

      i_rec:=i_rec+1;
        if i_rec>=100 then
          commit;
          i_rec:=0;
        end if;

   END LOOP;
   COMMIT;
END; 

