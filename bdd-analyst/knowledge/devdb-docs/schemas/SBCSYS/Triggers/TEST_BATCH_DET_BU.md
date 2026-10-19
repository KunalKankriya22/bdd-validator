---
tags:
  - trigger
  - SBCSYS
---
# TEST_BATCH_DET_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BATCH_DET|TEST_BATCH_DET]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    TEST_BATCH_DET_aud	      TEST_BATCH_DET_AUDIT%rowtype;
begin
    TEST_BATCH_DET_aud.audit_key := :old.audit_key;
    if nvl(:old.TB_ID,'*') !=
       nvl(:new.TB_ID,'*')
    then
       TEST_BATCH_DET_aud.TB_ID:= nvl(:new.TB_ID,'*');
    end if;
    if nvl(:old.TEST_CHAPTER_ID,'*') !=
       nvl(:new.TEST_CHAPTER_ID,'*')
    then
       TEST_BATCH_DET_aud.TEST_CHAPTER_ID:= nvl(:new.TEST_CHAPTER_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       TEST_BATCH_DET_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.TEST_KIT_ID,'*') !=
       nvl(:new.TEST_KIT_ID,'*')
    then
       TEST_BATCH_DET_aud.TEST_KIT_ID:= nvl(:new.TEST_KIT_ID,'*');
    end if;
    if nvl(:old.TEST_TYPE,'*') !=
       nvl(:new.TEST_TYPE,'*')
    then
       TEST_BATCH_DET_aud.TEST_TYPE:= nvl(:new.TEST_TYPE,'*');
    end if;
    if nvl(:old.CUT_OFF_VALUE,'*') !=
       nvl(:new.CUT_OFF_VALUE,'*')
    then
       TEST_BATCH_DET_aud.CUT_OFF_VALUE:= nvl(:new.CUT_OFF_VALUE,'*');
    end if;
    if nvl(:old.REF_RESULT,'*') !=
       nvl(:new.REF_RESULT,'*')
    then
       TEST_BATCH_DET_aud.REF_RESULT:= nvl(:new.REF_RESULT,'*');
    end if;
    if nvl(:old.REF_RATIO,'*') !=
       nvl(:new.REF_RATIO,'*')
    then
       TEST_BATCH_DET_aud.REF_RATIO:= nvl(:new.REF_RATIO,'*');
    end if;
   if nvl(:old.REF_CONTROL,'*') !=
       nvl(:new.REF_CONTROL,'*')
    then
       TEST_BATCH_DET_aud.REF_CONTROL:= nvl(:new.REF_CONTROL,'*');
    end if;
    if nvl(:old.REF_ABSORBANCE,'*') !=
       nvl(:new.REF_ABSORBANCE,'*')
    then
       TEST_BATCH_DET_aud.REF_ABSORBANCE:= nvl(:new.REF_ABSORBANCE,'*');
    end if;
    if nvl(:old.STATION_NO,'*') !=
       nvl(:new.STATION_NO,'*')
    then
       TEST_BATCH_DET_aud.STATION_NO:= nvl(:new.STATION_NO,'*');
    end if;
    if nvl(:old.RECONCILE_FLAG,'*') !=
       nvl(:new.RECONCILE_FLAG,'*')
    then
       TEST_BATCH_DET_aud.RECONCILE_FLAG:= nvl(:new.RECONCILE_FLAG,'*');
    end if;
    if nvl(:old.RECONCILE_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.RECONCILE_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BATCH_DET_aud.RECONCILE_DATE := nvl(:new.RECONCILE_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RECONCILE_USER_ID,'*') !=
       nvl(:new.RECONCILE_USER_ID,'*')
    then
       TEST_BATCH_DET_aud.RECONCILE_USER_ID:= nvl(:new.RECONCILE_USER_ID,'*');
    end if;
    if nvl(:old.TESTING_LAB_CODE,'*') !=
       nvl(:new.TESTING_LAB_CODE,'*')
    then
       TEST_BATCH_DET_aud.TESTING_LAB_CODE:= nvl(:new.TESTING_LAB_CODE,'*');
    end if;
    if nvl(:old.REVIEW_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.REVIEW_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BATCH_DET_aud.REVIEW_DATE := nvl(:new.REVIEW_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.PARM_TYPE,'*') !=
       nvl(:new.PARM_TYPE,'*')
    then
       TEST_BATCH_DET_aud.PARM_TYPE:= nvl(:new.PARM_TYPE,'*');
    end if;
    if nvl(:old.PARM_CHECK_FLAG,'*') !=
       nvl(:new.PARM_CHECK_FLAG,'*')
    then
       TEST_BATCH_DET_aud.PARM_CHECK_FLAG:= nvl(:new.PARM_CHECK_FLAG,'*');
    end if;
    if nvl(:old.PARM_CHECK_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.PARM_CHECK_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BATCH_DET_aud.PARM_CHECK_DATE := nvl(:new.PARM_CHECK_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.PARM_CHECK_USER_ID,'*') !=
       nvl(:new.PARM_CHECK_USER_ID,'*')
    then
       TEST_BATCH_DET_aud.PARM_CHECK_USER_ID:= nvl(:new.PARM_CHECK_USER_ID,'*');
    end if;
    if nvl(:old.RUN_ID,'*') !=
       nvl(:new.RUN_ID,'*')
    then
       TEST_BATCH_DET_aud.RUN_ID:= nvl(:new.RUN_ID,'*');
    end if;
    if nvl(:old.REVIEW_USER_ID,'*') !=
       nvl(:new.REVIEW_USER_ID,'*')
    then
       TEST_BATCH_DET_aud.REVIEW_USER_ID:= nvl(:new.REVIEW_USER_ID,'*');
    end if;
    if nvl(:old.KIT_LOT_NUMBER,'*') !=
       nvl(:new.KIT_LOT_NUMBER,'*')
    then
       TEST_BATCH_DET_aud.KIT_LOT_NUMBER:= nvl(:new.KIT_LOT_NUMBER,'*');
    end if;


    --
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
	TEST_BATCH_DET_aud.TB_ID, TEST_BATCH_DET_aud.TEST_CHAPTER_ID, TEST_BATCH_DET_aud.TEST_ID,
	TEST_BATCH_DET_aud.TEST_KIT_ID, TEST_BATCH_DET_aud.TEST_TYPE, TEST_BATCH_DET_aud.CUT_OFF_VALUE,
	TEST_BATCH_DET_aud.REF_RESULT, TEST_BATCH_DET_aud.REF_RATIO, TEST_BATCH_DET_aud.REF_CONTROL,
	TEST_BATCH_DET_aud.REF_ABSORBANCE, TEST_BATCH_DET_aud.STATION_NO, TEST_BATCH_DET_aud.RECONCILE_FLAG,
	TEST_BATCH_DET_aud.RECONCILE_DATE, TEST_BATCH_DET_aud.RECONCILE_USER_ID, TEST_BATCH_DET_aud.TESTING_LAB_CODE,
	TEST_BATCH_DET_aud.REVIEW_DATE, TEST_BATCH_DET_aud.PARM_TYPE, TEST_BATCH_DET_aud.PARM_CHECK_FLAG,
	TEST_BATCH_DET_aud.PARM_CHECK_DATE, TEST_BATCH_DET_aud.PARM_CHECK_USER_ID, TEST_BATCH_DET_aud.RUN_ID,
	TEST_BATCH_DET_aud.REVIEW_USER_ID, TEST_BATCH_DET_aud.KIT_LOT_NUMBER,
	TEST_BATCH_DET_aud.AUDIT_KEY, sysdate, Decode (substr(lt_user_session.get_userid,1,3),'OPS', substr(lt_user_session.get_userid,5,6), lt_user_session.get_userid)
    );
end;
```
