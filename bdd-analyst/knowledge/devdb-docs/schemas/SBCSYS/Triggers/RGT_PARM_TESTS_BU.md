---
tags:
  - trigger
  - SBCSYS
---
# RGT_PARM_TESTS_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_PARM_TESTS|RGT_PARM_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    RGT_PARM_TESTS_aud	      RGT_PARM_TESTS_AUDIT%rowtype;
begin
    RGT_PARM_TESTS_aud.audit_key := :old.audit_key;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_PARM_TESTS_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_PARM_TESTS_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       RGT_PARM_TESTS_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.PARM_ID,'*') !=
       nvl(:new.PARM_ID,'*')
    then
       RGT_PARM_TESTS_aud.PARM_ID:= nvl(:new.PARM_ID,'*');
    end if;

    --
    insert into RGT_PARM_TESTS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, TEST_ID,
	PARM_ID, AUDIT_KEY,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_PARM_TESTS_aud.CHAPTER_ID, RGT_PARM_TESTS_aud.CONTRACT_ID, RGT_PARM_TESTS_aud.TEST_ID,
	RGT_PARM_TESTS_aud.PARM_ID, RGT_PARM_TESTS_aud.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
```
