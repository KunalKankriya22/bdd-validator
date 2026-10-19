---
tags:
  - trigger
  - DONSYS
---
# VALID_TESTS_DON_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_TESTS_DON|VALID_TESTS_DON]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  number(23);
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.test_id,
		:new.test_desc,
		:new.test_short_id,
		:new.test_group,
		:new.antigen_flag,
		:new.edit_result_flag,
		:new.discrepancy_flag,
		:new.service_code,
		:new.testing_charges_curr,
		:new.testing_charges_new,
		:new.implement_dats,
		:new.view_level,
		:new.manual_entry_flag,
		:new.eff_date,
		:new.term_date
	);
end;
```
