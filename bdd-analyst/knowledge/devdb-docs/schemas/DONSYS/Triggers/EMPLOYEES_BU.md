---
tags:
  - trigger
  - DONSYS
---
# EMPLOYEES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/EMPLOYEES|EMPLOYEES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into EMPLOYEES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		staff_no,
		chapter_id,
		first_name,
		last_name,
		initials,
		dept_id,
		staff_type,
		emp_class,
		overtime_pref_flag,
		cost_per_hour,
		team_id,
		address_id,
		other_phone_no,
		comments,
		ssn,
		hire_date,
		schedule_from_date,
		hourly_rate,
		em_contact_name,
		em_contact_area_code,
		em_contact_phone_no,
		facility_code,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.staff_no,
		:new.chapter_id,
		:new.first_name,
		:new.last_name,
		:new.initials,
		:new.dept_id,
		:new.staff_type,
		:new.emp_class,
		:new.overtime_pref_flag,
		:new.cost_per_hour,
		:new.team_id,
		:new.address_id,
		:new.other_phone_no,
		:new.comments,
		:new.ssn,
		:new.hire_date,
		:new.schedule_from_date,
		:new.hourly_rate,
		:new.em_contact_name,
		:new.em_contact_area_code,
		:new.em_contact_phone_no,
		:new.facility_code,
		:new.eff_date,
		:new.term_date
	);
end;
```
