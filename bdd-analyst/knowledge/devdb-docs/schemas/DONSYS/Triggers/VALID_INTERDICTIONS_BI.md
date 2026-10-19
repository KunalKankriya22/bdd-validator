---
tags:
  - trigger
  - DONSYS
---
# VALID_INTERDICTIONS_BI

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]
**Table**: [[schemas/DONSYS/Tables/VALID_INTERDICTIONS|VALID_INTERDICTIONS]]
**Type**: BEFORE EACH ROW
**Event**: INSERT
**Status**: ENABLED

## Trigger Body

```plsql
DECLARE
	temp_audit_key	  number(23);
begin
    select decode(substr(lt_user_session.get_userid,1,3),'OPS',substr(lt_user_session.get_userid,5),lt_user_session.get_userid)
    into :new.insert_user from dual ;
    :new.insert_date := sysdate ;
    select audit_seq.nextval into temp_audit_key from dual;
    :new.audit_key := temp_audit_key;
    :new.program_id := nvl(:new.program_id,'MANUAL');
    insert into VALID_INTERDICTIONS_audit
	(
		audit_key,
		audit_insert_dats,
		program_id,
		user_id,
		inter_code,
		inter_type,
		allow_multiple,
		inter_desc,
		view_level,
		deferral_flag,
		fixed_period,
		period_type,
		period_number,
		minimum_period,
		inter_owner,
		donor_inter_code,
		upm_flag,
		term_reason_req,
		lab_inter_code,
		lab_hold_flag,
		eff_date,
		term_date
	)
	values
	(
		:new.audit_key,
		sysdate,
		:new.program_id,
		:new.insert_user,
		:new.inter_code,
		:new.inter_type,
		:new.allow_multiple,
		:new.inter_desc,
		:new.view_level,
		:new.deferral_flag,
		:new.fixed_period,
		:new.period_type,
		:new.period_number,
		:new.minimum_period,
		:new.inter_owner,
		:new.donor_inter_code,
		:new.upm_flag,
		:new.term_reason_req,
		:new.lab_inter_code,
		:new.lab_hold_flag,
		:new.eff_date,
		:new.term_date
	);
end;
```
