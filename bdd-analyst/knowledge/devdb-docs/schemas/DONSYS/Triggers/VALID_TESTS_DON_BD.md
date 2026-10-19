---
tags:
  - trigger
  - DONSYS
---
# VALID_TESTS_DON_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_TESTS_DON|VALID_TESTS_DON]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    insert into VALID_TESTS_DON_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		test_id,
		test_desc,
		test_short_id,
		test_group,
		antigen_flag,
		edit_result_flag,
		discrepancy_flag,
		service_code,
		testing_charges_curr,
		testing_charges_new,
		implement_dats,
		view_level,
		manual_entry_flag,
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
		:old.test_desc,
		:old.test_short_id,
		:old.test_group,
		:old.antigen_flag,
		:old.edit_result_flag,
		:old.discrepancy_flag,
		:old.service_code,
		:old.testing_charges_curr,
		:old.testing_charges_new,
		:old.implement_dats,
		:old.view_level,
		:old.manual_entry_flag,
		:old.eff_date,
		:old.term_date
	);
end;
```
