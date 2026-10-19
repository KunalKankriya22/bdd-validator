---
tags:
  - package
  - SBCSYS
---
# CNFREXTR

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "CNFREXTR" is

  -- Author  : ASHOKV
  -- Created : 10/7/2018 12:06:03 PM
  -- Purpose : To extract confirmatory test series/test results for units that have been designated suitable for customer release.
  -- Version : 01 (initial version)
  --         : 02 (MLT 967 - after time scenario added for gen_series_report)
  --         : 03 (MLT 1031 - External transfer in time portion in coll.date issue)
  -- Public type declarations
  --type <TypeName> is <Datatype>;

  -- Public constant declarations
  --<ConstantName> constant <Datatype> := <Value>;

  -- Public variable declarations
  --<VariableName> <Datatype>;

  -- Public function and procedure declarations
  --function <FunctionName>(<Parameter> <Datatype>) return <Datatype>;

 procedure gen_extract_units(user_in IN VARCHAR2, chp_in IN VARCHAR2, prog_in IN VARCHAR2,
                              session_id_out OUT VARCHAR2, status_out OUT VARCHAR2);
 procedure commit_proc(session_id_in IN VARCHAR2, extract_id_out OUT VARCHAR2, status_out OUT VARCHAR2);

 procedure clean_up_tables(session_id_in IN VARCHAR2, status_out OUT VARCHAR2);

 procedure gen_series_report(extract_id_in IN VARCHAR2, user_in IN VARCHAR2, chp_in IN VARCHAR2, start_time_in IN DATE, status_out OUT VARCHAR2);

end CNFREXTR;

```
