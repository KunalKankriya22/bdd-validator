--------------------------------------------------------
--  DDL for Trigger VALID_FF_VALUES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_FF_VALUES_BD" 
 BEFORE DELETE
 ON VALID_FF_VALUES
 FOR EACH ROW
BEGIN
    insert into VALID_FF_VALUES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		chapter_id,
		coll_id,
		source_type,
		source_code,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.chapter_id,
		:old.coll_id,
		:old.source_type,
		:old.source_code,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "VALID_FF_VALUES_BD" ENABLE;
