--------------------------------------------------------
--  DDL for Trigger VALID_ABO_OBS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ABO_OBS_BEFORE_DELETE" 
before delete
on valid_abo_obs
for each row
begin
    insert into valid_abo_obs_audit
	(
	 result_code, a_cells,
	 a1_cells, b_cells, ab_cells,
	 d_cells, dcon_cells, du_cells,
	 duc_cells, a1_serum, a2_serum,
	 b_serum, eff_date, term_date,
	 last_modified_date, audit_key,
		 program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 :old.result_code, :old.a_cells,
	 :old.a1_cells, :old.b_cells, :old.ab_cells,
	 :old.d_cells, :old.dcon_cells, :old.du_cells,
	 :old.duc_cells, :old.a1_serum, :old.a2_serum,
	 :old.b_serum, :old.eff_date, :old.term_date,
	 :old.last_modified_date,:old.audit_key,
		 'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_ABO_OBS_BEFORE_DELETE" ENABLE;
