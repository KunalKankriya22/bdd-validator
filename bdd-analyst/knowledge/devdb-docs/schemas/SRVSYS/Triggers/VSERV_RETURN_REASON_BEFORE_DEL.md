---
tags:
  - trigger
  - SRVSYS
---
# VSERV_RETURN_REASON_BEFORE_DEL

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_RETURN_REASONS|VSERV_RETURN_REASONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
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
    :old.chapter_id,
    :old.code,
    :old.code_desc,
    :old.location_type,
    :old.cr_ncr,
    :old.eff_date,
    :old.enforce,
	:old.fee_code_1,
	:old.fee_code_2,
    :old.last_modified_date,
    :old.term_date,
    :old.audit_key,
    'DELETE',
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
```
