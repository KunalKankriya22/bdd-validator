---
tags:
  - trigger
  - DONSYS
---
# DRIVE_CHECKLIST_TEMPLATE_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVE_CHECKLIST_TEMPLATE|DRIVE_CHECKLIST_TEMPLATE]]
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
    insert into DRIVE_CHECKLIST_TEMPLATE_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		sponsor_id,
		chapter_id,
		action_code,
		time_flag,
		target_days,
		sort_seq,
		action_flag,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.sponsor_id,
		:new.chapter_id,
		:new.action_code,
		:new.time_flag,
		:new.target_days,
		:new.sort_seq,
		:new.action_flag,
		:new.eff_date,
		:new.term_date
	);
end;
```
