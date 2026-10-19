---
tags:
  - trigger
  - SBCSYS
---
# VALID_INTERDICTIONS_LAB_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_INTERDICTIONS_LAB|VALID_INTERDICTIONS_LAB]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_interdictions_LAB_audit
	(
		inter_code, inter_type, inter_desc,
		system_inter_code, system_inter_flag, eff_date,
		term_date, last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.inter_code,:old.inter_type,:old.inter_desc,
		:old.system_inter_code,:old.system_inter_flag, :old.eff_date,
		:old.term_date,:old.last_modified_date,:old.audit_key,
		'DELETE', sysdate, lt_user_session.get_userid
	);
end;
```
