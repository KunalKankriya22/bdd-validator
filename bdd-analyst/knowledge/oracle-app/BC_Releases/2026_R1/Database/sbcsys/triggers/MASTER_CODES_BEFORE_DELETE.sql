--------------------------------------------------------
--  DDL for Trigger MASTER_CODES_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "MASTER_CODES_BEFORE_DELETE" 
before delete
on master_codes
for each row
begin
    insert into master_codes_audit
	(
		code_type, code, code_desc,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 :old.code_type,:old.code,:old.code_desc,
		 :old.eff_date,:old.term_date,:old.last_modified_date,:old.audit_key,
		 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
/
ALTER TRIGGER "MASTER_CODES_BEFORE_DELETE" ENABLE;
