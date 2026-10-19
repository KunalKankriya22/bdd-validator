--------------------------------------------------------
--  DDL for Trigger VALID_STRONG_REACTIVITY_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_STRONG_REACTIVITY_BI" 
 BEFORE INSERT
 ON VALID_STRONG_REACTIVITY
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_STRONG_REACTIVITY' and sysdate between nvl(eff_date,sysdate)
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
    insert into VALID_STRONG_REACTIVITY_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		epitope_id_1,
		epitope_id_2,
		chapter_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.epitope_id_1,
		:new.epitope_id_2,
		:new.chapter_id,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_STRONG_REACTIVITY_BI" ENABLE;
