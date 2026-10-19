---
tags:
  - trigger
  - DONSYS
---
# FIND_DONOR_PROGRAMS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/FIND_DONOR_PROGRAMS|FIND_DONOR_PROGRAMS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into FIND_DONOR_PROGRAMS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		program_name,
		allow_create,
		multiple_selection,
		grading_level,
		update_key_info,
		allow_new,
		allow_select,
		allow_hold,
		select_allowed_levels,
		new_allowed_level,
		select_allowed_multilevel,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.program_name,
		:new.allow_create,
		:new.multiple_selection,
		:new.grading_level,
		:new.update_key_info,
		:new.allow_new,
		:new.allow_select,
		:new.allow_hold,
		:new.select_allowed_levels,
		:new.new_allowed_level,
		:new.select_allowed_multilevel,
		:new.eff_date,
		:new.term_date
	);
end;
```
