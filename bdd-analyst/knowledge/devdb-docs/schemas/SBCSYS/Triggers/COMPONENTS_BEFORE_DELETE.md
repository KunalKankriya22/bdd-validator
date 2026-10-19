---
tags:
  - trigger
  - SBCSYS
---
# COMPONENTS_BEFORE_DELETE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Table**: [[schemas/SBCSYS/Tables/COMPONENTS|COMPONENTS]]
**Type**: BEFORE EACH ROW
**Event**: DELETE
**Status**: ENABLED

## Trigger Body

```plsql
BEGIN
  -- Changed value for "program_id" from "DELETE" to "DELETE COMPONENT". Changed by Kishore on 01/29/2013. IM 9228
  INSERT
  INTO components_audit
    (
      unit_id,
      coll_date,
      chapter_id,
      component_prefix,
      product_code,
      bag_id,
      expiry_date,
      system_label_decision,
      reject_reason_code,
      insert_dats,
      relabel_product_code,
      pooled_component_id,
      void_reason_code,
      component_status,
      out_of_system_dats,
      component_weight,
      component_count,
      note_id,
      label_user_id,
      label_dats,
      bags_used,
      warehouse_id,
      imp_license_flag,
      PRE_LABEL_SLD,
      PRE_LABEL_USER_ID,
      PRE_LABEL_DATS,
      audit_key,
      program_id,
      audit_insert_dats,
      audit_insert_user
    )
    VALUES
    (
      :old.unit_id,
      :old.coll_date,
      :old.chapter_id,
      :old.component_prefix,
      :old.product_code,
      :old.bag_id,
      :old.expiry_date,
      :old.system_label_decision,
      :old.reject_reason_code,
      :old.insert_dats,
      :old.relabel_product_code,
      :old.pooled_component_id,
      :old.void_reason_code,
      :old.component_status,
      :old.out_of_system_dats,
      :old.component_weight,
      :old.component_count,
      :old.note_id,
      :old.label_user_id,
      :old.label_dats,
      :old.bags_used,
      :old.warehouse_id,
      :old.imp_license_flag,
      :old.PRE_LABEL_SLD,
      :old.PRE_LABEL_USER_ID,
      :old.PRE_LABEL_DATS,
      :old.audit_key,
      'DELETE COMPONENT',
      sysdate,
      lt_user_session.get_userid
    );
END;
```
