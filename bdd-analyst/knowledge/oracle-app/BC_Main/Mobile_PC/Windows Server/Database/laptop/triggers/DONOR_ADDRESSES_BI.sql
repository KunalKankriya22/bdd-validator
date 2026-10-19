--------------------------------------------------------
--  DDL for Trigger DONOR_ADDRESSES_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "DONOR_ADDRESSES_BI" 
 BEFORE INSERT
 ON DONOR_ADDRESSES
 FOR EACH ROW
DECLARE

   v_audit_key number;
   l_usps_id    number(6);
   l_city       varchar2(40);
   l_state      varchar2(2);
   l_zip        varchar2(5);
begin
   l_usps_id := null;
   l_city    := null;
   l_state   := null;
   l_zip     := null;
---
    if :new.insert_user is null then
        select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
          into :new.insert_user from dual ;
    end if;  
    :new.insert_date := sysdate ;
    select audit_seq.nextval into v_audit_key from dual;
    :new.audit_key:=v_audit_key;

 /*---- Added by Edwin -- for laptop data extract- to add in the monitoring table */
    insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                 values('DONOR_ADDRESSES',v_audit_key,'I',null);
end ;
/
ALTER TRIGGER "DONOR_ADDRESSES_BI" ENABLE;
