---
tags:
  - trigger
  - SBCSYS
---
# TEST_BATCH_CONTROLS_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BATCH_CONTROLS|TEST_BATCH_CONTROLS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    TEST_BATCH_CONTROLS_aud	      TEST_BATCH_CONTROLS_AUDIT%rowtype;
begin
    TEST_BATCH_CONTROLS_aud.audit_key := :old.audit_key;
    if nvl(:old.TB_ID,'*') !=
       nvl(:new.TB_ID,'*')
    then
       TEST_BATCH_CONTROLS_aud.TB_ID:= nvl(:new.TB_ID,'*');
    end if;
    if nvl(:old.TEST_CHAPTER_ID,'*') !=
       nvl(:new.TEST_CHAPTER_ID,'*')
    then
       TEST_BATCH_CONTROLS_aud.TEST_CHAPTER_ID:= nvl(:new.TEST_CHAPTER_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       TEST_BATCH_CONTROLS_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.CUT_OFF_VALUE,'*') !=
       nvl(:new.CUT_OFF_VALUE,'*')
    then
       TEST_BATCH_CONTROLS_aud.CUT_OFF_VALUE:= nvl(:new.CUT_OFF_VALUE,'*');
    end if;
    if nvl(:old.REF_RESULT,'*') !=
       nvl(:new.REF_RESULT,'*')
    then
       TEST_BATCH_CONTROLS_aud.REF_RESULT:= nvl(:new.REF_RESULT,'*');
    end if;
    if nvl(:old.REF_RATIO,'*') !=
       nvl(:new.REF_RATIO,'*')
    then
       TEST_BATCH_CONTROLS_aud.REF_RATIO:= nvl(:new.REF_RATIO,'*');
    end if;
    if nvl(:old.REF_CONTROL,'*') !=
       nvl(:new.REF_CONTROL,'*')
    then
       TEST_BATCH_CONTROLS_aud.REF_CONTROL:= nvl(:new.REF_CONTROL,'*');
    end if;
    if nvl(:old.REF_ABSORBANCE,'*') !=
       nvl(:new.REF_ABSORBANCE,'*')
    then
       TEST_BATCH_CONTROLS_aud.REF_ABSORBANCE:= nvl(:new.REF_ABSORBANCE,'*');
    end if;
    if nvl(:old.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BATCH_CONTROLS_aud.INSERT_DATS := nvl(:new.INSERT_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;


    --
    insert into TEST_BATCH_CONTROLS_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, TEST_ID,
	CUT_OFF_VALUE, REF_RESULT, REF_RATIO,
	REF_CONTROL, REF_ABSORBANCE, INSERT_DATS,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	TEST_BATCH_CONTROLS_aud.TB_ID, TEST_BATCH_CONTROLS_aud.TEST_CHAPTER_ID, TEST_BATCH_CONTROLS_aud.TEST_ID,
	TEST_BATCH_CONTROLS_aud.CUT_OFF_VALUE, TEST_BATCH_CONTROLS_aud.REF_RESULT, TEST_BATCH_CONTROLS_aud.REF_RATIO,
	TEST_BATCH_CONTROLS_aud.REF_CONTROL, TEST_BATCH_CONTROLS_aud.REF_ABSORBANCE, TEST_BATCH_CONTROLS_aud.INSERT_DATS,
	TEST_BATCH_CONTROLS_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
