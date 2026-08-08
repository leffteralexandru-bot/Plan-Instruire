#!/usr/bin/env python3
"""
Rescrie linkurile din Ghid proiectare (by-type + master) spre panou:
  ?ref=guide&ghid=proiectare&tip={tip}&doc={id}
Apoi: nu e nevoie de Desktop PDF.
"""

from __future__ import annotations

from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
BY_TYPE = ROOT / "public/docs/operational-guide/design-guide/by-type"
MASTER = ROOT / "public/docs/operational-guide/design-guide/Ghid-proiectare-cad.pdf"
APP_PANOU = "https://argranit-instruire-adaptare.vercel.app/ingineri/panou-angajat"

FILENAME_TO_DOC_ID = {
    "anexa-1-sablon.pdf": "anexa1",
    "Carnet-masuratori-creion.pdf": "carnet",
    "proliner-manual.pdf": "proliner",
    "bosch-gll-3-80-manual.pdf": "gll",
    "bosch-ruleta-5m.pdf": "ruleta",
    "Checklist_Client_ArtGranit.pdf": "checklist",
    "Canting.pdf": "canting",
    "Exemple_Fise_Tehnice_Accesorii.pdf": "fise",
    "Exemplu_Comanda_Material.pdf": "ctg",
}


def rewrite_doc(doc: fitz.Document, tip: str) -> int:
    changed = 0
    for page in doc:
        for link in list(page.get_links()):
            if link.get("kind") != fitz.LINK_URI:
                continue
            uri = link.get("uri") or ""
            new_uri = None
            if "linked-manuals/" in uri:
                name = uri.rsplit("/", 1)[-1].split("?")[0]
                if name.startswith("Checklist_Client_ArtGranit"):
                    doc_id = "checklist"
                else:
                    doc_id = FILENAME_TO_DOC_ID.get(name)
                if doc_id:
                    new_uri = (
                        f"{APP_PANOU}?ref=guide&ghid=proiectare&tip={tip}&doc={doc_id}"
                    )
            elif "/ingineri/panou-angajat" in uri and "doc=" not in uri:
                new_uri = f"{APP_PANOU}?ref=guide&ghid=proiectare&tip={tip}"
            if new_uri and new_uri != uri:
                page.delete_link(link)
                link["uri"] = new_uri
                page.insert_link(link)
                changed += 1
    return changed


def patch_pdf(path: Path, tip: str) -> None:
    doc = fitz.open(path)
    n = rewrite_doc(doc, tip)
    tmp = path.with_suffix(".link-patched.pdf")
    doc.save(tmp, garbage=3, deflate=True)
    doc.close()
    tmp.replace(path)
    print(f"  {path.relative_to(ROOT)} — {n} linkuri → panou (tip={tip})")


def main() -> None:
    if not BY_TYPE.exists():
        raise SystemExit(f"Lipsește: {BY_TYPE}")
    for tip_dir in sorted(BY_TYPE.iterdir()):
        if not tip_dir.is_dir():
            continue
        pdf = tip_dir / "Ghid-proiectare-cad.pdf"
        if pdf.exists():
            patch_pdf(pdf, tip_dir.name)
    if MASTER.exists():
        # master fără tip — folosim blat ca default pentru vanity
        patch_pdf(MASTER, "blat")
    print("Done.")


if __name__ == "__main__":
    main()
