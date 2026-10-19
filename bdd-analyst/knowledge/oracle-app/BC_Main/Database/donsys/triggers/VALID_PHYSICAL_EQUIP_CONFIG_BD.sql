--------------------------------------------------------
--  DDL for Trigger VALID_PHYSICAL_EQUIP_CONFIG_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PHYSICAL_EQUIP_CONFIG_BD" 
before delete
on VALID_PHYSICAL_EQUIP_CONFIG
for each row
begin
	--

		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'PHYSICAL_CODE' ,
					:old.PHYSICAL_CODE ,
					NULL);
		end;

		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'EQUIP_TYPE' ,
					:old.EQUIP_TYPE ,
					NULL);
		end;


		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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

		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
	--
end;
/
ALTER TRIGGER "DONSYS"."VALID_PHYSICAL_EQUIP_CONFIG_BD" ENABLE;
