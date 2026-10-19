---
tags:
  - package
  - DONSYS
---
# DON_REF_VAL

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- [[schemas/DONSYS/Tables/DONATIONS|DONATIONS]] (TABLE)
- [[schemas/DONSYS/Tables/DONORS|DONORS]] (TABLE)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE              "DON_REF_VAL" IS
--------------------------------------------------------------------------
-- Package to supply the meaningful values from reference tables
-- used by Donor for Donors and Donations for interfacing with other
-- systems
--------------------------------------------------------------------------
   FUNCTION donor_abo(p_donor_id donors.donor_id%type
                      , p_chapter_id donors.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donor_abo, WNDS, WNPS);

   FUNCTION donor_rh(p_donor_id donors.donor_id%type
                     , p_chapter_id donors.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donor_rh, WNDS, WNPS);

   FUNCTION donor_aborh(p_donor_id donors.donor_id%type
                        , p_chapter_id donors.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donor_aborh, WNDS, WNPS);

   FUNCTION donor_ethn_descr(p_donor_id donors.donor_id%type
                             , p_chapter_id donors.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donor_ethn_descr, WNDS, WNPS);

   FUNCTION donor_antibody_screen(p_donor_id donors.donor_id%type
                             , p_chapter_id donors.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donor_ethn_descr, WNDS, WNPS);

   FUNCTION donor_antibody_screen_date(p_donor_id donors.donor_id%type
                             , p_chapter_id donors.chapter_id%type DEFAULT 'WAD')
     RETURN DATE;
     PRAGMA RESTRICT_REFERENCES (donor_ethn_descr, WNDS, WNPS);

   FUNCTION donor_proc_count
            (p_donor_id donors.donor_id%type
             , p_chapter_id donors.chapter_id%type
             , p_proc VARCHAR2
             , p_proc_type VARCHAR2 DEFAULT 'CODE' -- CODE or CODE TYPE
             , p_start_date DATE , p_end_date IN DATE)
     RETURN NUMBER;
     PRAGMA RESTRICT_REFERENCES (donor_proc_count, WNDS, WNPS);

   FUNCTION donation_abo(p_txn_id donations.transaction_id%type
                         , p_chapter_id donations.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donation_abo, WNDS, WNPS);

   FUNCTION donation_rh(p_txn_id donations.transaction_id%type
                        , p_chapter_id donations.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donation_rh, WNDS, WNPS);

   FUNCTION donation_aborh(p_txn_id donations.transaction_id%type
                           , p_chapter_id donations.chapter_id%type DEFAULT 'WAD')
     RETURN VARCHAR2;
     PRAGMA RESTRICT_REFERENCES (donation_aborh, WNDS, WNPS);

END;

```
