---
tags:
  - trigger
  - SBCSYS
---
# VALID_CRYO_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_CRYO_METHODS|VALID_CRYO_METHODS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into valid_cryo_methods_audit
	(
		chapter_id,thaw_method,
		method_desc,min_temp, max_temp,
		min_ws_freeze_time,  max_ws_freeze_time,
		min_sep_freeze_time, max_sep_freeze_time,
		eff_date, term_date,last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.chapter_id,:old.thaw_method,
		:old.method_desc,:old.min_temp, :old.max_temp,
		:old.min_ws_freeze_time,  :old.max_ws_freeze_time,
		:old.min_sep_freeze_time, :old.max_sep_freeze_time,
		:old.eff_date, :old.term_date,:old.last_modified_date,
		:old.audit_key, 'DELETE',
		sysdate, lt_user_session.get_userid
	);
end;
```
