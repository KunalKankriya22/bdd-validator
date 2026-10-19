--------------------------------------------------------
--  DDL for Trigger LT_INTERFACE_FILES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "LT_INTERFACE_FILES_BI" 
BEFORE INSERT
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
   1.0	      4/13/2011 	    1. Created this trigger.
   2.0	      4/29/2011   ISSA	     remove the OPS$ from the lt_user_session.get_userid ID
				      commented out NEW.INSERT_Date
   3.0	      05/11/2011  ISSA	      commented out the lt_user_session.get_userid ID
   NOTES:
   Automatically available Auto Replace Keywords:
      Object Name:
      Sysdate:	       4/13/2011
      Date and Time:   4/13/2011, 11:09:54 AM, and 4/13/2011 11:09:54 AM
      Username: 	(set in TOAD Options, Proc Templates)
      Table Name:      API_TEST_RESULTS (set in the "New PL/SQL Object" dialog)
      Trigger Options:	(set in the "New PL/SQL Object" dialog)
******************************************************************************/
BEGIN
   tmpVar := 0;
   if  substr(lt_user_session.get_userid,1,4) = 'OPS$'
    then
       v_user_id  := substr(lt_user_session.get_userid,5,6) ;
    else
       v_user_id  := substr(lt_user_session.get_userid,1,6) ;
    end if;
   SELECT record_id_seq.NEXTVAL INTO tmpVar FROM dual;
   :NEW.record_id := tmpVar;
   --:NEW.INSERT_Date := SYSDATE;
   --:NEW.INSERT_User := v_user_id;
   EXCEPTION
     WHEN OTHERS THEN
       -- Consider logging the error and then re-raise
       RAISE;
END ;
/
ALTER TRIGGER "LT_INTERFACE_FILES_BI" ENABLE;
