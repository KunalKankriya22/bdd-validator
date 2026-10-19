--------------------------------------------------------
--  DDL for Trigger VALID_HH_RESOURCES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HH_RESOURCES_BU" 
before update
on VALID_HH_RESOURCES
for each row
begin
	--

	if nvl(:old.QUESTION_CODE,'*') !=
	   nvl(:new.QUESTION_CODE,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QUESTION_CODE' ,
					:old.QUESTION_CODE ,
					:new.QUESTION_CODE);
		end;
	end if;

	if nvl(:old.RESOURCE_LINK,'*') !=
	   nvl(:new.RESOURCE_LINK,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'RESOURCE_LINK' ,
					:old.RESOURCE_LINK ,
					:new.RESOURCE_LINK);
		end;
	end if;

	if nvl(:old.RESOURCE_DESCRIPTION,'*') !=
	   nvl(:new.RESOURCE_DESCRIPTION,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'RESOURCE_DESCRIPTION' ,
					:old.RESOURCE_DESCRIPTION ,
					:new.RESOURCE_DESCRIPTION);
		end;
	end if;


	if nvl(:old.EFF_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.EFF_DATE,to_date('01-JAN-33'))
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'TERM_DATE' ,
					:old.TERM_DATE ,
					:new.TERM_DATE  );
		end;
	end if;

	if nvl(:old.INSERT_DATE,to_date('01-JAN-33')) !=
	   nvl(:new.INSERT_DATE,to_date('01-JAN-33'))
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'INSERT_DATE' ,
					:old.INSERT_DATE ,
					:new.INSERT_DATE  );
		end;
	end if;


	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'insert_user' ,
					:old.insert_user ,
					:new.insert_user  );
		end;
	end if;

end;
/
ALTER TRIGGER "DONSYS"."VALID_HH_RESOURCES_BU" ENABLE;
