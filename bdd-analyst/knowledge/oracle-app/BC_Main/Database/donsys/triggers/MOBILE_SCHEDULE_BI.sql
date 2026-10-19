--------------------------------------------------------
--  DDL for Trigger MOBILE_SCHEDULE_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."MOBILE_SCHEDULE_BI" 
 BEFORE INSERT
 ON MOBILE_SCHEDULE
 FOR EACH ROW
BEGIN
   If :new.insert_user is null then
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
  End if;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into :new.audit_key from dual;
end ;
/
ALTER TRIGGER "DONSYS"."MOBILE_SCHEDULE_BI" ENABLE;
