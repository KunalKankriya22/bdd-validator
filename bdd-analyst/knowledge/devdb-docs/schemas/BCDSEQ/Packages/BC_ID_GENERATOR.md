---
tags:
  - package
  - BCDSEQ
---
# BC_ID_GENERATOR

**Schema**: [[schemas/BCDSEQ/BCDSEQ|BCDSEQ]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE        BC_ID_GENERATOR AS
    /*
    Package to generate the next ID from a donor sequence
    based on the provided ID type.

    Sequence naming convention: {ID_TYPE}_DON_SEQ
    Example: ID type 'DN' -> sequence DN_DON_SEQ
             ID type 'SPON' -> sequence SPON_DON_SEQ
    */

    FUNCTION get_next_id(p_id_type IN VARCHAR2) RETURN NUMBER;

END BC_ID_GENERATOR;
```
