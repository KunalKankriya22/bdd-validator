--------------------------------------------------------
--  DDL for Trigger RESOURCE_EXCEPTIONS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."RESOURCE_EXCEPTIONS_BU" 
 BEFORE UPDATE
 ON RESOURCE_EXCEPTIONS
 FOR EACH ROW
BEGIN
	insert into RESOURCE_EXCEPTIONS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		resource_code,
		chapter_id,
		drive_date,
		available_number,
		reason_code,
		comments
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.resource_code,
		:new.chapter_id,
		:new.drive_date,
		:new.available_number,
		:new.reason_code,
		:new.comments
	);
end;
/
ALTER TRIGGER "DONSYS"."RESOURCE_EXCEPTIONS_BU" ENABLE;
