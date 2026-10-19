--------------------------------------------------------
--  DDL for Trigger VALID_CENTR_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CENTR_BEFORE_DELETE" 
before delete
on valid_centrifuges
for each row
begin
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
		:old.centrifuge_id,:old.chapter_id,
		:old.manufacturer,:old.commissioned_date,
		:old.last_calibration_date, :old.eff_date,
		:old.term_date,:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "VALID_CENTR_BEFORE_DELETE" ENABLE;
