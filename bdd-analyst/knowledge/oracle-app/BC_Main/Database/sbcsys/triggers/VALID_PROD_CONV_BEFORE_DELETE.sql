--------------------------------------------------------
--  DDL for Trigger VALID_PROD_CONV_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PROD_CONV_BEFORE_DELETE" 
before delete
on valid_product_conv
for each row
begin
    insert into valid_product_conv_audit
	(
		source_product_code,target_product_code,
		eff_date,term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.source_product_code,:old.target_product_code,
		:old.eff_date,:old.term_date, :old.last_modified_date,
		:old.audit_key, 'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_PROD_CONV_BEFORE_DELETE" ENABLE;
