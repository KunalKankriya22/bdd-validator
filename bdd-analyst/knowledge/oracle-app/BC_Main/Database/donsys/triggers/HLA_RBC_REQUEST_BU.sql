--------------------------------------------------------
--  DDL for Trigger HLA_RBC_REQUEST_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."HLA_RBC_REQUEST_BU" 
 BEFORE UPDATE
 ON HLA_RBC_REQUEST
 FOR EACH ROW
BEGIN
	--
	if nvl(:old.request_id,'*') !=
	   nvl(:new.request_id,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'request_id' ,
					:old.request_id ,
					:new.request_id  );
		end;
	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
	if nvl(:old.patient_id,'*') !=
	   nvl(:new.patient_id,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
	if nvl(:old.hospital_id,'*') !=
	   nvl(:new.hospital_id,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'hospital_id' ,
					:old.hospital_id ,
					:new.hospital_id  );
		end;
	end if;
	if nvl(:old.requested_date,to_date('01-JAN-33')) !=
	   nvl(:new.requested_date,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'requested_date' ,
					:old.requested_date ,
					:new.requested_date  );
		end;
	end if;
	if nvl(:old.blood_type,'*') !=
	   nvl(:new.blood_type,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
	if nvl(:old.close_date,to_date('01-JAN-33')) !=
	   nvl(:new.close_date,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'close_date' ,
					:old.close_date ,
					:new.close_date  );
		end;
	end if;
	if nvl(:old.hla_pheno,'*') !=
	   nvl(:new.hla_pheno,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'hla_pheno' ,
					:old.hla_pheno ,
					:new.hla_pheno	);
		end;
	end if;
	if nvl(:old.hla_anti,'*') !=
	   nvl(:new.hla_anti,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'hla_anti' ,
					:old.hla_anti ,
					:new.hla_anti  );
		end;
	end if;
	if nvl(:old.rbc_anti,'*') !=
	   nvl(:new.rbc_anti,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'rbc_anti' ,
					:old.rbc_anti ,
					:new.rbc_anti  );
		end;
	end if;
	if nvl(:old.list_id,'*') !=
	   nvl(:new.list_id,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'list_id' ,
					:old.list_id ,
					:new.list_id  );
		end;
	end if;
	if nvl(:old.status,'*') !=
	   nvl(:new.status,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
	if nvl(:old.req_diagnosis,'*') !=
	   nvl(:new.req_diagnosis,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'req_diagnosis' ,
					:old.req_diagnosis ,
					:new.req_diagnosis  );
		end;
	end if;
	if nvl(:old.physician_id,'*') !=
	   nvl(:new.physician_id,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'physician_id' ,
					:old.physician_id ,
					:new.physician_id  );
		end;
	end if;
	if nvl(:old.rbc_pheno,'*') !=
	   nvl(:new.rbc_pheno,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'rbc_pheno' ,
					:old.rbc_pheno ,
					:new.rbc_pheno	);
		end;
	end if;
	if nvl(:old.exp_transfusion_date1,to_date('01-JAN-33')) !=
	   nvl(:new.exp_transfusion_date1,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'exp_transfusion_date1' ,
					:old.exp_transfusion_date1 ,
					:new.exp_transfusion_date1  );
		end;
	end if;
	if nvl(:old.quantity1,-1) !=
	   nvl(:new.quantity1,-1)
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'quantity1' ,
					:old.quantity1 ,
					:new.quantity1	);
		end;
	end if;
	if nvl(:old.exp_transfusion_date2,to_date('01-JAN-33')) !=
	   nvl(:new.exp_transfusion_date2,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'exp_transfusion_date2' ,
					:old.exp_transfusion_date2 ,
					:new.exp_transfusion_date2  );
		end;
	end if;
	if nvl(:old.quantity2,-1) !=
	   nvl(:new.quantity2,-1)
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'quantity2' ,
					:old.quantity2 ,
					:new.quantity2	);
		end;
	end if;
	if nvl(:old.exp_transfusion_date3,to_date('01-JAN-33')) !=
	   nvl(:new.exp_transfusion_date3,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'exp_transfusion_date3' ,
					:old.exp_transfusion_date3 ,
					:new.exp_transfusion_date3  );
		end;
	end if;
	if nvl(:old.quantity3,-1) !=
	   nvl(:new.quantity3,-1)
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'quantity3' ,
					:old.quantity3 ,
					:new.quantity3	);
		end;
	end if;
	if nvl(:old.exp_transfusion_date4,to_date('01-JAN-33')) !=
	   nvl(:new.exp_transfusion_date4,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'exp_transfusion_date4' ,
					:old.exp_transfusion_date4 ,
					:new.exp_transfusion_date4  );
		end;
	end if;
	if nvl(:old.quantity4,-1) !=
	   nvl(:new.quantity4,-1)
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'quantity4' ,
					:old.quantity4 ,
					:new.quantity4	);
		end;
	end if;
	if nvl(:old.exp_transfusion_date5,to_date('01-JAN-33')) !=
	   nvl(:new.exp_transfusion_date5,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'exp_transfusion_date5' ,
					:old.exp_transfusion_date5 ,
					:new.exp_transfusion_date5  );
		end;
	end if;
	if nvl(:old.quantity5,-1) !=
	   nvl(:new.quantity5,-1)
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'quantity5' ,
					:old.quantity5 ,
					:new.quantity5	);
		end;
	end if;
	if nvl(:old.exp_transfusion_date6,to_date('01-JAN-33')) !=
	   nvl(:new.exp_transfusion_date6,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'exp_transfusion_date6' ,
					:old.exp_transfusion_date6 ,
					:new.exp_transfusion_date6  );
		end;
	end if;
	if nvl(:old.quantity6,-1) !=
	   nvl(:new.quantity6,-1)
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'quantity6' ,
					:old.quantity6 ,
					:new.quantity6	);
		end;
	end if;
	if nvl(:old.exp_transfusion_date7,to_date('01-JAN-33')) !=
	   nvl(:new.exp_transfusion_date7,to_date('01-JAN-33'))
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'exp_transfusion_date7' ,
					:old.exp_transfusion_date7 ,
					:new.exp_transfusion_date7  );
		end;
	end if;
	if nvl(:old.quantity7,-1) !=
	   nvl(:new.quantity7,-1)
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'quantity7' ,
					:old.quantity7 ,
					:new.quantity7	);
		end;
	end if;
	if nvl(:old.product_type,'*') !=
	   nvl(:new.product_type,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'product_type' ,
					:old.product_type ,
					:new.product_type  );
		end;
	end if;
	if nvl(:old.contact_person,'*') !=
	   nvl(:new.contact_person,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'contact_person' ,
					:old.contact_person ,
					:new.contact_person  );
		end;
	end if;
	if nvl(:old.contact_phone,'*') !=
	   nvl(:new.contact_phone,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'contact_phone' ,
					:old.contact_phone ,
					:new.contact_phone  );
		end;
	end if;
	if nvl(:old.priority,'*') !=
	   nvl(:new.priority,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
					'priority' ,
					:old.priority ,
					:new.priority  );
		end;
	end if;
	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into HLA_RBC_REQUEST_AUDIT (
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
				insert into HLA_RBC_REQUEST_AUDIT (
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
ALTER TRIGGER "DONSYS"."HLA_RBC_REQUEST_BU" ENABLE;
