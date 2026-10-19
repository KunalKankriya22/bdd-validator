---
tags:
  - trigger
  - SRVSYS
---
# CONSIGNEE_BD

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/CONSIGNEE|CONSIGNEE]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
  insert into CONSIGNEE_AUDIT
  (	CONSIGNEE_ID,
	CHAPTER_ID,
	CUSTOMER_ID,
	NAME,
	SHORT_NAME,
	ADDRESS_1,
	ADDRESS_2,
	ADDRESS_3,
	CITY,
	STATE,
	COUNTRY,
	ZIP,
	PHONE_NO,
	PHONE_EXT,
	FAX_NO,
	TELEX_NO,
	EFF_DATE,
	TERM_DATE,
	LAST_MODIFIED_DATE,
	AD_LOCATION,
	ZONE,
	AR_SHIP_TO_NO,
	CP6_DEST,
	OUT_OF_STATE,
	AUDIT_KEY,
	PROGRAM_ID,
	AUDIT_INSERT_USER,
	AUDIT_INSERT_DATE
  )
    values
  (	:old.CONSIGNEE_ID,
	:old.CHAPTER_ID,
	:old.CUSTOMER_ID,
	:old.NAME,
	:old.SHORT_NAME,
	:old.ADDRESS_1,
	:old.ADDRESS_2,
	:old.ADDRESS_3,
	:old.CITY,
	:old.STATE,
	:old.COUNTRY,
	:old.ZIP,
	:old.PHONE_NO,
	:old.PHONE_EXT,
	:old.FAX_NO,
	:old.TELEX_NO,
	:old.EFF_DATE,
	:old.TERM_DATE,
	:old.LAST_MODIFIED_DATE,
	:old.AD_LOCATION,
	:old.ZONE,
	:old.AR_SHIP_TO_NO,
	:old.CP6_DEST,
	:old.OUT_OF_STATE,
	:old.AUDIT_KEY,
	'DELETE',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
end ;
```
