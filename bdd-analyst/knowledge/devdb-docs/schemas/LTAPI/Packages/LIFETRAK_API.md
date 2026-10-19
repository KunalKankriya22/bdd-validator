---
tags:
  - package
  - LTAPI
---
# LIFETRAK_API

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE         "LIFETRAK_API" IS
  function  local_time_zone return date;
  procedure add_error_log(p_log_text in varchar2);
  Procedure API_LIFETRAK_CONV (p_os_appl_id in varchar2,
                               p_source_value in varchar2,
			       p_target_value out varchar2);
  procedure rollback_and_exit (pl_err_msg in varchar2);
  Procedure ORDER_PROCESSOR(pl_os_appl_name in varchar2,
			    pl_os_trans_id in varchar2,
			    pl_action in varchar2);

  p_ext_id               VARCHAR2(50);
  p_int_id               VARCHAR2(50);
  p_appl_name            VARCHAR2(20);
  p_err_msg              VARCHAR2(500);
  v_tb_id                VARCHAR2(64);
  v_chapter_id           VARCHAR2(5);
  x_lt_order_no          VARCHAR2(15);
  g_action_id            VARCHAR2(5);
  lt_order_status        varchar2(5);
END LIFETRAK_API;

```
