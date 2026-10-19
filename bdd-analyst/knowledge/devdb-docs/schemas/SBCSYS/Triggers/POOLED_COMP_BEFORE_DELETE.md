---
tags:
  - trigger
  - SBCSYS
---
# POOLED_COMP_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/POOLED_COMPONENTS|POOLED_COMPONENTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into pooled_components_audit
	(
	pool_id, chapter_id, patient_id,
		patient_first_name, patient_last_name,
		facility, product_code, bag_id,
	lot_number, filter_lot_number, inter_code,
		pool_dats, pool_expiry_dats, pool_insert_dats,
		pool_user_id, audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
	:old.pool_id, :old.chapter_id,:old.patient_id,
		:old.patient_first_name, :old.patient_last_name,
		:old.facility, :old.product_code, :old.bag_id,
	:old.lot_number, :old.filter_lot_number, :old.inter_code,
		:old.pool_dats, :old.pool_expiry_dats,
		:old.pool_insert_dats, :old.pool_user_id,
	:old.audit_key,'DELETE',sysdate,lt_user_session.get_userid
	);
end;
```
