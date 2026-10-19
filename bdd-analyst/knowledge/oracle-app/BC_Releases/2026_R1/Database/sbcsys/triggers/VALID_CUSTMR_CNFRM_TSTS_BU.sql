--------------------------------------------------------
--  DDL for Trigger VALID_CUSTMR_CNFRM_TSTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VALID_CUSTMR_CNFRM_TSTS_BU" 
before update
on VALID_CUSTOMER_CONFIRM_TESTS
for each row
begin
	--

	if nvl(:old.CONTRACT_ID,'*') !=
	   nvl(:new.CONTRACT_ID,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'CONTRACT_ID' ,
					:old.CONTRACT_ID ,
					:new.CONTRACT_ID);
		end;
	end if;

	if nvl(:old.REACTIVE_TEST_ID,'*') !=
	   nvl(:new.REACTIVE_TEST_ID,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'REACTIVE_TEST_ID' ,
					:old.REACTIVE_TEST_ID ,
					:new.REACTIVE_TEST_ID);
		end;
	end if;

	if nvl(:old.REACTIVE_TEST_RESULT,'*') !=
	   nvl(:new.REACTIVE_TEST_RESULT,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'REACTIVE_TEST_RESULT' ,
					:old.REACTIVE_TEST_RESULT ,
					:new.REACTIVE_TEST_RESULT);
		end;
	end if;

	if nvl(:old.REACTIVE_PLATE_SEQ,'*') !=
	   nvl(:new.REACTIVE_PLATE_SEQ,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'REACTIVE_PLATE_SEQ' ,
					:old.REACTIVE_PLATE_SEQ ,
					:new.REACTIVE_PLATE_SEQ);
		end;
	end if;

	if nvl(:old.CONFIRM_TEST_ID,'*') !=
	   nvl(:new.CONFIRM_TEST_ID,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'CONFIRM_TEST_ID' ,
					:old.CONFIRM_TEST_ID ,
					:new.CONFIRM_TEST_ID);
		end;
	end if;





	if nvl(:old.EFF_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date('01-JAN-33'))
	then
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
/
ALTER TRIGGER "VALID_CUSTMR_CNFRM_TSTS_BU" ENABLE;
