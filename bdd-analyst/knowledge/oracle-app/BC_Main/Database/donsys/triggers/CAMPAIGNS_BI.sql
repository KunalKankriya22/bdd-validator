--------------------------------------------------------
--  DDL for Trigger CAMPAIGNS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."CAMPAIGNS_BI" 
 BEFORE INSERT
 ON CAMPAIGNS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."CAMPAIGNS_BI" ENABLE;
