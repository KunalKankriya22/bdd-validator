---
tags:
  - trigger
  - SRVSYS
---
# VSERV_BOX_CAPACT_BEFORE_UP

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_BOX_CAPACITY|VSERV_BOX_CAPACITY]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
begin
  :new.program_id := nvl(:new.program_id,'MANUAL-UF');
  insert into vserv_box_capacity_audit
  (
   box_type,
   product_type,
   capacity,
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
   :new.box_type,
   :new.product_type,
   :new.capacity,
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
```
