--------------------------------------------------------
--  DDL for Trigger DONOR_PICTURES_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_PICTURES_BI" 
BEFORE INSERT
ON DONOR_PICTURES
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

  /*---- Added by Ashok -- for laptop data extract- to add in the monitoring table */
  INSERT INTO download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
               values('DONOR_PICTURES',:new.audit_key,'I',null);
END;
/
ALTER TRIGGER "DONOR_PICTURES_BI" ENABLE;
