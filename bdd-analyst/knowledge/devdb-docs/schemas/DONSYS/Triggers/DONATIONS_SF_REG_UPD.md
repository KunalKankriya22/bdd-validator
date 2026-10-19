---
tags:
  - trigger
  - DONSYS
---
# DONATIONS_SF_REG_UPD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]]
**Type**: AFTER EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
   v_sts VARCHAR2(10) := 'N';
   lv_tableName CONSTANT VARCHAR2(30) := 'DONATIONS';
   controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF v_sts = 'Y' AND :new.PROGRAM_ID = 'DRIREGIS' AND :NEW.end_data_entry_time IS NOT NULL AND :NEW.n_audit_flag IS NOT NULL THEN
        CASE
            WHEN INSERTING THEN
                controller_rec.program_id       := lv_tableName || '_INS';
                controller_rec.transaction_id   := :NEW.TRANSACTION_ID;
                controller_rec.coll_date        := :NEW.COLL_DATE;
                controller_rec.donor_id         := :NEW.donor_id;                
            WHEN UPDATING THEN
                controller_rec.program_id       := lv_tableName || '_UPD';
                controller_rec.transaction_id   := :OLD.TRANSACTION_ID;
                controller_rec.coll_date        := :OLD.COLL_DATE;
                controller_rec.donor_id         := :OLD.donor_id;                
        END CASE;

        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := NULL;
        controller_rec.insert_date           := SYSDATE;

        sf_api.insert_donor_controller(controller_rec);

    END IF;
END;
```
