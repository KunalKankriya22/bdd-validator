---
tags:
  - trigger
  - DONSYS
---
# VISTA_ELIGIBLE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/ONLINE_STATUS|ONLINE_STATUS]]
**Type**: AFTER EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
   v_vista VARCHAR2(10) := 'N';
   v_ct    NUMBER := 0;
   nCount NUMBER:=0;
BEGIN
   SELECT max(parameter_value) INTO v_vista
     FROM valid_parameters
    WHERE parameter_code = 'IDP_FCN';
    IF v_vista = 'Y'
       AND :new.hlth_hist_end IS NOT NULL
       AND :new.phy_findings_end IS NOT NULL THEN

         -- check if the unit is linked, if
         -- so do not calculate eligibility

           select nvl(count(*),0) into nCount from donations where
           unit_id is not null and transaction_id=:new.transaction_id;

        If nCount = 0  then

           SELECT count(v.last_modified_date) INTO v_ct
           FROM vis_eligibility v
	   WHERE v.transaction_id = :new.transaction_id;
           IF v_ct = 0 THEN
	     donor_idp.update_vis_eligibility('I',:new.transaction_id);
           ELSE
	     donor_idp.update_vis_eligibility('U',:new.transaction_id);
           END IF;

        End If;
    END IF;
END;

```
