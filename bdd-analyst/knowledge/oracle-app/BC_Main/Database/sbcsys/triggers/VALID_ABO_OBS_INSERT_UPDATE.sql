--------------------------------------------------------
--  DDL for Trigger VALID_ABO_OBS_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_ABO_OBS_INSERT_UPDATE" 
before insert or update
on valid_abo_obs
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
	 :new.result_code, :new.a_cells,
	 :new.a1_cells, :new.b_cells, :new.ab_cells,
	 :new.d_cells, :new.dcon_cells, :new.du_cells,
	 :new.duc_cells, :new.a1_serum, :new.a2_serum,
	 :new.b_serum, :new.eff_date, :new.term_date,
	 :new.last_modified_date,:new.audit_key,
		 :new.program_id, sysdate, lt_user_session.get_userid
	 );
end;
/
ALTER TRIGGER "VALID_ABO_OBS_INSERT_UPDATE" ENABLE;
