--------------------------------------------------------
--  DDL for Trigger FIXED_SITE_STAFF_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."FIXED_SITE_STAFF_BU" 
 BEFORE UPDATE
 ON FIXED_SITE_STAFF
 FOR EACH ROW
BEGIN
	--
	if nvl(:old.site_id,'*') !=
	   nvl(:new.site_id,'*')
	then
		begin
				insert into FIXED_SITE_STAFF_AUDIT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'site_id' ,
					:old.site_id ,
					:new.site_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into FIXED_SITE_STAFF_AUDIT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'chapter_id' ,
					:old.chapter_id ,
					:new.chapter_id  );
		end;
	end if;
	if nvl(:old.staff_no,'*') !=
	   nvl(:new.staff_no,'*')
	then
		begin
				insert into FIXED_SITE_STAFF_AUDIT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'name' ,
					:old.staff_no ,
					:new.staff_no  );
		end;
	end if;
	if nvl(:old.eff_date,to_date('01-JAN-33')) !=
	   nvl(:new.eff_date,to_date('01-JAN-33'))
	then
		begin
				insert into FIXED_SITE_STAFF_AUDIT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'eff_date' ,
					:old.eff_date ,
					:new.eff_date  );
		end;
	end if;
	if nvl(:old.term_date,to_date('01-JAN-33')) !=
	   nvl(:new.term_date,to_date('01-JAN-33'))
	then
		begin
				insert into FIXED_SITE_STAFF_AUDIT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'term_date' ,
					:old.term_date ,
					:new.term_date	);
		end;
	end if;
	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into FIXED_SITE_STAFF_AUDIT (
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
				insert into FIXED_SITE_STAFF_AUDIT (
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
ALTER TRIGGER "DONSYS"."FIXED_SITE_STAFF_BU" ENABLE;
