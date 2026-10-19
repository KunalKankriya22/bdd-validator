--------------------------------------------------------
--  DDL for Trigger LBL_PRODUCT_TYPE_CONFIG_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LBL_PRODUCT_TYPE_CONFIG_BI" 
BEFORE INSERT
ON LBL_PRODUCT_TYPE_CONFIG
FOR EACH ROW
BEGIN
  IF :new.insert_user IS NULL THEN
     SELECT lt_user_session.get_userid
     INTO :new.insert_user FROM dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
    :new.insert_date := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
    SELECT AUDIT_SEQ_LAB.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
/
ALTER TRIGGER "LBL_PRODUCT_TYPE_CONFIG_BI" ENABLE;
