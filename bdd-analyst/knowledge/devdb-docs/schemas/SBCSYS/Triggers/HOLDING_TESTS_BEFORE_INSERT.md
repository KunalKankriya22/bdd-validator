---
tags:
  - trigger
  - SBCSYS
---
# HOLDING_TESTS_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/HOLDING_TESTS|HOLDING_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into holding_tests_audit
	(
		audit_key,
		audit_insert_dats,
		audit_insert_user,
		unit_id,
		coll_date,
		chapter_id,
		test_id,
		test_state,
		machine_id,
		machine_flags,
		result_status_1,
		result_status_2,
		temp_result_1,
		temp_result_1_user_id,
		temp_result_2,
		temp_result_2_user_id,
		tb_id,
		test_chapter_id,
		tb_seq_no,
		well_number,
		absorbance,
		ratio,
		result_dats,
		result_user_id,
		insert_dats,
		insert_user_id,
		program_id,
		holding_status
	)
	values
	(
		:new.audit_key,
		sysdate,lt_user_session.get_userid,
		:new.unit_id,
		:new.coll_date,
		:new.chapter_id,
		:new.test_id,
		:new.test_state,
		:new.machine_id,
		:new.machine_flags,
		:new.result_status_1,
		:new.result_status_2,
		:new.temp_result_1,
		:new.temp_result_1_user_id,
		:new.temp_result_2,
		:new.temp_result_2_user_id,
		:new.tb_id,
		:new.test_chapter_id,
		:new.tb_seq_no,
		:new.well_number,
		:new.absorbance,
		:new.ratio,
		:new.result_dats,
		:new.result_user_id,
		:new.insert_dats,
		:new.insert_user_id,
		:new.program_id,
		:new.holding_status
	);
end;
```
