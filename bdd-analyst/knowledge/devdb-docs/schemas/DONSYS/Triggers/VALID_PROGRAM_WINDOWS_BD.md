---
tags:
  - trigger
  - DONSYS
---
# VALID_PROGRAM_WINDOWS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PROGRAM_WINDOWS|VALID_PROGRAM_WINDOWS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_PROGRAM_WINDOWS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		window_name,
		chapter_id,
		appl_id,
		parm1_value,
		parm2_value,
		parm3_value,
		parm4_value,
		query_only,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.window_name,
		:old.chapter_id,
		:old.appl_id,
		:old.parm1_value,
		:old.parm2_value,
		:old.parm3_value,
		:old.parm4_value,
		:old.query_only,
		:old.eff_date,
		:old.term_date
	);
end;
```
