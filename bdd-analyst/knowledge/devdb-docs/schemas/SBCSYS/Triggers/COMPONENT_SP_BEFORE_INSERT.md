---
tags:
  - trigger
  - SBCSYS
---
# COMPONENT_SP_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENT_SP|COMPONENT_SP]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
	temp_attrib_code  varchar2(5);
	temp_x		  varchar2(1);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    --
    dbms_output.put_line('1');
    insert into component_sp_audit
	(
		unit_id, coll_date, chapter_id,
		component_prefix, product_code,
		process_code, insert_user_id,
		note_id, patient_id, link_unit_id, insert_dats,
		audit_key,program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.component_prefix, :new.product_code,
		:new.process_code, :new.insert_user_id,
		:new.note_id, :new.patient_id, :new.link_unit_id,
		:new.insert_dats,
		:new.audit_key,:new.program_id,sysdate, lt_user_session.get_userid
	);
    dbms_output.put_line('2');
    if :new.process_code in ('THAW','WASH','PLT')
    then
       --
       if :new.process_code = 'THAW'
       then
	  temp_attrib_code := 'THAW';
       end if;
       if :new.process_code = 'WASH'
       then
	  temp_attrib_code := 'SW';
       end if;
       if :new.process_code = 'PLT'
       then
	  temp_attrib_code := 'LRS';
       end if;
       --
       begin
	   --
	   -- here, check for whether THAW changes the product's expiration
	   -- date has been removed. This is because, for eg., 04210 will
	   -- not have its expiration date change for a THAW attrbiute. Only
	   -- when the product is converted to 06200 will its expiration date
	   -- change. This makes is mandatory for all the source product
	   -- codes for THAWING and WASHING to have a THAW or WASH alert
	   -- attribute but without any expiration date change.
	   --
	   select 'x' into temp_x
	   from   valid_product_attributes
	   where  product_type = (select product_type
				 from	 valid_products
				 where	 product_code = :new.product_code and
					sysdate between eff_date and
						nvl(term_date,sysdate)) and
		  attrib_group = 'SP' and
		  attrib_code = temp_attrib_code and
		  sysdate between eff_date and nvl(term_date,sysdate);
	   begin
	       insert into component_attributes
	       (unit_id, coll_date, chapter_id, product_code, attrib_group,
		attrib_code, insert_dats, insert_user_id, audit_key,
		program_id, proc_date)
	       select :new.unit_id, :new.coll_date, :new.chapter_id,
		      :new.product_code, 'SP', temp_attrib_code,
		      sysdate, lt_user_session.get_userid, '', :new.program_id,
		      :new.insert_dats
	       from   dual
	       where  0 = (select count(*)
			   from   component_attributes
			   where  unit_id = :new.unit_id and
				  coll_date = :new.coll_date and
				  product_code = :new.product_code and
				  chapter_id = :new.chapter_id and
				  attrib_group = 'SP' and
				  attrib_code = temp_attrib_code);
	       exception
		   when NO_DATA_FOUND
		   then
		      null;
	   end;
	   exception
	       when NO_DATA_FOUND
	       then
		  null;
       end;
    end if;
	dbms_output.put_line('3');
end;
```
