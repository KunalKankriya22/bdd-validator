---
tags:
  - trigger
  - SBCSYS
---
# VALID_CUSTOMER_CNFRM_TESTS_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_CUSTOMER_CONFIRM_TESTS|VALID_CUSTOMER_CONFIRM_TESTS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
begin
  if :new.program_id is null then
    :new.program_id := 'MANUAL';
  end if;

  if :new.insert_user is null then
     select lt_user_session.get_userid into :new.insert_user
       from dual ;
  end if;

  if :new.insert_date is null then
     :new.insert_date := sysdate;
  end if;

  if :new.audit_key is null then
     select audit_seq_lab.nextval into :new.audit_key from dual;
  end if;

end ;




```
