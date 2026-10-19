--------------------------------------------------------
--  DDL for Trigger VALID_HIV_OBS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_HIV_OBS_BEFORE_DELETE" 
before delete
on valid_hiv_wb_obs
for each row
begin
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
		:old.result_code, :old.p17, :old.p24,
		:old.p31, :old.gp41, :old.p51, :old.p55, :old.p66,
		:old.p120, :old.p160, :old.eff_date, :old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE' ,sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_HIV_OBS_BEFORE_DELETE" ENABLE;
