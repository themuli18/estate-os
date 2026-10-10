"""Regeln: rohe Gegenpartei -> (Anbieter, Kategorie). Die erste Übereinstimmung gewinnt.

Regex auf den Namen der Gegenpartei in GROSSBUCHSTABEN (ersatzweise auf den Verwendungszweck).
Nach jedem Bau ergänzen: alles in „Sonstiges" mit Gläubiger-ID oder hohem Betrag verdient eine Regel.
"""
import re

INTERN = "Intern: eigene Konten & Kreditkarten-Ausgleich"
KATEGORIEN = ["Einkommen: Rente & Pension", "Einkommen: Erstattungen & Sonstiges", INTERN, "Wohnen: Miete/Kredit",
              "Energie & Wasser", "Steuern, Gebühren & Abgaben", "Versicherungen", "Gesundheit & Apotheke",
              "Telekommunikation & Rundfunk", "Abos, Medien & Digitales", "Lebensmittel & Supermarkt",
              "Drogerie & Haushalt", "Auto, Tanken & Parken", "Online-Shopping", "Kirche, Spenden & Vereine",
              "Bargeld", "Bank- & Kartengebühren", "Sonstiges"]

# (Regex, Anzeigename oder None = Originalname, Kategorie)
REGELN = [
    (r"RENTEN ?SERVICE|DEUTSCHE RENTENVERSICHERUNG|VERSORGUNGSWERK|PENSION", None, "Einkommen: Rente & Pension"),
    (r"KRANKENKASSE|PFLEGEKASSE|\bAOK\b|\bIKK\b|\bBKK\b", None, "Gesundheit & Apotheke"),
    (r"APOTHEKE|ARZT|PRAXIS|KLINIK|LABOR", None, "Gesundheit & Apotheke"),
    (r"FINANZAMT|BUNDESKASSE|HAUPTZOLLAMT|STADTKASSE|GEMEINDEKASSE|KREISKASSE|LANDKREIS|ABFALL|ZWECKVERBAND|SCHORNSTEINFEGER", None, "Steuern, Gebühren & Abgaben"),
    (r"BEITRAGSSERVICE|RUNDFUNK", "Rundfunkbeitrag (ARD ZDF Deutschlandradio)", "Telekommunikation & Rundfunk"),
    (r"TELEKOM|TELEFON|MOBILFUNK|BREITBAND|KABEL|INTERNET", None, "Telekommunikation & Rundfunk"),
    (r"STADTWERKE|ENERGIE|STROM|\bGAS\b|WASSER", None, "Energie & Wasser"),
    (r"VERSICHERUNG|VERS\.|ASSEKURANZ|LEBENSVERS|KRANKENVERS", None, "Versicherungen"),
    (r"BAUSPARKASSE|HYPOTHEK|DARLEHEN|MIETE|WOHNUNGSBAU|HAUSVERWALTUNG", None, "Wohnen: Miete/Kredit"),
    (r"EDEKA|REWE|ALDI|LIDL|NETTO|PENNY|KAUFLAND|GLOBUS|MARKTKAUF", None, "Lebensmittel & Supermarkt"),
    (r"DROGERIE|\bDM\b|ROSSMANN", None, "Drogerie & Haushalt"),
    (r"TANKSTELLE|\bARAL\b|\bSHELL\b|\bESSO\b|\bJET\b|PARKHAUS|PARKSCHEIN|KFZ", None, "Auto, Tanken & Parken"),
    (r"AMAZON|EBAY|ZALANDO", None, "Online-Shopping"),
    (r"NETFLIX|SPOTIFY|DISNEY|ZEITUNG|VERLAG|\bABO\b", None, "Abos, Medien & Digitales"),
    (r"KIRCHE|KIRCHGELD|FRIEDHOF|SPENDE|E\.V\.|\bEV\b|VEREIN", None, "Kirche, Spenden & Vereine"),
    (r"GELDAUTOMAT|BARGELD|AUSZAHLUNG", "Bargeld", "Bargeld"),
    (r"KONTOFÜHRUNG|KONTOFUEHRUNG|RECHNUNGSABSCHLUSS|ENTGELT|AUSLANDSEINSATZ|JAHRESPREIS", "Bank- & Kartengebühren", "Bank- & Kartengebühren"),
    (r"KREDITKARTENABRECHNUNG|AUSGLEICH DER RECHNUNG|LASTSCHRIFTEINZUG", "Kreditkarten-Ausgleich", INTERN),
]
_REGELN = [(re.compile(p), n, k) for p, n, k in REGELN]


def einordnen(name: str, zweck: str = "") -> tuple[str, str]:
    n = (name or "").upper()
    for rx, anzeige, kat in _REGELN:
        if rx.search(n) or (not n and rx.search((zweck or "").upper())):
            return (anzeige or name.strip(), kat)
    return (name.strip() or "(unbekannt)", "Sonstiges")
