declare
  cursor inter_cur is select distinct donor_id from
   mw_donor_interdictions;

  ncount number:=0;
  cnt number:=0;
begin
   for z in inter_cur loop
 
      select nvl(count(*),0) into ncount from
       donors where donor_id=z.donor_id;
      if ncount=0 then 
             cnt:=cnt+1;
         dbms_output.put_line('Donor= '||z.donor_id);
      end if;
  end loop;
  dbms_output.put_line(to_char(cnt));
  
end;



