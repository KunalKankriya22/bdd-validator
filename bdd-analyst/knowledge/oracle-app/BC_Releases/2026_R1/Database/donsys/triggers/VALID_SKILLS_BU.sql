--------------------------------------------------------
--  DDL for Trigger VALID_SKILLS_BU
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."VALID_SKILLS_BU" 
 BEFORE UPDATE
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
		:new.audit_key,
		sysdate,
		:new.program_id,
		decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid),
		:new.job_code,
		:new.skill_rating,
		:new.chapter_id,
		:new.skill_desc,
		:new.min_proj_draw,
		:new.max_proj_draw,
		:new.drive_category,
		:new.eff_date,
		:new.term_date
	);
end;
/
ALTER TRIGGER "DONSYS"."VALID_SKILLS_BU" ENABLE;
