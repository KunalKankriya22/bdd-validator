---
tags:
  - package
  - LTAPI
---
# LT_GENERAL_API

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- LIFETRAK_DONOR (PACKAGE in LTAPI)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "LT_GENERAL_API" IS

  procedure add_error_log(pl_data_src in varchar2,
                          pl_log_text in varchar2);

   procedure rollback_and_exit (pl_data_src in varchar2,
                               pl_err_msg in varchar2);

  -- Added "pl_chapter_id" parameter for time zone conversion
  -- Added by Kishore on 01/18/2012
  function IS_LT_NUMBER_REQ (pl_id_type in varchar2,
                             pl_chapter_id in varchar2) return char;

  procedure get_usps_id (p_city in varchar2,p_state in varchar2,
                         p_zip in varchar2,p_usps_id in varchar2,
                         x_usps_id out varchar2);

 PROCEDURE GENERAL_PROCESSOR(pl_os_appl_name in varchar2);

  p_ext_id               VARCHAR2(50);
  p_int_id               VARCHAR2(50);
  p_appl_name            VARCHAR2(20);
  p_err_msg              VARCHAR2(500);
  v_tb_id                VARCHAR2(64);
  v_chapter_id           VARCHAR2(5);
  x_lt_order_no          VARCHAR2(15);
  g_action_id            VARCHAR2(5);
  lt_order_status        varchar2(5);
  pl_source_id           varchar2(30);
  p_status               varchar2(200);
  szDonor                varchar2(10);
  nConvCount             NUMBER:=0;
  szExtApplID            VARCHAR2(20);
  g_chapter_id           VARCHAR2(4); -- Added by Kishore on 01/18/2012
  g_sysdate              DATE; -- Added by Kishore on 01/18/2012

  TYPE type_param_tbl is table of varchar2(100) index by binary_integer;
  ar  LIFETRAK_DONOR.type_param_tbl;

  procedure insert_api_conv(P_EXT_TEMP_ID      in varchar2,
                            P_LIFETRAK_PERM_ID in varchar2,
                            P_ID_TYPE          in varchar2,
                            p_TEMP_AUDIT_KEY   in number,
                            P_PERM_AUDIT_KEY   in number,
                            P_SOURCE_ID        in varchar2,
                            P_INSERT_DATE      in date,
                            p_stat             out varchar2);
END LT_GENERAL_API;

```
