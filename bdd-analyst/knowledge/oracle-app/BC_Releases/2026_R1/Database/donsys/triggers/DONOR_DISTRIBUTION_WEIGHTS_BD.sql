--------------------------------------------------------
--  DDL for Trigger DONOR_DISTRIBUTION_WEIGHTS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."DONOR_DISTRIBUTION_WEIGHTS_BD" 
 BEFORE DELETE
 ON DONOR_DISTRIBUTION_WEIGHTS
 FOR EACH ROW
BEGIN
    insert into DONOR_DIST_WEIGHTS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		alpha_code,
		chapter_id,
		weight,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.alpha_code,
		:old.chapter_id,
		:old.weight,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."DONOR_DISTRIBUTION_WEIGHTS_BD" ENABLE;
