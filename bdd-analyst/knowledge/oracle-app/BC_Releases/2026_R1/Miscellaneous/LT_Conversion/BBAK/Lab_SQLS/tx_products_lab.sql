-- ************************************************************************
-- PROGRAM      : TX_PRODUCTS_LAB.SQL
-- PURPOSE      : This script would convert all the data of products of 
--                into components table for forthur processing 
--                LifeTrak /Lab - Distribution tables.
-- date modified: 02/07/10   Edwin
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
  c_user_id       varchar2(8);
  c_status        varchar2(1);
  c_blood_type    varchar2(4);
  C_temp_cnt      number := 0;
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
  v_pgm_id     varchar2(10);
  c_coll_date    date;
  sld_date        date;
  sld_user        varchar2(30);
  nAliCount    number:=0;
  DupCount   number:=0;
  nVOl    NUMBER:=0;
  szStatusInd  varchar2(5); 
 ltUnit_id  varchar2(13);
  temp_unit_id varchar2(13);
  szReject varchar2(10);
  szRelabel  varchar2(10);
  szCompPrefix  VARCHAR2(2);
  location   varchar2(20);
  ncount  number:=0;
  v_intended_use varchar2 (2);
  unit_scheme   varchar2(1);
  nUnitCounts  NUMBER:=0;
  cursor c1 is
    select * from convert_products
    where convert_flag in ('A','C','P','Z','9','Q') and
    product_code not in ('QGN2','AMC7','AMC8','AMC9','APH','CAPH',
                         'HEM','HEM1','HEM2','HEM9','IWLA','LRS',
                         'PBC2','TR10','TRM','TRM1','TRM2','TRM3',
                         'TRM4','TRM5','TRM6','TRM7','TRM8','TRM9');
   
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

v_pgm_id:='510A';

dbms_output.enable(10000000);
 FOR c1_rec in c1
  loop
    begin
      cnt := cnt+1;
       if c1_rec.component_volume > 1000 then
        nVol:=c1_rec.component_volume/1000;
       Else
        nVol:=c1_rec.component_volume;
       End If;

      tot_cnt := tot_cnt +1;
      c_stmt :=10;  

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

      --Check if the unit is in the UNITS table, if not create an entry
      -- becuase this might be an IMPORTED units

      Begin
        select count(*) into nUnitCounts from units where unit_id=ltunit_id;
        If nUnitCounts = 0 then 
          insert into units (
                UNIT_ID      ,
                INSERT_DATS   ,
                AUDIT_KEY   ,
                PROGRAM_ID   ,
                COLL_DATE   ,
                CHAPTER_ID   ,
                DONOR_DECISION_CODE,
                BATCH_ID   ,
                DRIVE_ID   ,
                GROUP_SITE_ID   ,
                CONTRACT_ID   ,
                BAG_CODE   ,
                ADD_ON_BAGS   ,
                BLEED_START_TIME,
                BLEED_END_TIME    ,
                LOT_NUMBER   ,
                RECEIVED_DATE   ,
                OS_UNIT_ID,
                SYSTEM_LABEL_DECISION   ,
                QC_CHECKIN_FLAG      ,
                QC_CHECKIN_DATE      ,
                QC_LABEL_FLAG      ,
                QC_LABEL_DATE      ,
                COMPONENT_REVIEW_FLAG   ,
                LAB_DONOR_DATS       ,
                DONOR_LAB_DATS       ,
                NOTE_ID      )
         values (ltUnit_id,   ---c1_rec.unit_id      ,
                 sysdate   ,
                 audit_seq.nextval,
                'RUN51A'      ,
                trunc(c1_rec.coll_date)   ,
                'WAD'         ,
                'Y'  ,
               'CONV000000'      ,
               '888888'   ,
               'G888888'  ,
               'INTERNAL'      ,
                '99'     ,
                null         ,
                c1_rec.coll_date   ,
                c1_rec.coll_date+10/1440,
                null,  ---c1_rec.lot_no         ,
                sysdate         ,
                null,  ---szOSUnitID, 
                c_blood_type      ,
                'Y'         ,
                 c1_rec.coll_date+8/24   ,
                 'Y'         ,
                 c1_rec.coll_date+2/3   ,
                 'Y'         ,
                 sysdate         ,
                 sysdate         ,
                 null);
           End if;   
      End;

      --Get the collection date from the units table
     c_coll_date:=null;     
     Begin
        select coll_date into c_coll_date from units where 
        unit_id=ltUnit_id and rownum=1;
     Exception when others then
        c_coll_date:=c1_rec.coll_date;
     End;


      Begin
        c_stmt := 12;
        c_product_code:=null;
        c_product_type:=null;

        If ltUnit_id like 'W%' and length (ltUnit_id)> 7 then
           unit_scheme:='I';
        Else
           unit_scheme:='C';
        End If;

        select product_code,inv_product_type
              into c_product_code,c_product_type
              from valid_products
              where UPPER(ltrim(rtrim(product_short_name)))=c1_rec.product_code
              and unit_scheme_type=unit_scheme and rownum =1; 
         If ltUnit_id like 'W%' and length(ltUnit_id)> 7 then
           --find the intended use
            begin       
               select m.code_desc into v_intended_use from master_codes m,
               unit_attributes ua where ua.unit_id=ltUnit_id and
               ua.attrib_group='DON' and ua.attrib_code=m.code and
               m.code_type='IUSE';
            exception when others then 
                 v_intended_use:='V';
            end;
            c_product_code:=c_product_code||v_intended_use ||
                            nvl(c1_rec.aliquot,'00');
         End if;

    Exception
            when no_data_found then
              --c_product_code := c1_rec.product_code;
              c_err_msg :=c1_rec.product_code||
                   ' No Data in the product code table';
              raise pgm_error;
        when others then
           c_err_msg:=c1_rec.product_code||'-'||sqlerrm;
           raise pgm_error; 
    End;

      -- Get nextval for audit_seq
          c_stmt := 30;
          select audit_seq.nextval into l_audit_seq from dual;

          c_stmt := 31;
      
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

       --Check for aliquotes for codabar units
/*
   If Length(ltUnit_id) = 7 then 
        
       nAliCount:=0;     
     
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
        nAliCount:=null;
       End If;

       If nAliCount is null or nAliCount=0 then 
         szCompPrefix:=null;
       else
         szCompPrefix:=to_char(nAliCount);
       End If;

   Elsif ltUnit_id like 'W%' then 
      szCompPrefix:=null;
   End IF;
*/

   If ltUnit_id like 'W%' and length(ltUnit_id)> 7 then
       if C1_rec.aliquot is null then 
         szCompPrefix:='00';
       else
         szCompPrefix:=C1_rec.aliquot;
       end if;
  Else
      if C1_rec.aliquot is null then 
          szCompPrefix:='0';
      else
         szCompPrefix:=C1_rec.aliquot;
      end if;
  End If;
    
    szReject:=null;
    szRelabel:=null;

      If c1_rec.convert_flag='C' then 
        szReject:='CONV';
      End If;

     If c1_rec.convert_flag='D' then 
        szReject:='DEFER';
        c_product_code:='NONE';
     End If;

     If c1_rec.convert_flag='P' or c1_rec.trans_id='26' then
       szReject:='POOL';
     End If;

     If c1_rec.convert_flag ='Z' then --products under processing (blank recd)
       sld_user:=null;
       sld_date:=null;
     Else
      null;
      --sld_date:=c1_rec.label_dates;
      --sld_user:=nvl(c1_rec.label_user_id,'CONV');
     End If;  

      -- Insert data into components table

      If c1_rec.trans_id in ('061','090','062')then
         select notebook_seq.nextval into c_note_id from dual;
      End If;

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
                                REJECT_REASON_CODE,
                                RELABEL_PRODUCT_CODE,
                                POOLED_COMPONENT_ID,
                                COMPONENT_WEIGHT,
                                NOTE_ID,
                                LABEL_USER_ID,
                                LABEL_DATS, warehouse_id)
      values (              ltUnit_id,
                            trunc(c_coll_date) ,
                            'WAD',
                            szCompPrefix,
                            c_product_code,
                            '99',
                            audit_seq.nextval,
                            v_pgm_id,  ---'CONVRT',
                            nvl(c1_rec.insert_date,trunc(c_coll_date)),
                            'L',   --c_status,
                            c1_rec.expiry_date,
                            c_blood_type,
                            szReject,
                            szRelabel,
                            null,  
                            round(nVol,2), --c1_rec.component_volume,
                            c_note_id,
                            sld_user,
                            sld_date, 'L');
    Exception when others then 
           if sqlerrm like 'ORA-00001%' then
              null;
           else
              dbms_output.put_line('CI='||sqlerrm||' '||c1_rec.unit_id||' '||
              c_product_code||' Blood='||c_blood_type);
           end if;
      null;
    End;

  -- If the flag is A then move the products into the distribution
   If c1_rec.convert_flag in ('A','B','9') then 

     If c1_rec.convert_flag in ('A') then   

       szStatusInd:='AV';

       location:='LF0702000195'; 
       begin
         select count(*) into ncount from active_products where
         unit_id=ltUnit_id and product_code=c_product_code and
         coll_date=c1_rec.coll_date;
         If ncount = 0 then 
             insert into ACTIVE_PRODUCTS (unit_id, coll_date, chapter_id,
                                       product_code, aliquot, blood_type,
                                       exp_date, product_type, insert_date,
                                    appl_custody, stock_state, location_id,
                                    import_flag, inventory_class, osok_flag,
                                   program_id, warehouse_id)
              values (c1_rec.unit_id, c1_rec.coll_date, c1_rec.chapter_id,
                      c_product_code, szCompPrefix, c_blood_type, 
                      c1_rec.expiry_date, c_product_type,
                      sysdate, 'SV', 'AV', location,
                      null,'RE','Y', v_pgm_id,'L');
         End If;

       exception when others then 
          dbms_output.put_line('CI='||sqlerrm||' '||c1_rec.unit_id);
       end;
   End If;

  /*  If c1_rec.convert_flag ='9' then 
      --need translation for history
     begin
       select lt_status_code into szStatusInd from x_status_trans
       where bbc_status=c1_rec.trans_id;
     exception when no_data_found then 
        szStatusInd:='AV';
     end;

    End if;
*/


    ncount:=0;  
    select count(*) into ncount from product_history where
    unit_id=ltUnit_id and product_code=c_product_code and
    coll_date=c1_rec.coll_date;
 
   If ncount = 0 then 
     
    insert into product_history
    (
     UNIT_ID,
     COLL_DATE,
     CHAPTER_ID,
     ALIQUOT,
     PRODUCT_CODE,
     blood_type,
     STATUS_IND,
     INVENTORY_CLASS,
     LOCATION_ID,
     FROM_DATE,
     USER_ID,
     program_id
    )
    values
    (
     c1_rec.UNIT_ID,
     c1_rec.COLL_DATE,
     c1_rec.CHAPTER_ID,
     szCompPrefix,
     c_PRODUCT_CODE,
     c_blood_type,
     szStatusInd,
     'RE',
     location,
     sysdate,
     substr(user,5,6),
     v_pgm_id
    );
   End If;

 End If;

  If c1_rec.convert_flag='Q' then 
    --put the unit level interdictions

    select count(*) into nCount from unit_interdictions where
    unit_id=ltUnit_id and inter_code='CNVQ';
    if nCount = 0 then 
      insert into unit_interdictions(
        UNIT_ID       ,
        COLL_DATE     ,
        CHAPTER_ID    ,
        INTER_CODE    ,
     INSERT_DATS   ,
     INTER_USER_ID ,
     SOURCE_TEST_ID,
     AUDIT_KEY     ,
     PROGRAM_ID    )
     values (ltUnit_id,c1_rec.coll_date,'WAD','CNVQ',sysdate,'CONV',
             null,0,'510A');
   end if;
 End If;

  If c1_rec.trans_id in ('061','090','062') then
    
      insert into note_books values (c_note_id,c1_rec.trans_id_f1||' '||
                              c1_rec.trans_id_f2);
  End If;

   If c1_rec.trans_id ='060' then
      update units set os_unit_id=c1_rec.imported_from where
      unit_id=c1_rec.unit_id;
   End if;

   commit;

     ------


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
