declare
  cursor unit_cur is select unit_id, donor_id from mw_test_results;
  ncount number:=0;
  cnt number:=0;
begin
   for z in unit_cur loop
     cnt:=cnt+1;
      select nvl(count(*),0) into ncount from
       donations where unit_id=z.unit_id and donor_id=z.donor_id;
      if ncount=0 then 
         dbms_output.put_line(z.unit_id||'Donor= '||z.donor_id);
      end if;
  end loop;
  dbms_output.put_line(to_char(cnt));
  
end;

