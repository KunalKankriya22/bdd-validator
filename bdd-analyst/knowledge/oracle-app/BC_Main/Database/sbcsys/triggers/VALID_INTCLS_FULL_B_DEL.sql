--------------------------------------------------------
--  DDL for Trigger VALID_INTCLS_FULL_B_DEL
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INTCLS_FULL_B_DEL" 
before delete
on valid_interdiction_class
for each row
begin
    insert into valid_interdiction_class_audit
	(
		inter_code, inter_class,
		eff_date, term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.inter_code, :old.inter_class,
		:old.eff_date, :old.term_date, :old.last_modified_date,
		:old.audit_key, :old.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_INTCLS_FULL_B_DEL" ENABLE;
