--------------------------------------------------------
--  DDL for Trigger HLA_RBC_MATCH_LISTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."HLA_RBC_MATCH_LISTS_BI" 
 BEFORE INSERT
 ON HLA_RBC_MATCH_LISTS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."HLA_RBC_MATCH_LISTS_BI" ENABLE;
