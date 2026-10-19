---
tags:
  - trigger
  - DONSYS
---
# VALID_VEHICLES_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_VEHICLES|VALID_VEHICLES]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.vehicle_id,
		:old.chapter_id,
		:old.vehicle_type,
		:old.vehicle_name,
		:old.license_plate,
		:old.vin,
		:old.last_regn_date,
		:old.last_inspn_date,
		:old.insp_renewal_date,
		:old.commission_date,
		:old.decommission_date,
		:old.fda_license_date,
		:old.fda_license_renewal,
		:old.note_id,
		:old.eff_date,
		:old.term_date
	);
end;
```
