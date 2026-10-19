--------------------------------------------------------
--  DDL for Trigger PATHOGEN_FINAL_PRODUCTS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PATHOGEN_FINAL_PRODUCTS_BI" 
before insert
on PATHOGEN_FINAL_PRODUCTS
for each row
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');

	insert into PATHOGEN_FINAL_PRODUCTS_AUDIT
	(
		UNIT_ID, PRODUCT_CODE, PROD_WEIGHT,
		PROD_VOL, INSERT_DATE, INSERT_USER,
		PROGRAM_ID,ANTICOAGULANT_VOLUME,
		FINAL_PLT_COUNT,AUDIT_KEY,
		SUIT_PROD_CODE,CAD_PROD_CODE,
		AUDIT_INSERT_DATS, AUDIT_INSERT_USER

	)
	values
	(

		:NEW.UNIT_ID ,:NEW.PRODUCT_CODE ,
		:NEW.PROD_WEIGHT , :NEW.PROD_VOL ,
		:NEW.INSERT_DATE , :NEW.INSERT_USER ,
		:NEW.PROGRAM_ID , :NEW.ANTICOAGULANT_VOLUME ,
		:NEW.FINAL_PLT_COUNT , :NEW.AUDIT_KEY ,
		:NEW.SUIT_PROD_CODE , :NEW.CAD_PROD_CODE ,
		SYSDATE , lt_user_session.get_userid

	);
end;
/
ALTER TRIGGER "PATHOGEN_FINAL_PRODUCTS_BI" ENABLE;
