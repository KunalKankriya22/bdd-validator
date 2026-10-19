---
tags:
  - trigger
  - AGMGR
---
# VALID_ANTIGEN_CONFIG_HDR_BI

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/VALID_ANTIGEN_CONFIG_HDR|VALID_ANTIGEN_CONFIG_HDR]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    IF :new.program_id IS NULL THEN
        :new.program_id := 'MANUAL';
    END IF;

    IF :new.insert_user IS NULL THEN
        :new.insert_user := lt_user_session.get_userid;
    END IF;

    IF :new.insert_date IS NULL THEN
        :new.insert_date := sysdate;
    END IF;

    IF :new.audit_key IS NULL THEN
        :new.audit_key := audit_seq.nextval;
    END IF;

END;
```
