--------------------------------------------------------
--  DDL for Trigger VPRODUCT_ATTR_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VPRODUCT_ATTR_BEFORE_DELETE" 
before delete
on "VALID_PRODUCT_ATTRIBUTES"
for each row
begin
    insert into valid_product_attributes_audit
	(
		product_type, attrib_group, attrib_code,
		life_span_ind, life_span,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user,label_flag
	)
	values
	(
		:old.product_type,:old.attrib_group,:old.attrib_code,
		:old.life_span_ind,:old.life_span,
		:old.eff_date,:old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid,:old.label_flag
	);
end;
/
ALTER TRIGGER "VPRODUCT_ATTR_BEFORE_DELETE" ENABLE;
