---
tags:
  - trigger
  - UTIL
---
# EMF_PARM_DEF_BU

**Schema**: [[schemas/UTIL/UTIL|UTIL]]
**Table**: [[schemas/UTIL/Tables/EMF_PARM_DEF|EMF_PARM_DEF]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.PROC_CODE,'*') !=
	   nvl(:new.PROC_CODE,'*')
	then
		begin
				insert into EMF_PARM_DEF_ADT(
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
					'PROC_CODE' ,
					:old.PROC_CODE ,
					:new.PROC_CODE);
		end;
	end if;

	if nvl(:old.PARM_NO,-1) !=
	   nvl(:new.PARM_NO,-1)
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
					'PARM_NO' ,
					:old.PARM_NO,
					:new.PARM_NO);
		end;
	end if;

	if nvl(:old.PARM_CODE,'*') !=
	   nvl(:new.PARM_CODE,'*')
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
					'PARM_CODE' ,
					:old.PARM_CODE,
					:new.PARM_CODE);
		end;
	end if;


	if nvl(:old.PARM_TYPE,'*') !=
	   nvl(:new.PARM_TYPE,'*')
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
					'PARM_TYPE' ,
					:old.PARM_TYPE,
					:new.PARM_TYPE);
		end;
	end if;


	if nvl(:old.PARM_INOUT,'*') !=
	   nvl(:new.PARM_INOUT,'*')
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
					'PARM_INOUT' ,
					:old.PARM_INOUT,
					:new.PARM_INOUT);
		end;
	end if;


	if nvl(:old.DEFAULT_VALUE,'*') !=
	   nvl(:new.DEFAULT_VALUE,'*')
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
					'DEFAULT_VALUE' ,
					:old.DEFAULT_VALUE,
					:new.DEFAULT_VALUE);
		end;
	end if;

	if nvl(:old.REF_TABLE,'*') !=
	   nvl(:new.REF_TABLE,'*')
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
					'REF_TABLE' ,
					:old.REF_TABLE,
					:new.REF_TABLE);
		end;
	end if;

	if nvl(:old.REF_COLUMN,'*') !=
	   nvl(:new.REF_COLUMN,'*')
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
					'REF_COLUMN' ,
					:old.REF_COLUMN,
					:new.REF_COLUMN);
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into EMF_PARM_DEF_ADT (
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
				insert into EMF_PARM_DEF_ADT (
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
