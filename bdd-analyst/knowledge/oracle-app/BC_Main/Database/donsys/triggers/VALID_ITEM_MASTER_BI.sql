--------------------------------------------------------
--  DDL for Trigger VALID_ITEM_MASTER_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_ITEM_MASTER_BI" 
 BEFORE INSERT
 ON VALID_ITEM_MASTER
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
    insert into VALID_ITEM_MASTER_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		item_code,
		item_desc,
		lot_reqd,
		avg_cost,
		enforce_exipiration,
		resource_code,
		minimum_level,
		reorder_level,
		return_flag,
		qty_on_hand,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.item_code,
		:new.item_desc,
		:new.lot_reqd,
		:new.avg_cost,
		:new.enforce_exipiration,
		:new.resource_code,
		:new.minimum_level,
		:new.reorder_level,
		:new.return_flag,
		:new.qty_on_hand,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_ITEM_MASTER_BI" ENABLE;
