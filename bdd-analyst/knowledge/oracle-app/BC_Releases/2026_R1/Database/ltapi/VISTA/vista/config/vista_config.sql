
Spool /home/donsys/vista/config/log/Vista_Config.log

Create user ops$vista identified by vista default tablespace donor_data;

grant connect,dba to ops$vista;

@/home/donsys/vista/config/GRANTS_FROM_DONSYS.sql

connect ops$vista/vista
show user

@/home/donsys/vista/config/Vista_Sequences
@/home/donsys/vista/config/Vista_Tables
@/home/donsys/vista/config/VISTA_DONOR.vw
@/home/donsys/vista/config/donor_idp.pkg
Show errors
@/home/donsys/vista/config/lt_idp_feed.pkg
show errors

connect /
show user

@/home/donsys/vista/config/VISTA_ELIGIBLE.trg

