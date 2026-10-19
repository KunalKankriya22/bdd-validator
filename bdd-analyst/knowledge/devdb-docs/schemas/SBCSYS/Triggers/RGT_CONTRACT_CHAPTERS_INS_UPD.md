---
tags:
  - trigger
  - SBCSYS
---
# RGT_CONTRACT_CHAPTERS_INS_UPD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_CONTRACT_CHAPTERS|RGT_CONTRACT_CHAPTERS]]
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
  --:new.last_modified_date := sysdate; -- Commented by Kishore on 05/24/2011. IM 5356
  --
end;
```
