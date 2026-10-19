--------------------------------------------------------
--  DDL for Trigger VALID_PATHO_RED_CONFIG_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_PATHO_RED_CONFIG_BI" 
 BEFORE INSERT
 ON VALID_PATHO_REDUCTION_CONFIG
 FOR EACH ROW
BEGIN
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT AUDIT_SEQ_LAB.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
/
ALTER TRIGGER "VALID_PATHO_RED_CONFIG_BI" ENABLE;
