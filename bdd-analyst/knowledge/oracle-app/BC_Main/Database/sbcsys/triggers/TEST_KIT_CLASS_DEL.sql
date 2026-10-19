--------------------------------------------------------
--  DDL for Trigger TEST_KIT_CLASS_DEL
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "TEST_KIT_CLASS_DEL" 
before delete
on test_kit_class
for each row
begin
    insert into test_kit_class_audit
	(
		test_chapter_id, test_id, test_kit_class,
		eff_date, term_date, last_modified_date,
		audit_key, program_id,
		audit_insert_dats, audit_insert_user
	)
	values
	(
		:old.test_chapter_id, :old.test_id, :old.test_kit_class,
		:old.eff_date, :old.term_date, :old.last_modified_date,
		:old.audit_key, :old.program_id,
		sysdate, lt_user_session.get_userid
	);
end;
/
ALTER TRIGGER "TEST_KIT_CLASS_DEL" ENABLE;
