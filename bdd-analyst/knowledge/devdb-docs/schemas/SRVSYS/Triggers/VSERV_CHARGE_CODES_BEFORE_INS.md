---
tags:
  - trigger
  - SRVSYS
---
# VSERV_CHARGE_CODES_BEFORE_INS

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_CHARGE_CODES|VSERV_CHARGE_CODES]]
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
     where table_name = 'VSERV_CHARGE_CODES' and sysdate between nvl(eff_date, sysdate) and nvl(term_date,sysdate+1);
    If nCount > 0 then
      :new.chapter_id := 'ALL';
    End If;
    --
  insert into vserv_charge_codes_audit
  (
   chapter_id,
   charge_code,
   charge_code_desc,
   charge_code_type,
   charge,
   eff_date,
   last_modified_date,
   term_date,
   service_code,
   percent_disc_flag,
   ship_flag,
   cr_ncr,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :new.chapter_id,
    :new.charge_code,
    :new.charge_code_desc,
    :new.charge_code_type,
    :new.charge,
    :new.eff_date,
    :new.last_modified_date,
    :new.term_date,
    :new.service_code,
    :new.percent_disc_flag,
	:new.ship_flag,
	:new.cr_ncr,
    :new.audit_key,
    :new.program_id,
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
```
