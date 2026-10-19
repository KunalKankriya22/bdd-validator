--------------------------------------------------------
--  DDL for Trigger HEALTH_HISTORY_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "HEALTH_HISTORY_BI" 
 BEFORE INSERT
 ON HEALTH_HISTORY
 FOR EACH ROW
BEGIN
 Declare
  v_audit_key number:=0;
BEGIN
    if :new.insert_user is null then
        select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
        into :new.insert_user from dual ;
    end if;
    :new.insert_date := sysdate ;
    --select audit_seq.nextval into :new.audit_key from dual;
    select audit_seq.nextval into v_audit_key from dual;
    :new.audit_key:=v_audit_key;

/*---- Added by Touqeer -- for laptop data extract- to add in the monitoring table */
    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('HEALTH_HISTORY',v_audit_key,'I',null);


end ;

END;
/
ALTER TRIGGER "HEALTH_HISTORY_BI" ENABLE;
