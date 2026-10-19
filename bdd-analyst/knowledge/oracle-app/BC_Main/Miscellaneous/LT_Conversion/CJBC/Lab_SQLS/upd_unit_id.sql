DECLARE
   t_drive_id   varchar2(10);
   t_location_id   varchar2(10);
   t_coll_date   date;
   t_count      number;
   t_rej        number;
   Unit_ctr NUMBER:=0;
   ltUnit_id  varchar2(15);
   nUnit  number:=0;
   nCount   number:=0; 
   cursor unit_cur is select unit_id,lot_no from convert_units;
---
BEGIN
   dbms_output.enable(1000000);
  select max(new_unit) into Unit_ctr from mw_unit_trans;

  FOR currec in unit_cur Loop

   -- Insert data into unit translation table
     ltUnit_id:=currec.unit_id;
    If Length(ltUnit_id)!=7 and Length(ltUnit_id)!=13 then
        select count(*) into nCount from mw_unit_trans where
        old_unit=currec.unit_id;
        If nCount = 0 then 
            Unit_ctr:=Unit_ctr+1;
            ltUnit_id:=to_Char(unit_ctr);
            insert into mw_unit_trans values (currec.unit_id,ltUnit_id,'LAB');
       End If;

    Elsif Length(ltUnit_id) = 7 then
      if  LTrim(ltUnit_id,'0123456789') is not null then
         select nvl(count(*),0) into nUnit from bar_code_prefixes where
         EYE_READ_TRNS=substr(ltUnit_id,1,2);

         if nUnit =0 then
             nCount:=0;
             select count(*) into nCount from mw_unit_trans where
             old_unit=currec.unit_id;
            if nCount = 0 then 
              unit_ctr:=unit_ctr+1;
              ltUnit_id:=to_char(unit_ctr);
              insert into mw_unit_trans values (currec.unit_id,ltUnit_id,'LAB');
            end if;
         end if;
      end if;
    Elsif Length(ltUnit_id) = 13 then 
       if ltUnit_id like 'W%' then 
         null;
       else
         select count(*) into nCount from mw_unit_trans where
         old_unit=currec.unit_id;
         if nCount = 0 then 
            unit_ctr:=unit_ctr+1;
            ltUnit_id:=to_char(unit_ctr);
            insert into mw_unit_trans values (currec.unit_id,ltUnit_id,'LAB');
         end if;
       end if;
    End If;

   commit;
  END LOOP;
END;
/
