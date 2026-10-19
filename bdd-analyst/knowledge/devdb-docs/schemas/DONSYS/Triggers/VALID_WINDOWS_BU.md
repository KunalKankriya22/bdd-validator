---
tags:
  - trigger
  - DONSYS
---
# VALID_WINDOWS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_WINDOWS|VALID_WINDOWS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_WINDOWS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		window_name,
		chapter_id,
		title,
		appl_id,
		parm_1,
		parm_2,
		parm_3,
		parm_4,
		x_pos,
		y_pos,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.window_name,
		:new.chapter_id,
		:new.title,
		:new.appl_id,
		:new.parm_1,
		:new.parm_2,
		:new.parm_3,
		:new.parm_4,
		:new.x_pos,
		:new.y_pos,
		:new.eff_date,
		:new.term_date
	);
end;
```
