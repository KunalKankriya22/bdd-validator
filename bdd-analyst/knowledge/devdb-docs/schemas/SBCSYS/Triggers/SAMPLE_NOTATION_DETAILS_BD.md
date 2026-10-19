---
tags:
  - trigger
  - SBCSYS
---
# SAMPLE_NOTATION_DETAILS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/SAMPLE_NOTATION_DETAILS|SAMPLE_NOTATION_DETAILS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
					:old.CHAPTER_ID ,
					NULL);
		end;

		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
					'NOTATION_CODE' ,
					:old.NOTATION_CODE ,
					NULL);
		end;


		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
					'TEST_ID' ,
					:old.TEST_ID ,
					NULL);
		end;

		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
					'TEST_SERIES_ID' ,
					:old.TEST_SERIES_ID ,
					NULL);
		end;

		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
					:old.EFF_DATE ,
					NULL);
		end;

		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
					:old.TERM_DATE ,
					NULL);
		end;

		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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

		begin
				insert into SAMPLE_NOTATION_DETAILS_ADT (
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
	--
end;
```
