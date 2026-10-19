---
tags:
  - trigger
  - SBCSYS
---
# BATCH_INPUTS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/BATCH_INPUTS|BATCH_INPUTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin

	insert into BATCH_INPUTS_audit
    (
	BATCH_ID, CHAPTER_ID, CONTRACT_ID,
	CONTRACT_SUFFIX, NUMBER_OF_UNITS, PRODUCT_TYPE,
	CARTON_COUNT, AIRWAY_BILL_NO,
	SHIPPED_DATE, RECEIVED_DATE,
	MIN_TEMP, MAX_TEMP,
	QC_DATE,CHECKIN_USER_ID,
	INSERT_DATS, NOTE_ID, RESULTS_QC_DATE,
	RESULTS_QC_USER, PROFILE_SEQ_NO, AUDIT_KEY,
	audit_insert_dats, audit_insert_user
    )
    values
    (
	:old.BATCH_ID, :old.CHAPTER_ID, :old.CONTRACT_ID,
	:old.CONTRACT_SUFFIX, :old.NUMBER_OF_UNITS, :old.PRODUCT_TYPE,
	:old.CARTON_COUNT, :old.AIRWAY_BILL_NO,
	:old.SHIPPED_DATE, :old.RECEIVED_DATE,
	:old.MIN_TEMP, :old.MAX_TEMP,
	:old.QC_DATE,:old.CHECKIN_USER_ID,
	:old.INSERT_DATS, :old.NOTE_ID,:old.RESULTS_QC_DATE,
	:old.RESULTS_QC_USER, :old.PROFILE_SEQ_NO, :old.AUDIT_KEY,
	sysdate, lt_user_session.get_userid
    );
end;
```
