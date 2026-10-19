--------------------------------------------------------
--  DDL for Trigger STAFF_SCHEDULE_DETAILS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."STAFF_SCHEDULE_DETAILS_BU" 
 BEFORE UPDATE
 ON STAFF_SCHEDULE_DETAILS
 FOR EACH ROW
BEGIN
 update staff_schedule_hdr
  set	last_modified_date = sysdate
 where	schedule_id = :new.schedule_id
  and	chapter_id = :new.chapter_id ;
end;
/
ALTER TRIGGER "DONSYS"."STAFF_SCHEDULE_DETAILS_BU" ENABLE;
