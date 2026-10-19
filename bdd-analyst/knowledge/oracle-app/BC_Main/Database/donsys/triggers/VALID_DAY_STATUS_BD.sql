--------------------------------------------------------
--  DDL for Trigger VALID_DAY_STATUS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_DAY_STATUS_BD" 
 BEFORE DELETE
 ON VALID_DAY_STATUS
 FOR EACH ROW
BEGIN
    insert into VALID_DAY_STATUS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		status,
		chapter_id,
		resource_code,
		lower_limit,
		upper_limit,
		color_code,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.status,
		:old.chapter_id,
		:old.resource_code,
		:old.lower_limit,
		:old.upper_limit,
		:old.color_code,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_DAY_STATUS_BD" ENABLE;
