---
tags:
  - trigger
  - DONSYS
---
# CHAPTER_DST_OFFSET_BEFORE_UPD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_CHAPTER_DST_OFFSET|VALID_CHAPTER_DST_OFFSET]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  NUMBER(23);
BEGIN
	IF :NEW.chapter_id <> :OLD.chapter_id
	THEN
		RAISE_APPLICATION_ERROR(-20000,'Chapter ID cannot be modified....');
	ELSE
		IF NVL(:NEW.program_id,'MANUAL') = 'MANUAL' AND (:NEW.start_time < SYSDATE
			OR :NEW.end_time < SYSDATE)
		THEN
			RAISE_APPLICATION_ERROR(-20000,'Start and end dates of DST cannot be set to past days......');
		ELSE
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
				,NULL
				,NULL
				,lt_user_session.get_userid
				,SYSDATE
				,'UPDATE'
				,NVL(:NEW.program_id,'MANUAL')
			 );
		END IF;
	END IF;
END;
```
