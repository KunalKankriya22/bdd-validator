--------------------------------------------------------
--  DDL for Trigger UNITS_BEFORE_INSERT
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UNITS_BEFORE_INSERT" 
before insert
on "UNITS"
for each row
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
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
		:new.unit_id, :new.coll_date, :new.chapter_id,
		:new.donor_decision_code, :new.batch_id, :new.drive_id,
		:new.group_site_id, :new.contract_id, :new.contract_suffix,
		:new.bag_code,:new.add_on_bags,
		:new.bleed_start_time, :new.bleed_end_time, :new.insert_dats,
		:new.bag_check_in_dats, :new.lot_number, :new.work_number,
		:new.received_date,
		:new.os_unit_id, :new.first_sep_centrifuge_id, :new.first_sep_time,
		:new.first_sep_weight, :new.first_sep_user_id,
		:new.first_sep_entry_mode, :new.second_sep_centrifuge_id,
		:new.second_sep_time, :new.second_sep_weight,
		:new.second_sep_user_id, :new.second_sep_entry_mode,
		:new.third_sep_centrifuge_id, :new.third_sep_time,
		:new.third_sep_weight, :new.third_sep_user_id,
		:new.third_sep_entry_mode, :new.donor_form_abo,
		:new.prior_abo, :new.cmv_stat, :new.prior_cmv_stat,
		:new.system_label_decision, :new.registry_flag,
		:new.rare_flag, :new.prior_rare_flag,
		:new.vrare_flag, :new.prior_vrare_flag,
		:new.red_tube_flag, :new.purple_tube_flag,
		:new.serum_plasma_ind, :new.qc_checkin_flag,
		:new.qc_checkin_date, :new.qc_test_flag, :new.qc_test_date,
		:new.qc_label_flag, :new.qc_label_date,
		:new.nursing_audit_flag, :new.nursing_audit_status,
		:new.component_review_flag,
		:new.lab_dist_dats, :new.lab_donor_dats, :new.donor_lab_dats,
		:new.note_id, :new.audit_key, :new.program_id,
		sysdate, lt_user_session.get_userid,
		:new.chk_digit, :new.unit_scheme_type,
		:new.RED_TUBE2,:new.WAREHOUSE_ID,
		:new.CATALOG_NUMBER,:new.RED_TUBE_2_FLAG,:new.CNF_CHECKIN_FLAG
	);
       --- The below code must be removed if the Customer is not using Chagas
       --SCHCHAGAS.SCHEDULE_CHAGAS(:new.unit_id,:new.coll_date,:new.chapter_id);
  emf_util.staging_insert('UNITS', :NEW.audit_key, :NEW.program_id, 'LAB', 'UNITS_BEFORE_INSERT','I');
end;
/
ALTER TRIGGER "UNITS_BEFORE_INSERT" ENABLE;
