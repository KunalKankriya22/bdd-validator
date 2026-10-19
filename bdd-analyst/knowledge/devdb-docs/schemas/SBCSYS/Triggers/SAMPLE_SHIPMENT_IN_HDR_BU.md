---
tags:
  - trigger
  - SBCSYS
---
# SAMPLE_SHIPMENT_IN_HDR_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/SAMPLE_SHIPMENT_IN_HDR|SAMPLE_SHIPMENT_IN_HDR]]
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
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'chapter_id' ,
					:old.chapter_id ,
					:new.chapter_id  );
		end;
	end if;

	if nvl(:old.TRANSFER_MODE,'*') !=
	   nvl(:new.TRANSFER_MODE,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'TRANSFER_MODE' ,
					:old.TRANSFER_MODE ,
					:new.TRANSFER_MODE  );
		end;
	end if;

	if nvl(:old.CONTRACT_ID,'*') !=
	   nvl(:new.CONTRACT_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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

	if nvl(:old.PROFILE_SET_ID,'*') !=
	   nvl(:new.PROFILE_SET_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'PROFILE_SET_ID' ,
					:old.PROFILE_SET_ID ,
					:new.PROFILE_SET_ID  );
		end;
	end if;

	if nvl(:old.SHIPMENT_NO,'*') !=
	   nvl(:new.SHIPMENT_NO,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'SHIPMENT_NO' ,
					:old.SHIPMENT_NO ,
					:new.SHIPMENT_NO  );
		end;
	end if;

	if nvl(:old.SHIPMENT_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.SHIPMENT_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'SHIPMENT_DATE' ,
					:old.SHIPMENT_DATE ,
					:new.SHIPMENT_DATE  );
		end;
	end if;


	if nvl(:old.RECEIVED_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.RECEIVED_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'RECEIVED_DATE' ,
					:old.RECEIVED_DATE ,
					:new.RECEIVED_DATE  );
		end;
	end if;

	if nvl(:old.BATCH_ID,'*') !=
	   nvl(:new.BATCH_ID,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'BATCH_ID' ,
					:old.BATCH_ID ,
					:new.BATCH_ID  );
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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

	if nvl(:old.BOX_IN_STATUS,'*') !=
	   nvl(:new.BOX_IN_STATUS,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_IN_HDR_AUDIT (
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
					'chapter_id' ,
					:old.chapter_id ,
					:new.chapter_id  );
		end;
	end if;


--
end;

```
