--------------------------------------------------------
--  DDL for Trigger STAFF_SCHEDULE_DETAILS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."STAFF_SCHEDULE_DETAILS_BI" 
 BEFORE INSERT
 ON STAFF_SCHEDULE_DETAILS
 FOR EACH ROW
BEGIN
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    begin
     update staff_schedule_hdr
      set   last_modified_date = sysdate
     where  schedule_id = :new.schedule_id
      and   chapter_id = :new.chapter_id ;
    end ;
end ;
/
ALTER TRIGGER "DONSYS"."STAFF_SCHEDULE_DETAILS_BI" ENABLE;
