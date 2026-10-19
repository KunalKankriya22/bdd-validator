---
tags:
  - trigger
  - DONSYS
---
# IDP_CONVERSION_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/IDP_CONV_REF_VALUES|IDP_CONV_REF_VALUES]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN

SELECT CONVERSION_SEQ.NEXTVAL INTO :NEW.CONV_REF_VALUE_ID FROM DUAL;

END;
```
