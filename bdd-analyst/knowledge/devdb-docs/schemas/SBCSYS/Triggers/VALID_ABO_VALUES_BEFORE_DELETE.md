---
tags:
  - trigger
  - SBCSYS
---
# VALID_ABO_VALUES_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ABO_VALUES|VALID_ABO_VALUES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
insert into valid_abo_values_audit
(
tested_abo_code,
identifier_code,
abo_label,
abo_short_name,
abo_label_type,
abo_only,
alternate_tested_abo,
unit_scheme_type,
eff_date,
term_date,
last_modified_date,
audit_key,
program_id,
audit_insert_dats,
audit_insert_user,
label_printer_code
)
values
(
:old.tested_abo_code,
:old.identifier_code,
:old.abo_label,
:old.abo_short_name,
:old.abo_label_type,
:old.abo_only,
:old.alternate_tested_abo,
:old.unit_scheme_type,
:old.eff_date,
:old.term_date,
:old.last_modified_date,
:old.audit_key,
'DELETE',
sysdate,
lt_user_session.get_userid,
:old.label_printer_code
);
end;
```
