--------------------------------------------------------
--  DDL for Trigger VALID_CHECKOUT_ITEMS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_CHECKOUT_ITEMS_BU" 
 BEFORE UPDATE
 ON VALID_CHECKOUT_ITEMS
 FOR EACH ROW
BEGIN
	insert into VALID_CHECKOUT_ITEMS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		donation_type,
		chapter_id,
		item_id,
		description,
		sort_sequence,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.donation_type,
		:new.chapter_id,
		:new.item_id,
		:new.description,
		:new.sort_sequence,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_CHECKOUT_ITEMS_BU" ENABLE;
