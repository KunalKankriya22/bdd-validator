--------------------------------------------------------
--  DDL for Trigger VALID_PHYSICAL_RULES_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_PHYSICAL_RULES_BI" 
 BEFORE INSERT
 ON VALID_PHYSICAL_RULES
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_PHYSICAL_RULES' and sysdate between nvl(eff_date,sysdate)
   	and nvl(term_date,sysdate+1);
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    If nCount > 0 then
       :new.chapter_id:='ALL';
    End If;
    insert into VALID_PHYSICAL_RULES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		physical_code,
		procedure_code,
		donation_type,
		chapter_id,
		gender,
		from_age,
		to_age,
		item_value,
		item_operator,
		inter_code,
		item_value_max,
		data_type,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.physical_code,
		:new.procedure_code,
		:new.donation_type,
		:new.chapter_id,
		:new.gender,
		:new.from_age,
		:new.to_age,
		:new.item_value,
		:new.item_operator,
		:new.inter_code,
		:new.item_value_max,
		:new.data_type,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_PHYSICAL_RULES_BI" ENABLE;
