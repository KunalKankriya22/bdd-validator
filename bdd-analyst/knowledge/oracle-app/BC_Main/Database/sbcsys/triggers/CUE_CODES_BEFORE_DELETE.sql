--------------------------------------------------------
--  DDL for Trigger CUE_CODES_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CUE_CODES_BEFORE_DELETE" 
before delete
on donor_decision_codes
for each row
begin
    insert into donor_decision_codes_audit
	(
		donor_decision_code,bar_code_value,
		eff_date,term_date,last_modified_date,
		audit_key,program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.donor_decision_code,:old.bar_code_value,
		:old.eff_date,:old.term_date,:old.last_modified_date,
		:old.audit_key,'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "CUE_CODES_BEFORE_DELETE" ENABLE;
