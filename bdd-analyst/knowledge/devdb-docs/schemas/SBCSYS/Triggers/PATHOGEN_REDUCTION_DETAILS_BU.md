---
tags:
  - trigger
  - SBCSYS
---
# PATHOGEN_REDUCTION_DETAILS_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/PATHOGEN_REDUCTION_DETAILS|PATHOGEN_REDUCTION_DETAILS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    aud_rec      PATHOGEN_REDUCTION_DETAILS_ADT%rowtype;
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

	if nvl(:old.COLL_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.COLL_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.COLL_DATE := nvl(:new.COLL_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
	   aud_rec.chapter_id := nvl(:new.chapter_id,'*');
 	end if;

	if nvl(:old.INITIAL_PROD_CODE,'*') !=
	   nvl(:new.INITIAL_PROD_CODE,'*')
	then
	   aud_rec.INITIAL_PROD_CODE :=
			nvl(:new.INITIAL_PROD_CODE,'*');
 	end if;

	if nvl(:old.VOL_TYPE_SET,'*') !=
	   nvl(:new.VOL_TYPE_SET,'*')
	then
	   aud_rec.VOL_TYPE_SET := nvl(:new.VOL_TYPE_SET,'*');
 	end if;

	if nvl(:old.SUSPENSION_TYPE,'*') !=
	   nvl(:new.SUSPENSION_TYPE,'*')
	then
	   aud_rec.SUSPENSION_TYPE := nvl(:new.SUSPENSION_TYPE,'*');
 	end if;

	if nvl(:old.INIT_PLT_COUNT,-1) !=
	   nvl(:new.INIT_PLT_COUNT,-1)
	then
	   aud_rec.INIT_PLT_COUNT := nvl(:new.INIT_PLT_COUNT,-1);
 	end if;

	if nvl(:old.RBC_CONTENT_STATUS,'*') !=
	   nvl(:new.RBC_CONTENT_STATUS,'*')
	then
	   aud_rec.RBC_CONTENT_STATUS := nvl(:new.RBC_CONTENT_STATUS,'*');
 	end if;

	if nvl(:old.BLEED_START_TIME,to_date ('01-JAN-33')) !=
	   nvl(:new.BLEED_START_TIME,to_date ('01-JAN-33'))
	then
	   aud_rec.BLEED_START_TIME := nvl(:new.BLEED_START_TIME,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.BLEED_END_TIME,to_date ('01-JAN-33')) !=
	   nvl(:new.BLEED_END_TIME,to_date ('01-JAN-33'))
	then
	   aud_rec.BLEED_END_TIME := nvl(:new.BLEED_END_TIME,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;


	if nvl(:old.INITIAL_PROD_WEIGHT,-1) !=
	   nvl(:new.INITIAL_PROD_WEIGHT,-1)
	then
	   aud_rec.INITIAL_PROD_WEIGHT := nvl(:new.INITIAL_PROD_WEIGHT,-1);
 	end if;

	if nvl(:old.INITIAL_PROD_VOL,-1) !=
	   nvl(:new.INITIAL_PROD_VOL,-1)
	then
	   aud_rec.INITIAL_PROD_VOL := nvl(:new.INITIAL_PROD_VOL,-1);
 	end if;

	if nvl(:old.EQUIP_TYPE,'*') !=
	   nvl(:new.EQUIP_TYPE,'*')
	then
	   aud_rec.EQUIP_TYPE := nvl(:new.EQUIP_TYPE,'*');
 	end if;

	if nvl(:old.ILLUMINATION_START_TIME,to_date ('01-JAN-33')) !=
	   nvl(:new.ILLUMINATION_START_TIME,to_date ('01-JAN-33'))
	then
	   aud_rec.ILLUMINATION_START_TIME := nvl(:new.ILLUMINATION_START_TIME,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.SET_ID_LOT_NO,'*') !=
	   nvl(:new.SET_ID_LOT_NO,'*')
	then
	   aud_rec.SET_ID_LOT_NO := nvl(:new.SET_ID_LOT_NO,'*');
 	end if;

	if nvl(:old.TREATMENT_DATE,to_date ('01-JAN-33')) !=
	   nvl(:new.TREATMENT_DATE,to_date ('01-JAN-33'))
	then
	   aud_rec.TREATMENT_DATE := nvl(:new.TREATMENT_DATE,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.TREATMENT_START_TIME,to_date ('01-JAN-33')) !=
	   nvl(:new.TREATMENT_START_TIME,to_date ('01-JAN-33'))
	then
	   aud_rec.TREATMENT_START_TIME := nvl(:new.TREATMENT_START_TIME,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.TREATMENT_TIME,'*') !=
	   nvl(:new.TREATMENT_TIME,'*')
	then
	   aud_rec.TREATMENT_TIME := nvl(:new.TREATMENT_TIME,'*');
 	end if;

	if nvl(:old.OPERATOR_ID,'*') !=
	   nvl(:new.OPERATOR_ID,'*')
	then
	   aud_rec.OPERATOR_ID := nvl(:new.OPERATOR_ID,'*');
 	end if;

	if nvl(:old.CAD_START_TIME,to_date ('01-JAN-33')) !=
	   nvl(:new.CAD_START_TIME,to_date ('01-JAN-33'))
	then
	   aud_rec.CAD_START_TIME := nvl(:new.CAD_START_TIME,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.CAD_END_TIME,to_date ('01-JAN-33')) !=
	   nvl(:new.CAD_END_TIME,to_date ('01-JAN-33'))
	then
	   aud_rec.CAD_END_TIME := nvl(:new.CAD_END_TIME,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;

	if nvl(:old.CAD_TOTAL_TIME,'*') !=
	   nvl(:new.CAD_TOTAL_TIME,'*')
	then
	   aud_rec.CAD_TOTAL_TIME := nvl(:new.CAD_TOTAL_TIME,'*');
 	end if;

	if nvl(:old.ILLUMINATION_STATUS,'*') !=
	   nvl(:new.ILLUMINATION_STATUS,'*')
	then
	   aud_rec.ILLUMINATION_STATUS := nvl(:new.ILLUMINATION_STATUS,'*');
 	end if;

	if nvl(:old.ANTICOAGULANT_VOLUME,-1) !=
	   nvl(:new.ANTICOAGULANT_VOLUME,-1)
	then
	   aud_rec.ANTICOAGULANT_VOLUME := nvl(:new.ANTICOAGULANT_VOLUME,-1);
 	end if;

	if nvl(:old.AGGR_ACC,'*') !=
	   nvl(:new.AGGR_ACC,'*')
	then
	   aud_rec.AGGR_ACC := nvl(:new.AGGR_ACC,'*');
 	end if;

	if nvl(:old.SUIT_STATUS_REASON,'*') !=
	   nvl(:new.SUIT_STATUS_REASON,'*')
	then
	   aud_rec.SUIT_STATUS_REASON := nvl(:new.SUIT_STATUS_REASON,'*');
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

	if nvl(:old.SUIT_STATUS_CODE,'*') !=
	   nvl(:new.SUIT_STATUS_CODE,'*')
	then
	   aud_rec.SUIT_STATUS_CODE := nvl(:new.SUIT_STATUS_CODE,'*');
 	end if;

	if nvl(:old.SUIT_PROD_CODE,'*') !=
	   nvl(:new.SUIT_PROD_CODE,'*')
	then
	   aud_rec.SUIT_PROD_CODE := nvl(:new.SUIT_PROD_CODE,'*');
 	end if;

	if nvl(:old.ILLUMINATOR_REFERENCE,'*') !=
	   nvl(:new.ILLUMINATOR_REFERENCE,'*')
	then
	   aud_rec.ILLUMINATOR_REFERENCE := nvl(:new.ILLUMINATOR_REFERENCE,'*');
 	end if;

	if nvl(:old.CAD_PROD_CODE,'*') !=
	   nvl(:new.CAD_PROD_CODE,'*')
	then
	   aud_rec.CAD_PROD_CODE := nvl(:new.CAD_PROD_CODE,'*');
 	end if;

	if nvl(:old.FINAL_PRD_NUM_OF_BAGS,-1) !=
	   nvl(:new.FINAL_PRD_NUM_OF_BAGS,-1)
	then
	   aud_rec.FINAL_PRD_NUM_OF_BAGS := nvl(:new.FINAL_PRD_NUM_OF_BAGS,-1);
 	end if;

	if nvl(:old.ILLUMINATOR_MESSAGE,'*') !=
	   nvl(:new.ILLUMINATOR_MESSAGE,'*')
	then
	   aud_rec.ILLUMINATOR_MESSAGE := nvl(:new.ILLUMINATOR_MESSAGE,'*');
 	end if;

	if nvl(:old.PROD_CATEGORY,'*') !=
	   nvl(:new.PROD_CATEGORY,'*')
	then
	   aud_rec.PROD_CATEGORY := nvl(:new.PROD_CATEGORY,'*');
 	end if;


	insert into PATHOGEN_REDUCTION_DETAILS_ADT
	(
	UNIT_ID,COLL_DATE,CHAPTER_ID,
	INITIAL_PROD_CODE,VOL_TYPE_SET,
	SUSPENSION_TYPE,INIT_PLT_COUNT,
	RBC_CONTENT_STATUS,BLEED_START_TIME,
	BLEED_END_TIME,INITIAL_PROD_WEIGHT,
	INITIAL_PROD_VOL,EQUIP_TYPE,
	ILLUMINATION_START_TIME,SET_ID_LOT_NO,
	TREATMENT_DATE,TREATMENT_START_TIME,
	TREATMENT_TIME,OPERATOR_ID,
	CAD_START_TIME,CAD_END_TIME,
	CAD_TOTAL_TIME,ILLUMINATION_STATUS,
	ANTICOAGULANT_VOLUME,AGGR_ACC,
	SUIT_STATUS_REASON,INSERT_DATE,
	INSERT_USER,PROGRAM_ID,
	AUDIT_KEY,SUIT_STATUS_CODE,
	SUIT_PROD_CODE,ILLUMINATOR_REFERENCE,
	CAD_PROD_CODE,FINAL_PRD_NUM_OF_BAGS,
	ILLUMINATOR_MESSAGE,PROD_CATEGORY,
	AUDIT_INSERT_DATS,AUDIT_INSERT_USER
	)
	values
	(
		aud_rec.UNIT_ID,aud_rec.COLL_DATE,aud_rec.CHAPTER_ID ,
		aud_rec.INITIAL_PROD_CODE, aud_rec.VOL_TYPE_SET ,
		aud_rec.SUSPENSION_TYPE , aud_rec.INIT_PLT_COUNT ,
		aud_rec.RBC_CONTENT_STATUS,aud_rec.BLEED_START_TIME ,
		aud_rec.BLEED_END_TIME, aud_rec.INITIAL_PROD_WEIGHT ,
		aud_rec.INITIAL_PROD_VOL , aud_rec.EQUIP_TYPE ,
		aud_rec.ILLUMINATION_START_TIME,aud_rec.SET_ID_LOT_NO ,
		aud_rec.TREATMENT_DATE, aud_rec.TREATMENT_START_TIME ,
		aud_rec.TREATMENT_TIME , aud_rec.OPERATOR_ID ,
		aud_rec.CAD_START_TIME,aud_rec.CAD_END_TIME ,
		aud_rec.CAD_TOTAL_TIME, aud_rec.ILLUMINATION_STATUS ,
		aud_rec.ANTICOAGULANT_VOLUME , aud_rec.AGGR_ACC ,
		aud_rec.SUIT_STATUS_REASON , aud_rec.INSERT_DATE ,
		aud_rec.INSERT_USER ,aud_rec.PROGRAM_ID ,
		aud_rec.AUDIT_KEY, aud_rec.SUIT_STATUS_CODE ,
		aud_rec.SUIT_PROD_CODE , aud_rec.ILLUMINATOR_REFERENCE ,
		aud_rec.CAD_PROD_CODE , aud_rec.FINAL_PRD_NUM_OF_BAGS ,
		aud_rec.ILLUMINATOR_MESSAGE , aud_rec.PROD_CATEGORY ,
		SYSDATE , lt_user_session.get_userid

	);
end;
```
