/**
 * Builds supabase/seed/matches.json from FIFA group-stage schedule (EST → UTC).
 * Run: node scripts/build-matches.mjs
 */

import fs from "node:fs";
import path from "node:path";

const TEAM = {
  Mexico: "MEX",
  "South Africa": "RSA",
  "South Korea": "KOR",
  Korea: "KOR",
  "Korea Republic": "KOR",
  Czechia: "CZE",
  Canada: "CAN",
  "Bosnia and Herzegovina": "BIH",
  USA: "USA",
  Paraguay: "PAR",
  Haiti: "HAI",
  Scotland: "SCO",
  Australia: "AUS",
  Türkiye: "TUR",
  Brazil: "BRA",
  Morocco: "MAR",
  Qatar: "QAT",
  Switzerland: "SUI",
  "Ivory Coast": "CIV",
  "Côte d'Ivoire": "CIV",
  Ecuador: "ECU",
  Germany: "GER",
  "Curaçao": "CUW",
  Curacao: "CUW",
  Netherlands: "NED",
  Japan: "JPN",
  Sweden: "SWE",
  Tunisia: "TUN",
  "Saudi Arabia": "KSA",
  Uruguay: "URU",
  Spain: "ESP",
  "Cape Verde": "CPV",
  "Cabo Verde": "CPV",
  Iran: "IRN",
  "New Zealand": "NZL",
  Belgium: "BEL",
  Egypt: "EGY",
  France: "FRA",
  Senegal: "SEN",
  Iraq: "IRQ",
  Norway: "NOR",
  Argentina: "ARG",
  Algeria: "ALG",
  Austria: "AUT",
  Jordan: "JOR",
  Ghana: "GHA",
  Panama: "PAN",
  England: "ENG",
  Croatia: "CRO",
  Portugal: "POR",
  "Congo DR": "COD",
  "DR Congo": "COD",
  Uzbekistan: "UZB",
  Colombia: "COL",
};

/** EDT (June) = UTC-4 → UTC = EST_display + 4h */
function estToUtcIso(date, timeEst) {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = timeEst.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh + 4, mm)).toISOString();
}

function parseMatchup(s) {
  const [home, away] = s.split(" v ").map((t) => t.trim());
  return { home: TEAM[home], away: TEAM[away] };
}

// FIFA WM 2026 group stage — Time (EST) from official schedule
const RAW = `
1|2026-06-11|15:00|Mexico v South Africa|A|Mexico City
2|2026-06-11|22:00|South Korea v Czechia|A|Guadalajara
3|2026-06-12|15:00|Canada v Bosnia and Herzegovina|B|Toronto
4|2026-06-12|21:00|USA v Paraguay|D|Los Angeles
5|2026-06-13|21:00|Haiti v Scotland|C|Boston
6|2026-06-13|00:00|Australia v Türkiye|D|Vancouver
7|2026-06-13|18:00|Brazil v Morocco|C|New York
8|2026-06-13|15:00|Qatar v Switzerland|B|San Francisco
9|2026-06-14|19:00|Ivory Coast v Ecuador|E|Philadelphia
10|2026-06-14|13:00|Germany v Curaçao|E|Houston
11|2026-06-14|16:00|Netherlands v Japan|F|Dallas
12|2026-06-14|22:00|Sweden v Tunisia|F|Monterrey
13|2026-06-15|18:00|Saudi Arabia v Uruguay|H|Miami
14|2026-06-15|12:00|Spain v Cape Verde|H|Atlanta
15|2026-06-15|21:00|Iran v New Zealand|G|Los Angeles
16|2026-06-15|15:00|Belgium v Egypt|G|Seattle
17|2026-06-16|15:00|France v Senegal|I|New York
18|2026-06-16|18:00|Iraq v Norway|I|Boston
19|2026-06-16|21:00|Argentina v Algeria|J|Kansas City
20|2026-06-16|00:00|Austria v Jordan|J|San Francisco
21|2026-06-17|19:00|Ghana v Panama|L|Toronto
22|2026-06-17|16:00|England v Croatia|L|Dallas
23|2026-06-17|13:00|Portugal v Congo DR|K|Houston
24|2026-06-17|22:00|Uzbekistan v Colombia|K|Mexico City
25|2026-06-18|12:00|Czechia v South Africa|A|Atlanta
26|2026-06-18|15:00|Switzerland v Bosnia and Herzegovina|B|Los Angeles
27|2026-06-18|18:00|Canada v Qatar|B|Vancouver
28|2026-06-18|21:00|Mexico v South Korea|A|Guadalajara
29|2026-06-19|21:00|Brazil v Haiti|C|Philadelphia
30|2026-06-19|18:00|Scotland v Morocco|C|Boston
31|2026-06-19|23:00|Türkiye v Paraguay|D|San Francisco
32|2026-06-19|15:00|USA v Australia|D|Seattle
33|2026-06-20|16:00|Germany v Ivory Coast|E|Toronto
34|2026-06-20|20:00|Ecuador v Curaçao|E|Kansas City
35|2026-06-20|13:00|Netherlands v Sweden|F|Houston
36|2026-06-20|00:00|Tunisia v Japan|F|Monterrey
37|2026-06-21|18:00|Uruguay v Cape Verde|H|Miami
38|2026-06-21|12:00|Spain v Saudi Arabia|H|Atlanta
39|2026-06-21|15:00|Belgium v Iran|G|Los Angeles
40|2026-06-21|21:00|New Zealand v Egypt|G|Vancouver
41|2026-06-22|20:00|Norway v Senegal|I|New York
42|2026-06-22|17:00|France v Iraq|I|Philadelphia
43|2026-06-22|13:00|Argentina v Austria|J|Dallas
44|2026-06-22|23:00|Jordan v Algeria|J|San Francisco
45|2026-06-23|16:00|England v Ghana|L|Boston
46|2026-06-23|19:00|Panama v Croatia|L|Toronto
47|2026-06-23|13:00|Portugal v Uzbekistan|K|Houston
48|2026-06-23|22:00|Colombia v Congo DR|K|Guadalajara
49|2026-06-24|18:00|Scotland v Brazil|C|Miami
50|2026-06-24|18:00|Morocco v Haiti|C|Atlanta
51|2026-06-24|15:00|Switzerland v Canada|B|Vancouver
52|2026-06-24|15:00|Bosnia and Herzegovina v Qatar|B|Seattle
53|2026-06-24|21:00|Czechia v Mexico|A|Mexico City
54|2026-06-24|21:00|South Africa v South Korea|A|Monterrey
55|2026-06-25|16:00|Curaçao v Ivory Coast|E|Philadelphia
56|2026-06-25|16:00|Ecuador v Germany|E|New York
57|2026-06-25|19:00|Japan v Sweden|F|Dallas
58|2026-06-25|19:00|Tunisia v Netherlands|F|Kansas City
59|2026-06-25|22:00|Türkiye v USA|D|Los Angeles
60|2026-06-25|22:00|Paraguay v Australia|D|San Francisco
61|2026-06-26|15:00|Norway v France|I|Boston
62|2026-06-26|15:00|Senegal v Iraq|I|Toronto
63|2026-06-26|23:00|Egypt v Iran|G|Seattle
64|2026-06-26|23:00|New Zealand v Belgium|G|Vancouver
65|2026-06-26|20:00|Cape Verde v Saudi Arabia|H|Houston
66|2026-06-26|20:00|Uruguay v Spain|H|Guadalajara
67|2026-06-27|17:00|Panama v England|L|New York
68|2026-06-27|17:00|Croatia v Ghana|L|Philadelphia
69|2026-06-27|22:00|Algeria v Austria|J|Kansas City
70|2026-06-27|22:00|Jordan v Argentina|J|Dallas
71|2026-06-27|19:30|Colombia v Portugal|K|Miami
72|2026-06-27|19:30|Congo DR v Uzbekistan|K|Atlanta
`;

/** Known results as of 2026-06-12 */
const RESULTS = {
  1: { home_score: 2, away_score: 0, status: "finished" },
  2: { home_score: 2, away_score: 1, status: "finished" },
};

const matches = RAW.trim()
  .split("\n")
  .map((line) => {
    const [id, date, time, matchup, group, city] = line.split("|");
    const { home, away } = parseMatchup(matchup);
    const fifaId = Number(id);
    const result = RESULTS[fifaId];
    return {
      fifa_match_id: fifaId,
      home_team_code: home,
      away_team_code: away,
      kickoff_at: estToUtcIso(date, time),
      stage: "group",
      group_name: group,
      venue_city: city,
      status: result?.status ?? "scheduled",
      home_score: result?.home_score ?? null,
      away_score: result?.away_score ?? null,
    };
  });

const out = path.join(process.cwd(), "supabase/seed/matches.json");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(matches, null, 2));
console.log(`✓ ${matches.length} matches → ${out}`);
console.log("  KOR-CZE:", matches.find((m) => m.fifa_match_id === 2)?.kickoff_at);
