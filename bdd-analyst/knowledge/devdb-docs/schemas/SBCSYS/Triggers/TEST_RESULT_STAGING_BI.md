---
tags:
  - trigger
  - SBCSYS
---
# TEST_RESULT_STAGING_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/TEST_RESULT_STAGING|TEST_RESULT_STAGING]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
tmpVar NUMBER;
/******************************************************************************
   NAME:
   PURPOSE:
   REVISIONS:
   Ver	      Date	  Author	   Description
   ---------  ----------  ---------------  ------------------------------------
   1.0	      4/13/2011 	    1. Created this trigger.
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
   SELECT record_id_seq.NEXTVAL INTO tmpVar FROM dual;
   :NEW.record_id := tmpVar;
   :NEW.INSERT_Date := SYSDATE;
   :NEW.INSERT_User := USER;
   EXCEPTION
     WHEN OTHERS THEN
       -- Consider logging the error and then re-raise
       RAISE;
END ;
```
