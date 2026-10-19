--------------------------------------------------------
--  DDL for Trigger VALIQUOT_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALIQUOT_BEFORE_DELETE" 
before delete
on valid_aliquots
for each row
begin
    insert into valid_aliquots_audit
	(
		old_product_code, new_product_code,
		aliquot, seq_no,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.old_product_code,:old.new_product_code,
		:old.aliquot,:old.seq_no,
		:old.eff_date,:old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALIQUOT_BEFORE_DELETE" ENABLE;
