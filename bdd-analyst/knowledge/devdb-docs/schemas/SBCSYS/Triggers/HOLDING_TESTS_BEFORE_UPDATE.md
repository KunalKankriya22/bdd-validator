---
tags:
  - trigger
  - SBCSYS
---
# HOLDING_TESTS_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/HOLDING_TESTS|HOLDING_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	aud_rec      holding_tests_audit%rowtype;
begin
	--
	if nvl(:old.unit_id,'*') !=
	   nvl(:new.unit_id,'*')
	then
	   aud_rec.unit_id :=
			nvl(:new.unit_id,'*');
	end if;
	if nvl(:old.coll_date,to_date('01-JAN-33')) !=
	   nvl(:new.coll_date,to_date('01-JAN-33'))
	then
	   aud_rec.coll_date :=
			nvl(:new.coll_date,to_date('01-JAN-33'));
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
	   aud_rec.chapter_id :=
			nvl(:new.chapter_id,'*');
	end if;
	if nvl(:old.test_id,'*') !=
	   nvl(:new.test_id,'*')
	then
	   aud_rec.test_id :=
			nvl(:new.test_id,'*');
	end if;
	if nvl(:old.test_state,'*') !=
	   nvl(:new.test_state,'*')
	then
	   aud_rec.test_state :=
			nvl(:new.test_state,'*');
	end if;
	if nvl(:old.machine_id,'*') !=
	   nvl(:new.machine_id,'*')
	then
	   aud_rec.machine_id :=
			nvl(:new.machine_id,'*');
	end if;
	if nvl(:old.machine_flags,'*') !=
	   nvl(:new.machine_flags,'*')
	then
	   aud_rec.machine_flags :=
			nvl(:new.machine_flags,'*');
	end if;
	if nvl(:old.result_status_1,'*') !=
	   nvl(:new.result_status_1,'*')
	then
	   aud_rec.result_status_1 :=
			nvl(:new.result_status_1,'*');
	end if;
	if nvl(:old.result_status_2,'*') !=
	   nvl(:new.result_status_2,'*')
	then
	   aud_rec.result_status_2 :=
			nvl(:new.result_status_2,'*');
	end if;
	if nvl(:old.temp_result_1,'*') !=
	   nvl(:new.temp_result_1,'*')
	then
	   aud_rec.temp_result_1 :=
			nvl(:new.temp_result_1,'*');
	end if;
	if nvl(:old.temp_result_1_user_id,'*') !=
	   nvl(:new.temp_result_1_user_id,'*')
	then
	   aud_rec.temp_result_1_user_id :=
			nvl(:new.temp_result_1_user_id,'*');
	end if;
	if nvl(:old.temp_result_2,'*') !=
	   nvl(:new.temp_result_2,'*')
	then
	   aud_rec.temp_result_2 :=
			nvl(:new.temp_result_2,'*');
	end if;
	if nvl(:old.temp_result_2_user_id,'*') !=
	   nvl(:new.temp_result_2_user_id,'*')
	then
	   aud_rec.temp_result_2_user_id :=
			nvl(:new.temp_result_2_user_id,'*');
	end if;
	if nvl(:old.tb_id,'*') !=
	   nvl(:new.tb_id,'*')
	then
	   aud_rec.tb_id :=
			nvl(:new.tb_id,'*');
	end if;
	if nvl(:old.test_chapter_id,'*') !=
	   nvl(:new.test_chapter_id,'*')
	then
	   aud_rec.test_chapter_id :=
			nvl(:new.test_chapter_id,'*');
	end if;
	if nvl(:old.tb_seq_no,-1) !=
	   nvl(:new.tb_seq_no,-1)
	then
	   aud_rec.tb_seq_no :=
			nvl(:new.tb_seq_no,-1);
	end if;
	if nvl(:old.well_number,'*') !=
	   nvl(:new.well_number,'*')
	then
	   aud_rec.well_number :=
			nvl(:new.well_number,'*');
	end if;
	if nvl(:old.absorbance,'*') !=
	   nvl(:new.absorbance,'*')
	then
	   aud_rec.absorbance :=
			nvl(:new.absorbance,'*');
	end if;
	if nvl(:old.ratio,'*') !=
	   nvl(:new.ratio,'*')
	then
	   aud_rec.ratio :=
			nvl(:new.ratio,'*');
	end if;
	if nvl(:old.result_dats,to_date('01-JAN-33')) !=
	   nvl(:new.result_dats,to_date('01-JAN-33'))
	then
	   aud_rec.result_dats :=
			nvl(:new.result_dats,to_date('01-JAN-33'));
	end if;
	if nvl(:old.result_user_id,'*') !=
	   nvl(:new.result_user_id,'*')
	then
	   aud_rec.result_user_id :=
			nvl(:new.result_user_id,'*');
	end if;
	if nvl(:old.insert_dats,to_date('01-JAN-33')) !=
	   nvl(:new.insert_dats,to_date('01-JAN-33'))
	then
	   aud_rec.insert_dats :=
			nvl(:new.insert_dats,to_date('01-JAN-33'));
	end if;
	if nvl(:old.insert_user_id,'*') !=
	   nvl(:new.insert_user_id,'*')
	then
	   aud_rec.insert_user_id :=
			nvl(:new.insert_user_id,'*');
	end if;
	if nvl(:old.holding_status,'*') !=
	   nvl(:new.holding_status,'*')
	then
	   aud_rec.holding_status :=
			nvl(:new.holding_status,'*');
	end if;
	--
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
		:old.audit_key,
		sysdate,lt_user_session.get_userid,
		aud_rec.unit_id,
		aud_rec.coll_date,
		aud_rec.chapter_id,
		aud_rec.test_id,
		aud_rec.test_state,
		aud_rec.machine_id,
		aud_rec.machine_flags,
		aud_rec.result_status_1,
		aud_rec.result_status_2,
		aud_rec.temp_result_1,
		aud_rec.temp_result_1_user_id,
		aud_rec.temp_result_2,
		aud_rec.temp_result_2_user_id,
		aud_rec.tb_id,
		aud_rec.test_chapter_id,
		aud_rec.tb_seq_no,
		aud_rec.well_number,
		aud_rec.absorbance,
		aud_rec.ratio,
		aud_rec.result_dats,
		aud_rec.result_user_id,
		aud_rec.insert_dats,
		aud_rec.insert_user_id,
		:new.program_id,
		aud_rec.holding_status
	);
end;
```
