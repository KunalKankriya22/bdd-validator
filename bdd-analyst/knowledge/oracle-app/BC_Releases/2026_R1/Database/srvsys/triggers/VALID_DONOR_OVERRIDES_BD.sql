--------------------------------------------------------
--  DDL for Trigger VALID_DONOR_OVERRIDES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_DONOR_OVERRIDES_BD" 
before delete
on valid_donor_overrides
for each row
begin
    insert into valid_donor_overrides_audit
	(
		product_type,
		donor_decision_code,
		attrib_group,
		attrib_code,
		inter_code,
		inter_type,
		override_desc,
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
		:old.attrib_group,
		:old.attrib_code,
		:old.inter_code,
		:old.inter_type,
		:old.override_desc,
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
ALTER TRIGGER "VALID_DONOR_OVERRIDES_BD" ENABLE;
