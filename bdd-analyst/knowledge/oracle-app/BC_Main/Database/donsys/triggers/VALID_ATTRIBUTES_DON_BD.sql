--------------------------------------------------------
--  DDL for Trigger VALID_ATTRIBUTES_DON_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_ATTRIBUTES_DON_BD" 
 BEFORE DELETE
 ON VALID_ATTRIBUTES_DON
 FOR EACH ROW
BEGIN
    insert into VALID_ATTRIBUTES_DON_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		attrib_code,
		attrib_table,
		required,
		attrib_group,
		attrib_desc,
		sort_sequence,
		valid_code_type,
		default_value,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.attrib_code,
		:old.attrib_table,
		:old.required,
		:old.attrib_group,
		:old.attrib_desc,
		:old.sort_sequence,
		:old.valid_code_type,
		:old.default_value,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_ATTRIBUTES_DON_BD" ENABLE;
