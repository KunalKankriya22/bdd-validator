---
tags:
  - trigger
  - DONSYS
---
# DONOR_GRADING_MATRIX_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONOR_GRADING_MATRIX|DONOR_GRADING_MATRIX]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into DONOR_GRADING_MATRIX_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		dgm_id,
		ssn_match,
		lastname_match,
		firstname_match,
		dob_match,
		gender_match,
		grade,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.dgm_id,
		:old.ssn_match,
		:old.lastname_match,
		:old.firstname_match,
		:old.dob_match,
		:old.gender_match,
		:old.grade,
		:old.eff_date,
		:old.term_date
	);
end;
```
