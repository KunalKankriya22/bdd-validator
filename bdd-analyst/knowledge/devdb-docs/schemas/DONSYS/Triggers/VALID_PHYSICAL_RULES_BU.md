---
tags:
  - trigger
  - DONSYS
---
# VALID_PHYSICAL_RULES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PHYSICAL_RULES|VALID_PHYSICAL_RULES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.physical_code,
		:new.procedure_code,
		:new.donation_type,
		:new.chapter_id,
		:new.gender,
		:new.from_age,
		:new.to_age,
		:new.item_value,
		:new.item_operator,
		:new.inter_code,
		:new.item_value_max,
		:new.data_type,
		:new.eff_date,
		:new.term_date
	);
end;
```
