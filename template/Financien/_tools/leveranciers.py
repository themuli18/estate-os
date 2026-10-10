"""Regels: ruwe tegenpartij -> (Leverancier, Categorie). Eerste treffer wint.

Regex op de tegenpartijnaam in HOOFDLETTERS (plus omschrijving als die erbij moet).
Vul aan na elke build: alles in categorie "Overig" met een hoog bedrag of een incassant-ID verdient een regel.
"""
import re

INTERN = "Intern: eigen rekeningen"
CATEGORIEEN = ["Inkomen: AOW & pensioen", "Inkomen: overig", INTERN, "Wonen: hypotheek/huur", "Energie & water",
               "Gemeente & waterschap", "Verzekeringen", "Zorg", "Telecom & internet", "Abonnementen & media",
               "Boodschappen", "Vervoer", "Belastingen & toeslagen", "Goede doelen & verenigingen",
               "Geldautomaat", "Bankkosten", "Overig"]

# (regex, weergavenaam, categorie)
REGELS = [
    (r"\bSVB\b|SOCIALE VERZEKERINGSBANK", "SVB", "Inkomen: AOW & pensioen"),
    (r"PENSIOEN|\bABP\b|\bPFZW\b|\bPMT\b|\bPME\b", None, "Inkomen: AOW & pensioen"),
    (r"BELASTINGDIENST", "Belastingdienst", "Belastingen & toeslagen"),
    (r"GEMEENTE|WATERSCHAP|HEEMRADSCHAP|BSGR|GBLT", None, "Gemeente & waterschap"),
    (r"VATTENFALL|ENECO|ESSENT|GREENCHOICE|BUDGET ENERGIE|ENERGIEDIRECT|VANDEBRON|WATERBEDRIJF|VITENS|EVIDES|BRABANT WATER|DUNEA|PWN|WATERNET", None, "Energie & water"),
    (r"\bKPN\b|ZIGGO|ODIDO|T-MOBILE|VODAFONE|\bDELTA\b|SIMYO|BEN NEDERLAND|LEBARA", None, "Telecom & internet"),
    (r"ZILVEREN KRUIS|\bCZ\b|\bVGZ\b|MENZIS|\bONVZ\b|DSW|ZORGVERZEKER|APOTHEEK|HUISARTS", None, "Zorg"),
    (r"VERZEKER|CENTRAAL BEHEER|\bFBTO\b|\bOHRA\b|INTERPOLIS|NATIONALE-NEDERLANDEN|\bASR\b|AEGON|UNIVE|DELA|MONUTA|YARDEN", None, "Verzekeringen"),
    (r"HYPOTHE|WONINGCORPORATIE|WOONSTICHTING|HUUR", None, "Wonen: hypotheek/huur"),
    (r"ALBERT HEIJN|\bAH\b|JUMBO|LIDL|ALDI|PLUS\b|DIRK|DEKAMARKT|COOP|SPAR\b", None, "Boodschappen"),
    (r"NS GROEP|\bNS\b|SHELL|\bBP\b|ESSO|TOTAL|TANGO|TINQ|RDW|ANWB", None, "Vervoer"),
    (r"NETFLIX|SPOTIFY|VIDEOLAND|DISNEY|NPO|TELEGRAAF|VOLKSKRANT|NRC|DPG MEDIA|MEDIAHUIS", None, "Abonnementen & media"),
    (r"GELDAUTOMAAT|\bGEA\b|GELDMAAT", "Geldautomaat", "Geldautomaat"),
    (r"KOSTEN.*(BETAALREKENING|PAKKET)|BETAALPAKKET|RENTE.*REKENING", "Bankkosten", "Bankkosten"),
]
_GECOMPILEERD = [(re.compile(p), n, c) for p, n, c in REGELS]


def indelen(naam: str, omschrijving: str = "") -> tuple[str, str]:
    n = (naam or "").upper()
    for rx, weergave, cat in _GECOMPILEERD:
        if rx.search(n) or (not n and rx.search((omschrijving or "").upper())):
            return (weergave or naam.strip(), cat)
    return (naam.strip() or "(onbekend)", "Overig")
