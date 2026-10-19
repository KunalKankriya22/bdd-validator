--------------------------------------------------------
--  DDL for Trigger VATTRIB_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VATTRIB_BEFORE_DELETE" 
before delete
on valid_attributes
for each row
begin
    insert into valid_attributes_audit
	(
		attrib_group, attrib_code, attrib_desc, price,
		stop_label_flag, status_flag, assign_after_label_flag,
		show_on_label_flag,inter_code, credit_flag, eff_date,
		term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user,
		attrib_custom,normal_stock_flag,service_code,
		attrib_label, attrib_abbrev, attrib_position,
		unit_scheme_type, attrib_type, exclusivity_flag,
		EQ_CODE128_ATTRIB_GROUP,EQ_CODE128_ATTRIB_CODE,DELETE_ALLOWED
	)
	values
	(
		:old.attrib_group,:old.attrib_code,:old.attrib_desc,:old.price,
		:old.stop_label_flag,:old.status_flag,
 		:old.assign_after_label_flag, :old.show_on_label_flag,
		:old.inter_code, :old.credit_flag, :old.eff_date,
		:old.term_date,:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate , lt_user_session.get_userid,
		:old.attrib_custom,:old.normal_stock_flag,:old.service_code,
		:old.attrib_label, :old.attrib_abbrev, :old.attrib_position,
		:old.unit_scheme_type, :old.attrib_type, :old.exclusivity_flag,
		:old.EQ_CODE128_ATTRIB_GROUP, :old.EQ_CODE128_ATTRIB_CODE, :old.DELETE_ALLOWED
		);
end;



/
ALTER TRIGGER "VATTRIB_BEFORE_DELETE" ENABLE;
