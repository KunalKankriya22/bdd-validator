---
tags:
  - trigger
  - DONSYS
---
# VALID_ACL_CODES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_ACL_CODES|VALID_ACL_CODES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_ACL_CODES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		access_class,
		access_code_type,
		access_code_value,
		chapter_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.access_class,
		:new.access_code_type,
		:new.access_code_value,
		:new.chapter_id,
		:new.eff_date,
		:new.term_date
	);
end;
```
