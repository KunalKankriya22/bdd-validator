---
tags:
  - package
  - LTAPI
---
# LT_NEO_FILE_PARSING_ENGINE

**Schema**: [[schemas/LTAPI/LTAPI|LTAPI]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- UTL_FILE (SYNONYM in PUBLIC)

## Package Specification

```plsql
PACKAGE         "LT_NEO_FILE_PARSING_ENGINE" as
  procedure insert_error_log(p_file_name in varchar2,
                             p_err_msg in varchar2);

  procedure add_log_entry(p_log_text in varchar2);

  procedure NEO_PARSER(p_machine_id in varchar2,
                       p_chapter_id in varchar2,
                       p_file_id in varchar2);

  t_log_file           utl_file.file_type;
END LT_NEO_FILE_PARSING_ENGINE;

```
