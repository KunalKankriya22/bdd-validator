--------------------------------------------------------
--  DDL for Trigger API_INST_TEST_RESULTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "API_INST_TEST_RESULTS_BI" 
BEFORE INSERT
ON LTAPI.API_INST_TEST_RESULTS
REFERENCING NEW AS New OLD AS Old
FOR EACH ROW
DECLARE
tmpVar NUMBER;

BEGIN
   tmpVar := 0;
   SELECT api_record_id_seq.NEXTVAL INTO tmpVar FROM dual;
   :NEW.record_id := tmpVar;
   :NEW.INSERT_Date := SYSDATE;
 --  :NEW.INSERT_User := USER;


	if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
	end if;

EXCEPTION
     WHEN OTHERS THEN
       -- Consider logging the error and then re-raise
       RAISE;


END ;
/
ALTER TRIGGER "API_INST_TEST_RESULTS_BI" ENABLE;
