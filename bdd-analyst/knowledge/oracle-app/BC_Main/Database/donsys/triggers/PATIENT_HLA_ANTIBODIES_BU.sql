--------------------------------------------------------
--  DDL for Trigger PATIENT_HLA_ANTIBODIES_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."PATIENT_HLA_ANTIBODIES_BU" 
 BEFORE UPDATE
 ON PATIENT_HLA_ANTIBODIES
 FOR EACH ROW
BEGIN
	--
	if nvl(:old.patient_id,'*') !=
	   nvl(:new.patient_id,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIBODIES_AUDIT (
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
				insert into PATIENT_HLA_ANTIBODIES_AUDIT (
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
	if nvl(:old.locus,'*') !=
	   nvl(:new.locus,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIBODIES_AUDIT (
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
					'locus' ,
					:old.locus ,
					:new.locus  );
		end;
	end if;
	if nvl(:old.epitope_id,'*') !=
	   nvl(:new.epitope_id,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIBODIES_AUDIT (
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
					'epitope_id' ,
					:old.epitope_id ,
					:new.epitope_id  );
		end;
	end if;
	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into PATIENT_HLA_ANTIBODIES_AUDIT (
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
				insert into PATIENT_HLA_ANTIBODIES_AUDIT (
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
ALTER TRIGGER "DONSYS"."PATIENT_HLA_ANTIBODIES_BU" ENABLE;
