--------------------------------------------------------
--  DDL for Trigger TERRITORY_ASSIGNMENTS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."TERRITORY_ASSIGNMENTS_BD" 
 BEFORE DELETE
 ON TERRITORY_ASSIGNMENTS
 FOR EACH ROW
BEGIN
	--
		begin
				insert into TERRITORY_ASSIGNMENTS_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'chapter_id' ,
					:old.chapter_id ,
					NULL);
		end;
		begin
				insert into TERRITORY_ASSIGNMENTS_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'recruiter_id' ,
					:old.recruiter_id ,
					NULL);
		end;
		begin
				insert into TERRITORY_ASSIGNMENTS_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'territory_id' ,
					:old.territory_id ,
					NULL);
		end;
		begin
				insert into TERRITORY_ASSIGNMENTS_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'eff_date' ,
					:old.eff_date ,
					NULL);
		end;
		begin
				insert into TERRITORY_ASSIGNMENTS_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
					'term_date' ,
					:old.term_date ,
					NULL);
		end;
		begin
				insert into TERRITORY_ASSIGNMENTS_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
				insert into TERRITORY_ASSIGNMENTS_AUDIT (
					audit_key ,
					audit_insert_dats ,
					program_id ,
					user_id	 ,
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
/
ALTER TRIGGER "DONSYS"."TERRITORY_ASSIGNMENTS_BD" ENABLE;
