--------------------------------------------------------
--  DDL for Trigger VALID_DAY_STATUS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_DAY_STATUS_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.status,
		:new.chapter_id,
		:new.resource_code,
		:new.lower_limit,
		:new.upper_limit,
		:new.color_code,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_DAY_STATUS_BU" ENABLE;
