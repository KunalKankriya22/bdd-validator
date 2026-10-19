--------------------------------------------------------
--  DDL for Trigger VPRODUCTCODEATTR_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VPRODUCTCODEATTR_BEFORE_DELETE" 
before delete
on "VALID_PRODUCT_CODE_ATTR"
for each row
begin
    insert into valid_product_code_attr_audit
	(
		attrib_group,attrib_code,product_code,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.attrib_group,:old.attrib_code,:old.product_code,
		:old.eff_date,:old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VPRODUCTCODEATTR_BEFORE_DELETE" ENABLE;
