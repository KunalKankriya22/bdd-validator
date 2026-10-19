--------------------------------------------------------
--  DDL for Trigger PHYSICAL_FINDINGS_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "PHYSICAL_FINDINGS_BI" 
 BEFORE INSERT
 ON PHYSICAL_FINDINGS
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
                 values('PHYSICAL_FINDINGS',v_audit_key,'I',null);


end ;

END;
/
ALTER TRIGGER "PHYSICAL_FINDINGS_BI" ENABLE;
