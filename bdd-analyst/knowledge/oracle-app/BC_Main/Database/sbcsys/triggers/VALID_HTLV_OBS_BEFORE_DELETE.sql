--------------------------------------------------------
--  DDL for Trigger VALID_HTLV_OBS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_HTLV_OBS_BEFORE_DELETE" 
before delete
on valid_htlv_wb_obs
for each row
begin
    insert into valid_htlv_wb_obs_audit
	(
		result_code, p21, p19,
		p24, p26, p28, p32, p38,
		p42, gp46, p53, p_other,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.result_code, :old.p21, :old.p19,
		:old.p24, :old.p26, :old.p28, :old.p32, :old.p38,
		:old.p42, :old.gp46, :old.p53, :old.p_other,
		:old.eff_date, :old.term_date,
		:old.last_modified_date,:old.audit_key,
		'DELETE' , sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_HTLV_OBS_BEFORE_DELETE" ENABLE;
