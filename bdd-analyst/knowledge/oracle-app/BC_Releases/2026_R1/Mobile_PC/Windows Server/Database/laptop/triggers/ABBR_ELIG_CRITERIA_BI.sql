--------------------------------------------------------
--  DDL for Trigger ABBR_ELIG_CRITERIA_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "ABBR_ELIG_CRITERIA_BI" 
 BEFORE INSERT
 ON ABBR_ELIG_CRITERIA
 FOR EACH ROW
BEGIN
  IF :new.insert_user IS NULL THEN
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;
  IF :new.audit_key IS NULL THEN
     SELECT audit_seq.nextval INTO :new.audit_key FROM dual;
  END IF;
/*---- Added by Seshu -- for laptop data extract- to add in the monitoring table */

INSERT INTO download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
               values('ABBR_ELIG_CRITERIA',:new.audit_key,'I',null);

END;
/
ALTER TRIGGER "ABBR_ELIG_CRITERIA_BI" ENABLE;
