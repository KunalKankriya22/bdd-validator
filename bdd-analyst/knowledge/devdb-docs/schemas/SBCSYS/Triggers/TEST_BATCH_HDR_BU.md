---
tags:
  - trigger
  - SBCSYS
---
# TEST_BATCH_HDR_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BATCH_HDR|TEST_BATCH_HDR]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    TEST_BATCH_HDR_aud	      TEST_BATCH_HDR_AUDIT%rowtype;
begin
    TEST_BATCH_HDR_aud.audit_key := :old.audit_key;
    if nvl(:old.TB_ID,'*') !=
       nvl(:new.TB_ID,'*')
    then
       TEST_BATCH_HDR_aud.TB_ID:= nvl(:new.TB_ID,'*');
    end if;
    if nvl(:old.TEST_CHAPTER_ID,'*') !=
       nvl(:new.TEST_CHAPTER_ID,'*')
    then
       TEST_BATCH_HDR_aud.TEST_CHAPTER_ID:= nvl(:new.TEST_CHAPTER_ID,'*');
    end if;
    if nvl(:old.GROUP_TEST_ID,'*') !=
       nvl(:new.GROUP_TEST_ID,'*')
    then
       TEST_BATCH_HDR_aud.GROUP_TEST_ID:= nvl(:new.GROUP_TEST_ID,'*');
    end if;
    if nvl(:old.FIRST_UNIT_ID,'*') !=
       nvl(:new.FIRST_UNIT_ID,'*')
    then
       TEST_BATCH_HDR_aud.FIRST_UNIT_ID:= nvl(:new.FIRST_UNIT_ID,'*');
    end if;
    if nvl(:old.LAST_UNIT_ID,'*') !=
       nvl(:new.LAST_UNIT_ID,'*')
    then
       TEST_BATCH_HDR_aud.LAST_UNIT_ID:= nvl(:new.LAST_UNIT_ID,'*');
    end if;
    if nvl(:old.REPEAT_FLAG,'*') !=
       nvl(:new.REPEAT_FLAG,'*')
    then
       TEST_BATCH_HDR_aud.REPEAT_FLAG:= nvl(:new.REPEAT_FLAG,'*');
    end if;
    if nvl(:old.START_WORK_NUMBER,-1) !=
       nvl(:new.START_WORK_NUMBER,-1)
    then
       TEST_BATCH_HDR_aud.START_WORK_NUMBER:= nvl(:new.START_WORK_NUMBER,-1);
    end if;
    if nvl(:old.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BATCH_HDR_aud.INSERT_DATS := nvl(:new.INSERT_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.USER_ID,'*') !=
       nvl(:new.USER_ID,'*')
    then
       TEST_BATCH_HDR_aud.USER_ID:= nvl(:new.USER_ID,'*');
    end if;


    --
    insert into TEST_BATCH_HDR_AUDIT
    (
	TB_ID, TEST_CHAPTER_ID, GROUP_TEST_ID,
	FIRST_UNIT_ID, LAST_UNIT_ID, REPEAT_FLAG,
	START_WORK_NUMBER, INSERT_DATS, USER_ID,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	TEST_BATCH_HDR_aud.TB_ID, TEST_BATCH_HDR_aud.TEST_CHAPTER_ID, TEST_BATCH_HDR_aud.GROUP_TEST_ID,
	TEST_BATCH_HDR_aud.FIRST_UNIT_ID, TEST_BATCH_HDR_aud.LAST_UNIT_ID, TEST_BATCH_HDR_aud.REPEAT_FLAG,
	TEST_BATCH_HDR_aud.START_WORK_NUMBER, TEST_BATCH_HDR_aud.INSERT_DATS, TEST_BATCH_HDR_aud.USER_ID,
	TEST_BATCH_HDR_aud.AUDIT_KEY, sysdate, Decode (substr(lt_user_session.get_userid,1,3),'OPS', substr(lt_user_session.get_userid,5,6), lt_user_session.get_userid)
    );
end;
```
