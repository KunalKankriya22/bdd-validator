---
tags:
  - trigger
  - DONSYS
---
# CHAPTER_DST_OFFSET_BEFORE_DEL

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_CHAPTER_DST_OFFSET|VALID_CHAPTER_DST_OFFSET]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  NUMBER(23);
BEGIN
	--
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
		:OLD.chapter_id
		,:OLD.start_time
		,:OLD.end_time
		,:OLD.tz_base_diff
		,:OLD.off_set
		,:OLD.last_modifed_date
		,:OLD.audit_key
		,:OLD.tz_region
		,NULL
		,NULL
		,lt_user_session.get_userid
		,SYSDATE
		,'DELETE'
		,NVL(:OLD.program_id,'MANUAL')
	 );
END;
```
