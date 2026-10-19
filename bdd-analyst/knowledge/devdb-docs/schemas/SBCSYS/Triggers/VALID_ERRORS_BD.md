---
tags:
  - trigger
  - SBCSYS
---
# VALID_ERRORS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ERRORS_LAB|VALID_ERRORS_LAB]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

    insert into VALID_ERRORS_AUDIT
    (
	ERROR_CODE, ERROR_TYPE,
	ERROR, AUDIT_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.ERROR_CODE, :old.ERROR_TYPE,
	:old.ERROR, :old.AUDIT_FLAG,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
