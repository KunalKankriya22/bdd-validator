---
tags:
  - trigger
  - SBCSYS
---
# SAMPLE_SHIPMENT_IN_DET_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/SAMPLE_SHIPMENT_IN_DET|SAMPLE_SHIPMENT_IN_DET]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.BOX_ID,'*') !=
	   nvl(:new.BOX_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'box_id' ,
					:old.box_id ,
					:new.box_id  );
		end;
	end if;



	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'CHAPTER_ID' ,
					:old.CHAPTER_ID ,
					:new.CHAPTER_ID  );
		end;
	end if;

	if nvl(:old.INT_UNIT_ID,'*') !=
	   nvl(:new.INT_UNIT_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'INT_UNIT_ID' ,
					:old.INT_UNIT_ID ,
					:new.INT_UNIT_ID  );
		end;
	end if;

	if nvl(:old.EXT_UNIT_ID,'*') !=
	   nvl(:new.EXT_UNIT_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'EXT_UNIT_ID' ,
					:old.EXT_UNIT_ID ,
					:new.EXT_UNIT_ID  );
		end;
	end if;


	if nvl(:old.COLL_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.COLL_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'COLL_DATE' ,
					:old.COLL_DATE ,
					:new.COLL_DATE  );
		end;
	end if;



	if nvl(:old.CONTRACT_ID,'*') !=
	   nvl(:new.CONTRACT_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'CONTRACT_ID' ,
					:old.CONTRACT_ID ,
					:new.CONTRACT_ID  );
		end;
	end if;

	if nvl(:old.SAMPLE_TYPE,'*') !=
	   nvl(:new.SAMPLE_TYPE,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'SAMPLE_TYPE' ,
					:old.SAMPLE_TYPE ,
					:new.SAMPLE_TYPE  );
		end;
	end if;

	if nvl(:old.FROZEN_FLAG,'*') !=
	   nvl(:new.FROZEN_FLAG,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'FROZEN_FLAG' ,
					:old.FROZEN_FLAG ,
					:new.FROZEN_FLAG  );
		end;
	end if;

	if nvl(:old.THAW_FLAG,'*') !=
	   nvl(:new.THAW_FLAG,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'THAW_FLAG' ,
					:old.THAW_FLAG ,
					:new.THAW_FLAG  );
		end;
	end if;


	if nvl(:old.THAW_START_TIME,to_date('01-JAN-33')) !=
	   nvl(:new.THAW_START_TIME,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'THAW_START_TIME' ,
					:old.THAW_START_TIME ,
					:new.THAW_START_TIME  );
		end;
	end if;


	if nvl(:old.ALIQUOT,'*') !=
	   nvl(:new.ALIQUOT,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
					'ALIQUOT' ,
					:old.ALIQUOT ,
					:new.ALIQUOT  );
		end;
	end if;




	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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
				insert into SAMPLE_SHIPMENT_IN_DET_AUDIT (
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

--
end;



```
