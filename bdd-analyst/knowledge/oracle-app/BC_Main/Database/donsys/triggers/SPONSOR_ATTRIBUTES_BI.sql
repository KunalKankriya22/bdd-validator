--------------------------------------------------------
--  DDL for Trigger SPONSOR_ATTRIBUTES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."SPONSOR_ATTRIBUTES_BI" 
 BEFORE INSERT
 ON SPONSOR_ATTRIBUTES
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."SPONSOR_ATTRIBUTES_BI" ENABLE;
