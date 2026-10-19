-- **************************************************************************
-- PROGRAM      : TX_UNIT_INTERDICTIONS.SQL
-- PURPOSE      : This script would convert all the data for interdictions
--                of ACTIVE module from temporary tables into the required 
--                LifeTrak /Lab - Distribution tables.
-- **************************************************************************
DECLARE
  last_id             varchar2(15);
  l_audit_seq     number := 0;
  cnt             number(5):=0; 
  tot_cnt         number  :=0;
  lt_prod_code    varchar2(5);
  c_stmt          number(5);
  c_err_msg       varchar2(600);
  c_err_flg       varchar2(1);
  c_err_cd        varchar2(2);
  c_insert_user   varchar2(6);
  pgm_error       exception;
  c_error_cnt     number :=0;
  c_item_id       varchar2(30);
  c_exit_flg      varchar2(1):='N';
  nCount          number:=0;
  cursor c1 is
    select * from convert_product_interdictions
    where inter_code is not null and unit_id in (
    select unit_id from units) order by unit_id;

  procedure insert_error is
  begin
    c_error_cnt := c_error_cnt +1;
    if c_error_cnt>1000 then
      c_err_msg := 'Reached maximum no of errors';
      c_exit_flg := 'Y';
    end if;

    insert into program_errors( module_id,
                                program_id,
                                statement_id,
                                item_id,
                                error_msg,
                                insert_user,
                                insert_date)
                        values( 'ACTIVECONV',
                                'TX_PROD_INTER',
                                c_stmt,
                                c_item_id,
                                c_err_msg,
                                'CONVRT',
                                sysdate);
  end;


begin

  for c1_rec in c1
  loop
    begin
      cnt := cnt+1;
      tot_cnt := tot_cnt +1;

    
    begin
       select product_code into lt_prod_code from valid_products
       where product_short_name=c1_rec.product_code and
       unit_scheme_type=decode(length(c1_rec.unit_id),7,'C','I');
   exception when others then 
      c_err_msg:=sqlerrm;
       raise program_error;
     
   end;

      c_stmt :=10;
      
          c_stmt := 19;
          select audit_seq.nextval into l_audit_seq from dual;

      -- Insert data into unit_interdictions table
      c_stmt := 20;
     select count(*) into nCount from component_interdictions
     where unit_id=c1_rec.unit_id and product_code=lt_prod_code and
     inter_code=c1_rec.inter_code;
    
    If nCount = 0 then 
      insert into component_interdictions (  UNIT_ID         ,
                                COLL_DATE       ,
                                CHAPTER_ID      ,
                                PRODUCT_CODE    ,
                                INTER_CODE      ,
                                INSERT_DATS     ,
                                INTER_USER_ID   ,
                                AUDIT_KEY       ,
                                PROGRAM_ID      )
          values (      c1_rec.unit_id          ,
                                trunc(c1_rec.coll_date) ,
                                'WAD'                   ,
                               lt_prod_code           ,
                                c1_rec.inter_code      ,
                                c1_rec.insert_date  ,
                                c1_rec.insert_user,
                                l_audit_seq     ,
                                'CONVRT'                );
      End if;


      if cnt > 99 then
        commit;  -- Commit the transaction for every record.
            cnt := 0;
      end if;

    exception
      when pgm_error then
        c_item_id := c1_rec.unit_id;
            insert_error;
        if c_exit_flg = 'Y' then
              exit;
        end if;

      when others then
            c_err_msg := substr(sqlerrm,1,60);
        c_item_id := c1_rec.unit_id;
        insert_error;
        if c_exit_flg = 'Y' then
              exit;
        end if;
    end;
  end loop;

commit;
end;
/
