---
tags:
  - trigger
  - DONSYS
---
# FIXED_SITE_HOURS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/FIXED_SITE_HOURS|FIXED_SITE_HOURS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into FIXED_SITE_HOURS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		site_id,
		chapter_id,
		week_day,
		frequency_code,
		donation_type_group,
		proc_code,
		slot_time,
		break_start_time,
		break_end_time,
		no_of_beds,
		no_of_staff,
		capacity,
		overbook_limit,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.site_id,
		:old.chapter_id,
		:old.week_day,
		:old.frequency_code,
		:old.donation_type_group,
		:old.proc_code,
		:old.slot_time,
		:old.break_start_time,
		:old.break_end_time,
		:old.no_of_beds,
		:old.no_of_staff,
		:old.capacity,
		:old.overbook_limit,
		:old.eff_date,
		:old.term_date
	);
end;
```
