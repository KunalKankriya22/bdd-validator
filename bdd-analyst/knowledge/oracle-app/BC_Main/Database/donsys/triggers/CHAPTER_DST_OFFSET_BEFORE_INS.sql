--------------------------------------------------------
--  DDL for Trigger CHAPTER_DST_OFFSET_BEFORE_INS
--------------------------------------------------------

  CREATE OR REPLACE EDITIONABLE TRIGGER "DONSYS"."CHAPTER_DST_OFFSET_BEFORE_INS" 
BEFORE INSERT
ON valid_chapter_dst_offset
FOR EACH ROW
DECLARE
	temp_audit_key	  NUMBER(23);
BEGIN
	SELECT	audit_seq.NEXTVAL
	INTO 	temp_audit_key
	FROM 	DUAL;
	:NEW.audit_key 			:= 	temp_audit_key;
    INSERT INTO valid_chapter_dst_offset_audit
	(
	 	chapter_id
	 	,start_time
	 	,end_time
	 	,tz_base_diff
	 	,off_set
	 	,last_modifed_date
	 	,audit_key
	 	,tz_region
	 	,inserted_by
		,insert_date
		,updated_by
		,update_date
		,dml_type
		,program_id
	)
	VALUES
	(
		:NEW.chapter_id
		,:NEW.start_time
		,:NEW.end_time
		,:NEW.tz_base_diff
		,:NEW.off_set
		,SYSDATE
		,:NEW.audit_key
		,:NEW.tz_region
		,lt_user_session.get_userid
		,SYSDATE
		,NULL
		,NULL
		,'INSERT'
		,NVL(:NEW.program_id,'MANUAL')
	 );
END;
/
ALTER TRIGGER "DONSYS"."CHAPTER_DST_OFFSET_BEFORE_INS" ENABLE;
