---
tags:
  - package
  - DONSYS
---
# ONSITE_SURVEY

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE ONSITE_SURVEY IS

/* ---------------- Version History---------------------


Modified By         Ver          Date            Comments
=============================================================

B. Edwin             01          10/05/19  Original version created
                                  package to link the survey template
                                  based on the donor survey criteria

                      02         chapterID logic was added.
                      03         05/14/21         MLT-4286 (eff dates check added)
                                 -- Made unit ID optional
                                 -- Added a wrapper routine survey_link_status
                                    which will be called from Onsite App
                      04        MLT-4286 (term date on template is until
                                midnight of that day) - survey_cat cursor modified.
---------------------------------------------------- ------------ */
    PROCEDURE LINK_SURVEY_TEMPLATE
                             (
                               pl_session_id       in varchar2,
                               pl_chapter_id       in varchar2,
                               pl_drive_date       in date,
                               pl_donor_id         in varchar2,
                               pl_unit_id          in varchar2,
                               pl_user_id          in varchar2,
                               pl_link_status      out varchar2
                              );

    /*
    --1) This routine sets status out parameter to Y if any questions are available
    --   for the criteria.
    --2) Default out status is N.
    */
    PROCEDURE SURVEY_LINK_STATUS
                             (
                               pl_transaction_id   in varchar2,
                               pl_link_status      out varchar2
                              );

    t_status          varchar2(50);
    local_date        date;
END ONSITE_SURVEY;
```
