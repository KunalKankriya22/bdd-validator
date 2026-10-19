--------------------------------------------------------
--  DDL for Trigger EMF_SOURCE_PROCESS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "EMF_SOURCE_PROCESS_BI" 
BEFORE INSERT
ON EMF_SOURCE_PROCESS
FOR EACH ROW
BEGIN
  IF :new.insert_user IS NULL THEN
     Select lt_user_session.get_userid into :new.insert_user
       from dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT audit_seq.nextval INTO :new.audit_key FROM dual;
  END IF;
end ;
/
ALTER TRIGGER "EMF_SOURCE_PROCESS_BI" ENABLE;
