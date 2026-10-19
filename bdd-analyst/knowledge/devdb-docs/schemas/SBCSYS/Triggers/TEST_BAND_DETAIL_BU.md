---
tags:
  - trigger
  - SBCSYS
---
# TEST_BAND_DETAIL_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_BAND_DETAIL|TEST_BAND_DETAIL]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    TEST_BAND_DETAIL_aud	      TEST_BAND_DETAIL_AUDIT%rowtype;
begin
    TEST_BAND_DETAIL_aud.audit_key := :old.audit_key;
    TEST_BAND_DETAIL_aud.program_id := :new.program_id;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       TEST_BAND_DETAIL_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.COLL_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLL_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       TEST_BAND_DETAIL_aud.COLL_DATE := nvl(:new.COLL_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       TEST_BAND_DETAIL_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.TB_ID,'*') !=
       nvl(:new.TB_ID,'*')
    then
       TEST_BAND_DETAIL_aud.TB_ID:= nvl(:new.TB_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       TEST_BAND_DETAIL_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.TB_SEQ_NO,-1) !=
       nvl(:new.TB_SEQ_NO,-1)
    then
       TEST_BAND_DETAIL_aud.TB_SEQ_NO := nvl(:new.TB_SEQ_NO,-1);
    end if;
    if nvl(:old.TEST_CHAPTER_ID,'*') !=
       nvl(:new.TEST_CHAPTER_ID,'*')
    then
       TEST_BAND_DETAIL_aud.TEST_CHAPTER_ID:= nvl(:new.TEST_CHAPTER_ID,'*');
    end if;
    if nvl(:old.BAND_NAME,'*') !=
       nvl(:new.BAND_NAME,'*')
    then
       TEST_BAND_DETAIL_aud.BAND_NAME:= nvl(:new.BAND_NAME,'*');
    end if;
    if nvl(:old.TECH1_BAND_VAL,'*') !=
       nvl(:new.TECH1_BAND_VAL,'*')
    then
       TEST_BAND_DETAIL_aud.TECH1_BAND_VAL:= nvl(:new.TECH1_BAND_VAL,'*');
    end if;
    if nvl(:old.TECH2_BAND_VAL,'*') !=
       nvl(:new.TECH2_BAND_VAL,'*')
    then
       TEST_BAND_DETAIL_aud.TECH2_BAND_VAL:= nvl(:new.TECH2_BAND_VAL,'*');
    end if;
    if nvl(:old.SUPER_BAND_VAL,'*') !=
       nvl(:new.SUPER_BAND_VAL,'*')
    then
       TEST_BAND_DETAIL_aud.SUPER_BAND_VAL:= nvl(:new.SUPER_BAND_VAL,'*');
    end if;
    -- Added by Kishore on 06/12/2013. IM 9409
    if nvl(:old.BAND_SEQ,-1) !=
       nvl(:new.BAND_SEQ,-1)
    then
       TEST_BAND_DETAIL_aud.BAND_SEQ:= nvl(:new.BAND_SEQ,-1);
    end if;
	-- End of change

	/* -- Commented by Kishore on 06/12/2013. IM 9409
    if nvl(:old.BAND_SEQ,'*') !=
       nvl(:new.BAND_SEQ,'*')
    then
       TEST_BAND_DETAIL_aud.BAND_SEQ:= nvl(:new.BAND_SEQ,'*');
    end if;
	-- End of commented section */


    --
    insert into TEST_BAND_DETAIL_AUDIT
    (
	UNIT_ID, COLL_DATE, CHAPTER_ID,
	TB_ID, TEST_ID, TB_SEQ_NO,
	TEST_CHAPTER_ID, BAND_NAME, TECH1_BAND_VAL,
	TECH2_BAND_VAL, SUPER_BAND_VAL, PROGRAM_ID, BAND_SEQ,
	AUDIT_KEY, AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	TEST_BAND_DETAIL_aud.UNIT_ID, TEST_BAND_DETAIL_aud.COLL_DATE, TEST_BAND_DETAIL_aud.CHAPTER_ID,
	TEST_BAND_DETAIL_aud.TB_ID, TEST_BAND_DETAIL_aud.TEST_ID, TEST_BAND_DETAIL_aud.TB_SEQ_NO,
	TEST_BAND_DETAIL_aud.TEST_CHAPTER_ID, TEST_BAND_DETAIL_aud.BAND_NAME, TEST_BAND_DETAIL_aud.TECH1_BAND_VAL,
	TEST_BAND_DETAIL_aud.TECH2_BAND_VAL, TEST_BAND_DETAIL_aud.SUPER_BAND_VAL, TEST_BAND_DETAIL_aud.PROGRAM_ID, TEST_BAND_DETAIL_aud.BAND_SEQ,
	TEST_BAND_DETAIL_aud.AUDIT_KEY, sysdate, lt_user_session.get_userid
    );
end;
```
