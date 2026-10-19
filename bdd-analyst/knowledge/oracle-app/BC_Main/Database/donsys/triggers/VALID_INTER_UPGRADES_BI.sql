--------------------------------------------------------
--  DDL for Trigger VALID_INTER_UPGRADES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_INTER_UPGRADES_BI" 
 BEFORE INSERT
 ON VALID_INTER_UPGRADES
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
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
		:new.insert_user,
		:new.source_inter,
		:new.exist_inter,
		:new.action_inter,
		:new.action,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_INTER_UPGRADES_BI" ENABLE;
