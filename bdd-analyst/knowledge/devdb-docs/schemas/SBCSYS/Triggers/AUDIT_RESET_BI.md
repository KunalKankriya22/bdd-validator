---
tags:
  - trigger
  - SBCSYS
---
# AUDIT_RESET_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/AUDIT_RESET|AUDIT_RESET]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE

temp_audit_key NUMBER(23);
interface_id     varchar2(10);
PRAGMA AUTONOMOUS_TRANSACTION;

BEGIN

  dnlbu.donor_to_lab_unit_data (:new.unit_id, :new.chapter_id, null, null, interface_id);

  don_lab_nai.interface_nursing_audit (:new.unit_id, null, null,:new.chapter_id,interface_id);
END;
```
