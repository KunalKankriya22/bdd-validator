---
tags:
  - trigger
  - SBCSYS
---
# VALID_ERRORS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_ERRORS_LAB|VALID_ERRORS_LAB]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: DISABLED

## Trigger Body

```plsql
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;

           --

    insert into VALID_ERRORS_AUDIT
    (
	ERROR_CODE, ERROR_TYPE,
	ERROR, AUDIT_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:new.ERROR_CODE, :new.ERROR_TYPE,
	:new.ERROR, :new.AUDIT_FLAG,
	:new.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
