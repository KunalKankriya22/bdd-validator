declare
  cursor donor_inter is select distinct donor_id
  from donor_interdictions where inter_code in ('UCHDD','UCHAU',
                            'ACT','TCMP');
                    
cursor act_inter (pl_donor_id in varchar2 ) is
select inter_code, eff_date, term_date from donor_interdictions
where donor_id=pl_donor_id and inter_code in ('ACT',
                             'UCHDD','UCHAU','TCMP') 
order by eff_date desc;

eval_eff_date  date;

Begin

   For Z in donor_inter LOOP
   
    
      For Z1 in act_inter (Z.donor_id) loop
        
        update donor_interdictions set term_date=eval_eff_date where
        donor_id=Z.donor_id and inter_code=Z1.inter_code and
        eff_date=Z1.eff_date and term_date is null;

        eval_eff_date:=Z1.eff_date;
      End Loop;
                                  
     END LOOP;
END;

