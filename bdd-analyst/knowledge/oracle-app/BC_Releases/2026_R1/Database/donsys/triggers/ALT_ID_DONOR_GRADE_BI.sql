--------------------------------------------------------
--  DDL for Trigger ALT_ID_DONOR_GRADE_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."ALT_ID_DONOR_GRADE_BI" 
 BEFORE INSERT
 ON ALT_ID_DONOR_GRADE
 FOR EACH ROW
BEGIN
  IF :new.insert_user IS NULL THEN
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
  END IF;
  IF :new.EFF_DATE IS NULL THEN
     :new.EFF_DATE := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT audit_seq.nextval INTO :new.audit_key FROM dual;
  END IF;
END;
/
ALTER TRIGGER "DONSYS"."ALT_ID_DONOR_GRADE_BI" ENABLE;
