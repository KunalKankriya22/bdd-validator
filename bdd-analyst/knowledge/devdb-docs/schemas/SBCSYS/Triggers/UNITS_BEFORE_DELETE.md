---
tags:
  - trigger
  - SBCSYS
---
# UNITS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNITS|UNITS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into units_audit
	(
		unit_id, coll_date, chapter_id,
		donor_decision_code, batch_id, drive_id,
		group_site_id, contract_id, contract_suffix,
		bag_code,add_on_bags,
		bleed_start_time, bleed_end_time, insert_dats,
		bag_check_in_dats, lot_number, work_number,
		received_date,
		os_unit_id, first_sep_centrifuge_id, first_sep_time,
		first_sep_weight, first_sep_user_id,
		first_sep_entry_mode, second_sep_centrifuge_id,
		second_sep_time, second_sep_weight,
		second_sep_user_id, second_sep_entry_mode,
		third_sep_centrifuge_id, third_sep_time,
		third_sep_weight, third_sep_user_id,
		third_sep_entry_mode, donor_form_abo,
		prior_abo, cmv_stat, prior_cmv_stat,
		system_label_decision, registry_flag,
		rare_flag, prior_rare_flag,
		vrare_flag, prior_vrare_flag,
		red_tube_flag, purple_tube_flag,
		serum_plasma_ind, qc_checkin_flag,
		qc_checkin_date, qc_test_flag, qc_test_date,
		qc_label_flag, qc_label_date,
		nursing_audit_flag, nursing_audit_status,
		component_review_flag,
		lab_dist_dats, lab_donor_dats, donor_lab_dats,
		note_id, audit_key, program_id,
		audit_insert_dats, audit_insert_user,
		chk_digit, unit_scheme_type,
		RED_TUBE2,WAREHOUSE_ID,
		CATALOG_NUMBER,RED_TUBE_2_FLAG,CNF_CHECKIN_FLAG
	)
	values
	(
		:old.unit_id, :old.coll_date, :old.chapter_id,
		:old.donor_decision_code, :old.batch_id, :old.drive_id,
		:old.group_site_id,:old.contract_id,:old.contract_suffix,
		:old.bag_code, :old.add_on_bags,
		:old.bleed_start_time, :old.bleed_end_time,
		:old.insert_dats, :old.bag_check_in_dats,
		:old.lot_number, :old.work_number,
		:old.received_date, :old.os_unit_id,
		:old.first_sep_centrifuge_id, :old.first_sep_time,
		:old.first_sep_weight, :old.first_sep_user_id,
		:old.first_sep_entry_mode, :old.second_sep_centrifuge_id,
		:old.second_sep_time, :old.second_sep_weight,
		:old.second_sep_user_id, :old.second_sep_entry_mode,
		:old.third_sep_centrifuge_id, :old.third_sep_time,
		:old.third_sep_weight, :old.third_sep_user_id,
		:old.third_sep_entry_mode, :old.donor_form_abo,
		:old.prior_abo, :old.cmv_stat, :old.prior_cmv_stat,
		:old.system_label_decision, :old.registry_flag,
		:old.rare_flag, :old.prior_rare_flag,
		:old.vrare_flag, :old.prior_vrare_flag,
		:old.red_tube_flag, :old.purple_tube_flag,
		:old.serum_plasma_ind, :old.qc_checkin_flag,
		:old.qc_checkin_date, :old.qc_test_flag, :old.qc_test_date,
		:old.qc_label_flag, :old.qc_label_date,
		:old.nursing_audit_flag, :old.nursing_audit_status,
		:old.component_review_flag,
		:old.lab_dist_dats, :old.lab_donor_dats, :old.donor_lab_dats,
		:old.note_id, :old.audit_key, 'DELETE',
		sysdate, lt_user_session.get_userid,
		:old.chk_digit, :old.unit_scheme_type,
		:old.RED_TUBE2,:old.WAREHOUSE_ID,
		:old.CATALOG_NUMBER,:old.RED_TUBE_2_FLAG,:old.CNF_CHECKIN_FLAG

	);
end;
```
