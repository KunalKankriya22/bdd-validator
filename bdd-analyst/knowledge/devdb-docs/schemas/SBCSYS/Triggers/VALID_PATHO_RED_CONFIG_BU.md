---
tags:
  - trigger
  - SBCSYS
---
# VALID_PATHO_RED_CONFIG_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_PATHO_REDUCTION_CONFIG|VALID_PATHO_REDUCTION_CONFIG]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    aud_rec      VALID_PATHO_REDUCTION_CFG_ADT%rowtype;
    nCount       NUMBER := 0;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
	--

	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
	   aud_rec.chapter_id := nvl(:new.chapter_id,'*');
 	end if;

	if nvl(:old.VOLUME_TYPE_SET,'*') !=
	   nvl(:new.VOLUME_TYPE_SET,'*')
	then
	   aud_rec.VOLUME_TYPE_SET :=
			nvl(:new.VOLUME_TYPE_SET,'*');
 	end if;

	if nvl(:old.SUSPENSION_TYPE,'*') !=
	   nvl(:new.SUSPENSION_TYPE,'*')
	then
	   aud_rec.SUSPENSION_TYPE := nvl(:new.SUSPENSION_TYPE,'*');
 	end if;

	if nvl(:old.EQUIP_TYPE,'*') !=
	   nvl(:new.EQUIP_TYPE,'*')
	then
	   aud_rec.EQUIP_TYPE := nvl(:new.EQUIP_TYPE,'*');
 	end if;

	IF NVL(:old.MIN_VOL, -1) !=
	   NVL(:new.MIN_VOL,-1)
	THEN
            aud_rec.MIN_VOL := NVL(:new.MIN_VOL,-1);
        END IF;

	if nvl(:old.MAX_VOL, -1) !=
	   nvl(:new.MAX_VOL, -1)
	then
	   aud_rec.MAX_VOL := nvl(:new.MAX_VOL,-1);
 	end if;

	if nvl(:old.MIN_PLT_COUNT, -1) !=
	   nvl(:new.MIN_PLT_COUNT, -1)
	then
	   aud_rec.MIN_PLT_COUNT := nvl(:new.MIN_PLT_COUNT, -1);
 	end if;

	if nvl(:old.MAX_PLT_COUNT, -1) !=
	   nvl(:new.MAX_PLT_COUNT, -1)
	then
	   aud_rec.MAX_PLT_COUNT := nvl(:new.MAX_PLT_COUNT, -1);
 	end if;

	if nvl(:old.MIN_CAD_TIME, -1) !=
	   nvl(:new.MIN_CAD_TIME, -1)
	then
	   aud_rec.MIN_CAD_TIME := nvl(:new.MIN_CAD_TIME, -1);
 	end if;

	if nvl(:old.MAX_CAD_TIME, -1) !=
	   nvl(:new.MAX_CAD_TIME, -1)
	then
	   aud_rec.MAX_CAD_TIME := nvl(:new.MAX_CAD_TIME, -1);
 	end if;

	if nvl(:old.MAX_STORAGE_DAYS, -1) !=
	   nvl(:new.MAX_STORAGE_DAYS, -1)
	then
	   aud_rec.MAX_STORAGE_DAYS := nvl(:new.MAX_STORAGE_DAYS, -1);
 	end if;

	if nvl(:old.FINAL_MIN_VOLUME, -1) !=
	   nvl(:new.FINAL_MIN_VOLUME, -1)
	then
	   aud_rec.FINAL_MIN_VOLUME := nvl(:new.FINAL_MIN_VOLUME, -1);
 	end if;

	if nvl(:old.FINAL_MIN_PLT_COUNT, -1) !=
	   nvl(:new.FINAL_MIN_PLT_COUNT, -1)
	then
	   aud_rec.FINAL_MIN_PLT_COUNT := nvl(:new.FINAL_MIN_PLT_COUNT, -1);
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

	if nvl(:old.FINAL_MAX_VOLUME,-1) !=
	   nvl(:new.FINAL_MAX_VOLUME,-1)
	then
	   aud_rec.FINAL_MAX_VOLUME := nvl(:new.FINAL_MAX_VOLUME,-1);
 	end if;

	if nvl(:old.FINAL_MAX_PLT_COUNT,-1) !=
	   nvl(:new.FINAL_MAX_PLT_COUNT,-1)
	then
	   aud_rec.FINAL_MAX_PLT_COUNT := nvl(:new.FINAL_MAX_PLT_COUNT,-1);
 	end if;

	if nvl(:old.FINAL_MAX_NO_BAGS,-1) !=
	   nvl(:new.FINAL_MAX_NO_BAGS,-1)
	then
	   aud_rec.FINAL_MAX_NO_BAGS := nvl(:new.FINAL_MAX_NO_BAGS,-1);
 	end if;


	insert into VALID_PATHO_REDUCTION_CFG_ADT
	(
		CHAPTER_ID, VOLUME_TYPE_SET,
		SUSPENSION_TYPE, EQUIP_TYPE,
		MIN_VOL,MAX_VOL,
		MIN_PLT_COUNT,MAX_PLT_COUNT,
		MIN_CAD_TIME,MAX_CAD_TIME,
		MAX_STORAGE_DAYS,FINAL_MIN_VOLUME,
		FINAL_MIN_PLT_COUNT,EFF_DATE,
		TERM_DATE,INSERT_DATE,
		INSERT_USER, PROGRAM_ID,
		AUDIT_KEY,FINAL_MAX_VOLUME,
		FINAL_MAX_PLT_COUNT,FINAL_MAX_NO_BAGS,
		AUDIT_INSERT_DATS, AUDIT_INSERT_USER

	)
	values
	(
		aud_rec.CHAPTER_ID ,aud_rec.VOLUME_TYPE_SET,
		aud_rec.SUSPENSION_TYPE , aud_rec.EQUIP_TYPE ,
		aud_rec.MIN_VOL , aud_rec.MAX_VOL ,
		aud_rec.MIN_PLT_COUNT, aud_rec.MAX_PLT_COUNT,
		aud_rec.MIN_CAD_TIME, aud_rec.MAX_CAD_TIME,
		aud_rec.MAX_STORAGE_DAYS, aud_rec.FINAL_MIN_VOLUME,
		aud_rec.FINAL_MIN_PLT_COUNT, aud_rec.EFF_DATE,
		aud_rec.TERM_DATE , aud_rec.INSERT_DATE,
		aud_rec.INSERT_USER , aud_rec.PROGRAM_ID ,
		aud_rec.AUDIT_KEY , aud_rec.FINAL_MAX_VOLUME,
		aud_rec.FINAL_MAX_PLT_COUNT, aud_rec.FINAL_MAX_NO_BAGS,
		SYSDATE , lt_user_session.get_userid

	);
end;
```
