---
tags:
  - trigger
  - SRVSYS
---
# SP_BD

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/SHIPPED_PRODUCTS|SHIPPED_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into product_history
    (
	UNIT_ID,
	COLL_DATE,
	CHAPTER_ID,
	ALIQUOT,
	PRODUCT_CODE,
	STATUS_IND,
	INVENTORY_CLASS,
	FROM_DATE,
	USER_ID,
	program_id
    )
    values
    (
	:old.UNIT_ID,
	:old.COLL_DATE,
	:old.CHAPTER_ID,
	:old.ALIQUOT,
	:old.PRODUCT_CODE,
	'CA',
	:old.INVENTORY_CLASS,
	sysdate,
	lt_user_session.get_userid,
	'OPICHTRF'
    );
end;
```
