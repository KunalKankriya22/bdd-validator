--------------------------------------------------------
--  DDL for Trigger VALID_PHYSICAL_EQUIP_CONFIG_BU
--------------------------------------------------------

  CREATE OR REPLACE NONEDITIONABLE TRIGGER "VALID_PHYSICAL_EQUIP_CONFIG_BU" 
before update
on VALID_PHYSICAL_EQUIP_CONFIG
for each row

DECLARE
 nCount  NUMBER:=0;
 ncount1  number:=0;
 l_update BOOLEAN := FALSE;

begin
	--

	if nvl(:old.PHYSICAL_CODE,'*') !=
	   nvl(:new.PHYSICAL_CODE,'*')
	then
		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'PHYSICAL_CODE' ,
					:old.PHYSICAL_CODE ,
					:new.PHYSICAL_CODE);
		end;
	end if;

	if nvl(:old.CHAPTER_ID,'*') !=
	   nvl(:new.CHAPTER_ID,'*')
	then
		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'CHAPTER_ID' ,
					:old.CHAPTER_ID,
					:new.CHAPTER_ID);
		end;
	end if;

	if nvl(:old.EQUIP_TYPE,'*') !=
	   nvl(:new.EQUIP_TYPE,'*')
	then
		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'EQUIP_TYPE' ,
					:old.EQUIP_TYPE ,
					:new.EQUIP_TYPE);
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33', 'DD-MON-YY')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33', 'DD-MON-YY'))
	then
		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'insert_date' ,
					:old.insert_date ,
					:new.insert_date  );
		end;
	end if;

	if nvl(:old.insert_user,'*') !=
	   nvl(:new.insert_user,'*')
	then
		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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

	if nvl(:old.EFF_DATE,to_date('01-JAN-33', 'DD-MON-YY')) !=
	   nvl(:new.EFF_DATE,to_date('01-JAN-33', 'DD-MON-YY'))
	then
		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'EFF_DATE' ,
					:old.EFF_DATE ,
					:new.EFF_DATE  );
		end;
	end if;

	if nvl(:old.insert_date,to_date('01-JAN-33', 'DD-MON-YY')) !=
	   nvl(:new.insert_date,to_date('01-JAN-33', 'DD-MON-YY'))
	then
		begin
				insert into VALID_PHYSICAL_EQUIP_CFG_ADT (
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
					'TERM_DATE' ,
					:old.TERM_DATE ,
					:new.TERM_DATE  );
		end;
	end if;


     select nvl(count(*),0) into nCount from download_monitor where table_audit_key=:old.audit_key and
     table_name='VALID_PHYSICAL_EQUIP_CONFIG';
     If nCount = 0 then
        insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
               values('VALID_PHYSICAL_EQUIP_CONFIG',:old.audit_key,'U',null);
     End If;

     select nvl(count(*),0) into nCount1 from download_monitor where table_audit_key=:old.audit_key and
     table_name='VALID_PHYSICAL_EQUIP_CFG_ADT';

	If nCount1 = 0 then
          insert into download_monitor(TABLE_NAME,TABLE_AUDIT_KEY,TRANSACTION_MODE,EXTRACT_DATE)
                                values('VALID_PHYSICAL_EQUIP_CFG_ADT',:old.audit_key,'I',NULL);
      End If;


end;
/
ALTER TRIGGER "VALID_PHYSICAL_EQUIP_CONFIG_BU" ENABLE;
