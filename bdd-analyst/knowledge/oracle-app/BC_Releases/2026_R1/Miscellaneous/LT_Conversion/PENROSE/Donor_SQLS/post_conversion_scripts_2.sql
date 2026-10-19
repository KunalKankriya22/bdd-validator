declare
    nCount  NUMBER:=0;

 cursor rbc56_donor is select donor_id, eff_date from donor_interdictions
    where inter_code='RBC56';

  cursor rbc56_units (pl_donor in varchar2, pl_coll_date in date) is 
         select unit_id, coll_date from donations where donor_id=pl_donor and
         coll_date=pl_coll_date and procedure_code in ('AP','PP') and 
         unit_id is not null;
begin
   FOR Z in rbc56_donor loop
       for z1 in rbc56_units(Z.donor_id,trunc(Z.eff_date)) loop
          -- check if any deferrals are there on teh same collection date
         select nvl(count(*),0) into nCount from donations                     
         where donor_id=Z.donor_id and deferral_id is not null and
         coll_date=z1.coll_date;
         If nCount > 0 then
            update donations set actual_rbc_loss=85,equip_reference='X' where
            donor_id=Z.donor_id and coll_date=z1.coll_date and
            unit_id=z1.unit_id;
         End If;
       end loop;
   END LOOP;
end;

