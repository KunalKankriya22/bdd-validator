--------------------------------------------------------
--  DDL for Trigger FR_ANTG_GROUPS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "FR_ANTG_GROUPS_BEFORE_DELETE" 
before delete
on fr_vantigen_groups
for each row
begin
    insert into fr_vantigen_groups_audit
	(
		antigen_group, test_id, test_result,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.antigen_group,:old.test_id,:old.test_result,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
/
ALTER TRIGGER "FR_ANTG_GROUPS_BEFORE_DELETE" ENABLE;
