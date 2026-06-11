-- Stundensatz für Kosten-Controlling (Baufox)
-- Sicher mehrfach ausführbar.
alter table mitarbeiter add column if not exists stundensatz numeric;
