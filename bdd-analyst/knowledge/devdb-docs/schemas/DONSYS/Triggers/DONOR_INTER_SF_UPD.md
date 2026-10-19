---
tags:
  - trigger
  - DONSYS
---
# DONOR_INTER_SF_UPD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONOR_INTERDICTIONS|DONOR_INTERDICTIONS]]
**Type**: AFTER EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
   v_sts VARCHAR2(10) := 'N';
   controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
   lv_tableName CONSTANT VARCHAR2(30) := 'DONOR_INTERDICTIONS';
   nCnt NUMBER;
    FUNCTION inter_has_deferral RETURN BOOLEAN IS
        nDefCount NUMBER;
    BEGIN
          SELECT COUNT(1) INTO nDefCount
            FROM valid_interdictions
           WHERE inter_code = :NEW.inter_code
             AND SYSDATE BETWEEN eff_date AND NVL(term_date, SYSDATE + 10)
             AND deferral_flag = 'Y';

          RETURN nDefCount > 0;
    END inter_has_deferral;
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF nvl(v_sts,' ') = 'Y' THEN
        IF inter_has_deferral THEN
            controller_rec.under_processing_flag := 'X';
            controller_rec.process_event         := 'ELIGIBILITY';
            controller_rec.insert_date           := SYSDATE;
            CASE
               WHEN INSERTING THEN
                  controller_rec.donor_id         := :new.donor_id;
                  controller_rec.transaction_id   := :new.transaction_id;
                  controller_rec.program_id       := lv_tableName || '_INS';
              WHEN UPDATING THEN
                  controller_rec.donor_id         := :old.donor_id;
                  controller_rec.transaction_id   := :old.transaction_id;
                  controller_rec.program_id       := lv_tableName || '_UPD';
            END CASE;

            SELECT COUNT(1) INTO nCnt
              FROM sf_donor_controller
             WHERE donor_id = controller_rec.donor_id
               AND process_event = 'ELIGIBILITY'
               AND under_processing_flag = 'X';

            IF nCnt = 0 THEN
                sf_api.insert_donor_controller(controller_rec);
            END IF;
        END IF;
    END IF;
END;

```
