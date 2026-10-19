---
tags:
  - trigger
  - DONSYS
---
# DRIVE_CHECKLIST_TEMPLATE_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVE_CHECKLIST_TEMPLATE|DRIVE_CHECKLIST_TEMPLATE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into DRIVE_CHECKLIST_TEMPLATE_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		sponsor_id,
		chapter_id,
		action_code,
		time_flag,
		target_days,
		sort_seq,
		action_flag,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.sponsor_id,
		:old.chapter_id,
		:old.action_code,
		:old.time_flag,
		:old.target_days,
		:old.sort_seq,
		:old.action_flag,
		:old.eff_date,
		:old.term_date
	);
end;
```
