--------------------------------------------------------
--  DDL for Trigger VALID_INTER_OVERRIDES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INTER_OVERRIDES_BD" 
before delete
on valid_inter_overrides
for each row
begin
    insert into valid_inter_overrides_audit
	(
		product_type,
		donor_decision_code,
		inter_code,
		inter_type,
		eff_date,
		term_date,
		last_modified_date,
		program_id,
		audit_key,
		audit_insert_user,
		audit_insert_dats
	)
	values
	(
		:old.product_type,
		:old.donor_decision_code,
		:old.inter_code,
		:old.inter_type,
		:old.eff_date,
		:old.term_date,
		:old.last_modified_date,
		'DELETE',
		:old.audit_key,
		lt_user_session.get_userid,
		sysdate
	);
end;
/
ALTER TRIGGER "VALID_INTER_OVERRIDES_BD" ENABLE;
