---
tags:
  - trigger
  - SBCSYS
---
# COMPONENTS_BEFORE_UPDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENTS|COMPONENTS]]
**Type**: BEFORE EACH ROW
**Event**: UPDATE
**Status**: ENABLED

## Trigger Body

```plsql
declare
    comp_aud	      components_audit%rowtype;
begin
   -- SCR 152147 -- BCW change added.
   IF :new.component_status = 'S' AND :old.component_status = 'L' THEN
     LT_SPATTR_HANDLING.ADD_SPATR_INTER(:new.unit_id, :new.coll_date,
                              :new.chapter_id, :new.product_code);
   ELSIF :new.component_status = 'L' AND :old.component_status = 'S' THEN
     LT_SPATTR_HANDLING.DEL_SPATR_INTER(:new.unit_id, :new.coll_date,
                              :new.chapter_id, :new.product_code,'N');
   END IF;
   --------------

    comp_aud.audit_key := :old.audit_key;
    comp_aud.program_id := :new.program_id;
    if nvl(:old.product_code,'*') !=
       nvl(:new.product_code,'*')
    then
       comp_aud.product_code := nvl(:new.product_code,'*');
    end if;
    if nvl(:old.bag_id,'*') !=
       nvl(:new.bag_id,'*')
    then
       comp_aud.bag_id := nvl(:new.bag_id,'*');
    end if;
    if nvl(:old.expiry_date,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.expiry_date,to_date('01-JAN-33','DD-MON-YY'))
    then
       comp_aud.expiry_date := nvl(:new.expiry_date,
		 to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.reject_reason_code,'*') !=
       nvl(:new.reject_reason_code,'*')
    then
       comp_aud.reject_reason_code := nvl(:new.reject_reason_code,'*');
       if :new.reject_reason_code is not null
       then
	  if length(:old.unit_id) = 13 and
	     (nvl(:new.system_label_decision,'Md')) != 'Mb'
	  then
	     :new.system_label_decision := 'Md';
	  elsif length(:old.unit_id)!=13 and
	  nvl(:new.system_label_decision,'47') != '58' then
	     :new.system_label_decision := '47';
	  end if;
	  :new.label_dats := sysdate;
	  :new.label_user_id := lt_user_session.get_userid;
       end if;
    end if;
    if nvl(:old.system_label_decision,'*') !=
       nvl(:new.system_label_decision,'*')
    then
       comp_aud.system_label_decision := nvl(:new.system_label_decision,'*');
    end if;
    if nvl(:old.relabel_product_code,'*') !=
       nvl(:new.relabel_product_code,'*')
    then
       comp_aud.relabel_product_code := nvl(:new.relabel_product_code,'*');
    end if;
    if nvl(:old.pooled_component_id,'*') !=
       nvl(:new.pooled_component_id,'*')
    then
       comp_aud.pooled_component_id := nvl(:new.pooled_component_id,'*');
    end if;
    if nvl(:old.void_reason_code,'*') !=
       nvl(:new.void_reason_code,'*')
    then
       comp_aud.void_reason_code := nvl(:new.void_reason_code,'*');
    end if;
    if nvl(:old.component_status,'*') !=
       nvl(:new.component_status,'*')
    then
       comp_aud.component_status := nvl(:new.component_status,'*');
    end if;
    if nvl(:old.out_of_system_dats,'01-JAN-33') !=
       nvl(:new.out_of_system_dats,'01-JAN-33')
    then
       comp_aud.out_of_system_dats := nvl(:new.out_of_system_dats,'01-JAN-33');
    end if;
    if nvl(:old.component_weight,-1) !=
       nvl(:new.component_weight,-1)
    then
       comp_aud.component_weight := nvl(:new.component_weight,-1);
    end if;
    if nvl(:old.component_count,-1) !=
       nvl(:new.component_count,-1)
    then
       comp_aud.component_count := nvl(:new.component_count,-1);
    end if;
    if nvl(:old.note_id,-1) !=
       nvl(:new.note_id,-1)
    then
       comp_aud.note_id := nvl(:new.note_id,-1);
    end if;
    if nvl(:old.label_user_id,'*') !=
       nvl(:new.label_user_id,'*')
    then
       comp_aud.label_user_id := nvl(:new.label_user_id,'*');
    end if;
    if nvl(:old.label_dats,to_date('01-JAN-33','DD-MON-YY')) !=
       nvl(:new.label_dats,to_date('01-JAN-33','DD-MON-YY'))
    then
       comp_aud.label_dats := nvl(:new.label_dats,
		to_date('01-JAN-33','DD-MON-YY'));
    end if;
    if nvl(:old.bags_used,0) !=
       nvl(:new.bags_used,0)
    then
       comp_aud.bags_used := nvl(:new.bags_used,0);
    end if;
    if nvl(:old.warehouse_id,'*') !=
       nvl(:new.warehouse_id,'*')
    then
       comp_aud.warehouse_id := nvl(:new.warehouse_id, '*');
    end if;
	if nvl(:old.imp_license_flag,'*') !=
	   nvl(:new.imp_license_flag,'*')
	then
	   comp_aud.imp_license_flag := nvl(:new.imp_license_flag, '*');
	end if;
    --
    insert into components_audit
    (
	unit_id, coll_date, chapter_id,
	component_prefix, product_code, bag_id,
	expiry_date, system_label_decision,
	reject_reason_code, insert_dats,
	relabel_product_code, pooled_component_id,
	void_reason_code,component_status,
	out_of_system_dats, component_weight, component_count,
	note_id, label_user_id, label_dats,bags_used,
	audit_key,program_id,warehouse_id,imp_license_flag,
	audit_insert_dats, audit_insert_user
    )
    values
    (
	comp_aud.unit_id, comp_aud.coll_date, comp_aud.chapter_id,
	comp_aud.component_prefix, comp_aud.product_code, comp_aud.bag_id,
	comp_aud.expiry_date, comp_aud.system_label_decision,
	comp_aud.reject_reason_code, comp_aud.insert_dats,
	comp_aud.relabel_product_code, comp_aud.pooled_component_id,
	comp_aud.void_reason_code,comp_aud.component_status,
	comp_aud.out_of_system_dats, comp_aud.component_weight,
	comp_aud.component_count,
	comp_aud.note_id, comp_aud.label_user_id, comp_aud.label_dats,
	comp_aud.bags_used,
	comp_aud.audit_key,comp_aud.program_id,comp_aud.warehouse_id,comp_aud.imp_license_flag,
	sysdate, lt_user_session.get_userid
    );
end;
```
