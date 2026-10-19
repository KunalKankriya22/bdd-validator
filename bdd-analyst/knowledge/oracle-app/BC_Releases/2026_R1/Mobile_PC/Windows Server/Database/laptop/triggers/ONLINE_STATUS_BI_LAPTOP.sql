--------------------------------------------------------
--  DDL for Trigger ONLINE_STATUS_BI_LAPTOP
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "ONLINE_STATUS_BI_LAPTOP" 
before insert
on ONLINE_STATUS
for each row
BEGIN
  Declare
     v_audit_key  number:=0;
  Begin
    if :new.insert_user is null then  
        select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
        into :new.insert_user from dual ;
    end if;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into v_audit_key from dual;
    :new.audit_key:=v_audit_key;
    /*---- Added by Edwin -- for laptop data extract- to add in the monitoring table */
    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('ONLINE_STATUS',v_audit_key,'I',null);
   End;
end;
/
ALTER TRIGGER "ONLINE_STATUS_BI_LAPTOP" ENABLE;
