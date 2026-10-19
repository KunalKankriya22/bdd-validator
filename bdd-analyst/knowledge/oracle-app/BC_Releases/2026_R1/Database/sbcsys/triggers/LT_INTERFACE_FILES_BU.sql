--------------------------------------------------------
--  DDL for Trigger LT_INTERFACE_FILES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LT_INTERFACE_FILES_BU" 
BEFORE update
ON LT_INTERFACE_FILES
REFERENCING NEW AS New OLD AS Old
FOR EACH ROW
DECLARE
tmpVar NUMBER;
v_user_id varchar2(20);
/******************************************************************************
   NAME:
   PURPOSE:
   REVISIONS:
   Ver	      Date	  Author	   Description
   ---------  ----------  ---------------  ------------------------------------
   1.0	      05/17/2011	     1. Created this trigger.
   2.0	      05/22/2011		insert 'DOD in the source_id field
   NOTES:
    Insert a record in the lifetrak_api_log table when the FAILURE_REASON filed is modified
******************************************************************************/
BEGIN
   tmpVar := 0;
  IF :NEW.FAILURE_REASON is not null then
  insert	into lifetrak_api_log(SOURCE_ID,INTERNAL_ID,LOG_TEXT,EXTERNAL_ID,INSERT_DATE,PROGRAM_ID )
	     values('DOD','LIFETRAK',:NEW.FAILURE_REASON,:NEW.FILE_ID,sysdate,'LT_INTERFACE_FILES_bu');
  END IF;
   EXCEPTION
     WHEN OTHERS THEN
       -- Consider logging the error and then re-raise
       RAISE;
END ;
/
ALTER TRIGGER "LT_INTERFACE_FILES_BU" ENABLE;
