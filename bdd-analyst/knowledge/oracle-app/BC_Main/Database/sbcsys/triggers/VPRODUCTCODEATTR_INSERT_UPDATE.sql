--------------------------------------------------------
--  DDL for Trigger VPRODUCTCODEATTR_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VPRODUCTCODEATTR_INSERT_UPDATE" 
before insert  or update
on "VALID_PRODUCT_CODE_ATTR"
for each row
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
    insert into valid_product_code_attr_audit
	(
		attrib_group, attrib_code,product_code,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.attrib_group, :new.attrib_code,:new.product_code,
		:new.eff_date,:new.term_date,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VPRODUCTCODEATTR_INSERT_UPDATE" ENABLE;
