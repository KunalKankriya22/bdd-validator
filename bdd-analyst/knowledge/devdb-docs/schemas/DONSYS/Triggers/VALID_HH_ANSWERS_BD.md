---
tags:
  - trigger
  - DONSYS
---
# VALID_HH_ANSWERS_BD

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_HH_ANSWERS|VALID_HH_ANSWERS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
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
        :old.audit_key, SYSDATE, 'DELETE', LT_USER_SESSION.GET_USERID,
        :old.chapter_id, :old.question_code, :old.answer_code, :old.response,
        :old.inter_code, :old.deferral_period, :old.period_type, :old.minimum_period,
        :old.answer_desc, :old.eff_date, :old.term_date, :old.comment_req,
        :old.manual_audit_flag, :old.group_code, :old.additional_date_flag,
        :old.variable_date, :old.date_period_type, :old.date_period_number
    );
END;
```
