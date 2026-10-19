---
tags:
  - trigger
  - SBCSYS
---
# POOLED_COMP_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/POOLED_COMPONENTS|POOLED_COMPONENTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    pool_aud	      pooled_components_audit%rowtype;
begin
	pool_aud.audit_key := :old.audit_key;
	pool_aud.program_id := :new.program_id;
    --
	if nvl(:old.patient_id,'*') !=
       nvl(:new.patient_id,'*')
    then
		pool_aud.patient_id := nvl(:new.patient_id,'*');
    end if;
    if nvl(:old.patient_first_name,'*') !=
       nvl(:new.patient_first_name,'*')
    then
       pool_aud.patient_first_name := nvl(:new.patient_first_name,'*');
    end if;
    if nvl(:old.patient_last_name,'*') !=
       nvl(:new.patient_last_name,'*')
    then
       pool_aud.patient_last_name := nvl(:new.patient_last_name,'*');
    end if;
    if nvl(:old.facility,'*') !=
       nvl(:new.facility,'*')
    then
       pool_aud.facility := nvl(:new.facility,'*');
    end if;
    if nvl(:old.product_code,'*') !=
       nvl(:new.product_code,'*')
    then
       pool_aud.product_code := nvl(:new.product_code,'*');
    end if;
    if nvl(:old.bag_id,'*') !=
       nvl(:new.bag_id,'*')
    then
       pool_aud.bag_id := nvl(:new.bag_id,'*');
    end if;
    if nvl(:old.lot_number,'*') !=
       nvl(:new.lot_number,'*')
    then
       pool_aud.lot_number := nvl(:new.lot_number,'*');
    end if;
    if nvl(:old.filter_lot_number,'*') !=
       nvl(:new.filter_lot_number,'*')
    then
       pool_aud.filter_lot_number := nvl(:new.filter_lot_number,'*');
    end if;
    if nvl(:old.inter_code,'*') !=
       nvl(:new.inter_code,'*')
    then
       pool_aud.inter_code := nvl(:new.inter_code,'*');
    end if;
    if nvl(:old.pool_dats,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.pool_dats,to_date('01-JAN-33','DD-MON-YY'))
    then
       pool_aud.pool_dats := nvl(:new.pool_dats,
			   to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.pool_expiry_dats,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.pool_expiry_dats,to_date('01-JAN-33','DD-MON-YY'))
    then
       pool_aud.pool_expiry_dats := nvl(:new.pool_expiry_dats,
				  to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.pool_user_id,'*') !=
       nvl(:new.pool_user_id,'*')
    then
       pool_aud.pool_user_id := nvl(:new.pool_user_id,'*');
    end if;
    --
	insert into pooled_components_audit
	(
	pool_id, chapter_id, patient_id,
		patient_first_name, patient_last_name,
		facility, product_code, bag_id,
	lot_number, filter_lot_number, inter_code,
		pool_dats, pool_expiry_dats,
		pool_insert_dats, pool_user_id,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
	pool_aud.pool_id, pool_aud.chapter_id,pool_aud.patient_id,
		pool_aud.patient_first_name, pool_aud.patient_last_name,
		pool_aud.facility, pool_aud.product_code, pool_aud.bag_id,
	pool_aud.lot_number, pool_aud.filter_lot_number, pool_aud.inter_code,
		pool_aud.pool_dats, pool_aud.pool_expiry_dats,
		pool_aud.pool_insert_dats, pool_aud.pool_user_id,
		pool_aud.audit_key,pool_aud.program_id,
		sysdate,lt_user_session.get_userid
	);
end;
```
