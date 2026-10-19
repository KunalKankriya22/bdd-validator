-- ************************************************************************
-- PROGRAM      : TX_PROD_MASTER.SQL
-- PURPOSE      : This script would convert all the data of products of 
--                ACTIVE module from temporary tables into all required 
--                LifeTrak /Lab - Distribution tables.
-- ************************************************************************
DECLARE
  last_id         varchar2(15);
  l_audit_seq     number := 0;
  l_notebook_seq  number := 0; 
  cnt             number(5):=0; 
  tot_cnt         number  :=0;
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
  c_user_id       varchar2(8);
  c_dest_code     varchar2(10);
  c_consignee     varchar2(10);
  c_bag_code      varchar2(4);
  c_status        varchar2(1);
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
  c_ship_date     date;
  oCount        number:=0;
  pCount        number:=0;
  bCount        number:=0;  
  v_pgm_id      varchar2(20);
  
cursor c1 is
    select distinct ship_ticket_no from convert_products
    where ship_ticket_no is not null; -- and
    --ship_ticket_no not in (select box_id from boxes);

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
                                'TX_PRO_MAS',
                                c_stmt,
                                c_item_id,
                                c_err_msg,
                                'CONVRT',
                                sysdate);
  Exception when others then
    dbms_output.put_line(c_stmt); 
  end;


BEGIN    --Main begin
v_pgm_id:='BATCH4';
dbms_output.enable(1000000);
 FOR c1_rec in c1
  loop
    begin
      cnt := cnt+1;
      tot_cnt := tot_cnt +1;

     -- savepoint S1;
      c_stmt :=10;  

            c_stmt := 51;
        
           c_ship_ticket := nvl(c1_rec.ship_ticket_no, 'FROMCONVERT');
           c_ship_date:=to_date(substr(c1_rec.ship_ticket_no,-6),'mm-dd-rr');
          
          -- Generate order no, box_id, pick slip Id
           c_stmt := 523;
           
        c_stmt := 524;
        c_order:=c_ship_ticket; --ltrim(to_char(c_temp_seq,'099999'));
        c_stmt := 525;
        c_box:=c_ship_ticket; --ltrim(to_char(c_temp_seq,'099999'));
        c_stmt := 526;
        c_pick_slip:=c_ship_ticket;
        c_customer:=null;
        c_consignee:=null;
        c_payee:=null;
                       --nvl(to_char(c1_rec.ship_date,'Y'),'8')||
                       --'-'||ltrim(to_char(c_temp_seq,'099999'));
              begin
                 c_stmt := 522;
                 select a.customer_id, a.consignee_id,
                      nvl(b.payee_id,'WAD_PA0001') into
                        c_customer,c_consignee, c_payee
                      from consignee a,customers b where
                      b.short_name= substr(LTRIM(c1_rec.ship_ticket_no),1,
                            length(LTrim(c1_rec.ship_ticket_no)) - 6) and
                      a.customer_id=b.customer_id and
                      substr(b.customer_id,5,2)!='PA' and 
                      rownum <2;
              exception
                when no_data_found then
                      c_err_msg:='No Customer data/Consignee Data-'||
                     substr(LTRIM(c1_rec.ship_ticket_no),1,
                      length(LTrim(c1_rec.ship_ticket_no)) - 6);
                      raise pgm_error;
                when others then
                      c_err_msg := substr(sqlerrm,1,60);
                     raise pgm_error;
              end;                                    
             
          -- Check if already present in the shipments table
           
              select nvl(count(*),0) into c_ship_cnt
              from shipments where shipment_no = c_ship_ticket;
            
            IF c_ship_cnt = 0 THEN
                  
               -- Get nextval for audit_seq
                  c_stmt := 520;
                  select audit_seq.nextval into l_audit_seq from dual;

                  -- Insert into shipments table
                  c_stmt := 521;
                  insert into shipments
                  select c_ship_ticket,
                                'WAD',
                                c_consignee,
                                c_ship_date,
                                'DL',
                                'CONVRT',
                                'RE',
                                null,
                                null,
                                null,
                                'CONV',
                                null,
                                null,
                                null,
                                nvl(c_ship_date, sysdate),
                                l_audit_seq,
                                v_pgm_id
                   from dual
                        where not exists ( select 'check for duplicate'
                                            from shipments
                                            where shipment_no = c_ship_ticket
                                             and chapter_id = 'WAD');
             END IF;

           -- Check if the order is entered.
              select nvl(count(*),0) into oCount from orders
              where order_no=c_order;
                  c_stmt := 528;
                  select audit_seq.nextval into l_audit_seq from dual;

                  c_stmt := 53;
           If oCount = 0 then     
             -- insert into Orders table
                  insert into orders
                  select c_order,
                                 'WAD',
                                 'RE',
                                 c_customer,
                                 c_consignee,
                                 c_payee,
                                 'CL',
                                 'RE',
                                 nvl(c_ship_date, sysdate),
                                 'CONVRT',
                                 nvl(c_ship_date, sysdate),
                                 null,
                                 null,
                                 null,
                                 null,
                                 null,
                                 null,
                                 null,
                                 null,
                                 l_audit_seq,
                                 v_pgm_id
                        from dual
                          where not exists( select 'Check for duplicate'
                                  from orders where order_no = c_order);

             End If;
             --Check if boxes is entered already

             select nvl(count(*),0) into bCount from boxes
             where box_id=c_box;
             
             If bCount = 0 then 
                   c_stmt := 531;
                  -- Insert into boxes table
                  insert into boxes
                  select c_box,
                                 'WAD',
                                 'CA',
                                 'DL',
                                 v_pgm_id,
                                 nvl(c_ship_date, sysdate),
                                 sysdate,
                                 c_ship_ticket,
                                 null,
                                 null,
                                 null,
                                 nvl(c_ship_date, sysdate),
                                 null,
                                 null,
                                 null,
                                 null,
                                 null,
                                 'R'
                        from dual
                        where not exists ( select 'Check for Duplicate'
                                  from boxes where box_id = c_box);
          End If;


            -- Get nextval for audit_seq
                  c_stmt := 531;
                  select audit_seq.nextval into l_audit_seq from dual;
          
            --Check if pick_slip is entered
     
            select nvl(count(*),0) into pCount from pick_slips
            where pick_slip_id=c_pick_slip;


          If pCount = 0 then    
                c_stmt := 532;
                  -- Insert into pick slips table
                  insert into pick_slips
                  select c_pick_slip,
                                 'WAD',
                                 c_order,
                                 'AL',
                                 'CL',
                                 nvl(c_ship_date, sysdate),
                                 null,
                                 null,
                                 l_audit_seq,
                                 v_pgm_id
                        from dual
                     where not exists ( select 'check for duplidate'
                           from pick_slips where pick_slip_id = c_pick_slip
                           and chapter_id = 'WAD');
         End If;

      if cnt > 99 then
        commit;  -- Commit the transaction for every 100 records.
            cnt          := 0;
            c_pick_slip  :=null;
            c_ship_ticket:=null;
            c_ship_cnt   :=0;
      end if;
    exception
      when pgm_error then
           -- rollback to savepoint S1;
            insert_error;
        if c_exit_flg = 'Y' then
              exit;
        end if;

      when others then
           -- rollback to savepoint S1;
            c_err_msg := substr(sqlerrm,1,100);
            insert_error;
          if c_exit_flg = 'Y' then
              exit;
          end if;
    end;
  
  end loop;

  commit;
END;
/
