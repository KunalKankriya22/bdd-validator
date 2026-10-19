--------------------------------------------------------
--  DDL for Trigger CUE_CODES_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CUE_CODES_INSERT_UPDATE" 
before insert  or update
on donor_decision_codes
for each row
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
    insert into donor_decision_codes_audit
	(
		donor_decision_code,bar_code_value,
		eff_date,term_date,last_modified_date,
		audit_key,program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.donor_decision_code,:new.bar_code_value,
		:new.eff_date,:new.term_date,:new.last_modified_date,
		:new.audit_key,:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "CUE_CODES_INSERT_UPDATE" ENABLE;
