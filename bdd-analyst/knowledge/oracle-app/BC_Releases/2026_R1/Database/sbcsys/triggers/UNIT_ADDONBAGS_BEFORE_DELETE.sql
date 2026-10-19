--------------------------------------------------------
--  DDL for Trigger UNIT_ADDONBAGS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UNIT_ADDONBAGS_BEFORE_DELETE" 
before delete
on unit_add_on_bags
for each row
begin
    insert into unit_add_on_bags_audit
	(
		sdc_ws_number, unit_id, coll_date, chapter_id,
		item_ind, lot_number, number_of_items,
		wafer_lot_number, sterile_machine,
		weld_flag, component_prefix,
		product_code, number_of_bags, bags_used,
		segment_rem_flag, segment_number,
		insert_dats, insert_user_id, note_id,
		audit_key, program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.sdc_ws_number, :old.unit_id, :old.coll_date, :old.chapter_id,
		:old.item_ind, :old.lot_number, :old.number_of_items,
		:old.wafer_lot_number, :old.sterile_machine,
		:old.weld_flag, :old.component_prefix,
		:old.product_code, :old.number_of_bags, :old.bags_used,
		:old.segment_rem_flag, :old.segment_number,
		:old.insert_dats, :old.insert_user_id, :old.note_id,
		:old.audit_key,'DELETE', sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "UNIT_ADDONBAGS_BEFORE_DELETE" ENABLE;
