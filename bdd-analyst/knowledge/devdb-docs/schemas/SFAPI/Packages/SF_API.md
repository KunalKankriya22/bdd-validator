---
tags:
  - package
  - SFAPI
---
# SF_API

**Schema**: [[schemas/SFAPI/SFAPI|SFAPI]]

## Dependencies

- [[schemas/SFAPI/Tables/SF_DONOR_CONTROLLER|SF_DONOR_CONTROLLER]] (TABLE)

## Package Specification

```plsql
package sf_api is

  -- Author     : ASHOKV
  -- Created    : 9/1/2020 3:46:18 PM
  -- Purpose    : This package provides routines
    /*
                  donor_data_processor  : to process donor information and insert into api tables
                  lab_data_processor    : to process lab information and insert into api tables
                  archive_data          : to archive records that are ready by external system.
    */
  -- Versions   :
  -- 01 -   09/01/2020  -   Initial version of SalesForce Interface package.
  -- 02 -   09/15/2020  -   New routine to process result added. Fixed various bugs from sprint 102
  -- 03  -  05/26/2021 - MLT 4280

  -- Public function and procedure declarations
  PROCEDURE donor_data_processor;
  PROCEDURE lab_data_processor;
  PROCEDURE archive_data;
  PROCEDURE archive_controller;
  PROCEDURE insert_donor_controller(rec_in IN SF_DONOR_CONTROLLER%ROWTYPE);
end sf_api;

```
