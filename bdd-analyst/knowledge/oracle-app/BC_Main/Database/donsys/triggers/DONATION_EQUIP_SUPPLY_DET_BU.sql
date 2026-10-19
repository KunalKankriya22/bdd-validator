--------------------------------------------------------
--  DDL for Trigger DONATION_EQUIP_SUPPLY_DET_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONATION_EQUIP_SUPPLY_DET_BU" 
before update
on DONATION_EQUIP_SUPPLY_DET
for each row
begin
	--

	if nvl(:old.TRANSACTION_ID,'*') !=
	   nvl(:new.TRANSACTION_ID,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT(
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'TRANSACTION_ID' ,
					:old.TRANSACTION_ID ,
					:new.TRANSACTION_ID);
		end;
	end if;

	if nvl(:old.DRIVE_ID,'*') !=
	   nvl(:new.DRIVE_ID,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'DRIVE_ID' ,
					:old.DRIVE_ID,
					:new.DRIVE_ID);
		end;
	end if;

	if nvl(:old.EQUIP_OR_SUPPLY,'*') !=
	   nvl(:new.EQUIP_OR_SUPPLY,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'EQUIP_OR_SUPPLY' ,
					:old.EQUIP_OR_SUPPLY,
					:new.EQUIP_OR_SUPPLY);
		end;
	end if;

	if nvl(:old.EQUIP_SUPPLY_CODE,'*') !=
	   nvl(:new.EQUIP_SUPPLY_CODE,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'EQUIP_SUPPLY_CODE' ,
					:old.EQUIP_SUPPLY_CODE,
					:new.EQUIP_SUPPLY_CODE);
		end;
	end if;

	if nvl(:old.SUPPLY_ID,'*') !=
	   nvl(:new.SUPPLY_ID,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'SUPPLY_ID' ,
					:old.SUPPLY_ID,
					:new.SUPPLY_ID);
		end;
	end if;

	if nvl(:old.EQUIP_REFERENCE,'*') !=
	   nvl(:new.EQUIP_REFERENCE,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'EQUIP_REFERENCE' ,
					:old.EQUIP_REFERENCE,
					:new.EQUIP_REFERENCE);
		end;
	end if;

	if nvl(:old.CATALOG_NO,'*') !=
	   nvl(:new.CATALOG_NO,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'CATALOG_NO' ,
					:old.CATALOG_NO,
					:new.CATALOG_NO);
		end;
	end if;

	if nvl(:old.LOT_NO,'*') !=
	   nvl(:new.LOT_NO,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'LOT_NO' ,
					:old.LOT_NO,
					:new.LOT_NO);
		end;
	end if;

	if nvl(:old.QC_STATUS,'*') !=
	   nvl(:new.QC_STATUS,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'QC_STATUS' ,
					:old.QC_STATUS,
					:new.QC_STATUS);
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33'))
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					:old.insert_date ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'insert_date' ,
					:new.insert_date  );
		end;
	end if;

	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'insert_user' ,
					:old.insert_user ,
					:new.insert_user  );
		end;
	end if;

	if nvl(:old.UNIT_ID,'*') !=
	   nvl(:new.UNIT_ID,'*')
	then
		begin
				insert into DONATION_EQUIP_SUPPLY_DET_ADT (
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
					:new.program_id ,
					substr(lt_user_session.get_userid,1,6) ,
					'U',
					'UNIT_ID' ,
					:old.UNIT_ID,
					:new.UNIT_ID);
		end;
	end if;


--
end;
/
ALTER TRIGGER "DONSYS"."DONATION_EQUIP_SUPPLY_DET_BU" ENABLE;
