---
tags:
  - trigger
  - DONSYS
---
# DRIVE_EQUIP_QC_DET_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVE_EQUIP_QC_DET|DRIVE_EQUIP_QC_DET]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.DRIVE_ID,'*') !=
	   nvl(:new.DRIVE_ID,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT(
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'DRIVE_ID' ,
					:old.DRIVE_ID ,
					:new.DRIVE_ID);
		end;
	end if;

	if nvl(:old.DRIVE_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.DRIVE_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'DRIVE_DATE' ,
					:old.DRIVE_DATE ,
					:new.DRIVE_DATE  );
		end;
	end if;


	if nvl(:old.DRIVE_PROFILE_CODE,'*') !=
	   nvl(:new.DRIVE_PROFILE_CODE,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'DRIVE_PROFILE_CODE' ,
					:old.DRIVE_PROFILE_CODE ,
					:new.DRIVE_PROFILE_CODE);
		end;
	end if;

	if nvl(:old.EQUIP_OR_SUPPLY,'*') !=
	   nvl(:new.EQUIP_OR_SUPPLY,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'EQUIP_OR_SUPPLY' ,
					:old.EQUIP_OR_SUPPLY ,
					:new.EQUIP_OR_SUPPLY);
		end;
	end if;

	if nvl(:old.EQUIP_SUPPLY_CODE,'*') !=
	   nvl(:new.EQUIP_SUPPLY_CODE,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'EQUIP_SUPPLY_CODE' ,
					:old.EQUIP_SUPPLY_CODE ,
					:new.EQUIP_SUPPLY_CODE);
		end;
	end if;

	if nvl(:old.QC_TEST_PARM_CODE,'*') !=
	   nvl(:new.QC_TEST_PARM_CODE,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QC_TEST_PARM_CODE' ,
					:old.QC_TEST_PARM_CODE ,
					:new.QC_TEST_PARM_CODE);
		end;
	end if;

	if nvl(:old.QC_VALUE_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.QC_VALUE_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QC_VALUE_DATE' ,
					:old.QC_VALUE_DATE ,
					:new.QC_VALUE_DATE  );
		end;
	end if;

	if nvl(:old.QC_VALUE_SCAN,'*') !=
	   nvl(:new.QC_VALUE_SCAN,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QC_VALUE_SCAN' ,
					:old.QC_VALUE_SCAN,
					:new.QC_VALUE_SCAN);
		end;
	end if;

	if nvl(:old.QC_VALUE_DATA,'*') !=
	   nvl(:new.QC_VALUE_DATA,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QC_VALUE_DATA' ,
					:old.QC_VALUE_DATA ,
					:new.QC_VALUE_DATA);
		end;
	end if;


	if nvl(:old.BAG_CATALOG_NO,'*') !=
	   nvl(:new.BAG_CATALOG_NO,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'BAG_CATALOG_NO' ,
					:old.BAG_CATALOG_NO,
					:new.BAG_CATALOG_NO);
		end;
	end if;

	if nvl(:old.BAG_LOT_NO,'*') !=
	   nvl(:new.BAG_LOT_NO,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'BAG_LOT_NO' ,
					:old.BAG_LOT_NO,
					:new.BAG_LOT_NO);
		end;
	end if;

	if nvl(:old.BAG_OPENED,'*') !=
	   nvl(:new.BAG_OPENED,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'BAG_OPENED' ,
					:old.BAG_OPENED,
					:new.BAG_OPENED);
		end;
	end if;

	if nvl(:old.BAG_OPENED_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.BAG_OPENED_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'BAG_OPENED_DATE' ,
					:old.BAG_OPENED_DATE,
					:new.BAG_OPENED_DATE);
		end;
	end if;

	if nvl(:old.BAG_EXPIRY_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.BAG_EXPIRY_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'BAG_EXPIRY_DATE' ,
					:old.BAG_EXPIRY_DATE,
					:new.BAG_EXPIRY_DATE);
		end;
	end if;

	if nvl(:old.QC_STATUS,'*') !=
	   nvl(:new.QC_STATUS,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QC_STATUS' ,
					:old.QC_STATUS,
					:new.QC_STATUS);
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'insert_date' ,
					:old.insert_date ,
					:new.insert_date  );
		end;
	end if;

	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'insert_user' ,
					:old.insert_user ,
					:new.insert_user  );
		end;
	end if;

	if nvl(:old.EQUIP_TYPE,'*') !=
	   nvl(:new.EQUIP_TYPE,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'EQUIP_TYPE' ,
					:old.EQUIP_TYPE,
					:new.EQUIP_TYPE);
		end;
	end if;

	if nvl(:old.EQUIP_REFERENCE,'*') !=
	   nvl(:new.EQUIP_REFERENCE,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'EQUIP_REFERENCE' ,
					:old.EQUIP_REFERENCE,
					:new.EQUIP_REFERENCE);
		end;
	end if;

	if nvl(:old.SUPPLY_ID,'*') !=
	   nvl(:new.SUPPLY_ID,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'SUPPLY_ID' ,
					:old.SUPPLY_ID,
					:new.SUPPLY_ID);
		end;
	end if;

	if nvl(:old.SET_ID,'*') !=
	   nvl(:new.SET_ID,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'SET_ID' ,
					:old.SET_ID,
					:new.SET_ID);
		end;
	end if;

	if nvl(:old.SORT_SEQUENCE,-1) !=
	   nvl(:new.SORT_SEQUENCE,-1)
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'SORT_SEQUENCE' ,
					:old.SORT_SEQUENCE,
					:new.SORT_SEQUENCE);
		end;
	end if;

	if nvl(:old.SET_ID,'*') !=
	   nvl(:new.SET_ID,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QC_CONDITION_CODE' ,
					:old.QC_CONDITION_CODE,
					:new.QC_CONDITION_CODE);
		end;
	end if;

	if nvl(:old.DATA_TYPE,'*') !=
	   nvl(:new.DATA_TYPE,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'DATA_TYPE' ,
					:old.DATA_TYPE,
					:new.DATA_TYPE);
		end;
	end if;

	if nvl(:old.COMMENTS,'*') !=
	   nvl(:new.COMMENTS,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'COMMENTS' ,
					:old.COMMENTS,
					:new.COMMENTS);
		end;
	end if;

	if nvl(:old.IS_COPY,-1) !=
	   nvl(:new.IS_COPY,-1)
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'IS_COPY' ,
					:old.IS_COPY,
					:new.IS_COPY);
		end;
	end if;

	if nvl(:old.DEVICE_STATUS,'*') !=
	   nvl(:new.DEVICE_STATUS,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'DEVICE_STATUS' ,
					:old.DEVICE_STATUS,
					:new.DEVICE_STATUS);
		end;
	end if;

	if nvl(:old.DEVICE_COMMENTS,'*') !=
	   nvl(:new.DEVICE_COMMENTS,'*')
	then
		begin
				insert into DRIVE_EQUIP_QC_DET_ADT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id  ,
					action_code ,
					column_name ,
					old_value ,
					new_value)
				values (
					:old.audit_key ,
					sysdate ,
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'DEVICE_COMMENTS' ,
					:old.DEVICE_COMMENTS,
					:new.DEVICE_COMMENTS);
		end;
	end if;

--
end;
```
