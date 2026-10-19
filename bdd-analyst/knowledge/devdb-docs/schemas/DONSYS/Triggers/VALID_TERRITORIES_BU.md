---
tags:
  - trigger
  - DONSYS
---
# VALID_TERRITORIES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_TERRITORIES|VALID_TERRITORIES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_TERRITORIES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		territory_id,
		chapter_id,
		territory_name,
		territory_group,
		territory_type,
		territory_short_name,
		comments,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.territory_id,
		:new.chapter_id,
		:new.territory_name,
		:new.territory_group,
		:new.territory_type,
		:new.territory_short_name,
		:new.comments,
		:new.eff_date,
		:new.term_date
	);
end;
```
