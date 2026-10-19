---
tags:
  - trigger
  - AGMGR
---
# VALID_EXT_ANT_APPROVED_DET_BI

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/VALID_EXT_ANT_APPROVED_DET|VALID_EXT_ANT_APPROVED_DET]]
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
        :new.insert_date := SYSDATE;
    END IF;

    IF :new.audit_key IS NULL THEN
        :new.audit_key := audit_seq.NEXTVAL;
    END IF;
END;
```
