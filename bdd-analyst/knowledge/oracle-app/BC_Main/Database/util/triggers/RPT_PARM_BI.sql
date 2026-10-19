--------------------------------------------------------
--  DDL for Trigger RPT_PARM_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "RPT_PARM_BI" 
  BEFORE INSERT ON UTIL.RPT_PARM
  FOR EACH ROW
BEGIN
  IF :new.chapter_id IS NULL THEN
    :new.chapter_id := lt_user_session.get_chapter_id;
  END IF;
END;



/
ALTER TRIGGER "RPT_PARM_BI" ENABLE;
