--------------------------------------------------------
--  DDL for Trigger VALID_ELIG_CELL_LOSS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_ELIG_CELL_LOSS_BD" 
 BEFORE DELETE
 ON VALID_ELIG_CELL_LOSS
 FOR EACH ROW
BEGIN
    insert into valid_elig_cell_loss_audit
	(
		chapter_id,
		cell_type,
		maximum_loss,
		days_between,
		eff_date,
		term_date,
		insert_user,
		insert_date,
		program_id,
		audit_key,
		audit_insert_dats
	)
	values
	(
		:old.chapter_id,
		:old.cell_type,
		:old.maximum_loss,
		:old.days_between,
		:old.eff_date,
		:old.term_date,
		:old.insert_user,
		:old.insert_date,
		'DELETE',
		:old.audit_key,
		sysdate
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_ELIG_CELL_LOSS_BD" ENABLE;
