---
tags:
  - trigger
  - SBCSYS
---
# VALID_CUSTMR_CNFRM_TSTS_BD

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_CUSTOMER_CONFIRM_TESTS|VALID_CUSTOMER_CONFIRM_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
	--

		begin
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
					'CONTRACT_ID' ,
					:old.CONTRACT_ID ,
					NULL);
		end;

		begin
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
					'REACTIVE_TEST_ID' ,
					:old.REACTIVE_TEST_ID ,
					NULL);
		end;

		begin
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
					'REACTIVE_TEST_RESULT' ,
					:old.REACTIVE_TEST_RESULT ,
					NULL);
		end;

		begin
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
					'REACTIVE_PLATE_SEQ' ,
					:old.REACTIVE_PLATE_SEQ ,
					NULL);
		end;

		begin
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
					'CONFIRM_TEST_ID' ,
					:old.CONFIRM_TEST_ID ,
					NULL);
		end;


		begin
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
					'insert_date' ,
					:old.insert_date ,
					NULL);
		end;


		begin
				insert into VALID_CUSTMR_CNFRM_TSTS_ADT (
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
					'insert_user' ,
					:old.insert_user ,
					NULL);
		end;



	--
end;
```
