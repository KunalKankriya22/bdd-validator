---
module: Donor
sub_module: "Donor Reports & Labels"
title: "Interface Report"
mnemonic: dpulabrs
tags:
  - screen
  - donor
  - donor-reports-and-labels
---

# dpulabrs — Interface Report

**Module:** [[Donor]] > [[Donor Reports & Labels]]

## Database Tables

- [[INTERFACE_LOG]]
- [[INTERFACE_LOG_EXCP]]
- [[SELECT DISTINCT unit_id]]
- [[interface_id&amp;#10;FROM INTERFACE_LOG_EXCP&amp;#10;WHERE NVL(interface_flag]]
- [['N') = 'Y']]

## Dropdown/LOV Sources
Values in dropdowns on this screen come from:

- [[VALID_TESTS_DON]]
