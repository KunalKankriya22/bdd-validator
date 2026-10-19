--------------------------------------------------------
--  DDL for Trigger VALID_CENTR_INSERT_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CENTR_INSERT_UPDATE" 
before insert  or update
on valid_centrifuges
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
    insert into valid_centrifuges_audit
	(
		centrifuge_id,chapter_id,
		manufacturer,commissioned_date,
		last_calibration_date, eff_date,
		term_date,last_modified_date,audit_key,
		program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.centrifuge_id,:new.chapter_id,
		:new.manufacturer,:new.commissioned_date,
		:new.last_calibration_date, :new.eff_date,
		:new.term_date,:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_CENTR_INSERT_UPDATE" ENABLE;
