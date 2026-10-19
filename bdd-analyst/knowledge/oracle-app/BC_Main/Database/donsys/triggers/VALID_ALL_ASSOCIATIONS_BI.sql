--------------------------------------------------------
--  DDL for Trigger VALID_ALL_ASSOCIATIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_ALL_ASSOCIATIONS_BI" 
 BEFORE INSERT
 ON VALID_ALL_ASSOCIATIONS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."VALID_ALL_ASSOCIATIONS_BI" ENABLE;
