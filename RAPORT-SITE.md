# Raport analiză dauron-trust.com – de reparat la următorul release

Data analizei: 2026-10-12. Metodă: verificare cu `curl` a celor 6 pagini principale și a unui articol
(`/articole/valabilitate-autorizatie-construire-2026/`), plus `robots.txt`, `sitemap.xml` și headerele HTTP.
Nu s-a testat formularul de contact și nu s-a rulat suita Playwright.

## Rezumat

Site-ul e rapid și corect din punct de vedere SEO. Rămân de reparat: headerele de securitate, redirectul `www`,
anul din footer și câteva neconcordanțe minore.

| # | Prioritate | Problemă | Efort |
|---|---|---|---|
| 1 | Mare | Lipsesc headerele de securitate (HSTS, CSP, X-Frame-Options, Referrer-Policy) | mic |
| 2 | Medie | `www.dauron-trust.com` răspunde 200, fără redirect | mic |
| 3 | Medie | Footer „© 2025” | foarte mic |
| 4 | Mică | Lipsește `Cache-Control` pe pagini și resurse statice | mic |
| 5 | Mică | `description` și `og:description` diferă pe Home | foarte mic |
| 6 | Mică | Linkul din footer către GDPR e `/gdpr`, fără slash (merge prin redirect 301) | foarte mic |
| 7 | De verificat | Linkurile Facebook / Instagram din pagina de contact | mic |
| 8 | Sugestie | Pagina Home nu afișează emailul și adresa | mic |
| 9 | Sugestie | Sitemap: cele 6 pagini principale nu au `lastmod` | mic |

## 1. Headere de securitate lipsă (prioritate mare)

**Constatare.** `https://dauron-trust.com/` (server LiteSpeed) trimite doar `X-Content-Type-Options: nosniff` și
`X-XSS-Protection: 1; mode=block`. Lipsesc:

- `Strict-Transport-Security` – browserul nu e obligat să folosească HTTPS.
- `Content-Security-Policy` – nicio restricție asupra scripturilor și resurselor încărcate.
- `X-Frame-Options` (sau `frame-ancestors` în CSP) – site-ul poate fi încadrat în iframe pe alt site (clickjacking).
- `Referrer-Policy` – adresa paginii se trimite integral către site-uri terțe.

**Reparare propusă** (în `.htaccess`, pe LiteSpeed; valorile trebuie testate pe staging, mai ales CSP):

```apache
<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  # CSP: începe în mod Report-Only, apoi strânge regulile după ce vezi ce se încarcă (analytics, fonturi, WhatsApp etc.)
  Header always set Content-Security-Policy-Report-Only "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'self'"
</IfModule>
```

Atenție la `includeSubDomains` dacă există subdomenii fără HTTPS.

**Verificare după reparare:** `curl -sI https://dauron-trust.com/` arată cele patru headere pe toate paginile.

## 2. `www` nu redirecționează (prioritate medie)

**Constatare.** `https://www.dauron-trust.com/` răspunde `200` cu același conținut ca `https://dauron-trust.com/`.
Canonical-ul indică varianta fără `www`, deci Google o preferă, dar conținutul rămâne accesibil pe două adrese.

**Reparare:** redirect 301 de la `www` la domeniul fără `www`:

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.dauron-trust\.com$ [NC]
RewriteRule ^(.*)$ https://dauron-trust.com/$1 [R=301,L]
```

**Verificare:** `curl -sI https://www.dauron-trust.com/` întoarce `301` cu `Location: https://dauron-trust.com/`.

## 3. Footer „© 2025” (prioritate medie)

**Constatare.** Footerul afișează „© 2025 DAURON TRUST SRL”, deși articolele sunt despre 2026.

**Reparare:** an calculat automat (`new Date().getFullYear()` la build) sau „© 2025–2026”. Dacă site-ul e static,
anul se actualizează doar la fiecare build, deci merită un build anual.

## 4. `Cache-Control` lipsă (prioritate mică)

**Constatare.** Nu există `Cache-Control` pe pagini. Pagina cea mai mare, `/articole/`, are 112 KB; imaginile sunt
mici (logo 3 KB, `planuri.jpg` 63 KB), deci efectul e modest, dar un vizitator care revine redescarcă totul.

**Reparare:** pentru fișierele din `/_next/static/` și `/img/` (cu nume stabil sau cu hash) `max-age` lung,
de exemplu `public, max-age=31536000, immutable` pentru cele cu hash; pentru HTML un `max-age` scurt sau `no-cache`.

## 5. `description` diferă de `og:description` pe Home (prioritate mică)

- `description`: „Proiectare structurală și coordonare de proiect pentru construcții civile, edilitare și reabilitări.
  Inginer constructor din 2009.”
- `og:description` și `twitter:description`: „Proiectare construcții civile, structură, arhitectură și consultanță tehnică.”

**Reparare:** aceeași formulare în ambele, ca mesajul din Google să coincidă cu cel din rețelele sociale.

## 6. Link `/gdpr` fără slash în footer (prioritate mică)

**Constatare.** Footerul leagă la `/gdpr`; serverul răspunde `301` către `/gdpr/`. Funcționează, dar adaugă un salt.

**Reparare:** `href="/gdpr/"`, ca restul linkurilor interne (`/about/`, `/portfolio/`, `/articole/`, `/contact/`).

## 7. Linkuri sociale – de verificat

Pagina `/contact/` are elementele `contact-link-facebook` și `contact-link-instagram`. La analiză nu am citit adresele
către care duc, deci nu pot confirma că sunt valide. De verificat manual înainte de release (sau cu testul
`links.spec.ts` din suita automată).

## 8. Home fără email și adresă (sugestie)

Pe Home apar doar telefonul și WhatsApp; emailul e doar pe `/contact/`. Pentru un birou local (Negrești, jud. Vaslui)
o adresă vizibilă mărește încrederea și ajută SEO-ul local. Datele structurate (`PostalAddress`) există deja,
deci informația e disponibilă.

## 9. Sitemap fără `lastmod` pe paginile principale (sugestie)

Din cele 34 de URL-uri din `sitemap.xml`, doar cele 28 de articole au `lastmod`. Adaugă data și pentru cele 6 pagini
principale (`/`, `/about/`, `/portfolio/`, `/articole/`, `/contact/`, `/gdpr/`).

## Ce e deja în regulă (de păstrat)

- Timp de răspuns 60–100 ms, compresie Brotli, imagini mici.
- Pe toate paginile verificate: `title` și `description` unice, `canonical` corect, un singur H1, `lang="ro"`,
  Open Graph și Twitter card, toate imaginile cu `alt`, date structurate JSON-LD.
- `robots.txt` permite indexarea și indică sitemap-ul; 34 de URL-uri în sitemap.
- `http` → `https` prin 301; pagină inexistentă → 404 corect.
- Id-uri stabile pe elemente (ex. `contact-submit-button`), utile pentru testarea automată.

## Verificare finală după release

1. `curl -sI https://dauron-trust.com/` – headerele din §1 și §4 prezente.
2. `curl -sI https://www.dauron-trust.com/` – 301 către domeniul fără `www`.
3. Footerul arată anul curent, iar linkul GDPR duce direct la `/gdpr/`.
4. Rulează suita automată: `npm test` (și `npm run test:smoke` pentru verificare rapidă).
