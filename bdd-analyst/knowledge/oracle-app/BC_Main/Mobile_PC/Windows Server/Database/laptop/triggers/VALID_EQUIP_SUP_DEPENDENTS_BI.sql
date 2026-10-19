--------------------------------------------------------
--  DDL for Trigger VALID_EQUIP_SUP_DEPENDENTS_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "VALID_EQUIP_SUP_DEPENDENTS_BI" 
BEFORE INSERT
ON VALID_EQUIP_SUP_DEPENDENTS
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

    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('VALID_EQUIP_SUP_DEPENDENTS',:new.audit_key,'I',null);
  END IF;
end ;
/
ALTER TRIGGER "VALID_EQUIP_SUP_DEPENDENTS_BI" ENABLE;
