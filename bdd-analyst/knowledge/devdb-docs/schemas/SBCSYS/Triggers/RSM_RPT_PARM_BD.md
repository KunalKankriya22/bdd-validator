---
tags:
  - trigger
  - SBCSYS
---
# RSM_RPT_PARM_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RSM_RPT_PARM|RSM_RPT_PARM]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into RSM_RPT_PARM_AUDIT
    (
	APPL_ID, USER_NAME, REPORT_NAME,
	RESULT_PARM_ID, REPORT_ID, SUBMIT_DATE,
	REPORT_STATUS, REPORT_FILE_NAME, PRINT_REQUEST_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.APPL_ID, :old.USER_NAME, :old.REPORT_NAME,
	:old.RESULT_PARM_ID, :old.REPORT_ID, :old.SUBMIT_DATE,
	:old.REPORT_STATUS, :old.REPORT_FILE_NAME, :old.PRINT_REQUEST_FLAG,
	:old.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
