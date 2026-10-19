--------------------------------------------------------
--  DDL for Trigger VALID_PROD_TYPES_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PROD_TYPES_INSERT_UPDATE" 
before insert  or update
on valid_product_types
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
    insert into valid_product_types_audit
	(
		product_type_code,
		product_type_desc,
		product_group_identifier,
		product_group_name,
		abo_only,
		eff_date,
		term_date,
		last_modified_date,
		audit_key,
		program_id,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:new.product_type_code,
		:new.product_type_desc,
		:new.product_group_identifier,
		:new.product_group_name,
		:new.abo_only,
		:new.eff_date,
		:new.term_date,
		:new.last_modified_date,
		:new.audit_key,
		:new.program_id,
		sysdate,
		lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_PROD_TYPES_INSERT_UPDATE" ENABLE;
