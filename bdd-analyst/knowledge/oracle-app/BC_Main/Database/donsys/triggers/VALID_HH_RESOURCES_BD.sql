--------------------------------------------------------
--  DDL for Trigger VALID_HH_RESOURCES_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_RESOURCES_BD" 
before delete
on VALID_HH_RESOURCES
for each row
begin
	--

		begin
				insert into VALID_HH_RESOURCES_ADT (
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
					'QUESTION_CODE' ,
					:old.QUESTION_CODE ,
					NULL);
		end;

		begin
				insert into VALID_HH_RESOURCES_ADT (
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
					'RESOURCE_LINK' ,
					:old.RESOURCE_LINK ,
					NULL);
		end;

		begin
				insert into VALID_HH_RESOURCES_ADT (
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
					'RESOURCE_DESCRIPTION' ,
					:old.RESOURCE_DESCRIPTION ,
					NULL);
		end;

		begin
				insert into VALID_HH_RESOURCES_ADT (
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
				insert into VALID_HH_RESOURCES_ADT (
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
				insert into VALID_HH_RESOURCES_ADT (
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
				insert into VALID_HH_RESOURCES_ADT (
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


end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_RESOURCES_BD" ENABLE;
