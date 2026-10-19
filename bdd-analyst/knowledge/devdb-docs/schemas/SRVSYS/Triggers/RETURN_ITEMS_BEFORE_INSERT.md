---
tags:
  - trigger
  - SRVSYS
---
# RETURN_ITEMS_BEFORE_INSERT

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]
**Table**: [[schemas/SRVSYS/Tables/RETURN_ITEMS|RETURN_ITEMS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
begin
    insert into component_interdictions
	       (
	   UNIT_ID	,
	   COLL_DATE,
	   CHAPTER_ID,
	   PRODUCT_CODE,
	   INTER_CODE,
	   INSERT_DATS,
	   INTER_USER_ID,
	   PROGRAM_ID
	       )
    select :new.unit_id,
		   :new.coll_date,
		   :new.chapter_id,
		   :new.product_code,
		   vtr.inter_code,
		   sysdate,
		LT_USER_SESSION.GET_USERID,
	   :new.program_id
	 from  valid_test_results vtr,
		   valid_tests vt,
		   contract_tests ct
	 where ct.contract_id = 'INTERNAL'
	   and ct.stop_label_flag = 'Y'
	   and sysdate between ct.eff_date
						  and nvl(ct.term_date,sysdate)
       and ct.test_id = vt.test_id
       and :new.coll_date < vt.eff_date
	   and vtr.test_id = vt.test_id
	   and vtr.plate_seq = 'I'
	   and vtr.result_status = 'NT'
	   and vtr.inter_code is not null
	   and not exists
		   (select 'x'
			from component_interdictions ci
			where ci.unit_id = :new.unit_id
			  and ci.coll_date = :new.coll_date
			  and ci.chapter_id = :new.chapter_id
			  and ci.product_code = :new.product_code
			  and ci.inter_code = vtr.inter_code);
end;
```
