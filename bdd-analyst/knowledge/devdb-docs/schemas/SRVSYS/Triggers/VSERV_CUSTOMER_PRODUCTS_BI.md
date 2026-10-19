---
tags:
  - trigger
  - SRVSYS
---
# VSERV_CUSTOMER_PRODUCTS_BI

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_CUSTOMER_PRODUCTS|VSERV_CUSTOMER_PRODUCTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
   if :new.insert_user is null then
     select LT_USER_SESSION.GET_USERID
     into :new.insert_user from dual ;
  end if;
  if :new.insert_date is null then
    :new.insert_date := sysdate ;
  end if;
  if :new.audit_key is null then
    select AUDIT_SEQ_LAB.nextval into :new.audit_key from dual;
  end if;
end ;
```
