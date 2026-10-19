---
tags:
  - trigger
  - SBCSYS
---
# COMP_SPIKE_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENT_SPIKING|COMPONENT_SPIKING]]
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
    insert into component_spiking_audit
	(
		unit_id, coll_date, chapter_id,
		component_prefix, product_code,  process_code, bag_id,
		insert_user_id, insert_dats,
		spiking_type, bag_lot_number,  filter_lot_number,
		bags_spiked, bags_for_components, bags_used,
		audit_key,program_id,audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.component_prefix, :new.product_code,
		:new.process_code, :new.bag_id,
		:new.insert_user_id, :new.insert_dats,
		:new.spiking_type, :new.bag_lot_number, :new.filter_lot_number,
		:new.bags_spiked, :new.bags_for_components, :new.bags_used,
		:new.audit_key,:new.program_id,sysdate, lt_user_session.get_userid
	);
end;
```
