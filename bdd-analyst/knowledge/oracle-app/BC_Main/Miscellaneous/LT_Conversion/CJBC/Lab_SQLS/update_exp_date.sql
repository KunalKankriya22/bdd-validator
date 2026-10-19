Declare
  cursor c1 is select * from convert_products 
               where convert_flag='C'
    for update of expiry_date;

  pl_life  number;
  pl_ind   varchar2(1);
  pl_days  number:=0;
  pl_exp_date  DATE;
Begin
  FOR c1_rec in c1 loop
    begin
    select distinct life_span_ind,life_span into pl_ind,pl_life
    from  valid_products where product_short_name=c1_rec.product_code
    and rownum =1;
    
     select decode(pl_ind,'Y',365*pl_life,
                          'D',1 * pl_life,
                          'H',pl_life/24) into pl_days from dual;

     pl_exp_date:=c1_rec.coll_date+pl_days;

     UPDATE convert_products set shipped_to='CONV',
      expiry_date=pl_exp_date where current of c1;
    commit;
  exception when no_data_found then 
     dbms_output.put_line('No record='||c1_rec.product_code);
  end;

  End Loop;
END;

/
commit
/



