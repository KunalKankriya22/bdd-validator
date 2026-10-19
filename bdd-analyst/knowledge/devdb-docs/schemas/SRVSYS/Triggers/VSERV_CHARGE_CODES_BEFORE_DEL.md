---
tags:
  - trigger
  - SRVSYS
---
# VSERV_CHARGE_CODES_BEFORE_DEL

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_CHARGE_CODES|VSERV_CHARGE_CODES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
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
    :old.chapter_id,
    :old.charge_code,
    :old.charge_code_desc,
    :old.charge_code_type,
    :old.charge,
    :old.eff_date,
    :old.last_modified_date,
    :old.term_date,
    :old.service_code,
    :old.percent_disc_flag,
	:old.ship_flag,
	:old.cr_ncr,
    :old.audit_key,
    'DELETE',
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
```
