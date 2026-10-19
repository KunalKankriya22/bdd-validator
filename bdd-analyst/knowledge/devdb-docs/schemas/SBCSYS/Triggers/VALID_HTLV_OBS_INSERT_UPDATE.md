---
tags:
  - trigger
  - SBCSYS
---
# VALID_HTLV_OBS_INSERT_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/VALID_HTLV_WB_OBS|VALID_HTLV_WB_OBS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT OR UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
	temp_audit_key	  number(23);
begin
    if inserting
    then
		select AUDIT_SEQ_LAB.nextval into temp_audit_key from dual;
		:new.audit_key := temp_audit_key;
    end if;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    :new.last_modified_date := sysdate;
    --
    insert into valid_htlv_wb_obs_audit
	(
		result_code, p21, p19,
		p24, p26, p28, p32, p38,
		p42, gp46, p53, p_other,
		eff_date, term_date,
		last_modified_date, audit_key,
		program_id, audit_insert_dats, audit_insert_user
	)
	values
	(
		:new.result_code, :new.p21, :new.p19,
		:new.p24, :new.p26, :new.p28, :new.p32, :new.p38,
		:new.p42, :new.gp46, :new.p53, :new.p_other,
		:new.eff_date, :new.term_date,
		:new.last_modified_date,:new.audit_key,
		:new.program_id, sysdate, lt_user_session.get_userid
	);
end;
```
