--------------------------------------------------------
--  DDL for Trigger API_ADD_TEST_INTER_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "API_ADD_TEST_INTER_BI" 
BEFORE INSERT
ON LTAPI.API_ADD_TEST_INTER
REFERENCING NEW AS New OLD AS Old
FOR EACH ROW
DECLARE

BEGIN

   :NEW.INSERT_Date := SYSDATE;
   :NEW.INSERT_User := USER;

	if :new.audit_key is null then
   select audit_seq.nextval into :new.audit_key from dual;
	end if;
END ;
/
ALTER TRIGGER "API_ADD_TEST_INTER_BI" ENABLE;
