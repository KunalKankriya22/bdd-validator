--------------------------------------------------------
--  DDL for Trigger FR_PROD_PROC_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "FR_PROD_PROC_BEFORE_DELETE" 
before delete
on "FR_VPRODUCT_PROCESSES"
for each row
begin
    insert into fr_vproduct_processes_audit
	(
		process_code, product_code,
		eff_date, term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 	 :old.process_code,:old.product_code,
		 :old.eff_date,:old.term_date,:old.last_modified_date,
		 :old.audit_key, 'DELETE',sysdate, lt_user_session.get_userid
	 );
end;
/
ALTER TRIGGER "FR_PROD_PROC_BEFORE_DELETE" ENABLE;
