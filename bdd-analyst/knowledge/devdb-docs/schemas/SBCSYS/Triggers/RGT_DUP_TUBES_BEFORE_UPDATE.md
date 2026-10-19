---
tags:
  - trigger
  - SBCSYS
---
# RGT_DUP_TUBES_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_DUP_TUBES|RGT_DUP_TUBES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    RGT_DUP_TUBES_aud	      RGT_DUP_TUBES_AUDIT%rowtype;
begin
    RGT_DUP_TUBES_aud.audit_key := :old.audit_key;
    RGT_DUP_TUBES_aud.program_id := :new.program_id;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_DUP_TUBES_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_DUP_TUBES_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.CBC_UNIT_ID,'*') !=
       nvl(:new.CBC_UNIT_ID,'*')
    then
       RGT_DUP_TUBES_aud.CBC_UNIT_ID:= nvl(:new.CBC_UNIT_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_DUP_TUBES_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.TUBE_CHECK_IN_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.TUBE_CHECK_IN_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_DUP_TUBES_aud.TUBE_CHECK_IN_DATE:= nvl(:new.TUBE_CHECK_IN_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
   if nvl(:old.TUBE_TYPE,'*') !=
       nvl(:new.TUBE_TYPE,'*')
    then
       RGT_DUP_TUBES_aud.TUBE_TYPE := nvl(:new.TUBE_TYPE,'*');
    end if;
    if nvl(:old.REASON_CODE,'*') !=
       nvl(:new.REASON_CODE,'*')
    then
       RGT_DUP_TUBES_aud.REASON_CODE := nvl(:new.REASON_CODE,'*');
    end if;

    --
    insert into RGT_DUP_TUBES_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, CBC_UNIT_ID,
	UNIT_ID, TUBE_CHECK_IN_DATE, TUBE_TYPE,
	REASON_CODE, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_DUP_TUBES_aud.CHAPTER_ID, RGT_DUP_TUBES_aud.CONTRACT_ID, RGT_DUP_TUBES_aud.CBC_UNIT_ID,
	RGT_DUP_TUBES_aud.UNIT_ID, RGT_DUP_TUBES_aud.TUBE_CHECK_IN_DATE, RGT_DUP_TUBES_aud.TUBE_TYPE,
	RGT_DUP_TUBES_aud.REASON_CODE, RGT_DUP_TUBES_aud.AUDIT_KEY,	RGT_DUP_TUBES_aud.PROGRAM_ID,
	sysdate, lt_user_session.get_userid
    );
end;
```
