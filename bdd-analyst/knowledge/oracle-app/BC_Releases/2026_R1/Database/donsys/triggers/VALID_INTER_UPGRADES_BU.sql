--------------------------------------------------------
--  DDL for Trigger VALID_INTER_UPGRADES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_INTER_UPGRADES_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.source_inter,
		:new.exist_inter,
		:new.action_inter,
		:new.action,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_INTER_UPGRADES_BU" ENABLE;
