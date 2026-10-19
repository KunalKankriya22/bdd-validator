---
tags:
  - trigger
  - SBCSYS
---
# TEST_KIT_CLASS_INS_UPD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_KIT_CLASS|TEST_KIT_CLASS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
	:new.last_modified_date := sysdate;
    --
    insert into test_kit_class_audit
	(
		test_chapter_id, test_id, test_kit_class,
		eff_date, term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.test_chapter_id, :new.test_id, :new.test_kit_class,
		:new.eff_date, :new.term_date, :new.last_modified_date,
		:new.audit_key, :new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
