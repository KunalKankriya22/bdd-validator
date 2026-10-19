---
tags:
  - trigger
  - SBCSYS
---
# UNIT_INTER_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_INTERDICTIONS|UNIT_INTERDICTIONS]]
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
    --
	insert into unit_interdictions_audit
	(
		unit_id, coll_date, chapter_id,
		inter_code, insert_dats, inter_user_id,
		source_test_id, audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.inter_code, :new.insert_dats, :new.inter_user_id,
		:new.source_test_id, :new.audit_key, :new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
