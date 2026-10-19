---
tags:
  - trigger
  - DONSYS
---
# DONATION_TUBES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATION_TUBES|DONATION_TUBES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

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
					'DELETE' ,
					substr(lt_user_session.get_userid,1,6) ,
					'D',
					'TRANSACTION_ID' ,
					:old.TRANSACTION_ID ,
					NULL);
		end;

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
					'DELETE' ,
					substr(lt_user_session.get_userid,1,6) ,
					'D',
					'UNIT_ID' ,
					:old.UNIT_ID ,
					NULL);
		end;

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
					'DELETE' ,
					substr(lt_user_session.get_userid,1,6) ,
					'D',
					'TUBE_TYPE' ,
					:old.TUBE_TYPE ,
					NULL);
		end;


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
					'DELETE' ,
					substr(lt_user_session.get_userid,1,6) ,
					'D',
					'INSERT_DATE' ,
					:old.INSERT_DATE ,
					NULL);
		end;

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
					'DELETE' ,
					substr(lt_user_session.get_userid,1,6) ,
					'D',
					'INSERT_USER' ,
					:old.INSERT_USER ,
					NULL);
		end;


	--
end;
```
