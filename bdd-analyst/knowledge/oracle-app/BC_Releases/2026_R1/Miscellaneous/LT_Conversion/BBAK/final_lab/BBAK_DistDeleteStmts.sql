-- Version: 01 Modified Date: 03/20/2013

truncate table SHIPPED_PRODUCTS;

delete from pick_slip_product_antgns;

delete from PICK_SLIP_PRODUCTS;

truncate table PRODUCT_HISTORY;

truncate table SHIPMENTS;

truncate table BOXES;

truncate table PICK_SLIPS;

truncate table DISCARD_PRODUCTS;

truncate table ACTIVE_PRODUCTS;

commit;