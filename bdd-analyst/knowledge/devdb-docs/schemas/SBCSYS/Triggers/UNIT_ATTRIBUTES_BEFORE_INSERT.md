---
tags:
  - trigger
  - SBCSYS
---
# UNIT_ATTRIBUTES_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNIT_ATTRIBUTES|UNIT_ATTRIBUTES]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
      temp_audit_key	number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    --
    insert into unit_attributes_audit
	(
		unit_id, coll_date, chapter_id,
		attrib_group, attrib_code, source_test_id,
		status_flag, stop_label_flag,
		insert_dats, insert_user_id,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.attrib_group, :new.attrib_code, :new.source_test_id,
		:new.status_flag, :new.stop_label_flag,
		:new.insert_dats, :new.insert_user_id,
		:new.audit_key,:new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
