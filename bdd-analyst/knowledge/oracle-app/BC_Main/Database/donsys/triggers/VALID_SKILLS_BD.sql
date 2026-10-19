--------------------------------------------------------
--  DDL for Trigger VALID_SKILLS_BD
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_SKILLS_BD" 
 BEFORE DELETE
 ON VALID_SKILLS
 FOR EACH ROW
BEGIN
    insert into VALID_SKILLS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		job_code,
		skill_rating,
		chapter_id,
		skill_desc,
		min_proj_draw,
		max_proj_draw,
		drive_category,
		eff_date,
		term_date
	)
	values
	(
		:old.audit_key,
		sysdate,
		'DELETE',
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:old.job_code,
		:old.skill_rating,
		:old.chapter_id,
		:old.skill_desc,
		:old.min_proj_draw,
		:old.max_proj_draw,
		:old.drive_category,
		:old.eff_date,
		:old.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_SKILLS_BD" ENABLE;
