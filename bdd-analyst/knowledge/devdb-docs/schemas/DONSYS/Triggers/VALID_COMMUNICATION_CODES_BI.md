---
tags:
  - trigger
  - DONSYS
---
# VALID_COMMUNICATION_CODES_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_COMMUNICATION_CODES|VALID_COMMUNICATION_CODES]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE nCount   NUMBER:=0;
BEGIN
SELECT NVL(COUNT(*),0)
    INTO nCount
    FROM institution_tables
    WHERE table_name='VALID_COMMUNICATION_CODES'
    AND sysdate BETWEEN NVL(eff_date,sysdate) AND NVL(term_date,sysdate+1);
    IF nCount         > 0 THEN
      :new.chapter_id:='ALL';
    END IF;
select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
into :new.insert_user from dual ;
:new.insert_date := sysdate ;
end ;
```
