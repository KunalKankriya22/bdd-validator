---
tags:
  - trigger
  - DONSYS
---
# VALID_DONPROC_CONSENTS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_DONPROC_CONSENTS|VALID_DONPROC_CONSENTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

		begin
				insert into VALID_DONPROC_CONSENTS_ADT (
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
					'DONATION_TYPE' ,
					:old.DONATION_TYPE,
					NULL);
		end;

		begin
				insert into VALID_DONPROC_CONSENTS_ADT (
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
					'CHAPTER_ID' ,
					:old.CHAPTER_ID,
					NULL);
		end;

		begin
				insert into VALID_DONPROC_CONSENTS_ADT (
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
					'PROCEDURE_CODE' ,
					:old.PROCEDURE_CODE,
					NULL);
		end;

		begin
				insert into VALID_DONPROC_CONSENTS_ADT (
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
					'CONSENT_CODE' ,
					:old.CONSENT_CODE,
					NULL);
		end;

		begin
				insert into VALID_DONPROC_CONSENTS_ADT (
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
					'EFF_DATE' ,
					:old.EFF_DATE,
					NULL);
		end;
		begin
				insert into VALID_DONPROC_CONSENTS_ADT (
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
					'TERM_DATE' ,
					:old.TERM_DATE,
					NULL);
		end;
		begin
				insert into VALID_DONPROC_CONSENTS_ADT (
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
				insert into VALID_DONPROC_CONSENTS_ADT (
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
