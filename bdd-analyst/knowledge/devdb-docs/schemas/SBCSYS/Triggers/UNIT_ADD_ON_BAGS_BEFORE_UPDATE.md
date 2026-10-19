---
tags:
  - trigger
  - SBCSYS
---
# UNIT_ADD_ON_BAGS_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_ADD_ON_BAGS|UNIT_ADD_ON_BAGS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	aud_rec 	  unit_add_on_bags_audit%rowtype;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
    --
	if nvl(:old.item_ind,'*') !=
       nvl(:new.item_ind,'*')
    then
       aud_rec.item_ind := nvl(:new.item_ind,'*');
    end if;
    if nvl(:old.lot_number,'*') !=
       nvl(:new.lot_number,'*')
    then
       aud_rec.lot_number := nvl(:new.lot_number,'*');
    end if;
    if nvl(:old.number_of_items,-1) !=
       nvl(:new.number_of_items,-1)
    then
       aud_rec.number_of_items := nvl(:new.number_of_items,-1);
    end if;
    if nvl(:old.wafer_lot_number,'*') !=
       nvl(:new.wafer_lot_number,'*')
    then
       aud_rec.wafer_lot_number := nvl(:new.wafer_lot_number,'*');
    end if;
    if nvl(:old.sterile_machine,'*') !=
       nvl(:new.sterile_machine,'*')
    then
       aud_rec.sterile_machine := nvl(:new.sterile_machine,'*');
    end if;
    if nvl(:old.weld_flag,'*') !=
       nvl(:new.weld_flag,'*')
    then
       aud_rec.weld_flag := nvl(:new.weld_flag,'*');
    end if;
    /*if nvl(:old.component_prefix,-1) !=
       nvl(:new.component_prefix,-1)
    then
       aud_rec.component_prefix := nvl(:new.component_prefix,-1);
    end if;*/ --HCLC Code128
    aud_rec.component_prefix := :new.component_prefix;
    if nvl(:old.product_code,'*') !=
       nvl(:new.product_code,'*')
    then
       aud_rec.product_code := nvl(:new.product_code,'*');
    end if;
    if nvl(:old.number_of_bags,-1) !=
       nvl(:new.number_of_bags,-1)
    then
       aud_rec.number_of_bags := nvl(:new.number_of_bags,-1);
    end if;
    if nvl(:old.bags_used,-1) !=
       nvl(:new.bags_used,-1)
    then
       aud_rec.bags_used := nvl(:new.bags_used,-1);
    end if;
    if nvl(:old.segment_number,'*') !=
       nvl(:new.segment_number,'*')
    then
       aud_rec.segment_number := nvl(:new.segment_number,'*');
    end if;
    if nvl(:old.segment_rem_flag,'*') !=
       nvl(:new.segment_rem_flag,'*')
    then
       aud_rec.segment_rem_flag := nvl(:new.segment_rem_flag,'*');
    end if;
    --
	insert into unit_add_on_bags_audit
	(
		sdc_ws_number, unit_id,
		coll_date, chapter_id,
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
		aud_rec.sdc_ws_number, aud_rec.unit_id,
		aud_rec.coll_date, aud_rec.chapter_id,
		aud_rec.item_ind, aud_rec.lot_number, aud_rec.number_of_items,
		aud_rec.wafer_lot_number, aud_rec.sterile_machine,
		aud_rec.weld_flag, aud_rec.component_prefix,
		aud_rec.product_code, aud_rec.number_of_bags, aud_rec.bags_used,
		aud_rec.segment_rem_flag, aud_rec.segment_number,
		aud_rec.insert_dats, aud_rec.insert_user_id, aud_rec.note_id,
		aud_rec.audit_key,aud_rec.program_id,sysdate, lt_user_session.get_userid
	);
end;
```
