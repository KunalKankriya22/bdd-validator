---
tags:
  - trigger
  - SBCSYS
---
# VALID_SERIES_TEST_CONFIG_BU

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_SERIES_TEST_CONFIG|VALID_SERIES_TEST_CONFIG]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: DISABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.TEST_SERIES_ID,'*') !=
	   nvl(:new.TEST_SERIES_ID,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'TEST_SERIES_ID' ,
					:old.TEST_SERIES_ID ,
					:new.TEST_SERIES_ID  );
		end;
	end if;

	if nvl(:old.LEVEL_CODE,-1) !=
	   nvl(:new.LEVEL_CODE,-1)
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'LEVEL_CODE' ,
					:old.LEVEL_CODE ,
					:new.LEVEL_CODE  );
		end;
	end if;

	if nvl(:old.SET_NO,-1) !=
	   nvl(:new.SET_NO,-1)
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'SET_NO' ,
					:old.SET_NO ,
					:new.SET_NO  );
		end;
	end if;

	if nvl(:old.TEST_ID,'*') !=
	   nvl(:new.TEST_ID,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					:new.TEST_ID  );
		end;
	end if;


	if nvl(:old.RESULT_CODE,'*') !=
	   nvl(:new.RESULT_CODE,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'RESULT_CODE' ,
					:old.RESULT_CODE ,
					:new.RESULT_CODE  );
		end;
	end if;

	if nvl(:old.SCHEDULE_TEST,'*') !=
	   nvl(:new.SCHEDULE_TEST,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'SCHEDULE_TEST' ,
					:old.SCHEDULE_TEST ,
					:new.SCHEDULE_TEST  );
		end;
	end if;

	if nvl(:old.CANCEL_TEST,'*') !=
	   nvl(:new.CANCEL_TEST,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'CANCEL_TEST' ,
					:old.CANCEL_TEST ,
					:new.CANCEL_TEST  );
		end;
	end if;


	if nvl(:old.EFF_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'EFF_DATE' ,
					:old.EFF_DATE ,
					:new.EFF_DATE  );
		end;
	end if;

	if nvl(:old.TERM_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.TERM_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'TERM_DATE' ,
					:old.TERM_DATE ,
					:new.TERM_DATE  );
		end;
	end if;

	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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

	if nvl(:old.ANOTATION_CODE,'*') !=
	   nvl(:new.ANOTATION_CODE,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'ANOTATION_CODE' ,
					:old.ANOTATION_CODE ,
					:new.ANOTATION_CODE );
		end;
	end if;

	if nvl(:old.FINAL_FLAG,'*') !=
	   nvl(:new.FINAL_FLAG,'*')
	then
		begin
				insert into VALID_SERIES_TST_CONFG_HDR_ADT (
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
					'FINAL_FLAG' ,
					:old.FINAL_FLAG ,
					:new.FINAL_FLAG );
		end;
	end if;




--
end;
```
