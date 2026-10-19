---
tags:
  - trigger
  - SRVSYS
---
# CONSIGNEE_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/CONSIGNEE|CONSIGNEE]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
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
  (	:new.CONSIGNEE_ID,
	:new.CHAPTER_ID,
	:new.CUSTOMER_ID,
	:new.NAME,
	:new.SHORT_NAME,
	:new.ADDRESS_1,
	:new.ADDRESS_2,
	:new.ADDRESS_3,
	:new.CITY,
	:new.STATE,
	:new.COUNTRY,
	:new.ZIP,
	:new.PHONE_NO,
	:new.PHONE_EXT,
	:new.FAX_NO,
	:new.TELEX_NO,
	:new.EFF_DATE,
	:new.TERM_DATE,
	:new.LAST_MODIFIED_DATE,
	:new.AD_LOCATION,
	:new.ZONE,
	:new.AR_SHIP_TO_NO,
	:new.CP6_DEST,
	:new.OUT_OF_STATE,
	:new.AUDIT_KEY,
	'UPDATE',LT_USER_SESSION.GET_USERID,
	sysdate
  ) ;
end ;
```
