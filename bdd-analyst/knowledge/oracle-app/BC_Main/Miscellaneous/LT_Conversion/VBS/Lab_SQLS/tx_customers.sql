/* **************************************************************************
 PROGRAM   : TX_CUSTOMERS.SQL
 PURPOSE   : This script would convert all the data from convert_custoemrs
             to the CUSTOMERS table

 ************************************************************************** */
 
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

  procedure insert_error is
  begin
    c_error_cnt := c_error_cnt +1;
    if c_error_cnt>400 then
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
         values( 'CUSTOMERS',
            'TX_CUSTOMER',
            c_stmt,
            c_item_id,
            c_err_msg,
            'CONVRT',
            sysdate);
  end;
  
  cursor c1 is
    select * from convert_customers  
           
BEGIN
           
  For c1_rec in c1 loop
   Begin
      cnt := cnt+1;
      tot_cnt := tot_cnt +1;

       If c1_rec.customer_id is null the 
         c_err_msg := 'Customer ID is null';
         raise program_error;
       End If;
                                 
       If c1_rec.customer_type is null the 
         c_err_msg := 'Customer Type is null';
         raise program_error;
       End If;
       
       If c1_rec.name is null the 
         c_err_msg := 'Customer name is null';
         raise program_error;
       End If;
                                        
        If c1_rec.short_name is null the 
         c_err_msg := 'Customer short name is null';
         raise program_error;
       End If;
      
      If c1_rec.city is null or c1_rec.city is null or c1_rec.zip is null then
         c_err_msg := 'City/State/Zip is null';
         raise program_error;
       End If;
      
                                        
     c_stmt := 19;
     select audit_seq.nextval into l_audit_seq from dual;

      -- Insert data into unit_attributes table
      c_stmt := 20;
      
      insert into CUSTOMERS (CUSTOMER_ID,CHAPTER_ID,ALPHA_KEY,
                             CUSTOMER_TYPE,NAME,SHORT_NAME,
                             ADDRESS_1,ADDRESS_2,ADDRESS_3,
                             CITY,STATE,COUNTRY,ZIP,
                             PHONE_NO,PHONE_EXT,FAX_NO,
                             TELEX_NO,PAYEE_ID,COD_FLAG,
                             RETURN_ACCEPTED_FLAG,AR_ACCOUNT,CP6_DEST,
                             FI_PRICE_SCH_NO,EFF_DATE,TERM_DATE,
                             LAST_MODIFIED_DATE,AUDIT_KEY,PROGRAM_ID,
                             PRICE_CHANGE_FLAG,EDN_GEN_FLAG,PH_APPR_FLAG,
                             INS_APPR_FLAG )                            
       values
         (c1_rec.customer_id,c1_rec.chapter_id,null,
          c1_rec.customer_type,c1_rec.name,c1_rec.short_name,
          c1_rec.address_1,c1_rec.address_2,c1_rec.address_3,
          c1_rec.city,c1_rec.state,'USA',c1_rec.zip,
          c1_rec.phone_no,c1_rec.phone_ext,c1_rec.fax_no,
          null,c1_rec.payee_id,c1_rec.cod_flag,
          c1_return_accept,c1_rec.ar_account,null,
          null,sysdate,null,
          sysdate,audit_seq.nextval,'CONV',
          null,null,null,
          null);
          
      if cnt > 99 then
        commit;  -- Commit the transaction for every record.
       cnt := 0;
      end if;

    exception
      when pgm_error then
       rollback to savepoint S1;
        c_item_id := c1_rec.customer_id;
       insert_error;
        if c_exit_flg = 'Y' then
         exit;
        end if;

      when others then
       rollback to savepoint S1;
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
