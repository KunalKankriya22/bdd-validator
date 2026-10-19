--------------------------------------------------------
--  DDL for Trigger FR_PROC_STAGES_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "FR_PROC_STAGES_BEFORE_DELETE" 
before delete
on fr_vprocess_stages
for each row
begin
    insert into fr_vprocess_stages_audit
	(
		process_code, stage_code,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.process_code,:old.stage_code,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
/
ALTER TRIGGER "FR_PROC_STAGES_BEFORE_DELETE" ENABLE;
