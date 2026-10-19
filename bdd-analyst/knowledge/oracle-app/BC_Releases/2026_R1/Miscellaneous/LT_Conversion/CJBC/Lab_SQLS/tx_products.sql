-- ************************************************************************
-- PROGRAM      : TX_PRODUCTS.SQL
-- PURPOSE      : This script would convert all the data of products of 
--                ACTIVE module from temporary tables into all required 
--                LifeTrak /Lab - Distribution tables.
-- ************************************************************************
DECLARE
  last_id             varchar2(15);
  l_audit_seq     number := 0;
  l_notebook_seq  number := 0; 
  cnt             number(5):=0; 
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
  dup_flag        varchar2(1);
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
  nVol    number:=0;
  ltUnit_id    varchar2(15);
  temp_unit_id  varchar2(15);
  cursor c1 is
    select * from convert_products
    where shipped_to is not null
    order by ship_ticket_no, unit_id, product_code;

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
                                'TX_PRODUCTS',
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

v_pgm_id:='BATCH4';

dbms_output.enable(10000000);
 FOR c1_rec in c1
  loop
    begin
      ltUnit_id :=c1_rec.unit_id;

      --substitute the unit number from the mw_unit_trans table for the 
      -- non standard units

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

       ------
      --Get the collection date from the units table
     c_coll_date:=null;     
     Begin
        select coll_date into c_coll_date from units where 
        unit_id=ltUnit_id and rownum=1;
     Exception when no_data_found then 
        c_err_msg:='Unit Information not available-' ||ltUnit_id;
        raise pgm_error;
     End;

     If c1_rec.component_volume > 0 then 
        nVol:=c1_rec.component_volume/1;
     Else
        nVol:=c1_rec.component_volume;
     End If; 
       cnt := cnt+1;
      tot_cnt := tot_cnt +1;
      c_ship_ticket:=c1_rec.ship_ticket_no;
      --savepoint S1;
      c_stmt :=10;  
      c_status := c1_rec.component_mask;

    --  dbms_output.put_line(ltUnit_id||'p='||c1_rec.product_code);

      -- Translate the values to get equivalent LifeTrak values
      IF (rtrim(ltrim(c1_rec.tested_blood_type)) is not null) THEN
         begin             
             c_stmt := 11;
              select decode(rtrim(ltrim(c1_rec.tested_blood_type)),
              'OPOS','51',
              'APOS','62',
              'BPOS','73',
              'ONEG','95',
              'ANEG','06',
              'BNEG','17',
              'ABNG','28',
              'ABPS','84','99')
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

    If length(ltUnit_id) > 7 then 

      begin
        c_stmt := 12;
        select product_code
              into c_product_code
              from valid_products
         where ltrim(rtrim(product_short_name))=RTrim(c1_rec.product_code)
               and unit_scheme_type='I' and rownum =1;  
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
   Else
    
      begin
        c_stmt := 13;
        select product_code
              into c_product_code
              from valid_products
         where ltrim(rtrim(product_short_name))=RTrim(c1_rec.product_code)
               and unit_scheme_type='C' and rownum =1;  
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
  
   End If;

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
     
        dup_flag:='N';
        If Length(ltUnit_id)=7 then 
           If DupCount > 0 then
             ---dbms_output.put_line(ltUnit_id||' '||c_product_code);
             select max(to_number(component_prefix)) into nAliCount
             from components where unit_id=ltUnit_id and
             trunc(coll_date)=trunc(c1_rec.coll_date) and 
             product_code=c_product_code;
             nAliCount:=nAliCount+1;
             ---dbms_output.put_line('DUP='||to_char(nAliCount));
           Else
            nAliCount:=1;
           End If;
      Elsif Length(ltUnit_id)=13 and ltUnit_id like 'W%' then 
          if DupCount > 0 then 
              dup_flag:='Y';
          end if;

       End If;

      -- Insert data into components table
    If dup_flag='N' then 
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
                                nvl(c1_rec.insert_date,c_coll_date),
                                'S',   --c_status,
                                nvl(c1_rec.expiry_date,c_coll_date+3650),
                                c_blood_type,
                                c1_rec.relabel_product_code,
                                c1_rec.pooled_component_id,
                                nVol,   --c1_rec.component_volume,
                                c_note_id,
                                'CONVRT',
                                c1_rec.label_dates, 'O');

      -- If shipped product insert into Distribution tables also.

        c_stmt := 50;
            -- Get the product_type
            begin
              select product_type
                into c_product_type
                from vserv_products
               where product_code = c_product_code
                 and eff_date between sysdate and nvl(term_date, sysdate+2);
        exception
              when no_data_found then
                c_product_type := 'CONV';
        end;

            c_stmt := 51;
        
           Begin       
            select consignee_id into c_consignee from shipments where
            shipment_no=c1_rec.ship_ticket_no;
          Exception when others then
              c_consignee := 'FROMCNVRT';
          End;

          c_dest_code:=c_consignee;        

          c_stmt := 52;

         begin
           select box_id into c_box
                 from boxes
           where box_id = c_ship_ticket;
        exception
              when others then
                  c_err_msg := 'BOX-'||c_ship_ticket||' '||substr(sqlerrm,1,90);
                  raise pgm_error;
        end;

        -- Get nextval for audit_seq
                c_stmt := 54;
                select audit_seq.nextval into l_audit_seq from dual;

            -- insert into shipped_products table
                c_stmt := 54;
            insert into shipped_products (      UNIT_ID,
                                COLL_DATE,
                                CHAPTER_ID,
                                PRODUCT_CODE,
                                ALIQUOT,
                                BLOOD_TYPE,
                                EXP_DATE,
                                STOCK_STATE,
                                INSERT_DATE,
                                SHIPPED_DATE,
                                SHIPPED_TO,
                                SHIPMENT_NO,
                                PATIENT_ID,
                                TRANSFUSED_DATE,
                                PRODUCT_TYPE,
                                IMPORT_FLAG,
                                INVENTORY_CLASS,
                                AUDIT_KEY,
                                PROGRAM_ID,
                                warehouse_id)
                values  (       ltUnit_id,
                                trunc(c_coll_date),
                                'WAD',
                                c_product_code,
                                to_char(nAliCount),
                                c_blood_type,
                                nvl(c1_rec.expiry_date,c_coll_date+3650),
                                'DL',
                                nvl(c1_rec.insert_date,c_coll_date),
                                nvl(c1_rec.ship_date, sysdate),
                                c_dest_code,
                                c_ship_ticket,
                                c1_rec.patient_id,
                                c1_rec.transfused_date,
                                c_product_type,
                                c1_rec.import_flag,
                                'RE',
                                l_audit_seq,
                                v_pgm_id,   --'CONVRT',
                                'O');

        -- Get nextval for audit_seq
                c_stmt := 590;
                select audit_seq.nextval into l_audit_seq from dual;

        c_stmt := 60;
            -- insert into product_history table
            insert into product_history (UNIT_ID,
                                COLL_DATE,
                                CHAPTER_ID,
                                ALIQUOT,
                                PRODUCT_CODE,
                                STATUS_IND,
                                FROM_DATE,
                                USER_ID,
                                SHIPPED_TO,
                                BLOOD_TYPE,
                                AUDIT_KEY,
                                PROGRAM_ID,
                                INVENTORY_CLASS,
                                warehouse_id)
                values (        ltUnit_id,
                                trunc(c_coll_date),
                                'WAD',
                                to_char(nAliCount),
                                c_product_code,
                                'DL',
                                sysdate,
                                'CONVRT',
                                c_dest_code,
                                c_blood_type,
                                l_audit_seq,
                                v_pgm_id,   --'CONVRT',
                                'RE',
                                'O');

        c_stmt := 70;
            -- Calculate the price of the product
            -- No pricing the product because it is shipped out -For Ogdn

        -- Get nextval for audit_seq
                c_stmt := 749;
                select audit_seq.nextval into l_audit_seq from dual;

            c_stmt := 75;
                -- insert into pick_slip_products
         begin
           select pick_slip_id into c_pick_slip
                 from pick_slips
           where pick_slip_id = c_ship_ticket;
        exception
              when others then
                c_err_msg := 'PICK-'||c_ship_ticket||' '||substr(sqlerrm,1,90);
                raise pgm_error;
        end;

      begin

 
         insert into pick_slip_products (PICK_SLIP_ID,
                                CHAPTER_ID,
                                UNIT_ID,
                                COLL_DATE,
                                PRODUCT_CODE,
                                ALIQUOT,
                                BLOOD_TYPE,
                                PRODUCT_STATUS,
                                PRODUCT_TYPE,
                                EXP_DATE,
                                ITEM_NO,
                                PRODUCT_PRICE,
                                QC_FLAG,
                                QC_DATE,
                                BOX_ID,
                                INSPECTED_BY,
                                AUDIT_KEY,
                                PROGRAM_ID)
                values  (c_pick_slip,
                                'WAD',
                                ltUnit_id,
                                trunc(c_coll_date),
                                c_product_code,
                                to_char(nAliCount),
                                c_blood_type,
                                'DL',
                                c_product_type,
                                nvl(c1_rec.expiry_date,c_coll_date+3650),
                                '1',
                                null,   --c_price,
                                'Y',
                                nvl(c1_rec.ship_date, sysdate),
                                c_box,
                                'CONVRT',
                                l_audit_seq,
                                v_pgm_id );
   exception when others then
       c_err_msg:=substr(sqlerrm,1,200);
          raise pgm_error;
   end;

  End If;   -- this is for if dup_flag='N'

        c_stmt := 80;

     if cnt > 0 then
        commit;  -- Commit the transaction for every 100 records.
--        set transaction use rollback segment big_rbs;
            cnt := 0;

            -- Reset reconciliation valriables
            c_box   :=null;
            c_order   :=null;
            c_pick_slip   :=null;
            c_ship_ticket   :=null;
            c_ship_cnt   :=0;
     end if;
    
exception
      when pgm_error then
            --rollback to savepoint S1;
        c_item_id := ltUnit_id;
        --dbms_output.put_line('Basker='||sqlerrm);
            insert_error;
        if c_exit_flg = 'Y' then
              exit;
        end if;

      when others then
           -- rollback to savepoint S1;
            c_err_msg := substr(sqlerrm,1,100);
        c_item_id := ltUnit_id;
      dbms_output.put_line(c_item_id ||' '||c_err_msg);
        insert_error;
        if c_exit_flg = 'Y' then
              exit;
        end if;
    end;
  end loop;
  commit;
--  set transaction use rollback segment big_rbs;
END;
/
