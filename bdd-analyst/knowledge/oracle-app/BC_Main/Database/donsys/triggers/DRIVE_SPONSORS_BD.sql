--------------------------------------------------------
--  DDL for Trigger DRIVE_SPONSORS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DRIVE_SPONSORS_BD" 
 BEFORE DELETE
 ON DRIVE_SPONSORS
 FOR EACH ROW
BEGIN
	--
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'drive_id' ,
					:old.drive_id ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'chapter_id' ,
					:old.chapter_id ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'sponsor_id' ,
					:old.sponsor_id ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'projected_show' ,
					:old.projected_show ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'projected_draw' ,
					:old.projected_draw ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'contact_id' ,
					:old.contact_id ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					'proj_deferral_rate' ,
					:old.proj_deferral_rate ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
					to_char(:old.insert_date,'MM-DD-YYYY HH2
4:MI') ,
					NULL);
		end;
		begin
				insert into DRIVE_SPONSORS_AUDIT (
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
	/*-- Update Proj. show/draw in DRIVES table --*/
	begin
		update drives set
		projected_draw = nvl(projected_draw,0) - :old.projected_draw,
		projected_show = nvl(projected_show,0) - :old.projected_show
		where drive_id = :old.drive_id
		and   chapter_id = :old.chapter_id ;
	end ;
	--
end;
/
ALTER TRIGGER "DONSYS"."DRIVE_SPONSORS_BD" ENABLE;
