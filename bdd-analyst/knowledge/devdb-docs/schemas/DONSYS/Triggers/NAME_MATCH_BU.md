---
tags:
  - trigger
  - DONSYS
---
# NAME_MATCH_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/NAME_MATCH|NAME_MATCH]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into NAME_MATCH_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		nick_name,
		first_name,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.nick_name,
		:new.first_name,
		:new.eff_date,
		:new.term_date
	);
end;
```
