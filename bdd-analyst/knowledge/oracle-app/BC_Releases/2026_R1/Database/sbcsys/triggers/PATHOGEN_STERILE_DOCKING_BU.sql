--------------------------------------------------------
--  DDL for Trigger PATHOGEN_STERILE_DOCKING_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "PATHOGEN_STERILE_DOCKING_BU" 
before update
on PATHOGEN_STERILE_DOCKING
for each row
declare
    aud_rec      PATHOGEN_STERILE_DOCKING_AUDIT%rowtype;
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

	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
	   aud_rec.chapter_id := nvl(:new.chapter_id,'*');
 	end if;

	if nvl(:old.WELD_MACHINE,'*') !=
	   nvl(:new.WELD_MACHINE,'*')
	then
	   aud_rec.WELD_MACHINE :=
			nvl(:new.WELD_MACHINE,'*');
 	end if;

	if nvl(:old.WAFER_LOT_NO,'*') !=
	   nvl(:new.WAFER_LOT_NO,'*')
	then
	   aud_rec.WAFER_LOT_NO := nvl(:new.WAFER_LOT_NO,'*');
 	end if;

	if nvl(:old.WELD_OK,'*') !=
	   nvl(:new.WELD_OK,'*')
	then
	   aud_rec.WELD_OK := nvl(:new.WELD_OK,'*');
 	end if;

	if nvl(:old.PROC_CODE,'*') !=
	   nvl(:new.PROC_CODE,'*')
	then
	   aud_rec.PROC_CODE := nvl(:new.PROC_CODE,'*');
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

	if nvl(:old.SET_LOT_NO,'*') !=
	   nvl(:new.SET_LOT_NO,'*')
	then
	   aud_rec.SET_LOT_NO := nvl(:new.SET_LOT_NO,'*');
 	end if;

	if nvl(:old.VOL_TYPE_SET,'*') !=
	   nvl(:new.VOL_TYPE_SET,'*')
	then
	   aud_rec.VOL_TYPE_SET := nvl(:new.VOL_TYPE_SET,'*');
 	end if;

	if nvl(:old.SUIT_PROD_CODE,'*') !=
	   nvl(:new.SUIT_PROD_CODE,'*')
	then
	   aud_rec.SUIT_PROD_CODE := nvl(:new.SUIT_PROD_CODE,'*');
 	end if;

	insert into PATHOGEN_STERILE_DOCKING_AUDIT
	(
		UNIT_ID, CHAPTER_ID, WELD_MACHINE,
		WAFER_LOT_NO, WELD_OK, PROC_CODE,
		INSERT_DATE, INSERT_USER, PROGRAM_ID,
		SET_LOT_NO,VOL_TYPE_SET,AUDIT_KEY,SUIT_PROD_CODE,
		AUDIT_INSERT_DATS, AUDIT_INSERT_USER

	)
	values
	(
		aud_rec.UNIT_ID ,aud_rec.CHAPTER_ID ,
		aud_rec.WELD_MACHINE , aud_rec.WAFER_LOT_NO ,
		aud_rec.WELD_OK , aud_rec.PROC_CODE ,
		aud_rec.INSERT_DATE , aud_rec.INSERT_USER ,
		aud_rec.PROGRAM_ID , aud_rec.SET_LOT_NO ,
		aud_rec.VOL_TYPE_SET , aud_rec.AUDIT_KEY , aud_rec.SUIT_PROD_CODE,
		SYSDATE , lt_user_session.get_userid

	);
end;
/
ALTER TRIGGER "PATHOGEN_STERILE_DOCKING_BU" ENABLE;
