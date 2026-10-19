---
tags:
  - package
  - VISTA
---
# DONOR_IDP

**Schema**: [[schemas/VISTA/VISTA|VISTA]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE donor_idp IS

   -- Ver: 01   --- Original after migrating to 2018
   -- Ver: 02   -- MLT 3797

   FUNCTION latest_test_result (p_trans_id VARCHAR2,p_donor_id VARCHAR2, p_test VARCHAR2
                                , p_chapter_id VARCHAR2 DEFAULT 'WAD')
     RETURN VARCHAR2;
   --------------------------------------------------------------------------
   --  Returns the latest test results for a given Donor.
   --  p_test values: PLT, HCT, CMV, HLA
   --------------------------------------------------------------------------
   FUNCTION physical_findings (p_txn_id VARCHAR2, p_code VARCHAR2
                               , p_chap VARCHAR2 DEFAULT 'WAD')
     RETURN VARCHAR2;
   --------------------------------------------------------------------------
   --  Returns the physical finding for the given transaction and physical
   --  code.
   --------------------------------------------------------------------------

   FUNCTION donor_elig_prod (p_trans_id VARCHAR2,
                              p_donor_id VARCHAR2
                             , p_product VARCHAR2
                             , p_donation_type VARCHAR2 DEFAULT 'AL'
                             , p_coll_date DATE DEFAULT null)
     RETURN VARCHAR2;
   --------------------------------------------------------------------------
   -- Returns number of units of the product group that the donor is eligible
   -- to donate.  Checks all procedure codes for a given product, based on
   -- the content maintained in idp_conv_ref_values
   --------------------------------------------------------------------------
   Procedure update_vis_eligibility(p_mode in VARCHAR2,
                                    p_transaction_id in VARCHAR2);

   --------------------------------
   --Insert or update the VIS_ELIGIBILITYT Table


END donor_idp;
```
