---
tags:
  - trigger
  - SBCSYS
---
# COMP_SPIKE_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENT_SPIKING|COMPONENT_SPIKING]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	comp_aud	  component_spiking_audit%rowtype;
begin
    comp_aud.audit_key := :old.audit_key;
    comp_aud.program_id := :new.program_id;
    --
    if nvl(:old.bag_id,'*') !=
       nvl(:new.bag_id,'*')
    then
       comp_aud.bag_id := nvl(:new.bag_id,'*');
    end if;
    if nvl(:old.spiking_type,'*') !=
       nvl(:new.spiking_type,'*')
    then
       comp_aud.spiking_type := nvl(:new.spiking_type,'*');
    end if;
    if nvl(:old.bag_lot_number,'*') !=
       nvl(:new.bag_lot_number,'*')
    then
       comp_aud.bag_lot_number := nvl(:new.bag_lot_number,'*');
    end if;
    if nvl(:old.filter_lot_number,'*') !=
       nvl(:new.filter_lot_number,'*')
    then
       comp_aud.filter_lot_number := nvl(:new.filter_lot_number,'*');
    end if;
    if nvl(:old.bags_spiked,-1) !=
       nvl(:new.bags_spiked,-1)
    then
       comp_aud.bags_spiked := nvl(:new.bags_spiked,-1);
    end if;
    if nvl(:old.bags_for_components,-1) !=
       nvl(:new.bags_for_components,-1)
    then
       comp_aud.bags_for_components := nvl(:new.bags_for_components,-1);
    end if;
    if nvl(:old.bags_used,-1) !=
       nvl(:new.bags_used,-1)
    then
       comp_aud.bags_used := nvl(:new.bags_used,-1);
    end if;
    --
	insert into component_spiking_audit
	(
		unit_id, coll_date, chapter_id,
		component_prefix, product_code,
		process_code, bag_id,
		insert_user_id, insert_dats,
		spiking_type, bag_lot_number,  filter_lot_number,
		bags_spiked, bags_for_components, bags_used,
		audit_key,program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		comp_aud.unit_id, comp_aud.coll_date, comp_aud.chapter_id,
		comp_aud.component_prefix, comp_aud.product_code,
		comp_aud.process_code, comp_aud.bag_id,
		comp_aud.insert_user_id, comp_aud.insert_dats,
		comp_aud.spiking_type, comp_aud.bag_lot_number,
		comp_aud.filter_lot_number, comp_aud.bags_spiked,
		comp_aud.bags_for_components, comp_aud.bags_used,
		comp_aud.audit_key,comp_aud.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
