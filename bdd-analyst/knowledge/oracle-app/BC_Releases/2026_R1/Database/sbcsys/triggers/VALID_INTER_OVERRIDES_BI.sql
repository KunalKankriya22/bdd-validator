--------------------------------------------------------
--  DDL for Trigger VALID_INTER_OVERRIDES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_INTER_OVERRIDES_BI" 
before insert
on valid_inter_overrides
for each row
declare
	temp_audit_key	  number(23);
begin
--    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
--    :new.audit_key := temp_audit_key;
--    Audit key to be copied from staging data to facilitate link between tables
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
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
		:new.product_type,
		:new.donor_decision_code,
		:new.inter_code,
		:new.inter_type,
		:new.eff_date,
		:new.term_date,
		:new.last_modified_date,
		:new.program_id,
		:new.audit_key,
		lt_user_session.get_userid,
		sysdate
	);
end;
/
ALTER TRIGGER "VALID_INTER_OVERRIDES_BI" ENABLE;
