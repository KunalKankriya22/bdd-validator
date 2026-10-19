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
    select unit_id, coll_Date, chapter_id, 
      attrib_group, attrib_code, attrib_date
      from convert_unit_attributes
---     where unit_id > last_id
     order by unit_id;

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
         values( 'ACTIVECONV',
            'TX_UNIT_ATTRIBUTES',
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

      savepoint S1;

      c_stmt :=9;
---
---   verify that unit exists in units;
---
     c_exist_flag := null;
      BEGIN
         SELECT 'Y'
           INTO c_exist_flag
           FROM units
          WHERE units.unit_id = c1_rec.unit_id
            AND units.coll_date = c1_rec.coll_date
            AND units.chapter_id = c1_rec.chapter_id;
      EXCEPTION
         WHEN no_data_found THEN
            c_err_msg := 'Unit does not exist';
            raise pgm_error;
         WHEN others THEN
       c_err_msg := substr(sqlerrm,1,60);
       raise pgm_error;
      END;
      c_stmt :=10;
      -- Translate the values to get equivalent LifeTrak values
      begin
        select life_attrib_group, life_attrib_code, status_flag, stop_label_flag
       into c_attrib_group, c_attrib_code, c_status_flag, c_stop_label
     from x_attributes
         where ltrim(rtrim(oldsys_attrib_group))=c1_rec.attrib_group
           AND ltrim(rtrim(oldsys_attrib_code))=c1_rec.attrib_code;
      exception
       when no_data_found then
         c_err_msg := substr(sqlerrm,1,60);
         raise pgm_error;
      end;     
---
---   verify that unit attribute does not already exist.
---
     c_stmt :=8;
     c_exist_flag := null;
      BEGIN
         SELECT 'Y'
           INTO c_exist_flag
           FROM unit_attributes
          WHERE unit_attributes.unit_id = c1_rec.unit_id
            AND unit_attributes.coll_date = c1_rec.coll_date
            AND unit_attributes.chapter_id = c1_rec.chapter_id
            AND unit_attributes.attrib_group = rtrim(ltrim(c_attrib_group))
            AND unit_attributes.attrib_code = rtrim(ltrim(c_attrib_code));
      EXCEPTION
         WHEN no_data_found THEN
            null;
         WHEN others THEN
       c_err_msg := substr(sqlerrm,1,60);
       raise pgm_error;
      END;
      IF (c_exist_flag = 'Y') THEN
          c_err_msg := 'Attribute already exists on unit';
          raise pgm_error;
      END IF;
      -- Get nextval for audit_seq
     c_stmt := 19;
     select audit_seq.nextval into l_audit_seq from dual;

      -- Insert data into unit_attributes table
      c_stmt := 20;
      insert into unit_attributes 
         (UNIT_ID, COLL_DATE, CHAPTER_ID   ,
          attrib_group, attrib_code, source_test_id,
          status_flag, stop_label_flag, insert_dats,
          insert_user_id, audit_key, program_id)
     values
         (c1_rec.unit_id ,
          trunc(c1_rec.coll_date),
          'WAD',
          c_attrib_group,
          c_attrib_code,
          null,
          c_status_flag,
          c_stop_label,
          sysdate,
          'CONVRT',
          l_audit_seq,
          'CONVRT');

      if cnt > 99 then
        commit;  -- Commit the transaction for every record.
       cnt := 0;
      end if;

    exception
      when pgm_error then
       rollback to savepoint S1;
        c_item_id := c1_rec.unit_id;
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
