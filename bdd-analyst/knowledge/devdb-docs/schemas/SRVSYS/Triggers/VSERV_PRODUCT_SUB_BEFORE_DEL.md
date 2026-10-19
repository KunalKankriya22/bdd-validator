---
tags:
  - trigger
  - SRVSYS
---
# VSERV_PRODUCT_SUB_BEFORE_DEL

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_PRODUCT_SUBSTITUTIONS|VSERV_PRODUCT_SUBSTITUTIONS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
  insert into vserv_product_sub_audit
  (
   request_product_type,
   compatible_product_type,
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
    :old.request_product_type,
    :old.compatible_product_type,
    :old.eff_date,
    :old.term_date,
    :old.last_modified_date,
    :old.audit_key,
    'DELETE',
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
```
