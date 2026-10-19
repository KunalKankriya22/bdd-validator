---
tags:
  - trigger
  - DONSYS
---
# VALID_VEHICLES_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_VEHICLES|VALID_VEHICLES]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
	insert into VALID_VEHICLES_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		vehicle_id,
		chapter_id,
		vehicle_type,
		vehicle_name,
		license_plate,
		vin,
		last_regn_date,
		last_inspn_date,
		insp_renewal_date,
		commission_date,
		decommission_date,
		fda_license_date,
		fda_license_renewal,
		note_id,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.vehicle_id,
		:new.chapter_id,
		:new.vehicle_type,
		:new.vehicle_name,
		:new.license_plate,
		:new.vin,
		:new.last_regn_date,
		:new.last_inspn_date,
		:new.insp_renewal_date,
		:new.commission_date,
		:new.decommission_date,
		:new.fda_license_date,
		:new.fda_license_renewal,
		:new.note_id,
		:new.eff_date,
		:new.term_date
	);
end;
```
