---
tags:
  - trigger
  - SBCSYS
---
# RSM_RPT_PARM_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RSM_RPT_PARM|RSM_RPT_PARM]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    RSM_RPT_PARM_aud	      RSM_RPT_PARM_AUDIT%rowtype;
begin
    RSM_RPT_PARM_aud.audit_key := :old.audit_key;
    if nvl(:old.APPL_ID,'*') !=
       nvl(:new.APPL_ID,'*')
    then
       RSM_RPT_PARM_aud.APPL_ID:= nvl(:new.APPL_ID,'*');
    end if;
    if nvl(:old.USER_NAME,'*') !=
       nvl(:new.USER_NAME,'*')
    then
       RSM_RPT_PARM_aud.USER_NAME:= nvl(:new.USER_NAME,'*');
    end if;
    if nvl(:old.REPORT_NAME,'*') !=
       nvl(:new.REPORT_NAME,'*')
    then
       RSM_RPT_PARM_aud.REPORT_NAME:= nvl(:new.REPORT_NAME,'*');
    end if;
    if nvl(:old.RESULT_PARM_ID,'*') !=
       nvl(:new.RESULT_PARM_ID,'*')
    then
       RSM_RPT_PARM_aud.RESULT_PARM_ID:= nvl(:new.RESULT_PARM_ID,'*');
    end if;
    if nvl(:old.REPORT_ID,'*') !=
       nvl(:new.REPORT_ID,'*')
    then
       RSM_RPT_PARM_aud.REPORT_ID:= nvl(:new.REPORT_ID,'*');
    end if;
    if nvl(:old.SUBMIT_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.SUBMIT_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RSM_RPT_PARM_aud.SUBMIT_DATE := nvl(:new.SUBMIT_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.REPORT_STATUS,'*') !=
       nvl(:new.REPORT_STATUS,'*')
    then
       RSM_RPT_PARM_aud.REPORT_STATUS:= nvl(:new.REPORT_STATUS,'*');
    end if;
    if nvl(:old.REPORT_FILE_NAME,'*') !=
       nvl(:new.REPORT_FILE_NAME,'*')
    then
       RSM_RPT_PARM_aud.REPORT_FILE_NAME:= nvl(:new.REPORT_FILE_NAME,'*');
    end if;
    if nvl(:old.PRINT_REQUEST_FLAG,'*') !=
       nvl(:new.PRINT_REQUEST_FLAG,'*')
    then
       RSM_RPT_PARM_aud.PRINT_REQUEST_FLAG:= nvl(:new.PRINT_REQUEST_FLAG,'*');
    end if;


    --
    insert into RSM_RPT_PARM_AUDIT
    (
	APPL_ID, USER_NAME, REPORT_NAME,
	RESULT_PARM_ID, REPORT_ID, SUBMIT_DATE,
	REPORT_STATUS, REPORT_FILE_NAME, PRINT_REQUEST_FLAG,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RSM_RPT_PARM_aud.APPL_ID, RSM_RPT_PARM_aud.USER_NAME, RSM_RPT_PARM_aud.REPORT_NAME,
	RSM_RPT_PARM_aud.RESULT_PARM_ID, RSM_RPT_PARM_aud.REPORT_ID, RSM_RPT_PARM_aud.SUBMIT_DATE,
	RSM_RPT_PARM_aud.REPORT_STATUS, RSM_RPT_PARM_aud.REPORT_FILE_NAME, RSM_RPT_PARM_aud.PRINT_REQUEST_FLAG,
	RSM_RPT_PARM_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
