---
tags:
  - trigger
  - UTIL
---
# EMF_SOURCE_PROCESS_BU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/EMF_SOURCE_PROCESS|EMF_SOURCE_PROCESS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.PROCESS_CODE,'*') !=
	   nvl(:new.PROCESS_CODE,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT(
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
					'PROCESS_CODE' ,
					:old.PROCESS_CODE ,
					:new.PROCESS_CODE);
		end;
	end if;


	if nvl(:old.PROCESS_AT,'*') !=
	   nvl(:new.PROCESS_AT,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'PROCESS_AT' ,
					:old.PROCESS_AT,
					:new.PROCESS_AT);
		end;
	end if;


	if nvl(:old.PROCESS_SEQ,-1) !=
	   nvl(:new.PROCESS_SEQ,-1)
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'PROCESS_SEQ' ,
					:old.PROCESS_SEQ,
					:new.PROCESS_SEQ);
		end;
	end if;


	if nvl(:old.LOOKING_FOR,'*') !=
	   nvl(:new.LOOKING_FOR,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'LOOKING_FOR' ,
					:old.LOOKING_FOR,
					:new.LOOKING_FOR);
		end;
	end if;


	if nvl(:old.DATA_TABLE_NAME,'*') !=
	   nvl(:new.DATA_TABLE_NAME,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'DATA_TABLE_NAME' ,
					:old.DATA_TABLE_NAME,
					:new.DATA_TABLE_NAME);
		end;
	end if;

	if nvl(:old.DATA_COLUMN_NAME,'*') !=
	   nvl(:new.DATA_COLUMN_NAME,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'DATA_COLUMN_NAME' ,
					:old.DATA_COLUMN_NAME,
					:new.DATA_COLUMN_NAME);
		end;
	end if;
--------------------------------------------------------------------------

	if nvl(:old.SQL_OPER,'*') !=
	   nvl(:new.SQL_OPER,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'SQL_OPER' ,
					:old.SQL_OPER,
					:new.SQL_OPER);
		end;
	end if;

	if nvl(:old.RESPONSE,'*') !=
	   nvl(:new.RESPONSE,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'RESPONSE' ,
					:old.RESPONSE,
					:new.RESPONSE);
		end;
	end if;

	if nvl(:old.SQL_STMT,'*') !=
	   nvl(:new.SQL_STMT,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'SQL_STMT' ,
					:old.SQL_STMT,
					:new.SQL_STMT);
		end;
	end if;

	if nvl(:old.PARAM_FLAG,'*') !=
	   nvl(:new.PARAM_FLAG,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'PARAM_FLAG' ,
					:old.PARAM_FLAG,
					:new.PARAM_FLAG);
		end;
	end if;

	if nvl(:old.SQL_OUT,'*') !=
	   nvl(:new.SQL_OUT,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					'SQL_OUT' ,
					:old.SQL_OUT,
					:new.SQL_OUT);
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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
					:old.insert_date ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'insert_date' ,
					:new.insert_date  );
		end;
	end if;

	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into EMF_SOURCE_PROCESS_ADT (
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

end;
```
