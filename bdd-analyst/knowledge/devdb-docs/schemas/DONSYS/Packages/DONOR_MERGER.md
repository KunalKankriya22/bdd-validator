---
tags:
  - package
  - DONSYS
---
# DONOR_MERGER

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DONOR_MERGER"
IS
   FUNCTION pre_merge_check(p_retained_donor_id VARCHAR2
                            , p_discarded_donor_id VARCHAR2
                            , p_check_type VARCHAR2 DEFAULT 'ALL'
                            , p_chapter_id VARCHAR2 DEFAULT 'WAD'
                            , p_set_id VARCHAR2 DEFAULT NULL
                           ) RETURN VARCHAR2;

   FUNCTION pre_unmerge_check(p_current_donor_id VARCHAR2
                              , p_previous_donor_id VARCHAR2
                              , p_check_type VARCHAR2 DEFAULT 'ALL'
                              , p_chapter_id VARCHAR2 DEFAULT 'WAD'
                              , p_set_id VARCHAR2 DEFAULT NULL
                             ) RETURN VARCHAR2;

   FUNCTION merge(p_retained_donor_id VARCHAR2
                  , p_discarded_donor_id VARCHAR2
                  , p_chapter_id VARCHAR2 DEFAULT 'WAD'
                  , p_set_id VARCHAR2 DEFAULT NULL
                 ) RETURN VARCHAR2;

   FUNCTION unmerge(p_current_donor_id VARCHAR2
                    , p_previous_donor_id VARCHAR2
                    , p_chapter_id VARCHAR2 DEFAULT 'WAD'
                    , p_set_id VARCHAR2 DEFAULT NULL
                   ) RETURN VARCHAR2;
END donor_merger;
```
