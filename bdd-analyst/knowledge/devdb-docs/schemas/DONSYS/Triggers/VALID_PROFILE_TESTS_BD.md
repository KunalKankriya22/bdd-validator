---
tags:
  - trigger
  - DONSYS
---
# VALID_PROFILE_TESTS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_PROFILE_TESTS|VALID_PROFILE_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_PROFILE_TESTS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		test_id,
		chapter_id,
		required_test,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.test_id,
		:old.chapter_id,
		:old.required_test,
		:old.eff_date,
		:old.term_date
	);
end;
```
