--------------------------------------------------------
--  DDL for Trigger VALID_CONT_PROD_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CONT_PROD_INSERT_UPDATE" 
before insert  or update
on valid_container_products
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
    insert into valid_container_products_audit
	(
		catalog_number,
		product_type,
		bag_code,
		face_label,
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
		:new.catalog_number,
		:new.product_type,
		:new.bag_code,
		:new.face_label,
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
ALTER TRIGGER "VALID_CONT_PROD_INSERT_UPDATE" ENABLE;
