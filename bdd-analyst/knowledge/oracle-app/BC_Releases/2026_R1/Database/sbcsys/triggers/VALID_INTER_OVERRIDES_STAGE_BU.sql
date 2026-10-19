--------------------------------------------------------
--  DDL for Trigger VALID_INTER_OVERRIDES_STAGE_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INTER_OVERRIDES_STAGE_BU" 
before update
on valid_inter_overrides_stage
for each row
begin
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
    insert into valid_inter_over_stage_audit
	(
		product_type,
		donor_decision_code,
		inter_code,
		inter_type,
		eff_date,
		term_date,
		last_modified_date,
		move_date,
		program_id,
		audit_key,
		audit_insert_user,
		audit_insert_dats
	)
	values
	(
		:new.product_type,
		:new.donor_decision_code,
		:new.inter_code,
		:new.inter_type,
		:new.eff_date,
		:new.term_date,
		:new.last_modified_date,
		:new.move_date,
		:new.program_id,
		:new.audit_key,
		lt_user_session.get_userid,
		sysdate
	);
end;
/
ALTER TRIGGER "VALID_INTER_OVERRIDES_STAGE_BU" ENABLE;
