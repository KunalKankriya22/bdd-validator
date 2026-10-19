# JSON output pattern used by ALL 5 scripts:
#   json.dump(result, sys.stdout, indent=2)
#   print()   # trailing newline
#
# All scripts write JSON to sys.stdout via json.dump() followed by a bare
# print() to emit a final newline. Errors/diagnostics go to sys.stderr.

import importlib.util
import json
from pathlib import Path


SCRIPTS_DIR = Path(__file__).resolve().parent.parent


def load_script_module(script_filename: str):
    """Import a hyphenated script file as a Python module."""
    script_path = SCRIPTS_DIR / script_filename
    module_name = script_filename.replace("-", "_").replace(".py", "")
    spec = importlib.util.spec_from_file_location(module_name, script_path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def write_vault_index(project_root: Path, entities: dict):
    """Write a vault.index.json with the given entities dict."""
    index_path = project_root / "knowledge" / ".sage-index" / "vault.index.json"
    index_path.parent.mkdir(parents=True, exist_ok=True)
    data = {"entities": entities}
    index_path.write_text(json.dumps(data, indent=2))
    return index_path


def write_table_md(project_root: Path, schema: str, table_name: str, content: str):
    """Write a table markdown file under devdb-docs/schemas/<schema>/Tables/."""
    table_dir = project_root / "knowledge" / "devdb-docs" / "schemas" / schema / "Tables"
    table_dir.mkdir(parents=True, exist_ok=True)
    table_file = table_dir / f"{table_name}.md"
    table_file.write_text(content)
    return table_file


def make_minimal_fmb_xml(
    form_name: str = "TEST_FORM",
    form_title: str = "Test Form",
    blocks: list[dict] | None = None,
    triggers: list[dict] | None = None,
    program_units: list[dict] | None = None,
    record_groups: list[dict] | None = None,
) -> str:
    """Build a minimal FMB XML string for testing."""
    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append(f'<FormModule Name="{form_name}" Title="{form_title}">')

    for block in (blocks or []):
        attrs = " ".join(f'{k}="{v}"' for k, v in block.items() if k != "_items")
        items_count = block.get("_items", 0)
        if items_count:
            lines.append(f"  <Block {attrs}>")
            for i in range(items_count):
                lines.append(f'    <Item Name="ITEM_{i}" />')
            lines.append("  </Block>")
        else:
            lines.append(f"  <Block {attrs} />")

    for trigger in (triggers or []):
        attrs = " ".join(f'{k}="{v}"' for k, v in trigger.items())
        lines.append(f"  <Trigger {attrs} />")

    for pu in (program_units or []):
        attrs = " ".join(f'{k}="{v}"' for k, v in pu.items())
        lines.append(f"  <ProgramUnit {attrs} />")

    for rg in (record_groups or []):
        attrs = " ".join(f'{k}="{v}"' for k, v in rg.items())
        lines.append(f"  <RecordGroup {attrs} />")

    lines.append("</FormModule>")
    return "\n".join(lines)
