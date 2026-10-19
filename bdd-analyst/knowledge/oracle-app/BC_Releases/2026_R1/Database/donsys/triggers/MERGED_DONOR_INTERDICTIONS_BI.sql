--------------------------------------------------------
--  DDL for Trigger MERGED_DONOR_INTERDICTIONS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."MERGED_DONOR_INTERDICTIONS_BI" 
 BEFORE INSERT
 ON MERGED_DONOR_INTERDICTIONS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."MERGED_DONOR_INTERDICTIONS_BI" ENABLE;
