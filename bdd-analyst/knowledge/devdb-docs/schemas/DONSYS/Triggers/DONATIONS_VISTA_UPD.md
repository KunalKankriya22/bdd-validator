---
tags:
  - trigger
  - DONSYS
---
# DONATIONS_VISTA_UPD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]]
**Type**: AFTER EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    v_vista VARCHAR2(1) := 'N';
    v_vista_count  NUMBER:=0;
BEGIN

If :new.unit_id is not null then

     SELECT max(parameter_value) INTO v_vista
     FROM valid_parameters
     WHERE parameter_code = 'IDP_FCN';

    IF nvl(v_vista,' ') = 'Y' then

      SELECT NVL(count(*),0) INTO v_vista_count
      FROM vis_eligibility v
      WHERE v.transaction_id = :new.transaction_id;

       IF v_vista_count > 0 THEN
          UPDATE ONLINE_STATUS
          SET idp_proc_status = 'P'
   	 WHERE transaction_id = :new.transaction_id;
     ELSE
        null;
     END IF;
  ELSE
   null;
  END IF;

End If;

END;

```
