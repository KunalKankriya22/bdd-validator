---
tags:
  - trigger
  - SBCSYS
---
# POOLED_COMP_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/POOLED_COMPONENTS|POOLED_COMPONENTS]]
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
	:new.pool_id, :new.chapter_id,:new.patient_id,
		:new.patient_first_name, :new.patient_last_name,
		:new.facility, :new.product_code, :new.bag_id,
	:new.lot_number, :new.filter_lot_number, :new.inter_code,
		:new.pool_dats, :new.pool_expiry_dats, :new.pool_insert_dats,
		:new.pool_user_id, :new.audit_key,:new.program_id,
		sysdate,lt_user_session.get_userid
	);
end;
```
