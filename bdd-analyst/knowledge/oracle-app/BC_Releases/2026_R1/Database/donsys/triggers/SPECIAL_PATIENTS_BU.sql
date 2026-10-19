--------------------------------------------------------
--  DDL for Trigger SPECIAL_PATIENTS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."SPECIAL_PATIENTS_BU" 
 BEFORE UPDATE
 ON SPECIAL_PATIENTS
 FOR EACH ROW
BEGIN
	--
	if nvl(:old.pat_id,'*') !=
	   nvl(:new.pat_id,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'pat_id' ,
					:old.pat_id ,
					:new.pat_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
	if nvl(:old.pat_type,'*') !=
	   nvl(:new.pat_type,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'pat_type' ,
					:old.pat_type ,
					:new.pat_type  );
		end;
	end if;
	if nvl(:old.status,'*') !=
	   nvl(:new.status,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
	if nvl(:old.pat_last_name,'*') !=
	   nvl(:new.pat_last_name,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'pat_last_name' ,
					:old.pat_last_name ,
					:new.pat_last_name  );
		end;
	end if;
	if nvl(:old.pat_first_name,'*') !=
	   nvl(:new.pat_first_name,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'pat_first_name' ,
					:old.pat_first_name ,
					:new.pat_first_name  );
		end;
	end if;
	if nvl(:old.pat_initials,'*') !=
	   nvl(:new.pat_initials,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'pat_initials' ,
					:old.pat_initials ,
					:new.pat_initials  );
		end;
	end if;
	if nvl(:old.street_name,'*') !=
	   nvl(:new.street_name,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'street_name' ,
					:old.street_name ,
					:new.street_name  );
		end;
	end if;
	if nvl(:old.usps_id,-1) !=
	   nvl(:new.usps_id,-1)
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'usps_id' ,
					:old.usps_id ,
					:new.usps_id  );
		end;
	end if;
	if nvl(:old.ssn,-1) !=
	   nvl(:new.ssn,-1)
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'ssn' ,
					:old.ssn ,
					:new.ssn  );
		end;
	end if;
	if nvl(:old.weight,-1) !=
	   nvl(:new.weight,-1)
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'weight' ,
					:old.weight ,
					:new.weight  );
		end;
	end if;
	if nvl(:old.alt_ssn_id,'*') !=
	   nvl(:new.alt_ssn_id,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'alt_ssn_id' ,
					:old.alt_ssn_id ,
					:new.alt_ssn_id  );
		end;
	end if;
	if nvl(:old.dob,to_date('01-JAN-33')) !=
	   nvl(:new.dob,to_date('01-JAN-33'))
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'dob' ,
					:old.dob ,
					:new.dob  );
		end;
	end if;
	if nvl(:old.donor_id,'*') !=
	   nvl(:new.donor_id,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'donor_id' ,
					:old.donor_id ,
					:new.donor_id  );
		end;
	end if;
	if nvl(:old.abo_type,'*') !=
	   nvl(:new.abo_type,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'abo_type' ,
					:old.abo_type ,
					:new.abo_type  );
		end;
	end if;
	if nvl(:old.sex,'*') !=
	   nvl(:new.sex,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'sex' ,
					:old.sex ,
					:new.sex  );
		end;
	end if;
	if nvl(:old.preferred_proc_code,'*') !=
	   nvl(:new.preferred_proc_code,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'preferred_proc_code' ,
					:old.preferred_proc_code ,
					:new.preferred_proc_code  );
		end;
	end if;
	if nvl(:old.cmv_status,'*') !=
	   nvl(:new.cmv_status,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'cmv_status' ,
					:old.cmv_status ,
					:new.cmv_status  );
		end;
	end if;
	if nvl(:old.comments,'*') !=
	   nvl(:new.comments,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'comments' ,
					:old.comments ,
					:new.comments  );
		end;
	end if;
	if nvl(:old.contact_area_code,'*') !=
	   nvl(:new.contact_area_code,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'contact_area_code' ,
					:old.contact_area_code ,
					:new.contact_area_code	);
		end;
	end if;
	if nvl(:old.contact_name,'*') !=
	   nvl(:new.contact_name,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'contact_name' ,
					:old.contact_name ,
					:new.contact_name  );
		end;
	end if;
	if nvl(:old.contact_phone_no,'*') !=
	   nvl(:new.contact_phone_no,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
					'contact_phone_no' ,
					:old.contact_phone_no ,
					:new.contact_phone_no  );
		end;
	end if;
	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into SPECIAL_PATIENTS_AUDIT (
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
				insert into SPECIAL_PATIENTS_AUDIT (
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
ALTER TRIGGER "DONSYS"."SPECIAL_PATIENTS_BU" ENABLE;
