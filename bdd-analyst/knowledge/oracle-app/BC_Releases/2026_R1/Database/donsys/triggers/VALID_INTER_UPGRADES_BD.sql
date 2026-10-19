--------------------------------------------------------
--  DDL for Trigger VALID_INTER_UPGRADES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_INTER_UPGRADES_BD" 
 BEFORE DELETE
 ON VALID_INTER_UPGRADES
 FOR EACH ROW
BEGIN
    insert into VALID_INTER_UPGRADES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		source_inter,
		exist_inter,
		action_inter,
		action,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.source_inter,
		:old.exist_inter,
		:old.action_inter,
		:old.action,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_INTER_UPGRADES_BD" ENABLE;
