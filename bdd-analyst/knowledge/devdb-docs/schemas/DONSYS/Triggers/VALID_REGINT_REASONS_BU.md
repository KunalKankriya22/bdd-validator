---
tags:
  - trigger
  - DONSYS
---
# VALID_REGINT_REASONS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_REGINT_REASONS|VALID_REGINT_REASONS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
insert into VALID_REGINT_REASONS_audit
(
audit_key,
audit_insert_date,
program_id,
audit_insert_user,
inter_reason,
inter_code,
eff_date,
term_date
)
values
(
:new.audit_key,
sysdate,
:new.program_id,
decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
:new.inter_reason,
:new.inter_code,
:new.eff_date,
:new.term_date
);
end;
```
