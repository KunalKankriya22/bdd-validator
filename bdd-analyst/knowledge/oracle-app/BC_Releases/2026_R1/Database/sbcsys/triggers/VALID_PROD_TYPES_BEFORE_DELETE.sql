--------------------------------------------------------
--  DDL for Trigger VALID_PROD_TYPES_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PROD_TYPES_BEFORE_DELETE" 
before delete
on valid_product_types
for each row
begin
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
		:old.product_type_code,
		:old.product_type_desc,
		:old.product_group_identifier,
		:old.product_group_name,
		:old.abo_only,
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
ALTER TRIGGER "VALID_PROD_TYPES_BEFORE_DELETE" ENABLE;
