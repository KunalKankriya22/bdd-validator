--------------------------------------------------------
--  DDL for Trigger UNIT_TEST_BASE_BEFORE_UPDATE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UNIT_TEST_BASE_BEFORE_UPDATE" 
before update
on unit_test_base
for each row
declare
    aud_rec	 unit_test_base_audit%rowtype;
begin
    aud_rec.audit_key := :old.audit_key;
    aud_rec.program_id := :new.program_id;
    --
	if nvl(:old.unit_id,'*') !=
       nvl(:new.unit_id,'*')
    then
       aud_rec.unit_id := nvl(:new.unit_id,'*');
    end if;
    if nvl(:old.coll_date,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.coll_date,to_date('01-JAN-33','DD-MON-YY'))
    then
       aud_rec.coll_date :=
		    nvl(:new.coll_date,to_date('01-JAN-33','DD-MON-YY'));
    end if;
	if nvl(:old.chapter_id,'*') !=
       nvl(:new.chapter_id,'*')
    then
       aud_rec.chapter_id := nvl(:new.chapter_id,'*');
    end if;
    if nvl(:old.test_seq_no,-1) !=
       nvl(:new.test_seq_no,-1)
    then
       aud_rec.test_seq_no := nvl(:new.test_seq_no,-1);
    end if;
	if nvl(:old.test_id,'*') !=
       nvl(:new.test_id,'*')
    then
       aud_rec.test_id := nvl(:new.test_id,'*');
    end if;
	if nvl(:old.test_state,'*') !=
       nvl(:new.test_state,'*')
    then
       aud_rec.test_state := nvl(:new.test_state,'*');
    end if;
    if nvl(:old.test_mode,'*') !=
       nvl(:new.test_mode,'*')
    then
       aud_rec.test_mode := nvl(:new.test_mode,'*');
    end if;
    if nvl(:old.temp_result_1,'*') !=
       nvl(:new.temp_result_1,'*')
    then
       aud_rec.temp_result_1 := nvl(:new.temp_result_1,'*');
    end if;
    if nvl(:old.temp_result_2,'*') !=
       nvl(:new.temp_result_2,'*')
    then
       aud_rec.temp_result_2 := nvl(:new.temp_result_2,'*');
    end if;
    if nvl(:old.temp_result_1_user_id,'*') !=
       nvl(:new.temp_result_1_user_id,'*')
    then
       aud_rec.temp_result_1_user_id := nvl(:new.temp_result_1_user_id,'*');
    end if;
    if nvl(:old.temp_result_2_user_id,'*') !=
       nvl(:new.temp_result_2_user_id,'*')
    then
       aud_rec.temp_result_2_user_id := nvl(:new.temp_result_2_user_id,'*');
    end if;
    if nvl(:old.result_status_1,'*') !=
       nvl(:new.result_status_1,'*')
    then
       aud_rec.result_status_1 := nvl(:new.result_status_1,'*');
    end if;
    if nvl(:old.result_status_2,'*') !=
       nvl(:new.result_status_2,'*')
    then
       aud_rec.result_status_2 := nvl(:new.result_status_2,'*');
    end if;
    if nvl(:old.cancel_flag,'*') !=
       nvl(:new.cancel_flag,'*')
    then
       aud_rec.cancel_flag := nvl(:new.cancel_flag,'*');
    end if;
    if nvl(:old.edit_result_flag,'*') !=
       nvl(:new.edit_result_flag,'*')
    then
       aud_rec.edit_result_flag := nvl(:new.edit_result_flag,'*');
    end if;
    if nvl(:old.tb_id,'*') != nvl(:new.tb_id,'*')
    then
       aud_rec.tb_id := nvl(:new.tb_id,'*');
    end if;
    if nvl(:old.test_chapter_id,'*') !=
       nvl(:new.test_chapter_id,'*')
    then
       aud_rec.test_chapter_id := nvl(:new.test_chapter_id,'*');
    end if;
    if nvl(:old.tb_seq_no,-1) != nvl(:new.tb_seq_no,-1)
    then
       aud_rec.tb_seq_no := nvl(:new.tb_seq_no,-1);
    end if;
    if nvl(:old.well_number,'*') !=
       nvl(:new.well_number,'*')
    then
       aud_rec.well_number := nvl(:new.well_number,'*');
    end if;
    if nvl(:old.absorbance,'*') !=
       nvl(:new.absorbance,'*')
    then
       aud_rec.absorbance := nvl(:new.absorbance,'*');
    end if;
    if nvl(:old.ratio,'*') !=
       nvl(:new.ratio,'*')
    then
       aud_rec.ratio := nvl(:new.ratio,'*');
    end if;
    if nvl(:old.result_dats,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.result_dats,to_date('01-JAN-33','DD-MON-YY'))
    then
       aud_rec.result_dats :=
		    nvl(:new.result_dats,to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.result_user_id,'*') !=
       nvl(:new.result_user_id,'*')
    then
       aud_rec.result_user_id := nvl(:new.result_user_id,'*');
    end if;
    if nvl(:old.testing_lab_code,'*') !=
       nvl(:new.testing_lab_code,'*')
    then
       aud_rec.testing_lab_code :=nvl(:new.testing_lab_code,'*');
    end if;
    insert into unit_test_base_audit
	(
		unit_id, coll_date, chapter_id,
		test_seq_no, test_id, test_state,
		test_mode,
		temp_result_1, temp_result_1_user_id,
		temp_result_2, temp_result_2_user_id,
		result_status_1, result_status_2,
		cancel_flag, edit_result_flag,
		tb_id, test_chapter_id, tb_seq_no,
		well_number, absorbance,
		ratio, result_dats,
		result_user_id, testing_lab_code,
		insert_dats, insert_user_id,
		audit_key,program_id,
		audit_insert_dats,  audit_insert_user
	)
    values
	(
		aud_rec.unit_id, aud_rec.coll_date, aud_rec.chapter_id,
		aud_rec.test_seq_no, aud_rec.test_id, aud_rec.test_state,
		aud_rec.test_mode,
		aud_rec.temp_result_1, aud_rec.temp_result_1_user_id,
		aud_rec.temp_result_2, aud_rec.temp_result_2_user_id,
		aud_rec.result_status_1, aud_rec.result_status_2,
		aud_rec.cancel_flag, aud_rec.edit_result_flag,
		aud_rec.tb_id, aud_rec.test_chapter_id, aud_rec.tb_seq_no,
		aud_rec.well_number, aud_rec.absorbance,
		aud_rec.ratio, aud_rec.result_dats,
		aud_rec.result_user_id, aud_rec.testing_lab_code,
		aud_rec.insert_dats, aud_rec.insert_user_id,
		aud_rec.audit_key, aud_rec.program_id,
		sysdate, lt_user_session.get_userid
	 );
end;
/
ALTER TRIGGER "UNIT_TEST_BASE_BEFORE_UPDATE" ENABLE;
