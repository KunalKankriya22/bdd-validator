--------------------------------------------------------
--  DDL for Trigger VALID_RESOURCES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_RESOURCES_BU" 
 BEFORE UPDATE
 ON VALID_RESOURCES
 FOR EACH ROW
BEGIN
	insert into VALID_RESOURCES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		resource_code,
		resource_type,
		resource_desc,
		critical_ind,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.resource_code,
		:new.resource_type,
		:new.resource_desc,
		:new.critical_ind,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_RESOURCES_BU" ENABLE;
