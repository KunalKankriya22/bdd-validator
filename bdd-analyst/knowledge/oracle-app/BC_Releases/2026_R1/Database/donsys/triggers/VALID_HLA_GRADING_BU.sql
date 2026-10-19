--------------------------------------------------------
--  DDL for Trigger VALID_HLA_GRADING_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_HLA_GRADING_BU" 
 BEFORE UPDATE
 ON VALID_HLA_GRADING
 FOR EACH ROW
BEGIN
	insert into VALID_HLA_GRADING_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		grade_id,
		chapter_id,
		grade,
		grade_level,
		a1,
		a2,
		b1,
		b2,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.grade_id,
		:new.chapter_id,
		:new.grade,
		:new.grade_level,
		:new.a1,
		:new.a2,
		:new.b1,
		:new.b2,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_HLA_GRADING_BU" ENABLE;
