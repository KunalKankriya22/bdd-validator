-- Version: 01 Modified Date: 03/20/2013
declare
  cursor c1 is
  select distinct unit_id, coll_date, product_code, aliquot, convert_flag, shipped_to
    from convert_products_temp;
begin
  delete from convert_products_temp;
 
  delete from convert_products_temp1;

  begin
    insert into convert_products_temp
    select * from convert_products
     where inv_status in ('BBAA', 'BBAF')
       and convert_flag in ('', 'A', 'Q', 'B')
     union
    select * from convert_products 
     where product_code in (select product_short_name 
                              from valid_products 
                             where inv_product_type like '%RBC%')
       and coll_date > to_date('07-07-2014', 'MM-DD-YYYY') - 42;
     --and coll_date > sysdate - 42;
  end;

  for c1rec in c1 loop
    begin
      insert into convert_products_temp1
      select * from convert_products_temp
       where unit_id = c1rec.unit_id
         and coll_date = c1rec.coll_date
         and product_code = c1rec.product_code
         and nvl(convert_flag, '*') = nvl(c1rec.convert_flag, '*')
         and nvl(shipped_to, '*') = nvl(c1rec.shipped_to, '*')
         and nvl(aliquot, '*') = nvl(c1rec.aliquot, '*') -- Added by Kishore on 09/11/2013
         and rownum = 1;
    exception
      when no_data_found then
        dbms_output.put_line('No Data Found for unit: ' || c1rec.unit_id);
      when others then
        dbms_output.put_line('Error: ' || SQLERRM);
    end;
  end loop;

  commit;
end;