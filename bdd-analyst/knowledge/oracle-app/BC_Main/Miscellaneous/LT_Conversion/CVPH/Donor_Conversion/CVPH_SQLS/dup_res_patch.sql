declare
 t_unit varchar2(15);
 t_test varchar2(10);
 t_result varchar2(10);
 
 cursor duplicate_units is 
 select unit_id, test_id, count(*) from temp_results
where test_result!='HIDE'
group by unit_id, test_id having count(*) >1;

Begin

For Z in duplicate_units loop
begin
  select distinct unit_id, test_id, test_result into
       t_unit, t_test, t_result from temp_results where
       unit_id=Z.unit_id and test_id=Z.test_id and
       test_result!='HIDE'; 
exception 
when no_data_found then 
  null;
when too_many_rows then 
  insert into conv_diff_results values (Z.unit_id,Z.test_id,null);
end;   
End Loop;
End;


