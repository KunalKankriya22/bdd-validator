--------------------------------------------------------
--  DDL for Trigger FR_RARITY_MATDET_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "FR_RARITY_MATDET_BEFORE_DELETE" 
before delete
on fr_vrarity_matrix_det
for each row
begin
    insert into fr_vrarity_matrix_det_audit
	(
		matrix_id, test_id, test_result,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.matrix_id,:old.test_id, :old.test_result,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
/
ALTER TRIGGER "FR_RARITY_MATDET_BEFORE_DELETE" ENABLE;
