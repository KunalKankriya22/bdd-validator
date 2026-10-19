declare
  t_warehouse_id              components.warehouse_id%type;
  t_component_status          components.component_status%type;
  t_chapter_id                components.chapter_id%type;
  t_label_user_id             components.label_user_id%type;
  t_label_dats                components.label_dats%type;
  t_system_label_decision     components.system_label_decision%type;
  t_bag_id                    components.bag_id%type;
  t_contract_id               contracts.contract_id%type;
  t_coll_date                 components.coll_date%type;  
  t_program_error_count       number;
  t_cur_counter               number := 0;
  t_checkin_user_id           batch_inputs.checkin_user_id%type;
  t_batch_id                  batch_inputs.batch_id%type;
  t_number_of_units           batch_inputs.number_of_units%type;
  t_carton_count              batch_inputs.carton_count%type;
  t_airway_bill_no            batch_inputs.airway_bill_no%type;
  t_shipped_date              batch_inputs.shipped_date%type;
  t_received_date             batch_inputs.received_date%type;
  t_min_temp                  batch_inputs.min_temp%type;
  t_max_temp                  batch_inputs.max_temp%type;
  t_insert_dats               batch_inputs.insert_dats%type;
  t_carton_number             cartons.carton_number%type;
  t_chk_digit                 varchar2(2);
  t_inter_code                valid_interdictions.inter_code%type;
  t_s_min_temp                valid_products.min_rcv_temp%type;
  t_s_max_temp                valid_products.max_rcv_temp%type;
  t_aborh_exists              varchar2(1);
  t_profile_exists            varchar2(1);
  t_aborh                     valid_abo_values.tested_abo_code%type;
  t_aborh_desc                varchar2(50);
  t_prev_product_type         convert_products.product_type%type;
  t_product_code              valid_products.product_code%type;
  t_product_type              valid_products.product_type%type;
  t_temp_product_type         valid_products.product_type%type;
  t_batch_count               number := 0;
  t_component_count           number := 0;
  t_comp_inter_count          number := 0;
  t_units_count               number := 0;

  g_code_scheme               varchar2(1);
  g_warehouse                 components.warehouse_id%type;

  temp_v_ddc                  varchar2(1) := null;
  temp_c_dummy                varchar2(1);
  temp_contr_id               varchar2(10);
  temp_date                   date;
  temp_test_seq_no            number;
  nCount                      number := 0;
  temp_coll_date              date;
  temp_unit_chapter_id        varchar2(10);
  temp_errors_exceeded        varchar2(1);

  rollback_and_exit           exception;


  cursor c_initial is
  select * from convert_products_temp1
   where inv_status in ('BBAA', 'BBAF')
     and convert_flag in ('', 'A', 'Q', 'B');  

  cursor c_cp_pt is
  select product_type 
    from convert_products_temp1
   where inv_status in ('BBAA', 'BBAF')
     and convert_flag in ('', 'A', 'Q', 'B')
   group by product_type;

  cursor c_cp (p_product_type in varchar2) is
  select * from convert_products_temp1
   where product_type = p_product_type
     and inv_status in ('BBAA', 'BBAF')
     and convert_flag in ('', 'A', 'Q', 'B');

  cursor c1 (p_unit_id in varchar2,
             p_coll_date in date,
             p_chapter_id in varchar2) is
  select test_id, test_seq_no,
         test_state, test_mode,
         result_status_1, result_status_2,
         tb_id, test_chapter_id, tb_seq_no,
         well_number, absorbance, ratio, result_dats,
         result_user_id, testing_lab_code, cancel_flag
    from unit_test_base
   where unit_id = p_unit_id 
     and trunc(coll_date) = trunc(p_coll_date) 
     and chapter_id = p_chapter_id 
     and tb_id is not null 
     and result_status_1 is not null 
     and result_status_2 is null 
     and cancel_flag is null
   order by test_id, test_seq_no;

  cursor c3 (p_unit_id in varchar2,
             p_coll_date in date,
             p_chapter_id in varchar2) is
  select test_id, test_seq_no, insert_Dats,
         insert_user_id, program_id
    from unit_test_base
   where unit_id = p_unit_id 
     and trunc(coll_date) = trunc(p_coll_date) 
     and chapter_id = p_chapter_id 
     and tb_id is null
   order by test_id, test_seq_no;


  procedure insert_program_errors (p_statement_id in varchar2,
                                   p_error_msg in varchar2) is
  begin
    insert into temp_program_errors
      (module_id, statement_id,
       item_id, error_msg,
       insert_user, insert_date, program_id)
    values
      ('IMPORT SCRIPT', p_statement_id,
       null, p_error_msg,
       'SBCSYS', sysdate, 'IMPORT SCRIPT');
  end;

  procedure calc_colldate_from_expdate (inp_expdate in date,
                                        inp_prod_code in varchar2,
                                        inp_code_scheme in varchar2,
                                        inp_chapter_id in varchar2,
                                        out_coll_date out date) is
  
    temp_v_unit_scheme_type  varchar2(1);
    temp_v_chapter           varchar2(4); 
  begin
    temp_v_unit_scheme_type := inp_code_scheme;
    temp_v_chapter := inp_chapter_id;

    select decode(life_span_ind, 'D', inp_expdate - life_span,
                  'Y', add_months(inp_expdate, -1 * life_span * 12),
                  'H', inp_expdate - (life_span/24), inp_expdate)
      into out_coll_date
      from valid_products
     where product_code = substr(inp_prod_code, 1, 5)  --Only base prdcd comparison        
       and unit_scheme_type = temp_v_unit_scheme_type
       and sysdate between eff_date and nvl(term_date,sysdate);
  exception
    when others then
      insert_program_errors ('10', 'Some poblem in Coll_date calculation');
  end;

  procedure validate_unit_chkdigit (p_unit_id in Varchar2,
			            p_chk_digit out Varchar2) is
    temp_v_len	        number := 0;
    temp_v_chr	        varchar2(1);
    temp_n_A		number := 0;
    temp_n_check_value  number:= 0;
    temp_n_Si		number:= 0;
    temp_v_unit_id      varchar2(15) := p_unit_id;  
  begin
    temp_v_len := nvl(length(p_unit_id), 0);

    for i in 1 .. temp_v_len loop
      temp_v_chr := substr(temp_v_unit_id, i, 1);
      if (ltrim(temp_v_chr, '0987654321') is null) then
        temp_n_A := ascii(temp_v_chr) - 48;
      elsif (temp_v_chr = '*') then
        temp_n_A := 36;
      else
        temp_n_A := ascii(temp_v_chr) - 55;
      end if;

      temp_n_Si := mod(((temp_n_Si+temp_n_A) * 2), 37);
    end loop;

    temp_n_check_value := mod((38 - temp_n_Si), 37);

    -- based on the check_value get the decoded value from the
    p_chk_digit := substr('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ*',
                          temp_n_check_value + 1, 1);
    p_chk_digit := '-' || p_chk_digit;
  end;

  procedure insert_unit_interdictions (p_unit_id in varchar2,
                                       p_coll_date in date,
                                       p_chapter_id in varchar2,
                                       p_inter_code in varchar2) is
  begin
    insert into unit_interdictions
      (unit_id, coll_date, chapter_id, 
       inter_code, insert_dats, inter_user_id, 
       audit_key, program_id ) 
    values 
      (p_unit_id, p_coll_date, p_chapter_id,
       p_inter_code, sysdate, 'SBCSYS',
       audit_seq.nextval, 'IMPORT SCRIPT');
			
  exception
    when others then
      insert_program_errors('11', 'Error in inserting into Unit Interdictions');
  end;

  procedure insert_ua (p_unit_id in varchar2,
                       p_coll_date in date,
                       p_chapter_id in varchar2,
                       p_code_scheme in varchar2) is
  begin
    insert into unit_attributes
      (unit_id, coll_date, chapter_id,
       attrib_group, attrib_code, status_flag,
       stop_label_flag, insert_dats, insert_user_id,
       program_id)
    select p_unit_id, p_coll_date, p_chapter_id,
           attrib_group, attrib_code, status_flag,
           stop_label_flag, sysdate, 'SBCSYS',
           'IMPORT SCRIPT'
      from valid_attributes
     where attrib_group = 'DON'
       and attrib_code = '00'
       and unit_scheme_type = p_code_scheme 
       and sysdate between eff_date and nvl(term_date, sysdate + 10);
  exception
    when dup_val_on_index then
      null;
    when others then
      insert_program_errors('12', 'Error in unit_attributes insert... Contact I.S...');
  end;

  procedure update_component_attributes (p_unit_id in varchar2,
                                         p_coll_date in date,
                                         p_chapter_id in varchar2,
                                         p_prod_code in varchar2,
                                         p_user_id in varchar2,
                                         p_program_id in varchar2) is
    temp_v_attr            varchar(3);
    temp_v_attr_grp        varchar2(1);
    temp_v_formula         varchar2(80); 

    cursor c0 is 
    select attrib_group, attrib_code
      from valid_product_cclass_attr_isbt
     where product_code	= substr(p_prod_code, 1, 5);

    cursor c10 is 
    select a.attrib_code 
      from component_attributes a, valid_attributes b
     where unit_id = p_unit_id
       and product_code	= p_prod_code
       and a.attrib_code = b.attrib_code
       and b.attrib_type != 'A'
       and b.unit_scheme_type =	'I'
       and sysdate between b.eff_date AND nvl(b.term_date, sysdate + 10);
  begin
    if g_code_scheme = 'C' then
      return;
    end if;

    begin
      select product_formula
        into temp_v_formula
        from valid_products
       where product_code = substr(p_prod_code, 1, 5)
         and unit_scheme_type = 'I'
         and sysdate between eff_date AND nvl(term_date, sysdate + 10);
    exception
      when others then
	insert_program_errors('13', 'Error in SQL that retrieves Product Formula');
    end;

    for cc in c0 loop
      temp_v_formula :=	rpad(cc.attrib_code, 3, ' ') || temp_v_formula;
    end loop;

    for ca IN c10 loop
      if instr(temp_v_formula, ca.attrib_code) = 0 then
        delete from component_attributes 
         where unit_id = p_unit_id
           and product_code = p_prod_code
           and attrib_code = ca.attrib_code;
      end if;
    end loop;

    loop
      temp_v_attr := rtrim(substr(temp_v_formula, 1, 3));

      if substr(temp_v_attr, 1, 1) != '@' then
        begin
          select attrib_group 
            into temp_v_attr_grp
            from valid_attributes
           where attrib_code = temp_v_attr
             and unit_scheme_type = 'I'
             and sysdate between eff_date AND nvl(term_date, sysdate + 10);
        exception
          when others then
            insert_program_errors('14', 'Error in SQL that retrieves Attribute Group');
        end;

        insert into component_attributes
           (unit_id, coll_date, chapter_id,
            product_code, attrib_group, attrib_code,
            insert_dats, insert_user_id, audit_key,
            program_id)
        select p_unit_id, p_coll_date, p_chapter_id,
               p_prod_code, temp_v_attr_grp, temp_v_attr,
               sysdate, p_user_id, audit_seq.NEXTVAL,
               p_program_id
          from dual
         where not exists
               (select 'x' 
                  from component_attributes
                 where unit_id = p_unit_id
                   and coll_date = p_coll_date
                   and chapter_id = p_chapter_id
                   and product_code = p_prod_code
                   and attrib_group = temp_v_attr_grp
                   and attrib_code = temp_v_attr);
      end if;

      temp_v_formula := substr(temp_v_formula, 4);
      exit when temp_v_formula is null;
    end loop;
  exception
    when others then
      insert_program_errors('15', 'Error in update_component_attributes procedure');
  end;

  procedure srvdon_check (p_unit_id in varchar2,
                          p_coll_date in date,
                          p_chapter_id in varchar2,
                          p_product_code in varchar2,
                          p_aliquot in varchar2,
                          p_global_chapter_id in varchar2) is
    ret_val         varchar2(5); 
    v_msg           varchar2(200);
    nExists         number := 0;
    srvdon_excpt    exception;
  begin
    begin
      ret_val := srvdon.donor_acceptable(p_unit_id,
                                         p_coll_date,
                                         p_chapter_id,
                                         p_product_code,
                                         p_aliquot,
                                         FALSE);
                
      /* -- Commented by Kishore on 01/08/2013
      if ret_val = 'FALSE' then
        v_msg := 'Donor Not Acceptable-placing CHAP inter';
      elsif ret_val = 'NOREG' then
        v_msg:='Donation Not Registered -placing CHAP inter';
      elsif ret_val = 'NODON' then
        v_msg:='Donor Not Attacged -placing CHAP inter';
      elsif ret_val = 'HOLD' then
        v_msg:='Hold Interdiction-placing CHAP inter';
      elsif ret_val = 'QUAR' then
        v_msg:='Quarantine Product -placing CHAP inter';
      elsif ret_val = 'UNKN' then
        v_msg:='Unknown Hold Flag-placing CHAP inter';
      elsif ret_val = 'RTNDF' then
        v_msg:='Donor has not returned -placing CHAP inter';
      elsif ret_val = 'INTST' then
        v_msg:='Incomplete Testing -placing CHAP inter';
      elsif ret_val = 'DHOLD' then
        v_msg:='Donor on Hold -placing CHAP inter';
      else
        raise srvdon_excpt;
      end if;
     
      select nvl(count(*), 0) 
        into nExists 
        from component_interdictions 
       where unit_id = p_unit_id
         and inter_code = 'CHAP'
         and product_code = p_product_code
         and chapter_id = p_global_chapter_id;
      -- End of commented section */
             
      --if nExists = 0 then -- Commented by Kishore on 01/08/2013
      if ret_val in ('FALSE', 'NOREG', 'NODON', 'HOLD', 'QUAR',
                     'UNKN', 'RTNDF', 'INTST', 'DHOLD') then -- Added by Kishore on 01/08/2013
        --insert_program_errors('16', 'Error: ' || v_msg);

        begin  	
          insert into component_interdictions 
            (unit_id, coll_date, chapter_id, 
             product_code, inter_code, insert_dats,
             inter_user_id, audit_key, program_id)
          values 
            (p_unit_id, p_coll_date, p_global_chapter_id,
             p_product_code, 'SRDON', sysdate,
             'SBCSYS', 0, 'IMPORT SCRIPT');
        exception
          when others then
            insert_program_errors('17', 'Error while inserting into COMPONENT_INTERDICTIONS table');
        end;  
      end If;     
    exception
      when srvdon_excpt then 
        null;
      when others then
        insert_program_errors('18', 'Error in SRVDON_CHECK procedure');   
    end;  	
  end;

begin
  /* *********************************************************************************
  Name              : IMPORT.sql
  Created By        : Kishore Gummadi
  Date Of Creation  : 08/01/12
  Purpose           : This script will import multiple units.

  Version History
  
  Date         Version        Description
  ---------------------------------------------------------------------------------
  08/01/2012   01             Initial development - Kishore

  *********************************************************************************   */

  begin
    delete from program_errors
     where module_id = 'IMPORT SCRIPT'
       and insert_user = 'SBCSYS';

    delete from temp_program_errors;

    commit;
  end;

  /*begin
    create table temp_program_errors as
    select * from program_errors;
  end; */

  -- Hardcoded values
  temp_errors_exceeded := 'N';
  g_warehouse := 'A';
  t_warehouse_id := g_warehouse;
  t_component_status := 'L';
  t_chapter_id := 'WAD';
  t_label_user_id := 'SBCSYS';
  t_contract_id := 'WADIM0048';
  t_received_date := sysdate;
  t_batch_id := null;
  t_number_of_units := 0;
  t_carton_count := 1;
  t_airway_bill_no := '736152';
  t_shipped_date := to_date('08-05-2012', 'MM-DD-YYYY');
  t_min_temp := 2;
  t_max_temp := 8;
  t_insert_dats := sysdate;
  t_carton_number := '12';
  t_inter_code := null;
  -- End of hardcoded values

  begin
    select decode(count(*), 0, 'N', 'Y'), max(decode(test_id, 'ABORH', 'Y', 'N'))
      into t_profile_exists, t_aborh_exists
      from contract_tests
     where contract_id = t_contract_id
       and chapter_id = t_chapter_id
       and sysdate between eff_date and nvl(term_date, sysdate + 10);
  exception
    when no_data_found then
      t_profile_exists := null;
      t_aborh_exists := null;
    when others then
      insert_program_errors ('01', 'Error in validating the contract id');
  end;

  if t_aborh_exists is null then
    t_aborh_exists := 'N';
  end if;

  -- dbms_output.put_line('Start Time: ' || to_char(sysdate, 'MM-DD-YYYY HH24:MI:SS'));
  for c_initial_rec in c_initial loop
    begin
      select inv_product_type
        into t_product_type
        from valid_products
       where product_short_name = c_initial_rec.product_code
         and unit_scheme_type = decode(length(c_initial_rec.unit_id), 7, 'C', 'I')
         and rownum = 1;
    exception
      when no_data_found then
        t_product_type := null;
        insert_program_errors ('102', 'Error: Product Type not found for corresponding Product Code');
      when others then
        insert_program_errors ('103', 'Error: ' || SQLERRM);
    end;

    begin
      update convert_products_temp1
         set product_type = t_product_type
       where unit_id = c_initial_rec.unit_id
         and coll_date = c_initial_rec.coll_date
         and product_code = c_initial_rec.product_code
         and inv_status in ('BBAA', 'BBAF')
         and convert_flag in ('', 'A', 'Q', 'B');
    exception
      when others then
        insert_program_errors ('104', 'Error: ' || SQLERRM);
    end;
  end loop;

  commit;

  for c_cp_pt_rec in c_cp_pt loop
    begin
      t_cur_counter := t_cur_counter + 1;

      if t_cur_counter = 1 then
        t_prev_product_type := c_cp_pt_rec.product_type;
      end if;
  
      for c_cprec in c_cp(c_cp_pt_rec.product_type) loop
        if length(c_cprec.unit_id) = 7 then
          g_code_scheme := 'C';
        else
          g_code_scheme := 'I';
        end if;

        begin
          select product_code
            into t_product_code
            from valid_products
           where product_short_name = c_cprec.product_code
             and unit_scheme_type = g_code_scheme
             and rownum = 1;
        exception
          when no_data_found then
            insert_program_errors ('100', 'Product Short Name does not exist in the VALID_PRODUCTS table');
          when others then
            insert_program_errors ('101', 'Error: ' || SQLERRM);
        end;

        if g_code_scheme = 'I' then
          validate_unit_chkdigit (c_cprec.unit_id, t_chk_digit); -- Calculate check digit
        else
          t_chk_digit := null;
        end if;

        if g_code_scheme = 'I' then
          begin
            select nvl(count(*), 0) 
              into nCount 
              from master_codes 
             where code_type = 'SRVCK'
               and code = substr(c_cprec.unit_id, 1, 5) 
               and sysdate between eff_date and nvl(term_date, sysdate + 10);
          end;

          begin
            select coll_date, chapter_id 
              into temp_coll_date, temp_unit_chapter_id 
              from components 
             where unit_id = c_cprec.unit_id
               and rownum = 1; 
          exception
            when no_data_found then
              null;
          end;
  
          if nCount > 0 then
            if temp_coll_date is not null then 
              /* -- Not needed  	   	
 	      begin
 	        lt_check_inter_after_label(:components.unit_id,
                                           :components.coll_date,
                                           :components.product_code,
                                           :components.component_prefix);
              exception
                when others then
 	          null;
                  message('Error at lt_check_inter_after_label:'||sqlerrm);
              end;
              -- End of commented section */
 	  
              begin	
                if substr(nvl(c_cprec.unit_id, 'XXXXXXX'), 1, 5) = 'W0655' then
                  srvdon_check(c_cprec.unit_id,
                               temp_coll_date,
                               temp_unit_chapter_id,
                               t_product_code || 'V00',
                               c_cprec.aliquot,
                               t_chapter_id);
                end if;
              exception
                when others then
                  null;
              end;
            else
 	      null;      
            end If;
          end if;
        end if;

        if t_prev_product_type != c_cp_pt_rec.product_type or t_cur_counter = 1 then
          -- Insert into BATCH_INPUTS
          t_checkin_user_id := 'SBCSYS';
       
          if t_batch_id is null then
            begin
              select to_char(sysdate, 'MMDDYY') || '-IM' || to_char(batch_seq + 1)
                into t_batch_id
                from chapters 
               where chapter_id = t_chapter_id
                 and sysdate between eff_date and nvl(term_date, sysdate + 10)
                 for update of batch_seq;
            exception
              when no_data_found then
                insert_program_errors ('20', 'Invalid chapter ID');
            end;

            begin
              update chapters 
                 set batch_seq = batch_seq + 1
               where chapter_id = t_chapter_id;
            exception
              when no_data_found then
                insert_program_errors ('21', 'Invalid chapter ID');
            end;
          end if;
  
          begin
            select count(*)
              into t_number_of_units
              from convert_products_temp1
             where product_type = c_cp_pt_rec.product_type
               and chapter_id = c_cprec.chapter_id;
          end;

          begin
            select count(*)
              into t_batch_count
              from batch_inputs
             where batch_id = t_batch_id
               and chapter_id = t_chapter_id;
          exception
            when others then
              insert_program_errors ('112', 'Error: ' || SQLERRM);
          end;

          if t_batch_count = 0 then
            begin
              insert into batch_inputs
                (batch_id, chapter_id, contract_id,
                 number_of_units, product_type, carton_count,
                 airway_bill_no, shipped_date, received_date,
                min_temp, max_temp, checkin_user_id, insert_dats)
              values
                (t_batch_id, t_chapter_id, t_contract_id,
                 t_number_of_units, c_cp_pt_rec.product_type, t_carton_count,
                 t_airway_bill_no, t_shipped_date, t_received_date,
                 t_min_temp, t_max_temp, t_checkin_user_id, t_insert_dats);
            exception
              when others then
                insert_program_errors ('22', 'Error: ' || SQLERRM);
            end;
          end if;
          -- End of inserting into BATCH_INPUTS

          -- Insert into CARTONS
          t_carton_number := to_char(to_number(t_carton_number) + 1);
          begin
            insert into cartons
              (airway_bill_no,
               batch_id,
               chapter_id,
               carton_number)
            values
              (t_airway_bill_no,
               t_batch_id,
               t_chapter_id,
               t_carton_number);
          exception
            when others then
              insert_program_errors ('23', 'Error: ' || SQLERRM);
          end;
          -- End of inserting into CARTONS
        end if;

        -- Validate Product Code
        begin
          select nvl(min_rcv_temp, t_min_temp), nvl(max_rcv_temp, t_max_temp)
            into t_s_min_temp, t_s_max_temp
            from valid_products
           where product_code = substr(t_product_code, 1, 5)
             and inv_product_type = c_cp_pt_rec.product_type
             and unit_scheme_type = g_code_scheme 
             and sysdate between eff_date  and nvl(term_date, sysdate + 10);
        exception
          when no_data_found then
            insert_program_errors('24', 'No data found in SQL to validate Product Code - ' || t_product_code || ' - ' || c_cp_pt_rec.product_type);
          when others then
            insert_program_errors('24', 'Error in SQL to validate Product Code');
        end;
        -- End of validating Product Code

        -- Get Product Type for calculating the system label decision. Added by Kishore on 03/19/2013
        begin
          select product_type
            into t_temp_product_type
            from valid_products
           where product_code = substr(t_product_code, 1, 5)
             and unit_scheme_type = g_code_scheme 
             and sysdate between eff_date  and nvl(term_date, sysdate + 10);
        exception
          when no_data_found then
            t_temp_product_type := null;
          when others then
            insert_program_errors('24.1', 'Error in SQL to get Product Type');
        end;
        -- End of change made by Kishore on 03/19/2013     

        if t_min_temp between t_s_min_temp and t_s_max_temp and
           t_max_temp between t_s_min_temp and t_s_max_temp then
          null;
        else
          t_inter_code := 'CMT';
        end if;

        --t_system_label_decision := c_cprec.tested_blood_type;

        if nvl(t_temp_product_type, '*') in ('RPFF', 'RPL') then -- Added by Kishore on 03/19/2013
          t_system_label_decision := 'Mf'; -- Added by Kishore on 03/19/2013
        else -- Added by Kishore on 03/19/2013
          begin
            select decode(c_cprec.tested_blood_type, 'ABPS', '84', 'APOS', '62', 'BPOS', '73',
                                                     'OPOS', '51', 'ABNG', '28', 'ANEG', '06',
                                                     'BNEG', '17', 'ONEG', '95', 'UNK', 'NT')
              into t_system_label_decision
              from dual;
          end;
        end if; -- Added by Kishore on 03/19/2013

        t_aborh := t_system_label_decision;
 
        -- Set Inter Code
        if g_code_scheme = 'I' then
          if t_system_label_decision in ('Mx', 'Md') and t_inter_code is null then
            t_inter_code := 'INFT';
          end if;

          if t_system_label_decision = 'Mb' then
            t_inter_code := 'IBIO';
          end if;

          if t_system_label_decision = 'Mq' then
            t_inter_code := 'HOLD';
          end if;

          if t_system_label_decision in ('98', '54', '09', '65', '20', '76', '31', '87') then
            t_inter_code := 'IBIO';
          end if;
        else
          if t_system_label_decision = '47' and t_inter_code is null then
            t_inter_code := 'INFT';
          end if;

          if t_system_label_decision = '58' then
            t_inter_code := 'IBIO';
          end if;  
        end if;
        -- End of setting Inter Code

        if t_system_label_decision is not null then
          t_label_dats := sysdate;
        end if;

        if g_code_scheme = 'I' then
          t_bag_id := 'P99';
        end if;

        if t_system_label_decision in ('40', '47', '49', '58', '39', '71') and
           t_aborh_exists = 'N' and g_code_scheme != 'I' then
          t_aborh := null;
          t_aborh_desc := null;
        elsif g_code_scheme = 'I' and t_system_label_decision not like 'M%' and 
              t_aborh_exists = 'N' then
          /* -- Commented by Kishore on 0/02/2013
          begin 
            select tested_abo_code, abo_short_name 
              into t_aborh, t_aborh_desc
              from valid_abo_values
             where abo_label = t_system_label_decision
               and unit_scheme_type = 'I'
               and abo_only = 'N'
               and sysdate between eff_date and nvl(term_date, sysdate + 10);
          exception
            when no_data_found then
              t_aborh := null;
              t_aborh_desc := null;
              insert_program_errors('25', 'No data found for ABORH ' || t_system_label_decision);
            when others then
              insert_program_errors('25', 'Error in SQL for finding ABORH');
          end; 
          -- End of commented section */

          t_aborh := t_system_label_decision; -- Added by Kishore on 0/02/2013
          t_aborh_desc := null; -- Added by Kishore on 0/02/2013
        elsif g_code_scheme = 'I'  and t_system_label_decision like 'M%' and 
              t_aborh_exists = 'N' then
          t_aborh := null;
          t_aborh_desc := null;
        end if;

        calc_colldate_from_expdate(trunc(c_cprec.expiry_date), 
                                   substr(t_product_code, 1, 5),
                                   g_code_scheme,
                                   t_chapter_id,
                                   temp_date);
        t_coll_date := trunc(temp_date);

        -- Insert units
        if g_code_scheme = 'I' then
          begin
            select 'S'
              into temp_v_ddc
              from dual
             where t_system_label_decision in (select abo_label
                                                 from valid_abo_values
                                                where substr(identifier_code, 1, 1) = 'A'
                                                  and unit_scheme_type = g_code_scheme
                                                  and sysdate between eff_date and nvl(term_date, sysdate + 10));
          exception
            when no_data_found then
              temp_v_ddc := null;
            when others then
              null;
          end;
        else 
          if t_system_label_decision = '40' then
            temp_v_ddc := 'S';
          end if;
        end if;
        --
        -- Insert in UNITS only if no prior record is present
        --

        begin
          select 'x', contract_id
            into temp_c_dummy, temp_contr_id
            from units
           where unit_id = c_cprec.unit_id
             and chapter_id = t_chapter_id;
          --

          -- If unit exists then update the no of bags for the unit.   --origial comment
          -- If the contract_id is the same update the bag id otherwise update the contract_id only   :added by Ewin 06/23/08 LT 3.3.0
       
          if  temp_contr_id = t_contract_id then
            begin 
              update units 
                 set warehouse_id = g_warehouse, 
                     add_on_bags = nvl(add_on_bags, 0) + 1,
                     received_date = t_received_date
               where unit_id = c_cprec.unit_id 
                 and chapter_id = t_chapter_id;
            exception
              when others then
                insert_program_errors ('30', 'Error: ' || SQLERRM);
            end;
          else
            begin
              update units 
                 set contract_id = t_contract_id,
                     coll_date = t_coll_date,
                     batch_id = t_batch_id,
                     received_date = t_received_date
               where unit_id = c_cprec.unit_id  
                 and chapter_id = t_chapter_id;
            exception
              when others then
                insert_program_errors ('31', 'Error: ' || SQLERRM);
            end;
          end if;         
        exception
          when no_data_found then
            begin
              select count(*)
                into t_units_count
                from units
               where unit_id = c_cprec.unit_id
                 and coll_date = t_coll_date
                 and chapter_id = t_chapter_id;
            exception
              when others then
                insert_program_errors ('115', 'Error: ' || SQLERRM);
            end;

            if t_units_count = 0 then
              begin
                -- Added QC_CHECKIN_FLAG and QC_CHECKIN_DATE columns. Added by Kishore on 03/19/2013
                insert into units
                  (warehouse_id, unit_id, chk_digit,
                   coll_date, chapter_id, batch_id,
                   contract_id, insert_dats, received_date, 
                   os_unit_id, donor_decision_code, system_label_decision,
                   qc_checkin_flag, qc_checkin_date, qc_label_date, qc_label_flag, 
                   audit_key, program_id)
                values 
                  (g_warehouse, c_cprec.unit_id, substr(t_chk_digit, -1),
                   t_coll_date, t_chapter_id, t_batch_id,
                   t_contract_id, sysdate, t_received_date,
                   null, temp_v_ddc, t_system_label_decision,
                   'Y', sysdate, sysdate, 'Y', 
                   audit_seq.nextval, 'IMPORT SCRIPT');
 
                -- Check if donation is directed in case of Code 128. If so insert a unit attribute
                if g_code_scheme = 'I' then
                  begin
                    select 'x' 
                      into temp_c_dummy 
                      from dual
                     where t_system_label_decision in (select abo_label 
                                                         from valid_abo_values
                                                        where substr(identifier_code, 1, 1) = 'D'
                                                          and sysdate between eff_date and 
                                                              nvl(term_date, sysdate + 10));

                    begin       
                      insert into unit_attributes 
                        (unit_id, coll_date, chapter_id,
                         attrib_group, attrib_code, status_flag,
                         stop_label_flag, insert_dats, insert_user_id,
                         audit_key, program_id)
                      select c_cprec.unit_id, t_coll_date, t_chapter_id,
                             'DON', '07', status_flag,
                             stop_label_flag, sysdate, 'SBCSYS',
                             audit_seq.nextval, 'IMPORT SCRIPT'
                        from valid_attributes
                       where attrib_group = 'DON'
                         and attrib_code = '07'
                         and unit_scheme_type = 'I'
                         and sysdate between eff_date and nvl(term_date, sysdate + 10);
                    exception  
                      when others then
                        insert_program_errors ('32', 'Error: ' || SQLERRM);
                    end;
                  exception
                    when no_data_found then
                      null;
                    when others then
                      insert_program_errors ('33', 'Error: SQLERRM');
                  end;
                end if;    
              exception
                when others then
                  insert_program_errors('34', 'Problem in insert_units...Inform Systems');
              end;
            end if;
          when others then
            insert_program_errors ('35', 'Error: ' || SQLERRM);
        end;
        -- End of inserting units

        -- UTB to UTRS
        begin
          update unit_interdictions
             set chapter_id = t_chapter_id,
                 coll_date = t_coll_date,
                 program_id = 'IMPORT SCRIPT'
           where unit_id = c_cprec.unit_id 
             and (chapter_id is null or coll_date is null);

          if (t_system_label_decision in ('47', '58') and g_code_scheme != 'I') then
            begin
              select count(*)
                into t_comp_inter_count
                from component_interdictions
               where unit_id = c_cprec.unit_id
                 and coll_date = t_coll_date
                 and chapter_id = t_chapter_id
                 and product_code = t_product_code
                 and inter_code = t_inter_code;
            exception
              when others then
                insert_program_errors('114', 'Error: ' || SQLERRM);
            end;


            -- Insert Interdictions
            if t_comp_inter_count = 0 then
              begin
                insert into component_interdictions
                  (unit_id, coll_date, chapter_id,
                   product_code, inter_code, insert_dats,
                   inter_user_id, program_id)
                select c_cprec.unit_id, t_coll_date, t_chapter_id,
                       t_product_code || 'V00', t_inter_code, sysdate,
                       'SBCSYS', 'IMPORT SCRIPT'
                  from component_interdictions
                 where unit_id = c_cprec.unit_id
                   and coll_date = t_coll_date
                   and chapter_id = t_chapter_id
                   and product_code = t_product_code || 'V00'
                   and inter_code = t_inter_code
                having count(*) = 0;
              exception
                when others then
                  insert_program_errors('40', 'Problem in insert_interdictions...Inform Systems');
              end;
            end if;
            -- End of inserting interdictions

            insert_unit_interdictions (c_cprec.unit_id,
                                       t_coll_date,
                                       t_chapter_id,
                                       t_inter_code);
          elsif (t_system_label_decision in ('Mx', 'Md', 'Mb', 'Mq', '98', '54', '09', '65', '20', '76', '31', '87') and 
                 g_code_scheme = 'I') then
            insert_unit_interdictions (c_cprec.unit_id,
                                       t_coll_date,
                                       t_chapter_id,
                                       t_inter_code);      	
          end if;
        exception
          when OTHERS then
            insert_program_errors('41', 'Error: ' || SQLERRM);
        end;

        begin
          update utrs
             set chapter_id = t_chapter_id,
                 coll_date = t_coll_date,
                 program_id = 'IMPORT SCRIPT'
           where unit_id = c_cprec.unit_id and
                 (chapter_id is null or coll_date is null);
        exception
          when others then
            insert_program_errors('42', 'Error in updating utrs - coll_date/chapter_id is null');
        end;

        begin
          update unit_attributes
             set chapter_id = t_chapter_id,
                 coll_date = t_coll_date,
                 program_id = 'IMPORT SCRIPT'
           where unit_id = c_cprec.unit_id and
                 (chapter_id is null or coll_date is null);
        exception
          when others then
            insert_program_errors('43', 'Error: ' || SQLERRM);
        end;

        begin
          update unit_test_base
             set chapter_id = t_chapter_id,
                 coll_date = t_coll_date,
                 program_id = 'IMPORT SCRIPT'
           where unit_id = c_cprec.unit_id and
                 (chapter_id is null or coll_date is null);
        exception
          when others then
            insert_program_errors('44', 'Error: ' || SQLERRM);
        end;

        -- Insert UTRS
        begin
          if t_profile_exists = 'Y' then
            insert into utrs
              (unit_id, coll_date, chapter_id,
               test_seq_no, test_id, insert_dats,
               insert_user_id, program_id)
            select c_cprec.unit_id, t_coll_date, t_chapter_id,
                   1, ct.test_id, sysdate,
                   'SBCSYS', 'IMPORT SCRIPT'
              from utrs u,contract_tests ct
             where u.test_id is null
               and u.chapter_id = t_chapter_id
               and u.test_seq_no(+) = 1
               and u.test_id(+) = ct.test_id
               and u.unit_id(+) = c_cprec.unit_id
               and contract_id = t_contract_id
               and ct.chapter_id = t_chapter_id
               and sysdate between eff_date and nvl(term_date, sysdate + 10);
          end if;

          if t_aborh_exists = 'N' then
            insert into utrs
              (unit_id, coll_date, chapter_id,
               test_seq_no, test_id, test_mode,
               insert_dats, insert_user_id, program_id,
               result_status_1, tb_id, test_chapter_id,
               result_dats, result_user_id)
            select c_cprec.unit_id, t_coll_date, t_chapter_id,
                   1, 'ABORH', 'I',
                   sysdate, 'SBCSYS', 'IMPORT SCRIPT',
                   t_aborh, t_batch_id, t_chapter_id,
                   sysdate, 'SBCSYS'
              from dual
             where not exists (select 'x' 
                                 from utrs
                                where unit_id = c_cprec.unit_id
                                  and chapter_id = t_chapter_id
                                  and test_id = 'ABORH'
                                  and test_seq_no = 1);
          end if;
        exception
          when others then
            insert_program_errors('45', 'UTRS insert failed-'||sqlerrm);
        end;
        -- End of inserting into UTRS

        begin
          for c3_rec in c3(c_cprec.unit_id, t_coll_date, t_chapter_id) loop
            begin
              insert into utrs
                (unit_id, coll_date, chapter_id,
                 test_seq_no, test_id, insert_dats, 
                 insert_user_id, program_id)
              select c_cprec.unit_id , t_coll_date, t_chapter_id,
                     nvl(max(test_seq_no), 0) + 1, c3_rec.test_id, c3_rec.insert_dats, 
                     c3_rec.insert_user_id, c3_rec.program_id
                from utrs
               where unit_id = c_cprec.unit_id
                 and coll_date = t_coll_date
                 and chapter_id = t_chapter_id
                 and test_id = c3_rec.test_id;
            exception
              when others then
                insert_program_errors('46', 'Error: ' || SQLERRM);
            end;

            begin
              delete from unit_test_base
               where unit_id = c_cprec.unit_id
                 and coll_date = t_coll_date
                 and chapter_id = t_chapter_id 
                 and test_id = c3_rec.test_id 
                 and test_seq_no = c3_rec.test_seq_no;
            exception
              when others then
                insert_program_errors('47', 'Error in deleting from utb - 1');
            end;
          end loop;
        end;

        begin
          for c1_rec in c1(c_cprec.unit_id, t_coll_date, t_chapter_id) loop
            begin
              select min(test_seq_no)
                into temp_test_seq_no
                from utrs
               where unit_id = c_cprec.unit_id 
                 and trunc(coll_date) = trunc(t_coll_date) 
                 and chapter_id = t_chapter_id 
                 and test_id = c1_rec.test_id 
                 and result_status_1 is null 
                 and cancel_flag is null;

              if nvl(temp_test_seq_no, 0) >= 1 then
                begin
                  update utrs
                     set test_state = c1_rec.test_state,
                         test_mode = c1_rec.test_mode,
                         result_status_1 = c1_rec.result_status_1,
                         result_status_2 = c1_rec.result_status_2,
                         tb_id = c1_rec.tb_id,
                         test_chapter_id = c1_rec.test_chapter_id,
                         tb_seq_no = c1_rec.tb_seq_no,
                         well_number = c1_rec.well_number,
                         absorbance = c1_rec.absorbance,
                         ratio = c1_rec.ratio,
                         result_dats = c1_rec.result_dats,
                         result_user_id = c1_rec.result_user_id,
                         testing_lab_code = c1_rec.testing_lab_code
                   where unit_id = c_cprec.unit_id 
                     and trunc(coll_date) = trunc(t_coll_date) 
                     and chapter_id = t_chapter_id 
                     and test_id = c1_rec.test_id 
                     and test_seq_no = temp_test_seq_no 
                     and cancel_flag is null;
                exception
                  when others then
                    insert_program_errors('48', 'Error: ' || SQLERRM);
                end;
              else
                begin
                  insert into utrs
                    (unit_id, coll_date, chapter_id, test_seq_no,
                     test_id, test_state, test_mode, result_status_1,
                     result_status_2, tb_id, test_chapter_id, tb_seq_no, 
                     well_number, absorbance, ratio, result_dats, 
                     result_user_id, testing_lab_code, insert_dats, insert_user_id, 
                     cancel_flag, program_id)
                  select c_cprec.unit_id, t_coll_date, t_chapter_id, nvl(max(test_seq_no), 0) + 1,
                         c1_rec.test_id, c1_rec.test_state, c1_rec.test_mode, c1_rec.result_status_1,
                         c1_rec.result_status_2, c1_rec.tb_id, c1_rec.test_chapter_id, c1_rec.tb_seq_no,
                         c1_rec.well_number, c1_rec.absorbance, c1_rec.ratio, c1_rec.result_dats,
                         c1_rec.result_user_id, c1_rec.testing_lab_code, sysdate, 'SBCSYS',
                         c1_rec.cancel_flag, 'IMPORT SCRIPT'
                    from utrs
                   where unit_id = c_cprec.unit_id 
                     and trunc(coll_date) = trunc(t_coll_date) 
                     and chapter_id = t_chapter_id 
                     and test_id = c1_rec.test_id;
                exception
                  when others then
                    insert_program_errors('49', 'Error: ' || SQLERRM);
                end;
              end if;
            
              begin
                delete from unit_test_base
                 where unit_id = c_cprec.unit_id 
                   and trunc(coll_date) = trunc(t_coll_date) 
                   and chapter_id = t_chapter_id 
                   and test_id = c1_rec.test_id 
                   and test_seq_no = c1_rec.test_seq_no;
              exception
                when others then
                  insert_program_errors('50', 'Error in deleting from utb - 2');
              end;
            end;
          end loop;
        end;
        -- End of UTB to UTRS

        if g_code_scheme = 'I' then
          begin
            select 'x'  
              into temp_c_dummy 
              from dual
             where t_system_label_decision in (select abo_label 
                                                 from valid_abo_values
                                                where substr(identifier_code, 1, 1) = 'A'
                                                  and sysdate between eff_date and nvl(term_date, sysdate + 10));
  
            insert_ua (c_cprec.unit_id,
                       t_coll_date,
                       t_chapter_id,
                       g_code_scheme);
          exception
            when no_data_found then
              null;
            when others then
              insert_program_errors('51', 'Error: ' || SQLERRM);
          end;      
        else                                                    
          if t_system_label_decision = '40' then
            insert_ua (c_cprec.unit_id,
                       t_coll_date,
                       t_chapter_id,
                       g_code_scheme);
          end if;
        end if;

        if g_code_scheme = 'I' then
          update_component_attributes(c_cprec.unit_id, t_coll_date, t_chapter_id, 
                                      t_product_code || 'V00', 'SBCSYS', 'IMPORT SCRIPT');
        end if;

        begin
          select count(*)
            into t_component_count
            from components
           where unit_id = c_cprec.unit_id
             and coll_date = t_coll_date
             and chapter_id = t_chapter_id
             and product_code = t_product_code || 'V00';
        exception
          when others then
            insert_program_errors('113', 'Error: ' || SQLERRM);
        end;

        if t_component_count = 0 then
          begin
            insert into components
              (unit_id, product_code, warehouse_id,
               component_prefix, coll_date, chapter_id,
               insert_dats, audit_key, program_id, system_label_decision,
               expiry_date, component_status, bag_id,
               label_user_id, label_dats)
            values
              (c_cprec.unit_id, t_product_code || 'V00', t_warehouse_id,
               nvl(c_cprec.aliquot, '00'), t_coll_date, t_chapter_id,
               sysdate, audit_seq.nextval, 'IMPORT SCRIPT', t_system_label_decision,
               c_cprec.expiry_date, t_component_status, t_bag_id,
               t_label_user_id, t_label_dats);
          exception
            when others then
              insert_program_errors('111', 'Error: ' || SQLERRM);
          end;
        end if;

        begin
          select count(*)
            into t_program_error_count
            from program_errors
           where module_id = 'IMPORT SCRIPT'
             and insert_user = 'SBCSYS';
        end;

        if t_program_error_count >= 100 then
          --commit;
          raise rollback_and_exit;
        end if;
      end loop;

      t_prev_product_type := c_cp_pt_rec.product_type;
    exception
      when rollback_and_exit then
        temp_errors_exceeded := 'Y';
        exit;
    end;
  end loop;

  savepoint save_just_errors;
  
  begin
    insert into program_errors
    select * from temp_program_errors;

    --drop table temp_program_errors;
  end;

  if temp_errors_exceeded = 'Y' then
    rollback to save_just_errors;
  end if;

  commit;
end;