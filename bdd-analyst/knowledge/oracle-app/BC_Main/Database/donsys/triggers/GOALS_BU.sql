--------------------------------------------------------
--  DDL for Trigger GOALS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."GOALS_BU" 
 BEFORE UPDATE
 ON GOALS
 FOR EACH ROW
BEGIN
	--
	if nvl(:old.goal_id,'*') !=
	   nvl(:new.goal_id,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
					'goal_id' ,
					:old.goal_id ,
					:new.goal_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
	if nvl(:old.goal_type,'*') !=
	   nvl(:new.goal_type,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
					'goal_type' ,
					:old.goal_type ,
					:new.goal_type	);
		end;
	end if;
	if nvl(:old.goal_custodian,'*') !=
	   nvl(:new.goal_custodian,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
					'goal_custodian' ,
					:old.goal_custodian ,
					:new.goal_custodian  );
		end;
	end if;
	if nvl(:old.goal_start_date,to_date('01-JAN-33')) !=
	   nvl(:new.goal_start_date,to_date('01-JAN-33'))
	then
		begin
				insert into GOALS_AUDIT (
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
					'goal_start_date' ,
					:old.goal_start_date ,
					:new.goal_start_date  );
		end;
	end if;
	if nvl(:old.goal_end_date,to_date('01-JAN-33')) !=
	   nvl(:new.goal_end_date,to_date('01-JAN-33'))
	then
		begin
				insert into GOALS_AUDIT (
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
					'goal_end_date' ,
					:old.goal_end_date ,
					:new.goal_end_date  );
		end;
	end if;
	if nvl(:old.goal_mmyy,'*') !=
	   nvl(:new.goal_mmyy,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
					'goal_mmyy' ,
					:old.goal_mmyy ,
					:new.goal_mmyy	);
		end;
	end if;
	if nvl(:old.donation_type,'*') !=
	   nvl(:new.donation_type,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
					'donation_type' ,
					:old.donation_type ,
					:new.donation_type  );
		end;
	end if;
	if nvl(:old.procedure_code,'*') !=
	   nvl(:new.procedure_code,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
					'procedure_code' ,
					:old.procedure_code ,
					:new.procedure_code  );
		end;
	end if;
	if nvl(:old.blood_type,'*') !=
	   nvl(:new.blood_type,'*')
	then
		begin
				insert into GOALS_AUDIT (
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
					'blood_type' ,
					:old.blood_type ,
					:new.blood_type  );
		end;
	end if;
	if nvl(:old.goal_count,-1) !=
	   nvl(:new.goal_count,-1)
	then
		begin
				insert into GOALS_AUDIT (
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
					'goal_count' ,
					:old.goal_count ,
					:new.goal_count  );
		end;
	end if;
	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into GOALS_AUDIT (
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
				insert into GOALS_AUDIT (
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
ALTER TRIGGER "DONSYS"."GOALS_BU" ENABLE;
