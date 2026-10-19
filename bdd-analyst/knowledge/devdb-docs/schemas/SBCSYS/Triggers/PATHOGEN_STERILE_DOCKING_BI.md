---
tags:
  - trigger
  - SBCSYS
---
# PATHOGEN_STERILE_DOCKING_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/PATHOGEN_STERILE_DOCKING|PATHOGEN_STERILE_DOCKING]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');

	insert into PATHOGEN_STERILE_DOCKING_AUDIT
	(
		UNIT_ID, CHAPTER_ID, WELD_MACHINE,
		WAFER_LOT_NO, WELD_OK, PROC_CODE,
		INSERT_DATE, INSERT_USER, PROGRAM_ID,
		SET_LOT_NO,VOL_TYPE_SET,AUDIT_KEY,SUIT_PROD_CODE,
		AUDIT_INSERT_DATS, AUDIT_INSERT_USER

	)
	values
	(
		:NEW.UNIT_ID,:NEW.CHAPTER_ID,:NEW.WELD_MACHINE ,
		:NEW.WAFER_LOT_NO,:NEW.WELD_OK , :NEW.PROC_CODE ,
		:NEW.INSERT_DATE,:NEW.INSERT_USER,:NEW.PROGRAM_ID ,
		:NEW.SET_LOT_NO,:NEW.VOL_TYPE_SET,:NEW.AUDIT_KEY,:NEW.SUIT_PROD_CODE,
		SYSDATE , lt_user_session.get_userid
	);

end;
```
