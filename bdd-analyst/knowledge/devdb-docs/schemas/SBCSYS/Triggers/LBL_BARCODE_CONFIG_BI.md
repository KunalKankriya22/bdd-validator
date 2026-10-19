---
tags:
  - trigger
  - SBCSYS
---
# LBL_BARCODE_CONFIG_BI

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/LBL_BARCODE_CONFIG|LBL_BARCODE_CONFIG]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
declare
    temp_audit_key    number(23);
begin
    select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
        --
    insert into LBL_BARCODE_CONFIG_audit
    (
        BARCODE_VALUE, TEST_ID, RESULT_CODE,
        AUDIT_KEY, EFF_DATE, TERM_DATE, INSERT_DATE,
	INSERT_USER, PROGRAM_ID, AUDIT_INSERT_DATS,AUDIT_INSERT_USER,PRIORITY_SEQ
    )
    values
    (
        :new.BARCODE_VALUE, :new.TEST_ID, :new.RESULT_CODE,
        :new.AUDIT_KEY, :new.EFF_DATE, :new.TERM_DATE, :new.INSERT_DATE,
	:new.INSERT_USER, :new.PROGRAM_ID, sysdate, lt_user_session.get_userid, :new.PRIORITY_SEQ
    );
    end;
```
