---
tags:
  - trigger
  - UTIL
---
# EMF_PROCESS_MAPPING_BU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/EMF_PROCESS_MAPPING|EMF_PROCESS_MAPPING]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.MAPPING_NAME,'*') !=
	   nvl(:new.MAPPING_NAME,'*')
	then
		begin
				insert into EMF_PROCESS_MAPPING_ADT(
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
					'MAPPING_NAME' ,
					:old.MAPPING_NAME ,
					:new.MAPPING_NAME);
		end;
	end if;


	if nvl(:old.DATA_COLUMN_NAME,'*') !=
	   nvl(:new.DATA_COLUMN_NAME,'*')
	then
		begin
				insert into EMF_PROCESS_MAPPING_ADT (
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


	if nvl(:old.DATA_TABLE_NAME,'*') !=
	   nvl(:new.DATA_TABLE_NAME,'*')
	then
		begin
				insert into EMF_PROCESS_MAPPING_ADT (
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


	if nvl(:old.WHERE_CLAUSE,'*') !=
	   nvl(:new.WHERE_CLAUSE,'*')
	then
		begin
				insert into EMF_PROCESS_MAPPING_ADT (
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
					'WHERE_CLAUSE' ,
					:old.WHERE_CLAUSE,
					:new.WHERE_CLAUSE);
		end;
	end if;


	if nvl(:old.SQL_STMT,'*') !=
	   nvl(:new.SQL_STMT,'*')
	then
		begin
				insert into EMF_PROCESS_MAPPING_ADT (
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

	if nvl(:old.PROCESS_CODE,'*') !=
	   nvl(:new.PROCESS_CODE,'*')
	then
		begin
				insert into EMF_PROCESS_MAPPING_ADT (
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
					:old.PROCESS_CODE,
					:new.PROCESS_CODE);
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into EMF_PROCESS_MAPPING_ADT (
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
				insert into EMF_PROCESS_MAPPING_ADT (
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
