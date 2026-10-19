--------------------------------------------------------
--  DDL for Trigger PATIENT_HLA_ANTIGENS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."PATIENT_HLA_ANTIGENS_BU" 
 BEFORE UPDATE
 ON PATIENT_HLA_ANTIGENS
 FOR EACH ROW
BEGIN
	--
	if nvl(:old.patient_id,'*') !=
	   nvl(:new.patient_id,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'patient_id' ,
					:old.patient_id ,
					:new.patient_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
	if nvl(:old.a1,'*') !=
	   nvl(:new.a1,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'a1' ,
					:old.a1 ,
					:new.a1  );
		end;
	end if;
	if nvl(:old.a2,'*') !=
	   nvl(:new.a2,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'a2' ,
					:old.a2 ,
					:new.a2  );
		end;
	end if;
	if nvl(:old.b1,'*') !=
	   nvl(:new.b1,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'b1' ,
					:old.b1 ,
					:new.b1  );
		end;
	end if;
	if nvl(:old.b2,'*') !=
	   nvl(:new.b2,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'b2' ,
					:old.b2 ,
					:new.b2  );
		end;
	end if;
	if nvl(:old.c1,'*') !=
	   nvl(:new.c1,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'c1' ,
					:old.c1 ,
					:new.c1  );
		end;
	end if;
	if nvl(:old.c2,'*') !=
	   nvl(:new.c2,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'c2' ,
					:old.c2 ,
					:new.c2  );
		end;
	end if;
	if nvl(:old.d1,'*') !=
	   nvl(:new.d1,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'd1' ,
					:old.d1 ,
					:new.d1  );
		end;
	end if;
	if nvl(:old.d2,'*') !=
	   nvl(:new.d2,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'd2' ,
					:old.d2 ,
					:new.d2  );
		end;
	end if;
	if nvl(:old.dr,'*') !=
	   nvl(:new.dr,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
					'dr' ,
					:old.dr ,
					:new.dr  );
		end;
	end if;
	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into PATIENT_HLA_ANTIGENS_AUDIT (
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
	--
end;
/
ALTER TRIGGER "DONSYS"."PATIENT_HLA_ANTIGENS_BU" ENABLE;
