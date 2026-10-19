---
tags:
  - trigger
  - SBCSYS
---
# UNIT_ADDONBAGS_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_ADD_ON_BAGS|UNIT_ADD_ON_BAGS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    --
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
		:new.sdc_ws_number, :new.unit_id, :new.coll_date, :new.chapter_id,
		:new.item_ind, :new.lot_number, :new.number_of_items,
		:new.wafer_lot_number, :new.sterile_machine,
		:new.weld_flag, :new.component_prefix,
		:new.product_code, :new.number_of_bags, :new.bags_used,
		:new.segment_rem_flag, :new.segment_number,
		:new.insert_dats, :new.insert_user_id, :new.note_id,
		:new.audit_key,:new.program_id,sysdate, lt_user_session.get_userid
	);
end;
```
