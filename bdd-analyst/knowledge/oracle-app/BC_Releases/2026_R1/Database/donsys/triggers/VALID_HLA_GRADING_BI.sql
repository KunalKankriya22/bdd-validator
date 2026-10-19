--------------------------------------------------------
--  DDL for Trigger VALID_HLA_GRADING_BI
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HLA_GRADING_BI" 
 BEFORE INSERT
 ON VALID_HLA_GRADING
 FOR EACH ROW
DECLARE
	temp_audit_key	  number(23);
	nCount number;
begin
	select nvl(count(*),0) into nCount from institution_tables
   	where table_name='VALID_HLA_GRADING' and sysdate between nvl(eff_date,sysdate)
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
    insert into VALID_HLA_GRADING_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		grade_id,
		chapter_id,
		grade,
		grade_level,
		a1,
		a2,
		b1,
		b2,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.grade_id,
		:new.chapter_id,
		:new.grade,
		:new.grade_level,
		:new.a1,
		:new.a2,
		:new.b1,
		:new.b2,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HLA_GRADING_BI" ENABLE;
