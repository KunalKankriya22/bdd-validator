---
tags:
  - package
  - DONSYS
---
# DON_NURSING_AUDIT

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)
- [[schemas/DONSYS/Tables/VALID_HH_ANSWERS|VALID_HH_ANSWERS]] (TABLE)
- [[schemas/DONSYS/Tables/VALID_HH_QUESTIONS|VALID_HH_QUESTIONS]] (TABLE)
- [[schemas/DONSYS/Tables/VALID_PHYSICAL_RULES|VALID_PHYSICAL_RULES]] (TABLE)

## Package Specification

```plsql
package DON_NURSING_AUDIT is

  -- Author  : ASHOKV
  -- Created : 1/14/2019 1:55:39 PM
  -- Purpose : This package shall allow automatic nursing audit process based on the criteria configured by facility.
  -- Version
  -- 01: 01/14/2019 - initial creation of pkg. called from DRIMAUDT (PAUDIT)
  -- 02: 03/12/2019 -- start_process routine modified, do_commit routine modified. nursing_audit_query routine commented out
  -- 03: 07/14/2019 -- to not to place teh HDT and HDI as part of MLT-1605
  -- 04: 09/20/2019 -- commented out some unwnted codes
  -- 05: 11/18/2019 -- MLT 2787
  -- 06: 04/04/2020  -- MLT- 3135
 --  07: 10/05/2020 -- MLT - 3593
 --  08: 10/07/2020 -- MLT- 3593 (bug)
 --  09: 01/06/2021 -- MLT- 3970
 --  10: 10/20/2021 -- MLT-4643 (search for V10) Modified historical hh changed query to only look at questions that have manual_audit_flag set.
 --  11: 10/24/2021 -- MLT-4643 (use manual_audit_hist_flag instead of manual_audit_flag) --V11
 --  12: 04/07/2025    (allow auditing only the completion status records )
 --  13: 05/20/2025    MLT 7800
 --  14. 10/28/2025    MLT 8590

  -- Public type declarations
  --type <TypeName> is <Datatype>;

  -- Public constant declarations
  --<ConstantName> constant <Datatype> := <Value>;



  -- public procedure to fill the nursing_audit_manual table with data set
  -- based on the search criteria entered in control block.
  -- data set is computed based on the nursing audit criteria.

  /*
  -- Not required - merged query into start_process routine (V02)
  procedure nursing_audit_query( p_session_id  in varchar2,
                                 p_id_type     in varchar2,
                                 p_from_date   in date,
                                 p_to_date     in date,
                                 p_status      out varchar2
                                );
  */
  procedure start_process( p_session_id  in varchar2,
                           p_id_type     in varchar2,
                           p_from_date   in date,
                           p_to_date     in date,
                           p_user_id     in varchar2,
                           p_chapter_id  in varchar2,
                           p_program_id  in varchar2,
                           p_status      out varchar2
                          );

  procedure do_commit(p_status OUT VARCHAR2);

   TYPE vha_rt IS RECORD(
      ques_code  valid_hh_answers.question_code%TYPE,
      ans_code   valid_hh_answers.answer_code%TYPE);

  TYPE vhq_aat IS TABLE OF valid_hh_questions.question_code%TYPE INDEX BY PLS_INTEGER;
  TYPE vha_aat IS TABLE OF vha_rt INDEX BY PLS_INTEGER;
  TYPE vpr_aat IS TABLE OF valid_physical_rules.physical_code%TYPE INDEX BY PLS_INTEGER;

end DON_NURSING_AUDIT;

```
