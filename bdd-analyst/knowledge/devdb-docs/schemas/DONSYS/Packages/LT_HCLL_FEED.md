---
tags:
  - package
  - DONSYS
---
# LT_HCLL_FEED

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "LT_HCLL_FEED" IS
--------------------------------------------------------------------------
-- Package to build the extracts needed for converting LifeTrak data
-- into the format used to populate HCLL through DPU, version 2.0
--------------------------------------------------------------------------
   FUNCTION build_locations(p_file VARCHAR2, p_delim VARCHAR2 DEFAULT 'COMMA'
                            , p_char_mark VARCHAR2 DEFAULT 'DOUBLE')
            RETURN VARCHAR2;
   FUNCTION build_drives(p_file VARCHAR2, p_delim VARCHAR2 DEFAULT 'COMMA'
                         , p_char_mark VARCHAR2 DEFAULT 'DOUBLE')
            RETURN VARCHAR2;
   FUNCTION build_drive_bags_procs(p_file VARCHAR2, p_delim VARCHAR2 DEFAULT 'COMMA'
                              , p_char_mark VARCHAR2 DEFAULT 'DOUBLE')
            RETURN VARCHAR2;
   FUNCTION build_donors(p_file VARCHAR2, p_delim VARCHAR2 DEFAULT 'COMMA'
                          , p_char_mark VARCHAR2 DEFAULT 'DOUBLE')
            RETURN VARCHAR2;

   FUNCTION build_donor_comments(p_file VARCHAR2, p_delim VARCHAR2 DEFAULT 'COMMA'
                                 , p_char_mark VARCHAR2 DEFAULT 'DOUBLE')
            RETURN VARCHAR2;

   FUNCTION build_xxx(p_file VARCHAR2, p_delim VARCHAR2 DEFAULT 'COMMA'
                          , p_char_mark VARCHAR2 DEFAULT 'DOUBLE')
            RETURN VARCHAR2;
/*
   FUNCTION build_all(p_file VARCHAR2, p_delim VARCHAR2 DEFAULT 'COMMA'
                      , p_char_mark VARCHAR2 DEFAULT 'DOUBLE')
            RETURN VARCHAR2;
*/
END lt_hcll_feed;

```
