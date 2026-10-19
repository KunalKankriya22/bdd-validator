---
tags:
  - trigger
  - SRVSYS
---
# SP_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/SHIPPED_PRODUCTS|SHIPPED_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
begin

  IF :new.audit_key IS NULL THEN
    select AUDIT_SEQ_LAB.nextval into :new.audit_key from dual;
  END IF;

  insert into product_history
    (UNIT_ID,
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
     program_id)
  values
    (:new.UNIT_ID,
     :new.COLL_DATE,
     :new.CHAPTER_ID,
     :new.ALIQUOT,
     :new.PRODUCT_CODE,
     :new.blood_type,
     :new.shipped_to,
     :new.stock_state,
     :new.INVENTORY_CLASS,
     sysdate,
     lt_user_session.get_userid,
     :new.program_id);

  emf_util.staging_insert('SHIPPED_PRODUCTS',
                          :NEW.audit_key,
                          :NEW.program_id,
                          'LAB',
                          'SP_BI',
                          'I');
end;

```
