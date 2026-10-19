---
tags:
  - trigger
  - SRVSYS
---
# AP_BD

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/ACTIVE_PRODUCTS|ACTIVE_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
   if nvl(substr(:old.location_id,9),'0000') != '0000'
   then
      srvlib.update_inventory_levels
	   (:old.product_type,
	    :old.blood_type,
	    :old.chapter_id,
	    'STANDARD',
	    :old.inventory_class,
	    :old.unit_id,
	    :old.coll_date,
	    'D');
    end if;
    if :old.stock_state in ('AV', 'OD')
       and nvl(substr(:old.location_id,9),'0000') != '0000'
    then
       srvlib.update_trays (:old.location_id,
			    :old.chapter_id,
			    :old.product_type,
			    :old.blood_type,
			    'D');
    end if;
end;
```
