--------------------------------------------------------
--  DDL for Trigger LBL_PLASMA_TESTS_CONFIG_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LBL_PLASMA_TESTS_CONFIG_BI" 
BEFORE INSERT
ON LBL_PLASMA_TESTS_CONFIG
FOR EACH ROW
BEGIN
  IF :new.insert_user IS NULL THEN
     SELECT decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
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
ALTER TRIGGER "LBL_PLASMA_TESTS_CONFIG_BI" ENABLE;
