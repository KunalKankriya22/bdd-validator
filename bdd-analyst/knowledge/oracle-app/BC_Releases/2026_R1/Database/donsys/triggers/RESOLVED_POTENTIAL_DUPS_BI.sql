--------------------------------------------------------
--  DDL for Trigger RESOLVED_POTENTIAL_DUPS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."RESOLVED_POTENTIAL_DUPS_BI" 
 BEFORE INSERT
 ON RESOLVED_POTENTIAL_DUPLICATES
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."RESOLVED_POTENTIAL_DUPS_BI" ENABLE;
