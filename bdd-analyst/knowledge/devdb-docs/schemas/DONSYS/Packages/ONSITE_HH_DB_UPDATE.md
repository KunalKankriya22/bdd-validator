---
tags:
  - package
  - DONSYS
---
# ONSITE_HH_DB_UPDATE

**Schema**: [[schemas/DONSYS/DONSYS|DONSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE onsite_hh_db_update IS

/* ====== Version history===================================================

     Author  : Basker Edwin
     Created : 05/16/2019
     Purpose : The package would do the final DB transaction when the
               HH is completed from the .NET application. Original logic is
               taken from the regular onsite ONIHLTHS screen.

  ----------------------------------------------------------------------------
  Modified by        on             Version      Remarks
  ----------------------------------------------------------------------------
  Edwin           05/13/2019         01          MLT - 1237 (original creation)

  Ashok           06/28/2019         02          Added output parameter to FINISH_HEALTH_HISTORY routine.

  Ashok           08/05/2019         03          Commented out insert into donor_hhq_history table.

  Ashok           11/17/2020         04          Pending_health_history routine added.

  Ashok           08/17/2023         05          Removal of deferral ID commented out.
                                                 User has to unlink the deferral. (MLT-6151)

  Ashok           02/21/2024         06          MLT-6594

  Ashok           02/27/2024         07          MLT-6642

  Ashok           10/25/2024         08          MLT-7351   (Deferral_status routine updated)
=========================================================================== */

  /* Called from ONSITE HH Screen - CLOSE button
     Places interdictions on donor/unit based on the HH responses.
  */
    PROCEDURE pending_health_history (
        pl_donor_id         IN VARCHAR2,
        pl_transaction_id   IN VARCHAR2,
        pl_screener_id      IN VARCHAR2,
        pl_error_message    OUT VARCHAR2,
        pl_deferral_message OUT VARCHAR2,
        pl_deferral_reason  OUT VARCHAR2
    );

-- called from HH screen in .NET
  /*
    pl_error_message, - ERROR
    pl_deferral_message - 'OK' (good) OR deferral message (perm or temp deferral message)
*/
    PROCEDURE finish_health_history (
        pl_donor_id         IN VARCHAR2,
        pl_transaction_id   IN VARCHAR2,
        pl_screener_id      IN VARCHAR2,
        pl_error_message    OUT VARCHAR2,
        pl_deferral_message OUT VARCHAR2,
        pl_deferral_reason  OUT VARCHAR2
    );

    PROCEDURE update_status;

    /*
        Called from Oracle ATTACH screen to
        place hh related interdictions.
    */
    PROCEDURE place_hh_interdictions (
        pl_transaction_id   IN VARCHAR2,
        pl_status           OUT VARCHAR2
    );

    PROCEDURE deferral_status (
        deferral_flag     OUT VARCHAR2,
        pl_error_message  OUT VARCHAR2,
        pl_status_message OUT VARCHAR2
    );

    PROCEDURE get_def_string (
        plstring         OUT VARCHAR2,
        pl_error_message OUT VARCHAR2
    );

    FUNCTION is_timezone_enabled RETURN BOOLEAN;

    g_transaction_id    VARCHAR2(10);
    g_screener_id       VARCHAR2(10);
    err_code            VARCHAR2(240);
    g_donor_id          VARCHAR2(10);
    g_drive_date        DATE;
    g_drive_id          VARCHAR2(10);
    g_coll_date         DATE;
    g_donation_type     VARCHAR2(10);
    g_chapter_id        VARCHAR2(10);
END onsite_hh_db_update;
```
