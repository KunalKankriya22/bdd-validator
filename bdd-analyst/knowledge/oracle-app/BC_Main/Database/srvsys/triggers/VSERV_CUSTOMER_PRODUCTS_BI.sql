--------------------------------------------------------
--  DDL for Trigger VSERV_CUSTOMER_PRODUCTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_CUSTOMER_PRODUCTS_BI" 
 BEFORE INSERT
 ON VSERV_CUSTOMER_PRODUCTS
 FOR EACH ROW
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
/
ALTER TRIGGER "VSERV_CUSTOMER_PRODUCTS_BI" ENABLE;
