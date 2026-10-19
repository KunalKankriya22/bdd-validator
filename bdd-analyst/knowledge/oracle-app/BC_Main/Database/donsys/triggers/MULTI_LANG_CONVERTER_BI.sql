--------------------------------------------------------
--  DDL for Trigger MULTI_LANG_CONVERTER_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."MULTI_LANG_CONVERTER_BI" 
BEFORE INSERT
ON MULTI_LANG_CONVERTER
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
    SELECT audit_seq.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
/
ALTER TRIGGER "DONSYS"."MULTI_LANG_CONVERTER_BI" ENABLE;
