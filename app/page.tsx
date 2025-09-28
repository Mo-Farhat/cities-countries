"use client";

import { useEffect, useMemo, useState } from "react";

type CountryName = string;
type CityName = string;

type StoredCity = { country: CountryName; city: CityName };

const COUNTRIES_KEY = "cc_countries";
const CITIES_KEY = "cc_cities";

export default function Home() {
  const [countries, setCountries] = useState<CountryName[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryName>("");
  const [cities, setCities] = useState<CityName[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityName>("");
  const [storedCountries, setStoredCountries] = useState<CountryName[]>([]);
  const [storedCities, setStoredCities] = useState<StoredCity[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(COUNTRIES_KEY) || "[]");
      const ci = JSON.parse(localStorage.getItem(CITIES_KEY) || "[]");
      setStoredCountries(Array.isArray(c) ? c : []);
      setStoredCities(Array.isArray(ci) ? ci : []);
    } catch {}
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      setLoadingCountries(true);
      setError(null);
      try {
        const names = await loadCountriesWithFallback();
        setCountries(names);
      } catch (e: any) {
        setError("Failed to load countries");
      } finally {
        setLoadingCountries(false);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchCities = async () => {
      if (!selectedCountry) {
        setCities([]);
        return;
      }
      setLoadingCities(true);
      setError(null);
      try {
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: selectedCountry }),
          }
        );
        const data = await res.json();
        const list: CityName[] = Array.isArray(data?.data) ? data.data : [];
        setCities(list.sort((a, b) => a.localeCompare(b)));
      } catch (e: any) {
        setError("Failed to load cities");
      } finally {
        setLoadingCities(false);
      }
    };
    fetchCities();
  }, [selectedCountry]);

  const addCountry = () => {
    if (!selectedCountry) return;
    if (storedCountries.includes(selectedCountry)) return;
    const next = [...storedCountries, selectedCountry].sort((a, b) =>
      a.localeCompare(b)
    );
    setStoredCountries(next);
    localStorage.setItem(COUNTRIES_KEY, JSON.stringify(next));
  };

  const addCity = () => {
    if (!selectedCountry || !selectedCity) return;
    if (
      storedCities.some(
        (s) => s.country === selectedCountry && s.city === selectedCity
      )
    )
      return;
    const next = [
      ...storedCities,
      { country: selectedCountry, city: selectedCity },
    ].sort((a, b) =>
      a.country === b.country
        ? a.city.localeCompare(b.city)
        : a.country.localeCompare(b.country)
    );
    setStoredCities(next);
    localStorage.setItem(CITIES_KEY, JSON.stringify(next));
  };

  const addAllCities = () => {
    if (!selectedCountry || cities.length === 0) return;
    const existing = new Set(
      storedCities.map((s) => `${s.country}||${s.city}`)
    );
    const newEntries: StoredCity[] = cities
      .filter((city) => !existing.has(`${selectedCountry}||${city}`))
      .map((city) => ({ country: selectedCountry, city }));
    if (newEntries.length === 0) return;
    const next = [...storedCities, ...newEntries].sort((a, b) =>
      a.country === b.country
        ? a.city.localeCompare(b.city)
        : a.country.localeCompare(b.country)
    );
    setStoredCities(next);
    localStorage.setItem(CITIES_KEY, JSON.stringify(next));
  };

  const removeCountry = (country: CountryName) => {
    const next = storedCountries.filter((c) => c !== country);
    setStoredCountries(next);
    localStorage.setItem(COUNTRIES_KEY, JSON.stringify(next));
  };

  const removeCity = (country: CountryName, city: CityName) => {
    const next = storedCities.filter(
      (s) => !(s.country === country && s.city === city)
    );
    setStoredCities(next);
    localStorage.setItem(CITIES_KEY, JSON.stringify(next));
  };

  const csvContent = useMemo(() => {
    const rows: string[] = [];
    rows.push("Country,City");
    storedCountries.forEach((c) =>
      rows.push(`${escapeCSV(normalizeText(c))},`)
    );
    storedCities.forEach((s) =>
      rows.push(
        `${escapeCSV(normalizeText(s.country))},${escapeCSV(normalizeText(s.city))}`
      )
    );
    return rows.join("\n");
  }, [storedCountries, storedCities]);

  const downloadCSV = () => {
    const bom = "\uFEFF"; // UTF-8 BOM for Excel
    const blob = new Blob([bom, csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cities_countries.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Cities & Countries</h1>

      <div className="flex flex-col gap-3">
        <label className="text-sm">Country</label>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-3 py-2 w-full bg-background"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
          >
            <option value="" disabled>
              {loadingCountries ? "Loading countries..." : "Select a country"}
            </option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            className="border rounded px-3 py-2"
            onClick={addCountry}
            disabled={!selectedCountry}
          >
            Add
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm">City</label>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded px-3 py-2 w-full bg-background"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedCountry || loadingCities}
          >
            <option value="" disabled>
              {!selectedCountry
                ? "Select a country first"
                : loadingCities
                  ? "Loading cities..."
                  : "Select a city"}
            </option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            className="border rounded px-3 py-2"
            onClick={addCity}
            disabled={!selectedCountry || !selectedCity}
          >
            Add
          </button>
          <button
            className="border rounded px-3 py-2"
            onClick={addAllCities}
            disabled={!selectedCountry || loadingCities || cities.length === 0}
            title={
              !selectedCountry
                ? "Select a country first"
                : loadingCities
                  ? "Loading cities..."
                  : cities.length === 0
                    ? "No cities available"
                    : "Add all cities from the selected country"
            }
          >
            Add all
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="font-medium mb-2">Saved Countries</h2>
          <ul className="space-y-2">
            {storedCountries.length === 0 && (
              <li className="text-sm text-default-500">None yet</li>
            )}
            {storedCountries.map((c) => (
              <li
                key={c}
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                <span>{c}</span>
                <button
                  className="text-red-500"
                  onClick={() => removeCountry(c)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-medium mb-2">Saved Cities</h2>
          <ul className="space-y-2">
            {storedCities.length === 0 && (
              <li className="text-sm text-default-500">None yet</li>
            )}
            {storedCities.map((s) => (
              <li
                key={`${s.country}-${s.city}`}
                className="flex items-center justify-between border rounded px-3 py-2"
              >
                <span>
                  {s.city} — {s.country}
                </span>
                <button
                  className="text-red-500"
                  onClick={() => removeCity(s.country, s.city)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          className="border rounded px-4 py-2"
          onClick={downloadCSV}
          disabled={storedCountries.length + storedCities.length === 0}
        >
          Export CSV
        </button>
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>
    </section>
  );
}

function escapeCSV(value: string) {
  if (value == null) return "";
  const needsQuotes = /[",\n]/.test(value);
  const escaped = value.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
}

function normalizeText(value: string) {
  try {
    return value.normalize("NFC");
  } catch {
    return value;
  }
}

async function loadCountriesWithFallback(): Promise<CountryName[]> {
  // Primary: RestCountries with reduced fields
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    const res = await fetch("https://restcountries.com/v3.1/all?fields=name", {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error("restcountries error");
    const data = await res.json();
    const names: CountryName[] = (data || [])
      .map((c: any) => c?.name?.common)
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b));
    if (names.length) return names;
    throw new Error("empty countries list");
  } catch {}

  // Fallback: countriesnow
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  const res = await fetch("https://countriesnow.space/api/v0.1/countries", {
    method: "GET",
    signal: controller.signal,
  });
  clearTimeout(timeout);
  if (!res.ok) throw new Error("countriesnow error");
  const data = await res.json();
  const names: CountryName[] = Array.isArray(data?.data)
    ? data.data
        .map((c: any) => c?.country)
        .filter(Boolean)
        .sort((a: string, b: string) => a.localeCompare(b))
    : [];
  if (!names.length) throw new Error("empty countries list");
  return names;
}
