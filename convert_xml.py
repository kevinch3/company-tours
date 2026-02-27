#!/usr/bin/env python3
"""
Convert company-tour XML files to JSON for static site.
Run from the nievemar-update directory, with source XML in ../2017/www/nievemar/.
"""
import json
import re
from urllib.parse import unquote
from xml.etree import ElementTree as ET

SRC = "/home/kevinch3/Documentos/Dev/web/2017/www/nievemar"
DST = "/home/kevinch3/Documentos/Dev/web/www/nievemar-update/data"

LANGS = ["espanol", "english", "francais", "portuguese", "italiano", "deutsch"]

# ---------------------------------------------------------------------------
# Helper: read XML file (handles ISO-8859-1 by re-encoding)
# ---------------------------------------------------------------------------
def read_xml_iso(path):
    with open(path, "rb") as f:
        raw = f.read()
    # Replace declared encoding so Python's XML parser uses utf-8 internally
    raw = raw.replace(b'encoding="ISO-8859-1"', b'encoding="UTF-8"')
    # Decode assuming the file is actually Latin-1
    text = raw.decode("latin-1")
    # Re-encode as UTF-8 bytes for the parser
    return text.encode("utf-8")

def read_xml_utf8(path):
    with open(path, "rb") as f:
        return f.read()

def clean(s):
    """Strip whitespace and url-decode percent-encoded sequences."""
    if s is None:
        return ""
    s = s.strip()
    try:
        s = unquote(s)
    except Exception:
        pass
    return s

def elem_text(el):
    """Get all text including tail, CDATA content from element."""
    if el is None:
        return ""
    parts = []
    if el.text:
        parts.append(el.text)
    for child in el:
        parts.append(ET.tostring(child, encoding="unicode"))
    return "".join(parts).strip()

# ---------------------------------------------------------------------------
# 1. Convert inicio.xml + menu.xml → inicio.json
# ---------------------------------------------------------------------------
def convert_inicio():
    inicio_bytes = read_xml_iso(f"{SRC}/inicio.xml")
    menu_bytes = read_xml_iso(f"{SRC}/menu.xml")

    inicio_root = ET.fromstring(inicio_bytes)
    menu_root = ET.fromstring(menu_bytes)

    # Index menu by lang name
    menu_by_lang = {}
    for idioma in menu_root.findall("idioma"):
        name = idioma.get("name")
        menu_by_lang[name] = {
            "home":      clean(idioma.findtext("home")),
            "nosotros":  clean(idioma.findtext("nosotros")),
            "servicios": clean(idioma.findtext("servicios")),
            "contacto":  clean(idioma.findtext("contacto")),
        }

    result = {}
    for idioma in inicio_root.findall("idioma"):
        name = idioma.get("name")
        if name not in LANGS:
            continue

        cuadroder_el = idioma.find("cuadroder")
        cuadroder_text = cuadroder_el.text if cuadroder_el is not None and cuadroder_el.text else ""

        terminos_el = idioma.find("terminos")
        terminos_text = terminos_el.text if terminos_el is not None and terminos_el.text else ""

        form_el = idioma.find("form")
        form = {
            "nombre":  clean(form_el.findtext("nombre")) if form_el is not None else "Nombre",
            "email":   clean(form_el.findtext("email"))  if form_el is not None else "Email",
            "mensaje": clean(form_el.findtext("mensaje")) if form_el is not None else "Mensaje",
        }

        compra = clean(idioma.findtext("compra"))

        result[name] = {
            "nav":       menu_by_lang.get(name, {}),
            "cuadroder": cuadroder_text.strip(),
            "terminos":  terminos_text.strip(),
            "form":      form,
            "compra":    compra,
        }

    with open(f"{DST}/inicio.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print("✓ inicio.json written")

# ---------------------------------------------------------------------------
# 2. Convert pageUTF8.xml → content.json
# ---------------------------------------------------------------------------
def convert_content():
    page_bytes = read_xml_utf8(f"{SRC}/pageUTF8.xml")
    root = ET.fromstring(page_bytes)

    # srv_excursiones content is hardcoded in index.php (not in XML)
    SRV_EXCURSIONES_HTML = """<div id="showhide">
<h1><i class="fa fa-arrows-alt"></i> Tabla Excursiones</h1>
<div>
<p>
<table width="100%" border="0">
  <tr>
    <td width="33%" valign="top" class="cpo"><p>EXCURSION </p></td>
    <td width="23%" valign="top" class="cpo"><p>DESDE: </p></td>
    <td width="16%" valign="top" class="cpo"><p>SALE </p></td>
    <td width="28%" valign="top" class="cpo"><p>REGRESA</p></td>
  </tr>
  <tr>
    <td width="33%" valign="top" class="cpo"><p>A Península Valdés</p></td>
    <td width="23%" valign="top" class="cpo"><p>Trelew </p></td>
    <td width="16%" valign="top" class="cpo"><p>7:15 hs.</p></td>
    <td width="28%" valign="top" class="cpo"><p>20:00 hs.</p></td>
  </tr>
  <tr>
    <td width="33%" valign="top" class="cpo"><p>&nbsp;</p></td>
    <td width="23%" valign="top" class="cpo"><p>Puerto Madryn</p></td>
    <td width="16%" valign="top" class="cpo"><p>8:30 hs.</p></td>
    <td width="28%" valign="top" class="cpo"><p>19:00 hs.</p></td>
  </tr>
  <tr><td colspan="4" class="cpo"><hr/></td></tr>
  <tr>
    <td width="33%" valign="top" class="cpo"><p>A Punta Tombo</p></td>
    <td width="23%" valign="top" class="cpo"><p>Puerto Madryn </p></td>
    <td width="16%" valign="top" class="cpo"><p>8:00 hs.</p></td>
    <td width="28%" valign="top" class="cpo"><p>18:30 hs.</p></td>
  </tr>
  <tr>
    <td class="cpo"><p>&nbsp;</p></td>
    <td class="cpo"><p>Puerto Madryn </p></td>
    <td class="cpo"><p>8:00 hs.</p></td>
    <td class="cpo"><p>15:30 hs. Apto. Trelew</p></td>
  </tr>
  <tr>
    <td class="cpo"><p>&nbsp;</p></td>
    <td class="cpo"><p>Trelew</p></td>
    <td class="cpo"><p>9:15 hs. </p></td>
    <td class="cpo"><p>15:30 hs.</p></td>
  </tr>
  <tr><td colspan="4" class="cpo"><hr/></td></tr>
  <tr>
    <td class="cpo"><p>A Colonia Galesa</p></td>
    <td class="cpo"><p>Trelew</p></td>
    <td class="cpo"><p>14:30 hs.</p></td>
    <td class="cpo"><p>19:00 hs.</p></td>
  </tr>
  <tr>
    <td class="cpo"><p>&nbsp;</p></td>
    <td class="cpo"><p>Puerto Madryn</p></td>
    <td class="cpo"><p>13:30 hs.</p></td>
    <td class="cpo"><p>20:00 hs.</p></td>
  </tr>
  <tr><td colspan="4" class="cpo"><hr/></td></tr>
  <tr>
    <td class="cpo"><p>Bosque Petrificado con Dique Ameghino</p></td>
    <td class="cpo"><p>Puerto Madryn</p></td>
    <td class="cpo"><p>8:00 hs.</p></td>
    <td class="cpo"><p>17:30 hs.</p></td>
  </tr>
  <tr>
    <td class="cpo"><p>&nbsp;</p></td>
    <td class="cpo"><p>Trelew</p></td>
    <td class="cpo"><p>9:00 hs.</p></td>
    <td class="cpo"><p>16:30 hs.</p></td>
  </tr>
  <tr><td colspan="4" class="cpo"><hr/></td></tr>
  <tr>
    <td class="cpo"><p>A Península Valdés con Pernocte</p></td>
    <td class="cpo"><p>Trelew</p></td>
    <td class="cpo"><p>7:15 hs.</p></td>
    <td class="cpo"><p>20:00 hs. (día Sig.)</p></td>
  </tr>
  <tr>
    <td class="cpo"><p>&nbsp;</p></td>
    <td class="cpo"><p>Puerto Madryn</p></td>
    <td class="cpo"><p>8:30 hs.</p></td>
    <td class="cpo"><p>19:00 hs. (día Sig.)</p></td>
  </tr>
  <tr><td colspan="4" class="cpo"><hr/></td></tr>
  <tr>
    <td class="cpo"><p>A Navegación Tonina Overa (Delfin)</p></td>
    <td class="cpo"><p>Trelew</p></td>
    <td class="cpo"><p>Consultar Mareas</p></td>
    <td class="cpo"><p>&nbsp;</p></td>
  </tr>
  <tr>
    <td class="cpo"><p>&nbsp;</p></td>
    <td class="cpo"><p>Puerto Madryn</p></td>
    <td class="cpo"><p>Consultar Mareas</p></td>
    <td class="cpo"><p>&nbsp;</p></td>
  </tr>
  <tr><td colspan="4" class="cpo"><hr/></td></tr>
  <tr>
    <td class="cpo"><p>A Punta Ninfas</p></td>
    <td class="cpo"><p>Puerto Madryn</p></td>
    <td class="cpo"><p>8:30hs</p></td>
    <td class="cpo"><p>17:00hs</p></td>
  </tr>
  <tr>
    <td colspan="4" valign="top"><p><em>Navegación de avistaje de Ballenas Franca , desde Puerto Pirámides, sale cuando arriba la excursión.</em></p></td>
  </tr>
</table>
</p>
</div>
</div>"""

    result = {}
    for idioma in root.findall("idioma"):
        lang = idioma.get("name")
        if lang not in LANGS:
            continue

        sections = {}

        for item in idioma.findall("item"):
            item_name = item.get("name")

            # Extract titulares
            titulares_list = []
            titulares_el = item.find("titulares")
            if titulares_el is not None:
                for tit in titulares_el.findall("tit"):
                    label = tit.text.strip() if tit.text else ""
                    data_val = tit.findtext("data", "").strip()
                    icon_val = tit.findtext("icon", "").strip()
                    titulares_list.append({
                        "label": label,
                        "data": data_val,
                        "icon": icon_val,
                    })

            if item_name == "srv":
                # srv has a main texto + paquetes
                srv_section = {}
                if titulares_list:
                    srv_section["titulares"] = titulares_list

                for texto in item.findall("texto"):
                    data_attr = texto.get("data")
                    content = texto.text or ""
                    # Also grab any sub-elements that aren't paquetes
                    # (the CDATA intro text is in texto.text for srv)
                    if data_attr == "srv":
                        # intro text before paquetes
                        srv_section["intro"] = content.strip()
                        # packages
                        paquetes = []
                        for paq in texto.findall("paquete"):
                            paq_data = paq.get("data", "")
                            titulo = clean(paq.findtext("titulo"))
                            texto_el = paq.find("texto")
                            paq_html = texto_el.text.strip() if texto_el is not None and texto_el.text else ""
                            paquetes.append({
                                "id": paq_data,
                                "titulo": titulo,
                                "html": paq_html,
                            })
                        srv_section["paquetes"] = paquetes
                        sections["srv"] = srv_section
                    else:
                        # srv_excursiones, srv_avistaje, etc.
                        sec = {"html": content.strip()}
                        if data_attr == "srv_excursiones":
                            # Use the hardcoded table from index.php
                            sec["html"] = SRV_EXCURSIONES_HTML
                        sections[data_attr] = sec
            else:
                # nos, idx, cnt sections
                if titulares_list and item_name not in sections:
                    # Store titulares on the first texto section of this item
                    pass

                for texto in item.findall("texto"):
                    data_attr = texto.get("data")
                    content = texto.text or ""
                    sec = {"html": content.strip()}
                    if titulares_list and data_attr == item_name:
                        sec["titulares"] = titulares_list
                    sections[data_attr] = sec

        result[lang] = {"sections": sections}

    with open(f"{DST}/content.json", "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"✓ content.json written")

# ---------------------------------------------------------------------------
# 3. Convert hotelesUTF8.xml → hoteles.json
# ---------------------------------------------------------------------------

# OpenStreetMap bbox embeds for cities with broken mapsengine URLs
OSM_MAPS = {
    "Trelew": "https://www.openstreetmap.org/export/embed.html?bbox=-65.3400%2C-43.2700%2C-65.2700%2C-43.2200&layer=mapnik&marker=-43.2490%2C-65.3053",
    "Puerto Madryn": "https://www.openstreetmap.org/export/embed.html?bbox=-65.0500%2C-42.7900%2C-65.0000%2C-42.7500&layer=mapnik&marker=-42.7692%2C-65.0338",
}

def convert_hoteles():
    hotels_bytes = read_xml_utf8(f"{SRC}/hotelesUTF8.xml")
    root = ET.fromstring(hotels_bytes)

    ciudades = []
    for ciudad in root.findall("ciudad"):
        name = ciudad.get("name")
        mapa_el = ciudad.find("mapa")
        # Use OSM replacement if original mapsengine URL, else keep original
        if mapa_el is not None and mapa_el.text:
            mapa_url = mapa_el.text.strip()
            if "mapsengine.google.com" in mapa_url:
                mapa_url = OSM_MAPS.get(name, None)
        else:
            mapa_url = OSM_MAPS.get(name, None)

        hotels = []
        for hotel in ciudad.findall("hotel"):
            nombre = clean(hotel.findtext("nombre"))
            imagen = clean(hotel.findtext("imagen"))
            estrellas_text = clean(hotel.findtext("estrellas"))
            estrellas = int(estrellas_text) if estrellas_text.isdigit() else 0
            web = clean(hotel.findtext("web"))
            hotels.append({
                "nombre": nombre,
                "imagen": imagen,
                "estrellas": estrellas,
                "web": web,
            })

        ciudades.append({
            "name": name,
            "mapa": mapa_url,
            "hoteles": hotels,
        })

    with open(f"{DST}/hoteles.json", "w", encoding="utf-8") as f:
        json.dump({"ciudades": ciudades}, f, ensure_ascii=False, indent=2)
    print("✓ hoteles.json written")

# ---------------------------------------------------------------------------
# Run all conversions
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    convert_inicio()
    convert_content()
    convert_hoteles()
    print("All done!")
