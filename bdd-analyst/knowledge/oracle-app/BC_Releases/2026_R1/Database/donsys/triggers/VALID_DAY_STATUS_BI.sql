--------------------------------------------------------
--  DDL for Trigger VALID_DAY_STATUS_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_DAY_STATUS_BI" 
 BEFORE INSERT
 ON VALID_DAY_STATUS
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_DAY_STATUS' and sysdate between nvl(eff_date,sysdate)
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
    insert into VALID_DAY_STATUS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		status,
		chapter_id,
		resource_code,
		lower_limit,
		upper_limit,
		color_code,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.status,
		:new.chapter_id,
		:new.resource_code,
		:new.lower_limit,
		:new.upper_limit,
		:new.color_code,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_DAY_STATUS_BI" ENABLE;
