-- **************************************************************************
-- PROGRAM   : TX_UNIT_ATTRIBUTES.SQL
-- PURPOSE   : This script would convert all the data for ATTRIBUTES
--              of ACTIVE module from temporary tables into the required 
--        LifeTrak /Lab - Distribution tables.
-- **************************************************************************
DECLARE
  last_id         varchar2(15);
  l_audit_seq     number := 0;
  cnt             number(5):=0; 
  tot_cnt         number  :=0;
  c_attrib_group    varchar2(5);
  c_attrib_code     varchar2(4);
  c_status_flag     varchar2(1);
  c_stop_label      varchar2(1);
  c_stmt          number(5);
  c_err_msg       varchar2(60);
  c_err_flg       varchar2(1);
  c_err_cd        varchar2(2);
  c_insert_user   varchar2(6);
  pgm_error       exception;
  c_error_cnt     number :=0;
  c_item_id       varchar2(30);
  c_exit_flg      varchar2(1):='N';
  c_exist_flag    varchar2(1);

  cursor c1 is
    select unit_id, coll_Date, chapter_id 
      from convert_products where
      trans_id='006'
     order by unit_id;


begin
  for c1_rec in c1
  loop
    begin
      cnt := cnt+1;
      tot_cnt := tot_cnt +1;

      insert into mw_donor_side_attrib 
         (UNIT_ID, COLL_DATE)
     values
         (c1_rec.unit_id ,
          trunc(c1_rec.coll_date));

      if cnt > 99 then
        commit;  -- Commit the transaction for every record.
       cnt := 0;
      end if;
    exception 
      when others then
         dbms_output.put_line(sqlerrm);
    end;
  end loop;

commit;
end;
/
