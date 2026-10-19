---
tags:
  - trigger
  - DONSYS
---
# DONOR_INTERDICTIONS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONOR_INTERDICTIONS|DONOR_INTERDICTIONS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
end if;
if :new.inter_code='RBC56' and :new.unit_id is not null then
:new.eff_date:=to_date(to_char(:new.eff_date,'MM-DD-YYYY')||' 23:59','MM-DD-YYYY
 HH24:MI');
end if;
end ;
```
