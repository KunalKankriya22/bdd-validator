---
tags:
  - trigger
  - SRVSYS
---
# SP_BU

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/SHIPPED_PRODUCTS|SHIPPED_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
   if nvl(:old.stock_state,'*') !=
      nvl(:new.stock_state,'*')
   then
       :new.program_id := nvl(:new.program_id,'MANUAL');
       insert into product_history
       (
	   UNIT_ID,
	   COLL_DATE,
	   CHAPTER_ID,
	   ALIQUOT,
	   PRODUCT_CODE,
	   blood_type,
	   shipped_to,
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
	   :new.blood_type,
	   :new.shipped_to,
	   :new.STOCK_STATE,
	   :new.INVENTORY_CLASS,
	   sysdate,
	   lt_user_session.get_userid,
	   :new.program_id
       );
   end if;
end;
```
