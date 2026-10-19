---
tags:
  - trigger
  - DONSYS
---
# DRIVE_ESTIMATED_RESOURCES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DRIVE_ESTIMATED_RESOURCES|DRIVE_ESTIMATED_RESOURCES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	--
	if nvl(:old.drive_id,'*') !=
	   nvl(:new.drive_id,'*')
	then
		begin
				insert into DRIVE_EST_RESOURCES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'drive_id' ,
					:old.drive_id ,
					:new.drive_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into DRIVE_EST_RESOURCES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
	if nvl(:old.resource_code,'*') !=
	   nvl(:new.resource_code,'*')
	then
		begin
				insert into DRIVE_EST_RESOURCES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'resource_code' ,
					:old.resource_code ,
					:new.resource_code  );
		end;
	end if;
	if nvl(:old.number_reqd,-1) !=
	   nvl(:new.number_reqd,-1)
	then
		begin
				insert into DRIVE_EST_RESOURCES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'number_reqd' ,
					:old.number_reqd ,
					:new.number_reqd  );
		end;
	end if;
	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DRIVE_EST_RESOURCES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
				insert into DRIVE_EST_RESOURCES_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
