--------------------------------------------------------
--  DDL for Trigger SPONSORS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."SPONSORS_BU" 
 BEFORE UPDATE
 ON SPONSORS
 FOR EACH ROW
BEGIN
	--
	if nvl(:old.sponsor_id,'*') !=
	   nvl(:new.sponsor_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'sponsor_id' ,
					:old.sponsor_id ,
					:new.sponsor_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
	if nvl(:old.name,'*') !=
	   nvl(:new.name,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					:old.name ,
					:new.name  );
		end;
	end if;
	if nvl(:old.address_id,'*') !=
	   nvl(:new.address_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'address_id' ,
					:old.address_id ,
					:new.address_id  );
		end;
	end if;
	if nvl(:old.territory_id,'*') !=
	   nvl(:new.territory_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'territory_id' ,
					:old.territory_id ,
					:new.territory_id  );
		end;
	end if;
	if nvl(:old.category,'*') !=
	   nvl(:new.category,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'category' ,
					:old.category ,
					:new.category  );
		end;
	end if;
	if nvl(:old.status,'*') !=
	   nvl(:new.status,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'status' ,
					:old.status ,
					:new.status  );
		end;
	end if;
	if nvl(:old.lob,'*') !=
	   nvl(:new.lob,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'lob' ,
					:old.lob ,
					:new.lob  );
		end;
	end if;
	if nvl(:old.employee_base,-1) !=
	   nvl(:new.employee_base,-1)
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'employee_base' ,
					:old.employee_base ,
					:new.employee_base  );
		end;
	end if;
	if nvl(:old.parent_sponsor_id,'*') !=
	   nvl(:new.parent_sponsor_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'parent_sponsor_id' ,
					:old.parent_sponsor_id ,
					:new.parent_sponsor_id	);
		end;
	end if;
	if nvl(:old.note_id,'*') !=
	   nvl(:new.note_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'note_id' ,
					:old.note_id ,
					:new.note_id  );
		end;
	end if;
	if nvl(:old.sponsor_rating,'*') !=
	   nvl(:new.sponsor_rating,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'sponsor_rating' ,
					:old.sponsor_rating ,
					:new.sponsor_rating  );
		end;
	end if;
	if nvl(:old.default_location_id,'*') !=
	   nvl(:new.default_location_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'default_location_id' ,
					:old.default_location_id ,
					:new.default_location_id  );
		end;
	end if;
	if nvl(:old.old_sponsor_id,'*') !=
	   nvl(:new.old_sponsor_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'old_sponsor_id' ,
					:old.old_sponsor_id ,
					:new.old_sponsor_id  );
		end;
	end if;
	if nvl(:old.conv_sponsor_id,'*') !=
	   nvl(:new.conv_sponsor_id,'*')
	then
		begin
				insert into SPONSORS_AUDIT (
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
					'conv_sponsor_id' ,
					:old.conv_sponsor_id ,
					:new.conv_sponsor_id  );
		end;
	end if;
	if nvl(:old.eff_date,to_date('01-JAN-33')) !=
	   nvl(:new.eff_date,to_date('01-JAN-33'))
	then
		begin
				insert into SPONSORS_AUDIT (
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
				insert into SPONSORS_AUDIT (
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
				insert into SPONSORS_AUDIT (
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
				insert into SPONSORS_AUDIT (
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
ALTER TRIGGER "DONSYS"."SPONSORS_BU" ENABLE;
