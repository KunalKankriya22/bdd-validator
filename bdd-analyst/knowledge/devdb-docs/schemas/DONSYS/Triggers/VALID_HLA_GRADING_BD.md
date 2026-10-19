---
tags:
  - trigger
  - DONSYS
---
# VALID_HLA_GRADING_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HLA_GRADING|VALID_HLA_GRADING]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_HLA_GRADING_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		grade_id,
		chapter_id,
		grade,
		grade_level,
		a1,
		a2,
		b1,
		b2,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.grade_id,
		:old.chapter_id,
		:old.grade,
		:old.grade_level,
		:old.a1,
		:old.a2,
		:old.b1,
		:old.b2,
		:old.eff_date,
		:old.term_date
	);
end;
```
