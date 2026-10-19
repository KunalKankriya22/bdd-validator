--------------------------------------------------------
--  DDL for Trigger VALID_BARCODE_CONFIG_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_BARCODE_CONFIG_BI" 
BEFORE INSERT
ON VALID_BARCODE_CONFIG
FOR EACH ROW
BEGIN
  IF :new.insert_user IS NULL THEN
     Select lt_user_session.get_userid into :new.insert_user
       from dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;
end ;
/
ALTER TRIGGER "DONSYS"."VALID_BARCODE_CONFIG_BI" ENABLE;
