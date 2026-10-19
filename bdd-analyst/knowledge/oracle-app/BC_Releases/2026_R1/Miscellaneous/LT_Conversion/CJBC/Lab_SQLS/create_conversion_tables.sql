--------------------------------------------------------------------------
----  This script will create all temporary tables of ACTIVE module   ----
----  of conversion data into which data would be moved.              ----
--------------------------------------------------------------------------

drop table convert_units cascade constraints;
create table convert_units
(
unit_id                                 varchar2(15)    not null,
coll_date                               date            not null,
lot_no                                  varchar2(30)            ,
bag_type                                varchar2(4)             ,
draw_category_code                      varchar2(5)             ,
blood_type                              varchar2(5)     ,
discard_flag                            varchar2(1)             ,
donor_procedure_type                    varchar2(4)             ,
drive_id                                varchar2(10)            ,
import_flag                             varchar2(1)             ,
insert_date                             date                    ,
unit_status                             varchar2(1)             ,
self_deferral_flag                      varchar2(1)             ,
donor_id                                varchar2(10)            ,
chapter_id                              varchar2(4)             ,
draw_stn                                varchar2(5)
);

drop public synonym convert_units;
create public synonym convert_units for convert_units;
grant all on convert_units to public;
--------------------------------------------------------------------------------
drop table convert_products cascade constraints;
create table convert_products
(
unit_id                                  varchar2(15)   not null,
coll_date                                date           not null,
product_code                             varchar2(8)    not null,
expiry_date                              date           ,
ship_ticket_no                           varchar2(14),
shipped_to                               varchar2(10),
ship_date                                date,
discard_flag                             varchar2(1)    not null,
mfg_flag                                 varchar2(1),
tested_blood_type                        varchar2(4)            ,
convert_flag                             varchar2(1)            ,
relabel_product_code                     varchar2(8)            ,
pooled_component_id                      varchar2(8)            ,
component_volume                         number(7,2)            ,
label_user_id                            varchar2(6)            ,
label_dates                              date                   ,
component_mask                           varchar2(2)    not null,
import_flag                              varchar2(1)            ,
imported_from                            varchar2(50)           ,
patient_id                               varchar2(10)           ,
transfused_date                          date                   ,
insert_date                              date                   ,
first_sep_date                           date                   ,
chapter_id                               varchar2(4)    not null,
reject_code                              varchar2(5),
user_id                                  varchar2(10)
);

drop public synonym convert_products;
create public synonym convert_products for convert_products;
grant all on convert_products to public;
--------------------------------------------------------------------------------
drop table convert_product_attributes cascade constraints;
create table convert_product_attributes
(
unit_id                                 varchar2(15)    not null,
coll_date                               date            not null,
chapter_id                              varchar2(4)     not null,
product_code                            varchar2(8)     not null,
attrib_group                            varchar2(5)     not null,
attrib_code                             varchar2(5)     not null,
attrib_date                             date            not null
);
drop public synonym convert_product_attributes;
create public synonym convert_product_attributes for convert_product_attributes;
grant all on convert_product_attributes to public;
--------------------------------------------------------------------------------
drop table convert_product_comments cascade constraints;
create table convert_product_comments
(
unit_id                                 varchar2(15)    not null,
coll_date                               date            not null,
chapter_id                              varchar2(4)     not null,
product_code                            varchar2(8)     not null,
comments                                varchar2(80)    not null
);

drop public synonym convert_product_comments;
create public synonym convert_product_comments for convert_product_comments;
grant all on convert_product_comments to public;
--------------------------------------------------------------------------------
drop table convert_product_charges cascade constraints;
create table convert_product_charges
(
unit_id                                  varchar2(15)   not null,
coll_date                                date           not null,
chapter_id                               varchar2(4)    not null,
product_code                             varchar2(8)    not null,
billing_code                             varchar2(12)   not null
);

drop public synonym convert_product_charges;
create public synonym convert_product_charges for convert_product_charges;
grant all on convert_product_charges to public;
--------------------------------------------------------------------------------

drop table convert_product_interdictions cascade constraints;
create table convert_product_interdictions
(
unit_id                                  varchar2(15)   not null,
coll_date                                date           not null,
chapter_id                               varchar2(4)    not null,
product_code                             varchar2(8)    not null,
inter_code                              varchar2(4)    ,
insert_date                              date,
insert_user                              varchar2(6)
);

drop public synonym convert_product_interdictions;
create public synonym convert_product_interdictions for convert_product_interdictions;
grant all on convert_product_interdictions to public;
--------------------------------------------------------------------------------
drop table convert_unit_attributes cascade constraints;
create table convert_unit_attributes
(
unit_id                                 varchar2(15)    not null,
coll_date                               date            not null,
chapter_id                              varchar2(4)     not null,
attrib_group                            varchar2(5)     not null,
attrib_code                             varchar2(5)     not null,
attrib_date                             date            not null
);

drop public synonym convert_unit_attributes;
create public synonym convert_unit_attributes for convert_unit_attributes;
grant all on convert_unit_attributes to public;

--------------------------------------------------------------------------------
drop table convert_unit_interdictions cascade constraints;
create table convert_unit_interdictions
(
unit_id                                  varchar2(15)   not null,
coll_date                                date           not null,
chapter_id                               varchar2(4)    not null,
reject_code                              varchar2(4)    not null,
reject_date                              date,
reject_by                                varchar2(6)
);

drop public synonym convert_unit_interdictions;
create public synonym convert_unit_interdictions for convert_unit_interdictions;
grant all on convert_unit_interdictions to public;
--------------------------------------------------------------------------------
drop table convert_unit_comments cascade constraints;
create table convert_unit_comments
(
unit_id                                  varchar2(15)   not null,
coll_date                                date           not null,
chapter_id                               varchar2(4)    not null,
comments                                 varchar2(80)
);

drop public synonym convert_unit_comments;
create public synonym convert_unit_comments for convert_unit_comments;
grant all on convert_unit_comments to public;

--------------------------------------------------------------------------------
drop table convert_unit_tests cascade constraints;
create table convert_unit_tests
(
unit_id                                  varchar2(15)   not null,
coll_date                                date           not null,
chapter_id                               varchar2(4)    not null,
test_id                                  varchar2(10),
test_seq_no                              number,
result_code                              varchar2(4),
absorbance                               varchar2(12),
result_date                              date,
result_user                              varchar2(10),
insert_date                              varchar2(8)
);

drop public synonym convert_unit_tests;
create public synonym convert_unit_tests for convert_unit_tests;
grant all on convert_unit_tests to public;

------- End of Active Module's temporary tables creation script --------
