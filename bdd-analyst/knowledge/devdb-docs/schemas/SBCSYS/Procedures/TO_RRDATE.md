---
tags:
  - procedure
  - SBCSYS
---
# TO_RRDATE

**Schema**: [[schemas/SBCSYS/SBCSYS|SBCSYS]]
**Type**: FUNCTION

## Dependencies

- STANDARD (PACKAGE in SYS)

## Source Code

```plsql
FUNCTION              "TO_RRDATE" (stng in varchar2, fmt in varchar2)
return date
is
begin
return to_date(stng,fmt);
end;

```
