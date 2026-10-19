---
tags:
  - trigger
  - SBCSYS
---
# ATTRIB_MATRIX_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/ATTRIBUTE_MATRIX|ATTRIBUTE_MATRIX]]
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
    insert into attribute_matrix_audit
	(
		attrib_added_group,
		attrib_added_code,
		attrib_deleted_group,
		attrib_deleted_code,
		associated_attrib_group,
		associated_attrib_code,
		eff_date,
		term_date,
		last_modified_date,
		audit_key,
		program_id,
		audit_insert_dats,
		audit_insert_user
	)
	values
	(
		:new.attrib_added_group,
		:new.attrib_added_code,
		:new.attrib_deleted_group,
		:new.attrib_deleted_code,
		:new.associated_attrib_group,
		:new.associated_attrib_code,
		:new.eff_date,
		:new.term_date,
		:new.last_modified_date,
		:new.audit_key,
		:new.program_id,
		sysdate,
		lt_user_session.get_userid
	);
end;
```
