--------------------------------------------------------
--  DDL for Trigger STAFF_OFF_DAY_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."STAFF_OFF_DAY_BI" 
 BEFORE INSERT
 ON STAFF_OFF_DAY
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."STAFF_OFF_DAY_BI" ENABLE;
