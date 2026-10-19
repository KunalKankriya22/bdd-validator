--------------------------------------------------------
--  DDL for Trigger NAME_MATCH_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."NAME_MATCH_BD" 
 BEFORE DELETE
 ON NAME_MATCH
 FOR EACH ROW
BEGIN
    insert into NAME_MATCH_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		nick_name,
		first_name,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.nick_name,
		:old.first_name,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."NAME_MATCH_BD" ENABLE;
