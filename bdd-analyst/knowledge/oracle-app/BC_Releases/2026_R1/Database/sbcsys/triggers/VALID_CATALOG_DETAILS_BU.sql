--------------------------------------------------------
--  DDL for Trigger VALID_CATALOG_DETAILS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CATALOG_DETAILS_BU" 
before update
on VALID_CATALOG_DETAILS
for each row
declare
    aud_rec      VALID_CATALOG_DETAILS_AUDIT%rowtype;
    nCount       NUMBER := 0;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
	--
	if nvl(:old.CATALOG_NUMBER,'*') !=
	   nvl(:new.CATALOG_NUMBER,'*')
	then
	   aud_rec.CATALOG_NUMBER := nvl(:new.CATALOG_NUMBER,'*');
 	end if;

	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
	   aud_rec.chapter_id := nvl(:new.chapter_id,'*');
 	end if;

	if nvl(:old.CONTAINER_ID,'*') !=
	   nvl(:new.CONTAINER_ID,'*')
	then
	   aud_rec.CONTAINER_ID :=
			nvl(:new.CONTAINER_ID,'*');
 	end if;

	if nvl(:old.INLINE_FILTER_FLAG,'*') !=
	   nvl(:new.INLINE_FILTER_FLAG,'*')
	then
	   aud_rec.INLINE_FILTER_FLAG := nvl(:new.INLINE_FILTER_FLAG,'*');
 	end if;

	if nvl(:old.PRODUCT_TYPE,'*') !=
	   nvl(:new.PRODUCT_TYPE,'*')
	then
	   aud_rec.PRODUCT_TYPE := nvl(:new.PRODUCT_TYPE,'*');
 	end if;

	if nvl(:old.SUB_PROD_TYPES,'*') !=
	   nvl(:new.SUB_PROD_TYPES,'*')
	then
	   aud_rec.SUB_PROD_TYPES := nvl(:new.SUB_PROD_TYPES,'*');
 	end if;

	if nvl(:old.INSERT_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.INSERT_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.INSERT_DATE := nvl(:new.INSERT_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.INSERT_USER,'*') !=
	   nvl(:new.INSERT_USER,'*')
	then
	   aud_rec.INSERT_USER := nvl(:new.INSERT_USER,'*');
 	end if;

	if nvl(:old.EFF_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.EFF_DATE := nvl(:new.EFF_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.TERM_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.TERM_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.TERM_DATE := nvl(:new.TERM_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;


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
		aud_rec.CATALOG_NUMBER, aud_rec.CHAPTER_ID, aud_rec.CONTAINER_ID,
		aud_rec.INLINE_FILTER_FLAG, aud_rec.PRODUCT_TYPE, aud_rec.SUB_PROD_TYPES,
		aud_rec.INSERT_DATE, aud_rec.INSERT_USER, aud_rec.EFF_DATE,
		aud_rec.TERM_DATE, aud_rec.PROGRAM_ID, aud_rec.AUDIT_KEY,
		SYSDATE , lt_user_session.get_userid

	);
end;
/
ALTER TRIGGER "VALID_CATALOG_DETAILS_BU" ENABLE;
