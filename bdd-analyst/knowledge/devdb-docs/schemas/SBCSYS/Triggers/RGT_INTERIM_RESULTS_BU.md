---
tags:
  - trigger
  - SBCSYS
---
# RGT_INTERIM_RESULTS_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/RGT_INTERIM_RESULTS|RGT_INTERIM_RESULTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    RGT_INTERIM_RESULTS_aud	      RGT_INTERIM_RESULTS_AUDIT%rowtype;
begin
    RGT_INTERIM_RESULTS_aud.audit_key := :old.audit_key;
    RGT_INTERIM_RESULTS_aud.program_id := :new.program_id;
    if nvl(:old.CHAPTER_ID,'*') !=
       nvl(:new.CHAPTER_ID,'*')
    then
       RGT_INTERIM_RESULTS_aud.CHAPTER_ID:= nvl(:new.CHAPTER_ID,'*');
    end if;
    if nvl(:old.CONTRACT_ID,'*') !=
       nvl(:new.CONTRACT_ID,'*')
    then
       RGT_INTERIM_RESULTS_aud.CONTRACT_ID:= nvl(:new.CONTRACT_ID,'*');
    end if;
    if nvl(:old.UNIT_ID,'*') !=
       nvl(:new.UNIT_ID,'*')
    then
       RGT_INTERIM_RESULTS_aud.UNIT_ID:= nvl(:new.UNIT_ID,'*');
    end if;
    if nvl(:old.BATCH_ID,'*') !=
       nvl(:new.BATCH_ID,'*')
    then
       RGT_INTERIM_RESULTS_aud.BATCH_ID:= nvl(:new.BATCH_ID,'*');
    end if;
    if nvl(:old.TEST_ID,'*') !=
       nvl(:new.TEST_ID,'*')
    then
       RGT_INTERIM_RESULTS_aud.TEST_ID:= nvl(:new.TEST_ID,'*');
    end if;
    if nvl(:old.TEST_SEQ_NO,-1) !=
       nvl(:new.TEST_SEQ_NO,-1)
    then
       RGT_INTERIM_RESULTS_aud.TEST_SEQ_NO := nvl(:new.TEST_SEQ_NO,-1);
    end if;
    if nvl(:old.RESULT_CODE,'*') !=
       nvl(:new.RESULT_CODE,'*')
    then
       RGT_INTERIM_RESULTS_aud.RESULT_CODE:= nvl(:new.RESULT_CODE,'*');
    end if;
    if nvl(:old.INSERT_USER_ID,'*') !=
       nvl(:new.INSERT_USER_ID,'*')
    then
       RGT_INTERIM_RESULTS_aud.INSERT_USER_ID:= nvl(:new.INSERT_USER_ID,'*');
    end if;
    if nvl(:old.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.INSERT_DATS,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_INTERIM_RESULTS_aud.INSERT_DATS:= nvl(:new.INSERT_DATS,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
   if nvl(:old.EXTRACT_FLAG,'*') !=
       nvl(:new.EXTRACT_FLAG,'*')
    then
       RGT_INTERIM_RESULTS_aud.EXTRACT_FLAG := nvl(:new.EXTRACT_FLAG,'*');
    end if;
    if nvl(:old.FIRST_EXTRACT_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.FIRST_EXTRACT_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_INTERIM_RESULTS_aud.FIRST_EXTRACT_DATE:= nvl(:new.FIRST_EXTRACT_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.LAST_EXTRACT_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.LAST_EXTRACT_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_INTERIM_RESULTS_aud.LAST_EXTRACT_DATE:= nvl(:new.LAST_EXTRACT_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RESULT_FLAG,'*') !=
       nvl(:new.RESULT_FLAG,'*')
    then
       RGT_INTERIM_RESULTS_aud.RESULT_FLAG := nvl(:new.RESULT_FLAG,'*');
    end if;
    if nvl(:old.COLL_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.COLL_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_INTERIM_RESULTS_aud.COLL_DATE:= nvl(:new.COLL_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RESULTS_QC_DATE,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.RESULTS_QC_DATE,to_date('01-JAN-33','DD-MON-YY'))
    then
       RGT_INTERIM_RESULTS_aud.RESULTS_QC_DATE:= nvl(:new.RESULTS_QC_DATE,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.RESULTS_QC_USER,'*') !=
       nvl(:new.RESULTS_QC_USER,'*')
    then
       RGT_INTERIM_RESULTS_aud.RESULTS_QC_USER := nvl(:new.RESULTS_QC_USER,'*');
    end if;

    --
    insert into RGT_INTERIM_RESULTS_AUDIT
    (
	CHAPTER_ID, CONTRACT_ID, UNIT_ID,
	BATCH_ID, TEST_ID, TEST_SEQ_NO,
	RESULT_CODE, INSERT_USER_ID, INSERT_DATS,
	EXTRACT_FLAG, FIRST_EXTRACT_DATE, LAST_EXTRACT_DATE,
	RESULT_FLAG, COLL_DATE, RESULTS_QC_DATE,
	RESULTS_QC_USER, AUDIT_KEY,PROGRAM_ID,
	AUDIT_INSERT_DATS, AUDIT_INSERT_USER
    )
    values
    (
	RGT_INTERIM_RESULTS_aud.CHAPTER_ID, RGT_INTERIM_RESULTS_aud.CONTRACT_ID, RGT_INTERIM_RESULTS_aud.UNIT_ID,
	RGT_INTERIM_RESULTS_aud.BATCH_ID, RGT_INTERIM_RESULTS_aud.TEST_ID, RGT_INTERIM_RESULTS_aud.TEST_SEQ_NO,
	RGT_INTERIM_RESULTS_aud.RESULT_CODE, RGT_INTERIM_RESULTS_aud.INSERT_USER_ID, RGT_INTERIM_RESULTS_aud.INSERT_DATS,
	RGT_INTERIM_RESULTS_aud.EXTRACT_FLAG, RGT_INTERIM_RESULTS_aud.FIRST_EXTRACT_DATE, RGT_INTERIM_RESULTS_aud.LAST_EXTRACT_DATE,
	RGT_INTERIM_RESULTS_aud.RESULT_FLAG, RGT_INTERIM_RESULTS_aud.COLL_DATE, RGT_INTERIM_RESULTS_aud.RESULTS_QC_DATE,
	RGT_INTERIM_RESULTS_aud.RESULTS_QC_USER, RGT_INTERIM_RESULTS_aud.AUDIT_KEY, RGT_INTERIM_RESULTS_aud.PROGRAM_ID,
	sysdate, lt_user_session.get_userid
    );
end;
```
