---
tags:
  - trigger
  - DONSYS
---
# DONORS_SF_UPD_INTERFACE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONORS|DONORS]]
**Type**: AFTER EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
   v_sts VARCHAR2(10) := 'N';
   controller_rec SF_DONOR_CONTROLLER%ROWTYPE;
   lv_tableName CONSTANT VARCHAR2(30) := 'DONORS';
BEGIN
   SELECT max(parameter_value) INTO v_sts
     FROM valid_parameters
    WHERE parameter_code = 'STS_IFC';

    IF nvl(v_sts,' ') = 'Y' THEN
        controller_rec.under_processing_flag := 'X';
        controller_rec.process_event         := 'PROFILE';
        controller_rec.transaction_id        := '';
        controller_rec.coll_date             := '';
        controller_rec.donor_id              := :old.donor_id;
        controller_rec.insert_date           := SYSDATE;
        controller_rec.program_id            := lv_tableName || '_UPD';
        sf_api.insert_donor_controller(controller_rec);
    END IF;
END;

```
