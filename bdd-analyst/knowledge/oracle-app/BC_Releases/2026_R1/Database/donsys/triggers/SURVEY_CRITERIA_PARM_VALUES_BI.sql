--------------------------------------------------------
--  DDL for Trigger SURVEY_CRITERIA_PARM_VALUES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."SURVEY_CRITERIA_PARM_VALUES_BI" 
BEFORE INSERT
ON "SURVEY_CRITERIA_PARM_VALUES"
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
ALTER TRIGGER "DONSYS"."SURVEY_CRITERIA_PARM_VALUES_BI" ENABLE;
