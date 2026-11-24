"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Search, ArrowRight, CheckCircle2 } from "lucide-react";
import {
  PARTNER_COUNTRIES,
  ALL_PARTNER_UNIVERSITIES,
  RULES_UNIVERSITY_FUNDED,
  RULES_SELF_FUNDED,
} from "@/lib/partners";

export default function MobilityProgramsPage() {
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string>("Барлығы");

  const filteredCountries = PARTNER_COUNTRIES.map((c) => ({
    ...c,
    universities: c.universities.filter(
      (u) =>
        !search.trim() ||
        u.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(
    (c) =>
      c.universities.length > 0 &&
      (selectedCountry === "Барлығы" || c.country === selectedCountry)
  );

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Навбар */}
      <header className="sticky top-0 z-50 border-b border-[color:var(--border)] bg-[color:var(--card)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <GraduationCap size={19} />
            </div>
            <div>
              <div className="text-sm font-bold">Серіктес университеттер</div>
              <div className="text-[11px] text-slate-400">
                {PARTNER_COUNTRIES.length} ел · {ALL_PARTNER_UNIVERSITIES.length} ЖОО
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/auth"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
            >
              Өтінім беру <ArrowRight size={13} />
            </Link>
            <Link
              href="/"
              className="card inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition hover:border-blue-400"
            >
              <ArrowLeft size={13} /> Басты бет
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {/* Талаптар */}
        <section className="grid gap-4 md:grid-cols-2">
          <div className="card rounded-2xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-blue-700">
              🎓 Университет қаражаты есебінен баратын үміткерлерге қойылатын талаптар
            </h2>
            <ul className="mt-3 space-y-2 text-xs text-slate-600">
              {RULES_UNIVERSITY_FUNDED.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card flex flex-col justify-between rounded-2xl p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-indigo-700">
                💼 Өз қаражаты есебінен баратын білім алушыларға
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-slate-600">{RULES_SELF_FUNDED}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 border-t border-[color:var(--border)] pt-3">
              <a
                href="/templates/otinish-rektor.doc"
                download
                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                📥 Өтініш шаблоны (.doc)
              </a>
              <a
                href="/templates/densaulyk-deklaraciya.doc"
                download
                className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
              >
                📥 Денсаулық декларациясы (.doc)
              </a>
            </div>
          </div>
        </section>

        {/* Поиск и фильтр по странам */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold">
              Қабылдаушы серіктес университеттер тізімі ({ALL_PARTNER_UNIVERSITIES.length} ЖОО)
            </h1>
            <div className="relative w-full sm:w-72">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Университет немесе ел іздеу…"
                className="card w-full rounded-xl py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {["Барлығы", ...PARTNER_COUNTRIES.map((c) => c.country)].map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCountry(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  selectedCountry === c
                    ? "bg-blue-600 text-white shadow"
                    : "card hover:border-blue-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredCountries.map((item) => (
              <div key={item.country} className="card rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-2.5">
                  <div className="flex items-center gap-2 text-base font-bold">
                    <span className="text-2xl">{item.flag}</span> {item.country}
                  </div>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                    {item.universities.length} ЖОО
                  </span>
                </div>
                <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-xs text-slate-700">
                  {item.universities.map((u) => (
                    <li key={u} className="font-medium">
                      {u}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
