--------------------------------------------------------
--  DDL for Trigger VALID_ACL_CODES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_ACL_CODES_BD" 
 BEFORE DELETE
 ON VALID_ACL_CODES
 FOR EACH ROW
BEGIN
    insert into VALID_ACL_CODES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		access_class,
		access_code_type,
		access_code_value,
		chapter_id,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.access_class,
		:old.access_code_type,
		:old.access_code_value,
		:old.chapter_id,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_ACL_CODES_BD" ENABLE;
