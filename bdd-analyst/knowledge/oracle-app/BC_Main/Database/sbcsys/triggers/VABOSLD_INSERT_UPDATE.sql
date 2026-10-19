--------------------------------------------------------
--  DDL for Trigger VABOSLD_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VABOSLD_INSERT_UPDATE" 
before insert  or update
on valid_abo_pooled_sld
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
    insert into valid_abo_pooled_sld_audit
	(
		apos, aneg, bpos, bneg,
		abpos, abneg, opos, oneg,
		pool_sld, eff_date, term_date,
		unit_scheme_type, rh_label_flag,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.apos,:new.aneg,:new.bpos, :new.bneg,
		:new.abpos, :new.abneg, :new.opos, :new.oneg,
		:new.pool_sld,:new.eff_date,:new.term_date,
		:new.unit_scheme_type, :new.rh_label_flag,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VABOSLD_INSERT_UPDATE" ENABLE;
