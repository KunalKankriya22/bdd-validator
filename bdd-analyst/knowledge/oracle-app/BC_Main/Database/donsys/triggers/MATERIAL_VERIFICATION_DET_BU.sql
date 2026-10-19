--------------------------------------------------------
--  DDL for Trigger MATERIAL_VERIFICATION_DET_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."MATERIAL_VERIFICATION_DET_BU" 
before update
on MATERIAL_VERIFICATION_DET
for each row
begin
	--

	if nvl(:old.UNIT_ID,'*') !=
	   nvl(:new.UNIT_ID,'*')
	then
		begin
				insert into MATERIAL_VERIFICATION_DET_ADT (
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
					:old.UNIT_ID ,
					:new.UNIT_ID);
		end;
	end if;

	if nvl(:old.VERIFICATION_TYPE,'*') !=
	   nvl(:new.VERIFICATION_TYPE,'*')
	then
		begin
				insert into MATERIAL_VERIFICATION_DET_ADT (
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
					'VERIFICATION_TYPE' ,
					:old.VERIFICATION_TYPE ,
					:new.VERIFICATION_TYPE);
		end;
	end if;

	if nvl(:old.CATALOG_NO,'*') !=
	   nvl(:new.CATALOG_NO,'*')
	then
		begin
				insert into MATERIAL_VERIFICATION_DET_ADT (
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
					'CATALOG_NO' ,
					:old.CATALOG_NO ,
					:new.CATALOG_NO);
		end;
	end if;


	if nvl(:old.TUBE_TYPE,'*') !=
	   nvl(:new.TUBE_TYPE,'*')
	then
		begin
				insert into MATERIAL_VERIFICATION_DET_ADT (
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
					:old.TUBE_TYPE ,
					:new.TUBE_TYPE);
		end;
	end if;

	if nvl(:old.ADD_ON_FLAG,'*') !=
	   nvl(:new.ADD_ON_FLAG,'*')
	then
		begin
				insert into MATERIAL_VERIFICATION_DET_ADT (
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
					'ADD_ON_FLAG' ,
					:old.ADD_ON_FLAG ,
					:new.ADD_ON_FLAG);
		end;
	end if;


	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into MATERIAL_VERIFICATION_DET_ADT (
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
				insert into MATERIAL_VERIFICATION_DET_ADT (
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
ALTER TRIGGER "DONSYS"."MATERIAL_VERIFICATION_DET_BU" ENABLE;
