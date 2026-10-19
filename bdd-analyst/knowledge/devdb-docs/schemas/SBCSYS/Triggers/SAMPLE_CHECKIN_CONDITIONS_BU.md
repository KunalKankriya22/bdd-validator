---
tags:
  - trigger
  - SBCSYS
---
# SAMPLE_CHECKIN_CONDITIONS_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/SAMPLE_CHECKIN_CONDITIONS|SAMPLE_CHECKIN_CONDITIONS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.UNIT_ID,'*') !=
	   nvl(:new.UNIT_ID,'*')
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT (
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
					'UNIT_ID' ,
					:old.UNIT_ID ,
					:new.UNIT_ID  );
		end;
	end if;

	if nvl(:old.SAMPLE_TYPE,'*') !=
	   nvl(:new.SAMPLE_TYPE,'*')
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT (
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

	if nvl(:old.BOX_ID,'*') !=
	   nvl(:new.BOX_ID,'*')
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT (
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
					'BOX_ID' ,
					:old.BOX_ID ,
					:new.BOX_ID);
		end;
	end if;

	if nvl(:old.STATUS_FLAG,'*') !=
	   nvl(:new.STATUS_FLAG,'*')
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT (
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
					'STATUS_FLAG' ,
					:old.STATUS_FLAG ,
					:new.STATUS_FLAG);
		end;
	end if;
	if nvl(:old.TEST_ID,'*') !=
	   nvl(:new.TEST_ID,'*')
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT (
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
					'TEST_ID' ,
					:old.TEST_ID ,
					:new.TEST_ID);
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT (
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
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT(
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

	if nvl(:old.OVR_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.OVR_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT (
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
					'OVR_DATE' ,
					:old.OVR_DATE,
					:new.OVR_DATE);
		end;
	end if;

	if nvl(:old.OVR_USER_ID,'*') !=
	   nvl(:new.OVR_USER_ID,'*')
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT(
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
					'OVR_USER_ID' ,
					:old.OVR_USER_ID ,
					:new.OVR_USER_ID  );
		end;
	end if;

	if nvl(:old.OVR_REASON_CODE,'*') !=
	   nvl(:new.OVR_REASON_CODE,'*')
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT(
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
					'OVR_REASON_CODE' ,
					:old.OVR_REASON_CODE ,
					:new.OVR_REASON_CODE  );
		end;
	end if;

	if nvl(:old.OVR_NOTE_ID,-1) !=
	   nvl(:new.OVR_NOTE_ID,-1)
	then
		begin
				insert into SAMPLE_CHECKIN_CONDITIONS_ADT(
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
					'OVR_NOTE_ID' ,
					:old.OVR_NOTE_ID ,
					:new.OVR_NOTE_ID  );
		end;
	end if;



--
end;
```
