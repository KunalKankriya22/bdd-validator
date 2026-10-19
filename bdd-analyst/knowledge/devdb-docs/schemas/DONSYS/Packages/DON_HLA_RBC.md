---
tags:
  - package
  - DONSYS
---
# DON_HLA_RBC

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE DON_HLA_RBC IS
/* --------------------------------------------------------------------------
   PROGRAM VERSION    : 03
   PROGRAM AUTHOR     : CHANDRA
   LAST REVISION DATE : 07-03-2006
                      : 04 (08/10/11) for adding the PLRF type in the search
                      : 05 - Changed by Kishore on 09/05/2014.
                           - Changed code to populate the CMV status correctly in
                             the HLA_RBC_MATCH_UNITS table.
                      : 06 - Changed by Kishore on 09/16/2014. IM 10207.
                      : 07   MLT- 6721

 This package consists of three procedures
   1. HLA_MATCH         : This procedure is used to match hla antigens
                          with that of recepient. Depending upon the
                          request id (hla_rbc_request) abo match is
                          done. The output of all matching donors with
                          grade are stored in hla_rbc_match_lists table.
   2. RBC_MATCH         : This procedure is used to match rbc antigens
                          with that of recepient. Depending upon the
                          request abo match as well as antibodies match
                          is performed. The output of matching donors
                          is stored in hla_rbc_match_lists.
   3. RBC_GROUP_MATCH   : This procedure is used to match rbc group anti
                          gens match. This is an exact match search. That
                          is if group contains 5 diff antigens the donors
                          which are selected will have atleast those antigens
                          apart from others tests. The group request is also
                          stored as a dummy patient with rbc antigens. The
                          output is stored in hla_rbc_match_lists.
   In all the three procedures data is not committed. The status value
   returned should be of size 250 characters. Check for 'OK' for successful
   in the calling program else status contains the error message.

   4. HLARBC_PROC_CALLER: This procedure will be called from cron job or
                          dbms_job. This in turn will call one of the above
                          procedures depending upon the request id. This will
                          also populate hla_rbc_match_units if requested.
                          This procedure will commit the data after each request
                          is processed.
---------------------------------------------------------------------------- */

PROCEDURE HLA_MATCH
                (p_request_id           IN      varchar2,
                 p_grade_level          IN      number,
                 p_total                OUT     number,
                 p_status               OUT     varchar2
                );

PROCEDURE RBC_MATCH
                (p_request_id           IN      varchar2,
                 p_total                OUT     number,
                 p_status               OUT     varchar2
                );

PROCEDURE RBC_GROUP_MATCH
                (p_request_id           IN      varchar2,
                 p_total                OUT     number,
                 p_status               OUT     varchar2
                );
PROCEDURE POPULATE_UNITS_TABLE
                (p_request_id           IN    varchar2,
                 request_type           IN    varchar2,
                 p_status              OUT    varchar2
                 );
PROCEDURE HLARBC_PROC_CALLER;

END DON_HLA_RBC ;
```
