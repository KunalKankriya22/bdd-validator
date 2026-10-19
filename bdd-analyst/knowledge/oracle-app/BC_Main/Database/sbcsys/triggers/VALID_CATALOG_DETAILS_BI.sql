--------------------------------------------------------
--  DDL for Trigger VALID_CATALOG_DETAILS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CATALOG_DETAILS_BI" 
before insert
on VALID_CATALOG_DETAILS
for each row
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');

	insert into SBCSYS.VALID_CATALOG_DETAILS_AUDIT
	(
		CATALOG_NUMBER,CHAPTER_ID,CONTAINER_ID,
		INLINE_FILTER_FLAG,PRODUCT_TYPE,SUB_PROD_TYPES,
		INSERT_DATE,INSERT_USER,EFF_DATE,
		TERM_DATE,PROGRAM_ID,AUDIT_KEY,
		AUDIT_INSERT_DATS, AUDIT_INSERT_USER

	)
	values
	(
		:NEW.CATALOG_NUMBER,:NEW.CHAPTER_ID,:NEW.CONTAINER_ID,
		:NEW.INLINE_FILTER_FLAG,:NEW.PRODUCT_TYPE,:NEW.SUB_PROD_TYPES,
		:NEW.INSERT_DATE,:NEW.INSERT_USER,:NEW.EFF_DATE,
		:NEW.TERM_DATE,:NEW.PROGRAM_ID,:NEW.AUDIT_KEY,
		SYSDATE,lt_user_session.get_userid
	);

end;
/
ALTER TRIGGER "VALID_CATALOG_DETAILS_BI" ENABLE;
