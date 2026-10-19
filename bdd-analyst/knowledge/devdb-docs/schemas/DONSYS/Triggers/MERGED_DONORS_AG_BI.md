---
tags:
  - trigger
  - DONSYS
---
# MERGED_DONORS_AG_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/MERGED_DONORS|MERGED_DONORS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    lv_agmgr        VARCHAR2(10) := 'N';
    ld_local_time   DATE;
BEGIN
    IF :new.chapter_id IS NOT NULL THEN
        ld_local_time := TRUNC(LIFETRACK_TIMEZONE_CONVERT.GET_LOCAL_TIME(:new.chapter_id, SYSDATE));
    ELSE
        ld_local_time := TRUNC(SYSDATE);
    END IF;

    BEGIN
        SELECT
            code_desc
        INTO lv_agmgr
        FROM
            master_codes
        WHERE
            code_type = 'AGMGR'
         AND code = 'ENBLE'
         AND ld_local_time BETWEEN eff_date AND NVL(term_date, ld_local_time+1);
    EXCEPTION
        WHEN OTHERS THEN
            lv_agmgr := 'N';
    END;

    IF lv_agmgr = 'Y' THEN
        AG_CORE.handle_merged_donors(   primary_donor_in    => :new.PRIMARY_DONOR_ID, 
                                        secondary_donor_in  => :new.SECONDARY_DONOR_ID);

    END IF;
END;
```
