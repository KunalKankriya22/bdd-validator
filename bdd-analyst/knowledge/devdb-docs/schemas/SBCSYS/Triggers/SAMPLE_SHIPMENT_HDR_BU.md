---
tags:
  - trigger
  - SBCSYS
---
# SAMPLE_SHIPMENT_HDR_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/SAMPLE_SHIPMENT_HDR|SAMPLE_SHIPMENT_HDR]]
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
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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

	if nvl(:old.SHIPMENT_NO,'*') !=
	   nvl(:new.SHIPMENT_NO,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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


	if nvl(:old.PACK_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.PACK_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
					'PACK_DATE' ,
					:old.PACK_DATE ,
					:new.PACK_DATE  );
		end;
	end if;

	if nvl(:old.FACILITY_CODE,'*') !=
	   nvl(:new.FACILITY_CODE,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
					'FACILITY_CODE' ,
					:old.FACILITY_CODE ,
					:new.FACILITY_CODE  );
		end;
	end if;

	if nvl(:old.BOX_STATUS,'*') !=
	   nvl(:new.BOX_STATUS,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
					'BOX_STATUS' ,
					:old.BOX_STATUS ,
					:new.BOX_STATUS  );
		end;
	end if;


	if nvl(:old.BOX_CLOSED_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.BOX_CLOSED_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
					'BOX_CLOSED_DATE' ,
					:old.BOX_CLOSED_DATE ,
					:new.BOX_CLOSED_DATE  );
		end;
	end if;

	if nvl(:old.BOX_CLOSED_USER,'*') !=
	   nvl(:new.BOX_CLOSED_USER,'*')
	then
		begin
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
					'BOX_CLOSED_USER' ,
					:old.BOX_CLOSED_USER ,
					:new.BOX_CLOSED_USER  );
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
				insert into SAMPLE_SHIPMENT_HDR_AUDIT (
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
