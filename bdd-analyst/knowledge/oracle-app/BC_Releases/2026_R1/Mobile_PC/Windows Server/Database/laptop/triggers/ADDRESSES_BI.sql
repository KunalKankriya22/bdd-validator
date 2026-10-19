--------------------------------------------------------
--  DDL for Trigger ADDRESSES_BI
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "ADDRESSES_BI" 
 BEFORE INSERT
 ON ADDRESSES
 FOR EACH ROW
BEGIN
    if :new.insert_user is null then
        select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
        into :new.insert_user from dual ;
    end if;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "ADDRESSES_BI" ENABLE;
