---
tags:
  - trigger
  - SBCSYS
---
# UNITS_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/UNITS|UNITS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    aud_rec      units_audit%rowtype;
    nCount       NUMBER := 0;
begin
	aud_rec.audit_key := :old.audit_key;
	aud_rec.program_id := :new.program_id;
	--
	if nvl(:old.unit_id,'*') !=
	   nvl(:new.unit_id,'*')
	then
	   aud_rec.unit_id := nvl(:new.unit_id,'*');
 	end if;
	if nvl(:old.coll_date,to_date ('01-JAN-33')) !=
	   nvl(:new.coll_date,to_date ('01-JAN-33'))
	then
	   aud_rec.coll_date := nvl(:new.coll_date,
			to_date('01-JAN-33','DD-MON-YY'));

           -- the below block should be commented out if the customer is
           -- not using the Chagas


            -- Added for Chagas utility

           select nvl(count(*),0) into nCount from chagas_utb where
           unit_id=:old.unit_id;

           If nCount > 0 then
              update chagas_utb set coll_date=:new.coll_date where
              unit_id=:old.unit_id;
           Else
              null;
           End If;
           --- Chagas Utility addition over

 	end if;
	if nvl(:old.chapter_id,'*') !=
	   nvl(:new.chapter_id,'*')
	then
	   aud_rec.chapter_id := nvl(:new.chapter_id,'*');
 	end if;
	if nvl(:old.donor_decision_code,'*') !=
	   nvl(:new.donor_decision_code,'*')
	then
	   aud_rec.donor_decision_code :=
			nvl(:new.donor_decision_code,'*');
 	end if;
	if nvl(:old.batch_id,'*') !=
	   nvl(:new.batch_id,'*')
	then
	   aud_rec.batch_id := nvl(:new.batch_id,'*');
 	end if;
	if nvl(:old.drive_id,'*') !=
	   nvl(:new.drive_id,'*')
	then
	   aud_rec.drive_id := nvl(:new.drive_id,'*');
 	end if;
	if nvl(:old.group_site_id,'*') !=
	   nvl(:new.group_site_id,'*')
	then
	   aud_rec.group_site_id := nvl(:new.group_site_id,'*');
 	end if;
	if nvl(:old.contract_id,'*') !=
	   nvl(:new.contract_id,'*')
	then
	   aud_rec.contract_id := nvl(:new.contract_id,'*');
 	end if;
	if nvl(:old.contract_suffix,'*') !=
	   nvl(:new.contract_suffix,'*')
	then
	   aud_rec.contract_suffix := nvl(:new.contract_suffix,'*');
 	end if;
	if nvl(:old.bag_code,'*') !=
	   nvl(:new.bag_code,'*')
	then
	   aud_rec.bag_code := nvl(:new.bag_code,'*');
 	end if;
	if nvl(:old.add_on_bags,-1) !=
	   nvl(:new.add_on_bags,-1)
	then
	   aud_rec.add_on_bags := nvl(:new.add_on_bags,-1);
 	end if;
	if nvl(:old.bleed_start_time,to_date ('01-JAN-33')) !=
	   nvl(:new.bleed_start_time,to_date ('01-JAN-33'))
	then
	   aud_rec.bleed_start_time := nvl(:new.bleed_start_time,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.bleed_end_time,to_date ('01-JAN-33')) !=
	   nvl(:new.bleed_end_time,to_date ('01-JAN-33'))
	then
	   aud_rec.bleed_end_time := nvl(:new.bleed_end_time,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.insert_dats,to_date ('01-JAN-33')) !=
	   nvl(:new.insert_dats,to_date ('01-JAN-33'))
	then
	   aud_rec.insert_dats := nvl(:new.insert_dats,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.bag_check_in_dats,to_date ('01-JAN-33')) !=
	   nvl(:new.bag_check_in_dats,to_date ('01-JAN-33'))
	then
	   aud_rec.bag_check_in_dats := nvl(:new.bag_check_in_dats,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.lot_number,'*') !=
	   nvl(:new.lot_number,'*')
	then
	   aud_rec.lot_number := nvl(:new.lot_number,'*');
 	end if;
	if nvl(:old.work_number,-1) !=
	   nvl(:new.work_number,-1)
	then
	   aud_rec.work_number := nvl(:new.work_number,-1);
 	end if;
	if nvl(:old.received_date,to_date ('01-JAN-33')) !=
	   nvl(:new.received_date,to_date ('01-JAN-33'))
	then
	   aud_rec.received_date := nvl(:new.received_date,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.os_unit_id,'*') !=
	   nvl(:new.os_unit_id,'*')
	then
	   aud_rec.os_unit_id := nvl(:new.os_unit_id,'*');
 	end if;
	if nvl(:old.first_sep_centrifuge_id,'*') !=
	   nvl(:new.first_sep_centrifuge_id,'*')
	then
	   aud_rec.first_sep_centrifuge_id :=
			nvl(:new.first_sep_centrifuge_id,'*');
 	end if;
	if nvl(:old.first_sep_time,to_date ('01-JAN-33')) !=
	   nvl(:new.first_sep_time,to_date ('01-JAN-33'))
	then
	   aud_rec.first_sep_time := nvl(:new.first_sep_time,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.second_sep_time,to_date ('01-JAN-33')) !=
	   nvl(:new.second_sep_time,to_date ('01-JAN-33'))
	then
	   aud_rec.second_sep_time := nvl(:new.second_sep_time,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.third_sep_time,to_date ('01-JAN-33')) !=
	   nvl(:new.third_sep_time,to_date ('01-JAN-33'))
	then
	   aud_rec.third_sep_time := nvl(:new.third_sep_time,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.first_sep_weight,-1) !=
	   nvl(:new.first_sep_weight,-1)
	then
	   aud_rec.first_sep_weight := nvl(:new.first_sep_weight,-1);
 	end if;
	if nvl(:old.second_sep_weight,-1) !=
	   nvl(:new.second_sep_weight,-1)
	then
	   aud_rec.second_sep_weight := nvl(:new.second_sep_weight,-1);
 	end if;
	if nvl(:old.third_sep_weight,-1) !=
	   nvl(:new.third_sep_weight,-1)
	then
	   aud_rec.third_sep_weight := nvl(:new.third_sep_weight,-1);
 	end if;
	if nvl(:old.first_sep_user_id,'*') !=
	   nvl(:new.first_sep_user_id,'*')
	then
	   aud_rec.first_sep_user_id := nvl(:new.first_sep_user_id,'*');
 	end if;
	if nvl(:old.first_sep_entry_mode,'*') !=
	   nvl(:new.first_sep_entry_mode,'*')
	then
	   aud_rec.first_sep_entry_mode :=
			nvl(:new.first_sep_entry_mode,'*');
 	end if;
	if nvl(:old.second_sep_centrifuge_id,'*') !=
	   nvl(:new.second_sep_centrifuge_id,'*')
	then
	   aud_rec.second_sep_centrifuge_id :=
			nvl(:new.second_sep_centrifuge_id,'*');
 	end if;
	if nvl(:old.second_sep_user_id,'*') !=
	   nvl(:new.second_sep_user_id,'*')
	then
	   aud_rec.second_sep_user_id := nvl(:new.second_sep_user_id,'*');
 	end if;
	if nvl(:old.second_sep_entry_mode,'*') !=
	   nvl(:new.second_sep_entry_mode,'*')
	then
	   aud_rec.second_sep_entry_mode :=
			nvl(:new.second_sep_entry_mode,'*');
 	end if;
	if nvl(:old.third_sep_centrifuge_id,'*') !=
	   nvl(:new.third_sep_centrifuge_id,'*')
	then
	   aud_rec.third_sep_centrifuge_id :=
		       nvl(:new.third_sep_centrifuge_id,'*');
 	end if;
	if nvl(:old.third_sep_user_id,'*') !=
	   nvl(:new.third_sep_user_id,'*')
	then
	   aud_rec.third_sep_user_id := nvl(:new.third_sep_user_id,'*');
 	end if;
	if nvl(:old.third_sep_entry_mode,'*') !=
	   nvl(:new.third_sep_entry_mode,'*')
	then
	   aud_rec.third_sep_entry_mode :=
		       nvl(:new.third_sep_entry_mode,'*');
 	end if;
	if nvl(:old.donor_form_abo,'*') !=
	   nvl(:new.donor_form_abo,'*')
	then
	   aud_rec.donor_form_abo := nvl(:new.donor_form_abo,'*');
 	end if;
	if nvl(:old.prior_abo,'*') !=
	   nvl(:new.prior_abo,'*')
	then
	   aud_rec.prior_abo := nvl(:new.prior_abo,'*');
 	end if;
	if nvl(:old.cmv_stat,'*') !=
	   nvl(:new.cmv_stat,'*')
	then
	   aud_rec.cmv_stat := nvl(:new.cmv_stat,'*');
 	end if;
	if nvl(:old.prior_cmv_stat,'*') !=
	   nvl(:new.prior_cmv_stat,'*')
	then
	   aud_rec.prior_cmv_stat := nvl(:new.prior_cmv_stat,'*');
 	end if;
	if nvl(:old.system_label_decision,'*') !=
	   nvl(:new.system_label_decision,'*')
	then
	   aud_rec.system_label_decision :=
		       nvl(:new.system_label_decision,'*');
 	end if;
	if nvl(:old.registry_flag,'*') !=
	   nvl(:new.registry_flag,'*')
	then
	   aud_rec.registry_flag := nvl(:new.registry_flag,'*');
 	end if;
	if nvl(:old.rare_flag,'*') !=
	   nvl(:new.rare_flag,'*')
	then
	   aud_rec.rare_flag := nvl(:new.rare_flag,'*');
 	end if;
	if nvl(:old.prior_rare_flag,'*') !=
	   nvl(:new.prior_rare_flag,'*')
	then
	   aud_rec.prior_rare_flag := nvl(:new.prior_rare_flag,'*');
 	end if;
	if nvl(:old.vrare_flag,'*') !=
	   nvl(:new.vrare_flag,'*')
	then
	   aud_rec.vrare_flag := nvl(:new.vrare_flag,'*');
 	end if;
	if nvl(:old.prior_vrare_flag,'*') !=
	   nvl(:new.prior_vrare_flag,'*')
	then
	   aud_rec.prior_vrare_flag := nvl(:new.prior_vrare_flag,'*');
 	end if;
	if nvl(:old.red_tube_flag,'*') !=
	   nvl(:new.red_tube_flag,'*')
	then
	   aud_rec.red_tube_flag := nvl(:new.red_tube_flag,'*');
 	end if;
	if nvl(:old.purple_tube_flag,'*') !=
	   nvl(:new.purple_tube_flag,'*')
	then
	   aud_rec.purple_tube_flag := nvl(:new.purple_tube_flag,'*');
 	end if;
	if nvl(:old.serum_plasma_ind,'*') !=
	   nvl(:new.serum_plasma_ind,'*')
	then
	   aud_rec.serum_plasma_ind := nvl(:new.serum_plasma_ind,'*');
 	end if;
	if nvl(:old.qc_checkin_flag,'*') !=
	   nvl(:new.qc_checkin_flag,'*')
	then
	   aud_rec.qc_checkin_flag := nvl(:new.qc_checkin_flag,'*');
 	end if;
	if nvl(:old.qc_checkin_date,to_date ('01-JAN-33')) !=
	   nvl(:new.qc_checkin_date,to_date ('01-JAN-33'))
	then
	   aud_rec.qc_checkin_date := nvl(:new.qc_checkin_date,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.qc_test_flag,'*') !=
	   nvl(:new.qc_test_flag,'*')
	then
	   aud_rec.qc_test_flag := nvl(:new.qc_test_flag,'*');
 	end if;
	if nvl(:old.qc_test_date,to_date ('01-JAN-33')) !=
	   nvl(:new.qc_test_date,to_date ('01-JAN-33'))
	then
	   aud_rec.qc_test_date := nvl(:new.qc_test_date,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.qc_label_date,to_date ('01-JAN-33')) !=
	   nvl(:new.qc_label_date,to_date ('01-JAN-33'))
	then
	   aud_rec.qc_label_date := nvl(:new.qc_label_date,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.qc_label_flag,'*') !=
	   nvl(:new.qc_label_flag,'*')
	then
	   aud_rec.qc_label_flag := nvl(:new.qc_label_flag,'*');
 	end if;
	if nvl(:old.nursing_audit_flag,'*') !=
	   nvl(:new.nursing_audit_flag,'*')
	then
	   aud_rec.nursing_audit_flag := nvl(:new.nursing_audit_flag,'*');
 	end if;
	if nvl(:old.nursing_audit_status,'*') !=
	   nvl(:new.nursing_audit_status,'*')
	then
	   aud_rec.nursing_audit_status := nvl(:new.nursing_audit_status,'*');
 	end if;
	if nvl(:old.component_review_flag,'*') !=
	   nvl(:new.component_review_flag,'*')
	then
	   aud_rec.component_review_flag := nvl(:new.component_review_flag,'*');
 	end if;
	if nvl(:old.lab_dist_dats,to_date ('01-JAN-33')) !=
	   nvl(:new.lab_dist_dats,to_date ('01-JAN-33'))
	then
	   aud_rec.lab_dist_dats := nvl(:new.lab_dist_dats,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.lab_donor_dats,to_date ('01-JAN-33')) !=
	   nvl(:new.lab_donor_dats,to_date ('01-JAN-33'))
	then
	   aud_rec.lab_donor_dats := nvl(:new.lab_donor_dats,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.donor_lab_dats,to_date ('01-JAN-33')) !=
	   nvl(:new.donor_lab_dats,to_date ('01-JAN-33'))
	then
	   aud_rec.donor_lab_dats := nvl(:new.donor_lab_dats,
				       to_date('01-JAN-33','DD-MON-YY'));
 	end if;
	if nvl(:old.note_id,-1) !=
	   nvl(:new.note_id,-1)
	then
	   aud_rec.note_id := nvl(:new.note_id,-1);
 	end if;
	if nvl(:old.unit_scheme_type,'C') !=
	   nvl(:new.unit_scheme_type,'C')
	then
	   aud_rec.unit_scheme_type := nvl(:new.unit_scheme_type,'C');
	end if;
	if nvl(:old.chk_digit,'@') !=
	   nvl(:new.chk_digit,'@')
	then
	   aud_rec.chk_digit := nvl(:new.chk_digit,'@');
	end if;

	if nvl(:old.RED_TUBE2,'*') !=
	   nvl(:new.RED_TUBE2,'*')
	then
	   aud_rec.RED_TUBE2 := nvl(:new.RED_TUBE2,'*');
 	end if;

	if nvl(:old.WAREHOUSE_ID,'*') !=
	   nvl(:new.WAREHOUSE_ID,'*')
	then
	   aud_rec.WAREHOUSE_ID := nvl(:new.WAREHOUSE_ID,'*');
 	end if;

	if nvl(:old.CATALOG_NUMBER,'*') !=
	   nvl(:new.CATALOG_NUMBER,'*')
	then
	   aud_rec.CATALOG_NUMBER := nvl(:new.CATALOG_NUMBER,'*');
 	end if;

	if nvl(:old.RED_TUBE_2_FLAG,'*') !=
	   nvl(:new.RED_TUBE_2_FLAG,'*')
	then
	   aud_rec.RED_TUBE_2_FLAG := nvl(:new.RED_TUBE_2_FLAG,'*');
 	end if;

	if nvl(:old.CNF_CHECKIN_FLAG,'*') !=
	   nvl(:new.CNF_CHECKIN_FLAG,'*')
	then
	   aud_rec.CNF_CHECKIN_FLAG := nvl(:new.CNF_CHECKIN_FLAG,'*');
 	end if;


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
		lab_dist_dats, lab_donor_dats, donor_lab_dats,
		note_id, audit_key, program_id,
		audit_insert_dats, audit_insert_user,
		chk_digit, unit_scheme_type,
		RED_TUBE2,WAREHOUSE_ID,
		CATALOG_NUMBER,RED_TUBE_2_FLAG,CNF_CHECKIN_FLAG
	)
	values
	(
		aud_rec.unit_id ,aud_rec.coll_date ,
		aud_rec.chapter_id , aud_rec.donor_decision_code ,
		aud_rec.batch_id , aud_rec.drive_id ,
		aud_rec.group_site_id , aud_rec.contract_id ,
		aud_rec.contract_suffix , aud_rec.bag_code ,
		aud_rec.add_on_bags , aud_rec.bleed_start_time ,
		aud_rec.bleed_end_time , aud_rec.insert_dats ,
		aud_rec.bag_check_in_dats , aud_rec.lot_number ,
		aud_rec.work_number , aud_rec.received_date ,
		aud_rec.os_unit_id , aud_rec.first_sep_centrifuge_id ,
		aud_rec.first_sep_time , aud_rec.first_sep_weight ,
		aud_rec.first_sep_user_id , aud_rec.first_sep_entry_mode ,
		aud_rec.second_sep_centrifuge_id , aud_rec.second_sep_time ,
		aud_rec.second_sep_weight , aud_rec.second_sep_user_id ,
		aud_rec.second_sep_entry_mode , aud_rec.third_sep_centrifuge_id ,
		aud_rec.third_sep_time , aud_rec.third_sep_weight ,
		aud_rec.third_sep_user_id , aud_rec.third_sep_entry_mode ,
		aud_rec.donor_form_abo , aud_rec.prior_abo ,
		aud_rec.cmv_stat , aud_rec.prior_cmv_stat ,
		aud_rec.system_label_decision , aud_rec.registry_flag ,
		aud_rec.rare_flag , aud_rec.prior_rare_flag ,
		aud_rec.vrare_flag , aud_rec.prior_vrare_flag ,
		aud_rec.red_tube_flag , aud_rec.purple_tube_flag ,
		aud_rec.serum_plasma_ind , aud_rec.qc_checkin_flag ,
		aud_rec.qc_checkin_date , aud_rec.qc_test_flag ,
		aud_rec.qc_test_date , aud_rec.qc_label_flag ,
		aud_rec.qc_label_date , aud_rec.nursing_audit_flag ,
		aud_rec.nursing_audit_status ,
		aud_rec.lab_dist_dats, aud_rec.lab_donor_dats, aud_rec.donor_lab_dats,
		aud_rec.note_id , aud_rec.audit_key , aud_rec.program_id,
		sysdate, lt_user_session.get_userid,
		aud_rec.chk_digit, aud_rec.unit_scheme_type,
		aud_rec.RED_TUBE2,aud_rec.WAREHOUSE_ID,
		aud_rec.CATALOG_NUMBER,aud_rec.RED_TUBE_2_FLAG,aud_rec.CNF_CHECKIN_FLAG

	);

  emf_util.staging_insert('UNITS', :NEW.audit_key, :NEW.program_id, 'LAB', 'UNITS_BEFORE_UPDATE', 'U');
end;
```
