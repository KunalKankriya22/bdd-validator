---
tags:
  - trigger
  - SBCSYS
---
# COMP_SPIKE_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENT_SPIKING|COMPONENT_SPIKING]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into component_spiking_audit
	(
		unit_id, coll_date, chapter_id,
		component_prefix, product_code, process_code, bag_id,
		insert_user_id, insert_dats,
		spiking_type, bag_lot_number,  filter_lot_number,
		bags_spiked, bags_for_components, bags_used,
		audit_key,program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.component_prefix, :old.product_code,
		:old.process_code, :old.bag_id,
		:old.insert_user_id, :old.insert_dats,
		:old.spiking_type, :old.bag_lot_number, :old.filter_lot_number,
		:old.bags_spiked, :old.bags_for_components, :old.bags_used,
		:old.audit_key,'DELETE',sysdate, lt_user_session.get_userid
	);
end;
```
