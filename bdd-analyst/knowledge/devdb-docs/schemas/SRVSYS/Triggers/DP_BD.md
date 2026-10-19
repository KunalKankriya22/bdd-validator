---
tags:
  - trigger
  - SRVSYS
---
# DP_BD

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/DISCARD_PRODUCTS|DISCARD_PRODUCTS]]
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
	blood_type,
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
	:old.blood_type,
	'DI',
	'DI',
	sysdate,
	lt_user_session.get_userid,
	:old.program_id
    );
    insert into discard_products_audit
    (
      pick_slip_id,
      CHAPTER_ID,
      UNIT_ID,
      COLL_DATE,
      ALIQUOT,
      PRODUCT_CODE,
      BLOOD_TYPE,
      product_price,
      product_status,
      box_id,
      EXP_DATE,
      discard_type,
      LOCATION_ID,
      PRODUCT_TYPE,
      insert_date,
      reject_reason,
      AUDIT_KEY,
      PROGRAM_ID,
      audit_insert_user,
      audit_insert_date
     )
     values
     (
      :old.pick_slip_id,
      :old.CHAPTER_ID,
      :old.UNIT_ID,
      :old.COLL_DATE,
      :old.ALIQUOT,
      :old.PRODUCT_CODE,
      :old.BLOOD_TYPE,
      :old.product_price,
      :old.product_status,
      :old.box_id,
      :old.EXP_DATE,
      :old.discard_type,
      :old.LOCATION_ID,
      :old.PRODUCT_TYPE,
      :old.insert_date,
      :old.reject_reason,
      :old.AUDIT_KEY,
      :old.PROGRAM_ID,
      decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6), substr(lt_user_session.get_userid,1,6)),
      sysdate
     );
end;
```
