"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateAge, getStageForAge, type AgeStage, type Age } from "@/lib/age-content";

type ChildProfile = {
  id: string;
  name: string;
  dob: string;
};

type TipFilter = "all" | "medical" | "islamic";
type ViewTab = "summary" | "islamic" | "medical";

const CHILDREN_KEY = "tarbiyah-children-v1";
const LEGACY_CHILD_KEY = "tarbiyah-child";

function getInitialChildren(): { children: ChildProfile[]; selectedId: string | null } {
  if (typeof window === "undefined") {
    return { children: [], selectedId: null };
  }

  try {
    const stored = window.localStorage.getItem(CHILDREN_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ChildProfile[];
      const valid = Array.isArray(parsed) ? parsed.filter((c) => c && c.dob) : [];
      return {
        children: valid,
        selectedId: valid[0]?.id ?? null,
      };
    }

    // Legacy single-child support → migrate
    const legacy = window.localStorage.getItem(LEGACY_CHILD_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { name?: string; dob?: string };
      if (parsed?.dob) {
        const legacyChild: ChildProfile = {
          id: `child-${Date.now()}`,
          name: parsed.name ?? "",
          dob: parsed.dob,
        };
        window.localStorage.setItem(CHILDREN_KEY, JSON.stringify([legacyChild]));
        return { children: [legacyChild], selectedId: legacyChild.id };
      }
    }
  } catch {
    // ignore
  }

  return { children: [], selectedId: null };
}

function formatAge(age: Age | null): string {
  if (!age) return "বয়স নির্ণয় করা যায়নি";
  const parts: string[] = [];
  if (age.years) parts.push(`${age.years} বছর`);
  if (age.months) parts.push(`${age.months} মাস`);
  if (age.days || parts.length === 0) parts.push(`${age.days} দিন`);
  return parts.join(" ");
}

export default function Home() {
  // Always start empty so server and client first render match (avoid hydration mismatch)
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedChild = useMemo(
    () => children.find((c) => c.id === selectedId) ?? null,
    [children, selectedId],
  );

  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [touched, setTouched] = useState(false);
  const [view, setView] = useState<ViewTab>("summary");
  const [hasMounted, setHasMounted] = useState(false);

  // Load from localStorage only after mount (client-only), so SSR and first client render match
  useEffect(() => {
    const { children: loaded, selectedId: loadedId } = getInitialChildren();
    /* eslint-disable react-hooks/set-state-in-effect -- intentional: hydrate from localStorage after mount to avoid SSR mismatch */
    setChildren(loaded);
    if (loaded.length > 0) {
      setSelectedId(loadedId ?? loaded[0].id);
      const selected = loaded.find((c) => c.id === (loadedId ?? loaded[0].id)) ?? loaded[0];
      setName(selected.name);
      setDob(selected.dob);
    }
    setHasMounted(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!hasMounted || typeof window === "undefined") return;
    window.localStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
  }, [children, hasMounted]);

  const age = useMemo(() => (dob ? calculateAge(dob) : null), [dob]);
  const stage: AgeStage | null = useMemo(() => getStageForAge(age), [age]);

  const filter: TipFilter =
    view === "islamic" ? "islamic" : view === "medical" ? "medical" : "all";

  const nameToShow = name.trim() || "আমার শিশু";

  const showError = touched && !dob;

  const handleSaveProfile = () => {
    if (!dob) {
      setTouched(true);
      return;
    }

    const trimmedName = name.trim();
    if (selectedChild) {
      const updated = children.map((child) =>
        child.id === selectedChild.id ? { ...child, name: trimmedName, dob } : child,
      );
      setChildren(updated);
    } else {
      const id = `child-${Date.now()}`;
      const newChild: ChildProfile = {
        id,
        name: trimmedName,
        dob,
      };
      setChildren((prev) => [...prev, newChild]);
      setSelectedId(id);
    }
  };

  const handleNewProfile = () => {
    setSelectedId(null);
    setName("");
    setDob("");
    setTouched(false);
  };

  const handleSelectProfile = (id: string) => {
    const child = children.find((c) => c.id === id);
    setSelectedId(id);
    if (child) {
      setName(child.name);
      setDob(child.dob);
      setTouched(false);
    }
  };

  const handleDeleteProfile = () => {
    if (!selectedChild) return;
    const remaining = children.filter((c) => c.id !== selectedChild.id);
    setChildren(remaining);
    if (remaining.length > 0) {
      const next = remaining[0];
      setSelectedId(next.id);
      setName(next.name);
      setDob(next.dob);
      setTouched(false);
    } else {
      handleNewProfile();
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top hero / dashboard header */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-card px-4 py-4 text-body-primary shadow-sm shadow-emerald-100 sm:px-6 sm:py-5 md:px-8 md:py-6">
        <div className="pointer-events-none absolute -left-10 top-[-40px] h-40 w-40 rounded-full bg-emerald-100/40 blur-2xl" />
        <div className="pointer-events-none absolute -right-6 bottom-[-20px] h-32 w-32 rounded-full bg-sky-100/40 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-hero-label text-xs font-semibold uppercase tracking-[0.2em] sm:text-sm">
              সুনির্দিষ্ট বয়সভিত্তিক গাইড
            </p>
            <h2 className="text-hero-heading text-xl font-semibold leading-snug sm:text-3xl">
              আপনার সন্তানের{" "}
              <span className="underline decoration-amber-200 decoration-wavy underline-offset-4">
                ইসলামিক + ডাক্তারি ড্যাশবোর্ড
              </span>
            </h2>
            <p className="max-w-xl text-sm text-muted-soft sm:text-base">
              Tarbiyah আপনাকে নবজাতক থেকে ৫ বছর বয়স পর্যন্ত আপনার সন্তানের জন্য
              মেডিকেল ও ইসলামিক দৃষ্টিকোণ থেকে করণীয়, বর্জনীয়, খাবার ও দোয়াগুলো
              সাজিয়ে দেবে – এক জায়গায়, অর্গানাইজ ভাবে।
            </p>
          </div>
          <div className="reminder-box mt-1.5 w-full max-w-xs rounded-2xl p-3 text-xs shadow-sm shadow-emerald-100 sm:mt-0 sm:text-sm">
            <p className="reminder-title mb-1 font-semibold">আজকের রিমাইন্ডার</p>
            <ul className="space-y-1">
              <li className="flex items-start gap-2">
                <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-amber-200" />
                <span>শিশুর সাথে অন্তত ১৫ মিনিট শুধু চোখে চোখ রেখে কথা বলুন।</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-[2px] h-1.5 w-1.5 rounded-full bg-amber-200" />
                <span>ঘুমের আগে ছোট একটি দোয়া বা সূরা একসাথে পড়ুন।</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Main dashboard layout */}
      <section className="grid gap-3.5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.4fr)]">
        <div className="space-y-3.5 rounded-3xl bg-surface-card p-3.5 shadow-sm shadow-emerald-100">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-emerald-900 sm:text-lg">
              শিশুর প্রোফাইল
            </h3>
            <button
              type="button"
              onClick={handleNewProfile}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-100 active:scale-95"
            >
              <span className="text-base leading-none">+</span>
              নতুন প্রোফাইল
            </button>
          </div>

          {children.length > 0 && (
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto pb-1 pt-1 text-xs sm:text-sm">
              {children.map((child) => {
                const isActive = child.id === selectedId;
                const label = child.name || "নামহীন শিশু";
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => handleSelectProfile(child.id)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 shadow-sm transition ${
                      isActive
                        ? "bg-emerald-600 text-emerald-50 shadow-emerald-300/70"
                        : "bg-white text-emerald-800 shadow-emerald-100 hover:bg-emerald-50"
                    }`}
                  >
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    <span className="whitespace-nowrap">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="space-y-2.5">
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-body-muted">
                শিশুর নাম (ঐচ্ছিক)
              </label>
              <input
                id="name"
                type="text"
                placeholder="যেমন: আয়ান, আয়েশা..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-emerald-100 bg-white/70 px-3.5 py-2.5 text-sm sm:text-base shadow-[0_1px_0_rgba(15,118,110,0.06)] outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="dob" className="block text-xs sm:text-sm font-medium text-body-muted">
                শিশুর জন্ম তারিখ *
              </label>
              <input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => {
                  setDob(e.target.value);
                  setTouched(true);
                }}
                onBlur={() => setTouched(true)}
                className="w-full rounded-2xl border border-emerald-100 bg-white/70 px-3.5 py-2.5 text-sm sm:text-base shadow-[0_1px_0_rgba(15,118,110,0.06)] outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              />
              {showError && (
                <p className="text-xs sm:text-sm font-medium text-red-500">
                  জন্ম তারিখ দিলে সঠিক বয়সের গাইড দেখা যাবে।
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1.5">
            <button
              type="button"
              onClick={handleSaveProfile}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-emerald-50 shadow-sm shadow-emerald-300/70 transition hover:bg-emerald-700 active:scale-95"
            >
              {selectedChild ? "প্রোফাইল আপডেট করুন" : "প্রোফাইল সেভ করুন"}
            </button>
            {selectedChild && (
              <button
                type="button"
                onClick={handleDeleteProfile}
                className="inline-flex items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 shadow-sm transition hover:border-rose-200 hover:bg-rose-100 active:scale-95"
              >
                মুছে দিন
              </button>
            )}
          </div>

          <div className="mt-2 rounded-2xl bg-linear-to-r from-emerald-50 to-sky-50 p-3 text-sm text-body-muted sm:text-[15px]">
            <p className="font-semibold text-emerald-800">কীভাবে কাজ করে?</p>
            <p className="mt-1">
              আপনি শুধু জন্ম তারিখ সেভ করলেই Tarbiyah আপনার শিশুর{" "}
              <span className="font-semibold text-emerald-700">
                বর্তমান বয়স ও বয়স অনুযায়ী করণীয়/বর্জনীয়
              </span>{" "}
              সাজিয়ে দেখাবে। ডাটা আপনার ব্রাউজারেই save থাকবে।
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* View switcher for right side */}
          <ViewTabs view={view} onChange={setView} />

          <div className="relative overflow-hidden rounded-3xl bg-surface-card p-3.5 shadow-sm shadow-emerald-100">
            <div className="pointer-events-none absolute -right-6 -top-10 h-24 w-24 rounded-full bg-emerald-100/70 blur-2xl" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1.5">
                <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-emerald-500">
                  বর্তমান স্ট্যাটাস
                </p>
                <h3 className="text-lg sm:text-2xl font-semibold text-emerald-900">
                  {nameToShow} এখন
                </h3>
                <p className="text-sm sm:text-base text-body-muted">
                  আনুমানিক বয়স:{" "}
                  <span className="font-semibold text-emerald-700">
                    {dob ? formatAge(age) : "জন্ম তারিখ দিন"}
                  </span>
                </p>
                {stage && (
                  <p className="text-xs sm:text-sm text-zinc-500">
                    বর্তমান স্টেজ:{" "}
                    <span className="font-medium text-emerald-700">{stage.title}</span>
                  </p>
                )}
              </div>
              {stage && (
                <div className="mt-2 inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs sm:text-sm text-emerald-800 sm:mt-0">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-medium">এই বয়সে স্পেশাল গাইড তৈরি হয়েছে</span>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard / details based on selected view */}
          {view === "summary" && stage && (
            <div className="grid gap-2 sm:grid-cols-3">
              <MiniStatCard
                label="ইসলামিক ফোকাস"
                value={stage.islamicFocus[0] ?? "এই বয়সে করণীয় এখানে আসবে।"}
                tone="sky"
              />
              <MiniStatCard
                label="ডাক্তারি ফোকাস"
                value={stage.medicalFocus[0] ?? "এই বয়সে মেডিকেল চেকপয়েন্ট এখানে আসবে।"}
                tone="emerald"
              />
              <MiniStatCard
                label="আজকের অগ্রাধিকার"
                value={
                  stage.shouldDo[0] ??
                  stage.islamicFocus[1] ??
                  "একটু সময় নিয়ে শিশু আর আপনার জন্য দোয়া করুন।"
                }
                tone="amber"
              />
            </div>
          )}

          {view !== "summary" && (
            <GuidanceSection stage={stage} filter={filter} />
          )}
        </div>
      </section>
    </div>
  );
}

function GuidanceSection({ stage, filter }: { stage: AgeStage | null; filter: TipFilter }) {
  if (!stage) {
    return (
      <div className="rounded-3xl border border-dashed border-emerald-100 bg-white/70 p-4 text-sm text-body-muted shadow-sm">
        <p className="font-medium text-body-primary">এখনো কোনো বয়স নির্বাচন হয়নি।</p>
        <p className="mt-1">
          উপরের ফরমে{" "}
          <span className="font-semibold text-emerald-700">শিশুর জন্ম তারিখ</span> দিলে
          বয়সভিত্তিক Islamic ও মেডিকেল গাইড এখানে দেখা যাবে।
        </p>
      </div>
    );
  }

  const showMedical = filter === "all" || filter === "medical";
  const showIslamic = filter === "all" || filter === "islamic";

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <Card title="এই বয়সের মূল ফোকাস" badge="Overview">
        <p className="text-sm text-zinc-500 sm:text-base">{stage.subtitle}</p>
        <div className="mt-2 grid gap-1.5 text-sm text-body-muted sm:text-[15px]">
          {showMedical &&
            stage.medicalFocus.slice(0, 3).map((item) => (
              <Bullet key={item} color="emerald">
                {item}
              </Bullet>
            ))}
          {showIslamic &&
            stage.islamicFocus.slice(0, 3).map((item) => (
              <Bullet key={item} color="sky">
                {item}
              </Bullet>
            ))}
        </div>
      </Card>

      {showMedical && (
        <Card title="কোন কাজগুলো করা উচিত" badge="Do">
          <div className="space-y-1.5 text-sm text-body-muted sm:text-[15px]">
            {stage.shouldDo.map((item) => (
              <Bullet key={item} color="emerald">
                {item}
              </Bullet>
            ))}
          </div>
        </Card>
      )}

      {showMedical && (
        <Card title="কোন কাজগুলো এড়িয়ে চলবেন" badge="Don't">
          <div className="space-y-1.5 text-sm text-body-muted sm:text-[15px]">
            {stage.avoidDo.map((item) => (
              <Bullet key={item} color="rose">
                {item}
              </Bullet>
            ))}
          </div>
        </Card>
      )}

      {showMedical && (
        <Card title="খাবার গাইডলাইন" badge="Nutrition">
          <div className="space-y-2 text-sm text-body-muted sm:text-[15px]">
            <p className="text-xs sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-500">
              কী খাওয়াবেন
            </p>
            <div className="space-y-1.5">
              {stage.shouldEat.map((item) => (
                <Bullet key={item} color="emerald">
                  {item}
                </Bullet>
              ))}
            </div>
            <p className="mt-3 text-xs sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-500">
              কী খাওয়াবেন না
            </p>
            <div className="space-y-1.5">
              {stage.avoidEat.map((item) => (
                <Bullet key={item} color="rose">
                  {item}
                </Bullet>
              ))}
            </div>
          </div>
        </Card>
      )}

      {showIslamic && (
        <Card
          title="ইসলামিক টিপস, দোয়া, সূরা ও হাদীস"
          badge="Spiritual"
          className="md:col-span-2"
        >
          <div className="space-y-4">
            <div className="space-y-1.5 text-base text-body-muted sm:text-[17px]">
              <p className="text-xs sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                এই বয়সে করণীয়
              </p>
              {stage.islamicFocus.map((item) => (
                <Bullet key={item} color="sky">
                  {item}
                </Bullet>
              ))}
            </div>

            {stage.duas.length > 0 && (
              <div className="space-y-2 rounded-2xl bg-emerald-50/80 p-3 shadow-inner border border-emerald-100">
                <p className="text-xs sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-600">
                  দোয়া
                </p>
                {stage.duas.map((dua) => (
                  <div
                    key={dua.title}
                    className="rounded-xl bg-white/90 p-2.5 shadow-sm border border-emerald-100"
                  >
                    <p className="text-[11px] font-semibold text-emerald-700">
                      {dua.title}
                    </p>
                    <p className="font-arabic mt-1 text-right text-lg font-semibold leading-loose text-emerald-900 sm:text-xl">
                      {dua.arabic}
                    </p>
                    {dua.banglaUccaron && (
                      <p className="mt-1 text-sm sm:text-base leading-relaxed text-emerald-700/90 italic">
                        উচ্চারণ: {dua.banglaUccaron}
                      </p>
                    )}
                    <p className="mt-1 text-base leading-relaxed text-body-muted sm:text-[17px]">
                      {dua.bangla}
                    </p>
                    {dua.reference && (
                      <p className="mt-0.5 text-[10px] sm:text-[11px] text-zinc-500">
                        উৎস: {dua.reference}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {stage.surahVerses.length > 0 && (
              <div className="space-y-2 rounded-2xl bg-sky-50/80 p-3 shadow-inner border border-sky-100">
                <p className="text-xs sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">
                  কুরআন (সূরা / আয়াত)
                </p>
                {stage.surahVerses.map((v, i) => (
                  <div
                    key={`${v.surahName}-${v.verseNumber}-${i}`}
                    className="rounded-xl bg-white/90 p-2.5 shadow-sm border border-sky-100"
                  >
                    <p className="text-xs sm:text-[11px] font-semibold text-sky-700">
                      {v.surahName}, আয়াত {v.verseNumber}
                    </p>
                    <p className="font-arabic mt-1 text-right text-lg font-semibold leading-loose text-body-primary sm:text-xl">
                      {v.arabic}
                    </p>
                    {v.banglaUccaron && (
                      <p className="mt-1 text-sm sm:text-base leading-relaxed text-sky-700/90 italic">
                        উচ্চারণ: {v.banglaUccaron}
                      </p>
                    )}
                    <p className="mt-1 text-base leading-relaxed text-body-muted sm:text-[17px]">
                      {v.bangla}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {stage.hadiths.length > 0 && (
              <div className="space-y-2 rounded-2xl bg-amber-50/80 p-3 shadow-inner border border-amber-100">
                <p className="text-xs sm:text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-700">
                  হাদীস
                </p>
                {stage.hadiths.map((h, i) => (
                  <div
                    key={`hadith-${i}`}
                    className="rounded-xl bg-white/90 p-2.5 shadow-sm border border-amber-100"
                  >
                    <p className="text-sm sm:text-base leading-relaxed text-zinc-700">
                      {h.bangla}
                    </p>
                    <p className="mt-1 text-[10px] text-amber-700 font-medium">
                      উৎস: {h.reference}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function MiniStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "sky" | "amber";
}) {
  const border =
    tone === "emerald"
      ? "border-emerald-100 bg-emerald-50/80"
      : tone === "sky"
      ? "border-sky-100 bg-sky-50/80"
      : "border-amber-100 bg-amber-50/80";

  const labelColor =
    tone === "emerald"
      ? "text-emerald-700"
      : tone === "sky"
      ? "text-sky-700"
      : "text-amber-700";

  return (
    <div
      className={`rounded-2xl border ${border} p-2.5 text-xs shadow-sm shadow-emerald-50 sm:text-[13px]`}
    >
      <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${labelColor}`}>
        {label}
      </p>
      <p className="mt-1 text-[11px] leading-snug text-zinc-700 line-clamp-3">{value}</p>
    </div>
  );
}

function ViewTabs({
  view,
  onChange,
}: {
  view: ViewTab;
  onChange: (value: ViewTab) => void;
}) {
  const items: { id: ViewTab; label: string; description: string }[] = [
    { id: "summary", label: "সারাংশ", description: "আজকের ওভারভিউ" },
    { id: "medical", label: "ডাক্তারি গাইড", description: "চেকলিস্ট + খাবার" },
    { id: "islamic", label: "ইসলামিক গাইড", description: "দোয়া + আমল" },
  ];
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-1 text-xs shadow-sm shadow-emerald-100">
      <div className="flex flex-wrap items-center justify-between gap-1">
        {items.map((item) => {
          const isActive = item.id === view;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex flex-1 min-w-[90px] items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 transition ${
                isActive
                  ? "bg-emerald-600 text-emerald-50 shadow-sm shadow-emerald-300/70"
                  : "bg-transparent text-emerald-800 hover:bg-emerald-50"
              }`}
            >
              <span className="font-medium">{item.label}</span>
              <span className="text-[10px] opacity-80">{item.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Card({
  title,
  badge,
  children,
  className = "",
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,118,110,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(15,118,110,0.14)] ${className}`}
    >
      <div className="pointer-events-none absolute -right-10 top-1 h-20 w-20 rounded-full bg-emerald-50 opacity-0 blur-2xl transition group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-emerald-900">{title}</h4>
        </div>
        {badge && (
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-600">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Bullet({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "emerald" | "rose" | "sky";
}) {
  const colorClass =
    color === "emerald"
      ? "bg-emerald-400"
      : color === "rose"
      ? "bg-rose-400"
      : "bg-sky-400";
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-[7px] h-1.5 w-1.5 rounded-full ${colorClass}`} />
      <span>{children}</span>
    </div>
  );
}

