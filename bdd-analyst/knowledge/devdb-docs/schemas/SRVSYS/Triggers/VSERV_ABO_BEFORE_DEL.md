---
tags:
  - trigger
  - SRVSYS
---
# VSERV_ABO_BEFORE_DEL

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/VSERV_ABO|VSERV_ABO]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
  insert into vserv_abo_audit
  (
   abo_code,
   abo_desc,
   eff_date,
   last_modified_date,
   abo_entry_1,
   abo_entry_2,
   discard_flag,
   transfusable_flag,
   term_date,
   abo_only,
   abo_seq,
   order_abo_group,
   audit_key,
   program_id,
   audit_insert_date,
   audit_insert_user
  )
   values
  (
    :old.abo_code,
    :old.abo_desc,
    :old.eff_date,
    :old.last_modified_date,
    :old.abo_entry_1,
    :old.abo_entry_2,
    :old.discard_flag,
    :old.transfusable_flag,
    :old.term_date,
    :old.abo_only,
    :old.abo_seq,
    :old.order_abo_group,
    :old.audit_key,
    'DELETE',
    sysdate,
    decode (substr(lt_user_session.get_userid,1,4),'OPS$',substr(lt_user_session.get_userid,5,6),
	    substr(lt_user_session.get_userid,1,6))
  );
end;
```
