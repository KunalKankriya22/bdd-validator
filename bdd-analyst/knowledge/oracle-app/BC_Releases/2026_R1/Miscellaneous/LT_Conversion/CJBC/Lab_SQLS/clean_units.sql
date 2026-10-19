-- ************************************************************************
-- PROGRAM      : CLEAN_UNITS.SQL
-- PURPOSE      : This script would clean the units table
-- ************************************************************************
DECLARE
  cnt             number(5):=0; 
  tot_cnt         number  :=0;
  bCount        number:=0;  
  cursor c1 is
    select distinct unit_id from convert_products where 
    shipped_to is null;
BEGIN    --Main begin
dbms_output.enable(1000000);
 FOR c1_rec in c1
  loop
    begin
      cnt := cnt+1;
      tot_cnt := tot_cnt +1;
      delete from units where unit_id=c1_rec.unit_id;
      delete from unit_attributes where unit_id=c1_rec.unit_id;
 
     if cnt > 10 then
        commit;  -- Commit the transaction for every 100 records.
            cnt          := 0;
      end if;
     exception when others then
    dbms_output.put_line(sqlerrm); 
   end;
  end loop;

  commit;
END;
/
