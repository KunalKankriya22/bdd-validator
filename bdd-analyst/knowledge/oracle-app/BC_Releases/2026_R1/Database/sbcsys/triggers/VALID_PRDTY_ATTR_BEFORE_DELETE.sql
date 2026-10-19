--------------------------------------------------------
--  DDL for Trigger VALID_PRDTY_ATTR_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PRDTY_ATTR_BEFORE_DELETE" 
before delete
on "VALID_PRODUCT_TYPE_ATTRIBUTES"
for each row
begin
	insert into valid_prod_type_attrib_audit
	(
		product_type,
		attrib_group,
		attrib_code,
		anticoagulant_code,
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
		:old.product_type,
		:old.attrib_group,
		:old.attrib_code,
		:old.anticoagulant_code,
		:old.eff_date,
		:old.term_date,
		:old.last_modified_date,
		:old.audit_key,
		'DELETE',
		sysdate,
		lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_PRDTY_ATTR_BEFORE_DELETE" ENABLE;
