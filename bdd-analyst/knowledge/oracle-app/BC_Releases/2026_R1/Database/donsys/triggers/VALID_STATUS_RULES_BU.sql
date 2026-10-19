--------------------------------------------------------
--  DDL for Trigger VALID_STATUS_RULES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_STATUS_RULES_BU" 
 BEFORE UPDATE
 ON VALID_STATUS_RULES
 FOR EACH ROW
BEGIN
	insert into VALID_STATUS_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		staff_status,
		van_status,
		coach_status,
		overall_status,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.staff_status,
		:new.van_status,
		:new.coach_status,
		:new.overall_status,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_STATUS_RULES_BU" ENABLE;
