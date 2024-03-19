# GIS Fältkart Applikation

## Översikt
Denna GIS fältkartapplikation är en innovativ lösning utformad för att effektivisera och digitalisera processen för fältkartläggning. Applikationen består av en webbapplikation för onlineanvändning och en mobilapplikation för offlineanvändning, vilket gör den idealisk för en mängd olika användningsområden inom geografiska informationssystem (GIS).

## Webbapplikation

### Teknikstack
- **Frontend**: Applikationen använder `React JS` tillsammans med `React Leaflet` för att skapa en interaktiv och användarvänlig kartupplevelse.
- **Backend**: Backend bygger på `Django` med `GeoDjango`-tillägget, vilket tillhandahåller robusta verktyg för hantering av geospatiala data.
- **Databas**: `PostgreSQL` används som databas, med `PostGIS`-tillägget för spatial datahantering.

### Funktioner
- Dynamisk kartvisualisering med stöd för olika lager och markörer.
- Användarautentisering och administrationsgränssnitt för hantering av projekt och användardata.
- Import och export av geospatiala data i format som GeoJSON, GeoPackage, shapefiler och GML.
- Möjlighet att skapa egna GIS-projekt och samla fältdata direkt i applikationen.
- Generering av grundläggande rapporter baserade på insamlad projektdata.

## Mobilapplikation

### Teknikstack
- **Plattform**: Applikationen utvecklas med `React Native`, vilket möjliggör cross-platform kompatibilitet för både iOS och Android-enheter.

### Funktioner
- Grundläggande GIS fältkartläggningsfunktioner såsom att rita polygoner, linjer, anteckningar och fästa foton till kartobjekt.
- Möjlighet att importera och exportera projekt mellan webbapplikationen och mobilapplikationen.

## Allmänna Betraktelser
- Säker användarautentisering och auktorisering för att skydda tillgången till känslig information.
- Användning av Open Street Maps och samma Open Layers i både webb- och mobilapplikationer för att säkerställa konsistens.
- Hosting av databasen i molnet medan webbapplikationen hostas på en webbtjänst, båda hos samma leverantör för smidig integration och underhåll.

## Installation och Konfiguration
För att sätta upp projektet lokalt, följ dessa steg:

1. Klona repot från GitHub.
2. Installera nödvändiga beroenden med `pipenv` för Python/Django-delen och `npm` eller `yarn` för React-delen.
3. Konfigurera din lokala databas med PostGIS och skapa nödvändiga tabeller enligt modellspecifikationerna.
4. Starta Django-servern och React-utvecklingsservern enligt dokumentationen.

## Licens
Denna projekt är licensierad under MIT-licensen. Se [LICENSE](LICENSE) filen för mer information.
