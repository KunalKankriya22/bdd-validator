---
tags:
  - trigger
  - SBCSYS
---
# TEST_BATCH_DET_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BATCH_DET|TEST_BATCH_DET]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into TEST_BATCH_DET_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, TEST_ID,
	TEST_KIT_ID, TEST_TYPE, CUT_OFF_VALUE,
	REF_RESULT, REF_RATIO, REF_CONTROL,
	REF_ABSORBANCE, STATION_NO, RECONCILE_FLAG,
	RECONCILE_DATE, RECONCILE_USER_ID, TESTING_LAB_CODE,
	REVIEW_DATE, PARM_TYPE, PARM_CHECK_FLAG,
	PARM_CHECK_DATE, PARM_CHECK_USER_ID, RUN_ID,
	REVIEW_USER_ID, KIT_LOT_NUMBER,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	:old.TB_ID, :old.TEST_CHAPTER_ID, :old.TEST_ID,
	:old.TEST_KIT_ID, :old.TEST_TYPE, :old.CUT_OFF_VALUE,
	:old.REF_RESULT, :old.REF_RATIO, :old.REF_CONTROL,
	:old.REF_ABSORBANCE, :old.STATION_NO, :old.RECONCILE_FLAG,
	:old.RECONCILE_DATE, :old.RECONCILE_USER_ID, :old.TESTING_LAB_CODE,
	:old.REVIEW_DATE, :old.PARM_TYPE, :old.PARM_CHECK_FLAG,
	:old.PARM_CHECK_DATE, :old.PARM_CHECK_USER_ID, :old.RUN_ID,
	:old.REVIEW_USER_ID, :old.KIT_LOT_NUMBER,
	:old.AUDIT_KEY, sysdate, Decode (substr(lt_user_session.get_userid,1,3),'OPS', substr(lt_user_session.get_userid,5,6), lt_user_session.get_userid)
    );
end;
```
