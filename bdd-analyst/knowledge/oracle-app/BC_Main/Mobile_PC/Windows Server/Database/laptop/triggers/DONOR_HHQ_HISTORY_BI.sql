--------------------------------------------------------
--  DDL for Trigger DONOR_HHQ_HISTORY_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_HHQ_HISTORY_BI" 
 BEFORE INSERT
 ON DONOR_HHQ_HISTORY
 FOR EACH ROW
DECLARE
  v_auditKey NUMBER;
BEGIN
  IF :new.insert_user IS NULL THEN
     select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
     into :new.insert_user from dual ;
  END IF;
  IF :new.insert_date IS NULL THEN
     :new.insert_date := SYSDATE;
  END IF;

  SELECT audit_seq.nextval INTO v_auditKey FROM dual;
  :new.audit_key := v_auditKey;

    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('DONOR_HHQ_HISTORY',v_auditKey,'I',null);
END;
/
ALTER TRIGGER "DONOR_HHQ_HISTORY_BI" ENABLE;
