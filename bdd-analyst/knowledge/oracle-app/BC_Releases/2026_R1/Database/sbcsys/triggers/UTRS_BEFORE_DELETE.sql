--------------------------------------------------------
--  DDL for Trigger UTRS_BEFORE_DELETE
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "UTRS_BEFORE_DELETE" 
before delete
on utrs
for each row
begin
    insert into utrs_audit
	(
	unit_id, coll_date, chapter_id,
	test_seq_no, test_id, test_state,
		test_mode, result_status_1, result_status_2,
		cancel_flag, edit_result_flag,
	tb_id, test_chapter_id, tb_seq_no, well_number,
	absorbance, ratio, result_dats,
	result_user_id, testing_lab_code,
	insert_dats, insert_user_id,
	audit_key, program_id, audit_insert_dats, audit_insert_user,
	extract_date
	)
	values
	(
	:old.unit_id, :old.coll_date, :old.chapter_id,
	:old.test_seq_no, :old.test_id, :old.test_state,
		:old.test_mode, :old.result_status_1, :old.result_status_2,
		:old.cancel_flag, :old.edit_result_flag,
	:old.tb_id, :old.test_chapter_id, :old.tb_seq_no, :old.well_number,
	:old.absorbance, :old.ratio, :old.result_dats,
	:old.result_user_id, :old.testing_lab_code,
	:old.insert_dats, :old.insert_user_id,
	:old.audit_key,'DELETE', sysdate, lt_user_session.get_userid,
	:old.extract_date
	);
  --  /* For deleting any unit that is present in RGT_INTERIM_RESULTS */
  --  /* awaiting result in utrs, rgt.units with result_flag as 'Y' need not */
  --  /* be deleted , as they won't be extracted from rgt_interim_results */
	begin
	    update rgt_interim_results rgt
	       set  rgt.result_flag = 'D'
	       where rgt.unit_id      = :old.unit_id
		 and rgt.coll_date    = :old.coll_date
		 and rgt.chapter_id   = :old.chapter_id
		 and exists (select 'x' from units u
			      where  u.chapter_id  = rgt.chapter_id
				and  u.contract_id = rgt.contract_id
				and  u.unit_id	   = rgt.unit_id
				and  u.coll_date   = rgt.coll_date)
		 and rgt.test_id      = :old.test_id
		 and rgt.test_seq_no  = :old.test_seq_no;
	      exception
		 when no_data_found then
		     null;
	end;
end;
/
ALTER TRIGGER "UTRS_BEFORE_DELETE" ENABLE;
