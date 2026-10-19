---
tags:
  - package
  - SRVSYS
---
# PACKLIST

**Schema**: [[schemas/SRVSYS/SRVSYS|SRVSYS]]

## Dependencies

- STANDARD (PACKAGE in SYS)

## Package Specification

```plsql
PACKAGE PACKLIST IS


  PROCEDURE POPULATE_ORDER_SUMMARY (in_order_no in varchar2,
	                              pl_out  out VARCHAR2) ;

  PROCEDURE POPULATE_ORDER_DETAILS (in_order_no in varchar2,
	                             pl_out     out varchar2);

  PROCEDURE PRODUCTS_IN_SHIPMENT(in_ship_no in varchar2,
				 pl_out  out varchar2) ;

  PROCEDURE POPULATE_PACKLIST_TABLES (in_session_id IN  VARCHAR2,
                             in_ship_no    IN   VARCHAR2,
			     in_chapter IN   VARCHAR2,
                             pl_out        OUT  VARCHAR2);


  PROCEDURE PACKLIST_GENERATOR(in_session_id varchar2,
                               in_ship_no in varchar,
			       in_chapter in varchar2,
                               out_message out varchar2);

PROCEDURE POPULATE_SHIP_TOTALS (p_session_id in varchar2,
                                p_ship_no in varchar2,
                                pl_out out varchar2) ;

ThisFiCompanyNo  VARCHAR2(2);
ThisFiPriceSchNo VARCHAR2(2);
ThisOrderDate    VARCHAR2(20);
ThisArAccount    VARCHAR2(20);
RecPlasmaFlag    VARCHAR2(1);
g_ins_date       VARCHAR2(23);
--OrderSubTotal    NUMBER:=0;
p_msg            VARCHAR2(200);
g_shipment_no    VARCHAR2(20);
ShipmentDate     DATE;
status_flag      VARCHAR2(1);
g_invoice_flag   VARCHAR2(5);
g_session_id     VARCHAR2(50);
ThisCODFlag      VARCHAR2(1);
ShipmentTot      NUMBER:=0;
ShipTotBuf       VARCHAR2(20);
TotMfgProductVolume    NUMBER:=0.0;
TotMfgProductVolumeBuf  VARCHAR2(20);
bagcnt                 NUMBER:=0;
boxcnt                 NUMBER:=0;
MfgWeightBuf            VARCHAR2(25);
MfgWeight                NUMBER:=0.0;
MfgStdPriceBuf          VARCHAR2(20);
MfgStdPrice             NUMBER:=0.0;
Boxwt                  NUMBER:=0;
 Bagwt                  NUMBER:=0;
WeighMeasure          varchar2(25);

lv_chapter				VARCHAR2(4);
t_is_debug_msg_displayed 		BOOLEAN; -- Added by Kishore on 06/29/2015

END PACKLIST;
```
