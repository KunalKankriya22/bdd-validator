---
tags:
  - trigger
  - DONSYS
---
# VALID_TERRITORIES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_TERRITORIES|VALID_TERRITORIES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.territory_id,
		:old.chapter_id,
		:old.territory_name,
		:old.territory_group,
		:old.territory_type,
		:old.territory_short_name,
		:old.comments,
		:old.eff_date,
		:old.term_date
	);
end;
```
