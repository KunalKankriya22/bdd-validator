DECLARE
   cursor c1 is select * from x_inter_term order by inter_code;
 term_date date;
BEGIN
   For Z in c1 loop
     IF Z.duration is not null then 
        If Z.period_type='D' then
           update donor_interdictions set term_date=eff_date+Z.duration 
           where inter_code=Z.inter_code and term_date is null;
        ElsIf Z.period_type='Y' then
          update donor_interdictions set term_date=
                add_months(eff_date,(Z.duration*12))
           where inter_code=Z.inter_code and term_date is null;
        ElsIf Z.period_type='W' then
          update donor_interdictions set term_date=eff_date+
                      (Z.duration*7) 
           where inter_code=Z.inter_code and term_date is null;
        End If;
     ELSE
       update donor_interdictions set term_date=Z.until_date
       where inter_code=Z.inter_code and term_date is null;
     END IF;
  End Loop;


commit;
END;
