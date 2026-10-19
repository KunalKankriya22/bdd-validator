---
tags:
  - trigger
  - SBCSYS
---
# UTRS_AG_RESULT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UTRS|UTRS]]
**Type**: AFTER EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    lv_agmgr        VARCHAR2(10) := 'N';
    ncnt            NUMBER;
    lb_insert_temp  BOOLEAN := FALSE;
    lb_delete_temp  BOOLEAN := FALSE;
    lv_action_flag  VARCHAR2(1);
    ld_local_time DATE;
BEGIN
    IF :old.chapter_id IS NOT NULL THEN
        ld_local_time := TRUNC(LIFETRACK_TIMEZONE_CONVERT.GET_LOCAL_TIME(:OLD.chapter_id, SYSDATE));
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

    IF
        lv_agmgr = 'Y'
    THEN
        SELECT
            COUNT(1)
        INTO ncnt
        FROM
            valid_antigen_config_det
        WHERE
            test_id = :old.test_id;    

        IF nCnt <> 0 THEN

            IF :OLD.result_status_1 IS NULL
                AND :new.result_status_1 IS NOT NULL
                AND :new.result_status_1 <> 'NT'
            THEN
                lb_insert_temp := TRUE;  
            ELSIF :OLD.result_status_1 IS NOT NULL
                AND :NEW.result_status_1 IS NOT NULL
                AND :OLD.result_status_1 <> :NEW.result_status_1
            THEN
                lb_insert_temp := TRUE;
                lv_action_flag := 'E';
            END IF;

            IF :OLD.cancel_flag IS NULL AND NVL(:new.cancel_flag,'X') IN ('Y', 'D')
            THEN
                lb_insert_temp := TRUE;
                lv_action_flag := 'C';
            END IF;

            IF :OLD.void_cancel_flag IS NULL AND NVL(:new.void_cancel_flag,'N') IN ('X')
            THEN
                lb_insert_temp := TRUE;
                lv_action_flag := 'C';
            END IF;

            IF lb_insert_temp THEN
                INSERT INTO ag_donor_tests_job_queue (
                    unit_id,
                    chapter_id,
                    coll_date,
                    test_id,
                    test_seq_no,
                    result_code,
                    test_date,
                    status_flag,
                    action_flag,
                    program_id
                ) VALUES (
                    :new.unit_id,
                    :new.chapter_id,
                    :new.coll_date,
                    :new.test_id,
                    :new.test_seq_no,
                    :new.result_status_1,
                    :new.insert_dats,
                    NULL,
                    lv_action_flag,
                    'UTRS'
                );
            END IF;

        END IF;
    END IF;

END;     
```
