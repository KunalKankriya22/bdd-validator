declare
    nCount  NUMBER:=0;
    xCount  NUMBER:=0;
 cursor THERA_donor is select donor_id, eff_date from donor_interdictions
    where inter_code='THERA';

 /* cursor rbc56_units (pl_donor in varchar2, pl_coll_date in date) is 
         select unit_id, coll_date from donations where donor_id=pl_donor and
         coll_date=pl_coll_date and procedure_code in ('AP','PP') and 
         unit_id is not null;
 */

begin
   FOR Z in THERA_donor loop

          -- check if any DDI with the same effective date date
         select nvl(count(*),0) into nCount from donor_interdictions                     where donor_id=Z.donor_id and inter_code='DDI' and
         trunc(eff_date)=trunc(Z.eff_date);

         If nCount > 0 then
            xCount:=xCount+1;
           -- dbms_output.put_line(Z.donor_id|| '  DDI '|| '  '||
           --                      to_char(Z.eff_date,'mm-dd-yyyy'));
            update donor_interdictions set term_date=eff_date where
            donor_id=Z.donor_id and trunc(eff_date)=trunc(Z.eff_date)
            and inter_code='DDI';
         End If;
   END LOOP;
   dbms_output.put_line('Total Count='||to_char(xCount));
end;

