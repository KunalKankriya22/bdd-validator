---
tags:
  - trigger
  - SBCSYS
---
# COMPONENT_ATTR_BEFORE_INSERT

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENT_ATTRIBUTES|COMPONENT_ATTRIBUTES]]
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
	insert into component_attributes_audit
	(
		unit_id, coll_date, chapter_id,
		product_code, attrib_group,
		attrib_code, insert_dats, insert_user_id,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user, proc_date
	)
	values
	(
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.product_code, :new.attrib_group,
		:new.attrib_code, :new.insert_dats, :new.insert_user_id,
		:new.audit_key,:new.program_id,
		sysdate, lt_user_session.get_userid, :new.proc_date
	);
end;
```
