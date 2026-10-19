---
tags:
  - trigger
  - DONSYS
---
# VALID_RESULT_OVERRIDES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_RESULT_OVERRIDES|VALID_RESULT_OVERRIDES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.TEST_ID,'*') !=
	   nvl(:new.TEST_ID,'*')
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT(
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


	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
					:old.CHAPTER_ID,
					:new.CHAPTER_ID);
		end;
	end if;


	if nvl(:old.CURRENT_RESULT_STATUS,'*') !=
	   nvl(:new.CURRENT_RESULT_STATUS,'*')
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
					'CURRENT_RESULT_STATUS' ,
					:old.CURRENT_RESULT_STATUS,
					:new.CURRENT_RESULT_STATUS);
		end;
	end if;


	if nvl(:old.NEW_RESULT_STATUS,'*') !=
	   nvl(:new.NEW_RESULT_STATUS,'*')
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
					'NEW_RESULT_STATUS' ,
					:old.NEW_RESULT_STATUS,
					:new.NEW_RESULT_STATUS);
		end;
	end if;

	if nvl(:old.OVERRIDE_FLAG,'*') !=
	   nvl(:new.OVERRIDE_FLAG,'*')
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
					'OVERRIDE_FLAG' ,
					:old.OVERRIDE_FLAG,
					:new.OVERRIDE_FLAG);
		end;
	end if;


	if nvl(:old.INTER_CODE,'*') !=
	   nvl(:new.INTER_CODE,'*')
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
					'INTER_CODE' ,
					:old.INTER_CODE,
					:new.INTER_CODE);
		end;
	end if;

	if nvl(:old.EFF_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
				insert into VALID_RESULT_OVERRIDES_AUDIT (
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
