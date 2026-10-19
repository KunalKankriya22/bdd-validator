---
tags:
  - package
  - SRVSYS
---
# BILLING_INTERFACE

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE          "BILLING_INTERFACE" IS
   procedure insert_invoice_details
      (FiCompanyNo IN varchar2,
       OrderNo     IN varchar2,
       ArAccount   IN varchar2,
       ItemId      IN varchar2,
       ShipDate    IN date,
       StdPrice    IN number,
       InsertDate  IN date,
       UsrText1    IN varchar2,
       UsrText2    IN varchar2,
       LineItemDesc IN varchar2,
       FiPriceSchNo IN varchar2,
       LineItemDesc2 IN varchar2,
       OrderQty    IN number,
       ShipQty     IN number,
       TranType    IN varchar2,
       RetAdvice   IN varchar2,
       Flag        OUT varchar2);

   procedure insert_attribute_details
      (Type         IN varchar2,
       FiCompanyNo  IN varchar2,
       OrderNo      IN varchar2,
       ArAccount    IN varchar2,
       ShipDate     IN date,
       UnitID       IN varchar2,
       ProductCode  IN varchar2,
       Aliquot      IN varchar2,
       BloodType    IN varchar2,
       FiPriceSchNo IN varchar2,
       InsertDate   IN date,
       OrderQty    IN number,
       ShipQty     IN number,
       TranType    IN varchar2,
       RetAdvice   IN varchar2,
       Flag         OUT varchar2);

   procedure insert_header
      (FiCompanyNo   IN  varchar2,
       OrderNo       IN  varchar2,
       ArAccount     IN  varchar2,
       ShipmentNo    IN  varchar2,
       ShipDate      IN  date,
       OrderDate     IN  date,
       InsertDate    IN  date,
       Flag          OUT varchar2);
END billing_interface;

```
