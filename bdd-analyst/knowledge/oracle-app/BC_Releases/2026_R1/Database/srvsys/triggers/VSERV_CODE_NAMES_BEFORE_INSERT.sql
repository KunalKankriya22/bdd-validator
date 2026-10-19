--------------------------------------------------------
--  DDL for Trigger VSERV_CODE_NAMES_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "VSERV_CODE_NAMES_BEFORE_INSERT" before insert on vserv_code_names
for each row
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
    where table_name = 'VSERV_CODE_NAMES' and sysdate between nvl(eff_date, sysdate) and nvl(term_date,sysdate+1);
   If nCount > 0 then
     :new.chapter_id := 'ALL';
   End If;
   --
  insert into vserv_code_names_audit
  (
   chapter_id,
   appl_custody,
   code_type,
   code_type_desc,
   eff_date,
   term_date,
   last_modified_date,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.chapter_id,
    :new.appl_custody,
    :new.code_type,
    :new.code_type_desc,
    :new.eff_date,
    :new.term_date,
    :new.last_modified_date,
    :new.audit_key,
    :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
/
ALTER TRIGGER "VSERV_CODE_NAMES_BEFORE_INSERT" ENABLE;
