---
tags:
  - trigger
  - SBCSYS
---
# RGT_CONTRACT_PROFILE_INS_UPD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_CONTRACT_PROFILE|RGT_CONTRACT_PROFILE]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
  temp_audit_key number(23);
begin
  if inserting then
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
  end if;
  :new.program_id := nvl(:new.program_id, 'MANUAL');
end;
```
