--------------------------------------------------------
--  DDL for Trigger CHAPTERS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "CHAPTERS_BU" 
before update of
 CHAPTER_ID		       ,
 CHAPTER_NAME		       ,
 CHAPTER_SHORT_NAME	       ,
 ADDRESS_ID		       ,
 PRINT_HDR		       ,
 TEST_CHAPTER_IND	       ,
 UNIT_SCHEME		       ,
 MAX_BLEED_TIME 	       ,
 SLOW_BLEED_TIME	       ,
 CUE_SCAN_FLAG		       ,
 SEQ_CHECKIN_FLAG	       ,
 QC_LABEL_FLAG		       ,
 NURSING_FLAG		       ,
 FFP_FREEZE_DURN	       ,
 CRYO_TIME_LIMIT	       ,
 ALT_E_LEVEL		       ,
 ALT_SE_LEVEL		       ,
 LAB_CP6_DATS		       ,
 DMIS_LABDS_DATS	       ,
 DMIS_LAB_DATS		       ,
 LAB_DMIS_DATS		       ,
 LAB_AD_DATS		       ,
 EFF_DATE		       ,
 TERM_DATE		       ,
 LAST_MODIFIED_DATE	       ,
 AUDIT_KEY		       ,
 PROGRAM_ID		       ,
 INST_ID		       ,
 TAX_ID 		       ,
 ORDER_MIN_LIFETIME	       ,
 MAX_DISCOUNT_PCT	       ,
 RARITY_PERCENT 	       ,
 VRARITY_PERCENT	       ,
 RBC_RETURNABLE_DAYS	       ,
 RBC_DESIGNATED_RETURN	       ,
 RBC_REDUCED_PRICE_DAYS        ,
 PLT_RETURNABLE_HRS	       ,
 PLT_DESIGNATED_RETURN	       ,
 PLT_HLA_MATCH_RETURN	       ,
 ACCEPT_EXPIRED 	       ,
 QUARANTINE_ALERT_TIME	       ,
 MAX_LAB_CHK_DAYS	       ,
 MAX_INV_CHK_DAYS	       ,
 LABEL_REVIEW_FLAG	       ,
 FI_COMPANY_NO		       ,
 SAMPLE_UNIT_DAYS
on chapters
for each row
--
--	do not log the changes to the sequences and interface timestamps
--
declare
	temp_audit_key	  number(23);
begin
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
	--
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
		 audit_key, program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
	 :new.chapter_id,:new.chapter_name,:new.chapter_short_name,
		 :new.address_id, :new.print_hdr,
		 :new.test_chapter_ind, :new.batch_seq,:new.tb_seq,:new.ws_seq,
		 :new.sdc_ws_seq, :new.test_kit_seq,:new.drive_id,
		 :new.unit_scheme, :new.group_site_id,:new.pool_seq,
		 :new.work_number_seq, :new.max_bleed_time,:new.slow_bleed_time,
		 :new.cue_scan_flag, :new.seq_checkin_flag, :new.qc_label_flag,
		 :new.nursing_flag, :new.ffp_freeze_durn, :new.cryo_time_limit,
		 :new.alt_e_level, :new.alt_se_level,
		 :new.lab_cp6_dats, :new.dmis_labds_dats,
		 :new.dmis_lab_dats, :new.lab_dmis_dats, :new.lab_ad_dats,
 		 :new.inst_id, :new.tax_id, :new.order_min_lifetime,
 		 :new.max_discount_pct, :new.rarity_percent,
 		 :new.vrarity_percent, :new.rbc_returnable_days,
 		 :new.rbc_designated_return, :new.rbc_reduced_price_days,
 		 :new.plt_returnable_hrs, :new.plt_designated_return,
 		 :new.plt_hla_match_return, :new.accept_expired,
 		 :new.quarantine_alert_time, :new.max_lab_chk_days,
 		 :new.max_inv_chk_days, :new.label_review_flag,
		 :new.fi_company_no, :new.sample_unit_days,
		 :new.fi_control_no, :new.eff_date, :new.term_date,
		 :new.last_modified_date,
		 :new.audit_key, :new.program_id, sysdate, lt_user_session.get_userid
	 );
end;

/
ALTER TRIGGER "CHAPTERS_BU" ENABLE;
