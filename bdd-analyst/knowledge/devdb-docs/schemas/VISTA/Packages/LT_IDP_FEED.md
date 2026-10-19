---
tags:
  - package
  - VISTA
---
# LT_IDP_FEED

**Schema**: [[schemas/VISTA/VISTA|VISTA]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE lt_idp_feed IS
--------------------------------------------------------------------------
-- Package to build the extracts needed for converting LifeTrak data
-- into the format used to populate HCLL through DPU, version 2.0
--------------------------------------------------------------------------
   PROCEDURE LOG_ERROR(p_trans_id in varchar2,
                       p_msg_type in varchar2,
					   p_status in varchar2,
                       p_err_txt in varchar2);

   FUNCTION build_vista_donors(p_txn_id VARCHAR2
                               , p_chapter_id VARCHAR2 DEFAULT 'WAD'
                               , p_file VARCHAR2 DEFAULT NULL
                               , p_delim VARCHAR2 DEFAULT 'PIPE'
                               , p_char_mark VARCHAR2 DEFAULT 'NONE')
            RETURN VARCHAR2;

   PROCEDURE process_vista_donors(p_delim VARCHAR2 DEFAULT 'PIPE'
                               , p_char_mark VARCHAR2 DEFAULT 'NONE');

   PROCEDURE load_vista_donation(p_file VARCHAR2 DEFAULT NULL
                               , p_delim VARCHAR2 DEFAULT 'PIPE'
                               , p_char_mark VARCHAR2 DEFAULT 'NONE'
							   ,pTrans out VARCHAR2
							   ,pUnitID out VARCHAR2);

   PROCEDURE process_vista_donation(p_txn_id VARCHAR2
                                    ,p_unit_id VARCHAR2
                                   , pl_chapter_id VARCHAR2 DEFAULT 'WAD');

   PROCEDURE populate_idp_target_change(P_TARGET_ID     VARCHAR2,
                                           P_TARGET_TABLE  VARCHAR2,
                                           P_TARGET_FIELD  VARCHAR2,
                                           P_TARGET_VALUE  VARCHAR2,
                                           P_TARGET_CHANGE_DATE DATE);



END lt_idp_feed;
```
