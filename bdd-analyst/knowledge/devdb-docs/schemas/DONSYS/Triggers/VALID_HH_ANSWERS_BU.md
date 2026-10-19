---
tags:
  - trigger
  - DONSYS
---
# VALID_HH_ANSWERS_BU

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HH_ANSWERS|VALID_HH_ANSWERS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
    INSERT INTO VALID_HH_ANSWERS_audit (
        audit_key, audit_insert_dats, program_id, user_id,
        chapter_id, question_code, answer_code, response,
        inter_code, deferral_period, period_type, minimum_period,
        answer_desc, eff_date, term_date, comment_req,
        manual_audit_flag, group_code, additional_date_flag,
        variable_date, date_period_type, date_period_number
    ) VALUES (
        :new.audit_key, SYSDATE, :new.program_id, LT_USER_SESSION.GET_USERID,
        :new.chapter_id, :new.question_code, :new.answer_code, :new.response,
        :new.inter_code, :new.deferral_period, :new.period_type, :new.minimum_period,
        :new.answer_desc, :new.eff_date, :new.term_date, :new.comment_req,
        :new.manual_audit_flag, :new.group_code, :new.additional_date_flag,
        :new.variable_date, :new.date_period_type, :new.date_period_number
    );
END;
```
