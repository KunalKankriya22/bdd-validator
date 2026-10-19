--------------------------------------------------------
--  DDL for Trigger VALID_HIV_OBS_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_HIV_OBS_INSERT_UPDATE" 
before insert or update
on valid_hiv_wb_obs
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
    insert into valid_hiv_wb_obs_audit
	(
		result_code, p17, p24,
		p31, gp41, p51, p55, p66,
		p120, p160, eff_date, term_date,
		last_modified_date, audit_key,
		program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.result_code, :new.p17, :new.p24,
		:new.p31, :new.gp41, :new.p51, :new.p55, :new.p66,
		:new.p120, :new.p160, :new.eff_date, :new.term_date,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_HIV_OBS_INSERT_UPDATE" ENABLE;
