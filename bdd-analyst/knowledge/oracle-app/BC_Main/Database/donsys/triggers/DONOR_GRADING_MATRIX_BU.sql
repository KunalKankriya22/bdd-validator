--------------------------------------------------------
--  DDL for Trigger DONOR_GRADING_MATRIX_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_GRADING_MATRIX_BU" 
 BEFORE UPDATE
 ON DONOR_GRADING_MATRIX
 FOR EACH ROW
BEGIN
	insert into DONOR_GRADING_MATRIX_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		dgm_id,
		ssn_match,
		lastname_match,
		firstname_match,
		dob_match,
		gender_match,
		grade,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.dgm_id,
		:new.ssn_match,
		:new.lastname_match,
		:new.firstname_match,
		:new.dob_match,
		:new.gender_match,
		:new.grade,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."DONOR_GRADING_MATRIX_BU" ENABLE;
