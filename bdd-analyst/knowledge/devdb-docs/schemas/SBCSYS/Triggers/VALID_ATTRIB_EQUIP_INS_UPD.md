---
tags:
  - trigger
  - SBCSYS
---
# VALID_ATTRIB_EQUIP_INS_UPD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ATTRIB_EQUIP|VALID_ATTRIB_EQUIP]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
      temp_audit_key	number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
insert into  valid_attrib_equip_audit (
      attrib_group ,
      attrib_code  ,
      equip_type   ,
      parm_code,
      eff_date	   ,
      last_modified_date,
      term_date    ,
      audit_key    ,
      program_id   ,
      audit_insert_user,
      audit_insert_date )
      values (
      :new.attrib_group ,
      :new.attrib_code	,
      :new.equip_type	,
      :new.parm_code	,
      :new.eff_date	,
      :new.last_modified_date ,
      :new.term_date	,
      :new.audit_key	,
      :new.program_id, lt_user_session.get_userid,
      sysdate);
end;
```
