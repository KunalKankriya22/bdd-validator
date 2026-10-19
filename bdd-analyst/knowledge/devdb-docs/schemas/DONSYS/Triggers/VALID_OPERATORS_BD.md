---
tags:
  - trigger
  - DONSYS
---
# VALID_OPERATORS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_OPERATORS|VALID_OPERATORS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_OPERATORS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		v_operator,
		v_description,
		v_value_style,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.v_operator,
		:old.v_description,
		:old.v_value_style,
		:old.eff_date,
		:old.term_date
	);
end;
```
