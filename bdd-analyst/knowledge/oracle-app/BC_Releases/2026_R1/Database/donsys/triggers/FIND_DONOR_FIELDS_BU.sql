--------------------------------------------------------
--  DDL for Trigger FIND_DONOR_FIELDS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."FIND_DONOR_FIELDS_BU" 
 BEFORE UPDATE
 ON FIND_DONOR_FIELDS
 FOR EACH ROW
BEGIN
	insert into FIND_DONOR_FIELDS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		program_name,
		field_name,
		no_of_entries,
		required,
		protected_entry,
		function_check,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.program_name,
		:new.field_name,
		:new.no_of_entries,
		:new.required,
		:new.protected_entry,
		:new.function_check,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."FIND_DONOR_FIELDS_BU" ENABLE;
