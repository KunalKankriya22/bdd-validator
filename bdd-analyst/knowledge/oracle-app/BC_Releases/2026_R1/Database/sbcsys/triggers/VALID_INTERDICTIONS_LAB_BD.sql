--------------------------------------------------------
--  DDL for Trigger VALID_INTERDICTIONS_LAB_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INTERDICTIONS_LAB_BD" 
before delete
on "VALID_INTERDICTIONS_LAB"
for each row
begin
    insert into valid_interdictions_LAB_audit
	(
		inter_code, inter_type, inter_desc,
		system_inter_code, system_inter_flag, eff_date,
		term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.inter_code,:old.inter_type,:old.inter_desc,
		:old.system_inter_code,:old.system_inter_flag, :old.eff_date,
		:old.term_date,:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_INTERDICTIONS_LAB_BD" ENABLE;
