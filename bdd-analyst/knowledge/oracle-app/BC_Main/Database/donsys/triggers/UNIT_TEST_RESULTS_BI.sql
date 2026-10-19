--------------------------------------------------------
--  DDL for Trigger UNIT_TEST_RESULTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."UNIT_TEST_RESULTS_BI" 
 BEFORE INSERT
 ON UNIT_TEST_RESULTS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
end ;
/
ALTER TRIGGER "DONSYS"."UNIT_TEST_RESULTS_BI" ENABLE;
