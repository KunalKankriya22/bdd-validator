---
tags:
  - trigger
  - DONSYS
---
# VALID_LETTER_ACCESSES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_LETTER_ACCESSES|VALID_LETTER_ACCESSES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_LETTER_ACCESSES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		letter_id,
		access_class,
		edit_flag,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.letter_id,
		:new.access_class,
		:new.edit_flag,
		:new.eff_date,
		:new.term_date
	);
end;
```
