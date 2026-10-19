--------------------------------------------------------
--  DDL for Trigger VSERV_RETURN_REASON_BEFORE_INS
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_RETURN_REASON_BEFORE_INS" before insert
on vserv_return_reasons for each row
declare
  temp_audit_key	number(23);
  nCount      	  	number := 0;
begin
  select AUDIT_SEQ_LAB.nextval into temp_audit_key
   from dual;
  :new.audit_key := temp_audit_key;
  :new.program_id := nvl(:new.program_id,'MANUAL-IN');
   -- Check if the table is institution level
   select nvl(count(*),0)
     into nCount
     from institution_tables
    where table_name = 'VSERV_RETURN_REASONS' and sysdate between nvl(eff_date, sysdate) and nvl(term_date,sysdate+1);
   If nCount > 0 then
     :new.chapter_id := 'ALL';
   End If;
   --
  insert into vserv_return_reasons_audit
  (
   chapter_id,
   code,
   code_desc,
   location_type,
   cr_ncr,
   eff_date,
   enforce,
   fee_code_1,
   fee_code_2,
   last_modified_date,
   term_date,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.chapter_id,
    :new.code,
    :new.code_desc,
    :new.location_type,
    :new.cr_ncr,
    :new.eff_date,
    :new.enforce,
    :new.fee_code_1,
    :new.fee_code_2,
    :new.last_modified_date,
    :new.term_date,
    :new.audit_key,
    :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_RETURN_REASON_BEFORE_INS" ENABLE;
