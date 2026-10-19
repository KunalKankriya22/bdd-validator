---
tags:
  - trigger
  - DONSYS
---
# EMPLOYEES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/EMPLOYEES|EMPLOYEES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.audit_key,
		sysdate,
		:old.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.staff_no,
		:old.chapter_id,
		:old.first_name,
		:old.last_name,
		:old.initials,
		:old.dept_id,
		:old.staff_type,
		:old.emp_class,
		:old.overtime_pref_flag,
		:old.cost_per_hour,
		:old.team_id,
		:old.address_id,
		:old.other_phone_no,
		:old.comments,
		:old.ssn,
		:old.hire_date,
		:old.schedule_from_date,
		:old.hourly_rate,
		:old.em_contact_name,
		:old.em_contact_area_code,
		:old.em_contact_phone_no,
		:old.facility_code,
		:old.eff_date,
		:old.term_date
	);
end;
```
