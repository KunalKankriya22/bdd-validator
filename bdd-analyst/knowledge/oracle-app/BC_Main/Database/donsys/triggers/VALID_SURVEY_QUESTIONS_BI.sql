--------------------------------------------------------
--  DDL for Trigger VALID_SURVEY_QUESTIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_SURVEY_QUESTIONS_BI" 
BEFORE INSERT
ON VALID_SURVEY_QUESTIONS
FOR EACH ROW
BEGIN
  IF :new.program_id IS NULL THEN
    :new.program_id := 'MANUAL';
  END IF;
  IF :new.insert_user IS NULL THEN
     Select lt_user_session.get_userid into :new.insert_user
       from dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT AUDIT_SEQ.nextval INTO :new.audit_key FROM dual;
  END IF;
end ;
/
ALTER TRIGGER "DONSYS"."VALID_SURVEY_QUESTIONS_BI" ENABLE;
