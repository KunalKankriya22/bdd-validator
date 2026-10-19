--------------------------------------------------------
--  DDL for Trigger PATHOGEN_FINAL_PRODUCTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PATHOGEN_FINAL_PRODUCTS_BU" 
before update
on PATHOGEN_FINAL_PRODUCTS
for each row
declare
    aud_rec      PATHOGEN_FINAL_PRODUCTS_AUDIT%rowtype;
    nCount       NUMBER := 0;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
	--
	if nvl(:old.unit_id,'*') !=
	   nvl(:new.unit_id,'*')
	then
	   aud_rec.unit_id := nvl(:new.unit_id,'*');
 	end if;

	if nvl(:old.PRODUCT_CODE,'*') !=
	   nvl(:new.PRODUCT_CODE,'*')
	then
	   aud_rec.PRODUCT_CODE := nvl(:new.PRODUCT_CODE,'*');
 	end if;

	if nvl(:old.PROD_WEIGHT,-1) !=
	   nvl(:new.PROD_WEIGHT,-1)
	then
	   aud_rec.PROD_WEIGHT :=
			nvl(:new.PROD_WEIGHT,-1);
 	end if;

	if nvl(:old.PROD_VOL,-1) !=
	   nvl(:new.PROD_VOL,-1)
	then
	   aud_rec.PROD_VOL := nvl(:new.PROD_VOL,-1);
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

	if nvl(:old.ANTICOAGULANT_VOLUME,-1) !=
	   nvl(:new.ANTICOAGULANT_VOLUME,-1)
	then
	   aud_rec.ANTICOAGULANT_VOLUME := nvl(:new.ANTICOAGULANT_VOLUME,-1);
 	end if;

	if nvl(:old.FINAL_PLT_COUNT,-1) !=
	   nvl(:new.FINAL_PLT_COUNT,-1)
	then
	   aud_rec.FINAL_PLT_COUNT := nvl(:new.FINAL_PLT_COUNT,-1);
 	end if;

	if nvl(:old.SUIT_PROD_CODE,'*') !=
	   nvl(:new.SUIT_PROD_CODE,'*')
	then
	   aud_rec.SUIT_PROD_CODE := nvl(:new.SUIT_PROD_CODE,'*');
 	end if;

	if nvl(:old.CAD_PROD_CODE,'*') !=
	   nvl(:new.CAD_PROD_CODE,'*')
	then
	   aud_rec.CAD_PROD_CODE := nvl(:new.CAD_PROD_CODE,'*');
 	end if;


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
		aud_rec.UNIT_ID ,aud_rec.PRODUCT_CODE ,
		aud_rec.PROD_WEIGHT , aud_rec.PROD_VOL ,
		aud_rec.INSERT_DATE , aud_rec.INSERT_USER ,
		aud_rec.PROGRAM_ID , aud_rec.ANTICOAGULANT_VOLUME ,
		aud_rec.FINAL_PLT_COUNT , aud_rec.AUDIT_KEY ,
		aud_rec.SUIT_PROD_CODE , aud_rec.CAD_PROD_CODE ,
		SYSDATE , lt_user_session.get_userid

	);
end;
/
ALTER TRIGGER "PATHOGEN_FINAL_PRODUCTS_BU" DISABLE;
