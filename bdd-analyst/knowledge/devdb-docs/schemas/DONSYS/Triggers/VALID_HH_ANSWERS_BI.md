---
tags:
  - trigger
  - DONSYS
---
# VALID_HH_ANSWERS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HH_ANSWERS|VALID_HH_ANSWERS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
    temp_audit_key   NUMBER(23);
    nCount           NUMBER;
BEGIN
    SELECT NVL(COUNT(*),0) INTO nCount FROM institution_tables
    WHERE table_name = 'VALID_HH_ANSWERS'
      AND SYSDATE BETWEEN NVL(eff_date, SYSDATE) AND NVL(term_date, SYSDATE+1);

    SELECT LT_USER_SESSION.GET_USERID INTO :new.insert_user FROM dual;
    :new.insert_date := SYSDATE;
    SELECT audit_seq.nextval INTO temp_audit_key FROM dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := NVL(:new.program_id, 'MANUAL');

    IF nCount > 0 THEN
        :new.chapter_id := 'ALL';
    END IF;

    INSERT INTO DONSYS.VALID_HH_ANSWERS_audit (
        audit_key, audit_insert_dats, program_id, user_id,
        chapter_id, question_code, answer_code, response,
        inter_code, deferral_period, period_type, minimum_period,
        answer_desc, eff_date, term_date, comment_req,
        manual_audit_flag, group_code, additional_date_flag,
        variable_date, date_period_type, date_period_number
    ) VALUES (
        :new.audit_key, SYSDATE, :new.program_id, :new.insert_user,
        :new.chapter_id, :new.question_code, :new.answer_code, :new.response,
        :new.inter_code, :new.deferral_period, :new.period_type, :new.minimum_period,
        :new.answer_desc, :new.eff_date, :new.term_date, :new.comment_req,
        :new.manual_audit_flag, :new.group_code, :new.additional_date_flag,
        :new.variable_date, :new.date_period_type, :new.date_period_number
    );
END;
```
