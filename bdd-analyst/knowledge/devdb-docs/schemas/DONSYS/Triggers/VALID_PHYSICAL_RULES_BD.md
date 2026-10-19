---
tags:
  - trigger
  - DONSYS
---
# VALID_PHYSICAL_RULES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PHYSICAL_RULES|VALID_PHYSICAL_RULES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_PHYSICAL_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		physical_code,
		procedure_code,
		donation_type,
		chapter_id,
		gender,
		from_age,
		to_age,
		item_value,
		item_operator,
		inter_code,
		item_value_max,
		data_type,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.physical_code,
		:old.procedure_code,
		:old.donation_type,
		:old.chapter_id,
		:old.gender,
		:old.from_age,
		:old.to_age,
		:old.item_value,
		:old.item_operator,
		:old.inter_code,
		:old.item_value_max,
		:old.data_type,
		:old.eff_date,
		:old.term_date
	);
end;
```
