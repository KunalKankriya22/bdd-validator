---
tags:
  - trigger
  - DONSYS
---
# DONATION_TUBES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATION_TUBES|DONATION_TUBES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

	if nvl(:old.TRANSACTION_ID,'*') !=
	   nvl(:new.TRANSACTION_ID,'*')
	then
		begin
				insert into DONATION_TUBES_ADT(
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
					'TRANSACTION_ID' ,
					:old.TRANSACTION_ID ,
					:new.TRANSACTION_ID);
		end;
	end if;

	if nvl(:old.UNIT_ID,'*') !=
	   nvl(:new.UNIT_ID,'*')
	then
		begin
				insert into DONATION_TUBES_ADT (
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
					:old.UNIT_ID,
					:new.UNIT_ID);
		end;
	end if;

	if nvl(:old.TUBE_TYPE,'*') !=
	   nvl(:new.TUBE_TYPE,'*')
	then
		begin
				insert into DONATION_TUBES_ADT (
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
					'TUBE_TYPE' ,
					:old.TUBE_TYPE,
					:new.TUBE_TYPE);
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DONATION_TUBES_ADT (
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
				insert into DONATION_TUBES_ADT (
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
