---
tags:
  - trigger
  - SRVSYS
---
# VSERV_CONTACTS_BEFORE_INSERT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_CONTACTS|VSERV_CONTACTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
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
    where table_name = 'VSERV_CONTACTS' and sysdate between nvl(eff_date, sysdate) and nvl(term_date,sysdate+1);
   If nCount > 0 then
     :new.chapter_id := 'ALL';
   End If;
   --
  insert into vserv_contacts_audit
  (
   audit_key,
   program_id,
   last_name,
   first_name,
   inst_id,
   chapter_id,
   customer_id,
   salutation,
   title,
   day_phone_no,
   night_phone_no,
   fax_no,
   telex_no,
   eff_date,
   term_date,
   last_modified_date,
   contact_type,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.audit_key,
    :new.program_id,
    :new.last_name,
    :new.first_name,
    :new.inst_id,
    :new.chapter_id,
    :new.customer_id,
    :new.salutation,
    :new.title,
    :new.day_phone_no,
    :new.night_phone_no,
    :new.fax_no,
    :new.telex_no,
    :new.eff_date,
    :new.term_date,
    :new.last_modified_date,
    :new.contact_type,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
```
