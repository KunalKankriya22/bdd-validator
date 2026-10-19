---
tags:
  - trigger
  - SBCSYS
---
# VALID_CRYO_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_CRYO_METHODS|VALID_CRYO_METHODS]]
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
    insert into valid_cryo_methods_audit
	(
		chapter_id,thaw_method,
		method_desc,min_temp, max_temp,
		min_ws_freeze_time,  max_ws_freeze_time,
		min_sep_freeze_time, max_sep_freeze_time,
		eff_date, term_date,last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.chapter_id,:new.thaw_method,
		:new.method_desc,:new.min_temp, :new.max_temp,
		:new.min_ws_freeze_time,  :new.max_ws_freeze_time,
		:new.min_sep_freeze_time, :new.max_sep_freeze_time,
		:new.eff_date, :new.term_date,:new.last_modified_date,
		:new.audit_key, :new.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
```
