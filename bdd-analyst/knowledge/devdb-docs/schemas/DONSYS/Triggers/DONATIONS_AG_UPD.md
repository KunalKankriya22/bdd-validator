---
tags:
  - trigger
  - DONSYS
---
# DONATIONS_AG_UPD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]]
**Type**: AFTER EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    lv_antigen_feature VARCHAR2(10) := 'N';
    controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
    lv_tableName CONSTANT VARCHAR2(30) :=  'DONATIONS';
    ld_local_time   DATE;
BEGIN

    IF :old.chapter_id IS NOT NULL THEN
        ld_local_time := TRUNC(LIFETRACK_TIMEZONE_CONVERT.GET_LOCAL_TIME(:OLD.chapter_id, SYSDATE));
    ELSE
        ld_local_time := TRUNC(SYSDATE);
    END IF;

    BEGIN
        SELECT
            code_desc
        INTO lv_antigen_feature
        FROM
            master_codes
        WHERE
            code_type = 'AGMGR'
         AND code = 'ENBLE'
         AND ld_local_time BETWEEN eff_date AND NVL(term_date, ld_local_time+1);
    EXCEPTION
        WHEN OTHERS THEN
            lv_antigen_feature := 'N';
    END;

    IF nvl(lv_antigen_feature,' ') = 'Y' then
        IF  :NEW.donor_id IS NOT NULL AND :OLD.donor_id IS NULL THEN -- ATTACH scenario
            AG_CORE.handle_attach_detach_units( unit_id_in   => :OLD.unit_id,
                                                donor_id_in  => :NEW.DONOR_ID,
                                                ad_flag_in   => 'A');
        ELSIF :NEW.DONOR_ID IS NULL AND :OLD.donor_id IS NOT NULL THEN -- DETACH scenario
            IF :OLD.DONOR_ID IS NOT NULL THEN
                AG_CORE.handle_attach_detach_units( unit_id_in   => :OLD.unit_id,
                                                    donor_id_in  => :OLD.DONOR_ID,
                                                    ad_flag_in   => 'D');
            END IF;
        END IF;
    END IF;
END;
```
