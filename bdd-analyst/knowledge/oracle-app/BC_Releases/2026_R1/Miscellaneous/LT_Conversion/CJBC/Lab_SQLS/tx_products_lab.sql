-- ************************************************************************
-- PROGRAM      : TX_PRODUCTS_LAB.SQL
-- PURPOSE      : This script would convert all the data of products of 
--                into components table for forthur processing 
--                LifeTrak /Lab - Distribution tables.
-- ************************************************************************
DECLARE
  last_id             varchar2(15);
  l_audit_seq     number := 0;
  l_notebook_seq  number := 0; 
  cnt             number:=0; 
  tot_cnt         number  :=0;
  lDonType        varchar2(5);
  lProcType       varchar2(4);
  c_product_code  varchar2(8);
  c_product_type  varchar2(5);
  c_aliquot       varchar2(2);
  c_temp_seq      number := 0;
  c_pick_slip     varchar2(10);
  c_ship_ticket   varchar2(14);
  c_box           varchar2(10);
  c_order         varchar2(14);
  c_customer      varchar2(10);
  c_payee         varchar2(10);
  c_ship_cnt      number := 0;
  c_attrib_code   varchar2(4);
  c_user_id       varchar2(8);
  c_dest_code     varchar2(10);
  c_consignee     varchar2(10);
  c_bag_code      varchar2(4);
  c_status        varchar2(1);
  c_price         number := 0;
  c_temp_price    number := 0;
  c_blood_type    varchar2(4);
  c_temp_cnt      number := 0;
  c_stmt          number(5);
  c_err_msg       varchar2(100);
  c_err_flg       varchar2(1);
  c_err_cd        varchar2(2);
  c_insert_user   varchar2(6);
  pgm_error       exception;
  c_error_cnt     number :=0;
  c_item_id       varchar2(30);
  c_exit_flg      varchar2(1):='N';
  c_note_id       varchar2(10);
  c_note_text     varchar2(1000);
  c_attrib_code   varchar2(4);
  v_pgm_id     varchar2(10);
  c_coll_date    date;
  nAliCount    number:=0;
  DupCount   number:=0;
  nVOl    NUMBER:=0;
  ltUnit_id  varchar2(13);
  temp_unit_id varchar2(13);

  cursor c1 is
    select * from convert_products
    where shipped_to is null and component_mask='L'
    and convert_flag in ('A','B'); 

  procedure insert_error is
  begin
    c_error_cnt := c_error_cnt +1;

    if c_error_cnt>10000 then
      c_err_msg := 'Reached maximum no of errors';
      c_exit_flg := 'Y';
    end if;

    ---c_stmt := 101;
    insert into program_errors( module_id,
                                program_id,
                                statement_id,
                                item_id,
                                error_msg,
                                insert_user,
                                insert_date)
        values( 'ACTIVECONV',
                                'TX_PRD_LAB',
                                c_stmt,
                                c_item_id,
                                substr(c_err_msg,1,240),
                                'CONVRT',
                                sysdate);
  Exception when others then
    dbms_output.put_line('Insert into error='||sqlerrm); 
     null;
  end;

BEGIN    --Main begin

v_pgm_id:='510P';

dbms_output.enable(10000000);
 FOR c1_rec in c1
  loop
    begin
      cnt := cnt+1;
       If c1_rec.component_volume > 1000 then
        nVol:=c1_rec.component_volume/1000;
       Else
        nVol:=c1_rec.component_volume;
       End If;

      tot_cnt := tot_cnt +1;
      c_ship_ticket:=c1_rec.ship_ticket_no;
      --savepoint S1;
      c_stmt :=10;  
      c_status := c1_rec.component_mask;

    --  dbms_output.put_line(c1_rec.unit_id||'p='||c1_rec.product_code);

     ltUnit_id:=c1_rec.unit_id;
     
      If Length(ltUnit_id)=13 and ltUnit_id like 'W%' then
        null;
      Else
         begin
            select new_unit into temp_unit_id from mw_unit_trans where
            old_unit=ltUnit_id;

            ltUnit_id:=temp_unit_id;
         exception when others then
            null;
         end ;
     End If;


      -- Translate the values to get equivalent LifeTrak values
      IF (rtrim(ltrim(c1_rec.tested_blood_type)) is not null) THEN
         begin             
             c_stmt := 11;
              select decode(rtrim(ltrim(c1_rec.tested_blood_type)), 'OP','51',
                                                'AP','62',
                                                'BP','73',
                                                'ABP','84',
                                                'ON','95',
                                                'AN','06',
                                                'BN','17',
                                                'OPOS','51',
                                                'APOS','62',
                                                'BPOS','73',
                                                'ONEG','95',
                                                'ANEG','06',
                                                'BNEG','17',
                                                'ABNG','28',
                                                'ABPS','84',
                                                'ABN','28','99')
                into c_blood_type from dual;
           
         exception
               when others then
                 c_blood_type := c1_rec.tested_blood_type;
                 c_err_msg := substr(sqlerrm,1,100);
                 raise pgm_error;
         end;
      ELSE
         c_blood_type:='47';
      END IF;

      --Get the collection date from the units table
     c_coll_date:=null;     
     Begin
        select coll_date into c_coll_date from units where 
        unit_id=ltUnit_id and rownum=1;
     Exception when others then
        c_coll_date:=c1_rec.coll_date;
     End;


      begin
        c_stmt := 12;
        select product_code
              into c_product_code
              from valid_products
         where UPPER(ltrim(rtrim(product_short_name)))=c1_rec.product_code
               and rownum =1;  
    exception
            when no_data_found then
              --c_product_code := c1_rec.product_code;
              c_err_msg :=c1_rec.product_code||
                   ' No Data in the product code table';
              raise pgm_error;
        when others then
           c_err_msg:=c1_rec.product_code||'-'||sqlerrm;
           raise pgm_error; 
     end;


      -- Check for notes present on product
           -- Hemocare does not deal with comments

      -- Get nextval for audit_seq
          c_stmt := 30;
          select audit_seq.nextval into l_audit_seq from dual;

      -- Insert values in component_attributes table
          c_stmt := 31;
          -- no need to insert anything to component attributes
      
      -- Check for Autologous donation
      begin
            select attrib_code into
             lDonType 
             from unit_attributes
             where unit_id = ltUnit_id and attrib_group='DON';

            if lDonType = '00' then
              c_blood_type := '40';
            end if;

      exception
            when no_data_found then
               null;
            when others then
              null;
      end;

      -- Get nextval for audit_seq
          c_stmt := 41;
          select audit_seq.nextval into l_audit_seq from dual;

          c_stmt := 42;
   --Check for aliquotes
        nAliCount:=1;     
     
       select nvl(count(*),0) into DupCount from components where
         unit_id=ltUnit_id and trunc(coll_date)=trunc(c_coll_date) and
         product_code=c_product_code;

        If DupCount > 0 then
          ---dbms_output.put_line(c1_rec.unit_id||' '||c_product_code);
          select max(to_number(component_prefix)) into nAliCount
          from components where unit_id=ltUnit_id and
          trunc(coll_date)=trunc(c1_rec.coll_date) and 
          product_code=c_product_code;
          nAliCount:=nAliCount+1;
          ---dbms_output.put_line('DUP='||to_char(nAliCount));
       Else
        nAliCount:=1;
       End If;

       If nAliCount is null or nAliCount=0 then 
         nAliCount:=1;
       End If;


      -- Insert data into components table
     Begin
      insert into components(   UNIT_ID         ,
                                COLL_DATE,
                                CHAPTER_ID,
                                COMPONENT_PREFIX,
                                PRODUCT_CODE,
                                BAG_ID,
                                AUDIT_KEY,
                                PROGRAM_ID,
                                INSERT_DATS,
                                COMPONENT_STATUS,
                                EXPIRY_DATE,
                                SYSTEM_LABEL_DECISION,
                                RELABEL_PRODUCT_CODE,
                                POOLED_COMPONENT_ID,
                                COMPONENT_WEIGHT,
                                NOTE_ID,
                                LABEL_USER_ID,
                                LABEL_DATS, warehouse_id)
      values (  ltUnit_id,
                                trunc(c_coll_date) ,
                                'WAD',
                                to_Char(nAliCount),
                                c_product_code,
                                '99',
                                l_audit_seq,
                                v_pgm_id,  ---'CONVRT',
                                nvl(c1_rec.insert_date,trunc(c_coll_date)),
                                'L',   --c_status,
                                c1_rec.expiry_date,
                                c_blood_type,
                                c1_rec.relabel_product_code,
                                c1_rec.pooled_component_id,
                                0.0, --round(nVol,2), --c1_rec.component_volume,
                                c_note_id,
                                'CONVRT',
                                c1_rec.label_dates, 'L');
    Exception when others then 
          dbms_output.put_line('CI='||sqlerrm||' '||c1_rec.unit_id||' '||
           c_product_code||' '||to_char(nAliCount)||' Blood='||c_blood_type);
      null;
    End;

    EXception  
         when pgm_error then
           c_item_id := c1_rec.unit_id;
           dbms_output.put_line(sqlerrm||' '||ltUnit_id||
           ' Pro1='||c_product_code);
            insert_error;
            if c_exit_flg = 'Y' then
              exit;
            end if;
          when others then
           c_item_id := c1_rec.unit_id;
           -- dbms_output.put_line(sqlerrm||' '||c1_rec.unit_id||' '
           --||c_product_code||' '|| to_char(nAliCount);
            c_err_msg:=sqlerrm||' '||c1_rec.unit_id||' '||c_product_code||' '||
            to_char(nAliCount);
            insert_error;
            if c_exit_flg = 'Y' then
              exit;
            end if;
    End;

  commit; 
  end loop;
  commit;

EXCEPTION WHEN others then
  dbms_output.put_line(c_err_msg);
END;
/
