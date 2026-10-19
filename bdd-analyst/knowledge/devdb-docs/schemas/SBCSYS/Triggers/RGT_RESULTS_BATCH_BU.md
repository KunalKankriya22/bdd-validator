---
tags:
  - trigger
  - SBCSYS
---
# RGT_RESULTS_BATCH_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_RESULTS_BATCH|RGT_RESULTS_BATCH]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    RGT_RESULTS_BATCH_aud	      RGT_RESULTS_BATCH_AUDIT%rowtype;
begin
    RGT_RESULTS_BATCH_aud.audit_key := :old.audit_key;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_RESULTS_BATCH_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.RESULT_BATCH_ID,'*') !=
       nvl(:new.RESULT_BATCH_ID,'*')
    then
       RGT_RESULTS_BATCH_aud.RESULT_BATCH_ID:= nvl(:new.RESULT_BATCH_ID,'*');
    end if;
    if nvl(:old.PARM_ID,'*') !=
       nvl(:new.PARM_ID,'*')
    then
       RGT_RESULTS_BATCH_aud.PARM_ID:= nvl(:new.PARM_ID,'*');
    end if;
    if nvl(:old.EXTRACT_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.EXTRACT_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_RESULTS_BATCH_aud.EXTRACT_DATE := nvl(:new.EXTRACT_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.EXTRACT_USER_ID,'*') !=
       nvl(:new.EXTRACT_USER_ID,'*')
    then
       RGT_RESULTS_BATCH_aud.EXTRACT_USER_ID:= nvl(:new.EXTRACT_USER_ID,'*');
    end if;
    if nvl(:old.BATCH_STATUS_FLAG,'*') !=
       nvl(:new.BATCH_STATUS_FLAG,'*')
    then
       RGT_RESULTS_BATCH_aud.BATCH_STATUS_FLAG:= nvl(:new.BATCH_STATUS_FLAG,'*');
    end if;
    if nvl(:old.UNIT_COUNT,-1) !=
       nvl(:new.UNIT_COUNT,-1)
    then
       RGT_RESULTS_BATCH_aud.UNIT_COUNT := nvl(:new.UNIT_COUNT,-1);
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_RESULTS_BATCH_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.UNDER_EXTRACT_FLAG,'*') !=
       nvl(:new.UNDER_EXTRACT_FLAG,'*')
    then
       RGT_RESULTS_BATCH_aud.UNDER_EXTRACT_FLAG:= nvl(:new.UNDER_EXTRACT_FLAG,'*');
    end if;
    if nvl(:old.RESULT_TYPE,'*') !=
       nvl(:new.RESULT_TYPE,'*')
    then
       RGT_RESULTS_BATCH_aud.RESULT_TYPE:= nvl(:new.RESULT_TYPE,'*');
    end if;

    --
    insert into RGT_RESULTS_BATCH_AUDIT
    (
	CHAPTER_ID, RESULT_BATCH_ID, PARM_ID,
	EXTRACT_DATE, EXTRACT_USER_ID, BATCH_STATUS_FLAG,
	UNIT_COUNT, CONTRACT_ID, UNDER_EXTRACT_FLAG,
	RESULT_TYPE,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_RESULTS_BATCH_aud.CHAPTER_ID, RGT_RESULTS_BATCH_aud.RESULT_BATCH_ID, RGT_RESULTS_BATCH_aud.PARM_ID,
	RGT_RESULTS_BATCH_aud.EXTRACT_DATE, RGT_RESULTS_BATCH_aud.EXTRACT_USER_ID, RGT_RESULTS_BATCH_aud.BATCH_STATUS_FLAG,
	RGT_RESULTS_BATCH_aud.UNIT_COUNT, RGT_RESULTS_BATCH_aud.CONTRACT_ID, RGT_RESULTS_BATCH_aud.UNDER_EXTRACT_FLAG,
	RGT_RESULTS_BATCH_aud.RESULT_TYPE,
	RGT_RESULTS_BATCH_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
