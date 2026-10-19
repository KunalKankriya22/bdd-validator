--------------------------------------------------------
--  DDL for Trigger VALID_EMF_PROC_DEF_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_EMF_PROC_DEF_BI" 
BEFORE INSERT
ON VALID_EMF_PROC_DEF
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
ALTER TRIGGER "VALID_EMF_PROC_DEF_BI" ENABLE;
