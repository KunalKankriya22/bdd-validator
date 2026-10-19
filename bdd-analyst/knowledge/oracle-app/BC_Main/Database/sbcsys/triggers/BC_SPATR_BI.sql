--------------------------------------------------------
--  DDL for Trigger BC_SPATR_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "BC_SPATR_BI" 
 BEFORE INSERT
 ON BC_SPATR
 FOR EACH ROW
BEGIN
  IF :new.insert_user IS NULL THEN
     select lt_user_session.get_userid
     into :new.insert_user from dual ;
  END IF;
  IF :new.insert_dats IS NULL THEN
     :new.insert_dats := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT AUDIT_SEQ_LAB.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
/
ALTER TRIGGER "BC_SPATR_BI" ENABLE;
