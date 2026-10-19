--------------------------------------------------------
--  DDL for Trigger CHAPTERS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CHAPTERS_BD" 
before delete
on chapters
for each row
begin
    insert into chapters_audit
	(
	 chapter_id,chapter_name,chapter_short_name,
		 address_id, print_hdr,
		 test_chapter_ind, batch_seq,tb_seq,ws_seq,
		 sdc_ws_seq, test_kit_seq,drive_id,unit_scheme,
		 group_site_id,pool_seq, work_number_seq,
		 max_bleed_time, slow_bleed_time,
		 cue_scan_flag, seq_checkin_flag, qc_label_flag,
		 nursing_flag, ffp_freeze_durn, cryo_time_limit,
		 alt_e_level, alt_se_level,
		 lab_cp6_dats, dmis_labds_dats,
		 dmis_lab_dats, lab_dmis_dats, lab_ad_dats,
 		 inst_id, tax_id, order_min_lifetime,
 		 max_discount_pct, rarity_percent,
 		 vrarity_percent, rbc_returnable_days,
 		 rbc_designated_return, rbc_reduced_price_days,
 		 plt_returnable_hrs, plt_designated_return,
 		 plt_hla_match_return, accept_expired,
 		 quarantine_alert_time, max_lab_chk_days,
 		 max_inv_chk_days, label_review_flag, fi_company_no,
		 sample_unit_days, fi_control_no,
 		 eff_date, term_date, last_modified_date,
		 audit_key, program_id, audit_insert_dats, audit_insert_user,
		 validate_yy_value, validate_ff_value, auto_cross_allowed,
		 directed_cross_allowed
	)
	values
	(
	 :old.chapter_id,:old.chapter_name,:old.chapter_short_name,
		 :old.address_id, :old.print_hdr,
		 :old.test_chapter_ind, :old.batch_seq,:old.tb_seq,:old.ws_seq,
		 :old.sdc_ws_seq, :old.test_kit_seq,:old.drive_id,
		 :old.unit_scheme,
		 :old.group_site_id,:old.pool_seq, :old.work_number_seq,
		 :old.max_bleed_time, :old.slow_bleed_time,
		 :old.cue_scan_flag, :old.seq_checkin_flag, :new.qc_label_flag,
		 :old.nursing_flag, :old.ffp_freeze_durn, :old.cryo_time_limit,
		 :old.alt_e_level, :old.alt_se_level,
		 :old.lab_cp6_dats, :old.dmis_labds_dats,
		 :old.dmis_lab_dats, :old.lab_dmis_dats, :old.lab_ad_dats,
 		 :old.inst_id, :old.tax_id, :old.order_min_lifetime,
 		 :old.max_discount_pct, :old.rarity_percent,
 		 :old.vrarity_percent, :old.rbc_returnable_days,
 		 :old.rbc_designated_return, :old.rbc_reduced_price_days,
 		 :old.plt_returnable_hrs, :old.plt_designated_return,
 		 :old.plt_hla_match_return, :old.accept_expired,
 		 :old.quarantine_alert_time, :old.max_lab_chk_days,
 		 :old.max_inv_chk_days, :old.label_review_flag,
		 :old.fi_company_no, :old.sample_unit_days, :old.fi_control_no,
		 :old.eff_date, :old.term_date, :old.last_modified_date,
		 :old.audit_key, 'DELETE', sysdate,lt_user_session.get_userid,
		 :old.validate_yy_value, :old.validate_ff_value,
		 :old.auto_cross_allowed, :old.directed_cross_allowed
	);
end;


/
ALTER TRIGGER "CHAPTERS_BD" ENABLE;
