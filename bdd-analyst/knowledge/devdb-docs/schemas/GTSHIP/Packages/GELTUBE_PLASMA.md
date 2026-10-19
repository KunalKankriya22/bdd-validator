---
tags:
  - package
  - GTSHIP
---
# GELTUBE_PLASMA

**Schema**: [[schemas/GTSHIP/GTSHIP|GTSHIP]]

## Dependencies

- [[schemas/GTSHIP/Tables/GELTUBE_PLASMA_DETAILS|GELTUBE_PLASMA_DETAILS]] (TABLE)
- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
package geltube_plasma is

    -- Author     : ASHOKV
    -- Created    : 10/08/2021 3:06:18 PM
    -- Purpose    : This package provides routines
    /*
                  ins_upd_geltube_det  : to insert or update record into geltube_plasma_details table.
    */
    -- Versions   :
    --  01  -   10/08/2021  -   Initial version of GelTube Plasma Feature package.
    --  02  -   10/26/2021  -   Copied Edwin's gen_ebl_file routine from another pkg. Cleaned up as much as possible before merging.
    --  03  -   01/14/2022  - MLT 4789, 4798
    --  04      01/31/2022  -- to include the facility code in the EU check.
    --  05      08/04/2022  -- MLT 5336/5339

    /*
    to insert or update record into geltube_plasma_details table.
    */
    PROCEDURE ins_upd_geltube_det(rec_in IN GELTUBE_PLASMA_DETAILS%ROWTYPE);

    /*
    to remove product code from geltube_plasma_details table.
    */
    PROCEDURE del_geltube_det(rec_in IN GELTUBE_PLASMA_DETAILS%ROWTYPE);

    /*
    to get status of geltube unit id.
    */
    PROCEDURE geltube_status(unit_id_in IN VARCHAR2, action_in IN VARCHAR2, status_out OUT VARCHAR2, reason_out OUT VARCHAR2);

    /*
    used for query mode for geltube checkin function.
    */
    FUNCTION geltube_query_status(unit_id_in IN VARCHAR2) RETURN VARCHAR2;

    /*
    used to generate ebl file.
    */
    PROCEDURE gen_ebl_file (
        plasma_ship_no_in   IN VARCHAR2,
        status_out          OUT VARCHAR2
    );

    /*
    Used in geltube manager to check access to buttons.
    */
    FUNCTION user_has_access(
        user_in IN VARCHAR2,
        pgm_in  IN VARCHAR2) RETURN BOOLEAN;
end geltube_plasma;

```
