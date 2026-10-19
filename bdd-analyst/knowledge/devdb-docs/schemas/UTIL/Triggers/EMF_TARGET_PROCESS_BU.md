---
tags:
  - trigger
  - UTIL
---
# EMF_TARGET_PROCESS_BU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/EMF_TARGET_PROCESS|EMF_TARGET_PROCESS]]
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
				insert into EMF_TARGET_PROCESS_ADT(
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
				insert into EMF_TARGET_PROCESS_ADT (
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


	if nvl(:old.ACTION_SEQ,'*') !=
	   nvl(:new.ACTION_SEQ,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'ACTION_SEQ' ,
					:old.ACTION_SEQ,
					:new.ACTION_SEQ);
		end;
	end if;


	if nvl(:old.ACTION_CODE,'*') !=
	   nvl(:new.ACTION_CODE,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'ACTION_CODE' ,
					:old.ACTION_CODE,
					:new.ACTION_CODE);
		end;
	end if;


	if nvl(:old.ACTION_ON,'*') !=
	   nvl(:new.ACTION_ON,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'ACTION_ON' ,
					:old.ACTION_ON,
					:new.ACTION_ON);
		end;
	end if;

	if nvl(:old.ACTION_VALUE,'*') !=
	   nvl(:new.ACTION_VALUE,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'ACTION_VALUE' ,
					:old.ACTION_VALUE,
					:new.ACTION_VALUE);
		end;
	end if;


	if nvl(:old.DATA_TABLE_NAME,'*') !=
	   nvl(:new.DATA_TABLE_NAME,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
				insert into EMF_TARGET_PROCESS_ADT (
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

	if nvl(:old.SQL_OPER,'*') !=
	   nvl(:new.SQL_OPER,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
				insert into EMF_TARGET_PROCESS_ADT (
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

	if nvl(:old.PROCESS_ORDER,'*') !=
	   nvl(:new.PROCESS_ORDER,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'PROCESS_ORDER' ,
					:old.PROCESS_ORDER,
					:new.PROCESS_ORDER);
		end;
	end if;
--------------------

	if nvl(:old.ACTION_FNCS,'*') !=
	   nvl(:new.ACTION_FNCS,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'ACTION_FNCS' ,
					:old.ACTION_FNCS,
					:new.ACTION_FNCS);
		end;
	end if;

	if nvl(:old.PARENT_ACTION_SEQ,'*') !=
	   nvl(:new.PARENT_ACTION_SEQ,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'PARENT_ACTION_SEQ' ,
					:old.PARENT_ACTION_SEQ,
					:new.PARENT_ACTION_SEQ);
		end;
	end if;
	if nvl(:old.ALT_PROCESS_ORDER,'*') !=
	   nvl(:new.ALT_PROCESS_ORDER,'*')
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
					'ALT_PROCESS_ORDER' ,
					:old.ALT_PROCESS_ORDER,
					:new.ALT_PROCESS_ORDER);
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into EMF_TARGET_PROCESS_ADT (
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
				insert into EMF_TARGET_PROCESS_ADT (
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
