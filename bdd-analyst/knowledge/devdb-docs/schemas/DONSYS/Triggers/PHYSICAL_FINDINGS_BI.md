---
tags:
  - trigger
  - DONSYS
---
# PHYSICAL_FINDINGS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/PHYSICAL_FINDINGS|PHYSICAL_FINDINGS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    IF :new.insert_user IS NULL THEN
        SELECT
            decode(substr(lt_user_session.get_userid, 1, 3),
                   'OPS',
                   substr(lt_user_session.get_userid, 5),
                   lt_user_session.get_userid)
        INTO :new.insert_user
        FROM
            dual;

    END IF;

    IF :new.insert_date IS NULL THEN
        :new.insert_date := sysdate;
    END IF;

    IF :new.audit_key IS NULL THEN
        SELECT
            audit_seq.NEXTVAL
        INTO :new.audit_key
        FROM
            dual;
    END IF;        
END;
```
