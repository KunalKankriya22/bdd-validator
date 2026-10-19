--------------------------------------------------------
--  DDL for Trigger POTENTIAL_DUPLICATES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."POTENTIAL_DUPLICATES_BI" 
 BEFORE INSERT
 ON POTENTIAL_DUPLICATES
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."POTENTIAL_DUPLICATES_BI" ENABLE;
