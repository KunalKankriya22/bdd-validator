---
tags:
  - trigger
  - AGMGR
---
# AG_DONOR_TESTS_JOB_QUEUE

**Schema**: [[schemas/AGMGR/AGMGR|AGMGR]]
**Table**: [[schemas/AGMGR/Tables/AG_DONOR_TESTS_JOB_QUEUE|AG_DONOR_TESTS_JOB_QUEUE]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
                    IF :new.program_id IS NULL THEN
                                :new.program_id := 'MANUAL';
                                    END IF;

                                    IF :new.insert_date IS NULL THEN
                                                :new.insert_date := SYSDATE;
                                                    END IF;
                                        END;
```
